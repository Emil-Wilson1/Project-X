const categorySchema = require('../models/categoryModel')
const productSchema = require('../models/productModel')
const path = require('path');
require('dotenv').config();

let msg
let message

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
        const delCat = req.query.id;
        const product = await productSchema.findOne({ category: delCat });
        const category = await categorySchema.findOne({ _id: delCat });

        if (product) {
            res.redirect('/admin/Category');
            msg = 'Category used in product';
        } else {
            if (category && category.is_List === true) {
                await categorySchema.updateOne({ _id: delCat }, { $set: { is_List: false } });
                res.redirect('/admin/Category');
                message = 'Category deleted successfully';
            } else if (category && category.is_List === false) {
                await categorySchema.updateOne({ _id: delCat }, { $set: { is_List: true } });
                res.redirect('/admin/Category');
                message = 'Category Listed successfully';
            } else {
                res.redirect('/admin/Category');
                message = 'Category not found';
            }
        }
    } catch (error) {
        console.log(error);
    }
};







module.exports={
    addCategory,
    categoryManage,
    editCategory,
    categoryDelete,
    loadEditCategory,
    loadAddCategory,

}