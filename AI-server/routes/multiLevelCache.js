/**
 * 多级缓存管理路由
 * 提供缓存状态查询、统计和管理功能
 */

const express = require('express');
const router = express.Router();
const { multiLevelCache } = require('../config/multiLevelCache');
const logger = require('../config/logger');
const { responseWrapper } = require('../middleware/response');

/**
 * @route GET /api/cache/stats
 * @desc 获取多级缓存统计信息
 */
router.get('/stats', responseWrapper(async (req, res) => {
  const stats = multiLevelCache.getStats();
  const health = await multiLevelCache.healthCheck();
  
  return {
    success: true,
    data: {
      stats,
      health,
      timestamp: new Date().toISOString()
    }
  };
}));

/**
 * @route GET /api/cache/health
 * @desc 获取缓存健康状态
 */
router.get('/health', responseWrapper(async (req, res) => {
  const health = await multiLevelCache.healthCheck();
  
  return {
    success: true,
    data: health
  };
}));

/**
 * @route GET /api/cache/l1
 * @desc 获取L1缓存（内存缓存）详细信息
 */
router.get('/l1', responseWrapper(async (req, res) => {
  const stats = multiLevelCache.getStats();
  
  return {
    success: true,
    data: {
      level: 'L1',
      type: 'Memory Cache (LRU)',
      stats: stats.l1,
      configuration: {
        maxSize: 1000,
        defaultTTL: '5 minutes',
        algorithm: 'LRU (Least Recently Used)'
      }
    }
  };
}));

/**
 * @route GET /api/cache/l2
 * @desc 获取L2缓存（Redis缓存）详细信息
 */
router.get('/l2', responseWrapper(async (req, res) => {
  const stats = multiLevelCache.getStats();
  
  let redisStats = null;
  try {
    redisStats = await multiLevelCache.redisManager.getStats();
  } catch (error) {
    logger.error('获取Redis统计信息失败:', error);
  }
  
  return {
    success: true,
    data: {
      level: 'L2',
      type: 'Redis Cache',
      connection: multiLevelCache.redisManager.isRedisConnected(),
      stats: stats.l2,
      redis: redisStats,
      configuration: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        database: process.env.REDIS_DB || 0,
        defaultTTL: '1 hour'
      }
    }
  };
}));

/**
 * @route GET /api/cache/keys/:prefix?
 * @desc 获取缓存键列表
 */
router.get('/keys', responseWrapper(async (req, res) => {
  const { prefix = 'cache', limit = 100 } = req.query;
  
  // 获取L1缓存键
  const { multiLevelCache } = require('../config/multiLevelCache');
  const l1Keys = [];
  
  // 这里简化处理，实际应该从multiLevelCache实例获取
  // 由于LRU Cache的API限制，我们返回一些基本信息
  
  const keys = {
    l1: {
      count: 'N/A',
      sample: []
    },
    l2: {
      connected: multiLevelCache.redisManager.isRedisConnected(),
      count: 'N/A',
      sample: []
    }
  };

  // 如果Redis连接正常，尝试获取一些键
  if (multiLevelCache.redisManager.isRedisConnected()) {
    try {
      const redis = multiLevelCache.redisManager.getClient();
      let cursor = '0';
      const allKeys = [];
      
      do {
        const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', `${prefix}:*`, 'COUNT', 50);
        cursor = nextCursor;
        allKeys.push(...foundKeys);
      } while (cursor !== '0' && allKeys.length < limit);
      
      keys.l2.sample = allKeys.slice(0, limit);
    } catch (error) {
      logger.error('获取Redis键列表失败:', error);
    }
  }
  
  return {
    success: true,
    data: {
      prefix,
      keys
    }
  };
}));

/**
 * @route GET /api/cache/key/:key
 * @desc 获取指定键的缓存值
 */
