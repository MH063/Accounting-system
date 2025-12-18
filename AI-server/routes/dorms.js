/**
 * 宿舍管理路由
 * 提供宿舍相关接口
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandling');
const { responseWrapper } = require('../middleware/response');
const DormController = require('../controllers/DormController');
const DormInviteController = require('../controllers/DormInviteController');

const router = express.Router();
const dormController = new DormController();
const dormInviteController = new DormInviteController();

/**
 * 获取宿舍列表路由
 * GET /api/dorms
 * 需要有效的JWT令牌才能访问
 */
router.get('/', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormList(req, res);
  }))
);

/**
 * 创建宿舍路由
 * POST /api/dorms
 * 需要有效的JWT令牌才能访问
 */
router.post('/', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.createDorm(req, res);
  }))
);

/**
 * 获取宿舍详情路由
 * GET /api/dorms/:id
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormById(req, res);
  }))
);

/**
 * 更新宿舍信息路由
 * PUT /api/dorms/:id
 * 需要有效的JWT令牌才能访问
 */
router.put('/:id', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.updateDorm(req, res);
  }))
);

/**
 * 删除宿舍路由
 * DELETE /api/dorms/:id
 * 需要有效的JWT令牌才能访问
 */
router.delete('/:id', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.deleteDorm(req, res);
  }))
);

/**
 * 邀请成员到宿舍路由
 * POST /api/dorms/:dormId/invite
 * 需要有效的JWT令牌和邀请权限
 */
router.post('/:dormId/invite', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormInviteController.inviteMember(req, res);
  }))
);

/**
 * 更新宿舍成员角色路由
 * PUT /api/dorms/members/:id/role
 * 需要有效的JWT令牌和相应权限
 */
router.put('/members/:id/role', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.updateMemberRole(req, res);
  }))
);

module.exports = router;