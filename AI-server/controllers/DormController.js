const BaseController = require('./BaseController');
const DormService = require('../services/DormService');
const logger = require('../config/logger');

class DormController extends BaseController {
  constructor() {
    super();
    this.dormService = new DormService();
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
        return this.sendError(res, result.message, 500);
      }

      const { dorms, pagination: paginationInfo } = result.data;

      logger.audit(req, '宿舍列表获取成功', { 
        timestamp: new Date().toISOString(),
        totalCount: paginationInfo.total
      });

      // 返回成功响应
      return this.sendSuccess(res, {
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
        return this.sendError(res, result.message, 400);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍创建成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return this.sendSuccess(res, {
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
        return this.sendError(res, result.message, 404);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍详情获取成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return this.sendSuccess(res, {
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
        return this.sendError(res, result.message, statusCode);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍信息更新成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return this.sendSuccess(res, {
        dorm: dorm
      }, '宿舍信息更新成功');

    } catch (error) {
      logger.error('[DormController] 更新宿舍信息异常', { error: error.message });
      throw error;
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
        return this.sendError(res, result.message, statusCode);
      }

      const { dorm } = result.data;

      logger.audit(req, '宿舍删除成功', { 
        timestamp: new Date().toISOString(),
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return this.sendSuccess(res, {
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
        return this.sendError(res, result.message, statusCode);
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
      return this.sendSuccess(res, {
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
        return this.sendError(res, result.message, statusCode);
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
      return this.sendSuccess(res, {
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
      
      // 调用服务层删除宿舍成员
      const result = await this.dormService.removeMember(id, deleteData, currentUser);
      
      if (!result.success) {
        logger.error('[DormController] 删除宿舍成员失败', { 
          reason: result.message,
          userDormId: id
        });
        // 根据错误类型返回适当的HTTP状态码
        const statusCode = result.message.includes('权限') ? 403 : 400;
        return this.sendError(res, result.message, statusCode);
      }

      const { userDorm } = result.data;

      logger.audit(req, '宿舍成员删除成功', { 
        timestamp: new Date().toISOString(),
        userDormId: userDorm.id,
        userId: userDorm.userId,
        dormId: userDorm.dormId
      });

      // 返回成功响应
      return this.sendSuccess(res, {
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
        return this.sendError(res, result.message, 400);
      }

      const settings = result.data;

      logger.audit(req, '获取寝室设置成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return this.sendSuccess(res, settings, '寝室设置获取成功');

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
        return this.sendError(res, result.message, statusCode);
      }

      const updatedSettings = result.data;

      logger.audit(req, '更新寝室设置成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return this.sendSuccess(res, updatedSettings, '寝室设置更新成功');

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
        return this.sendError(res, result.message, 400);
      }

      const { history, pagination } = result.data;

      logger.audit(req, '获取寝室变更历史成功', { 
        timestamp: new Date().toISOString(),
        dormId: id,
        total: pagination.total
      });

      // 返回成功响应
      return this.sendSuccess(res, { history, pagination }, '寝室变更历史获取成功');

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
        return this.sendError(res, result.message, statusCode);
      }

      const { dorm, dismissal } = result.data;

      logger.audit(req, '开始解散流程成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return this.sendSuccess(res, { dorm, dismissal }, '解散流程开始成功');

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
        return this.sendError(res, result.message, statusCode);
      }

      const { dorm, dismissal } = result.data;

      logger.audit(req, '确认解散成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return this.sendSuccess(res, { dorm, dismissal }, '确认解散成功');

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
        return this.sendError(res, result.message, statusCode);
      }

      const { dorm, dismissal } = result.data;

      logger.audit(req, '取消解散成功', { 
        timestamp: new Date().toISOString(),
        dormId: id
      });

      // 返回成功响应
      return this.sendSuccess(res, { dorm, dismissal }, '取消解散成功');

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
        return this.sendError(res, result.message, 400);
      }

      const { pendingFees } = result.data;

      logger.audit(req, '获取待结算费用成功', { 
        timestamp: new Date().toISOString(),
        dormId: id,
        count: pendingFees.length
      });

      // 返回成功响应
      return this.sendSuccess(res, { pendingFees }, '待结算费用获取成功');

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
        return this.sendError(res, result.message, 400);
      }

      const { members } = result.data;

      logger.audit(req, '获取寝室成员列表成功', { 
        timestamp: new Date().toISOString(),
        dormId: id,
        count: members.length
      });

      // 返回成功响应
      return this.sendSuccess(res, { members }, '寝室成员列表获取成功');

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
        return this.sendError(res, result.message, 400);
      }

      const { members } = result.data;

      logger.audit(req, '获取待审核成员列表成功', { 
        timestamp: new Date().toISOString(),
        count: members.length
      });

      // 返回成功响应
      return this.sendSuccess(res, { members }, '待审核成员列表获取成功');

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
        return this.sendError(res, result.message, 404);
      }

      const { dorm } = result.data;

      logger.audit(req, '获取用户所在的寝室信息成功', {
        timestamp: new Date().toISOString(),
        userId: userId,
        dormId: dorm.id,
        dormName: dorm.dormName
      });

      // 返回成功响应
      return this.sendSuccess(res, {
        dorm: dorm
      }, '用户所在的寝室信息获取成功');

    } catch (error) {
      logger.error('[DormController] 获取用户所在的寝室信息异常', { error: error.message });
      throw error;
    }
  }
}

module.exports = DormController;