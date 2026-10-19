import { useEffect, useState } from 'react';
import { Button, Card, Tag, Typography, message, Space, Progress, Alert, Empty } from 'antd';
import { AudioOutlined, SoundOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { apiSpeakingByLesson, apiSpeakingSubmit } from '@/api';
import useSpeech from '@/hooks/useSpeech';

export default function LessonSpeaking() {
  const { detail, refresh } = useOutletContext();
  const lessonId = detail.lesson.id;
  const locale = detail.lesson.language.speech_locale;
  const [materials, setMaterials] = useState([]);
  const { recognitionSupported, listening, transcript, startListen, stopListen, speak, hasVoiceFor } = useSpeech();

  const load = () => apiSpeakingByLesson(lessonId).then((r) => setMaterials(r.materials || []));
  useEffect(() => { load(); }, [lessonId]);

  const record = async (m) => {
    if (listening) { stopListen(); return; }
    startListen(locale, async (text) => {
      try {
        const res = await apiSpeakingSubmit(lessonId, m.id, text);
        if (res.passed) {
          message.success(`跟读通过！得分 ${res.score}（+${res.points_earned} 积分）`);
          if (res.new_badges?.length) message.info(`获得徽章：${res.new_badges.map((b) => b.name).join('、')}`);
        } else {
          message.info(`得分 ${res.score}，识别内容：「${text}」，再试一次`);
        }
        load();
        refresh();
      } catch (e) { /* 拦截器提示 */ }
    });
  };

  if (!materials.length) return <Empty description="本课时暂无跟读素材" />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {!recognitionSupported && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 16 }}
          message="当前浏览器不支持语音识别"
          description="口语跟读需要 Chrome / Edge 浏览器。你仍可点击“播放示范”进行朗读练习。"
        />
      )}
      {recognitionSupported && !hasVoiceFor(locale) && (
        <Alert type="info" showIcon style={{ marginBottom: 16 }} message={`提示：识别语言为 ${locale}，建议使用对应语言朗读`} />
      )}
      {materials.map((m, i) => (
        <Card key={m.id} style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>跟读 {i + 1}</Typography.Title>
            {m.passed ? <Tag color="green" icon={<CheckCircleFilled />}>已通过 {m.best_score}分</Tag>
              : m.best_score !== null && <Tag color="orange">最好成绩 {m.best_score}分</Tag>}
          </Space>
          <Typography.Paragraph style={{ fontSize: 18, fontWeight: 600 }}>{m.text}</Typography.Paragraph>
          <Typography.Text type="secondary">译文：{m.translation}</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Space size="middle">
              <Button icon={<SoundOutlined />} onClick={() => speak(m.text, locale, 0.9)}>播放示范</Button>
              <Button
                type={listening ? 'default' : 'primary'}
                danger={listening}
                icon={<AudioOutlined />}
                disabled={!recognitionSupported}
                onClick={() => record(m)}
              >
                {listening ? '停止录音' : '按住说话 · 点击开始跟读'}
              </Button>
            </Space>
          </div>
          {listening && (
            <div style={{ marginTop: 12, color: '#f5222d' }}>
              <span className="speech-wave">🎙 录音中…</span>
            </div>
          )}
          {transcript && !listening && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="secondary">识别结果：</Typography.Text>{transcript}
            </div>
          )}
          <Progress
            style={{ marginTop: 8 }}
            percent={m.best_score ?? 0}
            status={m.passed ? 'success' : 'normal'}
            size="small"
          />
        </Card>
      ))}
      <Alert type="info" message="评分规则：识别文本与原文的相似度 ≥60 分即通过；建议在安静环境中用正常语速朗读。" />
    </div>
  );
}
