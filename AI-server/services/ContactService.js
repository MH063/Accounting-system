/**
 * 联系人服务层
 * 处理联系人相关的业务逻辑
 */

const BaseService = require('./BaseService');
const ContactRepository = require('../repositories/ContactRepository');
const ContactModel = require('../models/ContactModel');
const logger = require('../config/logger');

class ContactService extends BaseService {
  constructor() {
    const contactRepository = new ContactRepository();
    super(contactRepository);
    this.contactRepository = contactRepository;
  }

  /**
   * 创建联系人
   * @param {Object} contactData - 联系人数据
   * @returns {Promise<Object>} 创建结果
   */
  async createContact(contactData) {
    try {
      logger.info('[ContactService] 创建联系人开始', { 
        name: contactData.name,
        createdBy: contactData.createdBy 
      });

      // 创建联系人模型
      const contact = ContactModel.create(contactData);

      // 验证数据
      const validation = contact.validate();
      if (!validation.isValid) {
        logger.error('[ContactService] 联系人数据验证失败', { 
          errors: validation.errors 
        });
        throw new Error(`联系人数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 转换为数据库格式
      const dbData = contact.toDatabaseFormat();

      // 调用仓库层创建联系人
      const createdContact = await this.contactRepository.create(dbData);

      logger.info('[ContactService] 创建联系人成功', { 
        id: createdContact.id,
        name: createdContact.name 
      });

      return createdContact;
    } catch (error) {
      logger.error('[ContactService] 创建联系人失败', { 
        error: error.message,
        contactData: this.sanitizeLogData(contactData) 
      });
      throw error;
    }
  }

  /**
   * 获取联系人列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 联系人列表和分页信息
   */
  async getContacts(options = {}) {
    try {
      logger.info('[ContactService] 获取联系人列表', { options });

      // 调用父类的getAll方法获取联系人列表
      const result = await this.getAll(options);

      logger.info('[ContactService] 获取联系人列表成功', { 
        count: result.data.length,
        total: result.pagination.total 
      });

      return result;
    } catch (error) {
      logger.error('[ContactService] 获取联系人列表失败', { 
        error: error.message,
        options 
      });
      throw error;
    }
  }

  /**
   * 获取联系人详情
   * @param {number|string} id - 联系人ID
   * @returns {Promise<Object|null>} 联系人详情
   */
  async getContactDetail(id) {
    try {
      logger.info('[ContactService] 获取联系人详情', { id });

      // 调用父类的getById方法获取联系人详情
      const contact = await this.getById(id);

      if (!contact) {
        logger.warn('[ContactService] 联系人不存在', { id });
        return null;
      }

      logger.info('[ContactService] 获取联系人详情成功', { id });

      return contact;
    } catch (error) {
      logger.error('[ContactService] 获取联系人详情失败', { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 更新联系人
   * @param {number|string} id - 联系人ID
   * @param {Object} contactData - 更新数据
   * @returns {Promise<Object|null>} 更新结果
   */
  async updateContact(id, contactData) {
    try {
      logger.info('[ContactService] 更新联系人开始', { 
        id,
        contactData: this.sanitizeLogData(contactData) 
      });

      // 获取现有联系人
      const existingContact = await this.getById(id);
      if (!existingContact) {
        logger.warn('[ContactService] 联系人不存在', { id });
        return null;
      }

      // 更新联系人模型
      existingContact.update(contactData);

      // 验证数据
      const validation = existingContact.validate();
      if (!validation.isValid) {
        logger.error('[ContactService] 联系人数据验证失败', { 
          errors: validation.errors 
        });
        throw new Error(`联系人数据验证失败: ${validation.errors.join(', ')}`);
      }

      // 转换为数据库格式
      const dbData = existingContact.toDatabaseFormat();

      // 调用仓库层更新联系人
      const updatedContact = await this.contactRepository.update(id, dbData);

      logger.info('[ContactService] 更新联系人成功', { 
        id,
        name: updatedContact.name 
      });

      return updatedContact;
    } catch (error) {
      logger.error('[ContactService] 更新联系人失败', { 
        error: error.message,
        id,
        contactData: this.sanitizeLogData(contactData) 
      });
      throw error;
    }
  }

  /**
   * 删除联系人
   * @param {number|string} id - 联系人ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteContact(id) {
    try {
      logger.info('[ContactService] 删除联系人开始', { id });

      // 调用父类的delete方法删除联系人
      const success = await this.delete(id);

      if (success) {
        logger.info('[ContactService] 删除联系人成功', { id });
      } else {
        logger.warn('[ContactService] 删除联系人失败: 联系人不存在', { id });
      }

      return success;
    } catch (error) {
      logger.error('[ContactService] 删除联系人失败', { 
        error: error.message,
        id 
      });
      throw error;
    }
  }

  /**
   * 批量删除联系人
   * @param {Array<number|string>} ids - 联系人ID数组
   * @returns {Promise<Object>} 批量删除结果
   */
  async batchDeleteContacts(ids) {
    try {
      logger.info('[ContactService] 批量删除联系人开始', { 
        count: ids.length,
        ids 
      });

      // 调用父类的batchDelete方法批量删除联系人
      const result = await this.batchDelete(ids);

      logger.info('[ContactService] 批量删除联系人完成', { 
        success: result.success,
        failed: result.failed 
      });

      return result;
    } catch (error) {
      logger.error('[ContactService] 批量删除联系人失败', { 
        error: error.message,
        ids 
      });
      throw error;
    }
  }

  /**
   * 验证联系人数据
   * @param {Object} data - 待验证的数据
   * @returns {Promise<Object>} 验证结果
   */
  async validateData(data) {
    try {
      const contact = new ContactModel(data);
      return contact.validate();
    } catch (error) {
      logger.error('[ContactService] 验证联系人数据失败', { 
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

      const contact = new ContactModel(updatedData);
      return contact.validate();
    } catch (error) {
      logger.error('[ContactService] 验证联系人更新数据失败', { 
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

module.exports = ContactService;