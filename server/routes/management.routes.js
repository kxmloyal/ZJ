const express = require('express');
const router = express.Router();
const managementController = require('../controllers/management.controller');

// 治具管理扩展路由
router.post('/import', managementController.importFixtures);   // 批量导入治具
router.get('/export', managementController.exportFixtures);    // 批量导出治具
router.get('/stats', managementController.getFixtureStats);    // 获取治具统计数据

module.exports = router;