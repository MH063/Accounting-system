/**
 * 支付路由模块
 * 提供支付相关的API接口
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');

// 获取收款码列表接口 - GET方法
router.get('/qrcodes', paymentController.getQRCodes);

// 确认支付接口 - POST方法
router.post('/confirm', paymentController.confirmPayment);

module.exports = router;