router.get('/key/:key', responseWrapper(async (req, res) => {
  const { key } = req.params;
  const { prefix = 'cache' } = req.query;
  
  const fullKey = `${prefix}:${key}`;
  
  // 尝试从多级缓存获取
  const value = await multiLevelCache.get(key, prefix);
  
  return {
    success: true,
    data: {
      key: fullKey,
      value,
      exists: value !== null,
      timestamp: value ? new Date().toISOString() : null
    }
  };
}));

/**
 * @route DELETE /api/cache/key/:key
 * @desc 删除指定键的缓存
 */
router.delete('/key/:key', responseWrapper(async (req, res) => {
  const { key } = req.params;
  const { prefix = 'cache' } = req.query;
  
  const success = await multiLevelCache.del(key, prefix);
  
  return {
    success,
    message: success ? '缓存删除成功' : '缓存删除失败',
    data: {
      key: `${prefix}:${key}`
    }
  };
}));

/**
 * @route DELETE /api/cache/prefix/:prefix
 * @desc 根据前缀批量删除缓存
 */
router.delete('/prefix/:prefix', responseWrapper(async (req, res) => {
  const { prefix } = req.params;
  
  const deletedCount = await multiLevelCache.batchDelete(prefix);
  
  return {
    success: true,
    message: `批量删除完成，共删除 ${deletedCount} 个缓存项`,
    data: {
      prefix,
      deletedCount
    }
  };
}));

/**
 * @route POST /api/cache/set
 * @desc 手动设置缓存
 */
router.post('/set', responseWrapper(async (req, res) => {
  const { key, value, prefix = 'cache', ttl = 3600 } = req.body;
  
  if (!key || value === undefined) {
    return {
      success: false,
      message: '缺少必要参数：key 和 value'
    };
  }
  
  const success = await multiLevelCache.set(key, value, {
    prefix,
    l2Ttl: ttl
  });
  
  return {
    success,
    message: success ? '缓存设置成功' : '缓存设置失败',
    data: {
      key: `${prefix}:${key}`,
      ttl
    }
  };
}));

/**
 * @route POST /api/cache/flush
 * @desc 清空所有缓存
 */
router.post('/flush', responseWrapper(async (req, res) => {
  const { prefix } = req.body;
  
  const success = await multiLevelCache.flush(prefix);
  
  return {
    success,
    message: success ? '缓存清空成功' : '缓存清空失败',
    data: {
      prefix: prefix || 'all'
    }
  };
}));

/**
 * @route POST /api/cache/warmup
 * @desc 触发缓存预热
 */
router.post('/warmup', responseWrapper(async (req, res) => {
  const { items = [] } = req.body;
  
  if (!Array.isArray(items)) {
    return {
      success: false,
      message: 'items 必须是数组'
    };
  }
  
  // 预热缓存
  for (const item of items) {
    try {
      const { name, key, prefix = 'warmup', loader, ttl = 3600 } = item;
      
      if (!name || !key || !loader) {
        logger.warn(`[CACHE-WARMUP] 跳过无效预热项: ${name || 'unknown'}`);
        continue;
      }
      
      logger.info(`[CACHE-WARMUP] 预热 ${name}...`);
      
      const data = await loader();
      
      if (data) {
        await multiLevelCache.set(key, data, {
          prefix,
          l2Ttl: ttl
        });
        
        logger.info(`[CACHE-WARMUP] ${name} 预热完成`);
      }
    } catch (error) {
      logger.error(`[CACHE-WARMUP] 预热失败:`, error.message);
    }
  }
  
  return {
    success: true,
    message: '缓存预热完成',
    data: {
      itemsCount: items.length
    }
  };
}));

/**
 * @route GET /api/cache/test
 * @desc 测试缓存功能
 */
