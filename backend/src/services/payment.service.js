const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

// Simulated gateway: initiate creates a pending payment with a reference,
// confirm settles it as success or failed (stands in for a gateway callback).
const initiate = async (user, { orderId, method }) => {
  const order = await Order.findById(orderId);
  if (!order || !order.user.equals(user._id)) throw new AppError('Order not found', 404);
  if (order.status === 'cancelled') throw new AppError('This order has been cancelled', 400);
  if (order.paymentStatus === 'paid') throw new AppError('This order has already been paid', 400);

  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    reference: `PAY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    amount: order.totalAmount,
    method,
  });
  return payment;
};

const confirm = async (user, { reference, outcome }) => {
  const payment = await Payment.findOne({ reference });
  if (!payment || !payment.user.equals(user._id)) throw new AppError('Payment not found', 404);
  if (payment.status !== 'pending') throw new AppError(`This payment is already ${payment.status}`, 400);

  const order = await Order.findById(payment.order);
  if (!order) throw new AppError('Order not found', 404);

  if (outcome === 'success') {
    if (order.paymentStatus === 'paid') throw new AppError('This order has already been paid', 400);
    if (order.status === 'cancelled') throw new AppError('This order has been cancelled', 400);
    payment.status = 'success';
    payment.paidAt = new Date();
    order.paymentStatus = 'paid';
    // a paid order is automatically confirmed by the kitchen
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed' });
    }
  } else {
    payment.status = 'failed';
    if (order.paymentStatus !== 'paid') order.paymentStatus = 'failed';
  }
  await payment.save();
  await order.save();
  return { payment, order };
};

module.exports = { initiate, confirm };
