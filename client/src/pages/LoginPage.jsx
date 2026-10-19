import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { apiLogin } from '@/api';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { token, user } = await apiLogin(values);
      setAuth(token, user);
      message.success(`欢迎回来，${user.nickname}！`);
      navigate('/');
    } catch (e) { /* 拦截器已提示 */ } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#eef2ff 0%,#f5f7fb 60%)' }}>
      <Card style={{ width: 400, boxShadow: '0 8px 30px rgba(30,40,90,0.08)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>🌏 语际 LingoBridge</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>英 / 日 / 韩 多语种沉浸式学习平台</Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
          演示账号：admin / admin123 · demo / demo1234
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
