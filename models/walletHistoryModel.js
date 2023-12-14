const mongoose = require('mongoose');

const walletHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    transactionType: {
        type: String,
        enum: [ 'Purchase', 'Refund', 'Referral Bonus', 'Other'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionDate: {
        type: Date,
        default: Date.now
    }
   
});

module.exports = mongoose.model('WalletHistory', walletHistorySchema);
