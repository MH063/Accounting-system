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
   * 获取费用类别列表（用于费用创建页面）
   * GET /api/categories/expense
   */
  async getExpenseCategories(req, res, next) {
    try {
      logger.info('[CategoryController] 获取费用类别列表', { 
        query: req.query 
      });

      // 调用服务层获取活跃分类列表
      const result = await this.categoryService.getActiveCategories({
        limit: 100, // 获取所有活跃类别
        sort: 'sort_order',
        order: 'ASC'
      });
      
      // 转换为前端需要的格式
      const expenseCategories = result.data.map(category => ({
        value: category.categoryCode,
        label: category.categoryName,
        color: category.colorCode || '#409EFF',
        icon: category.iconName || 'category',
        description: category.description || ''
      }));
      
      return successResponse(res, {
        categories: expenseCategories
      }, '费用类别列表获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取费用类别列表失败', { error: error.message });
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

      const statistics = await this.categoryService.getCategoryUsageStatistics();
      
      return successResponse(res, statistics, '分类使用统计获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取分类使用统计失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取费用类型列表
   * GET /api/fee-types
   */
  async getFeeTypes(req, res, next) {
    try {
      logger.info('[CategoryController] 获取费用类型列表', { 
        query: req.query 
      });

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.pageSize) || 10,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC',
        search: req.query.search,
        status: req.query.status,
        billingCycle: req.query.billingCycle,
        allocationRule: req.query.allocationRule
      };

      const result = await this.categoryService.getFeeTypes(options);
      
      return successResponse(res, {
        list: result.data.map(item => item.toApiResponse ? item.toApiResponse() : item),
        pagination: result.pagination
      }, '费用类型列表获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取费用类型列表失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取费用类型详情
   * GET /api/fee-types/:id
   */
  async getFeeTypeDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[CategoryController] 获取费用类型详情', { id });

      const feeType = await this.categoryService.getFeeTypeDetail(id);
      
      if (!feeType) {
        return errorResponse(res, '费用类型不存在', 404);
      }

      return successResponse(res, { feeType }, '费用类型详情获取成功');
    } catch (error) {
      logger.error('[CategoryController] 获取费用类型详情失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 创建费用类型
   * POST /api/fee-types
   */
  async createFeeType(req, res, next) {
    try {
      logger.info('[CategoryController] 创建费用类型', { 
        data: JSON.stringify(req.body)
      });

      // 详细打印每个字段
      logger.info('[CategoryController] 请求体字段', {
        name: req.body?.name,
        code: req.body?.code,
        category_name: req.body?.category_name,
        category_code: req.body?.category_code,
        description: req.body?.description,
        default_amount: req.body?.default_amount,
        billing_cycle: req.body?.billing_cycle,
        allocation_rule: req.body?.allocation_rule,
        sort_order: req.body?.sort_order,
        status: req.body?.status
      });

      const result = await this.categoryService.createFeeType(req.body);
      
      return successResponse(res, { feeType: result }, '费用类型创建成功', 201);
    } catch (error) {
      logger.error('[CategoryController] 创建费用类型失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 更新费用类型
   * PUT /api/fee-types/:id
   */
  async updateFeeType(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[CategoryController] 更新费用类型', { 
        id,
        data: this.filterSensitiveData(req.body) 
      });

      const result = await this.categoryService.updateFeeType(id, req.body);
      
      if (!result) {
        return errorResponse(res, '费用类型不存在', 404);
      }

      return successResponse(res, { feeType: result }, '费用类型更新成功');
    } catch (error) {
      logger.error('[CategoryController] 更新费用类型失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 删除费用类型
   * DELETE /api/fee-types/:id
   */
  async deleteFeeType(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[CategoryController] 删除费用类型', { id });

      const result = await this.categoryService.deleteFeeType(id);
      
      if (!result) {
        return errorResponse(res, '费用类型不存在', 404);
      }

      return successResponse(res, null, '费用类型删除成功');
    } catch (error) {
      logger.error('[CategoryController] 删除费用类型失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 更新费用类型状态
   * PUT /api/fee-types/:id/status
   */
  async updateFeeTypeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      logger.info('[CategoryController] 更新费用类型状态', { id, status });

      if (!status || !['enabled', 'disabled'].includes(status)) {
        return errorResponse(res, '状态值不合法，只能是 enabled 或 disabled', 400);
      }

      const result = await this.categoryService.updateFeeTypeStatus(id, status);
      
      if (!result) {
        return errorResponse(res, '费用类型不存在', 404);
      }

      return successResponse(res, { feeType: result }, '费用类型状态更新成功');
    } catch (error) {
      logger.error('[CategoryController] 更新费用类型状态失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = CategoryController;