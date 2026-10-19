const router = require('express').Router();
const c = require('../controllers/placementController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:language/questions', c.getQuestions);
router.post('/:language/submit', c.submit);
router.get('/:language/latest', c.latest);

module.exports = router;
