const User = require('../models/userModel')
const productSchema = require('../models/productModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const categoryModel = require('../models/categoryModel')
const salesSchema = require('../models/salesReport')
const couponSchema = require('../models/couponModel')
const orderSchema = require('../models/orderModel')
const offerSchema = require('../models/offerModel')
const cartSchema = require('../models/cartModel')
const walletHistory = require('../models/walletHistoryModel')
const randomString = require('randomstring')
const { reset } = require('nodemon')
require('dotenv').config();

const paypal = require('paypal-rest-sdk');
paypal.configure({
    mode: "sandbox",
    client_id: process.env.PAYPALCLIENT_ID,
    client_secret: process.env.PAYPALCLIENT_SCRT,
});

const regex_password = /^(?=.*?[A-Z])(?=.*[a-z])(?=.*[0-9]){8,16}/gm
const regex_otp = /^(?=.*[0-9])/gm
const regex_mobile = /^\d{10}$/

let message
let msg
let index
let otpCheckMail
let orderStatus = 0
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


const referral = async (req, res, next) => {
    try {
        res.render('referralPage', { message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}
// const referralSubmit = async (req, res, next) => {
//     try {
//         const referer = req.body.ref
//         const session = req.session.user_id
//         console.log(session)

//         const user = await User.find({referalId:referer})

//         const redeemed=await User.find({_id:session},{redeemed:false})
//         console.log(redeemed);
//         console.log(user)
//         if (referer.trim() == 0) {
//             res.redirect("/referral")
//             msg = "Please enter the code"

//         }else if (user  && redeemed) {
//             await User.updateMany({ _id: user._id }, { $inc: { wallet: 100 } })
//             await User.updateOne({ _id: session }, { $inc: { wallet: 50 } })
//             await User.updateOne({_id:session},{$set:{redeemed:true}})
//             console.log("100 credited");
//             res.redirect("/userProfile")
//             message = "Successfully Redeemed"
//         } else {
//             res.redirect("/referral")
//             msg = "Incorrect Code!"
//         }


//         console.log("ty")
//     } catch (error) {
//         console.log(error);
//     }
// }

const referralSubmit = async (req, res, next) => {
    try {
        const referer = req.body.ref;
        const session = req.session.user_id;
        console.log(session);
        console.log(referer);

        const user = await User.findOne({ referalId: referer });
        const userSession = await User.findOne({ _id: session, redeemed: false });
        console.log(user)
        console.log(userSession);

        if (!referer.trim()) {
            res.redirect("/referral");
            msg = "Please enter the code";
        } else if (user && userSession && user._id.toString() !== session) {
            await User.updateOne({ _id: user._id }, { $inc: { wallet: 100 } });
            await User.updateOne({ _id: session }, { $inc: { wallet: 50 } });
            await User.updateOne({ _id: session }, { $set: { redeemed: true } });
       // Create wallet history entries for both users' transactions
       const creditedEntryUser1 = new walletHistory({
        user: user._id, // Assuming user1._id represents the user1's ID
        transactionType: 'Referral Bonus', // You can define a transaction type for crediting
        amount: 100,
        transactionDate: new Date() // Set transaction date as current date/time
        // Add other fields as per your schema definition
    });

    const creditedEntryUser2 = new walletHistory({
        user: session, // Assuming 'session' represents user2's ID
        transactionType: 'Referral Bonus', // You can define a transaction type for crediting
        amount: 50,
        transactionDate: new Date() // Set transaction date as current date/time
        // Add other fields as per your schema definition
    });

    // Save the wallet history entries for both users' transactions
    await creditedEntryUser1.save();
    await creditedEntryUser2.save();
            console.log("100 credited");
            res.redirect("/userProfile");
            message = "Successfully Redeemed";
        } else {
            res.redirect("/referral");
            msg = "Incorrect Code!";
        }

        console.log("ty");
    } catch (error) {
        console.log(error);
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
    const checkMail = await User.findOne({ email: usd.email, is_verified: 1 })
    const checkMob = await User.findOne({ phone: usd.phone, is_verified: 1 })
    otpCheckMail = req.body.email;
    let codeId = randomString.generate(12)
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
                is_admin: 0,
                referalId: codeId
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


const sendResend = async (req, res) => {
    try {
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
        res.redirect('/otp-page-signup')

    }

    catch (error) {
        console.log(error.message)
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



///////////LOGOUT///////////////

const logOut = async (req, res) => {
    req.session.user_id = null
    res.redirect('/login')
}





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
                const randomstring = randomString.generate()
                const updatedData = await User.updateOne({ email: user }, { $set: { token: randomstring } })
                sendResetPasswordMail(userData.username, userData.email, randomstring)
                console.log("Please Check");
                res.redirect('/forgot')
                msg = "Please Check Your Mail!"
            }

        } else {
            console.log("Wrang");
            res.redirect('/forgot')
            msg = "Entered Mail is Incorrect"
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
            html: `<p>Hii ${name}, please click <a href="http://localhost:3001/resetpass?token=${token}">here</a> to verify your email.</p>`,
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

const newPassword = async (req, res) => {
    try {
        console.log("Entered")
        const token = req.query.token
        const userData = await User.findOne({ token: token })
        if (userData) {
            console.log("coming");
            res.render('newPassword', { username: userData.username })
        } else {
            res.render('error', { message: 'Invlaid Token' })
        }
    } catch (error) {
        console.log(error.message)
    }
}


// const addNewPassword = async (req, res) => {
//     try {
//         const password = req.body.password
//         const Rpassword = req.body.Rpassword
//         console.log(password)
//         console.log(Rpassword)
//         const user = req.body.username
//         console.log(user)
//         if (password == Rpassword) {
//             const secure = await securePassword(password)
//             console.log(secure)
//             const userData = await User.updateOne({ username: user }, { $set: { password: secure, token: '' } })
//             console.log(userData)

//             res.redirect('/login')
//         } else {
//             res.redirect('/restpass')
//             msg = "Entered password is not matching!!"
//         }
//     } catch (error) {
//         console.log(error.message)
//         // res.render('user/505');
//     }
// }

const addNewPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const Rpassword = req.body.Rpassword;
        const user = req.body.username;

        if (password === Rpassword) {
            const secure = await securePassword(password);
            const userData = await User.updateOne({ username: user }, { $set: { password: secure, token: '' } });

            res.redirect('/login');
        } else {
            res.redirect('/restpass');
            msg = 'Entered passwords do not match';
        }
    } catch (error) {
        console.log(error.message);
        // res.render('user/505');
    }
};



///////LOAD ADD NEW ADDRESS/////////////

const addAddress = async (req, res, next) => {
    try {
        const session = req.session.user_id
        res.render('newAddress', { session, message, msg })
        msg = null
        message = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


/////// ADD NEW ADDRESS////////

const addNewAddress = async (req, res, next) => {
    try {
        const id = req.session.user_id
        const data = req.body
        if (data.address, data.city, data.district, data.state, data.country) {
            const userData = await User.findOne({ _id: new Object(id) })
            userData.address.push(data)
            await userData.save()

            res.redirect('/userProfile')
            message = 'Address added success fully'
        } else {
            res.redirect('/addAddress')
            msg = 'Fill all the fields'
        }
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}





//////LOAD CHEK OUT PAGE///////////


// const loadChekOut = async (req, res, next) => {
//     try {
//         let maxDiscount
//         index = req.query.index
//         const id = req.session.user_id
//         const session = req.session.user_id
//         // const cart = await cartSchema.findOne({ userId: session }).populate('item.product')
//         const cart = await cartSchema
//             .findOne({ userId: session })
//             .populate({
//                 path: 'item.product',
//                 populate: {
//                     path: 'category',
//                     model: 'category' // Assuming 'category' is the model name for the category schema
//                 }
//             });

//         for (const item of cart.item) {
//             const categoryId = item.product.category._id; // Assuming '_id' is the ID field of the category

//             // Check if there is an offer for the category
//             const offer = await offerSchema.findOne({ category: categoryId });

//             if (offer) {
//                 maxDiscount = offer.maxDiscount;
//                 console.log(`Category ${categoryId} has a maximum discount of ${maxDiscount}`);
//                 // Perform further operations with the maxDiscount value or the offer data
//             }
//         }
//         if (cart && cart.item && cart.item.length > 0) {
//             const cartItemIds = cart.item.map(item => item.product); // Extracting product IDs from items in the cart

//             const totalDiscount = await offerSchema.aggregate([
//                 { $match: { category: { $in: cartItemIds } } }, // Match offers based on the product IDs in the cart
//                 {
//                     $group: {
//                         _id: null,
//                         totalDiscount: { $sum: '$maxDiscount' } // Calculate total discount
//                     }
//                 }
//             ]);

//             let dis = 0; // Initialize the discount variable

//             if (totalDiscount.length > 0) {
//                 dis = totalDiscount[0].totalDiscount; // Set 'dis' as the total calculated discount
//             }

//         //const dis = maxDiscount
//         const user = await User.findOne({ _id: session })
//         const coupons = await couponSchema.find()
//         const offer = await offerSchema.find()
//         const addressCount = user.address[index]
//         if (cart != null) {
//             if (cart.item != 0) {
//                 res.render('checkOut', { session, cart, user, addressCount, coupons, offer, maxDiscount, dis })
//             } else {
//                 res.redirect('/cart')
//                 msg = "Your cart is empty"
//             }
//         } else {
//             res.redirect('/cart')
//             msg = "Your cart is empty"
//         }
//     }
//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }

// }


const loadChekOut = async (req, res, next) => {
    try {
        let maxDiscount;
        let index = req.query.index; // Declare the 'index' variable with 'let'
        const session = req.session.user_id;
        let categoryOffer;


        const cart = await cartSchema
            .findOne({ userId: session })
            .populate({
                path: 'item.product',
                populate: {
                    path: 'category',
                    model: 'category' // Assuming 'category' is the model name for the category schema
                }
            });


        let totalCategoryDiscount = 0;
        let totalPrice = 0;

        if (cart && cart.item && cart.item.length > 0) {
            for (const item of cart.item) {
                const categoryId = item.product.category._id;

                totalPrice += item.product.price * item.quantity;
                // Find category offer for the item's category
                categoryOffer = await offerSchema.findOne({ category: categoryId });

                if (categoryOffer) {
                    // Calculate category offer for the item
                    const categoryDiscount = categoryOffer.maxDiscount;
                    // Accumulate the category discounts for the total
                    totalCategoryDiscount += categoryDiscount;

                }
            }


            const user = await User.findOne({ _id: session });
            const coupons = await couponSchema.find();
            const offer = await offerSchema.find();
            const addressCount = user.address[index];

            if (cart != null) {
                if (cart.item.length > 0) { // Check if items exist in the cart
                    res.render('checkOut', { session, cart, user, addressCount, coupons, offer, maxDiscount, dis: totalCategoryDiscount, totalPrice, categoryOffer });
                } else {
                    res.redirect('/cart');
                    msg = "Your cart is empty";
                }
            }

        }
    } catch (error) {
        console.log(error);
        next(error.message);
    }
};



////////LOAD SELECT ADDRESS PAGE////////////

const loadSelectAddress = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const user = await User.findOne({ _id: session })
        res.render('selectAddress', { session, user })
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

/////////LOAD MORE ADDRESS PAGE////////

const loadMoreAddress = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const user = await User.findOne({ _id: session })
        res.render('moreAddress', { session, user })
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


// Route to handle address deletion
const deleteAddress = async (req, res) => {

    const userId = req.session.user_id;
    const addressIndexToDelete = req.query.index;
    try {
        const user = await User.findById({ _id: userId });

        if (!user) {
            return res.status(404).send('User not found');
        }
        if (addressIndexToDelete >= 0 && addressIndexToDelete < user.address.length) {
            await User.updateOne(
                { _id: userId },
                { $pull: { address: { _id: user.address[addressIndexToDelete]._id } } }
            );

            return res.redirect('/selectAddress');
        } else {
            return res.status(404).send('Address not found');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
};




////////////LOAD USER PROFILE PAGE/////////

const userProfile = async (req, res, next) => {
    try {
        const session = req.session.user_id;
        let counter;

        if (session) {
            const user = await User.findOne({ _id: session });
            counter = await cartSchema.aggregate([
                { $match: { userId: user._id } },
                { $unwind: "$item" },
                { $group: { _id: null, total: { $sum: "$item.quantity" } } },
                { $project: { _id: 0 } }
            ]);
        }
        if (session) {
            const userData = await User.findOne({ _id: new Object(session) })
            if (orderStatus == 1) {
                const cart = await cartSchema.findOne({ userId: session }).populate('item.product')
                const user = await User.findOne({ _id: session })
                let address
                if (index != undefined) {
                    address = user.address[index]
                } else {
                    address = user.address[0]
                }
                const orderItems = cart.item.map((item) => {
                    return {
                        product: item.product._id,
                        price: item.price,
                        quantity: item.quantity,
                    }
                })
                const latestOrder = await orderSchema.findOne().sort('-orderCount').exec()
                const order = new orderSchema({
                    userId: session,
                    item: orderItems,
                    address: address,
                    totalPrice: req.session.payMoney,
                    orderCount: latestOrder ? latestOrder.orderCount + 1 : 1,
                    start_date: new Date().toLocaleDateString('en-GB'),
                    paymentType: paymentMethod
                })
                await order.save()
                const orderData = await orderSchema.findOne({ userId: session }).sort({ _id: -1 }).populate('item.product')
                orderData.item.forEach(async (item) => {
                    const productid = item.product._id
                    const quantity = item.quantity
                    await productSchema.updateOne({ _id: productid }, { $inc: { stocks: -quantity } })
                })
                await cartSchema.deleteMany({ userId: session })
                orderStatus = 0
            }
            const orders = await orderSchema.find({ $and: [{ userId: session }, { user_cancelled: false }, { admin_cancelled: false }, { is_delivered: false }] }).populate('item.product')
            res.render('userProfile', { userData, session, message, orders, msg, counter: counter ? counter[0]?.total || 0 : 0 })
            msg = null
            message = null
        } else {
            msg = 'You should login for access all pages'
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        next(error.message)
    }
}

//////LOAD USER EDIT PROFILE///////////////

const loadEditProfile = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const userData = await User.findOne({ _id: new Object(session) })
        const index2 = req.query.index
        let addressCount = userData.address[index2]
        res.render('editProfile', { userData, session, msg, addressCount, index2 })
        msg = null
    } catch (error) {
        console.log(error);
        next(error.message)
    }
}


/////////EDIT PROFILE/////////

const editProfile = async (req, res, next) => {
    try {
        const data = req.body;
        const id = req.session.user_id
        const index2 = req.query.index
        const key = `address.${index2}`
        if (data.username.trim() == '' || data.phone.trim() == '' || data.address.trim() == '' || data.city.trim() == '' || data.district.trim() == '' || data.state.trim() == '' || data.country.trim() == '') {
            res.redirect('/editProfile')
            msg = 'Fill all the fields'
        } else {
            if (index2) {
                if (req.file) {
                    await User.updateOne({ _id: new Object(id) }, { $set: { image: req.file.filename } })
                }
                const editaddress = {
                    address: data.address,
                    city: data.city,
                    district: data.district,
                    state: data.state,
                    country: data.country
                }
                if (data.address && data.city && data.district && data.state && data.country) {
                    await User.updateOne({ _id: new Object(id) }, { $set: { [key]: editaddress } })
                    await User.updateOne({ _id: new Object(id) }, { $set: { username: data.username, phone: data.phone } })
                    res.redirect('/userProfile')
                    message = 'Profile updated successfully'
                } else {
                    res.redirect('/editProfile')
                    msg = 'Fill all the fields'
                }
            } else {
                if (req.file) {
                    await User.updateOne({ _id: new Object(id) }, { $set: { image: req.file.filename } })
                }
                if (data.address && data.city && data.district && data.state && data.country) {
                    await User.updateOne({ _id: new Object(id) }, {
                        $set: {
                            'address.0': {
                                address: data.address,
                                city: data.city,
                                district: data.district,
                                state: data.state,
                                country: data.country
                            }
                        }
                    })
                    await User.updateOne({ _id: new Object(id) }, { $set: { username: data.username, phone: data.phone } })
                    res.redirect('/userProfile')
                    message = 'Profile updated successfully'
                } else {
                    if (req.file) {
                        await User.updateOne({ _id: new Object(id) }, { $set: { image: req.file.filename } })
                        res.redirect('/userProfile')
                        message = 'Profile Image edited successfully'
                    } else {
                        res.redirect('/editProfile')
                        msg = 'Fill all the fields'
                    }

                }
            }

        }

    } catch (error) {
        console.log(error);
        next(error.message)
    }
}


const loadChangePassword = async (req, res, next) => {
    try {
        res.render('changePassword', { msg })
        msg = null
    } catch (error) {
        console.log(error);
        next(error.message)
    }
}

const changePswd = async (req, res, next) => {
    try {
        const newPassword = req.body.newPassword
        const rePassword = req.body.Repassword
        const id = req.session.user_id
        const password = await User.findOne({ _id: new Object(id) })
        const passwordHash = await bcrypt.compare(req.body.oldPassword, password.password)
        if (passwordHash) {
            if (regex_password.test(newPassword) == false) {
                msg = "Use Strong Password!"
                res.redirect('/changePassword')
            } else {
                if (newPassword == rePassword) {
                    console.log("entered")

                    const passwordSec = await securePassword(newPassword)
                    console.log(passwordSec);
                    await User.updateOne({ _id: new Object(id) }, { $set: { password: passwordSec } })
                    res.redirect('/userProfile')
                    message = "Password Changed Successfully"
                } else {
                    msg = "Password do not matcch!"
                    res.redirect('/changePassword')
                }
            }
        } else {
            msg = "Incorrect"
            res.redirect('/changePassword')
        }

    } catch (error) {
        console.log(error);
        next(error.message)
    }
}



// const orderConfirm = async (req, res, next) => {

//     try {
//         let payMoney
//         const session = req.session.user_id
//         const payment = req.body
//         paymentMethod = payment.flexRadioDefault
//         let offer
//         let maxDiscount = 0;
//         let dis;
//         //const cart = await cartSchema.findOne({ userId: session })
//         const user = await User.findOne({ _id: session })

//         const cart = await cartSchema
//             .findOne({ userId: session })
//             .populate({
//                 path: 'item.product',
//                 populate: {
//                     path: 'category',
//                     model: 'category' // Assuming 'category' is the model name for the category schema
//                 }
//             });

//         for (const item of cart.item) {
//             const categoryId = item.product.category._id; // Assuming '_id' is the ID field of the category

//             // Check if there is an offer for the category
//             offer = await offerSchema.findOne({ category: categoryId });

//             if (offer) {
//                 maxDiscount = offer.maxDiscount;
//                 console.log(`Category ${categoryId} has a maximum discount of ${maxDiscount}`);
//                 // Perform further operations with the maxDiscount value or the offer data
//                     payMoney = parseInt(cart.totalPrice) - maxDiscount

//         }
//     }

//         if (cart.couponDiscount) {
//             payMoney = parseInt(cart.totalPrice) - cart.couponDiscount
//         } else {
//             payMoney = parseInt(cart.totalPrice)
//         }





//         req.session.payMoney = payMoney
//         if (payment.flexRadioDefault == 'cashOn') {
//             if (user.wallet) {
//                 if (user.wallet >= payMoney) {
//                     await User.findByIdAndUpdate({ _id: session }, { $inc: { wallet: -payMoney } })
//                 } else {
//                     await User.findByIdAndUpdate({ _id: session }, { $set: { wallet: 0 } })
//                 }
//             }
//             orderStatus = 1
//             res.redirect('/userProfile')
//             message = 'Your order started shipping'
//         } else if (payment.flexRadioDefault == 'Wallet') {
//             if (user.wallet) {
//                 if (user.wallet >= payMoney) {
//                     await User.findByIdAndUpdate({ _id: session }, { $inc: { wallet: -payMoney } })
//                 } else {
//                     await User.findByIdAndUpdate({ _id: session }, { $set: { wallet: 0 } })
//                 }
//             }
//             orderStatus = 1
//             res.redirect('/userProfile')
//             message = 'Your order started shipping'
//         } else if (payment.flexRadioDefault == 'online') {
//             if (user.wallet) {
//                 payMoney = payMoney - user.wallet
//             }
//             const currencyMap = {
//                 840: "USD",
//                 978: "EUR",
//                 826: "GBP",
//             };
//             const currencyCode = currencyMap["840"];

//             const amount = {
//                 currency: currencyCode,
//                 total: payMoney,
//             };


//             const create_payment_json = {
//                 intent: "sale",
//                 payer: {
//                     payment_method: "paypal",
//                 },
//                 redirect_urls: {
//                     return_url: process.env.SITE_URL + "/success",
//                     cancel_url: process.env.SITE_URL + "/checkout",
//                 },
//                 transactions: [
//                     {
//                         amount,
//                         description: "Washing Bar soap",
//                     },
//                 ],
//             };

//             paypal.payment.create(create_payment_json, function (error, payment) {
//                 if (error) {
//                     throw error;
//                 } else {
//                     for (let i = 0; i < payment.links.length; i++) {
//                         if (payment.links[i].rel === "approval_url") {
//                             res.redirect(payment.links[i].href);
//                         }
//                     }
//                 }
//             });

//         } else {
//             res.redirect('/placeOrder')
//             msg = 'Please select any payment option'
//         }
//     } catch (error) {
//         console.log(error);
//         next(error.message)
//     }

// }


const orderConfirm = async (req, res, next) => {
    try {
        let payMoney;
        const session = req.session.user_id;
        const payment = req.body;
        paymentMethod = payment.flexRadioDefault;
        let offerApplied = false;
        let maxDiscount = 0;

        const user = await User.findOne({ _id: session });
        const cart = await cartSchema
            .findOne({ userId: session })
            .populate({
                path: 'item.product',
                populate: {
                    path: 'category',
                    model: 'category'
                }
            });

        for (const item of cart.item) {
            const categoryId = item.product.category._id;


            const offer = await offerSchema.findOne({ category: categoryId });

            if (offer && offer.maxDiscount > maxDiscount && cart.totalPrice >= offer.minPurchase) {
                maxDiscount = offer.maxDiscount;
                offerApplied = true;
                console.log(`Category ${categoryId} has a maximum discount of ${maxDiscount}`);
            }
        }

        if (offerApplied) {
            payMoney = parseInt(cart.totalPrice) - maxDiscount;
            console.log(payMoney);
            console.log("Success - Category offer applied");
        } else if (cart.couponDiscount) {
            payMoney = parseInt(cart.totalPrice) - cart.couponDiscount;
            console.log("Coupon applied");
        } else {
            payMoney = parseInt(cart.totalPrice);
            console.log("No discount applied");
        }

        req.session.payMoney = payMoney;

        if (payment.flexRadioDefault == 'cashOn') {
            // if (user.wallet) {
            //     if (user.wallet >= payMoney) {
            //         await User.findByIdAndUpdate({ _id: session }, { $inc: { wallet: -payMoney } })
            //     } else {
            //         await User.findByIdAndUpdate({ _id: session }, { $set: { wallet: 0 } })
            //     }
            // }
            orderStatus = 1
            res.redirect('/userProfile')
            message = 'Your order started shipping'
        } else if (payment.flexRadioDefault == 'Wallet') {
            console.log("entered");
            // if (!user.wallet) {
            //     msg = 'Insufficient Balance';
            // }
            console.log("yes");
            if (user.wallet) {
                console.log("true");
                if (user.wallet >= payMoney) {
                    console.log("deducted");
                    await User.findByIdAndUpdate({ _id: session }, { $inc: { wallet: -payMoney } });
                    // Create a wallet history entry for the deposit transaction
                    const depositEntry = new walletHistory({
                        user: session,
                        transactionType: 'Purchase', // Assuming this is a deposit into the wallet
                        amount: payMoney,
                        transactionDate: new Date(),

                    });

                    // Save the wallet history entry
                    await depositEntry.save();

                    console.log("updated");
                    orderStatus = 1;
                    res.redirect('/userProfile');
                    message = 'Your order started shipping';
                } else {
                    console.log("not deducted");
                    res.redirect("/placeOrder?showAlert=true")

                }
            }

        } else if (payment.flexRadioDefault == 'online') {
            // if (user.wallet) {
            //     payMoney = payMoney - user.wallet
            // }
            const currencyMap = {
                840: "USD",
                978: "EUR",
                826: "GBP",
            };
            const currencyCode = currencyMap["840"];

            const amount = {
                currency: currencyCode,
                total: payMoney,
            };


            const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                redirect_urls: {
                    return_url: process.env.SITE_URL + "/success",
                    cancel_url: process.env.SITE_URL + "/checkout",
                },
                transactions: [
                    {
                        amount,
                        description: "Washing Bar soap",
                    },
                ],
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === "approval_url") {
                            res.redirect(payment.links[i].href);
                        }
                    }
                }
            });

        } else {
            res.redirect('/placeOrder?showAlert=false')

        }
    } catch (error) {
        console.log(error);
        next(error.message);
    }
};



//CONFIRM PAYMENT


const confirmPayment = async (req, res, next) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const session = req.session.user_id
    const cart = await cartSchema.findOne({ userId: session })
    //const user = await User.findOne({ _id: session })

    const execute_payment_json = {
        payer_id: payerId,
        transactions: [
            {
                amount: {
                    currency: "USD",
                    total: req.session.payMoney,
                },
            },
        ],
    };

    paypal.payment.execute(
        paymentId,
        execute_payment_json,
        function (error, payment) {
            if (error) {
                console.log(error.response);
                throw error;
            } else {
                orderStatus = 1;
                res.redirect("/userProfile");
                message = 'Order started shipping'
            }
        }
    );
};




///////////////SHOW ORDERS/////////////

const showOrders = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const orderId = req.query.orderid
        const order = await orderSchema.findOne({ _id: orderId }).populate('userId').populate('item.product')
        res.render('orders', { session, order })
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

///////////SHOW ORDER HISTORY////////////

const loadOrderHistory = async (req, res, next) => {
    try {

        const session = req.session.user_id
        const orders = await orderSchema.find({ userId: session }).populate('userId').populate('item.product')
        let proCount
        orders.forEach((order) => {
            proCount = 0
            if (order.is_delivered == true) {
                order.status = 'Delivered'
            } else if (order.user_cancelled == true) {
                order.status = 'Cancelled'
            } else if (order.admin_cancelled == true) {
                order.status = 'Admin Cancelled'
            } else {
                order.status = 'On the way'
            }

            order.item.forEach((item) => {
                proCount += item.quantity
            })
            order.proCount = proCount

        })
        if (orders) {
            res.render('orderHistory', { session, orders, proCount, message })
            message = null
        } else {
            res.redirect('/userProfile')
            msg = 'No ordes found'
        }

    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

/////////////CANCEL ORDER///////////////

const cancelOrder = async (req, res, next) => {
    try {
        const orderId = req.query.orderid
        const session = req.session.user_id
        const orders = await orderSchema.findOne({ _id: orderId }).populate('item.product')
        const user = await User.findOne({ _id: session })
        await orderSchema.updateOne({ _id: orderId }, { $set: { user_cancelled: true } })
        if (orders.paymentType == 'online' || orders.paymentType == 'Wallet') {
            if (user.wallet) {
                await User.findByIdAndUpdate({ _id: session }, { $inc: { wallet: orders.totalPrice } })
            } else {
                await User.findByIdAndUpdate({ _id: session }, { $set: { wallet: orders.totalPrice } })
            }
        }
        // Create a wallet history entry for the deposit transaction
        const depositEntry = new walletHistory({
            user: session,
            transactionType: 'Refund', // Assuming this is a deposit into the wallet
            amount: orders.totalPrice,
            transactionDate: new Date(),

        });

        // Save the wallet history entry
        await depositEntry.save();

        orders.item.forEach(async (item) => {
            const productId = item.product._id
            const quantity = item.quantity
            await productSchema.updateOne({ _id: productId }, { $inc: { stocks: quantity } })
        });
        res.redirect('/userProfile')
        message = 'Order cancelled successfully'
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }

}




///////////RETURN ORDER//////////////

const returnOrder = async (req, res, next) => {
    try {
        const orderId = req.query.id
        const userId = req.session.user_id
        const order = await orderSchema.findOne({ _id: orderId })
        const user = await User.findOne({ _id: userId })
        const Price = order.totalPrice
        if (user.wallet) {
            await User.findByIdAndUpdate({ _id: userId }, { $inc: { wallet: Price } })
        } else {
            await User.findByIdAndUpdate({ _id: userId }, { $set: { wallet: Price } })
        }
        // Create a wallet history entry for the deposit transaction
        const depositEntry = new walletHistory({
            user: userId,
            transactionType: 'Refund', // Assuming this is a deposit into the wallet
            amount: Price,
            transactionDate: new Date(),

        });

        // Save the wallet history entry
        await depositEntry.save();

        order.item.forEach(async (item) => {
            const productId = item.product._id
            const quantity = item.quantity
            await productSchema.updateOne({ _id: productId }, { $inc: { stocks: quantity } })
        });
        await salesSchema.deleteOne({ orders: orderId })
        await orderSchema.findByIdAndDelete({ _id: orderId })

        res.redirect("/orderHistory")
        message = 'Order returned successfully'

    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


const addCoupon = async (req, res, next) => {
    try {
        let amount
        const code = req.body.coupon
        const session = req.session.user_id
        const cart = await cartSchema.findOne({ userId: session }, { totalPrice: 1 })
        const coupon = await couponSchema.findOne({ couponCode: code })

        if (coupon) {
            if (cart.totalPrice > coupon.minPurchase) {
                const today = new Date()

                if (coupon.endDate > today) {
                    const userFind = await couponSchema.findOne({ couponCode: code, userId: session })
                    if (!userFind) {


                        const discountPrice = coupon.maxDiscount
                        console.log(discountPrice)
                        amount = parseInt(cart.totalPrice) - discountPrice
                        await cartSchema.updateOne({ userId: session }, { $set: { couponDiscount: discountPrice } })
                        await couponSchema.updateOne({ couponCode: code }, { $push: { userId: session } })
                        res.json({ status: true, discountPrice, amount })
                    } else {
                        res.json({ used: true })
                    }
                } else {
                    res.json({ expired: true })
                }
            } else {

                res.json({ lessPrice: true })
            }
        } else {
            res.json({ noMatch: true })
        }


    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

const removeCoupon = async (req, res, next) => {
    try {
        const session = req.session.user_id;
        await cartSchema.updateOne({ userId: session }, { $set: { couponDiscount: 0 } })
        const coo = await couponSchema.findOne({ userId: session }, { _id: 1 })
        await couponSchema.updateOne({ _id: coo }, { $pull: { userId: session } })
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }

}

const wallet = async (req, res) => {
    try {

        const session = req.session.user_id
        // Fetch wallet history data from the database (replace this with your logic)
        const WalletHistory = await walletHistory.find({ user: session }).exec();

        // Pass wallet history data to the EJS template for rendering
        res.render('walletHistory', { WalletHistory, session });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
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
    referral,
    referralSubmit,
    addAddress,
    addNewAddress,
    loadChekOut,
    addCoupon,
    loadSelectAddress,
    loadMoreAddress,
    deleteAddress,
    userProfile,
    loadEditProfile,
    editProfile,
    loadChangePassword,
    changePswd,
    orderConfirm,
    confirmPayment,
    showOrders,
    loadOrderHistory,
    cancelOrder,
    returnOrder,
    sendResend,
    removeCoupon,
    wallet,
}