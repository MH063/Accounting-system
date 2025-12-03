/**
 * 统一缓存架构测试
 */

const { unifiedCache } = require('../config/unifiedCache');
const { configManager } = require('../config/configManager');

console.log('=== 统一缓存架构测试 ===');

// 测试配置管理器
console.log('\n1. 测试配置管理器:');
console.log('服务器端口:', configManager.get('server.port'));
console.log('默认缓存适配器:', configManager.get('cache.defaultAdapter'));

// 测试统一缓存
(async () => {
  console.log('\n2. 测试统一缓存:');
  
  try {
    // 设置缓存
    const setResult = await unifiedCache.set('test-key', { message: 'Hello Cache!' });
    console.log('设置缓存结果:', setResult);
    
    // 获取缓存
    const getResult = await unifiedCache.get('test-key');
    console.log('获取缓存结果:', getResult);
    
    // 获取统计信息
    const stats = unifiedCache.getStats();
    console.log('缓存统计:', JSON.stringify(stats, null, 2));
    
    // 健康检查
    const health = await unifiedCache.healthCheck();
    console.log('健康检查:', JSON.stringify(health, null, 2));
  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
})();