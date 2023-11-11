const userSchema = require('../models/userModel')
const categorySchema = require('../models/categoryModel')
const productSchema = require('../models/productModel')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const sharp = require('sharp')
const path = require('path');
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

        res.render('home', { message, usersLength });
        message = null;
    } catch (error) {
        console.log(error);
    }

}

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
        res.redirect('/logOutIn')
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

// SHOW PRODUCTS

const loadProducts = async (req, res) => {
    try {
        let search = ''
        if (req.query.search) {
            search = req.query.search
        }
        var page = 1
        if (req.query.page) {
            page = req.query.page
        }

        const limit = 4
        const products = await productSchema.find(
            {
                $or: [
                    { title: { $regex: '.*' + search + '.*', $options: 'i' } },
                    { brand: { $regex: '.*' + search + '.*', $options: 'i' } }
                ]
            }).limit(limit).skip((page - 1) * limit).populate('category').exec();

        const count = await productSchema.find(
            {
                $or: [
                    { title: { $regex: '.*' + search + '.*', $options: 'i' } },
                    { brand: { $regex: '.*' + search + '.*', $options: 'i' } }
                ]
            }).countDocuments()
        res.render('products', { product: products, message, totalPages: Math.ceil(count / limit) })
        message = null
    } catch (error) {
        console.log(error);
    }
}

// DELETE PRODUCT

const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id
        const product = await productSchema.findOne({ _id: id })
        if (product.is_show === true) {
            await productSchema.updateOne({ _id: new Object(id) }, { $set: { is_show: false } })
            res.redirect('/admin/products')
            message = 'Product Unlisted successfully'
        } else {
            await productSchema.updateOne({ _id: new Object(id) }, { $set: { is_show: true } })
            res.redirect('/admin/products')
            message = 'Product Listed successfully'
        }
    } catch (error) {
        console.log(error);
    }
}
// LOAD EDIT PRODUCT PAGE

const loadEditPage = async (req, res) => {
    try {
        const id = req.query.id
        const products = await productSchema.findOne({ _id: new Object(id) }).populate('category')
        const category = await categorySchema.find()
        res.render('editProduct', { product: products, category: category, msg })
        msg = null
    } catch (error) {
        console.log(error);
    }
}

// LOAD ADD PRODUCT

const newProduct = async (req, res) => {
    try {
        const category = await categorySchema.find()
        res.render('addProduct', { category: category, message, msg })
        message = null
        msg = null
    } catch (error) {
        console.log(error);
    }
}

// ADD PRODUCT

const addProduct = async (req, res) => {
    try {
        const pro = req.body

        if (pro.title.trim().length == 0 || pro.brand.trim().length == 0 || pro.description.trim().length == 0 || req.files == 0) {
            msg = 'Full field should be filled'
            res.redirect('/admin/addProduct')
        } else {

            let image = req.files.map(file => file);
            for (i = 0; i < image.length; i++) {
                let path = image[i].path
                const processImage = new Promise((resolve, reject) => {
                    sharp(path).rotate().resize(270, 360).toFile('public/proImage/' + image[i].filename, (err) => {
                        sharp.cache(false);
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            console.log(`Processed file: ${path}`);
                            resolve();
                        }
                    })
                });
                processImage.then(() => {
                    fs.unlink(path, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(`Deleted file: ${path}`);
                        }
                    });
                }).catch((err) => {
                    console.log(err);
                });
            }

            const product = new productSchema({
                title: pro.title,
                brand: pro.brand,
                stocks: pro.stocks,
                price: pro.price,
                description: pro.description,
                category: pro.category,
                image: req.files.map(file => file.filename)
            })
            await product.save()

            message = 'Product added successfully'
            res.redirect('/admin/addProduct')

        }
    } catch (error) {
        console.log(error);
    }
}
// EDIT PRODUCTS

