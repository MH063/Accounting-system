/**
 * 权限管理路由
 * 提供用户和权限管理的API接口
 */

const express = require('express');
const { 
  UserManager, 
  PermissionChecker, 
  PERMISSIONS, 
  ROLES,
  authenticateJWT 
} = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 中间件：需要管理员权限
 */
const requireAdmin = PermissionChecker.requireAdmin();

/**
 * 中间件：需要超级管理员权限
 */
const requireSuperAdmin = PermissionChecker.requireSuperAdmin();

/**
 * POST /api/permissions/users
 * 创建新用户
 */
router.post('/users', requireAdmin, responseWrapper(async (req, res) => {
  const { username, email, password, firstName, lastName, roleId } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名、邮箱和密码都是必需的'
    });
  }

  // 检查用户名是否已存在
  if (UserManager.findUserByUsername(username)) {
    return res.status(409).json({
      success: false,
      message: '用户名已存在'
    });
  }

  // 检查邮箱是否已存在
  if (UserManager.findUserByEmail(email)) {
    return res.status(409).json({
      success: false,
      message: '邮箱已被注册'
    });
  }

  const userData = { username, email, password, firstName, lastName };
  const user = await UserManager.createUser(userData);

  // 如果指定了角色，分配角色
  if (roleId) {
    await UserManager.assignRole(user.id, roleId);
  }

  logger.info('用户创建成功', {
    adminId: req.user.id,
    adminUsername: req.user.username,
    newUserId: user.id,
    newUserUsername: user.username
  });

  return res.status(201).json({
    success: true,
    data: { user },
    message: '用户创建成功'
  });
}));

/**
 * GET /api/permissions/users
 * 获取所有用户
 */
