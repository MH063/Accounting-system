/**
 * 数据库优化器
 * 提供数据库查询优化、索引管理、性能分析等功能
 */

const { pool } = require('../config/database');
const { logger } = require('../config/logger');
const { redisManager } = require('../config/multiLevelCache');
const poolMonitor = require('./dbPoolMonitor');

class DatabaseOptimizer {
  constructor() {
    this.pool = pool;
    this.slowQueryLog = [];
    this.maxSlowQueryLog = 100;
    this.extensionChecked = false;
    this.extensionEnabled = false;
    
    // 启动连接池监控
    this.initializeMonitoring();
  }

  /**
   * 初始化监控
   */
  initializeMonitoring() {
    try {
      // 启动连接池监控
      poolMonitor.startMonitoring(10000); // 每10秒收集一次
      logger.info('[DATABASE] 数据库性能监控已启动');
    } catch (error) {
      logger.error('[DATABASE] 启动性能监控失败:', error);
    }
  }

  /**
   * 分析数据库性能
   */
  async analyzePerformance() {
    try {
      logger.info('[DATABASE] 开始性能分析...');
      
      // 并行获取所有统计信息，提高效率
      const [basicStats, slowQueries, indexStats, tableSizes, connectionStats, locks] = await Promise.allSettled([
        this.getBasicStats(),
        this.getSlowQueries(),
        this.getIndexStats(),
        this.getTableSizes(),
        this.getConnectionStats(),
        this.getLockInfo()
      ]);
      
      logger.info('[DATABASE] 性能分析完成');
      
      // 处理结果，即使部分查询失败也返回有用数据
      const result = {
        timestamp: new Date().toISOString(),
        basicStats: basicStats.status === 'fulfilled' ? basicStats.value : { error: basicStats.reason?.message },
        slowQueries: slowQueries.status === 'fulfilled' ? slowQueries.value : { enabled: false, error: slowQueries.reason?.message },
        indexStats: indexStats.status === 'fulfilled' ? indexStats.value : [],
        tableSizes: tableSizes.status === 'fulfilled' ? tableSizes.value : { tables: [], error: tableSizes.reason?.message },
        connectionStats: connectionStats.status === 'fulfilled' ? connectionStats.value : { error: connectionStats.reason?.message },
        locks: locks.status === 'fulfilled' ? locks.value : { total: 0, waiting: 0, blocked: 0, error: locks.reason?.message }
      };
      
      // 生成优化建议
      result.recommendations = this.generateRecommendations(result);
      
      return result;
    } catch (error) {
      logger.error('[DATABASE] 性能分析失败:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        basicStats: { status: 'error' },
        slowQueries: { enabled: false },
        indexStats: [],
        tableSizes: { tables: [] },
        connectionStats: {},
        locks: { total: 0, waiting: 0, blocked: 0 },
        recommendations: []
      };
    }
  }

