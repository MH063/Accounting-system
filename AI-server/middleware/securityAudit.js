/**
 * 安全审计和合规检查中间件
 * 提供完整的安全审计日志、合规检查和威胁检测功能
 */

const crypto = require('crypto');
const { logger } = require('../config/logger');
const { LogMasking, DataMasking } = require('../utils/encryption');
const { pool } = require('../config/database');

// 审计日志存储
const auditLogs = [];
const COMPLIANCE_RULES = new Map();
const THREAT_DETECTION_PATTERNS = new Map();

/**
 * 安全事件类型定义
 */
const SECURITY_EVENTS = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PERMISSION_DENIED: 'permission_denied',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  FILE_UPLOAD: 'file_upload',
  FILE_DOWNLOAD: 'file_download',
  API_CALL: 'api_call',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  SECURITY_VIOLATION: 'security_violation',
  SYSTEM_ACCESS: 'system_access'
};

/**
 * 合规标准定义
 */
const COMPLIANCE_STANDARDS = {
  GDPR: 'gdpr',
  SOX: 'sox',
  PCI_DSS: 'pci_dss',
  ISO27001: 'iso27001',
  NIST: 'nist'
};

/**
 * 默认合规规则
 */
function initializeComplianceRules() {
  COMPLIANCE_RULES.set('data_retention_policy', {
    standard: COMPLIANCE_STANDARDS.GDPR,
    description: '数据保留策略检查',
    check: (event) => {
      // 检查数据保留期限
      if (event.type === SECURITY_EVENTS.DATA_ACCESS) {
        return {
          compliant: true,
          message: '数据访问符合保留策略'
        };
      }
      return { compliant: true, message: '无需检查' };
    }
  });

  COMPLIANCE_RULES.set('access_control_policy', {
    standard: COMPLIANCE_STANDARDS.SOX,
    description: '访问控制策略检查',
    check: (event) => {
      if (event.type === SECURITY_EVENTS.PERMISSION_DENIED) {
        return {
          compliant: event.user && event.user.role !== 'admin',
          message: event.user && event.user.role !== 'admin' 
            ? '权限控制正常' 
            : '检测到管理员权限异常'
        };
      }
      return { compliant: true, message: '访问控制正常' };
    }
  });

  COMPLIANCE_RULES.set('audit_trail_integrity', {
    standard: COMPLIANCE_STANDARDS.ISO27001,
    description: '审计跟踪完整性检查',
    check: (event) => {
      // 检查审计日志的完整性
      const hasRequiredFields = !!(event.timestamp && event.type && event.userId && event.sourceIp);
      return {
        compliant: hasRequiredFields,
        message: hasRequiredFields ? '审计日志字段完整' : '审计日志字段缺失'
      };
    }
  });
}

/**
 * 严重程度级别映射
 */
const SEVERITY_LEVELS = {
  'low': 0,
  'medium': 1,
  'high': 2,
  'critical': 3
};

/**
 * 默认威胁检测模式
 */
function initializeThreatDetectionPatterns() {
  THREAT_DETECTION_PATTERNS.set('brute_force', {
    name: '暴力破解攻击',
    patterns: [
      /\bfailed_login_\d+\b/i,
      /\bauthentication_failure\b/i
    ],
    threshold: 5, // 5次失败尝试
    timeWindow: 300000, // 5分钟
    severity: 'high',
    action: 'block_ip'
  });

  THREAT_DETECTION_PATTERNS.set('sql_injection', {
    name: 'SQL注入攻击',
    patterns: [
      /\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/i,
      /('|\b0x[0-9a-fA-F]+\b|--|\/\*|\*\/)/i,
      /(\bOR\b\s+.+=\s*.+|\bAND\b\s+.+=\s*.+)/i
    ],
    severity: 'critical',
    action: 'immediate_alert'
  });

  THREAT_DETECTION_PATTERNS.set('xss_attack', {
    name: '跨站脚本攻击',
    patterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/i,
      /on\\w+\\s*=/i,
      /<iframe[^>]*>/gi
    ],
    severity: 'high',
    action: 'sanitize_and_log'
  });

  THREAT_DETECTION_PATTERNS.set('directory_traversal', {
    name: '目录遍历攻击',
    patterns: [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i
    ],
    severity: 'high',
    action: 'block_request'
  });

  THREAT_DETECTION_PATTERNS.set('suspicious_user_agent', {
    name: '可疑User-Agent',
    patterns: [
      /sqlmap/i,
      /nikto|nmap/i,
      /bot|crawler|spider/i
    ],
    severity: 'medium',
    action: 'enhanced_logging'
  });
}

