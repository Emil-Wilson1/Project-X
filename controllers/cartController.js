const User = require('../models/userModel')
const categoryModel = require('../models/categoryModel')
const cartSchema=require('../models/cartModel')
const productSchema = require('../models/productModel')
const path = require('path');
require('dotenv').config();

let message
let msg



///////LOADING HOME PAGE////////

const loadHome = async (req, res, next) => {
    try {
        let session = req.session.user_id
        const products = await productSchema.find({ is_show: true }).sort({ _id: -1 }).limit(4)

        res.render('home', { product: products, session, msg, message })
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


// LOAD CART
const loadCart = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const cartProducts = await cartSchema.findOne({ userId: session }).populate('item.product')
        let totalPrice = 0
        if (cartProducts && cartProducts.item != null) {
            cartProducts.item.forEach(value => totalPrice += value.price * value.quantity);
        }
        await cartSchema.updateOne({ userId: session }, { $set: { totalPrice: totalPrice } })
        res.render('cart', { session, cartProducts, totalPrice,msg,})
        msg = null
    } catch (error) {
        console.log(error);
        next(error.message)
    }
}

// ADD TO CART
const addToCart = async (req, res, next) => {
    try {
        const product_Id = req.query.id
        const user_Id = req.session.user_id

        const product = await productSchema.findOne({ _id: new Object(product_Id) })
        const userCart = await cartSchema.findOne({ userId: user_Id });
        const cartCount = await cartSchema.findOne({ userId: user_Id, "item.product": product_Id })
        const wishList = await User.findOne({ _id: user_Id })

        if (userCart) {
            const itemIndex = userCart.item.findIndex(item => item.product._id.toString() === product_Id);
            if (itemIndex >= 0) {
                if (cartCount) {
                    const item = cartCount.item.find(item => item.product.toString() === product_Id)
                    if (item) {
                        if (item.quantity >= product.stocks) {
                            const referer = req.headers.referer || "/";
                            res.redirect(referer);
                            msg = 'Item out of stock'
                        } else {
                            await cartSchema.updateOne({ userId: user_Id, "item.product": product_Id }, { $inc: { "item.$.quantity": 1 } });
                        }
                    }
                }
            } else {
                if (product.stocks < 1) {
                    const referer = req.headers.referer || "/";
                    res.redirect(referer);
                    msg = 'Item out of stock'
                } else {

                    await cartSchema.updateOne(
                        { userId: user_Id },
                        { $push: { item: { product: product_Id, price: product.price, quantity: 1 } } }
                    );
                    if (wishList.wishlist.includes(product_Id)) {
                        wishList.wishlist.pull(product_Id);
                        await wishList.save();
                    }
                }
            }
        } else {
            if (product.stocks < 1) {
                const referer = req.headers.referer || "/";
                res.redirect(referer);
                msg = 'Item out of stock'
            } else {
                await cartSchema.insertMany({ userId: user_Id, item: [{ product: product_Id, price: product.price, quantity: 1 }] });
                if (wishList.wishlist.includes(product_Id)) {
                    await User.updateOne({ _id: user_Id }, { $unset: { wishlist: product_Id } })
                }
            }
        }

        const referer = req.headers.referer || "/";
        res.redirect(referer);
        message = 'Item successfully added'

    } catch (error) {
        console.log(error);
        next(error.message)
    }
}



const incrementCart = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const itemid = req.query.id;
        const cartCount = await cartSchema.findOne({ 'item._id': itemid })
        const item = cartCount.item.find(item => item._id.toString() === itemid)
        const product = await productSchema.findOne({ _id: item.product })
        if (item) {
            if (item.quantity >= product.stocks) {
                msg = 'Item out of stock'
                res.redirect('/cart');
            } else {
                await cartSchema.updateOne({ userId: userId, "item._id": itemid }, { $inc: { "item.$.quantity": 1 } });
                let total = 0
                const cart = await cartSchema.findOne({ userId: userId, "item._id": itemid })

                cart.item.forEach(value => {
                    total += value.price * value.quantity
                })
                await cartSchema.updateOne({ userId: userId }, { $set: { totalPrice: total } })

                const carts = await cartSchema.findOne({ userId: userId, "item._id": itemid })

                const q = carts.item.filter((value) => {
                    return value._id == itemid
                })
                const quantity = q[0].quantity
                const price = quantity * q[0].price
                const totalPrice = carts.totalPrice
                res.json({ quantity: quantity, price: price, totalPrice: totalPrice })
            }
        }

    } catch (error) {
        console.log(error);
        next(error.message)
    }
};

//////DECREMETN CART////////

const decrementCart = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const itemid = req.query.id;
        const cart = await cartSchema.findOne({ userId: userId, "item._id": itemid });
        const currentItem = cart.item.find(item => item._id.toString() === itemid);
        if (currentItem.quantity <= 1) {
            res.redirect('/cart');
            return;
        } else {
            await cartSchema.updateOne({ userId: userId, "item._id": itemid, }, { $inc: { "item.$.quantity": -1 } });
            let total = 0
            const cart = await cartSchema.findOne({ userId: userId, "item._id": itemid })

            cart.item.forEach(value => {
                total += value.price * value.quantity
            })
            await cartSchema.updateOne({ userId: userId }, { $set: { totalPrice: total } })

            const carts = await cartSchema.findOne({ userId: userId, "item._id": itemid })

            const q = carts.item.filter((value) => {
                return value._id == itemid
            })
            const quantity = q[0].quantity
            const price = quantity * q[0].price
            const totalPrice = carts.totalPrice
            res.json({ quantity: quantity, price: price, totalPrice: totalPrice })
        }
    } catch (error) {
        console.log(error);
        next(error.message)
    }
}

//////REMOVE FROM CART////////

const removeCart = async (req, res, next) => {
    try {
        const id = req.query.id
        const userId = req.session.user_id
        await cartSchema.updateOne({ userId: new Object(userId) }, { $pull: { item: { _id: new Object(id) } } })
        res.redirect('/cart')
    } catch (error) {
        console.log(error);
        next(error.message)
    }

}


///////////LOAD WISHLIST//////////////

const loadWishList = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const wishlist = await User.findOne({ _id: session }).populate('wishlist')
        res.render('wishList', { session, wishlist, message })
        message = null
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

//////////ADD TO WISHLIST////////////

const addToWishlist = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const productId = req.query.id
        const user = await User.findOne({ _id: session })
        const cart = await cartSchema.findOne({ userId: session, "item.product": productId })
        if (cart) {
            msg = 'product already in cart'
            const referer = req.headers.referer || "/";
            res.redirect(referer);
        } else {
            if (!user.wishlist.includes(productId)) {
                user.wishlist.push(productId)
                await user.save()
                const referer = req.headers.referer || "/";
                res.redirect(referer);
                message = 'Item added to wishlist'
            } else {
                const referer = req.headers.referer || "/";
                res.redirect(referer);
                msg = 'Item already in wishist'
            }
        }

    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}

/////////////REMOVE FROM WISHLIST//////

const removeWishlist = async (req, res, next) => {
    try {
        const session = req.session.user_id
        const product = req.query.id
        const del = await User.findOne({ _id: session })
        del.wishlist.pull(product);
        await del.save();
        res.redirect('/wishlist')
    } catch (error) {
        console.log(error.message);
        next(error.message)
    }
}


module.exports={
    loadCart,
    addToCart,
    incrementCart,
    decrementCart,
    removeCart,
    loadWishList,
    addToWishlist,
    removeWishlist,
    loadHome,
    productDetails,
    loadShopPage,
}