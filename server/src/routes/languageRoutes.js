const router = require('express').Router();
const c = require('../controllers/languagesController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', c.list);
router.get('/:code/tree', c.tree);
router.get('/stats/overview', c.stats);

module.exports = router;
