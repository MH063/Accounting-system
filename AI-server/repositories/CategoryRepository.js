/**
 * 分类仓库
 * 处理分类相关的数据库操作
 */

const BaseRepository = require('./BaseRepository');
const CategoryModel = require('../models/CategoryModel');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('expense_categories', CategoryModel);
    this.searchableFields = ['category_name', 'category_code', 'description'];
  }

  /**
   * 获取活跃的分类列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findActive(options = {}) {
    // 扩展options，添加is_active过滤条件
    const extendedOptions = {
      ...options,
      filters: {
        ...options.filters,
        is_active: true
      }
    };

    return this.findAll(extendedOptions);
  }

  /**
   * 根据分类代码获取分类
   * @param {string} code - 分类代码
   * @returns {Promise<Object|null>} 查询结果
   */
  async findByCode(code) {
    return this.findOne({ category_code: code });
  }

  /**
   * 根据分类名称获取分类
   * @param {string} name - 分类名称
   * @returns {Promise<Object|null>} 查询结果
   */
  async findByName(name) {
    return this.findOne({ category_name: name });
  }

  /**
   * 获取分类的使用统计
   * @returns {Promise<Array>} 分类使用统计
   */
  async getUsageStatistics() {
    try {
      const queryText = `
        SELECT 
          ec.id, 
          ec.category_name, 
          ec.category_code, 
          COUNT(e.id) as usage_count,
          SUM(e.amount) as total_amount
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id
        GROUP BY ec.id, ec.category_name, ec.category_code
        ORDER BY usage_count DESC
      `;

      const result = await this.executeQuery(queryText);
      return result.rows;
    } catch (error) {
      this.logger.error(`[expense_categories] 获取分类使用统计失败`, { error: error.message });
      throw error;
    }
  }
};

module.exports = CategoryRepository;