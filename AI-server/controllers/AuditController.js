/**
 * 审计日志控制器
 * 提供审计日志的查看、分析和报告功能
 */

const fs = require('fs');
const path = require('path');
const BaseController = require('./BaseController');
const logger = require('../config/logger');
const { getAnomalyStats } = require('../security/anomalyDetector');
const { successResponse, errorResponse } = require('../middleware/response');

class AuditController extends BaseController {
  constructor() {
    super();
    
    // 审计日志文件路径
    this.auditLogDir = path.join(__dirname, '../logs/audit');
    this.logFiles = {
      security: path.join(__dirname, '../logs/security.log'),
      operation: path.join(this.auditLogDir, 'operation.log'),
      login: path.join(this.auditLogDir, 'login.log'),
      anomaly: path.join(this.auditLogDir, 'anomaly.log')
    };
  }

  /**
   * 读取日志文件并解析JSON行
   * @param {string} filePath - 文件路径
   * @param {number} limit - 限制读取行数
   * @returns {Array} 解析后的日志条目
   */
  readLogFile(filePath, limit = 100) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // 只返回最近的记录
      const recentLines = lines.slice(-limit);
      
      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          logger.warn('审计日志解析失败:', { line, error: parseError.message });
          return null;
        }
      }).filter(entry => entry !== null);
      
    } catch (error) {
      logger.error('读取审计日志文件失败', { 
        error: error.message,
        filePath,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      return [];
    }
  }

  /**
   * 过滤日志条目
   * @param {Array} entries - 日志条目
   * @param {Object} filters - 过滤条件
   * @returns {Array} 过滤后的条目
   */
  filterLogEntries(entries, filters = {}) {
    return entries.filter(entry => {
      // 时间范围过滤
      if (filters.startTime && new Date(entry.timestamp) < new Date(filters.startTime)) {
        return false;
      }
      if (filters.endTime && new Date(entry.timestamp) > new Date(filters.endTime)) {
        return false;
      }
      
      // 用户ID过滤
      if (filters.userId && entry.userId !== filters.userId) {
        return false;
      }
      
      // IP地址过滤
      if (filters.ip && entry.ip !== filters.ip) {
        return false;
      }
      
      // 操作类型过滤
      if (filters.operationType && entry.operationType && 
          !entry.operationType.includes(filters.operationType)) {
        return false;
      }
      
      // 事件类型过滤
      if (filters.eventType && entry.eventType !== filters.eventType) {
        return false;
      }
      
      // 异常类型过滤
      if (filters.anomalyType && entry.anomalyType !== filters.anomalyType) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 获取安全审计日志
   * GET /api/audit/security
   */
  async getSecurityLogs(req, res, next) {
    try {
      const {
        startTime,
        endTime,
        userId,
        ip,
        eventType,
        limit = 100
      } = req.query;

      const entries = this.readLogFile(this.logFiles.security, parseInt(limit));
      const filtered = this.filterLogEntries(entries, {
        startTime,
        endTime,
        userId,
        ip,
        eventType
      });

      logger.audit(req, '安全审计日志查看', {
        totalRecords: entries.length,
        filteredRecords: filtered.length,
        filters: req.query
      });

      return successResponse(res, {
        logs: filtered,
        totalRecords: filtered.length,
        filters: req.query
      });

    } catch (error) {
      logger.error('[AuditController] 获取安全审计日志失败:', error);
      next(error);
    }
  }

  /**
   * 获取操作审计日志
   * GET /api/audit/operations
   */
  async getOperationLogs(req, res, next) {
    try {
      const {
        startTime,
        endTime,
        userId,
        ip,
        operationType,
        limit = 100
      } = req.query;

      const entries = this.readLogFile(this.logFiles.operation, parseInt(limit));
      const filtered = this.filterLogEntries(entries, {
        startTime,
        endTime,
        userId,
        ip,
        operationType
      });

      logger.audit(req, '操作审计日志查看', {
        totalRecords: entries.length,
        filteredRecords: filtered.length,
        filters: req.query
      });

      return successResponse(res, {
        logs: filtered,
        totalRecords: filtered.length,
        filters: req.query
      });

    } catch (error) {
      logger.error('[AuditController] 获取操作审计日志失败:', error);
      next(error);
    }
  }

  /**
   * 获取登录审计日志
   * GET /api/audit/login
   */
  async getLoginLogs(req, res, next) {
    try {
      const {
        startTime,
        endTime,
        userId,
        ip,
        eventType,
        limit = 100
      } = req.query;

      const entries = this.readLogFile(this.logFiles.login, parseInt(limit));
      const filtered = this.filterLogEntries(entries, {
        startTime,
        endTime,
        userId,
        ip,
        eventType
      });

      logger.audit(req, '登录审计日志查看', {
        totalRecords: entries.length,
        filteredRecords: filtered.length,
        filters: req.query
      });

      return successResponse(res, {
        logs: filtered,
        totalRecords: filtered.length,
        filters: req.query
      });

    } catch (error) {
      logger.error('[AuditController] 获取登录审计日志失败:', error);
      next(error);
    }
  }

  /**
   * 获取异常审计日志
   * GET /api/audit/anomaly
   */
  async getAnomalyLogs(req, res, next) {
    try {
      const {
        startTime,
        endTime,
        userId,
        ip,
        anomalyType,
        limit = 100
      } = req.query;

      const entries = this.readLogFile(this.logFiles.anomaly, parseInt(limit));
      const filtered = this.filterLogEntries(entries, {
        startTime,
        endTime,
        userId,
        ip,
        anomalyType
      });

      logger.audit(req, '异常审计日志查看', {
        totalRecords: entries.length,
        filteredRecords: filtered.length,
        filters: req.query
      });

      return successResponse(res, {
        logs: filtered,
        totalRecords: filtered.length,
        filters: req.query
      });

    } catch (error) {
      logger.error('[AuditController] 获取异常审计日志失败:', error);
      next(error);
    }
  }

  /**
   * 获取审计日志统计信息
   * GET /api/audit/stats
   */
  async getAuditStats(req, res, next) {
    try {
      // 读取所有日志文件
      const securityEntries = this.readLogFile(this.logFiles.security, 1000);
      const operationEntries = this.readLogFile(this.logFiles.operation, 1000);
      const loginEntries = this.readLogFile(this.logFiles.login, 1000);
      const anomalyEntries = this.readLogFile(this.logFiles.anomaly, 1000);

      // 计算统计数据
      const stats = {
        timestamp: new Date().toISOString(),
        security: {
          totalRecords: securityEntries.length,
          recentRequests: securityEntries.filter(e => e.eventType === 'REQUEST_RECEIVED').length,
          processedRequests: securityEntries.filter(e => e.eventType === 'REQUEST_PROCESSED').length
        },
        operations: {
          totalRecords: operationEntries.length,
          completedOperations: operationEntries.filter(e => e.operationType?.includes('OPERATION_COMPLETE')).length,
          failedOperations: operationEntries.filter(e => 
            e.operationType?.includes('OPERATION_COMPLETE') && !e.operationData?.success
          ).length
        },
        login: {
          totalRecords: loginEntries.length,
          successfulLogins: loginEntries.filter(e => e.eventType === 'LOGIN_SUCCESS').length,
          failedLogins: loginEntries.filter(e => e.eventType === 'LOGIN_FAILED').length
        },
        anomaly: {
          totalRecords: anomalyEntries.length,
          anomalyTypes: this.groupBy(anomalyEntries, 'anomalyType'),
          topIPs: this.getTopIPs(anomalyEntries),
          topUserAgents: this.getTopUserAgents(anomalyEntries)
        },
        realtime: getAnomalyStats()
      };

      logger.audit(req, '审计统计信息查看', {
        stats: Object.keys(stats).map(key => `${key}: ${stats[key].totalRecords || stats[key].length}`)
      });

      return successResponse(res, stats);

    } catch (error) {
      logger.error('[AuditController] 获取审计统计失败:', error);
      next(error);
    }
  }

  /**
   * 生成审计报告
   * GET /api/audit/report
   */
  async generateAuditReport(req, res, next) {
    try {
      const {
        startTime,
        endTime,
        reportType = 'summary' // 'summary', 'security', 'operations', 'login', 'anomaly'
      } = req.query;

      const filters = { startTime, endTime };

      // 读取相关日志
      const securityEntries = this.readLogFile(this.logFiles.security, 10000);
      const operationEntries = this.readLogFile(this.logFiles.operation, 10000);
      const loginEntries = this.readLogFile(this.logFiles.login, 10000);
      const anomalyEntries = this.readLogFile(this.logFiles.anomaly, 10000);

      // 过滤数据
      const filteredSecurity = this.filterLogEntries(securityEntries, filters);
      const filteredOperations = this.filterLogEntries(operationEntries, filters);
      const filteredLogins = this.filterLogEntries(loginEntries, filters);
      const filteredAnomalies = this.filterLogEntries(anomalyEntries, filters);

      // 生成报告
      const report = {
        reportType,
        generatedAt: new Date().toISOString(),
        timeRange: { startTime, endTime },
        summary: {
          totalEvents: filteredSecurity.length + filteredOperations.length + 
                      filteredLogins.length + filteredAnomalies.length,
          securityEvents: filteredSecurity.length,
          operationEvents: filteredOperations.length,
          loginEvents: filteredLogins.length,
          anomalyEvents: filteredAnomalies.length
        },
        security: reportType === 'security' || reportType === 'summary' ? {
          topEventTypes: this.groupBy(filteredSecurity, 'eventType'),
          topIPs: this.getTopIPs(filteredSecurity),
          responseTimeStats: this.calculateResponseTimeStats(filteredSecurity)
        } : null,
        operations: reportType === 'operations' || reportType === 'summary' ? {
          topOperationTypes: this.groupBy(filteredOperations, 'operationType'),
          operationSuccessRate: this.calculateSuccessRate(filteredOperations),
          topUsers: this.getTopUsers(filteredOperations)
        } : null,
        login: reportType === 'login' || reportType === 'summary' ? {
          loginAttempts: filteredLogins.length,
          successRate: this.calculateLoginSuccessRate(filteredLogins),
          failedAttempts: filteredLogins.filter(e => e.eventType === 'LOGIN_FAILED').length,
          topFailingIPs: this.getTopIPs(filteredLogins.filter(e => e.eventType === 'LOGIN_FAILED'))
        } : null,
        anomaly: reportType === 'anomaly' || reportType === 'summary' ? {
          anomalyTypes: this.groupBy(filteredAnomalies, 'anomalyType'),
          topAnomalousIPs: this.getTopIPs(filteredAnomalies),
          severityDistribution: this.calculateAnomalySeverity(filteredAnomalies)
        } : null
      };

      logger.audit(req, '审计报告生成', {
        reportType,
        timeRange: { startTime, endTime },
        summary: report.summary
      });

      return successResponse(res, report);

    } catch (error) {
      logger.error('[AuditController] 生成审计报告失败:', error);
      next(error);
    }
  }

  /**
   * 辅助方法：按字段分组统计
   */
  groupBy(entries, field) {
    const groups = {};
    entries.forEach(entry => {
      const value = entry[field] || 'unknown';
      groups[value] = (groups[value] || 0) + 1;
    });
    return groups;
  }

  /**
   * 辅助方法：获取前N个IP地址
   */
  getTopIPs(entries, limit = 10) {
    const ipCounts = {};
    entries.forEach(entry => {
      const ip = entry.ip || 'unknown';
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([ip, count]) => ({ ip, count }));
  }

  /**
   * 辅助方法：获取前N个User-Agent
   */
  getTopUserAgents(entries, limit = 10) {
    const userAgentCounts = {};
    entries.forEach(entry => {
      const ua = entry.userAgent || 'unknown';
      userAgentCounts[ua] = (userAgentCounts[ua] || 0) + 1;
    });

    return Object.entries(userAgentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([userAgent, count]) => ({ userAgent, count }));
  }

  /**
   * 辅助方法：获取前N个用户
   */
  getTopUsers(entries, limit = 10) {
    const userCounts = {};
    entries.forEach(entry => {
      const userId = entry.userId || 'anonymous';
      userCounts[userId] = (userCounts[userId] || 0) + 1;
    });

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }));
  }

  /**
   * 辅助方法：计算操作成功率
   */
  calculateSuccessRate(entries) {
    const completedOperations = entries.filter(e => e.operationType?.includes('OPERATION_COMPLETE'));
    if (completedOperations.length === 0) return 0;

    const successfulOperations = completedOperations.filter(e => e.operationData?.success);
    return (successfulOperations.length / completedOperations.length * 100).toFixed(2);
  }

  /**
   * 辅助方法：计算登录成功率
   */
  calculateLoginSuccessRate(entries) {
    const loginAttempts = entries.filter(e => e.eventType?.includes('LOGIN'));
    if (loginAttempts.length === 0) return 0;

    const successfulLogins = entries.filter(e => e.eventType === 'LOGIN_SUCCESS');
    return (successfulLogins.length / loginAttempts.length * 100).toFixed(2);
  }

  /**
   * 辅助方法：计算响应时间统计
   */
  calculateResponseTimeStats(entries) {
    const processedEntries = entries.filter(e => e.eventType === 'REQUEST_PROCESSED' && e.eventData?.responseTime);
    
    if (processedEntries.length === 0) return null;

    const responseTimes = processedEntries.map(e => e.eventData.responseTime);
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    const avg = sum / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);

    return {
      count: responseTimes.length,
      average: Math.round(avg),
      min,
      max,
      total: sum
    };
  }

  /**
   * 辅助方法：计算异常严重程度分布
   */
  calculateAnomalySeverity(entries) {
    const severityMap = {
      'LOW': ['SLOW_REQUEST', 'UNUSUAL_REQUEST_FREQUENCY'],
      'MEDIUM': ['HTTP_ERROR_RESPONSE', 'POTENTIAL_BOT_ACCESS', 'SUSPICIOUS_USER_AGENT'],
      'HIGH': ['PATH_TRAVERSAL_ATTEMPT', 'BRUTE_FORCE_ATTACK', 'SQL_INJECTION_ATTEMPT'],
      'CRITICAL': ['FREQUENT_FAILED_LOGIN', 'PRIVILEGE_ESCALATION', 'MULTIPLE_SUSPICIOUS_ACTIVITIES']
    };

    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    entries.forEach(entry => {
      const anomalyType = entry.anomalyType;
      for (const [severity, types] of Object.entries(severityMap)) {
        if (types.some(type => anomalyType?.includes(type))) {
          distribution[severity]++;
          break;
        }
      }
    });

    return distribution;
  }
}

module.exports = AuditController;