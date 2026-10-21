const router = require('express').Router();
const c = require('../controllers/recommendController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/today', c.today);

module.exports = router;
