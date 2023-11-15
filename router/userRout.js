const express = require('express')
//const userMulter = require('../config/userMulter')
const userController = require('../controllers/userController')
const cartController=require('../controllers/cartController')
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/authAdmin')
const userBlock=require('../middleware/userBlock')

const user_route = express()
//const upload = userMulter.userMulter()

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.get('/signup',auth.loginSession,userController.userSignup)

user_route.post('/signup',auth.loginSession,userController.insertUser)

user_route.get('/login',auth.loginSession,userController.loginUser)

user_route.post('/login',auth.loginSession,userController.verifyLogin)

user_route.get('/',cartController.loadHome)

user_route.get('/logout',auth.logOutSession,userController.logOut)

user_route.get('/logoutIn',adminAuth.logOutSession,userBlock.logOutInMiddleware)

user_route.get('/otp-login',auth.loginSession,userController.otpLogin)

// user_route.get('/otp-login-signup',auth.loginSession,userController.otpSignup)

user_route.get('/otp-page-signup',auth.loginSession,userController.otpSignSubmit)

user_route.post('/otpVerifyMail',auth.loginSession,userController.verifyotpMail)

user_route.post('/otpSubmitMail',auth.loginSession,userController.otpVerifySignup)

user_route.get('/email_verified',auth.logOutSession,userController.emailVerified)

user_route.get('/otp-page',auth.loginSession,userController.otppage)

user_route.get('/otpSubmit',auth.loginSession,userController.otpVerify)

user_route.post('/otpSubmit',auth.loginSession,userController.otpVerify)

user_route.get('/forgot',auth.loginSession,userController.forgot)

user_route.post('/forgot',auth.loginSession,userController.resetPassword)

user_route.get('/resetpass',auth.loginSession,userController.newPassword)

user_route.post('/resetpass',auth.loginSession,userController.addNewPassword)

user_route.get('/singleProduct',auth.logOutSession,cartController.productDetails)

user_route.get('/shopPage',cartController.loadShopPage)



user_route.get('/cart',auth.logOutSession,cartController.loadCart)

user_route.get('/addToCart',auth.logOutSession,cartController.addToCart)

user_route.get('/incrementcart',auth.logOutSession,cartController.incrementCart)

user_route.get('/decrementcart',auth.logOutSession,cartController.decrementCart)

user_route.get('/removeCart',auth.logOutSession,cartController.removeCart)


user_route.get('/wishlist',auth.logOutSession,cartController.loadWishList)

user_route.get('/addToWishlist',auth.logOutSession,cartController.addToWishlist)

user_route.get('/removeWishlist',auth.logOutSession,cartController.removeWishlist)

// user_route.post('/shopFilter',userController.productFilter)


module.exports = user_route