/**
 * API签名和防重放攻击中间件
 * 实现API请求签名验证和时间戳防重放机制
 */

const crypto = require('crypto');
const { logger } = require('../config/logger');

// 存储已处理的消息ID，防止重放攻击
const processedMessages = new Map();
const MESSAGE_EXPIRY_TIME = 5 * 60 * 1000; // 5分钟

/**
 * 生成HMAC-SHA256签名
 */
function generateSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * 验证请求签名
 */
function verifySignature(signature, data, secret) {
  const expectedSignature = generateSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * 清理过期的消息ID
 */
function cleanupProcessedMessages() {
  const now = Date.now();
  for (const [messageId, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_EXPIRY_TIME) {
      processedMessages.delete(messageId);
    }
  }
}

/**
 * API签名验证中间件
 */
const apiSignatureVerification = (options = {}) => {
  const {
    secret = process.env.API_SIGNATURE_SECRET || 'default-api-signature-secret',
    requiredFields = ['signature', 'timestamp', 'nonce'],
    allowExpired = false,
    maxAge = 5 * 60 * 1000 // 5分钟
  } = options;

  return (req, res, next) => {
    try {
      // 清理过期的消息ID
      cleanupProcessedMessages();

      const { signature, timestamp, nonce, messageId } = req.headers;
      
      // 检查必需字段
      for (const field of requiredFields) {
        if (!req.headers[field]) {
          return res.status(401).json({
            success: false,
            message: `缺少必需的签名字段: ${field}`,
            code: 'MISSING_SIGNATURE_FIELD'
          });
        }
      }

      // 检查时间戳（防重放）
      const requestTime = parseInt(timestamp);
      const now = Date.now();
      
      if (!allowExpired && Math.abs(now - requestTime) > maxAge) {
        logger.warn(`[API_SIGNATURE] 请求过期: IP=${req.ip}, 时间差=${Math.abs(now - requestTime)}ms`);
        return res.status(401).json({
          success: false,
          message: '请求已过期',
          code: 'REQUEST_EXPIRED'
        });
      }

      // 检查是否重复请求（防重放攻击）
      const requestKey = messageId || `${req.method}:${req.path}:${nonce}:${signature}`;
      if (processedMessages.has(requestKey)) {
        logger.warn(`[API_SIGNATURE] 检测到重放攻击: IP=${req.ip}, MessageID=${requestKey}`);
        return res.status(401).json({
          success: false,
          message: '请求已被处理',
          code: 'REPLAY_ATTACK_DETECTED'
        });
      }

      // 构造签名字符串
      const method = req.method.toUpperCase();
      const path = req.path;
      const queryString = req.originalUrl.includes('?') 
        ? req.originalUrl.split('?')[1] 
        : '';
      const body = JSON.stringify(req.body || {});
      
      // 按字典序排序的参数
      const params = new URLSearchParams(queryString);
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      const dataToSign = [
        method,
        path,
        sortedParams,
        body,
        timestamp,
        nonce
      ].join('|');

      // 验证签名
      if (!verifySignature(signature, dataToSign, secret)) {
        logger.warn(`[API_SIGNATURE] 签名验证失败: IP=${req.ip}, 路径=${req.path}`);
        return res.status(401).json({
          success: false,
          message: '签名验证失败',
          code: 'INVALID_SIGNATURE'
        });
      }

      // 记录处理过的消息ID
      processedMessages.set(requestKey, now);

      // 将签名信息添加到请求对象
      req.apiSignature = {
        signature,
        timestamp,
        nonce,
        messageId,
        dataToSign,
        verified: true
      };

      logger.info(`[API_SIGNATURE] 签名验证成功: IP=${req.ip}, 路径=${req.path}, Nonce=${nonce}`);
      next();

    } catch (error) {
      logger.error('[API_SIGNATURE] 签名验证错误:', error);
      return res.status(500).json({
        success: false,
        message: '签名验证系统错误',
        code: 'SIGNATURE_VERIFICATION_ERROR'
      });
    }
  };
};

/**
 * 生成API签名工具函数
 */
function generateApiSignature(params, body = {}, options = {}) {
  const {
    method = 'GET',
    path = '/',
    secret = process.env.API_SIGNATURE_SECRET || 'default-api-signature-secret'
  } = options;

  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const messageId = crypto.randomBytes(16).toString('hex');

  // 构造签名字符串
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const bodyString = JSON.stringify(body);
  
  const dataToSign = [
    method.toUpperCase(),
    path,
    sortedParams,
    bodyString,
    timestamp,
    nonce
  ].join('|');

  const signature = generateSignature(dataToSign, secret);

  return {
    signature,
    timestamp,
    nonce,
    messageId
  };
}

/**
 * 自动生成签名头
 */
function generateSignatureHeaders(params = {}, body = {}, options = {}) {
  const signatureData = generateApiSignature(params, body, options);
  
  return {
    'X-Signature': signatureData.signature,
    'X-Timestamp': signatureData.timestamp,
    'X-Nonce': signatureData.nonce,
    'X-Message-ID': signatureData.messageId
  };
}

module.exports = {
  apiSignatureVerification,
  generateApiSignature,
  generateSignatureHeaders,
  verifySignature,
  generateSignature
};