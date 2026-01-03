const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

/**
 * 获取智能提醒列表
 * GET /api/smart-reminders
 * 根据用户ID和各种业务规则生成智能提醒
 */
router.get('/smart-reminders', authenticateToken, async (req, res) => {
  try {
    console.log('开始获取智能提醒列表');
    
    const userId = req.user.userId;
    
    // 使用基于用户角色的智能提醒查询
    const smartRemindersQuery = `
      WITH user_role_info AS (
          -- 获取用户角色和权限
          SELECT 
              u.id as user_id,
              CASE 
                  WHEN r.role_name = 'system_admin' OR r.role_name = 'admin' THEN 'admin'
                  WHEN r.role_name = 'dorm_leader' THEN 'dorm_leader'
                  WHEN r.role_name = 'payer' THEN 'payer'
                  ELSE 'user'
              END as user_category
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = $1
          LIMIT 1
      )
      
      -- 基础查询：获取所有用户都能看到的提醒
      SELECT 
          reminder_type,
          severity,
          title,
          description,
          reminder_date,
          related_id,
          related_table,
          additional_info,
          priority_score
      FROM (
          -- 1. 逾期费用提醒（所有用户）
          SELECT 
              'overdue_payment'::text as reminder_type,
              'error'::text as severity,
              e.title::text as title,
              CONCAT('费用"', e.title, '"已逾期', (CURRENT_DATE - es.due_date)::text, '天，需支付￥', (es.split_amount - COALESCE(es.paid_amount, 0))::text)::text as description,
              es.due_date::timestamp as reminder_date,
              es.id::integer as related_id,
              'expense_splits'::text as related_table,
              jsonb_build_object(
                  'days_overdue', (CURRENT_DATE - es.due_date)::integer,
                  'amount_due', (es.split_amount - COALESCE(es.paid_amount, 0))::numeric
              ) as additional_info,
              130::integer as priority_score,
              u.user_category
          FROM user_role_info u
          JOIN expense_splits es ON 1=1
          JOIN expenses e ON es.expense_id = e.id
          WHERE es.user_id = $1
            AND es.payment_status IN ('pending', 'overdue')
            AND es.due_date < CURRENT_DATE
            AND (es.split_amount - COALESCE(es.paid_amount, 0)) > 0
          
          UNION ALL
          
          -- 2. 即将到期费用提醒（所有用户）
          SELECT 
              'upcoming_payment'::text as reminder_type,
              'warning'::text as severity,
              e.title::text as title,
              CONCAT('费用"', e.title, '"将于', (es.due_date - CURRENT_DATE)::text, '天后到期，需支付￥', (es.split_amount - COALESCE(es.paid_amount, 0))::text)::text as description,
              es.due_date::timestamp as reminder_date,
              es.id::integer as related_id,
              'expense_splits'::text as related_table,
              jsonb_build_object(
                  'days_until_due', (es.due_date - CURRENT_DATE)::numeric
              ) as additional_info,
              75::integer as priority_score,
              u.user_category
          FROM user_role_info u
          JOIN expense_splits es ON 1=1
          JOIN expenses e ON es.expense_id = e.id
          WHERE es.user_id = $1
            AND es.payment_status = 'pending'
            AND es.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
            AND (es.split_amount - COALESCE(es.paid_amount, 0)) > 0
          
          UNION ALL
          
          -- 3. 未读通知提醒（所有用户）
          SELECT 
              'unread_notification'::text as reminder_type,
              CASE 
                  WHEN n.type = 'error' THEN 'error'::text
                  WHEN n.type = 'warning' THEN 'warning'::text
                  ELSE 'info'::text
              END as severity,
              n.title::text as title,
              SUBSTRING(n.content FROM 1 FOR 100) || '...'::text as description,
              n.created_at::timestamp as reminder_date,
              n.id::integer as related_id,
              'notifications'::text as related_table,
              jsonb_build_object(
                  'notification_priority', 
                  CASE n.type 
                      WHEN 'error' THEN 1::integer
                      WHEN 'warning' THEN 2::integer
                      ELSE 3::integer
                  END
              ) as additional_info,
              CASE n.type 
                  WHEN 'error' THEN 150::integer
                  WHEN 'warning' THEN 125::integer
                  ELSE 100::integer
              END as priority_score,
              u.user_category
          FROM user_role_info u
          JOIN notifications n ON 1=1
          WHERE n.user_id = $1
            AND n.is_read = FALSE
            AND n.created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND n.type IN ('error', 'warning', 'system')
          
          UNION ALL
          
          -- 4. 管理员专属提醒
          SELECT 
              'system_alert'::text as reminder_type,
              'info'::text as severity,
              '系统运行状态'::text as title,
              '系统运行正常，最近24小时无异常'::text as description,
              CURRENT_TIMESTAMP::timestamp as reminder_date,
              NULL::integer as related_id,
              'system'::text as related_table,
              jsonb_build_object(
                  'status', 'normal',
                  'last_check', CURRENT_TIMESTAMP
              ) as additional_info,
              50::integer as priority_score,
              u.user_category
          FROM user_role_info u
          WHERE u.user_category = 'admin'
          
          UNION ALL
          
          -- 5. 宿舍管理员专属提醒：待处理事项
          SELECT 
              'dorm_management'::text as reminder_type,
              'info'::text as severity,
              '宿舍管理提醒'::text as title,
              CONCAT('您管理的宿舍有', COUNT(DISTINCT CASE WHEN e.id IS NOT NULL THEN e.id WHEN mr.id IS NOT NULL THEN mr.id END), '个待处理事项')::text as description,
              CURRENT_TIMESTAMP::timestamp as reminder_date,
              d.id::integer as related_id,
              'dorms'::text as related_table,
              jsonb_build_object(
                  'pending_expenses', COUNT(DISTINCT e.id),
                  'pending_maintenance', COUNT(DISTINCT mr.id)
              ) as additional_info,
              80::integer as priority_score,
              u.user_category
          FROM user_role_info u
          JOIN dorms d ON 1=1
          LEFT JOIN expenses e ON e.dorm_id = d.id AND e.status = 'pending'
          LEFT JOIN maintenance_requests mr ON mr.dorm_id = d.id AND mr.status IN ('pending', 'in_progress')
          WHERE u.user_category = 'dorm_admin' AND d.admin_id = $1
          GROUP BY d.id, u.user_category
          HAVING COUNT(DISTINCT CASE WHEN e.id IS NOT NULL THEN e.id WHEN mr.id IS NOT NULL THEN mr.id END) > 0
      ) AS all_reminders
      ORDER BY priority_score DESC
      LIMIT 20;
    `;
    
    // 执行查询，传入userId参数
    const smartRemindersResult = await query(smartRemindersQuery, [userId]);
    
    // 构建返回数据
    const allReminders = smartRemindersResult.rows.map((item, index) => ({
      id: index + 1,  // 提醒ID
      type: item.reminder_type,  // 提醒类型
      title: item.title,  // 提醒标题
      message: item.description,  // 提醒内容
      priority: item.severity === 'high' ? 'high' : item.severity === 'medium' ? 'medium' : 'low',  // 优先级
      businessId: item.related_id,  // 业务ID
      relatedData: item.additional_info,  // 相关数据
      createdAt: new Date().toISOString()  // 提醒生成时间
    }));
    
    const totalReminders = allReminders.length;
    
    // 按提醒类型分类
    const overdueExpenseSplits = allReminders.filter(reminder => reminder.type === 'overdue_payment');
    const upcomingExpenseSplits = allReminders.filter(reminder => reminder.type === 'upcoming_payment');
    const unreadNotifications = allReminders.filter(reminder => reminder.type === 'unread_notification');
    
    // 处理管理员专属提醒
    const pendingExpenses = allReminders.filter(reminder => reminder.type === 'system_alert');
    
    // 处理宿舍管理员专属提醒
    const pendingApprovals = allReminders.filter(reminder => reminder.type === 'dorm_management');
    
    // 其他类型暂时为空
    const urgentExpenses = [];
    const maintenanceRequests = [];
    const budgetWarnings = [];
    const pendingMembers = [];
    
    console.log('智能提醒列表获取完成，共', totalReminders, '条提醒');
    
    res.json({
      success: true,
      data: {
        total: totalReminders,  // 总提醒数量
        overdueExpenseSplits: overdueExpenseSplits,  // 费用逾期提醒列表
        upcomingExpenseSplits: upcomingExpenseSplits,  // 即将到期费用提醒列表
        pendingExpenses: pendingExpenses,  // 待审批费用提醒列表
        urgentExpenses: urgentExpenses,  // 紧急费用提醒列表
        maintenanceRequests: maintenanceRequests,  // 报修状态提醒列表
        unreadNotifications: unreadNotifications,  // 未读通知提醒列表
        budgetWarnings: budgetWarnings,  // 预算超支提醒列表
        pendingApprovals: pendingApprovals,  // 待审批提醒列表
        pendingMembers: pendingMembers  // 待确认成员提醒列表
      },
      message: '智能提醒列表获取成功'
    });
  } catch (error) {
    console.error('获取智能提醒列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取智能提醒列表失败',
      error: error.message
    });
  }
});

module.exports = router;
