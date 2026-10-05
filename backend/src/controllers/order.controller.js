const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const orderService = require('../services/order.service');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');

const listWith = async (baseFilter, q) => {
  const { page, limit, skip } = getPagination(q);
  const filter = { ...baseFilter };
  if (q.status) filter.status = q.status;
  if (q.search) filter.orderNumber = new RegExp(escapeRegex(q.search), 'i');
  if (q.from || q.to) {
    filter.createdAt = {};
    if (q.from) filter.createdAt.$gte = q.from;
    if (q.to) filter.createdAt.$lte = q.to;
  }
  const [items, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return { items, pagination: buildMeta(total, page, limit) };
};

exports.create = asyncHandler(async (req, res) => {
  const order = await orderService.createFromCart(req.user._id, req.body.shippingAddress);
  success(res, order, 'Order placed successfully', 201);
});

exports.mine = asyncHandler(async (req, res) =>
  success(res, await listWith({ user: req.user._id }, req.validatedQuery || {}), 'Orders fetched')
);

exports.get = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  // other customers' orders look like they don't exist
  if (!order || (req.user.role !== 'admin' && !order.user._id.equals(req.user._id))) {
    throw new AppError('Order not found', 404);
  }
  success(res, order, 'Order fetched');
});

exports.cancelMine = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.user.equals(req.user._id)) throw new AppError('Order not found', 404);
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(`An order that is ${order.status.replace(/_/g, ' ')} cannot be cancelled`, 400);
  }
  success(res, await orderService.cancel(order), 'Order cancelled');
});

// Public: look up an order by its tracking code (no login). Exposes no personal details.
exports.track = asyncHandler(async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const order = await Order.findOne({ orderNumber: code });
  if (!order) throw new AppError('No order was found with that tracking code', 404);
  success(
    res,
    {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      destination: `${order.shippingAddress.lga}, ${order.shippingAddress.state}`,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
    },
    'Order found'
  );
});

// ----- admin -----
exports.listAll = asyncHandler(async (req, res) =>
  success(res, await listWith({}, req.validatedQuery || {}), 'Orders fetched')
);

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  success(res, await orderService.updateStatus(order, req.body.status), 'Order status updated');
});

exports.stats = asyncHandler(async (req, res) => {
  const [orders, customers, products, revenueAgg, byStatus] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  success(
    res,
    {
      orders,
      customers,
      products,
      revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
      ordersByStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    },
    'Stats fetched'
  );
});
