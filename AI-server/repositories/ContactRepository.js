/**
 * 联系人仓库
 * 处理联系人相关的数据库操作
 */

const BaseRepository = require('./BaseRepository');
const ContactModel = require('../models/ContactModel');

class ContactRepository extends BaseRepository {
  constructor() {
    super('contacts', ContactModel);
    this.searchableFields = ['name', 'email', 'phone', 'company'];
  }

  /**
   * 根据创建人ID获取联系人列表
   * @param {number} userId - 创建人ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async findByCreatedBy(userId, options = {}) {
    // 扩展options，添加created_by过滤条件
    const extendedOptions = {
      ...options,
      filters: {
        ...options.filters,
        created_by: userId
      }
    };

    return this.findAll(extendedOptions);
  }

  /**
   * 批量获取联系人
   * @param {Array<number>} ids - 联系人ID数组
   * @returns {Promise<Array>} 联系人列表
   */
  async findByIds(ids) {
    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
      const queryText = `SELECT * FROM contacts WHERE id IN (${placeholders})`;
      
      const result = await this.executeQuery(queryText, ids);
      
      return this.modelClass 
        ? result.rows.map(row => this.modelClass.fromDatabase(row))
        : result.rows;
    } catch (error) {
      this.logger.error(`[contacts] 批量获取联系人失败`, { error: error.message, ids });
      throw error;
    }
  }
};

module.exports = ContactRepository;