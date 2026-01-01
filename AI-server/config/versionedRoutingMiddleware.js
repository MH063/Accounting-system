/**
 * 版本化路由中间件
 * 处理API版本识别、重定向和路由分发
 */

const express = require('express');
const path = require('path');
const logger = require('./logger');
const { apiVersionManager } = require('./apiVersionManager');
const { routeConfigManager } = require('./routeConfigManager');
const { responseWrapper } = require('../middleware/response');

/**
 * 版本识别和路由分发中间件
 */
class VersionedRoutingMiddleware {
  constructor() {
    this.router = express.Router();
    this.setupRoutingMiddleware();
  }

  /**
   * 设置路由中间件
   */
  setupRoutingMiddleware() {
    // 版本识别和设置中间件
    this.router.use(this.versionRecognitionMiddleware());
    
    // 路由分发中间件
    this.router.use(this.routeDistributionMiddleware());
    
    // 版本兼容性检查中间件
    this.router.use(this.compatibilityCheckMiddleware());
    
    // 设置管理路由
    this.setupManagementRoutes();
  }

  /**
   * 版本识别中间件
   * 识别请求的API版本并设置到请求对象
   */
  versionRecognitionMiddleware() {
    return (req, res, next) => {
      try {
        // 多种方式获取版本信息
        const versionSources = [
          // 1. URL路径中的版本 (/api/v1/...)
          this.extractVersionFromPath(req.path),
          // 2. Header中的版本
          req.get('API-Version') || req.get('X-API-Version'),
          // 3. Query参数中的版本
          req.query.version,
          // 4. Cookie中的版本
          req.cookies?.api_version,
          // 5. 请求体中的版本（用于POST/PUT请求）
          req.body?.api_version
        ];

        // 优先使用URL路径中的版本，其次是Header，然后是其他来源
        let requestedVersion = null;
        for (const version of versionSources) {
          if (version) {
            // 清理版本号（移除v前缀）
            const cleanVersion = version.replace(/^v/i, '').toLowerCase();
            if (apiVersionManager.isVersionSupported(cleanVersion)) {
              requestedVersion = cleanVersion;
              break;
            }
          }
        }

        // 如果没有找到有效版本，使用默认版本
        if (!requestedVersion) {
          requestedVersion = apiVersionManager.getDefaultVersion();
        }

        // 验证版本是否支持
        if (!apiVersionManager.isVersionSupported(requestedVersion)) {
          logger.warn(`[VERSION_MIDDLEWARE] 不支持的API版本: ${requestedVersion}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            availableVersions: apiVersionManager.getSupportedVersions()
          });

          return res.status(400).json({
            success: false,
            message: `不支持的API版本: ${requestedVersion}`,
            error: 'Unsupported API version',
            supportedVersions: apiVersionManager.getSupportedVersions(),
            defaultVersion: apiVersionManager.getDefaultVersion(),
            documentation: '/api/docs/versions'
          });
        }

        // 将版本信息附加到请求对象
        req.apiVersion = requestedVersion;
        req.requestedVersion = `v${requestedVersion}`;
        
        // 设置响应头
        res.set('API-Version', requestedVersion);
        res.set('X-Supported-API-Versions', apiVersionManager.getSupportedVersions().join(','));
        res.set('X-Default-API-Version', apiVersionManager.getDefaultVersion());
        
        // 如果请求没有指定版本，在响应中提示
        const hasVersionInPath = req.path.includes('/api/') && /\/(v\d+)\//.test(req.path);
        const hasVersionInHeader = req.get('API-Version') || req.get('X-API-Version');
        
        if (!hasVersionInPath && !hasVersionInHeader) {
          res.set('X-Version-Note', 'Please specify API version in URL path, e.g. /api/v1/users');
        }

        // 记录版本请求
        logger.info(`[VERSION_MIDDLEWARE] 版本化路由请求`, {
          version: requestedVersion,
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        next();
      } catch (error) {
        logger.error('[VERSION_MIDDLEWARE] 版本识别中间件错误:', error);
        return res.status(500).json({
          success: false,
          message: 'API版本处理失败',
          error: error.message
        });
      }
    };
  }

  /**
   * 从URL路径中提取版本号
   */
  extractVersionFromPath(pathname) {
    // 匹配 /api/v1/... 格式
    const match = pathname.match(/\/api\/(v\d+)\//);
    return match ? match[1] : null;
  }

  /**
   * 路由分发中间件
   * 根据版本信息分发到对应的路由处理
   */
  routeDistributionMiddleware() {
    return (req, res, next) => {
      const apiVersion = req.apiVersion;
      const originalPath = req.path;
      const fullPath = req.originalUrl;
      
      console.log(`🔍 [VERSION_DEBUG] path: ${originalPath}, originalUrl: ${fullPath}, apiVersion: ${apiVersion}`);
      
      // 不需要版本化的路由列表
      const excludedPaths = [
        '/api/notifications',
        '/api/auth',
        '/api/upload',
        '/api/db',
        '/api/health',
        '/api/smart-reminders',
        '/api/docs',
        '/api/queues',
        '/api/dashboard',
        '/api/dorms',
        '/api/member-stats',
        '/api/member-activities',
        '/api/members',
        '/api/quick-stats',
        '/api/expense-summary',
        '/api/expenses',
        '/api/payment',
        '/api/payments',
        '/api/qr-codes',
        '/api/contacts',
        '/api/categories',
        '/api/trend',
        '/api/budget',
        '/api/bills',
        '/api/virus-scan',
        '/api/cors',
        '/api/audit'
      ];
      
      // 检查是否在排除列表中
      const isExcluded = excludedPaths.some(excludedPath => originalPath.startsWith(excludedPath));
      
      // 如果路径中已经包含版本信息，则直接通过
      const hasVersionInPath = this.extractVersionFromPath(originalPath);
      if (hasVersionInPath) {
        return next();
      }
      
      // 如果在排除列表中，则直接通过，不进行重定向
      if (isExcluded) {
        return next();
      }

      // 如果没有版本信息且不是根路径，则重定向到版本化路径
      if (originalPath.startsWith('/api/') && !hasVersionInPath) {
        const newPath = originalPath.replace('/api/', `/api/${apiVersion}/`);
        
        logger.info(`[VERSION_MIDDLEWARE] 自动版本化重定向: ${originalPath} -> ${newPath}`);
        
        // 使用307状态码保持HTTP方法
        return res.redirect(307, newPath);
      }

      next();
    };
  }

  /**
   * 兼容性检查中间件
   * 检查客户端请求的功能兼容性
   */
  compatibilityCheckMiddleware() {
    return (req, res, next) => {
      const apiVersion = req.apiVersion;
      const versionInfo = apiVersionManager.getVersionInfo(apiVersion);
      
      if (!versionInfo) {
        return res.status(404).json({
          success: false,
          message: 'API版本信息不存在',
          error: 'Version info not found'
        });
      }

      // 检查版本状态
      if (versionInfo.status === 'deprecated') {
        res.set('X-Version-Deprecated', 'true');
        res.set('X-Supported-Until', versionInfo.supportedUntil || '');
        
        logger.warn(`[VERSION_MIDDLEWARE] 使用废弃版本: ${apiVersion}`, {
          supportedUntil: versionInfo.supportedUntil,
          ip: req.ip
        });
      } else if (versionInfo.status === 'planned') {
        return res.status(404).json({
          success: false,
          message: `API版本 ${apiVersion} 尚未发布`,
          error: 'Version not yet released'
        });
      }

      // 添加版本特性信息到响应头
      if (versionInfo.features && versionInfo.features.length > 0) {
        res.set('X-API-Features', versionInfo.features.join(','));
      }

      // 检查Accept头中的版本偏好
      const acceptHeader = req.get('Accept');
      if (acceptHeader && acceptHeader.includes('version=')) {
        const versionMatch = acceptHeader.match(/version=([^;,\s]+)/);
        if (versionMatch && versionMatch[1] !== apiVersion) {
          logger.info(`[VERSION_MIDDLEWARE] Accept头版本偏好与实际版本不一致`, {
            acceptVersion: versionMatch[1],
            actualVersion: apiVersion,
            ip: req.ip
          });
        }
      }

      next();
    };
  }

  /**
   * 设置管理路由
   */
  setupManagementRoutes() {
    // 获取当前版本信息
    this.router.get('/current', responseWrapper((req, res) => {
      const apiVersion = req.apiVersion;
      const versionInfo = apiVersionManager.getVersionInfo(apiVersion);
      const routeConfig = routeConfigManager.getConfig().getVersionConfig(apiVersion);
      
      res.json({
        success: true,
        message: '获取当前版本信息成功',
        data: {
          currentVersion: apiVersion,
          versionInfo,
          routeConfig: routeConfig ? {
            version: routeConfig.version,
            status: routeConfig.status,
            routeCount: routeConfig.routes ? Object.keys(routeConfig.routes).length : 0
          } : null,
          timestamp: new Date().toISOString()
        }
      });
    }));

    // 获取版本统计信息（重命名为/version-stats以避免与管理端stats路由冲突）
    this.router.get('/version-stats', responseWrapper((req, res) => {
      const versions = apiVersionManager.getSupportedVersions();
      const stats = {
        total: versions.length,
        active: versions.filter(v => apiVersionManager.getVersionInfo(v).status === 'active').length,
        deprecated: versions.filter(v => apiVersionManager.getVersionInfo(v).status === 'deprecated').length,
        planned: versions.filter(v => apiVersionManager.getVersionInfo(v).status === 'planned').length,
        default: apiVersionManager.getDefaultVersion(),
        details: versions.map(v => ({
          version: v,
          status: apiVersionManager.getVersionInfo(v).status,
          features: apiVersionManager.getVersionInfo(v).features?.length || 0
        }))
      };

      res.json({
        success: true,
        message: '获取版本统计信息成功',
        data: stats
      });
    }));

    // 版本兼容性检查
    this.router.get('/compatibility/:version', responseWrapper((req, res) => {
      const { version } = req.params;
      const { feature } = req.query;
      
      const versionInfo = apiVersionManager.getVersionInfo(version);
      if (!versionInfo) {
        return res.status(404).json({
          success: false,
          message: `版本 ${version} 不存在`
        });
      }

      let compatibility = {
        version,
        status: versionInfo.status,
        supported: apiVersionManager.isVersionSupported(version),
        features: versionInfo.features || [],
        supportedUntil: versionInfo.supportedUntil
      };

      if (feature) {
        compatibility.featureSupported = versionInfo.features?.includes(feature) || false;
      }

      res.json({
        success: true,
        message: '获取版本兼容性信息成功',
        data: compatibility
      });
    }));

    // 路由映射查询
    this.router.get('/mappings', responseWrapper((req, res) => {
      const { path: routePath } = req.query;
      let mappings = apiVersionManager.routeMappings;
      
      if (routePath) {
        const foundMappings = {};
        for (const [version, versionMappings] of Object.entries(mappings)) {
          for (const [fromPath, toPath] of Object.entries(versionMappings)) {
            if (fromPath.includes(routePath)) {
              if (!foundMappings[version]) {
                foundMappings[version] = {};
              }
              foundMappings[version][fromPath] = toPath;
            }
          }
        }
        mappings = foundMappings;
      }

      res.json({
        success: true,
        message: '获取路由映射信息成功',
        data: {
          mappings,
          totalMappings: Object.values(mappings).reduce((total, versionMappings) => {
            return total + Object.keys(versionMappings).length;
          }, 0)
        }
      });
    }));
  }

  /**
   * 获取路由器
   */
  getRouter() {
    return this.router;
  }

  /**
   * 创建版本化Express应用
   */
  createVersionedApp() {
    const app = express.Router();
    
    // 添加版本管理中间件
    app.use(this.versionRecognitionMiddleware());
    app.use(this.routeDistributionMiddleware());
    app.use(this.compatibilityCheckMiddleware());
    
    return app;
  }
}

// 创建单例实例
const versionedRoutingMiddleware = new VersionedRoutingMiddleware();

module.exports = {
  VersionedRoutingMiddleware,
  versionedRoutingMiddleware
};