const express = require('express')
//const userMulter = require('../config/userMulter')
const userController = require('../controllers/userController')
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/authAdmin')

const user_route = express()
//const upload = userMulter.userMulter()

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.get('/signup',auth.loginSession,userController.userSignup)

user_route.post('/signup',auth.loginSession,userController.insertUser)

user_route.get('/login',auth.loginSession,userController.loginUser)

user_route.post('/login',auth.loginSession,userController.verifyLogin)

user_route.get('/',userController.loadHome)

user_route.get('/logout',auth.logOutSession,userController.logOut)

user_route.get('/logoutIn',adminAuth.logOutSession,userController.logOutIn)

user_route.get('/otp-login',auth.loginSession,userController.otpLogin)

// user_route.get('/otp-login-signup',auth.loginSession,userController.otpSignup)

user_route.get('/otp-page-signup',auth.loginSession,userController.otpSignSubmit)

user_route.post('/otpVerifyMail',auth.loginSession,userController.verifyotpMail)

user_route.post('/otpSubmitMail',auth.loginSession,userController.otpVerifySignup)

user_route.get('/email_verified',auth.logOutSession,userController.emailVerified)

user_route.get('/otp-page',auth.loginSession,userController.otppage)

user_route.get('/otpSubmit',auth.loginSession,userController.otpVerify)

user_route.post('/otpSubmit',auth.loginSession,userController.otpVerify)

user_route.get('/singleProduct',auth.logOutSession,userController.productDetails)

user_route.get('/shopPage',userController.loadShopPage)

// user_route.post('/shopFilter',userController.productFilter)


module.exports = user_route