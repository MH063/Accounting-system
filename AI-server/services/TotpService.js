/**
 * TOTP服务模块
 * 提供基于TOTP的两步验证功能
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../config/logger');

class TotpService {
  /**
   * 生成TOTP密钥
   * @param {string} appName - 应用名称
   * @param {string} username - 用户名
   * @returns {Object} 密钥信息
   */
  generateSecret(appName = 'AccountingSystem', username = 'user') {
    try {
      const secret = speakeasy.generateSecret({
        name: `${appName}:${username}`,
        issuer: appName,
        length: 32,
        encoding: 'base32',
        otpauth_url: true
      });

      logger.info('[TotpService] TOTP密钥生成成功', { 
        username,
        secretLength: secret.base32.length
      });

      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
      };
    } catch (error) {
      logger.error('[TotpService] TOTP密钥生成失败', { 
        error: error.message,
        username
      });
      throw new Error('生成密钥失败');
    }
  }

  /**
   * 验证TOTP验证码
   * @param {string} secret - 密钥
   * @param {string} token - 验证码
   * @param {number} window - 时间窗口大小，默认1
   * @returns {boolean} 验证结果
   */
  verifyToken(secret, token, window = 1) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window
      });

      logger.info('[TotpService] TOTP验证码验证', { 
        verified,
        tokenLength: token ? token.length : 0
      });

      return verified;
    } catch (error) {
      logger.error('[TotpService] TOTP验证码验证失败', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * 生成备份验证码
   * @param {number} count - 验证码数量，默认10个
   * @returns {Array<string>} 备份验证码数组
   */
  generateBackupCodes(count = 10) {
    try {
      const codes = [];
      for (let i = 0; i < count; i++) {
        const code = speakeasy.generateSecret({
          length: 8,
          symbols: false
        }).base32.substring(0, 8).toUpperCase();
        codes.push(code);
      }

      logger.info('[TotpService] 备份验证码生成成功', { 
        count: codes.length 
      });

      return codes;
    } catch (error) {
      logger.error('[TotpService] 备份验证码生成失败', { 
        error: error.message 
      });
      throw new Error('生成备份验证码失败');
    }
  }

  /**
   * 生成二维码
   * @param {string} otpauthUrl - OTP认证URL
   * @returns {Promise<string>} 二维码DataURL
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info('[TotpService] 二维码生成成功');

      return qrCodeDataUrl;
    } catch (error) {
      logger.error('[TotpService] 二维码生成失败', { 
        error: error.message 
      });
      throw new Error('生成二维码失败');
    }
  }

  /**
   * 生成完整的两步验证设置信息
   * @param {string} appName - 应用名称
   * @param {string} username - 用户名
   * @returns {Promise<Object>} 两步验证设置信息
   */
  async generateTwoFactorSetup(appName = 'AccountingSystem', username = 'user') {
    try {
      const { secret, otpauthUrl } = this.generateSecret(appName, username);
      const backupCodes = this.generateBackupCodes(10);
      const qrCode = await this.generateQRCode(otpauthUrl);

      logger.info('[TotpService] 两步验证设置信息生成成功', { 
        username,
        backupCodesCount: backupCodes.length
      });

      return {
        secret,
        backupCodes,
        qrCode,
        otpauthUrl
      };
    } catch (error) {
      logger.error('[TotpService] 两步验证设置信息生成失败', { 
        error: error.message,
        username
      });
      throw error;
    }
  }

  /**
   * 验证备份验证码
   * @param {Array<string>} backupCodes - 备份验证码数组
   * @param {string} code - 用户输入的验证码
   * @returns {boolean} 验证结果
   */
  verifyBackupCode(backupCodes, code) {
    try {
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (codeIndex !== -1) {
        logger.info('[TotpService] 备份验证码验证成功', { 
          codeIndex 
        });
        return true;
      }

      logger.warn('[TotpService] 备份验证码验证失败', { 
        codeLength: code ? code.length : 0 
      });

      return false;
    } catch (error) {
      logger.error('[TotpService] 备份验证码验证失败', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * 从备份验证码数组中移除已使用的验证码
   * @param {Array<string>} backupCodes - 备份验证码数组
   * @param {string} code - 已使用的验证码
   * @returns {Array<string>} 更新后的备份验证码数组
   */
  removeUsedBackupCode(backupCodes, code) {
    try {
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (codeIndex !== -1) {
        backupCodes.splice(codeIndex, 1);
        logger.info('[TotpService] 备份验证码已移除', { 
          remainingCount: backupCodes.length 
        });
      }

      return backupCodes;
    } catch (error) {
      logger.error('[TotpService] 移除备份验证码失败', { 
        error: error.message 
      });
      return backupCodes;
    }
  }
}

module.exports = TotpService;
