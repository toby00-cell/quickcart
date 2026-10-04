const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const Payment = require('../models/Payment');
const paymentService = require('../services/payment.service');

exports.initiate = asyncHandler(async (req, res) =>
  success(res, await paymentService.initiate(req.user, req.body), 'Payment initiated', 201)
);

exports.confirm = asyncHandler(async (req, res) => {
  const { payment, order } = await paymentService.confirm(req.user, req.body);
  success(
    res,
    { payment, order },
    payment.status === 'success' ? 'Payment successful' : 'Payment failed. You can try again'
  );
});

exports.mine = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).populate('order', 'orderNumber totalAmount').sort('-createdAt');
  success(res, payments, 'Payments fetched');
});
