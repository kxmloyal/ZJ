const { pool } = require('../../config/db.config');
const { v4: uuidv4 } = require('uuid');

class FixtureModel {
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

    // 批量导入治具
    static async importFixtures(fixturesData) {
        try {
            const values = fixturesData.map(fixture => [
                fixture.id || uuidv4(),
                fixture.type,
                fixture.capacity,
                fixture.schedule,
                fixture.location,
                fixture.description,
                new Date().toISOString().slice(0, 19).replace('T', ' '),
                new Date().toISOString().slice(0, 19).replace('T', ' ')
            ]);

            const query = `INSERT INTO fixtures (id, type, capacity, schedule, location, description, created_at, updated_at) 
                           VALUES ? 
                           ON DUPLICATE KEY UPDATE 
                           type = VALUES(type), 
                           capacity = VALUES(capacity), 
                           schedule = VALUES(schedule), 
                           location = VALUES(location), 
                           description = VALUES(description), 
                           updated_at = VALUES(updated_at)`;

            const [result] = await pool.execute(query, [values]);
            return result;
        } catch (error) {
            console.error('批量导入治具失败:', error);
            throw error;
        }
    }

    // 其他方法...
}

module.exports = { FixtureModel };