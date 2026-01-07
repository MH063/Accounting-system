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
   * 获取费用类型列表（用于管理页面）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 费用类型列表和分页信息
   */
  async getFeeTypes(options = {}) {
    try {
      logger.info('[CategoryService] 获取费用类型列表', { options });

      const result = await this.categoryRepository.findFeeTypes(options);

      logger.info('[CategoryService] 获取费用类型列表成功', { 
        count: result.data.length,
        total: result.pagination.total 
      });

      return result;
    } catch (error) {
      logger.error('[CategoryService] 获取费用类型列表失败', { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 获取费用类型详情
   * @param {number|string} id - 费用类型ID
   * @returns {Promise<Object|null>} 费用类型详情
   */
  async getFeeTypeDetail(id) {
    try {
      logger.info('[CategoryService] 获取费用类型详情', { id });

      const category = await this.getById(id);

      if (!category) {
        logger.warn('[CategoryService] 费用类型不存在', { id });
        return null;
      }

      const usageCount = await this.categoryRepository.getUsageCount(id);
      const detail = category.toApiResponse();
      detail.usageCount = usageCount;

      logger.info('[CategoryService] 获取费用类型详情成功', { id });

      return detail;
    } catch (error) {
      logger.error('[CategoryService] 获取费用类型详情失败', { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 创建费用类型
   * @param {Object} feeTypeData - 费用类型数据
   * @returns {Promise<Object>} 创建结果
   */
  async createFeeType(feeTypeData) {
    try {
      logger.info('[CategoryService] 创建费用类型', { 
        data: this.sanitizeLogData(feeTypeData) 
      });
      
      // 详细打印接收到的字段
      logger.info('[CategoryService] 字段映射详情', {
        name: feeTypeData?.name,
        code: feeTypeData?.code,
        category_name: feeTypeData?.category_name,
        category_code: feeTypeData?.category_code,
        description: feeTypeData?.description,
        default_amount: feeTypeData?.default_amount,
        billing_cycle: feeTypeData?.billing_cycle,
        allocation_rule: feeTypeData?.allocation_rule
      });

      const category = CategoryModel.create(feeTypeData);
      
      logger.info('[CategoryService] CategoryModel创建结果', {
        categoryName: category.categoryName,
        categoryCode: category.categoryCode,
        defaultAmount: category.defaultAmount,
        billingCycle: category.billingCycle
      });

      const validation = category.validate();
      if (!validation.isValid) {
        logger.error('[CategoryService] 费用类型数据验证失败', { 
          errors: validation.errors 
        });
        throw new Error(`费用类型数据验证失败: ${validation.errors.join(', ')}`);
      }

      if (category.categoryCode) {
        const existingCategory = await this.categoryRepository.findByCode(category.categoryCode);
        if (existingCategory) {
          logger.error('[CategoryService] 费用类型代码已存在', { 
            code: category.categoryCode 
          });
          throw new Error('费用类型代码已存在');
        }
      }

      const existingCategoryByName = await this.categoryRepository.findByName(category.categoryName);
      if (existingCategoryByName) {
        logger.error('[CategoryService] 费用类型名称已存在', { 
          name: category.categoryName 
        });
        throw new Error('费用类型名称已存在');
      }

      const dbData = category.toDatabaseFormat();
      const createdCategory = await this.categoryRepository.create(dbData);

      logger.info('[CategoryService] 创建费用类型成功', { 
        id: createdCategory.id,
        name: createdCategory.categoryName 
      });

      return createdCategory.toApiResponse();
    } catch (error) {
      logger.error('[CategoryService] 创建费用类型失败', { 
        error: error.message,
        data: this.sanitizeLogData(feeTypeData) 
      });
      throw error;
    }
  }

  /**
   * 更新费用类型
   * @param {number|string} id - 费用类型ID
   * @param {Object} feeTypeData - 更新数据
   * @returns {Promise<Object|null>} 更新结果
   */
  async updateFeeType(id, feeTypeData) {
    try {
      logger.info('[CategoryService] 更新费用类型', { 
        id,
        data: this.sanitizeLogData(feeTypeData) 
      });

      const existingCategory = await this.getById(id);
      if (!existingCategory) {
        logger.warn('[CategoryService] 费用类型不存在', { id });
        return null;
      }

      existingCategory.update(feeTypeData);

      const validation = existingCategory.validate();
      if (!validation.isValid) {
        logger.error('[CategoryService] 费用类型数据验证失败', { 
          errors: validation.errors 
        });
        throw new Error(`费用类型数据验证失败: ${validation.errors.join(', ')}`);
      }

      if (existingCategory.categoryCode) {
        const existingCategoryByCode = await this.categoryRepository.findByCode(existingCategory.categoryCode);
        if (existingCategoryByCode && existingCategoryByCode.id !== id) {
          logger.error('[CategoryService] 费用类型代码已存在', { 
            code: existingCategory.categoryCode 
          });
          throw new Error('费用类型代码已存在');
        }
      }

      if (existingCategory.categoryName) {
        const existingCategoryByName = await this.categoryRepository.findByName(existingCategory.categoryName);
        if (existingCategoryByName && existingCategoryByName.id !== id) {
          logger.error('[CategoryService] 费用类型名称已存在', { 
            name: existingCategory.categoryName 
          });
          throw new Error('费用类型名称已存在');
        }
      }

      const dbData = existingCategory.toDatabaseFormat();
      const updatedCategory = await this.categoryRepository.update(id, dbData);

      logger.info('[CategoryService] 更新费用类型成功', { 
        id,
        name: updatedCategory.categoryName 
      });

      return updatedCategory.toApiResponse();
    } catch (error) {
      logger.error('[CategoryService] 更新费用类型失败', { 
        error: error.message,
        id,
        data: this.sanitizeLogData(feeTypeData) 
      });
      throw error;
    }
  }

  /**
   * 删除费用类型
   * @param {number|string} id - 费用类型ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteFeeType(id) {
    try {
      logger.info('[CategoryService] 删除费用类型', { id });

      const usageCount = await this.categoryRepository.getUsageCount(id);
      
      if (usageCount > 0) {
        logger.error('[CategoryService] 费用类型已被使用，无法删除', { 
          id,
          usageCount 
        });
        throw new Error(`该费用类型已被 ${usageCount} 条费用记录引用，无法删除`);
      }

      const success = await this.delete(id);

      if (success) {
        logger.info('[CategoryService] 删除费用类型成功', { id });
      } else {
        logger.warn('[CategoryService] 删除费用类型失败: 费用类型不存在', { id });
      }

      return success;
    } catch (error) {
      logger.error('[CategoryService] 删除费用类型失败', { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 更新费用类型状态
   * @param {number|string} id - 费用类型ID
   * @param {string} status - 状态 (enabled/disabled)
   * @returns {Promise<Object|null>} 更新结果
   */
  async updateFeeTypeStatus(id, status) {
    try {
      logger.info('[CategoryService] 更新费用类型状态', { id, status });

      if (!['enabled', 'disabled'].includes(status)) {
        throw new Error('状态值不合法，只能是 enabled 或 disabled');
      }

      const existingCategory = await this.getById(id);
      if (!existingCategory) {
        logger.warn('[CategoryService] 费用类型不存在', { id });
        return null;
      }

      const isActive = status === 'enabled';
      const updatedCategory = await this.categoryRepository.update(id, {
        is_active: isActive,
        updated_at: new Date()
      });

      logger.info('[CategoryService] 更新费用类型状态成功', { 
        id,
        status 
      });

      return updatedCategory.toApiResponse();
    } catch (error) {
      logger.error('[CategoryService] 更新费用类型状态失败', { 
        error: error.message,
        id,
        status 
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