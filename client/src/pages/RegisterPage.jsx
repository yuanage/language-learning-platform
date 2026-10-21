import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { apiRegister } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import GenerativeBackground from '@/components/GenerativeBackground';

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
    <div className="auth-page">
      <GenerativeBackground seed={70513} />
      <Card className="auth-card">
        <div className="auth-brand">创建账号</div>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          加入语际，让文字带你远行
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" label="用户名" rules={[
            { required: true, message: '请输入用户名' },
            { pattern: /^[a-zA-Z0-9]{3,30}$/, message: '3-30 位字母或数字' }
          ]}>
            <Input placeholder="用户名（字母数字）" size="large" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="昵称" size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '至少 6 位' }
          ]}>
            <Input.Password placeholder="至少 6 位" size="large" />
          </Form.Item>
          <Form.Item name="target_language" label="想学的语言">
            <Select placeholder="注册后可随时修改" allowClear size="large"
              options={[
                { value: 'en', label: '🇬🇧 英语' },
                { value: 'ja', label: '🇯🇵 日语' },
                { value: 'ko', label: '🇰🇷 韩语' }
              ]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>注册</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          已有账号？<Link to="/login">去登录</Link>
        </div>
      </Card>
    </div>
  );
}
