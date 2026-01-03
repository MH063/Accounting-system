/**
 * 成员统计路由
 * 提供成员统计信息查询功能
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/member-stats
 * 获取成员统计信息
 */
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  try {
    logger.info('[MemberStats] 获取成员统计信息');

    // 基础成员统计
    const memberStatsQuery = `
      WITH member_stats AS (
        -- 总用户数 (排除系统内置角色)
        SELECT COUNT(*) as total_users FROM users u 
        WHERE u.status != 'banned'
          AND u.id NOT IN (
            SELECT ur.user_id 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.is_system_role = TRUE
          )
      ),
      active_members AS (
        -- 活跃成员数 (排除系统内置角色)
        SELECT COUNT(DISTINCT u.id) as active_users 
        FROM users u 
        WHERE u.status = 'active' 
          AND u.last_login_at >= NOW() - INTERVAL '30 days'
          AND u.id NOT IN (
            SELECT ur.user_id 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.is_system_role = TRUE
          )
      ),
      dorm_members AS (
        -- 有宿舍的成员数 (排除系统内置角色)
        SELECT COUNT(DISTINCT ud.user_id) as users_in_dorms
        FROM user_dorms ud 
        JOIN users u ON ud.user_id = u.id
        WHERE ud.status = 'active'
          AND u.id NOT IN (
            SELECT ur.user_id 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.is_system_role = TRUE
          )
      ),
      expense_stats AS (
        -- 费用相关统计 (排除系统内置角色)
        SELECT 
          COUNT(DISTINCT es.user_id) as users_with_expenses,
          SUM(es.split_amount) as total_split_amount,
          AVG(es.split_amount) as avg_split_amount,
          SUM(CASE WHEN es.payment_status = 'paid' THEN es.paid_amount ELSE 0 END) as total_paid_amount
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        WHERE es.split_amount > 0
          AND u.id NOT IN (
            SELECT ur.user_id 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.is_system_role = TRUE
          )
      ),
      dorm_stats AS (
        -- 宿舍相关统计
        SELECT 
          COUNT(DISTINCT d.id) as total_dorms,
          AVG(d.capacity) as avg_dorm_capacity,
          AVG(d.current_occupancy) as avg_current_occupancy,
          CASE 
            WHEN COUNT(DISTINCT d.id) > 0 
            THEN SUM(d.current_occupancy)::DECIMAL / COUNT(DISTINCT d.id)
            ELSE 0 
          END as avg_members_per_dorm
        FROM dorms d
        WHERE d.status = 'active'
      ),
      recent_expenses AS (
        -- 最近30天费用统计
        SELECT 
          SUM(e.amount) as recent_total_expenses,
          COUNT(DISTINCT e.id) as recent_expense_count
        FROM expenses e
        WHERE e.expense_date >= CURRENT_DATE - INTERVAL '30 days'
          AND e.status = 'approved'
      )

      -- 组合所有统计数据
      SELECT 
        ms.total_users,
        am.active_users,
        dm.users_in_dorms,
        es.users_with_expenses,
        es.total_split_amount,
        es.avg_split_amount,
        es.total_paid_amount,
        ds.total_dorms,
        ds.avg_dorm_capacity,
        ds.avg_current_occupancy,
        ds.avg_members_per_dorm,
        re.recent_total_expenses,
        re.recent_expense_count,
        -- 计算其他衍生指标
        ROUND(am.active_users::DECIMAL / NULLIF(ms.total_users, 0) * 100, 2) as active_rate,
        ROUND(dm.users_in_dorms::DECIMAL / NULLIF(ms.total_users, 0) * 100, 2) as dorm_member_rate,
        ROUND(es.total_paid_amount / NULLIF(es.total_split_amount, 0) * 100, 2) as payment_rate
      FROM member_stats ms
      CROSS JOIN active_members am
      CROSS JOIN dorm_members dm
      CROSS JOIN expense_stats es
      CROSS JOIN dorm_stats ds
      CROSS JOIN recent_expenses re
    `;

    const memberStatsResult = await query(memberStatsQuery);
    const stats = memberStatsResult.rows[0];

    // 按月统计成员增长和费用变化（最近12个月） (排除系统内置角色)
    const monthlyStatsQuery = `
      SELECT 
        DATE_TRUNC('month', u.created_at) as month,
        COUNT(DISTINCT u.id) as new_members,
        COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_members,
        COUNT(DISTINCT ud.user_id) as dorm_members,
        COUNT(DISTINCT es.user_id) as expense_members,
        SUM(es.split_amount) as total_expenses,
        AVG(es.split_amount) as avg_expense_per_member
      FROM users u
      LEFT JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
      LEFT JOIN expense_splits es ON u.id = es.user_id
      WHERE u.created_at >= CURRENT_DATE - INTERVAL '12 months'
        AND u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        )
      GROUP BY DATE_TRUNC('month', u.created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    const monthlyStatsResult = await query(monthlyStatsQuery);
    const monthlyStats = monthlyStatsResult.rows;

    logger.info('[MemberStats] 成员统计信息获取成功');

    return res.json({
      success: true,
      message: '成员统计信息获取成功',
      data: {
        summary: {
          // 成员概况
          totalUsers: parseInt(stats.total_users) || 0,                 // 系统总用户数
          activeUsers: parseInt(stats.active_users) || 0,               // 活跃用户数（最近30天登录）
          usersInDorms: parseInt(stats.users_in_dorms) || 0,            // 有宿舍的成员数
          
          // 费用统计
          usersWithExpenses: parseInt(stats.users_with_expenses) || 0,   // 有费用记录的用户数
          totalSplitAmount: parseFloat(stats.total_split_amount) || 0,   // 总分摊金额
          avgSplitAmount: parseFloat(stats.avg_split_amount) || 0,       // 平均分摊金额
          totalPaidAmount: parseFloat(stats.total_paid_amount) || 0,     // 已支付总金额
          
          // 宿舍统计
          totalDorms: parseInt(stats.total_dorms) || 0,                 // 总宿舍数
          avgDormCapacity: parseFloat(stats.avg_dorm_capacity) || 0,     // 平均宿舍容量
          avgCurrentOccupancy: parseFloat(stats.avg_current_occupancy) || 0, // 平均当前入住人数
          avgMembersPerDorm: parseFloat(stats.avg_members_per_dorm) || 0,    // 平均每宿舍人数
          
          // 时间趋势
          recentTotalExpenses: parseFloat(stats.recent_total_expenses) || 0, // 最近30天总费用
          recentExpenseCount: parseInt(stats.recent_expense_count) || 0,     // 最近30天费用记录数
          
          // 衍生指标
          activeRate: parseFloat(stats.active_rate) || 0,               // 活跃率（%）
          dormMemberRate: parseFloat(stats.dorm_member_rate) || 0,      // 宿舍成员占比（%）
          paymentRate: parseFloat(stats.payment_rate) || 0              // 支付率（%）
        },
        monthlyTrends: monthlyStats.map(row => ({
          month: row.month,                                            // 月份
          newMembers: parseInt(row.new_members) || 0,                  // 新增成员数
          activeMembers: parseInt(row.active_members) || 0,            // 活跃成员数
          dormMembers: parseInt(row.dorm_members) || 0,                // 宿舍成员数
          expenseMembers: parseInt(row.expense_members) || 0,          // 有费用的成员数
          totalExpenses: parseFloat(row.total_expenses) || 0,          // 总费用
          avgExpensePerMember: parseFloat(row.avg_expense_per_member) || 0 // 人均费用
        }))
      }
    });

  } catch (error) {
    logger.error('[MemberStats] 获取成员统计信息失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '获取成员统计信息失败',
      error: error.message
    });
  }
}));

module.exports = router;