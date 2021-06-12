const mongoose = require('mongoose')
const itemSchema = new mongoose.Schema({
    itemname: {
        type: String,
        required: [true, 'please enter the product name']
    },
    image: {
        filename: String,
        contentType: String,
        imgBase64: String
    },
    category: {
        type: String,
        required: [true, 'please enter the category']
    },
    price: {
        type: Number,
        required: [true, 'please enter the price']
    },
    desc: {
        type: String
    },
    quantity: {
        type: Number,
        required: [true, 'please enter the quantity']
    }
})


itemSchema.statics.modifyCart = async function(itemAdd, qty){
    const item = await this.findOne({_id: itemAdd})
    if(item.quantity >= qty){
        const takeItem = await this.findOneAndUpdate({_id: item._id}, {$inc: {quantity: -1}})
        return item
    }
    throw Error('Stok tidak memenuhi keinginan')
}
const Item =  mongoose.model('item', itemSchema)
module.exports = Item