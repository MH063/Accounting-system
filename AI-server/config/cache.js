/**
 * 查询缓存模块
 * 使用node-cache实现内存缓存，提高数据库查询性能
 */

const NodeCache = require('node-cache');
const logger = require('./logger');

// 创建缓存实例
// 默认TTL为300秒(5分钟)，检查周期为120秒(2分钟)
const queryCache = new NodeCache({
  stdTTL: 300, // 缓存过期时间(秒)
  checkperiod: 120, // 定期检查过期缓存的周期(秒)
  useClones: false // 不克隆对象，提高性能
});

// 缓存统计
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

/**
 * 生成缓存键
 * @param {string} query - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {string} 缓存键
 */
const generateCacheKey = (query, params = []) => {
  // 将查询语句和参数组合成字符串
  const paramString = params.length > 0 ? JSON.stringify(params) : '';
  const keyString = `${query}:${paramString}`;
  
  // 使用简单的哈希函数生成固定长度的键
  let hash = 0;
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return `query_${Math.abs(hash)}`;
};

/**
 * 获取缓存数据
 * @param {string} query - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Object|null} 缓存的数据或null
 */
const get = (query, params = []) => {
  const key = generateCacheKey(query, params);
  const cachedData = queryCache.get(key);
  
  if (cachedData) {
    cacheStats.hits++;
    logger.debug(`[CACHE] 缓存命中: ${key}`);
    return cachedData;
  } else {
    cacheStats.misses++;
    logger.debug(`[CACHE] 缓存未命中: ${key}`);
    return null;
  }
};

/**
 * 设置缓存数据
 * @param {string} query - SQL查询语句
 * @param {Array} params - 查询参数
 * @param {Object} data - 要缓存的数据
 * @param {number} ttl - 缓存过期时间(秒)，可选
 */
const set = (query, params = [], data, ttl) => {
  const key = generateCacheKey(query, params);
  const success = queryCache.set(key, data, ttl);
  
  if (success) {
    cacheStats.sets++;
    logger.debug(`[CACHE] 缓存设置: ${key}, TTL: ${ttl || 'default'}`);
  } else {
    logger.error(`[CACHE] 缓存设置失败: ${key}`);
  }
  
  return success;
};

/**
 * 删除缓存数据
 * @param {string} query - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {boolean} 是否成功删除
 */
const del = (query, params = []) => {
  const key = generateCacheKey(query, params);
  const deleted = queryCache.del(key);
  
  if (deleted > 0) {
    cacheStats.deletes++;
    logger.debug(`[CACHE] 缓存删除: ${key}`);
    return true;
  }
  
  return false;
};

/**
 * 清空所有缓存
 */
const flush = () => {
  queryCache.flushAll();
  logger.info('[CACHE] 所有缓存已清空');
};

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计信息
 */
const getStats = () => {
  const nodeCacheStats = queryCache.getStats();
  
  return {
    ...cacheStats,
    keys: nodeCacheStats.keys,
    ksize: nodeCacheStats.ksize,
    vsize: nodeCacheStats.vsize,
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
    deletes: 0
  };
};

/**
 * 根据表名清除相关缓存
 * @param {string} tableName - 表名
 */
const invalidateTableCache = (tableName) => {
  const keys = queryCache.keys();
  let invalidatedCount = 0;
  
  keys.forEach(key => {
    // 检查缓存键是否包含表名
    if (key.includes(tableName)) {
      queryCache.del(key);
      invalidatedCount++;
    }
  });
  
  logger.info(`[CACHE] 已清除表 "${tableName}" 的 ${invalidatedCount} 个缓存项`);
  return invalidatedCount;
};

/**
 * 缓存中间件 - 自动缓存查询结果
 * @param {Object} options - 配置选项
 * @returns {Function} 中间件函数
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 默认TTL
    keyGenerator = null, // 自定义键生成函数
    condition = () => true // 缓存条件函数
  } = options;
  
  return (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }
    
    // 生成缓存键
    const cacheKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl}`;
    
    // 尝试从缓存获取
    const cachedResponse = queryCache.get(cacheKey);
    if (cachedResponse) {
      logger.debug(`[CACHE] API缓存命中: ${cacheKey}`);
      return res.json(cachedResponse);
    }
    
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法以缓存响应
    res.json = function(data) {
      // 只缓存成功响应
      if (data && data.success) {
        queryCache.set(cacheKey, data, ttl);
        cacheStats.sets++;
        logger.debug(`[CACHE] API缓存设置: ${cacheKey}`);
      }
      
      // 调用原始方法
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// 监听缓存事件
queryCache.on('set', (key, value) => {
  logger.debug(`[CACHE] 事件: 设置缓存 ${key}`);
});

queryCache.on('del', (key, value) => {
  logger.debug(`[CACHE] 事件: 删除缓存 ${key}`);
});

queryCache.on('expired', (key, value) => {
  logger.debug(`[CACHE] 事件: 缓存过期 ${key}`);
});

module.exports = {
  get,
  set,
  del,
  flush,
  getStats,
  resetStats,
  invalidateTableCache,
  cacheMiddleware,
  generateCacheKey
};