const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const {isEmail} = require('validator')
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'please enter a valid email']
    },
    fullname:{
        type: String,
        required: [true, 'please enter your full name']
    },
    password:{
        type: String,
        required: [true, 'please enter a password'],
        minlength: [6, 'the minimum length is 6']
    },
    address:{
        city: {
            type: String,
            required: [true, 'please enter your city address']
        },
        kecamatan: {
            type: String,
            required: [true, 'please enter your kecamatan address']
        },
        kelurahan: {
            type: String,
            required: [true, 'please enter your kelurahan address']
        },
        detail: {
            type: String,
            required: [true, 'please enter your address']
        }
    },
    inventory: [Object],
    orders: [Object]
})

//hashing password
userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

//authentication account login
userSchema.statics.login = async function(email, password) {
    const user = await this.findOne({email /*tidak ditulis email: email karena properti dan variabelnya untuk nilai sama */})
    if (user){
        const auth = await bcrypt.compare(password, user.password)
        if(auth){
            return user;
        }
        throw Error('incorrect password')
    }
    throw Error('incorrect email')
}


const Customer = mongoose.model('customer', userSchema)
module.exports = Customer