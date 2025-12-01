/**
 * 用户数据模型
 * 定义用户相关的数据结构和业务规则
 */

class UserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.passwordHash = data.password_hash || '';
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.role = data.role || 'user';
    this.permissions = data.permissions || [];
    // 新增邮箱验证相关字段
    this.emailVerified = data.email_verified !== undefined ? data.email_verified : false;
    this.verificationToken = data.verification_token || null;
    this.verificationTokenExpires = data.verification_token_expires || null;
    // 新增密码重置相关字段
    this.resetToken = data.reset_token || null;
    this.resetTokenExpires = data.reset_token_expires || null;
    // QQ验证相关字段
    this.qqNumber = data.qq_number || null;
    this.qqVerified = data.qq_verified !== undefined ? data.qq_verified : false;
  }

  /**
   * 验证用户数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];

    // 验证用户名
    if (!this.username || this.username.trim().length === 0) {
      errors.push('用户名不能为空');
    } else if (this.username.length < 3) {
      errors.push('用户名长度不能少于3个字符');
    } else if (this.username.length > 50) {
      errors.push('用户名长度不能超过50个字符');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(this.username)) {
      errors.push('用户名只能包含字母、数字、下划线和连字符');
    }

    // 验证邮箱
    if (!this.email || this.email.trim().length === 0) {
      errors.push('邮箱不能为空');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('邮箱格式不正确');
    } else if (this.email.length > 100) {
      errors.push('邮箱长度不能超过100个字符');
    }

    // 验证密码哈希（仅在创建时验证）
    if (!this.id && (!this.passwordHash || this.passwordHash.length === 0)) {
      errors.push('密码不能为空');
    }

    // 验证角色
    const validRoles = ['user', 'admin', 'moderator', 'guest'];
    if (this.role && !validRoles.includes(this.role)) {
      errors.push('无效的角色类型');
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
      username: this.username,
      email: this.email,
      password_hash: this.passwordHash,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      is_active: this.isActive,
      role: this.role,
      permissions: JSON.stringify(this.permissions),
      // 新增字段
      email_verified: this.emailVerified,
      verification_token: this.verificationToken,
      verification_token_expires: this.verificationTokenExpires,
      reset_token: this.resetToken,
      reset_token_expires: this.resetTokenExpires,
      qq_number: this.qqNumber,
      qq_verified: this.qqVerified
    };
  }

  /**
   * 从数据库记录创建模型实例
   * @param {Object} dbRecord - 数据库记录
   * @returns {UserModel} 用户模型实例
   */
  static fromDatabase(dbRecord) {
    if (!dbRecord) return null;

    return new UserModel({
      id: dbRecord.id,
      username: dbRecord.username,
      email: dbRecord.email,
      password_hash: dbRecord.password_hash,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at,
      is_active: dbRecord.is_active,
      role: dbRecord.role,
      permissions: dbRecord.permissions ? JSON.parse(dbRecord.permissions) : [],
      // 新增字段
      email_verified: dbRecord.email_verified || false,
      verification_token: dbRecord.verification_token || null,
      verification_token_expires: dbRecord.verification_token_expires || null,
      reset_token: dbRecord.reset_token || null,
      reset_token_expires: dbRecord.reset_token_expires || null,
      qq_number: dbRecord.qq_number || null,
      qq_verified: dbRecord.qq_verified || false
    });
  }

  /**
   * 转换为API响应格式（移除敏感信息）
   * @returns {Object} API响应格式的数据
   */
  toApiResponse() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      is_active: this.isActive,
      role: this.role,
      permissions: this.permissions,
      // 新增验证相关字段
      email_verified: this.emailVerified,
      qq_number: this.qqNumber,
      qq_verified: this.qqVerified
    };
  }

  /**
   * 检查用户是否有特定权限
   * @param {string} permission - 权限名称
   * @returns {boolean} 是否有权限
   */
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  /**
   * 检查用户是否有特定角色
   * @param {string} role - 角色名称
   * @returns {boolean} 是否有角色
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * 检查用户是否活跃
   * @returns {boolean} 是否活跃
   */
  isActiveUser() {
    return this.isActive;
  }

  /**
   * 更新用户信息
   * @param {Object} updates - 更新的数据
   */
  update(updates) {
    const allowedFields = ['username', 'email', 'role', 'is_active', 'permissions', 'qq_number'];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        this[key] = updates[key];
      }
    });

    this.updatedAt = new Date();
  }

  /**
   * 设置密码哈希
   * @param {string} passwordHash - 密码哈希值
   */
  setPasswordHash(passwordHash) {
    this.passwordHash = passwordHash;
    this.updatedAt = new Date();
  }

  /**
   * 添加权限
   * @param {string} permission - 权限名称
   */
  addPermission(permission) {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
      this.updatedAt = new Date();
    }
  }

  /**
   * 移除权限
   * @param {string} permission - 权限名称
   */
  removePermission(permission) {
    this.permissions = this.permissions.filter(p => p !== permission);
    this.updatedAt = new Date();
  }

  /**
   * 激活用户
   */
  activate() {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * 禁用用户
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * 创建新用户模型实例
   * @param {Object} userData - 用户数据
   * @returns {UserModel} 用户模型实例
   */
  static create(userData) {
    const user = new UserModel({
      username: userData.username,
      email: userData.email,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      role: 'user',
      permissions: [],
      qq_number: userData.qq_number || null
    });

    if (userData.passwordHash) {
      user.setPasswordHash(userData.passwordHash);
    }

    return user;
  }

  /**
   * 设置邮箱验证令牌
   * @param {string} token - 验证令牌
   * @param {Date} expires - 过期时间
   */
  setEmailVerificationToken(token, expires) {
    this.verificationToken = token;
    this.verificationTokenExpires = expires;
    this.updatedAt = new Date();
  }

  /**
   * 验证邮箱
   */
  verifyEmail() {
    this.emailVerified = true;
    this.verificationToken = null;
    this.verificationTokenExpires = null;
    this.updatedAt = new Date();
  }

  /**
   * 设置密码重置令牌
   * @param {string} token - 重置令牌
   * @param {Date} expires - 过期时间
   */
  setPasswordResetToken(token, expires) {
    this.resetToken = token;
    this.resetTokenExpires = expires;
    this.updatedAt = new Date();
  }

  /**
   * 重置密码
   * @param {string} passwordHash - 新密码哈希
   */
  resetPassword(passwordHash) {
    this.setPasswordHash(passwordHash);
    this.resetToken = null;
    this.resetTokenExpires = null;
  }

  /**
   * 验证QQ号
   */
  verifyQQ() {
    this.qqVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * 检查邮箱验证令牌是否有效
   * @returns {boolean} 是否有效
   */
  isEmailVerificationTokenValid() {
    if (!this.verificationToken || !this.verificationTokenExpires) {
      return false;
    }
    return new Date() < this.verificationTokenExpires;
  }

  /**
   * 检查密码重置令牌是否有效
   * @returns {boolean} 是否有效
   */
  isPasswordResetTokenValid() {
    if (!this.resetToken || !this.resetTokenExpires) {
      return false;
    }
    return new Date() < this.resetTokenExpires;
  }
}

module.exports = UserModel;