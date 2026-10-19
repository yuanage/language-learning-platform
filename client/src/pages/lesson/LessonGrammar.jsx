import { useEffect, useState } from 'react';
import { Button, Card, Radio, Result, Tag, Typography, message, Space } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { apiGrammarByLesson, apiGrammarSubmit } from '@/api';

export default function LessonGrammar() {
  const { detail, refresh } = useOutletContext();
  const lessonId = detail.lesson.id;
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    apiGrammarByLesson(lessonId).then((r) => setQuestions(r.questions || []));
  }, [lessonId]);

  const submit = async () => {
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length) return message.warning(`还有 ${unanswered.length} 题未作答`);
    const payload = questions.map((q) => ({ question_id: q.id, chosen: answers[q.id] }));
    const res = await apiGrammarSubmit(lessonId, payload);
    setResult(res);
    refresh();
  };

  const reset = () => { setAnswers({}); setResult(null); };

  if (result) {
    return (
      <div>
        <Result
          status={result.correct === result.total ? 'success' : 'warning'}
          title={`答对 ${result.correct} / ${result.total} 题`}
          subTitle={result.points_earned > 0 ? `获得 ${result.points_earned} 积分` : '本轮未获得新积分（首次答对才有积分）'}
          extra={<Button type="primary" onClick={reset}>再练一遍</Button>}
        />
        <Card style={{ marginTop: 8 }}>
          {result.detail.map((d, i) => (
            <Card type="inner" key={d.question_id} style={{ marginBottom: 12 }}
              title={<Space>第{i + 1}题 {d.correct ? <Tag color="green">正确</Tag> : <Tag color="red">错误</Tag>}</Space>}>
              <Typography.Paragraph>{questions.find((q) => q.id === d.question_id)?.stem}</Typography.Paragraph>
              <Typography.Paragraph>
                正确答案：<b>{(questions.find((q) => q.id === d.question_id)?.options || [])[d.answer]}</b>
                {typeof d.chosen === 'number' && <>　你的选择：<b style={{ color: d.correct ? '#52c41a' : '#f5222d' }}>{(questions.find((q) => q.id === d.question_id)?.options || [])[d.chosen]}</b></>}
              </Typography.Paragraph>
              {d.explanation && <Typography.Text type="secondary">解析：{d.explanation}</Typography.Text>}
            </Card>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {questions.map((q, i) => (
        <Card key={q.id} style={{ marginBottom: 16 }}>
          <Typography.Title level={5}>第{i + 1}题　{q.stem}</Typography.Title>
          <Radio.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            value={answers[q.id]}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          >
            {(q.options || []).map((opt, oi) => (
              <Radio key={oi} value={oi} style={{ padding: '6px 10px', border: '1px solid #eef0f5', borderRadius: 8 }}>{opt}</Radio>
            ))}
          </Radio.Group>
        </Card>
      ))}
      <Button type="primary" size="large" block onClick={submit}>提交答案</Button>
    </div>
  );
}
