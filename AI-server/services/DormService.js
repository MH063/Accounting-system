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

  /**
   * 根据ID获取宿舍详情
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 宿舍详情结果
   */
  async getDormById(dormId) {
    try {
      logger.info('[DormService] 获取宿舍详情', { dormId });
      
      // 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }

      // 调用仓库层获取宿舍详情
      const dorm = await this.dormRepository.getDormById(dormId);
      
      if (!dorm) {
        return {
          success: false,
          message: '宿舍不存在'
        };
      }
      
      // 获取宿舍成员列表
      const members = await this.dormRepository.getDormMembers(dormId);
      
      // 获取宿舍费用统计
      const expenseStats = await this.dormRepository.getDormExpenseStats(dormId);
      
      logger.info('[DormService] 宿舍详情获取成功', { dormId });
      
      return {
        success: true,
        data: {
          dorm: {
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
              id: dorm.admin_id,
              username: dorm.admin_username,
              nickname: dorm.admin_nickname,
              avatarUrl: dorm.admin_avatar_url
            } : null,
            currentUsers: members.map(member => ({
              id: member.id,
              username: member.username,
              nickname: member.nickname,
              realName: member.real_name,
              phone: member.phone,
              avatarUrl: member.avatar_url,
              memberRole: member.member_role,
              moveInDate: member.move_in_date,
              bedNumber: member.bed_number,
              roomNumber: member.room_number,
              monthlyShare: member.monthly_share,
              depositPaid: member.deposit_paid
            })),
            expenseStats: {
              totalExpenses: parseInt(expenseStats.total_expenses) || 0,
              totalAmount: parseFloat(expenseStats.total_amount) || 0,
              paidCount: parseInt(expenseStats.paid_count) || 0,
              pendingCount: parseInt(expenseStats.pending_count) || 0,
              overdueCount: parseInt(expenseStats.overdue_count) || 0
            },
            occupancyRate: dorm.capacity > 0 ? Math.round((dorm.current_occupancy / dorm.capacity) * 10000) / 100 : 0
          }
        },
        message: '宿舍详情获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取宿舍详情失败', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 更新宿舍信息
   * @param {number} dormId - 宿舍ID
   * @param {Object} dormData - 宿舍数据
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateDorm(dormId, dormData, currentUser) {
    try {
      logger.info('[DormService] 更新宿舍信息', { dormId, dormData });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证当前用户权限
      // 根据数据库的行级安全策略（RLS），只有以下用户可以更新宿舍信息：
      // 系统管理员（system_admin角色）、普通管理员（admin角色）、该宿舍的管理员（admin_id等于当前用户ID）
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '宿舍不存在或已被删除'
        };
      }
      
      // 检查用户权限（系统管理员、普通管理员或宿舍管理员）
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '权限不足，无法更新此宿舍信息'
        };
      }
      
      // 3. 数据验证
      const validation = this._validateUpdateDormData(dormData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }
      
      // 4. 验证必填字段（如果提供）
      if ((dormData.dormName !== undefined && dormData.dormName === '') ||
          (dormData.address !== undefined && dormData.address === '') ||
          (dormData.capacity !== undefined && (isNaN(dormData.capacity) || dormData.capacity <= 0))) {
        return {
          success: false,
          message: '宿舍名称、地址不能为空，容量必须是大于0的数字'
        };
      }
      
      // 5. 验证容量约束（如果更新capacity）
      if (dormData.capacity !== undefined) {
        const currentOccupancy = await this.dormRepository.getDormCurrentOccupancy(dormId);
        if (dormData.capacity < currentOccupancy) {
          return {
            success: false,
            message: `新容量不能小于当前入住人数(${currentOccupancy})`
          };
        }
      }
      
      // 6. 检查管理员ID（如提供）
      if (dormData.adminId) {
        const isAdminValid = await this._validateAdmin(dormData.adminId);
        if (!isAdminValid) {
          return {
            success: false,
            message: '指定的管理员不存在或状态无效'
          };
        }
      }
      
      // 7. 检查宿舍编码唯一性（如提供且不同于当前编码）
      if (dormData.dormCode && dormData.dormCode !== dormInfo.dorm_code) {
        const duplicateDorm = await this.dormRepository.checkDormCodeUnique(dormData.dormCode, dormId);
        if (duplicateDorm) {
          return {
            success: false,
            message: '宿舍编码已存在'
          };
        }
      }
      
      // 8. 调用仓库层更新宿舍
      const updatedDorm = await this.dormRepository.updateDorm(dormId, dormData);
      
      // 9. 如果宿舍的管理员变更，可能需要同步更新 user_dorms 表中的成员角色
      if (dormData.adminId && dormData.adminId !== dormInfo.admin_id) {
        await this._adjustMemberRoles(dormId, dormInfo.admin_id, dormData.adminId);
      }
      
      logger.info('[DormService] 宿舍信息更新成功', { 
        dormId: updatedDorm.id, 
        dormName: updatedDorm.dorm_name 
      });
      
      return {
        success: true,
        data: {
          dorm: {
            id: updatedDorm.id,
            dormName: updatedDorm.dorm_name,
            dormCode: updatedDorm.dorm_code,
            address: updatedDorm.address,
            capacity: updatedDorm.capacity,
            currentOccupancy: updatedDorm.current_occupancy,
            description: updatedDorm.description,
            status: updatedDorm.status,
            type: updatedDorm.type,
            area: updatedDorm.area,
            genderLimit: updatedDorm.gender_limit,
            monthlyRent: updatedDorm.monthly_rent,
            deposit: updatedDorm.deposit,
            utilityIncluded: updatedDorm.utility_included,
            building: updatedDorm.building,
            floor: updatedDorm.floor,
            roomNumber: updatedDorm.room_number,
            facilities: updatedDorm.facilities,
            amenities: updatedDorm.amenities,
            adminId: updatedDorm.admin_id,
            createdAt: updatedDorm.created_at,
            updatedAt: updatedDorm.updated_at
          }
        },
        message: '宿舍信息更新成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 更新宿舍信息失败', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 验证更新宿舍数据
   * @param {Object} dormData - 宿舍数据
   * @returns {Object} 验证结果
   */
  _validateUpdateDormData(dormData) {
    // 如果提供了宿舍名称，不能为为空
    if (dormData.dormName !== undefined && dormData.dormName === '') {
      return { isValid: false, message: '宿舍名称不能为空' };
    }
    
    // 如果提供了宿舍编码，不能为空
    if (dormData.dormCode !== undefined && dormData.dormCode === '') {
      return { isValid: false, message: '宿舍编码不能为空' };
    }
    
    // 如果提供了地址，不能为空
    if (dormData.address !== undefined && dormData.address === '') {
      return { isValid: false, message: '宿舍地址不能为空' };
    }
    
    // 如果提供了容量，必须是大于0的数字
    if (dormData.capacity !== undefined && (isNaN(dormData.capacity) || dormData.capacity <= 0)) {
      return { isValid: false, message: '宿舍容量必须是大于0的数字' };
    }
    
    // 如果提供了面积，验证其有效性
    if (dormData.area !== undefined && dormData.area !== null && (isNaN(dormData.area) || dormData.area <= 0)) {
      return { isValid: false, message: '宿舍面积必须是大于0的数字' };
    }
    
    // 如果提供了月租金，验证其有效性
    if (dormData.monthlyRent !== undefined && dormData.monthlyRent !== null && (isNaN(dormData.monthlyRent) || dormData.monthlyRent < 0)) {
      return { isValid: false, message: '月租金不能为负数' };
    }
    
    // 如果提供了押金，验证其有效性
    if (dormData.deposit !== undefined && dormData.deposit !== null && (isNaN(dormData.deposit) || dormData.deposit < 0)) {
      return { isValid: false, message: '押金不能为负数' };
    }
    
    // 如果提供了楼层，验证其有效性
    if (dormData.floor !== undefined && dormData.floor !== null && (isNaN(dormData.floor) || dormData.floor <= 0)) {
      return { isValid: false, message: '楼层必须是大于0的数字' };
    }
    
    return { isValid: true };
  }

  /**
   * 创建新宿舍
   * @param {Object} dormData - 宿舍数据
   * @returns {Promise<Object>} 创建结果
   */
  async createDorm(dormData) {
    try {
      logger.info('[DormService] 创建宿舍', { dormData });
      
      // 1. 数据验证
      const validation = this._validateDormData(dormData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // 2. 检查管理员ID（如提供）
      if (dormData.adminId) {
        const isAdminValid = await this._validateAdmin(dormData.adminId);
        if (!isAdminValid) {
          return {
            success: false,
            message: '指定的管理员不存在或状态无效'
          };
        }
      }

      // 3. 检查宿舍编码唯一性（如提供）
      if (dormData.dormCode) {
        const isCodeUnique = await this._checkDormCodeUnique(dormData.dormCode);
        if (!isCodeUnique) {
          return {
            success: false,
            message: '宿舍编码已存在'
          };
        }
      }

      // 4. 调用仓库层创建宿舍
      const createdDorm = await this.dormRepository.createDorm(dormData);
      
      logger.info('[DormService] 宿舍创建成功', { 
        dormId: createdDorm.id, 
        dormName: createdDorm.dorm_name 
      });
      
      return {
        success: true,
        data: {
          dorm: {
            id: createdDorm.id,
            dormName: createdDorm.dorm_name,
            dormCode: createdDorm.dorm_code,
            address: createdDorm.address,
            capacity: createdDorm.capacity,
            currentOccupancy: createdDorm.current_occupancy,
            description: createdDorm.description,
            status: createdDorm.status,
            type: createdDorm.type,
            area: createdDorm.area,
            genderLimit: createdDorm.gender_limit,
            monthlyRent: createdDorm.monthly_rent,
            deposit: createdDorm.deposit,
            utilityIncluded: createdDorm.utility_included,
            building: createdDorm.building,
            floor: createdDorm.floor,
            roomNumber: createdDorm.room_number,
            facilities: createdDorm.facilities,
            amenities: createdDorm.amenities,
            adminId: createdDorm.admin_id,
            createdAt: createdDorm.created_at,
            updatedAt: createdDorm.updated_at
          }
        },
        message: '宿舍创建成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 创建宿舍失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 验证宿舍数据
   * @param {Object} dormData - 宿舍数据
   * @returns {Object} 验证结果
   */
  _validateDormData(dormData) {
    // 检查必需字段
    if (!dormData.dormName) {
      return { isValid: false, message: '宿舍名称不能为空' };
    }
    
    if (!dormData.dormCode) {
      return { isValid: false, message: '宿舍编码不能为空' };
    }
    
    if (!dormData.address) {
      return { isValid: false, message: '宿舍地址不能为空' };
    }
    
    if (!dormData.capacity || isNaN(dormData.capacity) || dormData.capacity <= 0) {
      return { isValid: false, message: '宿舍容量必须是大于0的数字' };
    }
    
    // 如果提供了面积，验证其有效性
    if (dormData.area !== undefined && dormData.area !== null) {
      if (isNaN(dormData.area) || dormData.area <= 0) {
        return { isValid: false, message: '宿舍面积必须是大于0的数字' };
      }
    }
    
    // 如果提供了月租金，验证其有效性
    if (dormData.monthlyRent !== undefined && dormData.monthlyRent !== null) {
      if (isNaN(dormData.monthlyRent) || dormData.monthlyRent < 0) {
        return { isValid: false, message: '月租金不能为负数' };
      }
    }
    
    // 如果提供了押金，验证其有效性
    if (dormData.deposit !== undefined && dormData.deposit !== null) {
      if (isNaN(dormData.deposit) || dormData.deposit < 0) {
        return { isValid: false, message: '押金不能为负数' };
      }
    }
    
    // 如果提供了楼层，验证其有效性
    if (dormData.floor !== undefined && dormData.floor !== null) {
      if (isNaN(dormData.floor) || dormData.floor <= 0) {
        return { isValid: false, message: '楼层必须是大于0的数字' };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 验证管理员ID
   * @param {number} adminId - 管理员ID
   * @returns {Promise<boolean>} 是否有效
   */
  async _validateAdmin(adminId) {
    try {
      const admin = await this.dormRepository.getUserById(adminId);
      return admin && admin.status === 'active';
    } catch (error) {
      logger.error('[DormService] 验证管理员失败', { error: error.message, adminId });
      return false;
    }
  }

  /**
   * 检查宿舍编码唯一性
   * @param {string} dormCode - 宿舍编码
   * @returns {Promise<boolean>} 是否唯一
   */
  async _checkDormCodeUnique(dormCode) {
    try {
      const existingDorm = await this.dormRepository.getDormByCode(dormCode);
      return !existingDorm;
    } catch (error) {
      logger.error('[DormService] 检查宿舍编码唯一性失败', { error: error.message, dormCode });
      return false;
    }
  }

  /**
   * 调整宿舍成员角色（当管理员变更时）
   * @param {number} dormId - 宿舍ID
   * @param {number} oldAdminId - 原管理员ID
   * @param {number} newAdminId - 新管理员ID
   * @returns {Promise<void>}
   */
  async _adjustMemberRoles(dormId, oldAdminId, newAdminId) {
    try {
      // 将原管理员降级为普通成员
      if (oldAdminId) {
        await this.dormRepository.updateMemberRole(dormId, oldAdminId, 'member');
      }
      
      // 将新管理员设置为admin角色
      await this.dormRepository.setMemberAsAdmin(dormId, newAdminId);
      
      logger.info('[DormService] 宿舍成员角色调整成功', { dormId, oldAdminId, newAdminId });
    } catch (error) {
      logger.error('[DormService] 调整宿舍成员角色失败', { error: error.message, dormId, oldAdminId, newAdminId });
      throw error;
    }
  }
}

module.exports = DormService;