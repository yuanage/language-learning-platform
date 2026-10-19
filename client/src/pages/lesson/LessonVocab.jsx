import { useEffect, useState } from 'react';
import { Button, Card, Empty, Progress, Row, Col, Space, Statistic, Tag, Typography, message, Alert } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { CheckOutlined, RedoOutlined, SoundOutlined } from '@ant-design/icons';
import { apiVocabByLesson, apiVocabLearn, apiVocabDueToday, apiVocabReview } from '@/api';
import useSpeech from '@/hooks/useSpeech';

function FlipCard({ word, locale }) {
  const [flipped, setFlipped] = useState(false);
  const { speak } = useSpeech();
  return (
    <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
      <div className="flip-card-inner">
        <div className="flip-card-face">
          <div className="flip-word">{word.word}</div>
          {word.reading && <div className="flip-reading">{word.reading}</div>}
          <Button
            type="text" icon={<SoundOutlined />}
            onClick={(e) => { e.stopPropagation(); speak(word.example_sentence || word.word, locale); }}
          >发音</Button>
          <div className="flip-example">{word.example_sentence}</div>
        </div>
        <div className="flip-card-face back">
          <div className="flip-translation">{word.translation}</div>
          {word.reading && <div className="flip-reading">{word.word} · {word.reading}</div>}
        </div>
      </div>
    </div>
  );
}

export default function LessonVocab() {
  const { detail, refresh } = useOutletContext();
  const lessonId = detail.lesson.id;
  const locale = detail.lesson.language.speech_locale;
  const [words, setWords] = useState([]);
  const [due, setDue] = useState({ total: 0, words: [] });
  const [reviewIdx, setReviewIdx] = useState(0);
  const [tabMode, setTabMode] = useState('learn'); // learn | review

  const load = async () => {
    const res = await apiVocabByLesson(lessonId);
    setWords(res.words || []);
  };
  const loadDue = async () => {
    const res = await apiVocabDueToday(detail.lesson.language.code);
    setDue(res);
  };

  useEffect(() => { load(); loadDue(); }, [lessonId]);

  const unlearned = words.filter((w) => !w.in_review);

  const learnAll = async () => {
    const ids = unlearned.map((w) => w.id);
    const res = await apiVocabLearn(lessonId, ids);
    message.success(`已加入复习计划：${res.learned} 个单词（+${res.learned} 积分）`);
    if (res.new_badges?.length) message.info(`获得徽章：${res.new_badges.map((b) => b.name).join('、')}`);
    load();
    loadDue();
    refresh();
  };

  const learnedCount = words.filter((w) => w.in_review).length;

  const doReview = async (correct) => {
    const w = due.words[reviewIdx];
    if (!w) return;
    const res = await apiVocabReview(w.vocabulary_id ?? w.id, correct);
    message[correct ? 'success' : 'info'](correct ? `答对了！下次复习：${res.next_interval_days} 天后` : '再接再厉，明天再见这个单词');
    setReviewIdx((i) => i + 1);
    loadDue();
    refresh();
  };

  const currentDue = due.words[reviewIdx];
  const { speak } = useSpeech();

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type={tabMode === 'learn' ? 'primary' : 'default'} onClick={() => setTabMode('learn')}>本课学习</Button>
        <Button type={tabMode === 'review' ? 'primary' : 'default'} onClick={() => { setTabMode('review'); setReviewIdx(0); loadDue(); }}>
          今日复习 {due.total > 0 && <Tag color="orange">{due.total}</Tag>}
        </Button>
      </Space>

      {tabMode === 'learn' && (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space size="large">
              <Statistic title="本课词汇" value={words.length} suffix="个" />
              <Statistic title="已加入复习" value={learnedCount} suffix="个" />
              <Button type="primary" icon={<CheckOutlined />} disabled={unlearned.length === 0} onClick={learnAll}>
                全部学完（翻卡确认后点击）
              </Button>
            </Space>
            <Progress style={{ marginTop: 12 }} percent={words.length ? Math.round((learnedCount / words.length) * 100) : 0} />
          </Card>
          <Row gutter={[16, 16]}>
            {words.map((w) => (
              <Col xs={24} sm={12} md={8} key={w.id}>
                <FlipCard word={w} locale={locale} />
                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  {w.in_review ? <Tag color="green">已学 · 第{w.box_no}箱</Tag> : <Tag>未学习</Tag>}
                </div>
              </Col>
            ))}
          </Row>
        </>
      )}

      {tabMode === 'review' && (
        <>
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            message="间隔重复（Leitner 记忆法）：答对进入下一箱（复习间隔 1/2/4/8/16 天），答对才算真正记住。"
          />
          {!currentDue ? (
            <Empty description="今日没有到期待复习的单词，明天再来吧！" />
          ) : (
            <Card style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
              <Statistic title={`第 ${reviewIdx + 1} / ${due.words.length} 个`} value={currentDue.Vocabulary.word} valueStyle={{ fontSize: 34 }} />
              {currentDue.Vocabulary.reading && <Typography.Text type="secondary">{currentDue.Vocabulary.reading}</Typography.Text>}
              <div style={{ marginTop: 12 }}>
                <Button icon={<SoundOutlined />} onClick={() => speak(currentDue.Vocabulary.example_sentence || currentDue.Vocabulary.word, locale)}>播放例句</Button>
              </div>
              <Typography.Paragraph type="secondary" style={{ marginTop: 12, minHeight: 40 }}>
                {currentDue.Vocabulary.example_sentence}
              </Typography.Paragraph>
              <Space size="large" style={{ marginTop: 8 }}>
                <Button danger icon={<RedoOutlined />} size="large" onClick={() => doReview(false)}>没记住</Button>
                <Button type="primary" icon={<CheckOutlined />} size="large" onClick={() => doReview(true)}>记住了</Button>
              </Space>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
