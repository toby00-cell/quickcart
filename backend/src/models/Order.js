const crypto = require('crypto');
const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at purchase time
    price: { type: Number, required: true }, // snapshot at purchase time
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // doubles as the public tracking code
    orderNumber: { type: String, unique: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      state: { type: String, required: true },
      lga: { type: String, required: true },
    },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

orderSchema.pre('validate', function genNumber(next) {
  if (!this.orderNumber) {
    this.orderNumber = `ND-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
Order.ORDER_STATUSES = ORDER_STATUSES;
module.exports = Order;
