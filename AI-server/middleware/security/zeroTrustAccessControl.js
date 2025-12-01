/**
 * 零信任访问控制中间件
 * 实现基于零信任原则的动态访问控制
 */

const logger = require('../../config/logger');
const { verifyToken } = require('../../config/jwtManager');
const { NetworkMicrosegmentation, ApplicationMicrosegmentation, DataMicrosegmentation } = require('./microsegmentation');

// 检查是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

// 初始化微隔离组件
// 在开发环境中放宽网络微隔离策略
const networkSegmentation = new NetworkMicrosegmentation({
  allowedConnections: [
    { source: 'frontend', target: 'api-server', protocol: 'https' },
    { source: 'api-server', target: 'database', protocol: 'tcp' },
    { source: '*', target: 'api-server', protocol: 'https' },
    // 在开发环境中允许HTTP请求和本地访问
    ...(isDevelopment ? [
      { source: '*', target: 'api-server', protocol: 'http' },
      { source: 'localhost', target: 'api-server', protocol: '*' },
      { source: '127.0.0.1', target: 'api-server', protocol: '*' }
    ] : [])
  ],
  defaultPolicy: isDevelopment ? 'allow' : 'deny'
});

const appSegmentation = new ApplicationMicrosegmentation({
  modulePermissions: {
    'financial': {
      roles: {
        'admin': ['read', 'write', 'delete'],
        'accountant': ['read', 'write'],
        'viewer': ['read']
      },
      defaultPolicy: 'deny'
    },
    'user-management': {
      roles: {
        'admin': ['read', 'write', 'delete'],
        'manager': ['read', 'write']
      },
      defaultPolicy: 'deny'
    },
    'reports': {
      roles: {
        'admin': ['read', 'write', 'delete'],
        'accountant': ['read', 'write'],
        'viewer': ['read']
      },
      defaultPolicy: 'deny'
    }
  },
  defaultPolicy: 'deny'
});

const dataSegmentation = new DataMicrosegmentation({
  dataPermissions: {
    'sensitive': {
      roles: {
        'admin': ['read', 'write', 'delete'],
        'accountant': ['read']
      },
      defaultPolicy: 'deny'
    },
    'financial-data': {
      roles: {
        'admin': ['read', 'write', 'delete'],
        'accountant': ['read', 'write'],
        'viewer': ['read']
      },
      defaultPolicy: 'deny'
    }
  },
  defaultPolicy: 'deny'
});

/**
 * 零信任访问控制中间件
 * @param {Array} requiredPermissions - 所需权限列表
 * @param {Object} options - 访问控制选项
 * @returns {Function} 中间件函数
 */
