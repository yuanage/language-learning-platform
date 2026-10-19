import { useEffect, useState } from 'react';
import { Card, Typography, Button, List, Input, Avatar, Space, Tag, message } from 'antd';
import { LikeOutlined, LikeFilled, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { apiPostDetail, apiLikePost, apiCreateComment } from '@/api';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => apiPostDetail(id).then(setData);
  useEffect(() => { load(); }, [id]);

  if (!data) return <div className="page-container"><Card loading /></div>;

  const { post, comments } = data;

  const like = async () => {
    const res = await apiLikePost(post.id);
    if (res.already) message.info('已经点过赞啦');
    load();
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const res = await apiCreateComment({ post_id: post.id, content: comment });
      message.success('评论成功！+1 积分');
      if (res.new_badges?.length) message.info(`获得徽章：${res.new_badges.map((b) => b.name).join('、')}`);
      setComment('');
      load();
    } finally { setSending(false); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 780 }}>
      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 12 }} onClick={() => navigate('/community')}>返回社区</Button>
      <Card
        title={<Space>{post.title}{post.Language && <Tag>{post.Language.emoji} {post.Language.name}</Tag>}</Space>}
        extra={
          <Button type={post.liked_by_me ? 'primary' : 'default'} icon={post.liked_by_me ? <LikeFilled /> : <LikeOutlined />} onClick={like}>
            {post.like_count}
          </Button>
        }
      >
        <Typography.Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{post.content}</Typography.Paragraph>
        <Typography.Text type="secondary">
          {post.author?.nickname} · {dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}
        </Typography.Text>
      </Card>

      <Card title={`评论（${comments.length}）`} style={{ marginTop: 16 }}>
        <List
          dataSource={comments}
          renderItem={(c) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} style={{ background: '#5b7cfa' }}>{(c.author?.nickname || 'U').slice(0, 1)}</Avatar>}
                title={<Typography.Text strong>{c.author?.nickname}</Typography.Text>}
                description={<>
                  <Typography.Paragraph style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }}>{c.content}</Typography.Paragraph>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dayjs(c.created_at).format('YYYY-MM-DD HH:mm')}</Typography.Text>
                </>}
              />
            </List.Item>
          )}
        />
        <Space.Compact style={{ width: '100%', marginTop: 12 }}>
          <Input placeholder="友善评论，理性交流…" value={comment} onChange={(e) => setComment(e.target.value)} onPressEnter={sendComment} />
          <Button type="primary" loading={sending} onClick={sendComment}>发送</Button>
        </Space.Compact>
      </Card>
    </div>
  );
}
