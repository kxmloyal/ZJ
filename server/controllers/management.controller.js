const { FixtureModel } = require('../models');

/**
 * 批量导入治具
 */
exports.importFixtures = async (req, res) => {
  try {
    const fixtures = req.body;
    
    if (!Array.isArray(fixtures)) {
      return res.status(400).json({ error: '导入数据必须是数组' });
    }
    
    const results = await FixtureModel.importFixtures(fixtures);
    
    res.json({
      success: true,
      total: fixtures.length,
      created: results.filter(item => item.status === 'created').length,
      updated: results.filter(item => item.status === 'updated').length,
      results
    });
  } catch (error) {
    console.error('批量导入治具失败:', error);
    res.status(500).json({ error: '批量导入治具失败' });
  }
};

/**
 * 批量导出治具
 */
exports.exportFixtures = async (req, res) => {
  try {
    const { ids } = req.query;
    let fixtures;
    
    if (ids) {
      // 导出选中的治具
      const idList = ids.split(',');
      fixtures = [];
      
      for (const id of idList) {
        const fixture = await FixtureModel.getFixtureById(id);
        if (fixture) fixtures.push(fixture);
      }
    } else {
      // 导出所有治具
      fixtures = await FixtureModel.getAllFixtures();
    }
    
    // 设置响应头为CSV格式
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="fixtures_${new Date().toISOString().slice(0,10)}.csv"`);
    
    // 生成CSV内容
    const headers = '治具编号,类型,固定产能(件/月),当前排程(件),利用率(%),存放位置,描述,创建时间,更新时间\n';
    
    const rows = fixtures.map(fixture => {
      const utilization = ((fixture.schedule / fixture.capacity) * 100).toFixed(1);
      return `"${fixture.id}",` +
             `"${fixture.type}",` +
             `${fixture.capacity},` +
             `${fixture.schedule},` +
             `${utilization}%,` +
             `"${fixture.location || ''}",` +
             `"${(fixture.description || '').replace(/"/g, '""')}",` +
             `${fixture.createdAt || ''},` +
             `${fixture.updatedAt || ''}`;
    }).join('\n');
    
    res.send(headers + rows);
  } catch (error) {
    console.error('批量导出治具失败:', error);
    res.status(500).json({ error: '批量导出治具失败' });
  }
};

/**
 * 获取治具统计数据
 */
exports.getFixtureStats = async (req, res) => {
  try {
    const fixtures = await FixtureModel.getAllFixtures();
    
    // 统计各类治具数量
    const typeStats = {};
    fixtures.forEach(fixture => {
      typeStats[fixture.type] = (typeStats[fixture.type] || 0) + 1;
    });
    
    // 统计状态分布
    const statusStats = {
      normal: 0,      // 利用率 <=80%
      warning: 0,     // 80% < 利用率 <=100%
      over: 0         // 利用率 >100%
    };
    
    // 总产能和总排程
    let totalCapacity = 0;
    let totalSchedule = 0;
    
    fixtures.forEach(fixture => {
      totalCapacity += fixture.capacity;
      totalSchedule += fixture.schedule;
      
      const utilization = (fixture.schedule / fixture.capacity) * 100;
      if (utilization <= 80) {
        statusStats.normal++;
      } else if (utilization <= 100) {
        statusStats.warning++;
      } else {
        statusStats.over++;
      }
    });
    
    // 整体利用率
    const overallUtilization = (totalSchedule / totalCapacity) * 100;
    
    res.json({
      totalFixtures: fixtures.length,
      typeDistribution: typeStats,
      statusDistribution: statusStats,
      totalCapacity,
      totalSchedule,
      overallUtilization: overallUtilization.toFixed(1) + '%'
    });
  } catch (error) {
    console.error('获取治具统计数据失败:', error);
    res.status(500).json({ error: '获取治具统计数据失败' });
  }
};