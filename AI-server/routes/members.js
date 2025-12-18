/**
 * 成员列表路由
 * 提供成员列表信息查询功能
 */
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/members
 * 获取成员列表信息
 * 支持分页、搜索、筛选和排序功能
 */
router.get('/', authenticateToken, responseWrapper(async (req, res) => {
  try {
    logger.info('[Members] 获取成员列表信息');
    
    // 获取查询参数
    const {
      page = 1,
      limit = 20,
      dormId,           // 宿舍ID筛选
      role,             // 成员角色筛选
      search,           // 搜索关键词（姓名/昵称/电话）
      sortBy = 'join_date'  // 排序字段: name, name_desc, join_date, payment
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建查询参数
    const queryParams = [];
    let paramIndex = 1;
    
    // 构建筛选条件
    let dormCondition = '';
    if (dormId) {
      dormCondition = ` AND d.id = $${paramIndex}`;
      queryParams.push(parseInt(dormId));
      paramIndex++;
    }
    
    let roleCondition = '';
    if (role) {
      roleCondition = ` AND ud.member_role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }
    
    let searchCondition = '';
    if (search) {
      searchCondition = ` AND (u.real_name ILIKE $${paramIndex} OR u.nickname ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // 添加分页参数
    queryParams.push(parseInt(limit));
    queryParams.push(parseInt(offset));
    
    // 构建排序条件
    let orderClause = 'ud.joined_at DESC NULLS LAST'; // 默认排序
    if (sortBy === 'name') {
      orderClause = 'u.real_name ASC';
    } else if (sortBy === 'name_desc') {
      orderClause = 'u.real_name DESC';
    } else if (sortBy === 'join_date') {
      orderClause = 'ud.joined_at DESC';
    } else if (sortBy === 'payment') {
      orderClause = 'es.pending_amount DESC';
    }
    
    // 主查询SQL
    const membersQuery = `
      SELECT 
        u.id as user_id,                    -- 用户ID
        u.username,                         -- 用户名
        u.nickname,                         -- 昵称
        u.real_name,                        -- 真实姓名
        u.phone,                            -- 电话
        u.email,                            -- 邮箱
        u.gender,                           -- 性别
        u.birthday,                         -- 生日
        u.avatar_url,                       -- 头像
        u.status as user_status,            -- 用户状态
        u.created_at as user_created_at,    -- 用户创建时间
        
        -- 宿舍信息
        d.id as dorm_id,                    -- 宿舍ID
        d.dorm_name,                        -- 宿舍名称
        d.dorm_code,                        -- 宿舍编码
        d.building,                         -- 建筑物
        d.floor,                            -- 楼层
        d.room_number as dorm_room_number,  -- 宿舍房间号
        
        -- 成员在宿舍中的信息
        ud.id as user_dorm_id,              -- 用户宿舍关联ID
        ud.member_role,                     -- 成员角色
        ud.status as dorm_member_status,    -- 宿舍成员状态
        ud.move_in_date,                    -- 入住日期
        ud.move_out_date,                   -- 搬离日期
        ud.bed_number,                      -- 床位号
        ud.room_number as member_room_number, -- 成员房间号
        ud.monthly_share,                   -- 月分摊费用
        ud.deposit_paid,                    -- 已付押金
        ud.last_payment_date,               -- 最后缴费日期
        ud.joined_at,                       -- 加入时间
        ud.updated_at as member_updated_at, -- 成员信息更新时间
        
        -- 费用统计（汇总）
        COALESCE(es.total_split_amount, 0) as total_split_amount,   -- 总分摊金额
        COALESCE(es.total_paid_amount, 0) as total_paid_amount,     -- 总已付金额
        COALESCE(es.pending_amount, 0) as pending_amount,           -- 待支付金额
        COALESCE(es.overdue_amount, 0) as overdue_amount            -- 逾期金额
          
      FROM users u
      LEFT JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
      LEFT JOIN dorms d ON ud.dorm_id = d.id AND d.status = 'active'
      LEFT JOIN (
        SELECT 
          user_id,
          dorm_id,
          SUM(split_amount) as total_split_amount,
          SUM(paid_amount) as total_paid_amount,
          SUM(CASE WHEN payment_status = 'pending' THEN split_amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN payment_status = 'overdue' THEN split_amount ELSE 0 END) as overdue_amount
        FROM expense_splits
        GROUP BY user_id, dorm_id
      ) es ON u.id = es.user_id AND d.id = es.dorm_id
      
      -- 筛选条件
      WHERE u.status = 'active'  -- 只显示活跃用户
        ${dormCondition}
        ${roleCondition}
        ${searchCondition}
      
      -- 排序
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // 执行查询
    const membersResult = await query(membersQuery, queryParams);
    const members = membersResult.rows;
    
    // 获取总数量的查询
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_dorms ud ON u.id = ud.user_id AND ud.status = 'active'
      LEFT JOIN dorms d ON ud.dorm_id = d.id AND d.status = 'active'
      
      -- 筛选条件
      WHERE u.status = 'active'  -- 只显示活跃用户
        ${dormCondition}
        ${roleCondition}
        ${searchCondition}
    `;
    
    // 执行总数查询
    const countResult = await query(countQuery, queryParams.slice(0, -2)); // 移除LIMIT和OFFSET参数
    const total = parseInt(countResult.rows[0].total);
    
    logger.info('[Members] 成员列表信息获取成功');
    
    return res.json({
      success: true,
      message: '成员列表信息获取成功',
      data: {
        members: members.map(member => ({
          // 用户基本信息
          userId: parseInt(member.user_id),              // 用户ID
          username: member.username,                     // 用户名
          nickname: member.nickname,                     // 昵称
          realName: member.real_name,                    // 真实姓名
          phone: member.phone,                          // 电话
          email: member.email,                          // 邮箱
          gender: member.gender,                        // 性别
          birthday: member.birthday,                    // 生日
          avatarUrl: member.avatar_url,                 // 头像URL
          userStatus: member.user_status,               // 用户状态
          userCreatedAt: member.user_created_at,        // 用户创建时间
          
          // 宿舍信息
          dorm: member.dorm_id ? {
            id: parseInt(member.dorm_id),               // 宿舍ID
            name: member.dorm_name,                     // 宿舍名称
            code: member.dorm_code,                     // 宿舍编码
            building: member.building,                  // 建筑物
            floor: member.floor,                        // 楼层
            roomNumber: member.dorm_room_number         // 宿舍房间号
          } : null,
          
          // 成员关系信息
          membership: member.user_dorm_id ? {
            id: parseInt(member.user_dorm_id),          // 用户宿舍关联ID
            role: member.member_role,                   // 成员角色
            status: member.dorm_member_status,          // 宿舍成员状态
            moveInDate: member.move_in_date,            // 入住日期
            moveOutDate: member.move_out_date,          // 搬离日期
            bedNumber: member.bed_number,               // 床位号
            roomNumber: member.member_room_number,      // 成员房间号
            monthlyShare: parseFloat(member.monthly_share) || 0,  // 月分摊费用
            depositPaid: parseFloat(member.deposit_paid) || 0,    // 已付押金
            lastPaymentDate: member.last_payment_date,   // 最后缴费日期
            joinedAt: member.joined_at,                 // 加入时间
            updatedAt: member.member_updated_at          // 成员信息更新时间
          } : null,
          
          // 费用信息
          expenses: {
            totalSplitAmount: parseFloat(member.total_split_amount) || 0,   // 总分摊金额
            totalPaidAmount: parseFloat(member.total_paid_amount) || 0,     // 总已付金额
            pendingAmount: parseFloat(member.pending_amount) || 0,          // 待支付金额
            overdueAmount: parseFloat(member.overdue_amount) || 0           // 逾期金额
          }
        })),
        pagination: {
          currentPage: parseInt(page),        // 当前页码
          pageSize: parseInt(limit),          // 每页数量
          total: total,                      // 总记录数
          totalPages: Math.ceil(total / limit) // 总页数
        }
      }
    });

  } catch (error) {
    logger.error('[Members] 获取成员列表信息失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '获取成员列表信息失败',
      error: error.message
    });
  }
}));

module.exports = router;