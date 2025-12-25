/**
 * 分类数据模型
 * 定义分类相关的数据结构和业务规则
 */

class CategoryModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.categoryCode = data.category_code || data.code || '';
    this.categoryName = data.category_name || data.name || '';
    this.description = data.description || '';
    this.colorCode = data.color_code || data.color || '';
    this.iconName = data.icon_name || data.icon || '';
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.sortOrder = data.sort_order || data.sort || 0;
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
  }

  /**
   * 验证分类数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    // 验证分类名称
    if (!this.categoryName || this.categoryName.trim().length === 0) {
      errors.push('分类名称不能为空');
    } else if (this.categoryName.length > 100) {
      errors.push('分类名称长度不能超过100个字符');
    }

    // 验证分类代码
    if (this.categoryCode && this.categoryCode.length > 50) {
      errors.push('分类代码长度不能超过50个字符');
    }

    // 验证颜色代码格式（如果提供）
    if (this.colorCode) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(this.colorCode)) {
        errors.push('颜色代码格式不正确，应为#RRGGBB格式');
      }
    }

    // 验证图标名称长度（如果提供）
    if (this.iconName && this.iconName.length > 50) {
      errors.push('图标名称长度不能超过50个字符');
    }

    // 验证排序顺序
    if (typeof this.sortOrder !== 'number') {
      errors.push('排序顺序必须是数字');
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
      category_code: this.categoryCode,
      category_name: this.categoryName,
      description: this.description,
      color_code: this.colorCode,
      icon_name: this.iconName,
      is_active: this.isActive,
      sort_order: this.sortOrder,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * 从数据库记录创建模型实例
   * @param {Object} dbRecord - 数据库记录
   * @returns {CategoryModel} 分类模型实例
   */
  static fromDatabase(dbRecord) {
    if (!dbRecord) return null;

    return new CategoryModel({
      id: dbRecord.id,
      category_code: dbRecord.category_code,
      category_name: dbRecord.category_name,
      description: dbRecord.description,
      color_code: dbRecord.color_code,
      icon_name: dbRecord.icon_name,
      is_active: dbRecord.is_active,
      sort_order: dbRecord.sort_order,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at
    });
  }

  /**
   * 转换为API响应格式
   * @returns {Object} API响应格式的数据
   */
  toApiResponse() {
    return {
      id: this.id,
      code: this.categoryCode,
      name: this.categoryName,
      description: this.description,
      color: this.colorCode,
      icon: this.iconName,
      isActive: this.isActive,
      sort: this.sortOrder,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * 更新分类信息
   * @param {Object} updates - 更新的数据
   */
  update(updates) {
    const allowedFields = ['categoryCode', 'categoryName', 'description', 'colorCode', 'iconName', 'isActive', 'sortOrder'];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        this[key] = updates[key];
      }
    });

    this.updatedAt = new Date();
  }

  /**
   * 创建新分类模型实例
   * @param {Object} categoryData - 分类数据
   * @returns {CategoryModel} 分类模型实例
   */
  static create(categoryData) {
    const category = new CategoryModel({
      categoryCode: categoryData.code || categoryData.categoryCode || '',
      categoryName: categoryData.name || categoryData.categoryName || '',
      description: categoryData.description || '',
      colorCode: categoryData.color || categoryData.colorCode || '',
      iconName: categoryData.icon || categoryData.iconName || '',
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      sortOrder: categoryData.sort || categoryData.sortOrder || 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    return category;
  }
}

module.exports = CategoryModel;