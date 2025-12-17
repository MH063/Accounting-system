/**
 * 宿舍管理路由
 * 提供宿舍相关接口
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandling');
const { responseWrapper } = require('../middleware/response');
const DormController = require('../controllers/DormController');

const router = express.Router();
const dormController = new DormController();

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

module.exports = router;