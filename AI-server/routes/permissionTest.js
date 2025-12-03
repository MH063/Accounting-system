const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { PermissionChecker, PERMISSIONS, UserManager } = require('../config/permissions');
const { responseWrapper } = require('../middleware/response');

/**
 * @swagger
 * tags:
 *   name: PermissionTest
 *   description: 权限测试API
 */

/**
 * @swagger
 * /api/permission-test/current-user:
 *   get:
 *     tags: [PermissionTest]
 *     summary: 获取当前用户信息和权限
 *     description: 获取当前认证用户的信息、角色和权限列表
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get('/current-user', 
  authenticate,
  responseWrapper((req, res) => {
    try {
      const user = req.user;
      const roles = UserManager.getUserRoles(user.id);
      const permissions = UserManager.getUserPermissions(user.id);
      
      return res.json({
        success: true,
        message: '获取用户权限信息成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          roles: roles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
            level: role.level
          })),
          permissions: Array.from(permissions)
        }
      });
    } catch (error) {
      console.error('[PERMISSION-TEST] 获取用户权限信息失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取用户权限信息失败',
        error: error.message
      });
    }
  })
);

/**
 * @swagger
 * /api/permission-test/check-permission:
 *   post:
 *     tags: [PermissionTest]
 *     summary: 检查用户权限
 *     description: 检查当前用户是否具有指定权限
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *                 description: 权限标识符
 *     responses:
 *       200:
 *         description: 权限检查结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasPermission:
 *                       type: boolean
 *                     permission:
 *                       type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.post('/check-permission', 
  authenticate,
  responseWrapper(async (req, res) => {
    try {
      const { permission } = req.body;
      
      if (!permission) {
        return res.status(400).json({
          success: false,
          message: '缺少权限参数'
        });
      }
      
      const hasPermission = UserManager.hasPermission(req.user.id, permission);
      
      return res.json({
        success: true,
        message: '权限检查完成',
        data: {
          hasPermission,
          permission
        }
      });
    } catch (error) {
      console.error('[PERMISSION-TEST] 权限检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      });
    }
  })
);

/**
 * @swagger
 * /api/permission-test/admin-only:
 *   get:
 *     tags: [PermissionTest]
 *     summary: 管理员专用测试接口
 *     description: 仅管理员可以访问的测试接口
 *     responses:
 *       200:
 *         description: 访问成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/admin-only', 
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.ADMIN_FULL),
  responseWrapper((req, res) => {
    return res.json({
      success: true,
      message: '管理员权限验证成功',
      data: {
        userId: req.user.id,
        username: req.user.username,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * @swagger
 * /api/permission-test/dorm-leader-only:
 *   get:
 *     tags: [PermissionTest]
 *     summary: 寝室长专用测试接口
 *     description: 仅寝室长可以访问的测试接口
 *     responses:
 *       200:
 *         description: 访问成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/dorm-leader-only', 
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FINANCIAL_WRITE),
  responseWrapper((req, res) => {
    return res.json({
      success: true,
      message: '寝室长权限验证成功',
      data: {
        userId: req.user.id,
        username: req.user.username,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * @swagger
 * /api/permission-test/payer-only:
 *   get:
 *     tags: [PermissionTest]
 *     summary: 缴费人专用测试接口
 *     description: 仅缴费人可以访问的测试接口
 *     responses:
 *       200:
 *         description: 访问成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */
router.get('/payer-only', 
  authenticate,
  PermissionChecker.requirePermission(PERMISSIONS.FINANCIAL_APPROVE),
  responseWrapper((req, res) => {
    return res.json({
      success: true,
      message: '缴费人权限验证成功',
      data: {
        userId: req.user.id,
        username: req.user.username,
        timestamp: new Date().toISOString()
      }
    });
  })
);

module.exports = router;