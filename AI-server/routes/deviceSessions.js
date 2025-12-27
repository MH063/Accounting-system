/**
 * 设备会话路由
 * 提供用户登录设备会话的查询和撤销功能
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');
const deviceSessionController = require('../controllers/DeviceSessionController');

const router = express.Router();

/**
 * 获取当前用户的所有活跃设备会话
 * GET /api/device-sessions
 */
router.get('/', 
  authenticateToken, 
  responseWrapper(asyncHandler((req, res, next) => deviceSessionController.getSessions(req, res, next)))
);

/**
 * 撤销除当前会话外的所有设备会话
 * DELETE /api/device-sessions/other
 * 注意：此路由必须在 /:id 路由之前，否则 "other" 会被当作 ID 参数
 */
router.delete('/other', 
  authenticateToken, 
  responseWrapper(asyncHandler((req, res, next) => deviceSessionController.revokeOtherSessions(req, res, next)))
);

/**
 * 撤销指定的设备会话
 * DELETE /api/device-sessions/:id
 */
router.delete('/:id', 
  authenticateToken, 
  responseWrapper(asyncHandler((req, res, next) => deviceSessionController.revokeSession(req, res, next)))
);

module.exports = router;
