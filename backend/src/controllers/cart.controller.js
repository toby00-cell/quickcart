const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const cart = require('../services/cart.service');

exports.get = asyncHandler(async (req, res) => success(res, await cart.getCart(req.user._id), 'Cart fetched'));

exports.add = asyncHandler(async (req, res) =>
  success(res, await cart.addItem(req.user._id, req.body.productId, req.body.quantity), 'Item added to cart', 201)
);

exports.update = asyncHandler(async (req, res) =>
  success(res, await cart.updateItem(req.user._id, req.params.productId, req.body.quantity), 'Cart updated')
);

exports.remove = asyncHandler(async (req, res) =>
  success(res, await cart.removeItem(req.user._id, req.params.productId), 'Item removed from cart')
);

exports.clear = asyncHandler(async (req, res) => success(res, await cart.clear(req.user._id), 'Cart cleared'));
