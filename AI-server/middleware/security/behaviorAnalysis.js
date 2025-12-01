/**
 * 用户行为分析和异常检测模块
 * 实现用户行为基线建模和异常检测
 */

const logger = require('../../config/logger');

/**
 * 用户行为分析器
 * 分析用户行为模式并建立基线
 */
class UserBehaviorAnalyzer {
  constructor(options = {}) {
    this.baselineWindow = options.baselineWindow || 86400000; // 24小时基线窗口
    this.anomalyThreshold = options.anomalyThreshold || 2.5; // 异常阈值（标准差倍数）
    this.minObservations = options.minObservations || 10; // 最少观察次数
    this.userProfiles = new Map(); // 用户行为档案
    this.behaviorMetrics = new Map(); // 行为指标
  }

  /**
   * 记录用户行为事件
   * @param {Object} event - 用户行为事件
   * @param {string} event.userId - 用户ID
   * @param {string} event.action - 操作类型
   * @param {string} event.resource - 访问资源
   * @param {string} event.ip - IP地址
   * @param {string} event.userAgent - 用户代理
   * @param {number} event.timestamp - 时间戳
   */
  recordEvent(event) {
    const { userId, action, resource, ip, userAgent, timestamp = Date.now() } = event;
    
    // 初始化用户档案
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        baseline: null,
        observations: [],
        lastUpdated: timestamp
      });
    }
    
    const userProfile = this.userProfiles.get(userId);
    
    // 记录行为观测
    userProfile.observations.push({
      action,
      resource,
      ip,
      userAgent,
      timestamp
    });
    
    // 保持观测窗口
    this._maintainObservationWindow(userProfile, timestamp);
    
    // 更新基线（如果满足条件）
    if (userProfile.observations.length >= this.minObservations) {
      this._updateBaseline(userId);
    }
    
    userProfile.lastUpdated = timestamp;
  }

  /**
   * 维护观测窗口
   * @param {Object} userProfile - 用户档案
   * @param {number} currentTime - 当前时间
   */
  _maintainObservationWindow(userProfile, currentTime) {
    const cutoffTime = currentTime - this.baselineWindow;
    userProfile.observations = userProfile.observations.filter(obs => 
      obs.timestamp >= cutoffTime
    );
  }

  /**
   * 更新用户行为基线
   * @param {string} userId - 用户ID
   */
  _updateBaseline(userId) {
    const userProfile = this.userProfiles.get(userId);
    const observations = userProfile.observations;
    
    if (observations.length < this.minObservations) {
      return;
    }
    
    // 计算行为特征
    const features = this._extractFeatures(observations);
    
    // 计算统计指标
    const baseline = this._calculateStatistics(features);
    
    userProfile.baseline = baseline;
  }

  /**
   * 提取行为特征
   * @param {Array} observations - 观测数据
   * @returns {Object} 特征对象
   */
  _extractFeatures(observations) {
    const features = {
      actionFrequency: {},
      resourceAccess: {},
      ipAddresses: {},
      accessTimes: [],
      userAgentChanges: 0
    };
    
    let previousUserAgent = null;
    
    for (const obs of observations) {
      // 动作频率
      features.actionFrequency[obs.action] = 
        (features.actionFrequency[obs.action] || 0) + 1;
      
      // 资源访问
      features.resourceAccess[obs.resource] = 
        (features.resourceAccess[obs.resource] || 0) + 1;
      
      // IP地址
      features.ipAddresses[obs.ip] = 
        (features.ipAddresses[obs.ip] || 0) + 1;
      
      // 访问时间
      const hour = new Date(obs.timestamp).getHours();
      features.accessTimes.push(hour);
      
      // 用户代理变化
      if (previousUserAgent && previousUserAgent !== obs.userAgent) {
        features.userAgentChanges++;
      }
      previousUserAgent = obs.userAgent;
    }
    
    return features;
  }

  /**
   * 计算统计指标
   * @param {Object} features - 特征对象
   * @returns {Object} 统计指标
   */
  _calculateStatistics(features) {
    return {
      actionDistribution: this._normalizeDistribution(features.actionFrequency),
      resourceDistribution: this._normalizeDistribution(features.resourceAccess),
      ipDistribution: this._normalizeDistribution(features.ipAddresses),
      timeDistribution: this._calculateTimeDistribution(features.accessTimes),
      userAgentChanges: features.userAgentChanges,
      totalActions: Object.values(features.actionFrequency).reduce((sum, val) => sum + val, 0),
      observationCount: Object.values(features.actionFrequency).reduce((sum, val) => sum + val, 0)
    };
  }

  /**
   * 归一化分布
   * @param {Object} distribution - 分布数据
   * @returns {Object} 归一化分布
   */
  _normalizeDistribution(distribution) {
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    const normalized = {};
    
    for (const [key, value] of Object.entries(distribution)) {
      normalized[key] = value / total;
    }
    
    return normalized;
  }

  /**
   * 计算时间分布
   * @param {Array} times - 时间数据
   * @returns {Object} 时间分布
   */
  _calculateTimeDistribution(times) {
    const distribution = {};
    
    // 初始化24小时分布
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }
    
    // 统计各小时的访问次数
    for (const time of times) {
      distribution[time] = (distribution[time] || 0) + 1;
    }
    
    // 归一化
    const total = times.length;
    for (let i = 0; i < 24; i++) {
      distribution[i] = distribution[i] / total;
    }
    
    return distribution;
  }

  /**
   * 检测异常行为
   * @param {Object} event - 用户行为事件
   * @returns {Object} 异常检测结果
   */
  detectAnomaly(event) {
    const { userId, action, resource, ip, userAgent, timestamp = Date.now() } = event;
    
    // 检查用户是否存在基线
    if (!this.userProfiles.has(userId) || !this.userProfiles.get(userId).baseline) {
      return {
        isAnomaly: false,
        score: 0,
        reasons: ['用户尚未建立行为基线']
      };
    }
    
    const userProfile = this.userProfiles.get(userId);
    const baseline = userProfile.baseline;
    
    // 计算异常分数
    let anomalyScore = 0;
    const reasons = [];
    
    // 检查动作分布异常
    const actionScore = this._calculateActionAnomaly(baseline, action);
    if (actionScore > this.anomalyThreshold) {
      anomalyScore += actionScore;
      reasons.push(`异常动作: ${action}`);
    }
    
    // 检查资源访问异常
    const resourceScore = this._calculateResourceAnomaly(baseline, resource);
    if (resourceScore > this.anomalyThreshold) {
      anomalyScore += resourceScore;
      reasons.push(`异常资源访问: ${resource}`);
    }
    
    // 检查IP地址异常
    const ipScore = this._calculateIpAnomaly(baseline, ip);
    if (ipScore > this.anomalyThreshold) {
      anomalyScore += ipScore;
      reasons.push(`异常IP地址: ${ip}`);
    }
    
    // 检查时间异常
    const timeScore = this._calculateTimeAnomaly(baseline, timestamp);
    if (timeScore > this.anomalyThreshold) {
      anomalyScore += timeScore;
      reasons.push('异常访问时间');
    }
    
    // 检查用户代理异常
    if (userAgent !== this._getLastUserAgent(userProfile.observations)) {
      const userAgentScore = this._calculateUserAgentAnomaly(baseline, userAgent);
      if (userAgentScore > this.anomalyThreshold) {
        anomalyScore += userAgentScore;
        reasons.push('异常用户代理');
      }
    }
    
    const isAnomaly = anomalyScore > this.anomalyThreshold;
    
    if (isAnomaly) {
      logger.security(null, '用户行为异常检测', {
        userId,
        anomalyScore,
        reasons,
        event
      });
    }
    
    return {
      isAnomaly,
      score: anomalyScore,
      reasons
    };
  }

  /**
   * 计算动作异常分数
   * @param {Object} baseline - 基线数据
   * @param {string} action - 动作
   * @returns {number} 异常分数
   */
  _calculateActionAnomaly(baseline, action) {
    const expectedProbability = baseline.actionDistribution[action] || 0;
    const observedProbability = 1 / baseline.totalActions; // 简化计算
    
    // 使用Z-score方法计算异常分数
    const mean = expectedProbability;
    const stdDev = Math.sqrt(expectedProbability * (1 - expectedProbability) / baseline.observationCount);
    
    if (stdDev === 0) return 0;
    
    const zScore = Math.abs(observedProbability - mean) / stdDev;
    return zScore;
  }

  /**
   * 计算资源访问异常分数
   * @param {Object} baseline - 基线数据
   * @param {string} resource - 资源
   * @returns {number} 异常分数
   */
  _calculateResourceAnomaly(baseline, resource) {
    const expectedProbability = baseline.resourceDistribution[resource] || 0;
    const observedProbability = 1 / baseline.totalActions; // 简化计算
    
    const mean = expectedProbability;
    const stdDev = Math.sqrt(expectedProbability * (1 - expectedProbability) / baseline.observationCount);
    
    if (stdDev === 0) return 0;
    
    const zScore = Math.abs(observedProbability - mean) / stdDev;
    return zScore;
  }

  /**
   * 计算IP地址异常分数
   * @param {Object} baseline - 基线数据
   * @param {string} ip - IP地址
   * @returns {number} 异常分数
   */
  _calculateIpAnomaly(baseline, ip) {
    const expectedProbability = baseline.ipDistribution[ip] || 0;
    const observedProbability = 1 / baseline.totalActions; // 简化计算
    
    const mean = expectedProbability;
    const stdDev = Math.sqrt(expectedProbability * (1 - expectedProbability) / baseline.observationCount);
    
    if (stdDev === 0) return 0;
    
    const zScore = Math.abs(observedProbability - mean) / stdDev;
    return zScore;
  }

  /**
   * 计算时间异常分数
   * @param {Object} baseline - 基线数据
   * @param {number} timestamp - 时间戳
   * @returns {number} 异常分数
   */
  _calculateTimeAnomaly(baseline, timestamp) {
    const hour = new Date(timestamp).getHours();
    const expectedProbability = baseline.timeDistribution[hour] || 0;
    const observedProbability = 1 / 24; // 平均分布
    
    const mean = expectedProbability;
    const stdDev = Math.sqrt(expectedProbability * (1 - expectedProbability) / baseline.observationCount);
    
    if (stdDev === 0) return 0;
    
    const zScore = Math.abs(observedProbability - mean) / stdDev;
    return zScore;
  }

  /**
   * 计算用户代理异常分数
   * @param {Object} baseline - 基线数据
   * @param {string} userAgent - 用户代理
   * @returns {number} 异常分数
   */
  _calculateUserAgentAnomaly(baseline, userAgent) {
    // 简化实现：如果用户代理变化次数超过阈值，则认为异常
    const changeRate = baseline.userAgentChanges / baseline.observationCount;
    return changeRate > 0.1 ? 3 : 0; // 简化的异常分数
  }

  /**
   * 获取最后一次使用的用户代理
   * @param {Array} observations - 观测数据
   * @returns {string|null} 用户代理
   */
  _getLastUserAgent(observations) {
    if (observations.length === 0) return null;
    return observations[observations.length - 1].userAgent;
  }

  /**
   * 获取用户行为报告
   * @param {string} userId - 用户ID
   * @returns {Object} 行为报告
   */
  getUserBehaviorReport(userId) {
    if (!this.userProfiles.has(userId)) {
      return null;
    }
    
    const userProfile = this.userProfiles.get(userId);
    
    return {
      userId,
      baseline: userProfile.baseline,
      observationCount: userProfile.observations.length,
      lastUpdated: userProfile.lastUpdated,
      anomaliesDetected: userProfile.observations.filter(obs => 
        this.detectAnomaly({
          userId,
          action: obs.action,
          resource: obs.resource,
          ip: obs.ip,
          userAgent: obs.userAgent,
          timestamp: obs.timestamp
        }).isAnomaly
      ).length
    };
  }
}

