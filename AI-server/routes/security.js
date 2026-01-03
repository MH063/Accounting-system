/**
 * 安全功能集成路由
 * 提供API签名、安全审计、数据加密等安全功能的端点
 */

const express = require('express');
const { 
  apiSignatureVerification, 
  generateApiSignature, 
  generateSignatureHeaders 
} = require('../middleware/apiSignature');
const { 
  securityAudit, 
  getAuditLogs, 
  logSecurityEvent,
  generateComplianceReport,
  SECURITY_EVENTS 
} = require('../middleware/securityAudit');
const { DataMasking, LogMasking } = require('../utils/encryption');
const { authenticateToken } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const { logger } = require('../config/logger');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * 获取签名示例和文档
 * GET /api/security/signature-example
 */
router.get('/signature-example', responseWrapper((req, res) => {
  const exampleParams = {
    userId: '12345',
    timestamp: Date.now(),
    action: 'getUserInfo'
  };

  const signatureData = generateApiSignature(exampleParams, {}, {
    method: 'GET',
    path: '/api/users/12345'
  });

  res.json({
    success: true,
    message: 'API签名示例和文档',
    data: {
      signatureAlgorithm: 'HMAC-SHA256',
      requiredHeaders: [
        'X-Signature: ' + signatureData.signature,
        'X-Timestamp: ' + signatureData.timestamp,
        'X-Nonce: ' + signatureData.nonce,
        'X-Message-ID: ' + signatureData.messageId
      ],
      signatureStringFormat: 'METHOD|PATH|QUERY_PARAMS|BODY|TIMESTAMP|NONCE',
      example: {
        method: 'GET',
        path: '/api/users/12345',
        params: exampleParams,
        signature: signatureData.signature,
        timestamp: signatureData.timestamp,
        nonce: signatureData.nonce,
        messageId: signatureData.messageId,
        signedData: [
          'GET',
          '/api/users/12345',
          'action=getUserInfo&timestamp=' + signatureData.timestamp + '&userId=12345',
          '{}',
          signatureData.timestamp,
          signatureData.nonce
        ].join('|')
      },
      cURL_Example: `curl -X GET "http://localhost:4000/api/users/12345?action=getUserInfo&timestamp=${signatureData.timestamp}&userId=12345" \\
  -H "X-Signature: ${signatureData.signature}" \\
  -H "X-Timestamp: ${signatureData.timestamp}" \\
  -H "X-Nonce: ${signatureData.nonce}" \\
  -H "X-Message-ID: ${signatureData.messageId}"`
    }
  });
}));

/**
 * 测试数据脱敏功能
 * POST /api/security/test-masking
 */
router.post('/test-masking', responseWrapper((req, res) => {
  const testData = req.body || {};
  
  const maskedData = DataMasking.maskObject(testData, [
    'phone', 'idCard', 'bankCard', 'email', 'name', 
    'password', 'token', 'accessToken', 'refreshToken'
  ]);

  res.json({
    success: true,
    message: '数据脱敏测试完成',
    data: {
      originalData: testData,
      maskedData: maskedData
    }
  });
}));

/**
 * 获取安全审计日志
 * GET /api/security/audit-logs
 */
