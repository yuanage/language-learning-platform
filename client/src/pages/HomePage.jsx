import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Statistic, Space, Typography, Empty, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { apiLanguages, apiRecommendToday, apiCheckin } from '@/api';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [langs, setLangs] = useState([]);
  const [recs, setRecs] = useState({}); // code -> recommend data
  const [checkinLoading, setCheckinLoading] = useState(false);

  const load = async () => {
    const { languages } = await apiLanguages();
    setLangs(languages);
    const results = await Promise.allSettled(languages.map((l) => apiRecommendToday(l.code)));
    const map = {};
    results.forEach((r, i) => { if (r.status === 'fulfilled') map[languages[i].code] = r.value; });
    setRecs(map);
  };

  useEffect(() => { load(); }, []);

  const onCheckin = async () => {
    setCheckinLoading(true);
    try {
      const res = await apiCheckin();
      if (res.checked) {
        message.success(`打卡成功！+5 积分，已连续 ${res.streak_days} 天`);
        const { user: fresh } = await import('@/api').then((m) => m.apiMe());
        setUser(fresh);
        load();
        if (res.new_badges?.length) showBadges(res.new_badges);
      } else {
        message.info(res.message || '今天已打卡');
      }
    } finally { setCheckinLoading(false); }
  };

  const showBadges = (badges) => {
    Modal.success({
      title: '🎉 获得新徽章！',
      content: badges.map((b) => `${b.icon} ${b.name} — ${b.description}`).join('，'),
    });
  };

  const levelName = { beginner: '入门', intermediate: '进阶', advanced: '提高' };

  return (
    <div className="page-container">
      <Card className="hero-banner" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              你好，{user?.nickname} 👋
            </Typography.Title>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              每天进步一点点，坚持就是胜利！
            </Typography.Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>连续学习</span>} value={user?.streak_days || 0} suffix="天" valueStyle={{ color: '#fff' }} />
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>总积分</span>} value={user?.total_points || 0} valueStyle={{ color: '#fff' }} />
              <Button size="large" loading={checkinLoading} onClick={onCheckin}>今日打卡 +5</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {langs.map((lang) => {
          const rec = recs[lang.code];
          const tested = user?.target_language === lang.code ? !!user?.current_level : !!rec?.current_level;
          return (
            <Col xs={24} md={8} key={lang.code}>
              <Card
                hoverable
                title={<span style={{ fontSize: 18 }}>{lang.emoji} {lang.name}</span>}
                extra={tested ? <Tag color="green">{levelName[rec?.current_level || user?.current_level] || '已分级'}</Tag> : <Tag color="orange">未分级</Tag>}
                onClick={() => navigate(`/courses/${lang.code}`)}
              >
                {rec ? (
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <div>🔁 今日待复习单词：<b>{rec.due_reviews}</b> 个</div>
                    {rec.next_lesson ? (
                      <div>📖 下一课：<b>{rec.next_lesson.level_name} · {rec.next_lesson.lesson_title}</b></div>
                    ) : (
                      <div>🎉 当前等级课程已全部完成！</div>
                    )}
                    {rec.weak_module && <div>⚠️ {rec.weak_module.message}</div>}
                  </Space>
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无推荐" />}
                <Space style={{ marginTop: 12 }}>
                  <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); navigate(rec?.next_lesson ? `/lesson/${rec.next_lesson.lesson_id}/vocab` : `/courses/${lang.code}`); }}>
                    开始学习
                  </Button>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/placement/${lang.code}`); }}>
                    {tested ? '重新分级测试' : '分级测试'}
                  </Button>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}>复习中心</Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
