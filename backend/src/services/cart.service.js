const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

const getOrCreate = async (userId) => (await Cart.findOne({ user: userId })) || Cart.create({ user: userId, items: [] });

// Shape the cart for the client: populated items + totals
const present = async (cart) => {
  await cart.populate('items.product', 'name price stock imageUrl isActive');
  const items = cart.items
    .filter((i) => i.product) // product may have been deleted
    .map((i) => ({
      product: i.product,
      quantity: i.quantity,
      subtotal: Number((i.product.price * i.quantity).toFixed(2)),
    }));
  const totalAmount = Number(items.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  return { id: cart._id, items, totalItems, totalAmount };
};

const getCart = async (userId) => present(await getOrCreate(userId));

const addItem = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError('Product not found', 404);

  const cart = await getOrCreate(userId);
  const existing = cart.items.find((i) => i.product.equals(productId));
  const newQty = (existing ? existing.quantity : 0) + quantity;
  if (newQty > product.stock) {
    throw new AppError(`Only ${product.stock} unit(s) of "${product.name}" available`, 400);
  }
  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  return present(cart);
};

const updateItem = async (userId, productId, quantity) => {
  const cart = await getOrCreate(userId);
  const item = cart.items.find((i) => i.product.equals(productId));
  if (!item) throw new AppError('Item not found in cart', 404);
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);
  if (quantity > product.stock) {
    throw new AppError(`Only ${product.stock} unit(s) of "${product.name}" available`, 400);
  }
  item.quantity = quantity;
  await cart.save();
  return present(cart);
};

const removeItem = async (userId, productId) => {
  const cart = await getOrCreate(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => !i.product.equals(productId));
  if (cart.items.length === before) throw new AppError('Item not found in cart', 404);
  await cart.save();
  return present(cart);
};

const clear = async (userId) => {
  const cart = await getOrCreate(userId);
  cart.items = [];
  await cart.save();
  return present(cart);
};

module.exports = { getCart, addItem, updateItem, removeItem, clear, getOrCreate };
