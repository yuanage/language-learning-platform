const {
  User, StudyLog, PointRecord, UserBadge, Badge,
  UserLessonProgress, VocabReview
} = require('../models');
const { Sequelize } = require('../models');

const localDateStr = (d = new Date()) => {
  // 服务器 TZ 固定 Asia/Shanghai；本地运行时也按 +08:00 计算，保证 streak 不漂移
  const t = new Date(d.getTime() + 8 * 3600 * 1000);
  return t.toISOString().slice(0, 10);
};

// 学习动作触达：更新连续学习天数 + 当日学习日志
async function touchStudyActivity(userId, minutes = 2) {
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 24 * 3600 * 1000));
  const user = await User.findByPk(userId);
  if (!user) return null;
  if (user.last_study_date === today) {
    // 今天已学习，streak 不变
  } else if (user.last_study_date === yesterday) {
    user.streak_days = (user.streak_days || 0) + 1;
  } else {
    user.streak_days = 1;
  }
  user.last_study_date = today;
  await user.save();
  const [log, created] = await StudyLog.findOrCreate({
    where: { user_id: userId, study_date: today },
    defaults: { study_minutes: minutes, action_count: 1 }
  });
  if (!created) {
    await log.increment({ study_minutes: minutes, action_count: 1 });
  }
  return user;
}

// 加积分并写流水
async function addPoints(userId, delta, reason, refType = null, refId = null) {
  if (!delta) return;
  await PointRecord.create({ user_id: userId, delta, reason, ref_type: refType, ref_id: refId });
  await User.increment({ total_points: delta }, { where: { id: userId } });
}

// 标记课时子模块完成（vocab/grammar/listening/speaking）
const MODULE_KEYS = ['vocab', 'grammar', 'listening', 'speaking'];
async function markLessonModule(userId, lessonId, moduleKey) {
  if (!MODULE_KEYS.includes(moduleKey)) return null;
  const [row] = await UserLessonProgress.findOrCreate({
    where: { user_id: userId, lesson_id: lessonId },
    defaults: { status: 1, sub_status: { [moduleKey]: true } }
  });
  const sub = typeof row.sub_status === 'string' ? JSON.parse(row.sub_status || '{}') : { ...(row.sub_status || {}) };
  if (!sub[moduleKey]) {
    sub[moduleKey] = true;
    // 用静态 update 强制写入（实例 save 对 JSON 字段可能检测不到变更）
    await UserLessonProgress.update(
      { sub_status: sub, status: row.status === 0 ? 1 : row.status },
      { where: { id: row.id } }
    );
    return await UserLessonProgress.findByPk(row.id);
  }
  return row;
}

// 是否四模块全部完成
function allModulesDone(progressRow) {
  if (!progressRow) return false;
  const sub = typeof progressRow.sub_status === 'string'
    ? JSON.parse(progressRow.sub_status || '{}') : (progressRow.sub_status || {});
  return MODULE_KEYS.every((k) => sub[k]);
}

// 徽章判定：检查所有未获得徽章，条件满足则授予
async function checkAndGrantBadges(userId) {
  const earned = await UserBadge.findAll({ where: { user_id: userId } });
  const earnedIds = new Set(earned.map((e) => e.badge_id));
  const badges = await Badge.findAll();
  const newly = [];

  const stats = await buildUserStats(userId);
  for (const b of badges) {
    if (earnedIds.has(b.id)) continue;
    const c = typeof b.criteria === 'string' ? JSON.parse(b.criteria) : b.criteria;
    if (!c || !c.type) continue;
    const value = stats[c.type] || 0;
    const target = c.count || c.days || 0;
    if (value >= target) {
      await UserBadge.create({ user_id: userId, badge_id: b.id });
      if (b.points) await addPoints(userId, b.points, `获得徽章「${b.name}」`, 'badge', b.id);
      newly.push(b);
    }
  }
  return newly;
}

async function buildUserStats(userId) {
  const user = await User.findByPk(userId);
  const lessonsCompleted = await UserLessonProgress.count({ where: { user_id: userId, status: 2 } });
  const vocabLearned = await VocabReview.count({ where: { user_id: userId } });
  const reviewsCorrect = await VocabReview.sum('correct_count', { where: { user_id: userId } }) || 0;
  const { Post, Comment } = require('../models');
  const posts = await Post.count({ where: { user_id: userId } });
  const comments = await Comment.count({ where: { user_id: userId } });
  return {
    lessons_completed: lessonsCompleted,
    vocab_learned: vocabLearned,
    reviews_correct: reviewsCorrect,
    posts,
    comments,
    streak: user ? user.streak_days : 0,
    points: user ? user.total_points : 0
  };
}

module.exports = { localDateStr, touchStudyActivity, addPoints, markLessonModule, allModulesDone, checkAndGrantBadges, buildUserStats };
