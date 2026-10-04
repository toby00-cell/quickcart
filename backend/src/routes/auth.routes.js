const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.post('/register', validate(s.register), c.register);
router.post('/login', validate(s.login), c.login);
router.get('/me', protect, c.me);
router.patch('/me', protect, validate(s.updateProfile), c.updateMe);

module.exports = router;
