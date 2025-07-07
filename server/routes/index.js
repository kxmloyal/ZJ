// ZJ/server/routes/index.js
const express = require('express');
const router = express.Router();
const fixtureController = require('../controllers/fixture.controller');
// 修改引入路径
const settingsController = require('../controllers/settings.controller'); 

// 治具相关路由
router.get('/api/fixtures', fixtureController.getAllFixtures);
router.post('/api/fixtures', fixtureController.createFixture);
router.put('/api/fixtures/:id', fixtureController.updateFixture);
router.delete('/api/fixtures/:id', fixtureController.deleteFixture);
router.post('/api/fixtures/import', fixtureController.importFixtures);

// 设置相关路由
router.post('/api/settings/storage', settingsController.saveStorageSettings);
router.post('/api/settings/pagination', settingsController.savePaginationSettings);

module.exports = router;