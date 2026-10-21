// eslint-disable-next-line no-unused-vars
module.exports = function errorMiddleware(err, req, res, next) {
  console.error('[error]', err);
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ code: 409, message: '数据已存在（唯一约束冲突）' });
  }
  res.status(err.status || 500).json({ code: err.status || 500, message: err.message || '服务器内部错误' });
};
