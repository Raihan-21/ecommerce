const Customer = require('../models/User')
const jwt = require('jsonwebtoken')
const Item = require('../models/Items')
const Order = require('../models/Orders')
const Cart = require('../models/Carts')
const mongoose = require('mongoose');
const nodemailer = require('nodemailer')
const fs = require('fs');
const { ObjectId } = require('mongoose');
const { findOne } = require('../models/User')

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
const adminToken = (id) => {
    return jwt.sign({id}, 'admin secret', { 
        expiresIn: maxAge
    })
}
const modifyQty = async (userid, itemid, inc, price) => {
    const takeItem = await Item.findOneAndUpdate({_id: itemid}, {$inc: {quantity: -inc}})
    const add = await Cart.findOneAndUpdate({userid, "items._id": mongoose.Types.ObjectId(itemid)}, {$inc: { "items.$.quantity": inc, "items.$.totalprice": price, totalquantity: inc, totalprice: price}})
}
const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
        user: "jackrabbid45@gmail.com",
        pass: "gohangoku"
    }
});
module.exports.signup_get = (req, res) => {
    res.render('signup')
}
module.exports.signup_post = async (req, res) => {
    const { email,fullname, password, address} = req.body
    try{
        const user = await Customer.create({email,fullname, password, address})
        const token = createToken(user._id)
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
module.exports.adminlogin = (req, res) => {
    res.render('adminlogin')
}
module.exports.adminlogin_post = (req, res) => {
    const { email, password} = req.body
    const token = adminToken(password)
    const adminEmail = "test@gmail.com"
    const adminPassword = "innorainecake"
    const errors = {email: '', password: ''}
    if(email == adminEmail && password == adminPassword){
        res.cookie('admin', token, { httpOnly: true, maxAge: maxAge * 1000})
        res.status(200).json({sukses: 'sukses'})
    }
    else{
        if(email !== adminEmail){
            errors.email = 'Email salah'
        }
        if(password !== adminPassword ){
            errors.password = 'Password salah'
        }
        res.status(400).json({errors})
    }
    
}

module.exports.adminuser = async (req, res) => {
    let users = await Customer.find({})
    users = users.sort((a,b) => a.email.localeCompare(b.email, 'en', {sensitivity: 'base'}))
    res.render('adminuser', {users})
}
module.exports.adminitem = async (req, res) => {
    let items = await Item.find({})
    items = items.sort((a,b) => a.itemname.localeCompare(b.itemname, 'en', {sensitivity: 'base'}))
    res.render('adminitem', {items})
}
module.exports.adminorder = async (req, res) => {
    const orders = await Order.find({})
    res.render('adminorder', {orders})
}
module.exports.adminitemdesc = async (req, res) => {
    const item = await Item.findOne({_id: req.params.itemid})
    res.render('adminitemdesc', {item})
}
module.exports.adminuserdesc = async (req, res) => {
    const url = req.originalUrl
    const userinfo = await Customer.findOne({_id: req.params.userid})
    const userorders = await Order.find({userid: req.params.userid})
    res.render('adminuserdesc', {userinfo, userorders, total: null, url})
}
module.exports.updateuser = async (req, res) => {
    const {userid, fullname, email, city,kecamatan, kelurahan, address} = req.body
    const updateInfo = await Customer.findOneAndUpdate({_id: userid}, {$set: {email, fullname, "address.city": city,"address.kecamatan": kecamatan,"address.kelurahan": kelurahan, "address.detail": address}})
    res.json({sukses: 'hadeh'})
}
module.exports.deleteuser = async (req, res) => {
    const {userid} = req.body
    const updateInfo = await Customer.deleteOne({_id: userid})
    res.json({sukses: 'hadeh'})
}
module.exports.updatestatus = async (req, res) => {
    const {userid, purchaseid, paystatus} = req.body
    // const updatePay = await Customer.findOneAndUpdate({_id: userid, "orders._id": mongoose.Types.ObjectId(purchaseid)}, {$set: { "orders.$.status": paystatus}})
    const updateOrder = await Order.findOneAndUpdate({_id: purchaseid}, {$set : {status: paystatus}})
    res.json({sukses: 'hadeh'})
}
module.exports.deleteorder = async (req, res) => {
    const {userid, purchaseid} = req.body
    const orders = await Order.findOne({_id: purchaseid})
    const items = orders.item.map(async order => {
        const updateitem = await Item.findOneAndUpdate({_id: order._id}, {$inc : {quantity: order.quantity}})
    })
    const deleteOrder = await Order.deleteOne({_id: purchaseid})
    res.json({sukses: 'hadeh'})
}
module.exports.updateitem = async (req, res) => {
    const {itemid, itemname, category, price,desc, quantity} = req.body
    const item = await Item.findOneAndUpdate({_id: itemid}, {itemname, category, price, desc, quantity})
    res.status(200).json({item: item._id})
}
module.exports.updateitemimg = async (req, res) => {
    const {itemid} = req.body
    const file = req.file
    const img = fs.readFileSync(file.path)
    const encodedImg = img.toString('base64')
    console.log(itemid)
    const image = {
        filename: file.originalname,
        contentType: file.mimetype,
        imgBase64: encodedImg
    }
    const item = await Item.findOneAndUpdate({_id: itemid}, {image})
    res.status(200).json({item: item._id})


}
module.exports.deleteitem = async (req, res) => {
    const {itemid} = req.body
    const deleteitem = await Item.deleteOne({_id: itemid})
    console.log(deleteitem)
    res.json({sukses: deleteitem})
}
module.exports.admin_logout = (req, res) => {
    res.cookie('admin', '', {maxAge: 1})
    res.redirect('/admin/login')
}
module.exports.catalogue = async (req, res) => {
    const itemname = req.query.itemname
    const category = req.query.category
    if(category == 'all'){
        const items = await Item.find({itemname: new RegExp(itemname, 'i')})
        res.render('catalogue', {items, category})
    }
    else if(category == 'Cake' || category == 'Frozen Food'){
        const items = await Item.find({itemname: new RegExp(itemname, 'i'), category})
        res.render('catalogue', {items, category})
    }
    else{
        const items = await Item.find({itemname: new RegExp(itemname, 'i')})
        res.render('catalogue', {items, category})
    }
}
// module.exports.category = async (req, res) => {
//     const category = req.params.category
//     const items = await Item.find({category })
//     res.render('catalogue', {items, category})
// }

// module.exports.search_get = async (req, res) => {
//     const itemname = req.query.itemname
//     const items = await Item.find({itemname: new RegExp(itemname, 'i')})
//     res.render('catalogue', {items,category: null})
// }
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
    const totalprice = takeItem.price * qty
    const cartItem = {
        _id: takeItem._id,
        itemname: takeItem.itemname,
        image: {
            imgBase64: takeItem.image.imgBase64,
            contentType: takeItem.image.contentType
        },
        price: takeItem.price,
        quantity: qty,
        totalprice: totalprice
    }
    const addItem = await Cart.updateOne({userid: user._id}, {$push: {items: cartItem}, $inc: {totalprice, totalquantity: qty}}, {upsert: true})
    // const additem = await Cart.create({userid: user._id, items: cartItem})
    // const add = await Customer.findOneAndUpdate({_id: user._id}, {$push: { inventory: {
    //     _id: takeItem._id,
    //     itemname: takeItem.itemname,
    //     image: {
    //         imgBase64: takeItem.image.imgBase64,
    //         contentType: takeItem.image.contentType
    //     },
    //     price: takeItem.price,
    //     quantity: qty,
    //     totalprice: takeItem.price * qty
    // }}})
    
    res.json({sukses: 'Barang dimasukkan dalam keranjang'})
}
module.exports.profile = (req, res) => {
    const url = req.originalUrl
    res.render('profile', {url})
}
module.exports.profile_update = async (req, res) => {
    const {fullname, email, city,kecamatan, kelurahan, address} = req.body
    const user = req.user
    const updateInfo = await Customer.findOneAndUpdate({_id: user._id}, {$set: {email, fullname, "address.city": city,"address.kecamatan": kecamatan,"address.kelurahan": kelurahan, "address.detail": address}})

    res.json({sukses: 'hadeh'})
}
module.exports.cart = async (req, res) => {
    const user = req.user
    const cart = req.cart
    // if(cart.items.length !== 0){
    //     const total = req.total
    //     // const total = cart.items.reduce((curr, acc) => {
    //     //     return {quantity: curr.quantity + acc.quantity, totalprice: curr.totalprice + acc.totalprice}
    //     // })
    //     res.render('cart', {cart,category: null, total})
    // }
    // else{
    //     res.render('cart', {cart,category: null, total: null})
    // }
    res.render('cart', {cart,category: null})
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
    const item = await Cart.findOne({userid: user._id}, {items: {$elemMatch: { _id: mongoose.Types.ObjectId(itemid)}}} )
    const storeItem = await Item.findOneAndUpdate({_id: itemid}, {$inc: {quantity: qty}})
    const remove = await Cart.findOneAndUpdate({userid: user._id}, { $pull: {items: {_id: mongoose.Types.ObjectId(itemid)}}, $inc: {totalquantity: -item.items[0].quantity, totalprice: -item.items[0].totalprice}})
    res.json({status: 'item dihapus'})
}

module.exports.getUpdatedCart = (req, res) => {
    const user = req.user
    res.json({user})
}

module.exports.checkout_get = async (req, res) => {
    const cart = req.cart
    res.render('checkout', {cart})
}
module.exports.checkout = async (req, res) => {
    const user = req.user
    const cart = req.cart
    // const total = req.total
    const {date,nama, kota, kecamatan, kelurahan, alamat} = req.body
    // const total = cart.items.reduce((curr, acc) => {
    //     return {totalprice: curr.totalprice + acc.totalprice}}, {totalprice: 0})
        const item = cart.items.map(item => {
                    return {
                        _id: item._id,
                        itemname: item.itemname,
                        price: item.price,
                        quantity: item.quantity,
                        totalprice: item.totalprice
                    }});
    // const receipt = {
    //     _id: mongoose.Types.ObjectId(),
    //     date: date,
    //     kota: kota,
    //     kecamatan: kecamatan,
    //     kelurahan: kelurahan,
    //     alamat: alamat,
    //     item: user.inventory.map(item => {
    //         return {
    //             _id: item._id,
    //             itemname: item.itemname,
    //             price: item.price,
    //             quantity: item.quantity,
    //             totalprice: item.totalprice
    //         }
    //     }),
    //     total: total.totalprice,
    //     status: "belum dibayar"
    // }
    // const checkout = await Customer.findByIdAndUpdate(user._id, { $set: {inventory: []}, $push: {orders: 
    //     receipt
    // }})
    const checkout = await Cart.findOneAndUpdate({userid: user._id}, {$set: {items: [], totalquantity: 0, totalprice: 0}})
    const order = await Order.create({date,userid: user._id, receiver: nama, kota, kecamatan, kelurahan, detailalamat: alamat, item,total: cart.totalprice, status: "Belum Dibayar"})
    const adminOptions = {
        from    : "jackrabbid45@gmail.com",
        to      : "muhammadraihan118@gmail.com",
        subject : "Notifikasi Pembelian",
        html    : ` <h1>Ada pembelian berupa : </h1>
                    <div>ID   : ${user._id}</div>
                    <div>Penerima   : ${nama}</div>
                    <div>Kota    : ${kota}</div>
                    <div>Kota    : ${kota}</div>
                    <div>Alamat  : ${alamat}</div>
                    <div>Item    : ${cart.items.map(item => {
                        return `
                        <div>${item.itemname} x ${item.quantity}  : ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)} </div>
                        `

                        })}</div>
                    <div>Total   : ${cart.totalprice}</div> `
    }
    const clientOptions = {
        from    : "jackrabbid45@gmail.com",
        to      : user.email,
        subject : "Notifikasi Pembelian",
        html    : `<h2>Anda baru saja melakukan pembelian dengan detail : </h2>
                    <div>Kota    : ${kota}</div>
                    <div>Alamat  : ${alamat}</div>
                    <div>Item    : ${cart.items.map(item => {
                        return `
                        <div>${item.itemname} x ${item.quantity}  : ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)} </div>
                        `
                        })}</div>
                    <div>Total   : ${cart.totalprice}</div>
                    <h1> Harap dibayar dalam kurun waktu 3 hari</h1> 
                    <h3> kirimkan bukti pembayaran melalui email ini </h3>
        `
    }
    transporter.sendMail(adminOptions, function(err, info){
        if(err){
            console.log(err)
            return;
        }
        else{
            console.log(info.response)
        }
    });
    transporter.sendMail(clientOptions, function(err, info){
        if(err){
            console.log(err)
            return;
        }
        else{
            console.log(info.response)
        }
    })
    res.json({order: order._id})
}

