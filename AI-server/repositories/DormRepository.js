const BaseRepository = require('./BaseRepository');
const { query, pool } = require('../config/database');
const logger = require('../config/logger');

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
    
    // 构建查询条件 (排除非活跃状态的寝室，物理删除的记录已不在数据库中)
    let whereClause = 'WHERE d.status != $1';
    let params = ['inactive'];
    let paramIndex = 2;
    
    // 添加搜索条件
    if (filters.search) {
      whereClause += ` AND (d.dorm_name ILIKE $${paramIndex} OR d.dorm_code ILIKE $${paramIndex})`;
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
          u.avatar_url as admin_avatar_url,
          
          -- 解散流程信息
          dd.id as dismissal_id,
          dd.status as dismissal_status,
          dd.initiated_by as dismissal_initiated_by,
          dd.created_at as dismissal_created_at,
          dd.updated_at as dismissal_updated_at
        FROM dorms d
        LEFT JOIN users u ON d.admin_id = u.id
        LEFT JOIN dorm_dismissal dd ON d.id = dd.dorm_id AND dd.status = 'pending'
        WHERE d.id = $1
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
   * @param {boolean} activeOnly - 是否只返回活跃成员，默认 true
   * @returns {Promise<Array>} 宿舍成员列表
   */
  async getDormMembers(dormId, activeOnly = true) {
    try {
      let statusCondition = activeOnly ? "AND ud.status = 'active'" : "";
      const queryText = `
        SELECT 
          ud.id as user_dorm_id,
          u.id as user_id,
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
          ud.last_payment_date,
          d.dorm_name,
          d.building
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.dorm_id = $1 ${statusCondition}
        AND u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        )
        ORDER BY ud.joined_at ASC
      `;
      const result = await query(queryText, [dormId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取宿舍当前入住人数（统计 active 状态的成员）
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<number>} 入住人数
   */
  async getDormCurrentOccupancy(dormId) {
    try {
      const queryText = `
        SELECT COUNT(*) as count
        FROM user_dorms ud
        WHERE ud.dorm_id = $1 AND ud.status = 'active'
      `;
      const result = await query(queryText, [dormId]);
      return parseInt(result.rows[0]?.count || 0);
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
      const queryText = 'SELECT id, status, admin_id FROM dorms WHERE id = CAST($1 AS INTEGER)';
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
   * 根据位置信息查找宿舍
   * @param {Object} info - 包含 building, floor, roomNumber
   * @returns {Promise<Object|null>} 宿舍信息或null
   */
  async findDormByInfo(info) {
    try {
      const { building, floor, roomNumber } = info;
      const queryText = `
        SELECT * FROM dorms 
        WHERE building = $1 AND floor = $2 AND room_number = $3 
        AND status != 'inactive'
      `;
      const result = await query(queryText, [building, floor, roomNumber]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证操作人是否有权限更新成员状态
   * @param {number} userDormId - user_dorms表的ID
   * @param {number} operatorId - 操作人ID
   * @param {string} newStatus - 新状态
   * @returns {Promise<boolean>} 是否有权限
   */
  async validateOperatorPermissionForStatusUpdate(userDormId, operatorId, newStatus) {
    try {
      // 检查当前用户是否有权限更新状态
      const queryText = `
        SELECT ud.id, ud.user_id, ud.dorm_id, ud.status as current_status,
               d.dorm_name,
               u.username, u.nickname
        FROM user_dorms ud
        JOIN dorms d ON ud.dorm_id = d.id
        JOIN users u ON ud.user_id = u.id
        WHERE ud.id = $1
          AND (
              -- 系统管理员或管理员权限
              EXISTS (SELECT 1 FROM user_roles ur 
                      JOIN roles r ON ur.role_id = r.id 
                      WHERE ur.user_id = $2 
                        AND r.role_name IN ('system_admin', 'admin')) OR
              -- 成员自己（只能申请离开）
              (ud.user_id = $2 AND $3 = 'inactive')
          )
      `;
      console.log('[DEBUG] validateOperatorPermissionForStatusUpdate query:', queryText, [userDormId, operatorId, newStatus]);
      const result = await query(queryText, [userDormId, operatorId, newStatus]);
      console.log('[DEBUG] validateOperatorPermissionForStatusUpdate result:', result.rows);
      return result.rows.length > 0;
    } catch (error) {
      console.error('[DEBUG] validateOperatorPermissionForStatusUpdate error:', error);
      throw error;
    }
  }

  /**
   * 检查成员是否有未结清的费用
   * @param {number} userId - 用户ID
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 未结清费用信息
   */
  async checkUnpaidExpenses(userId, dormId) {
    try {
      const queryText = `
        SELECT 
            COUNT(*) as pending_count,
            SUM(split_amount - paid_amount) as pending_amount
        FROM expense_splits
        WHERE user_id = $1 
          AND dorm_id = $2
          AND payment_status IN ('pending', 'overdue')
          AND split_amount > paid_amount
      `;
      const result = await query(queryText, [userId, dormId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新宿舍成员状态（带权限验证和完整信息返回）
   * @param {number} userDormId - user_dorms表的ID
   * @param {string} newStatus - 新状态
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的完整信息
   */
  async updateUserDormStatus(userDormId, newStatus, updateData) {
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
        WHERE ud.id = $1
        FOR UPDATE
      `;
      const currentResult = await client.query(getCurrentRecordQuery, [userDormId]);
      
      if (currentResult.rows.length === 0) {
        throw new Error('用户宿舍关系记录不存在');
      }
      
      const currentRecord = currentResult.rows[0];
      
      // 2. 构建更新语句
      let updateFields = "status = $1";
      const updateValues = [newStatus];
      let paramIndex = 2;
      
      // 3. 根据不同的状态变更，执行不同的操作
      if (newStatus === 'inactive' && currentRecord.status === 'active') {
        // 成员搬离（active → inactive）
        updateFields += `, move_out_date = $${paramIndex}`;
        updateValues.push(updateData.moveOutDate || new Date());
        paramIndex++;
        
        // 清除权限（搬离后不再有权限）
        updateFields += `, can_approve_expenses = FALSE, can_invite_members = FALSE, can_manage_facilities = FALSE`;
      } else if (newStatus === 'active' && currentRecord.status === 'inactive') {
        // 成员重新激活（inactive → active）
        updateFields += `, move_in_date = COALESCE(move_in_date, $${paramIndex})`;
        updateValues.push(updateData.moveInDate || new Date());
        paramIndex++;
        
        updateFields += `, move_out_date = NULL`;
      } else if (newStatus === 'active' && currentRecord.status === 'pending') {
        // 确认邀请（pending → active）
        updateFields += `, move_in_date = COALESCE(move_in_date, $${paramIndex}), joined_at = NOW()`;
        updateValues.push(updateData.moveInDate || new Date());
        paramIndex++;
      } else if (newStatus === 'inactive' && currentRecord.status === 'pending') {
        // 取消邀请/拒绝加入（pending → inactive）
        // 不需要额外字段
      }
      
      // 4. 添加更新时间戳
      updateFields += `, updated_at = NOW()`;
      
      updateValues.push(userDormId);
      
      const updateQuery = `
        UPDATE user_dorms 
        SET 
          ${updateFields}
        WHERE id = $${updateValues.length}
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, updateValues);
      
      // 5. 处理相关费用（可选业务逻辑）
      if (newStatus === 'inactive' && updateData.handleUnpaidExpenses) {
        if (updateData.handleUnpaidExpenses === 'waive') {
          // 将所有未结费用标记为已免除（waived）
          const waiveExpensesQuery = `
            UPDATE expense_splits 
            SET 
                payment_status = 'waived',
                updated_at = NOW()
            WHERE user_id = $1 
              AND dorm_id = $2
              AND payment_status IN ('pending', 'overdue')
          `;
          await client.query(waiveExpensesQuery, [currentRecord.user_id, currentRecord.dorm_id]);
        }
        // 其他处理方式（如keep、transfer）可以根据需要添加
      }
      
      // 6. 获取更新后的详细信息
      const getUpdatedRecordQuery = `
        SELECT 
          ud.*, 
          u.username, u.nickname, u.email,
          d.dorm_name, d.dorm_code,
          COALESCE(es.pending_amount, 0) as pending_amount,
          COALESCE(es.overdue_amount, 0) as overdue_amount
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        LEFT JOIN (
            SELECT user_id, dorm_id,
                   SUM(CASE WHEN payment_status = 'pending' THEN split_amount - paid_amount ELSE 0 END) as pending_amount,
                   SUM(CASE WHEN payment_status = 'overdue' THEN split_amount - paid_amount ELSE 0 END) as overdue_amount
            FROM expense_splits
            GROUP BY user_id, dorm_id
        ) es ON ud.user_id = es.user_id AND ud.dorm_id = es.dorm_id
        WHERE ud.id = $1
      `;
      const updatedResult = await client.query(getUpdatedRecordQuery, [userDormId]);
      
      await client.query('COMMIT');
      
      return updatedResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[DormRepository] 更新用户宿舍状态失败，事务已回滚', { 
        error: error.message,
        stack: error.stack,
        userDormId, 
        newStatus 
      });
      throw error;
    } finally {
      client.release();
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
        WHERE ud.id = $1
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
      // 获取成员记录和宿舍信息
      const memberQuery = `
        SELECT ud.user_id, ud.dorm_id
        FROM user_dorms ud
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.id = $1
      `;
      const memberResult = await query(memberQuery, [userDormId]);
      
      if (memberResult.rows.length === 0) {
        logger.info('[DormRepository] 成员记录不存在', { userDormId });
        return false;
      }
      
      const member = memberResult.rows[0];
      
      // 检查权限：成员自己、或系统管理员/管理员
      const permissionQuery = `
        SELECT ud.user_id
        FROM user_dorms ud
        WHERE ud.id = $1
          AND (
            -- 成员自己可以移除自己
            ud.user_id = $2 OR
            -- 系统管理员或管理员
            EXISTS (SELECT 1 FROM user_roles ur 
                    JOIN roles r ON ur.role_id = r.id 
                    WHERE ur.user_id = $2 
                      AND r.role_name IN ('system_admin', 'admin'))
          )
      `;
      
      logger.info('[DormRepository] 权限验证查询', { 
        userDormId, 
        operatorId,
        memberUserId: member.user_id
      });
      
      const result = await query(permissionQuery, [userDormId, operatorId]);
      logger.info('[DormRepository] 权限验证结果', { 
        hasPermission: result.rows.length > 0, 
        rows: result.rows,
        memberUserId: member.user_id,
        operatorId: operatorId
      });
      return result.rows.length > 0;
    } catch (error) {
      logger.error('[DormRepository] 权限验证异常', { error: error.message });
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
        SELECT ud.*, u.username, u.nickname, d.dorm_name
        FROM user_dorms ud
        JOIN users u ON ud.user_id = u.id
        JOIN dorms d ON ud.dorm_id = d.id
        WHERE ud.id = $1
        FOR UPDATE
      `;
      const currentResult = await client.query(getCurrentRecordQuery, [userDormId]);
      
      if (currentResult.rows.length === 0) {
        throw new Error('用户宿舍关系记录不存在');
      }
      
      // 2. 更新角色
      let updateFields = "member_role = $1, updated_at = NOW()";
      const updateValues = [newRole];
      
      // 3. 如果需要同时更新权限，根据角色设置默认权限
      if (updatePermissions) {
        if (newRole === 'admin') {
          updateFields += ", can_approve_expenses = TRUE, can_invite_members = TRUE, can_manage_facilities = TRUE";
        } else if (newRole === 'member') {
          updateFields += ", can_approve_expenses = FALSE, can_invite_members = FALSE, can_manage_facilities = FALSE";
        }
      }
      
      updateValues.push(userDormId);
      
      const updateQuery = `
        UPDATE user_dorms 
        SET ${updateFields}
        WHERE id = $${updateValues.length}
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, updateValues);
      
      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[DormRepository] 更新用户宿舍角色失败，事务已回滚', { 
        error: error.message,
        stack: error.stack,
        userDormId, 
        newRole 
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取所有楼栋列表
   * @returns {Promise<Array<string>>} 楼栋名称列表
   */
  async getBuildings() {
    try {
      const queryText = 'SELECT DISTINCT building FROM dorms WHERE building IS NOT NULL AND status NOT IN (\'deleted\', \'inactive\') ORDER BY building';
      const result = await query(queryText);
      return result.rows.map(row => row.building);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取宿舍统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getDormStats() {
    try {
      const queryText = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status IN ('active', 'normal') THEN 1 END) as normal_count,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
          COUNT(CASE WHEN current_occupancy >= capacity AND capacity > 0 THEN 1 END) as full
        FROM dorms
        WHERE status != 'inactive'
      `;
      const result = await query(queryText);
      const row = result.rows[0];

      if (process.env.NODE_ENV !== 'production') {
        logger.debug('[DormRepository] 宿舍统计查询结果', {
          total: row.total,
          normal_count: row.normal_count,
          maintenance: row.maintenance,
          full: row.full
        });
      }

      // PostgreSQL COUNT 返回的是字符串，需要转换为数字
      return {
        total: parseInt(row.total || 0),
        normal: parseInt(row.normal_count || 0),
        maintenance: parseInt(row.maintenance || 0),
        full: parseInt(row.full || 0)
      };
    } catch (error) {
      console.error('❌ 获取宿舍统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量物理删除宿舍及其关联数据
   * @param {Array<number>} ids - 宿舍ID列表
   * @param {number} userId - 执行操作的用户ID
   * @returns {Promise<Object>} 操作结果
   */
  async batchDeleteDorms(ids, userId) {
    try {
      // 获取数据库连接
      const client = await pool.connect();
      
      try {
        // 开始事务
        await client.query('BEGIN');

        // 1. 检查要删除的宿舍是否存在
        const dormsCheckQuery = 'SELECT id, dorm_name FROM dorms WHERE id = ANY($1)';
        const dormsCheckResult = await client.query(dormsCheckQuery, [ids]);
        const existingDorms = dormsCheckResult.rows;

        if (existingDorms.length === 0) {
          await client.query('ROLLBACK');
          return { success: false, message: '未找到指定的宿舍' };
        }

        const foundIds = existingDorms.map(d => d.id);
        logger.info('[DormRepository] 准备批量物理删除宿舍', { ids: foundIds });

        // 2. 处理关联数据 (手动处理 RESTRICT 约束的数据)
        // 删除相关的费用记录
        const deleteExpensesQuery = 'DELETE FROM expenses WHERE dorm_id = ANY($1)';
        await client.query(deleteExpensesQuery, [foundIds]);

        // 其他 CASCADE 约束的表由数据库自动处理

        // 3. 执行物理删除
        const deleteQuery = 'DELETE FROM dorms WHERE id = ANY($1) RETURNING id';
        const deleteResult = await client.query(deleteQuery, [foundIds]);
        const deletedCount = deleteResult.rowCount;

        // 4. 记录审计日志
        for (const dorm of existingDorms) {
          await this.logAudit(client, {
            tableName: 'dorms',
            operation: 'DELETE',
            recordId: dorm.id,
            oldValues: dorm,
            newValues: null,
            userId: userId
          });
        }

        // 5. 提交事务
        await client.query('COMMIT');

        return {
          success: true,
          deletedCount: deletedCount,
          message: `成功永久删除 ${deletedCount} 个宿舍及其关联数据`
        };

      } catch (error) {
        // 回滚事务
        await client.query('ROLLBACK');
        logger.error('[DormRepository] 批量删除宿舍事务失败', { error: error.message, ids });
        throw error;
      } finally {
        // 释放客户端连接
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量更新宿舍状态
   * @param {Array<number>} ids - 宿舍ID列表
   * @param {string} status - 新状态
   * @returns {Promise<number>} 受影响的行数
   */
  async batchUpdateDormStatus(ids, status) {
    try {
      const queryText = 'UPDATE dorms SET status = $1, updated_at = NOW() WHERE id = ANY($2)';
      const result = await query(queryText, [status, ids]);
      return result.rowCount;
    } catch (error) {
      throw error;
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
        dormData.status || 'normal',
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

        // 1. 检查宿舍是否存在
        const dormCheckQuery = `
          SELECT id, dorm_name, status 
          FROM dorms 
          WHERE id = $1
        `;
        const dormCheckResult = await client.query(dormCheckQuery, [dormId]);
        
        if (dormCheckResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return { success: false, message: '宿舍不存在' };
        }
        
        const dorm = dormCheckResult.rows[0];

        // 记录删除前的状态用于审计
        logger.info('[DormRepository] 准备物理删除宿舍', { dormId, dormName: dorm.dorm_name });

        // 2. 处理关联数据 (除了已有的 CASCADE 约束外，手动处理 RESTRICT 约束的数据)
        // 主要是 expenses 表，它有 ON DELETE RESTRICT
        
        // 删除相关的费用分摊记录 (虽然 expense_splits 对 expenses 是 CASCADE，但为了保险手动处理或直接删除 expenses)
        // 注意：因为 expense_splits 对 dorm_id 也是 CASCADE，所以删除 dorm 会自动删除 splits。
        // 但 expenses 对 dorm_id 是 RESTRICT，所以必须先删除 expenses。
        
        // 删除该宿舍的所有费用记录
        const deleteExpensesQuery = 'DELETE FROM expenses WHERE dorm_id = $1';
        await client.query(deleteExpensesQuery, [dormId]);

        // 其他有 ON DELETE CASCADE 约束的表（user_dorms, maintenance_requests, notifications, expense_splits）
        // 将在删除 dorms 记录时由数据库自动处理。

        // 3. 执行物理删除
        const deleteQuery = `
          DELETE FROM dorms 
          WHERE id = $1 
          RETURNING *
        `;
        const deleteResult = await client.query(deleteQuery, [dormId]);
        
        if (deleteResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return { success: false, message: '物理删除失败' };
        }

        // 4. 记录审计日志 (规则 7)
        await this.logAudit(client, {
          tableName: 'dorms',
          operation: 'DELETE',
          recordId: dormId,
          oldValues: dorm,
          newValues: null,
          userId: userId
        });
        
        // 5. 提交事务
        await client.query('COMMIT');
        
        return { 
          success: true, 
          data: deleteResult.rows[0],
          message: '宿舍及相关数据已永久删除' 
        };
        
      } catch (error) {
        // 回滚事务
        await client.query('ROLLBACK');
        logger.error('[DormRepository] 删除宿舍事务失败', { error: error.message, dormId });
        throw error;
      } finally {
        // 释放客户端连接
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 记录审计日志内部方法
   */
  async logAudit(client, { tableName, operation, recordId, oldValues, newValues, userId }) {
    const queryText = `
      INSERT INTO audit_logs (table_name, operation, record_id, old_values, new_values, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    await client.query(queryText, [
      tableName,
      operation,
      recordId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      userId
    ]);
  }

  /**
   * 查找可替代的管理员
   * @param {number} dormId - 宿舍ID
   * @param {number} excludeUserId - 排除的用户ID
   * @returns {Promise<Object|null>} 替代管理员信息或null
   */
  async findAlternativeAdmin(dormId, excludeUserId) {
    try {
      const queryText = `
        SELECT user_id, member_role 
        FROM user_dorms 
        WHERE dorm_id = $1 
          AND status = 'active'
          AND user_id != $2
        ORDER BY joined_at ASC
        LIMIT 1
      `;
      const result = await query(queryText, [dormId, excludeUserId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新宿舍管理员
   * @param {number} dormId - 宿舍ID
   * @param {number} newAdminId - 新管理员ID
   * @returns {Promise<void>}
   */
  async updateDormAdmin(dormId, newAdminId) {
    try {
      const queryText = `
        UPDATE dorms 
        SET admin_id = $1
        WHERE id = $2
      `;
      await query(queryText, [newAdminId, dormId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 同步宿舍入住人数
   * 根据 user_dorms 表中 status='active' 的记录数更新 dorms.current_occupancy
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<void>}
   */
  async syncOccupancy(dormId) {
    try {
      const syncQuery = `
        UPDATE dorms
        SET current_occupancy = (
            SELECT COUNT(*) 
            FROM user_dorms ud
            WHERE ud.dorm_id = $1 AND ud.status = 'active'
        ),
        updated_at = NOW()
        WHERE id = $1
      `;
      await query(syncQuery, [dormId]);
      console.log(`[DormRepository] 已同步宿舍 ${dormId} 的入住人数`);
    } catch (error) {
      console.error(`[DormRepository] 同步入住人数失败:`, error);
      throw error;
    }
  }

  /**
   * 物理删除成员
   * @param {number} userDormId - user_dorms表的ID
   * @returns {Promise<Object>} 删除的记录
   */
  async physicalDeleteMember(userDormId) {
    try {
      const getDormIdQuery = `SELECT dorm_id FROM user_dorms WHERE id = $1`;
      const dormResult = await query(getDormIdQuery, [userDormId]);
      const dormId = dormResult.rows[0]?.dorm_id;

      const queryText = `
        DELETE FROM user_dorms 
        WHERE id = $1
        RETURNING *
      `;
      const result = await query(queryText, [userDormId]);
      
      if (result.rows.length > 0 && dormId) {
        await this.syncOccupancy(dormId);
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 逻辑删除成员
   * @param {number} userDormId - user_dorms表的ID
   * @param {string} handleUnpaidExpenses - 处理未结费用的方式
   * @returns {Promise<Object>} 更新后的记录
   */
  async logicalDeleteMember(userDormId, handleUnpaidExpenses) {
    try {
      const getDormIdQuery = `SELECT dorm_id FROM user_dorms WHERE id = $1`;
      const dormResult = await query(getDormIdQuery, [userDormId]);
      const dormId = dormResult.rows[0]?.dorm_id;

      const queryText = `
        UPDATE user_dorms 
        SET 
          status = 'inactive',
          move_out_date = CASE 
            WHEN move_in_date IS NULL OR move_in_date < CURRENT_DATE THEN CURRENT_DATE
            ELSE move_in_date + 1
          END,
          can_approve_expenses = FALSE,
          can_invite_members = FALSE,
          can_manage_facilities = FALSE,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await query(queryText, [userDormId]);

      if (result.rows.length > 0 && dormId) {
        await this.syncOccupancy(dormId);
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 免除未结费用
   * @param {number} userId - 用户ID
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<void>}
   */
  async waiveUnpaidExpenses(userId, dormId) {
    try {
      const queryText = `
        UPDATE expense_splits 
        SET 
            payment_status = 'waived',
            updated_at = NOW()
        WHERE user_id = $1 
          AND dorm_id = $2
          AND payment_status IN ('pending', 'overdue')
      `;
      await query(queryText, [userId, dormId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取寝室设置
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 寝室设置
   */
  async getDormSettings(dormId) {
    try {
      const queryText = `
        SELECT 
          *
        FROM dorm_settings 
        WHERE dorm_id = $1
      `;
      const result = await query(queryText, [dormId]);
      return result.rows[0] || {};
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新寝室设置
   * @param {number} dormId - 宿舍ID
   * @param {Object} settings - 设置数据
   * @returns {Promise<Object>} 更新后的设置
   */
  async updateDormSettings(dormId, settings) {
    try {
      // 检查设置是否存在
      const existingSettings = await this.getDormSettings(dormId);
      
      let result;
      if (existingSettings && existingSettings.id) {
        // 更新现有设置
        const updateQuery = `
          UPDATE dorm_settings 
          SET 
            basic = $1,
            notifications = $2,
            updated_at = NOW()
          WHERE dorm_id = $3
          RETURNING *
        `;
        result = await query(updateQuery, [
          JSON.stringify(settings.basic || {}),
          JSON.stringify(settings.notifications || {}),
          dormId
        ]);
      } else {
        // 创建新设置
        const insertQuery = `
          INSERT INTO dorm_settings (
            dorm_id,
            basic,
            notifications,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, NOW(), NOW()
          ) RETURNING *
        `;
        result = await query(insertQuery, [
          dormId,
          JSON.stringify(settings.basic || {}),
          JSON.stringify(settings.notifications || {})
        ]);
      }
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取寝室变更历史
   * @param {number} dormId - 宿舍ID
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} 变更历史列表
   */
  async getDormHistory(dormId, pagination = { page: 1, limit: 10 }) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      const queryText = `
        SELECT 
          *
        FROM audit_logs 
        WHERE record_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs 
        WHERE record_id = $1
      `;
      
      const [result, countResult] = await Promise.all([
        query(queryText, [dormId, limit, offset]),
        query(countQuery, [dormId])
      ]);
      
      return {
        records: result.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 开始解散流程
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 操作人ID
   * @returns {Promise<Object>} 操作结果
   */
  async startDismissProcess(dormId, userId) {
    try {
      // 开始事务
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 检查宿舍是否存在且状态允许开始解散
        const checkDormQuery = `
          SELECT * FROM dorms WHERE id = $1 AND status IN ('active', 'inactive', 'maintenance')
        `;
        const dormCheckResult = await client.query(checkDormQuery, [dormId]);
        
        if (dormCheckResult.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('宿舍不存在或状态不允许解散');
        }
        
        // 检查是否已经有活跃的解散流程
        const checkDismissalQuery = `
          SELECT * FROM dorm_dismissal WHERE dorm_id = $1 AND status = 'pending'
        `;
        const dismissalCheckResult = await client.query(checkDismissalQuery, [dormId]);
        
        if (dismissalCheckResult.rowCount > 0) {
          await client.query('ROLLBACK');
          throw new Error('该宿舍已经有一个活跃的解散流程');
        }
        
        // 更新宿舍状态为dismissing
        const updateDormQuery = `
          UPDATE dorms 
          SET 
            status = 'dismissing',
            updated_at = NOW()
          WHERE id = $1 AND status IN ('active', 'inactive', 'maintenance')
          RETURNING *
        `;
        const dormResult = await client.query(updateDormQuery, [dormId]);
        
        if (dormResult.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('宿舍不存在或状态不允许解散');
        }
        
        // 创建解散流程记录
        const createDismissQuery = `
          INSERT INTO dorm_dismissal (
            dorm_id,
            initiated_by,
            status,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, 'pending', NOW(), NOW()
          ) RETURNING *
        `;
        const dismissResult = await client.query(createDismissQuery, [dormId, userId]);
        
        await client.query('COMMIT');
        
        return {
          success: true,
          dorm: dormResult.rows[0],
          dismissal: dismissResult.rows[0]
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 确认解散
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 操作人ID
   * @returns {Promise<Object>} 操作结果
   */
  async confirmDismiss(dormId, userId) {
    try {
      // 开始事务
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 检查宿舍是否存在且状态为dismissing
        const checkDormQuery = `
          SELECT * FROM dorms WHERE id = $1 AND status = 'dismissing'
        `;
        const dormCheckResult = await client.query(checkDormQuery, [dormId]);
        
        if (dormCheckResult.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('宿舍不存在或状态不正确');
        }
        
        const dormResult = dormCheckResult;
        
        // 更新解散流程记录
        const updateDismissQuery = `
          UPDATE dorm_dismissal 
          SET 
            status = 'completed',
            completed_by = $1,
            completed_at = NOW(),
            updated_at = NOW()
          WHERE dorm_id = $2 AND status = 'pending'
          RETURNING *
        `;
        const dismissResult = await client.query(updateDismissQuery, [userId, dormId]);
        
        // 物理删除相关的费用记录 (expenses 对 dorm_id 是 RESTRICT)
        const deleteExpensesQuery = 'DELETE FROM expenses WHERE dorm_id = $1';
        await client.query(deleteExpensesQuery, [dormId]);
        
        // 执行物理删除 (其他关联表如 user_dorms, expense_splits 有 ON DELETE CASCADE)
        const deleteDormQuery = `
          DELETE FROM dorms 
          WHERE id = $1 
          RETURNING *
        `;
        const deleteDormResult = await client.query(deleteDormQuery, [dormId]);
        
        if (deleteDormResult.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('物理删除宿舍失败');
        }

        // 记录审计日志
        await this.logAudit(client, {
          tableName: 'dorms',
          operation: 'DELETE',
          recordId: dormId,
          oldValues: dormResult.rows[0],
          newValues: null,
          userId: userId
        });
        
        await client.query('COMMIT');
        
        return {
          success: true,
          dorm: deleteDormResult.rows[0],
          dismissal: dismissResult.rows[0]
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 取消解散
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 操作人ID
   * @returns {Promise<Object>} 操作结果
   */
  async cancelDismiss(dormId, userId) {
    try {
      // 开始事务
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 检查宿舍是否存在且状态为dismissing
        const checkDormQuery = `
          SELECT * FROM dorms WHERE id = $1 AND status = 'dismissing'
        `;
        const dormCheckResult = await client.query(checkDormQuery, [dormId]);
        
        if (dormCheckResult.rowCount === 0) {
          await client.query('ROLLBACK');
          throw new Error('宿舍不存在或状态不正确');
        }
        
        const dormResult = dormCheckResult;
        
        // 更新解散流程记录
        const updateDismissQuery = `
          UPDATE dorm_dismissal 
          SET 
            status = 'cancelled',
            cancelled_by = $1,
            cancelled_at = NOW(),
            updated_at = NOW()
          WHERE dorm_id = $2 AND status = 'pending'
          RETURNING *
        `;
        const dismissResult = await client.query(updateDismissQuery, [userId, dormId]);
        
        // 更新宿舍状态为active
        const updateDormStatusQuery = `
          UPDATE dorms 
          SET 
            status = 'active',
            updated_at = NOW()
          WHERE id = $1
        `;
        await client.query(updateDormStatusQuery, [dormId]);
        
        await client.query('COMMIT');
        
        return {
          success: true,
          dorm: dormResult.rows[0],
          dismissal: dismissResult.rows[0]
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取待结算费用
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Array>} 待结算费用列表
   */
  async getPendingFees(dormId) {
    try {
      const queryText = `
        SELECT 
          u.username,
          e.title as expense_name,
          es.split_amount as amount,
          es.payment_status as status
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        JOIN users u ON es.user_id = u.id
        WHERE es.dorm_id = $1 
          AND es.payment_status IN ('pending', 'overdue')
          AND es.split_amount > es.paid_amount
      `;
      const result = await query(queryText, [dormId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据用户ID获取用户所在的寝室信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 用户所在的寝室信息或null
   */
  async getDormByUserId(userId) {
    try {
      const queryText = `
        SELECT 
          d.*,
          u.username as admin_username,
          u.nickname as admin_nickname,
          u.avatar_url as admin_avatar_url,
          ud.member_role,
          ud.status as member_status,
          ud.move_in_date,
          ud.bed_number,
          ud.room_number,
          ud.monthly_share,
          ud.deposit_paid
        FROM user_dorms ud
        JOIN dorms d ON ud.dorm_id = d.id
        LEFT JOIN users u ON d.admin_id = u.id
        WHERE ud.user_id = $1 AND ud.status = 'active' AND d.status = 'active'
      `;
      const result = await query(queryText, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 添加宿舍成员
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 用户ID
   * @param {Object} memberData - 成员数据
   * @returns {Promise<Object>} 添加的成员记录
   */
  async addDormMember(dormId, userId, memberData) {
    try {
      const { bedNumber, roomNumber, moveInDate, memberRole = 'member' } = memberData;

      const checkQuery = `
        SELECT id, status FROM user_dorms 
        WHERE user_id = $1 AND dorm_id = $2
      `;
      const existingRecord = await query(checkQuery, [userId, dormId]);

      let queryText;
      let values;

      if (existingRecord.rows.length > 0) {
        const existingId = existingRecord.rows[0].id;
        const existingStatus = existingRecord.rows[0].status;
        
        if (existingStatus === 'active') {
          queryText = `
            UPDATE user_dorms SET
              member_role = $1,
              bed_number = $2,
              room_number = $3,
              move_in_date = $4,
              updated_at = NOW()
            WHERE id = $5
            RETURNING *
          `;
          values = [
            memberRole,
            bedNumber === '' ? null : bedNumber,
            roomNumber === '' ? null : roomNumber,
            moveInDate ? new Date(moveInDate) : new Date(),
            existingId
          ];
        } else if (existingStatus === 'inactive') {
          queryText = `
            UPDATE user_dorms SET
              member_role = $1,
              bed_number = $2,
              room_number = $3,
              move_in_date = $4,
              status = 'active',
              updated_at = NOW()
            WHERE id = $5
            RETURNING *
          `;
          values = [
            memberRole,
            bedNumber === '' ? null : bedNumber,
            roomNumber === '' ? null : roomNumber,
            moveInDate ? new Date(moveInDate) : new Date(),
            existingId
          ];
        } else {
          queryText = `
            UPDATE user_dorms SET
              member_role = $1,
              bed_number = $2,
              room_number = $3,
              move_in_date = $4,
              updated_at = NOW()
            WHERE id = $5
            RETURNING *
          `;
          values = [
            memberRole,
            bedNumber === '' ? null : bedNumber,
            roomNumber === '' ? null : roomNumber,
            moveInDate ? new Date(moveInDate) : new Date(),
            existingId
          ];
        }
      } else {
        queryText = `
          INSERT INTO user_dorms (
            user_id, dorm_id, member_role, status, bed_number, room_number, move_in_date, joined_at
          ) VALUES (
            $1, $2, $3, 'active', $4, $5, $6, NOW()
          )
          RETURNING *
        `;
        values = [
          userId,
          dormId,
          memberRole,
          bedNumber === '' ? null : bedNumber,
          roomNumber === '' ? null : roomNumber,
          moveInDate ? new Date(moveInDate) : new Date()
        ];
      }

      const result = await query(queryText, values);

      if (result.rows.length > 0) {
        await this.syncOccupancy(dormId);
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取可添加到宿舍的用户列表
   * @param {number} dormId - 宿舍ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 可添加的用户列表
   */
  async getAvailableUsers(dormId, options = {}) {
    try {
      const { search, limit = 50, offset = 0 } = options;

      let queryText = `
        SELECT DISTINCT
          u.id,
          u.username,
          u.nickname,
          u.real_name,
          u.phone,
          u.avatar_url,
          u.status
        FROM users u
        WHERE u.status = 'active'
          AND u.id NOT IN (
            SELECT user_id FROM user_dorms WHERE status = 'active'
          )
          -- 排除系统内置角色用户（系统管理员、管理员等）
          AND u.id NOT IN (
            SELECT ur.user_id 
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.is_system_role = TRUE
          )
      `;

      const params = [];
      let paramIndex = 1;

      if (search) {
        queryText += ` AND (
          u.username ILIKE CAST($${paramIndex} AS TEXT) OR
          u.nickname ILIKE CAST($${paramIndex} AS TEXT) OR
          u.real_name ILIKE CAST($${paramIndex} AS TEXT)
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      queryText += ` ORDER BY u.id LIMIT CAST($${paramIndex} AS INTEGER) OFFSET CAST($${paramIndex + 1} AS INTEGER)`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取宿舍费用统计摘要
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 费用统计信息
   */
  async getDormFeeSummary(dormId) {
    try {
      // 1. 获取费用总额统计 (基于 expenses 表)
      const expenseQuery = `
        SELECT
          COALESCE(SUM(CASE WHEN status != 'cancelled' THEN amount ELSE 0 END), 0) as total_expenses,
          COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as total_count,
          COALESCE(SUM(CASE WHEN status != 'cancelled' AND expense_date >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_total,
          COUNT(CASE WHEN status != 'cancelled' AND expense_date >= date_trunc('month', CURRENT_DATE) THEN 1 END) as monthly_count
        FROM expenses
        WHERE dorm_id = $1
      `;
      const expenseResult = await query(expenseQuery, [dormId]);
      const expenseRow = expenseResult.rows[0];

      // 2. 获取支付统计 (基于 expense_splits 表)
      const splitQuery = `
        SELECT
          COALESCE(SUM(paid_amount), 0) as total_paid,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
          COALESCE(SUM(split_amount - paid_amount), 0) as total_unpaid,
          COUNT(CASE WHEN payment_status IN ('pending', 'overdue') THEN 1 END) as unpaid_count,
          COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN payment_status = 'overdue' THEN 1 END) as overdue_count,
          COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN split_amount - paid_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN payment_status = 'overdue' THEN split_amount - paid_amount ELSE 0 END), 0) as total_overdue
        FROM expense_splits
        WHERE dorm_id = $1
      `;
      const splitResult = await query(splitQuery, [dormId]);
      const splitRow = splitResult.rows[0];

      const totalExpenses = parseFloat(expenseRow.total_expenses) || 0;
      const totalPaid = parseFloat(splitRow.total_paid) || 0;
      const totalUnpaid = parseFloat(splitRow.total_unpaid) || 0;

      let status = 'paid';
            if (totalUnpaid > 0) {
              if (totalPaid > 0) {
                status = 'partial';
              } else {
                status = 'unpaid';
              }
              
              if (parseInt(splitRow.overdue_count) > 0) {
                status = 'overdue';
              }
            }

      return {
        totalExpenses: totalExpenses,
        totalCount: parseInt(expenseRow.total_count) || 0,
        totalPaid: totalPaid,
        paidCount: parseInt(splitRow.paid_count) || 0,
        totalPending: parseFloat(splitRow.total_pending) || 0,
        pendingCount: parseInt(splitRow.pending_count) || 0,
        totalOverdue: parseFloat(splitRow.total_overdue) || 0,
        overdueCount: parseInt(splitRow.overdue_count) || 0,
        monthlyTotal: parseFloat(expenseRow.monthly_total) || 0,
        monthlyCount: parseInt(expenseRow.monthly_count) || 0,
        status: status,
        unpaid: totalUnpaid
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取宿舍维修记录
   * @param {number} dormId - 宿舍ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 维修记录列表
   */
  async getDormMaintenanceRecords(dormId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE mr.dorm_id = $1';
      const params = [dormId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND mr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const queryText = `
        SELECT
          mr.id,
          mr.title,
          mr.description,
          mr.type,
          mr.urgency_level,
          mr.status,
          mr.requester_id,
          mr.assigned_to,
          mr.assigned_at,
          mr.started_at,
          mr.completed_at,
          mr.completion_notes,
          mr.rating,
          mr.feedback,
          mr.created_at,
          mr.updated_at,
          u.username as requester_name,
          u.nickname as requester_nickname,
          au.username as assigned_name,
          au.nickname as assigned_nickname
        FROM maintenance_requests mr
        LEFT JOIN users u ON mr.requester_id = u.id
        LEFT JOIN users au ON mr.assigned_to = au.id
        ${whereClause}
        ORDER BY mr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM maintenance_requests mr
        ${whereClause}
      `;

      const countParams = params.slice(0, params.length - 2);

      const [result, countResult] = await Promise.all([
        query(queryText, params),
        query(countQuery, countParams)
      ]);

      return {
        records: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 验证用户是否可以添加到宿舍
   * @param {number} dormId - 宿舍ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 验证结果
   */
  async validateUserCanAddToDorm(dormId, userId) {
    try {
      const dormQuery = 'SELECT id, capacity, current_occupancy, status FROM dorms WHERE id = $1 AND status != \'deleted\'';
      const dormResult = await query(dormQuery, [dormId]);

      if (dormResult.rows.length === 0) {
        return { canAdd: false, message: '宿舍不存在' };
      }

      const dorm = dormResult.rows[0];

      if (dorm.status === 'inactive' || dorm.status === 'dissolved') {
        return { canAdd: false, message: '宿舍当前状态不允许添加成员' };
      }

      if (parseInt(dorm.current_occupancy) >= parseInt(dorm.capacity)) {
        return { canAdd: false, message: '宿舍已满员' };
      }

      const userQuery = 'SELECT id, status FROM users WHERE id = $1';
      const userResult = await query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return { canAdd: false, message: '用户不存在' };
      }

      if (userResult.rows[0].status !== 'active') {
        return { canAdd: false, message: '用户状态不允许' };
      }

      // 检查用户是否为系统内置角色
      const roleQuery = `
        SELECT EXISTS (
          SELECT 1 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND r.is_system_role = TRUE
        ) as is_system_role
      `;
      const roleResult = await query(roleQuery, [userId]);
      if (roleResult.rows[0].is_system_role) {
        return { canAdd: false, message: '系统内置角色用户无需分配宿舍' };
      }

      const existingQuery = `
        SELECT id, dorm_id FROM user_dorms
        WHERE user_id = $1 AND status = 'active'
      `;
      const existingResult = await query(existingQuery, [userId]);

      if (existingResult.rows.length > 0) {
        const existingDormId = existingResult.rows[0].dorm_id;
        if (existingDormId == dormId) {
          return { canAdd: false, message: '用户已在该宿舍中' };
        } else {
          return { 
            canAdd: false, 
            message: '用户已在其他宿舍中，需要先从原宿舍移除',
            existingDormId: existingDormId
          };
        }
      }

      return { canAdd: true };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DormRepository;
