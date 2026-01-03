/**
 * 审计日志清理服务
 * 负责定期清理、备份和归档系统审计日志
 */

const { pool } = require('../config/database');
const { logger } = require('../config/logger');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 默认保留策略（天）
const DEFAULT_RETENTION = {
  INVALID_REQUEST: 7,      // 无效请求记录
  NORMAL_LOG: 30,          // 普通访问日志
  IMPORTANT_LOG: 180,      // 重要操作日志
  PHYSICAL_DELETE: 365     // 物理删除时长
};

class AuditCleanupService {
  /**
   * 执行审计日志清理任务
   * @param {Object} options - 清理选项
   * @returns {Promise<Object>} 清理统计结果
   */
  async performCleanup(options = {}) {
    const startTime = Date.now();
    const result = {
      cleanupTime: new Date().toISOString(),
      backedUpCount: 0,
      cleanedCount: 0,
      physicalDeletedCount: 0,
      errors: [],
      success: true
    };

    try {
      logger.info('[AuditCleanup] 开始执行审计日志清理任务...');

      // 1. 获取保留时长配置（优先从数据库读取，暂使用默认值）
      const retention = { ...DEFAULT_RETENTION, ...options.retention };

      // 2. 清理前备份即将被删除/归档的数据
      const backupResult = await this.backupOldLogs(retention);
      result.backedUpCount = backupResult.count;
      result.backupFile = backupResult.filePath;

      // 3. 执行逻辑删除/清理
      // 这里的逻辑是将无效请求和过期普通日志进行标记或清理
      const cleanupStats = await this.cleanupLogs(retention);
      result.cleanedCount = cleanupStats.cleanedCount;

      // 4. 执行物理删除（超过365天的数据）
      const deleteStats = await this.physicalDeleteLogs(retention.PHYSICAL_DELETE);
      result.physicalDeletedCount = deleteStats.deletedCount;

      // 5. 记录清理操作到管理员操作日志
      await this.logCleanupOperation(result, Date.now() - startTime);

      logger.info(`[AuditCleanup] 清理任务完成。备份: ${result.backedUpCount}, 清理: ${result.cleanedCount}, 物理删除: ${result.physicalDeletedCount}`);
      
      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
      logger.error(`[AuditCleanup] 清理任务异常: ${error.message}`, { stack: error.stack });
      
      // 记录失败的操作日志
      await this.logCleanupOperation(result, Date.now() - startTime);
      
      throw error;
    }
  }

  /**
   * 备份即将清理的日志
   */
  async backupOldLogs(retention) {
    const backupDir = path.join(__dirname, '../logs/audit/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `audit_backup_${new Date().toISOString().replace(/[:.]/g, '-')}_${uuidv4().substring(0, 8)}.json`;
    const filePath = path.join(backupDir, fileName);

    // 查询即将清理的数据（无效请求 > 7天 或 普通日志 > 30天）
    const query = `
      SELECT * FROM audit_logs 
      WHERE 
        (response_status IN (400, 401, 403, 404, 422, 429, 500) AND created_at < NOW() - INTERVAL '${retention.INVALID_REQUEST} days')
        OR 
        (response_status >= 200 AND response_status < 300 AND operation = 'SELECT' AND created_at < NOW() - INTERVAL '${retention.NORMAL_LOG} days')
    `;

    const { rows } = await pool.query(query);
    
    if (rows.length > 0) {
      // 进行数据脱敏（简单脱敏示例：掩码敏感字段）
      const sanitizedRows = rows.map(row => {
        const newRow = { ...row };
        if (newRow.old_values) newRow.old_values = '[DATA_MASKED]';
        if (newRow.new_values) newRow.new_values = '[DATA_MASKED]';
        return newRow;
      });

      fs.writeFileSync(filePath, JSON.stringify(sanitizedRows, null, 2));
      
      // 获取一个有效的系统用户ID（由于 initiated_by 有外键约束且不可为空）
      const userRes = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
      const systemUserId = userRes.rows.length > 0 ? userRes.rows[0].id : 1;

      // 记录到备份表
      await pool.query(`
        INSERT INTO admin_backup_records (
          backup_name, backup_type, backup_scope, storage_type, storage_location, 
          backup_status, initiated_by, initiated_username, backup_started_at, backup_completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        fileName, 'LOGS_DATA', JSON.stringify({ retention }), 'LOCAL_DISK', filePath, 
        'completed', systemUserId, 'SYSTEM_AUTO'
      ]);
    }

    return { count: rows.length, filePath: rows.length > 0 ? filePath : null };
  }

  /**
   * 执行日志清理（物理删除超过保留期限的记录）
   */
  async cleanupLogs(retention) {
    // 1. 清理无效请求记录 (> 7天)
    const invalidRes = await pool.query(`
      DELETE FROM audit_logs 
      WHERE (response_status IN (400, 401, 403, 404, 422, 429, 500) OR action LIKE '%login%fail%')
      AND created_at < NOW() - INTERVAL '${retention.INVALID_REQUEST} days'
    `);

    // 2. 清理普通访问日志 (> 30天)
    const normalRes = await pool.query(`
      DELETE FROM audit_logs 
      WHERE response_status >= 200 AND response_status < 300 
      AND (operation = 'SELECT' OR operation = 'INSERT') -- 对于心跳等不重要的 INSERT 也可以清理，这里简化处理
      AND action NOT LIKE '%admin%' -- 排除管理员操作
      AND created_at < NOW() - INTERVAL '${retention.NORMAL_LOG} days'
    `);

    return {
      cleanedCount: parseInt(invalidRes.rowCount || 0) + parseInt(normalRes.rowCount || 0)
    };
  }

  /**
   * 执行物理删除（彻底删除极旧的数据）
   */
  async physicalDeleteLogs(days) {
    const res = await pool.query(`
      DELETE FROM audit_logs 
      WHERE created_at < NOW() - INTERVAL '${days} days'
    `);
    
    return { deletedCount: parseInt(res.rowCount || 0) };
  }

  /**
   * 记录清理操作日志
   */
  async logCleanupOperation(stats, duration) {
    try {
      // 获取一个有效的系统用户ID
      const userRes = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
      const systemUserId = userRes.rows.length > 0 ? userRes.rows[0].id : 1;

      await pool.query(`
        INSERT INTO admin_operationlogs (
          operator_id, operator_username, operator_role, operator_ip, operator_user_agent,
          operation_type, operation_module, operation_description, operation_details, 
          operation_status, execution_time_ms, operation_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [
        systemUserId, 'SYSTEM_AUTO', 'SYSTEM', '127.0.0.1', 'AuditCleanupService/1.0',
        'SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE',
        `审计日志自动清理任务执行${stats.success ? '成功' : '失败'}`,
        JSON.stringify(stats),
        stats.success ? 'success' : 'failed',
        duration
      ]);
    } catch (err) {
      logger.error(`[AuditCleanup] 记录清理操作日志失败: ${err.message}`);
    }
  }
}

module.exports = new AuditCleanupService();
