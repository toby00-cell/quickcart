const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
};

exports.list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery || {};
  const { page, limit, skip } = getPagination(q);

  const filter = {};
  // customers only see active products; admins can see everything
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isAdmin) filter.isActive = true;
  if (q.category) filter.category = q.category;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.price = {};
    if (q.minPrice !== undefined) filter.price.$gte = q.minPrice;
    if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice;
  }

  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort(SORTS[q.sort] || SORTS.newest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  success(res, { items, pagination: buildMeta(total, page, limit) }, 'Products fetched');
});

exports.get = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  const isAdmin = req.user && req.user.role === 'admin';
  if (!product || (!product.isActive && !isAdmin)) throw new AppError('Product not found', 404);
  success(res, product, 'Product fetched');
});

exports.create = asyncHandler(async (req, res) => {
  if (!(await Category.exists({ _id: req.body.category }))) throw new AppError('Category not found', 404);
  const product = await Product.create(req.body);
  success(res, product, 'Product created successfully', 201);
});

exports.update = asyncHandler(async (req, res) => {
  if (req.body.category && !(await Category.exists({ _id: req.body.category }))) {
    throw new AppError('Category not found', 404);
  }
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new AppError('Product not found', 404);
  success(res, product, 'Product updated successfully');
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  success(res, null, 'Product deleted successfully');
});
