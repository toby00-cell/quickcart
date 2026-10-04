const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    method: { type: String, enum: ['card', 'bank_transfer', 'pay_on_delivery'], default: 'card' },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
