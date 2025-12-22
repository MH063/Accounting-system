/**
 * 费用控制器
 * 提供费用的CRUD操作
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');

class ExpenseController extends BaseController {
  /**
   * 获取费用列表
   * GET /api/expenses
   * GET /api/expenses/pending
   */
  async getExpenseList(req, res, next) {
    try {
      // 检查请求路径，如果是/pending则自动设置status为pending
      const isPendingRoute = req.path === '/pending';
      const { page = 1, pageSize = 10, search = '', status = isPendingRoute ? 'pending' : '', category = '', month = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = `
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
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
          applicant.nickname as applicant, e.expense_date as date, e.status,
          reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt
        FROM expenses e${whereConditions}
        ORDER BY e.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(parseInt(pageSize), offset);
      
      const listResult = await query(listSql, params);
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const processedRows = listResult.rows.map(row => ({
        ...row,
        date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null,
        createdAt: row.createdAt ? (typeof row.createdAt === 'object' && row.createdAt.toISOString ? row.createdAt.toISOString() : row.createdAt.toString()) : null
      }));
      
      // 返回结果
      return res.json({
        success: true,
        data: {
          items: processedRows,
          total
        }
      });
    } catch (error) {
      console.error('获取费用列表失败:', error);
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
          applicant.nickname as applicant, e.expense_date as date, e.status,
          reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
        WHERE e.id = $1
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '费用不存在'
        });
      }
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const row = result.rows[0];
      const processedRow = {
        ...row,
        date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null,
        createdAt: row.createdAt ? (typeof row.createdAt === 'object' && row.createdAt.toISOString ? row.createdAt.toISOString() : row.createdAt.toString()) : null
      };
      
      return res.json({
        success: true,
        data: processedRow
      });
    } catch (error) {
      console.error('获取费用详情失败:', error);
      next(error);
    }
  }
  
  /**
   * 创建费用
   * POST /api/expenses
   */
  async createExpense(req, res, next) {
    try {
      const { title, description, amount, category, date } = req.body;
      
      // 验证必填字段
      if (!title || !amount || !category || !date) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }
      
      // 先查询费用类别ID（支持类别名称或类别代码）
      const categoryQuery = await query(
        'SELECT id FROM expense_categories WHERE category_name = $1 OR category_code = $1', 
        [category]
      );
      
      if (categoryQuery.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '无效的费用类别'
        });
      }
      
      const categoryId = categoryQuery.rows[0].id;
      
      // 假设申请人是当前登录用户（这里使用默认ID 4）
      const applicantId = 4; // 实际应用中应该从登录信息获取
      
      // 查询用户所属的宿舍ID
      const dormQuery = await query(
        'SELECT dorm_id FROM user_dorms WHERE user_id = $1 AND status = $2 LIMIT 1',
        [applicantId, 'active']
      );
      
      if (dormQuery.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '用户未加入任何宿舍'
        });
      }
      
      const dormId = dormQuery.rows[0].dorm_id;
      
      // 先插入费用记录
      const insertSql = `
        INSERT INTO expenses (title, description, amount, category_id, applicant_id, dorm_id, expense_date, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
        RETURNING id
      `;
      
      const insertResult = await query(insertSql, [title, description, amount, categoryId, applicantId, dormId, date]);
      const expenseId = insertResult.rows[0].id;
      
      // 查询刚插入的费用详情
      const selectSql = `
        SELECT 
          e.id, e.title, e.description, e.amount, ec.category_name as category, 
          applicant.nickname as applicant, e.expense_date as date, e.status,
          reviewer_user.nickname as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        LEFT JOIN users applicant ON e.applicant_id = applicant.id
        LEFT JOIN users reviewer_user ON e.approved_by = reviewer_user.id
        WHERE e.id = $1
      `;
      
      const selectResult = await query(selectSql, [expenseId]);
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const row = selectResult.rows[0];
      const processedRow = {
        ...row,
        date: row.date ? (typeof row.date === 'object' && row.date.toISOString ? row.date.toISOString().split('T')[0] : row.date.toString()) : null,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null,
        createdAt: row.createdAt ? (typeof row.createdAt === 'object' && row.createdAt.toISOString ? row.createdAt.toISOString() : row.createdAt.toString()) : null
      };
      
      return res.json({
        success: true,
        data: processedRow
      });
    } catch (error) {
      console.error('创建费用失败:', error);
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
        return res.status(400).json({
          success: false,
          message: '无效的审核状态'
        });
      }
      
      const sql = `
        UPDATE expenses
        SET 
          status = $1,
          approved_by = $2,
          approved_at = NOW(),
          review_comment = $3
        WHERE id = $4
        RETURNING id, title, status, approved_by as reviewer, approved_at as reviewDate, review_comment as reviewComment
      `;
      // 假设审核人是当前登录用户（使用用户ID 40）
      const reviewerId = 40; // 实际应用中应该从登录信息获取用户ID
      
      const result = await query(sql, [status, reviewerId, comment, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '费用不存在'
        });
      }
      
      // 处理日期字段，确保它们被正确序列化为字符串
      const row = result.rows[0];
      const processedRow = {
        ...row,
        reviewDate: row.reviewDate ? (typeof row.reviewDate === 'object' && row.reviewDate.toISOString ? row.reviewDate.toISOString() : row.reviewDate.toString()) : null
      };
      
      return res.json({
        success: true,
        data: processedRow
      });
    } catch (error) {
      console.error('审核费用失败:', error);
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
        return res.status(400).json({
          success: false,
          message: '缺少支付方式'
        });
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
        return res.status(400).json({
          success: false,
          message: '费用不存在或状态不正确'
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('支付费用失败:', error);
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
        return res.status(404).json({
          success: false,
          message: '费用不存在'
        });
      }
      
      return res.json({
        success: true,
        message: '费用删除成功'
      });
    } catch (error) {
      console.error('删除费用失败:', error);
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
        return res.status(400).json({
          success: false,
          message: '缺少有效的费用ID列表'
        });
      }
      
      const sql = `
        UPDATE expenses
        SET 
          status = 'approved',
          approved_by = $1,
          approved_at = NOW()
        WHERE id = ANY($2::int[])
        RETURNING id
      `;
      
      // 假设审核人是当前登录用户（使用用户ID 40）
      const reviewerId = 40; // 实际应用中应该从登录信息获取用户ID
            
      const result = await query(sql, [reviewerId, ids]);
      return res.json({
        success: true,
        data: {
          affectedIds: result.rows.map(row => row.id),
          message: `批量审核通过成功，共${result.rowCount}条记录`
        }
      });
    } catch (error) {
      console.error('批量审核通过失败:', error);
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
        return res.status(400).json({
          success: false,
          message: '缺少有效的费用ID列表'
        });
      }
      
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
      
      // 假设审核人是当前登录用户（使用用户ID 40）
      const reviewerId = 40; // 实际应用中应该从登录信息获取用户ID
            
      const result = await query(sql, [reviewerId, comment, ids]);
      return res.json({
        success: true,
        data: {
          affectedIds: result.rows.map(row => row.id),
          message: `批量拒绝成功，共${result.rowCount}条记录`
        }
      });
    } catch (error) {
      console.error('批量拒绝失败:', error);
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
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少有效的费用ID列表'
        });
      }
      
      const sql = `DELETE FROM expenses WHERE id = ANY($1::int[]) RETURNING id`;
      const result = await query(sql, [ids]);
      
      return res.json({
        success: true,
        data: {
          affectedIds: result.rows.map(row => row.id),
          message: `批量删除成功，共${result.rowCount}条记录`
        }
      });
    } catch (error) {
      console.error('批量删除失败:', error);
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
      let whereConditions = ' LEFT JOIN expense_categories ec ON e.category_id = ec.id';
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
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.date >= $${paramIndex}` : ` WHERE e.date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += whereConditions.includes('WHERE') ? ` AND e.date <= $${paramIndex}` : ` WHERE e.date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      // 查询费用数据
      const sql = `
        SELECT 
          e.id, e.title, e.description, e.amount, ec.category_name as category, e.applicant, e.date, e.status,
          e.approved_by as reviewer, e.approved_at as reviewDate, e.review_comment as reviewComment,
          e.created_at as createdAt
        FROM expenses e${whereConditions}
        ORDER BY e.created_at DESC
      `;
      
      const result = await query(sql, params);
      
      // 简单实现CSV导出
      if (format === 'csv') {
        // 设置响应头
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=expenses_${new Date().toISOString().split('T')[0]}.csv`);
        
        // 构建CSV内容
        const headers = ['ID', '标题', '描述', '金额', '类别', '申请人', '日期', '状态', '审核人', '审核日期', '审核意见', '创建时间'];
        const csvContent = [
          headers.join(','),
          ...result.rows.map(row => [
            row.id,
            `"${row.title}"`,
            `"${row.description || ''}"`,
            row.amount,
            row.category,
            row.applicant,
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
        return res.json({
          success: true,
          data: result.rows
        });
      }
    } catch (error) {
      console.error('导出费用数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 保存草稿
   * POST /api/expenses/draft
   */
  async saveDraft(req, res, next) {
    try {
      const { title, description, amount, category, date, dorm_id } = req.body;
      
      console.log('保存草稿请求参数:', req.body);
      
      // 验证必填字段
      if (!title) {
        console.log('标题不能为空');
        return res.status(400).json({
          success: false,
          message: '标题不能为空'
        });
      }
      
      if (!category) {
        console.log('类别不能为空');
        return res.status(400).json({
          success: false,
          message: '类别不能为空'
        });
      }
      
      // 从认证中间件获取当前登录用户信息
      const currentUser = req.user;
      if (!currentUser || !currentUser.id) {
        console.log('用户未认证');
        return res.status(401).json({
          success: false,
          message: '用户未认证，请先登录'
        });
      }
      
      const applicantId = currentUser.id;
      console.log('使用的申请人ID:', applicantId);
      
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
          console.log('用户未加入任何宿舍');
          return res.status(400).json({
            success: false,
            message: '用户未加入任何宿舍'
          });
        }
      }
      console.log('使用的宿舍ID:', dormId);
      
      // 查询费用类别ID
      console.log('查询费用类别:', category);
      const categoryQuery = await query(
        'SELECT id FROM expense_categories WHERE category_name = $1', 
        [category]
      );
      
      console.log('类别查询结果:', categoryQuery.rows);
      
      if (categoryQuery.rows.length === 0) {
        console.log('无效的费用类别:', category);
        return res.status(400).json({
          success: false,
          message: '无效的费用类别'
        });
      }
      
      const categoryId = categoryQuery.rows[0].id;
      console.log('获取到的categoryId:', categoryId);
      
      // 插入或更新草稿
      // 这里简化处理，直接插入新的草稿记录，使用数据库允许的status值'pending'
      const insertSql = `
        INSERT INTO expenses (title, description, amount, currency, category_id, applicant_id, dorm_id, expense_date, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())
        RETURNING id, title, description, amount, currency, category_id, applicant_id, dorm_id, expense_date as date, status, created_at, updated_at
      `;
      
      const insertParams = [title, description || '', amount || 0, 'CNY', categoryId, applicantId, dormId, date || new Date().toISOString().split('T')[0]];
      console.log('插入草稿SQL:', insertSql);
      console.log('插入草稿参数:', insertParams);
      
      const insertResult = await query(insertSql, insertParams);
      const draft = insertResult.rows[0];
      console.log('插入草稿成功:', draft);
      
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
      
      return res.json({
        success: true,
        data: returnData
      });
    } catch (error) {
      console.error('保存草稿失败:', error);
      // 更详细的错误信息
      if (error.code) {
        console.error('数据库错误代码:', error.code);
      }
      if (error.detail) {
        console.error('错误详情:', error.detail);
      }
      if (error.hint) {
        console.error('错误提示:', error.hint);
      }
      next(error);
    }
  }
}

module.exports = new ExpenseController();