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
}

module.exports = DormController;