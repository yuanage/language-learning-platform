const router = require('express').Router();
const c = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', authMiddleware, c.me);
router.put('/profile', authMiddleware, c.updateProfile);

module.exports = router;
