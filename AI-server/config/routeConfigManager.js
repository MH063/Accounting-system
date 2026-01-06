/**
 * 版本化路由配置中心
 * 统一管理所有API版本的路由配置，支持路由的版本化管理
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { responseWrapper } = require('../middleware/response');
const versionManager = require('./versionManager');

/**
 * 路由配置结构
 */
class VersionedRouteConfig {
  constructor() {
    this.routeConfigs = new Map();
    this.initializeConfigs();
  }

  /**
   * 初始化路由配置
   */
  initializeConfigs() {
    // v1 版本路由配置
    this.routeConfigs.set('v1', {
      version: 'v1',
      status: 'active',
      default: true,
      routes: {
        auth: {
          path: '/api/v1/auth',
          middleware: ['auth', 'rateLimit'],
          controllers: {
            login: '../controllers/auth/LoginController',
            register: '../controllers/auth/RegisterController',
            profile: '../controllers/auth/ProfileController'
          }
        },
        users: {
          path: '/api/v1/users',
          middleware: ['auth', 'permissionCheck'],
          controllers: {
            list: '../controllers/users/UserListController',
            detail: '../controllers/users/UserDetailController',
            create: '../controllers/users/UserCreateController',
            update: '../controllers/users/UserUpdateController',
            delete: '../controllers/users/UserDeleteController',
            activate: '../controllers/users/UserActivateController',
            deactivate: '../controllers/users/UserDeactivateController',
            stats: '../controllers/users/UserStatsController'
          }
        },
        logs: {
          path: '/api/v1/logs',
          middleware: ['auth', 'auditLog'],
          controllers: {
            search: '../controllers/logs/LogSearchController',
            stats: '../controllers/logs/LogStatsController',
            export: '../controllers/logs/LogExportController'
          }
        },
        cache: {
          path: '/api/v1/cache',
          middleware: ['auth'],
          controllers: {
            get: '../controllers/cache/CacheGetController',
            set: '../controllers/cache/CacheSetController',
            delete: '../controllers/cache/CacheDeleteController'
          }
        },
        permissions: {
          path: '/api/v1/permissions',
          middleware: ['auth', 'adminOnly'],
          controllers: {
            list: '../controllers/permissions/PermissionListController',
            assign: '../controllers/permissions/PermissionAssignController',
            revoke: '../controllers/permissions/PermissionRevokeController'
          }
        },
        audit: {
          path: '/api/v1/audit',
          middleware: ['auth', 'adminOnly', 'auditLog'],
          controllers: {
            security: '../controllers/audit/SecurityLogController',
            user: '../controllers/audit/UserLogController',
            system: '../controllers/audit/SystemLogController'
          }
        },
        health: {
          path: '/api/v1/health',
          middleware: [],
          controllers: {
            check: '../controllers/health/HealthCheckController'
          }
        }
      }
    });

    // v2 版本路由配置（预留）
    this.routeConfigs.set('v2', {
      version: 'v2',
      status: 'planned',
      default: false,
      routes: {
        auth: {
          path: '/api/v2/auth',
          middleware: ['auth', 'enhancedRateLimit', 'behaviorAnalysis'],
          controllers: {
            login: '../controllers/v2/auth/LoginController',
            register: '../controllers/v2/auth/RegisterController',
            profile: '../controllers/v2/auth/ProfileController',
            oauth2: '../controllers/v2/auth/OAuth2Controller',
            mfa: '../controllers/v2/auth/MFAController'
          }
        },
        users: {
          path: '/api/v2/users',
          middleware: ['auth', 'permissionCheck', 'batchOperations'],
          controllers: {
            list: '../controllers/v2/users/UserListController',
            detail: '../controllers/v2/users/UserDetailController',
            create: '../controllers/v2/users/UserCreateController',
            update: '../controllers/v2/users/UserUpdateController',
            delete: '../controllers/v2/users/UserDeleteController',
            batch: '../controllers/v2/users/UserBatchController',
            search: '../controllers/v2/users/UserSearchController',
            activate: '../controllers/v2/users/UserActivateController',
            deactivate: '../controllers/v2/users/UserDeactivateController',
            stats: '../controllers/v2/users/UserStatsController'
          }
        },
        logs: {
          path: '/api/v2/logs',
          middleware: ['auth', 'enhancedAuditLog'],
          controllers: {
            search: '../controllers/v2/logs/EnhancedLogSearchController',
            stats: '../controllers/v2/logs/EnhancedLogStatsController',
            export: '../controllers/v2/logs/EnhancedLogExportController',
            realtime: '../controllers/v2/logs/RealtimeLogController'
          }
        },
        cache: {
          path: '/api/v2/cache',
          middleware: ['auth', 'distributedCache'],
          controllers: {
            get: '../controllers/v2/cache/DistributedCacheGetController',
            set: '../controllers/v2/cache/DistributedCacheSetController',
            delete: '../controllers/v2/cache/DistributedCacheDeleteController',
            batch: '../controllers/v2/cache/BatchCacheController'
          }
        },
        permissions: {
          path: '/api/v2/permissions',
          middleware: ['auth', 'adminOnly', 'granularPermissionCheck'],
          controllers: {
            list: '../controllers/v2/permissions/GranularPermissionListController',
            assign: '../controllers/v2/permissions/GranularPermissionAssignController',
            revoke: '../controllers/v2/permissions/GranularPermissionRevokeController',
            roles: '../controllers/v2/permissions/RoleManagementController'
          }
        },
        audit: {
          path: '/api/v2/audit',
          middleware: ['auth', 'adminOnly', 'enhancedAuditLog'],
          controllers: {
            security: '../controllers/v2/audit/EnhancedSecurityLogController',
            user: '../controllers/v2/audit/EnhancedUserLogController',
            system: '../controllers/v2/audit/EnhancedSystemLogController',
            analytics: '../controllers/v2/audit/AnalyticsController',
            reports: '../controllers/v2/audit/ReportController'
          }
        },
        health: {
          path: '/api/v2/health',
          middleware: ['comprehensiveHealthCheck'],
          controllers: {
            check: '../controllers/v2/health/ComprehensiveHealthCheckController',
            metrics: '../controllers/v2/health/MetricsController'
          }
        }
      }
    });
  }

