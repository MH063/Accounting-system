/**
 * 统一缓存架构
 * 整合内存缓存和多级缓存系统，提供统一的缓存接口
 */

const logger = require('./logger');
const { get, set, del, flush, getStats, resetStats, invalidateTableCache, cacheMiddleware, generateCacheKey, apiResponseCache } = require('./cache');
const { multiLevelCache, initialize, close } = require('./multiLevelCache');

/**
 * 统一缓存接口类
 */
class UnifiedCache {
  constructor() {
    this.cacheAdapters = {
      memory: {
        get,
        set,
        del,
        flush,
        getStats,
        resetStats,
        invalidateTableCache,
        cacheMiddleware,
        generateCacheKey,
        apiResponseCache
      },
      multiLevel: {
        get: multiLevelCache.get.bind(multiLevelCache),
        set: multiLevelCache.set.bind(multiLevelCache),
        del: multiLevelCache.del.bind(multiLevelCache),
        flush: multiLevelCache.flush.bind(multiLevelCache),
        getStats: multiLevelCache.getStats.bind(multiLevelCache),
        resetStats: multiLevelCache.resetStats.bind(multiLevelCache),
        healthCheck: multiLevelCache.healthCheck.bind(multiLevelCache)
      }
    };
    
    this.defaultAdapter = 'memory';
  }

  /**
   * 设置默认缓存适配器
   * @param {string} adapter - 适配器名称 ('memory' 或 'multiLevel')
   */
  setDefaultAdapter(adapter) {
    if (this.cacheAdapters[adapter]) {
      this.defaultAdapter = adapter;
      logger.info(`[UNIFIED-CACHE] 默认缓存适配器设置为: ${adapter}`);
    } else {
      logger.warn(`[UNIFIED-CACHE] 无效的缓存适配器: ${adapter}`);
    }
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @param {string} adapter - 指定使用的适配器
   * @returns {Promise<any>} 缓存数据或null
   */
  async get(key, adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].get) {
      try {
        const result = await this.cacheAdapters[targetAdapter].get(key);
        logger.debug(`[UNIFIED-CACHE] 从 ${targetAdapter} 获取缓存: ${key}`);
        return result;
      } catch (error) {
        logger.error(`[UNIFIED-CACHE] 从 ${targetAdapter} 获取缓存失败: ${key}`, error.message);
        // 降级到默认适配器
        if (targetAdapter !== this.defaultAdapter) {
          return await this.get(key, this.defaultAdapter);
        }
        return null;
      }
    }
    
