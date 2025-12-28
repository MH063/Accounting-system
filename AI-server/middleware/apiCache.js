/**
 * API响应缓存中间件
 * 提供灵活的API响应缓存功能，支持多种缓存策略
 */

const { unifiedCache } = require('../config/unifiedCache');
const crypto = require('crypto');
const logger = require('../config/logger');

// 缓存统计
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0
};

/**
 * 生成缓存键
 * @param {Object} req - Express请求对象
 * @param {Object} options - 缓存选项
 * @returns {string} 缓存键
 */
const generateCacheKey = (req, options = {}) => {
  const {
    includeQuery = true,
    includeHeaders = [],
    includeUser = false,
    customKey = null
  } = options;
  
  // 如果提供了自定义键，直接使用
  if (customKey) {
    return typeof customKey === 'function' ? customKey(req) : customKey;
  }
  
  // 基础键包含方法和路径
  let keyData = `${req.method}:${req.originalUrl || req.url}`;
  
  // 包含查询参数
  if (includeQuery && req.query && Object.keys(req.query).length > 0) {
    // 对查询参数进行排序以确保一致性
    const sortedQuery = Object.keys(req.query)
      .sort()
      .reduce((result, k) => {
        result[k] = req.query[k];
        return result;
      }, {});
    
    keyData += `?${JSON.stringify(sortedQuery)}`;
  }
  
  // 包含指定的请求头
  if (includeHeaders.length > 0) {
    const headersData = includeHeaders
      .filter(header => req.headers[header])
      .map(header => `${header}:${req.headers[header]}`)
      .join(',');
    
    if (headersData) {
      keyData += `|${headersData}`;
    }
  }
  
  // 包含用户信息（如果需要区分用户）
  if (includeUser && req.user && req.user.id) {
    keyData += `|user:${req.user.id}`;
  }
  
  // 生成哈希键
  return `api:${crypto.createHash('md5').update(keyData).digest('hex')}`;
};

/**
 * 获取缓存数据
 * @param {string} key - 缓存键
 * @returns {Object|null} 缓存的数据或null
 */
const get = async (key) => {
  try {
    const cachedData = await unifiedCache.get(key, 'api');
    
    if (cachedData) {
      cacheStats.hits++;
      logger.debug(`[API_CACHE] 缓存命中: ${key}`);
      return cachedData;
    } else {
      cacheStats.misses++;
      logger.debug(`[API_CACHE] 缓存未命中: ${key}`);
      return null;
    }
  } catch (error) {
    cacheStats.errors++;
    logger.error(`[API_CACHE] 获取缓存失败: ${key}`, { error: error.message });
    return null;
  }
};

/**
 * 设置缓存数据
 * @param {string} key - 缓存键
 * @param {Object} data - 要缓存的数据
 * @param {number} ttl - 缓存过期时间(秒)，可选
 * @returns {boolean} 是否成功设置
 */
const set = async (key, data, ttl) => {
  try {
    const success = await unifiedCache.set(key, data, { prefix: 'api', ttl });
    
    if (success) {
      cacheStats.sets++;
      logger.debug(`[API_CACHE] 缓存设置: ${key}, TTL: ${ttl || 'default'}`);
    } else {
      logger.error(`[API_CACHE] 缓存设置失败: ${key}`);
    }
    
    return success;
  } catch (error) {
    cacheStats.errors++;
    logger.error(`[API_CACHE] 设置缓存失败: ${key}`, { error: error.message });
    return false;
  }
};

/**
 * 删除缓存数据
 * @param {string} key - 缓存键
 * @returns {boolean} 是否成功删除
 */
const del = async (key) => {
  try {
    const deleted = await unifiedCache.del(key, 'api');
    
    if (deleted) {
      cacheStats.deletes++;
      logger.debug(`[API_CACHE] 缓存删除: ${key}`);
      return true;
    }
    
    return false;
  } catch (error) {
    cacheStats.errors++;
    logger.error(`[API_CACHE] 删除缓存失败: ${key}`, { error: error.message });
    return false;
  }
};

