/**
 * 版本化用户管理路由
 * 演示不同API版本的用户管理功能差异
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { PermissionChecker } = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');
const { UserManager } = require('../config/permissions');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * 统一的用户管理路由
 * 根据请求的API版本返回不同的数据格式
 */

// 获取用户列表
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const users = UserManager.getAllUsers();
    const apiVersion = req.apiVersion || 'v1';
    
    let processedUsers;
    let features = [];

    if (apiVersion === 'v1') {
      // V1版本：仅返回基本字段
      processedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString()
      }));
      features = ['basic_user_management'];
    } else if (apiVersion === 'v2') {
      // V2版本：包含更多字段
      processedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null,
        isActive: user.isActive !== false,
        updatedAt: user.updatedAt || null,
        loginCount: user.loginCount || 0
      }));
      features = ['enhanced_user_fields', 'activity_tracking'];
    }

    res.json({
      success: true,
      message: `V${apiVersion} - 获取用户列表成功`,
      version: apiVersion,
      data: {
        users: processedUsers,
        total: processedUsers.length,
        features: features
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
}));

// 获取单个用户
router.get('/:userId', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = UserManager.getUserById(userId);
    const apiVersion = req.apiVersion || 'v1';
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    let userData;
    let features = [];

    if (apiVersion === 'v1') {
      // V1版本：仅返回基本字段
      userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString()
      };
      features = ['basic_user_management'];
    } else if (apiVersion === 'v2') {
      // V2版本：包含更多字段
      userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null,
        isActive: user.isActive !== false,
        updatedAt: user.updatedAt || null,
        loginCount: user.loginCount || 0,
        // V2新增字段
        profile: {
          fullName: user.fullName || null,
          avatar: user.avatar || null,
          phoneNumber: user.phoneNumber || null,
          department: user.department || null
        }
      };
      features = ['enhanced_profile', 'activity_tracking'];
    }

    res.json({
      success: true,
      message: `V${apiVersion} - 获取用户信息成功`,
      version: apiVersion,
      data: { 
        user: userData,
        features: features
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
}));

// 创建用户
router.post('/', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { username, email, password, roles = ['user'] } = req.body;
    const apiVersion = req.apiVersion || 'v1';

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段：username, email, password'
      });
    }

    // 检查用户是否已存在
    if (UserManager.getUserByUsername(username)) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      });
    }

    if (UserManager.getUserByEmail(email)) {
      return res.status(409).json({
        success: false,
        message: '邮箱已被使用'
      });
    }

    // 创建新用户
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password, // 注意：实际生产中需要加密
      roles,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    UserManager.addUser(newUser);

    let responseUser;
    let features = [];

    if (apiVersion === 'v1') {
      responseUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        roles: newUser.roles,
        status: newUser.status,
        createdAt: newUser.createdAt
      };
      features = ['basic_user_management'];
    } else if (apiVersion === 'v2') {
      responseUser = {
        ...newUser,
        lastLogin: null,
        isActive: true,
        loginCount: 0
      };
      features = ['enhanced_user_management', 'activity_tracking'];
    }

    res.status(201).json({
      success: true,
      message: `V${apiVersion} - 用户创建成功`,
      version: apiVersion,
      data: {
        user: responseUser,
        features: features
      }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
}));

// 更新用户
router.put('/:userId', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const apiVersion = req.apiVersion || 'v1';

    const user = UserManager.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    UserManager.updateUser(userId, updatedUser);

    let responseUser;
    let features = [];

    if (apiVersion === 'v1') {
      responseUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        roles: updatedUser.roles,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt
      };
      features = ['basic_user_management'];
    } else if (apiVersion === 'v2') {
      responseUser = {
        ...updatedUser,
        isActive: updatedUser.isActive !== false,
        loginCount: updatedUser.loginCount || 0
      };
      features = ['enhanced_user_management', 'activity_tracking'];
    }

    res.json({
      success: true,
      message: `V${apiVersion} - 用户更新成功`,
      version: apiVersion,
      data: {
        user: responseUser,
        features: features
      }
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
}));

// 删除用户
router.delete('/:userId', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;
    const apiVersion = req.apiVersion || 'v1';

    const user = UserManager.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    UserManager.deleteUser(userId);

    res.json({
      success: true,
      message: `V${apiVersion} - 用户删除成功`,
      version: apiVersion,
      data: {
        deletedUserId: userId,
        features: ['basic_user_management']
      }
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
}));

// 用户统计信息 (V2版本特有功能)
router.get('/stats/summary', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const users = UserManager.getAllUsers();
    const apiVersion = req.apiVersion || 'v1';

    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      admins: users.filter(u => u.roles && u.roles.includes('admin')).length
    };

    if (apiVersion === 'v1') {
      return res.json({
        success: true,
        message: 'V1 - 用户统计信息',
        version: apiVersion,
        data: {
          summary: stats,
          features: ['basic_statistics']
        }
      });
    } else if (apiVersion === 'v2') {
      // V2版本提供更详细的统计信息
      const detailedStats = {
        ...stats,
        recentLogins: users.filter(u => {
          if (!u.lastLogin) return false;
          const lastLoginDate = new Date(u.lastLogin);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastLoginDate > thirtyDaysAgo;
        }).length,
        avgLoginCount: users.length > 0 ? 
          users.reduce((sum, u) => sum + (u.loginCount || 0), 0) / users.length : 0,
        departments: [...new Set(users.map(u => u.department).filter(Boolean))].length
      };

      return res.json({
        success: true,
        message: 'V2 - 用户统计信息',
        version: apiVersion,
        data: {
          summary: detailedStats,
          features: ['enhanced_statistics', 'activity_tracking', 'departmental_analysis']
        }
      });
    }
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败',
      error: error.message
    });
  }
}));

// 批量操作 (V2版本特有功能)
router.post('/batch', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { operation, userIds, data } = req.body;
    const apiVersion = req.apiVersion || 'v1';

    if (!operation || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段：operation, userIds'
      });
    }

    if (apiVersion === 'v1') {
      return res.status(400).json({
        success: false,
        message: 'V1版本不支持批量操作',
        error: 'Batch operations not supported in v1'
      });
    }

    // V2版本的批量操作
    const results = [];
    
    for (const userId of userIds) {
      const user = UserManager.getUserById(userId);
      if (!user) {
        results.push({
          userId,
          success: false,
          error: '用户不存在'
        });
        continue;
      }

      try {
        let updatedUser;
        switch (operation) {
          case 'activate':
            updatedUser = { ...user, status: 'active', updatedAt: new Date().toISOString() };
            break;
          case 'deactivate':
            updatedUser = { ...user, status: 'inactive', updatedAt: new Date().toISOString() };
            break;
          case 'update':
            updatedUser = { ...user, ...data, updatedAt: new Date().toISOString() };
            break;
          default:
            results.push({
              userId,
              success: false,
              error: '不支持的操作类型'
            });
            continue;
        }

        UserManager.updateUser(userId, updatedUser);
        results.push({
          userId,
          success: true,
          message: '操作成功'
        });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `V2 - 批量操作完成，成功: ${successCount}/${userIds.length}`,
      version: apiVersion,
      data: {
        operation,
        totalProcessed: userIds.length,
        successCount,
        failureCount: userIds.length - successCount,
        results,
        features: ['batch_operations', 'enhanced_user_management']
      }
    });
  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
}));

module.exports = router;