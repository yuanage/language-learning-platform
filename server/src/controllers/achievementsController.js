const { Badge, UserBadge, Checkin } = require('../models');
const { touchStudyActivity, addPoints, checkAndGrantBadges, buildUserStats } = require('../services/studyService');

// 全量徽章 + 获得状态
exports.list = async (req, res, next) => {
  try {
    const badges = await Badge.findAll({ order: [['id', 'ASC']] });
    const earned = await UserBadge.findAll({ where: { user_id: req.user.id } });
    const eMap = new Map(earned.map((e) => [e.badge_id, e.created_at]));
    res.json({
      badges: badges.map((b) => ({
        ...b.toJSON(),
        earned: eMap.has(b.id),
        earned_at: eMap.get(b.id) || null
      }))
    });
  } catch (err) { next(err); }
};

// 手动/前端触发徽章判定
exports.check = async (req, res, next) => {
  try {
    const newly = await checkAndGrantBadges(req.user.id);
    res.json({ new_badges: newly });
  } catch (err) { next(err); }
};

// 每日打卡：唯一约束防重复 → 积分 + streak
exports.checkin = async (req, res, next) => {
  try {
    const today = new Date();
    const dateStr = new Date(today.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    const [, created] = await Checkin.findOrCreate({
      where: { user_id: req.user.id, checkin_date: dateStr },
      defaults: { checkin_date: dateStr }
    });
    if (!created) {
      return res.json({ checked: false, message: '今天已打卡', streak_days: req.user.streak_days, total_points: req.user.total_points });
    }
    const user = await touchStudyActivity(req.user.id, 0);
    await addPoints(req.user.id, 5, '每日打卡', 'checkin', null);
    const newBadges = await checkAndGrantBadges(req.user.id);
    await user.reload();
    res.json({
      checked: true, streak_days: user.streak_days,
      total_points: user.total_points, new_badges: newBadges
    });
  } catch (err) { next(err); }
};

// 打卡记录（近 30 天，用于日历）
exports.history = async (req, res, next) => {
  try {
    const records = await Checkin.findAll({
      where: { user_id: req.user.id },
      order: [['checkin_date', 'DESC']],
      limit: 30
    });
    res.json({ dates: records.map((r) => r.checkin_date) });
  } catch (err) { next(err); }
};

// 用户学习统计（个人中心）
exports.stats = async (req, res, next) => {
  try {
    res.json({ stats: await buildUserStats(req.user.id) });
  } catch (err) { next(err); }
};