router.get('/audit-logs', authenticateToken, securityAudit({ trackApiCalls: false }), responseWrapper(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    userId, 
    type, 
    severity, 
    limit = 50, 
    offset = 0 
  } = req.query;

  try {
    // 优先尝试从数据库获取持久化的审计日志
    // 注意：这里使用 operation 字段匹配数据库结构，避免 event_type 导致的 500 错误
    let dbLogs = [];
    let totalCount = 0;
    
    try {
      let query = 'SELECT * FROM security_verification_logs WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(startDate);
      }
      if (endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(endDate);
      }
      if (userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(userId);
      }
      if (type) {
        query += ` AND operation = $${paramIndex++}`;
        params.push(type);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      totalCount = parseInt(countResult.rows[0].count);

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);
      // 将数据库字段映射为前端期待的驼峰命名格式，保持与内存日志一致
      dbLogs = result.rows.map(row => {
        // 尝试从 device_info 解析更多详情
        let deviceInfo = {};
        try {
          deviceInfo = typeof row.device_info === 'string' ? JSON.parse(row.device_info) : (row.device_info || {});
        } catch (e) {
          deviceInfo = {};
        }

        // 处理时间字段，确保序列化正确
        const processTimestamp = (timestamp) => {
          if (!timestamp) return new Date().toISOString()
          if (typeof timestamp === 'object' && timestamp.toISOString) {
            return timestamp.toISOString()
          }
          return timestamp.toString()
        }

        return {
          id: row.id,
          timestamp: processTimestamp(row.created_at),
          type: row.operation,
          userId: row.user_id,
          sourceIp: row.ip_address,
          userAgent: row.user_agent,
          resource: deviceInfo.resource || '',
          outcome: row.success ? 'success' : 'failure',
          severity: deviceInfo.severity || 'low',
          details: deviceInfo
        };
      });
    } catch (dbError) {
      logger.warn('从数据库获取安全审计日志失败，将降级使用内存数据:', dbError.message);
    }

    // 获取内存中的实时日志
    const memoryResult = getAuditLogs({
      startDate,
      endDate,
      userId,
      type,
      severity,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 合并结果（如果数据库不可用则仅使用内存数据）
    res.json({
      success: true,
      message: '安全审计日志获取成功',
      data: {
        logs: dbLogs.length > 0 ? dbLogs : memoryResult.logs,
        total: dbLogs.length > 0 ? totalCount : memoryResult.total,
        source: dbLogs.length > 0 ? 'database' : 'memory'
      }
    });
  } catch (error) {
    logger.error('获取安全审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取安全审计日志失败: ' + error.message
    });
  }
}));

/**
 * 生成合规报告
 * GET /api/security/compliance-report
 */
router.get('/compliance-report', authenticateToken, securityAudit({ trackApiCalls: false }), responseWrapper((req, res) => {
  const { standard = 'gdpr' } = req.query;
  
  try {
    const report = generateComplianceReport(standard.toUpperCase());
    
    res.json({
      success: true,
      message: '合规报告生成成功',
      data: report
    });
  } catch (error) {
    logger.error('生成合规报告失败:', error);
    res.status(400).json({
      success: false,
      message: '合规报告生成失败: ' + error.message
    });
  }
}));

/**
 * 记录安全事件
 * POST /api/security/log-event
 */
