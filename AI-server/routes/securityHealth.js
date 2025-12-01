/**
 * 安全健康检查路由
 * 提供系统安全状态的监控接口
 */

const express = require('express');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const { getKeyStatus } = require('../config/jwtManager');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 安全状态概览
 * GET /api/security-health/status
 */
router.get('/status', 
  responseWrapper(asyncHandler(async (req, res) => {
    try {
      // 获取JWT密钥状态
      const jwtStatus = getKeyStatus();
      
      // 检查是否存在即将过期的密钥
      const hasExpiringKeys = jwtStatus.expiringKeys > 0;
      
      // 检查当前密钥是否即将过期
      const currentKeyExpiring = jwtStatus.currentKey && jwtStatus.currentKey.daysUntilExpiration <= 7;
      
      // 构建安全状态报告
      const securityStatus = {
        timestamp: new Date().toISOString(),
        jwt: {
          ...jwtStatus,
          status: currentKeyExpiring ? 'WARNING' : 'HEALTHY',
          message: currentKeyExpiring ? '当前密钥即将过期，请及时轮换' : 'JWT密钥状态正常'
        },
        overall: {
          status: hasExpiringKeys || currentKeyExpiring ? 'WARNING' : 'HEALTHY',
          message: hasExpiringKeys || currentKeyExpiring ? '存在需要关注的安全事项' : '系统安全状态良好'
        }
      };
      
      logger.info('[SECURITY_HEALTH] 安全状态检查完成', securityStatus);
      
      return res.sendSuccess(securityStatus, '安全状态检查完成');
    } catch (error) {
      logger.error('[SECURITY_HEALTH] 安全状态检查失败', { error: error.message });
      return res.sendError('error_500', '安全状态检查失败', 500);
    }
  }))
);

/**
 * JWT密钥详细信息
 * GET /api/security-health/jwt-details
 */
router.get('/jwt-details',
  responseWrapper(asyncHandler(async (req, res) => {
    try {
      const jwtStatus = getKeyStatus();
      
      logger.info('[SECURITY_HEALTH] JWT密钥详情查询', { 
        keyCount: jwtStatus.totalKeyCount,
        currentKeyId: jwtStatus.currentKeyId
      });
      
      return res.sendSuccess(jwtStatus, 'JWT密钥详情获取成功');
    } catch (error) {
      logger.error('[SECURITY_HEALTH] JWT密钥详情查询失败', { error: error.message });
      return res.sendError('error_500', 'JWT密钥详情查询失败', 500);
    }
  }))
);

/**
 * 安全日志摘要
 * GET /api/security-health/log-summary
 */
router.get('/log-summary',
  responseWrapper(asyncHandler(async (req, res) => {
    // 这里可以实现日志摘要功能
    // 由于日志文件可能很大，我们只返回最近的一些统计信息
    
    const logSummary = {
      timestamp: new Date().toISOString(),
      message: '日志摘要功能待实现',
      note: '出于性能考虑，完整的日志摘要功能需要单独实现'
    };
    
    logger.info('[SECURITY_HEALTH] 安全日志摘要查询');
    
    return res.sendSuccess(logSummary, '安全日志摘要查询成功');
  }))
);

module.exports = router;