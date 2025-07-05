require('dotenv').config();
const path = require('path');

module.exports = {
  db: {
    type: process.env.DB_TYPE || 'json',
    
    // JSON文件存储配置
    json: {
      filePath: path.resolve(process.env.JSON_DB_PATH || './data/fixtures.json')
    },
    
    // MySQL配置
    mysql: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'jig_monitoring',
      port: process.env.DB_PORT || 3000,
      connectionLimit: 10,
      waitForConnections: true,
      charset: 'utf8mb4'
    }
  },
  server: {
    port: process.env.PORT || 3000
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};