/**
 * 计算事件哈希值
 */
function calculateEventHash(event) {
  const eventString = JSON.stringify({
    timestamp: event.timestamp,
    type: event.type,
    userId: event.userId,
    sourceIp: event.sourceIp,
    resource: event.resource
  });
  
  return crypto.createHash('sha256').update(eventString).digest('hex');
}

/**
 * 记录安全审计事件
 */
function logSecurityEvent(event) {
  try {
    const auditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: event.type,
      userId: event.userId || null,
      sessionId: event.sessionId || null,
      sourceIp: event.sourceIp || 'unknown', // 内部使用原始 IP
      maskedIp: DataMasking.maskIPAddress(event.sourceIp || 'unknown'), // 增加一个脱敏后的 IP 用于日志显示
      userAgent: event.userAgent || '',
      resource: event.resource || '',
      action: event.action || '',
      outcome: event.outcome || 'unknown',
      severity: event.severity || 'low',
      data: event.data ? DataMasking.maskObject(event.data, [
        'password', 'token', 'accessToken', 'refreshToken',
        'idCard', 'bankCard', 'email', 'phone', 'name'
      ]) : null,
      hash: null,
      complianceResults: []
    };

    // 计算事件哈希
    auditEvent.hash = calculateEventHash(auditEvent);

    // 运行合规检查
    auditEvent.complianceResults = runComplianceChecks(auditEvent);

    // 威胁检测
    const threats = detectThreats(auditEvent);
    if (threats.length > 0) {
      auditEvent.threats = threats;
      
      // 找到最高严重级别
      let maxLevel = SEVERITY_LEVELS[auditEvent.severity] || 0;
      let maxSeverity = auditEvent.severity;
      
      threats.forEach(t => {
        const level = SEVERITY_LEVELS[t.severity] || 0;
        if (level > maxLevel) {
          maxLevel = level;
          maxSeverity = t.severity;
        }
      });
      
      auditEvent.severity = maxSeverity;
    }

    // 存储审计日志（限制存储数量）
    auditLogs.push(auditEvent);
    if (auditLogs.length > 10000) {
      auditLogs.shift(); // 移除最旧的记录
    }

    // 异步持久化到数据库
    const persistToDb = async (event) => {
      try {
        // 如果没有 userId，由于数据库约束，我们尝试记录为 null
        // 如果数据库 user_id 是 bigint NOT NULL，插入 null 会失败，这时我们在 catch 中处理
        const userId = event.userId || null;
        
        // 确保 operation 字段有值
        const operation = event.type || event.operation || event.action || 'unknown';

        const queryText = `
          INSERT INTO security_verification_logs 
          (user_id, operation, verification_type, success, reason, ip_address, user_agent, device_info, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        // 确保 ip_address 是有效的。如果 'unknown' 则传 null
        const validIp = (event.sourceIp && event.sourceIp !== 'unknown' && !event.sourceIp.includes('*')) 
          ? event.sourceIp 
          : null;

        const params = [
          userId,
          operation,
          'security_event_log',
          event.outcome === 'success',
          event.action || null,
          validIp,
          event.userAgent,
          JSON.stringify({
            id: event.id,
            resource: event.resource,
            severity: event.severity,
            data: event.data,
            threats: event.threats,
            complianceResults: event.complianceResults,
            hash: event.hash
          }),
          event.timestamp
        ];
        await pool.query(queryText, params);
        console.log(`[SECURITY_AUDIT] 成功持久化安全事件: ${operation}, userId: ${userId}`);
      } catch (dbError) {
        // 这里的错误不应该影响主流程
        if (dbError.message.includes('null value in column "user_id"')) {
          console.warn('[SECURITY_AUDIT] 无法持久化审计日志：user_id 不能为空且当前用户未登录。建议修改数据库表结构使 user_id 允许为空。');
        } else {
          logger.error('[SECURITY_AUDIT] 持久化安全事件到数据库失败:', dbError.message);
        }
      }
    };

    persistToDb(auditEvent);

    // 根据严重级别记录日志
    const displayIp = auditEvent.maskedIp;
    if (auditEvent.severity === 'critical' || auditEvent.severity === 'high') {
      logger.error(`[SECURITY_AUDIT] 严重安全事件: ${auditEvent.type} from ${displayIp}`, auditEvent);
    } else if (auditEvent.severity === 'medium') {
      logger.warn(`[SECURITY_AUDIT] 安全警告: ${auditEvent.type} from ${displayIp}`, auditEvent);
    } else {
      logger.info(`[SECURITY_AUDIT] 安全事件: ${auditEvent.type} from ${displayIp}`, auditEvent);
    }

    // 触发安全响应
    handleSecurityResponse(auditEvent);

    return auditEvent;

  } catch (error) {
    logger.error('[SECURITY_AUDIT] 记录安全事件失败:', error);
    return null;
  }
}

/**
 * 运行合规检查
 */
function runComplianceChecks(event) {
  const results = [];
  
  for (const [ruleName, rule] of COMPLIANCE_RULES) {
    try {
      const result = rule.check(event);
      results.push({
        ruleName,
        standard: rule.standard,
        description: rule.description,
        ...result
      });
    } catch (error) {
      results.push({
        ruleName,
        standard: rule.standard,
        description: rule.description,
        compliant: false,
        message: `合规检查错误: ${error.message}`
      });
    }
  }
  
  return results;
}

/**
 * 威胁检测
 */
function detectThreats(event) {
  const detectedThreats = [];
  
  for (const [patternName, pattern] of THREAT_DETECTION_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(event.userAgent) || 
          regex.test(event.resource) || 
          regex.test(JSON.stringify(event.data || {}))) {
        
        detectedThreats.push({
          pattern: patternName,
          name: pattern.name,
          severity: pattern.severity,
          action: pattern.action
        });
        
        break; // 避免同一事件匹配同一模式多次
      }
    }
  }
  
  return detectedThreats;
}

/**
 * 处理安全响应
 */
function handleSecurityResponse(event) {
  if (event.threats) {
    for (const threat of event.threats) {
      switch (threat.action) {
        case 'block_ip':
          // 触发IP封禁逻辑
          logger.warn(`[SECURITY_AUDIT] 威胁检测 - IP封禁: ${event.sourceIp}, 威胁: ${threat.name}`);
          break;
          
        case 'immediate_alert':
          // 立即告警
          logger.error(`[SECURITY_AUDIT] 立即告警 - ${threat.name}, IP: ${event.sourceIp}`);
          // 这里可以集成邮件、短信、Slack等告警机制
          break;
          
        case 'sanitize_and_log':
          // 清理数据并记录
          logger.warn(`[SECURITY_AUDIT] 数据清理 - ${threat.name}, IP: ${event.sourceIp}`);
          break;
          
        case 'block_request':
          // 阻止请求（需要返回给调用方）
          logger.warn(`[SECURITY_AUDIT] 请求阻止 - ${threat.name}, IP: ${event.sourceIp}`);
          break;
          
        case 'enhanced_logging':
          // 增强日志记录
          logger.warn(`[SECURITY_AUDIT] 增强日志 - ${threat.name}, IP: ${event.sourceIp}`);
          break;
      }
    }
  }
}

/**
 * 安全审计中间件
 */
const securityAudit = (options = {}) => {
  const {
    trackDataAccess = true,
    trackApiCalls = true,
    trackFileOperations = true,
    maskSensitiveData = true,
    complianceStandards = [COMPLIANCE_STANDARDS.GDPR]
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    
    // 添加响应时间跟踪
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // 记录API调用
      if (trackApiCalls) {
        logSecurityEvent({
          type: SECURITY_EVENTS.API_CALL,
          userId: req.user?.id,
          sessionId: req.sessionID,
          sourceIp: req.ip,
          userAgent: req.get('User-Agent'),
          resource: req.path,
          action: req.method,
          outcome: data.success ? 'success' : 'failure',
          severity: data.success ? 'low' : 'medium',
          data: maskSensitiveData ? LogMasking.sanitizeLogMessage(req.body || {}, req.params) : req.body
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * 数据访问审计装饰器
 */
const auditDataAccess = (resource, action) => {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const result = await originalMethod.apply(this, args);
      
      logSecurityEvent({
        type: SECURITY_EVENTS.DATA_ACCESS,
        userId: this.userId || 'system',
        sourceIp: this.sourceIp || 'unknown',
        resource,
        action,
        outcome: result ? 'success' : 'failure',
        severity: 'low',
        data: { method: propertyKey, args: args.slice(0, 3) } // 只记录前3个参数
      });
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * 获取审计日志
 */
function getAuditLogs(options = {}) {
  const {
    startDate,
    endDate,
    userId,
    type,
    severity,
    limit = 100,
    offset = 0
  } = options;

  let filteredLogs = [...auditLogs];

  if (startDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
  }

  if (endDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
  }

  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId);
  }

  if (type) {
    filteredLogs = filteredLogs.filter(log => log.type === type);
  }

  if (severity) {
    filteredLogs = filteredLogs.filter(log => log.severity === severity);
  }

  // 按时间倒序排列
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    logs: filteredLogs.slice(offset, offset + limit),
    total: filteredLogs.length,
    hasMore: offset + limit < filteredLogs.length
  };
}

/**
 * 生成合规报告
 */
function generateComplianceReport(standard = COMPLIANCE_STANDARDS.GDPR) {
  const rules = Array.from(COMPLIANCE_RULES.values()).filter(rule => rule.standard === standard);
  const logs = getAuditLogs({ limit: 1000 }); // 获取最近1000条记录
  
  const complianceResults = {
    standard,
    timestamp: new Date().toISOString(),
    totalRules: rules.length,
    compliantCount: 0,
    nonCompliantCount: 0,
    results: []
  };

  for (const log of logs.logs) {
    for (const result of log.complianceResults || []) {
      if (result.standard === standard) {
        complianceResults.results.push({
          eventId: log.id,
          timestamp: log.timestamp,
          ruleName: result.ruleName,
          compliant: result.compliant,
          message: result.message
        });

        if (result.compliant) {
          complianceResults.compliantCount++;
        } else {
          complianceResults.nonCompliantCount++;
        }
      }
    }
  }

  complianceResults.complianceRate = complianceResults.results.length > 0 
    ? (complianceResults.compliantCount / complianceResults.results.length * 100).toFixed(2)
    : 100;

  return complianceResults;
}

// 初始化
initializeComplianceRules();
initializeThreatDetectionPatterns();

// 定期清理过期的审计日志
setInterval(() => {
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  while (auditLogs.length > 0 && new Date(auditLogs[0].timestamp) < oneYearAgo) {
    auditLogs.shift();
  }
}, 24 * 60 * 60 * 1000); // 每24小时清理一次

module.exports = {
  securityAudit,
  auditDataAccess,
  logSecurityEvent,
  getAuditLogs,
  generateComplianceReport,
  SECURITY_EVENTS,
  COMPLIANCE_STANDARDS
};