const express = require('express');
const router = express.Router();
const managementController = require('../controllers/management.controller');

// 批量删除治具
router.post('/batch-delete', managementController.batchDeleteFixtures);

// 批量导出治具
router.post('/batch-export', managementController.batchExportFixtures);

module.exports = router;