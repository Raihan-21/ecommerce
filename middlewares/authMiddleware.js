const jwt = require('jsonwebtoken')
const Customer = require('../models/User')
const Item = require('../models/Items')
const multer = require('multer')

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
                req.user = user
                if(user.inventory.length !== 0){
                    const total = user.inventory.reduce((curr, acc) => {
                        return {quantity: curr.quantity + acc.quantity, totalprice: curr.totalprice + acc.totalprice}
                        
                    })
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
module.exports ={verifyAuth, checkUser, checkStock, upload}