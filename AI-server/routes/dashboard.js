const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * 获取仪表盘数据
 * GET /api/dashboard
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 模拟仪表盘数据
    const dashboardData = {
      dormitoryCount: 2,
      memberCount: 4,
      monthlyExpense: 1250.50,
      totalBudget: 3000,
      recentExpenses: [
        { id: 1, description: '电费', amount: 120, date: '2025-12-10' },
        { id: 2, description: '水费', amount: 80, date: '2025-12-08' },
        { id: 3, description: '网费', amount: 100, date: '2025-12-05' }
      ],
      notifications: [
        { id: 1, type: 'info', message: '本月电费已出账', date: '2025-12-15' },
        { id: 2, type: 'warning', message: '预算使用已达75%', date: '2025-12-14' }
      ]
    };

    res.json({
      success: true,
      data: dashboardData,
      message: '仪表盘数据获取成功'
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仪表盘数据失败',
      error: error.message
    });
  }
});

module.exports = router;