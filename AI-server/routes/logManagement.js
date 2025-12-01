/**
 * 日志管理路由
 * 提供日志统计、轮转和清理功能
 */

const express = require('express');
const router = express.Router();
const { getLogStats, performLogRotation, compressOldLogFiles, LOG_CONFIG } = require('../utils/logRotation');
const loggerModule = require('../config/logger');
const logger = loggerModule.logger;

/**
 * 日志API根路径 - 显示日志服务状态
 * GET /api/logs
 */
router.get('/', async (req, res) => {
  try {
    // 记录审计日志
    loggerModule.audit(req, 'LOGS_API_ACCESS', {
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 获取基本统计信息
    const stats = await getLogStats();
    
    res.json({
      success: true,
      data: {
        service: '日志管理API',
        version: '1.0.0',
        status: 'running',
        features: {
          '日志搜索': 'GET /api/logs/search',
          '日志统计': 'GET /api/logs/stats',
          '日志轮转': 'POST /api/logs/rotate',
          '日志压缩': 'POST /api/logs/compress',
          '配置信息': 'GET /api/logs/config',
          '最近日志': 'GET /api/logs/recent'
        },
        stats: {
          totalLogTypes: Object.keys(stats).length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error(`[LOG_MANAGEMENT] 日志API根路径访问失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取日志服务状态失败',
      error: error.message
    });
  }
});

/**
 * 获取日志统计信息
 * GET /api/logs/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getLogStats();
    
    // 计算总体统计
    let totalSize = 0;
    let totalFiles = 0;
    let totalCompressedSize = 0;
    let totalCompressedFiles = 0;
    
    for (const [type, typeStats] of Object.entries(stats)) {
      totalSize += typeStats.totalSize;
      totalFiles += typeStats.fileCount;
      totalCompressedSize += typeStats.compressedSize;
      totalCompressedFiles += typeStats.compressedCount;
    }
    
    const overallStats = {
      totalSize,
      totalFiles,
      totalCompressedSize,
      totalCompressedFiles,
      uncompressedFiles: totalFiles - totalCompressedFiles,
      compressionRatio: totalCompressedSize > 0 ? (totalCompressedSize / (totalSize - totalCompressedSize) * 100).toFixed(2) + '%' : '0%',
      types: stats
    };
    
    // 记录审计日志
    loggerModule.audit(req, 'LOG_STATS_VIEWED', {
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      data: overallStats
    });
  } catch (error) {
    logger.error(`[LOG_MANAGEMENT] 获取日志统计信息失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取日志统计信息失败',
      error: error.message
    });
  }
});

/**
 * 手动触发日志轮转
 * POST /api/logs/rotate
 */
router.post('/rotate', async (req, res) => {
  try {
    const { logType } = req.body;
    
    // 记录审计日志
    loggerModule.audit(req, 'LOG_ROTATION_MANUAL', {
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      logType: logType || 'all'
    });
    
    // 如果指定了日志类型，只轮转特定类型的日志
    if (logType && LOG_CONFIG.logTypes[logType]) {
      // 这里需要修改performLogRotation函数以支持特定类型
      // 目前先执行全部轮转
      await performLogRotation();
      
      logger.info(`[LOG_MANAGEMENT] 手动触发日志轮转，类型: ${logType}`);
    } else {
      // 轮转所有日志
      await performLogRotation();
      
      logger.info('[LOG_MANAGEMENT] 手动触发所有日志轮转');
    }
    
    res.json({
      success: true,
      message: '日志轮转完成'
    });
  } catch (error) {
    logger.error(`[LOG_MANAGEMENT] 手动日志轮转失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '日志轮转失败',
      error: error.message
    });
  }
});

/**
 * 手动触发日志压缩
 * POST /api/logs/compress
 */
router.post('/compress', async (req, res) => {
  try {
    const { logType } = req.body;
    
    // 记录审计日志
    loggerModule.audit(req, 'LOG_COMPRESSION_MANUAL', {
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      logType: logType || 'all'
    });
    
    // 压缩旧的日志文件
    await compressOldLogFiles();
    
    logger.info('[LOG_MANAGEMENT] 手动触发日志压缩');
    
    res.json({
      success: true,
      message: '日志压缩完成'
    });
  } catch (error) {
    logger.error(`[LOG_MANAGEMENT] 手动日志压缩失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '日志压缩失败',
      error: error.message
    });
  }
});

/**
 * 获取日志配置信息
 * GET /api/logs/config
 */
router.get('/config', (req, res) => {
  try {
    // 记录审计日志
    loggerModule.audit(req, 'LOG_CONFIG_VIEWED', {
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // 返回日志配置信息（不包含敏感路径）
    const config = {
      cleanupInterval: LOG_CONFIG.cleanupInterval,
      compressionInterval: LOG_CONFIG.compressionInterval,
      logTypes: {}
    };
    
    // 只返回日志类型的大小和文件数量配置
    for (const [type, typeConfig] of Object.entries(LOG_CONFIG.logTypes)) {
      config.logTypes[type] = {
        maxSize: typeConfig.maxSize,
        maxFiles: typeConfig.maxFiles,
        maxCompressedFiles: typeConfig.maxCompressedFiles
      };
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error(`[LOG_MANAGEMENT] 获取日志配置信息失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取日志配置信息失败',
      error: error.message
    });
  }
});

/**
 * 获取最近的日志内容
 * GET /api/logs/recent
 */
router.get('/recent', async (req, res) => {
  try {
    const { logType = 'combined', lines = 100 } = req.query;
    
    // 验证日志类型
    if (!LOG_CONFIG.logTypes[logType] && logType !== 'combined' && logType !== 'error' && logType !== 'audit' && logType !== 'security') {
      return res.status(400).json({
        success: false,
        message: '无效的日志类型'
      });
    }
    
    // 记录审计日志
    logger.audit(req, 'LOG_RECENT_VIEWED', {
      user: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      logType,
      lines
    });
    
    const fs = require('fs');
    const path = require('path');
    const { tail } = require('tail');
    
    const logFile = path.join(process.cwd(), 'logs', `${logType}.log`);
    
    // 检查文件是否存在
    try {
      await fs.promises.access(logFile);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '日志文件不存在'
      });
    }
    
    // 读取文件最后几行
    const fileContent = await fs.promises.readFile(logFile, 'utf8');
    const allLines = fileContent.split('\n').filter(line => line.trim());
    const recentLines = allLines.slice(-parseInt(lines));
    
    // 解析每行日志
    const parsedLines = recentLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { raw: line };
      }
    });
    
    res.json({
      success: true,
      data: {
        logType,
        lines: parsedLines,
        totalLines: allLines.length,
        requestedLines: parseInt(lines)
      }
    });
  } catch (error) {
    logger.error(`[LOG_MANAGEMENT] 获取最近日志内容失败: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取最近日志内容失败',
      error: error.message
    });
  }
});

module.exports = router;