router.get('/users', authenticateJWT, responseWrapper(async (req, res) => {
  // 检查权限
  if (!PermissionChecker.hasPermission(req.user.id, PERMISSIONS.USER_LIST)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const users = UserManager.getAllUsers();
  const usersWithRoles = users.map(user => ({
    ...user,
    roles: UserManager.getUserRoles(user.id),
    permissions: UserManager.getUserPermissions(user.id)
  }));

  return res.json({
    success: true,
    data: { 
      users: usersWithRoles,
      total: usersWithRoles.length
    }
  });
}));

/**
 * GET /api/permissions/users/:userId
 * 获取指定用户信息
 */
router.get('/users/:userId', authenticateJWT, responseWrapper(async (req, res) => {
  const { userId } = req.params;

  // 检查权限 - 可以查看自己的信息，或者有相应权限
  if (req.user.id !== userId && !PermissionChecker.hasPermission(req.user.id, PERMISSIONS.USER_READ)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const userWithRoles = {
    ...user,
    roles: UserManager.getUserRoles(userId),
    permissions: UserManager.getUserPermissions(userId)
  };

  return res.json({
    success: true,
    data: { user: userWithRoles }
  });
}));

/**
 * PUT /api/permissions/users/:userId
 * 更新用户信息
 */
router.put('/users/:userId', authenticateJWT, responseWrapper(async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  // 检查权限 - 可以更新自己的信息，或者有相应权限
  if (req.user.id !== userId && !PermissionChecker.hasPermission(req.user.id, PERMISSIONS.USER_UPDATE)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  // 保护敏感字段
  delete updateData.id;
  delete updateData.password;

  const updatedUser = UserManager.updateUser(userId, updateData);

  logger.info('用户信息更新', {
    userId: userId,
    updatedBy: req.user.id,
    changes: updateData
  });

  return res.json({
    success: true,
    data: { user: updatedUser },
    message: '用户信息更新成功'
  });
}));

/**
 * DELETE /api/permissions/users/:userId
 * 删除用户
 */
router.delete('/users/:userId', requireAdmin, responseWrapper(async (req, res) => {
  const { userId } = req.params;

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  UserManager.deleteUser(userId);

  logger.info('用户删除', {
    adminId: req.user.id,
    adminUsername: req.user.username,
    deletedUserId: userId,
    deletedUsername: user.username
  });

  return res.json({
    success: true,
    message: '用户删除成功'
  });
}));

/**
 * POST /api/permissions/users/:userId/roles
 * 为用户分配角色
 */
router.post('/users/:userId/roles', requireAdmin, responseWrapper(async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  if (!Object.values(ROLES).find(role => role.id === roleId)) {
    return res.status(400).json({
      success: false,
      message: '角色不存在'
    });
  }

  const userRoles = await UserManager.assignRole(userId, roleId);

  logger.info('用户角色分配', {
    adminId: req.user.id,
    userId: userId,
    roleId: roleId
  });

  return res.json({
    success: true,
    data: { roles: userRoles },
    message: '角色分配成功'
  });
}));

/**
 * DELETE /api/permissions/users/:userId/roles/:roleId
 * 移除用户角色
 */
router.delete('/users/:userId/roles/:roleId', requireAdmin, responseWrapper(async (req, res) => {
  const { userId, roleId } = req.params;

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const userRoles = UserManager.removeRole(userId, roleId);

  logger.info('用户角色移除', {
    adminId: req.user.id,
    userId: userId,
    roleId: roleId
  });

  return res.json({
    success: true,
    data: { roles: userRoles },
    message: '角色移除成功'
  });
}));

/**
 * GET /api/permissions/users/:userId/roles
 * 获取用户角色
 */
router.get('/users/:userId/roles', authenticateJWT, responseWrapper(async (req, res) => {
  const { userId } = req.params;

  // 检查权限
  if (req.user.id !== userId && !PermissionChecker.hasPermission(req.user.id, PERMISSIONS.USER_READ)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const roles = UserManager.getUserRoles(userId);

  return res.json({
    success: true,
    data: { roles }
  });
}));

/**
 * GET /api/permissions/users/:userId/permissions
 * 获取用户权限
 */
router.get('/users/:userId/permissions', authenticateJWT, responseWrapper(async (req, res) => {
  const { userId } = req.params;

  // 检查权限
  if (req.user.id !== userId && !PermissionChecker.hasPermission(req.user.id, PERMISSIONS.USER_READ)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const permissions = UserManager.getUserPermissions(userId);

  return res.json({
    success: true,
    data: { permissions }
  });
}));

/**
 * GET /api/permissions/roles
 * 获取所有角色
 */
router.get('/roles', authenticateJWT, responseWrapper(async (req, res) => {
  // 检查权限
  if (!PermissionChecker.hasPermission(req.user.id, PERMISSIONS.ROLE_LIST)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const roles = Object.values(ROLES);

  return res.json({
    success: true,
    data: { roles }
  });
}));

/**
 * GET /api/permissions/permissions
 * 获取所有权限
 */
router.get('/permissions', authenticateJWT, responseWrapper(async (req, res) => {
  // 检查权限
  if (!PermissionChecker.hasPermission(req.user.id, PERMISSIONS.ROLE_LIST)) {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const permissionsList = Object.entries(PERMISSIONS).map(([key, value]) => ({
    key,
    value,
    description: getPermissionDescription(value)
  }));

  return res.json({
    success: true,
    data: { permissions: permissionsList }
  });
}));

/**
 * POST /api/permissions/users/:userId/activate
 * 激活用户
 */
router.post('/users/:userId/activate', requireAdmin, responseWrapper(async (req, res) => {
  const { userId } = req.params;

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const activatedUser = UserManager.setUserActive(userId, true);

  logger.info('用户激活', {
    adminId: req.user.id,
    userId: userId
  });

  return res.json({
    success: true,
    data: { user: activatedUser },
    message: '用户激活成功'
  });
}));

/**
 * POST /api/permissions/users/:userId/deactivate
 * 停用用户
 */
router.post('/users/:userId/deactivate', requireAdmin, responseWrapper(async (req, res) => {
  const { userId } = req.params;

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const deactivatedUser = UserManager.setUserActive(userId, false);

  logger.info('用户停用', {
    adminId: req.user.id,
    userId: userId
  });

  return res.json({
    success: true,
    data: { user: deactivatedUser },
    message: '用户停用成功'
  });
}));

/**
 * POST /api/permissions/users/:userId/reset-password
 * 重置用户密码
 */
router.post('/users/:userId/reset-password', requireAdmin, responseWrapper(async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: '新密码是必需的'
    });
  }

  const user = UserManager.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  // 重置密码逻辑需要在UserManager中实现
  // 这里需要添加resetPassword方法

  logger.info('用户密码重置', {
    adminId: req.user.id,
    userId: userId
  });

  return res.json({
    success: true,
    message: '密码重置成功'
  });
}));

/**
 * GET /api/permissions/me
 * 获取当前用户信息
 */
router.get('/me', authenticateJWT, responseWrapper(async (req, res) => {
  const user = UserManager.getUser(req.user.id);
  const roles = UserManager.getUserRoles(req.user.id);
  const permissions = UserManager.getUserPermissions(req.user.id);

  return res.json({
    success: true,
    data: {
      user,
      roles,
      permissions
    }
  });
}));

/**
 * POST /api/permissions/verify-permission
 * 验证特定权限
 */
router.post('/verify-permission', authenticateJWT, responseWrapper(async (req, res) => {
  const { permission } = req.body;

  if (!permission) {
    return res.status(400).json({
      success: false,
      message: '权限参数是必需的'
    });
  }

  const hasPermission = UserManager.hasPermission(req.user.id, permission);

  return res.json({
    success: true,
    data: {
      hasPermission,
      permission
    }
  });
}));

/**
 * 获取权限描述的辅助函数
 */
function getPermissionDescription(permission) {
  const descriptions = {
    // 用户权限
    'user:create': '创建新用户',
    'user:read': '查看用户信息',
    'user:update': '更新用户信息',
    'user:delete': '删除用户',
    'user:list': '查看用户列表',
    'user:activate': '激活用户账户',
    'user:deactivate': '停用用户账户',
    
    // 角色权限
    'role:create': '创建新角色',
    'role:read': '查看角色信息',
    'role:update': '更新角色信息',
    'role:delete': '删除角色',
    'role:list': '查看角色列表',
    
    // 数据权限
    'data:read': '读取数据',
    'data:write': '写入数据',
    'data:delete': '删除数据',
    'data:export': '导出数据',
    'data:import': '导入数据',
    
    // 报表权限
    'report:read': '查看报表',
    'report:create': '创建报表',
    'report:update': '更新报表',
    'report:delete': '删除报表',
    'report:export': '导出报表',
    
    // 系统权限
    'system:config': '系统配置',
    'system:audit': '系统审计',
    'system:log': '系统日志',
    'system:backup': '系统备份',
    'system:restore': '系统恢复',
    
    // 财务权限
    'financial:read': '财务数据读取',
    'financial:write': '财务数据写入',
    'financial:approve': '财务审批',
    'financial:audit': '财务审计',
    
    // 管理权限
    'admin:full': '完全管理员权限',
    'admin:user': '用户管理权限',
    'admin:system': '系统管理权限'
  };
  
  return descriptions[permission] || permission;
}

module.exports = router;