const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authService = require('../services/auth.service');
const User = require('../models/User');

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  success(res, { user, token }, 'Account created successfully', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  success(res, { user, token }, 'Logged in successfully');
});

exports.me = asyncHandler(async (req, res) => {
  success(res, { user: req.user }, 'Profile fetched');
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
  success(res, { user }, 'Profile updated successfully');
});
