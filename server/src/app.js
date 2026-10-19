const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/languages', require('./routes/languageRoutes'));
app.use('/api/placement', require('./routes/placementRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/vocab', require('./routes/vocabRoutes'));
app.use('/api/grammar', require('./routes/grammarRoutes'));
app.use('/api/listening', require('./routes/listeningRoutes'));
app.use('/api/speaking', require('./routes/speakingRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/recommend', require('./routes/recommendRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在' }));
app.use(errorMiddleware);

const PORT = Number(process.env.PORT || 3002);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('[db] MySQL 连接成功');
    app.listen(PORT, () => console.log(`[server] 语言学习平台后端已启动: http://localhost:${PORT}`));
  } catch (err) {
    console.error('[db] MySQL 连接失败:', err.message);
    process.exit(1);
  }
}

bootstrap();
