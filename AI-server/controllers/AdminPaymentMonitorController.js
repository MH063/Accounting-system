/**
 * 管理员支付监控控制器
 * 提供支付记录监控功能的管理端API接口
 */

const BaseController = require('./BaseController');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../middleware/response');

class AdminPaymentMonitorController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取监控统计数据
   * GET /api/admin/payments/monitor/stats
   * 
   * 返回今日成功支付数、失败支付数、待处理异常数、今日交易总额
   */
  async getMonitorStats(req, res, next) {
    try {
      logger.info('获取监控统计数据 (UTC+8)');

      // 明确使用北京时间 (UTC+8) 来定义“今天”
      const todayResult = await query("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'PRC')::date as today");
      const todayStr = todayResult.rows[0].today;
      logger.info(`当前统计日期 (北京时间): ${todayStr}`);

      const todaySuccessResult = await query(
        `SELECT COUNT(*) as count FROM payment_monitor_logs 
         WHERE (create_time AT TIME ZONE 'PRC')::date = $1::date AND status = 'success'`,
        [todayStr]
      );

      const todayFailedResult = await query(
        `SELECT COUNT(*) as count FROM payment_monitor_logs 
         WHERE (create_time AT TIME ZONE 'PRC')::date = $1::date AND status = 'failed'`,
        [todayStr]
      );

      const pendingExceptionsResult = await query(
        `SELECT COUNT(*) as count FROM payment_monitor_logs 
         WHERE is_exception = true AND exception_status = 'pending'`
      );

      const todayAmountResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payment_monitor_logs 
         WHERE (create_time AT TIME ZONE 'PRC')::date = $1::date AND status = 'success'`,
        [todayStr]
      );

      const stats = {
        todaySuccess: parseInt(todaySuccessResult.rows[0]?.count || 0),
        todayFailed: parseInt(todayFailedResult.rows[0]?.count || 0),
        pendingExceptions: parseInt(pendingExceptionsResult.rows[0]?.count || 0),
        todayAmount: parseFloat(todayAmountResult.rows[0]?.total || 0)
      };

      logger.info('监控统计数据结果:', stats);

      return successResponse(res, stats, '获取监控统计数据成功');
    } catch (error) {
      logger.error('获取监控统计数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付记录列表
   * GET /api/admin/payments/monitor/records
   * 
   * 查询参数:
   * - orderNo: 订单号（模糊搜索）
   * - paymentMethod: 支付方式
   * - status: 支付状态
   * - startDate: 开始日期
   * - endDate: 结束日期
   * - page: 页码，默认1
   * - size: 每页数量，默认20
   */
  async getPaymentRecords(req, res, next) {
    try {
      logger.info('获取支付记录列表:', req.query);

      const {
        orderNo = '',
        paymentMethod = '',
        status = '',
        startDate = '',
        endDate = '',
        page = 1,
        size = 20
      } = req.query;

      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(size) || 20;
      const offset = (pageNum - 1) * pageSize;

      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      if (orderNo) {
        whereConditions.push(`(order_no ILIKE $${paramIndex} OR merchant_order_no ILIKE $${paramIndex})`);
        params.push(`%${orderNo}%`);
        paramIndex++;
      }

      if (paymentMethod) {
        whereConditions.push(`payment_method = $${paramIndex}`);
        params.push(paymentMethod);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > 90) {
          return errorResponse(res, '查询时间范围不能超过3个月', 400);
        }
      }

      if (startDate) {
        // 使用时区转换确保精确匹配 (PRC)
        whereConditions.push(`create_time >= $${paramIndex}::timestamp AT TIME ZONE 'PRC'`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        // 使用时区转换确保精确匹配 (PRC)
        whereConditions.push(`create_time <= $${paramIndex}::timestamp AT TIME ZONE 'PRC'`);
        params.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const countSql = `SELECT COUNT(*) as total FROM payment_monitor_logs ${whereClause}`;
      const countResult = await query(countSql, params);
      const total = parseInt(countResult.rows[0]?.total || 0);

      const recordsSql = `
        SELECT 
          id,
          order_no as "orderNo",
          merchant_order_no as "merchantOrderNo",
          transaction_id as "transactionNo",
          user_id as "userId",
          user_name as "userName",
          amount,
          payment_method as "paymentMethod",
          status,
          expense_title as "expenseTitle",
          create_time as "createTime",
          complete_time as "completeTime",
          expense_date as "expenseDate",
          remark,
          is_exception as "isException",
          exception_type as "exceptionType",
          exception_description as "exceptionDescription",
          exception_status as "exceptionStatus",
          exception_handler as "exceptionHandler",
          exception_handle_time as "exceptionHandleTime",
          exception_marked_at as "exceptionMarkedAt",
          exception_marked_by as "exceptionMarkedBy"
        FROM payment_monitor_logs 
        ${whereClause}
        ORDER BY create_time DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(pageSize, offset);
      const recordsResult = await query(recordsSql, params);

      const records = recordsResult.rows.map(row => ({
        ...row,
        isException: row.isException || false,
        exception: row.isException ? {
          type: row.exceptionType || 'manual',
          description: row.exceptionDescription || '手动标记异常',
          status: row.exceptionStatus || 'pending',
          handler: row.exceptionHandler || '',
          handleTime: row.exceptionHandleTime || ''
        } : null
      }));

      return successResponse(res, {
        records,
        total,
        page: pageNum,
        size: pageSize,
        pages: Math.ceil(total / pageSize)
      }, '获取支付记录列表成功');
    } catch (error) {
      logger.error('获取支付记录列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付记录详情
   * GET /api/admin/payments/monitor/records/:id
   */
  async getPaymentRecordDetail(req, res, next) {
    try {
      const { id } = req.params;
      logger.info('获取支付记录详情:', id);

      const result = await query(
        `SELECT 
          id,
          order_no as "orderNo",
          merchant_order_no as "merchantOrderNo",
          transaction_id as "transactionNo",
          user_id as "userId",
          user_name as "userName",
          amount,
          payment_method as "paymentMethod",
          status,
          expense_title as "expenseTitle",
          create_time as "createTime",
          complete_time as "completeTime",
          expense_date as "expenseDate",
          remark,
          is_exception as "isException",
          exception_type as "exceptionType",
          exception_description as "exceptionDescription",
          exception_status as "exceptionStatus",
          exception_handler as "exceptionHandler",
          exception_handle_time as "exceptionHandleTime",
          exception_marked_at as "exceptionMarkedAt",
          exception_marked_by as "exceptionMarkedBy"
        FROM payment_monitor_logs 
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, '支付记录不存在', 404);
      }

      const row = result.rows[0];
      const record = {
        ...row,
        isException: row.isException || false,
        exception: row.isException ? {
          type: row.exceptionType || 'manual',
          description: row.exceptionDescription || '手动标记异常',
          status: row.exceptionStatus || 'pending',
          handler: row.exceptionHandler || '',
          handleTime: row.exceptionHandleTime || ''
        } : null
      };

      return successResponse(res, record, '获取支付记录详情成功');
    } catch (error) {
      logger.error('获取支付记录详情失败:', error);
      next(error);
    }
  }

  /**
   * 标记支付记录为异常
   * POST /api/admin/payments/monitor/records/:id/mark-exception
   */
  async markException(req, res, next) {
    try {
      const { id } = req.params;
      const { type, description } = req.body;
      const adminId = req.user?.id;

      logger.info('标记支付记录为异常:', id, type, description);

      if (!type) {
        return errorResponse(res, '请提供异常类型');
      }

      const validTypes = ['timeout', 'amount_mismatch', 'duplicate', 'complaint', 'other'];
      if (!validTypes.includes(type)) {
        return errorResponse(res, '无效的异常类型');
      }

      const checkResult = await query(
        'SELECT id, is_exception FROM payment_monitor_logs WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '支付记录不存在', 404);
      }

      if (checkResult.rows[0].is_exception) {
        return errorResponse(res, '该记录已经标记为异常');
      }

      const result = await query(
        `UPDATE payment_monitor_logs 
         SET is_exception = true,
             exception_type = $1,
             exception_description = $2,
             exception_status = 'pending',
             exception_marked_at = NOW(),
             exception_marked_by = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [type, description || '', adminId, id]
      );

      const row = result.rows[0];
      const record = {
        id: row.id,
        isException: true,
        exception: {
          type: row.exception_type,
          description: row.exception_description,
          status: row.exception_status,
          handler: '',
          handleTime: ''
        }
      };

      return successResponse(res, record, '异常标记成功');
    } catch (error) {
      logger.error('标记异常失败:', error);
      next(error);
    }
  }

  /**
   * 处理异常记录
   * POST /api/admin/payments/monitor/records/:id/process-exception
   */
  async processException(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.id;

      logger.info('处理异常记录:', id, notes);

      const checkResult = await query(
        'SELECT id, is_exception, exception_status FROM payment_monitor_logs WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '支付记录不存在', 404);
      }

      if (!checkResult.rows[0].is_exception) {
        return errorResponse(res, '该记录未标记为异常');
      }

      if (checkResult.rows[0].exception_status === 'processed') {
        return errorResponse(res, '该异常已经处理过了');
      }

      const result = await query(
        `UPDATE payment_monitor_logs 
         SET exception_status = 'processed',
             exception_handler = $1,
             exception_handle_time = NOW(),
             reviewed_by = $1,
             reviewed_at = NOW(),
             review_notes = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [adminId, notes || '', id]
      );

      const row = result.rows[0];
      const record = {
        id: row.id,
        isException: true,
        exception: {
          type: row.exception_type,
          description: row.exception_description,
          status: row.exception_status,
          handler: req.user?.name || '管理员',
          handleTime: row.exception_handle_time
        }
      };

      return successResponse(res, record, '异常处理成功');
    } catch (error) {
      logger.error('处理异常失败:', error);
      next(error);
    }
  }

  /**
   * 取消异常标记
   * POST /api/admin/payments/monitor/records/:id/cancel-exception
   */
  async cancelException(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      logger.info('取消异常标记:', id, reason);

      const checkResult = await query(
        'SELECT id, is_exception FROM payment_monitor_logs WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return errorResponse(res, '支付记录不存在', 404);
      }

      if (!checkResult.rows[0].is_exception) {
        return errorResponse(res, '该记录未标记为异常');
      }

      const result = await query(
        `UPDATE payment_monitor_logs 
         SET is_exception = false,
             exception_type = NULL,
             exception_description = NULL,
             exception_status = NULL,
             exception_handler = NULL,
             exception_handle_time = NULL,
             exception_marked_at = NULL,
             exception_marked_by = NULL,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return successResponse(res, { id: result.rows[0].id }, '取消异常标记成功');
    } catch (error) {
      logger.error('取消异常标记失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付状态统计图表数据
   * GET /api/admin/payments/monitor/charts/status
   */
  async getStatusChartData(req, res, next) {
    try {
      logger.info('获取支付状态统计图表数据');

      const result = await query(
        `SELECT status, COUNT(*) as count 
         FROM payment_monitor_logs 
         GROUP BY status 
         ORDER BY count DESC`
      );

      const statusMap = {
        'success': '成功',
        'failed': '失败',
        'processing': '处理中',
        'refunded': '已退款',
        'pending': '待支付'
      };

      const colorMap = {
        'success': '#67C23A',
        'failed': '#F56C6C',
        'processing': '#E6A23C',
        'refunded': '#409EFF',
        'pending': '#909399'
      };

      const data = result.rows.map(row => ({
        value: parseInt(row.count),
        name: statusMap[row.status] || row.status,
        itemStyle: { color: colorMap[row.status] || '#909399' }
      }));

      return successResponse(res, { data }, '获取支付状态统计图表数据成功');
    } catch (error) {
      logger.error('获取支付状态统计图表数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付方式分布图表数据
   * GET /api/admin/payments/monitor/charts/methods
   */
  async getMethodChartData(req, res, next) {
    try {
      logger.info('获取支付方式分布图表数据');

      const result = await query(
        `SELECT payment_method as method, COUNT(*) as count 
         FROM payment_monitor_logs 
         GROUP BY payment_method 
         ORDER BY count DESC`
      );

      const methodMap = {
        'alipay': '支付宝',
        'wechat': '微信',
        'bank': '银行卡',
        'cash': '现金',
        'unknown': '未知'
      };

      const data = result.rows.map(row => ({
        method: methodMap[row.method] || row.method,
        count: parseInt(row.count)
      }));

      const categories = data.map(d => d.method);
      const counts = data.map(d => d.count);

      return successResponse(res, { categories, data: counts }, '获取支付方式分布图表数据成功');
    } catch (error) {
      logger.error('获取支付方式分布图表数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付成功率趋势图表数据
   * GET /api/admin/payments/monitor/charts/success-rate
   */
  async getSuccessRateChartData(req, res, next) {
    try {
      const { days = 14 } = req.query;
      logger.info('获取支付成功率趋势图表数据 (15天动态范围):', days);

      const daysNum = parseInt(days) || 14;

      // 使用 generate_series 生成连续的 15 天日期序列 (今日 + 前 14 天)
      const result = await query(
        `WITH date_series AS (
           SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::date as stat_date
           FROM generate_series(0, $1) n
         ),
         daily_stats AS (
           SELECT 
             (create_time AT TIME ZONE 'PRC')::date as record_date,
             COUNT(*) as total,
             SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count
           FROM payment_monitor_logs 
           WHERE create_time >= CURRENT_DATE - ($1 || ' days')::INTERVAL
           GROUP BY record_date
         )
         SELECT 
           TO_CHAR(ds.stat_date, 'YYYY-MM-DD') as date_str,
           COALESCE(s.total, 0) as total,
           COALESCE(s.success_count, 0) as success_count
         FROM date_series ds
         LEFT JOIN daily_stats s ON ds.stat_date = s.record_date
         ORDER BY ds.stat_date ASC`,
        [daysNum]
      );

      const dates = [];
      const rates = [];

      result.rows.forEach(row => {
        dates.push(row.date_str); // 返回完整的 YYYY-MM-DD 格式
        const total = parseInt(row.total);
        const successCount = parseInt(row.success_count);
        const rate = total > 0 ? Math.round((successCount / total) * 1000) / 10 : 0;
        rates.push(rate);
      });

      logger.info('支付成功率趋势数据统计完成:', { count: dates.length });

      return successResponse(res, { dates, rates }, '获取支付成功率趋势图表数据成功');
    } catch (error) {
      logger.error('获取支付成功率趋势图表数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取支付时间分布图表数据
   * GET /api/admin/payments/monitor/charts/time-distribution
   */
  async getTimeDistributionChartData(req, res, next) {
    try {
      logger.info('获取支付时间分布图表数据 (全量历史统计)');

      const result = await query(
        `SELECT 
           floor(EXTRACT(HOUR FROM create_time) / 2) * 2 as hour_group,
           COUNT(*) as count
         FROM payment_monitor_logs 
         GROUP BY hour_group
         ORDER BY hour_group`
      );

      const timeSlots = [
        '0-2点', '2-4点', '4-6点', '6-8点', 
        '8-10点', '10-12点', '12-14点', '14-16点', 
        '16-18点', '18-20点', '20-22点', '22-24点'
      ];

      const slotCounts = new Array(12).fill(0);

      result.rows.forEach(row => {
        const hourGroup = parseInt(row.hour_group);
        const slotIndex = hourGroup / 2;
        if (slotIndex >= 0 && slotIndex < 12) {
          slotCounts[slotIndex] = parseInt(row.count);
        }
      });

      logger.info('支付时间分布统计结果:', { slotCounts });

      return successResponse(res, { 
        timeSlots, 
        data: slotCounts 
      }, '获取支付时间分布图表数据成功');
    } catch (error) {
      logger.error('获取支付时间分布图表数据失败:', error);
      next(error);
    }
  }

  /**
   * 获取实时监控数据流 (SSE)
   * GET /api/admin/payments/monitor/realtime
   */
  async getRealtimeMonitorStream(req, res, next) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    logger.info('客户端已连接实时监控数据流 (SSE)');

    // 立即发送一次当前时间，用于同步
    const sendEvent = (data, event = 'message') => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const fetchRealtimeData = async () => {
      try {
        // 1. 获取服务器当前时间
        const serverTime = new Date();
        
        // 2. 获取今日核心统计指标
        const todayStr = (await query("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'PRC')::date as today")).rows[0].today;
        
        const statsResult = await query(
          `SELECT 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
             COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_amount
           FROM payment_monitor_logs 
           WHERE (create_time AT TIME ZONE 'PRC')::date = $1::date`,
          [todayStr]
        );

        const pendingExceptionsResult = await query(
          `SELECT COUNT(*) as count FROM payment_monitor_logs 
           WHERE is_exception = true AND exception_status = 'pending'`
        );

        const stats = {
          todaySuccess: parseInt(statsResult.rows[0]?.success_count || 0),
          todayFailed: parseInt(statsResult.rows[0]?.failed_count || 0),
          pendingExceptions: parseInt(pendingExceptionsResult.rows[0]?.count || 0),
          todayAmount: parseFloat(statsResult.rows[0]?.total_amount || 0),
          serverTime: serverTime.toISOString(),
          timestamp: Date.now()
        };

        // 2.1 获取支付状态分布 (用于饼图)
        const statusMap = { 'success': '成功', 'failed': '失败', 'processing': '处理中', 'refunded': '已退款', 'pending': '待支付' };
        const colorMap = { 'success': '#67C23A', 'failed': '#F56C6C', 'processing': '#E6A23C', 'refunded': '#409EFF', 'pending': '#909399' };
        
        const statusDistResult = await query(
          `SELECT status, COUNT(*) as count 
           FROM payment_monitor_logs 
           GROUP BY status`
        );
        const statusDistribution = statusDistResult.rows.map(row => ({
          value: parseInt(row.count),
          name: statusMap[row.status] || row.status,
          itemStyle: { color: colorMap[row.status] || '#909399' }
        }));

        // 2.2 获取支付方式分布 (用于柱状图)
        const methodDistResult = await query(
          `SELECT payment_method as method, COUNT(*) as count 
           FROM payment_monitor_logs 
           GROUP BY payment_method 
           ORDER BY count DESC`
        );
        const methodDistribution = {
          categories: methodDistResult.rows.map(r => r.method),
          data: methodDistResult.rows.map(r => parseInt(r.count))
        };

        // 3. 获取最近 30 分钟的成功率趋势 (分钟级)
        // (规则：确保时间轴连续性，后端自动补全 30 分钟内的空点)
        const trendResult = await query(
          `WITH minutes AS (
             SELECT TO_CHAR(CURRENT_TIMESTAMP - (n || ' minutes')::INTERVAL, 'HH24:MI') as minute_str
             FROM generate_series(0, 29) n
           )
           SELECT 
             m.minute_str,
             COALESCE(COUNT(p.id), 0) as total,
             COALESCE(SUM(CASE WHEN p.status = 'success' THEN 1 ELSE 0 END), 0) as success_count
           FROM minutes m
           LEFT JOIN payment_monitor_logs p ON TO_CHAR(p.create_time, 'HH24:MI') = m.minute_str
             AND p.create_time >= CURRENT_TIMESTAMP - INTERVAL '30 minutes'
           GROUP BY m.minute_str
           ORDER BY m.minute_str ASC`
        );

        const trend = trendResult.rows.map(row => {
          const total = parseInt(row.total);
          const successCount = parseInt(row.success_count);
          return {
            time: row.minute_str,
            rate: total > 0 ? Math.round((successCount / total) * 1000) / 10 : null, // 使用 null 标记无交易点
            isEstimated: total === 0 // 标记是否为补间点
          };
        });

        // 4. 获取支付时间分布 (全量历史统计，确保 0-24 小时数据完整性)
        const timeDistResult = await query(
          `SELECT 
             floor(extract(hour from create_time) / 2) * 2 as hour_group,
             COUNT(*) as count
           FROM payment_monitor_logs
           GROUP BY hour_group
           ORDER BY hour_group ASC`
        );

        const timeSlots = ['0-2点', '2-4点', '4-6点', '6-8点', '8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点', '20-22点', '22-24点'];
        const timeDistData = new Array(12).fill(0);
        timeDistResult.rows.forEach(row => {
          const index = parseInt(row.hour_group) / 2;
          if (index >= 0 && index < 12) {
            timeDistData[index] = parseInt(row.count);
          }
        });

        sendEvent({ 
          stats, 
          statusDistribution,
          methodDistribution,
          trend, 
          timeDistribution: { timeSlots, data: timeDistData },
          version: Date.now() 
        });
      } catch (error) {
        logger.error('实时监控数据抓取失败:', error);
        sendEvent({ error: '数据抓取失败', message: error.message }, 'error');
      }
    };

    // 每 30 秒推送一次
    const timer = setInterval(fetchRealtimeData, 30000);
    
    // 初始发送
    fetchRealtimeData();

    req.on('close', () => {
      clearInterval(timer);
      logger.info('客户端已断开实时监控数据流 (SSE)');
      res.end();
    });
  }

  /**
   * 导出支付记录
   * GET /api/admin/payments/monitor/export
   */
  async exportPaymentRecords(req, res, next) {
    try {
      logger.info('导出支付记录:', req.query);

      const {
        orderNo = '',
        paymentMethod = '',
        status = '',
        startDate = '',
        endDate = ''
      } = req.query;

      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      if (orderNo) {
        whereConditions.push(`(order_no ILIKE $${paramIndex} OR merchant_order_no ILIKE $${paramIndex})`);
        params.push(`%${orderNo}%`);
        paramIndex++;
      }

      if (paymentMethod) {
        whereConditions.push(`payment_method = $${paramIndex}`);
        params.push(paymentMethod);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`expense_date >= $${paramIndex}`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`expense_date <= $${paramIndex}`);
        params.push(endDate);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      const result = await query(
        `SELECT 
          order_no as "订单号",
          merchant_order_no as "商户订单号",
          transaction_id as "支付流水号",
          user_name as "用户姓名",
          amount as "金额",
          payment_method as "支付方式",
          status as "支付状态",
          expense_title as "费用标题",
          create_time as "创建时间",
          complete_time as "完成时间",
          remark as "备注",
          is_exception as "是否异常",
          exception_type as "异常类型",
          exception_description as "异常描述"
        FROM payment_monitor_logs 
        ${whereClause}
        ORDER BY create_time DESC`,
        params
      );

      const exportData = result.rows;
      const csvContent = this.generateCSV(exportData);

      const filename = `payment_records_export_${new Date().toISOString().slice(0, 10)}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.send('\uFEFF' + csvContent);
    } catch (error) {
      logger.error('导出支付记录失败:', error);
      next(error);
    }
  }

  /**
   * 生成CSV内容
   * @param {Array} data - 数据数组
   * @returns {string} CSV格式字符串
   */
  generateCSV(data) {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(','));

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = new AdminPaymentMonitorController();
