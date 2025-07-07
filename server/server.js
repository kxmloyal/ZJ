// ZJ/server/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/db.config');
const routes = require('./routes');
const NodeCache = require('node-cache');
const myCache = new NodeCache();
// 新增引入 FixtureModel
const { FixtureModel } = require('./models'); 

// 初始化Express应用
const app = express();
const PORT = config.server.port;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// 静态文件服务（前端资源）
app.use(express.static(path.join(__dirname, '../public')));

// 注册API路由
app.use('/api', routes);

// 根路由（返回前端页面）
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 治具列表接口缓存
app.get('/api/fixtures', async (req, res) => {
    const cachedFixtures = myCache.get('fixtures');
    if (cachedFixtures) {
        res.json(cachedFixtures);
    } else {
        try {
            const fixtures = await FixtureModel.getAllFixtures();
            myCache.set('fixtures', fixtures, 3600); // 缓存 1 小时
            res.json(fixtures);
        } catch (error) {
            console.error('获取治具列表失败:', error);
            res.status(500).json({ error: '获取治具列表失败' });
        }
    }
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: 'API端点不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`数据库类型: ${config.db.type}`);
});

module.exports = app;