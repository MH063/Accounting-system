/**
 * 多级缓存中间件
 * 提供便捷的缓存装饰器和中间件功能
 */

const { multiLevelCache } = require('../config/multiLevelCache');

/**
 * 缓存装饰器 - 自动缓存函数结果
 * @param {Object} options - 缓存选项
 * @returns {Function} 装饰后的函数
 */
const cacheable = (options = {}) => {
  const {
    key = null, // 缓存键生成函数
    ttl = 300, // 默认TTL
    prefix = 'func', // 键前缀
    condition = null, // 缓存条件函数
    forceRefresh = false // 是否强制刷新缓存
  } = options;

  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      // 检查缓存条件
      if (condition && !condition(this, ...args)) {
        return await originalMethod.apply(this, args);
      }

      // 生成缓存键
      let cacheKey;
      if (typeof key === 'function') {
        cacheKey = key(this, ...args);
      } else {
        // 默认键生成策略
        const methodName = originalMethod.name || 'anonymous';
        const argsHash = JSON.stringify(args);
        cacheKey = `${methodName}_${argsHash}`;
      }

      // 如果不是强制刷新，尝试从缓存获取
      if (!forceRefresh) {
        const cachedResult = await multiLevelCache.get(cacheKey, prefix);
        if (cachedResult !== null) {
          return cachedResult;
        }
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      if (result !== undefined && result !== null) {
        await multiLevelCache.set(cacheKey, result, {
          prefix,
          l1Ttl: ttl,
          l2Ttl: ttl * 2
        });
      }

      return result;
    };

    return descriptor;
  };
};

/**
 * 缓存中间件 - Express路由缓存
 * @param {Object} options - 缓存选项
 * @returns {Function} Express中间件
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 缓存TTL（秒）
    prefix = 'api', // 缓存键前缀
    keyGenerator = null, // 自定义键生成函数
    condition = null, // 缓存条件函数
    excludeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'], // 排除的HTTP方法
    varyHeaders = ['Authorization', 'Accept-Language'] // 影响缓存的请求头
  } = options;

  return async (req, res, next) => {
    try {
      // 检查是否应该缓存此请求
      if (excludeMethods.includes(req.method)) {
        return next();
      }

      if (condition && !condition(req)) {
        return next();
      }

      // 生成缓存键
      let cacheKey;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        // 默认键生成策略：路径 + 影响缓存的头部信息
        const baseKey = req.originalUrl || req.url;
        let varyString = '';
        
        varyHeaders.forEach(header => {
          if (req.headers[header.toLowerCase()]) {
            varyString += `_${header}:${req.headers[header.toLowerCase()]}`;
          }
        });
        
        cacheKey = `${prefix}:${baseKey}${varyString}`;
      }

      // 尝试从缓存获取响应
      const cachedResponse = await multiLevelCache.get(cacheKey, 'api');
      if (cachedResponse) {
        // 设置缓存相关响应头
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Level': cachedResponse.level || 'unknown',
          'X-Cache-Key': cacheKey
        });

        return res.json(cachedResponse.data);
      }

      // 缓存未命中，添加缓存相关的响应头
      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey
      });

      // 保存原始的res.json方法
      const originalJson = res.json.bind(res);

      // 重写res.json方法以缓存响应
      res.json = async function(data) {
        // 只缓存成功响应
        if (data && data.success !== false) {
          try {
            const cacheData = {
              data,
              timestamp: Date.now(),
              level: 'multi-level'
            };

            await multiLevelCache.set(cacheKey, cacheData, {
              prefix: 'api',
              l1Ttl: ttl,
              l2Ttl: ttl * 2
            });

            res.set('X-Cache', 'MISS-STORE');
          } catch (cacheError) {
            // 缓存存储失败不应该影响正常响应
            logger.warn(`[CACHE-MIDDLEWARE] 缓存存储失败: ${cacheError.message}`);
          }
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('[CACHE-MIDDLEWARE] 缓存中间件错误:', error);
      next(); // 出现错误时跳过缓存，继续处理请求
    }
  };
};

/**
 * 智能缓存刷新中间件
 * 自动检测数据更新并刷新相关缓存
 * @param {Object} options - 选项
 * @returns {Function} Express中间件
 */
