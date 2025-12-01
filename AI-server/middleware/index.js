/**
 * 中间件聚合模块
 * 统一导出所有中间件，便于在应用中集中管理
 */

// 安全相关中间件
const ipWhitelist = require('./security/ipWhitelist');
const strictRateLimit = require('./security/strictRateLimit');
const securityHeaders = require('./security/securityHeaders');
const sqlInjectionProtection = require('./security/sqlInjectionProtection');
const requestSizeLimit = require('./security/requestSizeLimit');
const { securityAuditMiddleware } = require('./security/auditLogger');
const { zeroTrustAccessControl, dynamicAccessControl, networkSegmentation } = require('./security/zeroTrustAccessControl');
const { behaviorAnalysisMiddleware } = require('./security/behaviorAnalysisMiddleware');

// 缓存中间件
const { cacheMiddleware } = require('./apiCache');

// 压缩中间件
const { compressionPresets, staticOptimizationMiddleware } = require('./compression');

// 速率限制
const { defaultRateLimiter } = require('./rateLimiter');

// 响应处理
const { responseWrapper } = require('./response');

// 请求日志
const { requestLogger } = require('./requestLogger');

// 错误处理
const { notFound, errorHandler, normalizePath } = require('./errorHandling');
const { enhancedGlobalErrorHandler } = require('./errorHandling/enhancedErrorHandler');

// 认证和授权中间件
const { authenticateToken, authorizeAdmin, requireRole } = require('./auth');

// 验证中间件
const { validateTableName, validateNumberParam, validateStringParam } = require('./validation');

// 文件上传中间件
const { validateFileUpload } = require('./upload');

module.exports = {
  // 安全相关中间件
  ipWhitelist,
  strictRateLimit,
  securityHeaders,
  sqlInjectionProtection,
  requestSizeLimit: require('./security/requestSizeLimit'), // 使用独立的requestSizeLimit
  securityAuditMiddleware,
  zeroTrustAccessControl,
  dynamicAccessControl,
  networkSegmentation,
  behaviorAnalysisMiddleware,

  // 缓存中间件
  cacheMiddleware,

  // 压缩中间件
  compressionPresets,
  staticOptimizationMiddleware,

  // 速率限制
  defaultRateLimiter,

  // 响应处理
  responseWrapper,

  // 请求日志
  requestLogger,

  // 错误处理
  notFound,
  errorHandler,
  enhancedGlobalErrorHandler,
  normalizePath,

  // 认证和授权中间件
  authenticateToken,
  authorizeAdmin,
  requireRole,

  // 验证中间件
  validateTableName,
  validateNumberParam,
  validateStringParam,

  // 文件上传中间件
  validateFileUpload
};