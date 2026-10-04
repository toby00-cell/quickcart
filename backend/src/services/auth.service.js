const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async ({ name, email, password, phone }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('An account with this email already exists', 409);
  // role is never taken from the request: public sign-ups are always customers
  const user = await User.create({ name, email, password, phone, role: 'customer' });
  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  return { user, token: signToken(user) };
};

module.exports = { register, login, signToken };
