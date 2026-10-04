const router = require('express').Router();
const c = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(protect);
router.post('/initiate', validate(s.paymentInitiate), c.initiate);
router.post('/confirm', validate(s.paymentConfirm), c.confirm);
router.get('/', c.mine);

module.exports = router;
