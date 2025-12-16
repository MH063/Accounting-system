/**
 * 基础数据访问层（Repository）
 * 提供通用的数据库操作
 */

const { query } = require('../config/database');
const logger = require('../config/logger');

class BaseRepository {
  constructor(tableName, modelClass = null) {
    this.tableName = tableName;
    this.modelClass = modelClass;
  }

  /**
   * 获取所有记录
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'DESC',
        search,
        filters = {}
      } = options;

      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // 构建WHERE条件
      const conditions = [];
      
      // 搜索条件
      if (search && this.searchableFields) {
        const searchConditions = this.searchableFields.map(field => {
          return `${field} ILIKE $${paramIndex++}`;
        });
        conditions.push(`(${searchConditions.join(' OR ')})`);
        params = params.concat(Array(this.searchableFields.length).fill(`%${search}%`));
      }

      // 过滤条件
      Object.keys(filters).forEach(field => {
        if (filters[field] !== undefined && filters[field] !== null) {
          conditions.push(`${field} = $${paramIndex++}`);
          params.push(filters[field]);
        }
      });

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      // 计算总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM ${this.tableName} 
        ${whereClause}
      `;
      
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // 分页查询
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * 
        FROM ${this.tableName} 
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      const result = await query(selectQuery, params);

      // 转换模型实例
      const data = this.modelClass 
        ? result.rows.map(row => this.modelClass.fromDatabase(row))
        : result.rows;

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error(`[${this.tableName}] 查询所有记录失败`, { error: error.message });
      throw error;
    }
  }

  /**
   * 根据ID查找记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<Object|null>} 记录数据
   */
  async findById(id) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.modelClass 
        ? this.modelClass.fromDatabase(result.rows[0])
        : result.rows[0];

    } catch (error) {
      logger.error(`[${this.tableName}] 根据ID查询失败`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * 根据条件查找单条记录
   * @param {Object} conditions - 查询条件
   * @returns {Promise<Object|null>} 记录数据
   */
  async findOne(conditions) {
    try {
      const keys = Object.keys(conditions);
      const values = Object.values(conditions);
      
      if (keys.length === 0) {
        throw new Error('查询条件不能为空');
      }

      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`,
        values
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.modelClass 
        ? this.modelClass.fromDatabase(result.rows[0])
        : result.rows[0];

    } catch (error) {
      logger.error(`[${this.tableName}] 条件查询失败`, { error: error.message, conditions });
      throw error;
    }
  }

  /**
   * 根据条件查找多条记录
   * @param {Object} conditions - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 记录数组
   */
  async findMany(conditions, options = {}) {
    try {
      const keys = Object.keys(conditions);
      const values = Object.values(conditions);
      
      if (keys.length === 0) {
        throw new Error('查询条件不能为空');
      }

      const { sort = 'created_at', order = 'DESC', limit } = options;
      
      let whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      let queryText = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
      
      queryText += ` ORDER BY ${sort} ${order}`;
      
      if (limit) {
        queryText += ` LIMIT $${keys.length + 1}`;
        values.push(limit);
      }

      const result = await query(queryText, values);

      return this.modelClass 
        ? result.rows.map(row => this.modelClass.fromDatabase(row))
        : result.rows;

    } catch (error) {
      logger.error(`[${this.tableName}] 多条件查询失败`, { error: error.message, conditions });
      throw error;
    }
  }

  /**
   * 创建新记录
   * @param {Object} data - 创建数据
   * @returns {Promise<Object>} 创建的记录
   */
  async create(data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      
      if (keys.length === 0) {
        throw new Error('创建数据不能为空');
      }

      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      const returningClause = this.modelClass ? 'RETURNING *' : 'RETURNING id';
      
      const result = await query(
        `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) ${returningClause}`,
        values
      );

      logger.info(`[${this.tableName}] 创建记录成功`, { id: result.rows[0].id });

      return this.modelClass 
        ? this.modelClass.fromDatabase(result.rows[0])
        : result.rows[0];

    } catch (error) {
      logger.error(`[${this.tableName}] 创建记录失败`, { error: error.message, data: this.filterSensitiveData(data) });
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {number|string} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object|null>} 更新的记录
   */
  async update(id, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      
      if (keys.length === 0) {
        throw new Error('更新数据不能为空');
      }

      const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
      values.push(id); // 添加ID到参数末尾
      
      const returningClause = this.modelClass ? 'RETURNING *' : 'RETURNING id';
      
      const result = await query(
        `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} ${returningClause}`,
        values
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`[${this.tableName}] 更新记录成功`, { id });

      return this.modelClass 
        ? this.modelClass.fromDatabase(result.rows[0])
        : result.rows[0];

    } catch (error) {
      logger.error(`[${this.tableName}] 更新记录失败`, { error: error.message, id, data: this.filterSensitiveData(data) });
      throw error;
    }
  }

  /**
   * 删除记录
   * @param {number|string} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
        [id]
      );

      const success = result.rows.length > 0;
      
      if (success) {
        logger.info(`[${this.tableName}] 删除记录成功`, { id });
      } else {
        logger.warn(`[${this.tableName}] 删除记录失败: 记录不存在`, { id });
      }

      return success;

    } catch (error) {
      logger.error(`[${this.tableName}] 删除记录失败`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * 检查记录是否存在
   * @param {number|string} id - 记录ID
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(id) {
    try {
      const result = await query(
        `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
        [id]
      );

      return result.rows[0].exists;

    } catch (error) {
      logger.error(`[${this.tableName}] 检查记录存在性失败`, { error: error.message, id });
      throw error;
    }
  }

  /**
   * 统计记录数量
   * @param {Object} conditions - 查询条件
   * @returns {Promise<number>} 记录数量
   */
  async count(conditions = {}) {
    try {
      let queryText = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      let params = [];

      if (Object.keys(conditions).length > 0) {
        const keys = Object.keys(conditions);
        const values = Object.values(conditions);
        const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        
        queryText += ` WHERE ${whereClause}`;
        params = values;
      }

      const result = await query(queryText, params);
      return parseInt(result.rows[0].total);

    } catch (error) {
      logger.error(`[${this.tableName}] 统计记录数量失败`, { error: error.message, conditions });
      throw error;
    }
  }

  /**
   * 执行自定义查询
   * @param {string} queryText - SQL查询语句
   * @param {Array} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  async executeQuery(queryText, params = []) {
    try {
      const result = await query(queryText, params);
      return result;
    } catch (error) {
      logger.error(`[${this.tableName}] 执行自定义查询失败`, { 
        error: error.message, 
        query: queryText,
        params 
      });
      throw error;
    }
  }

  /**
   * 过滤敏感数据
   * @param {Object} data - 要过滤的数据
   * @returns {Object} 过滤后的数据
   */
  filterSensitiveData(data) {
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
    const filtered = { ...data };
    
    sensitiveFields.forEach(field => {
      if (filtered[field]) {
        filtered[field] = '[REDACTED]';
      }
    });

    return filtered;
  }
}

module.exports = BaseRepository;