/**
 * 性能优化路由
 * 提供多级缓存管理、数据库优化、静态资源优化和负载均衡功能
 */

const express = require('express');
const router = express.Router();
const { monitor } = require('../middleware/performanceMonitor');

// 导入性能优化工具类
const { cache } = require('../config/multiLevelCache');
const DatabaseOptimizer = require('../utils/databaseOptimizer');
const StaticResourceOptimizer = require('../utils/staticResourceOptimizer');
const LoadBalancerManager = require('../utils/loadBalancerManager');
const { getCDNManager } = require('../utils/cdnManager');

// 初始化组件
const dbOptimizer = new DatabaseOptimizer();
const resourceOptimizer = new StaticResourceOptimizer();
const loadBalancer = new LoadBalancerManager();
const cdnManager = getCDNManager();

// ==================== 多级缓存管理路由 ====================

/**
 * 获取缓存状态
 * GET /api/performance/cache/status
 */
router.get('/cache/status', async (req, res) => {
  try {
    const cacheStats = cache.stats();
    const healthStatus = await cache.healthCheck();
    const config = cache.getConfig();
    
    res.json({
      success: true,
      data: {
        stats: cacheStats,
        health: healthStatus,
        config: config
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取缓存状态失败',
      error: error.message
    });
  }
});

/**
 * 清除缓存
 * POST /api/performance/cache/flush
 */
router.post('/cache/flush', async (req, res) => {
  try {
    const { level = 'all', pattern = null } = req.body;
    
    let result;
    if (pattern) {
      result = await cache.deleteByPattern(pattern);
    } else {
      result = await cache.flush();
    }
    
    res.json({
      success: true,
      message: '缓存清除成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '缓存清除失败',
      error: error.message
    });
  }
});

/**
 * 获取缓存键列表
 * GET /api/performance/cache/keys
 */
router.get('/cache/keys', async (req, res) => {
  try {
    const { level = 'all', limit = 100 } = req.query;
    
    const keys = await cache.getKeys(level, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        keys,
        count: keys.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取缓存键失败',
      error: error.message
    });
  }
});

// ==================== CDN管理路由 ====================

/**
 * 获取CDN状态
 * GET /api/performance/cdn/status
 */
