const mysql = require('mysql2/promise');
const config = require('../server/config/db.config');
const fs = require('fs');
const path = require('path');

// 仅当使用MySQL时执行迁移
if (config.db.type !== 'mysql') {
  console.log('当前配置使用JSON存储，跳过数据库迁移');
  process.exit(0);
}

// 创建数据库连接
const pool = mysql.createPool({
  host: config.db.mysql.host,
  user: config.db.mysql.user,
  password: config.db.mysql.password,
  port: config.db.mysql.port,
  connectionLimit: config.db.mysql.connectionLimit,
  waitForConnections: config.db.mysql.waitForConnections
});

async function createDatabase() {
  try {
    await pool.execute(`CREATE DATABASE IF NOT EXISTS \`${config.db.mysql.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`数据库 ${config.db.mysql.database} 创建成功或已存在`);
  } catch (error) {
    console.error('创建数据库失败:', error);
    throw error;
  }
}

async function runMigrations() {
  try {
    // 使用创建的数据库
    await pool.execute(`USE \`${config.db.mysql.database}\``);
    
    // 读取迁移文件目录
    const migrationsDir = path.join(__dirname, '../server/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('迁移文件目录不存在，跳过迁移');
      return;
    }
    
    // 获取所有迁移文件
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`找到 ${migrationFiles.length} 个迁移文件`);
    
    // 执行每个迁移文件
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // 分割多个SQL语句
      const statements = sql.split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      for (const statement of statements) {
        await pool.execute(statement);
      }
      
      console.log(`执行迁移: ${file}`);
    }
    
    console.log('所有迁移执行完成');
  } catch (error) {
    console.error('执行迁移失败:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('开始数据库迁移...');
    await createDatabase();
    await runMigrations();
    console.log('数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

main();