/**
 * 行为分析示例路由
 * 演示如何使用行为分析中间件
 */

const express = require('express');
const router = express.Router();
const { responseWrapper } = require('../middleware/response');
const { authenticateToken } = require('../middleware/auth');
const { behaviorAnalysisMiddleware, getUserBehaviorReport, detectAnomaly, getAlertStats, getUserAlertHistory } = require('../middleware/security/behaviorAnalysisMiddleware');
const logger = require('../config/logger');

/**
 * 示例1: 基本身份验证路由
 * 用于演示行为分析
 */
router.get('/profile', 
  authenticateToken,
  responseWrapper((req, res) => {
    return res.sendSuccess({
      message: '用户资料获取成功',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    }, '获取成功');
  })
);

/**
 * 示例2: 敏感操作路由
 * 用于演示异常行为检测
 */
router.post('/transfer', 
  authenticateToken,
  responseWrapper((req, res) => {
    const { amount, recipient } = req.body;
    
    // 模拟转账操作
    logger.info('[TRANSFER] 转账操作', {
      userId: req.user.id,
      amount,
      recipient
    });
    
    return res.sendSuccess({
      message: '转账操作成功',
      transactionId: `txn_${Date.now()}`,
      amount,
      recipient
    }, '转账成功');
  })
);

/**
 * 示例3: 批量操作路由
 * 用于演示高频操作检测
 */
router.post('/batch-operation', 
  authenticateToken,
  responseWrapper((req, res) => {
    const { operations } = req.body;
    
    // 模拟批量操作
    logger.info('[BATCH] 批量操作', {
      userId: req.user.id,
      operationCount: operations?.length || 0
    });
    
    return res.sendSuccess({
      message: '批量操作处理成功',
      processed: operations?.length || 0
    }, '处理成功');
  })
);

/**
 * 示例4: 获取用户行为报告
 * 管理员专用
 */
router.get('/behavior-report/:userId', 
  authenticateToken,
  (req, res, next) => {
    // 简单的管理员检查
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    next();
  },
  responseWrapper((req, res) => {
    const { userId } = req.params;
    const report = getUserBehaviorReport(userId);
    
    if (!report) {
      return res.sendError('未找到用户行为数据', 404);
    }
    
    return res.sendSuccess({
      message: '用户行为报告获取成功',
      report
    }, '获取成功');
  })
);

/**
 * 示例5: 手动触发异常检测
 * 用于测试异常检测功能
 */
router.post('/test-anomaly', 
  authenticateToken,
  responseWrapper((req, res) => {
    const { testType } = req.body;
    
    // 构造测试事件
    const testEvent = {
      userId: req.user.id,
      action: 'GET',
      resource: '/api/test/unusual-endpoint',
      ip: '192.168.1.100', // 模拟异常IP
      userAgent: req.get('User-Agent') || '',
      timestamp: Date.now()
    };
    
    // 手动触发异常检测
    const result = detectAnomaly(testEvent);
    
    return res.sendSuccess({
      message: '异常检测测试完成',
      result,
      testEvent
    }, '测试完成');
  })
);

/**
 * 示例6: 获取警报统计信息
 * 管理员专用
 */
router.get('/alert-stats', 
  authenticateToken,
  (req, res, next) => {
    // 简单的管理员检查
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    next();
  },
  responseWrapper((req, res) => {
    const stats = getAlertStats();
    
    return res.sendSuccess({
      message: '警报统计信息获取成功',
      stats
    }, '获取成功');
  })
);

/**
 * 示例7: 获取用户警报历史
 * 管理员专用
 */
router.get('/alert-history/:userId', 
  authenticateToken,
  (req, res, next) => {
    // 简单的管理员检查
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    next();
  },
  responseWrapper((req, res) => {
    const { userId } = req.params;
    const history = getUserAlertHistory(userId, 20);
    
    return res.sendSuccess({
      message: '用户警报历史获取成功',
      userId,
      history
    }, '获取成功');
  })
);

module.exports = router;