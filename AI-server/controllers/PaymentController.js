/**
 * 支付控制器
 * 提供支付相关功能
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');

class PaymentController extends BaseController {
  /**
   * 获取收款码列表
   * GET /api/payment/qrcodes
   * 
   * 请求参数:
   * - platform: 支付平台 (可选，alipay/wechat/unionpay)
   * - status: 状态 (可选，active/inactive)
   * 
   * 返回结果:
   * - 收款码列表
   */
  async getQRCodes(req, res, next) {
    try {
      // 由于目前数据库中尚未创建 payment_qrcodes 表，暂时返回空数据
      // TODO: 在后续版本中实现真正的收款码管理功能
      return res.json({
        success: true,
        data: [],
        message: '收款码功能尚未实现'
      });
      
      /*
      const { platform = '', status = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = '';
      let params = [];
      let paramIndex = 1;
      
      if (platform) {
        whereConditions += ` WHERE platform = $${paramIndex}`;
        params.push(platform);
        paramIndex++;
      }
      
      if (status) {
        whereConditions += whereConditions ? ` AND status = $${paramIndex}` : ` WHERE status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      // 查询收款码数据
      const sql = `
        SELECT 
          id, platform, qr_code_url as qrCodeUrl, status, is_user_uploaded as isUserUploaded,
          created_at as createdAt, updated_at as updatedAt
        FROM payment_qrcodes
        ${whereConditions}
        ORDER BY created_at DESC
      `;
      
      const result = await query(sql, params);
      
      return res.json({
        success: true,
        data: result.rows
      });
      */
    } catch (error) {
      console.error('获取收款码列表失败:', error);
      next(error);
    }
  }
  
  /**
   * 确认支付
   * POST /api/payment/confirm
   * 
   * 请求参数:
   * - expenseId: 费用ID
   * - paymentMethod: 支付方式
   * - amount: 支付金额
   * - transactionId: 交易ID (可选)
   * 
   * 返回结果:
   * - 支付结果
   */
  async confirmPayment(req, res, next) {
    try {
      const { expenseId, paymentMethod, amount, transactionId = '' } = req.body;
      
      // 验证必填字段
      if (!expenseId || !paymentMethod || !amount) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }
      
      // 开始事务
      await query('BEGIN');
      
      try {
        // 更新费用状态为已支付
        const updateExpenseSql = `
          UPDATE expenses
          SET 
            status = 'paid',
            payment_method = $1,
            payment_date = NOW(),
            amount = $2
          WHERE id = $3
          RETURNING id, title, status, amount
        `;
        
        const expenseResult = await query(updateExpenseSql, [paymentMethod, amount, expenseId]);
        
        if (expenseResult.rows.length === 0) {
          await query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: '费用不存在'
          });
        }
        
        // 记录支付日志
        const logSql = `
          INSERT INTO payment_logs (
            expense_id, payment_method, amount, transaction_id, status, created_at
          ) VALUES (
            $1, $2, $3, $4, 'success', NOW()
          )
        `;
        
        await query(logSql, [expenseId, paymentMethod, amount, transactionId]);
        
        // 提交事务
        await query('COMMIT');
        
        return res.json({
          success: true,
          data: {
            expense: expenseResult.rows[0],
            message: '支付确认成功'
          }
        });
      } catch (error) {
        // 回滚事务
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('确认支付失败:', error);
      next(error);
    }
  }
}

module.exports = new PaymentController();