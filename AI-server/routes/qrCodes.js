/**
 * 收款码路由模块
 * 提供收款码相关的API接口
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const auth = require('../middleware/auth');

// 应用认证中间件到所有路由
router.use(auth.authenticateToken);

// 获取收款码列表接口 - GET方法
router.get('/', paymentController.getQRCodes);

// 创建收款码 - POST方法
router.post('/', paymentController.createQRCode);

// 获取收款码详情 - GET方法
router.get('/:id', paymentController.getQRCodeById);

// 更新收款码 - PUT方法
router.put('/:id', paymentController.updateQRCode);

// 删除收款码 - DELETE方法
router.delete('/:id', paymentController.deleteQRCode);

// 设置默认收款码 - PUT方法
router.put('/:id/default', paymentController.setDefaultQRCode);

// 扫描支付二维码 - POST方法
router.post('/:id/scan', paymentController.scanQRCode);

// 查询支付状态 - GET方法
router.get('/:id/status', paymentController.getPaymentStatus);

module.exports = router;