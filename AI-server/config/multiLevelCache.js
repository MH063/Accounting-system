/**
 * 多级缓存系统
 * 实现L1（内存）和L2（Redis）缓存策略，提供高性能的数据缓存解决方案
 */

const Redis = require('ioredis');
const { LRUCache } = require('lru-cache');
const logger = require('./logger');
const redisConfig = require('./redis');

/**
 * L1缓存配置 - 内存缓存（LRU）
 */
const l1Cache = new LRUCache({
  max: 1000, // 最大缓存项数
  ttl: 1000 * 60 * 5, // 5分钟过期时间
  updateAgeOnGet: true, // 访问时更新年龄
  updateAgeOnHas: true, // 检查时更新年龄
  dispose: (value, key) => {
    logger.debug(`[L1-CACHE] 内存缓存项被清除: ${key}`);
  }
});

/**
 * L2缓存配置 - 使用统一的Redis客户端
 */
let l2Cache = null;

class MultiLevelCache {
  constructor() {
    this.l1 = l1Cache;
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * 初始化多级缓存
   */
  async initialize() {
    try {
      // 使用统一的Redis客户端
      l2Cache = redisConfig.getClient();
      logger.info('[MULTI-LEVEL-CACHE] 已连接到统一Redis客户端');
      return true;
    } catch (error) {
      logger.error('[MULTI-LEVEL-CACHE] 初始化失败:', error.message);
      return false;
    }
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix, key) {
    return `${prefix}:${key}`;
  }

  /**
   * 获取缓存数据
   */
  async get(key, prefix = 'cache') {
    const fullKey = prefix ? this.generateKey(prefix, key) : key;
    // 1. 尝试从L1获取
    const l1Data = this.l1.get(fullKey);
    if (l1Data !== undefined) {
      this.stats.l1Hits++;
      logger.debug(`[MULTI-LEVEL-CACHE] L1命中: ${fullKey}`);
      return l1Data;
    }

    // 2. 尝试从L2获取
    if (redisConfig.isRedisAvailable()) {
      try {
        const l2Data = await l2Cache.get(fullKey);
        if (l2Data) {
          this.stats.l2Hits++;
          const parsedData = JSON.parse(l2Data);
          // 回填到L1
          this.l1.set(fullKey, parsedData);
          logger.debug(`[MULTI-LEVEL-CACHE] L2命中: ${fullKey}`);
          return parsedData;
        }
      } catch (error) {
        logger.error(`[MULTI-LEVEL-CACHE] L2读取失败: ${fullKey}`, error.message);
      }
    }

    this.stats.misses++;
    logger.debug(`[MULTI-LEVEL-CACHE] 未命中: ${fullKey}`);
    return null;
  }

  /**
   * 设置缓存数据
   */
  async set(key, value, options = {}) {
    const { prefix = 'cache', ttl = 300 } = options;
    const fullKey = prefix ? this.generateKey(prefix, key) : key;

    // 1. 设置L1
    this.l1.set(fullKey, value, { ttl: ttl * 1000 });

    // 2. 设置L2
    if (redisConfig.isRedisAvailable()) {
      try {
        await l2Cache.set(fullKey, JSON.stringify(value), 'EX', ttl);
      } catch (error) {
        logger.error(`[MULTI-LEVEL-CACHE] L2设置失败: ${fullKey}`, error.message);
      }
    }

    this.stats.sets++;
    return true;
  }

  /**
   * 删除缓存数据
   */
  async del(key, prefix = 'cache') {
    const fullKey = prefix ? this.generateKey(prefix, key) : key;
    this.l1.delete(fullKey);
    if (redisConfig.isRedisAvailable()) {
      try {
        await l2Cache.del(fullKey);
      } catch (error) {
        logger.error(`[MULTI-LEVEL-CACHE] L2删除失败: ${fullKey}`, error.message);
      }
    }
    return true;
  }

  /**
   * 批量删除匹配前缀的缓存
   */
  async batchDelete(pattern) {
    let deletedCount = 0;

    // 1. 删除L1
    const l1Keys = Array.from(this.l1.keys());
    l1Keys.forEach(key => {
      if (key.includes(pattern)) {
        this.l1.delete(key);
        deletedCount++;
      }
    });

    // 2. 删除L2
    if (redisConfig.isRedisAvailable()) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await l2Cache.scan(cursor, 'MATCH', `*${pattern}*`, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await l2Cache.del(...keys);
            deletedCount += keys.length;
          }
        } while (cursor !== '0');
      } catch (error) {
        logger.error(`[MULTI-LEVEL-CACHE] L2批量删除失败: ${pattern}`, error.message);
      }
    }

    return deletedCount;
  }

  /**
   * 清空所有缓存
   */
  async flush() {
    this.l1.clear();
    if (redisConfig.isRedisAvailable()) {
      try {
        await l2Cache.flushdb();
      } catch (error) {
        logger.error('[MULTI-LEVEL-CACHE] L2清空失败:', error.message);
      }
    }
    logger.info('[MULTI-LEVEL-CACHE] 所有缓存已清空');
    return true;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const totalRequests = this.stats.l1Hits + this.stats.l2Hits + this.stats.misses;
    return {
      ...this.stats,
      l1Size: this.l1.size,
      totalRequests,
      hitRate: totalRequests > 0 ? ((this.stats.l1Hits + this.stats.l2Hits) / totalRequests * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      sets: 0
    };
  }
}

const multiLevelCache = new MultiLevelCache();

module.exports = {
  multiLevelCache,
  initialize: () => multiLevelCache.initialize(),
  close: () => {} // 不再需要单独关闭，由redis.js统一管理
};