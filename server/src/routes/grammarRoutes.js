const router = require('express').Router();
const c = require('../controllers/grammarController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/lesson/:lessonId', c.byLesson);
router.post('/submit', c.submit);

module.exports = router;
