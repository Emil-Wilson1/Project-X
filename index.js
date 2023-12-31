const morgan = require('morgan')
const userRout = require('./router/userRout')
const adminRout = require('./router/adminRout')
const bodyParser = require('body-parser')
const session = require('express-session')
const nocache = require('nocache')
const path = require('path')
const config = require('./config/config')
require('dotenv').config();

config.mongooseConnection()

const express = require('express')

const app = express()
app.use(morgan("dev"));
app.use(nocache())
app.set('view engine','ejs')
app.set('views','./views/users')

app.use(session({ secret:process.env.KEY , cookie: { maxAge: 60000 * 100 }, saveUninitialized: true, resave: true }))

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit:'10mb'}))
app.use(bodyParser.urlencoded({ extended: true ,limit:'10mb'}))
app.use('/', userRout)
app.use('/admin', adminRout)

app.use((err,req,res,next)=>{
    res.status(err.status||500)
    res.render('error',{err})
    console.log(err)
})

app.use((req,res,next)=>{
    res.status(500)
    res.render('error')
})

app.listen(3000, () => {
    console.log('server running');
})
