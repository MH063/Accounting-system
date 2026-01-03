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
 * 获取楼栋列表路由
 * GET /api/dorms/buildings
 */
router.get('/buildings', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getBuildings(req, res);
  }))
);

/**
 * 获取宿舍统计信息路由
 * GET /api/dorms/stats
 */
router.get('/stats', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormStats(req, res);
  }))
);

/**
 * 批量删除宿舍路由
 * POST /api/dorms/batch-delete
 */
router.post('/batch-delete', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.batchDeleteDorms(req, res);
  }))
);

/**
 * 批量更新宿舍状态路由
 * POST /api/dorms/batch-update-status
 */
router.post('/batch-update-status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.batchUpdateDormStatus(req, res);
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
 * 更新宿舍状态路由
 * PATCH /api/dorms/:id/status
 * 需要有效的JWT令牌才能访问
 */
router.patch('/:id/status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.updateDormStatus(req, res);
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

/**
 * 获取待审核成员列表路由
 * GET /api/dorms/members/pending
 * 需要有效的JWT令牌才能访问
 */
router.get('/members/pending', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getPendingMembers(req, res);
  }))
);

/**
 * 更新宿舍成员状态路由
 * PUT /api/dorms/members/:id/status
 * 需要有效的JWT令牌才能访问
 */
router.put('/members/:id/status', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.updateMemberStatus(req, res);
  }))
);

/**
 * 删除宿舍成员路由
 * DELETE /api/dorms/members/:id
 * 需要有效的JWT令牌才能访问
 */
router.delete('/members/:id', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.removeMember(req, res);
  }))
);

/**
 * 获取寝室设置路由
 * GET /api/dorms/:id/settings
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/settings', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormSettings(req, res);
  }))
);

/**
 * 更新寝室设置路由
 * PUT /api/dorms/:id/settings/update
 * 需要有效的JWT令牌才能访问
 */
router.put('/:id/settings/update', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.updateDormSettings(req, res);
  }))
);

/**
 * 获取寝室变更历史路由
 * GET /api/dorms/:id/history
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/history', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormHistory(req, res);
  }))
);

/**
 * 开始解散流程路由
 * POST /api/dorms/:id/dismiss/start
 * 需要有效的JWT令牌才能访问
 */
router.post('/:id/dismiss/start', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.startDismissProcess(req, res);
  }))
);

/**
 * 确认解散路由
 * POST /api/dorms/:id/dismiss/confirm
 * 需要有效的JWT令牌才能访问
 */
router.post('/:id/dismiss/confirm', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.confirmDismiss(req, res);
  }))
);

/**
 * 取消解散路由
 * POST /api/dorms/:id/dismiss/cancel
 * 需要有效的JWT令牌才能访问
 */
router.post('/:id/dismiss/cancel', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.cancelDismiss(req, res);
  }))
);

/**
 * 获取待结算费用路由
 * GET /api/dorms/:id/pending-fees
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/pending-fees', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getPendingFees(req, res);
  }))
);

/**
 * 获取寝室成员列表路由
 * GET /api/dorms/:id/members
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/members', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormMembers(req, res);
  }))
);

/**
 * 添加宿舍成员路由
 * POST /api/dorms/:id/members
 * 需要有效的JWT令牌才能访问
 */
router.post('/:id/members', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.addDormMember(req, res);
  }))
);

/**
 * 获取可添加用户列表路由
 * GET /api/dorms/:id/available-users
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/available-users', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getAvailableUsers(req, res);
  }))
);

/**
 * 获取宿舍费用统计摘要路由
 * GET /api/dorms/:id/fee-summary
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/fee-summary', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormFeeSummary(req, res);
  }))
);

/**
 * 获取宿舍维修记录路由
 * GET /api/dorms/:id/maintenance
 * 需要有效的JWT令牌才能访问
 */
router.get('/:id/maintenance', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getDormMaintenanceRecords(req, res);
  }))
);

/**
 * 获取用户所在的寝室信息路由
 * GET /api/dorms/users/:userId
 * 需要有效的JWT令牌才能访问
 */
router.get('/users/:userId', 
  authenticateToken, 
  responseWrapper(asyncHandler(async (req, res) => {
    return await dormController.getCurrentUserDorm(req, res);
  }))
);

module.exports = router;