/**
 * 数据库管理路由
 * 提供数据库迁移、监控和集群管理API
 */

const express = require('express');
const router = express.Router();
const migrationManager = require('../utils/migrationManager');
const poolMonitor = require('../utils/dbPoolMonitor');
const dbCluster = require('../config/databaseCluster');
const DatabaseOptimizer = require('../utils/databaseOptimizer');
const dbOptimizer = new DatabaseOptimizer();

// ==================== 数据库迁移路由 ====================

/**
 * 获取迁移状态
 * GET /api/database/migrations/status
 */
router.get('/migrations/status', async (req, res) => {
  try {
    const status = await migrationManager.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取迁移状态失败',
      error: error.message
    });
  }
});

/**
 * 创建新迁移
 * POST /api/database/migrations/create
 */
router.post('/migrations/create', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '迁移名称不能为空'
      });
    }
    
    const migration = await migrationManager.createMigration(name);
    
    res.json({
      success: true,
      message: '迁移文件创建成功',
      data: migration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建迁移失败',
      error: error.message
    });
  }
});

/**
 * 执行迁移
 * POST /api/database/migrations/migrate
 */
router.post('/migrations/migrate', async (req, res) => {
  try {
    const { target, steps } = req.body;
    
    const result = await migrationManager.migrate({ target, steps });
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '执行迁移失败',
      error: error.message
    });
  }
});

/**
 * 回滚迁移
 * POST /api/database/migrations/rollback
 */
router.post('/migrations/rollback', async (req, res) => {
  try {
    const { steps = 1 } = req.body;
    
    const result = await migrationManager.rollback({ steps });
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '回滚迁移失败',
      error: error.message
    });
  }
});

/**
 * 重置迁移（危险操作）
 * POST /api/database/migrations/reset
 */
router.post('/migrations/reset', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'YES') {
      return res.status(400).json({
        success: false,
        message: '请确认重置操作（传入 confirm: "YES"）'
      });
    }
    
    const result = await migrationManager.reset();
    
    res.json({
      success: true,
      message: '迁移记录已重置',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重置迁移失败',
      error: error.message
    });
  }
});

// ==================== 连接池监控路由 ====================

/**
 * 获取连接池状态
 * GET /api/database/pool/status
 */
router.get('/pool/status', (req, res) => {
  try {
    const status = poolMonitor.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取连接池状态失败',
      error: error.message
    });
  }
});

/**
 * 获取连接池历史数据
 * GET /api/database/pool/history
 */
router.get('/pool/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const history = poolMonitor.getHistory(parseInt(limit));
    const summary = poolMonitor.getSummary();
    
    res.json({
      success: true,
      data: {
        history,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取连接池历史失败',
      error: error.message
    });
  }
});

/**
 * 开始连接池监控
 * POST /api/database/pool/start
 */
router.post('/pool/start', (req, res) => {
  try {
    const { interval = 5000 } = req.body;
    
    poolMonitor.startMonitoring(parseInt(interval));
    
    res.json({
      success: true,
      message: '连接池监控已启动',
      data: {
        interval
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '启动连接池监控失败',
      error: error.message
    });
  }
});

/**
 * 停止连接池监控
 * POST /api/database/pool/stop
 */
router.post('/pool/stop', (req, res) => {
  try {
    poolMonitor.stopMonitoring();
    
    res.json({
      success: true,
      message: '连接池监控已停止'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '停止连接池监控失败',
      error: error.message
    });
  }
});

/**
 * 重置连接池指标
 * POST /api/database/pool/reset
 */
router.post('/pool/reset', (req, res) => {
  try {
    poolMonitor.reset();
    
    res.json({
      success: true,
      message: '连接池指标已重置'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重置连接池指标失败',
      error: error.message
    });
  }
});

// ==================== 集群管理路由 ====================

/**
 * 获取集群状态
 * GET /api/database/cluster/status
 */
router.get('/cluster/status', async (req, res) => {
  try {
    const status = await dbCluster.getClusterStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取集群状态失败',
      error: error.message
    });
  }
});

/**
 * 集群健康检查
 * GET /api/database/cluster/health
 */
router.get('/cluster/health', async (req, res) => {
  try {
    const health = await dbCluster.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '集群健康检查失败',
      error: error.message
    });
  }
});

/**
 * 初始化集群
 * POST /api/database/cluster/initialize
 */
router.post('/cluster/initialize', async (req, res) => {
  try {
    const config = req.body;
    
    await dbCluster.initialize(config);
    
    res.json({
      success: true,
      message: '集群初始化成功',
      data: await dbCluster.getClusterStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '集群初始化失败',
      error: error.message
    });
  }
});

// ==================== 数据库性能监控路由 ====================

/**
 * 获取数据库概览
 * GET /api/database/overview
 */
router.get('/overview', async (req, res) => {
  try {
    const [
      poolStatus,
      clusterStatus,
      migrationStatus,
      performanceAnalysis
    ] = await Promise.allSettled([
      Promise.resolve(poolMonitor.getStatus()),
      dbCluster.getClusterStatus(),
      migrationManager.getStatus(),
      dbOptimizer.analyzePerformance()
    ]);
    
    res.json({
      success: true,
      data: {
        pool: poolStatus.status === 'fulfilled' ? poolStatus.value : { error: poolStatus.reason?.message },
        cluster: clusterStatus.status === 'fulfilled' ? clusterStatus.value : { error: clusterStatus.reason?.message },
        migrations: migrationStatus.status === 'fulfilled' ? migrationStatus.value : { error: migrationStatus.reason?.message },
        performance: performanceAnalysis.status === 'fulfilled' ? performanceAnalysis.value : { error: performanceAnalysis.reason?.message },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取数据库概览失败',
      error: error.message
    });
  }
});

module.exports = router;
