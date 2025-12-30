/**
 * 安全审计日志中间件 - 增强版
 * 记录所有安全相关的事件和操作
 * 包括：关键操作日志、登录日志、异常访问记录
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');
const { pool } = require('../../config/database');

// 确保审计日志目录存在
const auditLogDir = path.join(__dirname, '../../logs/audit');
const logsDir = path.join(__dirname, '../../logs');

// 确保主日志目录存在
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 确保审计日志目录存在
if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

// 审计日志文件路径
const auditLogFile = path.join(auditLogDir, 'security-audit.log');
const operationLogFile = path.join(auditLogDir, 'operation-audit.log');
const loginLogFile = path.join(auditLogDir, 'login-audit.log');
const anomalyLogFile = path.join(auditLogDir, 'anomaly-audit.log');

/**
 * 将审计日志持久化到数据库
 * @param {Object} entry - 日志条目
 */
const persistToDatabase = async (entry) => {
  try {
    const {
      userId,
      operationType,
      eventType,
      anomalyType,
      ip,
      userAgent,
      method,
      url,
      operationData,
      loginData,
      anomalyData,
      eventData,
      severity
    } = entry;

    // 提取状态码和响应时间，可能在顶层也可能在 nested data 中
    const statusCode = entry.statusCode || (operationData?.statusCode) || (loginData?.statusCode) || (anomalyData?.statusCode) || (eventData?.statusCode);
    const responseTime = entry.responseTime || (operationData?.responseTime) || (loginData?.responseTime) || (anomalyData?.responseTime) || (eventData?.responseTime);
    const success = entry.success !== undefined ? entry.success : 
                   (operationData?.success !== undefined ? operationData.success : 
                   (loginData?.success !== undefined ? loginData.success : 
                   (eventData?.success !== undefined ? eventData.success : undefined)));

    // 确定动作名称：优先使用 operationType 或 anomalyType，如果没有则使用 url，最后才使用 eventType
    const action = operationType || anomalyType || url || eventType;
    const finalSuccess = success !== undefined ? success : (statusCode ? statusCode < 400 : true);
    const finalSeverity = severity || (anomalyType ? 'warning' : 'info');

    // 映射操作类型到数据库支持的 INSERT/UPDATE/DELETE
    let dbOperation = 'INSERT'; // 默认
    if (method === 'PUT' || method === 'PATCH') dbOperation = 'UPDATE';
    if (method === 'DELETE') dbOperation = 'DELETE';

    // 确定表名：尝试从 URL 中提取，默认为 system
    let tableName = 'system';
    const pathParts = url.split('/').filter(part => part && part !== 'api');
    if (pathParts.length > 0) {
      // 如果第一个部分是 auth，通常是 users 表
      if (pathParts[0] === 'auth') {
        tableName = 'users';
      } else {
        // 否则取第一个路径部分作为表名候选
        tableName = pathParts[0];
      }
    }

    const queryText = `
      INSERT INTO audit_logs (
        table_name,
        operation,
        record_id,
        user_id,
        ip_address,
        user_agent,
        action,
        success,
        response_status,
        severity,
        new_values,
        response_time,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `;

    const values = [
      tableName,
      dbOperation,
      0, // record_id
      userId || null,
      (ip && ip !== '::1' && ip !== '127.0.0.1') ? ip : null,
      userAgent,
      action,
      finalSuccess,
      statusCode || null,
      finalSeverity,
      JSON.stringify(operationData || loginData || anomalyData || eventData || {}),
      responseTime || null
    ];

    await pool.query(queryText, values);
    console.log(`[AUDIT_DB] 成功持久化审计日志: ${action}`);
  } catch (error) {
    // 这里的错误不应该影响主流程，但我们应该记录它
    console.error('[AUDIT_DB] 持久化审计日志到数据库失败:', error.message);
  }
};

/**
 * 记录关键操作日志
 * @param {Object} req - 请求对象
 * @param {string} operationType - 操作类型
 * @param {Object} operationData - 操作数据
 */
const logOperation = (req, operationType, operationData = {}) => {
  try {
    const operationEntry = {
      timestamp: new Date().toISOString(),
      operationType,
      userId: req.user?.id || null,
      username: req.user?.username || null,
      userRole: req.user?.role || null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      method: req.method,
      url: req.originalUrl,
      operationData
    };

    // 写入操作日志文件
    fs.appendFileSync(operationLogFile, JSON.stringify(operationEntry) + '\n');
    
    // 持久化到数据库
    persistToDatabase(operationEntry);
    
    // 同时记录到常规日志
    logger.audit(req, `关键操作: ${operationType}`, operationData);
  } catch (error) {
    logger.error('[AUDIT] 操作日志记录失败:', error);
  }
};

/**
 * 记录登录日志
 * @param {Object} req - 请求对象
 * @param {string} eventType - 事件类型
 * @param {Object} loginData - 登录数据
 */
const logLogin = (req, eventType, loginData = {}) => {
  try {
    const loginEntry = {
      timestamp: new Date().toISOString(),
      eventType, // 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE'
      userId: req.user?.id || null,
      username: req.user?.username || loginData.username || null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      method: req.method,
      url: req.originalUrl,
      loginData
    };

    // 写入登录日志文件
    fs.appendFileSync(loginLogFile, JSON.stringify(loginEntry) + '\n');
    
    // 持久化到数据库
    persistToDatabase(loginEntry);
    
    // 同时记录到认证日志
    logger.auth(`登录事件: ${eventType}`, loginData);
  } catch (error) {
    logger.error('[AUDIT] 登录日志记录失败:', error);
  }
};

