/**
 * 安全审计和渗透测试示例路由
 * 演示如何集成和使用安全审计功能
 */

const express = require('express');
const router = express.Router();
const { responseWrapper } = require('../middleware/response');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { securityAuditor } = require('../utils/securityAudit');
const { penTester } = require('../utils/penetrationTesting');
const logger = require('../config/logger');

/**
 * 示例1: 手动触发安全审计
 * 管理员专用
 */
router.post('/audit', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper(async (req, res) => {
    try {
      const auditResults = await securityAuditor.performAudit();
      
      return res.sendSuccess({
        message: '安全审计执行完成',
        results: auditResults
      }, '审计完成');
    } catch (error) {
      logger.error('[SECURITY_AUDIT] 手动审计执行失败:', error);
      return res.sendError('安全审计执行失败', 500);
    }
  })
);

/**
 * 示例2: 手动触发渗透测试
 * 管理员专用
 */
router.post('/pentest', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper(async (req, res) => {
    try {
      const penTestResults = await penTester.runFullPenTest();
      
      return res.sendSuccess({
        message: '渗透测试执行完成',
        results: penTestResults
      }, '测试完成');
    } catch (error) {
      logger.error('[PEN_TEST] 手动渗透测试执行失败:', error);
      return res.sendError('渗透测试执行失败', 500);
    }
  })
);

/**
 * 示例3: 获取最新安全审计报告
 * 管理员专用
 */
router.get('/audit-report', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      const latestReport = securityAuditor.getLatestAuditReport();
      
      if (!latestReport) {
        return res.sendError('未找到安全审计报告', 404);
      }
      
      return res.sendSuccess({
        message: '最新安全审计报告获取成功',
        report: latestReport
      }, '获取成功');
    } catch (error) {
      logger.error('[SECURITY_AUDIT] 获取审计报告失败:', error);
      return res.sendError('获取安全审计报告失败', 500);
    }
  })
);

/**
 * 示例4: 获取最新渗透测试报告
 * 管理员专用
 */
router.get('/pentest-report', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      const latestReport = penTester.getLatestPenTestReport();
      
      if (!latestReport) {
        return res.sendError('未找到渗透测试报告', 404);
      }
      
      return res.sendSuccess({
        message: '最新渗透测试报告获取成功',
        report: latestReport
      }, '获取成功');
    } catch (error) {
      logger.error('[PEN_TEST] 获取渗透测试报告失败:', error);
      return res.sendError('获取渗透测试报告失败', 500);
    }
  })
);

/**
 * 示例5: 获取安全状态概览
 * 管理员专用
 */
router.get('/overview', 
  authenticateToken,
  authorizeAdmin,
  responseWrapper((req, res) => {
    try {
      // 获取安全审计状态
      const auditReport = securityAuditor.getLatestAuditReport();
      
      // 获取渗透测试状态
      const penTestReport = penTester.getLatestPenTestReport();
      
      // 构建安全状态概览
      const overview = {
        timestamp: new Date().toISOString(),
        audit: {
          hasReport: !!auditReport,
          lastRun: auditReport?.timestamp || null,
          summary: auditReport?.summary || null
        },
        penetrationTest: {
          hasReport: !!penTestReport,
          lastRun: penTestReport?.timestamp || null,
          summary: penTestReport?.summary || null
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version
        }
      };
      
      return res.sendSuccess({
        message: '安全状态概览获取成功',
        overview
      }, '获取成功');
    } catch (error) {
      logger.error('[SECURITY_OVERVIEW] 获取安全状态概览失败:', error);
      return res.sendError('获取安全状态概览失败', 500);
    }
  })
);

module.exports = router;