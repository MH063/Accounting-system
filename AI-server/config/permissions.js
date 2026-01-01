/**
 * 权限控制系统
 * 基于角色的访问控制 (RBAC) 实现
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

// 权限常量
const PERMISSIONS = {
  // 用户管理权限
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LIST: 'user:list',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',
  
  // 角色管理权限
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_LIST: 'role:list',
  
  // 数据权限
  DATA_READ: 'data:read',
  DATA_WRITE: 'data:write',
  DATA_DELETE: 'data:delete',
  DATA_EXPORT: 'data:export',
  DATA_IMPORT: 'data:import',
  
  // 报表权限
  REPORT_READ: 'report:read',
  REPORT_CREATE: 'report:create',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete',
  REPORT_EXPORT: 'report:export',
  
  // 系统权限
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_LOG: 'system:log',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore',
  
  // 财务权限
  FINANCIAL_READ: 'financial:read',
  FINANCIAL_WRITE: 'financial:write',
  FINANCIAL_APPROVE: 'financial:approve',
  FINANCIAL_AUDIT: 'financial:audit',
  
  // 管理权限
  ADMIN_FULL: 'admin:full',
  ADMIN_USER: 'admin:user',
  ADMIN_SYSTEM: 'admin:system'
};

// 角色定义
const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: '超级管理员',
    description: '拥有系统所有权限',
    permissions: Object.values(PERMISSIONS),
    level: 100
  },
  ADMIN: {
    id: 'admin',
    name: '管理员',
    description: '拥有大部分管理权限',
    permissions: [
      PERMISSIONS.USER_CREATE, PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_LIST, PERMISSIONS.USER_ACTIVATE, PERMISSIONS.USER_DEACTIVATE,
      PERMISSIONS.ROLE_READ, PERMISSIONS.ROLE_LIST,
      PERMISSIONS.DATA_READ, PERMISSIONS.DATA_WRITE, PERMISSIONS.DATA_DELETE, PERMISSIONS.DATA_EXPORT,
      PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_CREATE, PERMISSIONS.REPORT_UPDATE,
      PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_WRITE,
      PERMISSIONS.ADMIN_USER, PERMISSIONS.ADMIN_SYSTEM
    ],
    level: 80
  },
  MANAGER: {
    id: 'manager',
    name: '经理',
    description: '拥有部门管理权限',
    permissions: [
      PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_LIST,
      PERMISSIONS.USER_ACTIVATE, PERMISSIONS.USER_DEACTIVATE,
      PERMISSIONS.DATA_READ, PERMISSIONS.DATA_WRITE,
      PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_CREATE, PERMISSIONS.REPORT_UPDATE,
      PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_WRITE, PERMISSIONS.FINANCIAL_APPROVE
    ],
    level: 60
  },
  ACCOUNTANT: {
    id: 'accountant',
    name: '会计师',
    description: '拥有财务相关权限',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.DATA_READ, PERMISSIONS.DATA_WRITE,
      PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_WRITE
    ],
    level: 40
  },
  AUDITOR: {
    id: 'auditor',
    name: '审计员',
    description: '拥有审计和查看权限',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.DATA_READ, PERMISSIONS.DATA_EXPORT,
      PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.FINANCIAL_READ, PERMISSIONS.FINANCIAL_AUDIT,
      PERMISSIONS.SYSTEM_AUDIT, PERMISSIONS.SYSTEM_LOG
    ],
    level: 35
  },
  EMPLOYEE: {
    id: 'employee',
    name: '员工',
    description: '拥有基本的查看和编辑权限',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.DATA_READ, PERMISSIONS.DATA_WRITE,
      PERMISSIONS.REPORT_READ
    ],
    level: 20
  },
  VIEWER: {
    id: 'viewer',
    name: '查看者',
    description: '只有查看权限',
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.DATA_READ,
      PERMISSIONS.REPORT_READ
    ],
    level: 10
  }
};

// 内存中的用户和角色存储
const USERS = new Map(); // userId -> userData
const ROLE_ASSIGNMENTS = new Map(); // userId -> [roleIds]

/**
 * 用户管理
 */
class UserManager {
  /**
   * 创建用户
   */
  static async createUser(userData) {
    const userId = userData.id || uuidv4();
    const hashedPassword = userData.password.startsWith('$2') ? userData.password : await bcrypt.hash(userData.password, 12);
    
    const user = {
      id: userId,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      isActive: true,
      isEmailVerified: false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: userData.metadata || {}
    };
    
    USERS.set(userId, user);
    
    // 默认为新用户分配EMPLOYEE角色
    await this.assignRole(userId, ROLES.EMPLOYEE.id);
    
    logger.info('用户创建成功', { 
      userId, 
      username: user.username, 
      email: user.email 
    });
    
    return this.sanitizeUser(user);
  }
  
