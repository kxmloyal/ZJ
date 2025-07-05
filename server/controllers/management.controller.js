const { FixtureModel } = require('../models');

/**
 * 批量删除治具
 */
exports.batchDeleteFixtures = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供要删除的治具 ID 数组' });
    }

    for (const id of ids) {
      await FixtureModel.deleteFixture(id);
    }

    res.json({ success: true, message: '批量删除治具成功' });
  } catch (error) {
    console.error('批量删除治具失败:', error);
    res.status(500).json({ error: '批量删除治具失败' });
  }
};

/**
 * 批量导出治具
 */
exports.batchExportFixtures = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供要导出的治具 ID 数组' });
    }

    const fixtures = await FixtureModel.getAllFixtures();
    const selectedFixtures = fixtures.filter(fixture => ids.includes(fixture.id));

    const csvData = [
      'id,type,capacity,schedule,location,description,createdAt,updatedAt'
    ];

    selectedFixtures.forEach(fixture => {
      csvData.push(`${fixture.id},${fixture.type},${fixture.capacity},${fixture.schedule},${fixture.location},${fixture.description},${fixture.createdAt},${fixture.updatedAt}`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fixtures.csv');
    res.send(csvData.join('\n'));
  } catch (error) {
    console.error('批量导出治具失败:', error);
    res.status(500).json({ error: '批量导出治具失败' });
  }
};