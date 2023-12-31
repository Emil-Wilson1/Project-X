const userSchema = require('../models/userModel')
const categorySchema = require('../models/categoryModel')
// const productSchema = require('../models/productModel')
const salesSchema = require('../models/salesReport')
const orderSchema = require('../models/orderModel')
const couponSchema = require('../models/couponModel')
const offerSchema = require('../models/offerModel')
const bannerSchema = require('../models/bannerModel')
const nodemailer = require('nodemailer')
const moment = require('moment');
const bcrypt = require('bcrypt')
const sharp = require('sharp')
const path = require('path');
const { ObjectId } = require('mongodb')
require('dotenv').config();

let msg
let message

// LOGIN PAGE LODING

const loginLoad = async (req, res) => {
    res.render('login', { msg })
    msg = null
}


// ADMIN LOGIN

const adminLogin = async (req, res) => {
    try {
        const adminMail = req.body.email
        const pass = req.body.password
        const adminData = await userSchema.findOne({ email: adminMail })

        if (adminMail.trim().length == 0 || pass.trim().length == 0) {
            res.redirect('/admin')
            msg = 'Fill all the fields'
        } else {
            if (adminData) {
                const comparePassword = await bcrypt.compare(pass, adminData.password)
                if (comparePassword) {
                    if (adminData.is_admin == 1) {
                        req.session.admin_id = adminData._id
                        res.redirect('/admin/home')
                    } else {
                        res.redirect('/admin')
                        msg = 'You are not an admin'
                    }
                } else {
                    res.redirect('/admin')
                    msg = 'Incorrect password'
                }
            } else {
                res.redirect('/admin')
                msg = 'Incorrect email'
            }
        }

    } catch (error) {
        console.log(error);
    }
}
const loadAdminHome = async (req, res) => {

    try {
        const users = await userSchema.find()
        const usersLength = users.length

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

        const dailySalesReport = await salesSchema.aggregate([
            { $match: { date: { $gte: today } } },
            { $group: { _id: null, totalSales: { $sum: '$totalSales' }, totalItemsSold: { $sum: '$totalItemsSold' } } }
        ]);

        const weeklySalesReport = await salesSchema.aggregate([
            { $match: { date: { $gte: weekAgo } } },
            { $group: { _id: null, totalSales: { $sum: '$totalSales' }, totalItemsSold: { $sum: '$totalItemsSold' } } }
        ]);

        const yearlySalesReport = await salesSchema.aggregate([
            { $match: { date: { $gte: yearAgo } } },
            { $group: { _id: null, totalSales: { $sum: '$totalSales' }, totalItemsSold: { $sum: '$totalItemsSold' } } }
        ]);

        const yearlyStart = new Date(new Date().getFullYear(), 0, 1);
        const yearlyEnd = new Date(new Date().getFullYear(), 11, 31);
        let salesOfMonth
        let totalSalesOfMonth
        const yearlySalesData = await salesSchema.find({
            date: {
                $gte: yearlyStart,
                $lte: yearlyEnd,
            },
        })

        const monthlySalesDetails = [];
        const monthlyProducSales = []
        for (let i = 0; i < 12; i++) {
            salesOfMonth = yearlySalesData.filter((order) => {
                return order.date.getMonth() === i;
            });


            totalSalesOfMonth = salesOfMonth.reduce((total, order) => {
                return (
                    total += order.totalSales
                )
            }, 0);
            let proCount
            proCount = 0
            productSalesOfMonth = salesOfMonth.reduce((total, order) => {

                return (
                    proCount += order.totalItemsSold
                )
            }, 0);

            monthlySalesDetails.push(totalSalesOfMonth);
            monthlyProducSales.push(productSalesOfMonth)
        }
        const orders = await orderSchema.find().populate('userId').populate('item.product');
        res.render('home', { message, usersLength, msg, orders, dailySalesReport, weeklySalesReport, yearlySalesReport,monthlySalesReport: JSON.stringify(monthlySalesDetails), monthlyProductSales: JSON.stringify(monthlyProducSales) });
        message = null;
    } catch (error) {
        console.log(error);
    }

}


// const loadSalesPage = async (req, res) => {
//     try {

//         let filter = '';
//         if (req.query.filter) {
//             filter = req.query.filter;
//         }

//         let page = 1;
//         if (req.query.page) {
//             page = req.query.page;
//         }

