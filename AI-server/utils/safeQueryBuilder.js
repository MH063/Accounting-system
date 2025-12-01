/**
 * 安全查询构建器
 * 确保所有数据库查询都使用参数化查询，防止SQL注入
 */

const logger = require('../config/logger');

class SafeQueryBuilder {
  constructor() {
    this.reset();
  }

  /**
   * 重置查询构建器
   */
  reset() {
    this.queryParts = [];
    this.parameters = [];
    this.paramCounter = 1;
    return this;
  }

  /**
   * 添加SELECT子句
   * @param {string|array} fields - 要选择的字段
   * @returns {SafeQueryBuilder}
   */
  select(fields) {
    if (Array.isArray(fields)) {
      this.queryParts.push(`SELECT ${fields.join(', ')}`);
    } else if (typeof fields === 'string') {
      this.queryParts.push(`SELECT ${fields}`);
    }
    return this;
  }

  /**
   * 添加FROM子句
   * @param {string} table - 表名
   * @returns {SafeQueryBuilder}
   */
  from(table) {
    // 验证表名是否符合白名单规则
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`无效的表名: ${table}`);
    }
    this.queryParts.push(`FROM ${table}`);
    return this;
  }

  /**
   * 添加WHERE子句
   * @param {string} condition - 条件表达式
   * @param {any} value - 条件值
   * @returns {SafeQueryBuilder}
   */
  where(field, operator, value) {
    // 验证字段名
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      logger.warn('[QUERY_BUILDER] 无效的字段名', { field });
      throw new Error(`无效的字段名: ${field}`);
    }

    // 验证操作符
    const allowedOperators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN', 'NOT IN'];
    const upperOperator = operator.toUpperCase();
    if (!allowedOperators.includes(upperOperator)) {
      logger.warn('[QUERY_BUILDER] 不允许的操作符', { operator });
      throw new Error(`不允许的操作符: ${operator}`);
    }
    
    // 检查操作符是否可能导致安全问题
    if (['LIKE', 'ILIKE'].includes(upperOperator)) {
      // 检查值是否包含危险的通配符模式
      if (typeof value === 'string' && (value.includes('%') || value.includes('_'))) {
        // 限制连续通配符的数量
        if (/%{3,}|_{3,}/.test(value)) {
          logger.warn('[QUERY_BUILDER] 潜在的恶意通配符模式', { value });
          throw new Error('通配符模式过于宽泛');
        }
      }
    }

    // 处理IN操作符
    if (operator.toUpperCase() === 'IN' || operator.toUpperCase() === 'NOT IN') {
      if (!Array.isArray(value)) {
        throw new Error('IN操作符需要数组值');
      }
      
      // 为数组中的每个值添加参数
      const placeholders = [];
      for (const item of value) {
        placeholders.push(`$${this.paramCounter}`);
        this.parameters.push(item);
        this.paramCounter++;
      }
      
      this.queryParts.push(`WHERE ${field} ${operator} (${placeholders.join(', ')})`);
    } else {
      // 普通操作符
      this.queryParts.push(`WHERE ${field} ${operator} $${this.paramCounter}`);
      this.parameters.push(value);
      this.paramCounter++;
    }
    
    return this;
  }

  /**
   * 添加AND条件
   * @param {string} field - 字段名
   * @param {string} operator - 操作符
   * @param {any} value - 值
   * @returns {SafeQueryBuilder}
   */
  and(field, operator, value) {
    // 验证字段名
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      logger.warn('[QUERY_BUILDER] 无效的字段名', { field });
      throw new Error(`无效的字段名: ${field}`);
    }

    // 验证操作符
    const allowedOperators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN', 'NOT IN'];
    const upperOperator = operator.toUpperCase();
    if (!allowedOperators.includes(upperOperator)) {
      logger.warn('[QUERY_BUILDER] 不允许的操作符', { operator });
      throw new Error(`不允许的操作符: ${operator}`);
    }
    
    // 检查操作符是否可能导致安全问题
    if (['LIKE', 'ILIKE'].includes(upperOperator)) {
      // 检查值是否包含危险的通配符模式
      if (typeof value === 'string' && (value.includes('%') || value.includes('_'))) {
        // 限制连续通配符的数量
        if (/%{3,}|_{3,}/.test(value)) {
          logger.warn('[QUERY_BUILDER] 潜在的恶意通配符模式', { value });
          throw new Error('通配符模式过于宽泛');
        }
      }
    }

    // 处理IN操作符
    if (operator.toUpperCase() === 'IN' || operator.toUpperCase() === 'NOT IN') {
      if (!Array.isArray(value)) {
        throw new Error('IN操作符需要数组值');
      }
      
      // 为数组中的每个值添加参数
      const placeholders = [];
      for (const item of value) {
        placeholders.push(`$${this.paramCounter}`);
        this.parameters.push(item);
        this.paramCounter++;
      }
      
      this.queryParts.push(`AND ${field} ${operator} (${placeholders.join(', ')})`);
    } else {
      // 普通操作符
      this.queryParts.push(`AND ${field} ${operator} $${this.paramCounter}`);
      this.parameters.push(value);
      this.paramCounter++;
    }
    
    return this;
  }

  /**
   * 添加ORDER BY子句
   * @param {string} field - 排序字段
   * @param {string} direction - 排序方向 ASC/DESC
   * @returns {SafeQueryBuilder}
   */
  orderBy(field, direction = 'ASC') {
    // 验证字段名
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error(`无效的字段名: ${field}`);
    }

    // 验证排序方向
    const allowedDirections = ['ASC', 'DESC'];
    if (!allowedDirections.includes(direction.toUpperCase())) {
      throw new Error(`不允许的排序方向: ${direction}`);
    }

    this.queryParts.push(`ORDER BY ${field} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * 添加LIMIT子句
   * @param {number} limit - 限制数量
   * @returns {SafeQueryBuilder}
   */
  limit(limit) {
    if (typeof limit !== 'number' || limit < 0) {
      throw new Error(`无效的LIMIT值: ${limit}`);
    }
    this.queryParts.push(`LIMIT ${limit}`);
    return this;
  }

  /**
   * 添加OFFSET子句
   * @param {number} offset - 偏移量
   * @returns {SafeQueryBuilder}
   */
  offset(offset) {
    if (typeof offset !== 'number' || offset < 0) {
      throw new Error(`无效的OFFSET值: ${offset}`);
    }
    this.queryParts.push(`OFFSET ${offset}`);
    return this;
  }

  /**
   * 构建最终的SQL查询和参数
   * @returns {Object} 包含sql和params的对象
   */
  build() {
    if (this.queryParts.length === 0) {
      throw new Error('查询不能为空');
    }

    const sql = this.queryParts.join(' ');
    const params = [...this.parameters];

    logger.debug('[QUERY_BUILDER] 构建安全查询', { sql, params });

    return {
      sql,
      params
    };
  }

  /**
   * 静态方法：创建查询构建器实例
   * @returns {SafeQueryBuilder}
   */
  static create() {
    return new SafeQueryBuilder();
  }

  /**
   * 静态方法：快速构建简单查询
   * @param {string} table - 表名
   * @param {Object} conditions - 条件对象
   * @param {number} limit - 限制数量
   * @returns {Object} 包含sql和params的对象
   */
  static buildSimpleSelect(table, conditions = {}, limit = null) {
    const builder = SafeQueryBuilder.create().select('*').from(table);

    // 添加条件
    let firstCondition = true;
    for (const [field, value] of Object.entries(conditions)) {
      if (firstCondition) {
        builder.where(field, '=', value);
        firstCondition = false;
      } else {
        builder.and(field, '=', value);
      }
    }

    // 添加限制
    if (limit !== null) {
      builder.limit(limit);
    }

    return builder.build();
  }
}

module.exports = SafeQueryBuilder;