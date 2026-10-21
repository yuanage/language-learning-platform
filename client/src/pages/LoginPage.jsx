import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { apiLogin } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import GenerativeBackground from '@/components/GenerativeBackground';

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
    <div className="auth-page">
      <GenerativeBackground />
      <Card className="auth-card">
        <div className="auth-brand"><span className="brand-emoji">🌏</span> 语际 LingoBridge</div>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          英 / 日 / 韩 多语种沉浸式学习平台
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 16, fontSize: 12, marginBottom: 0 }}>
          演示账号：admin / admin123 · demo / demo1234
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
