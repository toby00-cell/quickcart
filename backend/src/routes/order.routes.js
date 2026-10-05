const router = require('express').Router();
const c = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

// public tracking (declared before the login wall)
router.get('/track/:code', validate(s.trackParam, 'params'), c.track);

router.use(protect);

// admin (declared before '/:id' so they are not captured by it)
router.get('/admin/all', authorize('admin'), validate(s.orderQuery, 'query'), c.listAll);
router.get('/admin/stats', authorize('admin'), c.stats);
router.patch('/:id/status', authorize('admin'), validate(s.idParam, 'params'), validate(s.orderStatus), c.updateStatus);

// customer
router.post('/', validate(s.checkout), c.create);
router.get('/', validate(s.orderQuery, 'query'), c.mine);
router.get('/:id', validate(s.idParam, 'params'), c.get);
router.patch('/:id/cancel', validate(s.idParam, 'params'), c.cancelMine);

module.exports = router;
