const { Post, Comment, PostLike, Language, User } = require('../models');
const { Op } = require('sequelize');
const { addPoints, checkAndGrantBadges } = require('../services/studyService');

// 帖子列表（支持语言过滤 + 分页 + 是否已点赞）
exports.listPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(50, Number(req.query.page_size || 10));
    const where = {};
    if (req.query.language) {
      const lang = await Language.findOne({ where: { code: req.query.language } });
      if (lang) where.language_id = lang.id;
    }
    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] },
        { model: Language, as: 'Language', attributes: ['code', 'name', 'emoji'] }
      ],
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    const likes = await PostLike.findAll({ where: { user_id: req.user.id } });
    const likedSet = new Set(likes.map((l) => l.post_id));
    res.json({
      total: count,
      posts: rows.map((p) => ({ ...p.toJSON(), liked_by_me: likedSet.has(p.id) }))
    });
  } catch (err) { next(err); }
};

exports.createPost = async (req, res, next) => {
  try {
    const { title, content, language_id } = req.body || {};
    if (!title || !content) return res.status(400).json({ code: 400, message: '标题和内容必填' });
    const post = await Post.create({
      user_id: req.user.id,
      title: String(title).slice(0, 200),
      content: String(content).slice(0, 5000),
      language_id: language_id || null
    });
    await addPoints(req.user.id, 2, '发布帖子', 'post', post.id);
    const newBadges = await checkAndGrantBadges(req.user.id);
    res.status(201).json({ post: { ...post.toJSON(), author: { id: req.user.id, nickname: req.user.nickname } }, new_badges: newBadges });
  } catch (err) { next(err); }
};

// 帖子详情 + 评论
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] },
        { model: Language, as: 'Language', attributes: ['code', 'name', 'emoji'] }
      ]
    });
    if (!post) return res.status(404).json({ code: 404, message: '帖子不存在' });
    const comments = await Comment.findAll({
      where: { post_id: post.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['created_at', 'ASC']]
    });
    const liked = await PostLike.findOne({ where: { post_id: post.id, user_id: req.user.id } });
    res.json({ post: { ...post.toJSON(), liked_by_me: !!liked }, comments });
  } catch (err) { next(err); }
};

exports.createComment = async (req, res, next) => {
  try {
    const { post_id, content } = req.body || {};
    if (!post_id || !content) return res.status(400).json({ code: 400, message: '参数缺失' });
    const post = await Post.findByPk(post_id);
    if (!post) return res.status(404).json({ code: 404, message: '帖子不存在' });
    const comment = await Comment.create({
      post_id, user_id: req.user.id, content: String(content).slice(0, 1000)
    });
    await addPoints(req.user.id, 1, '发表评论', 'comment', comment.id);
    const newBadges = await checkAndGrantBadges(req.user.id);
    res.status(201).json({ comment: { ...comment.toJSON(), author: { id: req.user.id, nickname: req.user.nickname } }, new_badges: newBadges });
  } catch (err) { next(err); }
};

// 点赞（幂等：重复点赞无效）
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ code: 404, message: '帖子不存在' });
    const exists = await PostLike.findOne({ where: { post_id: post.id, user_id: req.user.id } });
    if (exists) return res.json({ liked: true, like_count: post.like_count, already: true });
    await PostLike.create({ post_id: post.id, user_id: req.user.id });
    await post.increment({ like_count: 1 });
    res.json({ liked: true, like_count: post.like_count + 1, already: false });
  } catch (err) { next(err); }
};
