/**
 * 分类路由模块
 * 定义分类相关的API接口
 */

const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');

const categoryController = new CategoryController();

/**
 * 分类列表接口 - GET方法
 * 路由: /api/categories
 */
router.get('/', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.getCategories(req, res, next);
  }))
);

/**
 * 活跃分类列表接口 - GET方法
 * 路由: /api/categories/active
 */
router.get('/active', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.getActiveCategories(req, res, next);
  }))
);

/**
 * 分类详情接口 - GET方法
 * 路由: /api/categories/:id
 */
router.get('/:id', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.getCategoryDetail(req, res, next);
  }))
);

/**
 * 创建分类接口 - POST方法
 * 路由: /api/categories
 * 需要身份认证
 */
router.post('/', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.createCategory(req, res, next);
  }))
);

/**
 * 更新分类接口 - PUT方法
 * 路由: /api/categories/:id
 * 需要身份认证
 */
router.put('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.updateCategory(req, res, next);
  }))
);

/**
 * 删除分类接口 - DELETE方法
 * 路由: /api/categories/:id
 * 需要身份认证
 */
router.delete('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.deleteCategory(req, res, next);
  }))
);

/**
 * 分类使用统计接口 - GET方法
 * 路由: /api/categories/statistics
 */
router.get('/statistics', 
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await categoryController.getCategoryStatistics(req, res, next);
  }))
);

module.exports = router;