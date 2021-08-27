const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    userid: {
        type: String
    },
    items : [Object],
    totalquantity: {
        type: Number
    },
    totalprice: {
        type: Number
    }
})
const Cart = mongoose.model('cart', cartSchema)
module.exports = Cart