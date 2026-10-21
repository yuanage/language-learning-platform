import { useEffect, useState } from 'react';
import { Card, Collapse, Tag, List, Button, Progress, Typography, Empty, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { apiLanguageTree, apiLanguages } from '@/api';

const levelColor = { beginner: 'green', intermediate: 'blue', advanced: 'purple' };

export default function CoursesPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [langs, setLangs] = useState([]);
  const [tree, setTree] = useState(null);

  useEffect(() => {
    apiLanguages().then((r) => setLangs(r.languages || []));
  }, []);
  useEffect(() => {
    if (code) apiLanguageTree(code).then(setTree);
    else setTree(null);
  }, [code]);

  const current = code || langs[0]?.code;
  useEffect(() => {
    if (!code && langs.length) navigate(`/courses/${langs[0].code}`, { replace: true });
  }, [code, langs]);

  if (!tree) return <div className="page-container"><Card loading /></div>;

  const totalLessons = tree.levels.reduce((n, lv) => n + lv.courses.reduce((m, c) => m + c.lessons.length, 0), 0);
  const doneLessons = tree.levels.reduce((n, lv) => n + lv.courses.reduce((m, c) => m + c.lessons.filter((l) => l.status === 2).length, 0), 0);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {langs.map((l) => (
          <Button key={l.code} type={l.code === current ? 'primary' : 'default'} onClick={() => navigate(`/courses/${l.code}`)}>
            {l.emoji} {l.name}
          </Button>
        ))}
      </div>

      <Card
        title={<span>{tree.language.emoji} {tree.language.name} · 分级课程体系</span>}
        extra={<Typography.Text type="secondary">总进度 {doneLessons}/{totalLessons} 课时</Typography.Text>}
      >
        <Progress percent={totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0} style={{ marginBottom: 16 }} />
        {tree.levels.length === 0 && <Empty description="暂无课程" />}
        <Collapse
          defaultActiveKey={tree.levels.map((lv) => String(lv.id))}
          items={tree.levels.map((lv) => ({
            key: String(lv.id),
            label: <Space><Tag color={levelColor[lv.level]}>{lv.name}</Tag><span>{lv.courses.length} 门课程</span></Space>,
            children: (
              <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={lv.courses}
                renderItem={(course) => {
                  const done = course.lessons.filter((l) => l.status === 2).length;
                  return (
                    <List.Item>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => navigate(`/course/${course.id}`)}
                        title={course.title}
                        extra={<Tag>{done}/{course.lessons.length} 课时</Tag>}
                      >
                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                          {course.description || '—'}
                        </Typography.Paragraph>
                        <Progress percent={course.lessons.length ? Math.round((done / course.lessons.length) * 100) : 0} size="small" />
                      </Card>
                    </List.Item>
                  );
                }}
              />
            )
          }))}
        />
      </Card>
    </div>
  );
}
