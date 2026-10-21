const {
  Lesson, Course, Level, Language,
  Vocabulary, GrammarQuestion, ListeningMaterial, UserLessonProgress
} = require('../models');

// 课时详情：聚合词汇/语法/听力/跟读素材 + 当前用户进度
// 语法题不返回答案（提交时才判分），听力文本返回（TTS 需要）
exports.detail = async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, {
      include: [{
        model: Course, as: 'Course',
        include: [{ model: Level, as: 'Level', include: [{ model: Language, as: 'Language' }] }]
      }]
    });
    if (!lesson) return res.status(404).json({ code: 404, message: '课时不存在' });

    const [vocabularies, grammar_questions, listening_materials, progress] = await Promise.all([
      Vocabulary.findAll({ where: { lesson_id: lesson.id }, order: [['id', 'ASC']] }),
      GrammarQuestion.findAll({
        where: { lesson_id: lesson.id },
        attributes: ['id', 'stem', 'options'],
        order: [['id', 'ASC']]
      }),
      ListeningMaterial.findAll({ where: { lesson_id: lesson.id }, order: [['id', 'ASC']] }),
      UserLessonProgress.findOne({ where: { user_id: req.user.id, lesson_id: lesson.id } })
    ]);

    const level = lesson.Course.Level;
    res.json({
      lesson: {
        id: lesson.id, title: lesson.title, type: lesson.type,
        course: { id: lesson.Course.id, title: lesson.Course.title },
        level: { id: level.id, level: level.level, name: level.name },
        language: {
          code: level.Language.code, name: level.Language.name,
          emoji: level.Language.emoji, speech_locale: level.Language.speech_locale
        }
      },
      progress: progress ? { status: progress.status, sub_status: progress.sub_status } : null,
      vocabularies, grammar_questions, listening_materials
    });
  } catch (err) { next(err); }
};
