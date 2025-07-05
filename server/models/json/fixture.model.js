const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config/db.config');

// 确保数据目录存在
fs.ensureDirSync(path.dirname(config.db.json.filePath));

class FixtureModel {
  // 读取所有治具数据
  static async getAllFixtures() {
    try {
      if (!fs.existsSync(config.db.json.filePath)) {
        return [];
      }
      
      const data = await fs.readJson(config.db.json.filePath);
      return data || [];
    } catch (error) {
      console.error('读取治具数据失败:', error);
      throw error;
    }
  }
  
  // 根据ID获取治具
  static async getFixtureById(id) {
    try {
      const fixtures = await this.getAllFixtures();
      return fixtures.find(fixture => fixture.id === id);
    } catch (error) {
      console.error('获取单个治具失败:', error);
      throw error;
    }
  }
  
  // 创建新治具
  static async createFixture(data) {
    try {
      const fixtures = await this.getAllFixtures();
      
      const newFixture = {
        id: uuidv4(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      fixtures.push(newFixture);
      await this.saveFixtures(fixtures);
      
      return newFixture;
    } catch (error) {
      console.error('创建治具失败:', error);
      throw error;
    }
  }
  
  // 更新治具
  static async updateFixture(id, data) {
    try {
      const fixtures = await this.getAllFixtures();
      const index = fixtures.findIndex(fixture => fixture.id === id);
      
      if (index === -1) {
        return null;
      }
      
      fixtures[index] = {
        ...fixtures[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await this.saveFixtures(fixtures);
      return fixtures[index];
    } catch (error) {
      console.error('更新治具失败:', error);
      throw error;
    }
  }
  
  // 删除治具
  static async deleteFixture(id) {
    try {
      const fixtures = await this.getAllFixtures();
      const newFixtures = fixtures.filter(fixture => fixture.id !== id);
      
      if (newFixtures.length === fixtures.length) {
        return false;
      }
      
      await this.saveFixtures(newFixtures);
      return true;
    } catch (error) {
      console.error('删除治具失败:', error);
      throw error;
    }
  }
  
  // 批量导入治具
  static async importFixtures(fixturesData) {
    try {
      const fixtures = await this.getAllFixtures();
      const results = [];
      
      for (const fixtureData of fixturesData) {
        const existingIndex = fixtures.findIndex(f => f.id === fixtureData.id);
        
        if (existingIndex !== -1) {
          // 更新现有治具
          fixtures[existingIndex] = {
            ...fixtures[existingIndex],
            ...fixtureData,
            updatedAt: new Date().toISOString()
          };
          results.push({ id: fixtureData.id, status: 'updated' });
        } else {
          // 创建新治具
          const newFixture = {
            id: fixtureData.id || uuidv4(),
            ...fixtureData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          fixtures.push(newFixture);
          results.push({ id: newFixture.id, status: 'created' });
        }
      }
      
      await this.saveFixtures(fixtures);
      return results;
    } catch (error) {
      console.error('批量导入治具失败:', error);
      throw error;
    }
  }
  
  // 保存治具数据到文件
  static async saveFixtures(fixtures) {
    try {
      await fs.writeJson(config.db.json.filePath, fixtures, { spaces: 2 });
    } catch (error) {
      console.error('保存治具数据失败:', error);
      throw error;
    }
  }
}

module.exports = FixtureModel;