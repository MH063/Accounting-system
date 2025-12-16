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
}

module.exports = DormRepository;