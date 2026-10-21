# 🌏 语际 LingoBridge — 多语种在线语言学习平台

支持 **英语 / 日语 / 韩语** 的沉浸式在线学习平台。技术栈：React 18 + Vite + Ant Design 5 + Zustand / Node.js + Express + Sequelize + MySQL 8（Docker）。

## 功能总览

| 模块 | 说明 |
|---|---|
| 分级课程体系 | 3 语言 × 3 级（入门/进阶/提高）；日/韩入门各 4 门课、其余各级 2 门课，每门 4 课时 |
| 单词记忆 | 翻卡学习 + Leitner 间隔重复（5 箱，1/2/4/8/16 天）今日复习队列 |
| 语法练习 | 选择题判分、答案解析、正确率统计 |
| 听力训练 | 浏览器 TTS 朗读（语速随等级 0.7/0.9/1.0），听写比对判分 |
| 口语跟读 | Web Speech API 语音识别，与原文相似度打分（≥60 通过） |
| 学习进度追踪 | 课时完成率、近 7 天学习时长图表、各语言进度、打卡日历 |
| 注册登录 | JWT 鉴权，bcrypt 密码加密，路由守卫 |
| 个性化推荐 | 分级测试（9 题）+ 规则引擎：到期复习 + 下一节课时 + 弱项模块 |
| 社区 | 发帖 / 评论 / 点赞（幂等） |
| 成就激励 | 积分流水、每日打卡、连续学习天数（streak）、10 枚徽章自动颁发 |

## 快速启动

### 方式一：Docker 一键启动（推荐）

```bash
docker compose up -d --build
```

访问地址：

- 前端：<http://localhost:8080>
- 后端 API：<http://localhost:3002/api/health>
- MySQL：宿主机 **3308** 端口（root 密码见 docker-compose.yml）

首次启动后执行一次种子数据（也可在宿主机执行，见方式二第 3 步）：

```bash
docker exec llp-server node src/scripts/seed.js
```

### 方式二：本地开发

```bash
# 1. 启动数据库（仅 MySQL，端口 3308）
docker compose up -d mysql

# 2. 启动后端（3002）
cd server
npm install --registry=https://registry.npmmirror.com
npm start

# 3. 初始化种子数据（幂等，可重复执行；--force 重建课程内容）
npm run seed

# 4. 启动前端（5174，/api 已代理到 3002）
cd ../client
npm install --registry=https://registry.npmmirror.com
npm run dev
```

## 演示账号

| 账号 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 管理员（可访问 /admin） |
| demo | demo1234 | 普通用户 |

## 推荐验收路径（端到端）

1. 注册新用户 → 选择日语 → 首页点击「分级测试」→ 完成 9 题判级
2. 进入 `课程` → 选择等级课程 → 进入第一课
3. 单词页「全部学完」入箱 → 语法页答题提交 → 听力页播放 TTS 并听写 → 口语页朗读跟读（需 Chrome/Edge）
4. 四个模块完成后点击「完成课时 +10 积分」
5. 首页查看进度/积分/打卡；`我的学习` 查看图表与徽章墙
6. 社区发帖 → 换账号评论点赞 → 徽章自动颁发

## 目录结构

```
language-learning-platform/
├── client/            # React 前端（Vite + antd + zustand + echarts）
│   └── src/{api,pages,stores,components,hooks,styles}
├── server/            # Express 后端（Sequelize + JWT）
│   └── src/{routes,controllers,models,middleware,services,scripts}
├── database/
│   ├── schema.sql     # 23 张表建表脚本（MySQL 启动时自动执行）
│   └── seeds/         # en/ja/ko 课程内容 + 徽章 + 演示账号
└── docker-compose.yml # mysql(3308) + server(3002) + client(8080)
```

## 注意事项

- **端口规划**：MySQL 3308（避开本机已占用的 3307）、后端 3002、前端 8080/5174。
- **语音功能**：语音识别（口语跟读）仅 Chrome/Edge 支持；日/韩 TTS 需要在 Windows「设置 → 时间和语言 → 语音」安装对应语音包，否则自动降级提示。
- **种子内容**：`database/seeds/*.json` 为演示用课程内容，可在文件中增删后执行 `npm run seed`（重复执行自动跳过已有课时；`--force` 重建内容）。
