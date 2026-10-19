import http from './http';

// ---------- 认证 ----------
export const apiRegister = (data) => http.post('/auth/register', data);
export const apiLogin = (data) => http.post('/auth/login', data);
export const apiMe = () => http.get('/auth/me');
export const apiUpdateProfile = (data) => http.put('/auth/profile', data);

// ---------- 语言 / 课程 ----------
export const apiLanguages = () => http.get('/languages');
export const apiLanguageTree = (code) => http.get(`/languages/${code}/tree`);
export const apiLessonDetail = (id) => http.get(`/lessons/${id}/detail`);

// ---------- 分级测试 ----------
export const apiPlacementQuestions = (code) => http.get(`/placement/${code}/questions`);
export const apiPlacementSubmit = (code, answers) => http.post(`/placement/${code}/submit`, { answers });
export const apiPlacementLatest = (code) => http.get(`/placement/${code}/latest`);

// ---------- 单词 ----------
export const apiVocabByLesson = (lessonId) => http.get(`/vocab/lesson/${lessonId}`);
export const apiVocabLearn = (lesson_id, vocabulary_ids) => http.post('/vocab/learn', { lesson_id, vocabulary_ids });
export const apiVocabDueToday = (language) => http.get('/vocab/review/today', { params: { language } });
export const apiVocabReview = (vocabulary_id, correct) => http.post('/vocab/review', { vocabulary_id, correct });

// ---------- 语法 ----------
export const apiGrammarByLesson = (lessonId) => http.get(`/grammar/lesson/${lessonId}`);
export const apiGrammarSubmit = (lesson_id, answers) => http.post('/grammar/submit', { lesson_id, answers });

// ---------- 听力 ----------
export const apiListeningByLesson = (lessonId) => http.get(`/listening/lesson/${lessonId}`);
export const apiListeningSubmit = (lesson_id, material_id, dictation) => http.post('/listening/submit', { lesson_id, material_id, dictation });

// ---------- 口语 ----------
export const apiSpeakingByLesson = (lessonId) => http.get(`/speaking/lesson/${lessonId}`);
export const apiSpeakingSubmit = (lesson_id, material_id, recognized_text) => http.post('/speaking/submit', { lesson_id, material_id, recognized_text });

// ---------- 进度 / 推荐 ----------
export const apiProgressOverview = () => http.get('/progress/overview');
export const apiProgressPoints = () => http.get('/progress/points');
export const apiCompleteLesson = (lessonId) => http.post(`/progress/lesson/${lessonId}/complete`);
export const apiRecommendToday = (language) => http.get('/recommend/today', { params: { language } });

// ---------- 社区 ----------
export const apiPosts = (params) => http.get('/community/posts', { params });
export const apiCreatePost = (data) => http.post('/community/posts', data);
export const apiPostDetail = (id) => http.get(`/community/posts/${id}`);
export const apiLikePost = (id) => http.post(`/community/posts/${id}/like`);
export const apiCreateComment = (data) => http.post('/community/comments', data);

// ---------- 成就 ----------
export const apiBadges = () => http.get('/achievements');
export const apiCheckBadges = () => http.post('/achievements/check');
export const apiCheckin = () => http.post('/achievements/checkin');
export const apiCheckinHistory = () => http.get('/achievements/history');

// ---------- 管理 ----------
export const apiAdminOverview = () => http.get('/admin/overview');
export const apiAdminUsers = (params) => http.get('/admin/users', { params });
export const apiAdminSetRole = (id, role) => http.put(`/admin/users/${id}/role`, { role });
