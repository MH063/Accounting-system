/**
 * API版本管理器
 * 提供统一的API版本管理功能，支持多版本并存和向后兼容
 */

const express = require('express');
const logger = require('./logger');
const { responseWrapper } = require('../middleware/response');

/**
 * API版本配置
 */
const API_VERSIONS = {
  'v1': {
    status: 'active', // active, deprecated, removed
    supportedUntil: null, // 支持到什么时候
    default: true, // 是否为默认版本
    description: 'API第一版本，当前活跃版本',
    features: ['auth', 'users', 'logs', 'cache', 'permissions', 'audit']
  },
  'v2': {
    status: 'planned', // active, deprecated, removed, planned
    supportedUntil: null,
    default: false,
    description: 'API第二版本，预计新增功能增强',
    features: ['auth', 'users', 'logs', 'cache', 'permissions', 'audit', 'enhanced_search', 'batch_operations']
  }
};

/**
 * 路由路径映射
 * 旧版本路径 -> 新版本路径的映射关系
 */
const ROUTE_MAPPINGS = {
  'v1': {
    // 如果v1需要重定向到其他版本
  },
  'v2': {
    // v2的路径映射
    '/api/legacy/users': '/api/v2/users',
    '/api/legacy/auth': '/api/v2/auth'
  }
};

/**
 * API版本管理器类
 */
class ApiVersionManager {
  constructor() {
    this.versions = API_VERSIONS;
    this.routeMappings = ROUTE_MAPPINGS;
    this.router = express.Router();
    this.setupVersionRoutes();
  }

  /**
   * 获取所有支持的API版本
   */
  getSupportedVersions() {
    return Object.keys(this.versions).filter(version => 
      this.versions[version].status !== 'removed'
    );
  }

  /**
   * 获取默认API版本
   */
  getDefaultVersion() {
    const activeVersions = Object.keys(this.versions).filter(version => 
      this.versions[version].status === 'active'
    );
    const defaultVersion = activeVersions.find(version => 
      this.versions[version].default === true
    );
    return defaultVersion || activeVersions[0];
  }

  /**
   * 检查版本是否支持
   */
  isVersionSupported(version) {
    return this.getSupportedVersions().includes(version) && 
           this.versions[version].status !== 'removed';
  }

  /**
   * 获取版本信息
   */
  getVersionInfo(version) {
    return this.versions[version] || null;
  }

  /**
   * 设置版本路由
   */
  setupVersionRoutes() {
    // 获取版本列表
    this.router.get('/versions', responseWrapper((req, res) => {
      const versionInfo = this.getSupportedVersions().map(version => ({
        version,
        status: this.versions[version].status,
        default: this.versions[version].default,
        description: this.versions[version].description,
        features: this.versions[version].features,
        supportedUntil: this.versions[version].supportedUntil
      }));

      res.json({
        success: true,
        message: '获取API版本信息成功',
        data: {
          versions: versionInfo,
          defaultVersion: this.getDefaultVersion(),
          currentVersion: this.getDefaultVersion(),
          totalVersions: versionInfo.length
        }
      });
    }));

    // 获取特定版本信息
    this.router.get('/version/:version', responseWrapper((req, res) => {
      const { version } = req.params;
      const versionInfo = this.getVersionInfo(version);

      if (!versionInfo) {
        return res.status(404).json({
          success: false,
          message: '指定的API版本不存在',
          error: `Version ${version} not found`
        });
      }

      res.json({
        success: true,
        message: '获取版本信息成功',
        data: {
          version,
          info: versionInfo
        }
      });
    }));

    // 获取路由映射信息
    this.router.get('/mappings', responseWrapper((req, res) => {
      res.json({
        success: true,
        message: '获取路由映射信息成功',
        data: {
          mappings: this.routeMappings,
          versionCount: Object.keys(this.routeMappings).length
        }
      });
    }));

    // 健康检查
    this.router.get('/health', responseWrapper((req, res) => {
      res.json({
        success: true,
        message: 'API版本管理器运行正常',
        data: {
          status: 'healthy',
          supportedVersions: this.getSupportedVersions(),
          defaultVersion: this.getDefaultVersion(),
          timestamp: new Date().toISOString()
        }
      });
    }));
  }

