const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User, Language } = require('../models');

const JWT_OPTS = { expiresIn: process.env.JWT_EXPIRES || '7d' };
const sign = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'llp_jwt_secret_2026', JWT_OPTS);

const sanitize = (u) => ({
  id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar,
  role: u.role, target_language: u.target_language, current_level: u.current_level,
  total_points: u.total_points, streak_days: u.streak_days, last_study_date: u.last_study_date
});

exports.register = async (req, res, next) => {
  try {
    const schema = Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      password: Joi.string().min(6).max(64).required(),
      nickname: Joi.string().min(1).max(50).required(),
      target_language: Joi.string().valid('en', 'ja', 'ko').allow(null, '')
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, message: error.details[0].message });

    const exists = await User.findOne({ where: { username: value.username } });
    if (exists) return res.status(409).json({ code: 409, message: '用户名已被注册' });
    const hash = await bcrypt.hash(value.password, 10);
    const user = await User.create({
      username: value.username,
      password_hash: hash,
      nickname: value.nickname,
      target_language: value.target_language || null
    });
    res.status(201).json({ token: sign(user), user: sanitize(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ code: 400, message: '用户名和密码必填' });
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    res.json({ token: sign(user), user: sanitize(user) });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const u = req.user;
    const lang = u.target_language ? await Language.findOne({ where: { code: u.target_language } }) : null;
    res.json({ user: { ...sanitize(u), target_language_name: lang ? lang.name : null, target_language_emoji: lang ? lang.emoji : null } });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const schema = Joi.object({
      nickname: Joi.string().min(1).max(50),
      avatar: Joi.string().max(255).allow(null, ''),
      target_language: Joi.string().valid('en', 'ja', 'ko').allow(null, '')
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, message: error.details[0].message });
    if (value.nickname !== undefined) req.user.nickname = value.nickname;
    if (value.avatar !== undefined) req.user.avatar = value.avatar;
    if (value.target_language !== undefined) req.user.target_language = value.target_language || null;
    await req.user.save();
    res.json({ user: sanitize(req.user) });
  } catch (err) { next(err); }
};
