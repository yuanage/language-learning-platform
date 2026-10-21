const { ListeningMaterial, SpeakingRecord } = require('../models');
const { similarityScore } = require('../services/similarity');
const { markLessonModule, touchStudyActivity, addPoints, checkAndGrantBadges } = require('../services/studyService');

// 课时跟读素材（复用听力材料文本）
exports.byLesson = async (req, res, next) => {
  try {
    const materials = await ListeningMaterial.findAll({
      where: { lesson_id: req.params.lessonId },
      attributes: ['id', 'text', 'translation', 'speed_level'],
      order: [['id', 'ASC']]
    });
    const mine = await SpeakingRecord.findAll({ where: { user_id: req.user.id } });
    const best = new Map();
    mine.forEach((r) => {
      if (!best.has(r.material_id) || best.get(r.material_id).score < r.score) best.set(r.material_id, r);
    });
    res.json({
      materials: materials.map((m) => ({
        ...m.toJSON(),
        best_score: best.has(m.id) ? Number(best.get(m.id).score) : null,
        passed: best.has(m.id) ? !!best.get(m.id).passed : false
      }))
    });
  } catch (err) { next(err); }
};

// 跟读提交：识别文本与原文相似度判分
exports.submit = async (req, res, next) => {
  try {
    const { lesson_id, material_id, recognized_text } = req.body || {};
    const material = await ListeningMaterial.findByPk(material_id);
    if (!material) return res.status(404).json({ code: 404, message: '跟读素材不存在' });
    const score = similarityScore(material.text, recognized_text || '');
    const passed = score >= 60;

    // 历史是否已通过（积分只发一次）
    const pastPassed = await SpeakingRecord.findOne({ where: { user_id: req.user.id, material_id, passed: true } });

    await SpeakingRecord.create({
      user_id: req.user.id,
      material_id,
      recognized_text: (recognized_text || '').slice(0, 500),
      score,
      passed
    });
    await touchStudyActivity(req.user.id, 2);

    let pointsEarned = 0;
    if (passed && lesson_id) await markLessonModule(req.user.id, Number(lesson_id), 'speaking');
    if (passed && !pastPassed) {
      pointsEarned = 3;
      await addPoints(req.user.id, 3, '口语跟读通过', 'speaking', material.id);
    }
    const newBadges = await checkAndGrantBadges(req.user.id);
    res.json({ score, passed, points_earned: pointsEarned, text: material.text, translation: material.translation, new_badges: newBadges });
  } catch (err) { next(err); }
};