  /**
   * 获取指定版本的路由配置
   */
  getVersionConfig(version) {
    return this.routeConfigs.get(version);
  }

  /**
   * 获取所有版本配置
   */
  getAllVersions() {
    return Array.from(this.routeConfigs.keys());
  }

  /**
   * 获取活跃版本的路由配置
   */
  getActiveVersions() {
    const activeVersions = [];
    for (const [version, config] of this.routeConfigs) {
      if (config.status === 'active') {
        activeVersions.push(version);
      }
    }
    return activeVersions;
  }

  /**
   * 获取默认版本
   */
  getDefaultVersion() {
    for (const [version, config] of this.routeConfigs) {
      if (config.default === true && config.status === 'active') {
        return version;
      }
    }
    return null;
  }

  /**
   * 添加新版本配置
   */
  addVersionConfig(version, config) {
    this.routeConfigs.set(version, {
      version,
      status: 'active',
      default: false,
      ...config
    });
    
    logger.info(`[ROUTER_CONFIG] 添加新版本配置: ${version}`);
  }

  /**
   * 更新版本配置
   */
  updateVersionConfig(version, config) {
    const existingConfig = this.routeConfigs.get(version);
    if (existingConfig) {
      this.routeConfigs.set(version, {
        ...existingConfig,
        ...config
      });
      
      logger.info(`[ROUTER_CONFIG] 更新版本配置: ${version}`, config);
    }
  }

  /**
   * 删除版本配置
   */
  removeVersionConfig(version) {
    if (this.routeConfigs.has(version)) {
      this.routeConfigs.delete(version);
      logger.info(`[ROUTER_CONFIG] 删除版本配置: ${version}`);
    }
  }

