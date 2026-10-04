const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');

// Allowed admin transitions
const TRANSITIONS = {
  pending: ['cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const restock = async (items) => {
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
  );
};

// Create an order from the user's cart. Stock is reserved atomically per product;
// if any line fails, everything reserved so far is put back.
const createFromCart = async (userId, shippingAddress) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) throw new AppError('Your cart is empty', 400);

  const reserved = [];
  const lines = [];
  try {
    for (const item of cart.items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!product) {
        const p = await Product.findById(item.product);
        const name = p ? p.name : 'A product in your cart';
        throw new AppError(
          p && p.isActive ? `Not enough stock for "${name}" (only ${p.stock} left)` : `"${name}" is no longer available`,
          400
        );
      }
      reserved.push({ product: product._id, quantity: item.quantity });
      lines.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: Number((product.price * item.quantity).toFixed(2)),
      });
    }

    const totalAmount = Number(lines.reduce((s, l) => s + l.subtotal, 0).toFixed(2));
    const order = await Order.create({
      user: userId,
      items: lines,
      totalAmount,
      shippingAddress,
      statusHistory: [{ status: 'pending' }],
    });

    cart.items = [];
    await cart.save();
    return order;
  } catch (err) {
    await restock(reserved);
    throw err;
  }
};

const cancel = async (order) => {
  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    throw new AppError(`An order that is ${order.status} cannot be cancelled`, 400);
  }
  await restock(order.items);
  order.status = 'cancelled';
  if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
  order.statusHistory.push({ status: 'cancelled' });
  await order.save();
  return order;
};

const updateStatus = async (order, status) => {
  if (status === 'cancelled') return cancel(order);
  if (!TRANSITIONS[order.status].includes(status)) {
    throw new AppError(`Cannot change order from "${order.status}" to "${status}"`, 400);
  }
  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  return order;
};

module.exports = { createFromCart, cancel, updateStatus, TRANSITIONS };
