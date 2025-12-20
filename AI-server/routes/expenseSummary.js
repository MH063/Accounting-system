/**
 * 费用摘要路由模块
 * 提供费用统计和摘要功能
 */

const express = require('express');
const router = express.Router();
const expenseSummaryController = require('../controllers/ExpenseSummaryController');

// 费用摘要接口 - GET方法
router.get('/summary', expenseSummaryController.getExpenseSummary);

module.exports = router;