/**
 * 安全数据库查询路由
 * 演示如何使用参数化查询和安全查询构建器
 */

const express = require('express');
const { query } = require('../config/database');
const SafeQueryBuilder = require('../utils/safeQueryBuilder');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandling');
const { responseWrapper } = require('../middleware/response');
const { validateRequiredParams } = require('../middleware/validation');

const router = express.Router();

/**
 * 安全的用户查询接口
 * GET /api/secure-db/users?id=123
 */
router.get('/users', 
  validateRequiredParams(['id']),
  responseWrapper(asyncHandler(async (req, res) => {
    const { id } = req.query;
    
    try {
      // 使用安全查询构建器
      const { sql, params } = SafeQueryBuilder.buildSimpleSelect('users', { id: id });
      
      logger.info('[SECURE_DB] 执行安全用户查询', { userId: id });
      
      const result = await query(sql, params);
      
      if (result.rows.length === 0) {
        return res.sendError('error_404', '用户不存在', 404);
      }
      
      logger.info('[SECURE_DB] 用户查询成功', { userId: id });
      
      return res.sendSuccess({
        user: result.rows[0]
      }, '用户信息获取成功');
    } catch (error) {
      logger.error('[SECURE_DB] 用户查询失败', { 
        userId: id, 
        error: error.message 
      });
      
      return res.sendError('error_500', '查询失败', 500);
    }
  })));

/**
 * 安全的用户列表查询接口
 * GET /api/secure-db/users-list?limit=10&offset=0
 */
router.get('/users-list',
  responseWrapper(asyncHandler(async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    
    try {
      // 使用安全查询构建器构建复杂查询
      const builder = SafeQueryBuilder.create()
        .select(['id', 'username', 'email', 'created_at'])
        .from('users')
        .orderBy('created_at', 'DESC')
        .limit(parseInt(limit))
        .offset(parseInt(offset));
      
      const { sql, params } = builder.build();
      
      logger.info('[SECURE_DB] 执行安全用户列表查询', { limit, offset });
      
      const result = await query(sql, params);
      
      logger.info('[SECURE_DB] 用户列表查询成功', { 
        count: result.rows.length,
        limit, 
        offset 
      });
      
      return res.sendSuccess({
        users: result.rows,
        count: result.rows.length
      }, '用户列表获取成功');
    } catch (error) {
      logger.error('[SECURE_DB] 用户列表查询失败', { 
        limit, 
        offset,
        error: error.message 
      });
      
      return res.sendError('error_500', '查询失败', 500);
    }
  })));

/**
 * 安全的搜索接口
 * GET /api/secure-db/search-users?keyword=john&limit=10
 */
router.get('/search-users',
  responseWrapper(asyncHandler(async (req, res) => {
    const { keyword, limit = 10 } = req.query;
    
    if (!keyword) {
      return res.sendError('error_400', '缺少搜索关键词', 400);
    }
    
    try {
      // 使用安全查询构建器进行模糊搜索
      const builder = SafeQueryBuilder.create()
        .select(['id', 'username', 'email'])
        .from('users')
        .where('username', 'ILIKE', `%${keyword}%`)
        .or('email', 'ILIKE', `%${keyword}%`)
        .limit(parseInt(limit));
      
      const { sql, params } = builder.build();
      
      logger.info('[SECURE_DB] 执行安全用户搜索', { keyword, limit });
      
      const result = await query(sql, params);
      
      logger.info('[SECURE_DB] 用户搜索成功', { 
        keyword, 
        count: result.rows.length,
        limit 
      });
      
      return res.sendSuccess({
        users: result.rows,
        count: result.rows.length,
        keyword
      }, '搜索完成');
    } catch (error) {
      logger.error('[SECURE_DB] 用户搜索失败', { 
        keyword, 
        limit,
        error: error.message 
      });
      
      return res.sendError('error_500', '搜索失败', 500);
    }
  })));

module.exports = router;