const cacheInvalidationMiddleware = (options = {}) => {
  const {
    patterns = [], // 需要监控的缓存键模式
    batchSize = 10 // 批量删除大小
  } = options;

  return async (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json.bind(res);
    
    // 重写res.json方法
    res.json = async function(data) {
      // 如果是成功响应，触发缓存失效
      if (data && data.success !== false && req.method !== 'GET') {
        try {
          // 根据HTTP方法判断是否需要刷新缓存
          let affectedPrefixes = [];
          
          switch (req.method) {
            case 'POST':
              // 新建操作：刷新相关列表和详情缓存
              affectedPrefixes = ['api:list', 'api:detail'];
              break;
            case 'PUT':
            case 'PATCH':
              // 更新操作：刷新详情和列表缓存
              affectedPrefixes = ['api:detail', 'api:list'];
              break;
            case 'DELETE':
              // 删除操作：刷新列表缓存
              affectedPrefixes = ['api:list', 'api:detail'];
              break;
          }

          // 批量刷新相关缓存
          for (const prefix of affectedPrefixes) {
            await multiLevelCache.batchDelete(prefix);
          }

          // 根据自定义模式刷新缓存
          for (const pattern of patterns) {
            if (typeof pattern === 'function') {
              await pattern(req, res, data);
            }
          }

          logger.info(`[CACHE-INVALIDATION] 已刷新 ${req.method} 操作的相关缓存`);

        } catch (invalidationError) {
          logger.error('[CACHE-INVALIDATION] 缓存刷新失败:', invalidationError);
          // 缓存刷新失败不应该影响正常响应
        }
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * 缓存预热中间件
 * 在应用启动时预加载常用数据
 * @param {Array} warmUpItems - 预热项列表
 * @returns {Function} 初始化函数
 */
const cacheWarmUp = (warmUpItems = []) => {
  return async () => {
    logger.info('[CACHE-WARMUP] 开始缓存预热...');

    for (const item of warmUpItems) {
      try {
        const {
          name, // 预热项名称
          key, // 缓存键
          prefix = 'warmup', // 键前缀
          loader, // 数据加载函数
          ttl = 3600 // 缓存时间
        } = item;

        logger.info(`[CACHE-WARMUP] 预热 ${name}...`);

        // 加载数据
        const data = await loader();
        
        if (data) {
          // 设置缓存
          await multiLevelCache.set(key, data, {
            prefix,
            l1Ttl: ttl,
            l2Ttl: ttl * 2
          });

          logger.info(`[CACHE-WARMUP] ${name} 预热完成`);
        } else {
          logger.warn(`[CACHE-WARMUP] ${name} 预热失败：数据为空`);
        }

      } catch (error) {
        logger.error(`[CACHE-WARMUP] 预热失败:`, error.message);
      }
    }

    logger.info('[CACHE-WARMUP] 缓存预热完成');
  };
};

/**
 * 缓存统计中间件
 * 提供缓存统计信息的API端点
 * @returns {Function} Express中间件
 */
const cacheStatsMiddleware = () => {
  return async (req, res, next) => {
    // 如果请求路径是缓存统计，单独处理
    if (req.path === '/api/cache/stats') {
      try {
        const stats = multiLevelCache.getStats();
        const health = await multiLevelCache.healthCheck();
        
        return res.json({
          success: true,
          data: {
            stats,
            health
          }
        });
      } catch (error) {
        logger.error('[CACHE-STATS] 获取统计信息失败:', error);
        return res.status(500).json({
          success: false,
          message: '获取缓存统计信息失败'
        });
      }
    }

    // 为所有请求添加缓存统计头部
    try {
      const stats = multiLevelCache.getStats();
      res.set({
        'X-Cache-Stats-Hits': stats.overall.totalHits,
        'X-Cache-Stats-Misses': stats.overall.totalMisses,
        'X-Cache-Stats-HitRate': `${stats.overall.hitRate.toFixed(2)}%`
      });
    } catch (error) {
      // 统计获取失败不应该影响正常请求
    }

    next();
  };
};

/**
 * 缓存管理装饰器
 * 为控制器添加缓存管理功能
 * @param {Object} options - 选项
 * @returns {Function} 装饰器
 */
const withCacheManagement = (options = {}) => {
  const {
    autoInvalidate = true, // 自动失效
    invalidatePatterns = [] // 失效模式
  } = options;

  return (target) => {
    // 添加缓存管理方法
    target.prototype.clearCache = async (pattern = null) => {
      if (pattern) {
        return await multiLevelCache.batchDelete(pattern);
      } else {
        return await multiLevelCache.flush();
      }
    };

    target.prototype.getCacheStats = () => {
      return multiLevelCache.getStats();
    };

    target.prototype.warmUp = async (items) => {
      const warmUp = cacheWarmUp(items);
      return await warmUp();
    };

    // 添加缓存管理路由（如果需要）
    if (options.addRoutes) {
      const routes = require('../routes');
      
      // 添加缓存管理端点
      routes.get('/api/cache/stats', async (req, res) => {
        try {
          const stats = multiLevelCache.getStats();
          const health = await multiLevelCache.healthCheck();
          
          res.json({
            success: true,
            data: { stats, health }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: '获取缓存统计信息失败'
          });
        }
      });

      routes.post('/api/cache/clear', async (req, res) => {
        try {
          const { pattern } = req.body;
          const result = await multiLevelCache.clearCache(pattern);
          
          res.json({
            success: true,
            message: '缓存清理完成',
            data: { cleared: result }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: '缓存清理失败'
          });
        }
      });
    }

    return target;
  };
};

module.exports = {
  // 装饰器
  cacheable,
  withCacheManagement,
  
  // 中间件
  cacheMiddleware,
  cacheInvalidationMiddleware,
  cacheWarmUp,
  cacheStatsMiddleware,
  
  // 便捷方法
  cache: multiLevelCache
};