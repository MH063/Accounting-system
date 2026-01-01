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
    this.nickname = data.nickname || '';
    this.phone = data.phone || '';
    this.avatarUrl = data.avatar_url || '';
    
    // 安全提醒和保护设置
    this.login_protection_enabled = data.login_protection_enabled !== undefined ? data.login_protection_enabled : false;
    this.email_alerts_enabled = data.email_alerts_enabled !== undefined ? data.email_alerts_enabled : false;
    this.sms_alerts_enabled = data.sms_alerts_enabled !== undefined ? data.sms_alerts_enabled : false;
    this.session_timeout_minutes = data.session_timeout_minutes || 30;
    this.session_timeout_warning_minutes = data.session_timeout_warning_minutes || 5;
    this.biometric_enabled = data.biometric_enabled !== undefined ? data.biometric_enabled : false;
    
    // 账户状态
    this.status = data.status || 'active';
    this.emailVerified = data.email_verified !== undefined ? data.email_verified : false;
    this.phoneVerified = data.phone_verified !== undefined ? data.phone_verified : false;
    
    // 安全相关
    this.lastLoginAt = data.last_login_at || null;
    this.lastLoginIp = data.last_login_ip || null;
    this.passwordChangedAt = data.password_changed_at || new Date();
    this.failedLoginAttempts = data.failed_login_attempts !== undefined ? data.failed_login_attempts : 0;
    this.lockedUntil = data.locked_until || null;
    
    // 时间戳
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
    
    // 兼容旧版本字段
    this.isActive = this.status === 'active';
    this.role = data.role || 'user';
    this.permissions = data.permissions || [];
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
    } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(this.username)) {
      errors.push('用户名只能包含中文、字母、数字、下划线和连字符');
    }

    // 验证邮箱
    if (!this.email || this.email.trim().length === 0) {
      errors.push('邮箱不能为空');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('邮箱格式不正确');
    } else if (this.email.length > 255) {
      errors.push('邮箱长度不能超过255个字符');
    }

    // 验证手机号（可选）
    if (this.phone && !/^\+?[1-9]\d{1,14}$/.test(this.phone)) {
      errors.push('手机号格式不正确');
    }

    // 验证密码哈希（仅在创建时验证）
    if (!this.id && (!this.passwordHash || this.passwordHash.length === 0)) {
      errors.push('密码不能为空');
    }

    // 验证状态
    const validStatuses = ['active', 'inactive', 'pending', 'banned'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('无效的账户状态');
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
      nickname: this.nickname,
      phone: this.phone,
      avatar_url: this.avatarUrl,
      status: this.status,
      email_verified: this.emailVerified,
      phone_verified: this.phoneVerified,
      login_protection_enabled: this.login_protection_enabled,
      email_alerts_enabled: this.email_alerts_enabled,
      sms_alerts_enabled: this.sms_alerts_enabled,
      session_timeout_minutes: this.session_timeout_minutes,
      session_timeout_warning_minutes: this.session_timeout_warning_minutes,
      biometric_enabled: this.biometric_enabled,
      last_login_at: this.lastLoginAt,
      last_login_ip: this.lastLoginIp,
      password_changed_at: this.passwordChangedAt,
      failed_login_attempts: this.failedLoginAttempts,
      locked_until: this.lockedUntil,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      // 兼容旧版本字段
      permissions: JSON.stringify(this.permissions)
    };
  }

  /**
   * 从数据库记录创建模型实例
   * @param {Object} dbRecord - 数据库记录
   * @returns {UserModel} 用户模型实例
   */
  static fromDatabase(dbRecord) {
    if (!dbRecord) return null;

    // 使用从数据库查询到的真实角色信息，如果没有则使用默认值
    let role = dbRecord.role_name || 'user'; // 使用数据库中的真实角色
    let permissions = dbRecord.permissions || [];
    
    // 如果数据库查询没有返回角色信息，使用默认角色
    if (!dbRecord.role_name) {
      role = 'user';
      permissions = [];
    }
    
    // 创建UserModel实例，字段名应该与构造函数参数名一致
    return new UserModel({
      id: dbRecord.id,
      username: dbRecord.username,
      email: dbRecord.email,
      password_hash: dbRecord.password_hash, // 这里传入password_hash，构造函数会将其映射为passwordHash
      nickname: dbRecord.nickname,
      phone: dbRecord.phone,
      avatar_url: dbRecord.avatar_url,
      status: dbRecord.status || 'active',
      email_verified: dbRecord.email_verified || false,
      phone_verified: dbRecord.phone_verified || false,
      login_protection_enabled: dbRecord.login_protection_enabled,
      email_alerts_enabled: dbRecord.email_alerts_enabled,
      sms_alerts_enabled: dbRecord.sms_alerts_enabled,
      session_timeout_minutes: dbRecord.session_timeout_minutes,
      session_timeout_warning_minutes: dbRecord.session_timeout_warning_minutes,
      biometric_enabled: dbRecord.biometric_enabled,
      last_login_at: dbRecord.last_login_at,
      last_login_ip: dbRecord.last_login_ip,
      password_changed_at: dbRecord.password_changed_at,
      failed_login_attempts: dbRecord.failed_login_attempts || 0,
      locked_until: dbRecord.locked_until,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at,
      // 使用从数据库查询到的真实角色信息
      role: role,
      permissions: permissions
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
      nickname: this.nickname,
      phone: this.phone,
      avatar_url: this.avatarUrl,
      status: this.status,
      email_verified: this.emailVerified,
      phone_verified: this.phoneVerified,
      login_protection_enabled: this.login_protection_enabled,
      email_alerts_enabled: this.email_alerts_enabled,
      sms_alerts_enabled: this.sms_alerts_enabled,
      session_timeout_minutes: this.session_timeout_minutes,
      session_timeout_warning_minutes: this.session_timeout_warning_minutes,
      biometric_enabled: this.biometric_enabled,
      last_login_at: this.lastLoginAt,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      // 兼容旧版本字段
      is_active: this.isActive,
      role: this.role,
      permissions: this.permissions
    };
  }

  /**
   * 检查用户是否有特定权限
   * @param {string} permission - 权限名称
   * @returns {boolean} 是否有权限
   */
  hasPermission(permission) {
    if (!this.permissions) return false;
    
    // 如果是数组 (新系统)
    if (Array.isArray(this.permissions)) {
      return this.permissions.includes(permission);
    }
    
    // 如果是对象 (从数据库加载的 JSONB 格式)
    if (typeof this.permissions === 'object') {
      // 直接检查
      if (this.permissions[permission] === true) return true;
      
      // 检查映射
      const mapping = {
        'user:activate': 'user_management',
        'user:deactivate': 'user_management',
        'user:create': 'user_management',
        'user:update': 'user_management',
        'user:delete': 'user_management',
        'user:list': 'user_management',
        'user:read': 'user_management',
        'system:config': 'system_config'
      };
      
      const dbKey = mapping[permission];
      return dbKey ? this.permissions[dbKey] === true : false;
    }
    
    return false;
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
      password_hash: userData.passwordHash,
      nickname: userData.nickname || '',
      phone: userData.phone || null,
      avatar_url: userData.avatar_url || '',
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      role: 'user',
      permissions: [],
      qq_number: userData.qq_number || null
    });

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