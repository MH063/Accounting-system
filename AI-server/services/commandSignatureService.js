/**
 * 重启指令签名服务
 * 用于生成和验证重启指令的签名，确保指令安全性和完整性
 */

const crypto = require('crypto');
const logger = require('../config/logger');

const SIGNATURE_ALGORITHM = 'sha256';
const HMAC_ALGORITHM = 'sha256';
const COMMAND_TTL = 300000;

const SIGNATURE_SECRET = process.env.COMMAND_SIGNATURE_SECRET || 'jzb_client_restart_secret_2024';

/**
 * 生成重启指令签名
 * @param {Object} command 重启指令对象
 * @returns {string} HMAC签名
 */
function generateCommandSignature(command) {
  try {
    const timestamp = command.timestamp || new Date().toISOString();
    const commandData = {
      command_id: command.command_id,
      type: command.type,
      client_id: command.client_id,
      timestamp: timestamp,
      parameters: command.parameters || {}
    };

    const dataString = JSON.stringify(commandData);
    const signature = crypto
      .createHmac(HMAC_ALGORITHM, SIGNATURE_SECRET)
      .update(dataString)
      .digest('hex');

    logger.debug('[CommandSignature] 签名生成成功', {
      commandId: command.command_id,
      signatureLength: signature.length
    });

    return signature;
  } catch (error) {
    logger.error('[CommandSignature] 签名生成失败:', error);
    throw error;
  }
}

/**
 * 验证重启指令签名
 * @param {Object} command 重启指令对象
 * @param {string} signature 要验证的签名
 * @returns {Object} 验证结果
 */
function verifyCommandSignature(command, signature) {
  try {
    if (!command || !signature) {
      return {
        valid: false,
        error: '指令或签名不能为空'
      };
    }

    const expectedSignature = generateCommandSignature(command);
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      logger.warn('[CommandSignature] 签名验证失败: 签名不匹配', {
        commandId: command.command_id
      });
      return {
        valid: false,
        error: '签名验证失败'
      };
    }

    return {
      valid: true,
      command
    };
  } catch (error) {
    if (error instanceof RangeError) {
      return {
        valid: false,
        error: '签名格式无效'
      };
    }
    logger.error('[CommandSignature] 签名验证异常:', error);
    return {
      valid: false,
      error: '签名验证异常'
    };
  }
}

/**
 * 检查指令是否过期
 * @param {string} timestamp 指令时间戳
 * @param {number} ttl 有效期（毫秒）
 * @returns {boolean} 是否过期
 */
function isCommandExpired(timestamp, ttl = COMMAND_TTL) {
  try {
    const commandTime = new Date(timestamp).getTime();
    const now = Date.now();
    const elapsed = now - commandTime;

    if (elapsed > ttl) {
      logger.warn('[CommandSignature] 指令已过期', {
        commandTime: timestamp,
        elapsed: `${elapsed}ms`,
        ttl: `${ttl}ms`
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('[CommandSignature] 时间解析失败:', error);
    return true;
  }
}

/**
 * 生成唯一指令ID
 * @returns {string} 指令ID
 */
function generateCommandId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `restart_${timestamp}_${random}`;
}

/**
 * 创建重启指令对象
 * @param {Object} options 指令选项
 * @returns {Object} 完整的重启指令
 */
function createRestartCommand(options = {}) {
  const timestamp = new Date().toISOString();
  const commandId = generateCommandId();

  const command = {
    command_id: commandId,
    type: 'RESTART_SERVICE',
    client_id: options.client_id || 'all',
    timestamp: timestamp,
    parameters: {
      mode: options.mode || 'graceful',
      delay_seconds: options.delay_seconds || 0,
      save_state: options.save_state !== false,
      notify_user: options.notify_user !== false,
      force_kill_timeout: options.force_kill_timeout || 30,
      ...options.parameters
    },
    initiated_by: options.initiatedBy || 'admin',
    reason: options.reason || '管理员手动重启'
  };

  const signature = generateCommandSignature(command);

  return {
    ...command,
    signature: signature
  };
}

/**
 * 验证并解析重启指令
 * @param {Object} input 输入的指令
 * @returns {Object} 验证后的指令
 */
function validateRestartCommand(input) {
  const { signature, ...commandData } = input;

  if (!signature) {
    return {
      valid: false,
      error: '缺少指令签名'
    };
  }

  const signatureResult = verifyCommandSignature(commandData, signature);
  if (!signatureResult.valid) {
    return signatureResult;
  }

  if (isCommandExpired(commandData.timestamp)) {
    return {
      valid: false,
      error: '指令已过期'
    };
  }

  if (commandData.type !== 'RESTART_SERVICE') {
    return {
      valid: false,
      error: '无效的指令类型'
    };
  }

  const validModes = ['immediate', 'graceful', 'delayed'];
  const mode = commandData.parameters?.mode;
  if (mode && !validModes.includes(mode)) {
    return {
      valid: false,
      error: `无效的重启模式: ${mode}`
    };
  }

  return {
    valid: true,
    command: {
      ...commandData,
      signature
    }
  };
}

module.exports = {
  generateCommandSignature,
  verifyCommandSignature,
  isCommandExpired,
  generateCommandId,
  createRestartCommand,
  validateRestartCommand,
  SIGNATURE_ALGORITHM,
  HMAC_ALGORITHM,
  COMMAND_TTL,
  SIGNATURE_SECRET
};
