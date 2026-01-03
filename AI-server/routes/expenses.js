/**
 * 费用路由模块
 * 提供费用相关的API接口
 */

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/ExpenseController');
const { authenticateToken } = require('../middleware/auth');

// 费用列表接口 - GET方法
router.get('/', expenseController.getExpenseList);

// 获取待审核费用列表接口 - GET方法
router.get('/pending', (req, res, next) => {
  req.query.status = 'pending';
  expenseController.getExpenseList(req, res, next);
});

// 更新费用接口 - PUT方法
router.put('/:id', expenseController.updateExpense);

// 发送提醒接口 - POST方法
router.post('/:id/remind', expenseController.sendReminder);

// 获取统计数据接口 - GET方法
router.get('/statistics', expenseController.getStatistics);

// 费用详情接口 - GET方法
router.get('/:id', expenseController.getExpenseDetail);

// 创建费用接口 - POST方法
router.post('/', authenticateToken, expenseController.createExpense);

// 审核费用接口 - PUT方法
router.put('/:id/review', (req, res, next) => expenseController.reviewExpense(req, res, next));

// 支付费用接口 - PUT方法
router.put('/:id/pay', expenseController.payExpense);

// 删除费用接口 - DELETE方法
router.delete('/:id', expenseController.deleteExpense);

// 批量审核通过接口 - PUT方法
router.put('/batch/approve', expenseController.batchApproveExpenses);

// 批量拒绝接口 - PUT方法
router.put('/batch/reject', expenseController.batchRejectExpenses);

// 批量删除接口 - DELETE方法
router.delete('/batch', expenseController.batchDeleteExpenses);

// 导出费用数据接口 - GET方法
router.get('/export', expenseController.exportExpenses);

// 保存草稿接口 - POST方法
router.post('/draft', authenticateToken, expenseController.saveDraft);

// 清空所有费用记录接口 - DELETE方法（仅管理员可用）
router.delete('/clear-all', authenticateToken, expenseController.clearAllExpenses);

module.exports = router;