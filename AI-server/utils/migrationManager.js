/**
 * 数据库迁移管理器
 * 提供数据库版本控制和迁移管理功能
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');
const { logger } = require('../config/logger');

class MigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../migrations');
    this.migrationTableName = 'schema_migrations';
  }

  /**
   * 初始化迁移系统
   * 创建迁移记录表
   */
  async initialize() {
    try {
      // 创建迁移记录表
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          execution_time INTEGER,
          status VARCHAR(50) DEFAULT 'completed',
          checksum VARCHAR(64)
        )
      `;
      
      await pool.query(createTableQuery);
      
      // 创建迁移目录
      try {
        await fs.mkdir(this.migrationsDir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
      
      logger.info('[MIGRATION] 迁移系统初始化成功');
      return true;
    } catch (error) {
      logger.error('[MIGRATION] 迁移系统初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建新的迁移文件
   */
  async createMigration(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const version = timestamp;
      const fileName = `${version}_${name}.js`;
      const filePath = path.join(this.migrationsDir, fileName);
      
      const template = `/**
 * Migration: ${name}
 * Version: ${version}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  /**
   * 执行迁移
   * @param {Object} client - 数据库客户端
   */
  async up(client) {
    // 在这里编写迁移逻辑
    // 示例:
    // await client.query(\`
    //   CREATE TABLE example (
    //     id SERIAL PRIMARY KEY,
    //     name VARCHAR(255) NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // \`);
    
    console.log('执行迁移: ${name}');
  },

  /**
   * 回滚迁移
   * @param {Object} client - 数据库客户端
   */
  async down(client) {
    // 在这里编写回滚逻辑
    // 示例:
    // await client.query(\`DROP TABLE IF EXISTS example\`);
    
    console.log('回滚迁移: ${name}');
  }
};
`;
      
      await fs.writeFile(filePath, template, 'utf8');
      
      logger.info(`[MIGRATION] 创建迁移文件: ${fileName}`);
      
      return {
        version,
        name,
        fileName,
        filePath
      };
    } catch (error) {
      logger.error('[MIGRATION] 创建迁移文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有迁移文件
   */
  async getAllMigrations() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrations = files
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const match = file.match(/^(\d+)_(.+)\.js$/);
          if (match) {
            return {
              version: match[1],
              name: match[2],
              fileName: file,
              filePath: path.join(this.migrationsDir, file)
            };
          }
          return null;
        })
        .filter(m => m !== null)
        .sort((a, b) => a.version.localeCompare(b.version));
      
      return migrations;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * 获取已执行的迁移记录
   */
  async getExecutedMigrations() {
    try {
      const query = `
        SELECT version, name, executed_at, execution_time, status, checksum
        FROM ${this.migrationTableName}
        ORDER BY version ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      if (error.code === '42P01') {
        // 表不存在，返回空数组
        return [];
      }
      throw error;
    }
  }

  /**
   * 获取待执行的迁移
   */
  async getPendingMigrations() {
    try {
      const allMigrations = await this.getAllMigrations();
      const executedMigrations = await this.getExecutedMigrations();
      const executedVersions = new Set(executedMigrations.map(m => m.version));
      
      return allMigrations.filter(m => !executedVersions.has(m.version));
    } catch (error) {
      logger.error('[MIGRATION] 获取待执行迁移失败:', error);
      throw error;
    }
  }

  /**
   * 执行单个迁移
   */
  async runMigration(migration) {
    const client = await pool.connect();
    const startTime = Date.now();
    
    try {
      await client.query('BEGIN');
      
      // 加载迁移文件
      const migrationModule = require(migration.filePath);
      
      // 执行迁移
      await migrationModule.up(client);
      
      const executionTime = Date.now() - startTime;
      
      // 记录迁移执行
      await client.query(`
        INSERT INTO ${this.migrationTableName} (version, name, execution_time, status)
        VALUES ($1, $2, $3, $4)
      `, [migration.version, migration.name, executionTime, 'completed']);
      
      await client.query('COMMIT');
      
      logger.info(`[MIGRATION] 执行迁移成功: ${migration.fileName} (${executionTime}ms)`);
      
      return {
        success: true,
        version: migration.version,
        name: migration.name,
        executionTime
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      logger.error(`[MIGRATION] 执行迁移失败: ${migration.fileName}`, error);
      
      // 记录失败的迁移
      try {
        await pool.query(`
          INSERT INTO ${this.migrationTableName} (version, name, status)
          VALUES ($1, $2, $3)
        `, [migration.version, migration.name, 'failed']);
      } catch (insertError) {
        logger.error('[MIGRATION] 记录迁移失败状态失败:', insertError);
      }
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 执行所有待执行的迁移
   */
  async migrate(options = {}) {
    try {
      await this.initialize();
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('[MIGRATION] 没有待执行的迁移');
        return {
          executed: 0,
          migrations: [],
          message: '数据库已是最新版本'
        };
      }
      
      const { target, steps } = options;
      let migrationsToRun = pendingMigrations;
      
      // 限制迁移数量
      if (steps && steps > 0) {
        migrationsToRun = pendingMigrations.slice(0, steps);
      } else if (target) {
        const targetIndex = pendingMigrations.findIndex(m => m.version === target);
        if (targetIndex >= 0) {
          migrationsToRun = pendingMigrations.slice(0, targetIndex + 1);
        }
      }
      
      logger.info(`[MIGRATION] 开始执行 ${migrationsToRun.length} 个迁移`);
      
      const results = [];
      
      for (const migration of migrationsToRun) {
        try {
          const result = await this.runMigration(migration);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            version: migration.version,
            name: migration.name,
            error: error.message
          });
          
          // 如果迁移失败，停止后续迁移
          break;
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      logger.info(`[MIGRATION] 迁移完成: ${successCount}/${migrationsToRun.length} 成功`);
      
      return {
        executed: successCount,
        total: migrationsToRun.length,
        migrations: results,
        message: `执行了 ${successCount} 个迁移`
      };
      
    } catch (error) {
      logger.error('[MIGRATION] 迁移执行失败:', error);
      throw error;
    }
  }

  /**
   * 回滚迁移
   */
  async rollback(options = {}) {
    const client = await pool.connect();
    
    try {
      const { steps = 1 } = options;
      
      // 获取最近执行的迁移
      const query = `
        SELECT version, name
        FROM ${this.migrationTableName}
        WHERE status = 'completed'
        ORDER BY executed_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [steps]);
      const migrationsToRollback = result.rows;
      
      if (migrationsToRollback.length === 0) {
        logger.info('[MIGRATION] 没有可回滚的迁移');
        return {
          rolledBack: 0,
          migrations: [],
          message: '没有可回滚的迁移'
        };
      }
      
      logger.info(`[MIGRATION] 开始回滚 ${migrationsToRollback.length} 个迁移`);
      
      const results = [];
      
      for (const migration of migrationsToRollback) {
        try {
          const allMigrations = await this.getAllMigrations();
          const migrationFile = allMigrations.find(m => m.version === migration.version);
          
          if (!migrationFile) {
            throw new Error(`找不到迁移文件: ${migration.version}`);
          }
          
          await client.query('BEGIN');
          
          // 加载迁移文件
          const migrationModule = require(migrationFile.filePath);
          
          // 执行回滚
          const startTime = Date.now();
          await migrationModule.down(client);
          const executionTime = Date.now() - startTime;
          
          // 删除迁移记录
          await client.query(`
            DELETE FROM ${this.migrationTableName}
            WHERE version = $1
          `, [migration.version]);
          
          await client.query('COMMIT');
          
          logger.info(`[MIGRATION] 回滚迁移成功: ${migration.version} (${executionTime}ms)`);
          
          results.push({
            success: true,
            version: migration.version,
            name: migration.name,
            executionTime
          });
          
        } catch (error) {
          await client.query('ROLLBACK');
          
          logger.error(`[MIGRATION] 回滚迁移失败: ${migration.version}`, error);
          
          results.push({
            success: false,
            version: migration.version,
            name: migration.name,
            error: error.message
          });
          
          // 回滚失败，停止后续回滚
          break;
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      logger.info(`[MIGRATION] 回滚完成: ${successCount}/${migrationsToRollback.length} 成功`);
      
      return {
        rolledBack: successCount,
        total: migrationsToRollback.length,
        migrations: results,
        message: `回滚了 ${successCount} 个迁移`
      };
      
    } catch (error) {
      logger.error('[MIGRATION] 回滚失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取迁移状态
   */
  async getStatus() {
    try {
      const allMigrations = await this.getAllMigrations();
      const executedMigrations = await this.getExecutedMigrations();
      const pendingMigrations = await this.getPendingMigrations();
      
      const executedVersions = new Set(executedMigrations.map(m => m.version));
      
      const status = allMigrations.map(migration => {
        const executed = executedVersions.has(migration.version);
        const record = executedMigrations.find(m => m.version === migration.version);
        
        return {
          version: migration.version,
          name: migration.name,
          status: executed ? 'executed' : 'pending',
          executedAt: record?.executed_at,
          executionTime: record?.execution_time
        };
      });
      
      return {
        total: allMigrations.length,
        executed: executedMigrations.length,
        pending: pendingMigrations.length,
        migrations: status,
        currentVersion: executedMigrations.length > 0 
          ? executedMigrations[executedMigrations.length - 1].version 
          : null
      };
      
    } catch (error) {
      logger.error('[MIGRATION] 获取迁移状态失败:', error);
      throw error;
    }
  }

  /**
   * 重置所有迁移（危险操作）
   */
  async reset() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 清空迁移记录表
      await client.query(`TRUNCATE ${this.migrationTableName}`);
      
      await client.query('COMMIT');
      
      logger.warn('[MIGRATION] 迁移记录已重置');
      
      return {
        success: true,
        message: '所有迁移记录已清除'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[MIGRATION] 重置迁移失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new MigrationManager();
