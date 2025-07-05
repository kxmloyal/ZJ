const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/db.config');
const routes = require('./routes');

// 初始化Express应用
const app = express();

// 配置中间件
function configureMiddleware() {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(morgan('dev')); // 日志中间件
  app.use(express.static(path.join(__dirname, '../public')));
}

// 注册路由
function registerRoutes() {
  app.use('/api', routes);
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// 配置404处理
function configure404Handler() {
  app.use((req, res) => {
    res.status(404).json({ error: 'API端点不存在', path: req.path });
  });
}

// 配置错误处理中间件
function configureErrorHandler() {
  app.use((err, req, res, next) => {
    console.error('服务器内部错误:', err.stack);
    res.status(500).json({
      error: '服务器内部错误',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

// 启动服务器
function startServer() {
  const PORT = parseInt(config.server.port, 10);
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    console.error('无效的端口号:', config.server.port);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`数据库类型: ${config.db.type}`);
    console.log(`日志级别: ${config.log.level}`);
  });
}

// 执行配置和启动
configureMiddleware();
registerRoutes();
configure404Handler();
configureErrorHandler();
startServer();

module.exports = app;