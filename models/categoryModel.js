const mongoose = require('mongoose')
const categorySchema = mongoose.Schema({
    category: {
        type: String,
        required: true
    },is_List:{
       type:Boolean,
       default:true 
    }, maxDiscount: {
        type: Number,
        
    }, status: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('category', categorySchema)