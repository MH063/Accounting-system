/**
 * 增强的访问控制中间件
 * 提供细粒度的权限验证和访问控制
 */

const logger = require('../config/logger');

// 权限层级定义
const PERMISSION_LEVELS = {
  GUEST: 0,
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

// 资源权限映射
const RESOURCE_PERMISSIONS = {
  // 用户相关
  'users.read': PERMISSION_LEVELS.USER,
  'users.write': PERMISSION_LEVELS.ADMIN,
  'users.delete': PERMISSION_LEVELS.SUPER_ADMIN,
  
  // 数据库相关
  'database.read': PERMISSION_LEVELS.USER,
  'database.write': PERMISSION_LEVELS.ADMIN,
  'database.delete': PERMISSION_LEVELS.SUPER_ADMIN,
  'database.structure': PERMISSION_LEVELS.SUPER_ADMIN,
  
  // 文件相关
  'files.upload': PERMISSION_LEVELS.USER,
  'files.delete': PERMISSION_LEVELS.MODERATOR,
  
  // 系统相关
  'system.config': PERMISSION_LEVELS.SUPER_ADMIN,
  'system.logs': PERMISSION_LEVELS.ADMIN,
  'system.monitor': PERMISSION_LEVELS.MODERATOR
};

/**
 * 检查用户权限等级
 * @param {Object} user - 用户对象
 * @returns {number} 权限等级
 */
const getUserPermissionLevel = (user) => {
  if (!user || !user.role) {
    return PERMISSION_LEVELS.GUEST;
  }

  const role = user.role.toLowerCase();
  
  switch (role) {
    case 'superadmin':
      return PERMISSION_LEVELS.SUPER_ADMIN;
    case 'admin':
      return PERMISSION_LEVELS.ADMIN;
    case 'moderator':
      return PERMISSION_LEVELS.MODERATOR;
    case 'user':
      return PERMISSION_LEVELS.USER;
    default:
      return PERMISSION_LEVELS.GUEST;
  }
};

/**
 * 检查用户是否具有指定权限
 * @param {Object} user - 用户对象
 * @param {string} permission - 权限标识
 * @returns {boolean} 是否具有权限
 */
const hasPermission = (user, permission) => {
  // 获取用户权限等级
  const userLevel = getUserPermissionLevel(user);
  
  // 获取所需权限等级
  const requiredLevel = RESOURCE_PERMISSIONS[permission] || PERMISSION_LEVELS.SUPER_ADMIN;
  
  // 检查权限是否足够
  return userLevel >= requiredLevel;
};

/**
 * 增强的身份验证中间件
 * @param {Object} options - 验证选项
 * @returns {Function} Express中间件
 */
const enhancedAuth = (options = {}) => {
  const { 
    requireAuth = true, 
    minLevel = PERMISSION_LEVELS.USER,
    permissions = [],
    allowGuest = false
  } = options;

  return (req, res, next) => {
    try {
      // 检查是否需要认证
      if (requireAuth && !req.user) {
        logger.security(req, '增强认证失败', {
          reason: '需要身份认证',
          requiredAuth: requireAuth,
          timestamp: new Date().toISOString()
        });

        return res.status(401).json({
          success: false,
          message: '需要身份认证'
        });
      }

      // 如果允许访客访问且用户未认证，直接通过
      if (allowGuest && !req.user) {
        req.user = { role: 'guest', permissionLevel: PERMISSION_LEVELS.GUEST };
        return next();
      }

      // 获取用户权限等级
      const userLevel = getUserPermissionLevel(req.user);
      
      // 检查最小权限等级
      if (userLevel < minLevel) {
        logger.security(req, '权限等级不足', {
          userId: req.user?.id,
          userRole: req.user?.role,
          userLevel: userLevel,
          requiredLevel: minLevel,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      // 检查特定权限
      if (permissions.length > 0) {
        const missingPermissions = permissions.filter(permission => 
          !hasPermission(req.user, permission)
        );

        if (missingPermissions.length > 0) {
          logger.security(req, '缺少必要权限', {
            userId: req.user?.id,
            userRole: req.user?.role,
            missingPermissions: missingPermissions,
            timestamp: new Date().toISOString()
          });

          return res.status(403).json({
            success: false,
            message: `缺少必要权限: ${missingPermissions.join(', ')}`
          });
        }
      }

      // 添加权限信息到请求对象
      req.user.permissionLevel = userLevel;
      req.user.hasPermission = (permission) => hasPermission(req.user, permission);
      
      // 记录用户权限信息
      logger.security(req, '增强认证通过', {
        userId: req.user?.id,
        userRole: req.user?.role,
        userLevel: userLevel,
        permissions: Object.keys(RESOURCE_PERMISSIONS).filter(p => hasPermission(req.user, p)),
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      logger.error('[ACCESS_CONTROL] 认证检查失败', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method
      });

      return res.status(500).json({
        success: false,
        message: '认证检查失败'
      });
    }
  };
};

/**
 * 资源访问控制中间件
 * @param {string} resource - 资源标识
 * @param {string} action - 操作类型 (read/write/delete)
 * @returns {Function} Express中间件
 */
const resourceAccessControl = (resource, action) => {
  return (req, res, next) => {
    // 构造权限标识
    const permission = `${resource}.${action}`;

    // 检查用户是否具有该权限
    if (!hasPermission(req.user, permission)) {
      logger.security(req, '资源访问被拒绝', {
        userId: req.user?.id,
        userRole: req.user?.role,
        resource: resource,
        action: action,
        permission: permission,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        success: false,
        message: '访问被拒绝'
      });
    }

    logger.security(req, '资源访问授权', {
      userId: req.user?.id,
      userRole: req.user?.role,
      resource: resource,
      action: action,
      permission: permission,
      timestamp: new Date().toISOString()
    });

    next();
  };
};

/**
 * IP地址访问控制中间件
 * @param {Array} allowedIPs - 允许的IP地址列表
 * @returns {Function} Express中间件
 */
const ipAddressControl = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // 如果没有指定允许的IP，则允许所有访问
    if (allowedIPs.length === 0) {
      return next();
    }

    // 检查客户端IP是否在允许列表中
    if (!allowedIPs.includes(clientIP)) {
      logger.security(req, 'IP地址访问被拒绝', {
        clientIP: clientIP,
        allowedIPs: allowedIPs,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        success: false,
        message: '访问被拒绝'
      });
    }

    logger.security(req, 'IP地址访问授权', {
      clientIP: clientIP,
      timestamp: new Date().toISOString()
    });

    next();
  };
};

/**
 * 时间段访问控制中间件
 * @param {Object} options - 时间控制选项
 * @returns {Function} Express中间件
 */
const timeBasedAccessControl = (options = {}) => {
  const { 
    startTime, 
    endTime, 
    weekdays = [1, 2, 3, 4, 5, 6, 7], // 1=周一, 7=周日
    timezone = 'Asia/Shanghai'
  } = options;

  return (req, res, next) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay() || 7; // 周日为7

    // 检查星期几
    if (!weekdays.includes(currentDay)) {
      logger.security(req, '时间段访问控制 - 星期限制', {
        currentDay: currentDay,
        allowedWeekdays: weekdays,
        timestamp: now.toISOString()
      });

      return res.status(403).json({
        success: false,
        message: '当前时间不允许访问'
      });
    }

    // 检查时间范围
    if (startTime !== undefined && endTime !== undefined) {
      const currentTime = currentHour * 100 + now.getMinutes();
      const startMinutes = parseInt(startTime.split(':')[0]) * 100 + parseInt(startTime.split(':')[1]);
      const endMinutes = parseInt(endTime.split(':')[0]) * 100 + parseInt(endTime.split(':')[1]);

      if (currentTime < startMinutes || currentTime > endMinutes) {
        logger.security(req, '时间段访问控制 - 时间限制', {
          currentTime: currentTime,
          startTime: startMinutes,
          endTime: endMinutes,
          timestamp: now.toISOString()
        });

        return res.status(403).json({
          success: false,
          message: '当前时间不允许访问'
        });
      }
    }

    next();
  };
};

/**
 * 速率限制访问控制中间件
 * @param {Object} options - 速率限制选项
 * @returns {Function} Express中间件
 */
const rateLimitAccessControl = (options = {}) => {
  const { maxRequests = 100, windowMs = 60000 } = options; // 默认每分钟100次请求
  
  // 存储访问记录
  const accessRecords = new Map();

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();
    const windowStart = currentTime - windowMs;

    // 获取客户端的访问记录
    let records = accessRecords.get(clientIP) || [];
    
    // 清理过期记录
    records = records.filter(timestamp => timestamp > windowStart);
    
    // 检查是否超出限制
    if (records.length >= maxRequests) {
      logger.security(req, '速率限制访问控制 - 超出限制', {
        clientIP: clientIP,
        requestCount: records.length,
        maxRequests: maxRequests,
        windowMs: windowMs,
        timestamp: new Date().toISOString()
      });

      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }

    // 记录当前请求
    records.push(currentTime);
    accessRecords.set(clientIP, records);

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - records.length);
    res.setHeader('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());

    next();
  };
};

module.exports = {
  enhancedAuth,
  resourceAccessControl,
  ipAddressControl,
  timeBasedAccessControl,
  rateLimitAccessControl,
  hasPermission,
  getUserPermissionLevel,
  PERMISSION_LEVELS,
  RESOURCE_PERMISSIONS
};