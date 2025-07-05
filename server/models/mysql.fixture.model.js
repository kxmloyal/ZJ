const mysql = require('mysql2/promise');
const config = require('../config/db.config');

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 获取所有治具
async function getAllFixtures() {
  const [rows] = await pool.execute('SELECT * FROM fixtures');
  return rows;
}

// 根据ID获取治具
async function getFixtureById(id) {
  const [rows] = await pool.execute('SELECT * FROM fixtures WHERE id = ?', [id]);
  return rows[0];
}

// 创建新治具
async function createFixture(fixture) {
  const [result] = await pool.execute(
    'INSERT INTO fixtures (type, capacity, schedule, location, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [fixture.type, fixture.capacity, fixture.schedule, fixture.location, fixture.description]
  );
  return getFixtureById(result.insertId);
}

// 更新治具
async function updateFixture(id, fixture) {
  await pool.execute(
    'UPDATE fixtures SET type = ?, capacity = ?, schedule = ?, location = ?, description = ?, updated_at = NOW() WHERE id = ?',
    [fixture.type, fixture.capacity, fixture.schedule, fixture.location, fixture.description, id]
  );
  return getFixtureById(id);
}

// 删除治具
async function deleteFixture(id) {
  await pool.execute('DELETE FROM fixtures WHERE id = ?', [id]);
  return true;
}

// 获取治具统计数据
async function getFixtureStats() {
  const [total] = await pool.execute('SELECT COUNT(*) as count FROM fixtures');
  const [normal] = await pool.execute('SELECT COUNT(*) as count FROM fixtures WHERE schedule <= capacity');
  const [warning] = await pool.execute('SELECT COUNT(*) as count FROM fixtures WHERE schedule > capacity * 0.8 AND schedule <= capacity');
  const [over] = await pool.execute('SELECT COUNT(*) as count FROM fixtures WHERE schedule > capacity');
  
  return {
    total: total[0].count,
    normal: normal[0].count,
    warning: warning[0].count,
    over: over[0].count
  };
}

module.exports = {
  getAllFixtures,
  getFixtureById,
  createFixture,
  updateFixture,
  deleteFixture,
  getFixtureStats
};