const editProduct = async (req, res) => {
    try {
        const prod = req.body
        const id = req.query.id
        const catId = await categorySchema.findOne({ category: prod.category })
        if (prod.title.trim().length == 0 || prod.price.trim().length == 0 || prod.stocks.trim().length == 0 || prod.category.length == 0 || prod.brand.trim().length == 0 || prod.description.trim().length == 0) {
            msg = 'Full field should be filled'
            res.redirect('/admin/products')
        } else {
            let newprod;
            if (req.files.length !== 0) {
                let image = req.files.map(file => file);
                for (i = 0; i < image.length; i++) {
                    let path = image[i].path
                    const processImage = new Promise((resolve, reject) => {
                        sharp(path).rotate().resize(270, 360).toFile('public/proImage/' + image[i].filename, (err) => {
                            sharp.cache(false);
                            if (err) {
                                console.log(err);
                                reject(err);
                            } else {
                                console.log(`Processed file: ${path}`);
                                resolve();
                            }
                        })
                    });
                    processImage.then(() => {
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`Deleted file: ${path}`);
                            }
                        });
                    }).catch((err) => {
                        console.log(err);
                    });

                }
                newprod = await productSchema.updateOne({ _id: new Object(id) }, {
                    $set: {
                        title: prod.title,
                        brand: prod.brand,
                        description: prod.description,
                        category: catId._id,
                        stocks: prod.stocks,
                        price: prod.price,
                        image: req.files.map(file => file.filename)
                    }
                })
            } else {
                newprod = await productSchema.updateOne({ _id: new Object(id) }, {
                    $set: {
                        title: prod.title,
                        brand: prod.brand,
                        description: prod.description,
                        category: catId._id,
                        stocks: prod.stocks,
                        price: prod.price,
                    }
                })
            }
            message = 'Product edited successfully'
            res.redirect('/admin/products')
        }
    } catch (error) {
        console.log(error);
    }
}

//LOAD ADD CATEGORY

const loadAddCategory = async (req, res) => {
    try {
        res.render('addCategory', { msg })
        msg = null
    } catch (error) {
        console.log(error.message);
    }
}

// ADD CATEGORY

const addCategory = async (req, res) => {
    const newCat = req.body.newcategory
    const category = categorySchema({
        category: newCat
    })
    const checkCat = await categorySchema.findOne({ category: newCat })
    if (newCat.trim().length === 0) {
        res.redirect('/admin/addCategory')
        msg = 'Please fill submited area'
    } else {
        if (checkCat) {
            res.redirect('/admin/addCategory')
            msg = 'Category already exist'
        } else {
            const cat = await category.save()
            res.redirect('/admin/Category')
            message = 'Category added successfully'
        }
    }
}
// LOAD EDIT CATEGORY PAGE

const loadEditCategory = async (req, res) => {
    try {
        const id = req.query.id
        const category = await categorySchema.findOne({ _id: id })
        res.render('editCategory', { category, msg })
        msg = null
    } catch (error) {
        console.log(error.message);
    }
}

// EDIT CATEGORY

const editCategory = async (req, res) => {
    try {
        const Cat = req.query.id
        const newCat = req.body.newcategory
        const checkNew = await categorySchema.findOne({ category: newCat })
        if (checkNew) {
            res.redirect("/admin/Category")
            msg = 'New edited category already exist'
        } else {
            await categorySchema.updateOne({ _id: Cat }, { $set: { category: newCat } })
            message = 'Category updated successfully'
            res.redirect('/admin/Category')
        }

    } catch (error) {
        console.log(error);
    }
}

// CATEGORY MANAGE

const categoryManage = async (req, res) => {
    try {
        const category = await categorySchema.find()
        res.render('categoryManage', { category: category, msg, message })
        msg = null
        message = null
    } catch (error) {
        console.log(error);
    }
}
// DELETE CATEGORY

const categoryDelete = async (req, res) => {
    try {
        const delCat = req.query.id
        const product = await productSchema.findOne({ category: delCat })
        if (product) {
            res.redirect('/admin/Category')
            msg = 'Category used in product'
        } else {
            await categorySchema.deleteOne({ _id: delCat })
            res.redirect('/admin/Category')
            message = 'Category deleted successfully'
        }
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    loginLoad,
    adminLogin,
    loadAdminHome,
    adminLogOut,
    loadUserData,
    blockUser,
    unblockUser,
    newProduct,
    addCategory,
    addProduct,
    loadProducts,
    deleteProduct,
    loadEditPage,
    editProduct,
    categoryManage,
    editCategory,
    categoryDelete,
    loadEditCategory,
    loadAddCategory,

}