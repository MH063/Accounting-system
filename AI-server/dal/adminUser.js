const db = require('../config/database');

/**
 * 管理员用户数据访问层
 * 用于获取管理员列表，用于通知接收人选择
 */
class AdminUserDAL {
  /**
   * 获取所有管理员用户
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>}
   */
  async getAllAdmins(filters = {}) {
    try {
      const { isActive } = filters;
      let query = `
        SELECT DISTINCT
          u.id,
          u.username,
          u.nickname as name,
          u.email,
          u.phone,
          r.role_name as role,
          CASE WHEN u.status = 'active' THEN true ELSE false END as "isActive",
          u.created_at as "createdAt"
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE r.role_name IN ('admin', 'system_admin')
      `;
      const params = [];
      let paramIndex = 1;

      if (isActive !== undefined) {
        query += ` AND u.status = $${paramIndex++}`;
        params.push(isActive ? 'active' : 'inactive');
      }

      query += ' ORDER BY u.created_at DESC';

      console.log('🔍 [AdminUserDAL] 执行 SQL:', query, params);
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ [AdminUserDAL] getAllAdmins 失败:', error.message);
      // 降级处理：尝试通过基础关联查询
      try {
        const fallbackQuery = `
          SELECT u.id, u.username, u.email 
          FROM users u
          JOIN user_roles ur ON u.id = ur.user_id
          JOIN roles r ON ur.role_id = r.id
          WHERE r.role_name IN ('admin', 'system_admin')
        `;
        const result = await db.query(fallbackQuery);
        return result.rows.map(row => ({
          ...row,
          name: row.username,
          isActive: true,
          role: 'admin'
        }));
      } catch (innerError) {
        console.error('❌ [AdminUserDAL] 降级查询也失败:', innerError.message);
        throw error;
      }
    }
  }

  /**
   * 根据ID获取管理员用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const result = await db.query(
      `SELECT
        u.id,
        u.username,
        u.nickname as name,
        u.email,
        u.phone,
        r.role_name as role,
        CASE WHEN u.status = 'active' THEN true ELSE false END as "isActive",
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * 获取管理员总数
   * @param {Object} filters - 过滤条件
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    const { isActive } = filters;
    let query = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.role_name IN ('admin', 'system_admin')
    `;
    const params = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      query += ` AND u.status = $${paramIndex++}`;
      params.push(isActive ? 'active' : 'inactive');
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * 根据ID列表获取管理员
   * @param {Array<number>} ids - 用户ID列表
   * @returns {Promise<Array>}
   */
  async getByIds(ids) {
    if (!ids || ids.length === 0) return [];

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT DISTINCT
        u.id,
        u.username,
        u.nickname as name,
        u.email,
        u.phone,
        r.role_name as role,
        CASE WHEN u.status = 'active' THEN true ELSE false END as "isActive",
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id IN (${placeholders})
    `;

    const result = await db.query(query, ids);
    return result.rows;
  }
}

module.exports = new AdminUserDAL();
