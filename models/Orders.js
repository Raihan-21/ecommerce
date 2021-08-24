const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    kota: {
        type: String,
        required: true
    },
    kecamatan: {
        type: String,
        required: true
    },
    kelurahan: {
        type: String,
        required: true
    },
    detailalamat: {
        type: String,
        required: true
    },
    item: [Object], 
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    bukti: {
        filename: {
            type: String
        },
        contentType: {
            type: String
        },
        imgBase64: {
            type: String
        }
    }
})

const Order = mongoose.model('order', orderSchema)
module.exports = Order