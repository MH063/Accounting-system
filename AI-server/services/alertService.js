/**
 * 系统告警服务
 * 处理系统组件监控告警的创建、查询和状态更新
 */

const { pool } = require('../config/database');
const logger = require('../config/logger');

class AlertService {
  /**
   * 创建告警
   * @param {Object} alertData 告警数据
   * @returns {Promise<Object>} 创建的告警
   */
  async createAlert(alertData) {
    const { type, level, title, content, source } = alertData;
    
    try {
      // 避免重复创建相同的未处理告警 (同一源、同一标题)
      const existing = await pool.query(
        'SELECT id FROM system_alerts WHERE source = $1 AND title = $2 AND status = \'unhandled\'',
        [source, title]
      );
      
      if (existing.rows.length > 0) {
        // 更新发生时间
        await pool.query(
          'UPDATE system_alerts SET occur_time = NOW(), updated_at = NOW() WHERE id = $1',
          [existing.rows[0].id]
        );
        return { id: existing.rows[0].id, updated: true };
      }

      const result = await pool.query(
        `INSERT INTO system_alerts (type, level, title, content, source, status, occur_time)
         VALUES ($1, $2, $3, $4, $5, 'unhandled', NOW())
         RETURNING *`,
        [type, level, title, content, source]
      );
      
      logger.warn(`[AlertService] 新告警已创建: ${title} (${level})`);
      return result.rows[0];
    } catch (error) {
      logger.error('[AlertService] 创建告警失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警列表
   * @param {Object} filters 过滤条件
   * @returns {Promise<Array>} 告警列表
   */
  async getAlerts(filters = {}) {
    const { type, level, status, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM system_alerts WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    if (level) {
      query += ` AND level = $${paramIndex++}`;
      params.push(level);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY occur_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      
      // 将Date对象转换为ISO字符串，避免pg驱动序列化问题
      const alerts = result.rows.map(row => {
        const newRow = { ...row }
        if (newRow.occur_time instanceof Date) {
          newRow.occur_time = newRow.occur_time.toISOString()
        }
        if (newRow.handle_time instanceof Date) {
          newRow.handle_time = newRow.handle_time.toISOString()
        }
        if (newRow.created_at instanceof Date) {
          newRow.created_at = newRow.created_at.toISOString()
        }
        if (newRow.updated_at instanceof Date) {
          newRow.updated_at = newRow.updated_at.toISOString()
        }
        return newRow
      })
      
      // 获取总数
      let countQuery = 'SELECT COUNT(*) FROM system_alerts WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      if (type) {
        countQuery += ` AND type = $${countParamIndex++}`;
        countParams.push(type);
      }
      if (level) {
        countQuery += ` AND level = $${countParamIndex++}`;
        countParams.push(level);
      }
      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`;
        countParams.push(status);
      }
      const countResult = await pool.query(countQuery, countParams);

      return {
        alerts: alerts,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('[AlertService] 获取告警列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getAlertStats() {
    try {
      const stats = {};
      
      // 今日告警总数
      const todayTotal = await pool.query(
        'SELECT COUNT(*) FROM system_alerts WHERE occur_time >= CURRENT_DATE'
      );
      stats.todayTotal = parseInt(todayTotal.rows[0].count);

      // 未处理告警数
      const unhandled = await pool.query(
        'SELECT COUNT(*) FROM system_alerts WHERE status = \'unhandled\''
      );
      stats.unhandled = parseInt(unhandled.rows[0].count);

      // 已处理告警数
      const handled = await pool.query(
        'SELECT COUNT(*) FROM system_alerts WHERE status = \'handled\''
      );
      stats.handled = parseInt(handled.rows[0].count);

      // 级别分布
      const levelDistribution = await pool.query(
        'SELECT level, COUNT(*) FROM system_alerts GROUP BY level'
      );
      stats.levelDistribution = levelDistribution.rows;

      // 类型分布
      const typeDistribution = await pool.query(
        'SELECT type, COUNT(*) FROM system_alerts GROUP BY type'
      );
      stats.typeDistribution = typeDistribution.rows;

      // 安全威胁数 (security类型的告警)
      const securityThreats = await pool.query(
        'SELECT COUNT(*) FROM system_alerts WHERE type = \'security\' AND occur_time >= CURRENT_DATE'
      );
      stats.securityThreats = parseInt(securityThreats.rows[0].count);

      return stats;
    } catch (error) {
      logger.error('[AlertService] 获取告警统计失败:', error);
      throw error;
    }
  }

  /**
   * 更新告警状态
   * @param {number} id 告警ID
   * @param {Object} updateData 更新内容
   * @returns {Promise<Object>} 更新后的告警
   */
  async updateAlertStatus(id, updateData) {
    const { status, handler, result: handleResult } = updateData;
    
    try {
      const result = await pool.query(
        `UPDATE system_alerts 
         SET status = $1, handler = $2, result = $3, handle_time = NOW(), updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [status, handler, handleResult, id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('告警不存在');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('[AlertService] 更新告警状态失败:', error);
      throw error;
    }
  }

  /**
   * 清空告警信息 (仅管理员可用)
   * @returns {Promise<number>} 受影响的行数
   */
  async clearAlerts() {
    try {
      const result = await pool.query('DELETE FROM system_alerts');
      logger.info(`[AlertService] 已清空告警信息，受影响行数: ${result.rowCount}`);
      return result.rowCount;
    } catch (error) {
      logger.error('[AlertService] 清空告警信息失败:', error);
      throw error;
    }
  }

  /**
   * 导出告警信息
   * @returns {Promise<Array>} 告警列表
   */
  async exportAlerts() {
    try {
      const result = await pool.query('SELECT * FROM system_alerts ORDER BY occur_time DESC');
      return result.rows;
    } catch (error) {
      logger.error('[AlertService] 导出告警信息失败:', error);
      throw error;
    }
  }
}

module.exports = new AlertService();
