const axios = require('axios');

// 测试配置
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const TIMEOUT = process.env.TEST_TIMEOUT || 10000;

// 定义所有要测试的端点
const endpoints = [
  // 基础端点
  { path: '/', method: 'GET', category: '基础' },
  { path: '/api/health', method: 'GET', category: '健康检查' },
  { path: '/api/health/performance', method: 'GET', category: '健康检查' },
  
  // 数据库相关
  { path: '/api/db-test', method: 'GET', category: '数据库' },
  { path: '/api/db/health', method: 'GET', category: '数据库' },
  
  // 日志相关
  { path: '/api/logs', method: 'GET', category: '日志' },
  { path: '/api/logs/stats', method: 'GET', category: '日志' },
  
  // 缓存相关
  { path: '/api/cache/stats', method: 'GET', category: '缓存' },
  
  // 安全相关
  { path: '/api/security/stats', method: 'GET', category: '安全' },
  
  // CORS相关
  { path: '/api/cors/domains', method: 'GET', category: 'CORS' },
  
  // 病毒扫描相关
  { path: '/api/virus-scan/status', method: 'GET', category: '病毒扫描' }
];

/**
 * 测试单个端点的响应格式
 * @param {Object} endpoint - 端点配置
 * @returns {Object} 测试结果
 */
async function testEndpoint(endpoint) {
  const startTime = Date.now();
  
  try {
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.path}`,
      timeout: TIMEOUT,
      validateStatus: () => true // 接受所有状态码
    });

    const duration = Date.now() - startTime;
    const data = response.data;
    
    // 基本响应结构验证
    const result = {
      endpoint: `${endpoint.method} ${endpoint.path}`,
      category: endpoint.category,
      status: response.status,
      duration: duration,
      success: true,
      issues: [],
      valid: true
    };

    // 检查响应是否为对象
    if (typeof data !== 'object' || data === null) {
      result.valid = false;
      result.issues.push('响应不是对象');
      return result;
    }

    // 检查必需字段
    if (!('success' in data)) {
      result.valid = false;
      result.issues.push('缺少 success 字段');
    } else if (typeof data.success !== 'boolean') {
      result.valid = false;
      result.issues.push('success 字段不是布尔值');
    }

    // 检查可选字段
    if (data.success && !('message' in data)) {
      result.issues.push('建议包含 message 字段');
    }
    
    if (data.success && !('data' in data)) {
      result.issues.push('建议包含 data 字段');
    }
    
    if ('timestamp' in data) {
      result.issues.push('包含 timestamp 字段');
    }

    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      endpoint: `${endpoint.method} ${endpoint.path}`,
      category: endpoint.category,
      status: error.response?.status || 'N/A',
      duration: duration,
      success: false,
      issues: [`请求失败: ${error.message}`],
      valid: false
    };
  }
}

/**
 * 按类别分组测试结果
 * @param {Array} results - 测试结果数组
 * @returns {Object} 分组结果
 */
function groupResultsByCategory(results) {
  const grouped = {};
  
  results.forEach(result => {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push(result);
  });
  
  return grouped;
}

/**
 * 生成测试报告
 * @param {Array} results - 测试结果数组
 */
function generateReport(results) {
  const total = results.length;
  const passed = results.filter(r => r.valid).length;
  const failed = total - passed;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  console.log('\n==========================================');
  console.log('           API 端点响应格式测试报告');
  console.log('==========================================');
  console.log(`测试时间: ${new Date().toISOString()}`);
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`通过率: ${passRate}%`);
  console.log('==========================================\n');
  
  // 按类别显示结果
  const groupedResults = groupResultsByCategory(results);
  
  Object.keys(groupedResults).forEach(category => {
    console.log(`\n[${category}]`);
    console.log('-'.repeat(50));
    
    groupedResults[category].forEach(result => {
      const statusIcon = result.valid ? '✅' : '❌';
      const statusText = result.success ? '成功' : '失败';
      
      console.log(`${statusIcon} ${result.endpoint}`);
      console.log(`   状态码: ${result.status} | 耗时: ${result.duration}ms | ${statusText}`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          const issueIcon = issue.startsWith('建议') ? '💡' : (issue.startsWith('包含') ? '📋' : '❗');
          console.log(`   ${issueIcon} ${issue}`);
        });
      }
      
      console.log('');
    });
  });
  
  console.log('==========================================\n');
  
  // 显示详细统计
  console.log('详细统计:');
  console.log(`- 成功率: ${passRate}% (${passed}/${total})`);
  
  const avgDuration = (results.reduce((sum, r) => sum + r.duration, 0) / total).toFixed(2);
  console.log(`- 平均响应时间: ${avgDuration}ms`);
  
  const slowest = results.reduce((max, r) => r.duration > max.duration ? r : max, { duration: 0 });
  console.log(`- 最慢响应: ${slowest.endpoint} (${slowest.duration}ms)`);
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始测试所有API端点的响应格式...');
  console.log(`目标地址: ${BASE_URL}`);
  console.log(`超时设置: ${TIMEOUT}ms\n`);
  
  const results = [];
  
  // 按顺序测试每个端点
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // 控制台实时反馈
    const statusText = result.valid ? '✅ 通过' : '❌ 失败';
    console.log(`[${result.category}] ${endpoint.method} ${endpoint.path} - ${statusText} (${result.duration}ms)`);
    
    // 等待一段时间避免速率限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 生成最终报告
  generateReport(results);
  
  return results;
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行出错:', error);
    process.exit(1);
  });
}

module.exports = {
  testEndpoint,
  runAllTests,
  endpoints
};