    logger.warn(`[UNIFIED-CACHE] 未找到适配器: ${targetAdapter}`);
    return null;
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 选项配置
   * @param {string} adapter - 指定使用的适配器
   * @returns {Promise<boolean>} 是否设置成功
   */
  async set(key, value, options = {}, adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].set) {
      try {
        const result = await this.cacheAdapters[targetAdapter].set(key, value, options);
        logger.debug(`[UNIFIED-CACHE] 在 ${targetAdapter} 设置缓存: ${key}`);
        return result;
      } catch (error) {
        logger.error(`[UNIFIED-CACHE] 在 ${targetAdapter} 设置缓存失败: ${key}`, error.message);
        return false;
      }
    }
    
    logger.warn(`[UNIFIED-CACHE] 未找到适配器: ${targetAdapter}`);
    return false;
  }

  /**
   * 删除缓存数据
   * @param {string} key - 缓存键
   * @param {string} adapter - 指定使用的适配器
   * @returns {Promise<boolean>} 是否删除成功
   */
  async del(key, adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].del) {
      try {
        const result = await this.cacheAdapters[targetAdapter].del(key);
        logger.debug(`[UNIFIED-CACHE] 从 ${targetAdapter} 删除缓存: ${key}`);
        return result;
      } catch (error) {
        logger.error(`[UNIFIED-CACHE] 从 ${targetAdapter} 删除缓存失败: ${key}`, error.message);
        return false;
      }
    }
    
    logger.warn(`[UNIFIED-CACHE] 未找到适配器: ${targetAdapter}`);
    return false;
  }

  /**
   * 清空缓存
   * @param {string} prefix - 键前缀过滤
   * @param {string} adapter - 指定使用的适配器
   * @returns {Promise<boolean>} 是否清空成功
   */
  async flush(prefix = null, adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].flush) {
      try {
        const result = await this.cacheAdapters[targetAdapter].flush(prefix);
        logger.info(`[UNIFIED-CACHE] 清空 ${targetAdapter} 缓存`);
        return result;
      } catch (error) {
        logger.error(`[UNIFIED-CACHE] 清空 ${targetAdapter} 缓存失败`, error.message);
        return false;
      }
    }
    
    logger.warn(`[UNIFIED-CACHE] 未找到适配器: ${targetAdapter}`);
    return false;
  }

  /**
   * 获取缓存统计信息
   * @param {string} adapter - 指定使用的适配器
   * @returns {Object} 统计信息
   */
  getStats(adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].getStats) {
      try {
        const stats = this.cacheAdapters[targetAdapter].getStats();
        logger.debug(`[UNIFIED-CACHE] 获取 ${targetAdapter} 缓存统计`);
        return stats;
      } catch (error) {
        logger.error(`[UNIFIED-CACHE] 获取 ${targetAdapter} 缓存统计失败`, error.message);
        return null;
      }
    }
    
    logger.warn(`[UNIFIED-CACHE] 未找到适配器: ${targetAdapter}`);
    return null;
  }

  /**
   * 重置缓存统计
   * @param {string} adapter - 指定使用的适配器
   */
  resetStats(adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].resetStats) {
      try {
        this.cacheAdapters[targetAdapter].resetStats();
        logger.debug(`[UNIFIED-CACHE] 重置 ${targetAdapter} 缓存统计`);
      } catch (error) {
        logger.error(`[UNIFIED-CACHE] 重置 ${targetAdapter} 缓存统计失败`, error.message);
      }
    } else {
      logger.warn(`[UNIFIED-CACHE] 未找到适配器: ${targetAdapter}`);
    }
  }

  /**
   * 获取所有适配器的健康状态
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    const health = {};
    
    for (const [adapterName, adapter] of Object.entries(this.cacheAdapters)) {
      if (adapter.healthCheck) {
        try {
          health[adapterName] = await adapter.healthCheck();
        } catch (error) {
          health[adapterName] = {
            status: 'unhealthy',
            error: error.message
          };
          logger.error(`[UNIFIED-CACHE] ${adapterName} 健康检查失败`, error.message);
        }
      } else {
        health[adapterName] = {
          status: 'unknown',
          message: '未实现健康检查'
        };
      }
    }
    
    return health;
  }

  /**
   * 获取缓存中间件
   * @param {Object} options - 中间件选项
   * @param {string} adapter - 指定使用的适配器
   * @returns {Function} 中间件函数
   */
  getMiddleware(options = {}, adapter = null) {
    const targetAdapter = adapter || this.defaultAdapter;
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].cacheMiddleware) {
      return this.cacheAdapters[targetAdapter].cacheMiddleware(options);
    }
    
    if (this.cacheAdapters[targetAdapter] && this.cacheAdapters[targetAdapter].apiResponseCache) {
      return this.cacheAdapters[targetAdapter].apiResponseCache(options.strategy || 'default');
    }
    
    logger.warn(`[UNIFIED-CACHE] ${targetAdapter} 适配器不支持中间件`);
    return (req, res, next) => next();
  }

  /**
   * 初始化缓存系统
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    try {
      // 初始化多级缓存（Redis）
      const redisInitialized = await initialize();
      logger.info(`[UNIFIED-CACHE] Redis缓存初始化: ${redisInitialized ? '成功' : '失败'}`);
      
      // 根据环境变量设置默认适配器
      if (process.env.CACHE_DEFAULT_ADAPTER) {
        this.setDefaultAdapter(process.env.CACHE_DEFAULT_ADAPTER);
      } else if (redisInitialized) {
        this.setDefaultAdapter('multiLevel');
      }
      
      return true;
    } catch (error) {
      logger.error('[UNIFIED-CACHE] 缓存系统初始化失败', error.message);
      return false;
    }
  }

  /**
   * 关闭缓存系统
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await close();
      logger.info('[UNIFIED-CACHE] 缓存系统已关闭');
    } catch (error) {
      logger.error('[UNIFIED-CACHE] 关闭缓存系统失败', error.message);
    }
  }
}

// 创建统一缓存实例
const unifiedCache = new UnifiedCache();

// 导出统一缓存接口
module.exports = {
  unifiedCache,
  // 便捷方法
  get: (key, adapter) => unifiedCache.get(key, adapter),
  set: (key, value, options, adapter) => unifiedCache.set(key, value, options, adapter),
  del: (key, adapter) => unifiedCache.del(key, adapter),
  flush: (prefix, adapter) => unifiedCache.flush(prefix, adapter),
  getStats: (adapter) => unifiedCache.getStats(adapter),
  resetStats: (adapter) => unifiedCache.resetStats(adapter),
  healthCheck: () => unifiedCache.healthCheck(),
  getMiddleware: (options, adapter) => unifiedCache.getMiddleware(options, adapter),
  initialize: () => unifiedCache.initialize(),
  close: () => unifiedCache.close()
};