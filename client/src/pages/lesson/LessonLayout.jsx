import { useEffect, useState } from 'react';
import { Button, Card, Tabs, Tag, Typography, message } from 'antd';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiLessonDetail, apiCompleteLesson } from '@/api';

const MODULE_KEYS = ['vocab', 'grammar', 'listening', 'speaking'];

export default function LessonLayout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    apiLessonDetail(id).then(setDetail);
  }, [id]);

  if (!detail) return <div className="page-container"><Card loading /></div>;

  const { lesson, vocabularies, grammar_questions, listening_materials, progress } = detail;
  const sub = progress ? (typeof progress.sub_status === 'string' ? JSON.parse(progress.sub_status || '{}') : progress.sub_status || {}) : {};

  const tabItems = [
    { key: 'vocab', label: <span>🃏 单词 {sub.vocab && <Tag color="green">✓</Tag>}</span> },
    { key: 'grammar', label: <span>✏️ 语法 {sub.grammar && <Tag color="green">✓</Tag>} ({grammar_questions.length}题)</span> },
    { key: 'listening', label: <span>🎧 听力 {sub.listening && <Tag color="green">✓</Tag>} ({listening_materials.length}条)</span> },
    { key: 'speaking', label: <span>🎤 口语 {sub.speaking && <Tag color="green">✓</Tag>} ({listening_materials.length}条)</span> }
  ];

  const activeKey = location.pathname.split('/').pop();
  const allDone = MODULE_KEYS.every((k) => sub[k]);
  const completed = progress?.status === 2;

  const onComplete = async () => {
    const res = await apiCompleteLesson(id);
    message.success('课时完成！+10 积分');
    if (res.new_badges?.length) message.info(`获得徽章：${res.new_badges.map((b) => b.name).join('、')}`);
    apiLessonDetail(id).then(setDetail);
  };

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }} extra={
        completed ? <Tag color="green">课时已完成</Tag>
          : <Button type="primary" disabled={!allDone} onClick={onComplete}>完成课时 +10积分</Button>
      }>
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          {lesson.language.emoji} {lesson.title}
        </Typography.Title>
        <Typography.Text type="secondary">
          {lesson.level.name} · {lesson.course.title} · 语音 {lesson.language.speech_locale}
          {!allDone && !completed && '（完成单词/语法/听力/口语四个环节后可标记课时完成）'}
        </Typography.Text>
      </Card>
      <Card>
        <Tabs
          activeKey={activeKey}
          items={tabItems}
          onChange={(k) => navigate(`/lesson/${id}/${k}`)}
        />
        <div style={{ marginTop: 8 }}>
          <Outlet context={{ detail, refresh: () => apiLessonDetail(id).then(setDetail) }} />
        </div>
      </Card>
    </div>
  );
}
