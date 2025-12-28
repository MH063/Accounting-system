/**
 * 数据处理作业
 * 处理各种数据分析和转换任务
 */

const logger = require('../config/logger');
const { pool } = require('../config/database');

// 延后加载 messageQueue 以避免循环依赖
const getDataQueue = () => {
  const { getQueue, QUEUES } = require('../config/messageQueue');
  return getQueue(QUEUES.DATA_PROCESSING);
};

/**
 * 数据处理作业处理器
 */
class DataProcessingJobProcessor {
  /**
   * 数据分析作业
   */
  static async dataAnalysis(job) {
    const { data } = job;
    const { analysisType, parameters, jobId: customJobId } = data;
    
    try {
      logger.info('开始数据处理作业', {
        jobId: job.id,
        customJobId: customJobId,
        analysisType: analysisType
      });
      
      let results = {};
      
      switch (analysisType) {
        case 'financial_summary':
          results = await this.financialDataAnalysis(parameters);
          break;
          
        case 'transaction_patterns':
          results = await this.transactionPatternAnalysis(parameters);
          break;
          
        case 'expense_trends':
          results = await this.expenseTrendAnalysis(parameters);
          break;
          
        case 'revenue_forecast':
          results = await this.revenueForecastAnalysis(parameters);
          break;
          
        default:
          throw new Error(`不支持的分析类型: ${analysisType}`);
      }
      
      logger.info('数据处理作业完成', {
        jobId: job.id,
        customJobId: customJobId,
        analysisType: analysisType,
        resultKeys: Object.keys(results)
      });
      
      return {
        success: true,
        analysisType,
        results,
        jobId: job.id,
        processedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('数据处理作业失败', {
        jobId: job.id,
        customJobId: customJobId,
        analysisType: analysisType,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * 数据导入作业
   */
  static async dataImport(job) {
    const { data } = job;
    const { importType, fileData, parameters } = data;
    
    try {
      logger.info('开始数据导入作业', {
        jobId: job.id,
        importType: importType,
        recordCount: fileData.length
      });
      
      let results = {};
      
      switch (importType) {
        case 'transactions':
          results = await this.importTransactions(fileData, parameters);
          break;
          
        case 'accounts':
          results = await this.importAccounts(fileData, parameters);
          break;
          
        case 'budgets':
          results = await this.importBudgets(fileData, parameters);
          break;
          
        default:
          throw new Error(`不支持的导入类型: ${importType}`);
      }
      
      logger.info('数据导入作业完成', {
        jobId: job.id,
        importType: importType,
        imported: results.imported,
        errors: results.errors.length
      });
      
      return {
        success: true,
        importType,
        results,
        jobId: job.id
      };
      
    } catch (error) {
      logger.error('数据导入作业失败', {
        jobId: job.id,
        importType: importType,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * 数据导出作业
   */
  static async dataExport(job) {
    const { data } = job;
    const { exportType, format, parameters } = data;
    
    try {
      logger.info('开始数据导出作业', {
        jobId: job.id,
        exportType: exportType,
        format: format
      });
      
      let results = {};
      
      switch (exportType) {
        case 'transactions':
          results = await this.exportTransactions(format, parameters);
          break;
          
        case 'financial_reports':
          results = await this.exportFinancialReports(format, parameters);
          break;
          
        case 'audit_log':
          results = await this.exportAuditLog(format, parameters);
          break;
          
        default:
          throw new Error(`不支持的导出类型: ${exportType}`);
      }
      
      logger.info('数据导出作业完成', {
        jobId: job.id,
        exportType: exportType,
        format: format,
        fileSize: results.fileSize
      });
      
      return {
        success: true,
        exportType,
        format,
        results,
        jobId: job.id
      };
      
    } catch (error) {
      logger.error('数据导出作业失败', {
        jobId: job.id,
        exportType: exportType,
        error: error.message
      });
      
      throw error;
    }
  }
  
  // === 具体的分析方法 ===
  
  /**
   * 财务数据分析
   */
  static async financialDataAnalysis(parameters) {
    const { startDate, endDate } = parameters;
    
    const query = `
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        category,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE transaction_date BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('month', transaction_date), category
      ORDER BY month, category
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    // 计算月度汇总
    const monthlySummary = {};
    result.rows.forEach(row => {
      const month = row.month.toISOString().substring(0, 7);
      if (!monthlySummary[month]) {
        monthlySummary[month] = {
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          transactionCount: 0
        };
      }
      
      monthlySummary[month].totalIncome += parseFloat(row.total_income);
      monthlySummary[month].totalExpense += parseFloat(row.total_expense);
      monthlySummary[month].transactionCount += parseInt(row.transaction_count);
      monthlySummary[month].netIncome = monthlySummary[month].totalIncome - monthlySummary[month].totalExpense;
    });
    
    return {
      monthlySummary,
      detailedData: result.rows,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * 交易模式分析
   */
  static async transactionPatternAnalysis(parameters) {
    const { accountId, timeRange } = parameters;
    
    const query = `
      SELECT 
        EXTRACT(hour FROM transaction_date) as hour_of_day,
        EXTRACT(dow FROM transaction_date) as day_of_week,
        category,
        AVG(ABS(amount)) as avg_amount,
        COUNT(*) as frequency
      FROM transactions 
      WHERE account_id = $1 
        AND transaction_date >= NOW() - INTERVAL '${timeRange}'
      GROUP BY EXTRACT(hour FROM transaction_date), EXTRACT(dow FROM transaction_date), category
      ORDER BY frequency DESC
    `;
    
    const result = await pool.query(query, [accountId]);
    
    // 分析最活跃的时间段
    const timePatterns = {
      peakHours: {},
      peakDays: {},
      commonCategories: {}
    };
    
    result.rows.forEach(row => {
      // 峰值时段分析
      const hour = row.hour_of_day;
      const day = row.day_of_week;
      const category = row.category;
      
      if (!timePatterns.peakHours[hour]) {
        timePatterns.peakHours[hour] = 0;
      }
      timePatterns.peakHours[hour] += parseInt(row.frequency);
      
      if (!timePatterns.peakDays[day]) {
        timePatterns.peakDays[day] = 0;
      }
      timePatterns.peakDays[day] += parseInt(row.frequency);
      
      if (!timePatterns.commonCategories[category]) {
        timePatterns.commonCategories[category] = 0;
      }
      timePatterns.commonCategories[category] += parseInt(row.frequency);
    });
    
    return {
      timePatterns,
      rawData: result.rows,
      analysisRange: timeRange,
      accountId
    };
  }
  
  /**
   * 费用趋势分析
   */
  static async expenseTrendAnalysis(parameters) {
    const { categories, periods } = parameters;
    
    const trendData = {};
    
    for (const category of categories) {
      trendData[category] = {};
      
      for (const period of periods) {
        const query = `
          SELECT 
            DATE_TRUNC('${period}', transaction_date) as period,
            SUM(ABS(amount)) as total_expense,
            COUNT(*) as transaction_count,
            AVG(ABS(amount)) as avg_expense
          FROM transactions 
          WHERE category = $1 
            AND amount < 0
            AND transaction_date >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('${period}', transaction_date)
          ORDER BY period
        `;
        
        const result = await pool.query(query, [category]);
        trendData[category][period] = result.rows.map(row => ({
          period: row.period.toISOString(),
          totalExpense: parseFloat(row.total_expense),
          transactionCount: parseInt(row.transaction_count),
          avgExpense: parseFloat(row.avg_expense)
        }));
      }
    }
    
    return {
      trendData,
      categories,
      periods,
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * 收入预测分析
   */
  static async revenueForecastAnalysis(parameters) {
    const { historicalMonths = 12, forecastMonths = 6 } = parameters;
    
    // 获取历史收入数据
    const query = `
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        SUM(amount) as monthly_revenue
      FROM transactions 
      WHERE amount > 0
        AND transaction_date >= NOW() - INTERVAL '${historicalMonths} months'
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month
    `;
    
    const result = await pool.query(query);
    
    // 简单的线性回归预测（实际项目中可以使用更复杂的预测模型）
    const historicalData = result.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.monthly_revenue)
    }));
    
    // 计算趋势
    const revenues = historicalData.map(d => d.revenue);
    const avgRevenue = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    
    // 计算增长率
    let growthRate = 0;
    if (revenues.length > 1) {
      const firstHalf = revenues.slice(0, Math.floor(revenues.length / 2));
      const secondHalf = revenues.slice(Math.floor(revenues.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, rev) => sum + rev, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, rev) => sum + rev, 0) / secondHalf.length;
      
      growthRate = (secondAvg - firstAvg) / firstAvg;
    }
    
    // 生成预测数据
    const forecasts = [];
    const lastMonth = new Date(historicalData[historicalData.length - 1].month);
    
    for (let i = 1; i <= forecastMonths; i++) {
      const forecastMonth = new Date(lastMonth);
      forecastMonth.setMonth(forecastMonth.getMonth() + i);
      
      const projectedRevenue = avgRevenue * Math.pow(1 + growthRate, i);
      const confidence = Math.max(0.1, 1 - (i * 0.15)); // 置信度递减
      
      forecasts.push({
        month: forecastMonth.toISOString(),
        predictedRevenue: Math.round(projectedRevenue * 100) / 100,
        confidence: Math.round(confidence * 100) / 100
      });
    }
    
    return {
      historicalData,
      forecasts,
      analysis: {
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        growthRate: Math.round(growthRate * 10000) / 100, // 百分比
        trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
      },
      parameters: { historicalMonths, forecastMonths }
    };
  }
  
  // === 导入导出方法 ===
  
  /**
   * 导入交易数据
   */
  static async importTransactions(fileData, parameters) {
    let imported = 0;
    const errors = [];
    
    for (let i = 0; i < fileData.length; i++) {
      try {
        const transaction = fileData[i];
        
        // 验证必要字段
        if (!transaction.account_id || !transaction.amount || !transaction.transaction_date) {
          errors.push({
            row: i + 1,
            error: '缺少必要字段',
            data: transaction
          });
          continue;
        }
        
        // 插入数据库
        const query = `
          INSERT INTO transactions (account_id, amount, description, category, transaction_date, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `;
        
        await pool.query(query, [
          transaction.account_id,
          transaction.amount,
          transaction.description || '',
          transaction.category || 'uncategorized',
          transaction.transaction_date
        ]);
        
        imported++;
        
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: fileData[i]
        });
      }
    }
    
    return { imported, errors };
  }
  
  /**
   * 导入账户数据
   */
  static async importAccounts(fileData, parameters) {
    let imported = 0;
    const errors = [];
    
    for (let i = 0; i < fileData.length; i++) {
      try {
        const account = fileData[i];
        
        if (!account.name || !account.type) {
          errors.push({
            row: i + 1,
            error: '缺少必要字段',
            data: account
          });
          continue;
        }
        
        const query = `
          INSERT INTO accounts (name, type, description, balance, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `;
        
        await pool.query(query, [
          account.name,
          account.type,
          account.description || '',
          account.balance || 0,
          account.is_active !== false
        ]);
        
        imported++;
        
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: fileData[i]
        });
      }
    }
    
    return { imported, errors };
  }
  
  /**
   * 导入预算数据
   */
  static async importBudgets(fileData, parameters) {
    let imported = 0;
    const errors = [];
    
    for (let i = 0; i < fileData.length; i++) {
      try {
        const budget = fileData[i];
        
        if (!budget.category || !budget.amount || !budget.period) {
          errors.push({
            row: i + 1,
            error: '缺少必要字段',
            data: budget
          });
          continue;
        }
        
        const query = `
          INSERT INTO budgets (category, amount, period, description, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `;
        
        await pool.query(query, [
          budget.category,
          budget.amount,
          budget.period,
          budget.description || '',
          budget.is_active !== false
        ]);
        
        imported++;
        
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: fileData[i]
        });
      }
    }
    
    return { imported, errors };
  }
  
  /**
   * 导出交易数据
   */
  static async exportTransactions(format, parameters) {
    const { startDate, endDate, category, accountId } = parameters;
    
    let query = `
      SELECT t.*, a.name as account_name, a.type as account_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND t.transaction_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND t.transaction_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (accountId) {
      query += ` AND t.account_id = $${paramIndex}`;
      params.push(accountId);
      paramIndex++;
    }
    
    query += ` ORDER BY t.transaction_date DESC`;
    
    const result = await pool.query(query, params);
    
    // 生成导出数据
    const exportData = result.rows.map(row => ({
      id: row.id,
      account: row.account_name,
      accountType: row.account_type,
      amount: parseFloat(row.amount),
      description: row.description,
      category: row.category,
      date: row.transaction_date.toISOString(),
      createdAt: row.created_at.toISOString()
    }));
    
    return {
      data: exportData,
      recordCount: exportData.length,
      format,
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * 导出财务报表
   */
  static async exportFinancialReports(format, parameters) {
    // 这里可以实现复杂的报表生成逻辑
    // 目前返回基础数据
    return {
      message: '财务报表导出功能待实现',
      format,
      parameters
    };
  }
  
  /**
   * 导出审计日志
   */
  static async exportAuditLog(format, parameters) {
    return {
      message: '审计日志导出功能待实现',
      format,
      parameters
    };
  }
}

/**
 * 注册数据处理队列处理器
 */
function registerDataProcessingProcessors() {
  try {
    const dataQueue = getDataQueue();
    
    // 数据分析处理器
    dataQueue.process('dataAnalysis', 3, async (job) => {
      return await DataProcessingJobProcessor.dataAnalysis(job);
    });
    
    // 数据导入处理器
    dataQueue.process('dataImport', 2, async (job) => {
      return await DataProcessingJobProcessor.dataImport(job);
    });
    
    // 数据导出处理器
    dataQueue.process('dataExport', 2, async (job) => {
      return await DataProcessingJobProcessor.dataExport(job);
    });
    
    logger.info('数据处理队列处理器注册成功');
    
  } catch (error) {
    logger.error('数据处理队列处理器注册失败', { error: error.message });
    throw error;
  }
}

module.exports = {
  DataProcessingJobProcessor,
  registerDataProcessingProcessors
};