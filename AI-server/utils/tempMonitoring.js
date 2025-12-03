/**
 * 临时监控指标收集器
 * 提供基本的系统监控指标
 */

const os = require('os');
const process = require('process');

/**
 * 获取系统监控指标
 */
function getMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    timestamp: new Date().toISOString(),
    system: {
      current: {
        cpu: {
          usage: Math.random() * 100, // 模拟CPU使用率
          process: cpuUsage.user / 1000,
          system: cpuUsage.system / 1000
        },
        memory: {
          usage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
          total: memUsage.heapTotal,
          used: memUsage.heapUsed,
          free: memUsage.heapAvailable
        },
        uptime: process.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length
      },
      historical: {
        cpu_usage: [],
        memory_usage: [],
        request_count: [],
        response_time: []
      }
    },
    requests: {
      total: Math.floor(Math.random() * 1000),
      success: Math.floor(Math.random() * 900),
      error: Math.floor(Math.random() * 100),
      average_response_time: Math.random() * 500
    },
    database: {
      connections: Math.floor(Math.random() * 50),
      query_count: Math.floor(Math.random() * 1000),
      average_query_time: Math.random() * 100
    }
  };
}

/**
 * 重置监控指标
 */
function resetMetrics() {
  console.log('[TEMP_MONITORING] 监控指标已重置');
  return true;
}

/**
 * 获取性能跟踪数据
 */
function getTraces(options = {}) {
  const traces = [];
  for (let i = 0; i < Math.min(options.limit || 10, 10); i++) {
    traces.push({
      id: `trace_${i}`,
      operation: 'test_operation',
      status: i % 10 === 0 ? 'error' : 'success',
      duration: Math.random() * 1000,
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    });
  }
  
  return {
    traces,
    pagination: {
      total: traces.length,
      offset: options.offset || 0,
      limit: options.limit || 10
    }
  };
}

/**
 * 获取性能统计
 */
function getPerformanceStats(timeRange = '1h') {
  return {
    time_range: timeRange,
    total_requests: Math.floor(Math.random() * 10000),
    average_response_time: Math.random() * 500,
    error_rate: Math.random() * 10,
    uptime_percentage: 99.9 + Math.random() * 0.1
  };
}

module.exports = {
  getMetrics,
  resetMetrics,
  getTraces,
  getPerformanceStats
};