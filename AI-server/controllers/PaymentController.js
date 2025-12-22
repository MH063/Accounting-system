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
      const { platform = '', status = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = 'WHERE user_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (platform) {
        whereConditions += ` AND platform = $${paramIndex}`;
        params.push(platform);
        paramIndex++;
      }
      
      if (status) {
        whereConditions += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      // 查询收款码数据
      const sql = `
        SELECT 
          id, name, type, amount, currency, description, status, usage_limit as usageLimit,
          usage_count as usageCount, created_at as createdAt, updated_at as updatedAt,
          expires_at as expiresAt, qr_code_url as qrCodeUrl, merchant_name as merchantName,
          merchant_account as merchantAccount, is_default as isDefault, tags,
          background_color as backgroundColor, logo_url as logoUrl, platform,
          is_user_uploaded as isUserUploaded
        FROM qr_codes
        ${whereConditions}
        ORDER BY created_at DESC
      `;
      
      const result = await query(sql, params);
      
      return res.json({
        success: true,
        data: result.rows,
        message: '获取收款码列表成功'
      });
    } catch (error) {
      console.error('获取收款码列表失败:', error);
      next(error);
    }
  }
  
  /**
   * 创建收款码
   * POST /api/qr-codes
   * 
   * 请求参数:
   * - name: 收款码名称
   * - type: 类型 (fixed/custom/dynamic)
   * - amount: 金额
   * - currency: 货币
   * - description: 描述
   * - platform: 支付平台
   * - merchantName: 商户名称
   * - merchantAccount: 商户账号
   * - isDefault: 是否默认
   * - tags: 标签
   * - backgroundColor: 背景颜色
   * - logoUrl: Logo地址
   * - expiresAt: 过期时间
   * - usageLimit: 使用限制
   * 
   * 返回结果:
   * - 创建的收款码
   */
  async createQRCode(req, res, next) {
    try {
      const {
        name, type = 'fixed', amount = 0, currency = 'CNY', description = '',
        platform, merchantName = '', merchantAccount = '', isDefault = false,
        tags = [], backgroundColor = '', logoUrl = '', expiresAt = null,
        usageLimit = null
      } = req.body;
      
      // 验证必填字段
      if (!name || !platform) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：name 和 platform'
        });
      }
      
      // 验证平台
      const validPlatforms = ['alipay', 'wechat', 'unionpay'];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({
          success: false,
          message: '无效的支付平台'
        });
      }
      
      // 验证类型
      const validTypes = ['fixed', 'custom', 'dynamic'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: '无效的收款码类型'
        });
      }
      
      // 如果设置了默认收款码，需要将其他收款码设为非默认
      if (isDefault) {
        await query(
          'UPDATE qr_codes SET is_default = false WHERE user_id = $1',
          [req.user.id]
        );
      }
      
      // 生成二维码URL（这里简化处理，实际应该生成真实的二维码）
      const qrCodeUrl = `/qrcodes/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      
      // 插入收款码数据
      const insertSql = `
        INSERT INTO qr_codes (
          name, type, amount, currency, description, platform, merchant_name,
          merchant_account, is_default, tags, background_color, logo_url,
          expires_at, usage_limit, qr_code_url, user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `;
      
      const result = await query(insertSql, [
        name, type, amount, currency, description, platform, merchantName,
        merchantAccount, isDefault, JSON.stringify(tags), backgroundColor, logoUrl,
        expiresAt, usageLimit, qrCodeUrl, req.user.id
      ]);
      
      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: '创建收款码成功'
      });
    } catch (error) {
      console.error('创建收款码失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取收款码详情
   * GET /api/qr-codes/:id
   * 
   * 返回结果:
   * - 收款码详情
   */
  async getQRCodeById(req, res, next) {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT 
          id, name, type, amount, currency, description, status, usage_limit as usageLimit,
          usage_count as usageCount, created_at as createdAt, updated_at as updatedAt,
          expires_at as expiresAt, qr_code_url as qrCodeUrl, merchant_name as merchantName,
          merchant_account as merchantAccount, is_default as isDefault, tags,
          background_color as backgroundColor, logo_url as logoUrl, platform,
          is_user_uploaded as isUserUploaded
        FROM qr_codes
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await query(sql, [id, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '收款码不存在'
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '获取收款码详情成功'
      });
    } catch (error) {
      console.error('获取收款码详情失败:', error);
      next(error);
    }
  }
  
  /**
   * 更新收款码
   * PUT /api/qr-codes/:id
   * 
   * 请求参数:
   * - name: 收款码名称
   * - type: 类型
   * - amount: 金额
   * - currency: 货币
   * - description: 描述
   * - status: 状态
   * - platform: 支付平台
   * - merchantName: 商户名称
   * - merchantAccount: 商户账号
   * - isDefault: 是否默认
   * - tags: 标签
   * - backgroundColor: 背景颜色
   * - logoUrl: Logo地址
   * - expiresAt: 过期时间
   * - usageLimit: 使用限制
   * 
   * 返回结果:
   * - 更新后的收款码
   */
  async updateQRCode(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name, type, amount, currency, description, status,
        platform, merchantName, merchantAccount, isDefault,
        tags, backgroundColor, logoUrl, expiresAt, usageLimit
      } = req.body;
      
      // 验证收款码是否存在
      const checkSql = 'SELECT id, is_default as isDefault FROM qr_codes WHERE id = $1 AND user_id = $2';
      const checkResult = await query(checkSql, [id, req.user.id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '收款码不存在'
        });
      }
      
      // 如果设置了默认收款码，需要将其他收款码设为非默认
      if (isDefault && !checkResult.rows[0].isDefault) {
        await query(
          'UPDATE qr_codes SET is_default = false WHERE user_id = $1',
          [req.user.id]
        );
      }
      
      // 构建更新语句
      let updateFields = [];
      let params = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }
      
      if (type !== undefined) {
        // 验证类型
        const validTypes = ['fixed', 'custom', 'dynamic'];
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: '无效的收款码类型'
          });
        }
        updateFields.push(`type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }
      
      if (amount !== undefined) {
        updateFields.push(`amount = $${paramIndex}`);
        params.push(amount);
        paramIndex++;
      }
      
      if (currency !== undefined) {
        updateFields.push(`currency = $${paramIndex}`);
        params.push(currency);
        paramIndex++;
      }
      
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }
      
      if (status !== undefined) {
        // 验证状态
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: '无效的状态'
          });
        }
        updateFields.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      if (platform !== undefined) {
        // 验证平台
        const validPlatforms = ['alipay', 'wechat', 'unionpay'];
        if (!validPlatforms.includes(platform)) {
          return res.status(400).json({
            success: false,
            message: '无效的支付平台'
          });
        }
        updateFields.push(`platform = $${paramIndex}`);
        params.push(platform);
        paramIndex++;
      }
      
      if (merchantName !== undefined) {
        updateFields.push(`merchant_name = $${paramIndex}`);
        params.push(merchantName);
        paramIndex++;
      }
      
      if (merchantAccount !== undefined) {
        updateFields.push(`merchant_account = $${paramIndex}`);
        params.push(merchantAccount);
        paramIndex++;
      }
      
      if (isDefault !== undefined) {
        updateFields.push(`is_default = $${paramIndex}`);
        params.push(isDefault);
        paramIndex++;
      }
      
      if (tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`);
        params.push(JSON.stringify(tags));
        paramIndex++;
      }
      
      if (backgroundColor !== undefined) {
        updateFields.push(`background_color = $${paramIndex}`);
        params.push(backgroundColor);
        paramIndex++;
      }
      
      if (logoUrl !== undefined) {
        updateFields.push(`logo_url = $${paramIndex}`);
        params.push(logoUrl);
        paramIndex++;
      }
      
      if (expiresAt !== undefined) {
        updateFields.push(`expires_at = $${paramIndex}`);
        params.push(expiresAt);
        paramIndex++;
      }
      
      if (usageLimit !== undefined) {
        updateFields.push(`usage_limit = $${paramIndex}`);
        params.push(usageLimit);
        paramIndex++;
      }
      
      // 如果没有任何字段需要更新
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有提供需要更新的字段'
        });
      }
      
      // 添加更新时间和ID参数
      params.push(new Date());
      params.push(id);
      params.push(req.user.id);
      
      const updateSql = `
        UPDATE qr_codes
        SET ${updateFields.join(', ')}, updated_at = $${paramIndex}
        WHERE id = $${paramIndex + 1} AND user_id = $${paramIndex + 2}
        RETURNING *
      `;
      
      const result = await query(updateSql, params);
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '更新收款码成功'
      });
    } catch (error) {
      console.error('更新收款码失败:', error);
      next(error);
    }
  }
  
  /**
   * 删除收款码
   * DELETE /api/qr-codes/:id
   * 
   * 返回结果:
   * - 删除结果
   */
  async deleteQRCode(req, res, next) {
    try {
      const { id } = req.params;
      
      // 检查收款码是否存在
      const checkSql = 'SELECT id FROM qr_codes WHERE id = $1 AND user_id = $2';
      const checkResult = await query(checkSql, [id, req.user.id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '收款码不存在'
        });
      }
      
      // 删除收款码
      const deleteSql = 'DELETE FROM qr_codes WHERE id = $1 AND user_id = $2';
      await query(deleteSql, [id, req.user.id]);
      
      return res.json({
        success: true,
        message: '删除收款码成功'
      });
    } catch (error) {
      console.error('删除收款码失败:', error);
      next(error);
    }
  }
  
  /**
   * 设置默认收款码
   * PUT /api/qr-codes/:id/default
   * 
   * 返回结果:
   * - 设置结果
   */
  async setDefaultQRCode(req, res, next) {
    try {
      const { id } = req.params;
      
      // 检查收款码是否存在
      const checkSql = 'SELECT id FROM qr_codes WHERE id = $1 AND user_id = $2';
      const checkResult = await query(checkSql, [id, req.user.id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '收款码不存在'
        });
      }
      
      // 将其他收款码设为非默认
      await query(
        'UPDATE qr_codes SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
      
      // 设置当前收款码为默认
      const updateSql = 'UPDATE qr_codes SET is_default = true WHERE id = $1 AND user_id = $2';
      await query(updateSql, [id, req.user.id]);
      
      return res.json({
        success: true,
        message: '设置默认收款码成功'
      });
    } catch (error) {
      console.error('设置默认收款码失败:', error);
      next(error);
    }
  }
  
  /**
   * 扫描支付二维码
   * POST /api/qr-codes/:id/scan
   * 
   * 请求参数:
   * - amount: 支付金额
   * - expenseId: 关联费用ID（可选）
   * - paymentMethod: 支付方式
   * 
   * 返回结果:
   * - 支付结果
   */
  async scanQRCode(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, expenseId, paymentMethod } = req.body;
      
      // 验证必填字段
      if (!amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：amount 和 paymentMethod'
        });
      }
      
      // 验证支付方式
      const validMethods = ['alipay', 'wechat', 'unionpay', 'bank', 'cash'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: '无效的支付方式'
        });
      }
      
      // 检查收款码是否存在且有效
      const checkSql = `
        SELECT id, status, usage_limit as usageLimit, usage_count as usageCount,
               expires_at as expiresAt, amount as fixedAmount, type
        FROM qr_codes
        WHERE id = $1 AND user_id = $2 AND status = 'active'
      `;
      const checkResult = await query(checkSql, [id, req.user.id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '收款码不存在或已失效'
        });
      }
      
      const qrCode = checkResult.rows[0];
      
      // 检查是否过期
      if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
        return res.status(400).json({
          success: false,
          message: '收款码已过期'
        });
      }
      
      // 检查使用次数限制
      if (qrCode.usageLimit && qrCode.usageCount >= qrCode.usageLimit) {
        return res.status(400).json({
          success: false,
          message: '收款码已达到使用次数限制'
        });
      }
      
      // 对于固定金额收款码，验证金额是否匹配
      if (qrCode.type === 'fixed' && amount !== qrCode.fixedAmount) {
        return res.status(400).json({
          success: false,
          message: '支付金额与固定金额收款码不匹配'
        });
      }
      
      // 开始事务
      await query('BEGIN');
      
      try {
        // 更新收款码使用次数
        const updateQrSql = `
          UPDATE qr_codes
          SET usage_count = usage_count + 1, updated_at = NOW()
          WHERE id = $1
        `;
        await query(updateQrSql, [id]);
        
        // 创建支付记录
        const insertRecordSql = `
          INSERT INTO qr_payment_records (
            qr_code_id, payer_id, amount, status, paid_at, transaction_id,
            payment_method, expense_id
          ) VALUES (
            $1, $2, $3, 'success', NOW(), $4, $5, $6
          ) RETURNING id
        `;
        
        // 生成交易ID
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const recordResult = await query(insertRecordSql, [
          id, req.user.id, amount, transactionId, paymentMethod, expenseId || null
        ]);
        
        // 如果有关联费用，更新费用状态
        if (expenseId) {
          const updateExpenseSql = `
            UPDATE expenses
            SET status = 'paid', payment_method = $1, payment_date = NOW(), amount = $2
            WHERE id = $3
          `;
          await query(updateExpenseSql, [paymentMethod, amount, expenseId]);
        }
        
        // 提交事务
        await query('COMMIT');
        
        return res.json({
          success: true,
          data: {
            transactionId,
            amount,
            paymentMethod,
            paidAt: new Date().toISOString(),
            qrPaymentRecordId: recordResult.rows[0].id
          },
          message: '支付成功'
        });
      } catch (error) {
        // 回滚事务
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('扫描支付二维码失败:', error);
      next(error);
    }
  }
  
  /**
   * 查询支付状态
   * GET /api/qr-codes/:id/status
   * 
   * 返回结果:
   * - 支付状态
   */
  async getPaymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      // 查询支付记录
      const sql = `
        SELECT 
          id, qr_code_id, payer_id, amount, status, paid_at as paidAt,
          transaction_id as transactionId, payment_method as paymentMethod,
          expense_id as expenseId, created_at as createdAt
        FROM qr_payment_records
        WHERE qr_code_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const result = await query(sql, [id]);
      
      return res.json({
        success: true,
        data: result.rows,
        message: '获取支付状态成功'
      });
    } catch (error) {
      console.error('查询支付状态失败:', error);
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