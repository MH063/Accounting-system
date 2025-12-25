/**
 * 趋势分析路由模块
 * 提供趋势分析相关的API接口
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

/**
 * 获取趋势分析数据
 * GET /api/trend/analysis
 */
router.get('/analysis', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, type = 'expense', comparisonType = 'yoy' } = req.query;
    
    // 验证类型参数
    if (!['expense', 'income', 'balance'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的分析类型，必须是 expense、income 或 balance'
      });
    }
    
    // 验证对比类型参数
    if (!['yoy', 'qoq', 'none'].includes(comparisonType)) {
      return res.status(400).json({
        success: false,
        message: '无效的对比类型，必须是 yoy、qoq 或 none'
      });
    }
    
    // 构建查询条件
    let whereConditions = '';
    let params = [];
    let paramIndex = 1;
    
    if (startDate) {
      whereConditions += ` WHERE e.expense_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    } else {
      // 默认查询最近6个月的数据
      whereConditions += ` WHERE e.expense_date >= NOW() - INTERVAL '6 months'`;
    }
    
    if (endDate) {
      whereConditions += whereConditions.includes('WHERE') ? ` AND e.expense_date <= $${paramIndex}` : ` WHERE e.expense_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    } else {
      // 默认查询到当前日期
      whereConditions += whereConditions.includes('WHERE') ? ` AND e.expense_date <= CURRENT_DATE` : ` WHERE e.expense_date <= CURRENT_DATE`;
    }
    
    // 1. 趋势数据（按月）
    const trendSql = `
      SELECT 
        TO_CHAR(e.expense_date, 'YYYY-MM') as date,
        SUM(e.amount) as value
      FROM expenses e
      ${whereConditions}
      GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')
      ORDER BY date ASC
    `;
    
    const trendResult = await query(trendSql, params);
    const trendData = trendResult.rows.map(row => ({
      date: row.date,
      value: parseFloat(row.value || 0)
    }));
    
    // 2. 对比数据
    let comparisonData = [];
    if (comparisonType !== 'none') {
      // 构建对比查询
      const comparisonSql = `
        WITH current_period AS (
          SELECT 
            TO_CHAR(e.expense_date, 'YYYY-MM') as period,
            SUM(e.amount) as current
          FROM expenses e
          ${whereConditions}
          GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')
        ),
        comparison_period AS (
          SELECT 
            TO_CHAR(e.expense_date, 'YYYY-MM') as period,
            SUM(e.amount) as comparison
          FROM expenses e
          WHERE 
            e.expense_date >= ${comparisonType === 'yoy' ? 
              `DATE_TRUNC('month', CURRENT_DATE - INTERVAL '13 months')` : 
              `DATE_TRUNC('month', CURRENT_DATE - INTERVAL '4 months')`}
            AND e.expense_date < ${comparisonType === 'yoy' ? 
              `DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')` : 
              `DATE_TRUNC('month', CURRENT_DATE)`}
          GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')
        )
        SELECT 
          cp.period,
          cp.current,
          COALESCE(cmp.comparison, 0) as comparison,
          CASE 
            WHEN COALESCE(cmp.comparison, 0) = 0 THEN 0
            ELSE ((cp.current - cmp.comparison) / cmp.comparison * 100)::decimal(10,2)
          END as change
        FROM current_period cp
        LEFT JOIN comparison_period cmp ON cp.period = 
          ${comparisonType === 'yoy' ? `TO_CHAR(TO_DATE(cmp.period, 'YYYY-MM') + INTERVAL '12 months', 'YYYY-MM')` : `TO_CHAR(TO_DATE(cmp.period, 'YYYY-MM') + INTERVAL '1 months', 'YYYY-MM')`}
        ORDER BY cp.period ASC
      `;
      
      const comparisonResult = await query(comparisonSql, params);
      comparisonData = comparisonResult.rows.map(row => ({
        period: row.period,
        current: parseFloat(row.current || 0),
        comparison: parseFloat(row.comparison || 0),
        change: parseFloat(row.change || 0)
      }));
    }
    
    // 3. 异常检测（简单实现：找出超出平均值2倍标准差的数据点）
    const anomalies = [];
    if (trendData.length > 2) {
      const values = trendData.map(item => item[type === 'expense' ? 'expense' : type === 'income' ? 'income' : 'balance']);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const threshold = 2 * stdDev;
      
      trendData.forEach(item => {
        const value = item[type === 'expense' ? 'expense' : type === 'income' ? 'income' : 'balance'];
        const deviation = Math.abs(value - mean) / stdDev;
        if (deviation > threshold) {
          anomalies.push({
            date: item.date,
            value: value,
            deviation: parseFloat(deviation.toFixed(2)),
            reason: '超出正常范围'
          });
        }
      });
    }
    
    // 4. 趋势预测（简单实现：线性回归）
    const prediction = [];
    if (trendData.length > 2) {
      // 线性回归计算
      const n = trendData.length;
      const dates = trendData.map((item, index) => index + 1);
      const values = trendData.map(item => item[type === 'expense' ? 'expense' : type === 'income' ? 'income' : 'balance']);
      
      const sumX = dates.reduce((sum, x) => sum + x, 0);
      const sumY = values.reduce((sum, y) => sum + y, 0);
      const sumXY = dates.reduce((sum, x, i) => sum + x * values[i], 0);
      const sumXX = dates.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // 预测未来3个月
      const lastDate = new Date(`${trendData[trendData.length - 1].date}-01`);
      for (let i = 1; i <= 3; i++) {
        const nextMonth = new Date(lastDate);
        nextMonth.setMonth(nextMonth.getMonth() + i);
        const nextMonthStr = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const predictedValue = slope * (n + i) + intercept;
        prediction.push({
          date: nextMonthStr,
          value: parseFloat(Math.max(0, predictedValue).toFixed(2)),
          confidence: 85 - (i * 5) // 随时间递减的置信度
        });
      }
    }
    
    // 构建响应数据
    const responseData = {
      trendData: trendData,
      comparisonData: comparisonData,
      anomalies: anomalies,
      prediction: prediction
    };
    
    return res.json({
      success: true,
      message: '获取趋势分析数据成功',
      data: responseData
    });
  } catch (error) {
    console.error('获取趋势分析数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势分析数据失败',
      error: error.message
    });
  }
});

/**
 * 获取预测数据
 * GET /api/trend/prediction
 */
router.get('/prediction', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 获取最近的趋势数据用于预测
    const trendSql = `
      SELECT 
        TO_CHAR(e.expense_date, 'YYYY-MM-DD') as date,
        SUM(e.amount) as value
      FROM expenses e
      WHERE e.expense_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;
    
    const trendResult = await query(trendSql);
    const trendData = trendResult.rows.map(row => ({
      date: row.date,
      value: parseFloat(row.value || 0)
    }));
    
    // 趋势预测（简单实现：线性回归）
    const prediction = [];
    if (trendData.length > 2) {
      // 线性回归计算
      const n = trendData.length;
      const dates = trendData.map((item, index) => index + 1);
      const values = trendData.map(item => item.value);
      
      const sumX = dates.reduce((sum, x) => sum + x, 0);
      const sumY = values.reduce((sum, y) => sum + y, 0);
      const sumXY = dates.reduce((sum, x, i) => sum + x * values[i], 0);
      const sumXX = dates.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // 预测指定天数
      const lastDate = new Date(trendData[trendData.length - 1].date);
      for (let i = 1; i <= parseInt(days); i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + i);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        const predictedValue = Math.max(0, slope * (n + i) + intercept);
        prediction.push({
          date: nextDateStr,
          value: parseFloat(predictedValue.toFixed(2)),
          confidence: Math.max(50, 95 - (i * 2)) // 随时间递减的置信度，最低50%
        });
      }
    }
    
    return res.json({
      success: true,
      message: '获取预测数据成功',
      data: prediction
    });
  } catch (error) {
    console.error('获取预测数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预测数据失败',
      error: error.message
    });
  }
});

module.exports = router;