/**
 * 实时异常检测器
 * 实时监控和检测异常行为
 */
class RealTimeAnomalyDetector {
  constructor(analyzer, options = {}) {
    this.analyzer = analyzer;
    this.alertThreshold = options.alertThreshold || 0.8; // 警报阈值
    this.alertCooldown = options.alertCooldown || 300000; // 警报冷却时间（5分钟）
    this.lastAlerts = new Map(); // 上次警报时间
  }

  /**
   * 实时检测用户行为
   * @param {Object} event - 用户行为事件
   * @returns {Object} 检测结果
   */
  detect(event) {
    // 记录事件
    this.analyzer.recordEvent(event);
    
    // 检测异常
    const anomalyResult = this.analyzer.detectAnomaly(event);
    
    // 如果检测到异常，触发警报
    if (anomalyResult.isAnomaly && anomalyResult.score > this.alertThreshold) {
      this._triggerAlert(event, anomalyResult);
    }
    
    return anomalyResult;
  }

  /**
   * 触发警报
   * @param {Object} event - 用户行为事件
   * @param {Object} anomalyResult - 异常检测结果
   */
  _triggerAlert(event, anomalyResult) {
    const { userId } = event;
    const now = Date.now();
    const lastAlert = this.lastAlerts.get(userId);
    
    // 检查冷却时间
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return;
    }
    
