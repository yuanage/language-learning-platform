const router = require('express').Router();
const c = require('../controllers/progressController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/overview', c.overview);
router.get('/points', c.pointsHistory);
router.post('/lesson/:lessonId/complete', c.completeLesson);

module.exports = router;
