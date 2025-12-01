/**
 * 应用性能监控(APM)系统
 * 提供详细的性能分析和监控功能
 */

const logger = require('../config/logger');
const { performance } = require('perf_hooks');

// 性能跟踪存储
const performanceTraces = new Map();
const activeTraces = new Map();
const traceHistory = [];
const MAX_HISTORY_SIZE = 10000;

// APM配置
const apmConfig = {
  enabled: process.env.APM_ENABLED === 'true' || process.env.NODE_ENV === 'production',
  sampleRate: parseFloat(process.env.APM_SAMPLE_RATE || '0.1'), // 10%采样率
  slowQueryThreshold: parseInt(process.env.APM_SLOW_QUERY_THRESHOLD || '1000'), // 1秒
  slowRequestThreshold: parseInt(process.env.APM_SLOW_REQUEST_THRESHOLD || '2000'), // 2秒
  maxTracesPerMinute: parseInt(process.env.APM_MAX_TRACES_PER_MINUTE || '1000')
};

/**
 * 性能跟踪器类
 */
class PerformanceTracer {
  constructor(traceId, operation, metadata = {}) {
    this.traceId = traceId;
    this.operation = operation;
    this.metadata = metadata;
    this.spans = [];
    this.startTime = performance.now();
    this.startTimeISO = new Date().toISOString();
    this.status = 'running';
    this.error = null;
    this.tags = new Map();
    
    // 添加到活动跟踪
    activeTraces.set(traceId, this);
  }
  
  /**
   * 创建子跨度
   */
  startSpan(name, metadata = {}) {
    const spanId = `${this.traceId}-${this.spans.length}`;
    const span = {
      spanId,
      name,
      startTime: performance.now(),
      metadata,
      status: 'running'
    };
    
    this.spans.push(span);
    return span;
  }
  
  /**
   * 结束子跨度
   */
  endSpan(span, metadata = {}) {
    const endTime = performance.now();
    span.endTime = endTime;
    span.duration = endTime - span.startTime;
    span.status = 'completed';
    span.metadata = { ...span.metadata, ...metadata };
    
    // 检查是否为慢操作
    if (span.duration > apmConfig.slowQueryThreshold) {
      logger.warn('[APM] 慢操作检测', {
        traceId: this.traceId,
        spanId: span.spanId,
        operation: span.name,
        duration: span.duration,
        metadata: span.metadata
      });
    }
    
    return span;
  }
  
  /**
   * 添加标签
   */
  setTag(key, value) {
    this.tags.set(key, value);
  }
  
  /**
   * 记录错误
   */
  recordError(error) {
    this.status = 'error';
    this.error = {
      message: error.message,
      stack: error.stack,
      type: error.name || 'Error'
    };
    
    logger.error('[APM] 跟踪错误', {
      traceId: this.traceId,
      operation: this.operation,
      error: this.error
    });
  }
  
  /**
   * 结束跟踪
   */
  end(metadata = {}) {
    const endTime = performance.now();
    this.endTime = endTime;
    this.duration = endTime - this.startTime;
    this.status = this.status === 'running' ? 'completed' : this.status;
    this.metadata = { ...this.metadata, ...metadata };
    
    // 从活动跟踪中移除
    activeTraces.delete(this.traceId);
    
    // 添加到历史记录
    const traceData = this.toJSON();
    traceHistory.push(traceData);
    
    // 限制历史记录大小
    if (traceHistory.length > MAX_HISTORY_SIZE) {
      traceHistory.shift();
    }
    
    // 记录慢请求
    if (this.duration > apmConfig.slowRequestThreshold) {
      logger.warn('[APM] 慢请求检测', {
        traceId: this.traceId,
        operation: this.operation,
        duration: this.duration,
        spans: this.spans.length,
        metadata: this.metadata
      });
    }
    
    return traceData;
  }
  