//         let sales = [];
//         let count
//         if (filter === 'all') {
//             sales = await salesSchema.find({}).populate('userId').limit(6).skip((page - 1) * 6).exec();
//             count = await salesSchema.find({}).countDocuments()
//         } else if (filter === 'weekly') {
//             const startOfWeek = moment().startOf('week').toDate();
//             const endOfWeek = moment().endOf('week').toDate();

//             sales = await salesSchema
//                 .find({
//                     date: {
//                         $gte: startOfWeek,
//                         $lte: endOfWeek,
//                     },
//                 })
//                 .populate('userId').limit(6).skip((page - 1) * 6).exec();

//             count = await salesSchema
//                 .find({
//                     date: {
//                         $gte: startOfWeek,
//                         $lte: endOfWeek,
//                     },
//                 }).countDocuments()

//         } else if (filter === 'yearly') {
//             const startOfYear = moment().startOf('year').toDate();
//             const endOfYear = moment().endOf('year').toDate();

//             sales = await salesSchema
//                 .find({
//                     date: {
//                         $gte: startOfYear,
//                         $lte: endOfYear,
//                     },
//                 })
//                 .populate('userId').limit(6).skip((page - 1) * 6).exec();
//             count = await salesSchema
//                 .find({
//                     date: {
//                         $gte: startOfYear,
//                         $lte: endOfYear,
//                     },
//                 }).countDocuments()
//         } 
//         else if(filter=='today'){
//             const today = moment().startOf('day').toDate();
//            sales = await salesSchema
//         .find({
//             date: {
//                 $gte: today, 
//                 $lte: moment(today).endOf('day').toDate(),
//             },
//         })
//         .populate('userId').limit(6).skip((page - 1) * 6).exec();

//         count = await salesSchema
//         .find({
//             date: {
//                 $gte: today, 
//                 $lte: moment(today).endOf('day').toDate(),
//             },
//         }).countDocuments()

//         }else {
//             sales = await salesSchema.find().populate('userId').limit(6).skip((page - 1) * 6).exec()
//             count = await salesSchema.find().countDocuments()
//         }
//         res.render('salesReport', { sales, page, totalPages: Math.ceil(count / 6) });
//     } catch (error) {
//         console.log(error.message);
//     }
// };



const loadSalesPage = async (req, res) => {
    try {
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        let sales = [];
        let count;
        let startDate, endDate;
        let s;
        let e;
        if (req.query.startDate && req.query.endDate) {
            startDate = moment(req.query.startDate).startOf('day').toDate();
            endDate = moment(req.query.endDate).endOf('day').toDate();
            s = req.query.startDate;
            e = req.query.endDate;

            sales = await salesSchema
                .find({
                    date: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                })
                .populate('userId')
                .limit(6)
                .skip((page - 1) * 6)
                .exec();

            count = await salesSchema
                .find({
                    date: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                })
                .countDocuments();
        } else {
            
            sales = await salesSchema
                .find()
                .populate('userId')
                .limit(6)
                .skip((page - 1) * 6)
                .exec();

            count = await salesSchema.find().countDocuments();
        }

        res.render('salesReport', { sales, page, totalPages: Math.ceil(count / 6), s, e });
    } catch (error) {
        console.log(error.message);
    }
};



// LOGOUT

const adminLogOut = async (req, res) => {
    try {
        req.session.admin_id = null
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
    }
}

const loadUserData = async (req, res) => {
    try {
        let search = ''
        if (req.query.search) {
            search = req.query.search
        }
        var page = 1
        if (req.query.page) {
            page = req.query.page
        }

        const limit = 6

        const userData = await userSchema.find(
            {
                is_admin: 0,
                $or: [
                    { username: { $regex: '.*' + search + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + search + '.*', $options: 'i' } }
                ]
            }).limit(limit).skip((page - 1) * limit).exec();

        const count = await userSchema.find(
            {
                is_admin: 0,
                $or: [
                    { username: { $regex: '.*' + search + '.*', $options: 'i' } },
                    { email: { $regex: '.*' + search + '.*', $options: 'i' } }
                ]
            }).countDocuments()

        for (i = 0; i < userData.length; i++) {
            if (userData[i].is_verified == 0) {
                userData[i].Status = 'Not verified'
            }
            else if (userData[i].is_blocked == 0) {
                userData[i].Status = 'Active'
            } else {
                userData[i].Status = 'Blocked'
            }
        }
        res.render('userData', { users: userData, page, totalPages: Math.ceil(count / limit), currentPage: page })
    } catch (error) {
        console.log(error);
    }
}


// BLOCK USER

