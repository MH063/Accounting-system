/**
 * 查询缓存模块
 * 使用node-cache实现内存缓存，提高数据库查询性能
 */

const { unifiedCache } = require('./unifiedCache');
const logger = require('./logger');

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
const get = async (query, params = []) => {
  const key = generateCacheKey(query, params);
  const cachedData = await unifiedCache.get(key, 'query');
  
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
const set = async (query, params = [], data, ttl) => {
  const key = generateCacheKey(query, params);
  const success = await unifiedCache.set(key, data, { prefix: 'query', ttl });
  
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
const del = async (query, params = []) => {
  const key = generateCacheKey(query, params);
  const deleted = await unifiedCache.del(key, 'query');
  
  if (deleted) {
    cacheStats.deletes++;
    logger.debug(`[CACHE] 缓存删除: ${key}`);
    return true;
  }
  
  return false;
};

/**
 * 清空所有缓存
 */
const flush = async () => {
  await unifiedCache.flush();
  logger.info('[CACHE] 所有缓存已清空');
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
    deletes: 0
  };
  unifiedCache.resetStats();
};

/**
 * 根据表名清除相关缓存
 * @param {string} tableName - 表名
 */
const invalidateTableCache = async (tableName) => {
  const deletedCount = await unifiedCache.batchDelete(tableName);
  logger.info(`[CACHE] 已清除包含 "${tableName}" 的 ${deletedCount} 个缓存项`);
  return deletedCount;
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
  
  return async (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }
    
    // 生成缓存键
    const cacheKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl}`;
    
    // 尝试从缓存获取
    const cachedResponse = await unifiedCache.get(cacheKey, 'api');
    if (cachedResponse) {
      logger.debug(`[CACHE] API缓存命中: ${cacheKey}`);
      return res.json(cachedResponse);
    }
    
    // 保存原始的res.json方法
    const originalJson = res.json;
    
    // 重写res.json方法以缓存响应
    res.json = async function(data) {
      // 只缓存成功响应
      if (data && data.success) {
        await unifiedCache.set(cacheKey, data, { prefix: 'api', ttl });
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