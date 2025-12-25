/**
 * 收款码路由
 * 统一管理所有收款码相关的API接口
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// 应用认证中间件到所有路由
router.use(auth.authenticateToken);

// 获取收款码列表接口 - GET方法
router.get('/', paymentController.getQRCodes);

// 创建收款码接口 - POST方法
router.post('/', paymentController.createQRCode);

// 上传收款码图片接口 - POST方法
// 注意：使用uploadSingle中间件处理文件上传，字段名为'file'
router.post('/upload', uploadSingle('file'), paymentController.uploadQRCodeImage);

// 执行安全检测接口 - POST方法
router.post('/security-check', paymentController.performSecurityCheck);

// 获取安全检测历史接口 - GET方法
router.get('/security-history', paymentController.getSecurityCheckHistory);

// 获取收款码详情接口 - GET方法（必须放在最后，避免匹配其他具体路径）
router.get('/:id', paymentController.getQRCodeById);

// 更新收款码接口 - PUT方法
router.put('/:id', paymentController.updateQRCode);

// 删除收款码接口 - DELETE方法
router.delete('/:id', paymentController.deleteQRCode);

module.exports = router;