  /**
   * 验证路由配置
   */
  validateVersionConfig(version) {
    const config = this.getVersionConfig(version);
    if (!config) {
      return { valid: false, errors: [`版本 ${version} 配置不存在`] };
    }

    const errors = [];
    const warnings = [];

    // 检查必需字段
    if (!config.routes || typeof config.routes !== 'object') {
      errors.push('路由配置缺少或格式不正确');
    }

    // 检查路由配置
    if (config.routes) {
      for (const [routeName, routeConfig] of Object.entries(config.routes)) {
        if (!routeConfig.path) {
          errors.push(`路由 ${routeName} 缺少路径配置`);
        }
        if (!routeConfig.controllers || Object.keys(routeConfig.controllers).length === 0) {
          warnings.push(`路由 ${routeName} 没有控制器配置`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 生成路由配置报告
   */
  generateConfigReport() {
    const report = {
      totalVersions: this.routeConfigs.size,
      versions: {},
      summary: {
        totalRoutes: 0,
        activeVersions: 0,
        defaultVersion: this.getDefaultVersion()
      }
    };

    for (const [version, config] of this.routeConfigs) {
      const routeCount = config.routes ? Object.keys(config.routes).length : 0;
      report.versions[version] = {
        status: config.status,
        default: config.default,
        routeCount,
        routes: Object.keys(config.routes || {})
      };
      report.summary.totalRoutes += routeCount;
      if (config.status === 'active') {
        report.summary.activeVersions++;
      }
    }

    return report;
  }

  /**
   * 导出路由配置为JSON
   */
  exportConfig(format = 'json') {
    const serverVersion = versionManager.getServerVersion();
    const config = {
      versions: Object.fromEntries(this.routeConfigs),
      exportedAt: new Date().toISOString(),
      version: serverVersion.version
    };

    if (format === 'yaml') {
      // 简单的YAML转换（实际项目中可以使用js-yaml库）
      return '# 路由配置导出\n' + JSON.stringify(config, null, 2).replace(/"/g, '').replace(/,\n/g, '\n');
    }

    return config;
  }
}

/**
 * 路由配置管理器
 */
class RouteConfigManager {
  constructor() {
    this.config = new VersionedRouteConfig();
    this.router = express.Router();
    this.setupManagementRoutes();
  }

  /**
   * 设置管理路由
   */
  setupManagementRoutes() {
    // 获取所有版本配置
    this.router.get('/configs', responseWrapper((req, res) => {
      const report = this.config.generateConfigReport();
      
      res.json({
        success: true,
        message: '获取路由配置成功',
        data: report
      });
    }));

    // 获取特定版本配置
    this.router.get('/config/:version', responseWrapper((req, res) => {
      const { version } = req.params;
      const config = this.config.getVersionConfig(version);
      
      if (!config) {
        return res.status(404).json({
          success: false,
          message: `版本 ${version} 的配置不存在`
        });
      }

      res.json({
        success: true,
        message: '获取版本配置成功',
        data: {
          version,
          config,
          validation: this.config.validateVersionConfig(version)
        }
      });
    }));

    // 验证版本配置
    this.router.post('/validate/:version', responseWrapper((req, res) => {
      const { version } = req.params;
      const validation = this.config.validateVersionConfig(version);
      
      res.json({
        success: true,
        message: '配置验证完成',
        data: validation
      });
    }));

    // 导出配置
    this.router.get('/export', responseWrapper((req, res) => {
      const { format = 'json' } = req.query;
      const exportedConfig = this.config.exportConfig(format);
      
      res.json({
        success: true,
        message: '配置导出成功',
        data: exportedConfig
      });
    }));

    // 更新版本配置
    this.router.put('/config/:version', responseWrapper((req, res) => {
      const { version } = req.params;
      const { config: newConfig } = req.body;
      
      if (!newConfig) {
        return res.status(400).json({
          success: false,
          message: '缺少配置数据'
        });
      }

      this.config.updateVersionConfig(version, newConfig);
      
      res.json({
        success: true,
        message: `版本 ${version} 配置更新成功`
      });
    }));

    // 添加新版本配置
    this.router.post('/config', responseWrapper((req, res) => {
      const { version, config } = req.body;
      
      if (!version || !config) {
        return res.status(400).json({
          success: false,
          message: '缺少版本号或配置数据'
        });
      }

      this.config.addVersionConfig(version, config);
      
      res.json({
        success: true,
        message: `版本 ${version} 配置添加成功`
      });
    }));

    // 路由配置健康检查
    this.router.get('/health', responseWrapper((req, res) => {
      const activeVersions = this.config.getActiveVersions();
      const defaultVersion = this.config.getDefaultVersion();
      
      const issues = [];
      
      if (activeVersions.length === 0) {
        issues.push('没有活跃的版本配置');
      }
      
      if (!defaultVersion) {
        issues.push('没有设置默认版本');
      }
      
      // 验证所有活跃版本
      for (const version of activeVersions) {
        const validation = this.config.validateVersionConfig(version);
        if (!validation.valid) {
          issues.push(`版本 ${version} 配置验证失败: ${validation.errors.join(', ')}`);
        }
      }

      res.json({
        success: true,
        message: '路由配置健康检查完成',
        data: {
          status: issues.length === 0 ? 'healthy' : 'issues',
          issues,
          activeVersions,
          defaultVersion,
          timestamp: new Date().toISOString()
        }
      });
    }));
  }

  /**
   * 获取配置管理器
   */
  getConfig() {
    return this.config;
  }

  /**
   * 获取管理路由器
   */
  getRouter() {
    return this.router;
  }
}

// 创建单例实例
const routeConfigManager = new RouteConfigManager();

module.exports = {
  VersionedRouteConfig,
  RouteConfigManager,
  routeConfigManager
};