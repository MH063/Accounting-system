/**
 * 数据库工具路由
 * 包含查看表结构等工具接口
 */

const express = require('express');
const { query, getTables } = require('../config/database');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { responseWrapper } = require('../middleware/response');
const { cacheMiddleware } = require('../middleware/apiCache');

const router = express.Router();

// 允许查询的表名白名单
const ALLOWED_TABLES = [
  'users', 'user_profiles', 'user_settings', 'roles', 'role_permissions',
  'permissions', 'user_roles', 'user_tokens', 'expense_splits', 'third_party_accounts',
  'rooms', 'room_members', 'room_invitations', 'bill_categories', 'bill_statistics',
  'expense_categories', 'expense_limits', 'historical_expense_stats', 'historical_reading_stats',
  'expenses', 'expense_statistics', 'expense_tags', 'payment_transfers', 'qr_codes',
  'qr_payment_records', 'user_payment_preferences', 'invite_codes', 'invite_code_usage',
  'activities', 'activity_participants', 'expense_types', 'special_payment_rules',
  'room_payment_rules', 'user_activity_logs', 'notifications', 'system_configs',
  'feature_flags', 'document_types', 'password_reset_tokens', 'user_activity_statistics',
  'abnormal_expense_stats', 'system_performance_metrics', 'system_resource_usage',
  'user_details', 'expense_details'
];

/**
 * 验证表名是否在白名单中
 * @param {string} tableName - 要验证的表名
 * @returns {boolean} 是否在白名单中
 */
const isTableAllowed = (tableName) => {
  return ALLOWED_TABLES.includes(tableName);
};

/**
 * 获取表结构
 * GET /api/db/table-structure?table=表名
 */
router.get('/table-structure', responseWrapper(asyncHandler(async (req, res) => {
  const { table } = req.query;
  
  // 记录表结构查询尝试
  logger.audit(req, '表结构查询尝试', { 
    table,
    timestamp: new Date().toISOString()
  });
  
  if (!table) {
    logger.db('获取表结构失败: 未提供表名参数');
    logger.security(req, '表结构查询失败: 未提供表名参数', { 
      reason: '缺少必要参数'
    });
    return res.status(400).json({
      success: false,
      message: '请提供表名参数'
    });
  }
  
  // 验证表名是否在白名单中
  if (!isTableAllowed(table)) {
    logger.db(`获取表结构失败: 表 "${table}" 不在允许查询的白名单中`);
    logger.security(req, '表结构查询失败: 表不在白名单中', { 
      table,
      reason: '表不在允许查询的白名单中'
    });
    return res.status(403).json({
      success: false,
      message: `表 "${table}" 不在允许查询的白名单中`
    });
  }
  
  // 查询表结构 - 使用参数化查询防止SQL注入
  const result = await query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [table]);
  
  if (result.rows.length === 0) {
    logger.db(`获取表结构失败: 表 "${table}" 不存在`);
    logger.security(req, '表结构查询失败: 表不存在', { 
      table,
      reason: '表不存在'
    });
    return res.status(404).json({
      success: false,
      message: `表 "${table}" 不存在`
    });
  }
  
  logger.db(`获取表结构成功: ${table}`, { columnCount: result.rows.length });
  logger.audit(req, '表结构查询成功', { 
    table,
    columnCount: result.rows.length,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: `获取表 "${table}" 结构成功`,
    data: {
      table,
      columns: result.rows
    }
  });
})));

/**
 * 查询表数据
 * GET /api/db/query?table=表名&limit=10
 */
router.get('/query', responseWrapper(asyncHandler(async (req, res) => {
  const { table, limit = 10 } = req.query;
  
  // 记录表数据查询尝试
  logger.audit(req, '表数据查询尝试', { 
    table,
    limit,
    timestamp: new Date().toISOString()
  });
  
  if (!table) {
    logger.db('查询表数据失败: 未提供表名参数');
    logger.security(req, '表数据查询失败: 未提供表名参数', { 
      reason: '缺少必要参数'
    });
    return res.status(400).json({
      success: false,
      message: '请提供表名参数'
    });
  }
  
  // 验证表名是否在白名单中
  if (!isTableAllowed(table)) {
    logger.db(`查询表数据失败: 表 "${table}" 不在允许查询的白名单中`);
    logger.security(req, '表数据查询失败: 表不在白名单中', { 
      table,
      reason: '表不在允许查询的白名单中'
    });
    return res.status(403).json({
      success: false,
      message: `表 "${table}" 不在允许查询的白名单中`
    });
  }
  
  // 验证limit参数是否为有效数字
  const parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 1000) {
    logger.db('查询表数据失败: limit参数无效');
    logger.security(req, '表数据查询失败: limit参数无效', { 
      limit,
      reason: 'limit参数必须是1到1000之间的正整数'
    });
    return res.status(400).json({
      success: false,
      message: 'limit参数必须是1到1000之间的正整数'
    });
  }
  
  // 查询表数据 - 使用参数化查询防止SQL注入
  const result = await query(`
    SELECT * FROM ${table} LIMIT $1
  `, [parsedLimit]);
  
  logger.db(`查询表数据成功: ${table}`, { rowCount: result.rows.length, limit: parsedLimit });
  logger.audit(req, '表数据查询成功', { 
    table,
    rowCount: result.rows.length,
    limit: parsedLimit,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: `查询表 "${table}" 数据成功`,
    data: {
      table,
      count: result.rows.length,
      rows: result.rows
    }
  });
})));

/**
 * 获取允许查询的表列表
 * GET /api/db/allowed-tables
 */
router.get('/allowed-tables', cacheMiddleware.medium(), responseWrapper(asyncHandler(async (req, res) => {
  // 记录表列表查询尝试
  logger.audit(req, '表列表查询尝试', { 
    timestamp: new Date().toISOString()
  });
  
  logger.db('获取允许查询的表列表');
  logger.audit(req, '表列表查询成功', { 
    tableCount: ALLOWED_TABLES.length,
    timestamp: new Date().toISOString()
  });
  
  return res.json({
    success: true,
    message: '获取允许查询的表列表成功',
    data: {
      tables: ALLOWED_TABLES,
      count: ALLOWED_TABLES.length
    }
  });
})));

module.exports = router;