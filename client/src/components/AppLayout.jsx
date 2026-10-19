import { Layout, Menu, Avatar, Dropdown, Badge as AntBadge, Button } from 'antd';
import {
  HomeOutlined, ReadOutlined, TeamOutlined, UserOutlined,
  TrophyOutlined, LogoutOutlined, CrownFilled, FireFilled
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const items = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/courses', icon: <ReadOutlined />, label: '课程' },
    { key: '/community', icon: <TeamOutlined />, label: '社区' },
    { key: '/profile', icon: <TrophyOutlined />, label: '我的学习' }
  ];
  if (user?.role === 'admin') {
    items.push({ key: '/admin', icon: <CrownFilled />, label: '管理' });
  }

  const selectedKey = '/' + (location.pathname.split('/')[1] || '');

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200} style={{ borderRight: '1px solid #eef0f5' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#5b7cfa' }}>
          🌏 语际 LingoBridge
        </div>
        <Menu mode="inline" items={items} selectedKeys={[selectedKey]} onClick={(e) => navigate(e.key)} style={{ borderInlineEnd: 'none' }} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingInline: 24, borderBottom: '1px solid #eef0f5', height: 64 }}>
          <span style={{ marginRight: 16, color: '#fa8c16' }}><FireFilled /> 连续 {user?.streak_days || 0} 天</span>
          <AntBadge count={user?.total_points || 0} overflowCount={99999} offset={[-4, 2]} color="#5b7cfa">
            <Dropdown menu={userMenu}>
              <Button type="text" shape="circle">
                <Avatar style={{ background: '#5b7cfa' }}>{(user?.nickname || 'U').slice(0, 1)}</Avatar>
              </Button>
            </Dropdown>
          </AntBadge>
        </Header>
        <Content style={{ overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
