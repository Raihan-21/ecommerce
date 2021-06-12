const Customer = require('../models/User')
const jwt = require('jsonwebtoken')
const Item = require('../models/Items')
const mongoose = require('mongoose');
const fs = require('fs')

const handleError = (err) => {
    if(err.message.includes('item validation failed')){
        let errors = {itemname: '', category: '',  price: '', quantity: ''}
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message
        })
        return errors
    }
    else{
        let errors = {email: '', fullname: '', password: '', address: {city: '', detail: ''}}
        //incorrect email login
        if(err.message === 'incorrect email'){
            errors.email = 'that email is not registered'
            return errors
        }
        if(err.message === 'incorrect password'){
            errors.password = 'the password is incorrect'
            return errors
        }
        //already registered email
        if(err.code === 11000){
            errors.email = 'the email has been registered'
            return errors
        }
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message
        })
        return errors
        }
    }
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({id}, 'raihan secret', { 
        expiresIn: maxAge
    })
}
const modifyQty = async (userid, itemid, inc, price) => {
    const takeItem = await Item.findOneAndUpdate({_id: itemid}, {$inc: {quantity: -inc}})
    const add = await Customer.findOneAndUpdate({_id: userid, "inventory._id": mongoose.Types.ObjectId(itemid)}, {$inc: { "inventory.$.quantity": inc, "inventory.$.totalprice": price}})
}
module.exports.signup_get = (req, res) => {
    res.render('signup')
}
module.exports.signup_post = async (req, res) => {
    const { email,fullname, password, address} = req.body
    try{
        const user = await Customer.create({email,fullname, password, address})
        const token = createToken(user._id)
        // res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000})
        res.status(201).json({user: user._id})
    }
    catch(err){
        let errors = handleError(err)
        res.status(400).json({errors})
    }
}
module.exports.login_get = (req, res) => {
    res.render('login')
}
module.exports.login_post = async (req, res) => {
    const { email, password} = req.body
    try{
        const user = await Customer.login(email, password)
        const token = createToken(user._id)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000})
        res.status(200).json({user: user._id})
    }
    catch(err){
        const errors = handleError(err)
        res.status(400).json({errors})
    }
}

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', {maxAge: 1})
    res.redirect('/')
}
module.exports.catalogue = async (req, res) => {
    const items = await Item.find({})
    const category = null
    res.render('catalogue', {items, category})
}
module.exports.category = async (req, res) => {
    const category = req.params.category
    const items = await Item.find({category })
    res.render('catalogue', {items, category})
}

module.exports.search_get = async (req, res) => {
    const itemname = req.query.itemname
    const items = await Item.find({itemname: new RegExp(itemname)})
    res.render('catalogue', {items,category: null})
}
module.exports.add_get = (req, res) => {
    res.render('inputitem')
}
module.exports.add_post = async (req, res) => {
    const {itemname, category, price,desc, quantity} = req.body
    const file = req.file
    const img = fs.readFileSync(file.path)
    const encodedImg = img.toString('base64')
    const image = {
        filename: file.originalname,
        contentType: file.mimetype,
        imgBase64: encodedImg
    }
    try{
        const item = await Item.create({itemname,image, category, price, desc, quantity})
        res.status(200).json({item: item._id})
    }
    catch(err){
        let errors = handleError(err)
        res.status(400).json({errors})
    }
}

module.exports.item_get = async (req, res) => {
    const item = await Item.findOne({_id: req.params.itemid})
    res.render('itemDesc', {item})
}

module.exports.addCart = async (req, res) => {
    const {qty, itemid} = req.body
    const user = req.user
    const item = req.item
    const takeItem = await Item.findOneAndUpdate({_id: item._id}, {$inc: {quantity: -qty}})
    const add = await Customer.findOneAndUpdate({_id: user._id}, {$push: { inventory: {
        _id: takeItem._id,
        itemname: takeItem.itemname,
        image: {
            imgBase64: takeItem.image.imgBase64,
            contentType: takeItem.image.contentType
        },
        price: takeItem.price,
        quantity: qty,
        totalprice: takeItem.price * qty
    }}})
    console.log(add.inventory)
    
    res.json({sukses: 'sukses ea'})
}

module.exports.cart = (req, res) => {
    const user = req.user
    if(user.inventory.length !== 0){
        const total = user.inventory.reduce((curr, acc) => {
            return {quantity: curr.quantity + acc.quantity, totalprice: curr.totalprice + acc.totalprice}
            
        })
        res.render('cart', {user,category: null, total})
    }
    else{
        res.render('cart', {user,category: null, total: null})
    }
    
    
}
module.exports.modifyCart = async (req, res) => {
    let {itemid, modType, qty} = req.body
    let itemprice = req.item.price
    const user = req.user
    let inc = 1
    if(modType == 'incre'){
        modifyQty(user._id, itemid, inc, itemprice)
    }
    else{
        modifyQty(user._id, itemid, -inc, -itemprice)
    }
    res.json({price: itemprice})
}
module.exports.removeItem = async (req, res) => {
    const user = req.user
    const { itemid, qty } = req.body
    const storeItem = await Item.findOneAndUpdate({_id: itemid}, {$inc: {quantity: qty}})
    const remove = await Customer.findByIdAndUpdate(user._id, { $pull: {inventory: {_id: mongoose.Types.ObjectId(itemid)}}})
    res.json({status: 'item dihapus'})
}

module.exports.getUpdatedCart = (req, res) => {
    const user = req.user
    res.json({user})
}

module.exports.checkout_get = async (req, res) => {
    res.render('checkout')
}
module.exports.checkout = async (req, res) => {
    const user = req.user
    const {kota, alamat} = req.body
    const total = user.inventory.reduce((curr, acc) => {
        return {totalprice: curr.totalprice + acc.totalprice}}, {totalprice: 0})
    // const total = user.inventory.reduce((curr, acc) => {
    //     return curr.totalprice + acc.totalprice, 0
        
    // })
    const clear = await Customer.findByIdAndUpdate(user._id, { $set: {inventory: []}, $push: {orders: {
        kota: kota,
        alamat: alamat,
        item: user.inventory.map(item => {
            return {
                _id: item._id,
                itemname: item.itemname,
                price: item.price,
                quantity: item.quantity,
                totalprice: item.totalprice
            }

        }),
        total: total.totalprice
    }}})
    res.json({status: 'sukses'})
}
module.exports.purchase = async (req, res) => {
    res.render('purchase')
}