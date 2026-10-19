const { Language, Level, Course, Lesson, UserLessonProgress } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res, next) => {
  try {
    const langs = await Language.findAll({ order: [['sort', 'ASC']] });
    res.json({ languages: langs });
  } catch (err) { next(err); }
};

// 语言完整课程树：等级 → 课程 → 课时（附带当前用户进度）
exports.tree = async (req, res, next) => {
  try {
    const lang = await Language.findOne({ where: { code: req.params.code } });
    if (!lang) return res.status(404).json({ code: 404, message: '语言不存在' });

    const levels = await Level.findAll({ where: { language_id: lang.id } });
    const levelIds = levels.map((l) => l.id);
    const courses = await Course.findAll({ where: { level_id: { [Op.in]: levelIds } }, order: [['sort', 'ASC']] });
    const courseIds = courses.map((c) => c.id);
    const lessons = await Lesson.findAll({ where: { course_id: { [Op.in]: courseIds } }, order: [['sort', 'ASC']] });

    const progresses = await UserLessonProgress.findAll({ where: { user_id: req.user.id } });
    const progressMap = new Map(progresses.map((p) => [p.lesson_id, p]));

    const courseMap = new Map();
    courses.forEach((c) => {
      const lessonsOf = lessons.filter((l) => l.course_id === c.id).map((l) => {
        const p = progressMap.get(l.id);
        return {
          id: l.id, title: l.title, type: l.type, sort: l.sort,
          status: p ? p.status : 0,
          sub_status: p ? p.sub_status : null
        };
      });
      courseMap.set(c.id, { id: c.id, title: c.title, description: c.description, sort: c.sort, lessons: lessonsOf });
    });

    res.json({
      language: { id: lang.id, code: lang.code, name: lang.name, emoji: lang.emoji, speech_locale: lang.speech_locale },
      levels: levels.map((lv) => ({
        id: lv.id, level: lv.level, name: lv.name,
        courses: [...courseMap.values()].filter((c) => courses.find((o) => o.id === c.id && o.level_id === lv.id))
      }))
    });
  } catch (err) { next(err); }
};

// 管理端：语言列表含统计
exports.stats = async (req, res, next) => {
  try {
    const langs = await Language.findAll({ order: [['sort', 'ASC']] });
    const result = [];
    for (const lang of langs) {
      const levels = await Level.findAll({ where: { language_id: lang.id } });
      const levelIds = levels.map((l) => l.id);
      const courses = await Course.findAll({ where: { level_id: { [Op.in]: levelIds } } });
      const courseIds = courses.map((c) => c.id);
      const lessons = courseIds.length
        ? await Lesson.count({ where: { course_id: { [Op.in]: courseIds } } }) : 0;
      result.push({ ...lang.toJSON(), level_count: levels.length, course_count: courses.length, lesson_count: lessons });
    }
    res.json({ languages: result });
  } catch (err) { next(err); }
};
