const router = require('express').Router();
const c = require('../controllers/vocabController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/learn', c.learn);
router.get('/review/today', c.dueToday);
router.post('/review', c.review);
router.get('/lesson/:lessonId', c.byLesson);

module.exports = router;