  /**
   * 获取用户
   */
  static getUser(userId) {
    return this.sanitizeUser(USERS.get(userId));
  }
  
  /**
   * 获取用户(包含密码)
   */
  static getUserWithPassword(userId) {
    return USERS.get(userId);
  }
  
  /**
   * 通过用户名查找用户
   */
  static findUserByUsername(username) {
    for (const user of USERS.values()) {
      if (user.username === username) {
        return this.sanitizeUser(user);
      }
    }
    return null;
  }
  
  /**
   * 通过邮箱查找用户
   */
  static findUserByEmail(email) {
    for (const user of USERS.values()) {
      if (user.email === email) {
        return this.sanitizeUser(user);
      }
    }
    return null;
  }
  
  /**
   * 验证密码
   */
  static async verifyPassword(userId, password) {
    const user = this.getUserWithPassword(userId);
    if (!user) return false;
    
    // 检查账户是否被锁定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return false;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      // 增加失败登录次数
      user.failedLoginAttempts += 1;
      
      // 5次失败后锁定账户30分钟
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.failedLoginAttempts = 0;
        
        logger.warn('用户账户被锁定', { 
          userId, 
          username: user.username,
          lockedUntil: user.lockedUntil 
        });
      }
    } else {
      // 登录成功，重置失败次数
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
    }
    
    user.updatedAt = new Date();
    USERS.set(userId, user);
    
    return isValid;
  }
  
  /**
   * 更新用户
   */
  static updateUser(userId, updateData) {
    const user = USERS.get(userId);
    if (!user) return null;
    
    // 保护敏感字段
    delete updateData.id;
    delete updateData.password;
    
    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date()
    };
    
    USERS.set(userId, updatedUser);
    return this.sanitizeUser(updatedUser);
  }
  
  /**
   * 删除用户
   */
  static deleteUser(userId) {
    USERS.delete(userId);
    ROLE_ASSIGNMENTS.delete(userId);
  }
  
  /**
   * 分配角色
   */
  static async assignRole(userId, roleId) {
    if (!Object.values(ROLES).find(role => role.id === roleId)) {
      throw new Error(`角色不存在: ${roleId}`);
    }
    
    const userRoles = ROLE_ASSIGNMENTS.get(userId) || [];
    if (!userRoles.includes(roleId)) {
      userRoles.push(roleId);
      ROLE_ASSIGNMENTS.set(userId, userRoles);
      
      logger.info('用户角色分配', { userId, roleId });
    }
    
    return userRoles;
  }
  
  /**
   * 清除并重新分配角色 (用于批量更新)
   */
  static async setRoles(userId, roleIds) {
    if (!Array.isArray(roleIds)) {
      roleIds = [roleIds];
    }
    
    // 验证所有角色是否存在
    for (const roleId of roleIds) {
      if (!Object.values(ROLES).find(role => role.id === roleId)) {
        throw new Error(`角色不存在: ${roleId}`);
      }
    }
    
    ROLE_ASSIGNMENTS.set(userId, roleIds);
    logger.info('用户角色批量重新分配', { userId, roleIds });
    return roleIds;
  }

  /**
   * 移除角色
   */
  static removeRole(userId, roleId) {
    const userRoles = ROLE_ASSIGNMENTS.get(userId) || [];
    const newRoles = userRoles.filter(role => role !== roleId);
    
    ROLE_ASSIGNMENTS.set(userId, newRoles);
    
    logger.info('用户角色移除', { userId, roleId });
    return newRoles;
  }
  
  /**
   * 获取用户角色
   */
  static getUserRoles(userId) {
    const roleIds = ROLE_ASSIGNMENTS.get(userId) || [];
    return roleIds.map(roleId => ROLES[roleId.toUpperCase()]).filter(Boolean);
  }
  
  /**
   * 获取用户权限
   */
  static getUserPermissions(userId) {
    const userRoles = this.getUserRoles(userId);
    const permissions = new Set();
    
    userRoles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission);
      });
    });
    
    return Array.from(permissions);
  }
  
  /**
   * 检查用户是否具有特定权限
   */
  static hasPermission(userId, permission, userFromRequest = null) {
    // 首先检查内存存储中的权限 (旧系统)
    const permissions = this.getUserPermissions(userId);
    if (permissions.includes(permission) || permissions.includes(PERMISSIONS.ADMIN_FULL)) {
      return true;
    }

    // 然后检查请求中的用户信息 (新系统，基于JWT令牌中的权限)
    if (userFromRequest) {
      // 1. 检查角色 (优先检查角色，因为角色通常代表一组固定的权限)
      if (userFromRequest.role) {
        const roleName = userFromRequest.role.toUpperCase();
        // 映射数据库角色名到 ROLES 对象中的键
        const roleKeyMap = {
          'SYSTEM_ADMIN': 'SUPER_ADMIN',
          'ADMIN': 'ADMIN',
          'DORM_LEADER': 'MANAGER',
          'PAYER': 'ACCOUNTANT',
          'REGULAR_USER': 'EMPLOYEE',
          'USER': 'EMPLOYEE' // 默认映射
        };
        const mappedRoleKey = roleKeyMap[roleName] || roleName;
        const role = ROLES[mappedRoleKey];
        
        if (role && role.permissions) {
          if (role.permissions.includes(permission) || role.permissions.includes(PERMISSIONS.ADMIN_FULL)) {
            return true;
          }
        }
      }

      // 2. 检查具体的权限列表
      if (userFromRequest.permissions) {
        // 如果 permissions 是数组
        if (Array.isArray(userFromRequest.permissions)) {
          if (userFromRequest.permissions.includes(permission) || 
              userFromRequest.permissions.includes(PERMISSIONS.ADMIN_FULL)) {
            return true;
          }
        } 
        // 如果 permissions 是对象 (从数据库加载的 JSONB 格式)
        else if (typeof userFromRequest.permissions === 'object') {
          // 检查是否有直接对应的键
          if (userFromRequest.permissions[permission] === true) {
            return true;
          }
          
          // 检查 coarser-grained 权限映射
          const permissionMapping = {
            'user:activate': 'user_management',
            'user:deactivate': 'user_management',
            'user:create': 'user_management',
            'user:update': 'user_management',
            'user:delete': 'user_management',
            'user:list': 'user_management',
            'user:read': 'user_management',
            'system:config': 'system_config',
            'system:audit': 'security_audit',
            'data:read': 'data_monitoring',
            'financial:read': 'expense_audit'
          };
          
          const dbKey = permissionMapping[permission];
          if (dbKey && userFromRequest.permissions[dbKey] === true) {
            return true;
          }
          
          // 检查超级管理员权限
          if (userFromRequest.permissions.admin_full === true || 
              userFromRequest.permissions.system_config === true) {
            return true;
          }
        }
      }
    }

    return false;
  }
  
  /**
   * 检查用户是否具有任意一个权限
   */
  static hasAnyPermission(userId, permissions, userFromRequest = null) {
    return permissions.some(permission => this.hasPermission(userId, permission, userFromRequest));
  }
  
  /**
   * 检查用户是否具有所有权限
   */
  static hasAllPermissions(userId, permissions, userFromRequest = null) {
    return permissions.every(permission => this.hasPermission(userId, permission, userFromRequest));
  }
  
  /**
   * 获取所有用户
   */
  static getAllUsers() {
    return Array.from(USERS.values()).map(user => this.sanitizeUser(user));
  }
  
  /**
   * 清理用户敏感信息
   */
  static sanitizeUser(user) {
    if (!user) return null;
    
    const { password, failedLoginAttempts, lockedUntil, ...sanitized } = user;
    return sanitized;
  }
}

