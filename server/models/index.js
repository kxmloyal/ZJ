const config = require('../config/db.config');

// 根据配置选择数据库实现
let FixtureModel;

if (config.db.type === 'mysql') {
  FixtureModel = require('./mysql/fixture.model');
} else {
  // 默认使用JSON实现
  FixtureModel = require('./json/fixture.model');
}

module.exports = {
  FixtureModel
};