const blockUser = async (req, res) => {
    try {
        const id = req.query.id
        await userSchema.updateOne({ _id: new Object(id) }, { $set: { is_blocked: 1 } })
        const userData = await userSchema.findOne({ _id: id })
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'emilwilson67@gmail.com',
                pass: process.env.EMAILPASS
            },
        });

        const mailOption = {
            from: 'emilwilson67@gmail.com',
            to: userData.email,
            subject: 'Your Account has been Blocked',
            html: `<p>Hii ${userData.username}, Your account has been blocked !</p>`,
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log(error.message);
                console.log('Email could not be sent');
            } else {
                console.log('Email has been sent:', info.response);
            }
        });
        res.redirect('/logoutIn')

    } catch (error) {
        console.log(error);
    }
}




// UNBLOCK USER

const unblockUser = async (req, res) => {
    try {
        const id = req.query.id
        await userSchema.updateOne({ _id: new Object(id) }, { $set: { is_blocked: 0 } })
        const userData = await userSchema.findOne({ _id: id })
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'emilwilson67@gmail.com',
                pass: process.env.EMAILPASS
            },
        });

        const mailOption = {
            from: 'emilwilson67@gmail.com',
            to: userData.email,
            subject: 'Access granted',
            html: `<p>Hii ${userData.username}, Your account is active now!.</p>`,
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log(error.message);
                console.log('Email could not be sent');
            } else {
                console.log('Email has been sent:', info.response);
            }
        });
        res.redirect('/admin/userData')
    } catch (error) {
        console.log(error);
    }
}

