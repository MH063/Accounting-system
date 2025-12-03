/**
 * 数据库集群管理 - 读写分离和分库分表支持
 * 支持主从复制、读写分离、分库分表等高级功能
 */

const { Pool } = require('pg');
const { logger } = require('./logger');

class DatabaseCluster {
  constructor() {
    this.masterPool = null;
    this.replicaPools = [];
    this.currentReplicaIndex = 0;
    this.shards = new Map();
    this.config = {
      master: null,
      replicas: [],
      sharding: {
        enabled: false,
        strategy: 'hash', // hash, range, mod
        shardCount: 0
      },
      readWriteSplit: {
        enabled: false,
        readPreference: 'replica' // master, replica, any
      }
    };
  }

  /**
   * 初始化集群
   */
  async initialize(config) {
    try {
      this.config = { ...this.config, ...config };

      // 初始化主库连接池
      if (config.master) {
        this.masterPool = new Pool({
          ...config.master,
          max: config.master.max || 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        });

        // 测试主库连接
        const client = await this.masterPool.connect();
        await client.query('SELECT 1');
        client.release();

        logger.info('[DB-CLUSTER] 主库连接成功');
      }

      // 初始化从库连接池
      if (config.replicas && config.replicas.length > 0) {
        for (let i = 0; i < config.replicas.length; i++) {
          const replicaConfig = config.replicas[i];
          const replicaPool = new Pool({
            ...replicaConfig,
            max: replicaConfig.max || 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
          });

          // 测试从库连接
          try {
            const client = await replicaPool.connect();
            await client.query('SELECT 1');
            client.release();
            
            this.replicaPools.push(replicaPool);
            logger.info(`[DB-CLUSTER] 从库 #${i + 1} 连接成功`);
          } catch (error) {
            logger.error(`[DB-CLUSTER] 从库 #${i + 1} 连接失败:`, error.message);
          }
        }

        if (this.replicaPools.length > 0) {
          this.config.readWriteSplit.enabled = true;
          logger.info(`[DB-CLUSTER] 读写分离已启用，从库数量: ${this.replicaPools.length}`);
        }
      }

      // 初始化分片
      if (config.sharding && config.sharding.enabled) {
        await this.initializeSharding(config.sharding);
      }

      return true;
    } catch (error) {
      logger.error('[DB-CLUSTER] 集群初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化分片
   */
  async initializeSharding(shardingConfig) {
    try {
      const { shards, strategy } = shardingConfig;

      if (!shards || shards.length === 0) {
        throw new Error('分片配置为空');
      }

      for (let i = 0; i < shards.length; i++) {
        const shardConfig = shards[i];
        const shardPool = new Pool({
          ...shardConfig,
          max: shardConfig.max || 5
        });

        // 测试分片连接
        const client = await shardPool.connect();
        await client.query('SELECT 1');
        client.release();

        this.shards.set(i, shardPool);
        logger.info(`[DB-CLUSTER] 分片 #${i} 连接成功`);
      }

      this.config.sharding.enabled = true;
      this.config.sharding.strategy = strategy || 'hash';
      this.config.sharding.shardCount = shards.length;

      logger.info(`[DB-CLUSTER] 分片已启用，分片数量: ${shards.length}，策略: ${strategy}`);
    } catch (error) {
      logger.error('[DB-CLUSTER] 分片初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取读连接（支持读写分离）
   */
  getReadPool() {
    // 如果读写分离未启用或没有从库，使用主库
    if (!this.config.readWriteSplit.enabled || this.replicaPools.length === 0) {
      return this.masterPool;
    }

    // 根据读偏好选择连接池
    const { readPreference } = this.config.readWriteSplit;

    if (readPreference === 'master') {
      return this.masterPool;
    }

    if (readPreference === 'replica') {
      // 轮询选择从库
      const pool = this.replicaPools[this.currentReplicaIndex];
      this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicaPools.length;
      return pool;
    }

    // any: 随机选择
    const useReplica = Math.random() > 0.5;
    if (useReplica && this.replicaPools.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.replicaPools.length);
      return this.replicaPools[randomIndex];
    }

    return this.masterPool;
  }

  /**
   * 获取写连接（始终使用主库）
   */
  getWritePool() {
    return this.masterPool;
  }

  /**
   * 根据分片键获取连接
   */
  getShardPool(shardKey) {
    if (!this.config.sharding.enabled) {
      return this.masterPool;
    }

    const shardIndex = this.calculateShardIndex(shardKey);
    return this.shards.get(shardIndex) || this.masterPool;
  }

  /**
   * 计算分片索引
   */
  calculateShardIndex(shardKey) {
    const { strategy, shardCount } = this.config.sharding;

    switch (strategy) {
      case 'hash':
        // 简单哈希策略
        return this.hashCode(String(shardKey)) % shardCount;

      case 'mod':
        // 取模策略（适用于数字键）
        return parseInt(shardKey) % shardCount;

      case 'range':
        // 范围策略（需要配置范围规则）
        return this.getRangeShardIndex(shardKey);

      default:
        return 0;
    }
  }

  /**
   * 哈希函数
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 范围分片索引（需要自定义实现）
   */
  getRangeShardIndex(shardKey) {
    // 这里可以根据具体业务实现范围分片逻辑
    // 例如：按日期范围、按ID范围等
    return 0;
  }

  /**
   * 执行查询（自动路由）
   */
  async query(sql, params = [], options = {}) {
    const { 
      type = 'read', // read, write
      shardKey = null,
      timeout = 10000
    } = options;

    try {
      let pool;

      // 选择连接池
      if (shardKey !== null) {
        pool = this.getShardPool(shardKey);
      } else if (type === 'write') {
        pool = this.getWritePool();
      } else {
        pool = this.getReadPool();
      }

      if (!pool) {
        throw new Error('无可用的数据库连接池');
      }

      // 执行查询
      const startTime = Date.now();
      const result = await pool.query({
        text: sql,
        values: params,
        statement_timeout: timeout
      });
      const duration = Date.now() - startTime;

      logger.debug(`[DB-CLUSTER] 查询完成 (${duration}ms)`, {
        type,
        shardKey,
        rows: result.rowCount
      });

      return result;

    } catch (error) {
      logger.error('[DB-CLUSTER] 查询失败:', error);
      throw error;
    }
  }

  /**
   * 开始事务（仅主库）
   */
  async beginTransaction() {
    const client = await this.masterPool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * 提交事务
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * 回滚事务
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * 获取集群状态
   */
  async getClusterStatus() {
    try {
      const status = {
        master: {
          connected: false,
          totalCount: 0,
          idleCount: 0,
          waitingCount: 0
        },
        replicas: [],
        shards: [],
        config: {
          readWriteSplit: this.config.readWriteSplit.enabled,
          sharding: this.config.sharding.enabled,
          replicaCount: this.replicaPools.length,
          shardCount: this.shards.size
        }
      };

      // 主库状态
      if (this.masterPool) {
        status.master = {
          connected: true,
          totalCount: this.masterPool.totalCount,
          idleCount: this.masterPool.idleCount,
          waitingCount: this.masterPool.waitingCount,
          max: this.masterPool.options.max
        };
      }

      // 从库状态
      for (let i = 0; i < this.replicaPools.length; i++) {
        const pool = this.replicaPools[i];
        status.replicas.push({
          id: i,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
          max: pool.options.max
        });
      }

      // 分片状态
      for (const [shardId, pool] of this.shards.entries()) {
        status.shards.push({
          id: shardId,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
          max: pool.options.max
        });
      }

      return status;

    } catch (error) {
      logger.error('[DB-CLUSTER] 获取集群状态失败:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const health = {
      overall: 'healthy',
      master: { status: 'unknown', latency: null },
      replicas: [],
      shards: []
    };

    try {
      // 检查主库
      if (this.masterPool) {
        const startTime = Date.now();
        await this.masterPool.query('SELECT 1');
        health.master = {
          status: 'healthy',
          latency: Date.now() - startTime
        };
      }

      // 检查从库
      for (let i = 0; i < this.replicaPools.length; i++) {
        try {
          const startTime = Date.now();
          await this.replicaPools[i].query('SELECT 1');
          health.replicas.push({
            id: i,
            status: 'healthy',
            latency: Date.now() - startTime
          });
        } catch (error) {
          health.replicas.push({
            id: i,
            status: 'unhealthy',
            error: error.message
          });
          health.overall = 'degraded';
        }
      }

      // 检查分片
      for (const [shardId, pool] of this.shards.entries()) {
        try {
          const startTime = Date.now();
          await pool.query('SELECT 1');
          health.shards.push({
            id: shardId,
            status: 'healthy',
            latency: Date.now() - startTime
          });
        } catch (error) {
          health.shards.push({
            id: shardId,
            status: 'unhealthy',
            error: error.message
          });
          health.overall = 'degraded';
        }
      }

    } catch (error) {
      health.overall = 'unhealthy';
      logger.error('[DB-CLUSTER] 健康检查失败:', error);
    }

    return health;
  }

  /**
   * 关闭所有连接
   */
  async closeAll() {
    try {
      const closePromises = [];

      if (this.masterPool) {
        closePromises.push(this.masterPool.end());
      }

      for (const pool of this.replicaPools) {
        closePromises.push(pool.end());
      }

      for (const [_, pool] of this.shards) {
        closePromises.push(pool.end());
      }

      await Promise.all(closePromises);

      logger.info('[DB-CLUSTER] 所有数据库连接已关闭');

    } catch (error) {
      logger.error('[DB-CLUSTER] 关闭连接失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
const dbCluster = new DatabaseCluster();

module.exports = dbCluster;
