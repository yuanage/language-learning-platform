const {
  Language, Level, Course, Lesson, UserLessonProgress,
  VocabReview, Vocabulary, GrammarAttempt, SpeakingRecord
} = require('../models');
const { Op, Sequelize } = require('sequelize');

// 规则推荐：今日到期复习 + 下一节未完成课时 + 弱项模块
exports.today = async (req, res, next) => {
  try {
    const code = req.query.language || req.user.target_language;
    if (!code) return res.status(400).json({ code: 400, message: '缺少语言参数' });
    const lang = await Language.findOne({ where: { code } });
    if (!lang) return res.status(404).json({ code: 404, message: '语言不存在' });

    // 1) 到期复习单词数（该语言范围）
    const dueReviews = await VocabReview.findAll({
      where: { user_id: req.user.id, next_review_at: { [Op.lte]: new Date() } },
      include: [{
        model: Vocabulary, as: 'Vocabulary', attributes: ['id'],
        include: [{
          model: Lesson, as: 'Lesson', attributes: ['id'],
          include: [{
            model: Course, as: 'Course', attributes: ['id'],
            include: [{ model: Level, as: 'Level', attributes: ['id'], include: [{ model: Language, as: 'Language', attributes: ['code'] }] }]
          }]
        }]
      }],
      limit: 200
    });
    const dueCount = dueReviews.filter((r) => r.Vocabulary.Lesson.Course.Level.Language.code === code).length;

    // 2) 下一节未完成课时（按用户等级优先，否则入门）
    const levelKey = req.user.current_level || 'beginner';
    let level = await Level.findOne({ where: { language_id: lang.id, level: levelKey } });
    if (!level) level = await Level.findOne({ where: { language_id: lang.id } });
    let nextLesson = null;
    if (level) {
      const courses = await Course.findAll({ where: { level_id: level.id }, order: [['sort', 'ASC']] });
      const courseIds = courses.map((c) => c.id);
      const lessons = courseIds.length ? await Lesson.findAll({ where: { course_id: { [Op.in]: courseIds } }, order: [['sort', 'ASC']] }) : [];
      const progresses = await UserLessonProgress.findAll({ where: { user_id: req.user.id } });
      const doneSet = new Set(progresses.filter((p) => p.status === 2).map((p) => p.lesson_id));
      const firstUndone = lessons.find((l) => !doneSet.has(l.id));
      if (firstUndone) {
        const course = courses.find((c) => c.id === firstUndone.course_id);
        nextLesson = {
          lesson_id: firstUndone.id, lesson_title: firstUndone.title,
          course_title: course ? course.title : '', level_name: level.name, level_key: level.level
        };
      }
    }

    // 3) 弱项模块：语法正确率 < 70% → 语法；口语均分 < 60 → 口语
    let weakModule = null;
    const g = await GrammarAttempt.findAll({
      where: { user_id: req.user.id },
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'total'], [Sequelize.fn('SUM', Sequelize.col('is_correct')), 'correct']],
      raw: true
    });
    if (g[0] && Number(g[0].total) >= 5) {
      const acc = Number(g[0].correct) / Number(g[0].total);
      if (acc < 0.7) weakModule = { module: 'grammar', message: `语法正确率 ${Math.round(acc * 100)}%，建议加强语法练习` };
    }
    if (!weakModule) {
      const s = await SpeakingRecord.findAll({
        where: { user_id: req.user.id },
        attributes: [[Sequelize.fn('AVG', Sequelize.col('score')), 'avg_score']],
        raw: true
      });
      if (s[0] && s[0].avg_score !== null && Number(s[0].avg_score) < 60) {
        weakModule = { module: 'speaking', message: `口语平均得分 ${Math.round(Number(s[0].avg_score))} 分，建议加强跟读练习` };
      }
    }

    res.json({
      language: { code: lang.code, name: lang.name, emoji: lang.emoji },
      current_level: req.user.current_level,
      due_reviews: dueCount,
      next_lesson: nextLesson,
      weak_module: weakModule
    });
  } catch (err) { next(err); }
};
