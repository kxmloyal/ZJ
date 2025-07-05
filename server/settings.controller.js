// ZJ/server/settings.controller.js
const fs = require('fs');
const path = require('path');
const config = require('../config/db.config');

// 保存数据存储设置
async function saveStorageSettings(req, res) {
  const { storageType } = req.body;

  if (storageType === 'json' || storageType === 'mysql') {
    config.db.type = storageType;
    fs.writeFileSync(path.join(__dirname, '../config/db.config.json'), JSON.stringify(config, null, 2));
    res.status(200).json({ message: '数据存储设置保存成功' });
  } else {
    res.status(400).json({ message: '无效的数据存储类型' });
  }
}

// 保存分页设置
async function savePaginationSettings(req, res) {
  const { pageSize } = req.body;

  if (typeof pageSize === 'number' && pageSize > 0) {
    config.pagination.pageSize = pageSize;
    fs.writeFileSync(path.join(__dirname, '../config/db.config.json'), JSON.stringify(config, null, 2));
    res.status(200).json({ message: '分页设置保存成功' });
  } else {
    res.status(400).json({ message: '每页显示数量必须是大于 0 的整数' });
  }
}

module.exports = {
  saveStorageSettings,
  savePaginationSettings
};