module.exports.purchase = async (req, res) => {
    const user = req.user
    const orders = await Order.find({userid: user._id})
    res.render('purchase', {orders})
}
module.exports.purchasedesc = async (req, res) => {
    const user = req.user
    // const purchase = await Customer.findOne({_id: user._id}, {orders: {$elemMatch: {_id: mongoose.Types.ObjectId(req.params.purchaseid)}}} )
    const order = await Order.findOne({_id: req.params.purchaseid})
    res.render('purchasedesc', {order})
}
module.exports.uploadtransfer = async (req, res) => {
    const { purchaseid } = req.body
    const user = req.user
    const file = req.file
    const img = fs.readFileSync(file.path)
    const encodedImg = img.toString('base64')
    const image = {
        filename: file.originalname,
        contentType: file.mimetype,
        imgBase64: encodedImg
    }
    // const upload = await Customer.findOneAndUpdate({_id: user._id, "orders._id": mongoose.Types.ObjectId(purchaseid)}, {$set: {"orders.$.image": image}} )
    const upload = await Order.findOneAndUpdate({_id: purchaseid}, {$set: {bukti: image}})
}
module.exports.contact = async (req, res) => {
    res.render('contact')
}
module.exports.contact_post = async (req, res) => {
    const {name, email, nomor, details} = req.body;
    const contactOptions = {
        from: "jackrabbid45@gmail.com",
        to: "muhammadraihan118@gmail.com",
        subject: "Ada keluhan dengan detail",
        html: `
                <div>Nama: ${name} </div>
                <div>Email: ${email} </div>
                <div>Nomor Handphone: ${nomor}</div>
                <div>Detail: ${details}</div>
                `
    }
    transporter.sendMail(contactOptions, function(err, info){
        if(err)[
            console.log(err)
        ]
        else{
            console.log(info.response)
        }
    })
    res.json({status: "Your form has been submitted!"})

}