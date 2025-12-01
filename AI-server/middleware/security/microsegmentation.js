/**
 * 微隔离实现
 * 实现网络和应用层面的微隔离
 */

const logger = require('../../config/logger');

/**
 * 网络微隔离中间件
 * 限制不同服务间的通信
 */
class NetworkMicrosegmentation {
  constructor(options = {}) {
    this.allowedConnections = options.allowedConnections || [];
    this.defaultPolicy = options.defaultPolicy || 'deny';
    this.logViolations = options.logViolations !== false;
  }

  /**
   * 验证服务间连接是否被允许
   * @param {string} sourceService - 源服务标识
   * @param {string} targetService - 目标服务标识
   * @param {string} protocol - 协议类型
   * @returns {boolean} 是否允许连接
   */
  isConnectionAllowed(sourceService, targetService, protocol = 'http') {
    // 在开发环境中放宽限制
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      // 在开发环境中允许本地访问
      if (sourceService === '[TRUSTED_SOURCE]' || sourceService === '[TRUSTED_IP]' || sourceService === 'unknown') {
        return true;
      }
    }

    // 检查是否在允许的连接列表中
    const isAllowed = this.allowedConnections.some(conn => {
      return (
        (conn.source === sourceService || conn.source === '*') &&
        (conn.target === targetService || conn.target === '*') &&
        (conn.protocol === protocol || conn.protocol === '*')
      );
    });

    // 根据默认策略确定最终结果
    const result = this.defaultPolicy === 'allow' ? true : isAllowed;
    
    if (!result && this.logViolations) {
      logger.security(null, '微隔离违规', {
        sourceService,
        targetService,
        protocol,
        timestamp: new Date().toISOString()
      });
    }

    return result;
  }

  /**
   * Express中间件函数
   */
  middleware() {
    return (req, res, next) => {
      // 获取服务标识（可以从请求头或其他方式获取）
      const sourceService = req.headers['x-service-name'] || 'unknown';
      const targetService = process.env.SERVICE_NAME || 'api-server';
      const protocol = req.protocol;

      // 验证连接是否被允许
      if (this.isConnectionAllowed(sourceService, targetService, protocol)) {
        next();
      } else {
        logger.security(req, '微隔离拦截', {
          sourceService,
          targetService,
          protocol,
          reason: '连接未被允许'
        });
        
        res.status(403).json({
          success: false,
          message: '服务间连接被微隔离策略拦截'
        });
      }
    };
  }
}

/**
 * 应用微隔离中间件
 * 限制应用内不同模块间的访问
 */
class ApplicationMicrosegmentation {
  constructor(options = {}) {
    this.modulePermissions = options.modulePermissions || {};
    this.defaultPolicy = options.defaultPolicy || 'deny';
    this.logViolations = options.logViolations !== false;
  }

  /**
   * 验证模块访问权限
   * @param {string} userRole - 用户角色
   * @param {string} moduleName - 模块名称
   * @param {string} action - 操作类型
   * @returns {boolean} 是否允许访问
   */
  isModuleAccessAllowed(userRole, moduleName, action = 'read') {
    // 获取模块的权限配置
    const moduleConfig = this.modulePermissions[moduleName];
    
    if (!moduleConfig) {
      // 如果模块没有配置，默认根据策略处理
      const result = this.defaultPolicy === 'allow';
      if (!result && this.logViolations) {
        logger.security(null, '模块访问违规', {
          userRole,
          moduleName,
          action,
          reason: '模块未配置权限'
        });
      }
      return result;
    }

    // 检查角色是否有对应权限
    const rolePermissions = moduleConfig.roles[userRole];
    if (!rolePermissions) {
      const result = moduleConfig.defaultPolicy === 'allow';
      if (!result && this.logViolations) {
        logger.security(null, '模块访问违规', {
          userRole,
          moduleName,
          action,
          reason: '角色无权限'
        });
      }
      return result;
    }

    // 检查是否允许该操作
    const isAllowed = rolePermissions.includes(action) || 
                     rolePermissions.includes('*');
    
    if (!isAllowed && this.logViolations) {
      logger.security(null, '模块访问违规', {
        userRole,
        moduleName,
        action,
        reason: '操作未被允许'
      });
    }

    return isAllowed;
  }

  /**
   * Express中间件函数
   * @param {string} moduleName - 模块名称
   * @param {string} action - 操作类型
   */
  middleware(moduleName, action = 'read') {
    return (req, res, next) => {
      // 获取用户角色
      const userRole = req.user?.role || 'guest';
      
      // 验证访问权限
      if (this.isModuleAccessAllowed(userRole, moduleName, action)) {
        next();
      } else {
        logger.security(req, '应用微隔离拦截', {
          userRole,
          moduleName,
          action,
          reason: '访问被拒绝'
        });
        
        res.status(403).json({
          success: false,
          message: '模块访问被应用微隔离策略拦截'
        });
      }
    };
  }
}

/**
 * 数据微隔离
 * 限制对不同数据资源的访问
 */
class DataMicrosegmentation {
  constructor(options = {}) {
    this.dataPermissions = options.dataPermissions || {};
    this.defaultPolicy = options.defaultPolicy || 'deny';
    this.sensitiveDataPatterns = options.sensitiveDataPatterns || [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /ssn/i,
      /credit.*card/i
    ];
  }

  /**
   * 验证数据访问权限
   * @param {string} userRole - 用户角色
   * @param {string} resource - 数据资源标识
   * @param {string} action - 操作类型
   * @returns {boolean} 是否允许访问
   */
  isDataAccessAllowed(userRole, resource, action = 'read') {
    // 检查是否为敏感数据
    const isSensitive = this.sensitiveDataPatterns.some(pattern => 
      pattern.test(resource)
    );

    // 如果是敏感数据，应用更严格的策略
    if (isSensitive) {
      const sensitiveConfig = this.dataPermissions['sensitive'] || 
                             this.dataPermissions['*'];
      
      if (sensitiveConfig) {
        const rolePermissions = sensitiveConfig.roles[userRole];
        return rolePermissions && 
               (rolePermissions.includes(action) || rolePermissions.includes('*'));
      }
      
      // 默认拒绝敏感数据访问
      return false;
    }

    // 获取资源的权限配置
    const resourceConfig = this.dataPermissions[resource] || 
                          this.dataPermissions['*'];
    
    if (!resourceConfig) {
      return this.defaultPolicy === 'allow';
    }

    // 检查角色权限
    const rolePermissions = resourceConfig.roles[userRole];
    if (!rolePermissions) {
      return resourceConfig.defaultPolicy === 'allow';
    }

    return rolePermissions.includes(action) || rolePermissions.includes('*');
  }

  /**
   * 过滤敏感数据
   * @param {Object} data - 要过滤的数据
   * @param {string} userRole - 用户角色
   * @returns {Object} 过滤后的数据
   */
  filterSensitiveData(data, userRole = 'guest') {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const filteredData = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // 检查键名是否为敏感字段
      const isSensitive = this.sensitiveDataPatterns.some(pattern => 
        pattern.test(key)
      );
      
      if (isSensitive) {
        // 检查用户是否有访问该敏感数据的权限
        if (this.isDataAccessAllowed(userRole, key, 'read')) {
          filteredData[key] = value;
        } else {
          // 隐藏敏感数据
          filteredData[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        filteredData[key] = this.filterSensitiveData(value, userRole);
      } else {
        filteredData[key] = value;
      }
    }
    
    return filteredData;
  }
}

module.exports = {
  NetworkMicrosegmentation,
  ApplicationMicrosegmentation,
  DataMicrosegmentation
};