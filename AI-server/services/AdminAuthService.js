/**
 * 管理员认证服务层
 * 处理管理员登录、认证相关的业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Admin, Role, Permission, AdminLoginLog } = require('../models');
const logger = require('../config/logger');
const { generateTokenPair } = require('../config/jwtManager');
const redisClient = require('../config/redis');

class AdminAuthService {
  constructor() {
    this.failedLoginAttempts = new Map(); // 登录失败记录（可替换为Redis）
    this.maxFailedAttempts = 5; // 最大失败尝试次数
    this.lockoutDuration = 15 * 60 * 1000; // 锁定时间：15分钟
  }

  /**
   * 管理员登录验证
   * @param {Object} loginData - 登录数据
   * @param {string} loginData.username - 用户名
   * @param {string} loginData.password - 密码
   * @returns {Object} 登录结果
   */
  async adminLogin({ username, password }) {
    try {
      // 1. 检查账户是否被锁定
      const lockoutInfo = this.failedLoginAttempts.get(username);
      if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
        const remainingTime = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / 1000);
        return {
          success: false,
          message: `账户已被锁定，请在 ${remainingTime} 秒后重试`
        };
      }

      // 2. 查找管理员用户
      const admin = await Admin.findOne({
        where: {
          [Op.or]: [
            { username: username },
            { email: username }
          ],
          status: 'active'
        },
        include: [
          {
            model: User,
            as: 'user',
            where: { status: 'active' },
            attributes: ['id', 'username', 'email', 'phone', 'avatar', 'status']
          },
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'code', 'description'],
            include: [{
              model: Permission,
              as: 'permissions',
              attributes: ['id', 'name', 'code', 'module']
            }]
          }
        ]
      });

      if (!admin) {
        return this.handleFailedLogin(username, '管理员账户不存在或已被禁用');
      }

      // 3. 验证密码
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return this.handleFailedLogin(username, '密码错误');
      }

      // 4. 生成令牌对
      const tokens = await generateTokenPair({
        userId: admin.user.id,
        username: admin.username,
        email: admin.email,
        role: admin.role ? [admin.role.code] : ['admin'],
        permissions: admin.role?.permissions?.map(p => p.code) || [],
        adminLevel: admin.adminLevel || 'admin',
        isAdmin: true
      });

      // 5. 记录登录日志
      await this.recordAdminLogin(admin.id, 'success', null);

      // 6. 更新最后登录时间
      await admin.update({ 
        lastLoginAt: new Date(),
        loginCount: (admin.loginCount || 0) + 1
      });

      // 7. 清除失败登录记录
      this.failedLoginAttempts.delete(username);

      // 8. 返回成功结果
      return {
        success: true,
        data: {
          user: {
            id: admin.user.id,
            username: admin.username,
            email: admin.email,
            phone: admin.phone,
            avatar: admin.user.avatar,
            role: admin.role ? [admin.role.code] : ['admin'],
            permissions: admin.role?.permissions?.map(p => p.code) || [],
            adminLevel: admin.adminLevel || 'admin',
            isAdmin: true
          },
          tokens
        }
      };

    } catch (error) {
      logger.error('[AdminAuthService] 管理员登录验证失败', { 
        error: error.message,
        stack: error.stack,
        username
      });
      
      return {
        success: false,
        message: '登录验证失败，请稍后重试'
      };
    }
  }

  /**
   * 处理登录失败
   */
  handleFailedLogin(username, reason) {
    const now = Date.now();
    const lockoutInfo = this.failedLoginAttempts.get(username) || {
      attempts: 0,
      lockedUntil: 0
    };

    lockoutInfo.attempts++;

    if (lockoutInfo.attempts >= this.maxFailedAttempts) {
      lockoutInfo.lockedUntil = now + this.lockoutDuration;
      this.failedLoginAttempts.set(username, lockoutInfo);
      
      logger.security('管理员账户被锁定', { 
        username,
        attempts: lockoutInfo.attempts,
        lockedUntil: new Date(lockoutInfo.lockedUntil).toISOString()
      });

      return {
        success: false,
        message: '账户已被锁定，请15分钟后再试'
      };
    }

    this.failedLoginAttempts.set(username, lockoutInfo);

    logger.auth('管理员登录失败', { 
      username,
      reason,
      attempts: lockoutInfo.attempts,
      remainingAttempts: this.maxFailedAttempts - lockoutInfo.attempts
    });

    return {
      success: false,
      message: `${reason}，还有 ${this.maxFailedAttempts - lockoutInfo.attempts} 次机会`
    };
  }

  /**
   * 记录管理员登录日志
   */
  async recordAdminLogin(adminId, status, errorMessage) {
    try {
      await AdminLoginLog.create({
        adminId,
        loginTime: new Date(),
        status,
        errorMessage,
        ipAddress: 'unknown', // 需要从请求中获取
        userAgent: 'unknown'   // 需要从请求中获取
      });
    } catch (error) {
      logger.error('[AdminAuthService] 记录管理员登录日志失败', { 
        error: error.message,
        adminId,
        status
      });
    }
  }

  /**
   * 获取管理员资料
   */
  async getAdminProfile(userId) {
    try {
      const admin = await Admin.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'phone', 'avatar', 'status', 'createdAt']
          },
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'code', 'description'],
            include: [{
              model: Permission,
              as: 'permissions',
              attributes: ['id', 'name', 'code', 'module', 'description']
            }]
          }
        ]
      });

      if (!admin) {
        return null;
      }

      return {
        id: admin.user.id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        avatar: admin.user.avatar,
        status: admin.status,
        role: admin.role ? {
          id: admin.role.id,
          name: admin.role.name,
          code: admin.role.code,
          description: admin.role.description,
          permissions: admin.role.permissions || []
        } : null,
        adminLevel: admin.adminLevel || 'admin',
        permissions: admin.role?.permissions?.map(p => p.code) || [],
        lastLoginAt: admin.lastLoginAt,
        loginCount: admin.loginCount || 0,
        createdAt: admin.user.createdAt
      };

    } catch (error) {
      logger.error('[AdminAuthService] 获取管理员资料失败', { 
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * 验证管理员权限
   */
  async validateAdminPermission(userId, permissionCode) {
    try {
      const admin = await Admin.findOne({
        where: { userId, status: 'active' },
        include: [
          {
            model: Role,
            as: 'role',
            include: [{
              model: Permission,
              as: 'permissions',
              where: { code: permissionCode }
            }]
          }
        ]
      });

      if (!admin) {
        return false;
      }

      // 超级管理员拥有所有权限
      if (admin.adminLevel === 'super_admin') {
        return true;
      }

      // 检查是否有指定权限
      return admin.role?.permissions?.length > 0;

    } catch (error) {
      logger.error('[AdminAuthService] 验证管理员权限失败', { 
        error: error.message,
        userId,
        permissionCode
      });
      return false;
    }
  }

  /**
   * 获取管理员权限列表
   */
  async getAdminPermissions(userId) {
    try {
      const admin = await Admin.findOne({
        where: { userId, status: 'active' },
        include: [
          {
            model: Role,
            as: 'role',
            include: [{
              model: Permission,
              as: 'permissions',
              attributes: ['id', 'name', 'code', 'module', 'description']
            }]
          }
        ]
      });

      if (!admin) {
        return [];
      }

      // 超级管理员返回所有权限
      if (admin.adminLevel === 'super_admin') {
        const allPermissions = await Permission.findAll({
          attributes: ['id', 'name', 'code', 'module', 'description']
        });
        return allPermissions;
      }

      return admin.role?.permissions || [];

    } catch (error) {
      logger.error('[AdminAuthService] 获取管理员权限列表失败', { 
        error: error.message,
        userId
      });
      return [];
    }
  }
}

module.exports = AdminAuthService;