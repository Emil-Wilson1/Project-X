const User = require('../models/userModel')
const productSchema = require('../models/productModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const categoryModel = require('../models/categoryModel')
require('dotenv').config();


const regex_password = /^(?=.*?[A-Z])(?=.*[a-z])(?=.*[0-9]){8,16}/gm
const regex_otp = /^(?=.*[0-9])/gm
const regex_mobile = /^\d{10}$/

let message
let msg


//////////SECURE PASSWORD////////////

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

///////////SEND EMAIL VERIFICATION////////

const otpSignup = async (req, res, next) => {
    try {
        res.render('otp-login-signup', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

let otpCheckMail
// const verifyotpMailSignup = async (req, res, next) => {
//     try {

//         if (req.body.email.trim().length == 0) {
//             res.redirect('/otp-login-signup');
//             msg = 'Please fill the form';
//         } else {
//             otpCheckMail = req.body.email;
//             const userData = await User.findOne({ email: otpCheckMail });

//             if (userData) {
//                 res.redirect('/otp-page-signup');
//                 const mailtransport = nodemailer.createTransport({
//                     host: 'smtp.gmail.com',
//                     port: 465,
//                     secure: true,
//                     auth: {
//                         user: 'emilwilson67@gmail.com',
//                         pass: process.env.EMAILPASS,
//                     },
//                 });

//                 otp = otpgen();
//                 let details = {
//                     from: "emilwilson67@gmail.com",
//                     to: otpCheckMail,
//                     subject: "Classy Fashion Club",
//                     text: otp + " is your Classy Fashion Club verification code. Do not share OTP with anyone "
//                 };

//                 mailtransport.sendMail(details, (err) => {
//                     if (err) {
//                         console.log(err);
//                     } else {
//                         console.log("success");
//                     }
//                 });
//             } else {
//                 res.redirect('/otp-login-signup');
//                 msg = 'error';
//             }
            
//         }
//     } catch (error) {
//         console.log(error.message);
//         next(error.message);
//     }
// };



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

const emailVerified = async (req,res,next)=>{
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
    otpCheckMail=req.body.email;

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
                    text: otp + " is your Classy Fashion Club verification code. Do not share OTP with anyone "
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

///////LOADING HOME PAGE////////

const loadHome = async (req, res, next) => {
    try {
        let session = req.session.user_id
        const products = await productSchema.find({ is_show: true }).sort({ _id: -1 }).limit(4)
       
        res.render('home', { product: products, session, msg, message})
        msg = null,
            message = null
    } catch (err) {
        console.log(err);
        next(err.message)
    }
}

//////////////////LOAD PRODUCT DETAILS PAGE//////////////

const productDetails = async (req, res, next) => {
    try {
        const id = req.query.id
        const session = req.session.user_id
        const product = await productSchema.findOne({ _id: new Object(id) })
        res.render('singleProduct', { product: product, session, message, msg })
        msg = null,
            message = null
    } catch (error) {
        console.log(error);
        next(error.message)
    }
}

////////////LOAD USER PROFILE PAGE/////////



///////////LOGOUT///////////////

const logOut = async (req, res) => {
    req.session.user_id = null
    res.redirect('/login')
}

///////////ADMIN BLOCKED/////////////

const logOutIn = async (req, res) => {
    req.session.user_id = null
    res.redirect('/admin/userData')
}

/////////EMAIL VERIFICATION////////////

// const verifyMail = async (req, res, next) => {
//     try {
//         await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } })
//         res.render('email_verified')
//     } catch (error) {
//         console.log(error.message);
//         next(error.message)
//     }
// }


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
                                subject: "Classy Fashion Club",
                                text: otp + " is your Classy Fashion Club verification code. Do not share OTP with anyone "
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

//////LOAD CART PAGE///////


////////////LOAD SHOP PAGE/////////////

const loadShopPage = async (req, res, next) => {
    try {
        let page = 1
        if (req.query.page) {
            page = req.query.page
        }
        const session = req.session.user_id
        const count = await productSchema.find({ is_show: true }).countDocuments()
        const product = await productSchema.find({ is_show: true }).limit(6).skip((page - 1) * 6).exec()
        const category = await categoryModel.find()
        res.render('shopPage', { session, product, category, message, msg, totalPages: Math.ceil(count / 6) })
        msg = null,
            message = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


///////////PRODUCT FILTER///////////

const productFilter = async (req, res, next) => {
    try {

        let product
        let products = []
        let Categorys
        let Data = []

        const { categorys, search, filterprice } = req.body


        if (!search) {
            if (filterprice != 0) {
                if (filterprice.length == 2) {
                    product = await productSchema.find({
                        is_show: true,
                        $and: [
                            { price: { $lte: Number(filterprice[1]) } },
                            { price: { $gte: Number(filterprice[0]) } }
                        ]

                    }).populate('category')
                } else {
                    product = await productSchema.find({
                        is_show: true,
                        $and: [
                            { price: { $gte: Number(filterprice[0]) } }
                        ]

                    }).populate('category')
                }
            } else {
                product = await productSchema.find({ is_show: true }).populate('category')
            }

        } else {

            if (filterprice != 0) {
                if (filterprice.length == 2) {
                    product = await productSchema.find({
                        is_show: true,
                        $and: [
                            { price: { $lte: Number(filterprice[1]) } },
                            { price: { $gte: Number(filterprice[0]) } },
                            {
                                $or: [
                                    { brand: { $regex: '.*' + search + '.*', $options: 'i' } },
                                    { title: { $regex: '.*' + search + '.*', $options: 'i' } }
                                ]
                            }
                        ]

                    }).populate('category')
                } else {
                    product = await productSchema.find({
                        is_show: true,
                        $and: [
                            { price: { $gte: Number(filterprice[0]) } },
                            {
                                $or: [
                                    { brand: { $regex: '.*' + search + '.*', $options: 'i' } },
                                    { title: { $regex: '.*' + search + '.*', $options: 'i' } }
                                ]
                            }
                        ]

                    }).populate('category')
                }
            } else {
                product = await productSchema.find({
                    is_show: true,
                    $or: [
                        { brand: { $regex: '.*' + search + '.*', $options: 'i' } },
                        { title: { $regex: '.*' + search + '.*', $options: 'i' } }
                    ]
                }).populate('category')
            }


        }

        Categorys = categorys.filter((value) => {
            return value !== null
        })
        if (Categorys[0]) {

            Categorys.forEach((element, i) => {
                products[i] = product.filter((value) => {
                    return value.category.category == element
                })
            });
            products.forEach((value, i) => {
                Data[i] = value.filter((v) => {
                    return v
                })
            })
        } else {
            Data[0] = product
        }
        res.json({ Data })
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}




module.exports = {
    userSignup,
    insertUser,
    loginUser,
    verifyLogin,
    loadHome,
    logOut,
    logOutIn,
    otpLogin,
    verifyotpMail,
    otppage,
    otpVerify,
    productDetails,
    loadShopPage,
    productFilter,
    otpSignup,
    otpSignSubmit,
    otpVerifySignup,
    emailVerified,
}