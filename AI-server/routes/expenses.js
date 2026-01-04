/**
 * 费用路由模块
 * 提供费用相关的API接口
 */

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/ExpenseController');
const { authenticateToken } = require('../middleware/auth');

// --- 静态路由 (必须在参数化路由 :id 之前) ---

/**
 * @function getStatistics
 * @description 获取费用统计数据
 * @route GET /api/expenses/statistics
 */
router.get('/statistics', expenseController.getStatistics);

/**
 * @function getPendingExpenses
 * @description 获取待审核费用列表
 * @route GET /api/expenses/pending
 */
router.get('/pending', (req, res, next) => {
  req.query.status = 'pending';
  expenseController.getExpenseList(req, res, next);
});

/**
 * @function batchApproveExpenses
 * @description 批量审核通过费用
 * @route PUT /api/expenses/batch/approve
 */
router.put('/batch/approve', authenticateToken, expenseController.batchApproveExpenses);

/**
 * @function batchRejectExpenses
 * @description 批量拒绝费用
 * @route PUT /api/expenses/batch/reject
 */
router.put('/batch/reject', authenticateToken, expenseController.batchRejectExpenses);

/**
 * @function batchDeleteExpenses
 * @description 批量删除费用
 * @route DELETE /api/expenses/batch
 */
router.delete('/batch', expenseController.batchDeleteExpenses);

/**
 * @function exportExpenses
 * @description 导出费用数据
 * @route GET /api/expenses/export
 */
router.get('/export', expenseController.exportExpenses);

/**
 * @function clearAllExpenses
 * @description 清空所有费用记录（管理员）
 * @route DELETE /api/expenses/clear-all
 */
router.delete('/clear-all', authenticateToken, expenseController.clearAllExpenses);

/**
 * @function saveDraft
 * @description 保存费用草稿
 * @route POST /api/expenses/draft
 */
router.post('/draft', authenticateToken, expenseController.saveDraft);

// --- 基础 CRUD 路由 ---

/**
 * @function getExpenseList
 * @description 获取费用列表
 * @route GET /api/expenses
 */
router.get('/', expenseController.getExpenseList);

/**
 * @function createExpense
 * @description 创建新费用
 * @route POST /api/expenses
 */
router.post('/', authenticateToken, expenseController.createExpense);

// --- 参数化路由 ---

/**
 * @function getExpenseDetail
 * @description 获取费用详情
 * @route GET /api/expenses/:id
 */
router.get('/:id', expenseController.getExpenseDetail);

/**
 * @function updateExpense
 * @description 更新费用信息
 * @route PUT /api/expenses/:id
 */
router.put('/:id', expenseController.updateExpense);

/**
 * @function deleteExpense
 * @description 删除单个费用
 * @route DELETE /api/expenses/:id
 */
router.delete('/:id', expenseController.deleteExpense);

// --- 业务操作路由 ---

/**
 * @function sendReminder
 * @description 发送费用提醒
 * @route POST /api/expenses/:id/remind
 */
router.post('/:id/remind', expenseController.sendReminder);

/**
 * @function reviewExpense
 * @description 审核单个费用
 * @route PUT /api/expenses/:id/review
 */
router.put('/:id/review', authenticateToken, (req, res, next) => expenseController.reviewExpense(req, res, next));

/**
 * @function payExpense
 * @description 支付费用
 * @route PUT /api/expenses/:id/pay
 */
router.put('/:id/pay', expenseController.payExpense);

module.exports = router;
