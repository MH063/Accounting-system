/**
 * 安全问题控制器
 * 处理用户安全问题的设置、验证和日志记录
 */

const BaseController = require('./BaseController');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');
const { pool } = require('../config/database');

class SecurityQuestionController extends BaseController {
  constructor() {
    super();
    this.db = {
      query: async (sql, params) => {
        const client = await pool.connect();
        try {
          const result = await client.query(sql, params);
          return result;
        } finally {
          client.release();
        }
      }
    };
  }

  /**
   * 获取用户安全问题配置（用于验证，不返回答案）
   * GET /api/security-questions/config
   */
  async getSecurityQuestionConfig(req, res, next) {
    try {
      const userId = req.user.id;

      logger.info('[SecurityQuestionController] 获取安全问题配置', { userId });

      const query = `
        SELECT 
          question1,
          question2,
          question3,
          is_enabled,
          is_verified
        FROM security_questions
        WHERE user_id = $1 AND is_enabled = TRUE
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        return this.sendSuccess(res, {
          hasSecurityQuestions: false,
          questions: []
        }, '用户未设置安全问题');
      }

      const row = result.rows[0];

      return this.sendSuccess(res, {
        hasSecurityQuestions: true,
        questions: [
          { question: row.question1 },
          { question: row.question2 },
          { question: row.question3 }
        ],
        isEnabled: row.is_enabled,
        isVerified: row.is_verified
      }, '获取安全问题配置成功');

    } catch (error) {
      logger.error('[SecurityQuestionController] 获取安全问题配置失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 获取用户安全问题配置（包含答案，用于验证）
   * POST /api/security-questions/config-for-verification
   */
  async getSecurityQuestionConfigForVerification(req, res, next) {
    try {
      const userId = req.user.id;

      logger.info('[SecurityQuestionController] 获取安全问题配置用于验证', { userId });

      const query = `
        SELECT 
          question1,
          question2,
          question3,
          answer1_hash,
          answer2_hash,
          answer3_hash,
          is_enabled
        FROM security_questions
        WHERE user_id = $1 AND is_enabled = TRUE
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        return this.sendError(res, '用户未设置安全问题', 404);
      }

      const row = result.rows[0];

      return this.sendSuccess(res, {
        question1: row.question1,
        question2: row.question2,
        question3: row.question3,
        answer1_hash: row.answer1_hash,
        answer2_hash: row.answer2_hash,
        answer3_hash: row.answer3_hash
      }, '获取安全问题配置成功');

    } catch (error) {
      logger.error('[SecurityQuestionController] 获取安全问题配置用于验证失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 保存用户安全问题配置
   * POST /api/security-questions/config
   */
  async saveSecurityQuestionConfig(req, res, next) {
    try {
      const userId = req.user.id;
      const { question1, answer1, question2, answer2, question3, answer3 } = req.body;

      logger.info('[SecurityQuestionController] 保存安全问题配置', { userId });

      this.validateRequiredFields(req.body, ['question1', 'answer1', 'question2', 'answer2', 'question3', 'answer3']);

      if (question1 === question2 || question1 === question3 || question2 === question3) {
        return this.sendError(res, '安全问题不能重复', 400);
      }

      const answer1Hash = await bcrypt.hash(answer1.toLowerCase().trim(), 10);
      const answer2Hash = await bcrypt.hash(answer2.toLowerCase().trim(), 10);
      const answer3Hash = await bcrypt.hash(answer3.toLowerCase().trim(), 10);

      const checkQuery = `
        SELECT id FROM security_questions WHERE user_id = $1
      `;
      const checkResult = await this.db.query(checkQuery, [userId]);

      let query;
      let params;

      if (checkResult.rows.length > 0) {
        query = `
          UPDATE security_questions
          SET 
            question1 = $2,
            answer1_hash = $3,
            question2 = $4,
            answer2_hash = $5,
            question3 = $6,
            answer3_hash = $7,
            is_enabled = TRUE,
            is_verified = FALSE,
            updated_at = NOW()
          WHERE user_id = $1
          RETURNING id
        `;
        params = [userId, question1, answer1Hash, question2, answer2Hash, question3, answer3Hash];
      } else {
        query = `
          INSERT INTO security_questions (
            user_id, question1, answer1_hash, question2, answer2_hash, 
            question3, answer3_hash, is_enabled, is_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, FALSE)
          RETURNING id
        `;
        params = [userId, question1, answer1Hash, question2, answer2Hash, question3, answer3Hash];
      }

      await this.db.query(query, params);

      logger.audit(req, '用户设置安全问题', { userId });

      return this.sendSuccess(res, {
        hasSecurityQuestions: true
      }, '安全问题设置成功');

    } catch (error) {
      logger.error('[SecurityQuestionController] 保存安全问题配置失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 验证安全问题答案
   * POST /api/security-questions/verify
   */
  async verifySecurityQuestionAnswers(req, res, next) {
    try {
      const userId = req.user.id;
      const { answers } = req.body;

      logger.info('[SecurityQuestionController] 验证安全问题答案', { userId });

      this.validateRequiredFields(req.body, ['answers']);

      if (!Array.isArray(answers) || answers.length !== 3) {
        return this.sendError(res, '必须提供3个答案', 400);
      }

      const query = `
        SELECT 
          answer1_hash,
          answer2_hash,
          answer3_hash
        FROM security_questions
        WHERE user_id = $1 AND is_enabled = TRUE
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        return this.sendError(res, '用户未设置安全问题', 404);
      }

      const row = result.rows[0];
      const answersHash = [row.answer1_hash, row.answer2_hash, row.answer3_hash];

      const verificationResults = await Promise.all(
        answers.map(async (answer, index) => {
          const isMatch = await bcrypt.compare(
            answer.toLowerCase().trim(),
            answersHash[index]
          );
          return isMatch;
        })
      );

      const allCorrect = verificationResults.every(result => result);

      if (allCorrect) {
        await this.db.query(
          `UPDATE security_questions 
           SET is_verified = TRUE, last_verified_at = NOW() 
           WHERE user_id = $1`,
          [userId]
        );

        logger.audit(req, '安全问题验证成功', { userId });

        return this.sendSuccess(res, {
          success: true,
          message: '验证成功'
        }, '安全问题验证成功');
      } else {
        logger.security(req, '安全问题验证失败', { userId });

        return this.sendError(res, '答案不正确', 401);
      }

    } catch (error) {
      logger.error('[SecurityQuestionController] 验证安全问题答案失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 检查用户是否已设置安全问题
   * GET /api/security-questions/check
   */
  async checkSecurityQuestionsSetup(req, res, next) {
    try {
      const userId = req.user.id;

      logger.info('[SecurityQuestionController] 检查安全问题设置状态', { userId });

      const query = `
        SELECT 
          question1,
          question2,
          question3,
          is_enabled
        FROM security_questions
        WHERE user_id = $1
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        return this.sendSuccess(res, {
          hasSecurityQuestions: false
        }, '用户未设置安全问题');
      }

      const row = result.rows[0];
      const hasQuestions = row.question1 && row.question2 && row.question3;

      return this.sendSuccess(res, {
        hasSecurityQuestions: hasQuestions && row.is_enabled
      }, '检查完成');

    } catch (error) {
      logger.error('[SecurityQuestionController] 检查安全问题设置状态失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 记录安全验证日志
   * POST /api/security-verification/log
   */
  async logSecurityVerification(req, res, next) {
    try {
      const userId = req.user.id;
      const { operation, verificationType, success, reason } = req.body;

      logger.info('[SecurityQuestionController] 记录安全验证日志', { userId, operation, success });

      this.validateRequiredFields(req.body, ['operation', 'verificationType', 'success']);

      const query = `
        INSERT INTO security_verification_logs (
          user_id, operation, verification_type, success, reason,
          ip_address, user_agent, device_info, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `;

      const result = await this.db.query(query, [
        userId,
        operation,
        verificationType,
        success,
        reason || null,
        req.ip,
        req.get('User-Agent'),
        JSON.stringify({
          headers: req.headers
        })
      ]);

      logger.audit(req, '记录安全验证日志', { 
        userId, 
        operation, 
        verificationType, 
        success 
      });

      return this.sendSuccess(res, {
        logId: result.rows[0].id
      }, '安全验证日志记录成功');

    } catch (error) {
      logger.error('[SecurityQuestionController] 记录安全验证日志失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 获取用户安全验证日志
   * GET /api/security-verification/logs
   */
  async getSecurityVerificationLogs(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0, operation, verificationType, success } = req.query;

      logger.info('[SecurityQuestionController] 获取安全验证日志', { userId });

      let query = `
        SELECT 
          id,
          operation,
          verification_type,
          success,
          reason,
          ip_address,
          user_agent,
          country,
          region,
          city,
          created_at
        FROM security_verification_logs
        WHERE user_id = $1
      `;
      const params = [userId];
      let paramIndex = 2;

      if (operation) {
        query += ` AND operation = $${paramIndex}`;
        params.push(operation);
        paramIndex++;
      }

      if (verificationType) {
        query += ` AND verification_type = $${paramIndex}`;
        params.push(verificationType);
        paramIndex++;
      }

      if (success !== undefined) {
        query += ` AND success = $${paramIndex}`;
        params.push(success === 'true');
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await this.db.query(query, params);

      return this.sendSuccess(res, {
        logs: result.rows,
        total: result.rows.length
      }, '获取安全验证日志成功');

    } catch (error) {
      logger.error('[SecurityQuestionController] 获取安全验证日志失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }

  /**
   * 删除用户安全问题配置
   * DELETE /api/security-questions/config
   */
  async deleteSecurityQuestionConfig(req, res, next) {
    try {
      const userId = req.user.id;

      logger.info('[SecurityQuestionController] 删除安全问题配置', { userId });

      const query = `
        DELETE FROM security_questions
        WHERE user_id = $1
        RETURNING id
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        return this.sendError(res, '用户未设置安全问题', 404);
      }

      logger.audit(req, '用户删除安全问题', { userId });

      return this.sendSuccess(res, {
        deleted: true
      }, '安全问题删除成功');

    } catch (error) {
      logger.error('[SecurityQuestionController] 删除安全问题配置失败', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }
}

module.exports = new SecurityQuestionController();
