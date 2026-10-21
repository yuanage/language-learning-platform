const router = require('express').Router();
const c = require('../controllers/adminController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

router.use(authMiddleware, requireAdmin);

router.get('/overview', requireAdmin, c.overview);
router.get('/users', requireAdmin, c.listUsers);
router.put('/users/:id/role', requireAdmin, c.setUserRole);

module.exports = router;