  /**
   * 转换为JSON格式
   */
  toJSON() {
    return {
      traceId: this.traceId,
      operation: this.operation,
      status: this.status,
      startTime: this.startTimeISO,
      endTime: new Date().toISOString(),
      duration: this.duration,
      spans: this.spans.map(span => ({
        spanId: span.spanId,
        name: span.name,
        duration: span.duration,
        status: span.status,
        metadata: span.metadata
      })),
      metadata: this.metadata,
      tags: Object.fromEntries(this.tags),
      error: this.error
    };
  }
}

/**
 * 创建新的性能跟踪
 */
function createTrace(operation, metadata = {}) {
  // 检查是否应该采样
  if (!apmConfig.enabled || Math.random() > apmConfig.sampleRate) {
    return null;
  }
  
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return new PerformanceTracer(traceId, operation, metadata);
}

/**
 * APM中间件 - 请求性能跟踪
 */
function apmMiddleware() {
  return (req, res, next) => {
    if (!apmConfig.enabled) {
      return next();
    }
    
    const traceId = req.get('X-Trace-ID') || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trace = createTrace(`HTTP ${req.method} ${req.path}`, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      traceId
    });
    
    if (trace) {
      // 将跟踪添加到请求对象
      req.apm = {
        trace,
        traceId,
        startSpan: (name, metadata) => trace.startSpan(name, metadata),
        endSpan: (span, metadata) => trace.endSpan(span, metadata),
        setTag: (key, value) => trace.setTag(key, value),
        recordError: (error) => trace.recordError(error)
      };
      
      // 监听响应完成
      res.on('finish', () => {
        trace.setTag('status_code', res.statusCode);
        trace.setTag('content_length', res.get('Content-Length'));
        trace.end({
          statusCode: res.statusCode,
          contentType: res.get('Content-Type')
        });
      });
      
      // 监听错误
      res.on('error', (error) => {
        trace.recordError(error);
      });
    }
    
    next();
  };
}

/**
 * 数据库查询性能跟踪
 */
function traceDatabaseQuery(operation, query, params = []) {
  return async (req, res, next) => {
    if (!apmConfig.enabled || !req.apm) {
      return next();
    }
    
    const span = req.apm.startSpan(`DB ${operation}`, {
      operation,
      query: query.substring(0, 100),
      paramsCount: params.length
    });
    
    const originalQuery = req.db?.query || require('../config/database').query;
    
    if (originalQuery) {
      req.db = req.db || {};
      req.db.query = async (queryText, queryParams) => {
        const start = performance.now();
        
        try {
          const result = await originalQuery.call(this, queryText, queryParams);
          const duration = performance.now() - start;
          
          req.apm.endSpan(span, {
            duration,
            rowsAffected: result.rowCount || 0,
            success: true
          });
          
          return result;
        } catch (error) {
          const duration = performance.now() - start;
          
          req.apm.endSpan(span, {
            duration,
            success: false,
            error: error.message
          });
          
          req.apm.recordError(error);
          throw error;
        }
      };
    }
    
    next();
  };
}

/**
 * 文件操作性能跟踪
 */
function traceFileOperation(operation, metadata = {}) {
  return (req, res, next) => {
    if (!apmConfig.enabled || !req.apm) {
      return next();
    }
    
    const span = req.apm.startSpan(`File ${operation}`, metadata);
    
    // 监听文件上传完成
    if (req.file || req.files) {
      req.apm.endSpan(span, {
        fileSize: req.file?.size || 0,
        fileType: req.file?.mimetype || 'unknown',
        success: true
      });
    }
    
    next();
  };
}

/**
 * 获取性能跟踪数据
 */
