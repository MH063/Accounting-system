/**
 * 管理员支付监控路由
 * 提供支付记录监控相关API接口
 */

const express = require('express');
const router = express.Router();
const adminPaymentMonitorController = require('../controllers/AdminPaymentMonitorController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(auth.authenticateToken);
router.use(adminAuth.requireAdmin);

/**
 * @route   GET /api/admin/payments/monitor/stats
 * @desc    获取监控统计数据
 * @access  Admin
 */
router.get('/stats', adminPaymentMonitorController.getMonitorStats);

/**
 * @route   GET /api/admin/payments/monitor/records
 * @desc    获取支付记录列表
 * @access  Admin
 */
router.get('/records', adminPaymentMonitorController.getPaymentRecords);

/**
 * @route   GET /api/admin/payments/monitor/records/:id
 * @desc    获取支付记录详情
 * @access  Admin
 */
router.get('/records/:id', adminPaymentMonitorController.getPaymentRecordDetail);

/**
 * @route   POST /api/admin/payments/monitor/records/:id/mark-exception
 * @desc    标记支付记录为异常
 * @access  Admin
 */
router.post('/records/:id/mark-exception', adminPaymentMonitorController.markException);

/**
 * @route   POST /api/admin/payments/monitor/records/:id/process-exception
 * @desc    处理异常记录
 * @access  Admin
 */
router.post('/records/:id/process-exception', adminPaymentMonitorController.processException);

/**
 * @route   POST /api/admin/payments/monitor/records/:id/cancel-exception
 * @desc    取消异常标记
 * @access  Admin
 */
router.post('/records/:id/cancel-exception', adminPaymentMonitorController.cancelException);

/**
 * @route   GET /api/admin/payments/monitor/charts/status
 * @desc    获取支付状态统计图表数据
 * @access  Admin
 */
router.get('/charts/status', adminPaymentMonitorController.getStatusChartData);

/**
 * @route   GET /api/admin/payments/monitor/charts/methods
 * @desc    获取支付方式分布图表数据
 * @access  Admin
 */
router.get('/charts/methods', adminPaymentMonitorController.getMethodChartData);

/**
 * @route   GET /api/admin/payments/monitor/charts/success-rate
 * @desc    获取支付成功率趋势图表数据
 * @access  Admin
 */
router.get('/charts/success-rate', adminPaymentMonitorController.getSuccessRateChartData);

/**
 * @route   GET /api/admin/payments/monitor/charts/time-distribution
 * @desc    获取支付时间分布图表数据
 * @access  Admin
 */
router.get('/charts/time-distribution', adminPaymentMonitorController.getTimeDistributionChartData);

/**
 * @route   GET /api/admin/payments/monitor/realtime
 * @desc    获取实时监控数据 (SSE)
 * @access  Admin
 */
router.get('/realtime', adminPaymentMonitorController.getRealtimeMonitorStream);

/**
 * @route   GET /api/admin/payments/monitor/export
 * @desc    导出支付记录
 * @access  Admin
 */
router.get('/export', adminPaymentMonitorController.exportPaymentRecords);

module.exports = router;
