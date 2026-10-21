import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Typography, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import http from '@/api/http';

const statusTag = { 0: <Tag>未开始</Tag>, 1: <Tag color="orange">进行中</Tag>, 2: <Tag color="green">已完成</Tag> };

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    // 遍历各语言课程树定位当前课程
    const res = await http.get('/languages');
    const langs = res.languages || [];
    for (const lang of langs) {
      const tree = await http.get(`/languages/${lang.code}/tree`);
      for (const lv of tree.levels || []) {
        for (const c of lv.courses || []) {
          if (String(c.id) === String(id)) {
            setData({ course: c, level: lv, language: tree.language });
            return;
          }
        }
      }
    }
  };

  if (!data) return <div className="page-container"><Card loading /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <Card
        title={data.course.title}
        extra={<Button onClick={() => navigate(`/courses/${data.language.code}`)}>返回课程列表</Button>}
      >
        <Typography.Paragraph type="secondary">{data.course.description}</Typography.Paragraph>
        <List
          dataSource={data.course.lessons}
          renderItem={(lesson, idx) => (
            <List.Item
              actions={[
                <Button key="go" type="primary" size="small" onClick={() => navigate(`/lesson/${lesson.id}/vocab`)}>
                  {lesson.status === 2 ? '重新学习' : lesson.status === 1 ? '继续学习' : '开始学习'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Typography.Title level={4} style={{ margin: 0 }}>{idx + 1}</Typography.Title>}
                title={<Space>{lesson.title}{statusTag[lesson.status]}</Space>}
                description={`课时 #${lesson.sort}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