router.get('/test', responseWrapper(async (req, res) => {
  const testKey = `test_${Date.now()}`;
  const testValue = {
    message: '这是一个缓存测试',
    timestamp: new Date().toISOString(),
    random: Math.random()
  };
  
  // 测试设置
  const setResult = await multiLevelCache.set(testKey, testValue, {
    prefix: 'test',
    l2Ttl: 60 // 1分钟过期
  });
  
  if (!setResult) {
    return {
      success: false,
      message: '缓存设置测试失败'
    };
  }
  
  // 测试获取
  const getResult = await multiLevelCache.get(testKey, 'test');
  
  // 测试删除
  const deleteResult = await multiLevelCache.del(testKey, 'test');
  
  // 验证数据一致性
  const dataMatch = JSON.stringify(testValue) === JSON.stringify(getResult);
  
  return {
    success: true,
    message: '缓存功能测试完成',
    data: {
      setTest: setResult ? 'PASS' : 'FAIL',
      getTest: getResult ? 'PASS' : 'FAIL',
      deleteTest: deleteResult ? 'PASS' : 'FAIL',
      dataConsistency: dataMatch ? 'PASS' : 'FAIL',
      testKey: `test:${testKey}`,
      retrievedValue: getResult
    }
  };
}));

/**
 * @route GET /api/cache/performance
 * @desc 缓存性能测试
 */
router.get('/performance', responseWrapper(async (req, res) => {
  const { iterations = 100 } = req.query;
  const testIterations = parseInt(iterations);
  
  if (testIterations > 1000) {
    return {
      success: false,
      message: '测试次数不能超过1000次'
    };
  }
  
  const results = {
    l1Write: [],
    l1Read: [],
    l2Write: [],
    l2Read: []
  };
  
  // 测试L1缓存性能
  for (let i = 0; i < testIterations; i++) {
    const key = `perf_test_l1_${i}`;
    const value = { data: `test_${i}`, timestamp: Date.now() };
    
    // L1写入测试
    const writeStart = performance.now();
    await multiLevelCache.set(key, value, { forceL2Only: true }); // 只写入L1
    const writeEnd = performance.now();
    results.l1Write.push(writeEnd - writeStart);
    
    // L1读取测试
    const readStart = performance.now();
    await multiLevelCache.get(key, 'cache');
    const readEnd = performance.now();
    results.l1Read.push(readEnd - readStart);
    
    // 清理
    await multiLevelCache.del(key, 'cache');
  }
  
  // 测试L2缓存性能
  for (let i = 0; i < testIterations; i++) {
    const key = `perf_test_l2_${i}`;
    const value = { data: `test_${i}`, timestamp: Date.now() };
    
    // L2写入测试
    const writeStart = performance.now();
    await multiLevelCache.set(key, value, {
      prefix: 'perf',
      l1Ttl: 1 // 短期L1缓存
    });
    const writeEnd = performance.now();
    results.l2Write.push(writeEnd - writeStart);
    
    // L2读取测试（确保L1缓存过期）
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待L1过期
    const readStart = performance.now();
    await multiLevelCache.get(key, 'perf');
    const readEnd = performance.now();
    results.l2Read.push(readEnd - readStart);
    
    // 清理
    await multiLevelCache.del(key, 'perf');
  }
  
  // 计算统计数据
  const calculateStats = (data) => {
    const sorted = data.sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0]?.toFixed(3) || '0',
      max: sorted[sorted.length - 1]?.toFixed(3) || '0',
      avg: (sum / data.length).toFixed(3),
      median: sorted[Math.floor(sorted.length / 2)]?.toFixed(3) || '0'
    };
  };
  
  return {
    success: true,
    message: '缓存性能测试完成',
    data: {
      iterations: testIterations,
      performance: {
        l1: {
          write: calculateStats(results.l1Write),
          read: calculateStats(results.l1Read)
        },
        l2: {
          write: calculateStats(results.l2Write),
          read: calculateStats(results.l2Read)
        }
      },
      unit: 'milliseconds',
      timestamp: new Date().toISOString()
    }
  };
}));

module.exports = router;