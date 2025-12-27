/**
 * 成员活动路由
 * 提供成员活动信息查询功能
 */
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/member-activities
 * 获取成员活动信息
 * 支持分页、时间范围、宿舍筛选、活动类型筛选
 */
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  try {
    logger.info('[MemberActivities] 获取成员活动信息');
    
    // 获取查询参数
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      dormIds, // 支持多个宿舍ID，格式为逗号分隔的字符串
      activityTypes // 支持多个活动类型，格式为逗号分隔的字符串
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建宿舍ID数组
    let dormIdArray = [];
    if (dormIds) {
      dormIdArray = dormIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }
    
    // 构建活动类型数组
    let activityTypeArray = [];
    if (activityTypes) {
      activityTypeArray = activityTypes.split(',').map(type => type.trim());
    }
    
    // 构建基础查询参数
    const queryParams = [];
    let paramIndex = 1;
    
    // 构建时间范围条件
    let timeCondition = '';
    if (startDate) {
      timeCondition += ` AND activity_time >= $${paramIndex}`;
      queryParams.push(new Date(startDate));
      paramIndex++;
    }
    if (endDate) {
      timeCondition += ` AND activity_time <= $${paramIndex}`;
      queryParams.push(new Date(endDate));
      paramIndex++;
    }
    
    // 构建宿舍筛选条件
    let dormCondition = '';
    if (dormIdArray.length > 0) {
      // 构造 IN 条件
      const placeholders = dormIdArray.map((_, index) => `$${paramIndex + index}`).join(',');
      dormCondition = ` AND dorm_id IN (${placeholders})`;
      queryParams.push(...dormIdArray);
      paramIndex += dormIdArray.length;
    }
    
    // 构建活动类型筛选条件
    let typeCondition = '';
    if (activityTypeArray.length > 0) {
      const placeholders = activityTypeArray.map((_, index) => `$${paramIndex + index}`).join(',');
      typeCondition = ` AND activity_type IN (${placeholders})`;
      queryParams.push(...activityTypeArray);
      paramIndex += activityTypeArray.length;
    }
    
    // 添加分页参数（确保是整数）
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);
    
    // 主查询SQL
    const activitiesQuery = `
      SELECT 
        activity_type,        -- 活动类型
        activity_id,          -- 活动ID
        activity_time,        -- 活动时间
        activity_title,       -- 活动标题
        detail,               -- 活动详情
        amount,               -- 涉及金额
        status,               -- 活动状态
        user_id,              -- 用户ID
        user_name,            -- 用户昵称
        user_avatar,          -- 用户头像
        dorm_id,              -- 宿舍ID
        dorm_name,            -- 宿舍名称
        building,             -- 建筑物名称
        room_number,          -- 房间号
        category              -- 类别
      FROM (
        -- 1. 费用相关的活动（创建、审批、支付等）
        SELECT 
            'expense' AS activity_type,
            e.id AS activity_id,
            e.created_at AS activity_time,
            '费用申请' AS activity_title,
            e.title AS detail,
            e.amount AS amount,
            e.status AS status,
            u.id AS user_id,
            u.nickname AS user_name,
            u.avatar_url AS user_avatar,
            d.id AS dorm_id,
            d.dorm_name AS dorm_name,
            d.building AS building,
            d.room_number AS room_number,
            ec.category_name AS category
        FROM expenses e
        JOIN users u ON e.applicant_id = u.id
        JOIN dorms d ON e.dorm_id = d.id
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
        
        UNION ALL
        
        -- 2. 费用支付活动
        SELECT 
            'payment' AS activity_type,
            es.id AS activity_id,
            COALESCE(es.paid_at, es.created_at) AS activity_time,
            CASE 
                WHEN es.payment_status = 'paid' THEN '费用支付'
                WHEN es.payment_status = 'overdue' THEN '费用逾期'
                ELSE '费用分摊'
            END AS activity_title,
            CONCAT('支付金额: ￥', es.split_amount) AS detail,
            es.split_amount AS amount,
            es.payment_status AS status,
            u.id AS user_id,
            u.nickname AS user_name,
            u.avatar_url AS user_avatar,
            d.id AS dorm_id,
            d.dorm_name AS dorm_name,
            d.building AS building,
            d.room_number AS room_number,
            '支付' AS category
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        JOIN dorms d ON es.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
        
        UNION ALL
        
        -- 3. 报修相关的活动
        SELECT 
            'maintenance' AS activity_type,
            mr.id AS activity_id,
            mr.created_at AS activity_time,
            '报修申请' AS activity_title,
            mr.title AS detail,
            NULL AS amount,
            mr.status AS status,
            u.id AS user_id,
            u.nickname AS user_name,
            u.avatar_url AS user_avatar,
            d.id AS dorm_id,
            d.dorm_name AS dorm_name,
            d.building AS building,
            d.room_number AS room_number,
            mr.type AS category
        FROM maintenance_requests mr
        JOIN users u ON mr.requester_id = u.id
        JOIN dorms d ON mr.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
        
        UNION ALL
        
        -- 4. 成员加入/离开活动
        SELECT 
            'member_change' AS activity_type,
            ud.id AS activity_id,
            ud.joined_at AS activity_time,
            CASE 
                WHEN ud.status = 'active' THEN '成员加入'
                WHEN ud.status = 'inactive' THEN '成员离开'
                ELSE '成员状态变更'
            END AS activity_title,
            CONCAT(u.nickname, ' ', 
                   CASE 
                       WHEN ud.member_role = 'admin' THEN '以管理员身份'
                       WHEN ud.member_role = 'member' THEN '以成员身份'
                       ELSE '以查看者身份'
                   END,
                   ' ', 
                   CASE 
                       WHEN ud.status = 'active' THEN '加入宿舍'
                       ELSE '离开宿舍'
                   END) AS detail,
            NULL AS amount,
            ud.status AS status,
            u.id AS user_id,
            u.nickname AS user_name,
            u.avatar_url AS user_avatar,
            d.id AS dorm_id,
            d.dorm_name AS dorm_name,
            d.building AS building,
            d.room_number AS room_number,
            '成员管理' AS category
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
      ) AS activities
      WHERE 1=1 ${typeCondition}
      ORDER BY activity_time DESC
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `;
    
    // 执行查询（不传递LIMIT和OFFSET参数，因为它们已经在查询中直接使用了）
    const activitiesResult = await query(activitiesQuery, queryParams);
    const activities = activitiesResult.rows;
    
    // 获取总数量的查询
    const countQuery = `
      SELECT COUNT(*) AS total FROM (
        -- 1. 费用相关的活动
        SELECT e.id
        FROM expenses e
        JOIN users u ON e.applicant_id = u.id
        JOIN dorms d ON e.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
        
        UNION ALL
        
        -- 2. 费用支付活动
        SELECT es.id
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        JOIN dorms d ON es.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
        
        UNION ALL
        
        -- 3. 报修相关的活动
        SELECT mr.id
        FROM maintenance_requests mr
        JOIN users u ON mr.requester_id = u.id
        JOIN dorms d ON mr.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
        
        UNION ALL
        
        -- 4. 成员加入/离开活动
        SELECT ud.id
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE 1=1 ${timeCondition} ${dormCondition}
      ) AS all_activities
    `;
    
    // 执行总数查询
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    logger.info('[MemberActivities] 成员活动信息获取成功');

    // 处理时间字段，确保序列化正确
    const processTimestamp = (timestamp) => {
      if (!timestamp) return new Date().toISOString()
      if (typeof timestamp === 'object' && timestamp.toISOString) {
        return timestamp.toISOString()
      }
      return timestamp.toString()
    }

    return res.json({
      success: true,
      message: '成员活动信息获取成功',
      data: {
        activities: activities.map(activity => ({
          activityType: activity.activity_type,          // 活动类型：expense/payment/maintenance/member_change
          activityId: parseInt(activity.activity_id),   // 活动ID
          activityTime: processTimestamp(activity.activity_time),  // 活动时间
          activityTitle: activity.activity_title,       // 活动标题
          detail: activity.detail,                      // 活动详情
          amount: activity.amount ? parseFloat(activity.amount) : null,  // 涉及金额
          status: activity.status,                      // 活动状态
          user: {
            id: parseInt(activity.user_id),             // 用户ID
            name: activity.user_name,                   // 用户昵称
            avatar: activity.user_avatar                // 用户头像
          },
          dorm: {
            id: parseInt(activity.dorm_id),             // 宿舍ID
            name: activity.dorm_name,                   // 宿舍名称
            building: activity.building,                // 建筑物名称
            roomNumber: activity.room_number            // 房间号
          },
          category: activity.category                   // 类别
        })),
        pagination: {
          currentPage: parseInt(page),
          pageSize: limitInt,
          total: total,
          totalPages: Math.ceil(total / limitInt)
        }
      }
    });

  } catch (error) {
    logger.error('[MemberActivities] 获取成员活动信息失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '获取成员活动信息失败',
      error: error.message
    });
  }
}));

module.exports = router;