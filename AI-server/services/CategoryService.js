/**
 * 分类服务层
 * 处理分类相关的业务逻辑
 */

const BaseService = require('./BaseService');
const CategoryRepository = require('../repositories/CategoryRepository');
const CategoryModel = require('../models/CategoryModel');
const logger = require('../config/logger');

class CategoryService extends BaseService {
  constructor() {
    const categoryRepository = new CategoryRepository();
    super(categoryRepository);
    this.categoryRepository = categoryRepository;
  }

  /**
   * 获取所有分类
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 分类列表和分页信息
   */
  async getCategories(options = {}) {
    try {
      logger.info('[CategoryService] 获取分类列表', { options });

      // 调用仓库层获取分类列表
      const result = await this.categoryRepository.findAll(options);

      logger.info('[CategoryService] 获取分类列表成功', { 
        count: result.data.length,
        total: result.pagination.total 
      });

      return result;
    } catch (error) {
      logger.error('[CategoryService] 获取分类列表失败', { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 获取活跃的分类列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 活跃分类列表和分页信息
   */
  async getActiveCategories(options = {}) {
    try {
      logger.info('[CategoryService] 获取活跃分类列表', { options });

      // 调用仓库层获取活跃分类列表
      const result = await this.categoryRepository.findActive(options);

      logger.info('[CategoryService] 获取活跃分类列表成功', { 
        count: result.data.length,
        total: result.pagination.total 
      });

      return result;
    } catch (error) {
      logger.error('[CategoryService] 获取活跃分类列表失败', { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 获取分类详情
   * @param {number|string} id - 分类ID
   * @returns {Promise<Object|null>} 分类详情
   */
  async getCategoryDetail(id) {
    try {
      logger.info('[CategoryService] 获取分类详情', { id });

      // 调用父类的getById方法获取分类详情
      const category = await this.getById(id);

      if (!category) {
        logger.warn('[CategoryService] 分类不存在', { id });
        return null;
      }

      logger.info('[CategoryService] 获取分类详情成功', { id });

      return category;
    } catch (error) {
      logger.error('[CategoryService] 获取分类详情失败', { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 创建分类
   * @param {Object} categoryData - 分类数据
   * @returns {Promise<Object>} 创建结果
   */
  async createCategory(categoryData) {
    try {
      logger.info('[CategoryService] 创建分类', { 
        categoryData: this.sanitizeLogData(categoryData) 
      });

      // 创建分类模型
      const category = CategoryModel.create(categoryData);

      // 验证数据
      const validation = category.validate();
      if (!validation.isValid) {
        logger.error('[CategoryService] 分类数据验证失败', { 
          errors: validation.errors 
        });
        throw new Error(`分类数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 检查分类代码是否已存在
      if (category.categoryCode) {
        const existingCategory = await this.categoryRepository.findByCode(category.categoryCode);
        if (existingCategory) {
          logger.error('[CategoryService] 分类代码已存在', { 
            code: category.categoryCode 
          });
          throw new Error('分类代码已存在');
        }
      }

      // 检查分类名称是否已存在
      const existingCategoryByName = await this.categoryRepository.findByName(category.categoryName);
      if (existingCategoryByName) {
        logger.error('[CategoryService] 分类名称已存在', { 
          name: category.categoryName 
        });
        throw new Error('分类名称已存在');
      }

      // 转换为数据库格式
      const dbData = category.toDatabaseFormat();

      // 调用仓库层创建分类
      const createdCategory = await this.categoryRepository.create(dbData);

      logger.info('[CategoryService] 创建分类成功', { 
        id: createdCategory.id,
        name: createdCategory.categoryName 
      });

      return createdCategory;
    } catch (error) {
      logger.error('[CategoryService] 创建分类失败', { 
        error: error.message,
        categoryData: this.sanitizeLogData(categoryData) 
      });
      throw error;
    }
  }

  /**
   * 更新分类
   * @param {number|string} id - 分类ID
   * @param {Object} categoryData - 更新数据
   * @returns {Promise<Object|null>} 更新结果
   */
  async updateCategory(id, categoryData) {
    try {
      logger.info('[CategoryService] 更新分类', { 
        id,
        categoryData: this.sanitizeLogData(categoryData) 
      });

      // 获取现有分类
      const existingCategory = await this.getById(id);
      if (!existingCategory) {
        logger.warn('[CategoryService] 分类不存在', { id });
        return null;
      }

      // 更新分类模型
      existingCategory.update(categoryData);

      // 验证数据
      const validation = existingCategory.validate();
      if (!validation.isValid) {
        logger.error('[CategoryService] 分类数据验证失败', { 
          errors: validation.errors 
        });
        throw new Error(`分类数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 检查分类代码是否已存在（排除当前分类）
      if (existingCategory.categoryCode) {
        const existingCategoryByCode = await this.categoryRepository.findByCode(existingCategory.categoryCode);
        if (existingCategoryByCode && existingCategoryByCode.id !== id) {
          logger.error('[CategoryService] 分类代码已存在', { 
            code: existingCategory.categoryCode 
          });
          throw new Error('分类代码已存在');
        }
      }

      // 检查分类名称是否已存在（排除当前分类）
      const existingCategoryByName = await this.categoryRepository.findByName(existingCategory.categoryName);
      if (existingCategoryByName && existingCategoryByName.id !== id) {
        logger.error('[CategoryService] 分类名称已存在', { 
          name: existingCategory.categoryName 
        });
        throw new Error('分类名称已存在');
      }

      // 转换为数据库格式
      const dbData = existingCategory.toDatabaseFormat();

      // 调用仓库层更新分类
      const updatedCategory = await this.categoryRepository.update(id, dbData);

      logger.info('[CategoryService] 更新分类成功', { 
        id,
        name: updatedCategory.categoryName 
      });

      return updatedCategory;
    } catch (error) {
      logger.error('[CategoryService] 更新分类失败', { 
        error: error.message,
        id,
        categoryData: this.sanitizeLogData(categoryData) 
      });
      throw error;
    }
  }

  /**
   * 删除分类
   * @param {number|string} id - 分类ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteCategory(id) {
    try {
      logger.info('[CategoryService] 删除分类', { id });

      // 检查分类是否被使用
      const usageStats = await this.categoryRepository.getUsageStatistics();
      const categoryUsage = usageStats.find(stat => stat.id === parseInt(id));
      
      if (categoryUsage && categoryUsage.usage_count > 0) {
        logger.error('[CategoryService] 分类已被使用，无法删除', { 
          id,
          usageCount: categoryUsage.usage_count 
        });
        throw new Error(`分类已被使用 ${categoryUsage.usage_count} 次，无法删除`);
      }

      // 调用父类的delete方法删除分类
      const success = await this.delete(id);

      if (success) {
        logger.info('[CategoryService] 删除分类成功', { id });
      } else {
        logger.warn('[CategoryService] 删除分类失败: 分类不存在', { id });
      }

      return success;
    } catch (error) {
      logger.error('[CategoryService] 删除分类失败', { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 获取分类使用统计
   * @returns {Promise<Array>} 分类使用统计
   */
  async getCategoryUsageStatistics() {
    try {
      logger.info('[CategoryService] 获取分类使用统计');

      // 调用仓库层获取分类使用统计
      const stats = await this.categoryRepository.getUsageStatistics();

      logger.info('[CategoryService] 获取分类使用统计成功', { 
        count: stats.length 
      });

      return stats;
    } catch (error) {
      logger.error('[CategoryService] 获取分类使用统计失败', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 验证分类数据
   * @param {Object} data - 待验证的数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateData(data) {
    try {
      const category = new CategoryModel(data);
      return category.validate();
    } catch (error) {
      logger.error('[CategoryService] 验证分类数据失败', { 
        error: error.message,
        data: this.sanitizeLogData(data) 
      });
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * 验证更新数据
   * @param {Object} data - 待验证的数据
   * @param {Object} existing - 现有记录
   * @returns {Promise<Object>} 验证结果
   */
  async validateUpdateData(data, existing) {
    try {
      // 创建一个临时对象，合并现有记录和更新数据
      const updatedData = {
        ...existing.toApiResponse(),
        ...data
      };

      const category = new CategoryModel(updatedData);
      return category.validate();
    } catch (error) {
      logger.error('[CategoryService] 验证分类更新数据失败', { 
        error: error.message,
        data: this.sanitizeLogData(data) 
      });
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }
}

module.exports = CategoryService;