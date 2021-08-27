const jwt = require('jsonwebtoken')
const Customer = require('../models/User')
const Item = require('../models/Items')
const Cart = require('../models/Carts')
const multer = require('multer')
const { cart } = require('../controllers/authController')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploads')
    },
    filename: function(req, file, cb){
        const ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        cb(null, file.fieldname + '-' + Date.now() + ext)
    }
})
const upload = multer({storage: storage})
const verifyAuth = (req, res, next) => {
    const token = req.cookies.jwt
    if(token){
        jwt.verify(token, 'raihan secret', (err, decodedToken) => {
            if(err){
                res.redirect('/login')
            }
            else{
                console.log(decodedToken)
                next()
            }
        })
    }
    else{
        res.redirect('/login')
    }

}

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt
    if(token){
        jwt.verify(token, 'raihan secret', async (err, decodedToken) => {
            if(err){
                res.locals.user = null;
                next()
            }
            else{
                const user = await Customer.findById(decodedToken.id)
                const cart = await Cart.findOne({userid: user._id})
                req.user = user
                req.cart = cart
                if(cart.items.length !== 0){
                    const total = cart.totalquantity
                    res.locals.total = total
                }
                else{
                    res.locals.total = null
                }
                res.locals.user = user
                
                next()
            }
        })
    }
    else{
        res.locals.user = null;
        next()
    }
}
const checkStock = async (req, res, next) => {
    const {qty, itemid} = req.body
    if(req.method == 'DELETE' || req.method == 'GET'){
        next()
    }
    else{
        const item = await Item.findOne({_id: itemid})
        if(req.method == 'POST'){
            if(item.quantity >= qty){
                req.item = item
                next()
            }
            else{
                res.json({errors: {
                    stock: 'stok tidak memenuhi keinginan'
                }})
            }
        }
        else{
            if(item.quantity !== 0){
                req.item = item
                next()
            }
            else{
                res.json({errors: {
                    stock: 'stok tidak memenuhi keinginan'
                }})
            }
        }
    }
}
const verifyAdmin = (req, res, next) => {
    const tokenAdmin = req.cookies.admin
    if(tokenAdmin){
        jwt.verify(tokenAdmin, 'admin secret', (err, decodedToken) => {
            if(err){
                res.redirect('/admin/login')
            }
            else{
                next()
            }
        })
    }
    else{
        res.redirect('/admin/login')
    }
}
module.exports ={verifyAuth, checkUser, verifyAdmin, checkStock, upload}