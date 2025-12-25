/**
 * 联系人路由模块
 * 定义联系人相关的API接口
 */

const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/ContactController');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const { asyncHandler } = require('../middleware/errorHandling');

const contactController = new ContactController();

/**
 * 联系人列表接口 - GET方法
 * 路由: /api/contacts
 * 需要身份认证
 */
router.get('/', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await contactController.getContacts(req, res, next);
  }))
);

/**
 * 联系人详情接口 - GET方法
 * 路由: /api/contacts/:id
 * 需要身份认证
 */
router.get('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await contactController.getContactDetail(req, res, next);
  }))
);

/**
 * 创建联系人接口 - POST方法
 * 路由: /api/contacts
 * 需要身份认证
 */
router.post('/', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await contactController.createContact(req, res, next);
  }))
);

/**
 * 更新联系人接口 - PUT方法
 * 路由: /api/contacts/:id
 * 需要身份认证
 */
router.put('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await contactController.updateContact(req, res, next);
  }))
);

/**
 * 删除联系人接口 - DELETE方法
 * 路由: /api/contacts/:id
 * 需要身份认证
 */
router.delete('/:id', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await contactController.deleteContact(req, res, next);
  }))
);

/**
 * 批量删除联系人接口 - DELETE方法
 * 路由: /api/contacts/batch
 * 需要身份认证
 */
router.delete('/batch', 
  authenticateToken,
  responseWrapper(asyncHandler(async (req, res, next) => {
    return await contactController.batchDeleteContacts(req, res, next);
  }))
);

module.exports = router;