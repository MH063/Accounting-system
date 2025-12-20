const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

/**
 * 获取仪表盘统计数据
 * GET /api/dashboard/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    console.log('开始获取仪表盘统计数据');
    
    // 1. 用户统计
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,                    -- 总用户数
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,  -- 活跃用户数
        COUNT(CASE WHEN last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recently_active_users  -- 30天内活跃用户数
      FROM users
    `;
    const userStatsResult = await query(userStatsQuery);
    const userStats = userStatsResult.rows[0];
    
    // 2. 有宿舍的用户统计
    const dormUsersQuery = `
      SELECT COUNT(DISTINCT user_id) as users_with_dorm
      FROM user_dorms
      WHERE status = 'active'
    `;
    const dormUsersResult = await query(dormUsersQuery);
    const usersWithDorm = parseInt(dormUsersResult.rows[0].users_with_dorm);
    
    // 3. 宿舍统计
    const dormStatsQuery = `
      SELECT 
        COUNT(*) as total_dorms,                   -- 总宿舍数
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_dorms,  -- 活跃宿舍数
        SUM(capacity) as total_capacity,           -- 总容量
        SUM(current_occupancy) as total_occupancy   -- 总入住人数
      FROM dorms
    `;
    const dormStatsResult = await query(dormStatsQuery);
    const dormStats = dormStatsResult.rows[0];
    
    // 计算入住率
    const occupancyRate = dormStats.total_capacity > 0 
      ? (dormStats.total_occupancy / dormStats.total_capacity * 100).toFixed(2)
      : 0;
    
    // 4. 本月费用统计
    const expenseStatsQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_monthly_expense,  -- 本月总费用
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,  -- 待审批费用数
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses  -- 已审批费用数
      FROM expenses
      WHERE expense_date >= date_trunc('month', CURRENT_DATE)
        AND expense_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `;
    const expenseStatsResult = await query(expenseStatsQuery);
    const expenseStats = expenseStatsResult.rows[0];
    
    // 5. 费用分摊统计
    const expenseSplitStatsQuery = `
      SELECT 
        COALESCE(SUM(split_amount), 0) as total_split_amount,  -- 总分摊金额
        COALESCE(SUM(paid_amount), 0) as total_paid_amount,   -- 总已支付金额
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,  -- 待支付数
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_payments,       -- 已支付数
        COUNT(CASE WHEN payment_status = 'overdue' THEN 1 END) as overdue_payments   -- 逾期支付数
      FROM expense_splits
    `;
    const expenseSplitStatsResult = await query(expenseSplitStatsQuery);
    const expenseSplitStats = expenseSplitStatsResult.rows[0];
    
    // 6. 报修统计
    const maintenanceStatsQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_maintenance,    -- 待处理报修数
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_maintenance,  -- 进行中报修数
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_maintenance  -- 已完成报修数
      FROM maintenance_requests
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
        OR status IN ('pending', 'in_progress')
    `;
    const maintenanceStatsResult = await query(maintenanceStatsQuery);
    const maintenanceStats = maintenanceStatsResult.rows[0];
    
    // 7. 通知统计
    const notificationStatsQuery = `
      SELECT 
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications  -- 未读通知数
      FROM notifications
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
        OR is_read = false
    `;
    const notificationStatsResult = await query(notificationStatsQuery);
    const notificationStats = notificationStatsResult.rows[0];
    
    // 10. 总预算统计
    const totalBudgetQuery = `
      SELECT 
        COALESCE(SUM(budget_amount), 0) as total_budget,     -- 总预算
        COALESCE(SUM(used_amount), 0) as total_used_amount   -- 总已使用金额
      FROM budgets
      WHERE status = 'active' AND budget_type = 'MONTHLY'  -- 只统计当前有效的月度预算
        AND budget_period_start <= CURRENT_DATE
        AND budget_period_end >= CURRENT_DATE
    `;
    const totalBudgetResult = await query(totalBudgetQuery);
    const totalBudget = totalBudgetResult.rows[0];
    
    // 8. 最近费用记录（最近5条）
    const recentExpensesQuery = `
      SELECT 
        e.id,
        e.title,
        e.amount,
        e.expense_date,
        e.status,
        ec.category_name,
        u.username as applicant_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN users u ON e.applicant_id = u.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `;
    const recentExpensesResult = await query(recentExpensesQuery);
    
    // 9. 最近报修记录（最近5条）
    const recentMaintenanceQuery = `
      SELECT 
        mr.id,
        mr.title,
        mr.status,
        mr.urgency_level,
        mr.created_at,
        u.username as requester_name,
        d.dorm_name
      FROM maintenance_requests mr
      LEFT JOIN users u ON mr.requester_id = u.id
      LEFT JOIN dorms d ON mr.dorm_id = d.id
      ORDER BY mr.created_at DESC
      LIMIT 5
    `;
    const recentMaintenanceResult = await query(recentMaintenanceQuery);
    
    // 构建返回数据
    const statisticsData = {
      // 用户统计
      userStats: {
        totalUsers: parseInt(userStats.total_users),                    // 总用户数
        activeUsers: parseInt(userStats.active_users),                  // 活跃用户数
        recentlyActiveUsers: parseInt(userStats.recently_active_users), // 30天内活跃用户数
        usersWithDorm: usersWithDorm                                    // 有宿舍的用户数
      },
      
      // 宿舍统计
      dormStats: {
        totalDorms: parseInt(dormStats.total_dorms),                   // 总宿舍数
        activeDorms: parseInt(dormStats.active_dorms),                 // 活跃宿舍数
        totalCapacity: parseInt(dormStats.total_capacity),             // 总容量
        totalOccupancy: parseInt(dormStats.total_occupancy),           // 总入住人数
        occupancyRate: parseFloat(occupancyRate)                       // 入住率(%)
      },
      
      // 费用统计
      expenseStats: {
        totalMonthlyExpense: parseFloat(expenseStats.total_monthly_expense),  // 本月总费用
        pendingExpenses: parseInt(expenseStats.pending_expenses),             // 待审批费用数
        approvedExpenses: parseInt(expenseStats.approved_expenses),           // 已审批费用数
        totalSplitAmount: parseFloat(expenseSplitStats.total_split_amount),   // 总分摊金额
        totalPaidAmount: parseFloat(expenseSplitStats.total_paid_amount),     // 总已支付金额
        pendingPayments: parseInt(expenseSplitStats.pending_payments),       // 待支付数
        paidPayments: parseInt(expenseSplitStats.paid_payments),              // 已支付数
        overduePayments: parseInt(expenseSplitStats.overdue_payments),        // 逾期支付数
        totalBudget: parseFloat(totalBudget.total_budget),                   // 总预算
        totalUsedBudget: parseFloat(totalBudget.total_used_amount)            // 总已使用预算
      },
      
      // 报修统计
      maintenanceStats: {
        pendingMaintenance: parseInt(maintenanceStats.pending_maintenance),        // 待处理报修数
        inProgressMaintenance: parseInt(maintenanceStats.in_progress_maintenance),  // 进行中报修数
        completedMaintenance: parseInt(maintenanceStats.completed_maintenance)      // 已完成报修数
      },
      
      // 通知统计
      notificationStats: {
        unreadNotifications: parseInt(notificationStats.unread_notifications)  // 未读通知数
      },
      
      // 最近记录
      recentExpenses: recentExpensesResult.rows,      // 最近费用记录
      recentMaintenance: recentMaintenanceResult.rows // 最近报修记录
    };
    
    console.log('仪表盘统计数据获取完成');
    
    res.json({
      success: true,
      data: statisticsData,
      message: '仪表盘统计数据获取成功'
    });
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仪表盘统计数据失败',
      error: error.message
    });
  }
});

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