const db = require('../config/database');

/**
 * 通知模板数据访问层
 */
class NotificationTemplateDAL {
  /**
   * 获取所有通知模板
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>}
   */
  async getAll(filters = {}) {
    const { type, isActive } = filters;
    let query = 'SELECT * FROM notification_templates WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(isActive ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * 根据ID获取通知模板
   * @param {number} id - 模板ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const result = await db.query(
      'SELECT * FROM notification_templates WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 创建通知模板
   * @param {Object} data - 模板数据
   * @returns {Promise<Object>}
   */
  async create(data) {
    const { name, type, content, variables, createdBy } = data;

    // 自动提取变量
    const extractedVariables = variables || this.extractVariables(content);

    const result = await db.query(
      `INSERT INTO notification_templates (name, type, content, variables, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, type, content, JSON.stringify(extractedVariables), createdBy]
    );

    return this.getById(result.rows[0].id);
  }

  /**
   * 更新通知模板
   * @param {number} id - 模板ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const { name, type, content, variables, isActive } = data;

    // 自动提取变量
    const extractedVariables = variables || this.extractVariables(content);

    const result = await db.query(
      `UPDATE notification_templates
       SET name = $1, type = $2, content = $3, variables = $4, is_active = $5
       WHERE id = $6`,
      [name, type, content, JSON.stringify(extractedVariables), isActive !== undefined ? (isActive ? 1 : 0) : 1, id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.getById(id);
  }

  /**
   * 删除通知模板
   * @param {number} id - 模板ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const result = await db.query(
      'DELETE FROM notification_templates WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * 批量删除通知模板
   * @param {Array<number>} ids - 模板ID数组
   * @returns {Promise<number>} - 返回删除的行数
   */
  async batchDelete(ids) {
    if (!ids || ids.length === 0) return 0;
    
    const result = await db.query(
      `DELETE FROM notification_templates WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(', ')})`,
      ids
    );
    return result.rowCount;
  }

  /**
   * 从内容中提取变量
   * @param {string} content - 模板内容
   * @returns {Array<string>}
   */
  extractVariables(content) {
    if (!content) return [];
    const matches = content.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches)]; // 去重
  }

  /**
   * 获取模板总数
   * @param {Object} filters - 过滤条件
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    const { type, isActive } = filters;
    let query = 'SELECT COUNT(*) as total FROM notification_templates WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(isActive ? 1 : 0);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total);
  }
}

module.exports = new NotificationTemplateDAL();