    // 记录警报时间
    this.lastAlerts.set(userId, now);
    
    // 发送警报
    logger.security(null, '实时异常检测警报', {
      userId,
      anomalyScore: anomalyResult.score,
      reasons: anomalyResult.reasons,
      event,
      timestamp: new Date().toISOString()
    });
    
    // 可以在这里集成其他警报机制，如邮件、短信等
  }
}

/**
 * 高级异常检测器
 * 使用多种算法检测异常行为
 */
class AdvancedAnomalyDetector {
  constructor(options = {}) {
    this.algorithms = {
      statistical: new StatisticalAnomalyDetector(options.statistical),
      mlBased: new MLBasedAnomalyDetector(options.mlBased),
      ruleBased: new RuleBasedAnomalyDetector(options.ruleBased),
      ensemble: new EnsembleAnomalyDetector(options.ensemble)
    };
    
    this.weights = options.weights || {
      statistical: 0.3,
      mlBased: 0.4,
      ruleBased: 0.2,
      ensemble: 0.1
    };
  }

  /**
   * 综合异常检测
   * @param {Object} event - 用户行为事件
   * @returns {Object} 检测结果
   */
  detectAnomaly(event) {
    const results = {};
    let weightedScore = 0;
    const reasons = [];
    
    // 使用所有算法进行检测
    for (const [algorithmName, algorithm] of Object.entries(this.algorithms)) {
      try {
        const result = algorithm.detect(event);
        results[algorithmName] = result;
        
        if (result.isAnomaly) {
          weightedScore += result.score * this.weights[algorithmName];
          reasons.push(...result.reasons.map(r => `${algorithmName}: ${r}`));
        }
      } catch (error) {
        logger.error(`[ANOMALY_DETECTOR] ${algorithmName} 算法检测失败:`, error);
      }
    }
    
    const isAnomaly = weightedScore > 0.5;
    
    return {
      isAnomaly,
      score: weightedScore,
      reasons,
      details: results
    };
  }
}

