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
   * 鑾峰彇瀹胯垗鍒楄〃
   * @param {Object} filters - 绛涢€夋潯浠?   * @param {Object} pagination - 鍒嗛〉鍙傛暟
   * @returns {Promise<Object>} 瀹胯垗鍒楄〃缁撴灉
   */
  async getDormList(filters = {}, pagination = {}) {
    try {
      logger.info('[DormService] 鑾峰彇瀹胯垗鍒楄〃', { filters, pagination });
      
      // 楠岃瘉鍒嗛〉鍙傛暟
      const page = Math.max(1, parseInt(pagination.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 10));
      
      // 璋冪敤浠撳簱灞傝幏鍙栧鑸嶅垪琛?      const result = await this.dormRepository.getDormList(filters, { page, limit });
      
      logger.info('[DormService] 瀹胯垗鍒楄〃鑾峰彇鎴愬姛', { 
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
        message: '瀹胯垗鍒楄〃鑾峰彇鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇瀹胯垗鍒楄〃澶辫触', { error: error.message });
      throw error;
    }
  }

  /**
   * 鏍规嵁ID鑾峰彇瀹胯垗璇︽儏
   * @param {number} dormId - 瀹胯垗ID
   * @returns {Promise<Object>} 瀹胯垗璇︽儏缁撴灉
   */
  async getDormById(dormId) {
    try {
      logger.info('[DormService] 鑾峰彇瀹胯垗璇︽儏', { dormId });
      
      // 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }

      // 璋冪敤浠撳簱灞傝幏鍙栧鑸嶈鎯?      const dorm = await this.dormRepository.getDormById(dormId);
      
      if (!dorm) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦?
        };
      }
      
      // 鑾峰彇瀹胯垗鎴愬憳鍒楄〃
      const members = await this.dormRepository.getDormMembers(dormId);
      
      // 鑾峰彇瀹胯垗璐圭敤缁熻
      const expenseStats = await this.dormRepository.getDormExpenseStats(dormId);
      
      logger.info('[DormService] 瀹胯垗璇︽儏鑾峰彇鎴愬姛', { dormId });
      
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
            // 娣诲姞瑙ｆ暎娴佺▼淇℃伅
            dismissalRecord: dorm.dismissal_id ? {
              id: dorm.dismissal_id,
              status: dorm.dismissal_status,
              initiatedBy: dorm.dismissal_initiated_by,
              createdAt: dorm.dismissal_created_at,
              updatedAt: dorm.dismissal_updated_at
            } : null
          }
        },
        message: '瀹胯垗璇︽儏鑾峰彇鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇瀹胯垗璇︽儏澶辫触', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 鏇存柊瀹胯垗鎴愬憳鐘舵€?   * @param {number} userDormId - user_dorms琛ㄧ殑ID
   * @param {Object} statusData - 鐘舵€佹暟鎹?   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鏇存柊缁撴灉
   */
  async updateMemberStatus(userDormId, statusData, currentUser) {
    try {
      logger.info('[DormService] 鏇存柊瀹胯垗鎴愬憳鐘舵€?, { userDormId, statusData, currentUser });
      
      // 1. 鍙傛暟楠岃瘉
      if (!userDormId || isNaN(userDormId)) {
        return {
          success: false,
          message: '鐢ㄦ埛瀹胯垗鍏崇郴ID鏃犳晥'
        };
      }
      
      const { status, moveOutDate, moveInDate, handleUnpaidExpenses, notifyUser = true } = statusData;
      
      if (!status || !['active', 'inactive', 'pending'].includes(status)) {
        return {
          success: false,
          message: '鐘舵€佸繀椤绘槸active銆乮nactive鎴杙ending涔嬩竴'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const hasPermission = await this.dormRepository.validateOperatorPermissionForStatusUpdate(userDormId, currentUser.id, status);
      logger.info('[DormService] 鏉冮檺楠岃瘉缁撴灉', { hasPermission, userDormId, operatorId: currentUser.id, status });
      if (!hasPermission) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曟洿鏂版垚鍛樼姸鎬?
        };
      }
      
      // 3. 鑾峰彇褰撳墠鐨勬垚鍛樹俊鎭拰瀹胯垗淇℃伅
      console.log('[DEBUG] DormService calling getUserDormById with userDormId:', userDormId);
      const currentRecord = await this.dormRepository.getUserDormById(userDormId);
      console.log('[DEBUG] DormService currentRecord:', currentRecord);
      logger.info('[DormService] 鑾峰彇褰撳墠璁板綍', { currentRecord });
      if (!currentRecord) {
        return {
          success: false,
          message: '鐢ㄦ埛瀹胯垗鍏崇郴璁板綍涓嶅瓨鍦?
        };
      }
      
      // 4. 楠岃瘉鐘舵€佸彉鏇寸殑鍚堟硶鎬?      let validationMessage = 'ok';
      if (status === 'active' && currentRecord.status === 'inactive') {
        validationMessage = 'ok'; // 鍏佽閲嶆柊婵€娲?      } else if (status === 'inactive' && currentRecord.status === 'pending') {
        validationMessage = '鏃犳硶灏嗗緟纭鎴愬憳鐩存帴鏍囪涓烘惉绂?;
      }
      
      if (validationMessage !== 'ok') {
        return {
          success: false,
          message: validationMessage
        };
      }
      
      // 5. 妫€鏌ユ湭缁撴竻璐圭敤锛堥噸瑕佷笟鍔￠€昏緫锛?      if (status === 'inactive') {
        const unpaidInfo = await this.dormRepository.checkUnpaidExpenses(currentRecord.user_id, currentRecord.dorm_id);
        const pendingAmount = parseFloat(unpaidInfo.pending_amount) || 0;
        
        // 濡傛灉鏈夋湭缁撴竻璐圭敤涓旀湭鎸囧畾澶勭悊鏂瑰紡锛屾彁绀虹敤鎴?        if (pendingAmount > 0 && !handleUnpaidExpenses) {
          return {
            success: false,
            message: `鎴愬憳鏈夋湭缁撴竻璐圭敤 ${pendingAmount.toFixed(2)} 鍏冿紝璇锋寚瀹氬浣曞鐞嗚繖浜涜垂鐢紙waive-鍏嶉櫎銆乲eep-淇濇寔锛塦
          };
        }
      }
      
      // 6. 璁板綍鏇存柊鍓嶇殑淇℃伅鐢ㄤ簬瀹¤
      const oldValues = {
        status: currentRecord.status,
        move_in_date: currentRecord.move_in_date,
        move_out_date: currentRecord.move_out_date
      };
      
      // 7. 鎵ц鐘舵€佹洿鏂版搷浣?      const updateData = {
        moveOutDate: moveOutDate,
        moveInDate: moveInDate,
        handleUnpaidExpenses: handleUnpaidExpenses
      };
      
      const updatedRecord = await this.dormRepository.updateUserDormStatus(userDormId, status, updateData);
      
      // 8. 璁板綍瀹¤鏃ュ織
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
      
      // 9. 鍙戦€侀€氱煡
      if (notifyUser) {
        let title = '鐘舵€佹洿鏂伴€氱煡';
        let content = `鎮ㄥ湪瀹胯垗"${updatedRecord.dorm_name}"鐨勭姸鎬佸凡鍙樻洿涓?${status}"`;
        let type = 'info';
        
        if (status === 'inactive') {
          title = '鎴愬憳鎼閫氱煡';
          content += '锛岃纭繚宸茬粨娓呮墍鏈夎垂鐢ㄣ€?;
          type = 'warning';
        } else if (status === 'active' && oldValues.status === 'inactive') {
          title = '鎴愬憳婵€娲婚€氱煡';
        } else if (status === 'active' && oldValues.status === 'pending') {
          title = '鎴愬憳鐘舵€佺‘璁?;
        } else if (status === 'pending') {
          title = '鎴愬憳鐘舵€佸緟纭';
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
      
      logger.info('[DormService] 瀹胯垗鎴愬憳鐘舵€佹洿鏂版垚鍔?, { 
        userDormId: updatedRecord.id, 
        userId: updatedRecord.user_id,
        dormId: updatedRecord.dorm_id,
        newStatus: updatedRecord.status 
      });
      
      // 10. 璁＄畻璐圭敤淇℃伅
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
        message: '鎴愬憳鐘舵€佹洿鏂版垚鍔?
      };
      
    } catch (error) {
      logger.error('[DormService] 鏇存柊瀹胯垗鎴愬憳鐘舵€佸け璐?, { error: error.message, userDormId, userId: currentUser?.id });
      throw error;
    }
  }

  /**
   * 鏇存柊瀹胯垗鎴愬憳瑙掕壊
   * @param {number} userDormId - user_dorms琛ㄧ殑ID
   * @param {Object} roleData - 瑙掕壊鏁版嵁
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鏇存柊缁撴灉
   */
  async updateMemberRole(userDormId, roleData, currentUser) {
    try {
      logger.info('[DormService] 鏇存柊瀹胯垗鎴愬憳瑙掕壊', { userDormId, roleData, currentUser });
      
      // 1. 鍙傛暟楠岃瘉
      if (!userDormId || isNaN(userDormId)) {
        return {
          success: false,
          message: '鐢ㄦ埛瀹胯垗鍏崇郴ID鏃犳晥'
        };
      }
      
      const { memberRole, updatePermissions = true, notifyUser = true } = roleData;
      
      if (!memberRole || !['admin', 'member', 'viewer'].includes(memberRole)) {
        return {
          success: false,
          message: '瑙掕壊蹇呴』鏄痑dmin銆乵ember鎴杤iewer涔嬩竴'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const hasPermission = await this.dormRepository.validateOperatorPermission(userDormId, currentUser.id);
      if (!hasPermission) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曟洿鏂版垚鍛樿鑹?
        };
      }
      
      // 3. 鑾峰彇褰撳墠鐨勬垚鍛樹俊鎭拰瀹胯垗淇℃伅
      const currentRecord = await this.dormRepository.getUserDormById(userDormId);
      if (!currentRecord) {
        return {
          success: false,
          message: '鐢ㄦ埛瀹胯垗鍏崇郴璁板綍涓嶅瓨鍦?
        };
      }
      
      // 4. 楠岃瘉瑙掕壊鍙樻洿鐨勫悎娉曟€?      // 涓嶈兘灏嗗鑸嶇鐞嗗憳锛坅dmin_id锛夌殑瑙掕壊闄嶇骇锛堝鏋滀笟鍔￠€昏緫涓嶅厑璁革級
      if (currentRecord.member_role === 'admin' && 
          currentRecord.dorm_admin_id === currentRecord.user_id && 
          memberRole !== 'admin') {
        // 妫€鏌ユ槸鍚︽槸鏈€鍚庝竴涓鐞嗗憳
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
            message: '涓嶈兘绉婚櫎鏈€鍚庝竴涓鑸嶇鐞嗗憳锛岃鍏堟寚瀹氭柊鐨勭鐞嗗憳'
          };
        }
      }
      
      // 5. 璁板綍鏇存柊鍓嶇殑淇℃伅鐢ㄤ簬瀹¤
      const oldValues = {
        member_role: currentRecord.member_role,
        can_approve_expenses: currentRecord.can_approve_expenses,
        can_invite_members: currentRecord.can_invite_members,
        can_manage_facilities: currentRecord.can_manage_facilities
      };
      
      // 6. 鎵ц瑙掕壊鏇存柊鎿嶄綔
      const updatedRecord = await this.dormRepository.updateUserDormRole(userDormId, memberRole, updatePermissions);
      
      // 7. 璁板綍瀹¤鏃ュ織
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
      
      // 8. 鍙戦€侀€氱煡
      if (notifyUser) {
        await this.dormRepository.sendNotification({
          title: '瑙掕壊鏇存柊閫氱煡',
          content: `鎮ㄥ湪瀹胯垗"${updatedRecord.dorm_name}"鐨勮鑹插凡鍙樻洿涓?${memberRole}"`,
          type: 'info',
          userId: updatedRecord.user_id,
          dormId: updatedRecord.dorm_id,
          senderId: currentUser.id,
          relatedId: userDormId,
          relatedTable: 'user_dorms'
        });
      }
      
      logger.info('[DormService] 瀹胯垗鎴愬憳瑙掕壊鏇存柊鎴愬姛', { 
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
        message: '鎴愬憳瑙掕壊鏇存柊鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鏇存柊瀹胯垗鎴愬憳瑙掕壊澶辫触', { error: error.message, userDormId, userId: currentUser?.id });
      throw error;
    }
  }

  /**
   * 鏇存柊瀹胯垗淇℃伅
   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} dormData - 瀹胯垗鏁版嵁
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鏇存柊缁撴灉
   */
  async updateDorm(dormId, dormData, currentUser) {
    try {
      logger.info('[DormService] 鏇存柊瀹胯垗淇℃伅', { dormId, dormData });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      // 鏍规嵁鏁版嵁搴撶殑琛岀骇瀹夊叏绛栫暐锛圧LS锛夛紝鍙湁浠ヤ笅鐢ㄦ埛鍙互鏇存柊瀹胯垗淇℃伅锛?      // 绯荤粺绠＄悊鍛橈紙system_admin瑙掕壊锛夈€佹櫘閫氱鐞嗗憳锛坅dmin瑙掕壊锛夈€佽瀹胯垗鐨勭鐞嗗憳锛坅dmin_id绛変簬褰撳墠鐢ㄦ埛ID锛?      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎'
        };
      }
      
      // 妫€鏌ョ敤鎴锋潈闄愶紙绯荤粺绠＄悊鍛樸€佹櫘閫氱鐞嗗憳鎴栧鑸嶇鐞嗗憳锛?      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曟洿鏂版瀹胯垗淇℃伅'
        };
      }
      
      // 3. 鏁版嵁楠岃瘉
      const validation = this._validateUpdateDormData(dormData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }
      
      // 4. 楠岃瘉蹇呭～瀛楁锛堝鏋滄彁渚涳級
      if ((dormData.dormName !== undefined && dormData.dormName === '') ||
          (dormData.address !== undefined && dormData.address === '') ||
          (dormData.capacity !== undefined && (isNaN(dormData.capacity) || dormData.capacity <= 0))) {
        return {
          success: false,
          message: '瀹胯垗鍚嶇О銆佸湴鍧€涓嶈兘涓虹┖锛屽閲忓繀椤绘槸澶т簬0鐨勬暟瀛?
        };
      }
      
      // 5. 楠岃瘉瀹归噺绾︽潫锛堝鏋滄洿鏂癱apacity锛?      if (dormData.capacity !== undefined) {
        const currentOccupancy = await this.dormRepository.getDormCurrentOccupancy(dormId);
        if (dormData.capacity < currentOccupancy) {
          return {
            success: false,
            message: `鏂板閲忎笉鑳藉皬浜庡綋鍓嶅叆浣忎汉鏁?${currentOccupancy})`
          };
        }
      }
      
      // 6. 妫€鏌ョ鐞嗗憳ID锛堝鎻愪緵锛?      if (dormData.adminId) {
        const isAdminValid = await this._validateAdmin(dormData.adminId);
        if (!isAdminValid) {
          return {
            success: false,
            message: '鎸囧畾鐨勭鐞嗗憳涓嶅瓨鍦ㄦ垨鐘舵€佹棤鏁?
          };
        }
      }
      
      // 7. 妫€鏌ュ鑸嶇紪鐮佸敮涓€鎬э紙濡傛彁渚涗笖涓嶅悓浜庡綋鍓嶇紪鐮侊級
      if (dormData.dormCode && dormData.dormCode !== dormInfo.dorm_code) {
        const duplicateDorm = await this.dormRepository.checkDormCodeUnique(dormData.dormCode, dormId);
        if (duplicateDorm) {
          return {
            success: false,
            message: '瀹胯垗缂栫爜宸插瓨鍦?
          };
        }
      }
      
      // 8. 璋冪敤浠撳簱灞傛洿鏂板鑸?      const updatedDorm = await this.dormRepository.updateDorm(dormId, dormData);
      
      // 9. 濡傛灉瀹胯垗鐨勭鐞嗗憳鍙樻洿锛屽彲鑳介渶瑕佸悓姝ユ洿鏂?user_dorms 琛ㄤ腑鐨勬垚鍛樿鑹?      if (dormData.adminId && dormData.adminId !== dormInfo.admin_id) {
        await this._adjustMemberRoles(dormId, dormInfo.admin_id, dormData.adminId);
      }
      
      logger.info('[DormService] 瀹胯垗淇℃伅鏇存柊鎴愬姛', { 
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
        message: '瀹胯垗淇℃伅鏇存柊鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鏇存柊瀹胯垗淇℃伅澶辫触', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 楠岃瘉鏇存柊瀹胯垗鏁版嵁
   * @param {Object} dormData - 瀹胯垗鏁版嵁
   * @returns {Object} 楠岃瘉缁撴灉
   */
  _validateUpdateDormData(dormData) {
    // 濡傛灉鎻愪緵浜嗗鑸嶅悕绉帮紝涓嶈兘涓轰负绌?    if (dormData.dormName !== undefined && dormData.dormName === '') {
      return { isValid: false, message: '瀹胯垗鍚嶇О涓嶈兘涓虹┖' };
    }
    
    // 濡傛灉鎻愪緵浜嗗鑸嶇紪鐮侊紝涓嶈兘涓虹┖
    if (dormData.dormCode !== undefined && dormData.dormCode === '') {
      return { isValid: false, message: '瀹胯垗缂栫爜涓嶈兘涓虹┖' };
    }
    
    // 濡傛灉鎻愪緵浜嗗湴鍧€锛屼笉鑳戒负绌?    if (dormData.address !== undefined && dormData.address === '') {
      return { isValid: false, message: '瀹胯垗鍦板潃涓嶈兘涓虹┖' };
    }
    
    // 濡傛灉鎻愪緵浜嗗閲忥紝蹇呴』鏄ぇ浜?鐨勬暟瀛?    if (dormData.capacity !== undefined && (isNaN(dormData.capacity) || dormData.capacity <= 0)) {
      return { isValid: false, message: '瀹胯垗瀹归噺蹇呴』鏄ぇ浜?鐨勬暟瀛? };
    }
    
    // 濡傛灉鎻愪緵浜嗛潰绉紝楠岃瘉鍏舵湁鏁堟€?    if (dormData.area !== undefined && dormData.area !== null && (isNaN(dormData.area) || dormData.area <= 0)) {
      return { isValid: false, message: '瀹胯垗闈㈢Н蹇呴』鏄ぇ浜?鐨勬暟瀛? };
    }
    
    // 濡傛灉鎻愪緵浜嗘湀绉熼噾锛岄獙璇佸叾鏈夋晥鎬?    if (dormData.monthlyRent !== undefined && dormData.monthlyRent !== null && (isNaN(dormData.monthlyRent) || dormData.monthlyRent < 0)) {
      return { isValid: false, message: '鏈堢閲戜笉鑳戒负璐熸暟' };
    }
    
    // 濡傛灉鎻愪緵浜嗘娂閲戯紝楠岃瘉鍏舵湁鏁堟€?    if (dormData.deposit !== undefined && dormData.deposit !== null && (isNaN(dormData.deposit) || dormData.deposit < 0)) {
      return { isValid: false, message: '鎶奸噾涓嶈兘涓鸿礋鏁? };
    }
    
    // 濡傛灉鎻愪緵浜嗘ゼ灞傦紝楠岃瘉鍏舵湁鏁堟€?    if (dormData.floor !== undefined && dormData.floor !== null && (isNaN(dormData.floor) || dormData.floor <= 0)) {
      return { isValid: false, message: '妤煎眰蹇呴』鏄ぇ浜?鐨勬暟瀛? };
    }
    
    return { isValid: true };
  }

  /**
   * 鍒涘缓鏂板鑸?   * @param {Object} dormData - 瀹胯垗鏁版嵁
   * @returns {Promise<Object>} 鍒涘缓缁撴灉
   */
  async createDorm(dormData) {
    try {
      logger.info('[DormService] 鍒涘缓瀹胯垗', { dormData });
      
      // 1. 鏁版嵁楠岃瘉
      const validation = this._validateDormData(dormData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // 2. 妫€鏌ョ鐞嗗憳ID锛堝鎻愪緵锛?      if (dormData.adminId) {
        const isAdminValid = await this._validateAdmin(dormData.adminId);
        if (!isAdminValid) {
          return {
            success: false,
            message: '鎸囧畾鐨勭鐞嗗憳涓嶅瓨鍦ㄦ垨鐘舵€佹棤鏁?
          };
        }
      }

      // 3. 妫€鏌ュ鑸嶇紪鐮佸敮涓€鎬э紙濡傛彁渚涳級
      if (dormData.dormCode) {
        const isCodeUnique = await this._checkDormCodeUnique(dormData.dormCode);
        if (!isCodeUnique) {
          return {
            success: false,
            message: '瀹胯垗缂栫爜宸插瓨鍦?
          };
        }
      }

      // 4. 璋冪敤浠撳簱灞傚垱寤哄鑸?      const createdDorm = await this.dormRepository.createDorm(dormData);
      
      logger.info('[DormService] 瀹胯垗鍒涘缓鎴愬姛', { 
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
        message: '瀹胯垗鍒涘缓鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鍒涘缓瀹胯垗澶辫触', { error: error.message });
      throw error;
    }
  }

  /**
   * 楠岃瘉瀹胯垗鏁版嵁
   * @param {Object} dormData - 瀹胯垗鏁版嵁
   * @returns {Object} 楠岃瘉缁撴灉
   */
  _validateDormData(dormData) {
    // 妫€鏌ュ繀闇€瀛楁
    if (!dormData.dormName) {
      return { isValid: false, message: '瀹胯垗鍚嶇О涓嶈兘涓虹┖' };
    }
    
    if (!dormData.dormCode) {
      return { isValid: false, message: '瀹胯垗缂栫爜涓嶈兘涓虹┖' };
    }
    
    if (!dormData.address) {
      return { isValid: false, message: '瀹胯垗鍦板潃涓嶈兘涓虹┖' };
    }
    
    if (!dormData.capacity || isNaN(dormData.capacity) || dormData.capacity <= 0) {
      return { isValid: false, message: '瀹胯垗瀹归噺蹇呴』鏄ぇ浜?鐨勬暟瀛? };
    }
    
    // 濡傛灉鎻愪緵浜嗛潰绉紝楠岃瘉鍏舵湁鏁堟€?    if (dormData.area !== undefined && dormData.area !== null) {
      if (isNaN(dormData.area) || dormData.area <= 0) {
        return { isValid: false, message: '瀹胯垗闈㈢Н蹇呴』鏄ぇ浜?鐨勬暟瀛? };
      }
    }
    
    // 濡傛灉鎻愪緵浜嗘湀绉熼噾锛岄獙璇佸叾鏈夋晥鎬?    if (dormData.monthlyRent !== undefined && dormData.monthlyRent !== null) {
      if (isNaN(dormData.monthlyRent) || dormData.monthlyRent < 0) {
        return { isValid: false, message: '鏈堢閲戜笉鑳戒负璐熸暟' };
      }
    }
    
    // 濡傛灉鎻愪緵浜嗘娂閲戯紝楠岃瘉鍏舵湁鏁堟€?    if (dormData.deposit !== undefined && dormData.deposit !== null) {
      if (isNaN(dormData.deposit) || dormData.deposit < 0) {
        return { isValid: false, message: '鎶奸噾涓嶈兘涓鸿礋鏁? };
      }
    }
    
    // 濡傛灉鎻愪緵浜嗘ゼ灞傦紝楠岃瘉鍏舵湁鏁堟€?    if (dormData.floor !== undefined && dormData.floor !== null) {
      if (isNaN(dormData.floor) || dormData.floor <= 0) {
        return { isValid: false, message: '妤煎眰蹇呴』鏄ぇ浜?鐨勬暟瀛? };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 楠岃瘉绠＄悊鍛業D
   * @param {number} adminId - 绠＄悊鍛業D
   * @returns {Promise<boolean>} 鏄惁鏈夋晥
   */
  async _validateAdmin(adminId) {
    try {
      const admin = await this.dormRepository.getUserById(adminId);
      return admin && admin.status === 'active';
    } catch (error) {
      logger.error('[DormService] 楠岃瘉绠＄悊鍛樺け璐?, { error: error.message, adminId });
      return false;
    }
  }

  /**
   * 妫€鏌ュ鑸嶇紪鐮佸敮涓€鎬?   * @param {string} dormCode - 瀹胯垗缂栫爜
   * @returns {Promise<boolean>} 鏄惁鍞竴
   */
  async _checkDormCodeUnique(dormCode) {
    try {
      const existingDorm = await this.dormRepository.getDormByCode(dormCode);
      return !existingDorm;
    } catch (error) {
      logger.error('[DormService] 妫€鏌ュ鑸嶇紪鐮佸敮涓€鎬уけ璐?, { error: error.message, dormCode });
      return false;
    }
  }

  /**
   * 璋冩暣瀹胯垗鎴愬憳瑙掕壊锛堝綋绠＄悊鍛樺彉鏇存椂锛?   * @param {number} dormId - 瀹胯垗ID
   * @param {number} oldAdminId - 鍘熺鐞嗗憳ID
   * @param {number} newAdminId - 鏂扮鐞嗗憳ID
   * @returns {Promise<void>}
   */
  async _adjustMemberRoles(dormId, oldAdminId, newAdminId) {
    try {
      // 灏嗗師绠＄悊鍛橀檷绾т负鏅€氭垚鍛?      if (oldAdminId) {
        await this.dormRepository.updateMemberRole(dormId, oldAdminId, 'member');
      }
      
      // 灏嗘柊绠＄悊鍛樿缃负admin瑙掕壊
      await this.dormRepository.setMemberAsAdmin(dormId, newAdminId);
      
      logger.info('[DormService] 瀹胯垗鎴愬憳瑙掕壊璋冩暣鎴愬姛', { dormId, oldAdminId, newAdminId });
    } catch (error) {
      logger.error('[DormService] 璋冩暣瀹胯垗鎴愬憳瑙掕壊澶辫触', { error: error.message, dormId, oldAdminId, newAdminId });
      throw error;
    }
  }

  /**
   * 鍒犻櫎瀹胯垗
   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鍒犻櫎缁撴灉
   */
  async deleteDorm(dormId, currentUser) {
    try {
      logger.info('[DormService] 鍒犻櫎瀹胯垗', { dormId, userId: currentUser.id });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      // 鏍规嵁鏁版嵁搴撶殑琛岀骇瀹夊叏绛栫暐锛圧LS锛夛紝鍙湁浠ヤ笅鐢ㄦ埛鍙互鍒犻櫎瀹胯垗锛?      // 绯荤粺绠＄悊鍛橈紙system_admin瑙掕壊锛夈€佹櫘閫氱鐞嗗憳锛坅dmin瑙掕壊锛夈€佽瀹胯垗鐨勭鐞嗗憳锛坅dmin_id绛変簬褰撳墠鐢ㄦ埛ID锛?      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎'
        };
      }
      
      // 妫€鏌ョ敤鎴锋潈闄愶紙绯荤粺绠＄悊鍛樸€佹櫘閫氱鐞嗗憳鎴栧鑸嶇鐞嗗憳锛?      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曞垹闄ゆ瀹胯垗'
        };
      }
      
      // 3. 璋冪敤浠撳簱灞傚垹闄ゅ鑸?      const result = await this.dormRepository.deleteDorm(dormId, currentUser.id);
      
      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }
      
      logger.info('[DormService] 瀹胯垗鍒犻櫎鎴愬姛', { 
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
        message: '瀹胯垗鍒犻櫎鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鍒犻櫎瀹胯垗澶辫触', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 鍒犻櫎瀹胯垗鎴愬憳
   * @param {number} userDormId - user_dorms琛ㄧ殑ID
   * @param {Object} deleteData - 鍒犻櫎鍙傛暟
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鍒犻櫎缁撴灉
   */
  async removeMember(userDormId, deleteData, currentUser) {
    try {
      logger.info('[DormService] 鍒犻櫎瀹胯垗鎴愬憳', { userDormId, deleteData, currentUser });
      
      // 1. 鍙傛暟楠岃瘉
      if (!userDormId || isNaN(userDormId)) {
        return {
          success: false,
          message: '鐢ㄦ埛瀹胯垗鍏崇郴ID鏃犳晥'
        };
      }
      
      const { 
        deleteType = 'logical',  // 鍒犻櫎绫诲瀷锛?physical'锛堢墿鐞嗗垹闄わ級鎴?logical'锛堥€昏緫鍒犻櫎锛?        handleUnpaidExpenses = 'waive',  // 澶勭悊鏈粨璐圭敤锛?waive'锛堝厤闄わ級銆?reallocate'锛堥噸鏂板垎鎽婏級銆?keep'锛堜繚鎸侊級
        refundDeposit = false,  // 鏄惁閫€杩樻娂閲?        newAdminId,  // 濡傛灉鍒犻櫎鐨勬槸绠＄悊鍛橈紝鎸囧畾鏂扮殑绠＄悊鍛樼敤鎴稩D
        notifyUser = true  // 鏄惁鍙戦€侀€氱煡缁欑敤鎴?      } = deleteData;
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const hasPermission = await this.dormRepository.validateOperatorPermission(userDormId, currentUser.id);
      logger.info('[DormService] 鏉冮檺楠岃瘉缁撴灉', { hasPermission, userDormId, operatorId: currentUser.id });
      if (!hasPermission) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曞垹闄ゆ垚鍛?
        };
      }
      
      // 3. 鑾峰彇褰撳墠鐨勬垚鍛樹俊鎭拰瀹胯垗淇℃伅
      const currentRecord = await this.dormRepository.getUserDormById(userDormId);
      logger.info('[DormService] 鑾峰彇褰撳墠璁板綍', { currentRecord });
      if (!currentRecord) {
        return {
          success: false,
          message: '鐢ㄦ埛瀹胯垗鍏崇郴璁板綍涓嶅瓨鍦?
        };
      }
      
      // 4. 妫€鏌ユ湭缁撴竻璐圭敤锛堥噸瑕佷笟鍔￠€昏緫锛?      const unpaidInfo = await this.dormRepository.checkUnpaidExpenses(currentRecord.user_id, currentRecord.dorm_id);
      const pendingAmount = parseFloat(unpaidInfo.pending_amount) || 0;
      
      // 濡傛灉鏈夋湭缁撴竻璐圭敤涓旀湭鎸囧畾澶勭悊鏂瑰紡锛屾彁绀虹敤鎴?      if (pendingAmount > 0 && !handleUnpaidExpenses) {
        return {
          success: false,
          message: `鎴愬憳鏈夋湭缁撴竻璐圭敤 ${pendingAmount.toFixed(2)} 鍏冿紝璇锋寚瀹氬浣曞鐞嗚繖浜涜垂鐢紙waive-鍏嶉櫎銆乲eep-淇濇寔锛塦
        };
      }
      
      // 5. 妫€鏌ユ槸鍚︽槸瀹胯垗绠＄悊鍛橈紙閲嶈涓氬姟閫昏緫锛?      let newAdminAssigned = false;
      if (currentRecord.dorm_admin_id === currentRecord.user_id) {
        // 濡傛灉鍒犻櫎鐨勬槸瀹胯垗绠＄悊鍛橈紝闇€瑕佹寚瀹氭柊鐨勭鐞嗗憳
        if (!newAdminId) {
          // 妫€鏌ュ綋鍓嶅鑸嶆槸鍚︽湁鍏朵粬鎴愬憳鍙互鎴愪负绠＄悊鍛?          const alternativeAdmin = await this.dormRepository.findAlternativeAdmin(currentRecord.dorm_id, currentRecord.user_id);
          if (alternativeAdmin) {
            newAdminId = alternativeAdmin.user_id;
          } else {
            return {
              success: false,
              message: '鍒犻櫎鐨勬槸瀹胯垗绠＄悊鍛橈紝浣嗗鑸嶄腑娌℃湁鍏朵粬鎴愬憳鍙互鎴愪负鏂扮鐞嗗憳'
            };
          }
        }
        
        // 鏇存柊瀹胯垗绠＄悊鍛?        await this.dormRepository.updateDormAdmin(currentRecord.dorm_id, newAdminId);
        newAdminAssigned = true;
      }
      
      // 6. 鎵ц鍒犻櫎鎿嶄綔
      let deletedRecord;
      if (deleteType === 'physical') {
        // 鐗╃悊鍒犻櫎
        deletedRecord = await this.dormRepository.physicalDeleteMember(userDormId);
      } else {
        // 閫昏緫鍒犻櫎锛堟帹鑽愶級
        deletedRecord = await this.dormRepository.logicalDeleteMember(userDormId, handleUnpaidExpenses);
      }
      
      // 7. 澶勭悊瀹胯垗绠＄悊鍛樺彉鏇达紙濡傛灉闇€瑕侊級
      if (newAdminAssigned) {
        // 鏇存柊鏂扮鐞嗗憳鐨勮鑹蹭负admin
        await this.dormRepository.updateMemberRole(currentRecord.dorm_id, newAdminId, 'admin');
      }
      
      // 8. 澶勭悊璐圭敤鍒嗘憡璁板綍锛堥€昏緫鍒犻櫎鏃堕渶瑕佸鐞嗭級
      if (deleteType !== 'physical' && handleUnpaidExpenses === 'waive') {
        // 鏍囪涓哄凡鍏嶉櫎
        await this.dormRepository.waiveUnpaidExpenses(currentRecord.user_id, currentRecord.dorm_id);
      }
      
      // 9. 璁板綍瀹¤鏃ュ織
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
      
      // 10. 鍙戦€侀€氱煡
      if (notifyUser) {
        // 缁欒鍒犻櫎鐨勬垚鍛樺彂閫侀€氱煡
        await this.dormRepository.sendNotification({
          title: '鎴愬憳绉婚櫎閫氱煡',
          content: `鎮ㄥ凡琚粠瀹胯垗"${currentRecord.dorm_name}"涓Щ闄,
          type: 'warning',
          userId: currentRecord.user_id,
          dormId: currentRecord.dorm_id,
          senderId: currentUser.id,
          relatedId: userDormId,
          relatedTable: 'user_dorms'
        });
        
        // 缁欏鑸嶇鐞嗗憳鍙戦€侀€氱煡锛堝鏋滄搷浣滀汉涓嶆槸绠＄悊鍛橈級
        if (currentUser.id !== currentRecord.dorm_admin_id) {
          await this.dormRepository.sendNotification({
            title: '鎴愬憳绉婚櫎閫氱煡',
            content: `鎴愬憳"${currentRecord.nickname || currentRecord.username}"宸茶浠庡鑸?${currentRecord.dorm_name}"涓Щ闄,
            type: 'info',
            userId: currentRecord.dorm_admin_id,
            dormId: currentRecord.dorm_id,
            senderId: currentUser.id,
            relatedId: userDormId,
            relatedTable: 'user_dorms'
          });
        }
      }
      
      logger.info('[DormService] 瀹胯垗鎴愬憳鍒犻櫎鎴愬姛', { 
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
        message: '鎴愬憳鍒犻櫎鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鍒犻櫎瀹胯垗鎴愬憳澶辫触', { error: error.message, userDormId, userId: currentUser?.id });
      throw error;
    }
  }

  /**
   * 鑾峰彇瀵濆璁剧疆
   * @param {number} dormId - 瀹胯垗ID
   * @returns {Promise<Object>} 瀵濆璁剧疆缁撴灉
   */
  async getDormSettings(dormId) {
    try {
      logger.info('[DormService] 鑾峰彇瀵濆璁剧疆', { dormId });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 璋冪敤浠撳簱灞傝幏鍙栬缃?      const settings = await this.dormRepository.getDormSettings(dormId);
      
      // 3. 瑙ｆ瀽JSON瀛楁 - 妫€鏌ュ瓧娈电被鍨嬶紝鍙湁瀛楃涓叉墠闇€瑕佽В鏋?      const parsedSettings = {
        ...settings,
        basic: settings.basic 
          ? (typeof settings.basic === 'string' ? JSON.parse(settings.basic) : settings.basic)
          : {},
        notifications: settings.notifications 
          ? (typeof settings.notifications === 'string' ? JSON.parse(settings.notifications) : settings.notifications)
          : {}
      };
      
      logger.info('[DormService] 瀵濆璁剧疆鑾峰彇鎴愬姛', { dormId });
      
      return {
        success: true,
        data: parsedSettings,
        message: '瀵濆璁剧疆鑾峰彇鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇瀵濆璁剧疆澶辫触', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 鏇存柊瀵濆璁剧疆
   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} settings - 璁剧疆鏁版嵁
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鏇存柊缁撴灉
   */
  async updateDormSettings(dormId, settings, currentUser) {
    try {
      logger.info('[DormService] 鏇存柊瀵濆璁剧疆', { dormId, settings });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曟洿鏂版瀹胯垗璁剧疆'
        };
      }
      
      // 3. 璋冪敤浠撳簱灞傛洿鏂拌缃?      const updatedSettings = await this.dormRepository.updateDormSettings(dormId, settings);
      
      // 4. 瑙ｆ瀽JSON瀛楁
      const parsedSettings = {
        ...updatedSettings,
        basic: updatedSettings.basic ? (typeof updatedSettings.basic === 'string' ? JSON.parse(updatedSettings.basic) : updatedSettings.basic) : {},
        notifications: updatedSettings.notifications ? (typeof updatedSettings.notifications === 'string' ? JSON.parse(updatedSettings.notifications) : updatedSettings.notifications) : {}
      };      
      // 5. 璁板綍瀹¤鏃ュ織
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
      
      logger.info('[DormService] 瀵濆璁剧疆鏇存柊鎴愬姛', { dormId });
      
      return {
        success: true,
        data: parsedSettings,
        message: '瀵濆璁剧疆鏇存柊鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鏇存柊瀵濆璁剧疆澶辫触', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 鑾峰彇瀵濆鍙樻洿鍘嗗彶
   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} pagination - 鍒嗛〉鍙傛暟
   * @returns {Promise<Object>} 鍙樻洿鍘嗗彶缁撴灉
   */
  async getDormHistory(dormId, pagination = {}) {
    try {
      logger.info('[DormService] 鑾峰彇瀵濆鍙樻洿鍘嗗彶', { dormId, pagination });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉鍒嗛〉鍙傛暟
      const page = Math.max(1, parseInt(pagination.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 10));
      
      // 3. 璋冪敤浠撳簱灞傝幏鍙栧巻鍙茶褰?      const history = await this.dormRepository.getDormHistory(dormId, { page, limit });
      
      logger.info('[DormService] 瀵濆鍙樻洿鍘嗗彶鑾峰彇鎴愬姛', { dormId, total: history.total });
      
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
        message: '瀵濆鍙樻洿鍘嗗彶鑾峰彇鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇瀵濆鍙樻洿鍘嗗彶澶辫触', { error: error.message, dormId });
      throw error;
    }
  }

  /**
   * 寮€濮嬭В鏁ｆ祦绋?   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鎿嶄綔缁撴灉
   */
  async startDismissProcess(dormId, currentUser) {
    try {
      logger.info('[DormService] 寮€濮嬭В鏁ｆ祦绋?, { dormId, userId: currentUser.id });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曞紑濮嬭В鏁ｆ祦绋?
        };
      }
      
      // 3. 妫€鏌ュ鑸嶅綋鍓嶇姸鎬?      if (dormInfo.status !== 'active') {
        return {
          success: false,
          message: '鍙湁姝ｅ父鐘舵€佺殑瀹胯垗鎵嶈兘寮€濮嬭В鏁ｆ祦绋?
        };
      }
      
      // 4. 璋冪敤浠撳簱灞傚紑濮嬭В鏁ｆ祦绋?      const result = await this.dormRepository.startDismissProcess(dormId, currentUser.id);
      
      logger.info('[DormService] 瑙ｆ暎娴佺▼寮€濮嬫垚鍔?, { dormId });
      
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
        message: '瑙ｆ暎娴佺▼寮€濮嬫垚鍔?
      };
      
    } catch (error) {
      logger.error('[DormService] 寮€濮嬭В鏁ｆ祦绋嬪け璐?, { error: error.message, dormId });
      return {
        success: false,
        message: '寮€濮嬭В鏁ｆ祦绋嬪け璐? ' + error.message
      };
    }
  }

  /**
   * 纭瑙ｆ暎
   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鎿嶄綔缁撴灉
   */
  async confirmDismiss(dormId, currentUser) {
    try {
      logger.info('[DormService] 纭瑙ｆ暎', { dormId, userId: currentUser.id });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曠‘璁よВ鏁?
        };
      }
      
      // 3. 妫€鏌ュ鑸嶅綋鍓嶇姸鎬?      if (dormInfo.status !== 'dismissing') {
        return {
          success: false,
          message: '鍙湁姝ｅ湪瑙ｆ暎涓殑瀹胯垗鎵嶈兘纭瑙ｆ暎'
        };
      }
      
      // 4. 璋冪敤浠撳簱灞傜‘璁よВ鏁?      const result = await this.dormRepository.confirmDismiss(dormId, currentUser.id);
      
      logger.info('[DormService] 纭瑙ｆ暎鎴愬姛', { dormId });
      
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
        message: '纭瑙ｆ暎鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 纭瑙ｆ暎澶辫触', { error: error.message, dormId });
      return {
        success: false,
        message: '纭瑙ｆ暎澶辫触: ' + error.message
      };
    }
  }

  /**
   * 鍙栨秷瑙ｆ暎
   * @param {number} dormId - 瀹胯垗ID
   * @param {Object} currentUser - 褰撳墠鐢ㄦ埛淇℃伅
   * @returns {Promise<Object>} 鎿嶄綔缁撴灉
   */
  async cancelDismiss(dormId, currentUser) {
    try {
      logger.info('[DormService] 鍙栨秷瑙ｆ暎', { dormId, userId: currentUser.id });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 楠岃瘉褰撳墠鐢ㄦ埛鏉冮檺
      const dormInfo = await this.dormRepository.validateDormExists(dormId);
      if (!dormInfo) {
        return {
          success: false,
          message: '瀹胯垗涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎'
        };
      }
      
      const userRole = currentUser.role;
      const isAuthorized = userRole === 'system_admin' || 
                          userRole === 'admin' || 
                          dormInfo.admin_id === currentUser.id;
                          
      if (!isAuthorized) {
        return {
          success: false,
          message: '鏉冮檺涓嶈冻锛屾棤娉曞彇娑堣В鏁?
        };
      }
      
      // 3. 妫€鏌ュ鑸嶅綋鍓嶇姸鎬?      if (dormInfo.status !== 'dismissing') {
        return {
          success: false,
          message: '鍙湁姝ｅ湪瑙ｆ暎涓殑瀹胯垗鎵嶈兘鍙栨秷瑙ｆ暎'
        };
      }
      
      // 4. 璋冪敤浠撳簱灞傚彇娑堣В鏁?      const result = await this.dormRepository.cancelDismiss(dormId, currentUser.id);
      
      logger.info('[DormService] 鍙栨秷瑙ｆ暎鎴愬姛', { dormId });
      
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
        message: '鍙栨秷瑙ｆ暎鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鍙栨秷瑙ｆ暎澶辫触', { error: error.message, dormId });
      return {
        success: false,
        message: '鍙栨秷瑙ｆ暎澶辫触: ' + error.message
      };
    }
  }

  /**
   * 鑾峰彇寰呯粨绠楄垂鐢?   * @param {number} dormId - 瀹胯垗ID
   * @returns {Promise<Object>} 寰呯粨绠楄垂鐢ㄧ粨鏋?   */
  async getPendingFees(dormId) {
    try {
      logger.info('[DormService] 鑾峰彇寰呯粨绠楄垂鐢?, { dormId });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 璋冪敤浠撳簱灞傝幏鍙栧緟缁撶畻璐圭敤
      const pendingFees = await this.dormRepository.getPendingFees(dormId);
      
      logger.info('[DormService] 寰呯粨绠楄垂鐢ㄨ幏鍙栨垚鍔?, { dormId, count: pendingFees.length });
      
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
        message: '寰呯粨绠楄垂鐢ㄨ幏鍙栨垚鍔?
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇寰呯粨绠楄垂鐢ㄥけ璐?, { error: error.message, dormId });
      return {
        success: false,
        data: { pendingFees: [] },
        message: '鑾峰彇寰呯粨绠楄垂鐢ㄥけ璐? ' + error.message
      };
    }
  }

  /**
   * 鑾峰彇瀵濆鎴愬憳鍒楄〃
   * @param {number} dormId - 瀹胯垗ID
   * @returns {Promise<Object>} 瀵濆鎴愬憳鍒楄〃缁撴灉
   */
  async getDormMembers(dormId) {
    try {
      logger.info('[DormService] 鑾峰彇瀵濆鎴愬憳鍒楄〃', { dormId });
      
      // 1. 鍙傛暟楠岃瘉
      if (!dormId || isNaN(dormId)) {
        return {
          success: false,
          message: '瀹胯垗ID鏃犳晥'
        };
      }
      
      // 2. 璋冪敤浠撳簱灞傝幏鍙栨垚鍛樺垪琛?      const members = await this.dormRepository.getDormMembers(dormId);
      
      logger.info('[DormService] 瀵濆鎴愬憳鍒楄〃鑾峰彇鎴愬姛', { dormId, count: members.length });
      
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
        message: '瀵濆鎴愬憳鍒楄〃鑾峰彇鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇瀵濆鎴愬憳鍒楄〃澶辫触', { error: error.message, dormId });
      return {
        success: false,
        data: { members: [] },
        message: '鑾峰彇瀵濆鎴愬憳鍒楄〃澶辫触: ' + error.message
      };
    }
  }

  /**
   * 鑾峰彇鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅
   * @param {number} userId - 鐢ㄦ埛ID
   * @returns {Promise<Object>} 鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅缁撴灉
   */
  async getCurrentUserDorm(userId) {
    try {
      logger.info('[DormService] 鑾峰彇鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅', { userId });
      
      // 鍙傛暟楠岃瘉
      if (!userId || isNaN(userId)) {
        return {
          success: false,
          message: '鐢ㄦ埛ID鏃犳晥'
        };
      }
      
      // 璋冪敤浠撳簱灞傝幏鍙栫敤鎴锋墍鍦ㄧ殑瀵濆淇℃伅
      const dormInfo = await this.dormRepository.getDormByUserId(userId);
      
      if (!dormInfo) {
        return {
          success: false,
          message: '鐢ㄦ埛鏈姞鍏ヤ换浣曞瘽瀹?
        };
      }
      
      logger.info('[DormService] 鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅鑾峰彇鎴愬姛', { userId, dormId: dormInfo.id });
      
      // 鏍煎紡鍖栬繑鍥炴暟鎹?      const formattedDormInfo = {
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
        message: '鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅鑾峰彇鎴愬姛'
      };
      
    } catch (error) {
      logger.error('[DormService] 鑾峰彇鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅澶辫触', { error: error.message, userId });
      return {
        success: false,
        message: '鑾峰彇鐢ㄦ埛鎵€鍦ㄧ殑瀵濆淇℃伅澶辫触: ' + error.message
      };
    }
  }
}

module.exports = DormService;
