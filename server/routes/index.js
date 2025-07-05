const express = require('express');
const router = express.Router();

// 导入子路由
const fixtureRoutes = require('./fixture.routes');
const managementRoutes = require('./management.routes');

// 注册子路由
router.use('/fixtures', fixtureRoutes);
router.use('/management', managementRoutes);

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;