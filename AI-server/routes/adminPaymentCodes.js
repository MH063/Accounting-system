/**
 * 管理员收款码管理路由
 * 提供管理端收款码管理的完整API接口
 */

const express = require('express');
const router = express.Router();
const adminPaymentCodeController = require('../controllers/AdminPaymentCodeController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在 (使用绝对路径)
const uploadDir = path.resolve(__dirname, '../uploads/qrcodes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.use(auth.authenticateToken);
router.use(adminAuth.requireAdmin);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 再次检查目录是否存在，防止意外删除
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qrcode-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    
    const error = new Error('只能上传图片文件 (支持: jpg, jpeg, png, gif, webp)');
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
});

// 上传中间件错误处理包装器
const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: '文件大小不能超过 2MB' });
      }
      return res.status(400).json({ success: false, message: `上传错误: ${err.message}` });
    } else if (err) {
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
    next();
  });
};

router.get('/statistics', adminPaymentCodeController.getOverallStatistics);

router.get('/', adminPaymentCodeController.getPaymentCodes);

router.get('/:id', adminPaymentCodeController.getPaymentCodeById);

router.post('/', adminPaymentCodeController.createPaymentCode);

router.put('/:id', adminPaymentCodeController.updatePaymentCode);

router.delete('/:id', adminPaymentCodeController.deletePaymentCode);

router.put('/:id/status', adminPaymentCodeController.updatePaymentCodeStatus);

router.post('/batch-delete', adminPaymentCodeController.batchDelete);

router.post('/batch-disable', adminPaymentCodeController.batchDisable);

router.post('/:id/security-check', adminPaymentCodeController.performSecurityCheck);

router.post('/batch-security-check', adminPaymentCodeController.batchSecurityCheck);

router.get('/:id/security-report', adminPaymentCodeController.getSecurityReport);

router.get('/:id/usage-statistics', adminPaymentCodeController.getUsageStatistics);

router.post('/upload', uploadMiddleware, adminPaymentCodeController.uploadImage);

module.exports = router;
