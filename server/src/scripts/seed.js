/**
 * 幂等种子脚本：npm run seed
 * - 徽章 / 演示账号：upsert（可重复执行）
 * - 课程内容（en/ja/ko）：按语言 upsert，已存在的课时跳过；--force 先清空内容域重建
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const {
  sequelize, Language, Level, Course, Lesson, Vocabulary,
  GrammarQuestion, ListeningMaterial, PlacementQuestion,
  Badge, User
} = require('../models');

const SEEDS_DIR = path.join(__dirname, '..', '..', '..', 'database', 'seeds');
const FORCE = process.argv.includes('--force');

async function seedBadges() {
  const file = path.join(SEEDS_DIR, 'badges.json');
  const { badges } = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const b of badges) {
    const [badge, created] = await Badge.findOrCreate({
      where: { code: b.code },
      defaults: b
    });
    if (!created) await badge.update(b);
  }
  console.log(`[seed] 徽章 ${badges.length} 条 ✓`);
}

async function seedAccounts() {
  const file = path.join(SEEDS_DIR, 'accounts.json');
  const { accounts } = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const a of accounts) {
    const hash = await bcrypt.hash(a.password, 10);
    const [user, created] = await User.findOrCreate({
      where: { username: a.username },
      defaults: { username: a.username, password_hash: hash, nickname: a.nickname, role: a.role || 'user', target_language: a.target_language || null }
    });
    if (!created) await user.update({ nickname: a.nickname, role: a.role || user.role, target_language: a.target_language || user.target_language });
    console.log(`[seed] 账号 ${a.username} / ${a.password} ${created ? '创建' : '已存在'} ✓`);
  }
}

async function seedLanguage(data) {
  const [lang] = await Language.findOrCreate({
    where: { code: data.code },
    defaults: { code: data.code, name: data.name, speech_locale: data.speech_locale, emoji: data.emoji, sort: data.code === 'en' ? 1 : data.code === 'ja' ? 2 : 3 }
  });
  await lang.update({ name: data.name, speech_locale: data.speech_locale, emoji: data.emoji });

  for (const lv of data.levels) {
    const [level] = await Level.findOrCreate({
      where: { language_id: lang.id, level: lv.level },
      defaults: { language_id: lang.id, level: lv.level, name: lv.name }
    });
    await level.update({ name: lv.name });

    let courseSort = 1;
    for (const co of lv.courses) {
      const [course] = await Course.findOrCreate({
        where: { level_id: level.id, title: co.title },
        defaults: { level_id: level.id, title: co.title, description: co.description || null, sort: co.sort || courseSort }
      });
      courseSort += 1;

      let lessonSort = 1;
      for (const le of co.lessons) {
        let lesson = await Lesson.findOne({ where: { course_id: course.id, title: le.title } });
        if (lesson && !FORCE) { lessonSort += 1; continue; }
        if (!lesson) {
          lesson = await Lesson.create({ course_id: course.id, title: le.title, type: le.type || 'lesson', sort: le.sort || lessonSort });
        } else {
          // force 模式下重建课时内容
          await Promise.all([
            Vocabulary.destroy({ where: { lesson_id: lesson.id } }),
            GrammarQuestion.destroy({ where: { lesson_id: lesson.id } }),
            ListeningMaterial.destroy({ where: { lesson_id: lesson.id } })
          ]);
        }
        lessonSort += 1;

        await Vocabulary.bulkCreate((le.vocabularies || []).map((v) => ({
          lesson_id: lesson.id, word: v.word, reading: v.reading || null,
          translation: v.translation, example_sentence: v.example_sentence || null
        })));
        await GrammarQuestion.bulkCreate((le.grammar_questions || []).map((q) => ({
          lesson_id: lesson.id, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation || null
        })));
        await ListeningMaterial.bulkCreate((le.listening_materials || []).map((m) => ({
          lesson_id: lesson.id, text: m.text, translation: m.translation || null, speed_level: m.speed_level ?? 1
        })));
      }
    }
  }

  // 分级测试题：仅当该语言还没有题时插入
  const existing = await PlacementQuestion.count({ where: { language_id: lang.id } });
  if (existing === 0 && (data.placement_questions || []).length) {
    await PlacementQuestion.bulkCreate(data.placement_questions.map((q) => ({
      language_id: lang.id, level_tag: q.level_tag, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation || null
    })));
  } else if (FORCE && (data.placement_questions || []).length) {
    await PlacementQuestion.destroy({ where: { language_id: lang.id } });
    await PlacementQuestion.bulkCreate(data.placement_questions.map((q) => ({
      language_id: lang.id, level_tag: q.level_tag, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation || null
    })));
  }

  console.log(`[seed] 语言 ${data.code}（${data.name}）✓`);
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('[seed] 数据库连接成功');

    if (FORCE) {
      console.log('[seed] --force 模式：清空语言/内容域后重建（级联清理对应学习记录）');
      await Language.destroy({ where: {} });
    }

    await seedBadges();
    await seedAccounts();

    for (const code of ['en', 'ja', 'ko']) {
      const file = path.join(SEEDS_DIR, `${code}.json`);
      if (!fs.existsSync(file)) {
        console.warn(`[seed] 缺少 ${file}，跳过`);
        continue;
      }
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      await seedLanguage(data);
    }
    const [langs, levels, courses, lessons, vocabs, gq, lm, pq] = await Promise.all([
      Language.count(), Level.count(), Course.count(), Lesson.count(),
      Vocabulary.count(), GrammarQuestion.count(), ListeningMaterial.count(), PlacementQuestion.count()
    ]);
    console.log('[seed] 完成 ✓ 汇总：');
    console.log(`  语言 ${langs} | 等级 ${levels} | 课程 ${courses} | 课时 ${lessons}`);
    console.log(`  词汇 ${vocabs} | 语法题 ${gq} | 听力 ${lm} | 分级测试题 ${pq}`);
    process.exit(0);
  } catch (err) {
    console.error('[seed] 失败:', err);
    process.exit(1);
  }
}

main();
