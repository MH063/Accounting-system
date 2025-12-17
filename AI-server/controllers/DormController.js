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
}

module.exports = DormController;