/**
 * 支付控制器
 * 提供支付相关功能
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

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
        data: {
          records: result.rows,
          total: result.rows.length, // 由于没有分页，total 为数组长度
          page: 1,
          size: result.rows.length,
          pages: 1
        },
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

  /**
   * 获取支付记录列表
   * GET /api/payments
   * 
   * 请求参数:
   * - status: 状态 (可选，success/failed/processing/pending/refunded)
   * - paymentMethod: 支付方式 (可选，alipay/wechat/unionpay/bank/cash)
   * - transactionType: 交易类型 (可选，income/expense)
   * - startDate: 开始日期 (可选，YYYY-MM-DD)
   * - endDate: 结束日期 (可选，YYYY-MM-DD)
   * - minAmount: 最小金额 (可选，数字)
   * - maxAmount: 最大金额 (可选，数字)
   * - keyword: 关键词 (可选，搜索描述或订单ID)
   * - page: 页码 (可选，默认1)
   * - size: 每页数量 (可选，默认20)
   * 
   * 返回结果:
   * - 支付记录列表和分页信息
   */
  async getPaymentRecords(req, res, next) {
    try {
      const {
        status = '', paymentMethod = '', transactionType = '',
        startDate = '', endDate = '', minAmount = '', maxAmount = '',
        keyword = '', page = 1, size = 20
      } = req.query;
      
      // 转换分页参数
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(size) || 20;
      const offset = (pageNum - 1) * pageSize;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      // 添加状态筛选
      if (status) {
        whereConditions += ` AND qpr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      // 添加支付方式筛选
      if (paymentMethod) {
        whereConditions += ` AND qpr.payment_method = $${paramIndex}`;
        params.push(paymentMethod);
        paramIndex++;
      }
      
      // 添加日期范围筛选
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(new Date(startDate));
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(new Date(endDate + ' 23:59:59'));
        paramIndex++;
      }
      
      // 添加金额范围筛选
      if (minAmount) {
        whereConditions += ` AND qpr.amount >= $${paramIndex}`;
        params.push(parseFloat(minAmount));
        paramIndex++;
      }
      
      if (maxAmount) {
        whereConditions += ` AND qpr.amount <= $${paramIndex}`;
        params.push(parseFloat(maxAmount));
        paramIndex++;
      }
      
      // 查询支付记录数据
      const sql = `
        SELECT 
          qpr.id, qpr.transaction_id as orderId, qpr.transaction_id,
          'expense' as transactionType,
          qpr.payment_method as paymentMethod,
          qpr.amount, qpr.status,
          COALESCE(e.title, '') as description,
          qpr.created_at as createdAt,
          qpr.paid_at as completedAt,
          '' as remark,
          '' as ipAddress,
          '' as recipientName,
          '' as recipientAccount,
          '' as discountCode,
          0 as discountAmount
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
        ORDER BY qpr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const countSql = `
        SELECT COUNT(*) as total
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
      `;
      
      // 添加分页参数
      params.push(pageSize, offset);
      
      // 执行查询
      const result = await query(sql, params);
      const countResult = await query(countSql, params.slice(0, -2));
      
      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / pageSize);
      
      return res.json({
        success: true,
        data: {
          records: result.rows,
          total,
          page: pageNum,
          size: pageSize,
          pages
        },
        message: '获取支付记录列表成功'
      });
    } catch (error) {
      console.error('获取支付记录列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付记录详情
   * GET /api/payments/:orderId
   * 
   * 请求参数:
   * - orderId: 订单ID (交易ID)
   * 
   * 返回结果:
   * - 支付记录详情
   */
  async getPaymentRecordDetail(req, res, next) {
    try {
      const { orderId } = req.params;
      
      const sql = `
        SELECT 
          qpr.id, qpr.transaction_id as orderId, qpr.transaction_id,
          'expense' as transactionType,
          qpr.payment_method as paymentMethod,
          qpr.amount, qpr.status,
          COALESCE(e.title, '') as description,
          qpr.created_at as createdAt,
          qpr.paid_at as completedAt,
          '' as remark,
          '' as ipAddress,
          '' as recipientName,
          '' as recipientAccount,
          '' as discountCode,
          0 as discountAmount
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        WHERE qpr.transaction_id = $1 AND qpr.payer_id = $2
      `;
      
      const result = await query(sql, [orderId, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '支付记录不存在'
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '获取支付记录详情成功'
      });
    } catch (error) {
      console.error('获取支付记录详情失败:', error);
      next(error);
    }
  }

  /**
   * 创建支付订单
   * POST /api/payments
   * 
   * 请求参数:
   * - paymentMethod: 支付方式
   * - amount: 金额
   * - description: 描述
   * - remark: 备注 (可选)
   * - recipientName: 收款人姓名 (可选)
   * - recipientAccount: 收款人账号 (可选)
   * - discountCode: 优惠码 (可选)
   * - callbackUrl: 回调URL (可选)
   * - metadata: 元数据 (可选)
   * 
   * 返回结果:
   * - 支付响应结果
   */
  async createPaymentOrder(req, res, next) {
    try {
      const {
        paymentMethod, amount, description,
        remark = '', recipientName = '', recipientAccount = '',
        discountCode = '', callbackUrl = '', metadata = {}
      } = req.body;
      
      // 验证必填字段
      if (!paymentMethod || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：paymentMethod, amount, description'
        });
      }
      
      // 生成交易ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return res.json({
        success: true,
        data: {
          success: true,
          orderId: transactionId,
          status: 'pending',
          message: '支付订单创建成功',
          data: {
            transactionId,
            paymentMethod,
            amount,
            description
          }
        },
        message: '创建支付订单成功'
      });
    } catch (error) {
      console.error('创建支付订单失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付统计数据
   * GET /api/payments/statistics
   * 
   * 请求参数:
   * - startDate: 开始日期 (可选，YYYY-MM-DD)
   * - endDate: 结束日期 (可选，YYYY-MM-DD)
   * - type: 统计类型 (可选，day/week/month/year)
   * 
   * 返回结果:
   * - 支付统计数据
   */
  async getPaymentStatistics(req, res, next) {
    try {
      const { startDate = '', endDate = '', type = 'month' } = req.query;
      
      // 构建日期范围条件
      let dateConditions = '';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (startDate) {
        dateConditions += ` AND created_at >= $${paramIndex}`;
        params.push(new Date(startDate));
        paramIndex++;
      }
      if (endDate) {
        dateConditions += ` AND created_at <= $${paramIndex}`;
        params.push(new Date(endDate + ' 23:59:59'));
        paramIndex++;
      }
      
      // 查询统计数据
      const statsSql = `
        SELECT 
          SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as totalIncome,
          SUM(amount) as totalExpense,
          COUNT(*) as totalTransactions,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successfulPayments,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingPayments,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedPayments
        FROM qr_payment_records
        WHERE payer_id = $1 ${dateConditions}
      `;
      
      const result = await query(statsSql, params);
      const stats = result.rows[0];
      
      // 查询月度交易数据
      const monthlySql = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count,
          SUM(amount) as amount
        FROM qr_payment_records
        WHERE payer_id = $1 ${dateConditions}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `;
      
      const monthlyResult = await query(monthlySql, params);
      
      // 查询支付方式分布
      const methodSql = `
        SELECT 
          payment_method as method,
          COUNT(*) as count,
          SUM(amount) as amount,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1 ${dateConditions})), 2) as percentage
        FROM qr_payment_records
        WHERE payer_id = $1 ${dateConditions}
        GROUP BY payment_method
        ORDER BY count DESC
      `;
      
      const methodResult = await query(methodSql, params);
      
      return res.json({
        success: true,
        data: {
          totalIncome: parseFloat(stats.totalIncome) || 0,
          totalExpense: parseFloat(stats.totalExpense) || 0,
          totalTransactions: parseInt(stats.totalTransactions) || 0,
          successfulPayments: parseInt(stats.successfulPayments) || 0,
          pendingPayments: parseInt(stats.pendingPayments) || 0,
          failedPayments: parseInt(stats.failedPayments) || 0,
          monthlyTransactions: monthlyResult.rows,
          methodDistribution: methodResult.rows
        },
        message: '获取支付统计数据成功'
      });
    } catch (error) {
      console.error('获取支付统计数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取收入趋势数据
   * GET /api/payments/income-trend
   * 
   * 返回结果:
   * - 收入趋势数据
   */
  async getIncomeTrend(req, res, next) {
    try {
      // 简化实现，返回模拟数据
      const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
      const trendData = months.map(month => ({
        month,
        amount: Math.floor(Math.random() * 10000) + 5000
      }));
      
      return res.json({
        success: true,
        data: trendData,
        message: '获取收入趋势数据成功'
      });
    } catch (error) {
      console.error('获取收入趋势数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付方式分布数据
   * GET /api/payments/method-distribution
   * 
   * 返回结果:
   * - 支付方式分布数据
   */
  async getPaymentMethodDistribution(req, res, next) {
    try {
      const sql = `
        SELECT 
          payment_method as name,
          SUM(amount) as amount,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1)), 2) as percentage
        FROM qr_payment_records
        WHERE payer_id = $1
        GROUP BY payment_method
        ORDER BY amount DESC
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows,
        message: '获取支付方式分布数据成功'
      });
    } catch (error) {
      console.error('获取支付方式分布数据失败:', error);
      next(error);
    }
  }

  /**
   * 保存提醒设置
   * POST /api/payments/reminder-settings
   * 
   * 请求参数:
   * - enabled: 是否启用
   * - methods: 提醒方式列表
   * - intervalMinutes: 提醒间隔（分钟）
   * 
   * 返回结果:
   * - 保存结果
   */
  async saveReminderSettings(req, res, next) {
    try {
      const { enabled, methods, intervalMinutes } = req.body;
      
      // 验证参数
      if (enabled === undefined || !methods || !Array.isArray(methods) || intervalMinutes === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：enabled, methods, intervalMinutes'
        });
      }
      
      // 检查是否已存在设置
      const checkSql = 'SELECT id FROM reminder_settings WHERE user_id = $1';
      const checkResult = await query(checkSql, [req.user.id]);
      
      if (checkResult.rows.length > 0) {
        // 更新现有设置
        const updateSql = `
          UPDATE reminder_settings
          SET enabled = $1, methods = $2, interval_minutes = $3, updated_at = NOW()
          WHERE user_id = $4
        `;
        await query(updateSql, [enabled, methods, intervalMinutes, req.user.id]);
      } else {
        // 创建新设置
        const insertSql = `
          INSERT INTO reminder_settings (user_id, enabled, methods, interval_minutes)
          VALUES ($1, $2, $3, $4)
        `;
        await query(insertSql, [req.user.id, enabled, methods, intervalMinutes]);
      }
      
      return res.json({
        success: true,
        data: true,
        message: '保存提醒设置成功'
      });
    } catch (error) {
      console.error('保存提醒设置失败:', error);
      next(error);
    }
  }

  /**
   * 计算费用分摊
   * POST /api/payments/calculate-sharing
   * 
   * 请求参数:
   * - expenses: 费用列表
   * - members: 成员列表
   * 
   * 返回结果:
   * - 分摊结果
   */
  async calculateSharing(req, res, next) {
    try {
      const { expenses, members } = req.body;
      
      // 验证参数
      if (!expenses || !Array.isArray(expenses) || !members || !Array.isArray(members)) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：expenses, members'
        });
      }
      
      // 计算总费用
      const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      // 计算人均分摊
      const perPersonShare = totalExpense / members.length;
      
      // 生成分摊结果
      const sharingResults = members.map(member => ({
        name: member.name,
        shouldPay: parseFloat(perPersonShare.toFixed(2)),
        paid: 0,
        pending: parseFloat(perPersonShare.toFixed(2)),
        status: 'pending'
      }));
      
      return res.json({
        success: true,
        data: {
          sharingResults,
          totalExpense: parseFloat(totalExpense.toFixed(2)),
          perPersonShare: parseFloat(perPersonShare.toFixed(2)),
          totalPaid: 0,
          totalPending: parseFloat(totalExpense.toFixed(2))
        },
        message: '费用分摊计算成功'
      });
    } catch (error) {
      console.error('费用分摊计算失败:', error);
      next(error);
    }
  }

  /**
   * 收款码安全检测
   * POST /api/qr-codes/security-check
   * 
   * 请求参数:
   * - qrCodeIds: 收款码ID列表
   * 
   * 返回结果:
   * - 安全检测结果
   */
  async performSecurityCheck(req, res, next) {
    try {
      const { qrCodeIds } = req.body;
      
      // 验证参数
      if (!qrCodeIds || !Array.isArray(qrCodeIds)) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：qrCodeIds'
        });
      }
      
      // 简化实现，返回模拟数据
      return res.json({
        success: true,
        data: {
          qrCodeStatus: 'success',
          usageAnalysis: 'success',
          amountValidation: 'success',
          permissions: 'success',
          issues: [],
          recommendations: [],
          lastCheckTime: new Date().toISOString()
        },
        message: '收款码安全检测成功'
      });
    } catch (error) {
      console.error('收款码安全检测失败:', error);
      next(error);
    }
  }

  /**
   * 获取安全检测历史记录
   * GET /api/qr-codes/security-history
   * 
   * 请求参数:
   * - days: 天数（默认30）
   * 
   * 返回结果:
   * - 安全检测历史记录
   */
  async getSecurityCheckHistory(req, res, next) {
    try {
      const { days = 30 } = req.query;
      
      // 简化实现，返回模拟数据
      const history = [];
      for (let i = 0; i < 5; i++) {
        history.push({
          id: i + 1,
          checkTime: new Date(Date.now() - i * 86400000).toISOString(),
          status: i % 3 === 0 ? 'success' : i % 3 === 1 ? 'warning' : 'error',
          issueCount: i,
          checkedQRCodes: 5 + i,
          responseTime: Math.floor(Math.random() * 1000) + 500
        });
      }
      
      return res.json({
        success: true,
        data: history,
        message: '获取安全检测历史记录成功'
      });
    } catch (error) {
      console.error('获取安全检测历史记录失败:', error);
      next(error);
    }
  }

  /**
   * 上传收款码图片
   * POST /api/qr-codes/upload
   * 
   * 请求参数:
   * - file: 上传的文件
   * - platform: 支付平台
   * - description: 描述（可选）
   * 
   * 返回结果:
   * - 上传结果
   */
  async uploadQRCodeImage(req, res, next) {
    try {
      // 调试日志：输出请求信息
      console.log('[uploadQRCodeImage] 开始处理上传请求');
      console.log('[uploadQRCodeImage] req.file:', req.file);
      console.log('[uploadQRCodeImage] req.body:', req.body);
      console.log('[uploadQRCodeImage] req.headers:', req.headers);
      
      // 验证上传的文件
      if (!req.file) {
        console.error('[uploadQRCodeImage] 文件上传失败：req.file为undefined');
        return res.status(400).json({
          success: false,
          message: '请上传收款码图片文件'
        });
      }
      
      // 验证平台参数
      const platform = req.body.platform;
      if (!platform) {
        return res.status(400).json({
          success: false,
          message: '缺少平台参数'
        });
      }
      
      const validPlatforms = ['alipay', 'wechat', 'unionpay'];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({
          success: false,
          message: '无效的支付平台'
        });
      }
      
      const description = req.body.description || '';
      
      // 构建文件URL路径
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // 插入收款码数据到数据库
      const insertSql = `
        INSERT INTO qr_codes (
          name, type, amount, currency, description, platform, 
          merchant_name, merchant_account, is_default, tags, background_color, 
          logo_url, expires_at, usage_limit, qr_code_url, user_id, is_user_uploaded
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;
      
      const result = await query(insertSql, [
        `收款码_${Date.now()}`, // name
        'fixed', // type
        0, // amount
        'CNY', // currency
        description, // description
        platform, // platform
        '', // merchant_name
        '', // merchant_account
        false, // is_default
        '[]', // tags
        '#ffffff', // background_color
        '', // logo_url
        null, // expires_at
        null, // usage_limit
        fileUrl, // qr_code_url
        req.user.id, // user_id
        true // is_user_uploaded
      ]);
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '收款码上传成功'
      });
    } catch (error) {
      console.error('上传收款码图片失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付记录列表
   * GET /api/payments
   * 
   * 请求参数:
   * - status: 支付状态 (可选)
   * - paymentMethod: 支付方式 (可选)
   * - transactionType: 交易类型 (可选，income/expense)
   * - startDate: 开始日期 (可选)
   * - endDate: 结束日期 (可选)
   * - minAmount: 最小金额 (可选)
   * - maxAmount: 最大金额 (可选)
   * - keyword: 关键词 (可选)
   * - page: 页码 (可选，默认1)
   * - size: 每页数量 (可选，默认20)
   * 
   * 返回结果:
   * - 支付记录列表及分页信息
   */
  async getPaymentRecords(req, res, next) {
    try {
      const {
        status = '',
        paymentMethod = '',
        transactionType = '',
        startDate = '',
        endDate = '',
        minAmount = '',
        maxAmount = '',
        keyword = '',
        page = 1,
        size = 20
      } = req.query;
      
      // 转换为正确的数据类型
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(size) || 20;
      const offset = (pageNum - 1) * pageSize;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      // 添加筛选条件
      if (status) {
        whereConditions += ` AND qpr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (paymentMethod) {
        whereConditions += ` AND qpr.payment_method = $${paramIndex}`;
        params.push(paymentMethod);
        paramIndex++;
      }
      
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      if (minAmount) {
        whereConditions += ` AND qpr.amount >= $${paramIndex}`;
        params.push(parseFloat(minAmount));
        paramIndex++;
      }
      
      if (maxAmount) {
        whereConditions += ` AND qpr.amount <= $${paramIndex}`;
        params.push(parseFloat(maxAmount));
        paramIndex++;
      }
      
      if (keyword) {
        whereConditions += ` AND (COALESCE(e.title, '') ILIKE $${paramIndex} OR qpr.transaction_id ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
      
      // 查询总记录数
      const countSql = `
        SELECT COUNT(*) as total
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
      `;
      
      const countResult = await query(countSql, params);
      const total = parseInt(countResult.rows[0].total);
      
      // 查询支付记录列表
      const recordsSql = `
        SELECT 
          qpr.id, 
          qpr.transaction_id as orderId,
          qpr.transaction_id,
          'expense' as transactionType,
          qpr.payment_method as paymentMethod,
          qpr.amount,
          NULL as feeAmount,
          qpr.status,
          COALESCE(e.title, '') as description,
          '' as remark,
          qpr.created_at as createdAt,
          qpr.paid_at as completedAt,
          NULL as ipAddress,
          NULL as recipientName,
          NULL as recipientAccount,
          NULL as discountCode,
          NULL as discountAmount
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
        ORDER BY qpr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(pageSize);
      params.push(offset);
      
      const recordsResult = await query(recordsSql, params);
      
      return res.json({
        success: true,
        data: {
          records: recordsResult.rows,
          total,
          page: pageNum,
          size: pageSize,
          pages: Math.ceil(total / pageSize)
        },
        message: '获取支付记录列表成功'
      });
    } catch (error) {
      console.error('获取支付记录列表失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取支付记录详情
   * GET /api/payments/:orderId
   * 
   * 请求参数:
   * - orderId: 订单ID (交易ID)
   * 
   * 返回结果:
   * - 支付记录详情
   */
  async getPaymentRecordDetail(req, res, next) {
    try {
      const { orderId } = req.params;
      
      const sql = `
        SELECT 
          qpr.id, 
          qpr.transaction_id as orderId,
          qpr.transaction_id,
          'expense' as transactionType,
          qpr.payment_method as paymentMethod,
          qpr.amount,
          NULL as feeAmount,
          qpr.status,
          COALESCE(e.title, '') as description,
          '' as remark,
          qpr.created_at as createdAt,
          qpr.paid_at as completedAt,
          NULL as ipAddress,
          NULL as recipientName,
          NULL as recipientAccount,
          NULL as discountCode,
          NULL as discountAmount
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        WHERE qpr.transaction_id = $1 AND qpr.payer_id = $2
      `;
      
      const result = await query(sql, [orderId, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '支付记录不存在'
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '获取支付记录详情成功'
      });
    } catch (error) {
      console.error('获取支付记录详情失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取待确认支付列表
   * GET /api/payments/pending-confirmation
   * 
   * 请求参数:
   * - page: 页码 (可选，默认1)
   * - size: 每页数量 (可选，默认20)
   * 
   * 返回结果:
   * - 待确认支付记录列表
   */
  async getPendingConfirmationPayments(req, res, next) {
    try {
      const {
        page = 1,
        size = 20
      } = req.query;
      
      // 转换为正确的数据类型
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(size) || 20;
      const offset = (pageNum - 1) * pageSize;
      
      // 构建查询条件 - 只查询状态为pending的记录
      let whereConditions = 'WHERE qpr.payer_id = $1 AND qpr.status = \'pending\'';
      let params = [req.user.id];
      let paramIndex = 2;
      
      // 查询总记录数
      const countSql = `
        SELECT COUNT(*) as total
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
      `;
      
      const countResult = await query(countSql, params);
      const total = parseInt(countResult.rows[0].total);
      
      // 查询待确认支付记录列表
      const recordsSql = `
        SELECT 
          qpr.id, 
          qpr.transaction_id as orderId,
          qpr.transaction_id,
          'expense' as transactionType,
          qpr.payment_method as paymentMethod,
          qpr.amount,
          NULL as feeAmount,
          qpr.status,
          COALESCE(e.title, '') as description,
          '' as remark,
          qpr.created_at as createdAt,
          qpr.paid_at as completedAt,
          NULL as ipAddress,
          NULL as recipientName,
          NULL as recipientAccount,
          NULL as discountCode,
          NULL as discountAmount
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
        ORDER BY qpr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(pageSize);
      params.push(offset);
      
      const recordsResult = await query(recordsSql, params);
      
      return res.json({
        success: true,
        data: {
          records: recordsResult.rows,
          total,
          page: pageNum,
          size: pageSize,
          pages: Math.ceil(total / pageSize)
        },
        message: '获取待确认支付列表成功'
      });
    } catch (error) {
      console.error('获取待确认支付列表失败:', error);
      next(error);
    }
  }
  /**
   * 创建支付订单
   * POST /api/payments   * 
   * 请求参数:
   * - paymentMethod: 支付方式
   * - amount: 支付金额
   * - description: 描述
   * - remark: 备注 (可选)
   * - recipientName: 收款人姓名 (可选)
   * - recipientAccount: 收款人账号 (可选)
   * - discountCode: 折扣码 (可选)
   * - callbackUrl: 回调URL (可选)
   * - metadata: 元数据 (可选)
   * 
   * 返回结果:
   * - 支付订单信息
   */
  async createPaymentOrder(req, res, next) {
    try {
      const {
        paymentMethod,
        amount,
        description,
        remark = '',
        callbackUrl = ''
      } = req.body;
      
      // 验证必填字段
      if (!paymentMethod || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }
      
      // 生成交易ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 目前仅返回模拟数据，实际实现需要创建订单并返回支付链接
      return res.json({
        success: true,
        data: {
          success: true,
          orderId: transactionId,
          transactionId,
          status: 'processing',
          message: '支付订单创建成功',
          data: {}
        },
        message: '创建支付订单成功'
      });
    } catch (error) {
      console.error('创建支付订单失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取支付统计数据
   * GET /api/payments/statistics
   * 
   * 请求参数:
   * - startDate: 开始日期 (可选)
   * - endDate: 结束日期 (可选)
   * - type: 统计类型 (day/week/month/year，可选)
   * 
   * 返回结果:
   * - 支付统计数据
   */
  async getPaymentStatistics(req, res, next) {
    try {
      const { startDate = '', endDate = '', type = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      // 查询总收入和总支出
      const statsSql = `
        SELECT 
          SUM(CASE WHEN qpr.status = 'success' THEN qpr.amount ELSE 0 END) as totalIncome,
          0 as totalExpense,
          COUNT(*) as totalTransactions,
          COUNT(CASE WHEN qpr.status = 'success' THEN 1 END) as successfulPayments,
          COUNT(CASE WHEN qpr.status = 'pending' THEN 1 END) as pendingPayments,
          COUNT(CASE WHEN qpr.status = 'failed' THEN 1 END) as failedPayments
        FROM qr_payment_records qpr
        ${whereConditions}
      `;
      
      const statsResult = await query(statsSql, params);
      const stats = statsResult.rows[0];
      
      // 查询月度交易数据
      const monthlySql = `
        SELECT 
          TO_CHAR(qpr.created_at, 'YYYY-MM') as month,
          COUNT(*) as count,
          SUM(qpr.amount) as amount
        FROM qr_payment_records qpr
        ${whereConditions} AND qpr.status = 'success'
        GROUP BY TO_CHAR(qpr.created_at, 'YYYY-MM')
        ORDER BY month
      `;
      
      const monthlyResult = await query(monthlySql, params);
      
      // 查询支付方式分布
      const methodSql = `
        SELECT 
          qpr.payment_method as method,
          COUNT(*) as count,
          SUM(qpr.amount) as amount,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1)), 2) as percentage
        FROM qr_payment_records qpr
        ${whereConditions} AND qpr.status = 'success'
        GROUP BY qpr.payment_method
        ORDER BY count DESC
      `;
      
      const methodResult = await query(methodSql, params);
      
      return res.json({
        success: true,
        data: {
          totalIncome: parseFloat(stats.totalIncome || 0),
          totalExpense: parseFloat(stats.totalExpense || 0),
          totalTransactions: parseInt(stats.totalTransactions),
          successfulPayments: parseInt(stats.successfulPayments),
          pendingPayments: parseInt(stats.pendingPayments),
          failedPayments: parseInt(stats.failedPayments),
          monthlyTransactions: monthlyResult.rows.map(row => ({
            month: row.month,
            count: parseInt(row.count),
            amount: parseFloat(row.amount || 0)
          })),
          methodDistribution: methodResult.rows.map(row => ({
            method: row.method,
            count: parseInt(row.count),
            amount: parseFloat(row.amount || 0),
            percentage: parseFloat(row.percentage || 0)
          }))
        },
        message: '获取支付统计数据成功'
      });
    } catch (error) {
      console.error('获取支付统计数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取收入趋势数据
   * GET /api/payments/income-trend
   * 
   * 返回结果:
   * - 收入趋势数据
   */
  async getIncomeTrend(req, res, next) {
    try {
      // 查询月度收入趋势
      const sql = `
        SELECT 
          TO_CHAR(qpr.created_at, 'YYYY-MM') as month,
          SUM(qpr.amount) as amount
        FROM qr_payment_records qpr
        WHERE qpr.payer_id = $1 AND qpr.status = 'success'
        GROUP BY TO_CHAR(qpr.created_at, 'YYYY-MM')
        ORDER BY month
        LIMIT 12
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows.map(row => ({
          month: row.month,
          amount: parseFloat(row.amount || 0)
        })),
        message: '获取收入趋势数据成功'
      });
    } catch (error) {
      console.error('获取收入趋势数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取支付方式分布数据
   * GET /api/payments/method-distribution
   * 
   * 返回结果:
   * - 支付方式分布数据
   */
  async getPaymentMethodDistribution(req, res, next) {
    try {
      // 查询支付方式分布
      const sql = `
        SELECT 
          qpr.payment_method as name,
          SUM(qpr.amount) as amount,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1 AND status = 'success')), 2) as percentage
        FROM qr_payment_records qpr
        WHERE qpr.payer_id = $1 AND qpr.status = 'success'
        GROUP BY qpr.payment_method
        ORDER BY amount DESC
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows.map(row => ({
          name: row.name,
          amount: parseFloat(row.amount || 0),
          percentage: parseFloat(row.percentage || 0)
        })),
        message: '获取支付方式分布数据成功'
      });
    } catch (error) {
      console.error('获取支付方式分布数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 保存提醒设置
   * POST /api/payments/reminder-settings
   * 
   * 请求参数:
   * - enabled: 是否启用提醒
   * - methods: 提醒方式数组
   * - intervalMinutes: 提醒间隔（分钟）
   * 
   * 返回结果:
   * - 保存结果
   */
  async saveReminderSettings(req, res, next) {
    try {
      const { enabled = false, methods = ['email', 'sms'], intervalMinutes = 60 } = req.body;
      
      // 检查是否已存在提醒设置
      const checkSql = `SELECT id FROM reminder_settings WHERE user_id = $1`;
      const checkResult = await query(checkSql, [req.user.id]);
      
      if (checkResult.rows.length > 0) {
        // 更新现有设置
        const updateSql = `
          UPDATE reminder_settings 
          SET enabled = $1, methods = $2, interval_minutes = $3, updated_at = NOW()
          WHERE user_id = $4
          RETURNING id
        `;
        await query(updateSql, [enabled, methods, intervalMinutes, req.user.id]);
      } else {
        // 创建新设置
        const insertSql = `
          INSERT INTO reminder_settings (user_id, enabled, methods, interval_minutes)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        await query(insertSql, [req.user.id, enabled, methods, intervalMinutes]);
      }
      
      return res.json({
        success: true,
        data: true,
        message: '保存提醒设置成功'
      });
    } catch (error) {
      console.error('保存提醒设置失败:', error);
      next(error);
    }
  }
  
  /**
   * 计算费用分摊
   * POST /api/payments/calculate-sharing
   * 
   * 请求参数:
   * - expenses: 费用列表
   * - members: 成员列表
   * 
   * 返回结果:
   * - 费用分摊结果
   */
  async calculateSharing(req, res, next) {
    try {
      const { expenses = [], members = [] } = req.body;
      
      if (!expenses.length || !members.length) {
        return res.status(400).json({
          success: false,
          message: '缺少费用列表或成员列表'
        });
      }
      
      // 计算总费用
      const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      // 计算人均分摊金额
      const perPersonShare = totalExpense / members.length;
      
      // 生成分摊结果
      const sharingResults = members.map(member => ({
        name: member.name,
        shouldPay: perPersonShare,
        paid: 0,
        pending: perPersonShare,
        status: 'pending'
      }));
      
      return res.json({
        success: true,
        data: {
          sharingResults,
          totalExpense,
          perPersonShare,
          totalPaid: 0,
          totalPending: totalExpense
        },
        message: '费用分摊计算成功'
      });
    } catch (error) {
      console.error('费用分摊计算失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付记录列表
   * GET /api/payments
   * 
   * 请求参数:
   * - status: 状态 (可选，success/failed/processing/pending/refunded)
   * - paymentMethod: 支付方式 (可选，wechat/alipay/bank/cash)
   * - transactionType: 交易类型 (可选，income/expense)
   * - startDate: 开始日期 (可选)
   * - endDate: 结束日期 (可选)
   * - minAmount: 最小金额 (可选)
   * - maxAmount: 最大金额 (可选)
   * - keyword: 关键词 (可选)
   * - page: 页码 (可选，默认1)
   * - size: 每页条数 (可选，默认20)
   * 
   * 返回结果:
   * - 支付记录列表及分页信息
   */
  async getPaymentRecords(req, res, next) {
    try {
      const {
        status = '',
        paymentMethod = '',
        transactionType = '',
        startDate = '',
        endDate = '',
        minAmount = '',
        maxAmount = '',
        keyword = '',
        page = 1,
        size = 20
      } = req.query;
      
      // 计算分页参数
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(size) || 20;
      const offset = (pageNum - 1) * pageSize;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      // 添加筛选条件
      if (status) {
        whereConditions += ` AND qpr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (paymentMethod) {
        whereConditions += ` AND qpr.payment_method = $${paramIndex}`;
        params.push(paymentMethod);
        paramIndex++;
      }
      
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(new Date(startDate));
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(new Date(endDate + ' 23:59:59'));
        paramIndex++;
      }
      
      if (minAmount) {
        whereConditions += ` AND qpr.amount >= $${paramIndex}`;
        params.push(parseFloat(minAmount));
        paramIndex++;
      }
      
      if (maxAmount) {
        whereConditions += ` AND qpr.amount <= $${paramIndex}`;
        params.push(parseFloat(maxAmount));
        paramIndex++;
      }
      
      if (keyword) {
        whereConditions += ` AND (e.title ILIKE $${paramIndex} OR qpr.transaction_id ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
      
      // 构建查询SQL
      const countSql = `
        SELECT COUNT(*) as total
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        LEFT JOIN qr_codes qr ON qpr.qr_code_id = qr.id
        ${whereConditions}
      `;
      
      const recordsSql = `
        SELECT 
          qpr.id, qpr.qr_code_id, qpr.payer_id, qpr.amount, qpr.status, 
          qpr.paid_at as paidAt, qpr.transaction_id as transactionId, 
          qpr.payment_method as paymentMethod, qpr.created_at as createdAt,
          COALESCE(e.title, '') as description, qr.name as qrCodeName
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        LEFT JOIN qr_codes qr ON qpr.qr_code_id = qr.id
        ${whereConditions}
        ORDER BY qpr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      // 添加分页参数
      params.push(pageSize, offset);
      
      // 执行查询
      const countResult = await query(countSql, params.slice(0, paramIndex - 1));
      const recordsResult = await query(recordsSql, params);
      
      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / pageSize);
      
      return res.json({
        success: true,
        data: {
          records: recordsResult.rows,
          total,
          page: pageNum,
          size: pageSize,
          pages
        },
        message: '获取支付记录列表成功'
      });
    } catch (error) {
      console.error('获取支付记录列表失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取支付记录详情
   * GET /api/payments/:orderId
   * 
   * 请求参数:
   * - orderId: 订单ID
   * 
   * 返回结果:
   * - 支付记录详情
   */
  async getPaymentRecordDetail(req, res, next) {
    try {
      const { orderId } = req.params;
      
      const sql = `
        SELECT 
          qpr.id, qpr.qr_code_id, qpr.payer_id, qpr.amount, qpr.status, 
          qpr.paid_at as paidAt, qpr.transaction_id as transactionId, 
          qpr.payment_method as paymentMethod, qpr.created_at as createdAt,
          COALESCE(e.title, '') as description, qr.name as qrCodeName, qr.platform as qrCodePlatform,
          qr.amount as qrCodeAmount, qr.type as qrCodeType
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        LEFT JOIN qr_codes qr ON qpr.qr_code_id = qr.id
        WHERE (qpr.transaction_id = $1 OR qpr.id = $1) AND qpr.payer_id = $2
      `;
      
      const result = await query(sql, [orderId, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '支付记录不存在'
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '获取支付记录详情成功'
      });
    } catch (error) {
      console.error('获取支付记录详情失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取支付统计数据
   * GET /api/payments/statistics
   * 
   * 请求参数:
   * - startDate: 开始日期 (可选)
   * - endDate: 结束日期 (可选)
   * - type: 统计类型 (可选，day/week/month/year)
   * 
   * 返回结果:
   * - 支付统计数据
   */
  async getPaymentStatistics(req, res, next) {
    try {
      const { startDate = '', endDate = '', type = '' } = req.query;
      
      // 构建查询条件
      let whereConditions = 'WHERE payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (startDate) {
        whereConditions += ` AND created_at >= $${paramIndex}`;
        params.push(new Date(startDate));
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND created_at <= $${paramIndex}`;
        params.push(new Date(endDate + ' 23:59:59'));
        paramIndex++;
      }
      
      // 统计总收入和总支出
      const statsSql = `
        SELECT 
          SUM(amount) as totalIncome, 
          COUNT(*) as totalTransactions,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successfulPayments,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingPayments,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedPayments
        FROM qr_payment_records
        ${whereConditions}
      `;
      
      // 统计支付方式分布
      const methodSql = `
        SELECT 
          payment_method as method, 
          COUNT(*) as count,
          SUM(amount) as amount,
          COUNT(*) * 100.0 / (SELECT COUNT(*) FROM qr_payment_records ${whereConditions}) as percentage
        FROM qr_payment_records
        ${whereConditions}
        GROUP BY payment_method
        ORDER BY count DESC
      `;
      
      // 执行查询
      const statsResult = await query(statsSql, params);
      const methodResult = await query(methodSql, params);
      
      // 统计月度交易数据
      const monthlySql = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count,
          SUM(amount) as amount
        FROM qr_payment_records
        ${whereConditions}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `;
      
      const monthlyResult = await query(monthlySql, params);
      
      return res.json({
        success: true,
        data: {
          totalIncome: parseFloat(statsResult.rows[0].totalIncome) || 0,
          totalExpense: 0, // 目前没有支出数据，暂时返回0
          totalTransactions: parseInt(statsResult.rows[0].totalTransactions) || 0,
          successfulPayments: parseInt(statsResult.rows[0].successfulPayments) || 0,
          pendingPayments: parseInt(statsResult.rows[0].pendingPayments) || 0,
          failedPayments: parseInt(statsResult.rows[0].failedPayments) || 0,
          monthlyTransactions: monthlyResult.rows,
          methodDistribution: methodResult.rows
        },
        message: '获取支付统计数据成功'
      });
    } catch (error) {
      console.error('获取支付统计数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 导出支付记录
   * GET /api/payments/export
   * 
   * 请求参数:
   * - 与getPaymentRecords相同的筛选参数
   * - format: 导出格式 (可选，csv或excel，默认excel)
   * 
   * 返回结果:
   * - 导出文件下载链接
   */
  async exportPaymentRecords(req, res, next) {
    try {
      const {
        format = 'excel',
        ...filterParams
      } = req.query;
      
      // 这里简单实现，实际项目中应该使用专门的库生成Excel或CSV文件
      // 暂时返回一个模拟的下载链接
      return res.json({
        success: true,
        data: {
          downloadUrl: `/download/payment-records-${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`,
          recordCount: 100, // 模拟数据
          format
        },
        message: '导出支付记录成功'
      });
    } catch (error) {
      console.error('导出支付记录失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取收入趋势数据
   * GET /api/payments/income-trend
   * 
   * 返回结果:
   * - 收入趋势数据
   */
  async getIncomeTrend(req, res, next) {
    try {
      const sql = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          SUM(amount) as amount
        FROM qr_payment_records
        WHERE payer_id = $1 AND status = 'success'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
        LIMIT 12
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows,
        message: '获取收入趋势数据成功'
      });
    } catch (error) {
      console.error('获取收入趋势数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 获取支付方式分布数据
   * GET /api/payments/method-distribution
   * 
   * 返回结果:
   * - 支付方式分布数据
   */
  async getPaymentMethodDistribution(req, res, next) {
    try {
      const sql = `
        SELECT 
          payment_method as name,
          SUM(amount) as amount,
          COUNT(*) * 100.0 / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1) as percentage
        FROM qr_payment_records
        WHERE payer_id = $1
        GROUP BY payment_method
        ORDER BY amount DESC
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows,
        message: '获取支付方式分布数据成功'
      });
    } catch (error) {
      console.error('获取支付方式分布数据失败:', error);
      next(error);
    }
  }
  
  /**
   * 创建支付订单
   * POST /api/payments
   * 
   * 请求参数:
   * - paymentMethod: 支付方式
   * - amount: 金额
   * - description: 描述
   * - remark: 备注 (可选)
   * - recipientName: 收款方名称 (可选)
   * - recipientAccount: 收款方账号 (可选)
   * - discountCode: 折扣码 (可选)
   * - callbackUrl: 回调URL (可选)
   * - metadata: 元数据 (可选)
   * 
   * 返回结果:
   * - 支付订单信息
   */
  async createPaymentOrder(req, res, next) {
    try {
      const {
        paymentMethod,
        amount,
        description,
        remark = '',
        recipientName = '',
        recipientAccount = '',
        discountCode = '',
        callbackUrl = '',
        metadata = {}
      } = req.body;
      
      // 验证必填字段
      if (!paymentMethod || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：paymentMethod, amount, description'
        });
      }
      
      // 验证支付方式
      const validMethods = ['wechat', 'alipay', 'bank', 'cash'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: '无效的支付方式'
        });
      }
      
      // 生成订单ID和交易ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 这里应该创建支付订单记录，暂时返回模拟数据
      return res.json({
        success: true,
        data: {
          success: true,
          orderId,
          transactionId,
          status: 'processing',
          message: '创建支付订单成功',
          data: {
            paymentUrl: `https://payment.example.com/${transactionId}`,
            qrCodeUrl: `https://picsum.photos/200/200?random=${transactionId}`
          }
        },
        message: '创建支付订单成功'
      });
    } catch (error) {
      console.error('创建支付订单失败:', error);
      next(error);
    }
  }
  
  /**
   * 保存提醒设置
   * POST /api/payments/reminder-settings
   * 
   * 请求参数:
   * - enabled: 是否启用提醒
   * - methods: 提醒方式 (email, sms)
   * - intervalMinutes: 提醒间隔（分钟）
   * 
   * 返回结果:
   * - 保存结果
   */
  async saveReminderSettings(req, res, next) {
    try {
      const { enabled = false, methods = ['email'], intervalMinutes = 60 } = req.body;
      
      // 验证提醒方式
      const validMethods = ['email', 'sms'];
      const invalidMethods = methods.filter(method => !validMethods.includes(method));
      if (invalidMethods.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的提醒方式：${invalidMethods.join(', ')}`
        });
      }
      
      // 保存提醒设置
      const sql = `
        INSERT INTO reminder_settings (user_id, enabled, methods, interval_minutes, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET enabled = $2, methods = $3, interval_minutes = $4, updated_at = NOW()
      `;
      
      await query(sql, [req.user.id, enabled, methods, intervalMinutes]);
      
      return res.json({
        success: true,
        data: true,
        message: '保存提醒设置成功'
      });
    } catch (error) {
      console.error('保存提醒设置失败:', error);
      next(error);
    }
  }
  
  /**
   * 计算费用分摊
   * POST /api/payments/calculate-sharing
   * 
   * 请求参数:
   * - expenses: 费用列表
   * - members: 成员列表
   * 
   * 返回结果:
   * - 费用分摊结果
   */
  async calculateSharing(req, res, next) {
    try {
      const { expenses = [], members = [] } = req.body;
      
      // 验证参数
      if (!Array.isArray(expenses) || expenses.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的费用列表'
        });
      }
      
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的成员列表'
        });
      }
      
      // 计算总费用
      const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      // 计算人均分摊金额
      const perPersonShare = totalExpense / members.length;
      
      // 生成分摊结果
      const sharingResults = members.map(member => ({
        name: member.name,
        shouldPay: parseFloat(perPersonShare.toFixed(2)),
        paid: 0,
        pending: parseFloat(perPersonShare.toFixed(2)),
        status: 'pending'
      }));
      
      return res.json({
        success: true,
        data: {
          sharingResults,
          totalExpense: parseFloat(totalExpense.toFixed(2)),
          perPersonShare: parseFloat(perPersonShare.toFixed(2)),
          totalPaid: 0,
          totalPending: parseFloat(totalExpense.toFixed(2))
        },
        message: '费用分摊计算成功'
      });
    } catch (error) {
      console.error('费用分摊计算失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付记录详情
   * GET /api/payments/:orderId
   * 
   * 请求参数:
   * - orderId: 订单ID
   * 
   * 返回结果:
   * - 支付记录详情
   */
  async getPaymentRecordDetail(req, res, next) {
    try {
      const { orderId } = req.params;
      
      // 查询支付记录详情
      const sql = `
        SELECT 
          qpr.id, qpr.transaction_id as orderId, qpr.transaction_id, 
          'expense' as transactionType,
          qpr.payment_method as paymentMethod,
          qpr.amount, qpr.status, 
          COALESCE(e.title, '') as description,
          qpr.created_at as createdAt,
          qpr.paid_at as completedAt,
          '' as remark,
          '' as ipAddress,
          '' as recipientName,
          '' as recipientAccount,
          '' as discountCode,
          0 as discountAmount
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        WHERE qpr.transaction_id = $1 AND qpr.payer_id = $2
      `;
      
      const result = await query(sql, [orderId, req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '支付记录不存在'
        });
      }
      
      return res.json({
        success: true,
        data: result.rows[0],
        message: '获取支付记录详情成功'
      });
    } catch (error) {
      console.error('获取支付记录详情失败:', error);
      next(error);
    }
  }

  /**
   * 导出支付记录
   * GET /api/payments/export
   * 
   * 请求参数:
   * - format: 导出格式 (csv/excel)
   * - status: 状态筛选
   * - paymentMethod: 支付方式筛选
   * - transactionType: 交易类型筛选
   * - startDate: 开始日期
   * - endDate: 结束日期
   * - minAmount: 最小金额
   * - maxAmount: 最大金额
   * - keyword: 关键词
   * 
   * 返回结果:
   * - 导出文件URL
   */
  async exportPaymentRecords(req, res, next) {
    try {
      const { 
        format = 'excel', 
        status = '', 
        paymentMethod = '', 
        transactionType = '',
        startDate = '', 
        endDate = '', 
        minAmount = '', 
        maxAmount = '', 
        keyword = '' 
      } = req.query;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (status) {
        whereConditions += ` AND qpr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (paymentMethod) {
        whereConditions += ` AND qpr.payment_method = $${paramIndex}`;
        params.push(paymentMethod);
        paramIndex++;
      }
      
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      if (minAmount) {
        whereConditions += ` AND qpr.amount >= $${paramIndex}`;
        params.push(parseFloat(minAmount));
        paramIndex++;
      }
      
      if (maxAmount) {
        whereConditions += ` AND qpr.amount <= $${paramIndex}`;
        params.push(parseFloat(maxAmount));
        paramIndex++;
      }
      
      if (keyword) {
        whereConditions += ` AND (e.title ILIKE $${paramIndex} OR qpr.transaction_id ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
      
      // 查询支付记录数据
      const sql = `
        SELECT 
          qpr.transaction_id as "订单ID",
          qpr.payment_method as "支付方式",
          qpr.amount as "金额",
          qpr.status as "状态",
          COALESCE(e.title, '') as "描述",
          qpr.created_at as "创建时间",
          qpr.paid_at as "完成时间"
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
        ORDER BY qpr.created_at DESC
      `;
      
      const result = await query(sql, params);
      
      // 生成唯一的文件名
      const fileName = `payment_records_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      // 返回下载链接
      const downloadUrl = `/payments/download-export?format=${format}&status=${status}&paymentMethod=${paymentMethod}&transactionType=${transactionType}&startDate=${startDate}&endDate=${endDate}&minAmount=${minAmount}&maxAmount=${maxAmount}&keyword=${encodeURIComponent(keyword || '')}&fileName=${fileName}`;
      
      return res.json({
        success: true,
        data: {
          downloadUrl: downloadUrl,
          recordCount: result.rows.length,
          format
        },
        message: '导出支付记录成功'
      });
    } catch (error) {
      console.error('导出支付记录失败:', error);
      next(error);
    }
  }

  /**
   * 下载导出的支付记录文件
   * GET /api/payments/download-export
   * 
   * 请求参数:
   * - format: 导出格式 (csv/excel)
   * - status: 状态筛选
   * - paymentMethod: 支付方式筛选
   * - transactionType: 交易类型筛选
   * - startDate: 开始日期
   * - endDate: 结束日期
   * - minAmount: 最小金额
   * - maxAmount: 最大金额
   * - keyword: 关键词
   * - fileName: 文件名
   * 
   * 返回结果:
   * - 导出文件
   */
  async downloadExportedPaymentRecords(req, res, next) {
    try {
      const { 
        format = 'excel', 
        status = '', 
        paymentMethod = '', 
        transactionType = '',
        startDate = '', 
        endDate = '', 
        minAmount = '', 
        maxAmount = '', 
        keyword = '',
        fileName = ''
      } = req.query;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (status) {
        whereConditions += ` AND qpr.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (paymentMethod) {
        whereConditions += ` AND qpr.payment_method = $${paramIndex}`;
        params.push(paymentMethod);
        paramIndex++;
      }
      
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      if (minAmount) {
        whereConditions += ` AND qpr.amount >= $${paramIndex}`;
        params.push(parseFloat(minAmount));
        paramIndex++;
      }
      
      if (maxAmount) {
        whereConditions += ` AND qpr.amount <= $${paramIndex}`;
        params.push(parseFloat(maxAmount));
        paramIndex++;
      }
      
      if (keyword) {
        whereConditions += ` AND (e.title ILIKE $${paramIndex} OR qpr.transaction_id ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
      
      // 查询支付记录数据
      const sql = `
        SELECT 
          qpr.transaction_id as "订单ID",
          qpr.payment_method as "支付方式",
          qpr.amount as "金额",
          qpr.status as "状态",
          COALESCE(e.title, '') as "描述",
          qpr.created_at as "创建时间",
          qpr.paid_at as "完成时间"
        FROM qr_payment_records qpr
        LEFT JOIN expenses e ON qpr.expense_id = e.id
        ${whereConditions}
        ORDER BY qpr.created_at DESC
      `;
      
      const result = await query(sql, params);
      
      // 生成文件名
      const actualFileName = fileName || `payment_records_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      // 生成CSV文件
      if (format === 'csv') {
        const headers = Object.keys(result.rows[0] || {});
        const csvContent = [
          headers.join(','),
          ...result.rows.map(row => headers.map(header => {
            const value = row[header];
            // 如果值包含逗号或引号，用引号包裹
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(','))
        ].join('\n');
        
        // 设置响应头
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${actualFileName}"`);
        res.send('\uFEFF' + csvContent); // 添加BOM解决中文乱码问题
      } else {
        // 生成Excel文件
        try {
          const xlsx = require('xlsx');
          
          // 转换数据格式
          const excelData = result.rows.map(row => ({
            '订单ID': row['订单ID'],
            '支付方式': row['支付方式'],
            '金额': row['金额'],
            '状态': row['状态'],
            '描述': row['描述'],
            '创建时间': row['创建时间'],
            '完成时间': row['完成时间']
          }));
          
          // 创建工作簿
          const wb = xlsx.utils.book_new();
          const ws = xlsx.utils.json_to_sheet(excelData);
          
          // 添加工作表到工作簿
          xlsx.utils.book_append_sheet(wb, ws, '支付记录');
          
          // 写入buffer
          const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
          
          // 设置响应头
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${actualFileName}"`);
          res.send(buffer);
        } catch (xlsxError) {
          console.error('生成Excel文件失败，回退到CSV格式:', xlsxError);
          // 如果Excel生成失败，回退到CSV格式
          const headers = Object.keys(result.rows[0] || {});
          const csvContent = [
            headers.join(','),
            ...result.rows.map(row => headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            }).join(','))
          ].join('\n');
          
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${actualFileName.replace('.xlsx', '.csv')}"`);
          res.send('\uFEFF' + csvContent);
        }
      }
    } catch (error) {
      console.error('下载导出支付记录失败:', error);
      // 返回错误信息而不是抛出异常
      res.status(500).json({
        success: false,
        message: '导出文件生成失败，请稍后重试'
      });
    }
  }

  /**
   * 创建支付订单
   * POST /api/payments   * 
   * 请求参数:
   * - paymentMethod: 支付方式
   * - amount: 支付金额
   * - description: 描述
   * - remark: 备注
   * - recipientName: 收款方名称
   * - recipientAccount: 收款方账号
   * - discountCode: 优惠码
   * 
   * 返回结果:
   * - 支付订单信息
   */
  async createPaymentOrder(req, res, next) {
    try {
      const {
        paymentMethod,
        amount,
        description,
        remark = '',
        recipientName = '',
        recipientAccount = '',
        discountCode = ''
      } = req.body;
      
      // 验证必填字段
      if (!paymentMethod || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：paymentMethod, amount, description'
        });
      }
      
      // 生成交易ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建支付订单（这里简化处理，实际应该生成真实的支付链接或二维码）
      const paymentUrl = `https://example.com/pay/${transactionId}`;
      
      return res.json({
        success: true,
        data: {
          success: true,
          orderId: transactionId,
          status: 'processing',
          paymentUrl,
          message: '支付订单创建成功',
          data: {}
        },
        message: '支付订单创建成功'
      });
    } catch (error) {
      console.error('创建支付订单失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付统计数据
   * GET /api/payments/statistics
   * 
   * 请求参数:
   * - startDate: 开始日期
   * - endDate: 结束日期
   * - type: 时间类型 (day/week/month/year)
   * 
   * 返回结果:
   * - 支付统计数据
   */
  async getPaymentStatistics(req, res, next) {
    try {
      const { startDate = '', endDate = '', type = 'month' } = req.query;
      
      // 构建查询条件
      let whereConditions = 'WHERE qpr.payer_id = $1';
      let params = [req.user.id];
      let paramIndex = 2;
      
      if (startDate) {
        whereConditions += ` AND qpr.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereConditions += ` AND qpr.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      // 查询总收入
      const totalIncomeSql = `
        SELECT COALESCE(SUM(amount), 0) as totalIncome
        FROM qr_payment_records qpr
        ${whereConditions}
      `;
      
      // 查询总支出
      const totalExpenseSql = `
        SELECT COALESCE(SUM(amount), 0) as totalExpense
        FROM qr_payment_records qpr
        ${whereConditions}
      `;
      
      // 查询总交易笔数
      const totalTransactionsSql = `
        SELECT COUNT(*) as totalTransactions
        FROM qr_payment_records qpr
        ${whereConditions}
      `;
      
      // 查询成功支付笔数
      const successfulPaymentsSql = `
        SELECT COUNT(*) as successfulPayments
        FROM qr_payment_records qpr
        ${whereConditions} AND qpr.status = 'success'
      `;
      
      // 查询待处理支付笔数
      const pendingPaymentsSql = `
        SELECT COUNT(*) as pendingPayments
        FROM qr_payment_records qpr
        ${whereConditions} AND qpr.status = 'pending'
      `;
      
      // 查询失败支付笔数
      const failedPaymentsSql = `
        SELECT COUNT(*) as failedPayments
        FROM qr_payment_records qpr
        ${whereConditions} AND qpr.status = 'failed'
      `;
      
      // 执行查询
      const [
        totalIncomeResult,
        totalExpenseResult,
        totalTransactionsResult,
        successfulPaymentsResult,
        pendingPaymentsResult,
        failedPaymentsResult
      ] = await Promise.all([
        query(totalIncomeSql, params),
        query(totalExpenseSql, params),
        query(totalTransactionsSql, params),
        query(successfulPaymentsSql, params),
        query(pendingPaymentsSql, params),
        query(failedPaymentsSql, params)
      ]);
      
      // 查询月度交易数据
      const monthlyTransactionsSql = `
        SELECT 
          TO_CHAR(qpr.created_at, 'YYYY-MM') as month,
          COUNT(*) as count,
          SUM(qpr.amount) as amount
        FROM qr_payment_records qpr
        ${whereConditions}
        GROUP BY TO_CHAR(qpr.created_at, 'YYYY-MM')
        ORDER BY month
      `;
      
      // 查询支付方式分布
      const methodDistributionSql = `
        SELECT 
          qpr.payment_method as method,
          COUNT(*) as count,
          SUM(qpr.amount) as amount,
          ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1), 2) as percentage
        FROM qr_payment_records qpr
        ${whereConditions}
        GROUP BY qpr.payment_method
      `;
      
      const [monthlyTransactionsResult, methodDistributionResult] = await Promise.all([
        query(monthlyTransactionsSql, params),
        query(methodDistributionSql, params)
      ]);
      
      return res.json({
        success: true,
        data: {
          totalIncome: parseFloat(totalIncomeResult.rows[0].totalIncome),
          totalExpense: parseFloat(totalExpenseResult.rows[0].totalExpense),
          totalTransactions: parseInt(totalTransactionsResult.rows[0].totalTransactions),
          successfulPayments: parseInt(successfulPaymentsResult.rows[0].successfulPayments),
          pendingPayments: parseInt(pendingPaymentsResult.rows[0].pendingPayments),
          failedPayments: parseInt(failedPaymentsResult.rows[0].failedPayments),
          monthlyTransactions: monthlyTransactionsResult.rows.map(row => ({
            month: row.month,
            count: parseInt(row.count),
            amount: parseFloat(row.amount)
          })),
          methodDistribution: methodDistributionResult.rows.map(row => ({
            method: row.method,
            count: parseInt(row.count),
            amount: parseFloat(row.amount),
            percentage: parseFloat(row.percentage)
          }))
        },
        message: '获取支付统计数据成功'
      });
    } catch (error) {
      console.error('获取支付统计数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取收入趋势数据
   * GET /api/payments/income-trend
   * 
   * 返回结果:
   * - 收入趋势数据
   */
  async getIncomeTrend(req, res, next) {
    try {
      // 查询收入趋势数据
      const sql = `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          SUM(amount) as amount
        FROM qr_payment_records
        WHERE payer_id = $1 AND status = 'success'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows.map(row => ({
          month: row.month,
          amount: parseFloat(row.amount)
        })),
        message: '获取收入趋势数据成功'
      });
    } catch (error) {
      console.error('获取收入趋势数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付方式分布数据
   * GET /api/payments/method-distribution
   * 
   * 返回结果:
   * - 支付方式分布数据
   */
  async getPaymentMethodDistribution(req, res, next) {
    try {
      // 查询支付方式分布数据
      const sql = `
        SELECT 
          payment_method as name,
          SUM(amount) as amount,
          ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM qr_payment_records WHERE payer_id = $1), 2) as percentage
        FROM qr_payment_records
        WHERE payer_id = $1
        GROUP BY payment_method
      `;
      
      const result = await query(sql, [req.user.id]);
      
      return res.json({
        success: true,
        data: result.rows.map(row => ({
          name: row.name,
          amount: parseFloat(row.amount),
          percentage: parseFloat(row.percentage)
        })),
        message: '获取支付方式分布数据成功'
      });
    } catch (error) {
      console.error('获取支付方式分布数据失败:', error);
      next(error);
    }
  }

  /**
   * 保存提醒设置
   * POST /api/payments/reminder-settings
   * 
   * 请求参数:
   * - enabled: 是否启用提醒
   * - methods: 提醒方式列表
   * - intervalMinutes: 提醒间隔（分钟）
   * 
   * 返回结果:
   * - 保存结果
   */
  async saveReminderSettings(req, res, next) {
    try {
      const { enabled, methods, intervalMinutes } = req.body;
      
      // 验证必填字段
      if (enabled === undefined || !methods || intervalMinutes === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：enabled, methods, intervalMinutes'
        });
      }
      
      // 检查是否已存在提醒设置
      const checkSql = `SELECT id FROM reminder_settings WHERE user_id = $1`;
      const checkResult = await query(checkSql, [req.user.id]);
      
      if (checkResult.rows.length > 0) {
        // 更新现有设置
        const updateSql = `
          UPDATE reminder_settings
          SET enabled = $1, methods = $2, interval_minutes = $3, updated_at = NOW()
          WHERE user_id = $4
        `;
        await query(updateSql, [enabled, JSON.stringify(methods), intervalMinutes, req.user.id]);
      } else {
        // 创建新设置
        const insertSql = `
          INSERT INTO reminder_settings (user_id, enabled, methods, interval_minutes)
          VALUES ($1, $2, $3, $4)
        `;
        await query(insertSql, [req.user.id, enabled, JSON.stringify(methods), intervalMinutes]);
      }
      
      return res.json({
        success: true,
        data: true,
        message: '提醒设置保存成功'
      });
    } catch (error) {
      console.error('保存提醒设置失败:', error);
      return res.status(500).json({
        success: false,
        data: false,
        message: '保存提醒设置失败'
      });
    }
  }

  /**
   * 计算费用分摊
   * POST /api/payments/calculate-sharing
   * 
   * 请求参数:
   * - expenses: 费用列表
   * - members: 成员列表
   * 
   * 返回结果:
   * - 费用分摊计算结果
   */
  async calculateSharing(req, res, next) {
    try {
      const { expenses, members } = req.body;
      
      // 验证必填字段
      if (!expenses || !Array.isArray(expenses) || !members || !Array.isArray(members)) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段或字段类型错误：expenses和members必须是数组'
        });
      }
      
      // 计算总费用
      const totalExpense = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      // 计算人均分摊金额
      const perPersonShare = totalExpense / members.length;
      
      // 生成分摊结果
      const sharingResults = members.map(member => {
        // 计算该成员已支付的金额
        const paid = expenses
          .filter(expense => expense.payer === member.name)
          .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
        
        // 计算该成员应支付的金额
        const shouldPay = perPersonShare;
        
        // 计算待处理金额（正数表示需要支付，负数表示需要退款）
        const pending = shouldPay - paid;
        
        return {
          name: member.name,
          shouldPay: parseFloat(shouldPay.toFixed(2)),
          paid: parseFloat(paid.toFixed(2)),
          pending: parseFloat(pending.toFixed(2)),
          status: pending === 0 ? 'balanced' : pending > 0 ? 'need_pay' : 'need_refund'
        };
      });
      
      // 计算总已支付金额和总待处理金额
      const totalPaid = sharingResults.reduce((sum, result) => sum + result.paid, 0);
      const totalPending = sharingResults.reduce((sum, result) => sum + result.pending, 0);
      
      return res.json({
        success: true,
        data: {
          sharingResults,
          totalExpense: parseFloat(totalExpense.toFixed(2)),
          perPersonShare: parseFloat(perPersonShare.toFixed(2)),
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          totalPending: parseFloat(totalPending.toFixed(2))
        },
      });
    } catch (error) {
      console.error('费用分摊计算失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付确认页面统计数据
   * GET /api/payments/confirm-statistics
   * 
   * 请求参数:
   * - keyword: 关键词搜索 (可选)
   * - status: 支付状态 (可选，pending/approved/paid/failed)
   * - category: 费用类别 (可选)
   * - startDate: 开始日期 (可选)
   * - endDate: 结束日期 (可选)
   * 
   * 返回结果:
   * - pendingAmount: 待支付总额
   * - paidAmount: 已支付总额
   * - pendingCount: 待审核数量
   * - totalCount: 总记录数
   */
  async getConfirmStatistics(req, res, next) {
    try {
      const { keyword = '', status = '', category = '', startDate = '', endDate = '' } = req.query;

      console.log('[PaymentController] 获取支付确认统计数据:', {
        keyword, status, category, startDate, endDate,
        userId: req.user?.id
      });

      let whereConditions = 'WHERE 1=1';
      let params = [];
      let paramIndex = 1;

      // 关键词搜索 - 支持标题、申请人、描述
      if (keyword) {
        whereConditions += ` AND (
          e.title ILIKE $${paramIndex} OR 
          u.username ILIKE $${paramIndex} OR 
          e.description ILIKE $${paramIndex}
        )`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }

      // 状态筛选 - 根据前端需求: pending(待审核)/approved(已通过)/paid(已支付)/failed(支付失败)
      if (status) {
        const statusMap = {
          'pending': "'pending'",
          'approved': "'approved'",
          'paid': "'paid'",
          'failed': "'failed'"
        };
        if (statusMap[status]) {
          whereConditions += ` AND e.status = ${statusMap[status]}`;
        }
      }

      // 类别筛选
      if (category) {
        const categoryMap = {
          'accommodation': 1,
          'utilities': 2,
          'maintenance': 3,
          'cleaning': 4,
          'other': 5
        };
        if (categoryMap[category]) {
          whereConditions += ` AND e.category_id = $${paramIndex}`;
          params.push(categoryMap[category]);
          paramIndex++;
        }
      }

      // 日期范围筛选
      if (startDate) {
        whereConditions += ` AND e.expense_date >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      if (endDate) {
        whereConditions += ` AND e.expense_date <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // 获取待支付总额 (status = 'pending' 或 'approved')
      const pendingAmountSql = `
        SELECT COALESCE(SUM(e.amount), 0) as total
        FROM expenses e
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        AND e.status IN ('pending', 'approved')
      `;
      const pendingAmountResult = await query(pendingAmountSql, params);
      const pendingAmount = parseFloat(pendingAmountResult.rows[0]?.total) || 0;

      // 获取已支付总额 (status = 'paid')
      let paidWhereConditions = whereConditions.replace("AND e.status IN ('pending', 'approved')", '');
      if (status && status !== 'paid') {
        // 如果前端传了状态筛选，保持原条件
      } else {
        paidWhereConditions += ` AND e.status = 'paid'`;
      }
      const paidAmountSql = `
        SELECT COALESCE(SUM(e.amount), 0) as total
        FROM expenses e
        LEFT JOIN users u ON e.applicant_id = u.id
        ${paidWhereConditions}
      `;
      const paidAmountResult = await query(paidAmountSql, params);
      const paidAmount = parseFloat(paidAmountResult.rows[0]?.total) || 0;

      // 获取待审核数量 (status = 'pending')
      const pendingCountSql = `
        SELECT COUNT(*) as count
        FROM expenses e
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
        AND e.status = 'pending'
      `;
      const pendingCountResult = await query(pendingCountSql, params);
      const pendingCount = parseInt(pendingCountResult.rows[0]?.count) || 0;

      // 获取总记录数
      const totalCountSql = `
        SELECT COUNT(*) as count
        FROM expenses e
        LEFT JOIN users u ON e.applicant_id = u.id
        ${whereConditions}
      `;
      const totalCountResult = await query(totalCountSql, params);
      const totalCount = parseInt(totalCountResult.rows[0]?.count) || 0;

      console.log('[PaymentController] 支付确认统计数据:', {
        pendingAmount,
        paidAmount,
        pendingCount,
        totalCount
      });

      return res.json({
        success: true,
        data: {
          pendingAmount,
          paidAmount,
          pendingCount,
          totalCount
        },
        message: '获取支付确认统计数据成功'
      });
    } catch (error) {
      console.error('获取支付确认统计数据失败:', error);
      next(error);
    }
  }
}

module.exports = new PaymentController();