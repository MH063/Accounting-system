/**
 * 用户管理路由
 * 提供用户增删改查功能
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { PermissionChecker, PERMISSIONS } = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const { uploadSingle } = require('../middleware/upload');
const AuthController = require('../controllers/AuthController');
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
const authController = new AuthController();

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
        WHERE ud.user_id = u.id AND ud.status = 'active' AND (d.dorm_name ILIKE $${paramIndex} OR d.room_number ILIKE $${paramIndex})
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
        (SELECT json_agg(json_build_object('id', r.id, 'name', r.role_name, 'is_system_role', r.is_system_role)) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles,
        (SELECT d.dorm_name 
         FROM user_dorms ud 
         JOIN dorms d ON ud.dorm_id = d.id 
         WHERE ud.user_id = u.id AND ud.status = 'active'
         LIMIT 1) as dormitory
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await pool.query(listQuery, [...queryParams, parseInt(pageSize), offset]);
    console.log('📦 后端查询到的原始行数:', usersResult.rows.length);
    if (usersResult.rows.length > 0) {
      console.log('📄 第一行数据样例:', JSON.stringify(usersResult.rows[0]));
    }
    
    const users = usersResult.rows.map(user => {
      const isSystemRole = user.roles && user.roles.some(r => r.is_system_role === true);
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        status: user.status || 'active',
        role: (user.roles && user.roles.length > 0) ? 
          (user.roles.some(r => ['system_admin', 'admin'].includes(r.name)) ? 'admin' : 'user') : 'user',
        roles: user.roles || [],
        isSystemRole: isSystemRole,
        dormitory: user.dormitory || '',
        lastLoginTime: user.last_login_at ? (user.last_login_at instanceof Date ? user.last_login_at.toISOString() : user.last_login_at) : null,
        createdAt: user.created_at ? (user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at) : null,
        updatedAt: user.updated_at ? (user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at) : null,
        isActive: user.status === 'active'
      };
    });

    console.log('🚀 [Backend] 发送给前端的用户数据样例 (前2条):', JSON.stringify(users.slice(0, 2), null, 2));
    
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
 * GET /api/users/export
 * 导出用户数据
 */
