const express = require('express');
const router = express.Router();
const { pool, healthCheck } = require('../config/database');
const logger = require('../config/logger');

// 简单的健康检查处理函数
const healthCheckHandler = async (req, res) => {
  try {
    const result = await healthCheck();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  } catch (error) {
    logger.error('[HEALTH] 健康检查失败', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      message: '健康检查失败',
      error: error.message
    });
  }
};

// 健康检查路由
router.get('/', healthCheckHandler);

// 模拟数据库错误
router.get('/test/database-error', async (req, res, next) => {
  try {
    // 模拟数据库连接错误
    const originalPoolQuery = pool.query;
    pool.query = async () => {
      const error = new Error('模拟数据库连接失败');
      error.code = 'ECONNREFUSED';
      throw error;
    };
    
    await pool.query('SELECT 1');
    res.json({ message: '数据库连接正常', data: null });
  } catch (error) {
    next(error);
  } finally {
    // 恢复原始方法
    pool.query = originalPoolQuery;
  }
});

// 测试服务降级机制
router.get('/test/degradation', async (req, res, next) => {
  try {
    // 模拟服务降级场景
    res.status(503).json({
      success: false,
      message: '服务降级功能暂不可用',
      degraded: true
    });
  } catch (error) {
    next(error);
  }
});

// 测试重试机制
router.get('/test/retry', async (req, res, next) => {
  try {
    res.status(501).json({
      success: false,
      message: '重试机制功能暂不可用'
    });
  } catch (error) {
    next(error);
  }
});

// 模拟各种错误类型
router.get('/test/errors/:type', async (req, res, next) => {
  const { type } = req.params;
  
  try {
    switch (type) {
      case 'validation':
        throw new Error('数据验证失败：用户输入无效');
      case 'permission':
        throw new Error('权限验证失败：访问被拒绝');
      case 'timeout':
        throw new Error('请求超时：服务器响应时间过长');
      case 'network':
        const error = new Error('网络连接失败');
        error.code = 'ENOTFOUND';
        throw error;
      case 'file':
        const fileError = new Error('文件访问被拒绝');
        fileError.code = 'EACCES';
        throw fileError;
      case 'disk':
        const diskError = new Error('磁盘空间不足');
        diskError.code = 'ENOSPC';
        throw diskError;
      default:
        throw new Error(`未知的错误类型: ${type}`);
    }
  } catch (error) {
    next(error);
  }
});

// 系统性能指标
router.get('/performance', async (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();
  
  // 获取数据库连接池状态
  const poolStats = {
    totalCount: pool.totalCount || 0,
    idleCount: pool.idleCount || 0,
    waitingCount: pool.waitingCount || 0
  };
  
  res.json({
    success: true,
    data: {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: new Date(uptime * 1000).toISOString().substr(11, 8)
      },
      database: poolStats,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;