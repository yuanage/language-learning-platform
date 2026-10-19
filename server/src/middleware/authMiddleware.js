const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ code: 401, message: '未登录或凭证缺失' });
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'llp_jwt_secret_2026');
    } catch (e) {
      return res.status(401).json({ code: 401, message: '凭证无效或已过期' });
    }
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ code: 401, message: '用户不存在' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
  next();
};

module.exports = { authMiddleware, requireAdmin };
