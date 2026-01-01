/**
 * 模板路由模块
 * 提供导入模板下载相关的API接口
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/TemplateController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 下载导入模板
 * GET /api/templates/:type
 */
router.get('/:type', authenticateToken, (req, res) => {
  templateController.downloadTemplate(req, res);
});

module.exports = router;
