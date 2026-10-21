const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'language_learning',
  process.env.DB_USER || 'llp',
  process.env.DB_PASSWORD || 'llp_pass_2026',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3308),
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false,
    define: { underscored: true, freezeTableName: true, timestamps: false },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

const S = DataTypes;
const define = (name, attrs, opts = {}) => sequelize.define(name, attrs, { tableName: name, ...opts });

// ---------- 用户域 ----------
const User = define('users', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  username: { type: S.STRING(50), unique: true, allowNull: false },
  password_hash: { type: S.STRING(255), allowNull: false },
  nickname: { type: S.STRING(50), allowNull: false },
  avatar: { type: S.STRING(255) },
  role: { type: S.ENUM('user', 'admin'), defaultValue: 'user' },
  target_language: { type: S.STRING(8) },
  current_level: { type: S.ENUM('beginner', 'intermediate', 'advanced') },
  total_points: { type: S.INTEGER, defaultValue: 0 },
  streak_days: { type: S.INTEGER, defaultValue: 0 },
  last_study_date: { type: S.DATEONLY }
});

const Language = define('languages', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  code: { type: S.STRING(8), unique: true, allowNull: false },
  name: { type: S.STRING(50), allowNull: false },
  speech_locale: { type: S.STRING(12), allowNull: false },
  emoji: { type: S.STRING(8) },
  sort: { type: S.INTEGER, defaultValue: 0 }
});

const UserLanguageSetting = define('user_language_settings', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  language_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  daily_goal: { type: S.INTEGER, defaultValue: 20 }
});

// ---------- 内容域 ----------
const Level = define('levels', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  language_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  level: { type: S.ENUM('beginner', 'intermediate', 'advanced'), allowNull: false },
  name: { type: S.STRING(50), allowNull: false }
});

const Course = define('courses', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  level_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  title: { type: S.STRING(100), allowNull: false },
  description: { type: S.STRING(500) },
  sort: { type: S.INTEGER, defaultValue: 0 }
});

const Lesson = define('lessons', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  course_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  title: { type: S.STRING(100), allowNull: false },
  type: { type: S.ENUM('lesson', 'review'), defaultValue: 'lesson' },
  sort: { type: S.INTEGER, defaultValue: 0 }
});

const Vocabulary = define('vocabularies', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  lesson_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  word: { type: S.STRING(100), allowNull: false },
  reading: { type: S.STRING(100) },
  translation: { type: S.STRING(200), allowNull: false },
  example_sentence: { type: S.STRING(500) }
});

const GrammarQuestion = define('grammar_questions', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  lesson_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  stem: { type: S.STRING(500), allowNull: false },
  options: { type: S.JSON, allowNull: false },
  answer: { type: S.TINYINT, allowNull: false },
  explanation: { type: S.STRING(500) }
});

const ListeningMaterial = define('listening_materials', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  lesson_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  text: { type: S.TEXT, allowNull: false },
  translation: { type: S.STRING(500) },
  speed_level: { type: S.TINYINT, defaultValue: 1 }
});

// ---------- 学习记录域 ----------
const VocabReview = define('vocab_reviews', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  vocabulary_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  box_no: { type: S.TINYINT, defaultValue: 1 },
  correct_count: { type: S.INTEGER, defaultValue: 0 },
  wrong_count: { type: S.INTEGER, defaultValue: 0 },
  next_review_at: { type: S.DATE, allowNull: false }
}, { timestamps: false, underscored: true, tableName: 'vocab_reviews' });

