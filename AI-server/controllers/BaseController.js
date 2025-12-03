/**
 * 基础控制器类
 * 提供通用的CRUD操作和响应处理
 */

const logger = require('../config/logger');

class BaseController {
  constructor(service) {
    this.service = service;
    this.entityName = this.constructor.name.replace('Controller', '');
  }

  /**
   * 获取所有记录
   * GET /api/{resource}
   */
  async getAll(req, res, next) {
    try {
      logger.info(`[${this.entityName}] 获取所有记录`, { 
        userId: req.user?.id,
        query: req.query 
      });

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC',
        search: req.query.search,
        filters: req.query.filters ? JSON.parse(req.query.filters) : {}
      };

      const result = await this.service.getAll(options);
      
      return res.json({
        success: true,
        message: '数据获取成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 获取所有记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 根据ID获取单条记录
   * GET /api/{resource}/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`[${this.entityName}] 根据ID获取记录`, { 
        userId: req.user?.id,
        id 
      });

      const result = await this.service.getById(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '记录不存在'
        });
      }

      return res.json({
        success: true,
        message: '数据获取成功',
        data: result
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 根据ID获取记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 创建新记录
   * POST /api/{resource}
   */
  async create(req, res, next) {
    try {
      logger.info(`[${this.entityName}] 创建新记录`, { 
        userId: req.user?.id,
        data: this.filterSensitiveData(req.body)
      });

      const result = await this.service.create(req.body);
      
      return res.status(201).json({
        success: true,
        message: '创建成功',
        data: result
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 创建记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 更新记录
   * PUT /api/{resource}/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`[${this.entityName}] 更新记录`, { 
        userId: req.user?.id,
        id,
        data: this.filterSensitiveData(req.body)
      });

      const result = await this.service.update(id, req.body);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '记录不存在'
        });
      }

      return res.json({
        success: true,
        message: '更新成功',
        data: result
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 更新记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 删除记录
   * DELETE /api/{resource}/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`[${this.entityName}] 删除记录`, { 
        userId: req.user?.id,
        id 
      });

      const result = await this.service.delete(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '记录不存在'
        });
      }

      return res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 删除记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 过滤敏感数据
   * @param {Object} data - 要过滤的数据
   * @returns {Object} - 过滤后的数据
   */
  filterSensitiveData(data) {
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
    const filtered = { ...data };
    
    sensitiveFields.forEach(field => {
      if (filtered[field]) {
        filtered[field] = '[REDACTED]';
      }
    });

    return filtered;
  }

  /**
   * 验证请求数据
   * @param {Object} data - 要验证的数据
   * @param {Array} requiredFields - 必需字段
   * @throws {Error} - 如果验证失败
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
    }
  }

  /**
   * 发送成功响应
   */
  sendSuccess(res, data, message = '操作成功') {
    return res.json({
      success: true,
      message,
      data
    });
  }

  /**
   * 发送错误响应
   */
  sendError(res, message, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  /**
   * 批量创建记录
   * POST /api/{resource}/batch
   */
  async batchCreate(req, res, next) {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return this.sendError(res, '请提供有效的数据数组', 400);
      }

      logger.info(`[${this.entityName}] 批量创建记录`, { 
        userId: req.user?.id,
        count: items.length 
      });

      const results = await this.service.batchCreate(items);
      
      return res.status(201).json({
        success: true,
        message: '批量创建成功',
        data: results
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 批量创建记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 批量更新记录
   * PUT /api/{resource}/batch
   */
  async batchUpdate(req, res, next) {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return this.sendError(res, '请提供有效的数据数组', 400);
      }

      logger.info(`[${this.entityName}] 批量更新记录`, { 
        userId: req.user?.id,
        count: items.length 
      });

      const results = await this.service.batchUpdate(items);
      
      return res.json({
        success: true,
        message: '批量更新成功',
        data: results
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 批量更新记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 批量删除记录
   * DELETE /api/{resource}/batch
   */
  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return this.sendError(res, '请提供有效的ID数组', 400);
      }

      logger.info(`[${this.entityName}] 批量删除记录`, { 
        userId: req.user?.id,
        count: ids.length 
      });

      const result = await this.service.batchDelete(ids);
      
      return res.json({
        success: true,
        message: '批量删除成功',
        data: result
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 批量删除记录失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 分页查询记录（高级）
   * GET /api/{resource}/paginate
   */
  async paginate(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC',
        search: req.query.search,
        filters: req.query.filters ? JSON.parse(req.query.filters) : {},
        include: req.query.include ? req.query.include.split(',') : []
      };

      logger.info(`[${this.entityName}] 分页查询记录`, { 
        userId: req.user?.id,
        options 
      });

      const result = await this.service.paginate(options);
      
      return res.json({
        success: true,
        message: '查询成功',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 分页查询失败`, { error: error.message });
      next(error);
    }
  }

  /**
   * 搜索记录
   * GET /api/{resource}/search
   */
  async search(req, res, next) {
    try {
      const { q, fields } = req.query;
      
      if (!q) {
        return this.sendError(res, '请提供搜索关键词', 400);
      }

      logger.info(`[${this.entityName}] 搜索记录`, { 
        userId: req.user?.id,
        query: q,
        fields 
      });

      const searchFields = fields ? fields.split(',') : [];
      const results = await this.service.search(q, searchFields);
      
      return res.json({
        success: true,
        message: '搜索成功',
        data: results
      });
    } catch (error) {
      logger.error(`[${this.entityName}] 搜索失败`, { error: error.message });
      next(error);
    }
  }
}

module.exports = BaseController;