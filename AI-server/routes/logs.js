const express = require('express');
const { logManager } = require('../utils/logManager');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 日志API根路径 - 显示日志服务状态
 * GET /api/logs
 */
router.get('/', (req, res) => {
  try {
    // 记录审计日志
    logger.audit(req, 'LOGS_API_ACCESS', {
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent')
    });

    const stats = logManager.getLogStats();
    const files = logManager.getLogFiles();
    
    res.json({
      success: true,
      data: {
        service: '日志管理API',
        version: '1.0.0',
        status: 'running',
        features: {
          '日志搜索': 'GET /api/logs/search',
          '日志统计': 'GET /api/logs/stats',
          '日志清理': 'POST /api/logs/cleanup',
          '文件列表': 'GET /api/logs/files'
        },
        stats: {
          totalLogFiles: files.length,
          logTypes: Object.keys(stats).length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error(`[LOG_API] 日志API根路径访问失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取日志服务状态失败',
      error: error.message
    });
  }
});

/**
 * 搜索日志
 * GET /api/logs/search
 * Query参数:
 * - level: 日志级别 (info, warn, error, debug, audit, security)
 * - keyword: 关键词
 * - startDate: 开始日期 (YYYY-MM-DD)
 * - endDate: 结束日期 (YYYY-MM-DD)
 * - limit: 返回结果数量限制 (默认100)
 */
router.get('/search', (req, res) => {
  try {
    const { level, keyword, startDate, endDate, limit = 100 } = req.query;
    
    // 记录审计日志
    logger.audit(req, '日志搜索', {
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      searchParams: { level, keyword, startDate, endDate, limit }
    });

    const results = logManager.searchLogs({
      level,
      keyword,
      startDate,
      endDate,
      limit: parseInt(limit, 10)
    });

    // 提取解析后的日志对象
    const logs = results.map(result => result.parsed);

    res.json({
      success: true,
      data: {
        count: logs.length,
        logs
      }
    });
  } catch (error) {
    logger.error(`[LOG_API] 搜索日志失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '搜索日志失败',
      error: error.message
    });
  }
});

/**
 * 获取日志统计信息
 * GET /api/logs/stats
 */
router.get('/stats', (req, res) => {
  try {
    // 记录审计日志
    logger.audit(req, '日志统计查询', {
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent')
    });

    const stats = logManager.getLogStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`[LOG_API] 获取日志统计失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取日志统计失败',
      error: error.message
    });
  }
});

/**
 * 清理旧日志
 * POST /api/logs/cleanup
 * Body参数:
 * - days: 保留天数 (默认90天)
 */
router.post('/cleanup', (req, res) => {
  try {
    const { days = 90 } = req.body;
    
    // 记录审计日志
    logger.audit(req, '日志清理操作', {
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      retentionDays: days
    });

    const result = logManager.cleanupOldLogs(parseInt(days, 10));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`[LOG_API] 清理日志失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '清理日志失败',
      error: error.message
    });
  }
});

/**
 * 获取日志文件列表
 * GET /api/logs/files
 */
router.get('/files', (req, res) => {
  try {
    // 记录审计日志
    logger.audit(req, '日志文件列表查询', {
      userId: req.user ? req.user.id : 'anonymous',
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent')
    });

    const files = logManager.getLogFiles();
    
    res.json({
      success: true,
      data: {
        count: files.length,
        files
      }
    });
  } catch (error) {
    logger.error(`[LOG_API] 获取日志文件列表失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取日志文件列表失败',
      error: error.message
    });
  }
});

module.exports = router;