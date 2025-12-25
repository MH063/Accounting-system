/**
 * 联系人数据模型
 * 定义联系人相关的数据结构和业务规则
 */

class ContactModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.company = data.company || '';
    this.description = data.description || '';
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
    this.createdBy = data.created_by || null;
  }

  /**
   * 验证联系人数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    // 验证联系人姓名
    if (!this.name || this.name.trim().length === 0) {
      errors.push('联系人姓名不能为空');
    } else if (this.name.length > 255) {
      errors.push('联系人姓名长度不能超过255个字符');
    }

    // 验证邮箱格式（如果提供）
    if (this.email && this.email.trim().length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
        errors.push('邮箱格式不正确');
      } else if (this.email.length > 255) {
        errors.push('邮箱长度不能超过255个字符');
      }
    }

    // 验证手机号格式（如果提供）
    if (this.phone && this.phone.trim().length > 0) {
      if (!/^\+?[1-9]\d{1,14}$/.test(this.phone)) {
        errors.push('手机号格式不正确');
      } else if (this.phone.length > 20) {
        errors.push('手机号长度不能超过20个字符');
      }
    }

    // 验证公司名称长度（如果提供）
    if (this.company && this.company.length > 255) {
      errors.push('公司名称长度不能超过255个字符');
    }

    // 验证创建人ID
    if (!this.createdBy) {
      errors.push('创建人ID不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 转换为数据库格式
   * @returns {Object} 数据库格式的数据
   */
  toDatabaseFormat() {
    return {
      name: this.name,
      email: this.email,
      phone: this.phone,
      company: this.company,
      description: this.description,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      created_by: this.createdBy
    };
  }

  /**
   * 从数据库记录创建模型实例
   * @param {Object} dbRecord - 数据库记录
   * @returns {ContactModel} 联系人模型实例
   */
  static fromDatabase(dbRecord) {
    if (!dbRecord) return null;

    return new ContactModel({
      id: dbRecord.id,
      name: dbRecord.name,
      email: dbRecord.email,
      phone: dbRecord.phone,
      company: dbRecord.company,
      description: dbRecord.description,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at,
      created_by: dbRecord.created_by
    });
  }

  /**
   * 转换为API响应格式
   * @returns {Object} API响应格式的数据
   */
  toApiResponse() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      company: this.company,
      description: this.description,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      created_by: this.createdBy
    };
  }

  /**
   * 更新联系人信息
   * @param {Object} updates - 更新的数据
   */
  update(updates) {
    const allowedFields = ['name', 'email', 'phone', 'company', 'description'];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        this[key] = updates[key];
      }
    });

    this.updatedAt = new Date();
  }

  /**
   * 创建新联系人模型实例
   * @param {Object} contactData - 联系人数据
   * @returns {ContactModel} 联系人模型实例
   */
  static create(contactData) {
    const contact = new ContactModel({
      name: contactData.name,
      email: contactData.email || '',
      phone: contactData.phone || '',
      company: contactData.company || '',
      description: contactData.description || '',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: contactData.createdBy
    });

    return contact;
  }
}

module.exports = ContactModel;