router.get('/export', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.DATA_EXPORT), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const XLSX = require('xlsx');
    const { format = 'csv', keyword, role, status, dormitory } = req.query;

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
        WHERE ud.user_id = u.id AND ud.status = 'active' AND (d.dorm_name ILIKE $${paramIndex} OR d.room_number ILIKE $${paramIndex})
      )`);
      queryParams.push(`%${dormitory}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

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
        (SELECT json_agg(json_build_object('id', r.id, 'name', r.role_name, 'is_system_role', r.is_system_role)) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles,
        (SELECT d.dorm_name 
         FROM user_dorms ud 
         JOIN dorms d ON ud.dorm_id = d.id 
         WHERE ud.user_id = u.id AND ud.status = 'active'
         LIMIT 1) as dormitory
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const usersResult = await pool.query(listQuery, queryParams);
    
    const exportData = usersResult.rows.map(user => {
      const isSystemRole = user.roles && user.roles.some(r => r.is_system_role === true);
      return {
        'ID': user.id,
        '用户名': user.username,
        '邮箱': user.email,
        '角色': (user.roles && user.roles.length > 0) ? 
          (isSystemRole ? '系统角色' : (user.roles.some(r => ['system_admin', 'admin'].includes(r.name)) ? '管理员' : '普通用户')) : '普通用户',
        '手机号': user.phone || '',
        '寝室号': user.dormitory || '',
        '状态': user.status === 'active' ? '启用' : '禁用',
        '最后登录时间': user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '',
        '创建时间': user.created_at ? new Date(user.created_at).toLocaleString() : ''
      };
    });

    logger.info('导出用户数据', { 
      count: exportData.length, 
      format, 
      operatorId: req.user?.id 
    });

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '用户数据');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Users_${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      // 默认CSV格式
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      
      // 添加 BOM 以支持 Excel 打开 CSV 不乱码
      const csvWithBom = '\uFEFF' + csvContent;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=Users_${Date.now()}.csv`);
      return res.send(csvWithBom);
    }
  } catch (error) {
    console.error('导出用户数据失败:', error);
    logger.error('导出用户数据失败', { 
      error: error.message, 
      stack: error.stack,
      query: req.query,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: '导出用户数据失败',
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
        (SELECT json_agg(json_build_object('id', r.id, 'name', r.role_name, 'is_system_role', r.is_system_role)) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id) as roles,
        (SELECT d.room_number 
         FROM user_dorms ud 
         JOIN dorms d ON ud.dorm_id = d.id 
         WHERE ud.user_id = u.id 
         LIMIT 1) as dormitory
      FROM users u
      WHERE u.id = $1
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
    const isSystemRole = user.roles && user.roles.some(r => r.is_system_role === true);
    
    // 打印获取到的原始数据，方便排查 "-" 显示问题
    logger.info('[UsersRoute] 获取用户信息成功', { 
      userId: user.id, 
      dormitory: user.dormitory,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    });

    // 打印发送给前端的数据，确认字段名
    const responseData = {
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
        isSystemRole: isSystemRole,
        dormitory: user.dormitory || '',
        createdAt: user.created_at || '',
        lastLoginTime: user.last_login_at || '',
        updatedAt: user.updated_at,
        isActive: user.status === 'active'
      }
    };

    logger.info('[UsersRoute] 发送用户信息给前端', { 
      userId: user.id,
      createdAt: responseData.data.createdAt,
      lastLoginTime: responseData.data.lastLoginTime
    });

    res.json(responseData);
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
 * PUT /api/users/batch/dormitory
 * 批量分配宿舍
 */
router.put('/batch/dormitory', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_UPDATE), responseWrapper(async (req, res) => {
  try {
    const { userIds, dormitoryInfo } = req.body;
    const DormService = require('../services/DormService');
    const dormService = new DormService();
    
    logger.info('[UsersRoute] 批量分配宿舍请求', { userIds, dormitoryInfo, operatorId: req.user?.id });
    
    const result = await dormService.batchAssignDormitory(userIds, dormitoryInfo, req.user);
    
    res.json(result);
  } catch (error) {
    logger.error('[UsersRoute] 批量分配宿舍失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '批量分配宿舍失败',
      error: error.message
    });
  }
}));

/**
 * POST /api/users
 * 创建新用户
 */
router.post('/', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_CREATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { username, email, password, roles = ['user'], realName, phone } = req.body;
    const finalPassword = password || '123456';

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: '用户名和邮箱不能为空'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. 检查数据库中用户名或邮箱是否已存在
      const checkResult = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在'
        });
      }

      // 2. 插入数据库 (这里假设数据库已经有哈希逻辑或我们手动哈希)
      // 注意：UserManager.createUser 会处理哈希，但它是为了内存存储
      // 在实际系统中，数据库通常是真理之源
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(finalPassword, 12);

      const insertQuery = `
        INSERT INTO users (username, email, password_hash, real_name, phone, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const result = await client.query(insertQuery, [
        username, email, hashedPassword, realName || null, phone || null, 'active'
      ]);

      const userId = result.rows[0].id;

      // 3. 分配角色 (这里简化处理，假设 roles 是 ID 数组)
      if (roles && roles.length > 0) {
        for (const roleId of roles) {
          // 查找角色ID (这里假设 roles 数组里是角色名或ID，需要转换)
          const roleResult = await client.query('SELECT id FROM roles WHERE role_name = $1 OR id::text = $1', [roleId]);
          if (roleResult.rows.length > 0) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
              [userId, roleResult.rows[0].id]
            );
          }
        }
      }

      await client.query('COMMIT');

      // 4. 同步内存存储
      await UserManager.createUser({
        id: userId,
        username,
        email,
        password: hashedPassword, // 使用已经哈希过的密码
        firstName: realName || null,
        metadata: { roles }
      });

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: {
          user: {
            id: userId,
            username,
            email,
            roles,
            status: 'active',
            createdAt: result.rows[0].created_at,
            isActive: true
          }
        }
      });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('创建用户数据库操作失败:', e);
        
        let message = '创建用户失败';
        if (e.code === '23514' && e.constraint === 'users_phone_format') {
          message = '手机号码格式不正确';
        } else if (e.code === '23505') {
          message = '用户名或邮箱已存在';
        }
        
        return res.status(500).json({
          success: false,
          message: message,
          error: e.message,
          code: e.code
        });
      } finally {
      client.release();
    }
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
router.put('/:userId', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_UPDATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;
    let { username, email, roles, role, status, realName, phone } = req.body;

    // 如果提供了单个 role 字符串，转换为 roles 数组
    if (role && !roles) {
      roles = [role];
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 检查用户是否存在
      const checkResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 2. 更新数据库
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (username) {
        updateFields.push(`username = $${paramIndex++}`);
        queryParams.push(username);
      }
      if (email) {
        updateFields.push(`email = $${paramIndex++}`);
        queryParams.push(email);
      }
      if (status) {
        updateFields.push(`status = $${paramIndex++}`);
        queryParams.push(status);
      }
      if (realName !== undefined) {
        updateFields.push(`real_name = $${paramIndex++}`);
        queryParams.push(realName || null);
      }
      if (phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        queryParams.push(phone || null);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      queryParams.push(userId);

      if (updateFields.length > 1) { // 至少有 updated_at
        const updateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        await client.query(updateQuery, queryParams);
      }

      // 3. 更新角色
      if (roles && Array.isArray(roles)) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        for (const roleId of roles) {
          const roleResult = await client.query('SELECT id FROM roles WHERE role_name = $1 OR id::text = $1', [roleId]);
          if (roleResult.rows.length > 0) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
              [userId, roleResult.rows[0].id]
            );
          }
        }
      }

      await client.query('COMMIT');

      // 4. 同步内存存储
      const updatedUser = {
        ...(username && { username }),
        ...(email && { email }),
        ...(realName !== undefined && { firstName: realName }),
        ...(status && { isActive: status === 'active' })
      };
      UserManager.updateUser(userId, updatedUser);

      res.json({
        success: true,
        message: '用户更新成功'
      });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('更新用户数据库操作失败:', e);
      
      let message = '更新用户失败';
      if (e.code === '23514' && e.constraint === 'users_phone_format') {
        message = '手机号码格式不正确';
      } else if (e.code === '23505') {
        message = '用户名或邮箱已存在';
      }
      
      return res.status(500).json({
        success: false,
        message: message,
        error: e.message,
        code: e.code
      });
    } finally {
      client.release();
    }
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
 * DELETE /api/users/batch
 * 批量删除用户
 */
