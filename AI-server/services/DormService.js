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
            occupancyRate: dorm.capacity > 0 ? Math.round((dorm.current_occupancy / dorm.capacity) * 10000) / 100 : 0,
            // 添加解散流程信息
            dismissalRecord: dorm.dismissal_id ? {
              id: dorm.dismissal_id,
              status: dorm.dismissal_status,
              initiatedBy: dorm.dismissal_initiated_by,
              createdAt: dorm.dismissal_created_at,
              updatedAt: dorm.dismissal_updated_at
            } : null
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
   * 更新宿舍成员状态
   * @param {number} userDormId - user_dorms表的ID
   * @param {Object} statusData - 状态数据
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateMemberStatus(userDormId, statusData, currentUser) {
    try {
      logger.info('[DormService] 更新宿舍成员状态', { userDormId, statusData, currentUser });
      
      // 1. 参数验证
      if (!userDormId || isNaN(userDormId)) {
        return {
          success: false,
          message: '用户宿舍关系ID无效'
        };
      }
      
      const { status, moveOutDate, moveInDate, handleUnpaidExpenses, notifyUser = true } = statusData;
      
      if (!status || !['active', 'inactive', 'pending'].includes(status)) {
        return {
          success: false,
          message: '状态必须是active、inactive或pending之一'
        };
      }
      
      // 2. 验证当前用户权限
      const hasPermission = await this.dormRepository.validateOperatorPermissionForStatusUpdate(userDormId, currentUser.id, status);
      logger.info('[DormService] 权限验证结果', { hasPermission, userDormId, operatorId: currentUser.id, status });
      if (!hasPermission) {
        return {
          success: false,
          message: '权限不足，无法更新成员状态'
        };
      }
      
      // 3. 获取当前的成员信息和宿舍信息
      console.log('[DEBUG] DormService calling getUserDormById with userDormId:', userDormId);
      const currentRecord = await this.dormRepository.getUserDormById(userDormId);
      console.log('[DEBUG] DormService currentRecord:', currentRecord);
      logger.info('[DormService] 获取当前记录', { currentRecord });
      if (!currentRecord) {
        return {
          success: false,
          message: '用户宿舍关系记录不存在'
        };
      }
      
      // 4. 验证状态变更的合法性
      let validationMessage = 'ok';
      if (status === 'active' && currentRecord.status === 'inactive') {
        validationMessage = 'ok'; // 允许重新激活
      } else if (status === 'inactive' && currentRecord.status === 'pending') {
        validationMessage = '无法将待确认成员直接标记为搬离';
      }
      
      if (validationMessage !== 'ok') {
        return {
          success: false,
          message: validationMessage
        };
      }
      
      // 5. 检查未结清费用（重要业务逻辑）
      if (status === 'inactive') {
        const unpaidInfo = await this.dormRepository.checkUnpaidExpenses(currentRecord.user_id, currentRecord.dorm_id);
        const pendingAmount = parseFloat(unpaidInfo.pending_amount) || 0;
        
        // 如果有未结清费用且未指定处理方式，提示用户
        if (pendingAmount > 0 && !handleUnpaidExpenses) {
          return {
            success: false,
            message: `成员有未结清费用 ${pendingAmount.toFixed(2)} 元，请指定如何处理这些费用（waive-免除、keep-保持）`
          };
        }
      }
      
      // 6. 记录更新前的信息用于审计
      const oldValues = {
        status: currentRecord.status,
        move_in_date: currentRecord.move_in_date,
        move_out_date: currentRecord.move_out_date
      };
      
      // 7. 执行状态更新操作
      const updateData = {
        moveOutDate: moveOutDate,
        moveInDate: moveInDate,
        handleUnpaidExpenses: handleUnpaidExpenses
      };
      
      const updatedRecord = await this.dormRepository.updateUserDormStatus(userDormId, status, updateData);
      
      // 8. 记录审计日志
      await this.dormRepository.logAuditAction({
        tableName: 'user_dorms',
        operation: 'UPDATE',
        recordId: userDormId,
        oldValues: oldValues,
        newValues: {
          status: updatedRecord.status,
          move_in_date: updatedRecord.move_in_date,
          move_out_date: updatedRecord.move_out_date
        },
        userId: currentUser.id,
        sessionId: currentUser.sessionId,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent
      });
      
      // 9. 发送通知
      if (notifyUser) {
        let title = '状态更新通知';
        let content = `您在宿舍"${updatedRecord.dorm_name}"的状态已变更为"${status}"`;
        let type = 'info';
        
        if (status === 'inactive') {
          title = '成员搬离通知';
          content += '，请确保已结清所有费用。';
          type = 'warning';
        } else if (status === 'active' && oldValues.status === 'inactive') {
          title = '成员激活通知';
        } else if (status === 'active' && oldValues.status === 'pending') {
          title = '成员状态确认';
        } else if (status === 'pending') {
          title = '成员状态待确认';
        }
        
        await this.dormRepository.sendNotification({
          title: title,
          content: content,
          type: type,
          userId: updatedRecord.user_id,
          dormId: updatedRecord.dorm_id,
          senderId: currentUser.id,
          relatedId: userDormId,
          relatedTable: 'user_dorms'
        });
      }
      
      logger.info('[DormService] 宿舍成员状态更新成功', { 
        userDormId: updatedRecord.id, 
        userId: updatedRecord.user_id,
        dormId: updatedRecord.dorm_id,
        newStatus: updatedRecord.status 
      });
      
      // 10. 计算费用信息
      const pendingAmount = parseFloat(updatedRecord.pending_amount) || 0;
      const overdueAmount = parseFloat(updatedRecord.overdue_amount) || 0;
      
      return {
        success: true,
        data: {
          userDorm: {
            id: updatedRecord.id,
            userId: updatedRecord.user_id,
            dormId: updatedRecord.dorm_id,
            memberRole: updatedRecord.member_role,
            status: updatedRecord.status,
            moveInDate: updatedRecord.move_in_date,
            moveOutDate: updatedRecord.move_out_date,
            bedNumber: updatedRecord.bed_number,
            roomNumber: updatedRecord.room_number,
            monthlyShare: updatedRecord.monthly_share,
            depositPaid: updatedRecord.deposit_paid,
            lastPaymentDate: updatedRecord.last_payment_date,
            canApproveExpenses: updatedRecord.can_approve_expenses,
            canInviteMembers: updatedRecord.can_invite_members,
            canManageFacilities: updatedRecord.can_manage_facilities,
            invitedBy: updatedRecord.invited_by,
            inviteCode: updatedRecord.invite_code,
            inviteExpiresAt: updatedRecord.invite_expires_at,
            joinedAt: updatedRecord.joined_at,
            updatedAt: updatedRecord.updated_at,
            username: updatedRecord.username,
            nickname: updatedRecord.nickname,
            email: updatedRecord.email,
            dormName: updatedRecord.dorm_name,
            dormCode: updatedRecord.dorm_code,
            pendingAmount: pendingAmount,
            overdueAmount: overdueAmount
          }
        },
        message: '成员状态更新成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 更新宿舍成员状态失败', { error: error.message, userDormId, userId: currentUser?.id });
      throw error;
    }
  }

  /**
   * 更新宿舍成员角色
   * @param {number} userDormId - user_dorms表的ID
   * @param {Object} roleData - 角色数据
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateMemberRole(userDormId, roleData, currentUser) {
    try {
      logger.info('[DormService] 更新宿舍成员角色', { userDormId, roleData, currentUser });
      
      // 1. 参数验证
      if (!userDormId || isNaN(userDormId)) {
        return {
          success: false,
          message: '用户宿舍关系ID无效'
        };
      }
      
      const { memberRole, updatePermissions = true, notifyUser = true } = roleData;
      
      if (!memberRole || !['admin', 'member', 'viewer'].includes(memberRole)) {
        return {
          success: false,
          message: '角色必须是admin、member或viewer之一'
        };
      }
      
      // 2. 验证当前用户权限
      const hasPermission = await this.dormRepository.validateOperatorPermission(userDormId, currentUser.id);
      if (!hasPermission) {
        return {
          success: false,
          message: '权限不足，无法更新成员角色'
        };
      }
      
      // 3. 获取当前的成员信息和宿舍信息
      const currentRecord = await this.dormRepository.getUserDormById(userDormId);
      if (!currentRecord) {
        return {
          success: false,
          message: '用户宿舍关系记录不存在'
        };
      }
      
      // 4. 验证角色变更的合法性
      // 不能将宿舍管理员（admin_id）的角色降级（如果业务逻辑不允许）
      if (currentRecord.member_role === 'admin' && 
          currentRecord.dorm_admin_id === currentRecord.user_id && 
          memberRole !== 'admin') {
        // 检查是否是最后一个管理员
        const adminCountQuery = `
          SELECT COUNT(*) as admin_count
          FROM user_dorms
          WHERE dorm_id = $1 AND member_role = 'admin' AND status = 'active'
        `;
        
        const { query } = require('../config/database');
        const adminCountResult = await query(adminCountQuery, [currentRecord.dorm_id]);
        const adminCount = parseInt(adminCountResult.rows[0].admin_count);
        
        if (adminCount <= 1) {
          return {
            success: false,
            message: '不能移除最后一个宿舍管理员，请先指定新的管理员'
          };
        }
      }
      
      // 5. 记录更新前的信息用于审计
      const oldValues = {
        member_role: currentRecord.member_role,
        can_approve_expenses: currentRecord.can_approve_expenses,
        can_invite_members: currentRecord.can_invite_members,
        can_manage_facilities: currentRecord.can_manage_facilities
      };
      
      // 6. 执行角色更新操作
      const updatedRecord = await this.dormRepository.updateUserDormRole(userDormId, memberRole, updatePermissions);
      
      // 7. 记录审计日志
      await this.dormRepository.logAuditAction({
        tableName: 'user_dorms',
        operation: 'UPDATE',
        recordId: userDormId,
        oldValues: oldValues,
        newValues: {
          member_role: updatedRecord.member_role,
          can_approve_expenses: updatedRecord.can_approve_expenses,
          can_invite_members: updatedRecord.can_invite_members,
          can_manage_facilities: updatedRecord.can_manage_facilities
        },
        userId: currentUser.id,
        sessionId: currentUser.sessionId,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent
      });
      
      // 8. 发送通知
      if (notifyUser) {
        await this.dormRepository.sendNotification({
          title: '角色更新通知',
          content: `您在宿舍"${updatedRecord.dorm_name}"的角色已变更为"${memberRole}"`,
          type: 'info',
          userId: updatedRecord.user_id,
          dormId: updatedRecord.dorm_id,
          senderId: currentUser.id,
          relatedId: userDormId,
          relatedTable: 'user_dorms'
        });
      }
      
      logger.info('[DormService] 宿舍成员角色更新成功', { 
        userDormId: updatedRecord.id, 
        userId: updatedRecord.user_id,
        dormId: updatedRecord.dorm_id,
        newRole: updatedRecord.member_role 
      });
      
      return {
        success: true,
        data: {
          userDorm: {
            id: updatedRecord.id,
            userId: updatedRecord.user_id,
            dormId: updatedRecord.dorm_id,
            memberRole: updatedRecord.member_role,
            status: updatedRecord.status,
            moveInDate: updatedRecord.move_in_date,
            moveOutDate: updatedRecord.move_out_date,
            bedNumber: updatedRecord.bed_number,
            roomNumber: updatedRecord.room_number,
            monthlyShare: updatedRecord.monthly_share,
            depositPaid: updatedRecord.deposit_paid,
            lastPaymentDate: updatedRecord.last_payment_date,
            canApproveExpenses: updatedRecord.can_approve_expenses,
            canInviteMembers: updatedRecord.can_invite_members,
            canManageFacilities: updatedRecord.can_manage_facilities,
            invitedBy: updatedRecord.invited_by,
            inviteCode: updatedRecord.invite_code,
            inviteExpiresAt: updatedRecord.invite_expires_at,
            joinedAt: updatedRecord.joined_at,
            updatedAt: updatedRecord.updated_at,
            username: updatedRecord.username,
            nickname: updatedRecord.nickname,
            email: updatedRecord.email,
            dormName: updatedRecord.dorm_name,
            dormAdminId: updatedRecord.dorm_admin_id
          }
        },
        message: '成员角色更新成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 更新宿舍成员角色失败', { error: error.message, userDormId, userId: currentUser?.id });
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

  /**
   * 删除宿舍
   * @param {number} dormId - 宿舍ID
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 删除结果
   */
  async deleteDorm(dormId, currentUser) {
    try {
      logger.info('[DormService] 删除宿舍', { dormId, userId: currentUser.id });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证当前用户权限
      // 根据数据库的行级安全策略（RLS），只有以下用户可以删除宿舍：
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
          message: '权限不足，无法删除此宿舍'
        };
      }
      
      // 3. 调用仓库层删除宿舍
      const result = await this.dormRepository.deleteDorm(dormId, currentUser.id);
      
      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }
      
      logger.info('[DormService] 宿舍删除成功', { 
        dormId: result.data.id, 
        dormName: result.data.dorm_name 
      });
      
      return {
        success: true,
        data: {
          dorm: {
            id: result.data.id,
            dormName: result.data.dorm_name,
            status: result.data.status,
            updatedAt: result.data.updated_at
          }
        },
        message: '宿舍删除成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 删除宿舍失败', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 删除宿舍成员
   * @param {number} userDormId - user_dorms表的ID
   * @param {Object} deleteData - 删除参数
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 删除结果
   */
  async removeMember(userDormId, deleteData, currentUser) {
    try {
      logger.info('[DormService] 删除宿舍成员', { userDormId, deleteData, currentUser });
      
      // 1. 参数验证
      if (!userDormId || isNaN(userDormId)) {
        return {
          success: false,
          message: '用户宿舍关系ID无效'
        };
      }
      
      const { 
        deleteType = 'logical',  // 删除类型：'physical'（物理删除）或'logical'（逻辑删除）
        handleUnpaidExpenses = 'waive',  // 处理未结费用：'waive'（免除）、'reallocate'（重新分摊）、'keep'（保持）
        refundDeposit = false,  // 是否退还押金
        newAdminId,  // 如果删除的是管理员，指定新的管理员用户ID
        notifyUser = true  // 是否发送通知给用户
      } = deleteData;
      
      // 2. 验证当前用户权限
      const hasPermission = await this.dormRepository.validateOperatorPermission(userDormId, currentUser.id);
      logger.info('[DormService] 权限验证结果', { hasPermission, userDormId, operatorId: currentUser.id });
      if (!hasPermission) {
        return {
          success: false,
          message: '权限不足，无法删除成员'
        };
      }
      
      // 3. 获取当前的成员信息和宿舍信息
      const currentRecord = await this.dormRepository.getUserDormById(userDormId);
      logger.info('[DormService] 获取当前记录', { currentRecord });
      if (!currentRecord) {
        return {
          success: false,
          message: '用户宿舍关系记录不存在'
        };
      }
      
      // 4. 检查未结清费用（重要业务逻辑）
      const unpaidInfo = await this.dormRepository.checkUnpaidExpenses(currentRecord.user_id, currentRecord.dorm_id);
      const pendingAmount = parseFloat(unpaidInfo.pending_amount) || 0;
      
      // 如果有未结清费用且未指定处理方式，提示用户
      if (pendingAmount > 0 && !handleUnpaidExpenses) {
        return {
          success: false,
          message: `成员有未结清费用 ${pendingAmount.toFixed(2)} 元，请指定如何处理这些费用（waive-免除、keep-保持）`
        };
      }
      
      // 5. 检查是否是宿舍管理员（重要业务逻辑）
      let newAdminAssigned = false;
      if (currentRecord.dorm_admin_id === currentRecord.user_id) {
        // 如果删除的是宿舍管理员，需要指定新的管理员
        if (!newAdminId) {
          // 检查当前宿舍是否有其他成员可以成为管理员
          const alternativeAdmin = await this.dormRepository.findAlternativeAdmin(currentRecord.dorm_id, currentRecord.user_id);
          if (alternativeAdmin) {
            newAdminId = alternativeAdmin.user_id;
          } else {
            return {
              success: false,
              message: '删除的是宿舍管理员，但宿舍中没有其他成员可以成为新管理员'
            };
          }
        }
        
        // 更新宿舍管理员
        await this.dormRepository.updateDormAdmin(currentRecord.dorm_id, newAdminId);
        newAdminAssigned = true;
      }
      
      // 6. 执行删除操作
      let deletedRecord;
      if (deleteType === 'physical') {
        // 物理删除
        deletedRecord = await this.dormRepository.physicalDeleteMember(userDormId);
      } else {
        // 逻辑删除（推荐）
        deletedRecord = await this.dormRepository.logicalDeleteMember(userDormId, handleUnpaidExpenses);
      }
      
      // 7. 处理宿舍管理员变更（如果需要）
      if (newAdminAssigned) {
        // 更新新管理员的角色为admin
        await this.dormRepository.updateMemberRole(currentRecord.dorm_id, newAdminId, 'admin');
      }
      
      // 8. 处理费用分摊记录（逻辑删除时需要处理）
      if (deleteType !== 'physical' && handleUnpaidExpenses === 'waive') {
        // 标记为已免除
        await this.dormRepository.waiveUnpaidExpenses(currentRecord.user_id, currentRecord.dorm_id);
      }
      
      // 9. 记录审计日志
      await this.dormRepository.logAuditAction({
        tableName: 'user_dorms',
        operation: 'DELETE',
        recordId: userDormId,
        oldValues: {
          user_id: currentRecord.user_id,
          dorm_id: currentRecord.dorm_id,
          member_role: currentRecord.member_role,
          username: currentRecord.username,
          nickname: currentRecord.nickname,
          dorm_name: currentRecord.dorm_name
        },
        userId: currentUser.id,
        sessionId: currentUser.sessionId,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent
      });
      
      // 10. 发送通知
      if (notifyUser) {
        // 给被删除的成员发送通知
        await this.dormRepository.sendNotification({
          title: '成员移除通知',
          content: `您已被从宿舍"${currentRecord.dorm_name}"中移除`,
          type: 'warning',
          userId: currentRecord.user_id,
          dormId: currentRecord.dorm_id,
          senderId: currentUser.id,
          relatedId: userDormId,
          relatedTable: 'user_dorms'
        });
        
        // 给宿舍管理员发送通知（如果操作人不是管理员）
        if (currentUser.id !== currentRecord.dorm_admin_id) {
          await this.dormRepository.sendNotification({
            title: '成员移除通知',
            content: `成员"${currentRecord.nickname || currentRecord.username}"已被从宿舍"${currentRecord.dorm_name}"中移除`,
            type: 'info',
            userId: currentRecord.dorm_admin_id,
            dormId: currentRecord.dorm_id,
            senderId: currentUser.id,
            relatedId: userDormId,
            relatedTable: 'user_dorms'
          });
        }
      }
      
      logger.info('[DormService] 宿舍成员删除成功', { 
        userDormId: deletedRecord.id, 
        userId: deletedRecord.user_id,
        dormId: deletedRecord.dorm_id
      });
      
      return {
        success: true,
        data: {
          userDorm: {
            id: deletedRecord.id,
            userId: deletedRecord.user_id,
            dormId: deletedRecord.dorm_id,
            memberRole: deletedRecord.member_role,
            status: deletedRecord.status,
            moveInDate: deletedRecord.move_in_date,
            moveOutDate: deletedRecord.move_out_date,
            bedNumber: deletedRecord.bed_number,
            roomNumber: deletedRecord.room_number,
            monthlyShare: deletedRecord.monthly_share,
            depositPaid: deletedRecord.deposit_paid,
            lastPaymentDate: deletedRecord.last_payment_date,
            canApproveExpenses: deletedRecord.can_approve_expenses,
            canInviteMembers: deletedRecord.can_invite_members,
            canManageFacilities: deletedRecord.can_manage_facilities,
            invitedBy: deletedRecord.invited_by,
            inviteCode: deletedRecord.invite_code,
            inviteExpiresAt: deletedRecord.invite_expires_at,
            joinedAt: deletedRecord.joined_at,
            updatedAt: deletedRecord.updated_at,
            username: deletedRecord.username,
            nickname: deletedRecord.nickname,
            email: deletedRecord.email,
            dormName: deletedRecord.dorm_name,
            dormCode: deletedRecord.dorm_code
          }
        },
        message: '成员删除成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 删除宿舍成员失败', { error: error.message, userDormId, userId: currentUser?.id });
      throw error;
    }
  }

  /**
   * 获取寝室设置
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 寝室设置结果
   */
  async getDormSettings(dormId) {
    try {
      logger.info('[DormService] 获取寝室设置', { dormId });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 调用仓库层获取设置
      const settings = await this.dormRepository.getDormSettings(dormId);
      
      // 3. 解析JSON字段 - 检查字段类型，只有字符串才需要解析
      const parsedSettings = {
        ...settings,
        basic: settings.basic 
          ? (typeof settings.basic === 'string' ? JSON.parse(settings.basic) : settings.basic)
          : {},
        notifications: settings.notifications 
          ? (typeof settings.notifications === 'string' ? JSON.parse(settings.notifications) : settings.notifications)
          : {}
      };
      
      logger.info('[DormService] 寝室设置获取成功', { dormId });
      
      return {
        success: true,
        data: parsedSettings,
        message: '寝室设置获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取寝室设置失败', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 更新寝室设置
   * @param {number} dormId - 宿舍ID
   * @param {Object} settings - 设置数据
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateDormSettings(dormId, settings, currentUser) {
    try {
      logger.info('[DormService] 更新寝室设置', { dormId, settings });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证当前用户权限
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '宿舍不存在或已被删除'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '权限不足，无法更新此宿舍设置'
        };
      }
      
      // 3. 调用仓库层更新设置
      const updatedSettings = await this.dormRepository.updateDormSettings(dormId, settings);
      
      // 4. 解析JSON字段
      const parsedSettings = {
        ...updatedSettings,
        basic: updatedSettings.basic ? (typeof updatedSettings.basic === 'string' ? JSON.parse(updatedSettings.basic) : updatedSettings.basic) : {},
        notifications: updatedSettings.notifications ? (typeof updatedSettings.notifications === 'string' ? JSON.parse(updatedSettings.notifications) : updatedSettings.notifications) : {}
      };      
      // 5. 记录审计日志
      await this.dormRepository.logAuditAction({
        tableName: 'dorm_settings',
        operation: 'UPDATE',
        recordId: updatedSettings.id,
        oldValues: {},
        newValues: {
          basic: settings.basic,
          notifications: settings.notifications
        },
        userId: currentUser.id,
        sessionId: currentUser.sessionId,
        ipAddress: currentUser.ip,
        userAgent: currentUser.userAgent
      });
      
      logger.info('[DormService] 寝室设置更新成功', { dormId });
      
      return {
        success: true,
        data: parsedSettings,
        message: '寝室设置更新成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 更新寝室设置失败', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 获取寝室变更历史
   * @param {number} dormId - 宿舍ID
   * @param {Object} pagination - 分页参数
   * @returns {Promise<Object>} 变更历史结果
   */
  async getDormHistory(dormId, pagination = {}) {
    try {
      logger.info('[DormService] 获取寝室变更历史', { dormId, pagination });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证分页参数
      const page = Math.max(1, parseInt(pagination.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 10));
      
      // 3. 调用仓库层获取历史记录
      const history = await this.dormRepository.getDormHistory(dormId, { page, limit });
      
      logger.info('[DormService] 寝室变更历史获取成功', { dormId, total: history.total });
      
      return {
        success: true,
        data: {
          history: history.records.map(record => ({
            id: record.id,
            tableName: record.table_name,
            operation: record.operation,
            recordId: record.record_id,
            oldValues: record.old_values ? JSON.parse(record.old_values) : {},
            newValues: record.new_values ? JSON.parse(record.new_values) : {},
            userId: record.user_id,
            timestamp: record.created_at
          })),
          pagination: {
            page,
            limit,
            total: history.total,
            totalPages: Math.ceil(history.total / limit)
          }
        },
        message: '寝室变更历史获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取寝室变更历史失败', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 开始解散流程
   * @param {number} dormId - 宿舍ID
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 操作结果
   */
  async startDismissProcess(dormId, currentUser) {
    try {
      logger.info('[DormService] 开始解散流程', { dormId, userId: currentUser.id });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证当前用户权限
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '宿舍不存在或已被删除'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '权限不足，无法开始解散流程'
        };
      }
      
      // 3. 检查宿舍当前状态
      if (dormInfo.status !== 'active') {
        return {
          success: false,
          message: '只有正常状态的宿舍才能开始解散流程'
        };
      }
      
      // 4. 调用仓库层开始解散流程
      const result = await this.dormRepository.startDismissProcess(dormId, currentUser.id);
      
      logger.info('[DormService] 解散流程开始成功', { dormId });
      
      return {
        success: true,
        data: {
          dorm: {
            id: result.dorm.id,
            status: result.dorm.status,
            updatedAt: result.dorm.updated_at
          },
          dismissal: {
            id: result.dismissal.id,
            status: result.dismissal.status,
            createdAt: result.dismissal.created_at
          }
        },
        message: '解散流程开始成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 开始解散流程失败', { error: error.message, dormId });
      return {
        success: false,
        message: '开始解散流程失败: ' + error.message
      };
    }
  }

  /**
   * 确认解散
   * @param {number} dormId - 宿舍ID
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 操作结果
   */
  async confirmDismiss(dormId, currentUser) {
    try {
      logger.info('[DormService] 确认解散', { dormId, userId: currentUser.id });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证当前用户权限
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '宿舍不存在或已被删除'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '权限不足，无法确认解散'
        };
      }
      
      // 3. 检查宿舍当前状态
      if (dormInfo.status !== 'dismissing') {
        return {
          success: false,
          message: '只有正在解散中的宿舍才能确认解散'
        };
      }
      
      // 4. 调用仓库层确认解散
      const result = await this.dormRepository.confirmDismiss(dormId, currentUser.id);
      
      logger.info('[DormService] 确认解散成功', { dormId });
      
      return {
        success: true,
        data: {
          dorm: {
            id: result.dorm.id,
            status: result.dorm.status,
            updatedAt: result.dorm.updated_at
          },
          dismissal: {
            id: result.dismissal.id,
            status: result.dismissal.status,
            completedAt: result.dismissal.completed_at
          }
        },
        message: '确认解散成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 确认解散失败', { error: error.message, dormId });
      return {
        success: false,
        message: '确认解散失败: ' + error.message
      };
    }
  }

  /**
   * 取消解散
   * @param {number} dormId - 宿舍ID
   * @param {Object} currentUser - 当前用户信息
   * @returns {Promise<Object>} 操作结果
   */
  async cancelDismiss(dormId, currentUser) {
    try {
      logger.info('[DormService] 取消解散', { dormId, userId: currentUser.id });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 验证当前用户权限
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '宿舍不存在或已被删除'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '权限不足，无法取消解散'
        };
      }
      
      // 3. 检查宿舍当前状态
      if (dormInfo.status !== 'dismissing') {
        return {
          success: false,
          message: '只有正在解散中的宿舍才能取消解散'
        };
      }
      
      // 4. 调用仓库层取消解散
      const result = await this.dormRepository.cancelDismiss(dormId, currentUser.id);
      
      logger.info('[DormService] 取消解散成功', { dormId });
      
      return {
        success: true,
        data: {
          dorm: {
            id: result.dorm.id,
            status: result.dorm.status,
            updatedAt: result.dorm.updated_at
          },
          dismissal: {
            id: result.dismissal.id,
            status: result.dismissal.status,
            cancelledAt: result.dismissal.cancelled_at
          }
        },
        message: '取消解散成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 取消解散失败', { error: error.message, dormId });
      return {
        success: false,
        message: '取消解散失败: ' + error.message
      };
    }
  }

  /**
   * 获取待结算费用
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 待结算费用结果
   */
  async getPendingFees(dormId) {
    try {
      logger.info('[DormService] 获取待结算费用', { dormId });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 调用仓库层获取待结算费用
      const pendingFees = await this.dormRepository.getPendingFees(dormId);
      
      logger.info('[DormService] 待结算费用获取成功', { dormId, count: pendingFees.length });
      
      return {
        success: true,
        data: {
          pendingFees: pendingFees.map(fee => ({
            member: fee.username,
            item: fee.expense_name,
            amount: parseFloat(fee.amount),
            status: fee.status
          }))
        },
        message: '待结算费用获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取待结算费用失败', { error: error.message, dormId });
      return {
        success: false,
        data: { pendingFees: [] },
        message: '获取待结算费用失败: ' + error.message
      };
    }
  }

  /**
   * 获取寝室成员列表
   * @param {number} dormId - 宿舍ID
   * @returns {Promise<Object>} 寝室成员列表结果
   */
  async getDormMembers(dormId) {
    try {
      logger.info('[DormService] 获取寝室成员列表', { dormId });
      
      // 1. 参数验证
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '宿舍ID无效'
        };
      }
      
      // 2. 调用仓库层获取成员列表
      const members = await this.dormRepository.getDormMembers(dormId);
      
      logger.info('[DormService] 寝室成员列表获取成功', { dormId, count: members.length });
      
      return {
        success: true,
        data: {
          members: members.map(member => ({
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
            depositPaid: member.deposit_paid,
            lastPaymentDate: member.last_payment_date
          }))
        },
        message: '寝室成员列表获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取寝室成员列表失败', { error: error.message, dormId });
      return {
        success: false,
        data: { members: [] },
        message: '获取寝室成员列表失败: ' + error.message
      };
    }
  }

  /**
   * 获取用户所在的寝室信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户所在的寝室信息结果
   */
  async getCurrentUserDorm(userId) {
    try {
      logger.info('[DormService] 获取用户所在的寝室信息', { userId });
      
      // 参数验证
      if (!userId || isNaN(userId)) {
        return {
          success: false,
          message: '用户ID无效'
        };
      }
      
      // 调用仓库层获取用户所在的寝室信息
      const dormInfo = await this.dormRepository.getDormByUserId(userId);
      
      if (!dormInfo) {
        return {
          success: false,
          message: '用户未加入任何寝室'
        };
      }
      
      logger.info('[DormService] 用户所在的寝室信息获取成功', { userId, dormId: dormInfo.id });
      
      // 格式化返回数据
      const formattedDormInfo = {
        id: dormInfo.id,
        dormName: dormInfo.dorm_name,
        dormCode: dormInfo.dorm_code,
        address: dormInfo.address,
        capacity: dormInfo.capacity,
        currentOccupancy: dormInfo.current_occupancy,
        description: dormInfo.description,
        status: dormInfo.status,
        type: dormInfo.type,
        area: dormInfo.area,
        genderLimit: dormInfo.gender_limit,
        monthlyRent: dormInfo.monthly_rent,
        deposit: dormInfo.deposit,
        utilityIncluded: dormInfo.utility_included,
        building: dormInfo.building,
        floor: dormInfo.floor,
        roomNumber: dormInfo.room_number,
        facilities: dormInfo.facilities,
        amenities: dormInfo.amenities,
        adminId: dormInfo.admin_id,
        createdAt: dormInfo.created_at,
        updatedAt: dormInfo.updated_at,
        adminInfo: dormInfo.admin_username ? {
          username: dormInfo.admin_username,
          nickname: dormInfo.admin_nickname,
          avatarUrl: dormInfo.admin_avatar_url
        } : null,
        memberInfo: {
          memberRole: dormInfo.member_role,
          memberStatus: dormInfo.member_status,
          moveInDate: dormInfo.move_in_date,
          bedNumber: dormInfo.bed_number,
          roomNumber: dormInfo.room_number,
          monthlyShare: dormInfo.monthly_share,
          depositPaid: dormInfo.deposit_paid
        }
      };
      
      return {
        success: true,
        data: { dorm: formattedDormInfo },
        message: '用户所在的寝室信息获取成功'
      };
      
    } catch (error) {
      logger.error('[DormService] 获取用户所在的寝室信息失败', { error: error.message, userId });
      return {
        success: false,
        message: '获取用户所在的寝室信息失败: ' + error.message
      };
    }
  }
}

module.exports = DormService;