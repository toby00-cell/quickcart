const router = require('express').Router();
const c = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.get('/', c.list);
router.post('/', protect, authorize('admin'), validate(s.category), c.create);
router.patch('/:id', protect, authorize('admin'), validate(s.idParam, 'params'), validate(s.category.partial()), c.update);
router.delete('/:id', protect, authorize('admin'), validate(s.idParam, 'params'), c.remove);

module.exports = router;
