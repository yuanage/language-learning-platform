const { GrammarQuestion, GrammarAttempt } = require('../models');
const { Op } = require('sequelize');
const { addPoints, markLessonModule, touchStudyActivity } = require('../services/studyService');

// 课时语法题（不带答案）
exports.byLesson = async (req, res, next) => {
  try {
    const questions = await GrammarQuestion.findAll({
      where: { lesson_id: req.params.lessonId },
      attributes: ['id', 'stem', 'options'],
      order: [['id', 'ASC']]
    });
    res.json({ questions });
  } catch (err) { next(err); }
};

// 提交答案：判分 → 写答题记录 → 返回答案与解析
exports.submit = async (req, res, next) => {
  try {
    const { lesson_id, answers } = req.body || {};
    if (!lesson_id || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ code: 400, message: '参数缺失' });
    }
    const ids = answers.map((a) => a.question_id);
    const qs = await GrammarQuestion.findAll({ where: { id: { [Op.in]: ids }, lesson_id } });
    const qMap = new Map(qs.map((q) => [q.id, q]));

    // 用户此前是否答对过（用于积分去重）
    const pastCorrect = await GrammarAttempt.findAll({
      where: { user_id: req.user.id, question_id: { [Op.in]: ids }, is_correct: true },
      attributes: ['question_id']
    });
    const pastSet = new Set(pastCorrect.map((p) => p.question_id));

    let correctCount = 0, pointsEarned = 0;
    const detail = [];
    for (const a of answers) {
      const q = qMap.get(a.question_id);
      if (!q) continue;
      const correct = Number(a.chosen) === q.answer;
      if (correct) correctCount += 1;
      await GrammarAttempt.create({ user_id: req.user.id, question_id: q.id, is_correct: correct, chosen: a.chosen });
      if (correct && !pastSet.has(q.id)) {
        pointsEarned += 1;
        await addPoints(req.user.id, 1, '语法题首次答对', 'grammar', q.id);
      }
      detail.push({ question_id: q.id, chosen: a.chosen, correct, answer: q.answer, explanation: q.explanation });
    }

    await touchStudyActivity(req.user.id, 3);
    // 该课时全部语法题均已作答 → 标记 grammar 子模块完成（不要求全对，可重练）
    if (qs.length > 0 && detail.length === qs.length) {
      await markLessonModule(req.user.id, Number(lesson_id), 'grammar');
    }
    res.json({ total: detail.length, correct: correctCount, points_earned: pointsEarned, detail });
  } catch (err) { next(err); }
};
