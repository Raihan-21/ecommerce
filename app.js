const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes')
const cookieParser = require('cookie-parser')
const {verifyAuth, checkUser} = require('./middlewares/authMiddleware')
const app = express();


// middleware
app.use(express.static('public'));
app.use(cookieParser())
// view engine
app.set('view engine', 'ejs');

// database connection
// password iKeEZyWrdCzvu8UY
const dbURI = 'mongodb+srv://raihan:iKeEZyWrdCzvu8UY@cluster0.dyuhm.mongodb.net/JWT?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true, useFindAndModify: false })
  .then((result) => {
    console.log('connected')
    app.listen(process.env.PORT || 3000)})
  .catch((err) => console.log(err));

// app.use('/admin', adminRouter)
app.use(express.json())
app.use(express.urlencoded({extended: false}))

// routes
// app.get('*', checkUser)
app.use(checkUser)
app.get('/', (req, res) => res.render('home'));
app.use(authRoutes)