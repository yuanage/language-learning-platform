const router = require('express').Router();
const c = require('../controllers/communityController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/posts', c.listPosts);
router.post('/posts', c.createPost);
router.get('/posts/:id', c.getPost);
router.post('/posts/:id/like', c.likePost);
router.post('/comments', c.createComment);

module.exports = router;