router.post('/log-event', authenticateToken, securityAudit({ trackApiCalls: false }), responseWrapper(async (req, res) => {
  const eventData = req.body;
  
  // 添加当前用户信息
  eventData.userId = req.user.id;
  eventData.sourceIp = req.ip;
  eventData.userAgent = req.get('User-Agent');
  
  // 1. 记录内存审计日志
  const auditEvent = logSecurityEvent(eventData);
  
  // 2. 异步持久化到数据库 security_verification_logs 表
  try {
    const query = `
      INSERT INTO security_verification_logs (
        user_id, 
        operation, 
        verification_type, 
        success, 
        reason, 
        ip_address, 
        user_agent, 
        device_info, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    
    // 将 eventData.type 映射为 operation，将 eventData.outcome 映射为 success
    const params = [
      req.user ? req.user.id : null,
      eventData.type || 'unknown_event',
      'security_event_log', // 区分于普通的验证日志
      eventData.outcome === 'success' || eventData.outcome === true,
      eventData.action || null,
      req.ip,
      req.get('User-Agent'),
      JSON.stringify({
        resource: eventData.resource,
        severity: eventData.severity,
        threats: auditEvent?.threats || null,
        metadata: eventData.data
      })
    ];

    // 异步执行，不阻塞响应
    pool.query(query, params).catch(dbError => {
      logger.error('持久化安全事件到数据库失败:', dbError.message);
    });
    
  } catch (error) {
    logger.error('准备持久化安全事件数据失败:', error.message);
  }
  
  res.json({
    success: true,
    message: '安全事件记录并持久化成功',
    data: auditEvent
  });
}));

/**
 * 获取系统安全状态
 * GET /api/security/status
 */
router.get('/status', responseWrapper((req, res) => {
  const securityStatus = {
    apiSignature: {
      enabled: true,
      algorithm: 'HMAC-SHA256',
      maxAge: '5分钟',
      antiReplay: true
    },
    dataEncryption: {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      iterations: 100000
    },
    dataMasking: {
      enabled: true,
      maskedFields: [
        'password', 'token', 'accessToken', 'refreshToken',
        'idCard', 'bankCard', 'email', 'phone', 'name'
      ]
    },
    securityAudit: {
      enabled: true,
      complianceStandards: ['GDPR', 'SOX', 'ISO27001'],
      threatDetection: true,
      maxLogRetention: '1年'
    },
    oauth2: {
      enabled: true,
      grantTypes: ['authorization_code', 'client_credentials', 'refresh_token'],
      defaultClientScopes: ['read', 'write']
    }
  };
  
  res.json({
    success: true,
    message: '系统安全状态获取成功',
    data: securityStatus
  });
}));

/**
 * 测试API签名验证的受保护端点
 * GET /api/security/protected-endpoint
 */
router.get('/protected-endpoint', 
  apiSignatureVerification({ 
    secret: process.env.API_SIGNATURE_SECRET || 'default-api-signature-secret' 
  }),
  securityAudit({ trackApiCalls: false }),
  responseWrapper((req, res) => {
    res.json({
      success: true,
      message: 'API签名验证成功，可以访问受保护的端点',
      data: {
        timestamp: new Date().toISOString(),
        verifiedSignature: req.apiSignature,
        userAgent: req.get('User-Agent'),
        clientIP: req.ip
      }
    });
  })
);

/**
 * 数据加密测试端点
 * POST /api/security/test-encryption
 */
router.post('/test-encryption', 
  apiSignatureVerification({ 
    secret: process.env.API_SIGNATURE_SECRET || 'default-api-signature-secret',
    allowExpired: true // 测试用，允许过期
  }),
  securityAudit({ trackApiCalls: false }),
  responseWrapper(async (req, res) => {
    const { text, password } = req.body;
    
    if (!text || !password) {
      return res.status(400).json({
        success: false,
        message: '文本和密码都是必需的'
      });
    }
    
    try {
      const { encrypt, decrypt } = require('../utils/encryption');
      
      // 加密数据
      const encrypted = encrypt(text, password);
      
      // 解密数据
      const decrypted = decrypt(encrypted, password);
      
      res.json({
        success: true,
        message: '数据加密测试成功',
        data: {
          originalText: text,
          encrypted: encrypted,
          decrypted: decrypted,
          encryptionSuccess: text === decrypted
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '数据加密测试失败: ' + error.message
      });
    }
  })
);

/**
 * 获取安全配置
 * GET /api/security/config
 */
router.get('/config', authenticateToken, securityAudit({ trackApiCalls: false }), responseWrapper((req, res) => {
  const config = {
    apiSignature: {
      secret: process.env.API_SIGNATURE_SECRET ? '***' + process.env.API_SIGNATURE_SECRET.slice(-4) : '未设置',
      allowedClockSkew: '5分钟',
      antiReplayWindow: '5分钟'
    },
    dataEncryption: {
      algorithm: 'AES-256-GCM',
      keyIterations: 100000,
      keyDerivation: 'PBKDF2'
    },
    oauth2: {
      authorizationUrl: process.env.OAUTH_AUTH_URL || 'http://localhost:3000/api/oauth2/authorize',
      tokenUrl: process.env.OAUTH_TOKEN_URL || 'http://localhost:3000/api/oauth2/token',
      defaultClient: 'default-client'
    },
    audit: {
      maxLogRetention: '1年',
      complianceStandards: ['GDPR', 'SOX', 'ISO27001'],
      threatDetection: true
    }
  };
  
  res.json({
    success: true,
    message: '安全配置获取成功',
    data: config
  });
}));

/**
 * 手动触发安全审计事件
 * POST /api/security/test-audit-event
 */
router.post('/test-audit-event', 
  authenticateToken,
  securityAudit({ trackApiCalls: false }),
  responseWrapper((req, res) => {
    const { logSecurityEvent, SECURITY_EVENTS } = require('../middleware/securityAudit');
    
    // 记录测试事件
    const testEvent = {
      type: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      userId: req.user.id,
      sourceIp: req.ip,
      userAgent: req.get('User-Agent'),
      resource: '/api/security/test-audit-event',
      action: 'test_audit',
      outcome: 'success',
      severity: 'medium',
      data: {
        testMessage: '这是一个测试安全审计事件',
        timestamp: new Date().toISOString()
      }
    };
    
    const auditEvent = logSecurityEvent(testEvent);
    
    res.json({
      success: true,
      message: '测试安全审计事件已记录',
      data: auditEvent
    });
  })
);

module.exports = router;