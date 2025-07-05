const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/db.config');
const routes = require('./routes');

// 初始化Express应用
const app = express();
const PORT = config.server.port;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // 日志中间件

// 静态文件服务（前端资源）
app.use(express.static(path.join(__dirname, '../public')));

// 注册API路由
app.use('/api', routes);

// 根路由（返回前端页面）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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