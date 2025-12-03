/**
 * 负载均衡管理器
 * 提供后端服务节点的健康检查、负载均衡和自动故障转移功能
 */

const { EventEmitter } = require('events');
const { logger } = require('../config/logger');
const http = require('http');
const https = require('https');
const { redisManager } = require('../config/multiLevelCache');

class LoadBalancerManager extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map(); // 存储后端节点信息
    this.algorithm = 'round-robin'; // 默认负载均衡算法
    this.currentNodeIndex = 0;
    this.healthCheckInterval = 30000; // 健康检查间隔 30秒
    this.healthCheckTimer = null;
    this.requestHistory = new Map(); // 记录请求历史用于负载计算
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffFactor: 2
    };
    
    // 默认后端节点（当前服务）
    this.addDefaultNode();
    
    // 启动健康检查
    this.startHealthCheck();
  }

  /**
   * 添加默认节点（当前服务）
   */
  addDefaultNode() {
    const node = {
      id: 'default-node-1',
      host: '127.0.0.1',
      port: 4000,
      weight: 1,
      enabled: true,
      healthy: true,
      lastCheck: new Date(),
      responseTime: 0,
      requestCount: 0,
      errorCount: 0,
      successRate: 100,
      createdAt: new Date(),
      metadata: {
        type: 'local',
        version: '1.0.0',
        region: 'local'
      }
    };
    
    this.nodes.set(node.id, node);
    logger.info('[LOADBALANCER] 添加默认节点:', node);
  }

  /**
   * 添加后端服务节点
   */
  async addNode(nodeConfig) {
    try {
      const {
        id,
        host,
        port,
        weight = 1,
        enabled = true,
        healthy = true,
        metadata = {}
      } = nodeConfig;

      if (!host || !port) {
        throw new Error('host和port参数是必需的');
      }

      // 生成节点ID（如果没有提供）
      const nodeId = id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 检查节点是否已存在
      if (this.nodes.has(nodeId)) {
        throw new Error(`节点 ${nodeId} 已存在`);
      }

      // 创建节点对象
      const node = {
        id: nodeId,
        host,
        port: parseInt(port),
        weight: parseInt(weight),
        enabled: Boolean(enabled),
        healthy: Boolean(healthy),
        lastCheck: new Date(),
        responseTime: 0,
        requestCount: 0,
        errorCount: 0,
        successRate: healthy ? 100 : 0,
        createdAt: new Date(),
        metadata: {
          type: 'external',
          region: 'unknown',
          ...metadata
        }
      };

      // 执行初始健康检查
      if (node.enabled) {
        const healthStatus = await this.checkNodeHealth(node);
        node.healthy = healthStatus.healthy;
        node.lastCheck = new Date();
        node.responseTime = healthStatus.responseTime;
      }

      // 保存节点
      this.nodes.set(nodeId, node);

      // 触发事件
      this.emit('nodeAdded', node);

      logger.info(`[LOADBALANCER] 添加节点成功: ${nodeId} (${host}:${port})`);

      return node;
    } catch (error) {
      logger.error('[LOADBALANCER] 添加节点失败:', error);
      throw error;
    }
  }

  /**
   * 移除后端服务节点
   */
  async removeNode(nodeId) {
    try {
      if (!this.nodes.has(nodeId)) {
        throw new Error(`节点 ${nodeId} 不存在`);
      }

      const node = this.nodes.get(nodeId);
      
      // 如果是默认节点，不允许删除
      if (node.id === 'default-node-1') {
        throw new Error('默认节点不能被删除');
      }

      this.nodes.delete(nodeId);
      
      // 触发事件
      this.emit('nodeRemoved', node);

      logger.info(`[LOADBALANCER] 移除节点: ${nodeId}`);

      return {
        success: true,
        removedNode: nodeId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[LOADBALANCER] 移除节点失败:', error);
      throw error;
    }
  }

  /**
   * 获取节点状态
   */
  async getStatus() {
    try {
      const healthyNodes = [];
      const unhealthyNodes = [];
      const disabledNodes = [];

      for (const [nodeId, node] of this.nodes) {
        const nodeStatus = {
          id: nodeId,
          host: node.host,
          port: node.port,
          weight: node.weight,
          enabled: node.enabled,
          healthy: node.healthy,
          lastCheck: node.lastCheck,
          responseTime: node.responseTime,
          requestCount: node.requestCount,
          errorCount: node.errorCount,
          successRate: node.successRate,
          uptime: Date.now() - node.createdAt.getTime(),
          metadata: node.metadata
        };

        if (!node.enabled) {
          disabledNodes.push(nodeStatus);
        } else if (node.healthy) {
          healthyNodes.push(nodeStatus);
        } else {
          unhealthyNodes.push(nodeStatus);
        }
      }

      // 计算整体状态
      const totalNodes = this.nodes.size;
      const healthyCount = healthyNodes.length;
      const unhealthyCount = unhealthyNodes.length;
      const disabledCount = disabledNodes.length;

      let overallStatus = 'unknown';
      if (healthyCount === 0 && totalNodes > 0) {
        overallStatus = 'critical'; // 所有节点都不可用
      } else if (healthyCount > 0) {
        if (healthyCount === totalNodes) {
          overallStatus = 'healthy';
        } else {
          overallStatus = 'degraded'; // 部分节点不可用
        }
      }

      // 获取性能统计
      const performanceStats = this.calculatePerformanceStats();

      // 获取负载均衡算法配置
      const algorithmConfig = {
        algorithm: this.algorithm,
        currentNodeIndex: this.currentNodeIndex,
        retryConfig: this.retryConfig
      };

      return {
        timestamp: new Date().toISOString(),
        status: overallStatus,
        summary: {
          total: totalNodes,
          healthy: healthyCount,
          unhealthy: unhealthyCount,
          disabled: disabledCount
        },
        nodes: {
          healthy: healthyNodes,
          unhealthy: unhealthyNodes,
          disabled: disabledNodes
        },
        performance: performanceStats,
        algorithm: algorithmConfig,
        configuration: {
          healthCheckInterval: this.healthCheckInterval,
          healthCheckTimer: this.healthCheckTimer ? 'running' : 'stopped'
        }
      };
    } catch (error) {
      logger.error('[LOADBALANCER] 获取状态失败:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 检查节点健康状态
   */
  async checkNodeHealth(node) {
    try {
      const startTime = Date.now();
      const healthUrl = `http://${node.host}:${node.port}/api/health`;
      
      const response = await this.makeRequest({
        method: 'GET',
        url: healthUrl,
        timeout: 5000,
        headers: {
          'User-Agent': 'LoadBalancer-HealthCheck/1.0'
        }
      });

      const responseTime = Date.now() - startTime;

      // 检查响应状态和内容
      if (response.statusCode === 200) {
        let healthData = {};
        try {
          healthData = JSON.parse(response.body || '{}');
        } catch (e) {
          // 如果不是JSON响应，根据状态码判断
        }

        return {
          healthy: true,
          responseTime,
          statusCode: response.statusCode,
          data: healthData
        };
      } else {
        return {
          healthy: false,
          responseTime,
          statusCode: response.statusCode,
          error: `Health check failed with status: ${response.statusCode}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - (node.lastCheck ? node.lastCheck.getTime() : Date.now());
      
      return {
        healthy: false,
        responseTime,
        error: error.message
      };
    }
  }

  /**
   * 执行HTTP请求
   */
  makeRequest(options) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.url);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 10000
      };

      const req = httpModule.request(requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * 启动健康检查
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckInterval);

    logger.info(`[LOADBALANCER] 健康检查已启动，间隔: ${this.healthCheckInterval}ms`);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('[LOADBALANCER] 健康检查已停止');
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    try {
      for (const [nodeId, node] of this.nodes) {
        if (!node.enabled) {
          continue; // 跳过禁用的节点
        }

        try {
          const healthStatus = await this.checkNodeHealth(node);
          const wasHealthy = node.healthy;
          
          // 更新节点状态
          node.healthy = healthStatus.healthy;
          node.lastCheck = new Date();
          node.responseTime = healthStatus.responseTime;
          
          // 更新成功率
          const totalChecks = node.requestCount;
          if (healthStatus.healthy) {
            const healthyChecks = Math.floor(totalChecks * (node.successRate / 100));
            node.successRate = Math.min(100, ((healthyChecks + 1) / (totalChecks + 1)) * 100);
          } else {
            const healthyChecks = Math.floor(totalChecks * (node.successRate / 100));
            node.successRate = (healthyChecks / (totalChecks + 1)) * 100;
          }

          // 如果健康状态发生变化，触发事件
          if (wasHealthy !== healthStatus.healthy) {
            this.emit('nodeHealthChanged', {
              nodeId,
              node,
              wasHealthy,
              isHealthy: healthStatus.healthy,
              healthStatus
            });

            logger.info(`[LOADBALANCER] 节点健康状态变化: ${nodeId} ${wasHealthy ? '→' : '→'} ${healthStatus.healthy ? 'healthy' : 'unhealthy'}`);
          }
        } catch (error) {
          logger.warn(`[LOADBALANCER] 节点 ${nodeId} 健康检查失败:`, error.message);
          
          node.healthy = false;
          node.errorCount++;
          node.lastCheck = new Date();
        }
      }
    } catch (error) {
      logger.error('[LOADBALANCER] 健康检查失败:', error);
    }
  }

  /**
   * 负载均衡算法 - 选择下一个节点
   */
  selectNode() {
    const availableNodes = Array.from(this.nodes.values())
      .filter(node => node.enabled && node.healthy);

    if (availableNodes.length === 0) {
      throw new Error('没有可用的健康节点');
    }

    let selectedNode;

    switch (this.algorithm) {
      case 'round-robin':
        selectedNode = this.selectNodeRoundRobin(availableNodes);
        break;
      
      case 'least-connections':
        selectedNode = this.selectNodeLeastConnections(availableNodes);
        break;
      
      case 'weighted-round-robin':
        selectedNode = this.selectNodeWeightedRoundRobin(availableNodes);
        break;
      
      case 'fastest-response':
        selectedNode = this.selectNodeFastestResponse(availableNodes);
        break;
      
      default:
        selectedNode = this.selectNodeRoundRobin(availableNodes);
    }

    return selectedNode;
  }

  /**
   * 轮询算法
   */
  selectNodeRoundRobin(availableNodes) {
    if (availableNodes.length === 1) {
      return availableNodes[0];
    }

    const node = availableNodes[this.currentNodeIndex % availableNodes.length];
    this.currentNodeIndex++;
    
    return node;
  }

  /**
   * 最少连接算法
   */
  selectNodeLeastConnections(availableNodes) {
    if (availableNodes.length === 1) {
      return availableNodes[0];
    }

    return availableNodes.reduce((least, current) => {
      const leastActive = this.getActiveConnections(least.id);
      const currentActive = this.getActiveConnections(current.id);
      
      return currentActive < leastActive ? current : least;
    });
  }

  /**
   * 加权轮询算法
   */
  selectNodeWeightedRoundRobin(availableNodes) {
    const weights = availableNodes.map(node => node.weight || 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      return this.selectNodeRoundRobin(availableNodes);
    }

    const random = Math.random() * totalWeight;
    let accumulated = 0;

    for (let i = 0; i < availableNodes.length; i++) {
      accumulated += weights[i];
      if (random <= accumulated) {
        return availableNodes[i];
      }
    }

    return availableNodes[0]; // 备用
  }

  /**
   * 最快响应算法
   */
  selectNodeFastestResponse(availableNodes) {
    if (availableNodes.length === 1) {
      return availableNodes[0];
    }

    return availableNodes.reduce((fastest, current) => {
      return (current.responseTime || 0) < (fastest.responseTime || 0) ? current : fastest;
    });
  }

  /**
   * 获取节点活动连接数
   */
  getActiveConnections(nodeId) {
    // 这里应该实现真实的连接数跟踪
    // 目前返回0表示实现简化版本
    return 0;
  }

  /**
   * 代理请求到后端节点
   */
  async proxyRequest(req, res, options = {}) {
    let lastError;
    let attempts = 0;

    while (attempts < this.retryConfig.maxRetries + 1) {
      try {
        // 选择节点
        const selectedNode = this.selectNode();
        
        // 更新节点统计
        selectedNode.requestCount++;
        
        // 构建请求URL
        const targetUrl = `${selectedNode.host}:${selectedNode.port}${req.url}`;
        
        logger.debug(`[LOADBALANCER] 代理请求到节点 ${selectedNode.id}: ${targetUrl}`);
        
        // 发起请求
        const response = await this.proxyToNode(req, selectedNode, options);
        
        // 更新成功统计
        if (response.statusCode >= 200 && response.statusCode < 300) {
          selectedNode.errorCount = Math.max(0, selectedNode.errorCount - 1);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        attempts++;
        
        // 记录错误
        const currentNode = this.getLastSelectedNode();
        if (currentNode) {
          currentNode.errorCount++;
        }
        
        logger.warn(`[LOADBALANCER] 代理请求失败 (尝试 ${attempts}/${this.retryConfig.maxRetries + 1}):`, error.message);
        
        // 如果还有重试次数，等待后重试
        if (attempts < this.retryConfig.maxRetries + 1) {
          const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffFactor, attempts - 1);
          await this.sleep(delay);
        }
      }
    }

    // 所有重试都失败了
    throw new Error(`所有后端节点都不可用，最后错误: ${lastError.message}`);
  }

  /**
   * 代理请求到具体节点
   */
  async proxyToNode(req, node, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = req.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const proxyOptions = {
        hostname: node.host,
        port: node.port,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          'x-forwarded-for': req.ip || req.connection.remoteAddress,
          'x-forwarded-proto': req.protocol,
          'x-forwarded-port': req.connection.remotePort
        },
        timeout: options.timeout || 30000
      };

      const proxyReq = httpModule.request(proxyOptions, (proxyRes) => {
        // 转发响应头
        Object.keys(proxyRes.headers).forEach(key => {
          if (key.toLowerCase() !== 'transfer-encoding') {
            res.setHeader(key, proxyRes.headers[key]);
          }
        });
        
        res.statusCode = proxyRes.statusCode;
        
        // 转发响应体
        proxyRes.on('data', (chunk) => {
          res.write(chunk);
        });
        
        proxyRes.on('end', () => {
          resolve({
            statusCode: proxyRes.statusCode,
            headers: proxyRes.headers
          });
        });
      });

      proxyReq.on('error', (error) => {
        reject(error);
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        reject(new Error('Proxy request timeout'));
      });

      // 转发请求体（如果存在）
      req.on('data', (chunk) => {
        proxyReq.write(chunk);
      });

      req.on('end', () => {
        proxyReq.end();
      });
    });
  }

  /**
   * 获取最后选择的节点（用于错误记录）
   */
  getLastSelectedNode() {
    // 这里应该实现选择节点的缓存
    // 简化实现返回第一个可用的节点
    return Array.from(this.nodes.values()).find(node => node.enabled && node.healthy);
  }

  /**
   * 计算性能统计
   */
  calculatePerformanceStats() {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let healthyNodesCount = 0;

    for (const node of this.nodes.values()) {
      if (node.enabled) {
        totalRequests += node.requestCount;
        totalErrors += node.errorCount;
        totalResponseTime += node.responseTime;
        if (node.healthy) {
          healthyNodesCount++;
        }
      }
    }

    const averageResponseTime = healthyNodesCount > 0 ? totalResponseTime / healthyNodesCount : 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const availability = this.nodes.size > 0 ? (healthyNodesCount / this.nodes.size) * 100 : 0;

    return {
      totalRequests,
      totalErrors,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: errorRate.toFixed(2),
      availability: availability.toFixed(2),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 设置负载均衡算法
   */
  setAlgorithm(algorithm) {
    const supportedAlgorithms = ['round-robin', 'least-connections', 'weighted-round-robin', 'fastest-response'];
    
    if (!supportedAlgorithms.includes(algorithm)) {
      throw new Error(`不支持的负载均衡算法: ${algorithm}. 支持的算法: ${supportedAlgorithms.join(', ')}`);
    }

    this.algorithm = algorithm;
    logger.info(`[LOADBALANCER] 设置负载均衡算法: ${algorithm}`);
    
    return {
      success: true,
      algorithm: this.algorithm,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 更新重试配置
   */
  updateRetryConfig(config) {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
    
    logger.info('[LOADBALANCER] 更新重试配置:', this.retryConfig);
    
    return {
      success: true,
      config: this.retryConfig,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 启用/禁用节点
   */
  async toggleNode(nodeId, enabled) {
    try {
      if (!this.nodes.has(nodeId)) {
        throw new Error(`节点 ${nodeId} 不存在`);
      }

      const node = this.nodes.get(nodeId);
      node.enabled = enabled;
      
      // 如果启用节点，立即进行健康检查
      if (enabled) {
        const healthStatus = await this.checkNodeHealth(node);
        node.healthy = healthStatus.healthy;
        node.lastCheck = new Date();
      }

      // 触发事件
      this.emit('nodeToggled', {
        nodeId,
        node,
        enabled
      });

      logger.info(`[LOADBALANCER] 节点 ${nodeId} 已${enabled ? '启用' : '禁用'}`);

      return {
        success: true,
        nodeId,
        enabled,
        healthy: node.healthy,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[LOADBALANCER] 切换节点状态失败:', error);
      throw error;
    }
  }

  /**
   * 等待函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭负载均衡器
   */
  async close() {
    try {
      // 停止健康检查
      this.stopHealthCheck();
      
      // 清理请求历史
      this.requestHistory.clear();
      
      logger.info('[LOADBALANCER] 负载均衡器已关闭');
    } catch (error) {
      logger.error('[LOADBALANCER] 关闭负载均衡器失败:', error);
    }
  }
}

module.exports = LoadBalancerManager;