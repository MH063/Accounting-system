/**
 * 支付记录路由
 * 统一管理所有支付记录相关的API接口
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const auth = require('../middleware/auth');

// 应用认证中间件到所有路由
router.use(auth.authenticateToken);

// 获取支付统计数据接口 - GET方法
router.get('/statistics', paymentController.getPaymentStatistics);

// 获取支付确认页面统计数据接口 - GET方法
router.get('/confirm-statistics', paymentController.getConfirmStatistics);

// 获取待确认支付列表接口 - GET方法
router.get('/pending-confirmation', paymentController.getPendingConfirmationPayments);

// 导出支付记录接口 - GET方法
router.get('/export', paymentController.exportPaymentRecords);

// 实际下载导出文件接口 - GET方法
router.get('/download-export', paymentController.downloadExportedPaymentRecords);

// 获取收入趋势数据接口 - GET方法
router.get('/income-trend', paymentController.getIncomeTrend);

// 获取支付方式分布数据接口 - GET方法
router.get('/method-distribution', paymentController.getPaymentMethodDistribution);

// 获取支付记录列表接口 - GET方法
router.get('/', paymentController.getPaymentRecords);

// 获取提醒设置接口 - GET方法
router.get('/reminder-settings', paymentController.getReminderSettings);

// 获取支付记录详情接口 - GET方法（必须放在最后，避免匹配其他具体路径）
router.get('/:orderId', paymentController.getPaymentRecordDetail);

// 保存提醒设置接口 - POST方法
router.post('/reminder-settings', paymentController.saveReminderSettings);

// 计算费用分摊接口 - POST方法
router.post('/calculate-sharing', paymentController.calculateSharing);

module.exports = router;