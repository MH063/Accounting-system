const BaseRepository = require('./BaseRepository');
const { query, pool } = require('../config/database');

class DormRepository extends BaseRepository {
  constructor() {
    super('dorms');
  }

  /**
   * 获取宿舍列表
   * @param {Object} filters - 筛选条件
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} 宿舍列表和总数
   */
  async getDormList(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = 'WHERE d.status = $1';
    let params = ['active'];
    let paramIndex = 2;
    
    // 添加搜索条件
    if (filters.search) {
      whereClause += ` AND d.dorm_name ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    if (filters.status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.type) {
      whereClause += ` AND d.type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }
    
    if (filters.genderLimit) {
      whereClause += ` AND d.gender_limit = $${paramIndex}`;
      params.push(filters.genderLimit);
      paramIndex++;
    }
    
    if (filters.building) {
      whereClause += ` AND d.building = $${paramIndex}`;
      params.push(filters.building);
      paramIndex++;
    }
    
    // 查询宿舍列表
    const dormQuery = `
      SELECT 
        d.id, d.dorm_name, d.dorm_code, d.address, d.capacity, 
        d.current_occupancy, d.description, d.status, d.type, 
        d.area, d.gender_limit, d.monthly_rent, d.deposit, 
        d.utility_included, d.building, d.floor, d.room_number,
        d.facilities, d.amenities, d.created_at, d.updated_at,
        
        -- 管理员信息
        u.username as admin_username,
        u.nickname as admin_nickname,
        u.avatar_url as admin_avatar
        
      FROM dorms d
      LEFT JOIN users u ON d.admin_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    // 调整countParams，确保包含所有WHERE子句参数但不包含LIMIT/OFFSET
    const countParams = params.slice(0, params.length - 2);
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dorms d
      LEFT JOIN users u ON d.admin_id = u.id
      ${whereClause}
    `;
    
    const [result, countResult] = await Promise.all([
      query(dormQuery, params),
      query(countQuery, countParams)
    ]);
    
    return {
      dorms: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  /**
   * 根据ID获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息或null
   */
  async getUserById(userId) {
    try {
      const queryText = 'SELECT id, status FROM users WHERE id = $1';
      const result = await query(queryText, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据宿舍编码获取宿舍信息
   * @param {string} dormCode - 宿舍编码
   * @returns {Promise<Object|null>} 宿舍信息或null
   */
  async getDormByCode(dormCode) {
    try {
      const queryText = 'SELECT id FROM dorms WHERE dorm_code = $1';
      const result = await query(queryText, [dormCode]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID获取宿舍详情
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object|null>} 宿舍详情或null
   */
  async getDormById(dormId) {
    try {
      // 直接查询宿舍详情，包含管理员信息
      const queryText = `
        SELECT 
          d.id,
          d.dorm_name,
          d.dorm_code,
          d.address,
          d.capacity,
          d.current_occupancy,
          d.description,
          d.status,
          d.type,
          d.area,
          d.gender_limit,
          d.monthly_rent,
          d.deposit,
          d.utility_included,
          d.building,
          d.floor,
          d.room_number,
          d.facilities,
          d.amenities,
          d.created_at,
          d.updated_at,
          u.username as admin_username,
          u.nickname as admin_nickname,
          u.avatar_url as admin_avatar_url
        FROM dorms d
        LEFT JOIN users u ON d.admin_id = u.id
        WHERE d.id = $1 AND d.status = 'active'
      `;
      const result = await query(queryText, [dormId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据宿舍ID获取宿舍成员列表
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Array>} 宿舍成员列表
   */
  async getDormMembers(dormId) {
    try {
      const queryText = `
        SELECT 
          u.id,
          u.username,
          u.nickname,
          u.real_name,
          u.phone,
          u.avatar_url,
          ud.member_role,
          ud.status as member_status,
          ud.move_in_date,
          ud.move_out_date,
          ud.bed_number,
          ud.room_number,
          ud.monthly_share,
          ud.deposit_paid,
          ud.last_payment_date
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        WHERE ud.dorm_id = $1 AND ud.status = 'active'
        ORDER BY ud.joined_at ASC
      `;
      const result = await query(queryText, [dormId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据宿舍ID获取宿舍费用统计
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 费用统计信息
   */
  async getDormExpenseStats(dormId) {
    try {
      const queryText = `
        SELECT 
          COUNT(*) as total_expenses,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
        FROM expenses
        WHERE dorm_id = $1
      `;
      const result = await query(queryText, [dormId]);
      return result.rows[0] || {};
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证宿舍是否存在且状态正常
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object|null>} 宿舍信息或null
   */
  async validateDormExists(dormId) {
    try {
      const queryText = 'SELECT id, status, admin_id FROM dorms WHERE id = $1 AND status != \'deleted\'';
      const result = await query(queryText, [dormId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证宿舍编码唯一性
   * @param {string} dormCode - 宿舍编码
   * @param {number} dormId - 宿舍ID（排除自身）
   * @returns {Promise<Object|null>} 重复的宿舍信息或null
   */
  async checkDormCodeUnique(dormCode, dormId) {
    try {
      const queryText = 'SELECT id FROM dorms WHERE dorm_code = $1 AND id != $2';
      const result = await query(queryText, [dormCode, dormId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取宿舍当前入住人数
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<number>} 当前入住人数
   */
  async getDormCurrentOccupancy(dormId) {
    try {
      const queryText = 'SELECT current_occupancy FROM dorms WHERE id = $1';
      const result = await query(queryText, [dormId]);
      return result.rows[0] ? parseInt(result.rows[0].current_occupancy) : 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户宿舍关系记录（通过user_dorms表的ID）
   * @param {number} userDormId - user_dorms表的ID
   * @returns {Promise<Object|null>} 用户宿舍关系记录或null
   */
  async getUserDormById(userDormId) {
    try {
      const queryText = `
        SELECT 
          ud.*, 
          u.username, u.nickname, u.email,
          d.dorm_name, d.admin_id as dorm_admin_id
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.id = $1 AND ud.status = 'active'
      `;
      const result = await query(queryText, [userDormId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证操作人是否有权限更新成员角色
   * @param {number} userDormId - user_dorms表的ID
   * @param {number} operatorId - 操作人ID
   * @returns {Promise<boolean>} 是否有权限
   */
  async validateOperatorPermission(userDormId, operatorId) {
    try {
      // 检查当前用户是否有权限更新角色
      const queryText = `
        SELECT d.admin_id, ud.user_id
        FROM dorms d
        JOIN user_dorms ud ON d.id = ud.dorm_id
        WHERE ud.id = $1
          AND (d.admin_id = $2 OR 
               EXISTS (SELECT 1 FROM user_roles ur 
                       JOIN roles r ON ur.role_id = r.id 
                       WHERE ur.user_id = $2 
                         AND r.role_name IN ('system_admin', 'admin')))
      `;
      const result = await query(queryText, [userDormId, operatorId]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新宿舍成员角色（带权限验证和完整信息返回）
   * @param {number} userDormId - user_dorms表的ID
   * @param {string} newRole - 新角色
   * @param {boolean} updatePermissions - 是否同时更新权限
   * @returns {Promise<Object>} 更新后的完整信息
   */
  async updateUserDormRole(userDormId, newRole, updatePermissions = true) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. 获取当前记录信息
      const getCurrentRecordQuery = `
        SELECT 
          ud.*, 
          u.username, u.nickname, u.email,
          d.dorm_name, d.admin_id as dorm_admin_id
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.id = $1 AND ud.status = 'active'
        FOR UPDATE
      `;
      const currentResult = await client.query(getCurrentRecordQuery, [userDormId]);
      
      if (currentResult.rows.length === 0) {
        throw new Error('用户宿舍关系记录不存在或已失效');
      }
      
      const currentRecord = currentResult.rows[0];
      
      // 2. 更新成员角色
      let updateFields = "member_role = $1";
      const updateValues = [newRole];
      
      // 3. 根据角色更新权限（如果需要）
      if (updatePermissions) {
        updateFields += `, 
          can_approve_expenses = CASE 
            WHEN $2 = 'admin' THEN TRUE 
            ELSE FALSE 
          END,
          can_invite_members = CASE 
            WHEN $2 IN ('admin', 'member') THEN TRUE 
            ELSE FALSE 
          END,
          can_manage_facilities = CASE 
            WHEN $2 = 'admin' THEN TRUE 
            ELSE FALSE 
          END`;
        updateValues.push(newRole);
      }
      
      updateValues.push(userDormId);
      
      const updateQuery = `
        UPDATE user_dorms 
        SET 
          ${updateFields},
          updated_at = NOW()
        WHERE id = $${updateValues.length}
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, updateValues);
      
      // 4. 处理宿舍管理员变更（如果需要）
      if (newRole === 'admin') {
        // 如果新角色是'admin'，则更新宿舍的管理员
        const updateDormAdminQuery = `
          UPDATE dorms 
          SET admin_id = $1
          WHERE id = $2 
            AND (admin_id IS NULL OR admin_id != $1)
        `;
        await client.query(updateDormAdminQuery, [currentRecord.user_id, currentRecord.dorm_id]);
      } else if (currentRecord.member_role === 'admin' && currentRecord.dorm_admin_id === currentRecord.user_id) {
        // 如果从'admin'降级为其他角色，并且该用户是宿舍管理员，需要清除宿舍管理员
        const clearDormAdminQuery = `
          UPDATE dorms 
          SET admin_id = NULL 
          WHERE id = $1 AND admin_id = $2
        `;
        await client.query(clearDormAdminQuery, [currentRecord.dorm_id, currentRecord.user_id]);
      }
      
      // 5. 获取更新后的详细信息
      const getUpdatedRecordQuery = `
        SELECT 
          ud.*, 
          u.username, u.nickname, u.email,
          d.dorm_name, d.admin_id as dorm_admin_id
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.id = $1
      `;
      const updatedResult = await client.query(getUpdatedRecordQuery, [userDormId]);
      
      await client.query('COMMIT');
      
      return updatedResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 记录审计日志
   * @param {Object} auditData - 审计日志数据
   * @returns {Promise<void>}
   */
  async logAuditAction(auditData) {
    try {
      const {
        tableName,
        operation,
        recordId,
        oldValues,
        newValues,
        userId,
        sessionId,
        ipAddress,
        userAgent
      } = auditData;
      
      const queryText = `
        INSERT INTO audit_logs (
          table_name,
          operation,
          record_id,
          old_values,
          new_values,
          user_id,
          session_id,
          ip_address,
          user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      const values = [
        tableName,
        operation,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        userId,
        sessionId || null,
        ipAddress || null,
        userAgent || null
      ];
      
      await query(queryText, values);
    } catch (error) {
      // 审计日志记录失败不应影响主流程
      console.error('审计日志记录失败:', error);
    }
  }

  /**
   * 发送通知
   * @param {Object} notificationData - 通知数据
   * @returns {Promise<Object>} 通知记录
   */
  async sendNotification(notificationData) {
    try {
      const {
        title,
        content,
        type,
        userId,
        dormId,
        senderId,
        relatedId,
        relatedTable
      } = notificationData;
      
      const queryText = `
        INSERT INTO notifications (
          title,
          content,
          type,
          user_id,
          dorm_id,
          sender_id,
          related_id,
          related_table
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        title,
        content,
        type || 'info',
        userId,
        dormId || null,
        senderId || null,
        relatedId || null,
        relatedTable || null
      ];
      
      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      // 通知发送失败不应影响主流程
      console.error('通知发送失败:', error);
      throw error;
    }
  }

  /**
   * 更新宿舍成员角色
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 用户ID
   * @param {string} role - 新角色
   * @returns {Promise<void>}
   */
  async updateMemberRole(dormId, userId, role) {
    try {
      const queryText = `
        UPDATE user_dorms 
        SET member_role = $1 
        WHERE dorm_id = $2 AND user_id = $3 AND status = 'active'
      `;
      await query(queryText, [role, dormId, userId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 设置用户为宿舍管理员
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async setMemberAsAdmin(dormId, userId) {
    try {
      // 使用UPSERT模式更新或插入记录
      const queryText = `
        INSERT INTO user_dorms (user_id, dorm_id, member_role, status, move_in_date)
        VALUES ($1, $2, 'admin', 'active', CURRENT_DATE)
        ON CONFLICT (user_id, dorm_id) 
        DO UPDATE SET member_role = 'admin', updated_at = NOW()
      `;
      await query(queryText, [userId, dormId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新宿舍信息
   * @param {number} dormId - 宿舍ID
   * @param {Object} dormData - 宿舍数据
   * @returns {Promise<Object>} 更新后的宿舍信息
   */
  async updateDorm(dormId, dormData) {
    try {
      // 构建动态更新语句
      const fields = [];
      const values = [];
      let index = 1;

      // 添加需要更新的字段
      if (dormData.dormName !== undefined) {
        fields.push(`dorm_name = $${index}`);
        values.push(dormData.dormName);
        index++;
      }
      
      if (dormData.dormCode !== undefined) {
        fields.push(`dorm_code = $${index}`);
        values.push(dormData.dormCode);
        index++;
      }
      
      if (dormData.address !== undefined) {
        fields.push(`address = $${index}`);
        values.push(dormData.address);
        index++;
      }
      
      if (dormData.capacity !== undefined) {
        fields.push(`capacity = $${index}`);
        values.push(dormData.capacity);
        index++;
      }
      
      if (dormData.description !== undefined) {
        fields.push(`description = $${index}`);
        values.push(dormData.description);
        index++;
      }
      
      if (dormData.status !== undefined) {
        fields.push(`status = $${index}`);
        values.push(dormData.status);
        index++;
      }
      
      if (dormData.type !== undefined) {
        fields.push(`type = $${index}`);
        values.push(dormData.type);
        index++;
      }
      
      if (dormData.area !== undefined) {
        fields.push(`area = $${index}`);
        values.push(dormData.area);
        index++;
      }
      
      if (dormData.genderLimit !== undefined) {
        fields.push(`gender_limit = $${index}`);
        values.push(dormData.genderLimit);
        index++;
      }
      
      if (dormData.monthlyRent !== undefined) {
        fields.push(`monthly_rent = $${index}`);
        values.push(dormData.monthlyRent);
        index++;
      }
      
      if (dormData.deposit !== undefined) {
        fields.push(`deposit = $${index}`);
        values.push(dormData.deposit);
        index++;
      }
      
      if (dormData.utilityIncluded !== undefined) {
        fields.push(`utility_included = $${index}`);
        values.push(dormData.utilityIncluded);
        index++;
      }
      
      if (dormData.contactPerson !== undefined) {
        fields.push(`contact_person = $${index}`);
        values.push(dormData.contactPerson);
        index++;
      }
      
      if (dormData.contactPhone !== undefined) {
        fields.push(`contact_phone = $${index}`);
        values.push(dormData.contactPhone);
        index++;
      }
      
      if (dormData.contactEmail !== undefined) {
        fields.push(`contact_email = $${index}`);
        values.push(dormData.contactEmail);
        index++;
      }
      
      if (dormData.building !== undefined) {
        fields.push(`building = $${index}`);
        values.push(dormData.building);
        index++;
      }
      
      if (dormData.floor !== undefined) {
        fields.push(`floor = $${index}`);
        values.push(dormData.floor);
        index++;
      }
      
      if (dormData.roomNumber !== undefined) {
        fields.push(`room_number = $${index}`);
        values.push(dormData.roomNumber);
        index++;
      }
      
      if (dormData.facilities !== undefined) {
        fields.push(`facilities = $${index}`);
        values.push(JSON.stringify(dormData.facilities));
        index++;
      }
      
      if (dormData.amenities !== undefined) {
        fields.push(`amenities = $${index}`);
        values.push(JSON.stringify(dormData.amenities));
        index++;
      }
      
      if (dormData.adminId !== undefined) {
        fields.push(`admin_id = $${index}`);
        values.push(dormData.adminId);
        index++;
      }
      
      // 如果没有需要更新的字段，直接返回
      if (fields.length === 0) {
        const existingDorm = await this.getDormById(dormId);
        return existingDorm;
      }
      
      // 添加更新时间戳
      fields.push(`updated_at = NOW()`);
      
      // 构建最终的SQL语句
      const queryText = `
        UPDATE dorms 
        SET ${fields.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `;
      
      values.push(dormId);
      
      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 创建新宿舍
   * @param {Object} dormData - 宿舍数据
   * @returns {Promise<Object>} 创建的宿舍信息
   */
  async createDorm(dormData) {
    try {
      const queryText = `
        INSERT INTO dorms (
          dorm_name, dorm_code, address, capacity, description,
          status, type, area, gender_limit, monthly_rent, deposit,
          utility_included, contact_person, contact_phone, contact_email,
          building, floor, room_number, facilities, amenities, admin_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        ) RETURNING *
      `;

      const values = [
        dormData.dormName,
        dormData.dormCode || null,
        dormData.address,
        dormData.capacity,
        dormData.description || null,
        dormData.status || 'active',
        dormData.type || 'standard',
        dormData.area || null,
        dormData.genderLimit || null,
        dormData.monthlyRent || 0.00,
        dormData.deposit || 0.00,
        dormData.utilityIncluded || false,
        dormData.contactPerson || null,
        dormData.contactPhone || null,
        dormData.contactEmail || null,
        dormData.building || null,
        dormData.floor || null,
        dormData.roomNumber || null,
        JSON.stringify(dormData.facilities || []),
        JSON.stringify(dormData.amenities || []),
        dormData.adminId || null
      ];

      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除宿舍（软删除）
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 执行删除操作的用户ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteDorm(dormId, userId) {
    try {
      // 获取数据库连接
      const client = await pool.connect();
      
      try {
        // 开始事务
        await client.query('BEGIN');
        // 1. 检查宿舍是否存在且未被删除
        const dormCheckQuery = `
          SELECT id, dorm_name, current_occupancy, status 
          FROM dorms 
          WHERE id = $1 AND status != 'deleted'
        `;
        const dormCheckResult = await client.query(dormCheckQuery, [dormId]);
        
        if (dormCheckResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return { success: false, message: '宿舍不存在或已被删除' };
        }
        
        const dorm = dormCheckResult.rows[0];
        
        // 2. 检查宿舍是否为空
        if (dorm.current_occupancy > 0) {
          await client.query('ROLLBACK');
          return { success: false, message: '宿舍仍有成员入住，无法删除' };
        }
        
        // 3. 检查是否有未完成的费用记录
        const expenseCheckQuery = `
          SELECT COUNT(*) as count 
          FROM expenses 
          WHERE dorm_id = $1 AND status NOT IN ('cancelled', 'paid')
        `;
        const expenseCheckResult = await client.query(expenseCheckQuery, [dormId]);
        const pendingExpenses = parseInt(expenseCheckResult.rows[0].count);
        
        if (pendingExpenses > 0) {
          await client.query('ROLLBACK');
          return { success: false, message: `宿舍有关联的未完成费用记录(${pendingExpenses}条)，无法删除` };
        }
        
        // 4. 检查是否有未完成的报修申请
        const maintenanceCheckQuery = `
          SELECT COUNT(*) as count 
          FROM maintenance_requests 
          WHERE dorm_id = $1 AND status NOT IN ('completed', 'cancelled')
        `;
        const maintenanceCheckResult = await client.query(maintenanceCheckQuery, [dormId]);
        const pendingRequests = parseInt(maintenanceCheckResult.rows[0].count);
        
        if (pendingRequests > 0) {
          await client.query('ROLLBACK');
          return { success: false, message: `宿舍有关联的未完成报修申请(${pendingRequests}条)，无法删除` };
        }
        
        // 5. 执行软删除（更新状态为inactive）
        const deleteQuery = `
          UPDATE dorms 
          SET status = 'inactive', updated_at = NOW() 
          WHERE id = $1 
          RETURNING *
        `;
        const deleteResult = await client.query(deleteQuery, [dormId]);
        
        // 6. 提交事务
        await client.query('COMMIT');
        
        return { 
          success: true, 
          data: deleteResult.rows[0],
          message: '宿舍删除成功' 
        };
        
      } catch (error) {
        // 回滚事务
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // 释放客户端连接
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DormRepository;