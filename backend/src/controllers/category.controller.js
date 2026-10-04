const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const Category = require('../models/Category');
const Product = require('../models/Product');

exports.list = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  success(res, categories, 'Categories fetched');
});

exports.create = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  success(res, category, 'Category created successfully', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new AppError('Category not found', 404);
  success(res, category, 'Category updated successfully');
});

exports.remove = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ category: req.params.id });
  if (inUse) throw new AppError('Cannot delete a category that still has products', 400);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  success(res, null, 'Category deleted successfully');
});
