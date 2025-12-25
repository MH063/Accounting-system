/**
 * 账户管理路由
 * 提供账户锁定、解锁等账户状态管理功能
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const logger = require('../config/logger');

const router = express.Router();

/**
 * 解锁账户
 * POST /api/accounts/:id/unlock
 * 需要有效的JWT令牌才能访问
 */
router.post('/:id/unlock', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    try {
      const { pool } = require('../config/database');
      const userId = parseInt(req.params.id);
      const currentUserId = req.user.id;
      
      logger.info('[AccountsRoute] 解锁账户请求', { 
        userId, 
        currentUserId 
      });

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '无效的用户ID'
        });
      }

      const result = await pool.query(
        `UPDATE users 
         SET failed_login_attempts = 0, 
             locked_until = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, username, email, status`,
        [userId]
      );

      if (result.rowCount === 0) {
        logger.warn('[AccountsRoute] 用户不存在', { userId });
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const user = result.rows[0];

      logger.info('[AccountsRoute] 账户解锁成功', { 
        userId, 
        username: user.username,
        operatorId: currentUserId 
      });

      res.json({
        success: true,
        message: '账户解锁成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status
          }
        }
      });
    } catch (error) {
      logger.error('[AccountsRoute] 解锁账户失败', { 
        error: error.message,
        userId: req.params.id 
      });
      next(error);
    }
  }))
);

/**
 * 锁定账户
 * POST /api/accounts/:id/lock
 * 需要有效的JWT令牌才能访问
 */
router.post('/:id/lock', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    try {
      const { pool } = require('../config/database');
      const userId = parseInt(req.params.id);
      const currentUserId = req.user.id;
      const { lockDuration = 30 } = req.body; // 锁定时长（分钟），默认30分钟
      
      logger.info('[AccountsRoute] 锁定账户请求', { 
        userId, 
        currentUserId,
        lockDuration 
      });

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '无效的用户ID'
        });
      }

      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + lockDuration);

      const result = await pool.query(
        `UPDATE users 
         SET locked_until = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, username, email, status`,
        [lockUntil, userId]
      );

      if (result.rowCount === 0) {
        logger.warn('[AccountsRoute] 用户不存在', { userId });
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const user = result.rows[0];

      logger.info('[AccountsRoute] 账户锁定成功', { 
        userId, 
        username: user.username,
        operatorId: currentUserId,
        lockUntil 
      });

      res.json({
        success: true,
        message: '账户锁定成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status
          },
          lockUntil
        }
      });
    } catch (error) {
      logger.error('[AccountsRoute] 锁定账户失败', { 
        error: error.message,
        userId: req.params.id 
      });
      next(error);
    }
  }))
);

/**
 * 获取账户状态
 * GET /api/accounts/:id/status
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res, next) => {
    try {
      const { pool } = require('../config/database');
      const userId = parseInt(req.params.id);
      
      logger.info('[AccountsRoute] 获取账户状态请求', { userId });

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '无效的用户ID'
        });
      }

      const result = await pool.query(
        `SELECT id, username, email, status, 
                failed_login_attempts, locked_until,
                last_login_at, created_at
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (result.rowCount === 0) {
        logger.warn('[AccountsRoute] 用户不存在', { userId });
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const user = result.rows[0];
      const now = new Date();
      const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;
      const isLocked = lockedUntil && lockedUntil > now;
      const remainingTime = isLocked ? Math.ceil((lockedUntil - now) / 1000) : 0;

      logger.info('[AccountsRoute] 获取账户状态成功', { 
        userId, 
        username: user.username,
        isLocked 
      });

      res.json({
        success: true,
        message: '获取账户状态成功',
        data: {
          status: {
            id: user.id,
            username: user.username,
            email: user.email,
            isLocked,
            lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
            remainingTime,
            failedLoginAttempts: user.failed_login_attempts || 0,
            status: user.status,
            lastLoginAt: user.last_login_at,
            createdAt: user.created_at
          }
        }
      });
    } catch (error) {
      logger.error('[AccountsRoute] 获取账户状态失败', { 
        error: error.message,
        userId: req.params.id 
      });
      next(error);
    }
  }))
);

module.exports = router;
