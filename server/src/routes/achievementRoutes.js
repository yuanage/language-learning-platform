const router = require('express').Router();
const c = require('../controllers/achievementsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', c.list);
router.get('/history', c.history);
router.get('/stats', c.stats);
router.post('/check', c.check);
router.post('/checkin', c.checkin);

module.exports = router;
