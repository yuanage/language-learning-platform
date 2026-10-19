const { Language, Level, Course, Lesson, PlacementQuestion, PlacementResult } = require('../models');
const { touchStudyActivity, addPoints, checkAndGrantBadges } = require('../services/studyService');

const { Sequelize, Op } = require('sequelize');

// 随机抽取 9 题（不包含答案）
exports.getQuestions = async (req, res, next) => {
  try {
    const lang = await Language.findOne({ where: { code: req.params.language } });
    if (!lang) return res.status(404).json({ code: 404, message: '语言不存在' });
    const questions = await PlacementQuestion.findAll({
      where: { language_id: lang.id },
      order: Sequelize.literal('RAND()'),
      limit: 9,
      attributes: ['id', 'level_tag', 'stem', 'options']
    });
    res.json({ total: questions.length, questions });
  } catch (err) { next(err); }
};

// 提交答案：判分 → 写结果 → 更新用户等级 → 积分
exports.submit = async (req, res, next) => {
  try {
    const { answers } = req.body || {};
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ code: 400, message: '答案不能为空' });
    }
    const lang = await Language.findOne({ where: { code: req.params.language } });
    if (!lang) return res.status(404).json({ code: 404, message: '语言不存在' });

    const ids = answers.map((a) => a.question_id);
    const qs = await PlacementQuestion.findAll({ where: { id: { [Op.in]: ids }, language_id: lang.id } });
    const qMap = new Map(qs.map((q) => [q.id, q]));

    let score = 0;
    const detail = answers.map((a) => {
      const q = qMap.get(a.question_id);
      const correct = q ? Number(a.chosen) === q.answer : false;
      if (correct) score += 1;
      return { question_id: a.question_id, chosen: a.chosen, correct, answer: q ? q.answer : null, explanation: q ? q.explanation : null };
    });

    const resultLevel = score >= 7 ? 'advanced' : score >= 4 ? 'intermediate' : 'beginner';
    await PlacementResult.create({ user_id: req.user.id, language_id: lang.id, score, result_level: resultLevel });
    req.user.target_language = lang.code;
    req.user.current_level = resultLevel;
    await req.user.save();

    await touchStudyActivity(req.user.id, 5);
    await addPoints(req.user.id, 10, `完成${lang.name}分级测试`, 'placement', lang.id);
    const newBadges = await checkAndGrantBadges(req.user.id);

    res.json({ score, total: qs.length, result_level: resultLevel, detail, new_badges: newBadges });
  } catch (err) { next(err); }
};

// 查询用户在某个语言的最近一次分级结果
exports.latest = async (req, res, next) => {
  try {
    const lang = await Language.findOne({ where: { code: req.params.language } });
    if (!lang) return res.status(404).json({ code: 404, message: '语言不存在' });
    const result = await PlacementResult.findOne({
      where: { user_id: req.user.id, language_id: lang.id },
      order: [['created_at', 'DESC']]
    });
    res.json({ result });
  } catch (err) { next(err); }
};