function getTraces(options = {}) {
  const {
    limit = 100,
    offset = 0,
    operation,
    status,
    minDuration,
    maxDuration,
    startTime,
    endTime
  } = options;
  
  let traces = [...traceHistory];
  
  // 应用过滤器
  if (operation) {
    traces = traces.filter(trace => trace.operation.includes(operation));
  }
  
  if (status) {
    traces = traces.filter(trace => trace.status === status);
  }
  
  if (minDuration) {
    traces = traces.filter(trace => trace.duration >= minDuration);
  }
  
  if (maxDuration) {
    traces = traces.filter(trace => trace.duration <= maxDuration);
  }
  
  if (startTime) {
    traces = traces.filter(trace => new Date(trace.startTime) >= new Date(startTime));
  }
  
  if (endTime) {
    traces = traces.filter(trace => new Date(trace.startTime) <= new Date(endTime));
  }
  
  // 排序（最新的在前）
  traces.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  
  // 分页
  const total = traces.length;
  const paginatedTraces = traces.slice(offset, offset + limit);
  
  return {
    traces: paginatedTraces,
    pagination: {
      total,
      limit,
      offset,
      hasNext: offset + limit < total,
      hasPrevious: offset > 0
    }
  };
}

/**
 * 获取性能统计
 */
function getPerformanceStats(timeRange = '1h') {
  const now = Date.now();
  const timeRanges = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };
  
  const range = timeRanges[timeRange] || timeRanges['1h'];
  const cutoff = now - range;
  
  const recentTraces = traceHistory.filter(trace => 
    new Date(trace.startTime).getTime() > cutoff
  );
  
  const stats = {
    totalTraces: recentTraces.length,
    avgDuration: 0,
    p50Duration: 0,
    p95Duration: 0,
    p99Duration: 0,
    errorRate: 0,
    slowRequests: 0,
    byOperation: {},
    byStatus: {}
  };
  
  if (recentTraces.length > 0) {
    const durations = recentTraces.map(t => t.duration).sort((a, b) => a - b);
    
    stats.avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    stats.p50Duration = durations[Math.floor(durations.length * 0.5)];
    stats.p95Duration = durations[Math.floor(durations.length * 0.95)];
    stats.p99Duration = durations[Math.floor(durations.length * 0.99)];
    
    const errorTraces = recentTraces.filter(t => t.status === 'error');
    stats.errorRate = (errorTraces.length / recentTraces.length) * 100;
    
    const slowTraces = recentTraces.filter(t => t.duration > apmConfig.slowRequestThreshold);
    stats.slowRequests = slowTraces.length;
    
    // 按操作分组统计
    recentTraces.forEach(trace => {
      if (!stats.byOperation[trace.operation]) {
        stats.byOperation[trace.operation] = {
          count: 0,
          avgDuration: 0,
          errorRate: 0
        };
      }
      
      const opStats = stats.byOperation[trace.operation];
      opStats.count++;
      opStats.avgDuration = (opStats.avgDuration * (opStats.count - 1) + trace.duration) / opStats.count;
      
      if (trace.status === 'error') {
        opStats.errorRate = (opStats.errorRate * (opStats.count - 1) + 1) / opStats.count;
      }
    });
    
    // 按状态分组统计
    recentTraces.forEach(trace => {
      stats.byStatus[trace.status] = (stats.byStatus[trace.status] || 0) + 1;
    });
  }
  
  return stats;
}

/**
 * 清理旧的跟踪数据
 */
function cleanupOldTraces() {
  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
  
  // 清理历史记录
  const oldLength = traceHistory.length;
  for (let i = traceHistory.length - 1; i >= 0; i--) {
    if (new Date(traceHistory[i].startTime).getTime() < cutoff) {
      traceHistory.splice(i, 1);
    }
  }
  
  const cleaned = oldLength - traceHistory.length;
  if (cleaned > 0) {
    logger.info('[APM] 清理旧跟踪数据', { cleaned, remaining: traceHistory.length });
  }
}

/**
 * 定期清理任务
 */
function startCleanupTask() {
  // 每小时清理一次
  setInterval(cleanupOldTraces, 60 * 60 * 1000);
  
  // 立即执行一次清理
  cleanupOldTraces();
  
  logger.info('[APM] 清理任务已启动');
}

module.exports = {
  apmConfig,
  PerformanceTracer,
  createTrace,
  apmMiddleware,
  traceDatabaseQuery,
  traceFileOperation,
  getTraces,
  getPerformanceStats,
  cleanupOldTraces,
  startCleanupTask
};