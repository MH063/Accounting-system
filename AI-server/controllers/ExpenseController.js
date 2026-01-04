/**
 * 费用控制器
 * 提供费用的CRUD操作
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../middleware/response');
const logger = require('../config/logger');

class ExpenseController extends BaseController {
  constructor() {
    super();
    this.clearAllExpenses = this.clearAllExpenses.bind(this);
    this.batchApproveExpenses = this.batchApproveExpenses.bind(this);
    this.batchRejectExpenses = this.batchRejectExpenses.bind(this);
    this.reviewExpense = this.reviewExpense.bind(this);
  }
  
  /**
   * 获取费用统计数据
   * GET /api/expenses/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const { startDate, endDate, category, page = 1, pageSize = 10 } = req.query;
      
      // 构建查询条件
      let whereConditions = '';
      let params = [];
      let paramIndex = 1;
      
      if (startDate) {
        whereConditions += ` WHERE e.expense_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.expense_date <= $${paramIndex}` : ` WHERE e.expense_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      if (category) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND ec.category_name ILIKE $${paramIndex}` : ` WHERE ec.category_name ILIKE $${paramIndex}`;
        params.push(`%${category}%`);
        paramIndex++;
      }
      
      // 1. 总统计
      const totalSql = `
        SELECT 
          COUNT(*) as totalCount, 
          SUM(e.amount) as totalAmount,
          AVG(e.amount) as avgAmount,
          COUNT(DISTINCT ec.category_name) as categoryCount,
          MAX(e.amount) as maxAmount
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        ${whereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
      `;
      
      const totalResult = await query(totalSql, params);
      const totalStats = totalResult.rows[0];
      
      // 计算日均支出
      let dailyAverage = 0;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        dailyAverage = parseFloat(totalStats.totalamount || 0) / days;
      } else {
        // 如果没有指定时间范围，默认使用最近30天
        dailyAverage = parseFloat(totalStats.totalamount || 0) / 30;
      }
      
      // 2. 按状态统计
      const statusSql = `
        SELECT e.status, COUNT(*) as count, SUM(e.amount) as total
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        ${whereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        GROUP BY e.status
        ORDER BY count DESC
      `;
      
      const statusResult = await query(statusSql, params);
      
      // 3. 按类别统计（用于占比数据）
      const categorySql = `
        SELECT ec.category_name as category, COUNT(*) as count, SUM(e.amount) as total
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        ${whereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        GROUP BY ec.category_name
        ORDER BY total DESC
      `;
      
      const categoryResult = await query(categorySql, params);
      
      // 4. 成员支出对比数据
      const memberSql = `
        SELECT u.nickname as name, COUNT(*) as count, SUM(e.amount) as amount
        FROM expenses e
        LEFT JOIN users u ON e.applicant_id = u.id
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        ${whereConditions}
        ${whereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        GROUP BY u.nickname
        ORDER BY amount DESC
      `;
      
      const memberResult = await query(memberSql, params);
      
      // 5. 时段支出分布数据（按天）
      const timeRange = startDate && endDate ? `${whereConditions}` : ` WHERE e.expense_date >= NOW() - INTERVAL '30 days'`;
      const timePeriodSql = `
        SELECT 
          DATE_TRUNC('day', e.expense_date) as date,
          COUNT(*) as count,
          SUM(e.amount) as amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${timeRange}
        AND (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        GROUP BY DATE_TRUNC('day', e.expense_date)
        ORDER BY date ASC
      `;
      
      const timePeriodResult = await query(timePeriodSql, params);
      
      // 6. 最近30天的费用趋势（按天）
      const trendSql = `
        SELECT 
          DATE_TRUNC('day', e.expense_date) as date,
          COUNT(*) as count,
          SUM(e.amount) as total
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        WHERE e.expense_date >= NOW() - INTERVAL '30 days' ${whereConditions.replace('WHERE', 'AND')}
        AND (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        GROUP BY DATE_TRUNC('day', e.expense_date)
        ORDER BY date ASC
      `;
      
      const trendResult = await query(trendSql, params);
      
      // 7. 按月份统计
      const monthlySql = `
        SELECT 
          TO_CHAR(e.expense_date, 'YYYY-MM') as month,
          COUNT(*) as count,
          SUM(e.amount) as total
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        ${whereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')
        ORDER BY month ASC
      `;
      
      const monthlyResult = await query(monthlySql, params);
      
      // 8. 支出明细数据（带分页）
      const detailWhereConditions = whereConditions;
      const detailParams = [...params];
      const detailParamIndex = paramIndex;
      
      const detailSql = `
        SELECT 
          e.id,
          e.title,
          e.description,
          e.amount,
          ec.category_name as category,
          u.nickname as payer,
          e.status,
          e.expense_date as date,
          e.created_at as createdAt
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${detailWhereConditions}
        ${detailWhereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        ORDER BY e.expense_date DESC
        LIMIT $${detailParamIndex} OFFSET $${detailParamIndex + 1}
      `;
      
      detailParams.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
      const detailResult = await query(detailSql, detailParams);
      
      // 9. 获取单笔最高支出的类别
      const maxExpenseSql = `
        SELECT ec.category_name as category
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        ${whereConditions.includes('WHERE') ? 'AND' : 'WHERE'} (u.id IS NULL OR u.id NOT IN (
          SELECT ur.user_id 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE r.is_system_role = TRUE
        ))
        ORDER BY e.amount DESC
        LIMIT 1
      `;
      
      const maxExpenseResult = await query(maxExpenseSql, params);
      const maxExpenseCategory = maxExpenseResult.rows[0]?.category || '';
      
      // 构建响应数据
      const statistics = {
        statistics: {
          totalExpense: parseFloat(totalStats.totalamount || 0),
          dailyAverage: parseFloat(dailyAverage.toFixed(2)),
          categoryCount: parseInt(totalStats.categorycount || 0),
          maxExpense: parseFloat(totalStats.maxamount || 0),
          maxExpenseCategory: maxExpenseCategory
        },
        trendData: trendResult.rows.map(row => ({
          date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
          amount: parseFloat(row.total || 0)
        })),
        categoryData: categoryResult.rows.map(row => ({
          name: row.category,
          value: parseFloat(row.total || 0),
          count: parseInt(row.count || 0)
        })),
        memberData: memberResult.rows.map(row => ({
          name: row.name,
          amount: parseFloat(row.amount || 0),
          count: parseInt(row.count || 0)
        })),
        timeData: timePeriodResult.rows.map(row => ({
          period: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
          amount: parseFloat(row.amount || 0),
          count: parseInt(row.count || 0)
        })),
        detailData: detailResult.rows.map(row => ({
          id: row.id,
          date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
          category: row.category,
          description: row.description,
          amount: parseFloat(row.amount || 0),
          payer: row.payer,
          status: row.status
        })),
        total: parseInt(totalStats.totalcount || 0)
      };
      
      return successResponse(res, statistics, '获取费用统计数据成功');
    } catch (error) {
      logger.error('获取费用统计数据失败', { 
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }

  /**
   * 发送费用提醒
   * POST /api/expenses/:id/remind
   */
  async sendReminder(req, res, next) {
    try {
      const { id } = req.params;
      const { method = 'email' } = req.body;
      
      // 验证必填字段
      if (!id) {
        return errorResponse(res, '缺少费用ID', 400);
      }
      
      // 先检查费用是否存在
      const checkSql = `
        SELECT e.id, e.title, e.amount, e.status, e.expense_date, 
               applicant.email, applicant.phone, applicant.nickname 
        FROM expenses e
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        WHERE e.id = $1
      `;
      const checkResult = await query(checkSql, [id]);
      
      if (checkResult.rows.length === 0) {
        return errorResponse(res, '费用不存在', 404);
      }
      
      const expense = checkResult.rows[0];
      
      // 模拟发送提醒（实际应用中应该集成邮件或短信服务）
      // 记录发送提醒
      logger.info('发送费用提醒', { 
        expenseId: id, 
        title: expense.title, 
        amount: expense.amount, 
        method,
        recipient: {
          nickname: expense.nickname,
          email: expense.email,
          phone: expense.phone
        }
      });
      
      // 在实际应用中，这里应该调用邮件或短信服务发送提醒
      // 例如：await emailService.sendExpenseReminder(expense, method);
      
      // 记录提醒发送记录（这里可以添加到数据库表中，例如expense_reminders表）
      const reminderSql = `
        INSERT INTO expense_reminders (expense_id, method, status, sent_at, created_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `;
      
      // 注意：如果expense_reminders表不存在，这个语句会失败
      // 在实际应用中，应该先创建这个表
      let reminderResult;
      try {
        reminderResult = await query(reminderSql, [id, method, 'sent']);
      } catch (reminderError) {
        console.warn('创建提醒记录失败，可能是expense_reminders表不存在:', reminderError.message);
        // 继续执行，不中断主流程
      }
      
      return successResponse(res, {
        expenseId: id,
        method: method,
        reminderId: reminderResult?.rows[0]?.id || null
      }, '费用提醒发送成功');
    } catch (error) {
      logger.error('发送费用提醒失败', { 
        error: error.message,
        id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }

  /**
   * 更新费用
   * PUT /api/expenses/:id
   */
  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, amount, category, date, status } = req.body;
      
      // 验证必填字段
      if (!id) {
        return errorResponse(res, '缺少费用ID', 400);
      }
      
      // 先检查费用是否存在
      const checkSql = 'SELECT id, category_id, status FROM expenses WHERE id = $1';
      const checkResult = await query(checkSql, [id]);
      
      if (checkResult.rows.length === 0) {
        return errorResponse(res, '费用不存在', 404);
      }
      
      const currentStatus = checkResult.rows[0].status;
      
      // 准备更新数据
      const updateData = {};
      const updateParams = [];
      let paramIndex = 1;
      
      // 构建更新语句
      let updateSql = 'UPDATE expenses SET updated_at = NOW()';
      
      // 添加更新字段
      if (title !== undefined) {
        updateSql += `, title = $${paramIndex}`;
        updateParams.push(title);
        paramIndex++;
      }
      
      if (description !== undefined) {
        updateSql += `, description = $${paramIndex}`;
        updateParams.push(description);
        paramIndex++;
      }
      
      if (amount !== undefined) {
        updateSql += `, amount = $${paramIndex}`;
        updateParams.push(amount);
        paramIndex++;
      }
      
      if (category) {
        // 查询费用类别ID
        const categoryQuery = await query(
          'SELECT id FROM expense_categories WHERE category_name = $1 OR category_code = $1', 
          [category]
        );
        
        if (categoryQuery.rows.length === 0) {
          return errorResponse(res, '无效的费用类别', 400);
        }
        
        updateSql += `, category_id = $${paramIndex}`;
        updateParams.push(categoryQuery.rows[0].id);
        paramIndex++;
      }
      
      if (date) {
        updateSql += `, expense_date = $${paramIndex}`;
        updateParams.push(date);
        paramIndex++;
      }

      if (status !== undefined) {
        // 允许从 draft 变更为 pending
        updateSql += `, status = $${paramIndex}`;
        updateParams.push(status);
        paramIndex++;
      }
      
      // 添加WHERE条件
      updateSql += ` WHERE id = $${paramIndex} RETURNING id`;
      updateParams.push(id);
      
      // 执行更新
      const updateResult = await query(updateSql, updateParams);
      
      if (updateResult.rows.length === 0) {
        return errorResponse(res, '费用更新失败', 404);
      }
      
      // 查询更新后的费用详情
      const selectSql = `
        SELECT 
          e.id, e.title, e.description, e.amount, ec.category_name as category, 
          ec.category_code as categoryCode,
          applicant.nickname as applicant, e.expense_date as date, e.status,
          reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt, e.updated_at as updatedAt, d.dorm_name as dormName
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
        LEFT JOIN dorms d ON e.dorm_id = d.id
        WHERE e.id = $1
      `;
      
      const selectResult = await query(selectSql, [id]);
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const row = selectResult.rows[0];
      const processedRow = {
        ...row,
        categoryCode: row.categorycode || row.categoryCode,
        dormName: row.dormname || row.dormName,
        date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null,
        createdAt: row.createdAt ? (typeof row.createdAt === 'object' && row.createdAt.toISOString ? row.createdAt.toISOString() : row.createdAt.toString()) : null,
        updatedAt: row.updatedAt ? (typeof row.updatedAt === 'object' && row.updatedAt.toISOString ? row.updatedAt.toISOString() : row.updatedAt.toString()) : null
      };
      
      return successResponse(res, processedRow, '费用更新成功');
    } catch (error) {
      logger.error('更新费用失败', { 
        error: error.message,
        id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }

  /**
   * 获取费用列表
   * GET /api/expenses
   * GET /api/expenses/pending
   * GET /api/bills
   * GET /api/bills/pending
   */
  async getExpenseList(req, res, next) {
    try {
      // 检查请求路径，如果是/pending则自动设置status为pending
      const isPendingRoute = req.path === '/pending';
      const { page = 1, pageSize = parseInt(req.query.size) || 10, search = '', status = isPendingRoute ? 'pending' : '', category = '', month = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = `
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
        LEFT JOIN dorms d ON e.dorm_id = d.id
      `;
      let params = [];
      let paramIndex = 1;
      
      if (search) {
        whereConditions += ` WHERE (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (status) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.status = $${paramIndex}` : ` WHERE e.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (category) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND ec.category_name ILIKE $${paramIndex}` : ` WHERE ec.category_name ILIKE $${paramIndex}`;
        params.push(`%${category}%`);
        paramIndex++;
      }
      
      if (month) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.expense_date::text LIKE $${paramIndex}` : ` WHERE e.expense_date::text LIKE $${paramIndex}`;
        params.push(`${month}%`);
        paramIndex++;
      }
      
      // 计算偏移量
      const offset = (page - 1) * pageSize;
      
      // 查询总记录数
      const countSql = `SELECT COUNT(*) as total FROM expenses e${whereConditions}`;
      const countResult = await query(countSql, params);
      const total = parseInt(countResult.rows[0].total);
      
      // 查询费用列表
      const listSql = `
          SELECT 
            e.id, e.title, e.description, e.amount, ec.category_name as category, 
            ec.category_code as categoryCode,
            applicant.nickname as applicant, e.expense_date as date, e.status,
            reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
            e.created_at as createdAt, d.dorm_name as dormName
          FROM expenses e${whereConditions}
          ORDER BY e.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
      params.push(parseInt(pageSize), offset);
      
      const listResult = await query(listSql, params);
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const processedRows = listResult.rows.map(row => {
        // PostgreSQL 通常返回小写字段名，处理可能的兼容性问题
        const reviewDateVal = row.reviewdate || row.reviewDate;
        const reviewCommentVal = row.reviewcomment || row.reviewComment;
        const createdAtVal = row.createdat || row.createdAt;

        // 创建一个新对象，只包含需要的字段，避免重复键
        const processed = {
          id: row.id,
          title: row.title,
          description: row.description,
          amount: row.amount,
          category: row.category,
          categoryCode: row.categorycode || row.categoryCode,
          applicant: row.applicant,
          date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
          status: row.status,
          reviewer: row.reviewer,
          dormName: row.dormname || row.dormName,
          reviewDate: reviewDateVal ? (typeof reviewDateVal === 'object' && reviewDateVal.toISOString ? reviewDateVal.toISOString() : reviewDateVal.toString()) : null,
          reviewComment: reviewCommentVal,
          createdAt: createdAtVal ? (typeof createdAtVal === 'object' && createdAtVal.toISOString ? createdAtVal.toISOString() : createdAtVal.toString()) : null
        };
        return processed;
      });
      
      // 返回结果
      return successResponse(res, {
        data: processedRows, // 直接返回数组
        list: processedRows, // 兼容性字段
        items: processedRows, // 兼容性字段
        total: total,
        stats: {
          pending: processedRows.filter(row => row.status === 'pending').length,
          paid: processedRows.filter(row => row.status === 'paid').length,
          overdue: processedRows.filter(row => row.status === 'overdue').length,
          totalAmount: processedRows.reduce((sum, row) => sum + parseFloat(row.amount), 0)
        }
      }, '获取费用列表成功');
    } catch (error) {
      logger.error('获取费用列表失败', { 
        error: error.message,
        query: req.query,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 获取费用详情
   * GET /api/expenses/:id
   */
  async getExpenseDetail(req, res, next) {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT 
          e.id, e.title, e.description, e.amount, ec.category_name as category, 
          ec.category_code as categoryCode,
          applicant.nickname as applicant, e.expense_date as date, e.status,
          reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt, d.dorm_name as dormName
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
        LEFT JOIN dorms d ON e.dorm_id = d.id
        WHERE e.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return errorResponse(res, '费用不存在', 404);
      }
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const row = result.rows[0];
      const processedRow = {
        ...row,
        categoryCode: row.categorycode || row.categoryCode,
        dormName: row.dormname || row.dormName,
        date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null,
        createdAt: row.createdAt ? (typeof row.createdAt === 'object' && row.createdAt.toISOString ? row.createdAt.toISOString() : row.createdAt.toString()) : null
      };
      
      return successResponse(res, processedRow, '费用创建成功');
    } catch (error) {
      logger.error('获取费用详情失败', { 
        error: error.message,
        id: req.params.id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 创建费用
   * POST /api/expenses
   */
  async createExpense(req, res, next) {
    try {
      const { title, description, amount, category, date, participants, splitMethod, customSplitDetails } = req.body;
      
      // 记录费用创建尝试
      logger.audit(req, '创建费用', { 
        timestamp: new Date().toISOString(),
        title,
        amount,
        participantCount: participants?.length
      });

      // 验证必填字段
      if (!title || !amount || !category || !date) {
        return errorResponse(res, '缺少必填字段', 400);
      }
      
      // 校验参与者中是否包含管理员角色 (Rule 18/Rule 2)
      const { query } = require('../config/database');
      const adminCheckQuery = `
        SELECT u.id, u.username, r.role_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ANY($1) AND r.is_system_role = TRUE
      `;
      const adminCheckResult = await query(adminCheckQuery, [participants]);
      if (adminCheckResult.rows.length > 0) {
        const adminNames = adminCheckResult.rows.map(r => r.username).join(', ');
        logger.warn('[ExpenseController] 尝试添加管理员到费用分摊', { adminNames });
        return errorResponse(res, `以下用户是管理员，不能参与费用分摊: ${adminNames}`, 400);
      }

      // 先查询费用类别ID（支持类别名称或类别代码）
      const categoryQuery = await query(
        'SELECT id FROM expense_categories WHERE category_name = $1 OR category_code = $1', 
        [category]
      );
      
      if (categoryQuery.rows.length === 0) {
        return errorResponse(res, '无效的费用类别', 400);
      }
      
      const categoryId = categoryQuery.rows[0].id;
      
      // 使用当前登录用户
      const applicantId = req.user.id;
      
      // 查询用户所属的宿舍ID
      const dormQuery = await query(
        'SELECT dorm_id FROM user_dorms WHERE user_id = $1 AND status = $2 LIMIT 1',
        [applicantId, 'active']
      );
      
      let dormId = null; // 允许为 null
      if (dormQuery.rows.length > 0) {
        dormId = dormQuery.rows[0].dorm_id;
      } else {
        // 检查用户是否为系统管理员或管理员 (Rule 18/Rule 2)
        const adminCheck = await query(`
          SELECT 1 FROM user_roles ur 
          JOIN roles r ON ur.role_id = r.id 
          WHERE ur.user_id = $1 AND r.is_system_role = TRUE
        `, [applicantId]);
        
        if (adminCheck.rows.length === 0) {
          return errorResponse(res, '用户未加入任何宿舍', 400);
        }
        
        // 尝试从第一个参与者获取宿舍ID，以满足数据库 NOT NULL 约束
        if (participants && participants.length > 0) {
          const participantDormQuery = await query(
            'SELECT dorm_id FROM user_dorms WHERE user_id = $1 AND status = $2 LIMIT 1',
            [participants[0], 'active']
          );
          if (participantDormQuery.rows.length > 0) {
            dormId = participantDormQuery.rows[0].dorm_id;
          }
        }
      }

      if (!dormId) {
        // 如果仍然没有宿舍ID，返回错误，提醒用户数据库约束或分配宿舍
        return errorResponse(res, '无法确定费用所属宿舍，请确保至少有一名参与者属于某个宿舍', 400);
      }
      
    // 开启事务处理费用创建和分摊记录
    const client = await require('../config/database').pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 插入费用主表
      const insertSql = `
        INSERT INTO expenses (
          title, description, amount, category_id, applicant_id, dorm_id, 
          expense_date, status, split_type, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
        RETURNING id
      `;
      
      const insertResult = await client.query(insertSql, [
        title, description, amount, categoryId, applicantId, dormId, date, splitMethod
      ]);
      const expenseId = insertResult.rows[0].id;
      
      // 2. 调用存储过程计算并存储分摊结果
      // calculate_expense_split(p_expense_id, p_split_type, p_participant_ids, p_split_details, p_due_date)
      const splitDetailsJson = splitMethod === 'custom' ? JSON.stringify(customSplitDetails) : '{}';
      const calculateSql = `SELECT calculate_expense_split($1, $2, $3, $4, $5)`;
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 7); // 默认7天后到期
      
      await client.query(calculateSql, [
        expenseId, 
        splitMethod, 
        participants, 
        splitDetailsJson, 
        dueDate.toISOString().split('T')[0]
      ]);

      await client.query('COMMIT');

        // 查询完整信息返回
        const selectSql = `
          SELECT 
            e.id, e.title, e.description, e.amount, ec.category_name as category, 
            ec.category_code as categoryCode,
            applicant.nickname as applicant, e.expense_date as date, e.status,
            e.created_at as createdAt, d.dorm_name as dormName
          FROM expenses e
          LEFT JOIN expense_categories ec ON e.category_id = ec.id
          LEFT JOIN users applicant ON e.applicant_id = applicant.id
          LEFT JOIN dorms d ON e.dorm_id = d.id
          WHERE e.id = $1
        `;
        
        const selectResult = await client.query(selectSql, [expenseId]);
        const row = selectResult.rows[0];
        
        logger.audit(req, '费用创建成功', { expenseId });

        return successResponse(res, {
          ...row,
          categoryCode: row.categorycode || row.categoryCode,
          dormName: row.dormname || row.dormName,
          date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
          createdAt: row.createdAt ? (typeof row.createdAt === 'object' && row.createdAt.toISOString ? row.createdAt.toISOString() : row.createdAt.toString()) : null
        }, '费用创建成功');

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('创建费用失败:', { error: error.message });
      next(error);
    }
  }
  
  /**
   * 审核费用
   * PUT /api/expenses/:id/review
   */
  async reviewExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { status, comment = '' } = req.body;
      
      // 验证状态
      if (!status || !['approved', 'rejected'].includes(status)) {
        return errorResponse(res, '无效的审核状态', 400);
      }
      
      // 首先获取费用详情，用于后续预算更新
      const expenseSql = `
        SELECT e.id, e.amount, e.applicant_id, e.dorm_id, e.status as current_status
        FROM expenses e
        WHERE e.id = $1
      `;
      const expenseResult = await query(expenseSql, [id]);
      
      if (expenseResult.rows.length === 0) {
        return errorResponse(res, '费用不存在', 404);
      }
      
      const expense = expenseResult.rows[0];
      const wasApprovedBefore = expense.current_status === 'approved';
      
      const updateSql = `
        UPDATE expenses
        SET 
          status = $1,
          approved_by = $2,
          approved_at = NOW(),
          review_comment = $3
        WHERE id = $4
        RETURNING id, title, status, approved_by as reviewer, approved_at as reviewDate, review_comment as reviewComment
      `;
      // 获取审核人ID，优先从登录信息获取
      const reviewerId = req.user?.id || 1; 
      
      const result = await query(updateSql, [status, reviewerId, comment, id]);
      
      if (result.rows.length === 0) {
        return errorResponse(res, '费用不存在', 404);
      }
      
      // 如果费用被批准，需要更新相关预算
      if (status === 'approved' && !wasApprovedBefore) {
        if (this.updateBudgetWithExpense && typeof this.updateBudgetWithExpense === 'function') {
          try {
            await this.updateBudgetWithExpense(id, expense.amount, expense.applicant_id, expense.dorm_id);
          } catch (budgetError) {
            logger.error('更新预算失败', { error: budgetError.message, id });
          }
        }
      }
      // 如果费用从批准状态变为拒绝状态，需要从预算中减去该费用
      else if (status === 'rejected' && wasApprovedBefore) {
        if (this.removeExpenseFromBudget && typeof this.removeExpenseFromBudget === 'function') {
          try {
            await this.removeExpenseFromBudget(id, expense.amount, expense.applicant_id, expense.dorm_id);
          } catch (budgetError) {
            logger.error('从预算中移除费用失败', { error: budgetError.message, id });
          }
        }
      }
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const row = result.rows[0];
      const processedRow = {
        ...row,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null
      };
      
      return successResponse(res, processedRow, '费用审核成功');
    } catch (error) {
      logger.error('审核费用失败', { 
        error: error.message,
        id: req.params.id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 支付费用
   * PUT /api/expenses/:id/pay
   */
  async payExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentMethod, amount } = req.body;
      
      // 验证支付方式
      if (!paymentMethod) {
        return errorResponse(res, '缺少支付方式', 400);
      }
      
      const sql = `
        UPDATE expenses
        SET 
          status = 'paid',
          payment_method = $1,
          payment_date = NOW()
        WHERE id = $2 AND status = 'approved'
        RETURNING id, title, status, payment_method as paymentMethod, payment_date as paymentDate
      `;
      
      const result = await query(sql, [paymentMethod, id]);
      
      if (result.rows.length === 0) {
        return errorResponse(res, '费用不存在或状态不正确', 400);
      }
      
      return successResponse(res, result.rows[0], '费用支付成功');
    } catch (error) {
      logger.error('支付费用失败', { 
        error: error.message,
        id: req.params.id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 删除费用
   * DELETE /api/expenses/:id
   */
  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      
      const sql = `DELETE FROM expenses WHERE id = $1`;
      const result = await query(sql, [id]);
      
      if (result.rowCount === 0) {
        return errorResponse(res, '费用不存在', 404);
      }
      
      return successResponse(res, null, '费用删除成功');
    } catch (error) {
      logger.error('删除费用失败', { 
        error: error.message,
        id: req.params.id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 批量审核通过
   * PUT /api/expenses/batch/approve
   */
  async batchApproveExpenses(req, res, next) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, '缺少有效的费用ID列表', 400);
      }
      
      // 首先获取这些费用的详细信息，用于后续预算更新
      const expenseDetailsSql = `
        SELECT e.id, e.amount, e.applicant_id, e.dorm_id
        FROM expenses e
        WHERE e.id = ANY($1::int[])
        AND e.status != 'approved'  -- 只处理未批准的费用
      `;
      
      const expenseDetailsResult = await query(expenseDetailsSql, [ids]);
      const expensesToProcess = expenseDetailsResult.rows;
      
      const sql = `
        UPDATE expenses
        SET 
          status = 'approved',
          approved_by = $1,
          approved_at = NOW()
        WHERE id = ANY($2::int[])
        RETURNING id
      `;
      
      // 获取审核人ID，优先从登录信息获取
      const reviewerId = req.user?.id || 1; 
            
      const result = await query(sql, [reviewerId, ids]);
      
      // 更新相关预算
      for (const expense of expensesToProcess) {
        await this.updateBudgetWithExpense(expense.id, expense.amount, expense.applicant_id, expense.dorm_id);
      }
      
      return successResponse(res, {
        affectedIds: result.rows.map(row => row.id),
        message: `批量审核通过成功，共${result.rowCount}条记录`
      }, '批量审核通过成功');
    } catch (error) {
      logger.error('批量审核通过失败', { 
        error: error.message,
        ids,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 批量拒绝
   * PUT /api/expenses/batch/reject
   */
  async batchRejectExpenses(req, res, next) {
    try {
      const { ids, comment = '' } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, '缺少有效的费用ID列表', 400);
      }
      
      // 首先获取这些费用的详细信息，用于后续预算更新
      const expenseDetailsSql = `
        SELECT e.id, e.amount, e.applicant_id, e.dorm_id, e.status as current_status
        FROM expenses e
        WHERE e.id = ANY($1::int[])
      `;
      
      const expenseDetailsResult = await query(expenseDetailsSql, [ids]);
      const expensesToProcess = expenseDetailsResult.rows.filter(expense => expense.current_status === 'approved'); // 只处理之前已批准的费用
      
      const sql = `
        UPDATE expenses
        SET 
          status = 'rejected',
          approved_by = $1,
          approved_at = NOW(),
          review_comment = $2
        WHERE id = ANY($3::int[])
        RETURNING id
      `;
      
      // 获取审核人ID，优先从登录信息获取
      const reviewerId = req.user?.id || 1; 
            
      const result = await query(sql, [reviewerId, comment, ids]);
      
      // 从相关预算中移除这些费用
      for (const expense of expensesToProcess) {
        await this.removeExpenseFromBudget(expense.id, expense.amount, expense.applicant_id, expense.dorm_id);
      }
      
      return successResponse(res, {
        affectedIds: result.rows.map(row => row.id),
        message: `批量拒绝成功，共${result.rowCount}条记录`
      }, '批量拒绝成功');
    } catch (error) {
      logger.error('批量拒绝失败', { 
        error: error.message,
        ids,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 批量删除
   * DELETE /api/expenses/batch
   */
  async batchDeleteExpenses(req, res, next) {
    try {
      const { ids } = req.body;
      
      console.log('🗑️ [ExpenseController] 准备批量删除费用:', ids);
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, '缺少有效的费用ID列表', 400);
      }
      
      // 检查这些 ID 是否包含在其他关联表中且无法级联删除
      // 注意：payment_logs 已改为级联删除
      
      const sql = `DELETE FROM expenses WHERE id = ANY($1::bigint[]) RETURNING id`;
      const result = await query(sql, [ids]);
      
      console.log(`✅ [ExpenseController] 批量删除成功, 影响行数: ${result.rowCount}`);
      
      return successResponse(res, {
        affectedIds: result.rows.map(row => row.id),
        message: `批量删除成功，共${result.rowCount}条记录`
      }, '批量删除成功');
    } catch (error) {
      logger.error('批量删除失败', { 
        error: error.message,
        ids: req.body.ids,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      
      // 如果是外键约束错误，提供更友好的提示
      if (error.code === '23503') {
        return errorResponse(res, '无法删除费用：该费用已被其他记录引用（如支付记录或预算记录）', 400);
      }
      
      next(error);
    }
  }
  
  /**
   * 导出费用数据
   * GET /api/expenses/export
   */
  async exportExpenses(req, res, next) {
    try {
      const { format = 'csv', status = '', category = '', startDate = '', endDate = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = '';
      let params = [];
      let paramIndex = 1;
      
      if (status) {
        whereConditions += ` WHERE e.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (category) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND ec.category_name ILIKE $${paramIndex}` : ` WHERE ec.category_name ILIKE $${paramIndex}`;
        params.push(`%${category}%`);
        paramIndex++;
      }
      
      if (startDate) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.expense_date >= $${paramIndex}` : ` WHERE e.expense_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.expense_date <= $${paramIndex}` : ` WHERE e.expense_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      // 查询费用数据
      const sql = `
        SELECT 
          e.id, e.title, e.description, e.amount, ec.category_name as category, 
          applicant.nickname as applicant, e.expense_date as date, e.status,
          reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt, d.dorm_name as dormName
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
        LEFT JOIN dorms d ON e.dorm_id = d.id
        ${whereConditions}
        ORDER BY e.created_at DESC
      `;
      
      const result = await query(sql, params);
      
      // 简单实现CSV导出
      if (format === 'csv') {
        // 设置响应头
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=expenses_${new Date().toISOString().split('T')[0]}.csv`);
        
        // 构建CSV内容
        const headers = ['ID', '标题', '描述', '金额', '类别', '申请人', '寝室', '日期', '状态', '审核人', '审核日期', '审核意见', '创建时间'];
        const csvContent = [
          headers.join(','),
          ...result.rows.map(row => [
            row.id,
            `"${row.title}"`,
            `"${row.description || ''}"`,
            row.amount,
            row.category,
            row.applicant,
            `"${row.dormName || row.dormname || ''}"`,
            row.date,
            row.status,
            row.reviewer || '',
            row.reviewDate || '',
            `"${row.reviewComment || ''}"`,
            row.createdAt
          ].join(','))
        ].join('\n');
        
        res.send('\uFEFF' + csvContent); // 添加BOM解决中文乱码问题
      } else {
        // 其他格式暂时返回JSON数据
        return successResponse(res, result.rows, '获取导出数据成功');
      }
    } catch (error) {
      logger.error('导出费用数据失败', { 
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
  
  /**
   * 保存草稿
   * POST /api/expenses/draft
   */
  async saveDraft(req, res, next) {
    try {
      const { title, description, amount, category, date, dorm_id, splitMethod, customSplitDetails } = req.body;
      
      // 验证必填字段
      if (!title) {
        return errorResponse(res, '标题不能为空', 400);
      }
      
      if (!category) {
        return errorResponse(res, '类别不能为空', 400);
      }
      
      // 从认证中间件获取当前登录用户信息
      const currentUser = req.user;
      if (!currentUser || !currentUser.id) {
        return errorResponse(res, '用户未认证，请先登录', 401);
      }
      
      const applicantId = currentUser.id;
      
      // 获取用户宿舍ID
      // 如果请求中提供了宿舍ID，则使用该ID，否则需要从用户宿舍关系中获取
      let dormId = dorm_id;
      if (!dormId) {
        // 查询用户所属的宿舍
        const userDormQuery = await query(
          'SELECT dorm_id FROM user_dorms WHERE user_id = $1 AND status = $2 LIMIT 1',
          [applicantId, 'active']
        );
        
        if (userDormQuery.rows.length > 0) {
          dormId = userDormQuery.rows[0].dorm_id;
        } else {
          // 检查用户是否为系统管理员或管理员 (Rule 18/Rule 2)
          const adminCheck = await query(`
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = $1 AND r.is_system_role = TRUE
          `, [applicantId]);
          
          if (adminCheck.rows.length > 0) {
            // 尝试从第一个参与者获取宿舍ID
            const participants = req.body.participants;
            if (participants && participants.length > 0) {
              const participantDormQuery = await query(
                'SELECT dorm_id FROM user_dorms WHERE user_id = $1 AND status = $2 LIMIT 1',
                [participants[0], 'active']
              );
              if (participantDormQuery.rows.length > 0) {
                dormId = participantDormQuery.rows[0].dorm_id;
              }
            }
          } else {
            return errorResponse(res, '用户未加入任何宿舍', 400);
          }
        }
      }
      
      if (!dormId) {
        // 如果仍然没有宿舍ID，返回错误，提醒用户
        return errorResponse(res, '无法确定费用所属宿舍，请确保至少有一名参与者属于某个宿舍', 400);
      }
      
      // 查询费用类别ID
      const categoryQuery = await query(
        'SELECT id FROM expense_categories WHERE category_name = $1 OR category_code = $1', 
        [category]
      );
      
      if (categoryQuery.rows.length === 0) {
        return errorResponse(res, '无效的费用类别', 400);
      }
      
      const categoryId = categoryQuery.rows[0].id;
      
      // 插入或更新草稿
      // 这里简化处理，直接插入新的草稿记录，使用数据库允许的status值'pending'
      const insertSql = `
        INSERT INTO expenses (title, description, amount, currency, category_id, applicant_id, dorm_id, expense_date, status, split_type, split_details, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, NOW(), NOW())
        RETURNING id, title, description, amount, currency, category_id, applicant_id, dorm_id, expense_date as date, status, created_at, updated_at
      `;
      
      const insertParams = [
        title, 
        description || '', 
        amount || 0, 
        'CNY', 
        categoryId, 
        applicantId, 
        dormId, 
        date || new Date().toISOString().split('T')[0],
        splitMethod || 'equal',
        splitMethod === 'custom' ? JSON.stringify(customSplitDetails) : null
      ];
      
      const insertResult = await query(insertSql, insertParams);
      const draft = insertResult.rows[0];
      
      // 查询费用类别名称
      let categoryName = null;
      if (draft.category_id) {
        const categoryResult = await query(
          'SELECT category_name FROM expense_categories WHERE id = $1',
          [draft.category_id]
        );
        if (categoryResult.rows.length > 0) {
          categoryName = categoryResult.rows[0].category_name;
        }
      }
      
      // 查询申请人名称
      const applicantResult = await query(
        'SELECT nickname FROM users WHERE id = $1',
        [draft.applicant_id]
      );
      const applicantName = applicantResult.rows.length > 0 ? applicantResult.rows[0].nickname : '';
      
      // 构建返回数据
      const returnData = {
        ...draft,
        category: categoryName,
        applicant: applicantName
      };
      
      return successResponse(res, returnData, '保存草稿成功');
    } catch (error) {
      const debugDetails = process.env.NODE_ENV !== 'production' ? {
        stack: error.stack,
        detail: error.detail,
        hint: error.hint
      } : {};

      logger.error('保存草稿失败', {
        error: error.message,
        code: error.code,
        ...debugDetails
      });
      next(error);
    }
  }
  
  /**
   * 将费用金额计入相关预算
   * @param {number} expenseId - 费用ID
   * @param {number} amount - 费用金额
   * @param {number} userId - 用户ID
   * @param {number} dormId - 宿舍ID
   */
  async updateBudgetWithExpense(expenseId, amount, userId, dormId) {
    try {
      logger.info('将费用计入预算', { expenseId, amount });
      
      // 首先获取费用详情，包括类别信息
      const expenseSql = `
        SELECT e.id, e.amount, e.category_id, e.applicant_id, e.dorm_id
        FROM expenses e
        WHERE e.id = $1
      `;
      
      const expenseResult = await query(expenseSql, [expenseId]);
      if (expenseResult.rows.length === 0) {
        logger.warn('费用不存在，无法更新预算', { expenseId });
        return;
      }
      
      const expense = expenseResult.rows[0];
      
      // 查找General类型的预算作为备用
      // 首先获取费用类别的名称
      const categorySql = `SELECT category_name FROM expense_categories WHERE id = $1`;
      const categoryResult = await query(categorySql, [expense.category_id]);
      const categoryName = categoryResult.rows[0]?.category_name || 'Unknown';
      
      // 查找名称为'General'的预算类别
      const generalCategorySql = `SELECT id FROM budget_categories WHERE name = 'General'`;
      const generalCategoryResult = await query(generalCategorySql);
      
      let budgetResult;
      if (generalCategoryResult.rows.length > 0) {
        const generalCategoryId = generalCategoryResult.rows[0].id;
        
        // 查找与General类别匹配的活动预算
        const budgetSql = `
          SELECT b.id, b.name, b.used_amount, b.budget_amount, b.category_id
          FROM budgets b
          WHERE b.category_id = $1
            AND b.status = 'active'
            AND b.budget_period_start <= CURRENT_DATE
            AND b.budget_period_end >= CURRENT_DATE
          ORDER BY b.created_at DESC
          LIMIT 1
        `;
        
        budgetResult = await query(budgetSql, [generalCategoryId]);
        
        if (budgetResult.rows.length === 0) {
          logger.info('未找到General预算，尝试查找任何活动预算');
          
          // 如果没有General预算，查找任何活动的预算
          const fallbackBudgetSql = `
            SELECT b.id, b.name, b.used_amount, b.budget_amount, b.category_id
            FROM budgets b
            WHERE b.status = 'active'
              AND b.budget_period_start <= CURRENT_DATE
              AND b.budget_period_end >= CURRENT_DATE
            ORDER BY b.created_at DESC
            LIMIT 1
          `;
          
          budgetResult = await query(fallbackBudgetSql);
        }
      } else {
        logger.info('未找到General预算类别，尝试查找任何活动预算');
        
        // 如果没有General预算类别，查找任何活动的预算
        const fallbackBudgetSql = `
          SELECT b.id, b.name, b.used_amount, b.budget_amount, b.category_id
          FROM budgets b
          WHERE b.status = 'active'
            AND b.budget_period_start <= CURRENT_DATE
            AND b.budget_period_end >= CURRENT_DATE
          ORDER BY b.created_at DESC
          LIMIT 1
        `;
        
        budgetResult = await query(fallbackBudgetSql);
      }
      
      if (budgetResult.rows.length === 0) {
        logger.info('未找到任何活动预算，无法更新预算');
        return;
      }
      
      const budget = budgetResult.rows[0];
      logger.info('找到预算', { 
        budgetId: budget.id, 
        categoryId: budget.category_id, 
        currentUsedAmount: budget.used_amount 
      });
      
      // 计算新的已使用金额
      const newUsedAmount = parseFloat(budget.used_amount || 0) + parseFloat(amount);
      
      // 更新预算的已使用金额
      const updateBudgetSql = `
        UPDATE budgets
        SET used_amount = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, used_amount
      `;
      
      const updateResult = await query(updateBudgetSql, [newUsedAmount, budget.id]);
      
      if (updateResult.rows.length > 0) {
        logger.info('预算已使用金额已更新', { 
          budgetId: budget.id, 
          newUsedAmount: updateResult.rows[0].used_amount 
        });
        
        // 在预算使用记录表中添加记录
        const insertUsageRecordSql = `
          INSERT INTO budget_usage_records (budget_id, expense_id, usage_amount, usage_type, usage_description, usage_date, recorded_by, recorded_at)
          VALUES ($1, $2, $3, 'EXPENSE', '费用支出', CURRENT_DATE, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (budget_id, expense_id) DO UPDATE SET
            usage_amount = EXCLUDED.usage_amount,
            usage_date = EXCLUDED.usage_date,
            recorded_at = EXCLUDED.recorded_at
          RETURNING id
        `;
        
        await query(insertUsageRecordSql, [budget.id, expenseId, amount, userId]);
        logger.info('预算使用记录已添加/更新', { 
          budgetId: budget.id, 
          expenseId, 
          amount 
        });
      }
    } catch (error) {
      logger.error('更新预算失败', { error: error.message, expenseId });
    }
  }
  
  /**
   * 从预算中移除费用金额
   * @param {number} expenseId - 费用ID
   * @param {number} amount - 费用金额
   * @param {number} userId - 用户ID
   * @param {number} dormId - 宿舍ID
   */
  async removeExpenseFromBudget(expenseId, amount, userId, dormId) {
    try {
      logger.info('从预算中移除费用', { expenseId, amount });
      
      // 查找与该费用相关的预算使用记录
      const usageRecordSql = `
        SELECT bur.budget_id, bur.usage_amount, b.used_amount as current_budget_used
        FROM budget_usage_records bur
        JOIN budgets b ON bur.budget_id = b.id
        WHERE bur.expense_id = $1
      `;
      
      const usageRecordResult = await query(usageRecordSql, [expenseId]);
      
      if (usageRecordResult.rows.length === 0) {
        logger.info('未找到费用对应的预算使用记录，跳过移除', { expenseId });
        return;
      }
      
      const usageRecord = usageRecordResult.rows[0];
      
      // 计算新的已使用金额
      const newUsedAmount = Math.max(0, parseFloat(usageRecord.current_budget_used || 0) - parseFloat(usageRecord.usage_amount || 0));
      
      // 更新预算的已使用金额
      const budgetSql = `
        UPDATE budgets
        SET used_amount = $1,  -- 使用计算出的新金额，而不是简单减法
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, used_amount
      `;
      
      const updateResult = await query(budgetSql, [newUsedAmount, usageRecord.budget_id]);
      
      if (updateResult.rows.length > 0) {
        logger.info('预算已使用金额已更新', { 
          budgetId: usageRecord.budget_id, 
          newUsedAmount: updateResult.rows[0].used_amount 
        });
        
        // 删除预算使用记录
        const deleteUsageRecordSql = `DELETE FROM budget_usage_records WHERE expense_id = $1`;
        await query(deleteUsageRecordSql, [expenseId]);
        logger.info('预算使用记录已删除', { expenseId });
      }
    } catch (error) {
      logger.error('从预算中移除费用失败', { error: error.message, expenseId });
    }
  }

  /**
   * 清空所有费用记录（仅管理员可用）
   * DELETE /api/expenses/clear-all
   */
  async clearAllExpenses(req, res, next) {
    try {
      // 检查是否为管理员
      if (!req.user || !req.user.is_admin) {
        return errorResponse(res, '只有管理员才能清空所有费用记录', 403);
      }

      // 获取用户所属宿舍ID
      const userDormQuery = await query(
        'SELECT dorm_id FROM user_dorms WHERE user_id = $1 AND status = $2 LIMIT 1',
        [req.user.id, 'active']
      );

      let dormId = null;
      if (userDormQuery.rows.length > 0) {
        dormId = userDormQuery.rows[0].dorm_id;
      }

      // 如果没有宿舍ID，则删除所有费用记录（超级管理员）
      let deleteSql;
      let deleteParams;

      if (dormId) {
        // 删除当前用户宿舍的费用记录
        deleteSql = `DELETE FROM expenses WHERE dorm_id = $1 RETURNING id`;
        deleteParams = [dormId];
      } else {
        // 超级管理员可以删除所有记录
        deleteSql = `DELETE FROM expenses RETURNING id`;
        deleteParams = [];
      }

      const result = await query(deleteSql, deleteParams);

      return successResponse(res, {
        deletedCount: result.rowCount,
        message: `成功清空 ${result.rowCount} 条费用记录`
      }, '清空所有费用记录成功');
    } catch (error) {
      logger.error('清空所有费用记录失败', { 
        error: error.message,
        userId: req.user.id,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
      next(error);
    }
  }
}

// 创建控制器实例并确保所有方法都正确绑定
const expenseController = new ExpenseController();

// 验证方法绑定
logger.debug('验证ExpenseController方法绑定', {
  hasUpdateBudgetWithExpense: typeof expenseController.updateBudgetWithExpense === 'function',
  hasRemoveExpenseFromBudget: typeof expenseController.removeExpenseFromBudget === 'function',
  updateBudgetWithExpenseBound: expenseController.updateBudgetWithExpense === expenseController.updateBudgetWithExpense.bind(expenseController),
});

// 使用 Object.freeze 确保方法绑定的控制器实例
Object.freeze(expenseController);
module.exports = expenseController;
