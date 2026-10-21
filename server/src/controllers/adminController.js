const { User, Post, Language } = require('../models');

// 用户列表（管理端）
exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Number(req.query.page_size || 20));
    const { rows, count } = await User.findAndCountAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
    res.json({ total: count, users: rows });
  } catch (err) { next(err); }
};

// 平台概览
exports.overview = async (req, res, next) => {
  try {
    const [userCount, postCount, langCount] = await Promise.all([
      User.count(), Post.count(), Language.count()
    ]);
    res.json({ users: userCount, posts: postCount, languages: langCount });
  } catch (err) { next(err); }
};

// 调整用户角色
exports.setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ code: 400, message: '角色非法' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    user.role = role;
    await user.save();
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { next(err); }
};
