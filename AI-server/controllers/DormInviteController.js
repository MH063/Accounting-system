const BaseController = require('./BaseController');
const DormInviteService = require('../services/DormInviteService');
const logger = require('../config/logger');

class DormInviteController extends BaseController {
  constructor() {
    super();
    this.dormInviteService = new DormInviteService();
  }

  /**
   * 邀请成员到宿舍
   * POST /api/dorms/:dormId/invite
   */
  async inviteMember(req, res) {
    try {
      // 记录邀请成员尝试
      logger.audit(req, '邀请成员到宿舍', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.dormId,
        requestData: req.body
      });

      // 获取宿舍ID和请求体数据
      const { dormId } = req.params;
      const inviteData = req.body;
      
      // 获取当前用户信息
      const currentUser = req.user;
      
      // 验证必需字段
      if (!dormId || isNaN(dormId)) {
        logger.error('[DormInviteController] 宿舍ID无效', { 
          dormId,
          userId: currentUser.id
        });
        return this.sendError(res, '宿舍ID无效', 400);
      }
      
      // 验证邀请数据
      const validation = this._validateInviteData(inviteData);
      if (!validation.isValid) {
        logger.error('[DormInviteController] 邀请数据验证失败', { 
          errors: validation.errors,
          userId: currentUser.id,
          dormId
        });
        return this.sendError(res, validation.message, 400);
      }
      
      // 调用服务层邀请成员
      const result = await this.dormInviteService.inviteMember(
        currentUser.id, 
        parseInt(dormId), 
        inviteData
      );
      
      if (!result.success) {
        logger.error('[DormInviteController] 邀请成员失败', { 
          reason: result.message,
          userId: currentUser.id,
          dormId
        });
        return this.sendError(res, result.message, 400);
      }

      const { inviteRecord, userInfo, dormInfo } = result.data;

      logger.audit(req, '邀请成员成功', { 
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        dormId: dormInfo.id,
        invitedUserId: userInfo.id
      });

      // 返回成功响应
      return this.sendSuccess(res, {
        inviteRecord: {
          id: inviteRecord.id,
          inviteCode: inviteRecord.invite_code,
          status: inviteRecord.status,
          expiresAt: inviteRecord.invite_expires_at
        },
        userInfo: {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          phone: userInfo.phone,
          isNewUser: userInfo.isNewUser
        },
        dormInfo: {
          id: dormInfo.id,
          dormName: dormInfo.dormName
        }
      }, result.message);
      
    } catch (error) {
      logger.error('[DormInviteController] 邀请成员异常', { 
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        dormId: req.params?.dormId
      });
      throw error;
    }
  }
  
  /**
   * 验证邀请数据
   * @param {Object} inviteData - 邀请数据
   * @returns {Object} 验证结果
   */
  _validateInviteData(inviteData) {
    const errors = [];
    
    // 必须提供邮箱或手机号之一
    if (!inviteData.email && !inviteData.phone) {
      errors.push('必须提供邮箱或手机号');
    }
    
    // 验证邮箱格式
    if (inviteData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteData.email)) {
      errors.push('邮箱格式不正确');
    }
    
    // 验证手机号格式
    if (inviteData.phone && !/^1[3-9]\d{9}$/.test(inviteData.phone)) {
      errors.push('手机号格式不正确');
    }
    
    // 验证成员角色
    if (inviteData.memberRole && !['admin', 'member', 'viewer'].includes(inviteData.memberRole)) {
      errors.push('成员角色无效');
    }
    
    // 验证邀请有效期
    if (inviteData.inviteExpiresDays !== undefined) {
      const days = parseInt(inviteData.inviteExpiresDays);
      if (isNaN(days) || days <= 0 || days > 365) {
        errors.push('邀请有效期必须是1-365之间的整数');
      }
    }
    
    // 验证月分摊费用
    if (inviteData.monthlyShare !== undefined && inviteData.monthlyShare !== null) {
      const share = parseFloat(inviteData.monthlyShare);
      if (isNaN(share) || share < 0) {
        errors.push('月分摊费用不能为负数');
      }
    }
    
    // 验证入住日期
    if (inviteData.moveInDate && isNaN(Date.parse(inviteData.moveInDate))) {
      errors.push('入住日期格式不正确');
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        message: errors[0]
      };
    }
    
    return {
      isValid: true
    };
  }
}

module.exports = DormInviteController;