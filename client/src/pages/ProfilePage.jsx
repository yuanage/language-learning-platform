import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography, Calendar } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { apiProgressOverview, apiProgressPoints, apiBadges, apiCheckinHistory } from '@/api';
import { useUiStore } from '@/stores/uiStore';

function BadgeWall({ badges }) {
  return (
    <div className="badge-wall" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 12 }}>
      {badges.map((b) => (
        <div key={b.code} className={`badge-item ${b.earned ? '' : 'locked'}`} title={b.description}>
          <div className="badge-icon">{b.icon}</div>
          <div className="badge-name">{b.name}</div>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {b.earned ? dayjs(b.earned_at).format('YY-MM-DD 获得') : b.description}
          </Typography.Text>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const [overview, setOverview] = useState(null);
  const [points, setPoints] = useState([]);
  const [badges, setBadges] = useState([]);
  const [checkinDates, setCheckinDates] = useState([]);

  useEffect(() => {
    apiProgressOverview().then(setOverview);
    apiProgressPoints().then((r) => setPoints(r.records || []));
    apiBadges().then((r) => setBadges(r.badges || []));
    apiCheckinHistory().then((r) => setCheckinDates(r.dates || []));
  }, []);

  if (!overview) return <div className="page-container"><Card loading /></div>;

  const dates = overview.study_logs.map((l) => l.date);
  const minutes = overview.study_logs.map((l) => l.minutes);

  // 图表主题感知（切主题时 key 变化强制重绘）
  const chartPalette = {
    primary: isDark ? '#8fa6ff' : '#5b7cfa',
    axisLabel: isDark ? '#9aa0b5' : '#7a7f8c',
    splitLine: isDark ? '#262c47' : '#eef0f5',
    tooltipBg: isDark ? '#1f2439' : '#ffffff'
  };
  const common = {
    backgroundColor: 'transparent',
    textStyle: { color: chartPalette.axisLabel },
    tooltip: { backgroundColor: chartPalette.tooltipBg, textStyle: { color: isDark ? '#e8eaf2' : '#26262b' } }
  };

  const lineOption = {
    ...common,
    tooltip: { ...common.tooltip, trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { color: chartPalette.axisLabel }, splitLine: { show: false } },
    yAxis: { type: 'value', name: '分钟', nameTextStyle: { color: chartPalette.axisLabel }, axisLabel: { color: chartPalette.axisLabel }, splitLine: { lineStyle: { color: chartPalette.splitLine } } },
    series: [{ name: '学习时长', type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: minutes, itemStyle: { color: chartPalette.primary }, lineStyle: { color: chartPalette.primary } }]
  };

  const barOption = {
    ...common,
    tooltip: { ...common.tooltip, trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: overview.languages.map((l) => `${l.language.emoji}${l.language.name}`), axisLabel: { color: chartPalette.axisLabel } },
    yAxis: { type: 'value', max: 100, name: '完成率%', nameTextStyle: { color: chartPalette.axisLabel }, axisLabel: { color: chartPalette.axisLabel }, splitLine: { lineStyle: { color: chartPalette.splitLine } } },
    series: [{ type: 'bar', barWidth: 40, data: overview.languages.map((l) => l.percent), itemStyle: { color: chartPalette.primary, borderRadius: [6, 6, 0, 0] } }]
  };

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}><Card><Statistic title="连续学习" value={overview.streak_days} suffix="天" /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="总积分" value={overview.total_points} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="语法正确率" value={overview.grammar_accuracy ?? '—'} suffix={overview.grammar_accuracy != null ? '%' : ''} /></Card></Col>
        <Col xs={24} md={6}><Card><Statistic title="口语通过条数" value={overview.speaking_passed} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}><Card title="近 7 天学习时长"><ReactECharts key={`line-${theme}`} option={lineOption} height={260} notMerge /></Card></Col>
        <Col xs={24} md={12}><Card title="各语言课程完成率"><ReactECharts key={`bar-${theme}`} option={barOption} height={260} notMerge /></Card></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="各语言学习进度">
            <List
              dataSource={overview.languages}
              renderItem={(l) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${l.language.emoji} ${l.language.name}`}
                    description={`完成 ${l.completed_lessons} / ${l.total_lessons} 课时`}
                  />
                  <Tag color={l.percent === 100 ? 'green' : 'blue'}>{l.percent}%</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="打卡日历（近 30 天）">
            <Calendar
              fullscreen={false}
              cellRender={(d, info) => (info.type === 'date' && checkinDates.includes(d.format('YYYY-MM-DD')) ? <div style={{ textAlign: 'center' }}>🔥</div> : info.originNode)}
              headerRender={({ value }) => <Typography.Text strong>{value.format('YYYY年MM月')}（🔥 为已打卡日）</Typography.Text>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={`徽章墙（${badges.filter((b) => b.earned).length}/${badges.length}）`}>
            <BadgeWall badges={badges} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="积分流水（最近 50 条）">
            <List
              size="small"
              dataSource={points}
              renderItem={(p) => (
                <List.Item>
                  <List.Item.Meta title={p.reason} description={dayjs(p.created_at).format('YYYY-MM-DD HH:mm')} />
                  <Typography.Text type={p.delta > 0 ? 'success' : 'danger'} style={{ fontWeight: 700 }}>
                    {p.delta > 0 ? '+' : ''}{p.delta}
                  </Typography.Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