/**
 * 清空所有缓存
 */
const flush = async () => {
  try {
    await unifiedCache.flush();
    logger.info('[API_CACHE] 所有缓存已清空');
  } catch (error) {
    cacheStats.errors++;
    logger.error('[API_CACHE] 清空缓存失败', { error: error.message });
  }
};

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
const getStats = () => {
  const unifiedStats = unifiedCache.getStats();
  
  return {
    ...cacheStats,
    ...unifiedStats,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100 || 0
  };
};

/**
 * 重置缓存统计
 */
const resetStats = () => {
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };
  unifiedCache.resetStats();
};

/**
 * 根据模式清除缓存
 * @param {string} pattern - 缓存键模式
 * @returns {number} 清除的缓存项数量
 */
const invalidateByPattern = async (pattern) => {
  try {
    const deletedCount = await unifiedCache.batchDelete(pattern);
    logger.info(`[API_CACHE] 已清除 ${deletedCount} 个匹配模式 "${pattern}" 的缓存项`);
    return deletedCount;
  } catch (error) {
    cacheStats.errors++;
    logger.error(`[API_CACHE] 按模式清除缓存失败: ${pattern}`, { error: error.message });
    return 0;
  }
};

/**
 * API缓存中间件
 * @param {Object} options - 配置选项
 * @returns {Function} 中间件函数
 */
const apiCacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 默认TTL(秒)
    condition = () => true, // 缓存条件函数
    keyGenerator = null, // 自定义键生成函数
    skipCache = false, // 是否跳过缓存
    cacheStatusHeader = 'X-Cache-Status', // 缓存状态响应头
    cacheKeyPrefix = '', // 缓存键前缀
    includeQuery = true, // 是否包含查询参数
    includeHeaders = [], // 包含的请求头
    includeUser = false // 是否包含用户信息
  } = options;
  
  return async (req, res, next) => {
    // 如果跳过缓存或条件不满足，直接继续
    if (skipCache || !condition(req)) {
      return next();
    }
    
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }
    
    // 生成缓存键
    const cacheKeyOptions = {
      includeQuery,
      includeHeaders,
      includeUser,
      customKey: keyGenerator
    };
    
    const cacheKey = cacheKeyPrefix + generateCacheKey(req, cacheKeyOptions);
    
    // 尝试从缓存获取
    const cachedResponse = await get(cacheKey);
    if (cachedResponse) {
      // 设置缓存状态头
      res.set(cacheStatusHeader, 'HIT');
      
      // 返回缓存的响应
      return res.json(cachedResponse);
    }
    
    // 设置缓存状态头
    res.set(cacheStatusHeader, 'MISS');
    
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法以缓存响应
    res.json = async function(data) {
      // 只缓存成功响应
      if (data && data.success !== false) {
        await set(cacheKey, data, ttl);
      }
      
      // 调用原始方法
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * 预定义的缓存中间件
 */
const cacheMiddleware = {
  // 短期缓存 (5分钟)
  short: (options = {}) => apiCacheMiddleware({ ttl: 300, ...options }),
  
  // 中期缓存 (30分钟)
  medium: (options = {}) => apiCacheMiddleware({ ttl: 1800, ...options }),
  
  // 长期缓存 (2小时)
  long: (options = {}) => apiCacheMiddleware({ ttl: 7200, ...options }),
  
  // 静态资源缓存 (24小时)
  static: (options = {}) => apiCacheMiddleware({ ttl: 86400, ...options }),
  
  // 用户特定缓存
  userSpecific: (options = {}) => apiCacheMiddleware({ 
    ttl: 600, 
    includeUser: true, 
    ...options 
  }),
  
  // 自定义缓存
  custom: apiCacheMiddleware
};

module.exports = {
  get,
  set,
  del,
  flush,
  getStats,
  resetStats,
  invalidateByPattern,
  apiCacheMiddleware,
  cacheMiddleware,
  generateCacheKey
};