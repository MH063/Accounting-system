/**
 * 数据库连接池动态监控
 * 实时监控连接池状态和性能指标
 */

const { pool } = require('../config/database');
const { logger } = require('../config/logger');
const EventEmitter = require('events');

class DatabasePoolMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      errors: 0,
      connectionAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      connectionTimeouts: 0,
      queryCount: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      peakConnections: 0,
      uptime: Date.now()
    };
    
    this.history = [];
    this.maxHistorySize = 100;
    this.slowQueryThreshold = 1000; // ms
    this.monitoringInterval = null;
    this.isMonitoring = false;
  }

  /**
   * 开始监控
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) {
      logger.warn('[DB-POOL-MONITOR] 监控已在运行中');
      return;
    }

    this.isMonitoring = true;
    logger.info(`[DB-POOL-MONITOR] 开始监控连接池，间隔: ${interval}ms`);

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);

    // 立即收集一次
    this.collectMetrics();
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('[DB-POOL-MONITOR] 停止监控连接池');
  }

  /**
   * 收集指标
   */
  collectMetrics() {
    try {
      const snapshot = {
        timestamp: new Date().toISOString(),
        totalCount: pool.totalCount || 0,
        idleCount: pool.idleCount || 0,
        waitingCount: pool.waitingCount || 0,
        maxConnections: pool.options?.max || 10
      };

      // 计算活动连接数
      snapshot.activeCount = snapshot.totalCount - snapshot.idleCount;

      // 更新峰值连接数
      if (snapshot.activeCount > this.metrics.peakConnections) {
        this.metrics.peakConnections = snapshot.activeCount;
      }

      // 更新当前指标
      this.metrics.totalConnections = snapshot.totalCount;
      this.metrics.activeConnections = snapshot.activeCount;
      this.metrics.idleConnections = snapshot.idleCount;
      this.metrics.waitingClients = snapshot.waitingCount;

      // 计算使用率
      snapshot.utilizationRate = snapshot.maxConnections > 0
        ? ((snapshot.totalCount / snapshot.maxConnections) * 100).toFixed(2)
        : 0;

      // 保存历史记录
      this.history.push(snapshot);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }

      // 检查异常状态
      this.checkAnomalies(snapshot);

      // 触发事件
      this.emit('metrics', snapshot);

    } catch (error) {
      logger.error('[DB-POOL-MONITOR] 收集指标失败:', error);
      this.metrics.errors++;
    }
  }

  /**
   * 检查异常状态
   */
  checkAnomalies(snapshot) {
    // 增加缓冲检查：只有连续 3 次超过阈值才发出警告
    if (!this.anomaliesCount) this.anomaliesCount = { exhaustion: 0, highWaiting: 0 };

    // 检查连接池耗尽 (使用率超过 95%)
    if (snapshot.totalCount >= snapshot.maxConnections * 0.95) {
      this.anomaliesCount.exhaustion++;
      if (this.anomaliesCount.exhaustion >= 3) {
        this.emit('warning', {
          type: 'pool_exhaustion',
          message: '连接池使用率持续超过95%',
          data: snapshot
        });
      }
    } else {
      this.anomaliesCount.exhaustion = 0;
    }

    // 检查等待客户端 (超过 10 个)
    if (snapshot.waitingCount > 10) {
      this.anomaliesCount.highWaiting++;
      if (this.anomaliesCount.highWaiting >= 3) {
        this.emit('warning', {
          type: 'high_waiting_clients',
          message: `持续有${snapshot.waitingCount}个客户端在等待连接`,
          data: snapshot
        });
      }
    } else {
      this.anomaliesCount.highWaiting = 0;
    }

    // 检查空闲连接过多 (不做连续性检查，仅作为信息记录)
    if (snapshot.idleCount > snapshot.maxConnections * 0.9) {
      this.emit('info', {
        type: 'high_idle_connections',
        message: '空闲连接过多，考虑减少连接池大小',
        data: snapshot
      });
    }
  }

  /**
   * 记录连接事件
   */
  recordConnection(success) {
    this.metrics.connectionAttempts++;
    if (success) {
      this.metrics.successfulConnections++;
    } else {
      this.metrics.failedConnections++;
    }
  }

  /**
   * 记录查询
   */
  recordQuery(duration) {
    this.metrics.queryCount++;

    // 更新平均查询时间
    const totalTime = this.metrics.avgQueryTime * (this.metrics.queryCount - 1) + duration;
    this.metrics.avgQueryTime = totalTime / this.metrics.queryCount;

    // 记录慢查询
    if (duration > this.slowQueryThreshold) {
      this.metrics.slowQueries++;
      
      this.emit('slowQuery', {
        duration,
        threshold: this.slowQueryThreshold,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 记录超时
   */
  recordTimeout() {
    this.metrics.connectionTimeouts++;
    
    this.emit('timeout', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    const uptime = Date.now() - this.metrics.uptime;
    const uptimeSeconds = Math.floor(uptime / 1000);

    return {
      monitoring: this.isMonitoring,
      uptime: {
        milliseconds: uptime,
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds)
      },
      current: {
        total: this.metrics.totalConnections,
        active: this.metrics.activeConnections,
        idle: this.metrics.idleConnections,
        waiting: this.metrics.waitingClients,
        max: pool.options?.max || 10
      },
      statistics: {
        peakConnections: this.metrics.peakConnections,
        totalAttempts: this.metrics.connectionAttempts,
        successfulConnections: this.metrics.successfulConnections,
        failedConnections: this.metrics.failedConnections,
        connectionTimeouts: this.metrics.connectionTimeouts,
        errors: this.metrics.errors,
        queryCount: this.metrics.queryCount,
        avgQueryTime: Math.round(this.metrics.avgQueryTime * 100) / 100,
        slowQueries: this.metrics.slowQueries
      },
      health: this.getHealthStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取健康状态
   */
  getHealthStatus() {
    const utilizationRate = pool.options?.max > 0
      ? (this.metrics.totalConnections / pool.options.max) * 100
      : 0;

    let status = 'healthy';
    let issues = [];

    if (utilizationRate > 90) {
      status = 'warning';
      issues.push('连接池使用率过高');
    }

    if (this.metrics.waitingClients > 5) {
      status = 'warning';
      issues.push('等待连接的客户端过多');
    }

    if (this.metrics.failedConnections > this.metrics.successfulConnections * 0.1) {
      status = 'critical';
      issues.push('连接失败率过高');
    }

    if (this.metrics.slowQueries > this.metrics.queryCount * 0.05) {
      status = 'warning';
      issues.push('慢查询比例过高');
    }

    return {
      status,
      issues,
      utilizationRate: Math.round(utilizationRate * 100) / 100
    };
  }

  /**
   * 获取历史数据
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  /**
   * 获取统计摘要
   */
  getSummary() {
    if (this.history.length === 0) {
      return null;
    }

    const totalCounts = this.history.map(h => h.totalCount);
    const activeCounts = this.history.map(h => h.activeCount);
    const idleCounts = this.history.map(h => h.idleCount);
    const waitingCounts = this.history.map(h => h.waitingCount);

    return {
      connections: {
        total: {
          avg: this.average(totalCounts),
          min: Math.min(...totalCounts),
          max: Math.max(...totalCounts)
        },
        active: {
          avg: this.average(activeCounts),
          min: Math.min(...activeCounts),
          max: Math.max(...activeCounts)
        },
        idle: {
          avg: this.average(idleCounts),
          min: Math.min(...idleCounts),
          max: Math.max(...idleCounts)
        },
        waiting: {
          avg: this.average(waitingCounts),
          min: Math.min(...waitingCounts),
          max: Math.max(...waitingCounts)
        }
      },
      samples: this.history.length,
      period: {
        start: this.history[0].timestamp,
        end: this.history[this.history.length - 1].timestamp
      }
    };
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      errors: 0,
      connectionAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      connectionTimeouts: 0,
      queryCount: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      peakConnections: 0,
      uptime: Date.now()
    };

    this.history = [];

    logger.info('[DB-POOL-MONITOR] 指标已重置');
  }

  /**
   * 计算平均值
   */
  average(arr) {
    if (arr.length === 0) return 0;
    return Math.round((arr.reduce((sum, val) => sum + val, 0) / arr.length) * 100) / 100;
  }

  /**
   * 格式化运行时间
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

    return parts.join('');
  }
}

// 创建全局实例
const poolMonitor = new DatabasePoolMonitor();

// 监听警告和错误
poolMonitor.on('warning', (event) => {
  logger.warn(`[DB-POOL-MONITOR] ${event.message}`, event.data);
});

poolMonitor.on('slowQuery', (event) => {
  logger.warn(`[DB-POOL-MONITOR] 慢查询检测: ${event.duration}ms (阈值: ${event.threshold}ms)`);
});

poolMonitor.on('timeout', (event) => {
  logger.error(`[DB-POOL-MONITOR] 连接超时: ${event.timestamp}`);
});

module.exports = poolMonitor;