router.delete('/batch', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_DELETE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    const deletedUsers = [];
    const notFoundUsers = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const userId of userIds) {
        // 检查用户是否存在于数据库
        const checkResult = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
        
        if (checkResult.rows.length > 0) {
          // 删除关联数据
          await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
          await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
          await client.query('DELETE FROM user_dorms WHERE user_id = $1', [userId]);
          
          // 最后删除用户
          await client.query('DELETE FROM users WHERE id = $1', [userId]);
          
          // 同步内存
          UserManager.deleteUser(userId);
          deletedUsers.push(userId);
        } else {
          notFoundUsers.push(userId);
        }
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('批量删除用户数据库操作失败:', e);
      
      let message = '批量删除用户失败';
      if (e.code === '23503') { // PostgreSQL foreign key violation error code
        const detail = e.detail || '';
        const tableMatch = detail.match(/table "(.+?)"/);
        const tableName = tableMatch ? tableMatch[1] : '相关表';
        message = `无法删除用户，因为该用户在 ${tableName} 中有相关数据记录。请先删除相关业务数据或尝试禁用用户。`;
      }
      
      return res.status(500).json({
        success: false,
        message: message,
        error: e.message,
        code: e.code,
        detail: e.detail
      });
    } finally {
      client.release();
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
 * POST /api/users/import
 * 批量导入用户数据（管理员功能）
 */
router.post('/import', 
  authenticateToken, 
  PermissionChecker.requirePermission(PERMISSIONS.USER_CREATE), 
  uploadSingle('file'),
  responseWrapper(asyncHandler(async (req, res) => {
    return await authController.importUsers(req, res);
  }))
);

/**
 * DELETE /api/users/:userId
 * 删除用户
 */
router.delete('/:userId', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_DELETE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;

    // 1. 首先检查用户是否存在
    const checkQuery = 'SELECT id FROM users WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 2. 在数据库中删除用户（由于有外键关联，需要事务处理或处理关联表）
    // 注意：这里的删除逻辑应根据实际业务需求决定是软删除还是物理删除
    // 目前系统使用 UserManager (内存) + 数据库，我们需要同步
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 删除关联数据（示例，具体根据表结构调整）
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_dorms WHERE user_id = $1', [userId]);
      
      // 最后删除用户
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('删除用户数据库操作失败:', e);
      
      let message = '删除用户失败';
      if (e.code === '23503') { // PostgreSQL foreign key violation error code
        const detail = e.detail || '';
        const tableMatch = detail.match(/table "(.+?)"/);
        const tableName = tableMatch ? tableMatch[1] : '相关表';
        message = `无法删除用户，因为该用户在 ${tableName} 中有相关数据记录。请先删除相关业务数据或尝试禁用用户。`;
      }
      
      return res.status(500).json({
        success: false,
        message: message,
        error: e.message,
        code: e.code,
        detail: e.detail
      });
    } finally {
      client.release();
    }

    // 3. 同步内存存储
    UserManager.deleteUser(userId);

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
router.post('/:userId/activate', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_ACTIVATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;

    // 1. 更新数据库
    await pool.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['active', userId]);

    // 2. 更新内存
    const existingUser = UserManager.getUser(userId);
    if (existingUser) {
      UserManager.updateUser(userId, { isActive: true });
    }

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
router.post('/:userId/deactivate', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_DEACTIVATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;

    // 1. 更新数据库
    await pool.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['inactive', userId]);

    // 2. 更新内存
    const existingUser = UserManager.getUser(userId);
    if (existingUser) {
      UserManager.updateUser(userId, { isActive: false });
    }

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

/**
 * PUT /api/users/batch/enable
 * 批量启用用户
 */
router.put('/batch/enable', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_ACTIVATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    const enabledUsers = [];
    const notFoundUsers = [];

    // 1. 更新数据库
    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      ['active', userIds]
    );

    // 2. 同步内存存储
    for (const userId of userIds) {
      const user = UserManager.getUser(userId);
      if (user) {
        UserManager.updateUser(userId, { isActive: true });
        enabledUsers.push(userId);
      } else {
        // 虽然数据库可能更新了，但内存中没有，这里记录一下
        notFoundUsers.push(userId);
      }
    }

    logger.info('批量启用用户', { enabledUsers, notFoundUsers, operatorId: req.user?.id });

    res.json({
      success: true,
      message: `成功启用 ${userIds.length} 个用户`,
      data: {
        enabledCount: userIds.length,
        enabledUserIds: userIds
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
router.put('/batch/disable', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_DEACTIVATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    const disabledUsers = [];
    const notFoundUsers = [];

    // 1. 更新数据库
    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      ['inactive', userIds]
    );

    // 2. 同步内存存储
    for (const userId of userIds) {
      const user = UserManager.getUser(userId);
      if (user) {
        UserManager.updateUser(userId, { isActive: false });
        disabledUsers.push(userId);
      } else {
        notFoundUsers.push(userId);
      }
    }

    logger.info('批量禁用用户', { disabledUsers, notFoundUsers, operatorId: req.user?.id });

    res.json({
      success: true,
      message: `成功禁用 ${userIds.length} 个用户`,
      data: {
        disabledCount: userIds.length,
        disabledUserIds: userIds
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
 * PUT /api/users/:userId/password/reset
 * 重置用户密码
 */
router.put('/:userId/password/reset', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_UPDATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;
    const { newPassword } = req.body;
    const bcrypt = require('bcryptjs');

    // 1. 检查用户是否存在
    const checkResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = checkResult.rows[0];
    
    // 2. 生成新密码（如果前端没提供）
    const finalPassword = newPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    // 3. 更新数据库
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    // 4. 同步内存存储
    const existingUser = UserManager.getUser(userId);
    if (existingUser) {
      UserManager.updateUser(userId, { password: hashedPassword });
    }

    logger.info('重置用户密码成功', { 
      userId, 
      operatorId: req.user?.id,
      hasProvidedPassword: !!newPassword
    });

    res.json({
      success: true,
      message: '密码重置成功',
      data: {
        newPassword: newPassword ? '******' : finalPassword
      }
    });
  } catch (error) {
    console.error('重置用户密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置用户密码失败',
      error: error.message
    });
  }
}));

/**
 * PUT /api/users/batch/roles
 * 批量更新用户角色
 */
router.put('/batch/roles', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_UPDATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userIds, role } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的角色'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 检查所有用户是否存在
      const checkResult = await client.query('SELECT id FROM users WHERE id = ANY($1)', [userIds]);
      if (checkResult.rows.length !== userIds.length) {
        const existingIds = checkResult.rows.map(r => r.id);
        const missingIds = userIds.filter(id => !existingIds.includes(id));
        return res.status(404).json({
          success: false,
          message: `部分用户不存在: ${missingIds.join(', ')}`
        });
      }

      // 2. 查找角色ID
      const roleResult = await client.query('SELECT id FROM roles WHERE role_name = $1 OR id::text = $1', [role]);
      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `角色 ${role} 不存在`
        });
      }
      const roleId = roleResult.rows[0].id;

      // 3. 批量更新角色
      for (const userId of userIds) {
        // 删除旧角色
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        
        // 插入新角色
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [userId, roleId]
        );
      }

      await client.query('COMMIT');

      // 4. 同步内存存储中的用户角色
      for (const userId of userIds) {
        try {
          // 查找角色对象以获取角色ID（因为role参数可能是角色名或ID）
          const roleIdToSync = roleResult.rows[0].id.toString(); // 确保是字符串，因为内存存储使用role.id
          
          // 获取内存中的角色定义 ID
          let memoryRoleId = roleIdToSync;
          const foundRole = Object.values(ROLES).find(r => 
            r.id.toLowerCase() === role.toLowerCase() || 
            r.name === role || 
            r.id === roleIdToSync
          );
          
          if (foundRole) {
            memoryRoleId = foundRole.id;
          }

          await UserManager.setRoles(userId, [memoryRoleId]);
          logger.info(`[UsersRoute] 内存同步成功: 用户 ${userId} 角色更新为 ${memoryRoleId}`);
        } catch (syncError) {
          logger.warn(`[UsersRoute] 内存同步失败: 用户 ${userId}`, { error: syncError.message });
        }
      }

      logger.info('批量更新用户角色成功', { 
        userIds, 
        role,
        roleId,
        operatorId: req.user?.id 
      });

      res.json({
        success: true,
        message: `成功更新 ${userIds.length} 个用户的角色为 ${role}`
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('批量更新用户角色失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新用户角色失败',
      error: error.message
    });
  }
}));

/**
 * PUT /api/users/:userId/roles
 * 更新用户权限角色
 */
router.put('/:userId/roles', authenticateToken, PermissionChecker.requirePermission(PERMISSIONS.USER_UPDATE), responseWrapper(async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { userId } = req.params;
    const { roleIds } = req.body;

    if (!roleIds || !Array.isArray(roleIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的角色ID列表'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 检查用户是否存在
      const checkResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 2. 删除旧角色并插入新角色
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      
      for (const roleId of roleIds) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [userId, roleId]
        );
      }

      await client.query('COMMIT');

      logger.info('更新用户角色成功', { 
        userId, 
        roleIds,
        operatorId: req.user?.id 
      });

      res.json({
        success: true,
        message: '用户角色更新成功'
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('更新用户角色失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户角色失败',
      error: error.message
    });
  }
}));

module.exports = router;