const {
  Language, Level, Course, Lesson, UserLessonProgress, StudyLog,
  GrammarAttempt, SpeakingRecord, PointRecord, UserBadge, Badge
} = require('../models');
const { Op } = require('sequelize');
const { allModulesDone, addPoints, touchStudyActivity, checkAndGrantBadges } = require('../services/studyService');
const { sequelize } = require('../models');

// 总览：各语言完成率、近 7 天学习时长、积分、徽章
exports.overview = async (req, res, next) => {
  try {
    const langs = await Language.findAll({ order: [['sort', 'ASC']] });
    const result = [];
    for (const lang of langs) {
      const levels = await Level.findAll({ where: { language_id: lang.id } });
      const levelIds = levels.map((l) => l.id);
      const courses = levelIds.length ? await Course.findAll({ where: { level_id: { [Op.in]: levelIds } } }) : [];
      const courseIds = courses.map((c) => c.id);
      const totalLessons = courseIds.length ? await Lesson.count({ where: { course_id: { [Op.in]: courseIds } } }) : 0;
      const lessonIdList = totalLessons
        ? (await Lesson.findAll({ where: { course_id: { [Op.in]: courseIds } }, attributes: ['id'] })).map((l) => l.id)
        : [];
      const done = lessonIdList.length ? await UserLessonProgress.count({
        where: { user_id: req.user.id, status: 2, lesson_id: { [Op.in]: lessonIdList } }
      }) : 0;
      result.push({
        language: { code: lang.code, name: lang.name, emoji: lang.emoji },
        total_lessons: totalLessons,
        completed_lessons: done,
        percent: totalLessons ? Math.round((done / totalLessons) * 100) : 0
      });
    }

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const logs = await StudyLog.findAll({
      where: { user_id: req.user.id, study_date: { [Op.gte]: since.toISOString().slice(0, 10) } },
      order: [['study_date', 'ASC']]
    });

    const badges = await UserBadge.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Badge, as: 'Badge' }]
    });

    const grammar = await GrammarAttempt.findAll({
      where: { user_id: req.user.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.col('is_correct')), 'correct']
      ], raw: true
    });
    const speaking = await SpeakingRecord.findAll({
      where: { user_id: req.user.id, passed: true },
      attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'passed_count']], raw: true
    });

    res.json({
      languages: result,
      study_logs: logs.map((l) => ({ date: l.study_date, minutes: l.study_minutes, actions: l.action_count })),
      streak_days: req.user.streak_days,
      total_points: req.user.total_points,
      grammar_accuracy: grammar[0] && Number(grammar[0].total) ? Math.round((Number(grammar[0].correct) / Number(grammar[0].total)) * 100) : null,
      speaking_passed: speaking[0] ? Number(speaking[0].passed_count) : 0,
      badges: badges.map((b) => ({ code: b.Badge.code, name: b.Badge.name, icon: b.Badge.icon, earned_at: b.created_at }))
    });
  } catch (err) { next(err); }
};

// 完成课时：校验四模块全部完成 → status=2 → 积分 + 触发徽章
exports.completeLesson = async (req, res, next) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const progress = await UserLessonProgress.findOne({ where: { user_id: req.user.id, lesson_id: lessonId } });
    if (!progress || !allModulesDone(progress)) {
      return res.status(400).json({ code: 400, message: '尚有子模块未完成（单词/语法/听力/口语）' });
    }
    if (progress.status !== 2) {
      progress.status = 2;
      progress.completed_at = new Date();
      await progress.save();
      await addPoints(req.user.id, 10, '完成课时', 'lesson', lessonId);
      await touchStudyActivity(req.user.id, 5);
    }
    const newBadges = await checkAndGrantBadges(req.user.id);
    res.json({ status: progress.status, completed_at: progress.completed_at, new_badges: newBadges });
  } catch (err) { next(err); }
};

// 积分流水
exports.pointsHistory = async (req, res, next) => {
  try {
    const records = await PointRecord.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json({ records });
  } catch (err) { next(err); }
};
