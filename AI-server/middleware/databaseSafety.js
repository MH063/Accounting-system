/**
 * 数据库安全中间件
 * 提供安全的数据库查询功能，防止SQL注入和信息泄露
 */

const logger = require('../config/logger');
const { query } = require('../config/database');
const SafeQueryBuilder = require('../utils/safeQueryBuilder');

/**
 * 安全数据库查询中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const databaseSafety = (req, res, next) => {
  // 添加安全的数据库查询方法到请求对象
  req.safeQuery = async (sql, params = []) => {
    try {
      // 验证SQL语句是否安全
      if (!isSafeQuery(sql)) {
        throw new Error('不安全的SQL查询');
      }

      // 执行查询
      const result = await query(sql, params);
      
      // 记录查询日志
      logger.db('[SAFE_QUERY] 查询执行成功', {
        sql: sql.substring(0, 200),
        paramsCount: params.length,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (error) {
      // 记录错误日志，但不暴露敏感信息
      logger.error('[SAFE_QUERY] 查询执行失败', {
        sql: sql.substring(0, 100),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // 抛出自定义安全错误
      throw new Error('数据库查询失败');
    }
  };

  // 添加安全查询构建器到请求对象
  req.queryBuilder = SafeQueryBuilder.create();

  next();
};

/**
 * 检查SQL查询是否安全
 * @param {string} sql - SQL查询语句
 * @returns {boolean} 是否安全
 */
const isSafeQuery = (sql) => {
  if (!sql || typeof sql !== 'string') {
    return false;
  }

  // 转换为小写进行检查
  const lowerSql = sql.toLowerCase().trim();

  // 检查是否以允许的操作开头
  const allowedStarts = ['select', 'insert', 'update', 'delete'];
  const isAllowedStart = allowedStarts.some(start => lowerSql.startsWith(start));
  
  if (!isAllowedStart) {
    logger.warn('[SAFE_QUERY] 检测到不允许的SQL操作', { sql: lowerSql.substring(0, 100) });
    return false;
  }

  // 检查危险关键字
  const dangerousKeywords = [
    'drop', 'truncate', 'alter', 'create', 'exec', 'execute', 
    'shutdown', 'kill', 'grant', 'revoke', 'union'
  ];
  
  for (const keyword of dangerousKeywords) {
    if (lowerSql.includes(keyword)) {
      logger.warn('[SAFE_QUERY] 检测到危险SQL关键字', { keyword, sql: lowerSql.substring(0, 100) });
      return false;
    }
  }

  // 检查危险操作符
  const dangerousOperators = ['--', '/*', '*/', '@@'];
  
  for (const operator of dangerousOperators) {
    if (lowerSql.includes(operator)) {
      logger.warn('[SAFE_QUERY] 检测到危险SQL操作符', { operator, sql: lowerSql.substring(0, 100) });
      return false;
    }
  }

  return true;
};

/**
 * 安全的分页查询中间件
 * @param {string} table - 表名
 * @param {Object} conditions - 查询条件
 * @param {Object} options - 分页选项
 * @returns {Function} 中间件函数
 */
const safePaginatedQuery = (table, conditions = {}, options = {}) => {
  return async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // 构建查询条件
      const builder = req.queryBuilder
        .select('*')
        .from(table);
      
      // 添加条件
      Object.entries(conditions).forEach(([field, value]) => {
        builder.where(field, '=', value);
      });
      
      // 添加分页
      builder.limit(parseInt(limit)).offset(offset);
      
      const { sql, params } = builder.build();
      const result = await req.safeQuery(sql, params);
      
      // 获取总数
      const countBuilder = req.queryBuilder
        .select('COUNT(*) as total')
        .from(table);
      
      Object.entries(conditions).forEach(([field, value]) => {
        countBuilder.where(field, '=', value);
      });
      
      const { sql: countSql, params: countParams } = countBuilder.build();
      const countResult = await req.safeQuery(countSql, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      // 添加分页信息到响应
      res.paginatedData = {
        items: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 数据库连接健康检查中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const databaseHealthCheck = async (req, res, next) => {
  try {
    // 执行简单的健康检查查询
    await query('SELECT 1');
    req.dbHealthy = true;
    next();
  } catch (error) {
    logger.error('[DB_HEALTH] 数据库连接健康检查失败', { error: error.message });
    req.dbHealthy = false;
    
    // 根据配置决定是否继续处理
    if (req.routeRequiresDb) {
      return res.status(503).json({
        success: false,
        message: '数据库服务暂时不可用'
      });
    }
    
    next();
  }
};

module.exports = {
  databaseSafety,
  safePaginatedQuery,
  databaseHealthCheck,
  isSafeQuery
};