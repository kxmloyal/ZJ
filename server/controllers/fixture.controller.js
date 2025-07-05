const { FixtureModel } = require('../models');

/**
 * 获取所有治具
 */
exports.getAllFixtures = async (req, res) => {
  try {
    const fixtures = await FixtureModel.getAllFixtures();
    res.json(fixtures);
  } catch (error) {
    console.error('获取治具列表失败:', error);
    res.status(500).json({ error: '获取治具列表失败' });
  }
};

/**
 * 根据ID获取治具
 */
exports.getFixtureById = async (req, res) => {
  try {
    const fixture = await FixtureModel.getFixtureById(req.params.id);
    
    if (!fixture) {
      return res.status(404).json({ error: '治具不存在' });
    }
    
    res.json(fixture);
  } catch (error) {
    console.error('获取治具失败:', error);
    res.status(500).json({ error: '获取治具失败' });
  }
};

/**
 * 创建新治具
 */
exports.createFixture = async (req, res) => {
  try {
    // 验证必要字段
    if (!req.body.type || !req.body.capacity || !req.body.schedule) {
      return res.status(400).json({ error: '类型、产能和排程量为必填字段' });
    }
    
    const newFixture = await FixtureModel.createFixture(req.body);
    res.status(201).json(newFixture);
  } catch (error) {
    console.error('创建治具失败:', error);
    res.status(500).json({ error: '创建治具失败' });
  }
};

/**
 * 更新治具
 */
exports.updateFixture = async (req, res) => {
  try {
    const updatedFixture = await FixtureModel.updateFixture(req.params.id, req.body);
    
    if (!updatedFixture) {
      return res.status(404).json({ error: '治具不存在' });
    }
    
    res.json(updatedFixture);
  } catch (error) {
    console.error('更新治具失败:', error);
    res.status(500).json({ error: '更新治具失败' });
  }
};

/**
 * 删除治具
 */
exports.deleteFixture = async (req, res) => {
  try {
    const result = await FixtureModel.deleteFixture(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: '治具不存在' });
    }
    
    res.json({ message: '治具删除成功' });
  } catch (error) {
    console.error('删除治具失败:', error);
    res.status(500).json({ error: '删除治具失败' });
  }
};