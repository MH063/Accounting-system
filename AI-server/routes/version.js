/**
 * 版本管理路由
 * 统一管理所有版本相关的API接口
 */

const express = require('express');
const router = express.Router();
const versionController = require('../controllers/VersionController');
const auth = require('../middleware/auth');

// 应用认证中间件到所有路由（可选，某些版本接口可能不需要认证）
// router.use(auth.authenticateToken);

// 获取最新版本信息接口 - GET方法
router.get('/latest', versionController.getLatestVersion);

// 获取版本历史接口 - GET方法
router.get('/history', versionController.getVersionHistory);

module.exports = router;