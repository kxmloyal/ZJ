const mysql = require('mysql2/promise');
const config = require('../../config/db.config');

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.db.mysql.host,
  user: config.db.mysql.user,
  password: config.db.mysql.password,
  database: config.db.mysql.database,
  port: config.db.mysql.port,
  connectionLimit: config.db.mysql.connectionLimit,
  waitForConnections: config.db.mysql.waitForConnections
});

class FixtureModel {
  // 初始化表结构
  static async init() {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS fixtures (
          id VARCHAR(36) PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          capacity INT NOT NULL,
          schedule INT NOT NULL,
          location VARCHAR(100),
          description TEXT,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('Fixtures表初始化完成');
    } catch (error) {
      console.error('初始化Fixtures表失败:', error);
      throw error;
    }
  }
  
  // 获取所有治具
  static async getAllFixtures() {
    try {
      const [rows] = await pool.execute('SELECT * FROM fixtures ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('获取治具列表失败:', error);
      throw error;
    }
  }
  
  // 根据ID获取治具
  static async getFixtureById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM fixtures WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('获取单个治具失败:', error);
      throw error;
    }
  }
  
  // 创建新治具
  static async createFixture(data) {
    try {
      const id = data.id; // 使用前端生成的治具编号
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = createdAt;
      
      const [result] = await pool.execute(
        `INSERT INTO fixtures (id, type, capacity, schedule, location, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.type, data.capacity, data.schedule, data.location, data.description, createdAt, updatedAt]
      );
      
      return this.getFixtureById(id);
    } catch (error) {
      console.error('创建治具失败:', error);
      throw error;
    }
  }
  
  // 更新治具
  static async updateFixture(id, data) {
    try {
      const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // 构建更新字段
      const fields = [];
      const values = [];
      
      if (data.type) { fields.push('type = ?'); values.push(data.type); }
      if (data.capacity !== undefined) { fields.push('capacity = ?'); values.push(data.capacity); }
      if (data.schedule !== undefined) { fields.push('schedule = ?'); values.push(data.schedule); }
      if (data.location) { fields.push('location = ?'); values.push(data.location); }
      if (data.description) { fields.push('description = ?'); values.push(data.description); }
      
      fields.push('updated_at = ?');
      values.push(updatedAt);
      values.push(id);
      
      if (fields.length === 1) {
        // 没有可更新的字段
        return this.getFixtureById(id);
      }
      
      const query = `UPDATE fixtures SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await pool.execute(query, values);
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return this.getFixtureById(id);
    } catch (error) {
      console.error('更新治具失败:', error);
      throw error;
    }
  }
  
  // 删除治具
  static async deleteFixture(id) {
    try {
      const [result] = await pool.execute('DELETE FROM fixtures WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除治具失败:', error);
      throw error;
    }
  }
  
  // 批量导入治具
  static async importFixtures(fixturesData) {
    try {
      const results = [];
      
      for (const fixtureData of fixturesData) {
        const existingFixture = await this.getFixtureById(fixtureData.id);
        
        if (existingFixture) {
          // 更新现有治具
          await this.updateFixture(fixtureData.id, fixtureData);
          results.push({ id: fixtureData.id, status: 'updated' });
        } else {
          // 创建新治具
          const newFixture = await this.createFixture(fixtureData);
          results.push({ id: newFixture.id, status: 'created' });
        }
      }
      
      return results;
    } catch (error) {
      console.error('批量导入治具失败:', error);
      throw error;
    }
  }
}

// 初始化表结构
FixtureModel.init();

module.exports = FixtureModel;