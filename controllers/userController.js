const User = require('../models/userModel')
const productSchema = require('../models/productModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const categoryModel = require('../models/categoryModel')
const cartSchema=require('../models/cartModel')
const randomString = require('randomstring')
const { reset } = require('nodemon')
require('dotenv').config();


const regex_password = /^(?=.*?[A-Z])(?=.*[a-z])(?=.*[0-9]){8,16}/gm
const regex_otp = /^(?=.*[0-9])/gm
const regex_mobile = /^\d{10}$/

let message
let msg

let otpCheckMail
//////////SECURE PASSWORD////////////

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}


const otpSignSubmit = async (req, res, next) => {
    try {
        res.render('otp-page-signup', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}



// const otpVerifySignup = async (req, res, next) => {
//     try {
//         if (req.body.otp.trim().length == 0) {
//             res.redirect('/otp-page-signup')
//             msg = 'Please Enter OTP'
//         } else {
//             const OTP = req.body.otp
//             if (regex_otp.test(OTP) == false) {
//                 res.redirect('/otp-page-signup')
//                 msg = 'Only numbers allowed'
//             } else if (otp == OTP) {
//                 await User.updateOne({ email: otpCheckMail }, { $set: { is_verified: 1 } })
//                 res.render('email_verified')
//             } else {
//                 res.redirect('/otp-page-signup')
//                 msg = 'OTP is incorrect'
//             }
//         }
//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }

const otpVerifySignup = async (req, res, next) => {
    try {
        if (req.body.otp.trim().length == 0) {
            res.redirect('/otp-page-signup')
            msg = 'Please Enter OTP'
        } else {
            const OTP = req.body.otp
            if (regex_otp.test(OTP) == false) {
                res.redirect('/otp-page-signup')
                msg = 'Only numbers allowed'
            } else if (otp == OTP) {
                await User.updateOne({ email: otpCheckMail }, { $set: { is_verified: 1 } })

                // OTP is correct, clear the previous OTP and reset the timer
                otp = ''; // Assuming `otp` is a global variable storing the OTP
                timerOn = false; // Stop the timer

                res.render('email_verified')
            } else {
                res.redirect('/otp-page-signup')
                msg = 'OTP is incorrect'
            }
        }
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


const emailVerified = async (req, res, next) => {
    try {
        res.render('email_verified', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}
/////////USER SUIGNUP//////////

const userSignup = async (req, res, next) => {
    try {
        res.render('signup', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


///////INSERT USERDATA//////////

const insertUser = async (req, res, next) => {
    const usd = req.body
    let user
    const checkMail = await User.findOne({ email: usd.email })
    const checkMob = await User.findOne({ phone: usd.phone })
    otpCheckMail = req.body.email;

    try {
        if (!usd.email && !usd.phone && !usd.password && !usd.username) {
            res.redirect('/signup')
            msg = 'Fill all the fields'
        } else if (!usd.username || usd.username.trim().length < 3) {
            res.redirect('/signup')
            msg = 'Enter valid name'
        } else if (!usd.email || usd.username.trim().length == 0) {
            res.redirect('/signup')
            msg = 'Enter email'
        } else if (checkMail) {
            res.redirect('/signup')
            msg = 'Email already exist'
        } else if (!usd.phone) {
            res.redirect('/signup')
            msg = 'Enter mobile number'
        } else if (regex_mobile.test(usd.phone) == false) {
            res.redirect('/signup')
            msg = 'Enter valid mobile no'
        } else if (checkMob) {
            res.redirect('/signup')
            msg = 'Phone number already exist'
        } else if (!usd.password) {
            res.redirect('/signup')
            msg = 'Enter password'
        } else if (regex_password.test(usd.password) == false) {
            res.redirect('/signup')
            msg = 'Use strong password'
        } else if (usd.password != usd.Rpassword) {
            res.redirect('/signup')
            msg = "Password not match"
        }
        else {
            const paswwordSec = await securePassword(usd.password)
            user = new User({
                username: usd.username,
                email: usd.email,
                phone: usd.phone,
                password: paswwordSec,
                is_admin: 0
            })
        }

        const userData = await user.save()

        if (userData) {

            res.redirect('/otp-page-signup');
            message = 'Please Check Your Mail !'
            const mailtransport = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'emilwilson67@gmail.com',
                    pass: process.env.EMAILPASS,
                },
            });

            otp = otpgen();
            let details = {
                from: "emilwilson67@gmail.com",
                to: otpCheckMail,
                subject: "FINITO Fashion Club",
                text: otp + " is your Finito Fashion Club verification code. Do not share OTP with anyone "
            };

            mailtransport.sendMail(details, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("success");
                }
            });


        } else {
            res.redirect('/signup')
            msg = 'Registration failed'
        }

    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

////////LOGIN USER///////

const loginUser = async (req, res, next) => {

    try {
        res.render('login', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

//////////LOGIN VERIFICATION///////////

const verifyLogin = async (req, res, next) => {
    try {
        if (req.body.email.trim().length == 0 || req.body.password.trim().length == 0) {
            res.redirect('/login')
            msg = 'Fill all the fields'
        } else {
            console.log('login server ')
            const email = req.body.email
            const password = req.body.password
            const userData = await User.findOne({ email: email })
            if (userData) {
                console.log('User data exist')
                const passwordHash = await bcrypt.compare(password, userData.password)
                if (passwordHash) {
                    if (userData.is_verified == 1) {
                        if (userData.is_blocked == 0) {
                            console.log('Login success')
                            req.session.user_id = userData._id;
                            res.redirect('/')
                        } else {
                            res.redirect('/login')
                            msg = 'Your account has been blocked'
                        }
                    } else {
                        res.redirect('/login')
                        msg = 'Mail is not verified'
                    }
                } else {
                    res.redirect('/login')
                    msg = 'password is incorrect'
                }
            } else {
                res.redirect('/login')
                msg = 'User not found'
            }
        }

    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

// ///////LOADING HOME PAGE////////

// const loadHome = async (req, res, next) => {
//     try {
//         let session = req.session.user_id
//         const products = await productSchema.find({ is_show: true }).sort({ _id: -1 }).limit(4)

//         res.render('home', { product: products, session, msg, message })
//         msg = null,
//             message = null
//     } catch (err) {
//         console.log(err);
//         next(err.message)
//     }
// }

// //////////////////LOAD PRODUCT DETAILS PAGE//////////////

// const productDetails = async (req, res, next) => {
//     try {
//         const id = req.query.id
//         const session = req.session.user_id
//         const product = await productSchema.findOne({ _id: new Object(id) })
//         res.render('singleProduct', { product: product, session, message, msg })
//         msg = null,
//             message = null
//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }
// }


// ////////////LOAD SHOP PAGE/////////////

// const loadShopPage = async (req, res, next) => {
//     try {
//         let page = 1
//         if (req.query.page) {
//             page = req.query.page
//         }
//         const session = req.session.user_id
//         const count = await productSchema.find({ is_show: true }).countDocuments()
//         const product = await productSchema.find({ is_show: true }).limit(6).skip((page - 1) * 6).exec()
//         const category = await categoryModel.find()
//         res.render('shopPage', { session, product, category, message, msg, totalPages: Math.ceil(count / 6) })
//         msg = null,
//             message = null
//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }




///////////LOGOUT///////////////

const logOut = async (req, res) => {
    req.session.user_id = null
    res.redirect('/login')
}

///////////ADMIN BLOCKED/////////////




///////////////OTP LOGIN///////////////

const otpLogin = async (req, res, next) => {
    try {
        res.render('otp-login', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

////////OTP PAGE///////

const otppage = async (req, res, next) => {
    try {
        res.render('otp-page', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

//////////OTP GENERATION///////////

function otpgen() {
    OTP = Math.random() * 1000000
    OTP = Math.floor(OTP)
    return OTP
}
let otp

//////////OTP email VERIFICATION///////////

let otpChechMail
const verifyotpMail = async (req, res, next) => {
    try {
        if (req.body.email.trim().length == 0) {
            res.redirect('/otp-login')
            msg = 'Please fill the form'
        } else {
            otpChechMail = req.body.email
            const userData = await User.findOne({ email: otpChechMail })
            if (userData) {
                if (otpChechMail) {
                    if (userData.is_verified == 1) {
                        if (userData.is_blocked == 0) {
                            res.redirect('/otp-page')
                            const mailtransport = nodemailer.createTransport({
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true,
                                auth: {
                                    user: 'emilwilson67@gmail.com',
                                    pass: process.env.EMAILPASS,
                                },
                            });

                            otp = otpgen()
                            let details = {
                                from: "emilwilson67@gmail.com",
                                to: otpChechMail,
                                subject: "Finito Fashion Club",
                                text: otp + " is your Finito Fashion Club verification code. Do not share OTP with anyone "
                            }
                            mailtransport.sendMail(details, (err) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("success");
                                }
                            })

                        } else {
                            res.redirect('/otp-login')
                            msg = 'Your account has been blocked'
                        }
                    } else {
                        res.redirect('/otp-login')
                        msg = 'Mail is not verified'
                    }
                }
            } else {
                res.redirect('/otp-login')
                msg = 'User not found'
            }
        }

    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

///////OTP PAGE VERIFY////////

const otpVerify = async (req, res, next) => {
    try {
        if (req.body.otp.trim().length == 0) {
            res.redirect('/otp-page')
            msg = 'Please Enter OTP'
        } else {
            const OTP = req.body.otp
            if (regex_otp.test(OTP) == false) {
                res.redirect('/otp-page')
                msg = 'Only numbers allowed'
            } else if (otp == OTP) {
                const userData = await User.findOne({ email: otpChechMail })
                req.session.user_id = userData._id;
                res.redirect('/')
            } else {
                res.redirect('/otp-page')
                msg = 'OTP is incorrect'
            }
        }
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

//  FORGOT PASSWORD

const forgot = (req, res) => {
    try {
        res.render('forgot', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.error(error)
    }
}

const resetPassword = async (req, res) => {
    try {
        const user = req.body.email
        console.log("Entered")
        const userData = await User.findOne({ email: user })
        if (userData) {
            console.log("true")
            if (user.is_verified) {
            console.log("true2");
                res.redirect('/forgot')
                msg = "Email is Not Verified"
            } else {
                console.log("sending email");
                const randomstring=randomString.generate()
                const updatedData= await User.updateOne({email:user},{$set:{token:randomstring}})
                sendResetPasswordMail(userData.username,userData.email,randomstring)
                console.log("Please Check");
                res.redirect('/forgot')
                msg="Please Check Your Mail!"
             }
             
        }else{
            console.log("Wrang");
            res.redirect('/forgot')
            msg="Entered Mail is Incorrect"
        }
    

    } catch (error) {
        console.error(error.message);
    }

}

const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            post: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: "emilwilson67@gmail.com",
                pass: process.env.EMAILPASS
            }
        })

        const mailOption = {
            from: "emilwilson67@gmail.com",
            to: email,
            subject: 'For Change Password',
            html:  `<p>Hii ${name}, please click <a href="http://localhost:3001/resetpass?token=${token}">here</a> to verify your email.</p>`,
        }

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Has Been Sent :", info.response);
            }
        })
    } catch (error) {
        console.log(error.message)
    }
}

const newPassword = async(req,res) => {
    try {
        console.log("Entered")
        const token = req.query.token
        const userData = await User.findOne({token : token})
        if(userData){
            console.log("coming");
            res.render('newPassword',{username : userData.username})
        }else{
            res.render('error',{message : 'Invlaid Token'})
        }
    } catch (error) {
        console.log(error.message)
    }
}


const addNewPassword = async (req,res) => {
    try {
        const password = req.body.password
        const Rpassword=req.body.Rpassword
        console.log(password)
        console.log(Rpassword)
        const user = req.body.username
        console.log(user)
        if(password==Rpassword){
        const secure = await securePassword(password)
        console.log(secure)
        const userData =  await User.updateOne({username: user},{$set : {password : secure, token : ''}})
        console.log(userData)

        res.redirect('/login')
        }else{
            res.redirect('/restpass')
            msg="Entered password is not matching!!"
        }
    } catch (error) {
        console.log(error.message)
        // res.render('user/505');
    }
}



// ////////////LOAD SHOP PAGE/////////////

// const loadShopPage = async (req, res, next) => {
//     try {
//         let page = 1
//         if (req.query.page) {
//             page = req.query.page
//         }
//         const session = req.session.user_id
//         const count = await productSchema.find({ is_show: true }).countDocuments()
//         const product = await productSchema.find({ is_show: true }).limit(6).skip((page - 1) * 6).exec()
//         const category = await categoryModel.find()
//         res.render('shopPage', { session, product, category, message, msg, totalPages: Math.ceil(count / 6) })
//         msg = null,
//             message = null
//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }


// // LOAD CART
// const loadCart = async (req, res, next) => {
//     try {
//         const session = req.session.user_id
//         const cartProducts = await cartSchema.findOne({ userId: session }).populate('item.product')
//         let totalPrice = 0
//         if (cartProducts && cartProducts.item != null) {
//             cartProducts.item.forEach(value => totalPrice += value.price * value.quantity);
//         }
//         await cartSchema.updateOne({ userId: session }, { $set: { totalPrice: totalPrice } })
//         res.render('cart', { session, cartProducts, totalPrice,msg })
//         msg = null
//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }
// }

// // ADD TO CART
// const addToCart = async (req, res, next) => {
//     try {
//         const product_Id = req.query.id
//         const user_Id = req.session.user_id

//         const product = await productSchema.findOne({ _id: new Object(product_Id) })
//         const userCart = await cartSchema.findOne({ userId: user_Id });
//         const cartCount = await cartSchema.findOne({ userId: user_Id, "item.product": product_Id })
//         const wishList = await User.findOne({ _id: user_Id })

//         if (userCart) {
//             const itemIndex = userCart.item.findIndex(item => item.product._id.toString() === product_Id);
//             if (itemIndex >= 0) {
//                 if (cartCount) {
//                     const item = cartCount.item.find(item => item.product.toString() === product_Id)
//                     if (item) {
//                         if (item.quantity >= product.stocks) {
//                             const referer = req.headers.referer || "/";
//                             res.redirect(referer);
//                             msg = 'Item out of stock'
//                         } else {
//                             await cartSchema.updateOne({ userId: user_Id, "item.product": product_Id }, { $inc: { "item.$.quantity": 1 } });
//                         }
//                     }
//                 }
//             } else {
//                 if (product.stocks < 1) {
//                     const referer = req.headers.referer || "/";
//                     res.redirect(referer);
//                     msg = 'Item out of stock'
//                 } else {

//                     await cartSchema.updateOne(
//                         { userId: user_Id },
//                         { $push: { item: { product: product_Id, price: product.price, quantity: 1 } } }
//                     );
//                     if (wishList.wishlist.includes(product_Id)) {
//                         wishList.wishlist.pull(product_Id);
//                         await wishList.save();
//                     }
//                 }
//             }
//         } else {
//             if (product.stocks < 1) {
//                 const referer = req.headers.referer || "/";
//                 res.redirect(referer);
//                 msg = 'Item out of stock'
//             } else {
//                 await cartSchema.insertMany({ userId: user_Id, item: [{ product: product_Id, price: product.price, quantity: 1 }] });
//                 if (wishList.wishlist.includes(product_Id)) {
//                     await User.updateOne({ _id: user_Id }, { $unset: { wishlist: product_Id } })
//                 }
//             }
//         }

//         const referer = req.headers.referer || "/";
//         res.redirect(referer);
//         message = 'Item successfully added'

//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }
// }



// const incrementCart = async (req, res, next) => {
//     try {
//         const userId = req.session.user_id;
//         const itemid = req.query.id;
//         const cartCount = await cartSchema.findOne({ 'item._id': itemid })
//         const item = cartCount.item.find(item => item._id.toString() === itemid)
//         const product = await productSchema.findOne({ _id: item.product })
//         if (item) {
//             if (item.quantity >= product.stocks) {
//                 msg = 'Item out of stock'
//                 res.redirect('/cart');
//             } else {
//                 await cartSchema.updateOne({ userId: userId, "item._id": itemid }, { $inc: { "item.$.quantity": 1 } });
//                 let total = 0
//                 const cart = await cartSchema.findOne({ userId: userId, "item._id": itemid })

//                 cart.item.forEach(value => {
//                     total += value.price * value.quantity
//                 })
//                 await cartSchema.updateOne({ userId: userId }, { $set: { totalPrice: total } })

//                 const carts = await cartSchema.findOne({ userId: userId, "item._id": itemid })

//                 const q = carts.item.filter((value) => {
//                     return value._id == itemid
//                 })
//                 const quantity = q[0].quantity
//                 const price = quantity * q[0].price
//                 const totalPrice = carts.totalPrice
//                 res.json({ quantity: quantity, price: price, totalPrice: totalPrice })
//             }
//         }

//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }
// };

// //////DECREMETN CART////////

// const decrementCart = async (req, res, next) => {
//     try {
//         const userId = req.session.user_id;
//         const itemid = req.query.id;
//         const cart = await cartSchema.findOne({ userId: userId, "item._id": itemid });
//         const currentItem = cart.item.find(item => item._id.toString() === itemid);
//         if (currentItem.quantity <= 1) {
//             res.redirect('/cart');
//             return;
//         } else {
//             await cartSchema.updateOne({ userId: userId, "item._id": itemid, }, { $inc: { "item.$.quantity": -1 } });
//             let total = 0
//             const cart = await cartSchema.findOne({ userId: userId, "item._id": itemid })

//             cart.item.forEach(value => {
//                 total += value.price * value.quantity
//             })
//             await cartSchema.updateOne({ userId: userId }, { $set: { totalPrice: total } })

//             const carts = await cartSchema.findOne({ userId: userId, "item._id": itemid })

//             const q = carts.item.filter((value) => {
//                 return value._id == itemid
//             })
//             const quantity = q[0].quantity
//             const price = quantity * q[0].price
//             const totalPrice = carts.totalPrice
//             res.json({ quantity: quantity, price: price, totalPrice: totalPrice })
//         }
//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }
// }

// //////REMOVE FROM CART////////

// const removeCart = async (req, res, next) => {
//     try {
//         const id = req.query.id
//         const userId = req.session.user_id
//         await cartSchema.updateOne({ userId: new Object(userId) }, { $pull: { item: { _id: new Object(id) } } })
//         res.redirect('/cart')
//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }

// }


// ///////////LOAD WISHLIST//////////////

// const loadWishList = async (req, res, next) => {
//     try {
//         const session = req.session.user_id
//         const wishlist = await User.findOne({ _id: session }).populate('wishlist')
//         res.render('wishList', { session, wishlist, message })
//         message = null
//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }

// //////////ADD TO WISHLIST////////////

// const addToWishlist = async (req, res, next) => {
//     try {
//         const session = req.session.user_id
//         const productId = req.query.id
//         const user = await User.findOne({ _id: session })
//         const cart = await cartSchema.findOne({ userId: session, "item.product": productId })
//         if (cart) {
//             msg = 'product already in cart'
//             const referer = req.headers.referer || "/";
//             res.redirect(referer);
//         } else {
//             if (!user.wishlist.includes(productId)) {
//                 user.wishlist.push(productId)
//                 await user.save()
//                 const referer = req.headers.referer || "/";
//                 res.redirect(referer);
//                 message = 'Item added to wishlist'
//             } else {
//                 const referer = req.headers.referer || "/";
//                 res.redirect(referer);
//                 msg = 'Item already in wishist'
//             }
//         }

//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }

// /////////////REMOVE FROM WISHLIST//////

// const removeWishlist = async (req, res, next) => {
//     try {
//         const session = req.session.user_id
//         const product = req.query.id
//         const del = await User.findOne({ _id: session })
//         del.wishlist.pull(product);
//         await del.save();
//         res.redirect('/wishlist')
//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }





module.exports = {
    userSignup,
    insertUser,
    loginUser,
    verifyLogin,
    logOut,
    otpLogin,
    verifyotpMail,
    otppage,
    otpVerify,
    forgot,
    resetPassword,
    newPassword,
    addNewPassword,
    otpSignSubmit,
    otpVerifySignup,
    emailVerified,
}