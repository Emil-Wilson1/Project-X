const User = require('../models/userModel')
const productSchema = require('../models/productModel')
const cartSchema = require('../models/cartModel')
const orderSchema = require('../models/orderModel')
const salesSchema=require('../models/salesReport')
const couponSchema = require('../models/couponModel')
const path = require('path');
require('dotenv').config();

let msg;
let message;


const loadOrder = async (req, res) => {

    try {
        const users = await User.find()
        const usersLength = users.length
        const orders = await orderSchema.find().populate('userId').populate('item.product');
        res.render('order', { message, usersLength,orders,msg });
        message = null;
    } catch (error) {
        console.log(error);
    }

}

const loadPlaceOrder = async (req, res, next) => {
    try {
        const session = req.session.user_id
        let Total
        const pro = await cartSchema.findOne({ userId: session }, { _id: 0 })

        Total = parseInt(pro.totalPrice)

        res.render('placeOrder', { Total, session, msg, pro })
        msg = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


////////////CANCEL ORDER/////////

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.query.orderid
        await orderSchema.updateOne({ _id: orderId }, { $set: { admin_cancelled: true } })
        const orders = await orderSchema.findOne({ _id: orderId }).populate('item.product')
        orders.item.forEach(async (item) => {
            const productId = item.product._id
            const quantity = item.quantity
            await productSchema.updateOne({ _id: productId }, { $inc: { stocks: quantity } })
        });
        res.redirect('/admin/order')
        message = 'Orderd canelled successfully'
    } catch (error) {
        console.log(error.message);
    }
}


////////ORDER STATUS///////////

const orderStatus = async (req, res) => {
    try {
        const orderId = req.query.orderid
        const order = await orderSchema.findOne({ _id: orderId })
        if (order.is_delivered === false) {
            await orderSchema.updateOne({ _id: orderId }, { $set: { is_delivered: true, delivered_date: new Date().toLocaleDateString() } })
            const updatedOrder = await orderSchema.findOne({ _id: orderId })
            if (updatedOrder.is_delivered === true) {
                let product = []
                let totalprice = 0
                let soldCount = 0
                updatedOrder.item.forEach(item => {
                    product.push(item.product)
                    totalprice += item.price * item.quantity
                    soldCount += item.quantity
                });

                const newSalesReport = new salesSchema({
                    date: new Date(),
                    orders: updatedOrder._id,
                    products: product,
                    totalSales: updatedOrder.totalPrice,
                    totalItemsSold: parseInt(soldCount),
                    userId: updatedOrder.userId,
                    location: updatedOrder.address[0].city
                })
                await newSalesReport.save()

            }
            res.redirect('/admin/order')
            message = 'Orderd status changed successfully'
        }
    } catch (error) {
        console.log(error.message);
    }
}




module.exports={
    loadPlaceOrder,
    orderStatus,
    cancelOrder,
    loadOrder,
}
