/**
 * 用户管理路由
 * 提供用户增删改查功能
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { PermissionChecker } = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');
const { UserManager } = require('../config/permissions');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

const avatarDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG、GIF 和 WebP 格式的图片'));
    }
  }
});

/**
 * GET /api/users
 * 获取所有用户列表
 */
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const users = UserManager.getAllUsers();
    const usersWithRoles = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
      status: user.status || 'active',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin || null,
      isActive: user.isActive !== false
    }));

    res.json({
      success: true,
      message: '获取用户列表成功',
      data: {
        users: usersWithRoles,
        total: usersWithRoles.length
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

/**
 * GET /api/users/:userId
 * 获取指定用户信息
 */
router.get('/:userId', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = UserManager.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles || [],
          status: user.status || 'active',
          createdAt: user.createdAt || new Date().toISOString(),
          lastLogin: user.lastLogin || null,
          isActive: user.isActive !== false
        }
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

/**
 * POST /api/users
 * 创建新用户
 */
router.post('/', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { username, email, password, roles = ['user'] } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      });
    }

    const users = UserManager.getAllUsers();
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    if (users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    const newUser = {
      id: uuidv4(),
      username,
      email,
      password, // 注意：在实际生产环境中应该进行哈希处理
      roles,
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    UserManager.addUser(newUser);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          roles: newUser.roles,
          status: newUser.status,
          createdAt: newUser.createdAt,
          isActive: newUser.isActive
        }
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

/**
 * PUT /api/users/:userId
 * 更新用户信息
 */
router.put('/:userId', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, roles, status } = req.body;

    const existingUser = UserManager.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const users = UserManager.getAllUsers();
    
    // 检查用户名是否被其他用户使用
    if (username && username !== existingUser.username) {
      if (users.find(u => u.username === username && u.id !== userId)) {
        return res.status(400).json({
          success: false,
          message: '用户名已被使用'
        });
      }
    }

    // 检查邮箱是否被其他用户使用
    if (email && email !== existingUser.email) {
      if (users.find(u => u.email === email && u.id !== userId)) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被使用'
        });
      }
    }

    const updatedUser = {
      ...existingUser,
      ...(username && { username }),
      ...(email && { email }),
      ...(roles && { roles }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    UserManager.updateUser(userId, updatedUser);

    res.json({
      success: true,
      message: '用户更新成功',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          roles: updatedUser.roles || [],
          status: updatedUser.status || 'active',
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          isActive: updatedUser.isActive !== false
        }
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

/**
 * DELETE /api/users/:userId
 * 删除用户
 */
router.delete('/:userId', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;

    const existingUser = UserManager.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    UserManager.removeUser(userId);

    res.json({
      success: true,
      message: '用户删除成功'
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

/**
 * POST /api/users/:userId/activate
 * 激活用户
 */
router.post('/:userId/activate', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;

    const existingUser = UserManager.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    UserManager.activateUser(userId);

    res.json({
      success: true,
      message: '用户已激活'
    });
  } catch (error) {
    console.error('激活用户失败:', error);
    res.status(500).json({
      success: false,
      message: '激活用户失败',
      error: error.message
    });
  }
}));

/**
 * POST /api/users/:userId/deactivate
 * 停用用户
 */
router.post('/:userId/deactivate', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userId } = req.params;

    const existingUser = UserManager.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    UserManager.deactivateUser(userId);

    res.json({
      success: true,
      message: '用户已停用'
    });
  } catch (error) {
    console.error('停用用户失败:', error);
    res.status(500).json({
      success: false,
      message: '停用用户失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/users/stats/summary
 * 获取用户统计信息
 */
router.get('/stats/summary', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const users = UserManager.getAllUsers();
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive !== false).length,
      inactive: users.filter(u => u.isActive === false).length,
      byRole: {}
    };

    // 统计各角色用户数量
    users.forEach(user => {
      const roles = user.roles || ['user'];
      roles.forEach(role => {
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      });
    });

    res.json({
      success: true,
      message: '获取用户统计信息成功',
      data: { stats }
    });
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计信息失败',
      error: error.message
    });
  }
}));

/**
 * POST /api/users/personal-info/sync
 * 同步当前用户的个人信息
 */
router.post('/personal-info/sync', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const userId = req.user.id;
    
    logger.info('[UsersRoute] 同步个人信息开始', { userId });
    
    const query = `
      SELECT 
        id,
        username,
        email,
        nickname,
        real_name,
        phone,
        gender,
        birthday,
        avatar_url,
        email_verified,
        phone_verified,
        status,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      logger.warn('[UsersRoute] 用户不存在', { userId });
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const user = result.rows[0];
    
    logger.info('[UsersRoute] 同步个人信息成功', { 
      userId,
      username: user.username 
    });
    
    res.json({
      success: true,
      message: '同步个人信息成功',
      data: {
        id: user.id,
        name: user.real_name || user.nickname || user.username,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthday: user.birthday,
        avatar: user.avatar_url,
        bio: '',
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        status: user.status,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    logger.error('[UsersRoute] 同步个人信息失败', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      message: '同步个人信息失败',
      error: error.message
    });
  }
}));

/**
 * POST /api/users/avatar
 * 上传用户头像
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const userId = req.user.id;
    
    logger.info('[UsersRoute] 上传头像开始', { userId });
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的头像图片'
      });
    }
    
    const optimizedFilename = `avatar_${userId}_${Date.now()}.webp`;
    const optimizedPath = path.join(avatarDir, optimizedFilename);
    
    await sharp(req.file.path)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(optimizedPath);
    
    fs.unlinkSync(req.file.path);
    
    const avatarUrl = `/uploads/avatars/${optimizedFilename}`;
    
    await pool.query(
      `UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [avatarUrl, userId]
    );
    
    logger.info('[UsersRoute] 上传头像成功', { 
      userId,
      avatarUrl 
    });
    
    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    logger.error('[UsersRoute] 上传头像失败', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      message: '头像上传失败',
      error: error.message
    });
  }
}));

module.exports = router;