const router = require('express').Router();
const c = require('../controllers/lessonsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:id/detail', c.detail);

module.exports = router;