/**
 * 权限检查中间件工厂
 */
class PermissionChecker {
  /**
   * 创建权限检查中间件
   */
  static requirePermission(permission) {
    return (req, res, next) => {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      if (!UserManager.hasPermission(user.id, permission, user)) {
        logger.warn('权限不足', {
          userId: user.id,
          username: user.username,
          permission,
          route: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }
      
      next();
    };
  }
  
  /**
   * 创建多权限检查中间件 (需要任意一个)
   */
  static requireAnyPermission(permissions) {
    return (req, res, next) => {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      if (!UserManager.hasAnyPermission(user.id, permissions, user)) {
        logger.warn('权限不足 (多权限检查)', {
          userId: user.id,
          username: user.username,
          requiredPermissions: permissions,
          route: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }
      
      next();
    };
  }
  
  /**
   * 创建多权限检查中间件 (需要所有)
   */
  static requireAllPermissions(permissions) {
    return (req, res, next) => {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      if (!UserManager.hasAllPermissions(user.id, permissions, user)) {
        logger.warn('权限不足 (全权限检查)', {
          userId: user.id,
          username: user.username,
          requiredPermissions: permissions,
          route: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }
      
      next();
    };
  }
  
  /**
   * 创建角色检查中间件
   */
  static requireRole(roleId) {
    return (req, res, next) => {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      const userRoles = UserManager.getUserRoles(user.id);
      const hasRole = userRoles.some(role => role.id === roleId);
      
      if (!hasRole) {
        logger.warn('角色不足', {
          userId: user.id,
          username: user.username,
          requiredRole: roleId,
          userRoles: userRoles.map(r => r.id),
          route: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        return res.status(403).json({
          success: false,
          message: '角色不足'
        });
      }
      
      next();
    };
  }
  
  /**
   * 创建多角色检查中间件
   */
  static requireAnyRole(roleIds) {
    return (req, res, next) => {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      const userRoles = UserManager.getUserRoles(user.id);
      const hasAnyRole = roleIds.some(roleId => 
        userRoles.some(role => role.id === roleId)
      );
      
      if (!hasAnyRole) {
        logger.warn('角色不足 (多角色检查)', {
          userId: user.id,
          username: user.username,
          requiredRoles: roleIds,
          userRoles: userRoles.map(r => r.id),
          route: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        return res.status(403).json({
          success: false,
          message: '角色不足'
        });
      }
      
      next();
    };
  }
  
  /**
   * 创建管理员检查中间件
   */
  static requireAdmin() {
    return PermissionChecker.requireAnyRole(['admin', 'super_admin']);
  }
  
  /**
   * 创建超级管理员检查中间件
   */
  static requireSuperAdmin() {
    return PermissionChecker.requireRole('super_admin');
  }
  
  /**
   * 创建资源所有权检查中间件
   */
  static requireResourceOwnership(resourceField = 'userId') {
    return (req, res, next) => {
      const user = req.user;
      const resourceId = req.params.id;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '未认证用户'
        });
      }
      
      // 管理员和超级管理员可以访问所有资源
      if (UserManager.hasAnyPermission(user.id, [PERMISSIONS.ADMIN_FULL], user)) {
        return next();
      }
      
      // 检查资源所有权 (这里需要根据具体业务逻辑实现)
      // 例如：检查用户是否拥有该资源
      // const hasOwnership = await checkResourceOwnership(user.id, resourceId);
      
      // 暂时允许访问，实际应用中需要实现具体的检查逻辑
      return next();
    };
  }
}

/**
 * JWT用户认证中间件
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失或格式错误'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = UserManager.getUser(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被停用'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.warn('JWT认证失败', {
      error: error.message,
      token: token.substring(0, 20) + '...',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(401).json({
      success: false,
      message: '访问令牌无效'
    });
  }
}

/**
 * 权限装饰器 (用于类方法)
 */
function requirePermission(permission) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const user = this.user || args.find(arg => arg && arg.user);
      
      if (!user) {
        throw new Error('用户未认证');
      }
      
      if (!UserManager.hasPermission(user.id, permission)) {
        throw new Error('权限不足');
      }
      
      return await originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// 初始化默认用户 (演示用)
async function initializeDefaultUsers() {
  const defaultUsers = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'CHANGE_ME_ON_FIRST_LOGIN',
      firstName: '系统',
      lastName: '管理员'
    },
    {
      username: 'manager',
      email: 'manager@example.com',
      password: process.env.DEFAULT_MANAGER_PASSWORD || 'CHANGE_ME_ON_FIRST_LOGIN',
      firstName: '部门',
      lastName: '经理'
    },
    {
      username: 'user',
      email: 'user@example.com',
      password: process.env.DEFAULT_USER_PASSWORD || 'CHANGE_ME_ON_FIRST_LOGIN',
      firstName: '普通',
      lastName: '用户'
    }
  ];
  
  for (const userData of defaultUsers) {
    try {
      const user = await UserManager.createUser(userData);
      
      // 为管理员分配超级管理员角色
      if (userData.username === 'admin') {
        await UserManager.assignRole(user.id, 'super_admin');
      }
    } catch (error) {
      logger.warn('创建默认用户失败', { error: error.message });
    }
  }
  
  logger.info('默认用户初始化完成');
}

// 导出模块
module.exports = {
  PERMISSIONS,
  ROLES,
  UserManager,
  PermissionChecker,
  authenticateJWT,
  requirePermission,
  initializeDefaultUsers
};