/**
 * 预算管理路由模块
 * 提供预算相关的API接口
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

/**
 * 获取预算列表
 * GET /api/budget
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, size = 10, category } = req.query;
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const offset = (pageNum - 1) * pageSize;
    
    // 构建查询条件
    let whereConditions = '';
    let params = [];
    let paramIndex = 1;
    
    if (category) {
      whereConditions += ` WHERE bc.name ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    // 获取预算列表
    const budgetListSql = `
      SELECT 
        b.id,
        b.name,
        COALESCE(bc.name, '') as category,
        b.budget_amount as amount,
        b.used_amount as used,
        (b.budget_amount - b.used_amount) as remaining,
        (b.used_amount / NULLIF(b.budget_amount, 0)) * 100 as utilization,
        b.budget_type as period,
        b.budget_period_start as startDate,
        b.budget_period_end as endDate,
        b.description as remark,
        b.status
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ${whereConditions}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(pageSize, offset);
    const budgetListResult = await query(budgetListSql, params);
    
    // 获取总记录数
    const countSql = `
      SELECT COUNT(*) as total
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ${whereConditions}
    `;
    
    const countResult = await query(countSql, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    
    // 构建响应数据
    const records = budgetListResult.rows.map(budget => ({
      id: budget.id,
      name: budget.name,
      category: budget.category,
      amount: parseFloat(budget.amount || 0),
      used: parseFloat(budget.used || 0),
      remaining: parseFloat(budget.remaining || 0),
      utilization: parseFloat(budget.utilization || 0),
      period: budget.period,
      startDate: budget.startdate.toISOString().split('T')[0],
      endDate: budget.enddate.toISOString().split('T')[0],
      remark: budget.remark,
      status: budget.status
    }));
    
    return res.json({
      success: true,
      message: '获取预算列表成功',
      data: {
        records,
        total,
        page: pageNum,
        size: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取预算列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算列表失败',
      error: error.message
    });
  }
});

/**
 * 创建预算
 * POST /api/budget
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    let { name, category, amount, period, startDate, endDate, remark } = req.body;
    
    // 确保period为大写格式，符合数据库约束
    if (period) {
      period = period.toUpperCase();
    }
    
    // 1. 获取或创建预算类别
    let categoryId = null;
    const getCategorySql = `SELECT id FROM budget_categories WHERE name ILIKE $1`;
    const categoryResult = await query(getCategorySql, [category]);
    
    if (categoryResult.rows.length > 0) {
      categoryId = categoryResult.rows[0].id;
    } else {
      // 创建新的预算类别
      const createCategorySql = `INSERT INTO budget_categories (name, created_by) VALUES ($1, $2) RETURNING id`;
      const newCategoryResult = await query(createCategorySql, [category, req.user.userId]);
      categoryId = newCategoryResult.rows[0].id;
    }
    
    // 2. 创建预算
    const createBudgetSql = `
      INSERT INTO budgets (
        name, 
        category_id, 
        budget_amount, 
        used_amount, 
        budget_type, 
        budget_period_start, 
        budget_period_end, 
        description, 
        status,
        created_by
      ) VALUES (
        $1, $2, $3, 0, $4, $5, $6, $7, 'active', $8
      ) RETURNING id
    `;
    
    const params = [name, categoryId, amount, period, startDate, endDate, remark, req.user.userId];
    const budgetResult = await query(createBudgetSql, params);
    
    return res.json({
      success: true,
      message: '创建预算成功',
      data: {
        id: budgetResult.rows[0].id,
        name,
        category,
        amount,
        used: 0,
        remaining: amount,
        utilization: 0,
        period,
        startDate,
        endDate,
        remark,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('创建预算失败:', error);
    res.status(500).json({
      success: false,
      message: '创建预算失败',
      error: error.message
    });
  }
});

/**
 * 更新预算
 * PUT /api/budget/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let { name, category, amount, period, startDate, endDate, remark } = req.body;
    
    // 确保period为大写格式，符合数据库约束
    if (period) {
      period = period.toUpperCase();
    }
    
    // 1. 获取或创建预算类别
    let categoryId = null;
    const getCategorySql = `SELECT id FROM budget_categories WHERE name ILIKE $1`;
    const categoryResult = await query(getCategorySql, [category]);
    
    if (categoryResult.rows.length > 0) {
      categoryId = categoryResult.rows[0].id;
    } else {
      // 创建新的预算类别
      const createCategorySql = `INSERT INTO budget_categories (name, created_by) VALUES ($1, $2) RETURNING id`;
      const newCategoryResult = await query(createCategorySql, [category, req.user.userId]);
      categoryId = newCategoryResult.rows[0].id;
    }
    
    // 2. 更新预算
    const updateBudgetSql = `
      UPDATE budgets SET 
        name = $1, 
        category_id = $2, 
        budget_amount = $3, 
        budget_type = $4, 
        budget_period_start = $5, 
        budget_period_end = $6, 
        description = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING budget_amount, used_amount
    `;
    
    const params = [name, categoryId, amount, period, startDate, endDate, remark, id];
    const updateResult = await query(updateBudgetSql, params);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }
    
    // 计算更新后的remaining和utilization
    const updatedBudget = updateResult.rows[0];
    const remaining = parseFloat(updatedBudget.budget_amount) - parseFloat(updatedBudget.used_amount);
    const utilization = parseFloat(updatedBudget.used_amount) / parseFloat(updatedBudget.budget_amount) * 100;
    
    return res.json({
      success: true,
      message: '更新预算成功',
      data: {
        id,
        name,
        category,
        amount,
        used: parseFloat(updatedBudget.used_amount || 0),
        remaining,
        utilization,
        period,
        startDate,
        endDate,
        remark
      }
    });
  } catch (error) {
    console.error('更新预算失败:', error);
    res.status(500).json({
      success: false,
      message: '更新预算失败',
      error: error.message
    });
  }
});

/**
 * 删除预算
 * DELETE /api/budget/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 删除预算
    const deleteBudgetSql = `
      DELETE FROM budgets WHERE id = $1
      RETURNING id
    `;
    
    const deleteResult = await query(deleteBudgetSql, [id]);
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }
    
    return res.json({
      success: true,
      message: '删除预算成功',
      data: {
        id: parseInt(id)
      }
    });
  } catch (error) {
    console.error('删除预算失败:', error);
    res.status(500).json({
      success: false,
      message: '删除预算失败',
      error: error.message
    });
  }
});

/**
 * 获取预算历史数据
 * GET /api/budget/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { period = '3m' } = req.query;
    
    // 根据period计算时间范围
    let monthsToSubtract = 3;
    if (period === '6m') {
      monthsToSubtract = 6;
    } else if (period === '12m') {
      monthsToSubtract = 12;
    }
    
    // 获取预算历史数据
    const historySql = `
      WITH RECURSIVE months AS (
        SELECT CURRENT_DATE - INTERVAL '1 month' * ($1 - 1) AS month
        UNION ALL
        SELECT month + INTERVAL '1 month' FROM months WHERE month < CURRENT_DATE
      )
      SELECT 
        TO_CHAR(m.month, 'YYYY-MM') as month,
        COALESCE(SUM(b.budget_amount), 0) as budgetAmount,
        COALESCE(SUM(b.used_amount), 0) as expenseAmount
      FROM months m
      LEFT JOIN budgets b ON 
        TO_CHAR(b.created_at, 'YYYY-MM') = TO_CHAR(m.month, 'YYYY-MM')
      GROUP BY TO_CHAR(m.month, 'YYYY-MM')
      ORDER BY month ASC
    `;
    
    const historyResult = await query(historySql, [monthsToSubtract]);
    
    // 构建响应数据
    const months = historyResult.rows.map(row => row.month);
    const budgetData = historyResult.rows.map(row => parseFloat(row.budgetamount || 0));
    const expenseData = historyResult.rows.map(row => parseFloat(row.expenseamount || 0));
    
    return res.json({
      success: true,
      message: '获取预算历史数据成功',
      data: {
        months,
        budgetData,
        expenseData
      }
    });
  } catch (error) {
    console.error('获取预算历史数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算历史数据失败',
      error: error.message
    });
  }
});

/**
 * 检查预算预警
 * GET /api/budget/alerts
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { budgetId } = req.query;
    
    // 构建查询条件
    let whereConditions = '';
    let params = [];
    let paramIndex = 1;
    
    if (budgetId) {
      whereConditions += ` WHERE b.id = $${paramIndex}`;
      params.push(budgetId);
      paramIndex++;
    }
    
    // 获取预算预警信息
    const alertsSql = `
      SELECT 
        b.id as budgetId,
        b.name as budgetName,
        bc.name as category,
        (b.used_amount / b.budget_amount) * 100 as utilization,
        (b.budget_amount - b.used_amount) as remaining
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ${whereConditions}
      ORDER BY utilization DESC
    `;
    
    const alertsResult = await query(alertsSql, params);
    
    // 构建预警信息
    const alerts = alertsResult.rows.map(budget => {
      const utilization = parseFloat(budget.utilization || 0);
      let alertLevel = 'normal';
      let message = '';
      
      if (utilization > 100) {
        alertLevel = 'danger';
        message = `预算已超支 ${(utilization - 100).toFixed(1)}%`;
      } else if (utilization > 80) {
        alertLevel = 'warning';
        message = `预算使用率已达 ${utilization.toFixed(1)}%，接近预算上限`;
      }
      
      return {
        budgetId: budget.budgetid,
        budgetName: budget.budgetname,
        category: budget.category,
        utilization,
        remaining: parseFloat(budget.remaining || 0),
        alertLevel,
        message
      };
    }).filter(alert => alert.alertLevel !== 'normal');
    
    return res.json({
      success: true,
      message: '获取预算预警信息成功',
      data: {
        alerts,
        totalAlerts: alerts.length
      }
    });
  } catch (error) {
    console.error('获取预算预警信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算预警信息失败',
      error: error.message
    });
  }
});

/**
 * 获取预算统计数据
 * GET /api/budget/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    // 构建查询条件
    let whereConditions = '';
    let params = [];
    let paramIndex = 1;
    
    if (startDate) {
      whereConditions += ` WHERE b.budget_period_start >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereConditions += whereConditions.includes('WHERE') ? ` AND b.budget_period_end <= $${paramIndex}` : ` WHERE b.budget_period_end <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    } else {
      // 默认查询当前有效的预算
      whereConditions += whereConditions.includes('WHERE') ? ` AND b.budget_period_end >= CURRENT_DATE` : ` WHERE b.budget_period_end >= CURRENT_DATE`;
    }
    
    if (category) {
      whereConditions += whereConditions.includes('WHERE') ? ` AND bc.name ILIKE $${paramIndex}` : ` WHERE bc.name ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    
    // 1. 预算总额和使用情况
    const budgetSummarySql = `
      SELECT 
        COALESCE(SUM(b.budget_amount), 0) as totalBudget,
        COALESCE(SUM(b.used_amount), 0) as usedBudget,
        COALESCE(SUM(b.budget_amount - b.used_amount), 0) as remainingBudget
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ${whereConditions}
      WHERE b.status = 'active' -- 只统计有效的预算
    `;
    
    const budgetSummaryResult = await query(budgetSummarySql, params);
    const budgetSummary = budgetSummaryResult.rows[0];
    
    // 2. 预算分类分布
    const categoryDistributionSql = `
      SELECT 
        bc.name as category,
        COALESCE(SUM(b.budget_amount), 0) as totalBudget,
        COALESCE(SUM(b.used_amount), 0) as usedBudget
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ${whereConditions}
      WHERE b.status = 'active'
      GROUP BY bc.name
      ORDER BY totalBudget DESC
    `;
    
    const categoryDistributionResult = await query(categoryDistributionSql, params);
    
    // 3. 预算使用趋势
    const usageTrendSql = `
      SELECT 
        DATE_TRUNC('month', b.updated_at) as date,
        COALESCE(SUM(b.used_amount), 0) as usedAmount,
        COALESCE(SUM(b.budget_amount), 0) as budgetAmount
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ${whereConditions}
      WHERE b.status = 'active'
      GROUP BY DATE_TRUNC('month', b.updated_at)
      ORDER BY date ASC
    `;
    
    const usageTrendResult = await query(usageTrendSql, params);
    
    // 4. 预算预警信息
    const alertsSql = `
      SELECT 
        b.id as budgetId,
        bc.name as category,
        b.budget_amount as totalBudget,
        b.used_amount as usedBudget,
        (b.used_amount / b.budget_amount) * 100 as usagePercentage,
        a.alert_type as alertType,
        a.alert_threshold as threshold,
        a.created_at as alertDate
      FROM budget_alerts a
      LEFT JOIN budgets b ON a.budget_id = b.id
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `;
    
    const alertsResult = await query(alertsSql, params);
    
    // 5. 计算使用率
    const totalBudget = parseFloat(budgetSummary.totalbudget || 0);
    const usedBudget = parseFloat(budgetSummary.usedbudget || 0);
    const remainingBudget = parseFloat(budgetSummary.remainingbudget || 0);
    const usagePercentage = totalBudget > 0 ? parseFloat(((usedBudget / totalBudget) * 100).toFixed(2)) : 0;
    
    // 构建响应数据
    const statistics = {
      totalBudget: totalBudget,
      usedBudget: usedBudget,
      remainingBudget: remainingBudget,
      usagePercentage: usagePercentage,
      budgetCategories: categoryDistributionResult.rows.map(row => ({
        category: row.category,
        budget: parseFloat(row.totalbudget || 0),
        used: parseFloat(row.usedbudget || 0),
        percentage: totalBudget > 0 ? parseFloat(((parseFloat(row.totalbudget || 0) / totalBudget) * 100).toFixed(2)) : 0
      })),
      budgetTrend: usageTrendResult.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        used: parseFloat(row.usedamount || 0),
        budget: parseFloat(row.budgetamount || 0)
      })),
      alerts: alertsResult.rows.map(row => ({
        budgetId: row.budgetid,
        category: row.category,
        totalBudget: parseFloat(row.totalbudget || 0),
        usedBudget: parseFloat(row.usedbudget || 0),
        usagePercentage: parseFloat(row.usagepercentage || 0),
        alertType: row.alerttype,
        threshold: parseFloat(row.threshold || 0),
        alertDate: row.alertdate.toISOString().split('T')[0]
      }))
    };
    
    return res.json({
      success: true,
      message: '获取预算统计数据成功',
      data: statistics
    });
  } catch (error) {
    console.error('获取预算统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算统计数据失败',
      error: error.message
    });
  }
});

/**
 * 检查单个预算预警
 * GET /api/budget/:id/alerts
 */
