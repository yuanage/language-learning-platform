const {
  Vocabulary, VocabReview, Lesson, Course, Level, Language
} = require('../models');
const { Op } = require('sequelize');
const { touchStudyActivity, addPoints, markLessonModule, checkAndGrantBadges } = require('../services/studyService');

// Leitner 间隔：箱 1~5 → 1/2/4/8/16 天
const INTERVALS = [1, 2, 4, 8, 16];

// 首次学习课时词汇：建立复习记录（入箱 1）
exports.learn = async (req, res, next) => {
  try {
    const { lesson_id, vocabulary_ids } = req.body || {};
    if (!lesson_id || !Array.isArray(vocabulary_ids) || vocabulary_ids.length === 0) {
      return res.status(400).json({ code: 400, message: '参数缺失' });
    }
    const words = await Vocabulary.findAll({ where: { id: { [Op.in]: vocabulary_ids }, lesson_id } });
    let learned = 0;
    const next = new Date(Date.now() + INTERVALS[0] * 24 * 3600 * 1000);
    for (const w of words) {
      const [, created] = await VocabReview.findOrCreate({
        where: { user_id: req.user.id, vocabulary_id: w.id },
        defaults: { box_no: 1, next_review_at: next }
      });
      if (created) {
        learned += 1;
        await addPoints(req.user.id, 1, `学习单词「${w.word}」`, 'vocab', w.id);
      }
    }
    if (learned > 0) {
      await touchStudyActivity(req.user.id, Math.max(1, learned * 2));
      // 该课时词汇全部入箱 → 标记 vocab 子模块
      const total = await Vocabulary.count({ where: { lesson_id } });
      const mine = await VocabReview.count({
        where: { user_id: req.user.id, vocabulary_id: { [Op.in]: (await Vocabulary.findAll({ where: { lesson_id }, attributes: ['id'] })).map((v) => v.id) } }
      });
      if (total > 0 && mine >= total) {
        await markLessonModule(req.user.id, Number(lesson_id), 'vocab');
      }
      const newBadges = await checkAndGrantBadges(req.user.id);
      return res.json({ learned, new_badges: newBadges });
    }
    res.json({ learned: 0, new_badges: [] });
  } catch (err) { next(err); }
};

// 课时词汇列表（附复习状态）
exports.byLesson = async (req, res, next) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const words = await Vocabulary.findAll({ where: { lesson_id: lessonId }, order: [['id', 'ASC']] });
    const reviews = await VocabReview.findAll({ where: { user_id: req.user.id } });
    const rMap = new Map(reviews.map((r) => [r.vocabulary_id, r]));
    res.json({
      words: words.map((w) => {
        const r = rMap.get(w.id);
        return {
          ...w.toJSON(),
          in_review: !!r,
          box_no: r ? r.box_no : 0,
          next_review_at: r ? r.next_review_at : null
        };
      })
    });
  } catch (err) { next(err); }
};

// 今日到期复习队列（按语言过滤）
exports.dueToday = async (req, res, next) => {
  try {
    const code = req.query.language;
    const where = {
      user_id: req.user.id,
      next_review_at: { [Op.lte]: new Date() }
    };
    const include = [{
      model: Vocabulary, as: 'Vocabulary',
      include: [{
        model: Lesson, as: 'Lesson', attributes: ['id', 'title'],
        include: [{
          model: Course, as: 'Course', attributes: ['id', 'title'],
          include: [{ model: Level, as: 'Level', attributes: ['level', 'name'], include: [{ model: Language, as: 'Language', attributes: ['code', 'name', 'speech_locale'] }] }]
        }]
      }]
    }];
    const reviews = await VocabReview.findAll({ where, include, limit: 20, order: [['next_review_at', 'ASC']] });
    const filtered = code ? reviews.filter((r) => r.Vocabulary.Lesson.Course.Level.Language.code === code) : reviews;
    const total = await VocabReview.count({ where });
    res.json({ total: code ? filtered.length : total, words: filtered });
  } catch (err) { next(err); }
};

// 提交复习结果 → Leitner 升降箱
exports.review = async (req, res, next) => {
  try {
    const { vocabulary_id, correct } = req.body || {};
    const record = await VocabReview.findOne({ where: { user_id: req.user.id, vocabulary_id } });
    if (!record) return res.status(404).json({ code: 404, message: '该单词尚未学习' });

    const word = await Vocabulary.findByPk(vocabulary_id);
    if (correct) {
      record.box_no = Math.min(5, record.box_no + 1);
      record.correct_count += 1;
      await addPoints(req.user.id, 1, `复习正确「${word.word}」`, 'vocab_review', word.id);
    } else {
      record.box_no = 1;
      record.wrong_count += 1;
    }
    record.next_review_at = new Date(Date.now() + INTERVALS[record.box_no - 1] * 24 * 3600 * 1000);
    await record.save();

    await touchStudyActivity(req.user.id, 1);
    const newBadges = await checkAndGrantBadges(req.user.id);
    res.json({
      box_no: record.box_no,
      next_review_at: record.next_review_at,
      next_interval_days: INTERVALS[record.box_no - 1],
      new_badges: newBadges
    });
  } catch (err) { next(err); }
};
