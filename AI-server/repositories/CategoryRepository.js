/**
 * 分类仓库
 * 处理分类相关的数据库操作
 */

const BaseRepository = require('./BaseRepository');
const CategoryModel = require('../models/CategoryModel');
const logger = require('../config/logger');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('expense_categories', CategoryModel);
    this.logger = logger;
    this.model = CategoryModel;
    this.searchableFields = ['category_name', 'category_code', 'description'];
  }

  /**
   * 获取活跃的分类列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findActive(options = {}) {
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

  /**
   * 获取单个分类的使用次数
   * @param {number} categoryId - 分类ID
   * @returns {Promise<number>} 使用次数
   */
  async getUsageCount(categoryId) {
    try {
      const queryText = `
        SELECT COUNT(*) as count
        FROM expenses
        WHERE category_id = $1
      `;

      const result = await this.executeQuery(queryText, [categoryId]);
      return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
      this.logger.error(`[expense_categories] 获取分类使用次数失败`, { error: error.message, categoryId });
      throw error;
    }
  }

  /**
   * 查找费用类型列表（用于管理页面）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findFeeTypes(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        search,
        status,
        billingCycle,
        allocationRule
      } = options;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // 搜索条件
      if (search) {
        conditions.push(`(
          ec.category_name ILIKE $${paramIndex} OR 
          ec.category_code ILIKE $${paramIndex} OR 
          ec.description ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // 状态筛选
      if (status) {
        const isActive = status === 'enabled';
        conditions.push(`ec.is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }

      // 计费周期筛选
      if (billingCycle) {
        conditions.push(`ec.billing_cycle = $${paramIndex}`);
        params.push(billingCycle);
        paramIndex++;
      }

      // 分摊规则筛选
      if (allocationRule) {
        conditions.push(`ec.allocation_rule = $${paramIndex}`);
        params.push(allocationRule);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';

      // 查询数据
      const dataQuery = `
        SELECT 
          ec.*,
          COUNT(e.id) as usage_count
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id
        ${whereClause}
        GROUP BY ec.id
        ORDER BY ec.${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const dataResult = await this.executeQuery(dataQuery, params);
      const items = dataResult.rows.map(row => this.model.fromDatabase(row));

      // 查询总数
      const countQuery = `
        SELECT COUNT(DISTINCT ec.id) as total
        FROM expense_categories ec
        ${whereClause}
      `;

      const countResult = await this.executeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      return {
        data: items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error(`[expense_categories] 获取费用类型列表失败`, { error: error.message, options });
      throw error;
    }
  }
}

module.exports = CategoryRepository;