  /**
   * 获取基本统计信息
   */
  async getBasicStats() {
    try {
      const query = `
        SELECT 
          datname as database,
          numbackends as current_connections,
          xact_commit as commits,
          xact_rollback as rollbacks,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as rows_returned,
          tup_fetched as rows_fetched,
          tup_inserted as rows_inserted,
          tup_updated as rows_updated,
          tup_deleted as rows_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      const result = await this.pool.query(query);
      
      if (result.rows.length > 0) {
        const stats = result.rows[0];
        
        // 计算缓存命中率
        const blocksHit = parseInt(stats.blocks_hit);
        const blocksRead = parseInt(stats.blocks_read);
        const totalBlocks = blocksHit + blocksRead;
        const cacheHitRatio = totalBlocks > 0 ? (blocksHit / totalBlocks * 100).toFixed(2) : 0;
        
        return {
          database: stats.database,
          currentConnections: parseInt(stats.current_connections),
          commits: parseInt(stats.commits),
          rollbacks: parseInt(stats.rollbacks),
          blocksRead: parseInt(stats.blocks_read),
          blocksHit: parseInt(stats.blocks_hit),
          cacheHitRatio: parseFloat(cacheHitRatio),
          rowsReturned: parseInt(stats.rows_returned),
          rowsFetched: parseInt(stats.rows_fetched),
          rowsInserted: parseInt(stats.rows_inserted),
          rowsUpdated: parseInt(stats.rows_updated),
          rowsDeleted: parseInt(stats.rows_deleted)
        };
      }
      
      return null;
    } catch (error) {
      logger.error('[DATABASE] 获取基本统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取慢查询统计
   */
  async getSlowQueries() {
    try {
      // 检查缓存的扩展状态
      if (!this.extensionChecked) {
        const checkExtensionQuery = "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'";
        const extensionResult = await this.pool.query(checkExtensionQuery);
        this.extensionEnabled = extensionResult.rows.length > 0;
        this.extensionChecked = true;
        
        if (!this.extensionEnabled) {
          logger.warn('[DATABASE] pg_stat_statements 扩展未安装，慢查询分析功能已禁用');
        }
      }
      
      if (!this.extensionEnabled) {
        return {
          enabled: false,
          message: '请安装 pg_stat_statements 扩展以获取慢查询统计'
        };
      }

      // 获取当前数据库的慢查询
      const query = `
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time,
          stddev_exec_time as stddev_time,
          min_exec_time as min_time,
          max_exec_time as max_time,
          rows
        FROM pg_stat_statements 
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
          AND query NOT LIKE '%pg_stat_statements%'
          AND query NOT LIKE '%pg_stat_database%'
          AND query NOT LIKE '%pg_stat_user_tables%'
          AND query NOT LIKE '%pg_stat_user_indexes%'
          AND query NOT LIKE '%information_schema%'
        ORDER BY mean_exec_time DESC 
        LIMIT 20
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('[DATABASE] 获取慢查询统计失败:', error);
      return {
        enabled: false,
        error: error.message
      };
    }
  }

  /**
   * 获取索引使用情况
   */
  async getIndexStats() {
    try {
      const query = `
        SELECT 
          s.schemaname,
          s.relname as tablename,
          s.indexrelname as indexname,
          s.idx_scan as index_scans,
          s.idx_tup_read as tuples_read,
          s.idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size
        FROM pg_stat_user_indexes s
        ORDER BY s.idx_scan DESC
      `;
      
      const result = await this.pool.query(query);
      
      // 分析索引使用效率
      const indexAnalysis = result.rows.map(row => {
        const scans = parseInt(row.index_scans) || 0;
        const read = parseInt(row.tuples_read) || 0;
        const fetch = parseInt(row.tuples_fetched) || 0;
        
        let efficiency = 'unknown';
        let recommendation = '';
        
        if (scans === 0) {
          efficiency = 'unused';
          recommendation = '此索引从未被使用，考虑删除';
        } else if (read > 0 && fetch > 0) {
          const ratio = fetch / read;
          if (ratio < 0.1) {
            efficiency = 'low';
            recommendation = '索引使用效率低，考虑重新设计或删除';
          } else if (ratio > 0.9) {
            efficiency = 'high';
            recommendation = '索引使用效率高';
          } else {
            efficiency = 'medium';
            recommendation = '索引使用效率中等';
          }
        }
        
        return {
          ...row,
          efficiency,
          recommendation
        };
      });
      
      return indexAnalysis;
    } catch (error) {
      logger.error('[DATABASE] 获取索引统计失败:', error);
      return [];
    }
  }

