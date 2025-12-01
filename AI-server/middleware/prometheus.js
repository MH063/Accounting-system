/**
 * Prometheus指标导出器
 * 提供符合Prometheus格式的指标数据
 */

const client = require('prom-client');
const logger = require('../config/logger');

// 创建Prometheus注册表
const register = new client.Registry();

// 启用默认指标（CPU、内存、事件循环等）
client.collectDefaultMetrics({
  register,
  prefix: 'node_app_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10
});

// 自定义HTTP请求指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP请求持续时间（秒）',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP请求总数',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: '当前正在处理的HTTP请求数',
  labelNames: ['method', 'route']
});

// 数据库指标
const databaseQueriesTotal = new client.Counter({
  name: 'database_queries_total',
  help: '数据库查询总数',
  labelNames: ['operation', 'status']
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: '数据库查询持续时间（秒）',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5]
});

const databaseConnections = new client.Gauge({
  name: 'database_connections',
  help: '数据库连接数',
  labelNames: ['state'] // idle, active, waiting
});

// 业务指标
const userRegistrations = new client.Counter({
  name: 'user_registrations_total',
  help: '用户注册总数',
  labelNames: ['source']
});

const fileUploadsTotal = new client.Counter({
  name: 'file_uploads_total',
  help: '文件上传总数',
  labelNames: ['type', 'status']
});

const fileUploadSize = new client.Histogram({
  name: 'file_upload_size_bytes',
  help: '文件上传大小（字节）',
  labelNames: ['type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600] // 1KB, 10KB, 100KB, 1MB, 10MB, 100MB
});

// 错误指标
const errorsTotal = new client.Counter({
  name: 'errors_total',
  help: '错误总数',
  labelNames: ['type', 'endpoint']
});

// 缓存指标
const cacheOperations = new client.Counter({
  name: 'cache_operations_total',
  help: '缓存操作总数',
  labelNames: ['operation', 'result'] // operation: get, set, delete; result: hit, miss, error
});

const cacheItems = new client.Gauge({
  name: 'cache_items',
  help: '缓存项数量',
  labelNames: ['type']
});

// 系统健康指标
const systemHealth = new client.Gauge({
  name: 'system_health_score',
  help: '系统健康评分（0-100）',
  labelNames: ['component']
});

// 注册所有自定义指标
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestsInFlight);
register.registerMetric(databaseQueriesTotal);
register.registerMetric(databaseQueryDuration);
register.registerMetric(databaseConnections);
register.registerMetric(userRegistrations);
register.registerMetric(fileUploadsTotal);
register.registerMetric(fileUploadSize);
register.registerMetric(errorsTotal);
register.registerMetric(cacheOperations);
register.registerMetric(cacheItems);
register.registerMetric(systemHealth);

/**
 * Prometheus中间件
 * 用于收集HTTP请求指标
 */
function prometheusMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    const route = req.route ? req.route.path : req.path;
    
    // 增加正在处理的请求数
    httpRequestsInFlight.inc({ method: req.method, route });
    
    // 监听响应完成事件
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000; // 转换为秒
      const statusCode = res.statusCode;
      
      // 减少正在处理的请求数
      httpRequestsInFlight.dec({ method: req.method, route });
      
      // 记录请求总数
      httpRequestsTotal.inc({ 
        method: req.method, 
        route, 
        status_code: statusCode 
      });
      
      // 记录请求持续时间
      httpRequestDuration.observe({ 
        method: req.method, 
        route, 
        status_code: statusCode 
      }, duration);
      
      // 记录错误
      if (statusCode >= 400) {
        const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
        errorsTotal.inc({ 
          type: errorType, 
          endpoint: route 
        });
      }
    });
    
    next();
  };
}

/**
 * 数据库查询指标收集
 */
function recordDatabaseQuery(operation, duration, status = 'success') {
  const durationSeconds = duration / 1000;
  
  databaseQueriesTotal.inc({ operation, status });
  databaseQueryDuration.observe({ operation }, durationSeconds);
}

/**
 * 记录数据库连接状态
 */
function recordDatabaseConnections(idle, active, waiting) {
  databaseConnections.set({ state: 'idle' }, idle);
  databaseConnections.set({ state: 'active' }, active);
  databaseConnections.set({ state: 'waiting' }, waiting);
}

/**
 * 用户注册指标
 */
function recordUserRegistration(source = 'direct') {
  userRegistrations.inc({ source });
}

/**
 * 文件上传指标
 */
function recordFileUpload(type, size, status = 'success') {
  fileUploadsTotal.inc({ type, status });
  fileUploadSize.observe({ type }, size);
}

/**
 * 缓存操作指标
 */
function recordCacheOperation(operation, result) {
  cacheOperations.inc({ operation, result });
}

/**
 * 系统健康指标
 */
function recordSystemHealth(component, score) {
  systemHealth.set({ component }, score);
}

/**
 * 获取Prometheus格式的指标数据
 */
async function getMetrics() {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('[PROMETHEUS] 获取指标失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取指标内容类型
 */
function getContentType() {
  return register.contentType;
}

/**
 * 健康检查指标收集
 */
async function recordHealthMetrics(healthData) {
  try {
    // 记录数据库健康状态
    if (healthData.checks && healthData.checks.database) {
      const dbHealth = healthData.checks.database;
      const dbScore = dbHealth.status === 'healthy' ? 100 : 
                     dbHealth.status === 'degraded' ? 50 : 0;
      systemHealth.set({ component: 'database' }, dbScore);
    }
    
    // 记录内存健康状态
    if (healthData.checks && healthData.checks.memory) {
      const memHealth = healthData.checks.memory;
      const memScore = memHealth.status === 'healthy' ? 100 : 
                      memHealth.status === 'warning' ? 70 : 0;
      systemHealth.set({ component: 'memory' }, memScore);
    }
    
    // 记录存储健康状态
    if (healthData.checks && healthData.checks.storage) {
      const storageHealth = healthData.checks.storage;
      const storageScore = storageHealth.status === 'healthy' ? 100 : 0;
      systemHealth.set({ component: 'storage' }, storageScore);
    }
    
    // 记录整体健康状态
    const overallScore = healthData.score || 
      (healthData.status === 'healthy' ? 100 : 
       healthData.status === 'degraded' ? 50 : 0);
    systemHealth.set({ component: 'overall' }, overallScore);
    
  } catch (error) {
    logger.error('[PROMETHEUS] 健康指标记录失败', { error: error.message });
  }
}

/**
 * 错误指标记录
 */
function recordError(error, endpoint = 'unknown') {
  try {
    const errorType = error.name || 'unknown_error';
    errorsTotal.inc({ type: errorType, endpoint });
  } catch (err) {
    logger.error('[PROMETHEUS] 错误指标记录失败', { error: err.message });
  }
}

module.exports = {
  prometheusMiddleware,
  recordDatabaseQuery,
  recordDatabaseConnections,
  recordUserRegistration,
  recordFileUpload,
  recordCacheOperation,
  recordSystemHealth,
  recordHealthMetrics,
  recordError,
  getMetrics,
  getContentType,
  register
};