router.get('/cdn/status', async (req, res) => {
  try {
    const cdnStats = cdnManager.getStats();
    const configStatus = cdnManager.getConfigStatus();
    const healthStatus = await cdnManager.healthCheck();
    
    res.json({
      success: true,
      data: {
        stats: cdnStats,
        config: configStatus,
        health: healthStatus,
        urls: {
          test: cdnManager.generateCDNUrl('test.jpg'),
          homepage: cdnManager.generateCDNUrl('index.html'),
          css: cdnManager.generateCDNUrl('assets/style.css'),
          js: cdnManager.generateCDNUrl('assets/script.js')
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取CDN状态失败',
      error: error.message
    });
  }
});

/**
 * 清除CDN缓存
 * POST /api/performance/cdn/purge
 */
router.post('/cdn/purge', async (req, res) => {
  try {
    const { urls = [], purgeAll = false } = req.body;
    
    let result;
    if (purgeAll) {
      result = await cdnManager.purgeCache();
    } else {
      result = await cdnManager.purgeCache(urls);
    }
    
    res.json({
      success: true,
      message: 'CDN缓存清除请求已发送',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CDN缓存清除失败',
      error: error.message
    });
  }
});

/**
 * 配置CDN
 * POST /api/performance/cdn/configure
 */
router.post('/cdn/configure', async (req, res) => {
  try {
    const config = req.body;
    const result = cdnManager.configure(config);
    
    res.json({
      success: true,
      message: 'CDN配置更新成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CDN配置更新失败',
      error: error.message
    });
  }
});

/**
 * 生成CDN URL
 * GET /api/performance/cdn/url
 */
router.get('/cdn/url', (req, res) => {
  try {
    const { path: relativePath, cacheBusting = 'true' } = req.query;
    
    if (!relativePath) {
      return res.status(400).json({
        success: false,
        message: '缺少path参数'
      });
    }
    
    const url = cdnManager.generateCDNUrl(relativePath, cacheBusting === 'true');
    
    res.json({
      success: true,
      data: {
        originalPath: relativePath,
        cdnUrl: url,
        cacheBusting: cacheBusting === 'true'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成CDN URL失败',
      error: error.message
    });
  }
});

// ==================== 数据库优化路由 ====================

/**
 * 获取数据库性能分析
 * GET /api/performance/db/analyze
 */
router.get('/db/analyze', async (req, res) => {
  try {
    const analysis = await dbOptimizer.analyzePerformance();
    
    res.json({
      success: true,
      message: '数据库性能分析完成',
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '数据库性能分析失败',
      error: error.message
    });
  }
});

/**
 * 获取索引管理
 * GET /api/performance/db/indexes
 */
router.get('/db/indexes', async (req, res) => {
  try {
    const indexes = await dbOptimizer.getIndexInfo();
    
    res.json({
      success: true,
      data: indexes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取索引信息失败',
      error: error.message
    });
  }
});

/**
 * 优化数据库索引
 * POST /api/performance/db/optimize-indexes
 */
router.post('/db/optimize-indexes', async (req, res) => {
  try {
    const { tableName, indexType = 'all' } = req.body;
    
    let result;
    if (tableName) {
      result = await dbOptimizer.optimizeIndex(tableName, indexType);
    } else {
      result = await dbOptimizer.optimizeAllIndexes();
    }
    
    res.json({
      success: true,
      message: '索引优化执行完成',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '索引优化失败',
      error: error.message
    });
  }
});

/**
 * 获取慢查询统计
 * GET /api/performance/db/slow-queries
 */
router.get('/db/slow-queries', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const slowQueries = await dbOptimizer.getSlowQueryStats(parseInt(limit));
    
    res.json({
      success: true,
      data: slowQueries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取慢查询统计失败',
      error: error.message
    });
  }
});

/**
 * 执行数据库维护操作
 * POST /api/performance/db/maintenance
 */
router.post('/db/maintenance', async (req, res) => {
  try {
    const { operation = 'vacuum', target = 'database' } = req.body;
    
    let result;
    switch (operation) {
      case 'vacuum':
        result = await dbOptimizer.performVacuum(target);
        break;
      case 'reindex':
        result = await dbOptimizer.performReindex(target);
        break;
      case 'analyze':
        result = await dbOptimizer.performAnalyze(target);
        break;
      default:
        throw new Error(`不支持的维护操作: ${operation}`);
    }
    
    res.json({
      success: true,
      message: `${operation}操作执行完成`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '数据库维护操作失败',
      error: error.message
    });
  }
});

// ==================== 静态资源优化路由 ====================

/**
 * 获取静态资源优化状态
 * GET /api/performance/static/status
 */
router.get('/static/status', async (req, res) => {
  try {
    const status = await resourceOptimizer.getOptimizationStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取静态资源优化状态失败',
      error: error.message
    });
  }
});

/**
 * 手动执行静态资源优化
 * POST /api/performance/static/optimize
 */
router.post('/static/optimize', async (req, res) => {
  try {
    const { directory = 'public' } = req.body;
    
    const result = await resourceOptimizer.optimizeAll(directory);
    
    res.json({
      success: true,
      message: '静态资源优化完成',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '静态资源优化失败',
      error: error.message
    });
  }
});

/**
 * 优化CSS文件
 * POST /api/performance/static/optimize-css
 */
router.post('/static/optimize-css', async (req, res) => {
  try {
    const { directory = 'public' } = req.body;
    
    const result = await resourceOptimizer.optimizeCSS(directory);
    
    res.json({
      success: true,
      message: 'CSS文件优化完成',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CSS文件优化失败',
      error: error.message
    });
  }
});

/**
 * 优化JavaScript文件
 * POST /api/performance/static/optimize-js
 */
router.post('/static/optimize-js', async (req, res) => {
  try {
    const { directory = 'public' } = req.body;
    
    const result = await resourceOptimizer.optimizeJS(directory);
    
    res.json({
      success: true,
      message: 'JavaScript文件优化完成',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'JavaScript文件优化失败',
      error: error.message
    });
  }
});

/**
 * 优化图片文件
 * POST /api/performance/static/optimize-images
 */
router.post('/static/optimize-images', async (req, res) => {
  try {
    const { directory = 'public' } = req.body;
    
    const result = await resourceOptimizer.optimizeImages(directory);
    
    res.json({
      success: true,
      message: '图片文件优化完成',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '图片文件优化失败',
      error: error.message
    });
  }
});

/**
 * 启用静态资源缓存
 * POST /api/performance/static/enable-cache
 */
router.post('/static/enable-cache', async (req, res) => {
  try {
    const result = await resourceOptimizer.enableStaticCaching();
    
    res.json({
      success: true,
      message: '静态资源缓存已启用',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '启用静态资源缓存失败',
      error: error.message
    });
  }
});

