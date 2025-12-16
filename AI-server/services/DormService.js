const BaseService = require('./BaseService');
const DormRepository = require('../repositories/DormRepository');
const logger = require('../config/logger');

class DormService extends BaseService {
  constructor() {
    const dormRepository = new DormRepository();
    super(dormRepository);
    this.dormRepository = dormRepository;
  }

  /**
   * 获取宿舍列表
   * @param {Object} filters - 筛选条件
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} 宿舍列表结果
   */
  async getDormList(filters = {}, pagination = {}) {
    try {
      logger.info('[DormService] 获取宿舍列表', { filters, pagination });
      
      // 验证分页参数
      const page = Math.max(1, parseInt(pagination.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 10));
      
      // 调用仓库层获取宿舍列表
      const result = await this.dormRepository.getDormList(filters, { page, limit });
      
      logger.info('[DormService] 宿舍列表获取成功', { 
        total: result.total, 
        page: result.page, 
        limit: result.limit 
      });
      
      return {
        success: true,
        data: {
          dorms: result.dorms.map(dorm => ({
            id: dorm.id,
            dormName: dorm.dorm_name,
            dormCode: dorm.dorm_code,
            address: dorm.address,
            capacity: dorm.capacity,
            currentOccupancy: dorm.current_occupancy,
            description: dorm.description,
            status: dorm.status,
            type: dorm.type,
            area: dorm.area,
            genderLimit: dorm.gender_limit,
            monthlyRent: dorm.monthly_rent,
            deposit: dorm.deposit,
            utilityIncluded: dorm.utility_included,
            building: dorm.building,
            floor: dorm.floor,
            roomNumber: dorm.room_number,
            facilities: dorm.facilities,
            amenities: dorm.amenities,
            createdAt: dorm.created_at,
            updatedAt: dorm.updated_at,
            adminInfo: dorm.admin_username ? {
              username: dorm.admin_username,
              nickname: dorm.admin_nickname,
              avatarUrl: dorm.admin_avatar
            } : null
          })),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: Math.ceil(result.total / result.limit)
          }
        },
        message: '宿舍列表获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取宿舍列表失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = DormService;