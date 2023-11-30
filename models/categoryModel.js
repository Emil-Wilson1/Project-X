const mongoose = require('mongoose')
const categorySchema = mongoose.Schema({
    category: {
        type: String,
        required: true
    },is_List:{
       type:Boolean,
       default:true 
    }
})

module.exports = mongoose.model('category', categorySchema)