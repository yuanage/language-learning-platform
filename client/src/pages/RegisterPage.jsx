import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { apiRegister } from '@/api';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { token, user } = await apiRegister(values);
      setAuth(token, user);
      message.success('注册成功，开始学习之旅吧！');
      navigate('/');
    } catch (e) { /* 拦截器已提示 */ } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#eef2ff 0%,#f5f7fb 60%)' }}>
      <Card style={{ width: 420, boxShadow: '0 8px 30px rgba(30,40,90,0.08)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>创建账号</Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[
            { required: true, message: '请输入用户名' },
            { pattern: /^[a-zA-Z0-9]{3,30}$/, message: '3-30 位字母或数字' }
          ]}>
            <Input placeholder="用户名（字母数字）" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="昵称" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '至少 6 位' }
          ]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item name="target_language" label="想学的语言">
            <Select placeholder="注册后可随时修改" allowClear
              options={[
                { value: 'en', label: '🇬🇧 英语' },
                { value: 'ja', label: '🇯🇵 日语' },
                { value: 'ko', label: '🇰🇷 韩语' }
              ]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>注册</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          已有账号？<Link to="/login">去登录</Link>
        </div>
      </Card>
    </div>
  );
}
