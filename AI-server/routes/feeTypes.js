/**
 * 费用类型管理路由模块
 * 定义费用类型管理相关的API接口
 */

const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');

const categoryController = new CategoryController();

/**
 * 费用类型列表接口 - GET方法
 * 路由: /api/fee-types
 * 支持分页、搜索、筛选、排序
 */
router.get('/', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.getFeeTypes(req, res, next);
  }))
);

/**
 * 费用类型详情接口 - GET方法
 * 路由: /api/fee-types/:id
 */
router.get('/:id', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.getFeeTypeDetail(req, res, next);
  }))
);

/**
 * 创建费用类型接口 - POST方法
 * 路由: /api/fee-types
 * 需要身份认证
 */
router.post('/', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.createFeeType(req, res, next);
  }))
);

/**
 * 更新费用类型接口 - PUT方法
 * 路由: /api/fee-types/:id
 * 需要身份认证
 */
router.put('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.updateFeeType(req, res, next);
  }))
);

/**
 * 删除费用类型接口 - DELETE方法
 * 路由: /api/fee-types/:id
 * 需要身份认证
 */
router.delete('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.deleteFeeType(req, res, next);
  }))
);

/**
 * 更新费用类型状态接口 - PUT方法
 * 路由: /api/fee-types/:id/status
 * 需要身份认证
 */
router.put('/:id/status', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.updateFeeTypeStatus(req, res, next);
  }))
);

module.exports = router;
