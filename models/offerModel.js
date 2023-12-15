const mongoose = require('mongoose')
const offerSchema = mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }, maxDiscount: {
        type: Number,
        required: true
    }, minPurchase: {
        type: Number,
        required: true
    },status: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('offer', offerSchema)