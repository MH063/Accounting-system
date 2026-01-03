const logger = require('../config/logger');
const { query, pool } = require('../config/database');

class DormInviteService {
  /**
   * 验证邀请人权限
   * @param {number} userId - 邀请人ID
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 验证结果
   */
  async validateInviterPermission(userId, dormId) {
    try {
      const queryText = `
        SELECT ud.id, ud.can_invite_members, d.admin_id
        FROM user_dorms ud
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.user_id = $1 
          AND ud.dorm_id = $2 
          AND ud.status = 'active'
          AND (ud.can_invite_members = TRUE OR d.admin_id = $1)
      `;
      
      const result = await query(queryText, [userId, dormId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '您没有权限邀请成员到此宿舍'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      logger.error('[DormInviteService] 验证邀请人权限失败', { 
        error: error.message,
        userId,
        dormId
      });
      throw error;
    }
  }

  /**
   * 验证宿舍信息
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 验证结果
   */
  async validateDorm(dormId) {
    try {
      const queryText = `
        SELECT id, dorm_name, capacity, current_occupancy
        FROM dorms
        WHERE id = $1 
          AND status = 'active'
          AND current_occupancy < capacity
      `;
      
      const result = await query(queryText, [dormId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: '宿舍不存在、状态不正常或已满员'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      logger.error('[DormInviteService] 验证宿舍信息失败', { 
        error: error.message,
        dormId
      });
      throw error;
    }
  }

  /**
   * 查找或创建被邀请用户
   * @param {Object} inviteData - 邀请数据
   * @returns {Promise<Object>} 用户信息
   */
  async findOrCreateUser(inviteData) {
    try {
      const { email, phone } = inviteData;
      
      // 根据邮箱或手机号查找用户
      let queryText = `
        SELECT id, username, email, phone, status
        FROM users
        WHERE 
      `;
      
      let queryParams = [];
      
      if (email) {
        queryText += 'email = $1';
        queryParams = [email];
      } else if (phone) {
        queryText += 'phone = $1';
        queryParams = [phone];
      } else {
        throw new Error('必须提供邮箱或手机号');
      }
      
      let result = await query(queryText, queryParams);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        
        // 检查是否为系统内置角色
        const roleCheckQuery = `
          SELECT EXISTS (
            SELECT 1 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND r.is_system_role = TRUE
          ) as is_system_role
        `;
        const roleCheck = await query(roleCheckQuery, [user.id]);
        
        if (roleCheck.rows[0].is_system_role) {
          return {
            success: false,
            message: '系统内置角色无法被邀请加入宿舍'
          };
        }
      }

      // 如果用户不存在，创建新用户
      if (result.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // 生成用户名
          const username = email ? email.split('@')[0] : `user_${Date.now()}`;
          
          // 创建新用户
          const createUserQuery = `
            INSERT INTO users (username, email, phone, password_hash, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING id, username, email, phone, status
          `;
          
          const createUserParams = [
            username,
            email || null,
            phone || null,
            ''  // 临时密码哈希，后续用户注册时会更新
          ];
          
          const createUserResult = await client.query(createUserQuery, createUserParams);
          
          await client.query('COMMIT');
          
          return {
            success: true,
            data: createUserResult.rows[0],
            isNewUser: true
          };
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error('[DormInviteService] 创建新用户事务失败，事务已回滚', { 
            error: error.message,
            stack: error.stack,
            inviteData
          });
          throw error;
        } finally {
          client.release();
        }
      }
      
      return {
        success: true,
        data: result.rows[0],
        isNewUser: false
      };
    } catch (error) {
      logger.error('[DormInviteService] 查找或创建用户失败', { 
        error: error.message,
        inviteData
      });
      throw error;
    }
  }

  /**
   * 检查用户是否已是宿舍成员
   * @param {number} userId - 用户ID
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 检查结果
   */
  async checkExistingMembership(userId, dormId) {
    try {
      // 检查用户是否已经是该宿舍的成员（活跃状态）
      let queryText = `
        SELECT id, status
        FROM user_dorms
        WHERE user_id = $1 AND dorm_id = $2
      `;
      
      let result = await query(queryText, [userId, dormId]);
      
      if (result.rows.length > 0) {
        const membership = result.rows[0];
        
        if (membership.status === 'active') {
          return {
            success: false,
            message: '该用户已经是此宿舍的成员'
          };
        }
        
        if (membership.status === 'pending') {
          // 检查是否存在待处理的邀请
          queryText = `
            SELECT id, invite_code, invite_expires_at
            FROM user_dorms
            WHERE user_id = $1 
              AND dorm_id = $2 
              AND status = 'pending'
              AND invite_expires_at > NOW()
          `;
          
          result = await query(queryText, [userId, dormId]);
          
          if (result.rows.length > 0) {
            return {
              success: false,
              message: '该用户已收到此宿舍的邀请，邀请尚未过期'
            };
          }
        }
      }
      
      return {
        success: true
      };
    } catch (error) {
      logger.error('[DormInviteService] 检查现有成员关系失败', { 
        error: error.message,
        userId,
        dormId
      });
      throw error;
    }
  }

  /**
   * 生成唯一邀请码
   * @returns {Promise<string>} 邀请码
   */
  async generateInviteCode() {
    try {
      let inviteCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        // 生成随机邀请码（6位字母数字）
        inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 检查是否唯一
        const queryText = 'SELECT 1 FROM user_dorms WHERE invite_code = $1';
        const result = await query(queryText, [inviteCode]);
        
        isUnique = result.rows.length === 0;
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('无法生成唯一的邀请码');
      }
      
      return inviteCode;
    } catch (error) {
      logger.error('[DormInviteService] 生成邀请码失败', { 
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 创建邀请记录
   * @param {Object} inviteData - 邀请数据
   * @returns {Promise<Object>} 邀请记录
   */
  async createInviteRecord(inviteData) {
    try {
      const {
        userId,
        dormId,
        invitedBy,
        inviteCode,
        memberRole = 'member',
        inviteExpiresDays = 7,
        monthlyShare,
        moveInDate,
        bedNumber,
        roomNumber
      } = inviteData;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 插入邀请记录到user_dorms表
        const insertQuery = `
          INSERT INTO user_dorms (
            user_id,
            dorm_id,
            member_role,
            status,
            invited_by,
            invite_code,
            invite_expires_at,
            monthly_share,
            move_in_date,
            bed_number,
            room_number
          ) VALUES (
            $1, $2, $3, 'pending', $4, $5,
            NOW() + INTERVAL '${inviteExpiresDays} days',
            $6, $7, $8, $9
          ) RETURNING *
        `;
        
        const insertParams = [
          userId,
          dormId,
          memberRole,
          invitedBy,
          inviteCode,
          monthlyShare || null,
          moveInDate || null,
          bedNumber || null,
          roomNumber || null
        ];
        
        const result = await client.query(insertQuery, insertParams);
        
        // 更新宿舍统计信息（增加待确认成员数）
        // 注意：根据表结构，current_occupancy只统计活跃成员，所以这里不需要更新
        
        await client.query('COMMIT');
        
        return {
          success: true,
          data: result.rows[0]
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[DormInviteService] 创建邀请记录失败', { 
        error: error.message,
        inviteData
      });
      throw error;
    }
  }

  /**
   * 发送邀请通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Object>} 通知结果
   */
  async sendInviteNotification(notificationData) {
    try {
      const {
        userId,
        dormId,
        invitedBy,
        inviteCode,
        dormName,
        email,
        phone
      } = notificationData;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 创建系统通知
        const insertNotificationQuery = `
          INSERT INTO notifications (
            title,
            content,
            type,
            user_id,
            dorm_id,
            sender_id,
            related_id,
            related_table
          ) VALUES (
            $1, $2, 'info', $3, $4, $5, $6, 'user_dorms'
          ) RETURNING id
        `;
        
        const notificationTitle = '宿舍邀请通知';
        const notificationContent = `您被邀请加入宿舍"${dormName}"，邀请码：${inviteCode}`;
        
        const notificationParams = [
          notificationTitle,
          notificationContent,
          userId || null, // 如果用户还未注册，可能为null
          dormId,
          invitedBy,
          null // related_id将在创建邀请记录后更新
        ];
        
        const notificationResult = await client.query(insertNotificationQuery, notificationParams);
        const notificationId = notificationResult.rows[0].id;
        
        await client.query('COMMIT');
        
        return {
          success: true,
          data: {
            notificationId
          }
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[DormInviteService] 发送邀请通知失败', { 
        error: error.message,
        notificationData
      });
      throw error;
    }
  }

  /**
   * 邀请成员到宿舍
   * @param {number} inviterId - 邀请人ID
   * @param {number} dormId - 宿舍ID
   * @param {Object} inviteData - 邀请数据
   * @returns {Promise<Object>} 邀请结果
   */
  async inviteMember(inviterId, dormId, inviteData) {
    try {
      logger.info('[DormInviteService] 开始邀请成员', { 
        inviterId, 
        dormId, 
        inviteData 
      });
      
      // 1. 验证邀请人权限
      const permissionResult = await this.validateInviterPermission(inviterId, dormId);
      if (!permissionResult.success) {
        return permissionResult;
      }
      
      // 2. 验证宿舍信息
      const dormResult = await this.validateDorm(dormId);
      if (!dormResult.success) {
        return dormResult;
      }
      
      const dormInfo = dormResult.data;
      
      // 3. 查找或创建被邀请用户
      const userResult = await this.findOrCreateUser(inviteData);
      if (!userResult.success) {
        return userResult;
      }
      
      const userInfo = userResult.data;
      const isNewUser = userResult.isNewUser;
      
      // 4. 检查是否已存在成员关系
      const membershipResult = await this.checkExistingMembership(userInfo.id, dormId);
      if (!membershipResult.success) {
        return membershipResult;
      }
      
      // 5. 生成邀请码
      const inviteCode = await this.generateInviteCode();
      
      // 6. 创建邀请记录
      const inviteRecordData = {
        userId: userInfo.id,
        dormId: dormId,
        invitedBy: inviterId,
        inviteCode: inviteCode,
        memberRole: inviteData.memberRole,
        inviteExpiresDays: inviteData.inviteExpiresDays,
        monthlyShare: inviteData.monthlyShare,
        moveInDate: inviteData.moveInDate,
        bedNumber: inviteData.bedNumber,
        roomNumber: inviteData.roomNumber
      };
      
      const inviteRecordResult = await this.createInviteRecord(inviteRecordData);
      if (!inviteRecordResult.success) {
        return inviteRecordResult;
      }
      
      const inviteRecord = inviteRecordResult.data;
      
      // 7. 发送邀请通知
      const notificationData = {
        userId: userInfo.id,
        dormId: dormId,
        invitedBy: inviterId,
        inviteCode: inviteCode,
        dormName: dormInfo.dorm_name,
        email: userInfo.email,
        phone: userInfo.phone
      };
      
      await this.sendInviteNotification(notificationData);
      
      logger.info('[DormInviteService] 成员邀请成功', { 
        inviterId, 
        dormId, 
        userId: userInfo.id,
        inviteRecordId: inviteRecord.id
      });
      
      return {
        success: true,
        data: {
          inviteRecord: inviteRecord,
          userInfo: {
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            phone: userInfo.phone,
            isNewUser: isNewUser
          },
          dormInfo: {
            id: dormInfo.id,
            dormName: dormInfo.dorm_name
          }
        },
        message: isNewUser ? '邀请已发送，用户需要注册后才能加入宿舍' : '邀请已发送'
      };
    } catch (error) {
      logger.error('[DormInviteService] 邀请成员失败', { 
        error: error.message,
        inviterId,
        dormId,
        inviteData
      });
      throw error;
    }
  }
}

module.exports = DormInviteService;