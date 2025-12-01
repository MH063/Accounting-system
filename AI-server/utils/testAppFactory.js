/**
 * 测试应用工厂
 * 创建用于测试的Express应用实例
 */

const express = require('express');
const helmet = require('helmet');
const { createCorsMiddleware } = require('../middleware/corsConfig');

// 导入聚合模块
const {
  ipWhitelist, strictRateLimit, securityHeaders, sqlInjectionProtection, requestSizeLimit,
  cacheMiddleware, compressionPresets, staticOptimizationMiddleware, defaultRateLimiter,
  responseWrapper, requestLogger, normalizePath, notFound, errorHandler, enhancedErrorHandler,
  authenticateToken, authorizeAdmin, requireRole, validateTableName,
  securityAuditMiddleware
  // 移除了不存在的validateQueryParams
} = require('../middleware');

const {
  authRoutes, dbRoutes, uploadRoutes, dbHealthRoutes, logManagementRoutes,
  cacheRoutes, enhancedCacheRoutes, securityRoutes, healthRoutes,
  virusScanRoutes, corsManagementRoutes, staticOptimizationRoutes, secureDbRoutes, secureAccessRoutes,
  securityHealthRoutes
} = require('../routes');

/**
 * 创建用于测试的Express应用实例
 * @returns {Express.Application} Express应用实例
 */
function createTestApp() {
  const app = express();
  
  // 安全头部设置
  app.use(helmet());
  
  // CORS配置 - 使用安全的CORS配置
  app.use(createCorsMiddleware());
  
  // 基础解析中间件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // 应用中间件
  app.use(securityHeaders()); // 请求头安全检查
  app.use(sqlInjectionProtection()); // SQL注入防护
  app.use(requestSizeLimit('5mb')); // 请求大小限制
  app.use(defaultRateLimiter); // 应用速率限制中间件
  app.use(requestLogger); // 请求日志中间件
  app.use(normalizePath); // 路径规范化中间件
  app.use(compressionPresets.standard); // 静态资源压缩中间件
  app.use(staticOptimizationMiddleware); // 静态优化中间件
  app.use(securityAuditMiddleware()); // 安全审计日志
  
  // 路由配置
  app.use('/api/auth', authRoutes);
  app.use('/api/db', dbRoutes);
  app.use('/api/db', dbHealthRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/logs', logManagementRoutes);
  app.use('/api/cache', cacheRoutes);
  app.use('/api/cache', enhancedCacheRoutes);
  app.use('/api/security', securityRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/virus-scan', virusScanRoutes);
  app.use('/api/cors', corsManagementRoutes);
  app.use('/api/optimization', staticOptimizationRoutes);
  app.use('/api/secure-db', secureDbRoutes);
  app.use('/api/secure-access', secureAccessRoutes);
  app.use('/api/security-health', securityHealthRoutes);
  
  // 基本路由
  app.get('/', cacheMiddleware.short(), responseWrapper((req, res) => {
    return res.sendSuccess({
      version: '1.0.0',
      service: 'AI-server',
      status: 'running'
    }, 'API服务运行正常');
  }));
  
  // 错误处理中间件（简化版，用于测试）
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
}

module.exports = {
  createTestApp
};