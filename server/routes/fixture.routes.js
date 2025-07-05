const express = require('express');
const router = express.Router();
const fixtureController = require('../controllers/fixture.controller');

// 治具基础CRUD路由
router.get('/', fixtureController.getAllFixtures);          // 获取所有治具
router.get('/:id', fixtureController.getFixtureById);      // 获取单个治具
router.post('/', fixtureController.createFixture);         // 创建治具
router.put('/:id', fixtureController.updateFixture);       // 更新治具
router.delete('/:id', fixtureController.deleteFixture);    // 删除治具

module.exports = router;