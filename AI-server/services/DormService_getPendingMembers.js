// 这个方法应该添加到DormService.js中的getDormMembers方法后面

  /**
   * 获取待审核成员列表
   * @param {string} room - 房间名称（可选）
   * @returns {Promise<Object>} 待审核成员列表结果
   */
  async getPendingMembers(room) {
    try {
      logger.info('[DormService] 获取待审核成员列表', { room });
      
      const { query } = require('../config/database');
      
      // 构建查询SQL
      let sql = `
        SELECT 
          ud.id,
          ud.user_id,
          ud.dorm_id,
          u.username,
          u.nickname,
          u.email,
          u.phone,
          u.avatar_url,
          ud.member_role,
          ud.status,
          ud.bed_number,
          ud.room_number,
          ud.monthly_share,
          ud.joined_at,
          d.dorm_name,
          d.dorm_code
        FROM user_dorms ud
        LEFT JOIN users u ON ud.user_id = u.id
        LEFT JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.status = 'pending'
      `;
      
      const params = [];
      
      // 如果提供了房间名称，添加过滤条件
      if (room) {
        sql += ` AND d.dorm_name LIKE $1`;
        params.push(`%${room}%`);
      }
      
      sql += ` ORDER BY ud.joined_at DESC`;
      
      const result = await query(sql, params);
      
      const members = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        dormId: row.dorm_id,
        username: row.username,
        nickname: row.nickname,
        email: row.email,
        phone: row.phone,
        avatarUrl: row.avatar_url,
        memberRole: row.member_role,
        status: row.status,
        bedNumber: row.bed_number,
        roomNumber: row.room_number,
        monthlyShare: parseFloat(row.monthly_share) || 0,
        joinedAt: row.joined_at,
        dormName: row.dorm_name,
        dormCode: row.dorm_code
      }));
      
      logger.info('[DormService] 待审核成员列表获取成功', { count: members.length });
      
      return {
        success: true,
        data: {
          members: members
        },
        message: '待审核成员列表获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取待审核成员列表失败', { error: error.message, room });
      throw error;
    }
  }
