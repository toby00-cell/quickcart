const router = require('express').Router();
const c = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(protect);
router.get('/', c.get);
router.delete('/', c.clear);
router.post('/items', validate(s.cartAdd), c.add);
router.patch('/items/:productId', validate(s.productIdParam, 'params'), validate(s.cartUpdate), c.update);
router.delete('/items/:productId', validate(s.productIdParam, 'params'), c.remove);

module.exports = router;
