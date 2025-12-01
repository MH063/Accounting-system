/**
 * 行为分析中间件
 * 集成用户行为分析和异常检测功能
 */

const { UserBehaviorAnalyzer, RealTimeAnomalyDetector, AdvancedAnomalyDetector, RealTimeMonitor } = require('./behaviorAnalysis');
const logger = require('../../config/logger');

// 初始化行为分析器
const behaviorAnalyzer = new UserBehaviorAnalyzer({
  baselineWindow: 86400000, // 24小时
  anomalyThreshold: 2.5,
  minObservations: 10
});

// 初始化高级异常检测器
const advancedAnomalyDetector = new AdvancedAnomalyDetector({
  statistical: { threshold: 2.5 },
  mlBased: { threshold: 0.7 },
  ruleBased: { threshold: 0.5 },
  ensemble: { threshold: 0.6 }
});

// 初始化实时监控器
const realTimeMonitor = new RealTimeMonitor(advancedAnomalyDetector, {
  alertThreshold: 0.7,
  alertCooldown: 300000, // 5分钟
  maxAlertsPerHour: 10
});

/**
 * 行为分析中间件
 * 记录用户行为并检测异常
 */
const behaviorAnalysisMiddleware = (options = {}) => {
  const {
    enableAnomalyDetection = true,
    logNormalBehavior = false,
    blockAnomalies = false,
    useAdvancedDetection = true
  } = options;

  return async (req, res, next) => {
    try {
      // 如果用户已认证，记录行为
      if (req.user && req.user.id) {
        const event = {
          userId: req.user.id,
          action: req.method,
          resource: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || '',
          timestamp: Date.now()
        };

        // 记录正常行为（如果启用）
        if (logNormalBehavior) {
          logger.info('[BEHAVIOR] 用户行为记录', {
            userId: event.userId,
            action: event.action,
            resource: event.resource,
            ip: event.ip
          });
        }

        // 记录事件到行为分析器
        behaviorAnalyzer.recordEvent(event);

        // 异常检测（如果启用）
        if (enableAnomalyDetection) {
          let anomalyResult;
          
          if (useAdvancedDetection) {
            // 使用高级异常检测
            anomalyResult = realTimeMonitor.monitorEvent(event);
          } else {
            // 使用基础异常检测
            anomalyResult = behaviorAnalyzer.detectAnomaly(event);
          }
          
          if (anomalyResult.isAnomaly) {
            logger.security(req, '检测到异常用户行为', {
              userId: event.userId,
              anomalyScore: anomalyResult.score,
              reasons: anomalyResult.reasons,
              action: event.action,
              resource: event.resource,
              details: anomalyResult.details
            });

            // 如果配置为阻止异常行为，返回错误
            if (blockAnomalies) {
              return res.status(403).json({
                success: false,
                message: '检测到异常行为，访问被拒绝'
              });
            }
          }
        }
      }

      next();
    } catch (error) {
      logger.error('[BEHAVIOR_ANALYSIS] 行为分析中间件错误:', error);
      // 即使行为分析出错，也不影响正常请求处理
      next();
    }
  };
};

/**
 * 获取用户行为报告
 * @param {string} userId - 用户ID
 * @returns {Object} 行为报告
 */
const getUserBehaviorReport = (userId) => {
  return behaviorAnalyzer.getUserBehaviorReport(userId);
};

/**
 * 手动触发异常检测
 * @param {Object} event - 用户行为事件
 * @returns {Object} 检测结果
 */
const detectAnomaly = (event) => {
  return advancedAnomalyDetector.detectAnomaly(event);
};

/**
 * 记录用户行为事件
 * @param {Object} event - 用户行为事件
 */
const recordUserEvent = (event) => {
  behaviorAnalyzer.recordEvent(event);
};

/**
 * 获取警报统计信息
 * @returns {Object} 统计信息
 */
const getAlertStats = () => {
  return realTimeMonitor.getAlertStats();
};

/**
 * 获取用户警报历史
 * @param {string} userId - 用户ID
 * @param {number} limit - 限制数量
 * @returns {Array} 警报历史
 */
const getUserAlertHistory = (userId, limit = 10) => {
  return realTimeMonitor.getUserAlertHistory(userId, limit);
};

module.exports = {
  behaviorAnalysisMiddleware,
  getUserBehaviorReport,
  detectAnomaly,
  recordUserEvent,
  getAlertStats,
  getUserAlertHistory,
  behaviorAnalyzer,
  advancedAnomalyDetector,
  realTimeMonitor
};