/**
 * 记录异常访问
 * @param {Object} req - 请求对象
 * @param {string} anomalyType - 异常类型
 * @param {Object} anomalyData - 异常数据
 */
const logAnomaly = (req, anomalyType, anomalyData = {}) => {
  try {
    const anomalyEntry = {
      timestamp: new Date().toISOString(),
      anomalyType, // 'UNUSUAL_LOGIN_PATTERN', 'FREQUENT_FAILED_LOGIN', 'SUSPICIOUS_IP', 'PRIVILEGE_ESCALATION'
      userId: req.user?.id || null,
      username: req.user?.username || null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      method: req.method,
      url: req.originalUrl,
      anomalyData
    };

    // 写入异常日志文件
    fs.appendFileSync(anomalyLogFile, JSON.stringify(anomalyEntry) + '\n');
    
    // 持久化到数据库
    persistToDatabase({ ...anomalyEntry, severity: 'warning' });
    
    // 同时记录到安全日志
    logger.security(req, `异常访问: ${anomalyType}`, anomalyData);
  } catch (error) {
    logger.error('[AUDIT] 异常日志记录失败:', error);
  }
};

/**
 * 安全审计日志记录器
 * @param {Object} req - 请求对象
 * @param {string} eventType - 事件类型
 * @param {Object} eventData - 事件数据
 */
const logSecurityEvent = (req, eventType, eventData = {}) => {
  try {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      method: req.method,
      url: req.originalUrl,
      eventData
    };

    // 写入审计日志文件
    fs.appendFileSync(auditLogFile, JSON.stringify(auditEntry) + '\n');
    
    // 持久化到数据库
    persistToDatabase(auditEntry);
    
    // 同时记录到常规日志
    logger.security(req, `安全审计事件: ${eventType}`, eventData);
  } catch (error) {
    logger.error('[AUDIT] 审计日志记录失败:', error);
  }
};

/**
 * 检测异常访问模式
 * @param {Object} req - 请求对象
 * @returns {boolean} 是否为异常访问
 */
const detectAnomaly = (req) => {
  const currentTime = new Date();
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  // 检测爬虫或机器人访问
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /postman/i, /http/i
  ];
  
  const isBotRequest = botPatterns.some(pattern => pattern.test(userAgent));
  if (isBotRequest) {
    logAnomaly(req, 'POTENTIAL_BOT_ACCESS', {
      userAgent,
      reason: '检测到机器人模式访问'
    });
    return true;
  }
  
  // 检测异常请求频率（简单实现）
  // 在实际项目中应该使用Redis等缓存来统计请求频率
  
  return false;
};

/**
 * 增强版安全审计中间件
 * @returns {Function} Express中间件
 */
const enhancedSecurityAuditMiddleware = () => {
  return (req, res, next) => {
    // 忽略心跳请求的审计日志，因为 AuthController 已经手动记录了更精确的信息
    if (req.path.includes('/heartbeat')) {
      return next();
    }

    // 记录请求开始时间
    const startTime = Date.now();
    
    // 检测异常访问
    const isAnomalous = detectAnomaly(req);
    
    // 监听响应结束事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // 记录请求审计信息
      logSecurityEvent(req, 'REQUEST_PROCESSED', {
        statusCode,
        responseTime: duration,
        contentType: res.get('Content-Type') || '',
        isAnomalous
      });
      
      // 记录异常状态码
      if (statusCode >= 400) {
        logAnomaly(req, 'HTTP_ERROR_RESPONSE', {
          statusCode,
          responseTime: duration,
          reason: `返回错误状态码 ${statusCode}`
        });
      }
      
      // 记录慢请求
      if (duration > 5000) {
        logAnomaly(req, 'SLOW_REQUEST', {
          responseTime: duration,
          statusCode,
          reason: '请求响应时间超过5秒'
        });
      }
    });
    
    // 记录请求开始
    logSecurityEvent(req, 'REQUEST_RECEIVED', {
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    next();
  };
};

/**
 * 关键操作记录中间件
 * @param {string} operationType - 操作类型
 * @returns {Function} Express中间件
 */
const operationLogger = (operationType) => {
  return (req, res, next) => {
    // 记录关键操作开始
    logOperation(req, `OPERATION_START: ${operationType}`, {
      timestamp: new Date().toISOString()
    });
    
    // 监听操作完成
    res.on('finish', () => {
      logOperation(req, `OPERATION_COMPLETE: ${operationType}`, {
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });
    });
    
    next();
  };
};

/**
 * 登录监控中间件
 * @returns {Function} Express中间件
 */
const loginMonitor = () => {
  return (req, res, next) => {
    // 如果是登录相关的请求，排除心跳
    if (req.path.includes('/auth/') && !req.path.includes('/heartbeat') && ['POST', 'PUT'].includes(req.method)) {
      // 在响应后记录登录事件
      res.on('finish', () => {
        const eventType = req.path.includes('login') ? 'LOGIN_ATTEMPT' : 'AUTH_OPERATION';
        
        logLogin(req, eventType, {
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          body: req.body
        });
      });
    }
    
    next();
  };
};

module.exports = {
  logSecurityEvent,
  logOperation,
  logLogin,
  logAnomaly,
  securityAuditMiddleware: enhancedSecurityAuditMiddleware,
  operationLogger,
  loginMonitor,
  detectAnomaly
};