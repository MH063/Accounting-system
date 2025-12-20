/**
 * 费用摘要控制器
 * 提供费用统计和摘要功能
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');

class ExpenseSummaryController extends BaseController {
  /**
   * 获取费用摘要
   * GET /api/expense-summary/summary
   * 
   * 请求参数:
   * - start_date: 开始日期 (可选，默认最近30天)
   * - end_date: 结束日期 (可选，默认今天)
   * - dorm_id: 宿舍ID (可选)
   * - category_id: 类别ID (可选)
   * - status: 费用状态 (可选)
   * - group_by: 分组方式 (可选，支持 month/category/dorm)
   * 
   * 返回结果:
   * - 总费用、分类统计、趋势分析等摘要信息
   */
  async getExpenseSummary(req, res, next) {
    try {
      // 获取查询参数
      const {
        start_date,
        end_date,
        dorm_id,
        category_id,
        status,
        group_by = 'month'
      } = req.query;

      // 设置默认日期范围（最近30天）
      const endDate = end_date || new Date().toISOString().split('T')[0];
      const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 构建查询条件
      let whereConditions = 'WHERE e.expense_date BETWEEN $1 AND $2';
      let params = [startDate, endDate];
      let paramIndex = 3;

      // 添加宿舍筛选条件
      if (dorm_id) {
        whereConditions += ` AND e.dorm_id = $${paramIndex}`;
        params.push(dorm_id);
        paramIndex++;
      }

      // 添加类别筛选条件
      if (category_id) {
        whereConditions += ` AND e.category_id = $${paramIndex}`;
        params.push(category_id);
        paramIndex++;
      }

      // 添加状态筛选条件
      if (status) {
        whereConditions += ` AND e.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // 根据分组方式构建查询
      let groupByClause = '';
      let orderByClause = '';
      let selectFields = '';

      switch (group_by) {
        case 'month':
          selectFields = "TO_CHAR(e.expense_date, 'YYYY-MM') as period";
          groupByClause = "GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')";
          orderByClause = "ORDER BY period";
          break;
        case 'category':
          selectFields = 'ec.category_name as period';
          groupByClause = 'GROUP BY ec.category_name, ec.id';
          orderByClause = "ORDER BY ec.id";
          break;
        case 'dorm':
          selectFields = 'd.dorm_name as period';
          groupByClause = 'GROUP BY d.dorm_name, d.id';
          orderByClause = "ORDER BY d.id";
          break;
        default:
          selectFields = "TO_CHAR(e.expense_date, 'YYYY-MM') as period";
          groupByClause = "GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')";
          orderByClause = "ORDER BY period";
      }

      // 构建主查询SQL
      const sql = `
        SELECT 
          ${selectFields},
          COUNT(e.id) as expense_count,
          SUM(e.amount) as total_amount,
          AVG(e.amount) as average_amount,
          MIN(e.amount) as min_amount,
          MAX(e.amount) as max_amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN dorms d ON e.dorm_id = d.id
        ${whereConditions}
        ${groupByClause}
        ${orderByClause}
      `;

      // 执行查询
      const result = await query(sql, params);

      // 获取总览数据
      const overviewSql = `
        SELECT 
          COUNT(e.id) as total_expenses,
          SUM(e.amount) as total_amount,
          AVG(e.amount) as average_amount,
          MIN(e.amount) as min_amount,
          MAX(e.amount) as max_amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN dorms d ON e.dorm_id = d.id
        ${whereConditions}
      `;

      const overviewResult = await query(overviewSql, params);
      const overview = overviewResult.rows[0];

      // 构建响应数据
      const responseData = {
        overview: {
          total_expenses: parseInt(overview.total_expenses) || 0,
          total_amount: parseFloat(overview.total_amount) || 0,
          average_amount: parseFloat(overview.average_amount) || 0,
          min_amount: parseFloat(overview.min_amount) || 0,
          max_amount: parseFloat(overview.max_amount) || 0
        },
        details: result.rows.map(row => ({
          period: row.period,
          expense_count: parseInt(row.expense_count) || 0,
          total_amount: parseFloat(row.total_amount) || 0,
          average_amount: parseFloat(row.average_amount) || 0,
          min_amount: parseFloat(row.min_amount) || 0,
          max_amount: parseFloat(row.max_amount) || 0
        })),
        filters: {
          start_date: startDate,
          end_date: endDate,
          dorm_id: dorm_id || null,
          category_id: category_id || null,
          status: status || null,
          group_by: group_by
        }
      };

      // 返回成功响应
      return res.json({
        success: true,
        message: '费用摘要获取成功',
        data: responseData
      });
    } catch (error) {
      console.error('获取费用摘要失败:', error);
      next(error);
    }
  }
}

module.exports = new ExpenseSummaryController();