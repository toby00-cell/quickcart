const router = require('express').Router();
const jwt = require('jsonwebtoken');
const c = require('../controllers/product.controller');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

// Public routes still recognise a logged-in admin (so admins can see inactive products)
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch (e) {
    // ignore invalid token on public routes
  }
  next();
};

router.get('/', optionalAuth, validate(s.productQuery, 'query'), c.list);
router.get('/:id', optionalAuth, validate(s.idParam, 'params'), c.get);
router.post('/', protect, authorize('admin'), validate(s.productCreate), c.create);
router.patch('/:id', protect, authorize('admin'), validate(s.idParam, 'params'), validate(s.productUpdate), c.update);
router.delete('/:id', protect, authorize('admin'), validate(s.idParam, 'params'), c.remove);

module.exports = router;
