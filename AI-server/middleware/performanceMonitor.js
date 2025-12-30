/**
 * 性能监控中间件
 * 自动记录API请求的性能指标
 */

const logger = require('../config/logger');
const { multiLevelCache } = require('../config/multiLevelCache');

/**
 * 性能监控统计
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      slowRequests: 0,
      errorRequests: 0,
      routes: new Map()
    };
    
    this.slowRequestThreshold = 1000; // 慢请求阈值（毫秒）
  }

  /**
   * 记录请求
   */
  recordRequest(route, responseTime, statusCode, req = null) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
    
    if (responseTime > this.slowRequestThreshold) {
      this.metrics.slowRequests++;
    }
    
    if (statusCode >= 400) {
      this.metrics.errorRequests++;
    }
    
    // 按路由统计
    if (!this.metrics.routes.has(route)) {
      this.metrics.routes.set(route, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0
      });
    }
    
    const routeMetrics = this.metrics.routes.get(route);
    routeMetrics.count++;
    routeMetrics.totalTime += responseTime;
    routeMetrics.minTime = Math.min(routeMetrics.minTime, responseTime);
    routeMetrics.maxTime = Math.max(routeMetrics.maxTime, responseTime);
    
    if (statusCode >= 400) {
      routeMetrics.errors++;
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const avgResponseTime = this.metrics.requests > 0
      ? Math.round(this.metrics.totalResponseTime / this.metrics.requests)
      : 0;
    
    const slowRequestRate = this.metrics.requests > 0
      ? (this.metrics.slowRequests / this.metrics.requests * 100).toFixed(2)
      : 0;
    
    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errorRequests / this.metrics.requests * 100).toFixed(2)
      : 0;
    
    // 转换路由统计为数组
    const routeStats = Array.from(this.metrics.routes.entries()).map(([route, stats]) => ({
      route,
      count: stats.count,
      avgTime: Math.round(stats.totalTime / stats.count),
      minTime: stats.minTime === Infinity ? 0 : stats.minTime,
      maxTime: stats.maxTime,
      errors: stats.errors,
      errorRate: stats.count > 0 ? (stats.errors / stats.count * 100).toFixed(2) : 0
    })).sort((a, b) => b.avgTime - a.avgTime);
    
    return {
      summary: {
        totalRequests: this.metrics.requests,
        avgResponseTime,
        slowRequestRate: parseFloat(slowRequestRate),
        errorRate: parseFloat(errorRate),
        slowRequests: this.metrics.slowRequests,
        errorRequests: this.metrics.errorRequests
      },
      routes: routeStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 重置统计
   */
  reset() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      slowRequests: 0,
      errorRequests: 0,
      routes: new Map()
    };
  }
}

// 创建全局实例
const monitor = new PerformanceMonitor();

/**
 * 性能监控中间件
 */
const performanceMonitorMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // 保存原始的res.json和res.send方法
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // 重写res.json
    res.json = function(data) {
      const responseTime = Date.now() - startTime;
      const route = req.route ? req.route.path : req.path;
      
      // 记录性能指标
      monitor.recordRequest(route, responseTime, res.statusCode, req);
      
      // 记录慢请求
      if (responseTime > monitor.slowRequestThreshold) {
        logger.warn('[PERFORMANCE] 慢请求检测', {
          route,
          method: req.method,
          responseTime,
          statusCode: res.statusCode
        });
      }
      
      // 添加性能头部
      res.set('X-Response-Time', `${responseTime}ms`);
      
      return originalJson(data);
    };
    
    // 重写res.send
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      const route = req.route ? req.route.path : req.path;
      
      // 记录性能指标
      monitor.recordRequest(route, responseTime, res.statusCode, req);
      
      // 记录慢请求
      if (responseTime > monitor.slowRequestThreshold) {
        logger.warn('[PERFORMANCE] 慢请求检测', {
          route,
          method: req.method,
          responseTime,
          statusCode: res.statusCode
        });
      }
      
      // 添加性能头部
      res.set('X-Response-Time', `${responseTime}ms`);
      
      return originalSend(data);
    };
    
    next();
  };
};

/**
 * 性能统计API中间件
 */
const performanceStatsMiddleware = () => {
  return (req, res) => {
    const stats = monitor.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  };
};

/**
 * 重置性能统计中间件
 */
const performanceResetMiddleware = () => {
  return (req, res) => {
    monitor.reset();
    
    res.json({
      success: true,
      message: '性能统计已重置'
    });
  };
};

module.exports = {
  PerformanceMonitor,
  monitor,
  performanceMonitorMiddleware,
  performanceStatsMiddleware,
  performanceResetMiddleware
};
