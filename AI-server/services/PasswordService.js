/**
 * 密码管理服务
 * 处理密码加密、验证、强度校验、历史记录和有效期
 */

const crypto = require('crypto');
const systemConfigService = require('./systemConfigService');
const logger = require('../config/logger');

class PasswordService {
  /**
   * 使用 PBKDF2 算法对密码进行哈希
   * @param {string} password - 原始密码
   * @param {string} [salt] - 盐值，如果不提供则生成新的
   * @returns {Promise<string>} 格式为 pbkdf2$iterations$salt$hash 的字符串
   */
  async hashPassword(password, salt = null) {
    return new Promise((resolve, reject) => {
      const iterations = 100000;
      const keylen = 64;
      const digest = 'sha512';
      
      if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
      }

      crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
        if (err) reject(err);
        resolve(`pbkdf2$${iterations}$${salt}$${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * 验证密码是否匹配
   * @param {string} password - 待验证的原始密码
   * @param {string} storedHash - 存储的哈希值（支持 bcrypt 和 pbkdf2）
   * @returns {Promise<boolean>} 是否匹配
   */
  async verifyPassword(password, storedHash) {
    if (!storedHash) return false;

    // 支持旧的 bcrypt 哈希
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      const bcrypt = require('bcrypt');
      return bcrypt.compare(password, storedHash);
    }

    // 处理 PBKDF2 哈希
    if (storedHash.startsWith('pbkdf2$')) {
      const [algo, iterations, salt, hash] = storedHash.split('$');
      const verifyHash = await this.hashPassword(password, salt);
      return verifyHash === storedHash;
    }

    return false;
  }

  /**
   * 验证密码强度
   * @param {string} password - 原始密码
   * @returns {Promise<void>} 验证失败抛出异常
   */
  async validateStrength(password) {
    const security = await systemConfigService.getSecurityConfigs();
    
    const errors = [];
    
    if (password.length < security.minLength) {
      errors.push(`最小长度要求为 ${security.minLength} 位`);
    }
    
    if (security.requireNumber && !/\d/.test(password)) {
      errors.push('必须包含数字');
    }
    
    if (security.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('必须包含至少一个特殊字符');
    }
    
    if (security.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('必须包含大写字母');
    }

    // 强制包含小写字母（技术规范要求）
    if (!/[a-z]/.test(password)) {
      errors.push('必须包含小写字母');
    }

    if (errors.length > 0) {
      const errorMsg = `密码不符合强度要求: ${errors.join('；')}`;
      logger.warn('[PasswordService] 密码强度验证失败', { errors });
      throw new Error(errorMsg);
    }
  }

  /**
   * 检查是否为最近使用的密码
   * @param {number} userId - 用户ID
   * @param {string} password - 新密码
   * @returns {Promise<void>} 如果是重复密码则抛出异常
   */
  async checkPasswordHistory(userId, password, client = null) {
    const { query } = require('../config/database');
    const db = client || { query };
    
    const security = await systemConfigService.getSecurityConfigs();
    const limit = security.historyLimit || 5;

    const result = await db.query(
      'SELECT password_hash FROM user_password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );

    for (const row of result.rows) {
      const isMatch = await this.verifyPassword(password, row.password_hash);
      if (isMatch) {
        throw new Error(`不能使用最近 ${limit} 次使用过的密码`);
      }
    }
  }

  /**
   * 记录密码历史
   * @param {number} userId - 用户ID
   * @param {string} passwordHash - 密码哈希
   */
  async recordPasswordHistory(userId, passwordHash, client = null) {
    const { query } = require('../config/database');
    const db = client || { query };
    
    await db.query(
      'INSERT INTO user_password_history (user_id, password_hash) VALUES ($1, $2)',
      [userId, passwordHash]
    );

    // 清理旧记录，保持在限制范围内（可选，或者定期清理）
    const security = await systemConfigService.getSecurityConfigs();
    const limit = security.historyLimit || 5;
    
    await db.query(
      `DELETE FROM user_password_history 
       WHERE id IN (
         SELECT id FROM user_password_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         OFFSET $2
       )`,
      [userId, limit * 2] // 稍微多留一点，防止并发问题，定期清理更好
    );
  }

  /**
   * 检查密码是否过期
   * @param {Date} lastChangedAt - 最后修改时间
   * @returns {Promise<boolean>} 是否过期
   */
  async isPasswordExpired(lastChangedAt) {
    if (!lastChangedAt) return true;
    
    const security = await systemConfigService.getSecurityConfigs();
    const expirationDays = security.expirationDays || 90;
    
    const expiryDate = new Date(lastChangedAt);
    expiryDate.setDate(expiryDate.getDate() + expirationDays);
    
    return new Date() > expiryDate;
  }
}

module.exports = new PasswordService();
