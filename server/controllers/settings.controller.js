// ZJ/server/controllers/settings.controller.js
const fs = require('fs');
const path = require('path');
const config = require('../config/db.config');

// 保存数据存储设置
async function saveStorageSettings(req, res) {
  const { storageType } = req.body;

  if (storageType === 'json' || storageType === 'mysql') {
    config.db.type = storageType;
    // 修改写入路径
    fs.writeFileSync(path.join(__dirname, '../config/db.config.js'), `module.exports = ${JSON.stringify(config, null, 2)}`);
    res.status(200).json({ message: '数据存储设置保存成功' });
  } else {
    res.status(400).json({ message: '无效的数据存储类型' });
  }
}

// 保存分页设置
async function savePaginationSettings(req, res) {
  const { pageSize } = req.body;

  if (typeof pageSize === 'number' && pageSize > 0) {
    // 这里 config 中没有 pagination 属性，需要先定义
    if (!config.pagination) {
      config.pagination = {};
    }
    config.pagination.pageSize = pageSize;
    // 修改写入路径
    fs.writeFileSync(path.join(__dirname, '../config/db.config.js'), `module.exports = ${JSON.stringify(config, null, 2)}`);
    res.status(200).json({ message: '分页设置保存成功' });
  } else {
    res.status(400).json({ message: '每页显示数量必须是大于 0 的整数' });
  }
}

module.exports = {
  saveStorageSettings,
  savePaginationSettings
};