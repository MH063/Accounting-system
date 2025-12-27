/**
 * 统一令牌验证服务
 * 处理令牌的验证、解析、状态检查及标准化错误处理
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { verifyToken, verifyTokenWithBlacklist, getTokenExpiry } = require('../config/jwtManager');

// 标准化令牌错误码
const TOKEN_ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',     // 令牌过期
  TOKEN_INVALID: 'TOKEN_INVALID',     // 令牌无效/格式错误
  TOKEN_REVOKED: 'TOKEN_REVOKED',     // 令牌被撤销
  REFRESH_EXPIRED: 'REFRESH_EXPIRED', // 刷新令牌过期
  NO_TOKEN: 'NO_TOKEN'                // 未提供令牌
};

class TokenService {
  /**
   * 验证访问令牌
   * @param {string} token - JWT令牌字符串
   * @returns {Promise<Object>} 包含验证结果的对象
   */
  async verifyAccessToken(token) {
    if (!token) {
      return {
        success: false,
        code: TOKEN_ERROR_CODES.NO_TOKEN,
        message: '未提供访问令牌'
      };
    }

    try {
      // 使用带黑名单检查的验证逻辑
      const payload = await verifyTokenWithBlacklist(token);
      
      return {
        success: true,
        data: {
          ...payload,
          id: payload.userId || payload.id
        }
      };
    } catch (error) {
      logger.error('[TokenService] 访问令牌验证失败:', { 
        error: error.message,
        name: error.name 
      });

      let code = TOKEN_ERROR_CODES.TOKEN_INVALID;
      let message = '无效的访问令牌';

      if (error.name === 'TokenExpiredError') {
        code = TOKEN_ERROR_CODES.TOKEN_EXPIRED;
        message = '访问令牌已过期';
      } else if (error.message === '令牌已被撤销') {
        code = TOKEN_ERROR_CODES.TOKEN_REVOKED;
        message = '令牌已被撤销，请重新登录';
      }

      return {
        success: false,
        code,
        message
      };
    }
  }

  /**
   * 验证刷新令牌
   * @param {string} token - 刷新令牌字符串
   * @returns {Promise<Object>} 包含验证结果的对象
   */
  async verifyRefreshToken(token) {
    if (!token) {
      return {
        success: false,
        code: TOKEN_ERROR_CODES.NO_TOKEN,
        message: '未提供刷新令牌'
      };
    }

    try {
      // 刷新令牌也必须进行黑名单检查，防止被撤销的令牌继续使用
      const payload = await verifyTokenWithBlacklist(token);
      
      return {
        success: true,
        data: payload
      };
    } catch (error) {
      logger.error('[TokenService] 刷新令牌验证失败:', { 
        error: error.message,
        name: error.name 
      });

      let code = TOKEN_ERROR_CODES.TOKEN_INVALID;
      let message = '无效的刷新令牌';

      if (error.name === 'TokenExpiredError') {
        code = TOKEN_ERROR_CODES.REFRESH_EXPIRED;
        message = '刷新令牌已过期';
      } else if (error.message === '令牌已被撤销') {
        code = TOKEN_ERROR_CODES.TOKEN_REVOKED;
        message = '刷新令牌已被撤销，请重新登录';
      }

      return {
        success: false,
        code,
        message
      };
    }
  }

  /**
   * 从请求头中提取令牌
   * @param {Object} req - Express 请求对象
   * @returns {string|null} 提取出的令牌字符串
   */
  extractTokenFromHeader(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * 获取错误码枚举
   */
  get errorCodes() {
    return TOKEN_ERROR_CODES;
  }
}

module.exports = new TokenService();
