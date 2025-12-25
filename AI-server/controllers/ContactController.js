/**
 * 联系人控制器
 * 处理联系人相关的HTTP请求
 */

const BaseController = require('./BaseController');
const ContactService = require('../services/ContactService');
const logger = require('../config/logger');

class ContactController extends BaseController {
  constructor() {
    const contactService = new ContactService();
    super(contactService);
    this.contactService = contactService;
  }

  /**
   * 获取联系人列表
   * GET /api/contacts
   */
  async getContacts(req, res, next) {
    try {
      logger.info('[ContactController] 获取联系人列表', { 
        userId: req.user?.id,
        query: req.query 
      });

      // 构建查询选项
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC',
        search: req.query.search,
        filters: req.query.filters ? JSON.parse(req.query.filters) : {}
      };

      // 如果用户已登录，添加created_by过滤条件
      if (req.user && req.user.id) {
        options.filters.created_by = req.user.id;
      }

      // 调用服务层获取联系人列表
      const result = await this.contactService.getContacts(options);
      
      return res.json({
        success: true,
        message: '联系人列表获取成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('[ContactController] 获取联系人列表失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取联系人详情
   * GET /api/contacts/:id
   */
  async getContactDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[ContactController] 获取联系人详情', { 
        userId: req.user?.id,
        contactId: id 
      });

      // 调用服务层获取联系人详情
      const contact = await this.contactService.getContactDetail(id);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: '联系人不存在'
        });
      }

      // 验证联系人是否属于当前用户
      if (req.user && req.user.id && contact.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此联系人'
        });
      }

      return res.json({
        success: true,
        message: '联系人详情获取成功',
        data: contact
      });
    } catch (error) {
      logger.error('[ContactController] 获取联系人详情失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 创建联系人
   * POST /api/contacts
   */
  async createContact(req, res, next) {
    try {
      logger.info('[ContactController] 创建联系人', { 
        userId: req.user?.id,
        data: this.filterSensitiveData(req.body) 
      });

      // 添加当前用户作为创建人
      const contactData = {
        ...req.body,
        createdBy: req.user?.id || req.body.created_by
      };

      // 调用服务层创建联系人
      const createdContact = await this.contactService.createContact(contactData);
      
      return res.status(201).json({
        success: true,
        message: '联系人创建成功',
        data: createdContact
      });
    } catch (error) {
      logger.error('[ContactController] 创建联系人失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 更新联系人
   * PUT /api/contacts/:id
   */
  async updateContact(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[ContactController] 更新联系人', { 
        userId: req.user?.id,
        contactId: id,
        data: this.filterSensitiveData(req.body) 
      });

      // 验证联系人是否属于当前用户
      const existingContact = await this.contactService.getContactDetail(id);
      if (!existingContact) {
        return res.status(404).json({
          success: false,
          message: '联系人不存在'
        });
      }

      if (req.user && req.user.id && existingContact.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权修改此联系人'
        });
      }

      // 调用服务层更新联系人
      const updatedContact = await this.contactService.updateContact(id, req.body);
      
      return res.json({
        success: true,
        message: '联系人更新成功',
        data: updatedContact
      });
    } catch (error) {
      logger.error('[ContactController] 更新联系人失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 删除联系人
   * DELETE /api/contacts/:id
   */
  async deleteContact(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info('[ContactController] 删除联系人', { 
        userId: req.user?.id,
        contactId: id 
      });

      // 验证联系人是否属于当前用户
      const existingContact = await this.contactService.getContactDetail(id);
      if (!existingContact) {
        return res.status(404).json({
          success: false,
          message: '联系人不存在'
        });
      }

      if (req.user && req.user.id && existingContact.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权删除此联系人'
        });
      }

      // 调用服务层删除联系人
      const success = await this.contactService.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '联系人删除失败'
        });
      }

      return res.json({
        success: true,
        message: '联系人删除成功'
      });
    } catch (error) {
      logger.error('[ContactController] 删除联系人失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 批量删除联系人
   * DELETE /api/contacts/batch
   */
  async batchDeleteContacts(req, res, next) {
    try {
      const { ids } = req.body;
      
      logger.info('[ContactController] 批量删除联系人', { 
        userId: req.user?.id,
        count: ids.length 
      });

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的联系人ID数组'
        });
      }

      // 调用服务层批量删除联系人
      const result = await this.contactService.batchDeleteContacts(ids);
      
      return res.json({
        success: true,
        message: '联系人批量删除成功',
        data: result
      });
    } catch (error) {
      logger.error('[ContactController] 批量删除联系人失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = ContactController;