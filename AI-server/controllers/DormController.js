const BaseController = require('./BaseController');
const DormService = require('../services/DormService');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../middleware/response');

class DormController extends BaseController {
  constructor() {
    super();
    this.dormService = new DormService();
    
    // 确保方法正确绑定到类实例
    this.getDormList = this.getDormList.bind(this);
    this.createDorm = this.createDorm.bind(this);
    this.getDormById = this.getDormById.bind(this);
    this.updateDorm = this.updateDorm.bind(this);
    this.deleteDorm = this.deleteDorm.bind(this);
    this.getDormMembers = this.getDormMembers.bind(this);
    this.updateMemberRole = this.updateMemberRole.bind(this);
    this.updateMemberStatus = this.updateMemberStatus.bind(this);
    this.removeMember = this.removeMember.bind(this);
    this.updateDormSettings = this.updateDormSettings.bind(this);
    this.getBuildings = this.getBuildings.bind(this);
    this.getDormStats = this.getDormStats.bind(this);
    this.batchDeleteDorms = this.batchDeleteDorms.bind(this);
    this.batchUpdateDormStatus = this.batchUpdateDormStatus.bind(this);
    this.addDormMember = this.addDormMember.bind(this);
    this.getAvailableUsers = this.getAvailableUsers.bind(this);
    this.getDormFeeSummary = this.getDormFeeSummary.bind(this);
    this.getDormMaintenanceRecords = this.getDormMaintenanceRecords.bind(this);
    this.updateDormStatus = this.updateDormStatus.bind(this);
  }

