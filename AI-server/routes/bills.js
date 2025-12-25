/**
 * 账单路由模块
 * 将 /api/bills 路径重定向到 /api/expenses
 * 实现账单相关的API接口
 */

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/ExpenseController');

// 账单列表接口 - GET方法
router.get('/', expenseController.getExpenseList);

// 待审核账单列表接口 - GET方法
router.get('/pending', (req, res, next) => {
  req.query.status = 'pending';
  expenseController.getExpenseList(req, res, next);
});

// 账单详情接口 - GET方法
router.get('/:id', expenseController.getExpenseDetail);

// 创建账单接口 - POST方法
router.post('/', expenseController.createExpense);

// 更新账单接口 - PUT方法
router.put('/:id', expenseController.updateExpense);

// 标记支付接口 - POST方法
router.post('/:id/pay', expenseController.payExpense);

// 发送提醒接口 - POST方法
router.post('/:id/remind', expenseController.sendReminder);

// 删除账单接口 - DELETE方法
router.delete('/:id', expenseController.deleteExpense);

// 批量操作接口 - POST方法
router.post('/batch', (req, res, next) => {
  const { action, ids } = req.body;
  
  if (!action || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '缺少有效的操作类型或ID列表'
    });
  }
  
  // 根据action调用不同的批量处理方法
  switch (action) {
    case 'approve':
      return expenseController.batchApproveExpenses(req, res, next);
    case 'reject':
      return expenseController.batchRejectExpenses(req, res, next);
    case 'delete':
      return expenseController.batchDeleteExpenses(req, res, next);
    default:
      return res.status(400).json({
        success: false,
        message: '无效的操作类型'
      });
  }
});

// 导出账单接口 - GET方法
router.get('/export', expenseController.exportExpenses);

// 获取统计数据接口 - GET方法
router.get('/statistics', expenseController.getStatistics);

module.exports = router;