const GrammarAttempt = define('grammar_attempts', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  question_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  is_correct: { type: S.BOOLEAN, allowNull: false },
  chosen: { type: S.TINYINT, allowNull: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

const SpeakingRecord = define('speaking_records', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  material_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  recognized_text: { type: S.STRING(500) },
  score: { type: S.DECIMAL(4, 1), defaultValue: 0 },
  passed: { type: S.BOOLEAN, defaultValue: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

const UserLessonProgress = define('user_lesson_progress', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  lesson_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  status: { type: S.TINYINT, defaultValue: 0 },
  sub_status: { type: S.JSON },
  completed_at: { type: S.DATE }
});

const StudyLog = define('study_logs', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  study_date: { type: S.DATEONLY, allowNull: false },
  study_minutes: { type: S.INTEGER, defaultValue: 0 },
  action_count: { type: S.INTEGER, defaultValue: 0 }
});

// ---------- 分级测试 ----------
const PlacementQuestion = define('placement_questions', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  language_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  level_tag: { type: S.ENUM('beginner', 'intermediate', 'advanced'), allowNull: false },
  stem: { type: S.STRING(500), allowNull: false },
  options: { type: S.JSON, allowNull: false },
  answer: { type: S.TINYINT, allowNull: false },
  explanation: { type: S.STRING(500) }
});

const PlacementResult = define('placement_results', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  language_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  score: { type: S.INTEGER, defaultValue: 0 },
  result_level: { type: S.ENUM('beginner', 'intermediate', 'advanced'), allowNull: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

// ---------- 社区 ----------
const Post = define('posts', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  language_id: { type: S.INTEGER.UNSIGNED },
  title: { type: S.STRING(200), allowNull: false },
  content: { type: S.TEXT, allowNull: false },
  like_count: { type: S.INTEGER, defaultValue: 0 },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

const Comment = define('comments', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  post_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  content: { type: S.STRING(1000), allowNull: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

const PostLike = define('post_likes', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  post_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

// ---------- 成就激励 ----------
const Badge = define('badges', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  code: { type: S.STRING(50), unique: true, allowNull: false },
  name: { type: S.STRING(50), allowNull: false },
  icon: { type: S.STRING(200), allowNull: false },
  description: { type: S.STRING(200) },
  criteria: { type: S.JSON, allowNull: false },
  points: { type: S.INTEGER, defaultValue: 0 }
});

const UserBadge = define('user_badges', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  badge_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

const PointRecord = define('point_records', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  delta: { type: S.INTEGER, allowNull: false },
  reason: { type: S.STRING(100), allowNull: false },
  ref_type: { type: S.STRING(30) },
  ref_id: { type: S.INTEGER.UNSIGNED },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

const Checkin = define('checkins', {
  id: { type: S.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: S.INTEGER.UNSIGNED, allowNull: false },
  checkin_date: { type: S.DATEONLY, allowNull: false },
  created_at: { type: S.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
});

// 关联
User.hasMany(Post, { foreignKey: 'user_id' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Post.belongsTo(Language, { foreignKey: 'language_id', as: 'Language' });

// 内容域关联链（显式别名，访问器统一为首字母大写）
Language.hasMany(Level, { foreignKey: 'language_id' });
Level.belongsTo(Language, { foreignKey: 'language_id', as: 'Language' });
Level.hasMany(Course, { foreignKey: 'level_id' });
Course.belongsTo(Level, { foreignKey: 'level_id', as: 'Level' });
Course.hasMany(Lesson, { foreignKey: 'course_id' });
Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'Course' });
Lesson.hasMany(Vocabulary, { foreignKey: 'lesson_id' });
Vocabulary.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'Lesson' });
Lesson.hasMany(GrammarQuestion, { foreignKey: 'lesson_id' });
Lesson.hasMany(ListeningMaterial, { foreignKey: 'lesson_id' });

// 复习记录 → 词汇链
VocabReview.belongsTo(Vocabulary, { foreignKey: 'vocabulary_id', as: 'Vocabulary' });
Vocabulary.hasMany(VocabReview, { foreignKey: 'vocabulary_id' });

// 徽章
UserBadge.belongsTo(Badge, { foreignKey: 'badge_id', as: 'Badge' });
Badge.hasMany(UserBadge, { foreignKey: 'badge_id' });

module.exports = {
  sequelize, Sequelize,
  User, Language, UserLanguageSetting,
  Level, Course, Lesson, Vocabulary, GrammarQuestion, ListeningMaterial,
  VocabReview, GrammarAttempt, SpeakingRecord, UserLessonProgress, StudyLog,
  PlacementQuestion, PlacementResult,
  Post, Comment, PostLike,
  Badge, UserBadge, PointRecord, Checkin
};