const loadCoupons = async (req, res) => {
    try {
        const coupons = await couponSchema.find()
        res.render('coupons', { msg, message, coupons })
        msg = null
        message = null
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddCoupon = async (req, res) => {
    try {
        res.render('addCoupon', { msg, message })
        msg = null
        message = null
    } catch (error) {
        console.log(error.message);
    }
}



const addCoupon = async (req, res) => {
    try {
        const coupon = req.body

        const newCoupon = new couponSchema({
            couponName: coupon.Name,
            couponCode: coupon.Code,
            startDate: coupon.StartDate,
            endDate: coupon.endDate,
            maxDiscount: coupon.maxDiscount,
            minPurchase: coupon.minPurchase
        })
        await newCoupon.save()
        res.redirect('/admin/coupon')
        message = 'Coupon added successfully'
    } catch (error) {
        console.log(error.message);
    }
}

const loadEditCoupon = async (req, res) => {
    try {
        const id = req.query.id
        const coupon = await couponSchema.findOne({ _id: id })
        res.render('editCoupon', { coupon, msg })
        msg = null
    } catch (error) {
        console.log(error.message);
    }
}


/////////////// EDIT COUPON/////////////

const editCoupon = async (req, res) => {
    try {
        const coupon = req.body
        const id = req.query.id

        await couponSchema.updateOne({ _id: id }, { $set: { couponName: coupon.Name, couponCode: coupon.Code, startDate: coupon.StartDate, endDate: coupon.endDate, maxDiscount: coupon.maxDiscount, minPurchase: coupon.minPurchase } })
        res.redirect("/admin/coupon")
        message = 'Coupon edited successfully'
    } catch (error) {
        console.log(error.message);
    }
}


///////////////DELETE COUPON////////////

const deleteCoupon = async (req, res) => {
    try {
        const id = req.query.id

        await couponSchema.deleteOne({ _id: id })
        res.redirect('/admin/coupon')
        message = 'Coupon deleted successfully'
    } catch (error) {
        console.log(error.message);
    }
}

const loadCat = async (req, res) => {
    try {
        const offers = await offerSchema.find().populate('category');
        res.render('offer', { msg, message, offers: offers })
        msg = null
        message = null
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddOffer = async (req, res) => {
    try {
        const category = await categorySchema.find()
        res.render('addOffer', { msg, message, category })
        msg = null
        message = null
    } catch (error) {
        console.log(error.message);
    }
}

const addOffer = async (req, res) => {
    try {
        const { categoryId, maxDiscount, minPurchase } = req.body; 

        
        const existingOffer = await offerSchema.findOne({ category: categoryId });

        if (existingOffer) {
            
            return res.status(400).send('An offer already exists for this category');
        }
        const newOffer = new offerSchema({
            category: categoryId, 
            maxDiscount: maxDiscount,
            status: true,
            minPurchase: minPurchase
            
        });

        await newOffer.save();
        res.redirect('/admin/Offer');
        message = 'Offer added successfully';
    } catch (error) {
        console.log(error.message);
        res.status(500).send('An error occurred while adding the offer');
    }
};


const loadEditOffer = async (req, res) => {
    try {
        const id = req.query.id
        const offer = await offerSchema.findOne({ _id: id })
        const categories = await categorySchema.find()

        res.render('editOffer', { offer, msg, categories })
        msg = null
    } catch (error) {
        console.log(error.message);
    }
}

const editOffer = async (req, res) => {
    try {
        const { id } = req.query;
        const { categoryId, maxDiscount, minPurchase } = req.body;

        
        const existingOffer = await offerSchema.findById(id);

        if (!existingOffer) {
            return res.status(404).send('Offer not found');
        }
        const categoryHasOffer = await offerSchema.exists({ category: categoryId });

        
        const currentCategory = await categorySchema.findById(existingOffer.category);

        if (categoryHasOffer && currentCategory._id.toString() !== categoryId) {
            const referer = req.headers.referer || "/";
            res.redirect(referer);
            msg = 'Category already has an offer. Cannot apply offer to this category.';

        } else {

            
            existingOffer.category = categoryId;
            existingOffer.maxDiscount = maxDiscount;
            existingOffer.minPurchase = minPurchase;

            await existingOffer.save();

            res.redirect('/admin/Offer'); // Redirect to the offer management page
            message = 'Successfully Edited'
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('An error occurred while updating the offer');
    }
};

const deleteOffer = async (req, res) => {
    try {
        const id = req.query.id

        await offerSchema.deleteOne({ _id: id })
        res.redirect('/admin/offer')
        message = 'Offer deleted successfully'
    } catch (error) {
        console.log(error.message);
    }
}


const bannersPage = async (req, res) => {
    try {
        const banners = await bannerSchema.find()
        res.render('banners', { message, banners, msg })
        msg = null,
            message = null
    } catch (error) {
        console.log(error.message);
    }
}

////////LOAD ADD BANNER PAGE////////

const loadAddBanner = async (req, res) => {
    try {
        res.render('addBanner')
    } catch (error) {
        console.log(error.message);
    }
}


//////////ADD BANNER//////////

const addBanner = async (req, res) => {
    try {
        const ban = req.body
        const old = await bannerSchema.find()
        if (old.length == 0 || old == undefined) {
            const banner = new bannerSchema({
                heading1: ban.heading1,
                heading2: ban.heading2,
                heading3: ban.heading3,
                description1: ban.description1,
                description2: ban.description2,
                description3: ban.description3,
                image: req.file.filename
            })

            banner.save()
            res.redirect('/admin/banner')
            message = 'Banner added successfully'
        } else {
            res.redirect('/admin/banner')
            msg = 'There is already have a banner'
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadEditBanner = async (req, res) => {
    try {
        const id=req.query.id
        console.log(id);
        const banner = await bannerSchema.findOne({_id:id})
        console.log(banner)
        res.render('editBanner', { banner })
    } catch (error) {
        console.log(error.message);
    }
}

const editBanner = async (req, res) => {
    try {
        const {id} = req.query;
        const pro = req.body;
        console.log(id)
        const banner= await bannerSchema.findById(id)
        console.log(banner);
        await bannerSchema.updateOne({ _id: id}, {
            $set: {
                heading1:pro.heading1,
                heading2:pro.heading2,
                heading3:pro.heading3,
                description1:pro.description1,
                description2:pro.description2,
                description3:pro.description3,
            }
        })
        if(req.file){
            await bannerSchema.updateOne({_id : id},{
                $set:{
                    image: req.file.filename
                }
            })
        }
        res.redirect('/admin/banner');
        message = 'Banner updated successfully';
    } catch (error) {
        console.log(error.message);
    }
}






////////////DELETE BANNER/////////////////

const deleteBanner = async (req, res) => {
    try {
        const id = req.query.id
        await bannerSchema.deleteOne({ _id: id })
        res.redirect('/admin/banner')
        message = 'banner delted successfully'
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    loginLoad,
    adminLogin,
    loadAdminHome,
    loadSalesPage,
    adminLogOut,
    loadUserData,
    blockUser,
    unblockUser,
    loadCoupons,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    loadCat,
    loadAddOffer,
    addOffer,
    loadEditOffer,
    editOffer,
    deleteOffer,
    bannersPage,
    loadAddBanner,
    addBanner,
    loadEditBanner,
    editBanner,
    deleteBanner

}