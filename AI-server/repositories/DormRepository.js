const BaseRepository = require('./BaseRepository');
const { query } = require('../config/database');

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
}

module.exports = DormRepository;