const categorySchema = require('../models/categoryModel')
const productSchema = require('../models/productModel')
const sharp = require('sharp')
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { query } = require('express')
// let imageSrc=path.join(__dirname,'..','public','proImage','temp')
let msg
let message
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
        const category = await categorySchema.find({is_List:true})
        res.render('editProduct', { product: products, category: category, msg })
        msg = null
    } catch (error) {
        console.log(error);
    }
}

// LOAD ADD PRODUCT

const newProduct = async (req, res) => {
    try {
        const category = await categorySchema.find({is_List:true})
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
            res.redirect('/admin/products')

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
        const catId = await categorySchema.findOne({ category: prod.category,is_List:true})
        console.log(catId);
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

const singleRemove=async(req,res)=>{
    try {
        const index=req.body.index
        const id=req.body.id
        const productImage=await productSchema.findById(id)
        const image=productImage.image[index]
        const remove=await productSchema.updateOne({_id:id},{$pullAll:{image:[image]}})
        if(remove){
            res.json({success:true})
            res.redirect('/admin/editProduct')
        }else{
            res.redirect('/admin/editProduct')
        }
    } catch (error) {
        console.log(error.message)
    }
}







module.exports={
    newProduct,
    addProduct,
    loadProducts,
    deleteProduct,
    loadEditPage,
    editProduct,
    singleRemove,

}