  /**
   * 获取宿舍列表
   * GET /api/dorms
   */
  async getDormList(req, res) {
    try {
      // 记录宿舍列表访问尝试
      logger.audit(req, '宿舍列表访问', { 
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      // 获取查询参数
      const {
        page = 1,
        limit = 10,
        search,
        status,
        type,
        genderLimit,
        building
      } = req.query;

      // 构建筛选条件
      const filters = {};
      if (search) filters.search = search;
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (genderLimit) filters.genderLimit = genderLimit;
      if (building) filters.building = building;

      // 构建分页参数
      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      // 调用服务层获取宿舍列表
      const result = await this.dormService.getDormList(filters, pagination);
      
      if (!result.success) {
        logger.error('[DormController] 获取宿舍列表失败', { 
          reason: result.message 
        });
        return errorResponse(res, result.message, 500);
      }

      const { dorms, pagination: paginationInfo } = result.data;

      logger.audit(req, '宿舍列表获取成功', { 
        timestamp: new Date().toISOString(),
        totalCount: paginationInfo.total
      });

      // 返回成功响应
      return successResponse(res, {
        dorms: dorms,
        pagination: paginationInfo
      }, '宿舍列表获取成功');

    } catch (error) {
      logger.error('[DormController] 获取宿舍列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建新宿舍
   * POST /api/dorms
   */
  async createDorm(req, res) {
    try {
      // 记录宿舍创建尝试
      logger.audit(req, '宿舍创建', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        requestData: req.body
      });

      // 获取请求体数据
      const dormData = req.body;

      // 调用服务层创建宿舍
      const result = await this.dormService.createDorm(dormData);
      
      if (!result.success) {
        logger.error('[DormController] 创建宿舍失败', { 
          reason: result.message 
        });
        return errorResponse(res, result.message, 400);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍创建成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return successResponse(res, {
        dorm: dorm
      }, '宿舍创建成功');

    } catch (error) {
      logger.error('[DormController] 创建宿舍异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取宿舍详情
   * GET /api/dorms/:id
   */
  async getDormById(req, res) {
    try {
      // 记录宿舍详情访问尝试
      logger.audit(req, '宿舍详情访问', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 调用服务层获取宿舍详情
      const result = await this.dormService.getDormById(id);
      
      if (!result.success) {
        logger.error('[DormController] 获取宿舍详情失败', { 
          reason: result.message,
          dormId: id
        });
        return errorResponse(res, result.message, 404);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍详情获取成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return successResponse(res, {
        dorm: dorm
      }, '宿舍详情获取成功');

    } catch (error) {
      logger.error('[DormController] 获取宿舍详情异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新宿舍信息
   * PUT /api/dorms/:id
   */
  async updateDorm(req, res) {
    try {
      // 记录宿舍信息更新尝试
      logger.audit(req, '宿舍信息更新', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id,
        requestData: req.body
      });

      // 获取宿舍ID和请求体数据
      const { id } = req.params;
      const dormData = req.body;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层更新宿舍信息
      const result = await this.dormService.updateDorm(id, dormData, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 更新宿舍信息失败', { 
          reason: result.message,
          dormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍信息更新成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return successResponse(res, {
        dorm: dorm
      }, '宿舍信息更新成功');

    } catch (error) {
      logger.error('[DormController] 更新宿舍信息异常', { 
        error: error.message,
        stack: error.stack,
        dormId: req.params.id,
        requestData: req.body
      });
      return errorResponse(res, '服务器内部错误：' + error.message, 500);
    }
  }

  /**
   * 删除宿舍
   * DELETE /api/dorms/:id
   */
  async deleteDorm(req, res) {
    try {
      // 记录宿舍删除尝试
      logger.audit(req, '宿舍删除', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层删除宿舍
      const result = await this.dormService.deleteDorm(id, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 删除宿舍失败', { 
          reason: result.message,
          dormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍删除成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return successResponse(res, {
        dorm: dorm
      }, '宿舍删除成功');

    } catch (error) {
      logger.error('[DormController] 删除宿舍异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新宿舍成员角色
   * PUT /api/dorms/members/:id/role
   */
  async updateMemberRole(req, res) {
    try {
      // 记录宿舍成员角色更新尝试
      logger.audit(req, '宿舍成员角色更新', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userDormId: req.params.id,
        requestData: req.body
      });

      // 获取用户宿舍关系ID
      const { id } = req.params;
      
      // 获取请求体数据
      const roleData = req.body;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层更新宿舍成员角色
      const result = await this.dormService.updateMemberRole(id, roleData, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 更新宿舍成员角色失败', { 
          reason: result.message,
          userDormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { userDorm } = result.data;

      logger.audit(req, '宿舍成员角色更新成功', { 
        timestamp: new Date().toISOString(),
        userDormId: userDorm.id,
        userId: userDorm.userId,
        dormId: userDorm.dormId,
        newRole: userDorm.memberRole
      });

      // 返回成功响应
      return successResponse(res, {
        userDorm: userDorm
      }, '成员角色更新成功');

    } catch (error) {
      logger.error('[DormController] 更新宿舍成员角色异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新宿舍成员状态
   * PUT /api/dorms/members/:id/status
   */
  async updateMemberStatus(req, res) {
    try {
      // 记录宿舍成员状态更新尝试
      logger.audit(req, '宿舍成员状态更新', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userDormId: req.params.id,
        requestData: req.body
      });

      // 获取用户宿舍关系ID
      const { id } = req.params;
      
      // 获取请求体数据
      const statusData = req.body;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层更新宿舍成员状态
      const result = await this.dormService.updateMemberStatus(id, statusData, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 更新宿舍成员状态失败', { 
          reason: result.message,
          userDormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { userDorm } = result.data;

      logger.audit(req, '宿舍成员状态更新成功', { 
        timestamp: new Date().toISOString(),
        userDormId: userDorm.id,
        userId: userDorm.userId,
        dormId: userDorm.dormId,
        newStatus: userDorm.status
      });

      // 返回成功响应
      return successResponse(res, {
        userDorm: userDorm
      }, '成员状态更新成功');

    } catch (error) {
      logger.error('[DormController] 更新宿舍成员状态异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 删除宿舍成员
   * DELETE /api/dorms/members/:id
   */
  async removeMember(req, res) {
    try {
      // 记录宿舍成员删除尝试
      logger.audit(req, '宿舍成员删除', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userDormId: req.params.id,
        requestData: req.query
      });

      // 获取用户宿舍关系ID
      const { id } = req.params;
      
      // 获取请求查询参数
      const deleteData = req.query;

      // 获取当前用户信息
      const currentUser = req.user;
      
      logger.info('[DormController] 删除成员请求', {
        userDormId: id,
        currentUserId: currentUser?.id,
        currentUserRole: currentUser?.role,
        currentUserUsername: currentUser?.username
      });
      
      // 调用服务层删除宿舍成员
      const result = await this.dormService.removeMember(id, deleteData, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 删除宿舍成员失败', { 
          reason: result.message,
          userDormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { userDorm } = result.data;

      logger.audit(req, '宿舍成员删除成功', { 
        timestamp: new Date().toISOString(),
        userDormId: userDorm.id,
        userId: userDorm.userId,
        dormId: userDorm.dormId
      });

      // 返回成功响应
      return successResponse(res, {
        userDorm: userDorm
      }, '成员删除成功');

    } catch (error) {
      logger.error('[DormController] 删除宿舍成员异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取寝室设置
   * GET /api/dorms/:id/settings
   */
  async getDormSettings(req, res) {
    try {
      // 记录获取寝室设置尝试
      logger.audit(req, '获取寝室设置', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 调用服务层获取寝室设置
      const result = await this.dormService.getDormSettings(id);
      
      if (!result.success) {
        logger.error('[DormController] 获取寝室设置失败', { 
          reason: result.message, 
          dormId: id
        });
        return errorResponse(res, result.message, 400);
      }

      const settings = result.data;

      logger.audit(req, '获取寝室设置成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return successResponse(res, settings, '寝室设置获取成功');

    } catch (error) {
      logger.error('[DormController] 获取寝室设置异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新寝室设置
   * PUT /api/dorms/:id/settings/update
   */
  async updateDormSettings(req, res) {
    try {
      // 记录更新寝室设置尝试
      logger.audit(req, '更新寝室设置', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id,
        requestData: req.body
      });

      // 获取宿舍ID和请求体数据
      const { id } = req.params;
      const settings = req.body;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层更新寝室设置
      const result = await this.dormService.updateDormSettings(id, settings, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 更新寝室设置失败', { 
          reason: result.message, 
          dormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const updatedSettings = result.data;

      logger.audit(req, '更新寝室设置成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return successResponse(res, updatedSettings, '寝室设置更新成功');

    } catch (error) {
      logger.error('[DormController] 更新寝室设置异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取寝室变更历史
   * GET /api/dorms/:id/history
   */
  async getDormHistory(req, res) {
    try {
      // 记录获取寝室变更历史尝试
      logger.audit(req, '获取寝室变更历史', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id,
        query: req.query
      });

      // 获取宿舍ID和查询参数
      const { id } = req.params;
      const { page, limit } = req.query;

      // 调用服务层获取寝室变更历史
      const result = await this.dormService.getDormHistory(id, { page, limit });
      
      if (!result.success) {
        logger.error('[DormController] 获取寝室变更历史失败', { 
          reason: result.message, 
          dormId: id
        });
        return errorResponse(res, result.message, 400);
      }

      const { history, pagination } = result.data;

      logger.audit(req, '获取寝室变更历史成功', { 
        timestamp: new Date().toISOString(),
        dormId: id,
        total: pagination.total
      });

      // 返回成功响应
      return successResponse(res, { history, pagination }, '寝室变更历史获取成功');

    } catch (error) {
      logger.error('[DormController] 获取寝室变更历史异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 开始解散流程
   * POST /api/dorms/:id/dismiss/start
   */
  async startDismissProcess(req, res) {
    try {
      // 记录开始解散流程尝试
      logger.audit(req, '开始解散流程', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层开始解散流程
      const result = await this.dormService.startDismissProcess(id, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 开始解散流程失败', { 
          reason: result.message, 
          dormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { dorm, dismissal } = result.data;

      logger.audit(req, '开始解散流程成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return successResponse(res, { dorm, dismissal }, '解散流程开始成功');

    } catch (error) {
      logger.error('[DormController] 开始解散流程异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 确认解散
   * POST /api/dorms/:id/dismiss/confirm
   */
  async confirmDismiss(req, res) {
    try {
      // 记录确认解散尝试
      logger.audit(req, '确认解散', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层确认解散
      const result = await this.dormService.confirmDismiss(id, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 确认解散失败', { 
          reason: result.message, 
          dormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { dorm, dismissal } = result.data;

      logger.audit(req, '确认解散成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return successResponse(res, { dorm, dismissal }, '确认解散成功');

    } catch (error) {
      logger.error('[DormController] 确认解散异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 取消解散
   * POST /api/dorms/:id/dismiss/cancel
   */
  async cancelDismiss(req, res) {
    try {
      // 记录取消解散尝试
      logger.audit(req, '取消解散', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 获取当前用户信息
      const currentUser = req.user;
      
      // 调用服务层取消解散
      const result = await this.dormService.cancelDismiss(id, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 取消解散失败', { 
          reason: result.message, 
          dormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { dorm, dismissal } = result.data;

      logger.audit(req, '取消解散成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return successResponse(res, { dorm, dismissal }, '取消解散成功');

    } catch (error) {
      logger.error('[DormController] 取消解散异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取待结算费用
   * GET /api/dorms/:id/pending-fees
   */
  async getPendingFees(req, res) {
    try {
      // 记录获取待结算费用尝试
      logger.audit(req, '获取待结算费用', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 调用服务层获取待结算费用
      const result = await this.dormService.getPendingFees(id);
      
      if (!result.success) {
        logger.error('[DormController] 获取待结算费用失败', { 
          reason: result.message, 
          dormId: id
        });
        return errorResponse(res, result.message, 400);
      }

      const { pendingFees } = result.data;

      logger.audit(req, '获取待结算费用成功', { 
        timestamp: new Date().toISOString(),
        dormId: id,
        count: pendingFees.length
      });

      // 返回成功响应
      return successResponse(res, { pendingFees }, '待结算费用获取成功');

    } catch (error) {
      logger.error('[DormController] 获取待结算费用异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取寝室成员列表
   * GET /api/dorms/:id/members
   */
  async getDormMembers(req, res) {
    try {
      // 记录获取寝室成员列表尝试
      logger.audit(req, '获取寝室成员列表', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      // 获取宿舍ID
      const { id } = req.params;

      // 调用服务层获取寝室成员列表
      const result = await this.dormService.getDormMembers(id);
      
      if (!result.success) {
        logger.error('[DormController] 获取寝室成员列表失败', { 
          reason: result.message, 
          dormId: id
        });
        return errorResponse(res, result.message, 400);
      }

      const { members } = result.data;

      // 转换为前端需要的格式 (key, label)
      const formattedMembers = members.map(member => {
        let label = member.nickname || member.username || '未知成员';
        
        // 如果有角色信息，添加到标签中
        if (member.memberRole && member.memberRole !== 'member') {
          const roleNames = {
            'admin': '寝室长',
            'deputy': '副寝室长'
          };
          const roleName = roleNames[member.memberRole] || member.memberRole;
          label += ` (${roleName})`;
        }
        
        return {
          key: member.userId,
          label: label,
          nickname: member.nickname,
          username: member.username,
          phone: member.phone,
          avatarUrl: member.avatarUrl,
          memberRole: member.memberRole,
          moveInDate: member.moveInDate
        };
      });

      logger.audit(req, '获取寝室成员列表成功', { 
        timestamp: new Date().toISOString(),
        dormId: id,
        count: formattedMembers.length
      });

      // 返回成功响应，格式化为前端需要的格式
      return successResponse(res, { 
        members: formattedMembers,
        rawMembers: members
      }, '寝室成员列表获取成功');

    } catch (error) {
      logger.error('[DormController] 获取寝室成员列表异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取待审核成员列表
   * GET /api/dorms/members/pending
   */
  async getPendingMembers(req, res) {
    try {
      // 记录获取待审核成员列表尝试
      logger.audit(req, '获取待审核成员列表', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        query: req.query
      });

      // 获取查询参数
      const { room } = req.query;

      // 调用服务层获取待审核成员列表
      const result = await this.dormService.getPendingMembers(room);
      
      if (!result.success) {
        logger.error('[DormController] 获取待审核成员列表失败', { 
          reason: result.message
        });
        return errorResponse(res, result.message, 400);
      }

      const { members } = result.data;

      logger.audit(req, '获取待审核成员列表成功', { 
        timestamp: new Date().toISOString(),
        count: members.length
      });

      // 返回成功响应
      return successResponse(res, { members }, '待审核成员列表获取成功');

    } catch (error) {
      logger.error('[DormController] 获取待审核成员列表异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户所在的寝室信息
   * GET /api/dorms/users/:userId
   */
  async getCurrentUserDorm(req, res) {
    try {
      // 记录获取用户所在寝室信息尝试
      logger.audit(req, '获取用户所在寝室信息', {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userId: req.params.userId
      });

      // 获取用户ID
      const { userId } = req.params;

      // 调用服务层获取用户所在的寝室信息
      const result = await this.dormService.getCurrentUserDorm(userId);
      
      if (!result.success) {
        logger.error('[DormController] 获取用户所在的寝室信息失败', {
          reason: result.message,
          userId: userId
        });
        return errorResponse(res, result.message, 404);
      }

      const { dorm } = result.data;

      logger.audit(req, '获取用户所在的寝室信息成功', {
        timestamp: new Date().toISOString(),
        userId: userId,
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return successResponse(res, {
        dorm: dorm
      }, '用户所在的寝室信息获取成功');

    } catch (error) {
      logger.error('[DormController] 获取用户所在的寝室信息异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取楼栋列表
   * GET /api/dorms/buildings
   */
  async getBuildings(req, res) {
    try {
      logger.audit(req, '获取楼栋列表', {
        timestamp: new Date().toISOString()
      });

      const result = await this.dormService.getBuildings();
      
      if (!result.success) {
        return errorResponse(res, result.message, 500);
      }

      return successResponse(res, result.data, result.message);
    } catch (error) {
      logger.error('[DormController] 获取楼栋列表异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取宿舍统计信息
   * GET /api/dorms/stats
   */
  async getDormStats(req, res) {
    try {
      logger.audit(req, '获取宿舍统计信息', {
        timestamp: new Date().toISOString()
      });

      const result = await this.dormService.getDormStats();
      
      if (!result.success) {
        return errorResponse(res, result.message, 500);
      }

      return successResponse(res, result.data, result.message);
    } catch (error) {
      logger.error('[DormController] 获取宿舍统计信息异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 批量删除宿舍
   * POST /api/dorms/batch-delete
   */
  async batchDeleteDorms(req, res) {
    try {
      const { ids } = req.body;
      const currentUser = req.user;

      // 关键位置打印日志 (规则 7)
      logger.info('[DormController] 收到批量删除请求', {
        idsCount: ids?.length,
        userId: currentUser?.id,
        userRole: currentUser?.role
      });

      logger.audit(req, '批量删除宿舍', {
        timestamp: new Date().toISOString(),
        ids
      });

      const result = await this.dormService.batchDeleteDorms(ids, currentUser);
      
      if (!result.success) {
        logger.warn('[DormController] 批量删除失败', { 
          message: result.message,
          userId: currentUser?.id 
        });
        return errorResponse(res, result.message, 400);
      }

      logger.info('[DormController] 批量删除成功', { 
        idsCount: ids?.length,
        userId: currentUser?.id 
      });
      return successResponse(res, result.data, result.message);
    } catch (error) {
      logger.error('[DormController] 批量删除宿舍异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 批量更新宿舍状态
   * POST /api/dorms/batch-update-status
   */
  async batchUpdateDormStatus(req, res) {
    try {
      const { ids, status } = req.body;
      const currentUser = req.user;

      // 关键位置打印日志 (规则 7)
      logger.info('[DormController] 收到批量更新状态请求', {
        idsCount: ids?.length,
        newStatus: status,
        userId: currentUser?.id,
        userRole: currentUser?.role
      });

      logger.audit(req, '批量更新宿舍状态', {
        timestamp: new Date().toISOString(),
        ids,
        status
      });

      const result = await this.dormService.batchUpdateDormStatus(ids, status, currentUser);
      
      if (!result.success) {
        logger.warn('[DormController] 批量更新状态失败', { 
          message: result.message,
          userId: currentUser?.id 
        });
        return errorResponse(res, result.message, 400);
      }

      logger.info('[DormController] 批量更新状态成功', { 
        idsCount: ids?.length,
        userId: currentUser?.id 
      });
      return successResponse(res, result.data, result.message);
    } catch (error) {
      logger.error('[DormController] 批量更新宿舍状态异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 更新单个宿舍状态
   * @param {Request} req 
   * @param {Response} res 
   */
  async updateDormStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const currentUser = req.user;

      if (!status) {
        return errorResponse(res, '状态不能为空', 400);
      }

      // 借用批量更新的逻辑，传入单个 ID
      const result = await this.dormService.batchUpdateDormStatus([id], status, currentUser);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.data, '状态更新成功');
    } catch (error) {
      logger.error('[DormController] 更新宿舍状态异常', { error: error.message, id: req.params.id });
      throw error;
    }
  }

  /**
   * 添加宿舍成员
   * POST /api/dorms/:id/members
   */
  async addDormMember(req, res) {
    try {
      logger.audit(req, '添加宿舍成员', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id,
        requestData: req.body
      });

      const { id: dormId } = req.params;
      const memberData = req.body;
      const currentUser = req.user;

      logger.info('[DormController] 添加宿舍成员参数', {
        dormId,
        dormIdType: typeof dormId,
        memberData,
        memberDataKeys: memberData ? Object.keys(memberData) : [],
        userId: memberData?.userId,
        userIdType: typeof memberData?.userId,
        userIdValue: memberData?.userId,
        currentUserId: currentUser?.id
      });

      const result = await this.dormService.addDormMember(dormId, memberData, currentUser);

      if (!result.success) {
        logger.error('[DormController] 添加宿舍成员失败', { 
          reason: result.message,
          dormId: dormId,
          userId: memberData.userId
        });
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return errorResponse(res, result.message, statusCode);
      }

      const { userDorm } = result.data;

      logger.audit(req, '宿舍成员添加成功', { 
        timestamp: new Date().toISOString(),
        userDormId: userDorm.id,
        userId: userDorm.userId,
        dormId: dormId
      });

      return successResponse(res, { userDorm }, '成员添加成功');

    } catch (error) {
      logger.error('[DormController] 添加宿舍成员异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取可添加用户列表
   * GET /api/dorms/:id/available-users
   */
  async getAvailableUsers(req, res) {
    try {
      logger.audit(req, '获取可添加用户列表', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id,
        query: req.query
      });

      const { id: dormId } = req.params;
      const { search, limit, offset } = req.query;
      const currentUser = req.user;

      const result = await this.dormService.getAvailableUsers(
        dormId,
        { 
          search, 
          limit: limit ? parseInt(limit) : 50, 
          offset: offset ? parseInt(offset) : 0 
        },
        currentUser
      );

      if (!result.success) {
        logger.error('[DormController] 获取可添加用户列表失败', { 
          reason: result.message,
          dormId: dormId
        });
        return errorResponse(res, result.message, 400);
      }

      const { users } = result.data;

      logger.audit(req, '获取可添加用户列表成功', { 
        timestamp: new Date().toISOString(),
        dormId: dormId,
        count: users.length
      });

      return successResponse(res, { users }, '可添加用户列表获取成功');

    } catch (error) {
      logger.error('[DormController] 获取可添加用户列表异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取宿舍费用统计摘要
   * GET /api/dorms/:id/fee-summary
   */
  async getDormFeeSummary(req, res) {
    try {
      logger.audit(req, '获取宿舍费用统计摘要', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id
      });

      const { id: dormId } = req.params;

      const result = await this.dormService.getDormFeeSummary(dormId);

      if (!result.success) {
        logger.error('[DormController] 获取宿舍费用统计摘要失败', { 
          reason: result.message,
          dormId: dormId
        });
        return errorResponse(res, result.message, 400);
      }

      const { feeSummary } = result.data;

      logger.audit(req, '获取宿舍费用统计摘要成功', { 
        timestamp: new Date().toISOString(),
        dormId: dormId,
        monthlyTotal: feeSummary.monthlyTotal,
        totalExpenses: feeSummary.totalExpenses
      });

      return successResponse(res, { feeSummary }, '宿舍费用统计获取成功');

    } catch (error) {
      logger.error('[DormController] 获取宿舍费用统计摘要异常', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取宿舍维修记录
   * GET /api/dorms/:id/maintenance
   */
  async getDormMaintenanceRecords(req, res) {
    try {
      logger.audit(req, '获取宿舍维修记录', { 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        dormId: req.params.id,
        query: req.query
      });

      const { id: dormId } = req.params;
      const { page, limit, status } = req.query;
      const currentUser = req.user;

      const result = await this.dormService.getDormMaintenanceRecords(
        dormId,
        { page, limit, status },
        currentUser
      );

      if (!result.success) {
        logger.error('[DormController] 获取宿舍维修记录失败', { 
          reason: result.message,
          dormId: dormId
        });
        return errorResponse(res, result.message, 400);
      }

      const { records, pagination } = result.data;

      logger.audit(req, '获取宿舍维修记录成功', { 
        timestamp: new Date().toISOString(),
        dormId: dormId,
        total: pagination.total
      });

      return successResponse(res, { records, pagination }, '宿舍维修记录获取成功');

    } catch (error) {
      logger.error('[DormController] 获取宿舍维修记录异常', { error: error.message });
      throw error;
    }
  }
}

module.exports = DormController;