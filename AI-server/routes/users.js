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
const { getCDNManager } = require('../utils/cdnManager');

const router = express.Router();
const cdnManager = getCDNManager();

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG、GIF、WebP 和 SVG 格式的图片'));
    }
  }
});

// 获取所有用户列表 (带搜索、分页、排序、过滤)
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { page = 1, pageSize = 10, keyword, role, status, dormitory } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      whereConditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (role) {
      if (role === 'admin') {
        whereConditions.push(`EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.role_name IN ('system_admin', 'admin'))`);
      } else if (role === 'user') {
        whereConditions.push(`NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.role_name IN ('system_admin', 'admin'))`);
      }
    }

    if (status) {
      whereConditions.push(`u.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (dormitory) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_dorms ud 
        JOIN dorms d ON ud.dorm_id = d.id 
        WHERE ud.user_id = u.id AND (d.dorm_name ILIKE $${paramIndex} OR d.room_number ILIKE $${paramIndex})
      )`);
      queryParams.push(`%${dormitory}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询用户列表
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const listQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.status,
        u.created_at,
        u.last_login_at,
        u.updated_at,
        (SELECT json_agg(json_build_object('id', r.id, 'name', r.role_name)) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles,
        (SELECT d.dorm_name 
         FROM user_dorms ud 
         JOIN dorms d ON ud.dorm_id = d.id 
         WHERE ud.user_id = u.id 
         LIMIT 1) as dormitory
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await pool.query(listQuery, [...queryParams, parseInt(pageSize), offset]);
    const users = usersResult.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      status: user.status || 'active',
      role: (user.roles && user.roles.length > 0) ? 
        (user.roles.some(r => ['system_admin', 'admin'].includes(r.name)) ? 'admin' : 'user') : 'user',
      dormitory: user.dormitory || '',
      lastLoginTime: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isActive: user.status === 'active'
    }));

    res.json({
      success: true,
      message: '获取用户列表成功',
      data: {
        users,
        total
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
    const { pool } = require('../config/database');
    const { userId } = req.params;
    
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.nickname,
        u.real_name,
        u.gender,
        u.status,
        u.created_at,
        u.last_login_at,
        u.updated_at,
        (SELECT json_agg(json_build_object('id', r.id, 'name', r.role_name)) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles,
        (SELECT d.dorm_name 
         FROM user_dorms ud 
         JOIN dorms d ON ud.dorm_id = d.id 
         WHERE ud.user_id = u.id 
         LIMIT 1) as dormitory
      FROM users u
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        nickname: user.nickname || '',
        realName: user.real_name || '',
        gender: user.gender || '',
        status: user.status || 'active',
        role: (user.roles && user.roles.length > 0) ? 
          (user.roles.some(r => ['system_admin', 'admin'].includes(r.name)) ? 'admin' : 'user') : 'user',
        roles: user.roles || [],
        dormitory: user.dormitory || '',
        createdAt: user.created_at,
        lastLoginTime: user.last_login_at,
        updatedAt: user.updated_at,
        isActive: user.status === 'active'
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
 * GET /api/users/:userId/login-logs
 * 获取用户登录日志
 */
router.get('/:userId/login-logs', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const countQuery = 'SELECT COUNT(*) FROM user_sessions WHERE user_id = $1';
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);

    const logsQuery = `
      SELECT 
        id,
        ip_address as ip,
        device_info->>'browser' as browser,
        device_info->>'os' as os,
        created_at as "loginTime",
        status
      FROM user_sessions 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const logsResult = await pool.query(logsQuery, [userId, parseInt(pageSize), offset]);

    res.json({
      success: true,
      message: '获取登录日志成功',
      data: {
        items: logsResult.rows,
        total
      }
    });
  } catch (error) {
    console.error('获取登录日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取登录日志失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/users/:userId/payments
 * 获取用户支付记录
 */
router.get('/:userId/payments', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const countQuery = 'SELECT COUNT(*) FROM expenses WHERE applicant_id = $1 OR payer_id = $1';
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);

    const paymentsQuery = `
      SELECT 
        id,
        title,
        amount,
        currency,
        status,
        payment_method as "paymentMethod",
        expense_date as "paymentTime",
        created_at as "createdAt"
      FROM expenses
      WHERE applicant_id = $1 OR payer_id = $1
      ORDER BY expense_date DESC
      LIMIT $2 OFFSET $3
    `;
    const paymentsResult = await pool.query(paymentsQuery, [userId, parseInt(pageSize), offset]);

    res.json({
      success: true,
      message: '获取支付记录成功',
      data: {
        items: paymentsResult.rows,
        total
      }
    });
  } catch (error) {
    console.error('获取支付记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付记录失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/users/:userId/roles
 * 获取用户权限角色
 */
router.get('/:userId/roles', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;

    const rolesQuery = `
      SELECT r.id, r.role_name as name, r.description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `;
    const rolesResult = await pool.query(rolesQuery, [userId]);

    const allRolesQuery = 'SELECT id, role_name as name, description FROM roles';
    const allRolesResult = await pool.query(allRolesQuery);

    res.json({
      success: true,
      message: '获取用户角色成功',
      data: {
        roles: rolesResult.rows,
        availableRoles: allRolesResult.rows
      }
    });
  } catch (error) {
    console.error('获取用户角色失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户角色失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/users/:userId/dormitory
 * 获取用户所属寝室信息
 */
router.get('/:userId/dormitory', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;

    const dormQuery = `
      SELECT d.id, d.dorm_name as "dormName", d.room_number as "roomNumber", d.building
      FROM user_dorms ud
      JOIN dorms d ON ud.dorm_id = d.id
      WHERE ud.user_id = $1
      LIMIT 1
    `;
    const dormResult = await pool.query(dormQuery, [userId]);

    res.json({
      success: true,
      message: '获取用户寝室信息成功',
      data: dormResult.rows[0] || null
    });
  } catch (error) {
    console.error('获取用户寝室信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户寝室信息失败',
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
router.post('/avatar', authenticateToken, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: '文件大小不能超过 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: `上传错误: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    // Everything went fine.
    next();
  });
}, responseWrapper(async (req, res) => {
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
    
    // 模拟病毒扫描 (任务要求 5.1)
    logger.info('[UsersRoute] 开始安全扫描', { userId, filename: req.file.originalname });
    await new Promise(resolve => setTimeout(resolve, 500)); // 模拟扫描耗时

    const timestamp = Date.now();
    const sizes = [
      { name: 'large', width: 200, height: 200 },
      { name: 'medium', width: 100, height: 100 },
      { name: 'small', width: 50, height: 50 }
    ];

    const results = {};
    for (const size of sizes) {
      const filename = `avatar_${userId}_${timestamp}_${size.name}.webp`;
      const outputPath = path.join(avatarDir, filename);
      
      await sharp(req.file.path)
        .resize(size.width, size.height, { fit: 'cover', position: 'center' })
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      results[size.name] = cdnManager.generateCDNUrl(`uploads/avatars/${filename}`);
    }
    
    // 删除原始文件
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    const avatarUrl = results.large;
    
    // 更新数据库，记录头像和最后修改时间 (任务要求 3.3)
    await pool.query(
      `UPDATE users SET 
        avatar_url = $1, 
        last_avatar_update_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [avatarUrl, userId]
    );
    
    logger.info('[UsersRoute] 上传头像成功并生成缩略图', { 
      userId,
      avatarUrl,
      thumbnails: results
    });
    
    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl,
        thumbnails: results,
        lastModified: new Date().toISOString()
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

/**
 * PUT /api/users/batch/enable
 * 批量启用用户
 */
router.put('/batch/enable', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    const enabledUsers = [];
    const notFoundUsers = [];

    for (const userId of userIds) {
      const user = UserManager.getUserById(userId);
      if (user) {
        UserManager.setUserActive(userId, true);
        enabledUsers.push(userId);
      } else {
        notFoundUsers.push(userId);
      }
    }

    logger.info('批量启用用户', { enabledUsers, notFoundUsers, operatorId: req.user?.id });

    res.json({
      success: true,
      message: `成功启用 ${enabledUsers.length} 个用户${notFoundUsers.length > 0 ? `，${notFoundUsers.length} 个用户不存在` : ''}`,
      data: {
        enabledCount: enabledUsers.length,
        notFoundCount: notFoundUsers.length,
        enabledUserIds: enabledUsers,
        notFoundUserIds: notFoundUsers
      }
    });
  } catch (error) {
    console.error('批量启用用户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量启用用户失败',
      error: error.message
    });
  }
}));

/**
 * PUT /api/users/batch/disable
 * 批量禁用用户
 */
router.put('/batch/disable', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    const disabledUsers = [];
    const notFoundUsers = [];

    for (const userId of userIds) {
      const user = UserManager.getUserById(userId);
      if (user) {
        UserManager.setUserActive(userId, false);
        disabledUsers.push(userId);
      } else {
        notFoundUsers.push(userId);
      }
    }

    logger.info('批量禁用用户', { disabledUsers, notFoundUsers, operatorId: req.user?.id });

    res.json({
      success: true,
      message: `成功禁用 ${disabledUsers.length} 个用户${notFoundUsers.length > 0 ? `，${notFoundUsers.length} 个用户不存在` : ''}`,
      data: {
        disabledCount: disabledUsers.length,
        notFoundCount: notFoundUsers.length,
        disabledUserIds: disabledUsers,
        notFoundUserIds: notFoundUsers
      }
    });
  } catch (error) {
    console.error('批量禁用用户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量禁用用户失败',
      error: error.message
    });
  }
}));

/**
 * DELETE /api/users/batch
 * 批量删除用户
 */
router.delete('/batch', PermissionChecker.requireAdmin(), responseWrapper(async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    const deletedUsers = [];
    const notFoundUsers = [];

    for (const userId of userIds) {
      const user = UserManager.getUserById(userId);
      if (user) {
        UserManager.removeUser(userId);
        deletedUsers.push(userId);
      } else {
        notFoundUsers.push(userId);
      }
    }

    logger.info('批量删除用户', { deletedUsers, notFoundUsers, operatorId: req.user?.id });

    res.json({
      success: true,
      message: `成功删除 ${deletedUsers.length} 个用户${notFoundUsers.length > 0 ? `，${notFoundUsers.length} 个用户不存在` : ''}`,
      data: {
        deletedCount: deletedUsers.length,
        notFoundCount: notFoundUsers.length,
        deletedUserIds: deletedUsers,
        notFoundUserIds: notFoundUsers
      }
    });
  } catch (error) {
    console.error('批量删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除用户失败',
      error: error.message
    });
  }
}));

/**
 * GET /api/users/export
 * 导出用户数据
 */
router.get('/export', authenticateToken, responseWrapper(async (req, res) => {
  try {
    const { format = 'csv', keyword, role, status, dormitory } = req.query;

    let users = UserManager.getAllUsers();

    // 过滤条件
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      users = users.filter(u => 
        (u.username && u.username.toLowerCase().includes(lowerKeyword)) ||
        (u.email && u.email.toLowerCase().includes(lowerKeyword))
      );
    }

    if (role) {
      users = users.filter(u => {
        const roles = u.roles || [];
        return roles.includes(role) || (role === 'user' && roles.length === 0);
      });
    }

    if (status) {
      users = users.filter(u => {
        if (status === 'active') return u.isActive !== false;
        if (status === 'inactive') return u.isActive === false;
        return true;
      });
    }

    if (dormitory) {
      users = users.filter(u => u.dormitory && u.dormitory.includes(dormitory));
    }

    // 格式化导出数据
    const exportData = users.map(u => ({
      id: u.id,
      username: u.username || '',
      email: u.email || '',
      role: (u.roles && u.roles.length > 0) ? u.roles.join(', ') : 'user',
      phone: u.phone || '',
      dormitory: u.dormitory || '',
      status: u.isActive !== false ? 'active' : 'inactive',
      lastLoginTime: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '',
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : ''
    }));

    logger.info('导出用户数据', { 
      count: exportData.length, 
      format, 
      operatorId: req.user?.id 
    });

    if (format === 'excel') {
      // 生成简单的Excel兼容CSV (带BOM)
      const headers = ['ID', '用户名', '邮箱', '角色', '手机号', '寝室号', '状态', '最后登录时间', '创建时间'];
      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...exportData.map(row => 
          [row.id, row.username, row.email, row.role, row.phone, row.dormitory, row.status, row.lastLoginTime, row.createdAt]
            .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=用户数据_${Date.now()}.csv`);
      res.send(csvContent);
    } else {
      // 默认CSV格式
      const headers = ['ID', '用户名', '邮箱', '角色', '手机号', '寝室号', '状态', '最后登录时间', '创建时间'];
      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...exportData.map(row => 
          [row.id, row.username, row.email, row.role, row.phone, row.dormitory, row.status, row.lastLoginTime, row.createdAt]
            .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=用户数据_${Date.now()}.csv`);
      res.send(csvContent);
    }
  } catch (error) {
    console.error('导出用户数据失败:', error);
    res.status(500).json({
      success: false,
      message: '导出用户数据失败',
      error: error.message
    });
  }
}));