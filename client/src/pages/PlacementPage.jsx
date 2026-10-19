import { useEffect, useState } from 'react';
import { Card, Steps, Radio, Button, Result, Typography, Space, Tag, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { apiPlacementQuestions, apiPlacementSubmit } from '@/api';

export default function PlacementPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiPlacementQuestions(code).then((res) => setQuestions(res.questions || []));
  }, [code]);

  const choose = (qid, idx) => setAnswers((prev) => ({ ...prev, [qid]: idx }));

  const next = () => {
    const q = questions[current];
    if (answers[q.id] === undefined) return message.warning('请先选择答案');
    if (current < questions.length - 1) setCurrent(current + 1);
    else submit();
  };

  const submit = async () => {
    setLoading(true);
    try {
      const payload = questions.map((q) => ({ question_id: q.id, chosen: answers[q.id] }));
      const res = await apiPlacementSubmit(code, payload);
      setResult(res);
      if (res.new_badges?.length) {
        message.success(`获得新徽章：${res.new_badges.map((b) => b.name).join('、')}`);
      }
    } finally { setLoading(false); }
  };

  if (result) {
    const levelName = { beginner: '入门', intermediate: '进阶', advanced: '提高' };
    return (
      <div className="page-container">
        <Card>
          <Result
            status="success"
            title={`测试完成：${result.score} / ${result.total} 题`}
            subTitle={`根据测试结果，为你推荐「${levelName[result.result_level]}」等级课程`}
            extra={
              <Space>
                <Button type="primary" onClick={() => navigate(`/courses/${code}`)}>进入我的课程</Button>
                <Button onClick={() => navigate('/')}>返回首页</Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <Card title="分级测试" extra={<Tag color="blue">{answeredCount}/{questions.length} 已答</Tag>}>
        <Typography.Paragraph type="secondary">
          通过 9 道题快速定位你的当前水平，系统将为你推荐合适的等级课程。
        </Typography.Paragraph>
        <Steps size="small" current={current} items={questions.map((_, i) => ({ title: `第${i + 1}题` }))} style={{ marginBottom: 24 }} />
        {q && (
          <>
            <Typography.Title level={5}>{q.stem}</Typography.Title>
            <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              value={answers[q.id]} onChange={(e) => choose(q.id, e.target.value)}>
              {(q.options || []).map((opt, i) => (
                <Radio key={i} value={i} style={{ padding: '8px 12px', border: '1px solid #eef0f5', borderRadius: 8 }}>
                  {opt}
                </Radio>
              ))}
            </Radio.Group>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={current === 0} onClick={() => setCurrent(current - 1)}>上一题</Button>
              <Button type="primary" loading={loading && current === questions.length - 1} onClick={next}>
                {current === questions.length - 1 ? '提交测试' : '下一题'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
