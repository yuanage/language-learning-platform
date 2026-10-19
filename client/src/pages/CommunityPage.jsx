import { useEffect, useState } from 'react';
import { Card, List, Button, Tag, Typography, Empty, Modal, Form, Input, Select, Space, message } from 'antd';
import { PlusOutlined, LikeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { apiPosts, apiCreatePost, apiLanguages } from '@/api';
import { useAuthStore } from '@/stores/authStore';

export default function CommunityPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState({ total: 0, posts: [] });
  const [langs, setLangs] = useState([]);
  const [page, setPage] = useState(1);
  const [langFilter, setLangFilter] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async (p = page, lang = langFilter) => {
    const res = await apiPosts({ page: p, page_size: 10, language: lang || undefined });
    setData(res);
  };

  useEffect(() => { apiLanguages().then((r) => setLangs(r.languages || [])); }, []);
  useEffect(() => { load(page, langFilter); }, [page, langFilter]);

  const submitPost = async () => {
    const values = await form.validateFields();
    const res = await apiCreatePost(values);
    message.success('发布成功！+2 积分');
    if (res.new_badges?.length) message.info(`获得徽章：${res.new_badges.map((b) => b.name).join('、')}`);
    setOpen(false);
    form.resetFields();
    load(1, langFilter);
  };

  return (
    <div className="page-container" style={{ maxWidth: 820 }}>
      <Card
        title="学习社区"
        extra={
          <Space>
            <Select
              allowClear placeholder="按语言筛选" style={{ width: 130 }}
              options={langs.map((l) => ({ value: l.code, label: `${l.emoji} ${l.name}` }))}
              onChange={(v) => { setPage(1); setLangFilter(v); }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>发帖</Button>
          </Space>
        }
      >
        {data.posts.length === 0 && <Empty description="还没有帖子，来发第一贴吧！" />}
        <List
          dataSource={data.posts}
          renderItem={(p) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/community/${p.id}`)}
              actions={[<span key="like"><LikeOutlined /> {p.like_count}</span>, <span key="c">💬 查看详情</span>]}
            >
              <List.Item.Meta
                title={<Space>{p.title}{p.Language && <Tag>{p.Language.emoji} {p.Language.name}</Tag>}</Space>}
                description={
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                    {p.content}
                  </Typography.Paragraph>
                }
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {p.author?.nickname} · {dayjs(p.created_at).format('MM-DD HH:mm')}
              </Typography.Text>
            </List.Item>
          )}
        />
        <Button block style={{ marginTop: 8 }} disabled={data.posts.length >= data.total} onClick={() => setPage(page + 1)}>
          加载更多（{data.posts.length}/{data.total}）
        </Button>
      </Card>

      <Modal title="发布帖子" open={open} onOk={submitPost} onCancel={() => setOpen(false)} okText="发布" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={200} placeholder="分享你的学习心得…" />
          </Form.Item>
          <Form.Item name="language_id" label="关联语言">
            <Select allowClear placeholder="可选"
              options={langs.map((l) => ({ value: l.id, label: `${l.emoji} ${l.name}` }))} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={5} maxLength={5000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