const zeroTrustAccessControl = (requiredPermissions = [], options = {}) => {
  const {
    enforceMFA = false,           // 是否强制多因素认证
    checkDeviceCompliance = false, // 是否检查设备合规性
    allowLocalhost = false,       // 是否允许本地访问
    logAccess = true,             // 是否记录访问日志
    moduleName = null,            // 模块名称（用于应用微隔离）
    action = 'read'               // 操作类型
  } = options;

  return async (req, res, next) => {
    try {
      // 1. 验证身份令牌
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        logger.security(req, '零信任访问拒绝', { 
          reason: '缺少认证令牌',
          requiredPermissions,
          timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({
          success: false,
          message: '访问令牌缺失，请先登录'
        });
      }

      // 2. 验证令牌有效性
      const decoded = verifyToken(token);
      if (!decoded) {
        logger.security(req, '零信任访问拒绝', { 
          reason: '无效或过期的令牌',
          timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({
          success: false,
          message: '认证令牌无效或已过期'
        });
      }

      // 3. 检查多因素认证（如果强制要求）
      if (enforceMFA && !decoded.mfaVerified) {
        logger.security(req, '零信任访问拒绝', { 
          reason: '需要多因素认证',
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          success: false,
          message: '此资源需要多因素认证'
        });
      }

      // 4. 网络微隔离检查
      const sourceService = req.headers['x-service-name'] || (isDevelopment ? 'localhost' : 'external');
      const targetService = process.env.SERVICE_NAME || 'api-server';
      
      if (!networkSegmentation.isConnectionAllowed(sourceService, targetService, req.protocol)) {
        logger.security(req, '零信任访问拒绝', { 
          reason: '网络微隔离策略拦截',
          sourceService,
          targetService,
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          success: false,
          message: '网络访问被微隔离策略拦截'
        });
      }

      // 5. 应用微隔离检查（如果有指定模块）
      if (moduleName) {
        const userRole = decoded.role || 'guest';
        if (!appSegmentation.isModuleAccessAllowed(userRole, moduleName, action)) {
          logger.security(req, '零信任访问拒绝', { 
            reason: '应用微隔离策略拦截',
            moduleName,
            action,
            userRole,
            timestamp: new Date().toISOString()
          });
          
          return res.status(403).json({
            success: false,
            message: '模块访问被应用微隔离策略拦截'
          });
        }
      }

      // 6. 权限检查
      const userPermissions = decoded.permissions || [];
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        logger.security(req, '零信任访问拒绝', { 
          reason: '权限不足',
          requiredPermissions,
          userPermissions,
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          success: false,
          message: '权限不足，无法访问此资源'
        });
      }

      // 7. 设置用户信息到请求对象
      req.user = decoded;
      req.accessContext = {
        authenticatedAt: new Date().toISOString(),
        permissions: userPermissions,
        mfaVerified: decoded.mfaVerified || false,
        sourceService,
        targetService
      };

      // 8. 记录访问日志
      if (logAccess) {
        logger.security(req, '零信任访问通过', {
          requiredPermissions,
          userPermissions,
          moduleName,
          action,
          timestamp: new Date().toISOString()
        });
      }

      // 9. 继续处理请求
      next();
    } catch (error) {
      logger.error('[ZERO_TRUST] 访问控制处理错误:', error);
      
      res.status(500).json({
        success: false,
        message: '访问控制检查过程中发生错误'
      });
    }
  };
};

/**
 * 动态访问控制中间件
 * 根据上下文动态调整访问控制策略
 */
const dynamicAccessControl = (options = {}) => {
  const {
    riskThreshold = 0.7,         // 风险阈值
    adaptiveTimeout = 300000,     // 自适应超时时间（5分钟）
    enableBehaviorAnalysis = true // 是否启用行为分析
  } = options;

  return async (req, res, next) => {
    try {
      // 获取用户风险评分（简化实现）
      const userRiskScore = calculateUserRiskScore(req);
      
      // 如果风险评分超过阈值，应用额外的安全措施
      if (userRiskScore > riskThreshold) {
        logger.security(req, '高风险访问检测', {
          riskScore: userRiskScore,
          threshold: riskThreshold,
          timestamp: new Date().toISOString()
        });

        // 对高风险访问应用更严格的控制
        const strictOptions = {
          ...options,
          enforceMFA: true,
          checkDeviceCompliance: true
        };
        
        // 应用零信任访问控制
        return zeroTrustAccessControl([], strictOptions)(req, res, next);
      }

      // 正常情况下应用标准的零信任访问控制
      zeroTrustAccessControl([], options)(req, res, next);
    } catch (error) {
      logger.error('[DYNAMIC_ACCESS] 动态访问控制处理错误:', error);
      next(error);
    }
  };
};

/**
 * 计算用户风险评分（简化实现）
 * @param {Object} req - 请求对象
 * @returns {number} 风险评分（0-1）
 */
const calculateUserRiskScore = (req) => {
  let score = 0;
  
  // 基于IP地址的风险评估
  const ip = req.ip || req.connection.remoteAddress;
  if (ip && suspiciousIPs.has(ip)) {
    score += 0.3;
  }
  
  // 基于访问频率的风险评估
  const now = Date.now();
  const recentRequests = requestHistory.filter(entry => 
    entry.ip === ip && (now - entry.timestamp) < 300000 // 5分钟内
  );
  
  if (recentRequests.length > 50) {
    score += 0.2;
  } else if (recentRequests.length > 20) {
    score += 0.1;
  }
  
  // 基于地理位置的风险评估（简化）
  if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].includes(',')) {
    score += 0.1; // 多层代理可能表示异常
  }
  
  // 确保评分不超过1
  return Math.min(score, 1);
};

// 简化的可疑IP集合和请求历史（实际应用中应使用数据库存储）
const suspiciousIPs = new Set(['192.168.1.100', '10.0.0.50']);
const requestHistory = [];

// 记录请求历史（用于行为分析）
const recordRequest = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  requestHistory.push({
    ip,
    timestamp: Date.now(),
    userAgent: req.get('User-Agent') || '',
    method: req.method,
    url: req.originalUrl
  });
  
  // 清理过期的历史记录
  const cutoff = Date.now() - 3600000; // 1小时前
  while (requestHistory.length > 0 && requestHistory[0].timestamp < cutoff) {
    requestHistory.shift();
  }
};

module.exports = {
  zeroTrustAccessControl,
  dynamicAccessControl,
  networkSegmentation,
  appSegmentation,
  dataSegmentation,
  recordRequest
};