// ==================== 负载均衡路由 ====================

/**
 * 获取负载均衡状态
 * GET /api/performance/lb/status
 */
router.get('/lb/status', async (req, res) => {
  try {
    const status = await loadBalancer.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取负载均衡状态失败',
      error: error.message
    });
  }
});

/**
 * 添加节点
 * POST /api/performance/lb/add-node
 */
router.post('/lb/add-node', async (req, res) => {
  try {
    const { id, host, port, weight = 1, enabled = true, metadata = {} } = req.body;
    
    if (!host || !port) {
      return res.status(400).json({
        success: false,
        message: '缺少主机地址或端口参数'
      });
    }
    
    const result = await loadBalancer.addNode({ id, host, port, weight, enabled, metadata });
    
    res.json({
      success: true,
      message: '节点添加成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '节点添加失败',
      error: error.message
    });
  }
});

/**
 * 移除节点
 * DELETE /api/performance/lb/remove-node/:id
 */
router.delete('/lb/remove-node/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await loadBalancer.removeNode(id);
    
    res.json({
      success: true,
      message: '节点移除成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '节点移除失败',
      error: error.message
    });
  }
});

/**
 * 更新负载均衡算法
 * POST /api/performance/lb/algorithm
 */
router.post('/lb/algorithm', async (req, res) => {
  try {
    const { algorithm = 'round-robin' } = req.body;
    
    const result = loadBalancer.setAlgorithm(algorithm);
    
    res.json({
      success: true,
      message: '负载均衡算法更新成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '负载均衡算法更新失败',
      error: error.message
    });
  }
});

/**
 * 获取节点健康状态
 * GET /api/performance/lb/health
 */