  /**
   * 获取表大小信息
   */
  async getTableSizes() {
    try {
      // 使用更简单可靠的查询
      const query = `
        SELECT 
          schemaname,
          relname as tablename,
          pg_size_pretty(pg_total_relation_size(relid)) as table_size,
          pg_size_pretty(pg_relation_size(relid)) as table_data_size,
          pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as indexes_size,
          n_live_tup as row_count,
          n_dead_tup as dead_rows,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 50
      `;
      
      const result = await this.pool.query(query);
      
      if (result.rows.length === 0) {
        return {
          tables: [],
          message: '数据库中没有用户表',
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        tables: result.rows.map(row => ({
          schema: row.schemaname,
          table: row.tablename,
          tableSize: row.table_size,
          dataSize: row.table_data_size,
          indexesSize: row.indexes_size,
          rowCount: parseInt(row.row_count) || 0,
          deadRows: parseInt(row.dead_rows) || 0,
          lastVacuum: row.last_vacuum,
          lastAutoVacuum: row.last_autovacuum,
          lastAnalyze: row.last_analyze,
          lastAutoAnalyze: row.last_autoanalyze
        })),
        total: result.rows.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[DATABASE] 获取表大小失败:', error);
      return {
        tables: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取连接状态
   */
  async getConnectionStats() {
    try {
      const query = `
        SELECT 
          state,
          count(*) as count,
          pg_size_pretty(sum(pg_database_size(current_database()))) as total_size
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;
      
      const result = await this.pool.query(query);
      
      // 获取连接池状态
      const poolInfo = this.pool;
      const poolStats = {
        total: poolInfo.totalCount || 0,
        idle: poolInfo.idleCount || 0,
        waiting: poolInfo.waitingCount || 0,
        max: poolInfo.options?.max || 10
      };
      
      const stateStats = {};
      result.rows.forEach(row => {
        stateStats[row.state] = parseInt(row.count);
      });
      
      return {
        connections: stateStats,
        pool: poolStats
      };
    } catch (error) {
      logger.error('[DATABASE] 获取连接状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取锁信息
   */
  async getLockInfo() {
    try {
      const query = `
        SELECT 
          l.locktype,
          l.mode,
          l.granted,
          a.usename,
          a.datname,
          a.client_addr,
          l.relation::regclass as relation,
          l.transactionid,
          l.pid,
          a.query,
          a.state,
          a.query_start,
          state_change,
          now() - query_start as duration
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON a.pid = l.pid
        WHERE a.datname = current_database()
        ORDER BY query_start
      `;
      
      const result = await this.pool.query(query);
      
      // 分析锁情况
      const totalLocks = result.rows.length;
      const waitingLocks = result.rows.filter(lock => !lock.granted).length;
      const blockedQueries = result.rows.filter(lock => lock.state === 'active').length;
      
      return {
        total: totalLocks,
        waiting: waitingLocks,
        blocked: blockedQueries,
        details: result.rows.slice(0, 50), // 最多显示50个锁详情
        blockedQueries: blockedQueries > 0 ? '存在被阻塞的查询' : '无被阻塞的查询'
      };
    } catch (error) {
      logger.error('[DATABASE] 获取锁信息失败:', error);
      throw error;
    }
  }

  /**
   * 执行数据库健康检查并发出警报（如果需要）
   */
  async checkHealthAndAlert() {
    try {
      const analysis = await this.analyzePerformance();
      const alerts = [];

      // 1. 检查连接池状态
      if (analysis.connectionStats && analysis.connectionStats.pool) {
        const { total, max, waiting } = analysis.connectionStats.pool;
        const usageRatio = total / max;
        
        if (usageRatio > 0.9) {
          alerts.push({
            level: 'CRITICAL',
            type: 'pool_exhaustion',
            message: `数据库连接池接近枯竭 (${total}/${max})`,
            recommendation: '考虑增加 DB_POOL_MAX 或检查连接泄漏'
          });
        } else if (usageRatio > 0.7) {
          alerts.push({
            level: 'WARNING',
            type: 'high_pool_usage',
            message: `数据库连接池使用率较高 (${total}/${max})`
          });
        }

        if (waiting > 0) {
          alerts.push({
            level: 'CRITICAL',
            type: 'waiting_clients',
            message: `发现 ${waiting} 个客户端正在等待数据库连接`,
            recommendation: '立即增加连接池大小或优化长查询'
          });
        }
      }

      // 2. 检查慢查询
      if (analysis.slowQueries && Array.isArray(analysis.slowQueries)) {
        const criticalSlowQueries = analysis.slowQueries.filter(q => q.mean_time > 5000); // 5秒
        if (criticalSlowQueries.length > 0) {
          alerts.push({
            level: 'WARNING',
            type: 'slow_queries',
            message: `发现 ${criticalSlowQueries.length} 个执行时间超过 5s 的慢查询`,
            recommendation: '检查 pg_stat_statements 获取详细 SQL 并进行优化'
          });
        }
      }

      // 3. 检查回滚率
      if (analysis.basicStats && !analysis.basicStats.error) {
        const { commits, rollbacks } = analysis.basicStats;
        const totalXact = commits + rollbacks;
        if (totalXact > 100) {
          const rollbackRatio = rollbacks / totalXact;
          if (rollbackRatio > 0.05) { // 超过5%的回滚率
            alerts.push({
              level: 'WARNING',
              type: 'high_rollback_ratio',
              message: `事务回滚率较高 (${(rollbackRatio * 100).toFixed(2)}%)`,
              recommendation: '检查应用层是否存在频繁的事务冲突或逻辑错误'
            });
          }
        }
      }

      // 记录警报到日志
      if (alerts.length > 0) {
        alerts.forEach(alert => {
          const logMsg = `[DB-ALERT] [${alert.level}] ${alert.message}${alert.recommendation ? ' - 建议: ' + alert.recommendation : ''}`;
          if (alert.level === 'CRITICAL') {
            logger.error(logMsg);
          } else {
            logger.warn(logMsg);
          }
        });
      } else {
        logger.info('[DATABASE] 健康检查完成，系统状态良好');
      }

      return {
        timestamp: new Date().toISOString(),
        status: alerts.length === 0 ? 'HEALTHY' : (alerts.some(a => a.level === 'CRITICAL') ? 'CRITICAL' : 'WARNING'),
        alerts
      };
    } catch (error) {
      logger.error('[DATABASE] 健康检查执行失败:', error);
      throw error;
    }
  }

  /**
   * 生成优化建议
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // 缓存命中率建议
    if (analysis.basicStats && !analysis.basicStats.error) {
      const stats = analysis.basicStats;
      const blocksHit = parseInt(stats.blocksHit) || 0;
      const blocksRead = parseInt(stats.blocksRead) || 0;
      const totalBlocks = blocksHit + blocksRead;
      
      if (totalBlocks > 0) {
        const cacheHitRatio = (blocksHit / totalBlocks * 100);
        if (cacheHitRatio < 90) {
          recommendations.push({
            type: 'cache_hit_ratio',
            priority: cacheHitRatio < 80 ? 'high' : 'medium',
            message: `数据库缓存命中率为${cacheHitRatio.toFixed(2)}%，建议高于90%`,
            action: '考虑增加shared_buffers配置或优化查询',
            currentValue: cacheHitRatio.toFixed(2) + '%'
          });
        }
      }
    }
    
    // 慢查询建议
    if (analysis.slowQueries && Array.isArray(analysis.slowQueries)) {
      const slowQueryThreshold = 1000; // ms
      const slowQueries = analysis.slowQueries.filter(q => q.mean_time > slowQueryThreshold);
      
      if (slowQueries.length > 0) {
        recommendations.push({
          type: 'slow_queries',
          priority: 'high',
          message: `发现${slowQueries.length}个慢查询，平均执行时间超过${slowQueryThreshold}ms`,
          action: '考虑添加索引或优化查询语句',
          queries: slowQueries.length
        });
      }
    } else if (analysis.slowQueries && !analysis.slowQueries.enabled) {
      recommendations.push({
        type: 'slow_query_logging',
        priority: 'low',
        message: 'pg_stat_statements扩展未安装',
        action: '建议安装pg_stat_statements扩展以获取慢查询统计'
      });
    }
    
    // 索引建议
    if (analysis.indexStats && Array.isArray(analysis.indexStats)) {
      const unusedIndexes = analysis.indexStats.filter(idx => idx.efficiency === 'unused');
      const lowEfficiencyIndexes = analysis.indexStats.filter(idx => idx.efficiency === 'low');
      
      if (unusedIndexes.length > 0) {
        recommendations.push({
          type: 'unused_indexes',
          priority: 'medium',
          message: `发现${unusedIndexes.length}个未使用的索引`,
          action: '考虑删除未使用的索引以节省存储空间',
          indexes: unusedIndexes.map(idx => idx.indexname || idx.name)
        });
      }
      
      if (lowEfficiencyIndexes.length > 0) {
        recommendations.push({
          type: 'inefficient_indexes',
          priority: 'medium',
          message: `发现${lowEfficiencyIndexes.length}个使用效率低的索引`,
          action: '考虑重新设计或删除这些索引',
          indexes: lowEfficiencyIndexes.map(idx => idx.indexname || idx.name)
        });
      }
      
      if (analysis.indexStats.length === 0) {
        recommendations.push({
          type: 'no_indexes',
          priority: 'low',
          message: '数据库中没有用户索引',
          action: '当创建表后，建议根据查询模式添加适当的索引'
        });
      }
    }
    
    // 表维护建议
    if (analysis.tableSizes && analysis.tableSizes.tables) {
      const tables = analysis.tableSizes.tables;
      
      // 检查死元组
      const tablesWithDeadRows = tables.filter(t => t.deadRows > 1000);
      if (tablesWithDeadRows.length > 0) {
        recommendations.push({
          type: 'dead_rows',
          priority: 'medium',
          message: `${tablesWithDeadRows.length}个表存在大量死元组`,
          action: '建议执行VACUUM操作清理死元组',
          tables: tablesWithDeadRows.map(t => t.table)
        });
      }
      
      // 检查大表
      const largeTables = tables.filter(t => t.rowCount > 100000);
      if (largeTables.length > 0) {
        recommendations.push({
          type: 'large_tables',
          priority: 'low',
          message: `发现${largeTables.length}个大表(超过10万行)`,
          action: '考虑对大表进行分区或归档历史数据',
          tables: largeTables.map(t => ({ name: t.table, rows: t.rowCount }))
        });
      }
      
      if (tables.length === 0) {
        recommendations.push({
          type: 'no_tables',
          priority: 'info',
          message: '数据库中没有用户表',
          action: '这是一个空数据库，性能分析功能将在创建表后提供更多有用信息'
        });
      }
    }
    
    // 连接池建议
    if (analysis.connectionStats && analysis.connectionStats.pool) {
      const pool = analysis.connectionStats.pool;
      if (pool.max > 0) {
        const utilizationRate = (pool.total / pool.max) * 100;
        
        if (utilizationRate > 80) {
          recommendations.push({
            type: 'connection_pool',
            priority: 'high',
            message: `连接池使用率达到${utilizationRate.toFixed(1)}%`,
            action: '考虑增加连接池大小或优化查询以减少连接使用',
            utilization: utilizationRate
          });
        }
        
        if (pool.waiting > 0) {
          recommendations.push({
            type: 'connection_waiting',
            priority: 'high',
            message: `${pool.waiting}个连接请求正在等待`,
            action: '立即增加连接池大小或检查是否存在连接泄漏',
            waiting: pool.waiting
          });
        }
      }
    }
    
    // 锁等待建议
    if (analysis.locks && analysis.locks.waiting > 0) {
      recommendations.push({
        type: 'lock_waiting',
        priority: 'high',
        message: `发现${analysis.locks.waiting}个锁等待`,
        action: '检查长时间运行的查询，优化事务管理',
        waiting: analysis.locks.waiting
      });
    }
    
    // 如果没有问题，添加积极反馈
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'healthy',
        priority: 'info',
        message: '数据库运行状态良好',
        action: '继续保持当前配置'
      });
    }
    
    return recommendations;
  }

  /**
   * 获取基本状态信息
   */
  async getBasicStats() {
    try {
      const query = `
        SELECT 
          datname as database,
          numbackends as current_connections,
          xact_commit as commits,
          xact_rollback as rollbacks,
          blks_read as blocks_read,
          blks_hit as blocks_hit
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      const result = await this.pool.query(query);
      
      if (result.rows.length > 0) {
        const stats = result.rows[0];
        return {
          database: stats.database,
          currentConnections: parseInt(stats.current_connections),
          commits: parseInt(stats.commits),
          rollbacks: parseInt(stats.rollbacks),
          blocksRead: parseInt(stats.blocks_read),
          blocksHit: parseInt(stats.blocks_hit),
          status: 'healthy'
        };
      }
      
      return { status: 'unknown', message: '无数据库统计信息' };
    } catch (error) {
      logger.error('[DATABASE] 获取基本状态失败:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * 获取索引优化建议
   */
  async getIndexSuggestions() {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs,
          null_frac,
          avg_width
        FROM pg_stats 
        WHERE schemaname = 'public'
          AND tablename IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
          )
        ORDER BY tablename, attname
      `;
      
      const result = await this.pool.query(query);
      const suggestions = [];
      
      result.rows.forEach(row => {
        const distinctValues = parseFloat(row.n_distinct);
        const correlation = parseFloat(row.correlation || 0);
        const nullFrac = parseFloat(row.null_frac || 0);
        
        // 建议创建索引的条件
        let reason = [];
        
        if (distinctValues > 100 && correlation > 0.5) {
          reason.push('高选择性字段');
        }
        
        if (correlation < -0.5 || correlation > 0.8) {
          reason.push('字段有良好的排序性');
        }
        
        if (nullFrac < 0.1) {
          reason.push('非空字段');
        }
        
        if (row.most_common_freqs) {
          const maxFreq = Math.max(...JSON.parse(row.most_common_freqs));
          if (maxFreq < 0.8) {
            reason.push('数据分布较为均匀');
          }
        }
        
        if (reason.length > 0) {
          suggestions.push({
            table: row.tablename,
            column: row.attname,
            reason: reason.join(', '),
            estimatedBenefit: distinctValues > 1000 ? 'high' : 
                             distinctValues > 100 ? 'medium' : 'low',
            priority: correlation > 0.7 ? 'high' : 'medium'
          });
        }
      });
      
      return {
        timestamp: new Date().toISOString(),
        suggestions,
        total: suggestions.length
      };
    } catch (error) {
      logger.error('[DATABASE] 获取索引建议失败:', error);
      throw error;
    }
  }

  /**
   * 执行数据库清理
   */
  async vacuumDatabase() {
    const client = await this.pool.connect();
    
    try {
      logger.info('[DATABASE] 开始执行VACUUM...');
      
      // 获取所有表
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      const results = [];
      
      for (const table of tablesResult.rows) {
        try {
          const result = await client.query(`VACUUM ANALYZE ${table.tablename}`);
          results.push({
            table: table.tablename,
            status: 'success',
            result: result.command
          });
        } catch (tableError) {
          results.push({
            table: table.tablename,
            status: 'error',
            error: tableError.message
          });
        }
      }
      
      logger.info('[DATABASE] VACUUM完成');
      
      return {
        timestamp: new Date().toISOString(),
        operation: 'VACUUM ANALYZE',
        tables: results,
        success: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      logger.error('[DATABASE] VACUUM失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 重新创建索引
   */
  async reindexDatabase() {
    const client = await this.pool.connect();
    
    try {
      logger.info('[DATABASE] 开始执行REINDEX...');
      
      // 重新索引当前数据库
      const result = await client.query(`REINDEX DATABASE ${client.database}`);
      
      logger.info('[DATABASE] REINDEX完成');
      
      return {
        timestamp: new Date().toISOString(),
        operation: 'REINDEX DATABASE',
        database: client.database,
        status: 'success',
        result: result.command
      };
    } catch (error) {
      logger.error('[DATABASE] REINDEX失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新表统计信息
   */
  async updateStatistics() {
    const client = await this.pool.connect();
    
    try {
      logger.info('[DATABASE] 开始更新统计信息...');
      
      // 获取所有表
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      const results = [];
      
      for (const table of tablesResult.rows) {
        try {
          const result = await client.query(`ANALYZE ${table.tablename}`);
          results.push({
            table: table.tablename,
            status: 'success',
            result: result.command
          });
        } catch (tableError) {
          results.push({
            table: table.tablename,
            status: 'error',
            error: tableError.message
          });
        }
      }
      
      logger.info('[DATABASE] 统计信息更新完成');
      
      return {
        timestamp: new Date().toISOString(),
        operation: 'ANALYZE',
        tables: results,
        success: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      logger.error('[DATABASE] 更新统计信息失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 启用慢查询日志收集
   */
  async enableSlowQueryLog() {
    try {
      // 检查pg_stat_statements是否已安装
      const checkResult = await this.pool.query(`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) as installed
      `);
      
      if (!checkResult.rows[0].installed) {
        logger.warn('[DATABASE] pg_stat_statements扩展未安装，慢查询统计不可用');
        return false;
      }
      
      // 启用慢查询收集
      await this.pool.query(`
        ALTER SYSTEM SET pg_stat_statements.track = 'all'
      `);
      
      logger.info('[DATABASE] 慢查询日志收集已启用');
      return true;
    } catch (error) {
      logger.error('[DATABASE] 启用慢查询日志失败:', error);
      return false;
    }
  }

  /**
   * 获取索引信息
   */
  async getIndexInfo() {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          pg_size_pretty(pg_relation_size(indexrelid)) as size,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        JOIN pg_indexes USING (schemaname, tablename, indexname)
        ORDER BY pg_relation_size(indexrelid) DESC
      `;
      
      const result = await this.pool.query(query);
      
      const indexes = result.rows.map(row => ({
        schema: row.schemaname,
        table: row.tablename,
        name: row.indexname,
        definition: row.indexdef,
        size: row.size,
        scans: parseInt(row.scans),
        tuplesRead: parseInt(row.tuples_read),
        tuplesFetched: parseInt(row.tuples_fetched),
        efficiency: this.calculateIndexEfficiency(row)
      }));
      
      return {
        timestamp: new Date().toISOString(),
        indexes,
        total: indexes.length
      };
    } catch (error) {
      logger.error('[DATABASE] 获取索引信息失败:', error);
      throw error;
    }
  }

  /**
   * 计算索引效率
   */
  calculateIndexEfficiency(row) {
    const scans = parseInt(row.scans);
    const read = parseInt(row.tuples_read);
    const fetch = parseInt(row.tuples_fetched);
    
    if (scans === 0) return 'unused';
    if (read > fetch * 2) return 'inefficient';
    if (fetch > read * 0.8) return 'efficient';
    return 'moderate';
  }

  /**
   * 优化指定表的索引
   */
  async optimizeIndex(tableName, indexType = 'all') {
    try {
      logger.info(`[DATABASE] 开始优化表 ${tableName} 的索引...`);
      
      let result;
      
      switch (indexType) {
        case 'reindex':
          result = await this.pool.query(`REINDEX TABLE ${tableName}`);
          break;
        case 'analyze':
          result = await this.pool.query(`ANALYZE ${tableName}`);
          break;
        case 'vacuum':
          result = await this.pool.query(`VACUUM ANALYZE ${tableName}`);
          break;
        default:
          // 执行完整的索引优化
          const reindexResult = await this.pool.query(`REINDEX TABLE ${tableName}`);
          const analyzeResult = await this.pool.query(`ANALYZE ${tableName}`);
          result = { command: 'OPTIMIZE', reindex: reindexResult.command, analyze: analyzeResult.command };
      }
      
      logger.info(`[DATABASE] 表 ${tableName} 索引优化完成`);
      
      return {
        table: tableName,
        indexType,
        status: 'success',
        result: result.command,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[DATABASE] 表 ${tableName} 索引优化失败:`, error);
      throw error;
    }
  }

  /**
   * 优化所有索引
   */
  async optimizeAllIndexes() {
    try {
      logger.info('[DATABASE] 开始优化所有索引...');
      
      // 获取所有用户表
      const tablesResult = await this.pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      const results = [];
      
      for (const table of tablesResult.rows) {
        try {
          const result = await this.optimizeIndex(table.tablename);
          results.push(result);
        } catch (error) {
          results.push({
            table: table.tablename,
            indexType: 'all',
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      logger.info('[DATABASE] 所有索引优化完成');
      
      return {
        timestamp: new Date().toISOString(),
        operation: 'OPTIMIZE ALL INDEXES',
        tables: results,
        success: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      };
    } catch (error) {
      logger.error('[DATABASE] 优化所有索引失败:', error);
      throw error;
    }
  }

  /**
   * 获取慢查询统计
   */
  async getSlowQueryStats(limit = 10) {
    try {
      const slowQueries = await this.getSlowQueries();
      
      if (Array.isArray(slowQueries)) {
        return {
          enabled: true,
          queries: slowQueries.slice(0, limit),
          total: slowQueries.length,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          enabled: false,
          message: slowQueries.message || '慢查询统计不可用',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      logger.error('[DATABASE] 获取慢查询统计失败:', error);
      return {
        enabled: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行VACUUM操作
   */
  async performVacuum(target = 'database') {
    if (target === 'database') {
      return await this.vacuumDatabase();
    } else {
      return await this.optimizeIndex(target, 'vacuum');
    }
  }

  /**
   * 执行REINDEX操作
   */
  async performReindex(target = 'database') {
    if (target === 'database') {
      return await this.reindexDatabase();
    } else {
      return await this.optimizeIndex(target, 'reindex');
    }
  }

  /**
   * 执行ANALYZE操作
   */
  async performAnalyze(target = 'database') {
    if (target === 'database') {
      return await this.updateStatistics();
    } else {
      return await this.optimizeIndex(target, 'analyze');
    }
  }
}

// 创建并导出单例
const databaseOptimizer = new DatabaseOptimizer();
module.exports = databaseOptimizer;