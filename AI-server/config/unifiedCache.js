/**
 * 统一缓存架构
 * 整合内存缓存和多级缓存系统，提供统一的缓存接口
 */

const logger = require('./logger');
const { multiLevelCache, initialize } = require('./multiLevelCache');

/**
 * 统一缓存接口类
 */
class UnifiedCache {
  constructor() {
    this.engine = multiLevelCache;
  }

  /**
   * 初始化缓存
   */
  async initialize() {
    return await initialize();
  }

  /**
   * 获取缓存数据
   */
  async get(key, prefix = 'cache') {
    try {
      return await this.engine.get(key, prefix);
    } catch (error) {
      logger.error(`[UNIFIED-CACHE] 获取缓存失败: ${key}`, error.message);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set(key, value, options = {}) {
    try {
      return await this.engine.set(key, value, options);
    } catch (error) {
      logger.error(`[UNIFIED-CACHE] 设置缓存失败: ${key}`, error.message);
      return false;
    }
  }

  /**
   * 删除缓存数据
   */
  async del(key, prefix = 'cache') {
    try {
      return await this.engine.del(key, prefix);
    } catch (error) {
      logger.error(`[UNIFIED-CACHE] 删除缓存失败: ${key}`, error.message);
      return false;
    }
  }

  /**
   * 批量删除匹配模式的缓存
   */
  async batchDelete(pattern) {
    try {
      return await this.engine.batchDelete(pattern);
    } catch (error) {
      logger.error(`[UNIFIED-CACHE] 批量删除失败: ${pattern}`, error.message);
      return 0;
    }
  }

  /**
   * 获取所有缓存键 (仅限 L1)
   */
  keys() {
    try {
      return Array.from(this.engine.l1.keys());
    } catch (error) {
      logger.error('[UNIFIED-CACHE] 获取键列表失败', error.message);
      return [];
    }
  }

  /**
   * 清空所有缓存
   */
  async flush() {
    try {
      return await this.engine.flush();
    } catch (error) {
      logger.error('[UNIFIED-CACHE] 清空缓存失败', error.message);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.engine.getStats();
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.engine.resetStats();
  }
}

// 导出单例
const unifiedCache = new UnifiedCache();

module.exports = {
  unifiedCache,
  get: (key, prefix) => unifiedCache.get(key, prefix),
  set: (key, value, options) => unifiedCache.set(key, value, options),
  del: (key, prefix) => unifiedCache.del(key, prefix),
  flush: () => unifiedCache.flush(),
  getStats: () => unifiedCache.getStats(),
  resetStats: () => unifiedCache.resetStats(),
  batchDelete: (pattern) => unifiedCache.batchDelete(pattern),
  keys: () => unifiedCache.keys()
};