/**
 * 管理员收款码管理控制器
 * 提供管理端收款码管理的完整API接口
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../middleware/response');

class AdminPaymentCodeController extends BaseController {
  constructor() {
    super();
    this.getPaymentCodes = this.getPaymentCodes.bind(this);
    this.getPaymentCodeById = this.getPaymentCodeById.bind(this);
    this.createPaymentCode = this.createPaymentCode.bind(this);
    this.updatePaymentCode = this.updatePaymentCode.bind(this);
    this.deletePaymentCode = this.deletePaymentCode.bind(this);
    this.updatePaymentCodeStatus = this.updatePaymentCodeStatus.bind(this);
    this.batchDelete = this.batchDelete.bind(this);
    this.batchDisable = this.batchDisable.bind(this);
    this.performSecurityCheck = this.performSecurityCheck.bind(this);
    this.batchSecurityCheck = this.batchSecurityCheck.bind(this);
    this.getSecurityReport = this.getSecurityReport.bind(this);
    this.getUsageStatistics = this.getUsageStatistics.bind(this);
    this.getOverallStatistics = this.getOverallStatistics.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
  }

  /**
   * 处理日期字段，确保正确序列化
   */
  processDateFields(row, dateFields) {
    const processed = { ...row };
    for (const field of dateFields) {
      if (processed[field]) {
        if (typeof processed[field] === 'object' && processed[field].toISOString) {
          processed[field] = processed[field].toISOString();
        } else {
          processed[field] = String(processed[field]);
        }
      }
    }
    return processed;
  }

  /**
   * 构建查询条件
   */
  buildWhereConditions(params) {
    let whereConditions = ['WHERE 1=1'];
    const paramsList = [];
    let paramIndex = 1;

    if (params.name) {
      whereConditions.push(`AND q.name ILIKE $${paramIndex}`);
      paramsList.push(`%${params.name}%`);
      paramIndex++;
    }

    if (params.type) {
      whereConditions.push(`AND q.platform = $${paramIndex}`);
      paramsList.push(params.type);
      paramIndex++;
    }

    if (params.status) {
      whereConditions.push(`AND q.status = $${paramIndex}`);
      paramsList.push(params.status);
      paramIndex++;
    }

    if (params.securityStatus) {
      whereConditions.push(`AND q.security_status = $${paramIndex}`);
      paramsList.push(params.securityStatus);
      paramIndex++;
    }

    if (params.auditStatus) {
      whereConditions.push(`AND q.audit_status = $${paramIndex}`);
      paramsList.push(params.auditStatus);
      paramIndex++;
    }

    if (params.startDate) {
      whereConditions.push(`AND q.created_at >= $${paramIndex}`);
      paramsList.push(params.startDate);
      paramIndex++;
    }

    if (params.endDate) {
      whereConditions.push(`AND q.created_at <= $${paramIndex}`);
      paramsList.push(params.endDate);
      paramIndex++;
    }

    return { conditions: whereConditions.join(' '), params: paramsList };
  }

  /**
   * 获取收款码列表
   * GET /api/admin/payment-codes
   */
  async getPaymentCodes(req, res, next) {
    try {
      const {
        page = 1,
        size = 10,
        name,
        type,
        status,
        securityStatus,
        auditStatus,
        startDate,
        endDate
      } = req.query;

      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(size) || 10;
      const offset = (pageNum - 1) * pageSize;

      const { conditions, params } = this.buildWhereConditions({
        name, type, status, securityStatus, auditStatus, startDate, endDate
      });

      const countSql = `
        SELECT COUNT(*) as total
        FROM qr_codes q
        ${conditions}
      `;

      const dataSql = `
        SELECT
          q.id,
          q.name,
          q.platform as type,
          q.merchant_account as account,
          q.status,
          q.security_status as securityStatus,
          q.audit_status as auditStatus,
          q.usage_count as usageCount,
          q.created_at as createTime,
          q.updated_at as updateTime,
          q.remark,
          q.last_used_time as lastUsedTime,
          COALESCE(
            (SELECT json_agg(image_url ORDER BY sort_order)
             FROM qr_code_images WHERE qr_code_id = q.id),
            '[]'
          ) as qrCodeUrls
        FROM qr_codes q
        ${conditions}
        ORDER BY q.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(pageSize, offset);

      const [countResult, dataResult] = await Promise.all([
        query(countSql, params.slice(0, -2)),
        query(dataSql, params)
      ]);

      const total = parseInt(countResult.rows[0]?.total || 0);
      const pages = Math.ceil(total / pageSize);

      const records = dataResult.rows.map(row => {
        let qrCodeUrls = row.qrcodeurls;
        if (typeof qrCodeUrls === 'string') {
          try {
            qrCodeUrls = JSON.parse(qrCodeUrls);
          } catch {
            qrCodeUrls = [];
          }
        }
        if (!Array.isArray(qrCodeUrls)) {
          qrCodeUrls = [];
        }

        return this.processDateFields({
          ...row,
          qrCodeUrls
        }, ['createTime', 'updateTime', 'lastUsedTime']);
      });

      logger.info('管理员获取收款码列表成功', {
        userId: req.user?.id || 'unknown',
        total,
        page: pageNum,
        filters: { name, type, status, securityStatus, auditStatus }
      });

      return successResponse(res, {
        records,
        total,
        page: pageNum,
        size: pageSize,
        pages
      }, '获取收款码列表成功');
    } catch (error) {
      logger.error('获取收款码列表失败', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 获取收款码详情
   * GET /api/admin/payment-codes/:id
   */
  async getPaymentCodeById(req, res, next) {
    try {
      const { id } = req.params;

      const qrCodeSql = `
        SELECT
          q.*,
          q.platform as type,
          q.merchant_account as account,
          q.security_status as securityStatus,
          q.audit_status as auditStatus,
          q.usage_count as usageCount,
          q.created_at as createTime,
          q.updated_at as updateTime,
          q.last_used_time as lastUsedTime,
          q.last_security_check_time as lastCheckTime,
          q.last_security_check_result as lastCheckResult,
          COALESCE(
            (SELECT json_agg(image_url ORDER BY sort_order)
             FROM qr_code_images WHERE qr_code_id = q.id),
            '[]'
          ) as qrCodeUrls,
          u.username as userName
        FROM qr_codes q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id = $1
      `;

      const result = await query(qrCodeSql, [id]);

      if (result.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const row = result.rows[0];
      let qrCodeUrls = row.qrcodeurls;
      if (typeof qrCodeUrls === 'string') {
        try {
          qrCodeUrls = JSON.parse(qrCodeUrls);
        } catch {
          qrCodeUrls = [];
        }
      }
      if (!Array.isArray(qrCodeUrls)) {
        qrCodeUrls = [];
      }

      logger.info('管理员获取收款码详情成功', {
        userId: req.user.id,
        paymentCodeId: id
      });

      return successResponse(res, {
        ...this.processDateFields(row, ['createTime', 'updateTime', 'lastUsedTime', 'lastCheckTime']),
        qrCodeUrls
      }, '获取收款码详情成功');
    } catch (error) {
      logger.error('获取收款码详情失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 创建收款码
   * POST /api/admin/payment-codes
   */
  async createPaymentCode(req, res, next) {
    try {
      const {
        name,
        type,
        account,
        qrCodeUrls = [],
        status = 'enabled',
        remark = '',
        userId = null,
        merchantName = ''
      } = req.body;

      if (!name || !type || !account) {
        return errorResponse(res, '缺少必填字段：name、type、account', 400);
      }

      const validTypes = ['alipay', 'wechat', 'unionpay'];
      if (!validTypes.includes(type)) {
        return errorResponse(res, '无效的收款码类型', 400);
      }

      const validStatuses = ['enabled', 'disabled', 'pending'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, '无效的状态值', 400);
      }

      const actualUserId = userId || req.user.id;
      const safeQrCodeUrls = Array.isArray(qrCodeUrls) ? qrCodeUrls : [];
      const mainQrCodeUrl = safeQrCodeUrls.length > 0 ? safeQrCodeUrls[0] : '';

      logger.info('尝试创建收款码', {
        name,
        type,
        account,
        mainQrCodeUrl,
        actualUserId
      });

      const insertSql = `
        INSERT INTO qr_codes (
          name, platform, merchant_account, merchant_name, status,
          security_status, audit_status, usage_count, remark, user_id,
          qr_code_url
        ) VALUES ($1, $2, $3, $4, $5, 'safe', 'pending', 0, $6, $7, $8)
        RETURNING id
      `;

      const result = await query(insertSql, [
        name, type, account, merchantName, status, remark, actualUserId, mainQrCodeUrl
      ]);

      const newId = result.rows[0].id;

      if (safeQrCodeUrls.length > 0) {
        const imageInsertSql = `
          INSERT INTO qr_code_images (qr_code_id, image_url, sort_order)
          VALUES ($1, $2, $3)
        `;
        for (let i = 0; i < qrCodeUrls.length; i++) {
          await query(imageInsertSql, [newId, qrCodeUrls[i], i]);
        }
      }

      logger.info('管理员创建收款码成功', {
        userId: req.user?.id || 'unknown',
        paymentCodeId: newId,
        name,
        type,
        account
      });

      return successResponse(res, { id: newId }, '创建收款码成功', 201);
    } catch (error) {
      logger.error('创建收款码失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 更新收款码
   * PUT /api/admin/payment-codes/:id
   */
  async updatePaymentCode(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        account,
        merchantName,
        qrCodeUrls,
        status,
        auditStatus,
        remark
      } = req.body;

      const checkSql = 'SELECT id, status, audit_status FROM qr_codes WHERE id = $1';
      const checkResult = await query(checkSql, [id]);

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const oldStatus = checkResult.rows[0].status;
      const updateFields = [];
      const params = [id];
      let paramIndex = 2;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (type !== undefined) {
        const validTypes = ['alipay', 'wechat', 'unionpay'];
        if (!validTypes.includes(type)) {
          return errorResponse(res, '无效的收款码类型', 400);
        }
        updateFields.push(`platform = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (account !== undefined) {
        updateFields.push(`merchant_account = $${paramIndex}`);
        params.push(account);
        paramIndex++;
      }

      if (merchantName !== undefined) {
        updateFields.push(`merchant_name = $${paramIndex}`);
        params.push(merchantName);
        paramIndex++;
      }

      if (status !== undefined) {
        const validStatuses = ['active', 'inactive', 'enabled', 'disabled', 'pending', 'stopped'];
        if (!validStatuses.includes(status)) {
          return errorResponse(res, '无效的状态值', 400);
        }
        updateFields.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (auditStatus !== undefined) {
        const validAuditStatuses = ['pending', 'approved', 'rejected'];
        if (!validAuditStatuses.includes(auditStatus)) {
          return errorResponse(res, '无效的审核状态', 400);
        }
        updateFields.push(`audit_status = $${paramIndex}`);
        params.push(auditStatus);
        paramIndex++;

        if (auditStatus !== 'pending') {
          updateFields.push(`audit_by = $${paramIndex}`);
          params.push(req.user.id);
          paramIndex++;
          updateFields.push(`audit_time = NOW()`);
        }
      }

      if (remark !== undefined) {
        updateFields.push(`remark = $${paramIndex}`);
        params.push(remark);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return errorResponse(res, '没有需要更新的字段', 400);
      }

      updateFields.push(`updated_at = NOW()`);

      const updateSql = `
        UPDATE qr_codes
        SET ${updateFields.join(', ')}
        WHERE id = $1
      `;

      await query(updateSql, params);

      const safeQrCodeUrls = Array.isArray(qrCodeUrls) ? qrCodeUrls : [];
      if (safeQrCodeUrls.length > 0) {
        // 更新主表的 qr_code_url
        await query('UPDATE qr_codes SET qr_code_url = $1 WHERE id = $2', [safeQrCodeUrls[0], id]);
        
        await query('DELETE FROM qr_code_images WHERE qr_code_id = $1', [id]);
        const imageInsertSql = `
          INSERT INTO qr_code_images (qr_code_id, image_url, sort_order)
          VALUES ($1, $2, $3)
        `;
        for (let i = 0; i < safeQrCodeUrls.length; i++) {
          await query(imageInsertSql, [id, safeQrCodeUrls[i], i]);
        }
      }

      logger.info('管理员更新收款码成功', {
        userId: req.user?.id || 'unknown',
        paymentCodeId: id,
        changes: { name, type, account, status, auditStatus, oldStatus, newStatus: status }
      });

      return successResponse(res, { id: parseInt(id) }, '更新收款码成功');
    } catch (error) {
      logger.error('更新收款码失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 删除收款码
   * DELETE /api/admin/payment-codes/:id
   */
  async deletePaymentCode(req, res, next) {
    try {
      const { id } = req.params;

      const checkSql = 'SELECT id, name FROM qr_codes WHERE id = $1';
      const checkResult = await query(checkSql, [id]);

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const qrCodeName = checkResult.rows[0].name;

      await query('DELETE FROM qr_codes WHERE id = $1', [id]);

      logger.info('管理员删除收款码成功', {
        userId: req.user?.id || 'unknown',
        paymentCodeId: id,
        name: qrCodeName
      });

      return successResponse(res, { id: parseInt(id) }, '删除收款码成功');
    } catch (error) {
      logger.error('删除收款码失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 修改收款码状态
   * PUT /api/admin/payment-codes/:id/status
   */
  async updatePaymentCodeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ['enabled', 'disabled', 'pending', 'stopped'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, '无效的状态值', 400);
      }

      const checkSql = 'SELECT id, status, name FROM qr_codes WHERE id = $1';
      const checkResult = await query(checkSql, [id]);

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const updateFields = [`status = $1`, 'updated_at = NOW()'];
      const params = [status];

      if (status === 'stopped') {
        updateFields.push(`stop_reason = $2`);
        params.push(reason || '');
        updateFields.push(`stop_by = $3`);
        params.push(req.user?.id || null);
        updateFields.push(`stop_time = NOW()`);
      }

      const updateSql = `
        UPDATE qr_codes
        SET ${updateFields.join(', ')}
        WHERE id = $${params.length + 1}
      `;
      params.push(id);

      await query(updateSql, params);

      logger.info('管理员修改收款码状态成功', {
        userId: req.user?.id || 'unknown',
        paymentCodeId: id,
        name: checkResult.rows[0].name,
        oldStatus: checkResult.rows[0].status,
        newStatus: status,
        reason
      });

      return successResponse(res, { id: parseInt(id), status }, '修改状态成功');
    } catch (error) {
      logger.error('修改收款码状态失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 批量删除
   * POST /api/admin/payment-codes/batch-delete
   */
  async batchDelete(req, res, next) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, '请提供要删除的ID列表', 400);
      }

      const deleteSql = 'DELETE FROM qr_codes WHERE id = ANY($1) RETURNING id, name';
      const result = await query(deleteSql, [ids]);

      const deletedCount = result.rows.length;

      logger.info('管理员批量删除收款码成功', {
        userId: req.user.id,
        ids,
        deletedCount
      });

      return successResponse(res, {
        deletedIds: result.rows.map(r => r.id),
        deletedCount
      }, `成功删除 ${deletedCount} 个收款码`);
    } catch (error) {
      logger.error('批量删除收款码失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 批量停用
   * POST /api/admin/payment-codes/batch-disable
   */
  async batchDisable(req, res, next) {
    try {
      const { ids, reason } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, '请提供要停用的ID列表', 400);
      }

      const updateSql = `
        UPDATE qr_codes
        SET status = 'stopped',
            stop_reason = $1,
            stop_by = $2,
            stop_time = NOW(),
            updated_at = NOW()
        WHERE id = ANY($3) AND status != 'stopped'
        RETURNING id, name
      `;

      const result = await query(updateSql, [reason || '批量停用', req.user.id, ids]);

      const disabledCount = result.rows.length;

      logger.info('管理员批量停用收款码成功', {
        userId: req.user.id,
        ids,
        reason,
        disabledCount
      });

      return successResponse(res, {
        disabledIds: result.rows.map(r => r.id),
        disabledCount
      }, `成功停用 ${disabledCount} 个收款码`);
    } catch (error) {
      logger.error('批量停用收款码失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 执行安全检查
   * POST /api/admin/payment-codes/:id/security-check
   */
  async performSecurityCheck(req, res, next) {
    try {
      const { id } = req.params;

      const checkSql = 'SELECT id, name, platform, merchant_account, qr_code_url FROM qr_codes WHERE id = $1';
      const checkResult = await query(checkSql, [id]);

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const qrCode = checkResult.rows[0];

      const securityCheckResult = await this.performSecurityCheckLogic(qrCode);

      await query(`
        UPDATE qr_codes
        SET security_status = $1,
            last_security_check_time = NOW(),
            last_security_check_result = $2,
            security_check_details = $3,
            updated_at = NOW()
        WHERE id = $4
      `, [
        securityCheckResult.result,
        JSON.stringify(securityCheckResult),
        JSON.stringify(securityCheckResult.details),
        id
      ]);

      await query(`
        INSERT INTO qr_code_security_check_history (
          qr_code_id, result, risk_level, check_items, issues_found, details, checked_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        id,
        securityCheckResult.result,
        securityCheckResult.riskLevel,
        securityCheckResult.checkItems,
        securityCheckResult.issuesFound,
        JSON.stringify(securityCheckResult.details),
        req.user.id
      ]);

      logger.info('管理员执行安全检查成功', {
        userId: req.user.id,
        paymentCodeId: id,
        result: securityCheckResult.result,
        issuesFound: securityCheckResult.issuesFound
      });

      return successResponse(res, {
        checkTime: new Date().toISOString(),
        ...securityCheckResult
      }, '安全检查完成');
    } catch (error) {
      logger.error('安全检查失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 安全检查逻辑实现
   */
  async performSecurityCheckLogic(qrCode) {
    const details = [];
    let issuesFound = 0;
    const checkItems = 5;

    const qrCodeValidity = { item: '二维码有效性', status: 'pass', description: '二维码可正常识别' };
    if (!qrCode.qr_code_url || qrCode.qr_code_url.length < 10) {
      qrCodeValidity.status = 'fail';
      qrCodeValidity.description = '二维码URL无效';
      issuesFound++;
    }
    details.push(qrCodeValidity);

    const accountStatus = { item: '账户状态', status: 'pass', description: '收款账户状态正常' };
    if (!qrCode.merchant_account || !qrCode.merchant_account.includes('@')) {
      accountStatus.status = 'warning';
      accountStatus.description = '账户格式可能存在问题';
      issuesFound++;
    }
    details.push(accountStatus);

    const riskDetection = { item: '风控检测', status: 'pass', description: '未发现异常交易记录' };
    try {
      const riskCheckSql = `
        SELECT COUNT(*) as risk_count
        FROM qr_payment_records
        WHERE qr_code_id = $1 AND status = 'failed'
        AND created_at > NOW() - INTERVAL '30 days'
      `;
      const riskResult = await query(riskCheckSql, [qrCode.id]);
      const riskCount = parseInt(riskResult.rows[0]?.risk_count || 0);
      if (riskCount > 5) {
        riskDetection.status = 'warning';
        riskDetection.description = `近期有 ${riskCount} 笔失败交易，建议关注`;
        issuesFound++;
      } else if (riskCount > 10) {
        riskDetection.status = 'fail';
        riskDetection.description = `近期有 ${riskCount} 笔失败交易，存在较高风险`;
        issuesFound++;
        issuesFound++;
      }
    } catch (e) {
      riskDetection.status = 'warning';
      riskDetection.description = '无法完成风控检测';
      issuesFound++;
    }
    details.push(riskDetection);

    const complianceCheck = { item: '合规性检查', status: 'pass', description: '符合平台规范' };
    const platformValid = ['alipay', 'wechat', 'unionpay'].includes(qrCode.platform);
    if (!platformValid) {
      complianceCheck.status = 'fail';
      complianceCheck.description = '不支持的支付平台';
      issuesFound++;
    }
    details.push(complianceCheck);

    const usagePattern = { item: '使用模式检测', status: 'pass', description: '使用模式正常' };
    try {
      const usageSql = `
        SELECT
          COUNT(*) as total_count,
          MAX(created_at) as last_time
        FROM qr_payment_records
        WHERE qr_code_id = $1
      `;
      const usageResult = await query(usageSql, [qrCode.id]);
      const totalCount = parseInt(usageResult.rows[0]?.total_count || 0);
      if (totalCount > 1000) {
        usagePattern.status = 'pass';
        usagePattern.description = `累计使用 ${totalCount} 次，使用频繁`;
      } else if (totalCount === 0) {
        usagePattern.status = 'warning';
        usagePattern.description = '暂无使用记录';
        issuesFound++;
      }
    } catch (e) {
      usagePattern.status = 'warning';
      usagePattern.description = '无法获取使用记录';
      issuesFound++;
    }
    details.push(usagePattern);

    let result = 'safe';
    let riskLevel = '无';
    if (issuesFound >= 4) {
      result = 'abnormal';
      riskLevel = '严重';
    } else if (issuesFound >= 2) {
      result = 'risk';
      riskLevel = '中等';
    } else if (issuesFound >= 1) {
      result = 'risk';
      riskLevel = '低';
    }

    return {
      result,
      riskLevel,
      checkItems,
      issuesFound,
      details
    };
  }

  /**
   * 批量安全检查
   * POST /api/admin/payment-codes/batch-security-check
   */
  async batchSecurityCheck(req, res, next) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, '请提供要检查的ID列表', 400);
      }

      const qrCodesSql = 'SELECT id, name, platform, merchant_account, qr_code_url FROM qr_codes WHERE id = ANY($1)';
      const qrCodesResult = await query(qrCodesSql, [ids]);

      if (qrCodesResult.rows.length === 0) {
        return errorResponse(res, '未找到指定的收款码', 404);
      }

      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const qrCode of qrCodesResult.rows) {
        try {
          const checkResult = await this.performSecurityCheckLogic(qrCode);

          await query(`
            UPDATE qr_codes
            SET security_status = $1,
                last_security_check_time = NOW(),
                last_security_check_result = $2,
                security_check_details = $3,
                updated_at = NOW()
            WHERE id = $4
          `, [
            checkResult.result,
            JSON.stringify(checkResult),
            JSON.stringify(checkResult.details),
            qrCode.id
          ]);

          await query(`
            INSERT INTO qr_code_security_check_history (
              qr_code_id, result, risk_level, check_items, issues_found, details, checked_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            qrCode.id,
            checkResult.result,
            checkResult.riskLevel,
            checkResult.checkItems,
            checkResult.issuesFound,
            JSON.stringify(checkResult.details),
            req.user.id
          ]);

          results.push({
            id: qrCode.id,
            securityStatus: checkResult.result,
            riskLevel: checkResult.riskLevel,
            issuesCount: checkResult.issuesFound,
            success: true
          });
          successCount++;
        } catch (err) {
          results.push({
            id: qrCode.id,
            securityStatus: 'abnormal',
            riskLevel: '未知',
            issuesCount: 0,
            success: false,
            error: err.message
          });
          failCount++;
        }
      }

      logger.info('管理员批量安全检查完成', {
        userId: req.user.id,
        totalCount: ids.length,
        successCount,
        failCount
      });

      return successResponse(res, {
        totalCount: ids.length,
        successCount,
        failCount,
        results
      }, '批量安全检查完成');
    } catch (error) {
      logger.error('批量安全检查失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 获取安全检查报告
   * GET /api/admin/payment-codes/:id/security-report
   */
  async getSecurityReport(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      const historySql = `
        SELECT
          id,
          check_time as checkTime,
          result,
          risk_level as riskLevel,
          check_items as checkItems,
          issues_found as issuesFound,
          details,
          checked_by as checkedBy,
          created_at as createdAt
        FROM qr_code_security_check_history
        WHERE qr_code_id = $1
        ORDER BY check_time DESC
        LIMIT $2
      `;

      const historyResult = await query(historySql, [id, parseInt(limit)]);

      const latestCheckSql = `
        SELECT
          last_security_check_time as lastCheckTime,
          security_status as securityStatus,
          last_security_check_result as lastCheckResult
        FROM qr_codes
        WHERE id = $1
      `;

      const latestResult = await query(latestCheckSql, [id]);

      if (latestResult.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const history = historyResult.rows.map(row => {
        let details = row.details;
        if (typeof details === 'string') {
          try {
            details = JSON.parse(details);
          } catch {
            details = [];
          }
        }
        return this.processDateFields({
          ...row,
          details
        }, ['checkTime', 'createdAt']);
      });

      logger.info('管理员获取安全检查报告成功', {
        userId: req.user.id,
        paymentCodeId: id,
        historyCount: history.length
      });

      return successResponse(res, {
        currentStatus: latestResult.rows[0].securityStatus,
        lastCheckTime: latestResult.rows[0].lastchecktime,
        history
      }, '获取安全检查报告成功');
    } catch (error) {
      logger.error('获取安全检查报告失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 获取使用统计
   * GET /api/admin/payment-codes/:id/usage-statistics
   */
  async getUsageStatistics(req, res, next) {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      const qrCodeCheck = 'SELECT id, name FROM qr_codes WHERE id = $1';
      const qrCodeResult = await query(qrCodeCheck, [id]);

      if (qrCodeResult.rows.length === 0) {
        return errorResponse(res, '收款码不存在', 404);
      }

      const statsSql = `
        SELECT
          COUNT(*) as totalPayments,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successPayments,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingPayments,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedPayments,
          COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as totalAmount,
          COALESCE(AVG(CASE WHEN status = 'success' THEN amount ELSE NULL END), 0) as avgAmount,
          MAX(created_at) as lastPaymentTime
        FROM qr_payment_records
        WHERE qr_code_id = $1
      `;

      const dailyStatsSql = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count,
          COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as amount
        FROM qr_payment_records
        WHERE qr_code_id = $1 AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      const [statsResult, dailyResult] = await Promise.all([
        query(statsSql, [id]),
        query(dailyStatsSql, [id])
      ]);

      const stats = statsResult.rows[0];
      const dailyStats = dailyResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
        amount: parseFloat(row.amount)
      }));

      const successRate = stats.totalpayments > 0
        ? (parseInt(stats.successpayments) / parseInt(stats.totalpayments) * 100).toFixed(2)
        : 0;

      logger.info('管理员获取使用统计成功', {
        userId: req.user.id,
        paymentCodeId: id,
        days
      });

      return successResponse(res, {
        name: qrCodeResult.rows[0].name,
        summary: {
          totalPayments: parseInt(stats.totalpayments),
          successPayments: parseInt(stats.successpayments),
          pendingPayments: parseInt(stats.pendingpayments),
          failedPayments: parseInt(stats.failedpayments),
          successRate: parseFloat(successRate),
          totalAmount: parseFloat(stats.totalamount),
          avgAmount: parseFloat(stats.avgamount),
          lastPaymentTime: stats.lastpaymenttime
        },
        dailyStats
      }, '获取使用统计成功');
    } catch (error) {
      logger.error('获取使用统计失败', { error: error.message, paymentCodeId: req.params.id });
      next(error);
    }
  }

  /**
   * 获取整体统计数据
   * GET /api/admin/payment-codes/statistics
   */
  async getOverallStatistics(req, res, next) {
    try {
      const statsSql = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled,
          SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'stopped' THEN 1 ELSE 0 END) as stopped,
          SUM(CASE WHEN security_status = 'safe' THEN 1 ELSE 0 END) as safe,
          SUM(CASE WHEN security_status = 'risk' THEN 1 ELSE 0 END) as risk,
          SUM(CASE WHEN security_status = 'abnormal' THEN 1 ELSE 0 END) as abnormal,
          SUM(CASE WHEN audit_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN audit_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN audit_status = 'pending' THEN 1 ELSE 0 END) as pendingAudit,
          SUM(usage_count) as totalUsage
        FROM qr_codes
      `;

      const todayStatsSql = `
        SELECT COUNT(*) as todayUsage
        FROM qr_payment_records
        WHERE created_at >= CURRENT_DATE
      `;

      const [statsResult, todayResult] = await Promise.all([
        query(statsSql),
        query(todayStatsSql)
      ]);

      const stats = statsResult.rows[0];

      logger.info('管理员获取整体统计成功', { userId: req.user.id });

      return successResponse(res, {
        total: parseInt(stats.total),
        enabled: parseInt(stats.enabled),
        disabled: parseInt(stats.disabled),
        pending: parseInt(stats.pending),
        stopped: parseInt(stats.stopped),
        safe: parseInt(stats.safe),
        risk: parseInt(stats.risk),
        abnormal: parseInt(stats.abnormal),
        approved: parseInt(stats.approved),
        rejected: parseInt(stats.rejected),
        pendingAudit: parseInt(stats.pendingaudi),
        totalUsage: parseInt(stats.totalusage),
        todayUsage: parseInt(todayResult.rows[0]?.todayusage || 0)
      }, '获取统计数据成功');
    } catch (error) {
      logger.error('获取统计数据失败', { error: error.message });
      next(error);
    }
  }

  /**
   * 上传收款码图片
   * POST /api/admin/payment-codes/upload
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, '请上传图片文件', 400);
      }

      const imageUrl = `/uploads/qrcodes/${req.file.filename}`;

      logger.info('管理员上传收款码图片成功', {
        userId: req.user?.id || 'unknown',
        filename: req.file.filename
      });

      return successResponse(res, {
        url: imageUrl,
        originalName: req.file.originalname
      }, '图片上传成功');
    } catch (error) {
      logger.error('上传收款码图片失败', { error: error.message });
      next(error);
    }
  }
}

module.exports = new AdminPaymentCodeController();