router.get('/:id/alerts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取单个预算的预警信息
    const budgetSql = `
      SELECT 
        b.id as budgetId,
        b.name as budgetName,
        bc.name as category,
        (b.used_amount / b.budget_amount) * 100 as utilization,
        (b.budget_amount - b.used_amount) as remaining
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      WHERE b.id = $1
    `;
    
    const budgetResult = await query(budgetSql, [id]);
    
    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '预算不存在'
      });
    }
    
    // 构建预警信息
    const budget = budgetResult.rows[0];
    const utilization = parseFloat(budget.utilization || 0);
    let alertLevel = 'normal';
    let message = '';
    
    if (utilization > 100) {
      alertLevel = 'danger';
      message = `预算已超支 ${(utilization - 100).toFixed(1)}%`;
    } else if (utilization > 80) {
      alertLevel = 'warning';
      message = `预算使用率已达 ${utilization.toFixed(1)}%，接近预算上限`;
    }
    
    const alert = {
      budgetId: budget.budgetid,
      budgetName: budget.budgetname,
      category: budget.category,
      utilization,
      remaining: parseFloat(budget.remaining || 0),
      alertLevel,
      message
    };
    
    const alerts = alertLevel !== 'normal' ? [alert] : [];
    
    return res.json({
      success: true,
      message: '获取预算预警信息成功',
      data: {
        alerts,
        totalAlerts: alerts.length
      }
    });
  } catch (error) {
    console.error('获取预算预警信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预算预警信息失败',
      error: error.message
    });
  }
});

module.exports = router;
