const { pool } = require('../config/database');
const logger = require('../config/logger');
const alertService = require('./alertService');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { monitor: performanceMonitor } = require('../middleware/performanceMonitor');

// 获取后端服务真实版本号
let backendVersion = '1.0.0';
try {
  const packageInfo = require('../package.json');
  backendVersion = packageInfo.version || '1.0.0';
} catch (e) {
  logger.warn('[SystemStatusService] 无法获取后端package.json版本号，使用默认值');
}

// 获取客户端真实版本号
let clientVersion = '0.0.0';
try {
  const adminPackagePath = path.join(__dirname, '../../AI-admin/package.json');
  if (fs.existsSync(adminPackagePath)) {
    const adminPackageInfo = JSON.parse(fs.readFileSync(adminPackagePath, 'utf8'));
    clientVersion = adminPackageInfo.version || '0.0.0';
  }
} catch (e) {
  logger.warn('[SystemStatusService] 无法获取前端package.json版本号，使用默认值');
}

class SystemStatusService {
  constructor() {
    this.lastCheckTime = null;
    this.checkInterval = 5000; // 检查间隔5秒
    
    // 后端 QPS 计算状态
    this.lastBackendCheckTime = null;
    this.lastBackendTotalRequests = 0;
    
    // 状态变更防抖机制
    this.stateHistory = new Map(); // 组件状态历史记录
    this.consecutiveFailures = new Map(); // 连续失败计数
    this.consecutiveSuccesses = new Map(); // 连续成功计数
    
    // 异常模式识别
    this.performanceHistory = new Map(); // 性能历史数据
    this.patternRecognition = {
      avalanche: { threshold: 0.1, timeWindow: 300000 }, // 10%性能下降，5分钟窗口
      deadlock: { threadSpikeThreshold: 5, timeWindow: 60000 }, // 线程突增阈值
      memoryLeak: { growthRateThreshold: 0.2, timeWindow: 300000 } // 20%增长率，5分钟窗口
    };
    
    // 权重配置
    this.weights = {
      client: { connection: 0.4, function: 0.4, performance: 0.2 },
      // 新增：在线用户质量模型权重 (数学关系模型)
      // QualityScore = w_auth * Authentication + w_behavior * Stability + w_interaction * Interaction + w_business * Business
      userQuality: {
        authentication: 0.30, // 身份验证权重
        stability: 0.20,      // 行为稳定性权重 (心跳持续性)
        interaction: 0.30,    // 交互活跃度权重
        business: 0.20        // 业务价值权重
      },
      backend: { 
        base: { process: 0.15, port: 0.15, memory: 0.20, thread: 0.20, gc: 0.30 },
        dynamic: { performance: 0.3, business: 0.7 }
      },
      database: { connection: 0.4, performance: 0.3, resource: 0.2, integrity: 0.1 }
    };

    // 动态阈值配置
    this.thresholds = {
      highQuality: 85,    // 高质量用户判定阈值
      normalQuality: 60,  // 普通用户判定阈值
      anomalyAlert: 0.15  // 异常波动预警阈值 (可疑用户占比超过15%)
    };

    // 缓存聚合后的客户端指标
    this.aggregatedClientMetrics = {
      heartbeatSuccessRate: 100,
      wsConnectionStatus: true,
      networkLatency: 50,
      criticalApiSuccessRate: 100,
      localStorageAvailability: true,
      pageRenderSuccessRate: 100,
      fps: 60,
      memoryUsage: 30,
      cpuUsage: 10
    };
  }

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    return new Date();
  }

  /**
   * 计算系统运行时长（秒）
   */
  getUptime() {
    return process.uptime();
  }

  /**
   * 格式化运行时长
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟 ${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${secs}秒`;
    }
    return `${secs}秒`;
  }

  /**
   * 获取真实的在线用户数
   * @returns {Promise<number>} 在线用户数
   */
  /**
   * 计算用户在线质量数学模型得分
   * 模型公式: Q(u) = Σ (w_i * S_i)
   * 其中 S_i 为各维度标准化得分，w_i 为对应权重
   * @param {Object} session - 会话数据
   * @returns {number} 最终质量得分 (0-100)
   */
  calculateUserQualityScore(session) {
    const w = this.weights.userQuality;
    const now = new Date();
    const lastUpdate = session.updated_at ? new Date(session.updated_at) : new Date(session.last_accessed_at);
    
    // 1. 身份验证维度 (Authentication - 30%)
    // 标准化: 有UA且有IP得50分，有设备指纹得50分
    let sAuth = 0;
    if (session.user_agent && session.ip_address && session.ip_address !== '0.0.0.0') sAuth += 50;
    if (session.device_fingerprint) sAuth += 50;

    // 2. 行为稳定性维度 (Stability - 20%)
    // 标准化: 持续心跳次数越多得分越高，最高100分
    const heartbeatCount = session.heartbeat_count || 0;
    const sStability = Math.min(100, (heartbeatCount / 50) * 100);

    // 3. 交互活跃度维度 (Interaction - 30%)
    // 标准化: 交互次数标准化，最高100分
    const interactionCount = session.interaction_count || 0;
    const sInteraction = Math.min(100, (interactionCount / 200) * 100);

    // 4. 业务价值维度 (Business - 20%)
    // 标准化: 业务请求次数标准化，最高100分
    const businessCount = session.business_request_count || 0;
    const sBusiness = Math.min(100, (businessCount / 20) * 100);

    // 综合加权得分
    const totalScore = (
      sAuth * w.authentication +
      sStability * w.stability +
      sInteraction * w.interaction +
      sBusiness * w.business
    );

    return Math.round(totalScore);
  }

  /**
   * 获取真实的在线用户数（基于数学关系模型）
   * 数学关系: Total = High + Normal + Suspicious
   */
  async getRealOnlineUserCount() {
    try {
      // 1. 获取最近活跃会话 (按用户去重，只计算同一用户的最新会话)
      const query = `
        SELECT DISTINCT ON (s.user_id) s.*
        FROM user_sessions s
        INNER JOIN users u ON s.user_id = u.id
        INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE s.status = 'active' 
        AND s.client_type = 'client'
        AND r.role_name != 'admin'
        AND s.expires_at > NOW()
        AND (s.updated_at > (NOW() - INTERVAL '5 minutes') OR s.last_accessed_at > (NOW() - INTERVAL '5 minutes'))
        ORDER BY s.user_id, s.updated_at DESC, s.last_accessed_at DESC
      `;
      const result = await pool.query(query);
      const sessions = result.rows;

      console.log('[SystemStatusService] 在线用户查询结果:', {
        userCount: sessions.length,
        users: sessions.map(s => ({
          id: s.id,
          user_id: s.user_id,
          status: s.status,
          client_type: s.client_type,
          expires_at: s.expires_at,
          updated_at: s.updated_at,
          last_accessed_at: s.last_accessed_at
        }))
      });

      const distribution = { high: 0, normal: 0, suspicious: 0 };
      const totalOnline = sessions.length;

      if (totalOnline === 0) {
        console.log('[SystemStatusService] 无在线用户会话');
        return { total: 0, distribution, qualityIndex: 100, alerts: [] };
      }

      console.log('[SystemStatusService] 存在在线用户会话，开始计算质量分布');

      // 2. 应用数学模型进行分类
      let totalQualityScore = 0;
      sessions.forEach(session => {
        const score = this.calculateUserQualityScore(session);
        session.quality_score = score;
        totalQualityScore += score;

        const hasInteraction = (session.interaction_count || 0) > 0;
        const hasBusiness = (session.business_request_count || 0) > 0;

        // 应用判定阈值
        if (score >= this.thresholds.highQuality && hasInteraction && hasBusiness) {
          distribution.high++;
        } else if (score >= this.thresholds.normalQuality) {
          distribution.normal++;
        } else {
          distribution.suspicious++;
        }
      });

      // 3. 计算质量指数 (Quality Index)
      const qualityIndex = Math.round(totalQualityScore / totalOnline);

      // 4. 异常波动自动预警
      const alerts = [];
      const suspiciousRate = distribution.suspicious / totalOnline;
      if (suspiciousRate > this.thresholds.anomalyAlert) {
        alerts.push({
          type: 'suspicious_surge',
          level: 'warning',
          message: `可疑用户占比异常 (${(suspiciousRate * 100).toFixed(1)}%)，超过预警阈值`,
          timestamp: new Date().toISOString()
        });
      }

      return {
        total: totalOnline,
        distribution,
        qualityIndex,
        alerts,
        metrics: {
          avgQualityScore: qualityIndex,
          highQualityRate: (distribution.high / totalOnline * 100).toFixed(1),
          suspiciousRate: (suspiciousRate * 100).toFixed(1)
        }
      };
    } catch (error) {
      logger.error('[SystemStatusService] 数学模型计算失败:', error);
      return { total: 0, distribution: { high: 0, normal: 0, suspicious: 0 }, qualityIndex: 0, alerts: [] };
    }
  }

  /**
   * 获取峰值用户数 (最近24小时)
   * @returns {Promise<number>} 峰值用户数
   */
  async getPeakUsers() {
    try {
      // 1. 尝试从监控指标表获取最近24小时的最大值
      const query = `
        SELECT MAX(metric_value) as peak
        FROM admin_system_metrics 
        WHERE metric_type = 'ACTIVE_USERS' 
        AND metric_timestamp > NOW() - INTERVAL '24 hours'
      `;
      const result = await pool.query(query);
      const dbPeak = result.rows[0].peak ? parseInt(result.rows[0].peak) : 0;
      
      // 2. 获取当前实时在线人数
      const currentOnlineData = await this.getRealOnlineUserCount();
      const currentOnline = currentOnlineData.total;
      
      // 如果当前在线人数更高，返回当前值
      return Math.max(dbPeak, currentOnline);
    } catch (error) {
      logger.error('[SystemStatusService] 获取峰值用户数失败:', error);
      return 0;
    }
  }

  /**
   * 获取今日活跃用户数 (从凌晨开始到现在有过操作的去重用户)
   * @returns {Promise<number>} 今日活跃用户数
   */
  async getTodayActiveUsers() {
    try {
      // 统计今天凌晨以来，在 user_sessions 中有记录且是客户端角色的去重用户
      // 严格排除角色为 admin 的用户
      const query = `
        SELECT COUNT(DISTINCT s.user_id) as active_count
        FROM user_sessions s
        INNER JOIN users u ON s.user_id = u.id
        INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE s.last_accessed_at > CURRENT_DATE
        AND s.client_type = 'client'
        AND r.role_name != 'admin'
      `;
      const result = await pool.query(query);
      return parseInt(result.rows[0].active_count) || 0;
    } catch (error) {
      logger.error('[SystemStatusService] 获取今日活跃用户数失败:', error);
      return 0;
    }
  }

  /**
   * 记录系统指标（包含用户质量维度）
   */
  async recordSystemMetrics() {
    try {
      const onlineData = await this.getRealOnlineUserCount();
      
      // 记录总在线人数
      await this.recordMetric('ACTIVE_USERS', '在线用户数', onlineData.total, '人');
      
      // 记录质量分布 (时间序列)
      await this.recordMetric('ACTIVE_USERS', '高质量用户数', onlineData.distribution.high, '人');
      await this.recordMetric('ACTIVE_USERS', '普通用户数', onlineData.distribution.normal, '人');
      await this.recordMetric('ACTIVE_USERS', '可疑用户数', onlineData.distribution.suspicious, '人');
      
      // 记录质量指数
      await this.recordMetric('ACTIVE_USERS', '用户质量指数', onlineData.qualityIndex, '分');

      logger.debug('[SystemStatusService] 系统指标已记录', {
        total: onlineData.total,
        distribution: onlineData.distribution,
        qualityIndex: onlineData.qualityIndex
      });
    } catch (error) {
      logger.error('[SystemStatusService] 记录系统指标任务失败:', error);
    }
  }

  /**
   * 记录指标到数据库
   */
  async recordMetric(type, name, value, unit) {
    try {
      const query = `
        INSERT INTO admin_system_metrics 
        (metric_type, metric_name, metric_value, metric_unit, metric_timestamp)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await pool.query(query, [type, name, value, unit]);
    } catch (error) {
      logger.error('[SystemStatusService] 记录指标失败:', error);
    }
  }

  /**
   * 生成用户质量分析报告
   * @param {string} range - 'daily' | 'weekly'
   */
  async generateQualityReport(range = 'daily') {
    try {
      const interval = range === 'daily' ? '24 hours' : '7 days';
      const query = `
        SELECT 
          metric_type,
          AVG(metric_value) as avg_value,
          MAX(metric_value) as max_value,
          MIN(metric_value) as min_value
        FROM admin_system_metrics
        WHERE metric_type LIKE 'USER_QUALITY_%'
        AND metric_timestamp > NOW() - INTERVAL '${interval}'
        GROUP BY metric_type
      `;
      const result = await pool.query(query);
      
      const report = {
        range,
        timestamp: new Date().toISOString(),
        summary: {},
        conclusion: ''
      };

      result.rows.forEach(row => {
        report.summary[row.metric_type] = {
          avg: parseFloat(row.avg_value).toFixed(2),
          max: row.max_value,
          min: row.min_value
        };
      });

      // 自动生成结论
      const highAvg = parseFloat(report.summary.USER_QUALITY_HIGH?.avg || 0);
      const suspAvg = parseFloat(report.summary.USER_QUALITY_SUSPICIOUS?.avg || 0);
      const totalAvg = highAvg + suspAvg + parseFloat(report.summary.USER_QUALITY_NORMAL?.avg || 0);
      
      if (totalAvg > 0) {
        const highRate = (highAvg / totalAvg * 100).toFixed(1);
        report.conclusion = `本周期内高质量用户占比为 ${highRate}%。`;
        if (highRate < 50) report.conclusion += ' 用户质量偏低，建议检查是否存在异常流量或优化准入门槛。';
        else report.conclusion += ' 用户质量稳定，处于健康状态。';
      } else {
        report.conclusion = '本周期内无足够数据生成报告。';
      }

      return report;
    } catch (error) {
      logger.error('[SystemStatusService] 生成报告失败:', error);
      return null;
    }
  }

  /**
   * 获取指定类型的历史指标数据
   * @param {string} type 指标类型
   * @param {string} interval 时间间隔，例如 '24 hours'
   */
  async getMetricsHistory(type, interval = '24 hours') {
    try {
      const query = `
        SELECT 
          metric_value as value,
          metric_timestamp as timestamp
        FROM admin_system_metrics
        WHERE metric_type = $1
        AND metric_timestamp > NOW() - INTERVAL '${interval}'
        ORDER BY metric_timestamp ASC
      `;
      const result = await pool.query(query, [type]);
      return result.rows.map(row => ({
        value: parseFloat(row.value),
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error(`[SystemStatusService] 获取历史指标 ${type} 失败:`, error);
      return [];
    }
  }

  /**
   * 评估客户端状态 - 基于多维度权重算法
   */
  async evaluateClientStatus() {
    const startTime = Date.now();
    
    try {
      const uptime = this.getUptime();
      const startTimeObj = this.getCurrentTime();
      const startTimeISO = new Date(startTimeObj.getTime() - uptime * 1000).toISOString();
      
      // 1. 获取在线用户及其数学模型指标
      const onlineUserData = await this.getRealOnlineUserCount();
      
      // 2. 并行执行多维度检查和指标获取
      const [
        connectionHealth,
        functionHealth,
        performanceHealth,
        peakUsers,
        todayActiveUsers
      ] = await Promise.all([
        this.assessClientConnectionLayer(uptime),
        this.assessClientFunctionLayer(),
        this.assessClientPerformanceLayer(),
        this.getPeakUsers(),
        this.getTodayActiveUsers()
      ]);

      // 获取性能监控中间件的实时数据
      const performanceStats = performanceMonitor.getStats();

      // 计算加权健康分数
      const weights = this.weights.client;
      // 考虑用户质量指数对健康度的影响 (Quality Score 占 20% 性能层的影响)
      const healthScore = Math.round(
        connectionHealth.score * weights.connection +
        functionHealth.score * weights.function +
        (performanceHealth.score * 0.8 + (onlineUserData.qualityIndex || 100) * 0.2) * weights.performance
      );

      // 状态判定
      const { status, statusText } = this.determineClientStatus(healthScore, {
        connection: connectionHealth.score,
        function: functionHealth.score,
        performance: performanceHealth.score
      });

      // 收集问题和建议
      const { issues, suggestions } = this.collectClientIssuesAndSuggestions({
        connection: connectionHealth.score,
        function: functionHealth.score,
        performance: performanceHealth.score
      });

      // 异常模式识别
      const patternAnalysis = await this.recognizeClientPatterns();

      const evaluationTime = Date.now() - startTime;
      
      const result = {
        success: true,
        status: status,
        statusText: statusText,
        healthScore: healthScore,
        metrics: {
          version: clientVersion, // 使用真实的客户端版本号
          onlineUsers: onlineUserData.total,
          userDistribution: onlineUserData.distribution,
          qualityIndex: onlineUserData.qualityIndex, // 新增：质量指数
          alerts: onlineUserData.alerts,             // 新增：预警信息
          peakUsers: peakUsers,
          todayActiveUsers: todayActiveUsers,
          avgResponseTime: performanceStats.summary.avgResponseTime,
          // 只有在有在线客户端用户时才显示错误率，否则显示0
          errorRate: onlineUserData.total > 0 ? performanceStats.summary.errorRate : 0,
          uptime: uptime,
          uptimeFormatted: this.formatUptime(uptime),
          startTime: startTimeISO,
          layers: {
            connection: { score: connectionHealth.score, weight: weights.connection },
            function: { score: functionHealth.score, weight: weights.function },
            performance: { score: performanceHealth.score, weight: weights.performance },
          },
          realTime: performanceStats.summary
        },
        patternAnalysis: patternAnalysis,
        评估时间: `${evaluationTime}ms`,
        lastUpdate: startTimeObj.toLocaleString('zh-CN', { hour12: false }),
        issues: issues,
        suggestions: suggestions
      };

      // 异步处理告警触发
      this.processEvaluationResult('client', result).catch(err => {
        logger.error('[SystemStatusService] 触发客户端状态告警失败:', err);
      });

      return result;
    } catch (error) {
      logger.error('[SystemStatusService] 评估客户端状态失败:', error);
      return {
        success: false,
        status: 'critical',
        statusText: '评估失败',
        healthScore: 0,
        error: error.message,
        lastUpdate: this.getCurrentTime().toLocaleString('zh-CN', { hour12: false }),
      };
    }
  }

  /**
   * 连接层状态评估（30%权重）
   * 包括：心跳成功率、WebSocket连接状态、网络延迟
   */
  async assessClientConnectionLayer(uptime) {
    try {
      // 模拟心跳检查（实际项目中应该检查真实的心跳数据）
      const heartbeatSuccessRate = this.calculateHeartbeatSuccessRate();
      
      // WebSocket连接状态检查
      const wsConnectionStatus = this.checkWebSocketConnection();
      
      // 网络延迟检查
      const networkLatency = await this.measureNetworkLatency();
      
      // 连接层评分计算
      const heartbeatScore = heartbeatSuccessRate * 0.4; // 40%权重
      const wsScore = wsConnectionStatus ? 30 : 0; // 30%权重 (此处30是基础分)
      // 修正：如果使用百分比，则统一使用 0-1 范围或 0-100 范围
      const normalizedWsScore = wsConnectionStatus ? 30 : 0;
      const normalizedLatencyScore = this.calculateLatencyScore(networkLatency) * 30;
      
      const connectionScore = Math.round(heartbeatScore + normalizedWsScore + normalizedLatencyScore);
      
      return {
        score: connectionScore,
        details: {
          heartbeatSuccessRate: heartbeatSuccessRate,
          wsConnectionStatus: wsConnectionStatus,
          networkLatency: networkLatency
        }
      };
    } catch (error) {
      logger.error('[SystemStatusService] 连接层评估失败:', error);
      return { score: 0, details: { error: error.message } };
    }
  }

  /**
   * 功能层状态评估（40%权重）
   * 包括：关键API调用成功率、本地存储可用性、页面渲染成功率
   */
  async assessClientFunctionLayer() {
    try {
      // 关键API调用成功率检查（模拟检查最近的关键API调用）
      const criticalApiSuccessRate = await this.checkCriticalApiSuccessRate();
      
      // 本地存储可用性检查
      const localStorageAvailability = this.checkLocalStorageAvailability();
      
      // 页面渲染成功率检查
      const pageRenderSuccessRate = this.checkPageRenderSuccessRate();
      
      // 功能层评分计算
      const apiScore = criticalApiSuccessRate * 0.5; // 50%权重
      const storageScore = localStorageAvailability ? 20 : 0; // 20%权重
      const renderScore = pageRenderSuccessRate * 0.3; // 30%权重
      
      const functionScore = Math.round(apiScore + storageScore + renderScore);
      
      return {
        score: functionScore,
        details: {
          criticalApiSuccessRate: criticalApiSuccessRate,
          localStorageAvailability: localStorageAvailability,
          pageRenderSuccessRate: pageRenderSuccessRate
        }
      };
    } catch (error) {
      logger.error('[SystemStatusService] 功能层评估失败:', error);
      return { score: 0, details: { error: error.message } };
    }
  }

  /**
   * 性能层状态评估（20%权重）
   * 包括：FPS(帧率)、内存使用率、CPU使用率
   */
  async assessClientPerformanceLayer() {
    try {
      // 模拟前端性能指标（实际项目中应该从前端获取真实数据）
      const frameRate = this.estimateFrameRate();
      const memoryUsage = this.getClientMemoryUsage();
      const cpuUsage = this.getClientCpuUsage();
      
      // 性能层评分计算
      const fpsScore = this.calculateFpsScore(frameRate) * 0.3; // 30%权重
      const memoryScore = this.calculateMemoryScore(memoryUsage) * 0.4; // 40%权重
      const cpuScore = this.calculateCpuScore(cpuUsage) * 0.3; // 30%权重
      
      const performanceScore = Math.round(fpsScore + memoryScore + cpuScore);
      
      return {
        score: performanceScore,
        details: {
          frameRate: frameRate,
          memoryUsage: memoryUsage,
          cpuUsage: cpuUsage
        }
      };
    } catch (error) {
      logger.error('[SystemStatusService] 性能层评估失败:', error);
      return { score: 0, details: { error: error.message } };
    }
  }



  /**
   * 计算稳定性评分 - 兼容旧方法
   */
  calculateStabilityScore(uptime) {
    // 运行时间越长，稳定性越高
    if (uptime < 60) return 50;
    if (uptime < 300) return 70;
    if (uptime < 3600) return 85;
    if (uptime < 86400) return 95;
    return 100;
  }

  // ==================== 客户端状态辅助方法 ====================

  /**
   * 计算心跳成功率
   */
  calculateHeartbeatSuccessRate() {
    return this.aggregatedClientMetrics.heartbeatSuccessRate;
  }

  /**
   * 检查WebSocket连接状态
   */
  checkWebSocketConnection() {
    return this.aggregatedClientMetrics.wsConnectionStatus;
  }

  /**
   * 测量网络延迟
   */
  async measureNetworkLatency() {
    return this.aggregatedClientMetrics.networkLatency;
  }

  /**
   * 计算延迟评分
   */
  calculateLatencyScore(latency) {
    if (latency < 100) return 1.0;
    if (latency < 300) return 0.8;
    if (latency < 500) return 0.6;
    return 0.3;
  }

  /**
   * 检查关键API成功率
   */
  async checkCriticalApiSuccessRate() {
    return this.aggregatedClientMetrics.criticalApiSuccessRate;
  }

  /**
   * 检查本地存储可用性
   */
  checkLocalStorageAvailability() {
    return this.aggregatedClientMetrics.localStorageAvailability;
  }

  /**
   * 检查页面渲染成功率
   */
  checkPageRenderSuccessRate() {
    return this.aggregatedClientMetrics.pageRenderSuccessRate;
  }

  /**
   * 估算帧率
   */
  estimateFrameRate() {
    return this.aggregatedClientMetrics.fps;
  }

  /**
   * 获取客户端内存使用率
   */
  getClientMemoryUsage() {
    return this.aggregatedClientMetrics.memoryUsage;
  }

  /**
   * 获取客户端CPU使用率
   */
  getClientCpuUsage() {
    return this.aggregatedClientMetrics.cpuUsage;
  }

  /**
   * 计算FPS评分
   */
  calculateFpsScore(fps) {
    if (fps >= 50) return 100;
    if (fps >= 30) return 60;
    return 0;
  }

  /**
   * 计算内存评分
   */
  calculateMemoryScore(memoryUsage) {
    if (memoryUsage < 70) return 100;
    if (memoryUsage < 85) return 60;
    return 0;
  }

  /**
   * 计算CPU评分
   */
  calculateCpuScore(cpuUsage) {
    if (cpuUsage < 50) return 100;
    if (cpuUsage < 70) return 60;
    return 0;
  }



  /**
   * 判定客户端状态
   */
  determineClientStatus(healthScore, layerScores) {
    // 检查关键维度阈值
    const criticalLayers = ['connection', 'function'];
    const hasCriticalIssue = criticalLayers.some(layer => layerScores[layer] < 60);
    
    if (healthScore >= 90 && !hasCriticalIssue) {
      return { status: 'healthy', statusText: '健康' };
    } else if (healthScore >= 70 || hasCriticalIssue) {
      return { status: 'warning', statusText: '亚健康' };
    } else {
      return { status: 'critical', statusText: '故障' };
    }
  }

  /**
   * 收集客户端问题和建议
   */
  collectClientIssuesAndSuggestions(layerScores) {
    const issues = [];
    const suggestions = [];

    // 连接层问题
    if (layerScores.connection < 80) {
      issues.push(`连接层状态异常：得分 ${layerScores.connection}`);
      suggestions.push('检查网络连接和WebSocket状态');
    }

    // 功能层问题
    if (layerScores.function < 80) {
      issues.push(`功能层状态异常：得分 ${layerScores.function}`);
      suggestions.push('检查关键API响应和本地存储状态');
    }

    // 性能层问题
    if (layerScores.performance < 70) {
      issues.push(`性能层状态异常：得分 ${layerScores.performance}`);
      suggestions.push('优化前端性能和资源使用');
    }

    return { issues, suggestions };
  }

  /**
   * 识别客户端异常模式
   */
  async recognizeClientPatterns() {
    // 真实异常模式识别 (基于收集到的指标)
    const patterns = [];
    
    // 检查是否出现性能下降模式 (例如 FPS 低于 30)
    if (this.aggregatedClientMetrics.fps < 30) {
      patterns.push({
        type: 'performance_degradation',
        description: `检测到客户端性能下降：当前平均FPS为 ${this.aggregatedClientMetrics.fps}`,
        confidence: 0.8
      });
    }

    // 检查是否出现渲染失败模式
    if (this.aggregatedClientMetrics.pageRenderSuccessRate < 95) {
      patterns.push({
        type: 'render_failure',
        description: `检测到页面渲染成功率异常：当前成功率为 ${this.aggregatedClientMetrics.pageRenderSuccessRate}%`,
        confidence: 0.9
      });
    }

    return {
      detectedPatterns: patterns,
      riskLevel: patterns.length > 0 ? (patterns.some(p => p.confidence > 0.8) ? 'high' : 'medium') : 'low',
      timestamp: this.getCurrentTime().toISOString()
    };
  }

  /**
   * 评估后端服务状态 - 基于三层健康检查机制
   * 第一层：轻量级检查（进程、端口、内存、线程池）
   * 第二层：依赖检查（数据库、缓存、消息队列）
   * 第三层：业务健康检查（核心流程、事务、异常率）
   */
  async evaluateBackendStatus() {
    const startTime = Date.now();
    
    try {
      const uptime = this.getUptime();
      const currentTime = this.getCurrentTime();
      
      // 并行执行三层健康检查
      const [basicHealth, dependencyHealth, businessHealth] = await Promise.all([
        this.assessBasicHealth(),
        this.assessDependencyHealth(),
        this.assessBusinessHealth()
      ]);

      // 智能权重调整算法
      const dynamicWeights = await this.calculateDynamicWeights();
      
      // 计算基础健康分（静态权重）
      const baseWeights = this.weights.backend.base;
      const baseScore = Math.round(
        basicHealth.processScore * baseWeights.process +
        basicHealth.portScore * baseWeights.port +
        basicHealth.memoryScore * baseWeights.memory +
        basicHealth.threadScore * baseWeights.thread +
        basicHealth.gcScore * baseWeights.gc
      );

      // 计算最终健康分（动态权重调整）
      const finalScore = Math.round(
        baseScore * 0.3 + 
        dependencyHealth.score * dynamicWeights.performance + 
        businessHealth.score * dynamicWeights.business
      );

      // 异常模式识别
      const anomalyPatterns = await this.recognizeBackendAnomalyPatterns(basicHealth, dependencyHealth, businessHealth);

      // 状态判定
      const { status, statusText } = this.determineBackendStatus(finalScore, anomalyPatterns);

      // 收集问题和建议
      const { issues, suggestions } = this.collectBackendIssuesAndSuggestions(basicHealth, dependencyHealth, businessHealth);

      const evaluationTime = Date.now() - startTime;
      
      // 获取真实 API 统计数据
      const perfStats = performanceMonitor.getStats ? performanceMonitor.getStats() : { summary: { avgResponseTime: 0, totalRequests: 0 } };
      const apiResponseTime = perfStats.summary?.avgResponseTime || 0;
      const totalRequests = perfStats.summary?.totalRequests || 0;

      // 计算 QPS
      let qps = 0;
      const now = Date.now();
      if (this.lastBackendCheckTime && this.lastBackendTotalRequests !== undefined) {
        const deltaRequests = totalRequests - this.lastBackendTotalRequests;
        const deltaTimeSeconds = (now - this.lastBackendCheckTime) / 1000;
        
        if (deltaTimeSeconds > 0.1) { // 避免除以零或过短的时间间隔
          qps = Math.max(0, parseFloat((deltaRequests / deltaTimeSeconds).toFixed(2)));
        }
      }
      
      // 更新状态
      this.lastBackendCheckTime = now;
      this.lastBackendTotalRequests = totalRequests;

      const result = {
        success: true,
        status: status,
        statusText: statusText,
        healthScore: finalScore,
        metrics: {
          version: backendVersion, // 真实版本号
          apiResponseTime: apiResponseTime,
          qps: qps, // 返回 QPS 数据
          uptime: uptime,
          uptimeFormatted: this.formatUptime(uptime),
          layers: {
            basic: {
              score: baseScore,
              details: basicHealth,
              weights: baseWeights
            },
            dependency: {
              score: dependencyHealth.score,
              details: dependencyHealth,
              weight: dynamicWeights.performance
            },
            business: {
              score: businessHealth.score,
              details: businessHealth,
              weight: dynamicWeights.business
            }
          }
        },
        anomalyPatterns: anomalyPatterns,
        dynamicWeights: dynamicWeights,
        评估时间: `${evaluationTime}ms`,
        lastUpdate: currentTime.toLocaleString('zh-CN', { hour12: false }),
        issues: issues,
        suggestions: suggestions
      };

      // 异步处理告警触发
      this.processEvaluationResult('backend', result).catch(err => {
        logger.error('[SystemStatusService] 触发后端状态告警失败:', err);
      });

      return result;
    } catch (error) {
      logger.error('[SystemStatusService] 评估后端服务状态失败:', error);
      return {
        success: false,
        status: 'critical',
        statusText: '评估失败',
        healthScore: 0,
        error: error.message,
        lastUpdate: this.getCurrentTime().toLocaleString('zh-CN', { hour12: false }),
      };
    }
  }

  /**
   * 第一层：轻量级健康检查
   * 检查进程状态、端口监听、内存泄漏、线程池状态
   */
  async assessBasicHealth() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // 进程状态检查
      const processScore = this.assessProcessHealth();
      
      // 端口监听检查
      const portScore = this.assessPortHealth();
      
      // 内存状态检查
      const memoryScore = this.assessMemoryHealth(memUsage);
      
      // 线程池状态检查
      const threadScore = await this.assessThreadPoolHealth();
      
      // GC状态检查
      const gcScore = this.assessGcHealth(memUsage);

      return {
        processScore,
        portScore,
        memoryScore,
        threadScore,
        gcScore,
        memoryUsage: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        },
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      };
    } catch (error) {
      logger.error('[SystemStatusService] 基础健康检查失败:', error);
      return {
        processScore: 0,
        portScore: 0,
        memoryScore: 0,
        threadScore: 0,
        gcScore: 0,
        error: error.message
      };
    }
  }

  /**
   * 第二层：依赖健康检查
   * 检查数据库连接池、缓存服务、消息队列
   */
  async assessDependencyHealth() {
    try {
      // 并行检查各项依赖
      const [
        dbHealth,
        cacheHealth,
        mqHealth
      ] = await Promise.all([
        this.assessDatabaseHealth(),
        this.assessCacheHealth(),
        this.assessMessageQueueHealth()
      ]);

      // 计算依赖健康分
      const dependencyScore = Math.round(
        dbHealth.score * 0.5 +  // 数据库权重50%
        cacheHealth.score * 0.3 +  // 缓存权重30%
        mqHealth.score * 0.2   // 消息队列权重20%
      );

      return {
        score: dependencyScore,
        database: dbHealth,
        cache: cacheHealth,
        messageQueue: mqHealth
      };
    } catch (error) {
      logger.error('[SystemStatusService] 依赖健康检查失败:', error);
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 第三层：业务健康检查
   * 检查核心业务流程、事务成功率、异常率
   */
  async assessBusinessHealth() {
    try {
      // 模拟业务健康检查指标
      const coreFlowHealth = await this.assessCoreFlowHealth();
      const transactionHealth = await this.assessTransactionHealth();
      const exceptionHealth = await this.assessExceptionHealth();

      // 计算业务健康分
      const businessScore = Math.round(
        coreFlowHealth.score * 0.4 +  // 核心流程权重40%
        transactionHealth.score * 0.35 +  // 事务权重35%
        exceptionHealth.score * 0.25   // 异常率权重25%
      );

      return {
        score: businessScore,
        coreFlow: coreFlowHealth,
        transaction: transactionHealth,
        exception: exceptionHealth
      };
    } catch (error) {
      logger.error('[SystemStatusService] 业务健康检查失败:', error);
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 进程健康评估
   */
  assessProcessHealth() {
    try {
      // 检查进程是否运行
      const isRunning = process.pid > 0;
      return isRunning ? 100 : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 端口健康评估
   */
  assessPortHealth() {
    try {
      // 检查关键端口是否在监听（模拟）
      const criticalPorts = [process.env.PORT || 4000];
      const listeningPorts = criticalPorts.length; // 假设所有关键端口都在监听
      return Math.round((listeningPorts / criticalPorts.length) * 100);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 内存健康评估
   */
  assessMemoryHealth(memUsage) {
    try {
      const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
      
      if (heapUsedPercent > 90) return 0;
      if (heapUsedPercent > 80) return 60;
      if (heapUsedPercent > 70) return 80;
      return 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 线程池健康评估
   */
  async assessThreadPoolHealth() {
    try {
      const activeHandles = process._getActiveHandles ? process._getActiveHandles().length : 0;
      const activeRequests = process._getActiveRequests ? process._getActiveRequests().length : 0;
      const totalActive = activeHandles + activeRequests;
      
      // 假设最大线程数为100
      const maxThreads = 100;
      const threadUsagePercent = Math.round((totalActive / maxThreads) * 100);
      
      if (threadUsagePercent > 90) return 0;
      if (threadUsagePercent > 75) return 60;
      if (threadUsagePercent > 50) return 80;
      return 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * GC健康评估
   */
  assessGcHealth(memUsage) {
    try {
      // 简化的GC健康评估
      const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
      
      // GC压力评估（基于堆内存使用率）
      if (heapUsedPercent > 85) return 60;  // GC压力大
      if (heapUsedPercent > 70) return 80;  // GC压力中等
      return 100;  // GC压力正常
    } catch (error) {
      return 0;
    }
  }

  /**
   * 数据库健康评估
   */
  async assessDatabaseHealth() {
    try {
      // 检查数据库连接
      const dbStartTime = Date.now();
      await pool.query('SELECT 1');
      const dbResponseTime = Date.now() - dbStartTime;
      
      // 检查连接池状态
      const poolStats = {
        totalCount: pool.totalCount || 0,
        idleCount: pool.idleCount || 0,
        waitingCount: pool.waitingCount || 0
      };
      
      const connectionUtilization = poolStats.totalCount > 0 ? 
        Math.round(((poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount) * 100) : 0;
      
      // 数据库健康评分
      let score = 100;
      if (dbResponseTime > 1000) score -= 30;  // 响应时间超过1秒
      if (dbResponseTime > 500) score -= 20;   // 响应时间超过500ms
      if (connectionUtilization > 90) score -= 40;  // 连接池使用率过高
      if (connectionUtilization > 75) score -= 20;  // 连接池使用率较高
      if (poolStats.waitingCount > 0) score -= 30;  // 有等待连接
      
      return {
        score: Math.max(0, score),
        responseTime: dbResponseTime,
        connectionUtilization: connectionUtilization,
        poolStats: poolStats
      };
    } catch (error) {
      logger.error('[SystemStatusService] 数据库健康检查失败:', error);
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 缓存健康评估
   */
  async assessCacheHealth() {
    try {
      const { healthCheck, isRedisAvailable } = require('../config/redis');
      
      if (!isRedisAvailable()) {
        return {
          score: 0,
          status: 'unavailable',
          error: 'Redis服务不可用'
        };
      }

      const health = await healthCheck();
      
      if (health.status !== 'healthy') {
        return {
          score: 40,
          status: 'unhealthy',
          error: health.error
        };
      }

      // 提取真实指标
      const redisVersion = health.info.redis_version;
      const memoryUsed = health.info.used_memory_human;
      const connectedClients = parseInt(health.info.connected_clients);
      
      let score = 100;
      if (connectedClients > 1000) score -= 20;
      
      return {
        score: score,
        status: 'healthy',
        details: {
          version: redisVersion,
          memoryUsed: memoryUsed,
          connectedClients: connectedClients
        }
      };
    } catch (error) {
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 消息队列健康评估
   */
  async assessMessageQueueHealth() {
    try {
      const { isRedisAvailable } = require('../config/redis');
      
      if (!isRedisAvailable()) {
        return { score: 0, status: 'unavailable', error: 'Redis不可用导致队列失效' };
      }

      // 尝试获取活跃队列的统计信息
      // 注意：这里需要根据项目中实际定义的队列名称来获取
      const queueNames = ['email', 'data_processing', 'report_generation'];
      let totalWaiting = 0;
      let totalFailed = 0;

      // 由于Bull队列实例在messageQueue.js中维护，这里采用简单探测
      // 实际项目中应从messageQueue模块导出队列实例进行查询
      
      return {
        score: 100, // 暂时返回100，表示Redis可用则队列基本功能正常
        status: 'healthy',
        details: {
          queues: queueNames.length,
          redisStatus: 'connected'
        }
      };
    } catch (error) {
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 核心流程健康评估
   */
  async assessCoreFlowHealth() {
    try {
      // 从审计日志中获取最近1小时的业务成功率
      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'success' OR status = 'completed') as success
        FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `);
      
      const total = parseInt(stats.rows[0].total || 0);
      const success = parseInt(stats.rows[0].success || 0);
      const successRate = total > 0 ? (success / total) * 100 : 100;
      
      let score = 100;
      if (successRate < 95) score = 60;
      else if (successRate < 98) score = 80;
      
      return {
        score: score,
        successRate: successRate.toFixed(2) + '%',
        totalOperations: total
      };
    } catch (error) {
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 事务健康评估
   */
  async assessTransactionHealth() {
    try {
      // 从数据库统计信息中获取事务提交/回滚比
      const stats = await pool.query(`
        SELECT 
          xact_commit as commits,
          xact_rollback as rollbacks
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
      
      const commits = parseInt(stats.rows[0].commits || 0);
      const rollbacks = parseInt(stats.rows[0].rollbacks || 0);
      const total = commits + rollbacks;
      const successRate = total > 0 ? (commits / total) * 100 : 100;
      
      let score = 100;
      if (successRate < 95) score = 50;
      else if (successRate < 99) score = 80;
      
      return {
        score: score,
        successRate: successRate.toFixed(4) + '%',
        commits,
        rollbacks
      };
    } catch (error) {
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 异常健康评估
   */
  async assessExceptionHealth() {
    try {
      // 从审计日志中获取最近1分钟的异常数
      const errorStats = await pool.query(`
        SELECT COUNT(*) as error_count
        FROM audit_logs
        WHERE success = FALSE
        AND created_at > NOW() - INTERVAL '1 minute'
      `);
      
      const totalStats = await pool.query(`
        SELECT COUNT(*) as total_count
        FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '1 minute'
      `);
      
      const exceptionsPerMinute = parseInt(errorStats.rows[0].error_count || 0);
      const totalRequests = parseInt(totalStats.rows[0].total_count || 0);
      const errorRate = totalRequests > 0 ? (exceptionsPerMinute / totalRequests) * 100 : 0;
      
      let score = 100;
      if (errorRate > 10) score = 0;
      else if (errorRate > 5) score = 40;
      else if (errorRate > 1) score = 70;
      else if (errorRate > 0.1) score = 90;
      
      return {
        score: Math.max(0, score),
        exceptionsPerMinute: exceptionsPerMinute,
        errorRate: errorRate.toFixed(2) + '%'
      };
    } catch (error) {
      logger.error('[SystemStatusService] 异常健康评估失败:', error);
      return {
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * 计算动态权重
   * 根据当前QPS和系统负载动态调整权重
   */
  async calculateDynamicWeights() {
    try {
      // 获取最近1分钟的QPS
      const stats = await pool.query(`
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '1 minute'
      `);
      
      const currentQps = parseInt(stats.rows[0].count || 0) / 60;
      const peakQps = 100; // 假设系统设计峰值QPS为100 (可根据实际情况调整)
      
      // 高负载时更关注性能和业务，基础权重降低
      if (currentQps > peakQps * 0.8) {
        return {
          performance: 0.4,  // 高负载时性能权重增加
          business: 0.6,     // 业务权重保持较高
          currentQps: currentQps.toFixed(2)
        };
      } else {
        return {
          performance: 0.3,  // 正常负载时性能权重较低
          business: 0.7,     // 业务权重较高
          currentQps: currentQps.toFixed(2)
        };
      }
    } catch (error) {
      logger.error('[SystemStatusService] 计算动态权重失败:', error);
      // 默认权重
      return {
        performance: 0.3,
        business: 0.7,
        currentQps: 0
      };
    }
  }

  /**
   * 测量事件循环延迟 - 兼容旧方法
   */
  measureEventLoopDelay() {
    return new Promise((resolve) => {
      const start = Date.now();
      setTimeout(() => {
        const delay = Date.now() - start;
        resolve(delay);
      }, 0);
    });
  }

  // ==================== 后端状态辅助方法 ====================

  /**
   * 识别后端异常模式
   * 包括：雪崩前兆、死锁/阻塞、内存泄漏等
   */
  async recognizeBackendAnomalyPatterns(basicHealth, dependencyHealth, businessHealth) {
    const patterns = [];
    const currentTime = this.getCurrentTime();
    
    try {
      // 雪崩前兆检测
      if (this.detectAvalanchePattern(basicHealth, dependencyHealth, businessHealth)) {
        patterns.push({
          type: 'avalanche_precursor',
          description: '检测到雪崩前兆：错误率缓慢上升，响应时间逐渐变长',
          confidence: 0.8,
          timestamp: currentTime.toISOString()
        });
      }
      
      // 死锁/阻塞检测
      if (this.detectDeadlockPattern(basicHealth)) {
        patterns.push({
          type: 'deadlock_blocking',
          description: '检测到死锁/阻塞模式：线程数突增，CPU使用率下降',
          confidence: 0.7,
          timestamp: currentTime.toISOString()
        });
      }
      
      // 内存泄漏检测
      if (this.detectMemoryLeakPattern(basicHealth)) {
        patterns.push({
          type: 'memory_leak',
          description: '检测到内存泄漏模式：内存使用率持续增长，GC频率增加',
          confidence: 0.9,
          timestamp: currentTime.toISOString()
        });
      }
      
      // 依赖服务异常检测
      if (dependencyHealth.score < 70) {
        patterns.push({
          type: 'dependency_failure',
          description: `依赖服务异常：依赖健康分 ${dependencyHealth.score} 低于阈值`,
          confidence: 0.6,
          timestamp: currentTime.toISOString()
        });
      }
      
      return {
        detectedPatterns: patterns,
        riskLevel: this.calculateRiskLevel(patterns),
        analysisTime: currentTime.toISOString()
      };
    } catch (error) {
      logger.error('[SystemStatusService] 异常模式识别失败:', error);
      return {
        detectedPatterns: [],
        riskLevel: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * 检测雪崩前兆模式
   */
  detectAvalanchePattern(basicHealth, dependencyHealth, businessHealth) {
    try {
      // 模拟雪崩前兆检测逻辑
      // 当业务健康分下降、响应时间上升、错误率增加时触发
      const businessScoreDrop = businessHealth.score < 85; // 业务分低于85
      const responseTimeIncrease = dependencyHealth.database?.responseTime > 500; // 数据库响应时间增加
      const errorRateIncrease = businessHealth.exception?.errorRate > 0.5; // 错误率增加
      
      return businessScoreDrop && (responseTimeIncrease || errorRateIncrease);
    } catch (error) {
      return false;
    }
  }

  /**
   * 检测死锁/阻塞模式
   */
  detectDeadlockPattern(basicHealth) {
    try {
      // 线程数突增且CPU使用率下降
      const threadSpike = basicHealth.threadScore < 60; // 线程池使用率过高
      const cpuDrop = basicHealth.memoryScore > 80; // 内存使用率高但CPU可能空闲
      
      return threadSpike && cpuDrop;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检测内存泄漏模式
   */
  detectMemoryLeakPattern(basicHealth) {
    try {
      // 内存使用率持续增长，GC压力增大
      const highMemoryUsage = basicHealth.memoryScore < 70; // 内存使用率过高
      const highGcPressure = basicHealth.gcScore < 70; // GC压力大
      
      return highMemoryUsage && highGcPressure;
    } catch (error) {
      return false;
    }
  }

  /**
   * 计算风险等级
   */
  calculateRiskLevel(patterns) {
    if (patterns.length === 0) return 'low';
    
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8).length;
    const criticalPatterns = patterns.filter(p => 
      ['avalanche_precursor', 'memory_leak', 'dependency_failure'].includes(p.type)
    ).length;
    
    if (highConfidencePatterns > 0 || criticalPatterns > 0) return 'high';
    if (patterns.length > 1) return 'medium';
    return 'low';
  }

  /**
   * 判定后端服务状态
   */
  determineBackendStatus(healthScore, anomalyPatterns) {
    // 检查异常模式
    const hasCriticalPattern = anomalyPatterns.detectedPatterns.some(p => 
      ['avalanche_precursor', 'memory_leak'].includes(p.type) && p.confidence > 0.7
    );
    
    // 状态判定逻辑
    if (healthScore >= 90 && !hasCriticalPattern) {
      return { status: 'healthy', statusText: '健康' };
    } else if (healthScore >= 70 || hasCriticalPattern) {
      return { status: 'warning', statusText: '亚健康' };
    } else {
      return { status: 'critical', statusText: '故障' };
    }
  }

  /**
   * 收集后端问题和建议
   */
  collectBackendIssuesAndSuggestions(basicHealth, dependencyHealth, businessHealth) {
    const issues = [];
    const suggestions = [];

    try {
      // 基础健康问题
      if (basicHealth.processScore < 100) {
        issues.push(`进程状态异常：得分 ${basicHealth.processScore}`);
        suggestions.push('检查进程是否正常运行');
      }
      
      if (basicHealth.memoryScore < 80) {
        issues.push(`内存状态异常：得分 ${basicHealth.memoryScore}`);
        suggestions.push('检查内存泄漏，优化内存使用');
      }
      
      if (basicHealth.threadScore < 80) {
        issues.push(`线程池状态异常：得分 ${basicHealth.threadScore}`);
        suggestions.push('检查线程池配置，避免线程泄漏');
      }

      // 依赖健康问题
      if (dependencyHealth.score < 80) {
        issues.push(`依赖服务异常：总分 ${dependencyHealth.score}`);
        
        if (dependencyHealth.database?.score < 70) {
          suggestions.push('优化数据库查询，检查连接池配置');
        }
        
        if (dependencyHealth.cache?.score < 70) {
          suggestions.push('检查缓存服务状态，优化缓存策略');
        }
        
        if (dependencyHealth.messageQueue?.score < 70) {
          suggestions.push('检查消息队列消费情况，避免消息堆积');
        }
      }

      // 业务健康问题
      if (businessHealth.score < 80) {
        issues.push(`业务健康异常：总分 ${businessHealth.score}`);
        
        if (businessHealth.coreFlow?.score < 70) {
          suggestions.push('检查核心业务流程，优化业务逻辑');
        }
        
        if (businessHealth.transaction?.score < 70) {
          suggestions.push('检查事务处理逻辑，确保事务正确性');
        }
        
        if (businessHealth.exception?.score < 70) {
          suggestions.push('分析异常日志，修复导致异常的问题');
        }
      }
      
      return { issues, suggestions };
    } catch (error) {
      logger.error('[SystemStatusService] 收集后端问题失败:', error);
      return { issues: ['收集问题时发生错误'], suggestions: ['请检查日志获取详细信息'] };
    }
  }

  /**
   * 评估数据库状态 - 获取真实运行指标
   * 包含：当前连接数、最大连接数、缓存命中率、慢查询数、表空间使用
   */
  async evaluateDatabaseStatus() {
    const startTime = Date.now();
    const startTimeObj = this.getCurrentTime();

    try {
      logger.info('[SystemStatusService] 开始采集数据库真实指标');

      // 1. 获取连接数信息 (当前连接 & 最大连接)
      const connInfoPromise = pool.query(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as current_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `).catch(err => {
        logger.error('[SystemStatusService] 获取连接数失败:', err.message);
        return { rows: [{ current_connections: 0, max_connections: 100 }] };
      });

      // 2. 获取缓存命中率
      const cacheHitPromise = pool.query(`
        SELECT 
          CASE 
            WHEN SUM(heap_blks_hit + heap_blks_read) > 0 
            THEN ROUND(SUM(heap_blks_hit) * 100.0 / SUM(heap_blks_hit + heap_blks_read), 2)
            ELSE 100.00 
          END as hit_rate
        FROM pg_statio_user_tables
      `).catch(err => {
        logger.error('[SystemStatusService] 获取缓存命中率失败:', err.message);
        return { rows: [{ hit_rate: 100 }] };
      });

      // 3. 获取慢查询数 (优先查询当前活跃的慢查询，以体现真实系统状态)
      const slowQueryPromise = (async () => {
        try {
          // 查询当前运行超过1秒的活跃查询 (真正反映当前系统压力的指标)
          const activeSlow = await pool.query(`
            SELECT count(*) as count 
            FROM pg_stat_activity 
            WHERE state = 'active' 
            AND now() - query_start > interval '1 second'
            AND pid <> pg_backend_pid()
          `);
          return parseInt(activeSlow.rows[0].count);
        } catch (e) {
          logger.error('[SystemStatusService] 获取活跃慢查询失败:', e.message);
          return 0;
        }
      })().catch(err => {
        logger.error('[SystemStatusService] 获取慢查询数异常:', err.message);
        return 0;
      });

      // 4. 获取表空间使用
      const dbSizePromise = pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) as db_size").catch(err => {
        logger.error('[SystemStatusService] 获取数据库大小失败:', err.message);
        return { rows: [{ db_size: 'Unknown' }] };
      });

      // 5. 获取数据库版本
      const versionPromise = pool.query('SELECT version()').catch(err => {
        logger.error('[SystemStatusService] 获取版本失败:', err.message);
        return { rows: [{ version: 'PostgreSQL Unknown' }] };
      });

      // 并行等待所有查询
      const [connInfo, cacheHit, slowQueries, dbSize, versionResult] = await Promise.all([
        connInfoPromise,
        cacheHitPromise,
        slowQueryPromise,
        dbSizePromise,
        versionPromise
      ]);

      const activeConnections = parseInt(connInfo.rows[0].current_connections);
      const maxConnections = parseInt(connInfo.rows[0].max_connections);
      const hitRate = parseFloat(cacheHit.rows[0].hit_rate);
      const tableSpaceUsage = dbSize.rows[0].db_size;
      
      const fullVersion = versionResult.rows[0]?.version || '';
      const versionMatch = fullVersion.match(/PostgreSQL\s+(\d+\.\d+)/);
      const dbVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : fullVersion.substring(0, 50);

      // 计算健康分
      let healthScore = 100;
      const connUsage = activeConnections / maxConnections;
      if (connUsage > 0.9) healthScore -= 30;
      else if (connUsage > 0.7) healthScore -= 15;
      
      if (hitRate < 90) healthScore -= 20;
      else if (hitRate < 95) healthScore -= 10;
      
      if (slowQueries > 10) healthScore -= 20;
      else if (slowQueries > 0) healthScore -= 5;

      // 状态判定
      let status = 'healthy';
      let statusText = '健康';
      if (healthScore < 60) {
        status = 'critical';
        statusText = '故障';
      } else if (healthScore < 85) {
        status = 'warning';
        statusText = '亚健康';
      }

      const evaluationTime = Date.now() - startTime;

      const result = {
        success: true,
        status,
        statusText,
        healthScore,
        metrics: {
          version: dbVersion,
          activeConnections,
          maxConnections,
          cacheHitRate: hitRate,
          slowQueries,
          tableSpaceUsage,
          lastUpdate: startTimeObj.toLocaleString('zh-CN', { hour12: false })
        },
        评估时间: `${evaluationTime}ms`,
        lastUpdate: startTimeObj.toLocaleString('zh-CN', { hour12: false }),
        issues: healthScore < 85 ? ['检测到性能指标波动，请关注详情'] : [],
        suggestions: healthScore < 85 ? ['建议检查索引优化或增加资源'] : []
      };

      // 异步处理告警触发
      this.processEvaluationResult('database', result).catch(err => {
        logger.error('[SystemStatusService] 触发数据库状态告警失败:', err);
      });

      return result;
    } catch (error) {
      logger.error('[SystemStatusService] 数据库状态采集核心异常:', error);
      return {
        success: false,
        status: 'critical',
        statusText: '评估失败',
        healthScore: 0,
        error: error.message,
        lastUpdate: this.getCurrentTime().toLocaleString('zh-CN', { hour12: false }),
      };
    }
  }

  /**
   * 维度1：连接与基础状态评估（40%权重）
   */
  async assessDatabaseConnectionHealth() {
    try {
      // 并行检查连接相关指标
      const [
        versionResult,
        connectionResult,
        poolStats
      ] = await Promise.allSettled([
        // 数据库版本
        pool.query('SELECT version()'),
        // 活跃连接数
        pool.query("SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'"),
        // 连接池状态
        this.getConnectionPoolStats()
      ]);

      // 解析版本信息
      let dbVersion = 'Unknown';
      if (versionResult.status === 'fulfilled' && versionResult.value.rows.length > 0) {
        const fullVersion = versionResult.value.rows[0]?.version || '';
        const versionMatch = fullVersion.match(/PostgreSQL\s+(\d+\.\d+)/);
        dbVersion = versionMatch ? `PostgreSQL ${versionMatch[1]}` : fullVersion.substring(0, 50);
      }

      // 解析连接数
      const activeConnections = connectionResult.status === 'fulfilled' 
        ? parseInt(connectionResult.value.rows[0]?.active_connections || 0)
        : 0;
      
      const maxConnections = 100; // 假设最大连接数
      const connectionPercent = Math.round((activeConnections / maxConnections) * 100);

      // 连接可用性评分
      let connectionScore = 100;
      if (connectionPercent > 90) {
        connectionScore -= 40;
      } else if (connectionPercent > 75) {
        connectionScore -= 20;
      } else if (connectionPercent > 60) {
        connectionScore -= 10;
      }

      // 连接池状态评分
      let poolScore = 100;
      if (poolStats.status === 'fulfilled') {
        const stats = poolStats.value;
        if (stats.waitingCount > 0) poolScore -= 30;
        if (stats.utilization > 90) poolScore -= 40;
        else if (stats.utilization > 75) poolScore -= 20;
      }

      // 长连接存活率（基于活跃连接与空闲连接比例）
      let longConnectionSurvivalRate = 100;
      if (poolStats.status === 'fulfilled') {
        const stats = poolStats.value;
        const total = stats.totalCount || 1;
        longConnectionSurvivalRate = Math.round(((total - stats.waitingCount) / total) * 100);
      }

      // 连接层综合评分
      const overallConnectionScore = Math.round(
        connectionScore * 0.4 + 
        poolScore * 0.4 + 
        longConnectionSurvivalRate * 0.2
      );

      return {
        score: Math.max(0, overallConnectionScore),
        version: dbVersion,
        activeConnections: activeConnections,
        maxConnections: maxConnections,
        connectionPercent: connectionPercent,
        poolUtilization: poolStats.status === 'fulfilled' ? poolStats.value.utilization : 0,
        longConnectionSurvivalRate: longConnectionSurvivalRate,
        connectionScore: connectionScore,
        poolScore: poolScore
      };
    } catch (error) {
      logger.error('[SystemStatusService] 连接健康检查失败:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * 维度2：性能评估（30%权重）
   */
  async assessDatabasePerformanceHealth() {
    try {
      // 并行检查性能指标
      const [
        cacheResult,
        slowResult,
        queryPerformance
      ] = await Promise.allSettled([
        // 缓存命中率
        pool.query(`
          SELECT 
            SUM(heap_blks_hit) as heap_blks_hit,
            SUM(heap_blks_read) as heap_blks_read,
            SUM(idx_blks_hit) as idx_blks_hit,
            SUM(idx_blks_read) as idx_blks_read
          FROM pg_statio_user_tables
        `),
        // 慢查询数量 (改为查询当前活跃慢查询，以反映实时状态)
        pool.query(`
          SELECT count(*) as slow_count 
          FROM pg_stat_activity 
          WHERE state = 'active' 
          AND now() - query_start > interval '1 second'
          AND pid <> pg_backend_pid()
        `),
        // 查询性能测试
        this.testQueryPerformance()
      ]);

      // 解析缓存命中率
      let cacheHitRate = 100;
      if (cacheResult.status === 'fulfilled' && cacheResult.value.rows.length > 0) {
        const heapHit = parseInt(cacheResult.value.rows[0]?.heap_blks_hit || 0);
        const heapRead = parseInt(cacheResult.value.rows[0]?.heap_blks_read || 0);
        const idxHit = parseInt(cacheResult.value.rows[0]?.idx_blks_hit || 0);
        const idxRead = parseInt(cacheResult.value.rows[0]?.idx_blks_read || 0);
        
        const totalHits = heapHit + idxHit;
        const totalReads = heapRead + idxRead;
        const totalAccess = totalHits + totalReads;
        
        if (totalAccess > 0) {
          cacheHitRate = Math.round((totalHits / totalAccess) * 100);
        }
      }

      // 解析慢查询数量
      const slowQueries = slowResult.status === 'fulfilled'
        ? parseInt(slowResult.value.rows[0]?.slow_count || 0)
        : 0;

      // 解析查询性能
      const queryResponseTime = queryPerformance.status === 'fulfilled'
        ? queryPerformance.value
        : 100;

      // 锁等待时间
      let lockWaitTime = 0;
      try {
        const lockRes = await pool.query(`
          SELECT sum(EXTRACT(EPOCH FROM (now() - query_start))) * 1000 as total_wait_time
          FROM pg_stat_activity
          WHERE wait_event_type IS NOT NULL
          AND state = 'active'
        `);
        lockWaitTime = Math.round(parseFloat(lockRes.rows[0]?.total_wait_time || 0));
      } catch (e) {
        logger.warn('[SystemStatusService] 获取锁等待时间失败:', e.message);
      }

      // 性能评分计算
      let cacheScore = 100;
      if (cacheHitRate < 80) {
        cacheScore = 0;
      } else if (cacheHitRate < 90) {
        cacheScore = 60;
      } else if (cacheHitRate < 95) {
        cacheScore = 80;
      }

      let slowQueryScore = 100;
      if (slowQueries > 10) {
        slowQueryScore = 0;
      } else if (slowQueries > 5) {
        slowQueryScore = 60;
      } else if (slowQueries > 0) {
        slowQueryScore = 80;
      }

      let responseTimeScore = 100;
      if (queryResponseTime > 200) {
        responseTimeScore = 0;
      } else if (queryResponseTime > 100) {
        responseTimeScore = 60;
      } else if (queryResponseTime > 50) {
        responseTimeScore = 80;
      }

      let lockWaitScore = 100;
      if (lockWaitTime > 100) {
        lockWaitScore = 0;
      } else if (lockWaitTime > 50) {
        lockWaitScore = 60;
      }

      // 性能综合评分
      const overallPerformanceScore = Math.round(
        cacheScore * 0.3 + 
        slowQueryScore * 0.25 + 
        responseTimeScore * 0.25 + 
        lockWaitScore * 0.2
      );

      return {
        score: Math.max(0, overallPerformanceScore),
        cacheHitRate: cacheHitRate,
        slowQueries: slowQueries,
        queryResponseTime: queryResponseTime,
        lockWaitTime: lockWaitTime,
        cacheScore: cacheScore,
        slowQueryScore: slowQueryScore,
        responseTimeScore: responseTimeScore,
        lockWaitScore: lockWaitScore
      };
    } catch (error) {
      logger.error('[SystemStatusService] 性能健康检查失败:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * 维度3：资源评估（20%权重）
   */
  async assessDatabaseResourceHealth() {
    try {
      // 1. 获取磁盘IO统计 (基于 blocks read/hit)
      const ioStats = await pool.query(`
        SELECT 
          sum(blks_read) as total_read,
          sum(blks_hit) as total_hit
        FROM pg_stat_database
      `);
      
      const totalIO = parseInt(ioStats.rows[0].total_read) + parseInt(ioStats.rows[0].total_hit);
      const diskIOUsage = totalIO > 0 ? Math.min(100, Math.round((parseInt(ioStats.rows[0].total_read) / totalIO) * 100)) : 0;

      // 2. 获取磁盘空间使用率 (通过数据库大小占预设限制的比例)
      // 使用更合理的默认限制 (如 100GB) 或从配置获取
      const dbSizeRes = await pool.query("SELECT pg_database_size(current_database()) as size");
      const dbSizeBytes = parseInt(dbSizeRes.rows[0].size);
      const DISK_LIMIT_BYTES = 100 * 1024 * 1024 * 1024; // 100GB
      const diskSpaceUsage = Math.min(100, Math.round((dbSizeBytes / DISK_LIMIT_BYTES) * 100));

      // 3. 内存和CPU (由于PG内部难获取OS级别指标，采用连接数作为压力负载代理)
      const connRes = await pool.query("SELECT count(*) as active, (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max FROM pg_stat_activity");
      const cpuUsage = Math.round((connRes.rows[0].active / connRes.rows[0].max) * 100);
      const memoryUsage = cpuUsage; // 简化代理

      // 资源评分计算
      let cpuScore = 100;
      if (cpuUsage > 80) cpuScore = 0;
      else if (cpuUsage > 70) cpuScore = 60;
      else if (cpuUsage > 60) cpuScore = 80;

      let memoryScore = 100;
      if (memoryUsage > 85) memoryScore = 0;
      else if (memoryUsage > 75) memoryScore = 60;
      else if (memoryUsage > 65) memoryScore = 80;

      let diskIOScore = 100;
      if (diskIOUsage > 80) diskIOScore = 0;
      else if (diskIOUsage > 70) diskIOScore = 60;
      else if (diskIOUsage > 60) diskIOScore = 80;

      let diskSpaceScore = 100;
      if (diskSpaceUsage > 90) diskSpaceScore = 0;
      else if (diskSpaceUsage > 80) diskSpaceScore = 60;
      else if (diskSpaceUsage > 70) diskSpaceScore = 80;

      // 资源综合评分
      const overallResourceScore = Math.round(
        cpuScore * 0.25 + 
        memoryScore * 0.25 + 
        diskIOScore * 0.25 + 
        diskSpaceScore * 0.25
      );

      return {
        score: Math.max(0, overallResourceScore),
        cpuUsage: cpuUsage,
        memoryUsage: memoryUsage,
        diskIOUsage: diskIOUsage,
        diskSpaceUsage: diskSpaceUsage,
        cpuScore: cpuScore,
        memoryScore: memoryScore,
        diskIOScore: diskIOScore,
        diskSpaceScore: diskSpaceScore
      };
    } catch (error) {
      logger.error('[SystemStatusService] 资源健康检查失败:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * 维度4：数据完整性评估（10%权重）
   */
  async assessDatabaseIntegrityHealth() {
    try {
      // 获取真实数据库统计信息
      const stats = await pool.query(`
        SELECT 
          deadlocks,
          conflicts,
          xact_rollback
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
      
      const deadlockCount = parseInt(stats.rows[0].deadlocks || 0);
      const conflictCount = parseInt(stats.rows[0].conflicts || 0);
      const rollbackCount = parseInt(stats.rows[0].xact_rollback || 0);

      // 完整性评分计算
      let integrityScore = 100;
      
      // 冲突评分
      if (conflictCount > 0) {
        integrityScore -= Math.min(40, conflictCount * 5);
      }

      // 死锁评分
      if (deadlockCount > 5) {
        integrityScore -= 30;
      } else if (deadlockCount > 0) {
        integrityScore -= 15;
      }

      // 回滚评分 (代表事务失败)
      if (rollbackCount > 100) {
        integrityScore -= 20;
      }

      return {
        score: Math.max(0, integrityScore),
        deadlockCount: deadlockCount,
        conflictCount: conflictCount,
        rollbackCount: rollbackCount
      };
    } catch (error) {
      logger.error('[SystemStatusService] 完整性健康检查失败:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * 获取连接池统计信息
   */
  async getConnectionPoolStats() {
    try {
      const poolStats = {
        totalCount: pool.totalCount || 0,
        idleCount: pool.idleCount || 0,
        waitingCount: pool.waitingCount || 0
      };
      
      const utilization = poolStats.totalCount > 0 ? 
        Math.round(((poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount) * 100) : 0;
      
      return {
        ...poolStats,
        utilization: utilization
      };
    } catch (error) {
      return {
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
        utilization: 0,
        error: error.message
      };
    }
  }

  /**
   * 测试查询性能
   */
  async testQueryPerformance() {
    try {
      const startTime = Date.now();
      await pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      return responseTime;
    } catch (error) {
      return 1000; // 失败时返回较差的响应时间
    }
  }

  // ==================== 数据库状态辅助方法 ====================

  /**
   * 判定数据库状态
   */
  determineDatabaseStatus(healthScore, healthData) {
    // 检查关键维度阈值
    const criticalDimensions = ['connection', 'performance'];
    const hasCriticalIssue = criticalDimensions.some(dim => 
      healthData[dim].score < 60
    );
    
    if (healthScore >= 90 && !hasCriticalIssue) {
      return { status: 'healthy', statusText: '健康' };
    } else if (healthScore >= 70 || hasCriticalIssue) {
      return { status: 'warning', statusText: '亚健康' };
    } else {
      return { status: 'critical', statusText: '故障' };
    }
  }

  /**
   * 收集数据库问题和建议
   */
  collectDatabaseIssuesAndSuggestions(healthData) {
    const issues = [];
    const suggestions = [];

    // 连接层问题
    if (healthData.connection.score < 80) {
      issues.push(`连接层状态异常：得分 ${healthData.connection.score}`);
      if (healthData.connection.connectionPercent > 75) {
        suggestions.push('检查数据库连接池配置，考虑增加最大连接数');
      }
      if (healthData.connection.poolUtilization > 80) {
        suggestions.push('监控连接使用情况，避免连接泄漏');
      }
    }

    // 性能层问题
    if (healthData.performance.score < 80) {
      issues.push(`性能层状态异常：得分 ${healthData.performance.score}`);
      if (healthData.performance.cacheHitRate < 90) {
        suggestions.push('优化查询语句，检查索引使用情况');
        suggestions.push('考虑增加缓存配置');
      }
      if (healthData.performance.slowQueries > 5) {
        suggestions.push('分析慢查询日志，优化SQL语句');
        suggestions.push('使用EXPLAIN分析查询执行计划');
      }
      if (healthData.performance.queryResponseTime > 100) {
        suggestions.push('检查数据库负载，考虑性能优化');
      }
    }

    // 资源层问题
    if (healthData.resource.score < 80) {
      issues.push(`资源层状态异常：得分 ${healthData.resource.score}`);
      if (healthData.resource.cpuUsage > 70) {
        suggestions.push('检查CPU密集型查询，考虑优化');
      }
      if (healthData.resource.memoryUsage > 80) {
        suggestions.push('检查内存使用情况，考虑增加内存');
      }
      if (healthData.resource.diskSpaceUsage > 80) {
        suggestions.push('清理磁盘空间，考虑数据归档');
      }
    }

    // 完整性层问题
    if (healthData.integrity.score < 90) {
      issues.push(`数据完整性异常：得分 ${healthData.integrity.score}`);
      if (healthData.integrity.deadlockCount > 0) {
        suggestions.push('检查事务隔离级别，优化事务逻辑');
      }
      if (healthData.integrity.replicationErrors > 0) {
        suggestions.push('检查主从复制配置，修复复制错误');
      }
    }

    return { issues, suggestions };
  }

  /**
   * 执行数据库类型特定检查
   */
  async performDatabaseTypeSpecificChecks() {
    try {
      const checks = [];
      
      // PostgreSQL特定检查
      const postgresqlChecks = await this.performPostgreSQLChecks();
      checks.push({
        type: 'PostgreSQL',
        checks: postgresqlChecks
      });

      // Redis特定检查（如果可用）
      const redisChecks = await this.performRedisChecks();
      if (redisChecks.length > 0) {
        checks.push({
          type: 'Redis',
          checks: redisChecks
        });
      }

      return checks;
    } catch (error) {
      logger.error('[SystemStatusService] 数据库类型特定检查失败:', error);
      return [];
    }
  }

  /**
   * PostgreSQL特定检查
   */
  async performPostgreSQLChecks() {
    try {
      const checks = [];
      
      // 检查线程连接状态
      const threadCheck = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE state = 'active') as active_threads,
          COUNT(*) FILTER (WHERE state = 'idle') as idle_threads
        FROM pg_stat_activity
      `);
      
      const activeThreads = parseInt(threadCheck.rows[0]?.active_threads || 0);
      const idleThreads = parseInt(threadCheck.rows[0]?.idle_threads || 0);
      
      checks.push({
        metric: 'Threads_connected',
        value: `${activeThreads + idleThreads}`,
        status: activeThreads < 80 ? 'good' : 'warning',
        threshold: 'Threads_running < 80%'
      });

      // 检查PostgreSQL缓冲池命中率（使用数据库级别统计，更具代表性）
      const bufferCheck = await pool.query(`
        SELECT 
          CASE 
            WHEN SUM(blks_hit + blks_read) > 0 
            THEN ROUND(SUM(blks_hit) * 100.0 / SUM(blks_hit + blks_read), 2)
            ELSE 100 
          END as buffer_hit_rate
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
      
      const bufferHitRate = parseFloat(bufferCheck.rows[0]?.buffer_hit_rate || 100);
      
      checks.push({
        metric: 'Buffer_pool_hit_rate',
        value: `${bufferHitRate}%`,
        status: bufferHitRate > 99 ? 'good' : bufferHitRate > 95 ? 'warning' : 'critical',
        threshold: '> 99%'
      });

      // 检查慢查询 (改为查询当前活跃慢查询，以体现真实系统状态)
      const slowCheck = await pool.query(`
        SELECT COUNT(*) as slow_count 
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND now() - query_start > interval '1 second'
        AND pid <> pg_backend_pid()
      `);
      
      const slowCount = parseInt(slowCheck.rows[0]?.slow_count || 0);
      
      checks.push({
        metric: 'Slow_queries',
        value: slowCount.toString(),
        status: slowCount < 5 ? 'good' : slowCount < 10 ? 'warning' : 'critical',
        threshold: '< 5 (active)'
      });

      // 检查中止连接
      const abortCheck = await pool.query(`
        SELECT COUNT(*) as aborted_connects
        FROM pg_stat_activity 
        WHERE state = 'idle in transaction' 
        AND now() - query_start > interval '5 minutes'
      `);
      
      const abortedCount = parseInt(abortCheck.rows[0]?.aborted_connects || 0);
      
      checks.push({
        metric: 'Aborted_connects',
        value: abortedCount.toString(),
        status: abortedCount < 5 ? 'good' : abortedCount < 10 ? 'warning' : 'critical',
        threshold: '< 1%'
      });

      return checks;
    } catch (error) {
      logger.error('[SystemStatusService] PostgreSQL特定检查失败:', error);
      return [{
        metric: 'Check_Error',
        value: error.message,
        status: 'error',
        threshold: 'N/A'
      }];
    }
  }

  /**
   * Redis特定检查
   */
  async performRedisChecks() {
    try {
      const { healthCheck, isRedisAvailable } = require('../config/redis');
      
      if (!isRedisAvailable()) {
        return [{
          metric: 'Redis_Status',
          value: 'Disconnected',
          status: 'critical',
          threshold: 'Connected'
        }];
      }

      const health = await healthCheck();
      const checks = [];
      
      if (health.status === 'healthy') {
        checks.push({
          metric: 'Redis_Status',
          value: 'Connected',
          status: 'good',
          threshold: 'Connected'
        });
        
        checks.push({
          metric: 'Redis_Version',
          value: health.info.redis_version,
          status: 'good',
          threshold: 'N/A'
        });
        
        checks.push({
          metric: 'Used_Memory',
          value: health.info.used_memory_human,
          status: 'good',
          threshold: 'N/A'
        });
        
        checks.push({
          metric: 'Connected_Clients',
          value: health.info.connected_clients,
          status: parseInt(health.info.connected_clients) < 1000 ? 'good' : 'warning',
          threshold: '< 1000'
        });
      } else {
        checks.push({
          metric: 'Redis_Status',
          value: 'Error',
          status: 'critical',
          threshold: 'Connected'
        });
      }

      return checks;
    } catch (error) {
      logger.error('[SystemStatusService] Redis特定检查失败:', error);
      return [];
    }
  }

  /**
   * 处理评估结果并生成告警
   * @param {string} type 组件类型
   * @param {Object} result 评估结果
   */
  async processEvaluationResult(type, result) {
    if (!result || !result.issues || result.issues.length === 0) return;

    for (const issue of result.issues) {
      // 只对严重或中等问题生成告警
      const level = result.healthScore < 40 ? 'critical' : (result.healthScore < 70 ? 'major' : 'minor');
      
      try {
        await alertService.createAlert({
          type: type,
          level: level,
          title: issue.title || `系统组件异常: ${type}`,
          content: issue.description || issue,
          source: type === 'database' ? 'PostgreSQL' : (type === 'backend' ? 'AI-Server' : 'Client-App')
        });
      } catch (error) {
        logger.error(`[SystemStatusService] 自动创建告警失败 (${type}):`, error.message);
      }
    }
  }

  /**
   * 综合评估系统整体状态
   * 基于服务依赖图加权计算 + 智能降级判定 + 状态变更防抖机制
   */
  async evaluateOverallSystemStatus() {
    const startTime = Date.now();
    
    try {
      console.log('[SystemStatusService] 开始综合系统状态评估');

      // 并行评估各个组件状态
      const [
        clientStatus,
        backendStatus,
        databaseStatus
      ] = await Promise.all([
        this.evaluateClientStatus(),
        this.evaluateBackendStatus(),
        this.evaluateDatabaseStatus()
      ]);

      // 服务依赖图加权计算
      const serviceNodeWeights = {
        entry: 0.20,    // 入口网关
        auth: 0.15,     // 认证服务
        core: 0.40,     // 核心业务服务
        data: 0.25      // 数据服务
      };

      // 计算各节点健康分
      const nodeHealthScores = {
        entry: clientStatus.success ? clientStatus.healthScore : 0, // 客户端作为入口
        auth: backendStatus.success ? backendStatus.healthScore : 0, // 后端服务作为认证
        core: backendStatus.success ? backendStatus.healthScore : 0, // 核心业务
        data: databaseStatus.success ? databaseStatus.healthScore : 0  // 数据库
      };

      // 计算加权整体健康分
      const overallHealthScore = Math.round(
        nodeHealthScores.entry * serviceNodeWeights.entry +
        nodeHealthScores.auth * serviceNodeWeights.auth +
        nodeHealthScores.core * serviceNodeWeights.core +
        nodeHealthScores.data * serviceNodeWeights.data
      );

      // 智能状态判定（考虑历史趋势）
      const intelligentStatus = await this.performIntelligentStatusDetermination(
        overallHealthScore, 
        { clientStatus, backendStatus, databaseStatus },
        nodeHealthScores
      );

      // 状态变更防抖机制
      const stateTransitionResult = this.applyStateTransitionDebouncing(intelligentStatus);

      // 计算可用率（基于24小时数据）
      const availabilityResult = await this.calculateSystemAvailability();

      const evaluationTime = Date.now() - startTime;

      // 5. 触发告警处理
      await Promise.all([
        this.processEvaluationResult('client', clientStatus),
        this.processEvaluationResult('backend', backendStatus),
        this.processEvaluationResult('database', databaseStatus)
      ]);

      return {
        success: true,
        status: stateTransitionResult.currentStatus,
        statusText: this.getStatusText(stateTransitionResult.currentStatus),
        healthScore: overallHealthScore,
        availability: availabilityResult.availability,
        metrics: {
          overallHealthScore: overallHealthScore,
          serviceNodeHealth: {
            entry: { score: nodeHealthScores.entry, weight: serviceNodeWeights.entry },
            auth: { score: nodeHealthScores.auth, weight: serviceNodeWeights.auth },
            core: { score: nodeHealthScores.core, weight: serviceNodeWeights.core },
            data: { score: nodeHealthScores.data, weight: serviceNodeWeights.data }
          },
          componentStatus: {
            client: clientStatus,
            backend: backendStatus,
            database: databaseStatus
          },
          intelligentAnalysis: intelligentStatus,
          stateTransition: stateTransitionResult
        },
        availabilityAnalysis: availabilityResult,
        评估时间: `${evaluationTime}ms`,
        lastUpdate: this.getCurrentTime().toISOString(),
        recommendations: this.generateSystemRecommendations(intelligentStatus, { clientStatus, backendStatus, databaseStatus })
      };
    } catch (error) {
      logger.error('[SystemStatusService] 综合系统状态评估失败:', error);
      return {
        success: false,
        status: 'critical',
        statusText: '评估失败',
        healthScore: 0,
        error: error.message,
        lastUpdate: this.getCurrentTime().toISOString()
      };
    }
  }

  /**
   * 智能状态判定
   * 考虑历史趋势、异常模式、预测性判定
   */
  async performIntelligentStatusDetermination(healthScore, componentStatuses, nodeHealthScores) {
    try {
      // 计算趋势分析
      const trendAnalysis = await this.calculateTrendAnalysis(healthScore);
      
      // 异常模式汇总
      const anomalyPatterns = this.consolidateAnomalyPatterns(componentStatuses);
      
      // 预测性判定
      const predictiveAnalysis = this.performPredictiveAnalysis(healthScore, trendAnalysis, anomalyPatterns);
      
      // 依赖关系影响分析
      const dependencyImpact = this.analyzeDependencyImpact(nodeHealthScores);
      
      // 业务影响评估
      const businessImpact = this.assessBusinessImpact(componentStatuses);

      return {
        healthScore: healthScore,
        trendAnalysis: trendAnalysis,
        anomalyPatterns: anomalyPatterns,
        predictiveAnalysis: predictiveAnalysis,
        dependencyImpact: dependencyImpact,
        businessImpact: businessImpact,
        recommendationLevel: this.determineRecommendationLevel(healthScore, anomalyPatterns, predictiveAnalysis)
      };
    } catch (error) {
      logger.error('[SystemStatusService] 智能状态判定失败:', error);
      return {
        healthScore: healthScore,
        error: error.message
      };
    }
  }

  /**
   * 计算趋势分析
   */
  async calculateTrendAnalysis(currentHealthScore) {
    try {
      // 从审计日志中获取最近30分钟，每5分钟一个点的成功率作为趋势参考
      const trendStats = await pool.query(`
        WITH periods AS (
          SELECT generate_series(
            date_trunc('minute', NOW()) - INTERVAL '25 minutes',
            date_trunc('minute', NOW()),
            '5 minutes'::interval
          ) as period
        )
        SELECT 
          p.period,
          COUNT(al.id) as total_count,
          COUNT(al.id) FILTER (WHERE al.success IS NOT FALSE) as success_count
        FROM periods p
        LEFT JOIN audit_logs al ON al.created_at >= p.period AND al.created_at < p.period + INTERVAL '5 minutes'
        GROUP BY p.period
        ORDER BY p.period DESC
      `);

      // 将成功率转化为模拟的健康分趋势
      const historicalScores = trendStats.rows.map(row => {
        const total = parseInt(row.total_count);
        const success = parseInt(row.success_count);
        const successRate = total > 0 ? (success / total) * 100 : 100;
        // 成功率对健康分的影响：假设100%成功率对应当前健康分，每下降1%成功率下降2分
        return Math.max(0, Math.min(100, currentHealthScore - (100 - successRate) * 2));
      });

      // 如果数据不足，补齐
      while (historicalScores.length < 5) {
        historicalScores.push(currentHealthScore);
      }
      
      // 计算趋势方向和速度
      const recentScores = historicalScores.slice(0, 3);
      const olderScores = historicalScores.slice(3);
      
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
      
      const trendDirection = recentAvg > olderAvg ? '上升' : recentAvg < olderAvg ? '下降' : '稳定';
      const trendSpeed = Math.abs(recentAvg - olderAvg);
      
      // 计算下降速度（每分钟下降的百分点）
      const declineRate = trendDirection === '下降' ? Math.round(trendSpeed * 12) : 0; // 假设5分钟窗口

      return {
        currentScore: currentHealthScore,
        trendDirection: trendDirection,
        trendSpeed: Math.round(trendSpeed * 100) / 100,
        declineRate: declineRate, // 每分钟下降百分点
        isRapidDecline: declineRate > 10,
        stabilityIndex: this.calculateStabilityIndex(historicalScores),
        historicalScores: historicalScores
      };
    } catch (error) {
      logger.error('[SystemStatusService] 计算趋势分析失败:', error);
      return {
        currentScore: currentHealthScore,
        trendDirection: '稳定',
        trendSpeed: 0,
        declineRate: 0,
        isRapidDecline: false,
        stabilityIndex: 0,
        historicalScores: [currentHealthScore, currentHealthScore, currentHealthScore, currentHealthScore, currentHealthScore]
      };
    }
  }

  /**
   * 计算稳定性指数
   */
  calculateStabilityIndex(scores) {
    try {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      
      // 稳定性指数：标准差越小，稳定性越高
      const stabilityIndex = Math.max(0, 100 - (standardDeviation * 10));
      return Math.round(stabilityIndex);
    } catch (error) {
      return 50;
    }
  }

  /**
   * 汇总异常模式
   */
  consolidateAnomalyPatterns(componentStatuses) {
    const allPatterns = [];
    
    try {
      // 汇总客户端异常模式
      if (componentStatuses.clientStatus?.patternAnalysis?.detectedPatterns) {
        allPatterns.push(...componentStatuses.clientStatus.patternAnalysis.detectedPatterns.map(p => ({
          ...p,
          source: 'client'
        })));
      }
      
      // 汇总后端异常模式
      if (componentStatuses.backendStatus?.anomalyPatterns?.detectedPatterns) {
        allPatterns.push(...componentStatuses.backendStatus.anomalyPatterns.detectedPatterns.map(p => ({
          ...p,
          source: 'backend'
        })));
      }
      
      // 按风险等级分类
      const patternsByRisk = {
        high: allPatterns.filter(p => p.confidence > 0.8),
        medium: allPatterns.filter(p => p.confidence >= 0.6 && p.confidence <= 0.8),
        low: allPatterns.filter(p => p.confidence < 0.6)
      };
      
      return {
        totalPatterns: allPatterns.length,
        patternsByRisk: patternsByRisk,
        criticalPatterns: allPatterns.filter(p => 
          ['avalanche_precursor', 'memory_leak', 'dependency_failure'].includes(p.type)
        ),
        patternSummary: this.generatePatternSummary(allPatterns)
      };
    } catch (error) {
      return {
        totalPatterns: 0,
        patternsByRisk: { high: [], medium: [], low: [] },
        criticalPatterns: [],
        patternSummary: '无法分析异常模式'
      };
    }
  }

  /**
   * 生成异常模式摘要
   */
  generatePatternSummary(patterns) {
    if (patterns.length === 0) return '未检测到异常模式';
    
    const patternTypes = [...new Set(patterns.map(p => p.type))];
    const typeCount = patternTypes.length;
    
    return `检测到 ${patterns.length} 个异常模式，涉及 ${typeCount} 种类型：${patternTypes.join('、')}`;
  }

  /**
   * 预测性分析
   */
  performPredictiveAnalysis(healthScore, trendAnalysis, anomalyPatterns) {
    try {
      let prediction = {
        shortTermForecast: 'stable', // 短期预测：stable, improving, degrading
        riskLevel: 'low', // 风险等级：low, medium, high, critical
        predictedFailureTime: null, // 预测故障时间
        confidence: 0 // 预测置信度
      };
      
      // 基于健康分和趋势进行预测
      if (healthScore >= 90) {
        prediction.shortTermForecast = 'stable';
        prediction.riskLevel = 'low';
        prediction.confidence = 0.9;
      } else if (healthScore >= 70) {
        if (trendAnalysis.isRapidDecline) {
          prediction.shortTermForecast = 'degrading';
          prediction.riskLevel = 'high';
          prediction.confidence = 0.7;
          // 基于下降速率预测故障时间 (健康分降至0所需时间)
          const failureMinutes = trendAnalysis.declineRate > 0 ? Math.round(healthScore / trendAnalysis.declineRate) : 60;
          prediction.predictedFailureTime = new Date(Date.now() + failureMinutes * 60000).toISOString();
        } else {
          prediction.shortTermForecast = 'stable';
          prediction.riskLevel = 'medium';
          prediction.confidence = 0.6;
        }
      } else {
        prediction.shortTermForecast = 'degrading';
        prediction.riskLevel = 'high';
        prediction.confidence = 0.8;
        
        // 高风险时预测更近的故障时间
        const failureMinutes = trendAnalysis.declineRate > 0 ? Math.round(healthScore / trendAnalysis.declineRate) : 15;
        prediction.predictedFailureTime = new Date(Date.now() + failureMinutes * 60000).toISOString();
      }
      
      // 基于异常模式调整预测
      if (anomalyPatterns.criticalPatterns.length > 0) {
        prediction.riskLevel = 'critical';
        prediction.confidence = Math.min(0.95, prediction.confidence + 0.1);
      }
      
      return prediction;
    } catch (error) {
      return {
        shortTermForecast: 'unknown',
        riskLevel: 'unknown',
        predictedFailureTime: null,
        confidence: 0
      };
    }
  }

  /**
   * 分析依赖关系影响
   */
  analyzeDependencyImpact(nodeHealthScores) {
    try {
      const impacts = [];
      
      // 检查各节点健康状况
      Object.entries(nodeHealthScores).forEach(([node, score]) => {
        if (score < 70) {
          impacts.push({
            node: node,
            healthScore: score,
            impactLevel: score < 50 ? 'critical' : score < 70 ? 'high' : 'medium',
            affectedServices: this.getAffectedServices(node)
          });
        }
      });
      
      // 计算总体影响等级
      const criticalImpacts = impacts.filter(i => i.impactLevel === 'critical').length;
      const highImpacts = impacts.filter(i => i.impactLevel === 'high').length;
      
      let overallImpactLevel = 'low';
      if (criticalImpacts > 0) {
        overallImpactLevel = 'critical';
      } else if (highImpacts > 0) {
        overallImpactLevel = 'high';
      } else if (impacts.length > 0) {
        overallImpactLevel = 'medium';
      }
      
      return {
        impacts: impacts,
        overallImpactLevel: overallImpactLevel,
        impactedServiceCount: impacts.reduce((sum, impact) => sum + impact.affectedServices.length, 0)
      };
    } catch (error) {
      return {
        impacts: [],
        overallImpactLevel: 'unknown',
        impactedServiceCount: 0
      };
    }
  }

  /**
   * 获取受影响的服务列表
   */
  getAffectedServices(node) {
    const serviceMap = {
      entry: ['web_access', 'api_gateway', 'load_balancer'],
      auth: ['user_login', 'token_validation', 'session_management'],
      core: ['business_logic', 'data_processing', 'transaction_handling'],
      data: ['database_queries', 'data_storage', 'data_backup']
    };
    
    return serviceMap[node] || [];
  }

  /**
   * 评估业务影响
   */
  assessBusinessImpact(componentStatuses) {
    try {
      let impactLevel = 'none';
      const affectedFeatures = [];
      
      // 检查客户端影响
      if (!componentStatuses.clientStatus?.success || componentStatuses.clientStatus.healthScore < 70) {
        impactLevel = this.getHigherImpactLevel(impactLevel, 'high');
        affectedFeatures.push('用户界面访问', '前端功能');
      }
      
      // 检查后端服务影响
      if (!componentStatuses.backendStatus?.success || componentStatuses.backendStatus.healthScore < 70) {
        impactLevel = this.getHigherImpactLevel(impactLevel, 'critical');
        affectedFeatures.push('业务逻辑处理', 'API服务', '核心功能');
      }
      
      // 检查数据库影响
      if (!componentStatuses.databaseStatus?.success || componentStatuses.databaseStatus.healthScore < 70) {
        impactLevel = this.getHigherImpactLevel(impactLevel, 'critical');
        affectedFeatures.push('数据存储', '数据查询', '事务处理');
      }
      
      // 估算用户影响范围
      const userImpactPercentage = this.calculateUserImpactPercentage(componentStatuses);
      
      return {
        impactLevel: impactLevel,
        affectedFeatures: [...new Set(affectedFeatures)],
        userImpactPercentage: userImpactPercentage,
        businessContinuityRisk: this.assessBusinessContinuityRisk(impactLevel, userImpactPercentage)
      };
    } catch (error) {
      return {
        impactLevel: 'unknown',
        affectedFeatures: [],
        userImpactPercentage: 0,
        businessContinuityRisk: 'unknown'
      };
    }
  }

  /**
   * 获取更高的影响等级
   */
  getHigherImpactLevel(current, candidate) {
    const levels = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const currentLevel = levels[current] || 0;
    const candidateLevel = levels[candidate] || 0;
    
    const levelNames = { 0: 'none', 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return levelNames[Math.max(currentLevel, candidateLevel)];
  }

  /**
   * 计算用户影响百分比
   */
  calculateUserImpactPercentage(componentStatuses) {
    try {
      let impactPercentage = 0;
      
      // 基于各组件状态估算影响百分比
      if (!componentStatuses.clientStatus?.success) {
        impactPercentage += 100; // 客户端完全不可用
      } else if (componentStatuses.clientStatus.healthScore < 50) {
        impactPercentage += 80;
      } else if (componentStatuses.clientStatus.healthScore < 70) {
        impactPercentage += 40;
      }
      
      if (!componentStatuses.backendStatus?.success) {
        impactPercentage += 100; // 后端服务完全不可用
      } else if (componentStatuses.backendStatus.healthScore < 50) {
        impactPercentage += 90;
      } else if (componentStatuses.backendStatus.healthScore < 70) {
        impactPercentage += 60;
      }
      
      if (!componentStatuses.databaseStatus?.success) {
        impactPercentage += 100; // 数据库完全不可用
      } else if (componentStatuses.databaseStatus.healthScore < 50) {
        impactPercentage += 95;
      } else if (componentStatuses.databaseStatus.healthScore < 70) {
        impactPercentage += 70;
      }
      
      return Math.min(100, Math.round(impactPercentage / 3)); // 平均影响
    } catch (error) {
      return 0;
    }
  }

  /**
   * 评估业务连续性风险
   */
  assessBusinessContinuityRisk(impactLevel, userImpactPercentage) {
    if (impactLevel === 'critical' || userImpactPercentage > 80) {
      return 'high';
    } else if (impactLevel === 'high' || userImpactPercentage > 50) {
      return 'medium';
    } else if (impactLevel === 'medium' || userImpactPercentage > 20) {
      return 'low';
    } else {
      return 'minimal';
    }
  }

  /**
    * 确定建议等级
    */
   determineRecommendationLevel(healthScore, anomalyPatterns, predictiveAnalysis) {
     if (healthScore < 50 || anomalyPatterns.criticalPatterns.length > 0 || predictiveAnalysis.riskLevel === 'critical') {
       return 'immediate';
     } else if (healthScore < 70 || predictiveAnalysis.riskLevel === 'high') {
       return 'urgent';
     } else if (healthScore < 85 || predictiveAnalysis.riskLevel === 'medium') {
       return 'priority';
     } else {
       return 'normal';
     }
   }

   /**
   * 状态变更防抖机制
   * 避免状态频繁抖动，确保状态变更的稳定性
   */
  applyStateTransitionDebouncing(intelligentStatus) {
    try {
      const componentName = 'overall_system';
      const currentHealthScore = intelligentStatus.healthScore;
      
      // 获取历史状态
      const history = this.stateHistory.get(componentName) || [];
      const currentTime = Date.now();
      
      // 添加当前状态到历史记录
      const currentState = {
        timestamp: currentTime,
        healthScore: currentHealthScore,
        status: this.determineRawStatus(currentHealthScore)
      };
      
      history.push(currentState);
      
      // 保持历史记录在合理范围内（最近20次检查）
      if (history.length > 20) {
        history.shift();
      }
      
      // 更新历史记录
      this.stateHistory.set(componentName, history);
      
      // 应用防抖逻辑
      const debouncedResult = this.applyDebouncingLogic(history);
      
      return {
        currentStatus: debouncedResult.status,
        previousStatus: history.length > 1 ? history[history.length - 2].status : null,
        stabilityIndex: debouncedResult.stabilityIndex,
        transitionReason: debouncedResult.reason,
        consecutiveStableChecks: debouncedResult.consecutiveStableChecks
      };
    } catch (error) {
      logger.error('[SystemStatusService] 状态防抖处理失败:', error);
      return {
        currentStatus: this.determineRawStatus(intelligentStatus.healthScore),
        previousStatus: null,
        stabilityIndex: 50,
        transitionReason: '防抖处理失败',
        consecutiveStableChecks: 0
      };
    }
  }

  /**
   * 应用防抖逻辑
   */
  applyDebouncingLogic(history) {
    if (history.length < 3) {
      return {
        status: history[history.length - 1].status,
        stabilityIndex: 50,
        reason: '数据不足，使用原始状态',
        consecutiveStableChecks: 1
      };
    }
    
    const recentStates = history.slice(-5); // 最近5次检查
    const currentStatus = recentStates[recentStates.length - 1].status;
    const previousStatuses = recentStates.slice(0, -1).map(s => s.status);
    
    // 计算连续稳定检查次数
    let consecutiveStableChecks = 1;
    for (let i = recentStates.length - 2; i >= 0; i--) {
      if (recentStates[i].status === currentStatus) {
        consecutiveStableChecks++;
      } else {
        break;
      }
    }
    
    // 防抖规则
    const debounceRules = {
      // 健康→亚健康：需要连续3次检查失败或5分钟内失败率>30%
      healthy_to_warning: {
        requiredConsecutiveFailures: 3,
        timeWindow: 5 * 60 * 1000, // 5分钟
        failureRateThreshold: 0.3
      },
      // 亚健康→故障：需要连续5次检查失败或关键指标持续恶化
      warning_to_critical: {
        requiredConsecutiveFailures: 5,
        criticalScoreThreshold: 50
      },
      // 故障→亚健康：需要连续10次检查成功且关键指标恢复
      critical_to_warning: {
        requiredConsecutiveSuccesses: 10,
        recoveryScoreThreshold: 70
      },
      // 亚健康→健康：需要连续15次检查成功且性能指标达标
      warning_to_healthy: {
        requiredConsecutiveSuccesses: 15,
        performanceScoreThreshold: 85
      }
    };
    
    // 检查是否可以状态转换
    const canTransition = this.checkStateTransition(currentStatus, previousStatuses, recentStates, debounceRules);
    
    if (canTransition.allowed) {
      return {
        status: currentStatus,
        stabilityIndex: this.calculateStabilityFromHistory(recentStates),
        reason: canTransition.reason,
        consecutiveStableChecks: consecutiveStableChecks
      };
    } else {
      // 保持上一个稳定状态
      const lastStableStatus = this.findLastStableStatus(previousStatuses);
      return {
        status: lastStableStatus,
        stabilityIndex: this.calculateStabilityFromHistory(recentStates),
        reason: `防抖阻止转换：${canTransition.reason}`,
        consecutiveStableChecks: 0
      };
    }
  }

  /**
   * 检查状态转换是否允许
   */
  checkStateTransition(currentStatus, previousStatuses, recentStates, debounceRules) {
    const currentHealthScore = recentStates[recentStates.length - 1].healthScore;
    const transitions = {
      'healthy': 'warning',
      'warning': 'critical',
      'critical': 'warning',
      'warning': 'healthy'
    };
    
    const targetStatus = transitions[currentStatus];
    if (!targetStatus) {
      return { allowed: true, reason: '无效的状态转换' };
    }
    
    const rule = debounceRules[`${currentStatus}_to_${targetStatus}`];
    if (!rule) {
      return { allowed: true, reason: '无防抖规则限制' };
    }
    
    // 检查连续失败/成功次数
    if (rule.requiredConsecutiveFailures) {
      const consecutiveFailures = this.countConsecutiveStatus(recentStates, currentStatus);
      if (consecutiveFailures < rule.requiredConsecutiveFailures) {
        return { 
          allowed: false, 
          reason: `需要连续${rule.requiredConsecutiveFailures}次检查失败，当前仅${consecutiveFailures}次` 
        };
      }
    }
    
    if (rule.requiredConsecutiveSuccesses) {
      const consecutiveSuccesses = this.countConsecutiveStatus(recentStates, targetStatus);
      if (consecutiveSuccesses < rule.requiredConsecutiveSuccesses) {
        return { 
          allowed: false, 
          reason: `需要连续${rule.requiredConsecutiveSuccesses}次检查成功，当前仅${consecutiveSuccesses}次` 
        };
      }
    }
    
    // 检查关键指标阈值
    if (rule.criticalScoreThreshold && currentHealthScore >= rule.criticalScoreThreshold) {
      return { 
        allowed: false, 
        reason: `健康分${currentHealthScore}未低于阈值${rule.criticalScoreThreshold}` 
      };
    }
    
    if (rule.recoveryScoreThreshold && currentHealthScore < rule.recoveryScoreThreshold) {
      return { 
        allowed: false, 
        reason: `健康分${currentHealthScore}未达到恢复阈值${rule.recoveryScoreThreshold}` 
      };
    }
    
    if (rule.performanceScoreThreshold && currentHealthScore < rule.performanceScoreThreshold) {
      return { 
        allowed: false, 
        reason: `健康分${currentHealthScore}未达到性能阈值${rule.performanceScoreThreshold}` 
      };
    }
    
    return { allowed: true, reason: '满足转换条件' };
  }

  /**
   * 计算系统可用率
   */
  async calculateSystemAvailability() {
    try {
      // 基于审计日志计算最近24小时的可用率
      const availabilityResult = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE success IS NOT FALSE) as success_count,
          COUNT(*) as total_count
        FROM audit_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
      
      const successCount = parseInt(availabilityResult.rows[0]?.success_count || 0);
      const totalCount = parseInt(availabilityResult.rows[0]?.total_count || 0);
      
      const availability = totalCount > 0 
        ? (Math.round((successCount / totalCount) * 1000) / 10).toFixed(1) + '%' 
        : '100.0%';
      
      // 获取可用率历史趋势
      const trendData = await this.getAvailabilityTrendData();
      
      return {
        availability: availability,
        successCount: successCount,
        totalCount: totalCount,
        trendData: trendData,
        lastUpdated: this.getCurrentTime().toISOString()
      };
    } catch (error) {
      logger.error('[SystemStatusService] 计算系统可用率失败:', error);
      return {
        availability: '0.0%',
        successCount: 0,
        totalCount: 0,
        trendData: [],
        error: error.message
      };
    }
  }

  /**
   * 获取可用率趋势数据
   */
  async getAvailabilityTrendData() {
    try {
      // 从审计日志中获取最近24小时的小时级可用率趋势
      const trendResult = await pool.query(`
        WITH hours AS (
          SELECT generate_series(
            date_trunc('hour', NOW()) - INTERVAL '23 hours',
            date_trunc('hour', NOW()),
            '1 hour'::interval
          ) as hour
        )
        SELECT 
          h.hour,
          COUNT(al.id) as total_count,
          COUNT(al.id) FILTER (WHERE al.success IS NOT FALSE) as success_count
        FROM hours h
        LEFT JOIN audit_logs al ON date_trunc('hour', al.created_at) = h.hour
        GROUP BY h.hour
        ORDER BY h.hour ASC
      `);
      
      return trendResult.rows.map(row => {
        const total = parseInt(row.total_count);
        const success = parseInt(row.success_count);
        const availability = total > 0 
          ? Math.round((success / total) * 1000) / 10 
          : 100.0;
        
        return {
          time: row.hour.toISOString(),
          availability: availability
        };
      });
    } catch (error) {
      logger.error('[SystemStatusService] 获取可用率趋势失败:', error);
      // 降级：返回最近一小时的单一数据点
      return [{
        time: new Date().toISOString(),
        availability: 100.0
      }];
    }
  }

  /**
   * 生成系统建议
   */
  generateSystemRecommendations(intelligentStatus, componentStatuses) {
    const recommendations = [];
    
    try {
      // 基于健康分生成建议
      if (intelligentStatus.healthScore < 50) {
        recommendations.push({
          level: 'critical',
          category: 'immediate_action',
          title: '系统健康度严重异常',
          description: `当前系统健康分仅为${intelligentStatus.healthScore}，建议立即采取紧急措施`,
          actions: [
            '检查所有核心服务状态',
            '评估是否需要启动应急预案',
            '通知技术团队和相关负责人'
          ]
        });
      } else if (intelligentStatus.healthScore < 70) {
        recommendations.push({
          level: 'high',
          category: 'urgent_action',
          title: '系统健康度偏低',
          description: `当前系统健康分为${intelligentStatus.healthScore}，需要密切关注`,
          actions: [
            '加强系统监控频率',
            '准备应急响应方案',
            '优化性能瓶颈'
          ]
        });
      }
      
      // 基于异常模式生成建议
      if (intelligentStatus.anomalyPatterns.criticalPatterns.length > 0) {
        recommendations.push({
          level: 'high',
          category: 'anomaly_response',
          title: '检测到关键异常模式',
          description: intelligentStatus.anomalyPatterns.patternSummary,
          actions: [
            '深入分析异常根本原因',
            '检查相关日志和监控数据',
            '制定针对性的修复方案'
          ]
        });
      }
      
      // 基于预测分析生成建议
      if (intelligentStatus.predictiveAnalysis.riskLevel === 'high' || intelligentStatus.predictiveAnalysis.riskLevel === 'critical') {
        recommendations.push({
          level: 'medium',
          category: 'preventive_action',
          title: '存在潜在风险',
          description: `预测未来可能出现故障，建议提前采取预防措施`,
          actions: [
            '增加系统监控密度',
            '准备降级方案',
            '评估资源扩容需求'
          ]
        });
      }
      
      // 基于业务影响生成建议
      if (intelligentStatus.businessImpact.impactLevel === 'critical' || intelligentStatus.businessImpact.impactLevel === 'high') {
        recommendations.push({
          level: 'high',
          category: 'business_continuity',
          title: '业务连续性风险',
          description: `预估有${intelligentStatus.businessImpact.userImpactPercentage}%用户可能受到影响`,
          actions: [
            '评估业务损失风险',
            '准备客户沟通方案',
            '考虑启动备用系统'
          ]
        });
      }
      
      return recommendations;
    } catch (error) {
      logger.error('[SystemStatusService] 生成系统建议失败:', error);
      return [{
        level: 'low',
        category: 'error',
        title: '建议生成失败',
        description: '无法生成具体建议，请手动检查系统状态',
        actions: ['查看系统日志', '联系技术支持']
      }];
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'healthy': '健康',
      'warning': '亚健康', 
      'critical': '故障',
      'degraded': '降级'
    };
    return statusMap[status] || '未知';
  }

  /**
   * 确定原始状态
   */
  determineRawStatus(healthScore) {
    if (healthScore >= 90) return 'healthy';
    if (healthScore >= 70) return 'warning';
    return 'critical';
  }

  /**
   * 查找最后一个稳定状态
   */
  findLastStableStatus(statuses) {
    const statusCounts = {};
    statuses.forEach(status => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // 返回出现次数最多的状态
    return Object.keys(statusCounts).reduce((a, b) => 
      statusCounts[a] > statusCounts[b] ? a : b
    );
  }

  /**
   * 计算历史记录稳定性
   */
  calculateStabilityFromHistory(states) {
    if (states.length < 2) return 100;
    
    const statusChanges = states.slice(1).filter((state, index) => 
      state.status !== states[index].status
    ).length;
    
    const stabilityRate = Math.max(0, 100 - (statusChanges * 20));
    return Math.round(stabilityRate);
  }

  /**
   * 统计连续状态次数
   */
  countConsecutiveStatus(states, targetStatus) {
    let count = 0;
    for (let i = states.length - 1; i >= 0; i--) {
      if (states[i].status === targetStatus) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * 快速健康检查
   */
  async quickHealthCheck() {
    try {
      const dbHealthy = await healthCheck().then(() => true).catch(() => false);
      
      return {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: this.getCurrentTime().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'error',
        error: error.message,
        timestamp: this.getCurrentTime().toISOString()
      };
    }
  }

  /**
   * 快速健康检查 - 兼容旧接口
   */
  async evaluateOverallStatus() {
    const startTime = Date.now();
    
    try {
      console.log('[SystemStatusService] 开始快速综合状态评估');

      // 并行评估各个组件状态
      const [
        clientStatus,
        backendStatus,
        databaseStatus
      ] = await Promise.all([
        this.evaluateClientStatus(),
        this.evaluateBackendStatus(),
        this.evaluateDatabaseStatus()
      ]);

      // 计算综合健康分
      const overallHealthScore = Math.round(
        (clientStatus.healthScore + backendStatus.healthScore + databaseStatus.healthScore) / 3
      );

      // 判定整体状态
      let overallStatus = 'healthy';
      let overallStatusText = '正常';
      
      if (overallHealthScore >= 90) {
        overallStatus = 'healthy';
        overallStatusText = '正常';
      } else if (overallHealthScore >= 70) {
        overallStatus = 'warning';
        overallStatusText = '亚健康';
      } else {
        overallStatus = 'critical';
        overallStatusText = '故障';
      }

      const evaluationTime = Date.now() - startTime;

      return {
        success: true,
        overallStatus: overallStatus,
        overallStatusText: overallStatusText,
        overallHealthScore: overallHealthScore,
        components: {
          client: {
            status: clientStatus.status,
            healthScore: clientStatus.healthScore
          },
          backend: {
            status: backendStatus.status,
            healthScore: backendStatus.healthScore
          },
          database: {
            status: databaseStatus.status,
            healthScore: databaseStatus.healthScore
          }
        },
        summary: `系统整体${overallStatusText}，健康度${overallHealthScore}分`,
        评估时间: `${evaluationTime}ms`,
        lastUpdate: this.getCurrentTime().toISOString(),
        issues: [
          ...clientStatus.issues,
          ...backendStatus.issues,
          ...databaseStatus.issues
        ].slice(0, 5), // 最多显示5个问题
        suggestions: [
          ...clientStatus.suggestions,
          ...backendStatus.suggestions,
          ...databaseStatus.suggestions
        ].slice(0, 5) // 最多显示5个建议
      };
    } catch (error) {
      logger.error('[SystemStatusService] 快速综合状态评估失败:', error);
      return {
        success: false,
        overallStatus: 'critical',
        overallStatusText: '评估失败',
        overallHealthScore: 0,
        error: error.message,
        lastUpdate: this.getCurrentTime().toISOString()
      };
    }
  }
}

// 导出单例实例
module.exports = new SystemStatusService();
