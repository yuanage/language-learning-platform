const { ListeningMaterial } = require('../models');
const { similarityScore } = require('../services/similarity');
const { markLessonModule, touchStudyActivity, addPoints } = require('../services/studyService');

// 课时听力材料（含原文，前端 TTS 播放）
exports.byLesson = async (req, res, next) => {
  try {
    const materials = await ListeningMaterial.findAll({
      where: { lesson_id: req.params.lessonId },
      order: [['id', 'ASC']]
    });
    res.json({ materials });
  } catch (err) { next(err); }
};

// 听写提交：相似度判分
exports.submit = async (req, res, next) => {
  try {
    const { lesson_id, material_id, dictation } = req.body || {};
    const material = await ListeningMaterial.findByPk(material_id);
    if (!material) return res.status(404).json({ code: 404, message: '听力材料不存在' });
    const score = similarityScore(material.text, dictation || '');
    const passed = score >= 60;
    await touchStudyActivity(req.user.id, 3);
    if (passed) {
      if (lesson_id) await markLessonModule(req.user.id, Number(lesson_id), 'listening');
      await addPoints(req.user.id, 2, '听力听写通过', 'listening', material.id);
    }
    res.json({
      score, passed,
      text: material.text,
      translation: material.translation
    });
  } catch (err) { next(err); }
};