  /**
   * 创建版本化路由中间件
   */
  createVersionMiddleware() {
    return (req, res, next) => {
      try {
        // 优先级：Header > Query > 默认版本
        const headerVersion = req.get('API-Version') || req.get('X-API-Version');
        const queryVersion = req.query.version;
        const cookieVersion = req.cookies.api_version;
        
        // 确定请求的版本
        let requestedVersion = headerVersion || queryVersion || cookieVersion || this.getDefaultVersion();
        
        // 清理版本号（移除v前缀）
        requestedVersion = requestedVersion.replace(/^v/, '');
        
        // 验证版本
        if (!this.isVersionSupported(requestedVersion)) {
          logger.warn(`[API_VERSION] 不支持的API版本请求: ${requestedVersion}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            originalUrl: req.originalUrl
          });

          // 返回支持的版本信息
          return res.status(400).json({
            success: false,
            message: `API版本 ${requestedVersion} 不受支持`,
            error: 'Unsupported API version',
            supportedVersions: this.getSupportedVersions(),
            defaultVersion: this.getDefaultVersion(),
            versionInfo: this.getSupportedVersions().map(v => ({
              version: v,
              status: this.versions[v].status,
              description: this.versions[v].description
            }))
          });
        }

        // 将版本信息附加到请求对象
        req.apiVersion = requestedVersion;
        req.requestedVersion = `v${requestedVersion}`;
        
        // 设置响应头中的版本信息
        res.set('API-Version', requestedVersion);
        res.set('X-Supported-API-Versions', this.getSupportedVersions().join(','));
        res.set('X-Default-API-Version', this.getDefaultVersion());

        // 记录版本请求日志
        logger.info(`[API_VERSION] API版本请求: ${requestedVersion}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        next();
      } catch (error) {
        logger.error('[API_VERSION] 版本中间件处理错误:', error);
        return res.status(500).json({
          success: false,
          message: 'API版本处理失败',
          error: error.message
        });
      }
    };
  }

  /**
   * 创建版本重定向中间件
   */
  createVersionRedirectMiddleware() {
    return (req, res, next) => {
      const path = req.path;
      
      // 检查是否需要版本重定向
      for (const [fromVersion, mappings] of Object.entries(this.routeMappings)) {
        for (const [fromPath, toPath] of Object.entries(mappings)) {
          if (path.startsWith(fromPath)) {
            const newPath = path.replace(fromPath, toPath);
            const targetVersion = toPath.split('/')[2]; // 提取版本号 v1, v2
            
            logger.info(`[API_VERSION] 版本重定向: ${path} -> ${newPath}`, {
              fromVersion,
              toVersion: targetVersion,
              ip: req.ip
            });

            return res.redirect(307, newPath);
          }
        }
      }
      
      next();
    };
  }

  /**
   * 获取版本路由器
   */
  getRouter() {
    return this.router;
  }

  /**
   * 添加新版本
   */
  addVersion(version, config) {
    this.versions[version] = {
      status: 'active',
      default: false,
      ...config
    };
    
    logger.info(`[API_VERSION] 添加新版本: ${version}`, config);
  }

  /**
   * 废弃版本
   */
  deprecateVersion(version, supportedUntil = null) {
    if (this.versions[version]) {
      this.versions[version].status = 'deprecated';
      this.versions[version].supportedUntil = supportedUntil;
      
      logger.warn(`[API_VERSION] 废弃版本: ${version}`, { supportedUntil });
    }
  }

  /**
   * 移除版本
   */
  removeVersion(version) {
    if (this.versions[version]) {
      this.versions[version].status = 'removed';
      
      logger.error(`[API_VERSION] 移除版本: ${version}`);
    }
  }
}

// 创建单例实例
const apiVersionManager = new ApiVersionManager();

module.exports = {
  ApiVersionManager,
  apiVersionManager
};