router.get('/lb/health', async (req, res) => {
  try {
    await loadBalancer.performHealthCheck();
    const status = await loadBalancer.getStatus();
    
    res.json({
      success: true,
      data: {
        nodes: status.nodes,
        summary: status.summary,
        lastCheck: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取节点健康状态失败',
      error: error.message
    });
  }
});

/**
 * 启用/禁用节点
 * PUT /api/performance/lb/toggle-node/:id
 */
router.put('/lb/toggle-node/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled参数必须是布尔值'
      });
    }
    
    const result = await loadBalancer.toggleNode(id, enabled);
    
    res.json({
      success: true,
      message: `节点已${enabled ? '启用' : '禁用'}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '切换节点状态失败',
      error: error.message
    });
  }
});

// ==================== 性能监控概览路由 ====================

/**
   * 获取性能监控概览
   * GET /api/performance/overview
   */
router.get('/overview', async (req, res) => {
  try {
    // 并行获取所有性能指标
    const [cacheStats, dbAnalysis, staticStatus, lbStatus, cdnStats] = await Promise.allSettled([
      Promise.resolve(cache.stats()),
      dbOptimizer.analyzePerformance(),
      resourceOptimizer.getOptimizationStatus(),
      loadBalancer.getStatus(),
      cdnManager.getStatus()
    ]);
    
    const overview = {
      timestamp: new Date().toISOString(),
      cache: cacheStats.status === 'fulfilled' ? cacheStats.value : { error: cacheStats.reason?.message },
      database: dbAnalysis.status === 'fulfilled' ? dbAnalysis.value : { error: dbAnalysis.reason?.message },
      static: staticStatus.status === 'fulfilled' ? staticStatus.value : { error: staticStatus.reason?.message },
      loadBalancer: lbStatus.status === 'fulfilled' ? lbStatus.value : { error: lbStatus.reason?.message },
      cdn: cdnStats.status === 'fulfilled' ? cdnStats.value : { error: cdnStats.reason?.message }
    };
    
    res.json({
      success: true,
      message: '性能监控概览获取成功',
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取性能监控概览失败',
      error: error.message
    });
  }
});

/**
   * 生成性能优化建议
   * GET /api/performance/recommendations
   */
router.get('/recommendations', async (req, res) => {
  try {
    // 获取当前性能数据
    const [cacheStats, dbAnalysis, staticStatus, lbStatus, cdnStats] = await Promise.allSettled([
      Promise.resolve(cache.stats()),
      dbOptimizer.analyzePerformance(),
      resourceOptimizer.getOptimizationStatus(),
      loadBalancer.getStatus(),
      cdnManager.getStatus()
    ]);
    
    const recommendations = [];
    
    // 缓存优化建议
    if (cacheStats.status === 'fulfilled') {
      const stats = cacheStats.value;
      const hitRate = stats.overall?.hitRate || 0;
      
      if (hitRate < 50) {
        recommendations.push({
          category: '缓存',
          priority: 'high',
          issue: `缓存命中率过低(${hitRate.toFixed(1)}%)`,
          suggestion: '建议增加缓存预热、优化缓存键策略或调整缓存过期时间',
          impact: 'high',
          currentValue: `${hitRate.toFixed(1)}%`,
          targetValue: '80%+'
        });
      } else if (hitRate < 80) {
        recommendations.push({
          category: '缓存',
          priority: 'medium',
          issue: `缓存命中率较低(${hitRate.toFixed(1)}%)`,
          suggestion: '考虑优化缓存策略以提高命中率',
          impact: 'medium',
          currentValue: `${hitRate.toFixed(1)}%`,
          targetValue: '80%+'
        });
      }
      
      // 检查L2缓存连接状态
      if (stats.l2 && stats.l2.hitRate === 0 && stats.l2.misses === 0) {
        recommendations.push({
          category: '缓存',
          priority: 'medium',
          issue: 'Redis缓存未启用或未连接',
          suggestion: '检查Redis服务状态并确保连接配置正确',
          impact: 'medium'
        });
      }
    }
    
    // 数据库优化建议
    if (dbAnalysis.status === 'fulfilled') {
      const analysis = dbAnalysis.value;
      
      // 检查慢查询
      if (analysis.slowQueries && Array.isArray(analysis.slowQueries) && analysis.slowQueries.length > 0) {
        const slowQueriesCount = analysis.slowQueries.filter(q => q.mean_time > 1000).length;
        if (slowQueriesCount > 0) {
          recommendations.push({
            category: '数据库',
            priority: 'high',
            issue: `存在${slowQueriesCount}个慢查询(平均执行时间>1秒)`,
            suggestion: '建议对慢查询添加索引或优化查询语句',
            impact: 'high',
            details: `详见 /api/performance/db/slow-queries`
          });
        }
      }
      
      // 检查表统计
      if (analysis.tableSizes && analysis.tableSizes.tables) {
        const tables = analysis.tableSizes.tables;
        
        // 检查死元组
        const tablesWithDeadRows = tables.filter(t => t.deadRows > 1000);
        if (tablesWithDeadRows.length > 0) {
          recommendations.push({
            category: '数据库',
            priority: 'medium',
            issue: `${tablesWithDeadRows.length}个表存在大量死元组`,
            suggestion: '建议执行VACUUM操作清理死元组',
            impact: 'medium',
            tables: tablesWithDeadRows.map(t => t.table).slice(0, 5)
          });
        }
        
        // 检查大表
        const largeTables = tables.filter(t => t.rowCount > 100000);
        if (largeTables.length > 0) {
          recommendations.push({
            category: '数据库',
            priority: 'low',
            issue: `发现${largeTables.length}个大表(超过10万行)`,
            suggestion: '考虑对大表进行分区或归档历史数据',
            impact: 'medium',
            tables: largeTables.map(t => ({ name: t.table, rows: t.rowCount })).slice(0, 5)
          });
        }
        
        // 如果没有表，提供信息
        if (tables.length === 0) {
          recommendations.push({
            category: '数据库',
            priority: 'info',
            issue: '数据库中没有用户表',
            suggestion: '这是一个空数据库，性能分析功能将在创建表后提供更多信息',
            impact: 'info'
          });
        }
      }
      
      // 检查索引使用情况
      if (analysis.indexStats && Array.isArray(analysis.indexStats)) {
        const unusedIndexes = analysis.indexStats.filter(idx => idx.efficiency === 'unused');
        if (unusedIndexes.length > 0) {
          recommendations.push({
            category: '数据库',
            priority: 'medium',
            issue: `发现${unusedIndexes.length}个未使用的索引`,
            suggestion: '考虑删除未使用的索引以节省存储空间',
            impact: 'low',
            indexes: unusedIndexes.map(idx => idx.indexname || idx.name).slice(0, 5)
          });
        }
      }
      
      // 检查连接池
      if (analysis.connectionStats && analysis.connectionStats.pool) {
        const pool = analysis.connectionStats.pool;
        if (pool.max > 0) {
          const utilizationRate = (pool.total / pool.max) * 100;
          if (utilizationRate > 80) {
            recommendations.push({
              category: '数据库',
              priority: 'high',
              issue: `连接池使用率达到${utilizationRate.toFixed(1)}%`,
              suggestion: '考虑增加连接池大小或优化查询以减少连接使用',
              impact: 'high',
              currentValue: `${utilizationRate.toFixed(1)}%`,
              targetValue: '<80%'
            });
          }
          if (pool.waiting > 0) {
            recommendations.push({
              category: '数据库',
              priority: 'high',
              issue: `${pool.waiting}个连接请求正在等待`,
              suggestion: '立即增加连接池大小或检查是否存在连接泄漏',
              impact: 'high'
            });
          }
        }
      }
    }
    
    // 静态资源优化建议
    if (staticStatus.status === 'fulfilled') {
      const status = staticStatus.value;
      
      // 检查缓存配置
      if (status.cache && !status.cache.enabled) {
        recommendations.push({
          category: '静态资源',
          priority: 'medium',
          issue: '静态资源缓存未启用',
          suggestion: '建议启用静态资源缓存以提高性能',
          impact: 'medium',
          action: 'POST /api/performance/static/enable-cache'
        });
      }
      
      // 检查压缩配置
      if (status.compression) {
        if (!status.compression.gzip?.enabled && !status.compression.brotli?.enabled) {
          recommendations.push({
            category: '静态资源',
            priority: 'medium',
            issue: '压缩功能未启用',
            suggestion: '建议启用gzip或brotli压缩以减少传输大小',
            impact: 'medium'
          });
        }
      }
      
      // 检查优化建议
      if (status.recommendations && status.recommendations.length > 0) {
        status.recommendations.forEach(rec => {
          recommendations.push({
            category: '静态资源',
            priority: rec.priority || 'medium',
            issue: rec.message,
            suggestion: rec.action,
            impact: rec.priority === 'high' ? 'high' : 'medium',
            potentialSavings: rec.potentialSavings
          });
        });
      }
    }
    
    // 负载均衡建议
    if (lbStatus.status === 'fulfilled') {
      const status = lbStatus.value;
      const nodeCount = status.nodes?.length || 0;
      
      if (nodeCount === 0) {
        recommendations.push({
          category: '负载均衡',
          priority: 'low',
          issue: '未配置负载均衡节点',
          suggestion: '当前为单节点部署，建议添加更多节点以提高可用性',
          impact: 'high'
        });
      } else if (nodeCount === 1) {
        recommendations.push({
          category: '负载均衡',
          priority: 'medium',
          issue: '单节点部署',
          suggestion: '建议添加更多节点以提高可用性和性能',
          impact: 'high'
        });
      }
      
      // 检查不健康的节点
      if (status.nodes && Array.isArray(status.nodes)) {
        const unhealthyNodes = status.nodes.filter(n => !n.healthy && n.enabled);
        if (unhealthyNodes.length > 0) {
          recommendations.push({
            category: '负载均衡',
            priority: 'high',
            issue: `${unhealthyNodes.length}个节点健康检查失败`,
            suggestion: '检查节点状态，确保服务正常运行',
            impact: 'high',
            nodes: unhealthyNodes.map(n => n.id || n.host)
          });
        }
      }
    }
    
    // CDN建议
    if (cdnStats.status === 'fulfilled') {
      const status = cdnStats.value;
      if (status.status === 'disabled' || !status.enabled) {
        recommendations.push({
          category: 'CDN',
          priority: 'low',
          issue: 'CDN未启用',
          suggestion: '考虑启用CDN以加速静态资源访问',
          impact: 'medium'
        });
      }
    }
    
    // 如果没有任何建议，返回积极反馈
    if (recommendations.length === 0) {
      recommendations.push({
        category: '系统状态',
        priority: 'info',
        issue: '系统运行状态良好',
        suggestion: '继续保持当前配置',
        impact: 'none'
      });
    }
    
    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2, info: 3 };
    recommendations.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    
    res.json({
      success: true,
      message: '性能优化建议生成成功',
      data: {
        recommendations,
        summary: {
          total: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === 'high').length,
          mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
          lowPriority: recommendations.filter(r => r.priority === 'low').length,
          info: recommendations.filter(r => r.priority === 'info').length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成性能优化建议失败',
      error: error.message
    });
  }
});

// ==================== 性能监控路由 ====================

/**
 * 获取性能统计
 * GET /api/performance/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = monitor.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取性能统计失败',
      error: error.message
    });
  }
});

/**
 * 重置性能统计
 * POST /api/performance/stats/reset
 */
router.post('/stats/reset', (req, res) => {
  try {
    monitor.reset();
    
    res.json({
      success: true,
      message: '性能统计已重置'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重置性能统计失败',
      error: error.message
    });
  }
});

module.exports = router;