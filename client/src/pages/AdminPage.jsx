import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import { apiAdminOverview, apiAdminUsers, apiAdminSetRole } from '@/api';
import dayjs from 'dayjs';

export default function AdminPage() {
  const [ov, setOv] = useState(null);
  const [data, setData] = useState({ total: 0, users: [] });
  const [page, setPage] = useState(1);

  const load = async (p = page) => {
    const res = await apiAdminUsers({ page: p, page_size: 15 });
    setData(res);
  };

  useEffect(() => {
    apiAdminOverview().then(setOv);
    load();
  }, []);

  useEffect(() => { load(page); }, [page]);

  const setRole = async (id, role) => {
    await apiAdminSetRole(id, role);
    load();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    {
      title: '角色', dataIndex: 'role',
      render: (role, record) => (
        <Tag
          color={role === 'admin' ? 'gold' : 'blue'}
          style={{ cursor: 'pointer' }}
          onClick={() => setRole(record.id, role === 'admin' ? 'user' : 'admin')}
        >{role === 'admin' ? '管理员（点击降级）' : '用户（点击升级）'}</Tag>
      )
    },
    { title: '主学语言', dataIndex: 'target_language', render: (v) => v ? ({ en: '英语', ja: '日语', ko: '韩语' }[v]) : '—' },
    { title: '等级', dataIndex: 'current_level', render: (v) => v ? ({ beginner: '入门', intermediate: '进阶', advanced: '提高' }[v]) : '未分级' },
    { title: '积分', dataIndex: 'total_points' },
    { title: '连续天数', dataIndex: 'streak_days' },
    { title: '注册时间', dataIndex: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') }
  ];

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}><Card><Statistic title="用户总数" value={ov?.users ?? '—'} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="社区帖子" value={ov?.posts ?? '—'} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="支持语言" value={ov?.languages ?? '—'} /></Card></Col>
      </Row>
      <Card title="用户管理">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data.users}
          pagination={{ total: data.total, pageSize: 15, current: page, onChange: setPage }}
        />
        <Typography.Text type="secondary">课程内容通过种子数据维护（database/seeds/*.json），运行 npm run seed --force 可重建内容。</Typography.Text>
      </Card>
    </div>
  );
}
