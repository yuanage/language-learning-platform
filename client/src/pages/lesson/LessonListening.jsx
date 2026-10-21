import { useEffect, useState } from 'react';
import { Button, Card, Input, Tag, Typography, message, Space, Slider, Alert, Empty } from 'antd';
import { SoundOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { apiListeningByLesson, apiListeningSubmit } from '@/api';
import useSpeech from '@/hooks/useSpeech';

const SPEED = [0.7, 0.9, 1.0];

export default function LessonListening() {
  const { detail, refresh } = useOutletContext();
  const lessonId = detail.lesson.id;
  const locale = detail.lesson.language.speech_locale;
  const [materials, setMaterials] = useState([]);
  const [dictation, setDictation] = useState({});
  const [results, setResults] = useState({});
  const { speak, stopSpeak, hasVoiceFor } = useSpeech();

  useEffect(() => {
    apiListeningByLesson(lessonId).then((r) => setMaterials(r.materials || []));
  }, [lessonId]);

  const rateOf = (m) => SPEED[m.speed_level ?? 1] ?? 1;

  const play = (m) => speak(m.text, locale, rateOf(m));

  const submit = async (m) => {
    const text = (dictation[m.id] || '').trim();
    if (!text) return message.warning('请先输入你听到的内容');
    const res = await apiListeningSubmit(lessonId, m.id, text);
    setResults((prev) => ({ ...prev, [m.id]: res }));
    if (res.passed) message.success(`听写通过！得分 ${res.score}`);
    else message.info(`得分 ${res.score}，再听一遍试试`);
    refresh();
  };

  if (!materials.length) return <Empty description="本课时暂无听力材料" />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="听力训练：点击播放（TTS 合成语音），把听到的内容听写下来。得分 ≥60 视为通过。"
      />
      {!hasVoiceFor(locale) && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 16 }}
          message={`未检测到 ${locale} 语音包`}
          description="Windows 请在 设置 → 时间和语言 → 语音 中安装对应语言语音包，否则可能无法正常播放。"
        />
      )}
      {materials.map((m, i) => {
        const r = results[m.id];
        return (
          <Card key={m.id} style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 12 }}>
              <Typography.Title level={5} style={{ margin: 0 }}>材料 {i + 1}</Typography.Title>
              <Tag>语速 ×{rateOf(m)}</Tag>
              {r && (r.passed ? <Tag color="green">通过 {r.score}分</Tag> : <Tag color="orange">{r.score}分</Tag>)}
            </Space>
            <Space>
              <Button type="primary" icon={<SoundOutlined />} onClick={() => play(m)}>播放</Button>
              <Button icon={<PauseCircleOutlined />} onClick={stopSpeak}>停止</Button>
            </Space>
            <Input.TextArea
              style={{ marginTop: 12 }}
              rows={2}
              placeholder="在此输入你听到的内容（听写）"
              value={dictation[m.id] || ''}
              onChange={(e) => setDictation((p) => ({ ...p, [m.id]: e.target.value }))}
            />
            <Button style={{ marginTop: 12 }} type="primary" ghost onClick={() => submit(m)}>提交听写</Button>
            {r && (
              <Card size="small" style={{ marginTop: 12, background: 'var(--llp-flip-back)' }}>
                <Typography.Paragraph>原文：<b>{r.text}</b></Typography.Paragraph>
                <Typography.Text type="secondary">译文：{r.translation}</Typography.Text>
              </Card>
            )}
          </Card>
        );
      })}
    </div>
  );
}
