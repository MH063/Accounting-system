/**
 * 分类控制器
 * 处理分类相关的HTTP请求
 */

const BaseController = require('./BaseController');
const CategoryService = require('../services/CategoryService');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../middleware/response');

class CategoryController extends BaseController {
  constructor() {
    const categoryService = new CategoryService();
    super(categoryService);
    this.categoryService = categoryService;
  }

  /**
   * 获取分类列表
   * GET /api/categories
   */
  async getCategories(req, res, next) {
    try {
      logger.info('[CategoryController] 获取分类列表', { 
        query: req.query 
      });

      // 构建查询选项
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'sort_order',
        order: req.query.order || 'ASC',
        search: req.query.search,
        filters: req.query.filters ? JSON.parse(req.query.filters) : {}
      };

      // 调用服务层获取分类列表
      const result = await this.categoryService.getCategories(options);
      
      return successResponse(res, {
        categories: result.data,
        pagination: result.pagination
      }, '分类列表获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取分类列表失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取活跃的分类列表
   * GET /api/categories/active
   */
  async getActiveCategories(req, res, next) {
    try {
      logger.info('[CategoryController] 获取活跃分类列表', { 
        query: req.query 
      });

      // 构建查询选项
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'sort_order',
        order: req.query.order || 'ASC',
        search: req.query.search
      };

      // 调用服务层获取活跃分类列表
      const result = await this.categoryService.getActiveCategories(options);
      
      return successResponse(res, {
        categories: result.data,
        pagination: result.pagination
      }, '活跃分类列表获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取活跃分类列表失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取分类详情
   * GET /api/categories/:id
   */
  async getCategoryDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[CategoryController] 获取分类详情', { id });

      // 调用服务层获取分类详情
      const category = await this.categoryService.getCategoryDetail(id);
      
      if (!category) {
        return errorResponse(res, '分类不存在', 404);
      }

      return successResponse(res, { category }, '分类详情获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取分类详情失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 创建分类
   * POST /api/categories
   */
  async createCategory(req, res, next) {
    try {
      logger.info('[CategoryController] 创建分类', { 
        data: this.filterSensitiveData(req.body) 
      });

      // 调用服务层创建分类
      const result = await this.categoryService.createCategory(req.body);
      
      return successResponse(res, { category: result }, '分类创建成功', 201);
    } catch (error) {
      logger.error('[CategoryController] 创建分类失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 更新分类
   * PUT /api/categories/:id
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[CategoryController] 更新分类', { 
        id,
        data: this.filterSensitiveData(req.body) 
      });

      // 调用服务层更新分类
      const result = await this.categoryService.updateCategory(id, req.body);
      
      if (!result) {
        return errorResponse(res, '分类不存在', 404);
      }

      return successResponse(res, { category: result }, '分类更新成功');
    } catch (error) {
      logger.error('[CategoryController] 更新分类失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 删除分类
   * DELETE /api/categories/:id
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[CategoryController] 删除分类', { id });

      // 调用服务层删除分类
      const result = await this.categoryService.deleteCategory(id);
      
      if (!result) {
        return errorResponse(res, '分类不存在', 404);
      }

      return successResponse(res, null, '分类删除成功');
    } catch (error) {
      logger.error('[CategoryController] 删除分类失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取分类使用统计
   * GET /api/categories/statistics
   */
  async getCategoryStatistics(req, res, next) {
    try {
      logger.info('[CategoryController] 获取分类使用统计');

      // 调用服务层获取分类使用统计
      const statistics = await this.categoryService.getCategoryUsageStatistics();
      
      return successResponse(res, statistics, '分类使用统计获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取分类使用统计失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = CategoryController;