/**
 * 统计学异常检测器
 */
class StatisticalAnomalyDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 2.5;
    this.windowSize = options.windowSize || 100;
    this.userProfiles = new Map();
  }

  /**
   * 检测异常
   * @param {Object} event - 用户行为事件
   * @returns {Object} 检测结果
   */
  detect(event) {
    const { userId, action, resource, ip, timestamp = Date.now() } = event;
    
    // 初始化用户档案
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        actions: [],
        resources: [],
        ips: [],
        timestamps: []
      });
    }
    
    const profile = this.userProfiles.get(userId);
    
    // 更新用户档案
    profile.actions.push(action);
    profile.resources.push(resource);
    profile.ips.push(ip);
    profile.timestamps.push(timestamp);
    
    // 保持窗口大小
    this._maintainWindow(profile);
    
    // 计算统计异常
    const anomalies = [];
    
    // 检查动作频率异常
    const actionAnomaly = this._detectActionAnomaly(profile, action);
    if (actionAnomaly.isAnomaly) {
      anomalies.push(`异常动作频率: ${action}`);
    }
    
    // 检查资源访问异常
    const resourceAnomaly = this._detectResourceAnomaly(profile, resource);
    if (resourceAnomaly.isAnomaly) {
      anomalies.push(`异常资源访问: ${resource}`);
    }
    
    // 检查IP地址异常
    const ipAnomaly = this._detectIpAnomaly(profile, ip);
    if (ipAnomaly.isAnomaly) {
      anomalies.push(`异常IP地址: ${ip}`);
    }
    
    // 检查时间异常
    const timeAnomaly = this._detectTimeAnomaly(profile, timestamp);
    if (timeAnomaly.isAnomaly) {
      anomalies.push('异常访问时间');
    }
    
    const isAnomaly = anomalies.length > 0;
    const score = anomalies.length / 4; // 简化的评分
    
    return {
      isAnomaly,
      score,
      reasons: anomalies
    };
  }

  /**
   * 维持窗口大小
   * @param {Object} profile - 用户档案
   */
  _maintainWindow(profile) {
    while (profile.actions.length > this.windowSize) {
      profile.actions.shift();
      profile.resources.shift();
      profile.ips.shift();
      profile.timestamps.shift();
    }
  }

  /**
   * 检测动作异常
   * @param {Object} profile - 用户档案
   * @param {string} action - 动作
   * @returns {Object} 检测结果
   */
  _detectActionAnomaly(profile, action) {
    const actionCount = profile.actions.filter(a => a === action).length;
    const totalActions = profile.actions.length;
    const frequency = actionCount / totalActions;
    
    // 计算历史平均频率和标准差
    const history = profile.actions.slice(0, -1);
    const historyFreq = history.filter(a => a === action).length / history.length;
    const variance = history.reduce((sum, a) => 
      sum + Math.pow((a === action ? 1 : 0) - historyFreq, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-score检测
    const zScore = stdDev > 0 ? Math.abs(frequency - historyFreq) / stdDev : 0;
    
    return {
      isAnomaly: zScore > this.threshold,
      score: Math.min(zScore / this.threshold, 1)
    };
  }

  /**
   * 检测资源访问异常
   * @param {Object} profile - 用户档案
   * @param {string} resource - 资源
   * @returns {Object} 检测结果
   */
  _detectResourceAnomaly(profile, resource) {
    const resourceCount = profile.resources.filter(r => r === resource).length;
    const totalResources = profile.resources.length;
    const frequency = resourceCount / totalResources;
    
    // 计算历史平均频率和标准差
    const history = profile.resources.slice(0, -1);
    const historyFreq = history.filter(r => r === resource).length / history.length;
    const variance = history.reduce((sum, r) => 
      sum + Math.pow((r === resource ? 1 : 0) - historyFreq, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-score检测
    const zScore = stdDev > 0 ? Math.abs(frequency - historyFreq) / stdDev : 0;
    
    return {
      isAnomaly: zScore > this.threshold,
      score: Math.min(zScore / this.threshold, 1)
    };
  }

  /**
   * 检测IP地址异常
   * @param {Object} profile - 用户档案
   * @param {string} ip - IP地址
   * @returns {Object} 检测结果
   */
  _detectIpAnomaly(profile, ip) {
    const ipCount = profile.ips.filter(i => i === ip).length;
    const totalIps = profile.ips.length;
    const frequency = ipCount / totalIps;
    
    // 检查是否为新IP地址
    const isNewIp = !profile.ips.slice(0, -1).includes(ip);
    
    if (isNewIp && profile.ips.length > 10) {
      return {
        isAnomaly: true,
        score: 0.8
      };
    }
    
    // 计算历史平均频率和标准差
    const history = profile.ips.slice(0, -1);
    const historyFreq = history.filter(i => i === ip).length / history.length;
    const variance = history.reduce((sum, i) => 
      sum + Math.pow((i === ip ? 1 : 0) - historyFreq, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-score检测
    const zScore = stdDev > 0 ? Math.abs(frequency - historyFreq) / stdDev : 0;
    
    return {
      isAnomaly: zScore > this.threshold,
      score: Math.min(zScore / this.threshold, 1)
    };
  }

  /**
   * 检测时间异常
   * @param {Object} profile - 用户档案
   * @param {number} timestamp - 时间戳
   * @returns {Object} 检测结果
   */
  _detectTimeAnomaly(profile, timestamp) {
    const hour = new Date(timestamp).getHours();
    
    // 统计历史访问时间分布
    const historyHours = profile.timestamps.slice(0, -1).map(t => new Date(t).getHours());
    const hourCounts = {};
    
    for (const h of historyHours) {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
    
    const totalHistory = historyHours.length;
    const historyFreq = (hourCounts[hour] || 0) / totalHistory;
    
    // 如果历史数据不足，不进行检测
    if (totalHistory < 10) {
      return {
        isAnomaly: false,
        score: 0
      };
    }
    
    // 检查是否在非工作时间访问
    const isOffHours = hour < 8 || hour > 18;
    if (isOffHours && historyFreq < 0.1) {
      return {
        isAnomaly: true,
        score: 0.7
      };
    }
    
    return {
      isAnomaly: false,
      score: 0
    };
  }
}

/**
 * 基于机器学习的异常检测器
 */
class MLBasedAnomalyDetector {
  constructor(options = {}) {
    this.model = null;
    this.threshold = options.threshold || 0.7;
    this.trainingData = [];
  }

  /**
   * 检测异常
   * @param {Object} event - 用户行为事件
   * @returns {Object} 检测结果
   */
  detect(event) {
    // 简化实现，实际应用中应使用真正的机器学习模型
    const features = this._extractFeatures(event);
    const score = this._calculateAnomalyScore(features);
    
    return {
      isAnomaly: score > this.threshold,
      score,
      reasons: this._generateReasons(features, score)
    };
  }

  /**
   * 提取特征
   * @param {Object} event - 用户行为事件
   * @returns {Object} 特征向量
   */
  _extractFeatures(event) {
    return {
      action: event.action,
      resource: event.resource,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: event.timestamp,
      hour: new Date(event.timestamp).getHours(),
      dayOfWeek: new Date(event.timestamp).getDay(),
      // 简化的特征提取
      isSuspiciousAction: ['DELETE', 'DROP', 'TRUNCATE'].includes(event.action),
      isSensitiveResource: event.resource.includes('admin') || event.resource.includes('config'),
      isUnusualHour: new Date(event.timestamp).getHours() < 6 || new Date(event.timestamp).getHours() > 22
    };
  }

  /**
   * 计算异常分数
   * @param {Object} features - 特征向量
   * @returns {number} 异常分数
   */
  _calculateAnomalyScore(features) {
    let score = 0;
    
    // 基于规则的简单评分
    if (features.isSuspiciousAction) score += 0.4;
    if (features.isSensitiveResource) score += 0.3;
    if (features.isUnusualHour) score += 0.2;
    
    // 基于时间的评分（简化）
    if (features.hour >= 2 && features.hour <= 5) score += 0.3;
    
    return Math.min(score, 1);
  }

  /**
   * 生成异常原因
   * @param {Object} features - 特征向量
   * @param {number} score - 异常分数
   * @returns {Array} 异常原因列表
   */
  _generateReasons(features, score) {
    const reasons = [];
    
    if (features.isSuspiciousAction) {
      reasons.push(`检测到可疑操作: ${features.action}`);
    }
    
    if (features.isSensitiveResource) {
      reasons.push(`访问敏感资源: ${features.resource}`);
    }
    
    if (features.isUnusualHour) {
      reasons.push(`非正常时间访问: ${features.hour}点`);
    }
    
    return reasons;
  }
}

/**
 * 基于规则的异常检测器
 */
class RuleBasedAnomalyDetector {
  constructor(options = {}) {
    this.rules = options.rules || this._getDefaultRules();
    this.threshold = options.threshold || 0.5;
  }

  /**
   * 获取默认规则
   * @returns {Array} 规则列表
   */
  _getDefaultRules() {
    return [
      {
        name: '高频访问',
        condition: (event, context) => context.requestCount > 100,
        weight: 0.3,
        description: '短时间内请求次数过多'
      },
      {
        name: '敏感操作',
        condition: (event) => ['DELETE', 'DROP', 'TRUNCATE', 'SHUTDOWN'].includes(event.action),
        weight: 0.4,
        description: '执行敏感数据库操作'
      },
      {
        name: '异常IP',
        condition: (event) => this._isKnownMaliciousIp(event.ip),
        weight: 0.5,
        description: '来自已知恶意IP的访问'
      },
      {
        name: '非工作时间访问',
        condition: (event) => {
          const hour = new Date(event.timestamp).getHours();
          return hour < 8 || hour > 18;
        },
        weight: 0.2,
        description: '在非工作时间访问系统'
      },
      {
        name: '大量数据导出',
        condition: (event) => event.resource.includes('export') && event.action === 'GET',
        weight: 0.3,
        description: '大量数据导出操作'
      }
    ];
  }

  /**
   * 检测异常
   * @param {Object} event - 用户行为事件
   * @param {Object} context - 上下文信息
   * @returns {Object} 检测结果
   */
  detect(event, context = {}) {
    const triggeredRules = [];
    let totalWeight = 0;
    
    for (const rule of this.rules) {
      try {
        if (rule.condition(event, context)) {
          triggeredRules.push(rule);
          totalWeight += rule.weight;
        }
      } catch (error) {
        logger.error(`[RULE_BASED_DETECTOR] 规则 "${rule.name}" 执行失败:`, error);
      }
    }
    
    const score = Math.min(totalWeight, 1);
    const isAnomaly = score > this.threshold;
    
    return {
      isAnomaly,
      score,
      reasons: triggeredRules.map(rule => rule.description),
      triggeredRules: triggeredRules.map(rule => rule.name)
    };
  }

  /**
   * 检查是否为已知恶意IP
   * @param {string} ip - IP地址
   * @returns {boolean} 是否为恶意IP
   */
  _isKnownMaliciousIp(ip) {
    // 简化的恶意IP列表
    const maliciousIps = [
      '192.168.1.100',
      '10.0.0.50',
      '172.16.0.1'
    ];
    
    return maliciousIps.includes(ip);
  }
}

/**
 * 集成异常检测器
 */
class EnsembleAnomalyDetector {
  constructor(options = {}) {
    this.detectors = [
      new StatisticalAnomalyDetector(options.statistical),
      new MLBasedAnomalyDetector(options.mlBased),
      new RuleBasedAnomalyDetector(options.ruleBased)
    ];
    
    this.threshold = options.threshold || 0.6;
    this.aggregationMethod = options.aggregationMethod || 'average';
  }

  /**
   * 检测异常
   * @param {Object} event - 用户行为事件
   * @returns {Object} 检测结果
   */
  detect(event) {
    const scores = [];
    const allReasons = [];
    
    for (const detector of this.detectors) {
      try {
        const result = detector.detect(event);
        if (result.isAnomaly) {
          scores.push(result.score);
          allReasons.push(...result.reasons);
        }
      } catch (error) {
        logger.error('[ENSEMBLE_DETECTOR] 子检测器执行失败:', error);
      }
    }
    
    if (scores.length === 0) {
      return {
        isAnomaly: false,
        score: 0,
        reasons: []
      };
    }
    
    let finalScore;
    switch (this.aggregationMethod) {
      case 'average':
        finalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        break;
      case 'max':
        finalScore = Math.max(...scores);
        break;
      case 'weighted':
        // 简化的加权平均
        finalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        break;
      default:
        finalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    const isAnomaly = finalScore > this.threshold;
    
    return {
      isAnomaly,
      score: finalScore,
      reasons: [...new Set(allReasons)] // 去重
    };
  }
}

/**
 * 实时监控器
 * 实时监控和警报系统
 */
class RealTimeMonitor {
  constructor(anomalyDetector, options = {}) {
    this.anomalyDetector = anomalyDetector;
    this.alertThreshold = options.alertThreshold || 0.7;
    this.alertCooldown = options.alertCooldown || 300000; // 5分钟
    this.maxAlertsPerHour = options.maxAlertsPerHour || 10;
    this.alerts = [];
    this.userAlertCounts = new Map();
    
    // 启动清理任务
    this._startCleanupTask();
  }

  /**
   * 监控用户行为事件
   * @param {Object} event - 用户行为事件
   * @returns {Object} 监控结果
   */
  monitorEvent(event) {
    try {
      // 执行异常检测
      const detectionResult = this.anomalyDetector.detectAnomaly(event);
      
      // 如果检测到异常且超过警报阈值，触发警报
      if (detectionResult.isAnomaly && detectionResult.score > this.alertThreshold) {
        this._triggerAlert(event, detectionResult);
      }
      
      return detectionResult;
    } catch (error) {
      logger.error('[REAL_TIME_MONITOR] 监控事件处理失败:', error);
      return {
        isAnomaly: false,
        score: 0,
        reasons: ['监控系统错误'],
        error: error.message
      };
    }
  }

  /**
   * 触发警报
   * @param {Object} event - 用户行为事件
   * @param {Object} detectionResult - 检测结果
   */
  _triggerAlert(event, detectionResult) {
    const now = Date.now();
    const userId = event.userId;
    
    // 检查用户警报频率限制
    const userAlertCount = this.userAlertCounts.get(userId) || 0;
    if (userAlertCount >= this.maxAlertsPerHour) {
      logger.debug(`[REAL_TIME_MONITOR] 用户 ${userId} 的警报频率已达到上限`);
      return;
    }
    
    // 检查全局冷却时间
    const lastAlert = this.alerts.length > 0 ? this.alerts[this.alerts.length - 1] : null;
    if (lastAlert && (now - lastAlert.timestamp) < this.alertCooldown) {
      logger.debug('[REAL_TIME_MONITOR] 警报仍在冷却时间内');
      return;
    }
    
    // 记录警报
    const alert = {
      id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      userId,
      event,
      detectionResult,
      severity: this._calculateSeverity(detectionResult.score)
    };
    
    this.alerts.push(alert);
    this.userAlertCounts.set(userId, userAlertCount + 1);
    
    // 发送警报
    this._sendAlert(alert);
    
    // 记录安全日志
    logger.security(null, '实时异常检测警报', {
      alertId: alert.id,
      userId: event.userId,
      anomalyScore: detectionResult.score,
      reasons: detectionResult.reasons,
      severity: alert.severity,
      event: {
        action: event.action,
        resource: event.resource,
        ip: event.ip
      }
    });
  }

  /**
   * 计算警报严重性
   * @param {number} score - 异常分数
   * @returns {string} 严重性等级
   */
  _calculateSeverity(score) {
    if (score >= 0.9) return 'CRITICAL';
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 发送警报
   * @param {Object} alert - 警报对象
   */
  _sendAlert(alert) {
    // 这里可以集成多种警报方式
    // 例如：邮件、短信、Slack、Webhook等
    
    logger.warn(`[ALERT] ${alert.severity} 级别安全警报`, {
      alertId: alert.id,
      userId: alert.userId,
      score: alert.detectionResult.score,
      reasons: alert.detectionResult.reasons,
      event: alert.event
    });
    
    // 示例：集成邮件警报
    // this._sendEmailAlert(alert);
    
    // 示例：集成Webhook警报
    // this._sendWebhookAlert(alert);
  }

  /**
   * 发送邮件警报
   * @param {Object} alert - 警报对象
   */
  _sendEmailAlert(alert) {
    // 邮件警报实现
    logger.info('[EMAIL_ALERT] 发送邮件警报', {
      to: process.env.SECURITY_TEAM_EMAIL || 'security@company.com',
      subject: `安全警报: ${alert.severity} 级别异常行为检测`,
      alertId: alert.id
    });
  }

  /**
   * 发送Webhook警报
   * @param {Object} alert - 警报对象
   */
  _sendWebhookAlert(alert) {
    // Webhook警报实现
    logger.info('[WEBHOOK_ALERT] 发送Webhook警报', {
      url: process.env.SECURITY_WEBHOOK_URL,
      alertId: alert.id
    });
  }

  /**
   * 启动清理任务
   */
  _startCleanupTask() {
    // 每小时清理一次过期的警报和计数器
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      
      // 清理过期警报
      this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
      
      // 重置用户警报计数器
      this.userAlertCounts.clear();
      
      logger.debug('[REAL_TIME_MONITOR] 清理任务完成');
    }, 3600000); // 1小时
  }

  /**
   * 获取警报统计信息
   * @returns {Object} 统计信息
   */
  getAlertStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
    
    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };
    
    for (const alert of recentAlerts) {
      severityCounts[alert.severity]++;
    }
    
    return {
      totalAlerts: recentAlerts.length,
      severityCounts,
      userAlertCounts: Object.fromEntries(this.userAlertCounts),
      lastAlert: recentAlerts.length > 0 ? recentAlerts[recentAlerts.length - 1] : null
    };
  }

  /**
   * 获取用户警报历史
   * @param {string} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Array} 警报历史
   */
  getUserAlertHistory(userId, limit = 10) {
    return this.alerts
      .filter(alert => alert.userId === userId)
      .slice(-limit)
      .reverse();
  }
}

module.exports = {
  UserBehaviorAnalyzer,
  RealTimeAnomalyDetector,
  AdvancedAnomalyDetector,
  StatisticalAnomalyDetector,
  MLBasedAnomalyDetector,
  RuleBasedAnomalyDetector,
  EnsembleAnomalyDetector,
  RealTimeMonitor
};