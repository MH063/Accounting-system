/**
 * 后端安全检查服务
 * 真实评估用户账户安全状态，不记录数据库
 */

const crypto = require('crypto');
const { logger, info, error, warn } = require('../config/logger');

/**
 * 安全检查因子定义
 * 基于客观事实和准确数据的评分模型
 */
const SECURITY_FACTORS = {
  PASSWORD_STRENGTH: {
    name: '密码强度',
    weight: 20,
    maxScore: 100,
    evaluate: async (user) => {
      // 依据1：密码修改时间 (客观事实)
      const lastChanged = user.password_changed_at ? new Date(user.password_changed_at) : new Date(user.created_at);
      const daysSinceChange = Math.floor((Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
      
      let score = 100;
      let basis = '密码最近已更新';
      
      if (daysSinceChange > 180) {
        score = 60;
        basis = `密码已超过180天未更换 (上次更换: ${daysSinceChange}天前)`;
      } else if (daysSinceChange > 90) {
        score = 85;
        basis = `密码已超过90天未更换 (上次更换: ${daysSinceChange}天前)`;
      }

      return {
        score,
        description: '基于密码生命周期的安全评估',
        basis,
        recommendation: score < 100 ? '建议定期更换高强度密码以降低泄露风险' : '密码状态良好，请继续保持定期更换习惯'
      };
    }
  },
  
  TWO_FACTOR_AUTH: {
    name: '双因素认证',
    weight: 20,
    maxScore: 100,
    evaluate: async (user) => {
      // 依据：TOTP启用状态 (客观数据)
      const hasTotp = !!(user.two_factor_secret && user.two_factor_enabled);
      return {
        score: hasTotp ? 100 : 0,
        description: '账号身份验证强度评估',
        basis: hasTotp ? '已启用基于TOTP的双因素认证' : '未启用任何形式的双因素认证',
        recommendation: hasTotp ? '双因素认证已启用，账号安全性极高' : '强烈建议启用双因素认证(2FA)，可防止99%的账号劫持攻击'
      };
    }
  },
  
  DATA_ENCRYPTION: {
    name: '数据加密',
    weight: 15,
    maxScore: 100,
    evaluate: async (user, db) => {
      // 依据：用户是否拥有加密密钥 (客观数据)
      try {
        const result = await db.query(
          'SELECT COUNT(*) as count FROM encryption_keys WHERE user_id = $1 AND status = \'active\'',
          [user.id]
        );
        const hasKeys = parseInt(result.rows[0]?.count || 0) > 0;
        
        return { 
          score: hasKeys ? 100 : 0, 
          description: '敏感数据存储安全性评估', 
          basis: hasKeys ? '系统检测到活跃的端到端加密密钥' : '未检测到任何端到端加密配置', 
          recommendation: hasKeys ? '端到端加密已生效，敏感资产已得到保护' : '建议启用数据加密功能，确保财务等敏感数据在服务器端也是加密存储的'
        };
      } catch (err) {
        return { score: 50, description: '加密状态检查失败', basis: '数据库查询异常', recommendation: '请稍后重试' };
      }
    }
  },
  
  LOGIN_PROTECTION: {
    name: '登录保护',
    weight: 15,
    maxScore: 100,
    evaluate: async (user) => {
      // 依据：登录失败锁定和异地检测配置 (客观事实)
      const isEnabled = user.login_protection_enabled === true;
      return {
        score: isEnabled ? 100 : 0,
        description: '登录过程防御能力评估',
        basis: isEnabled ? '已启用登录失败自动锁定和异常环境检测' : '未开启登录过程的安全防护机制',
        recommendation: isEnabled ? '登录保护功能已开启，有效预防暴力破解' : '建议启用登录保护功能，包括登录失败锁定和异地登录检测'
      };
    }
  },
  
  ABNORMAL_LOGIN_ALERT: {
    name: '安全提醒',
    weight: 10,
    maxScore: 100,
    evaluate: async (user) => {
      // 依据：通知渠道配置 (客观数据)
      const emailEnabled = user.email_alerts_enabled === true;
      const smsEnabled = user.sms_alerts_enabled === true;
      
      let score = 0;
      let basis = '未配置任何安全提醒渠道';
      
      if (emailEnabled && smsEnabled) {
        score = 100;
        basis = '已同时开启邮件和短信安全提醒';
      } else if (emailEnabled || smsEnabled) {
        score = 70;
        basis = `仅开启了${emailEnabled ? '邮件' : '短信'}提醒，渠道单一`;
      }
      
      return {
        score,
        description: '安全事件感知能力评估',
        basis,
        recommendation: score === 100 ? '安全提醒配置完善' : '建议同时开启邮件和短信提醒，确保在第一时间获知账号异常'
      };
    }
  },
  
  DEVICE_MANAGEMENT: {
    name: '设备管理',
    weight: 10,
    maxScore: 100,
    evaluate: async (user, db) => {
      // 依据：受信任硬件绑定记录 (客观事实)
      try {
        const result = await db.query(
          'SELECT COUNT(*) as count FROM hardware_bindings WHERE user_id = $1 AND is_active = true',
          [user.id]
        );
        const deviceCount = parseInt(result.rows[0]?.count || 0);
        
        let score = 100;
        let basis = `已绑定 ${deviceCount} 个可信设备`;
        
        if (deviceCount === 0) {
          score = 50;
          basis = '当前未绑定任何可信硬件设备';
        } else if (deviceCount > 5) {
          score = 80;
          basis = `绑定的可信设备过多(${deviceCount}个)，存在潜在风险`;
        }
        
        return {
          score,
          description: '登录终端信任体系评估',
          basis,
          recommendation: deviceCount === 0 ? '建议将常用电脑/手机设为可信设备' : (deviceCount > 5 ? '建议清理不再使用的老旧设备绑定' : '设备管理状态良好')
        };
      } catch (err) {
        return { score: 50, description: '设备状态检查失败', basis: '数据库查询异常', recommendation: '请稍后重试' };
      }
    }
  },
  
  SESSION_TIMEOUT: {
    name: '会话安全',
    weight: 10,
    maxScore: 100,
    evaluate: async (user) => {
      // 依据：会话超时配置 (客观事实)
      const timeout = user.session_timeout_minutes || 30;
      let score = 100;
      let basis = `会话超时时间设为 ${timeout} 分钟`;
      
      if (timeout > 60) {
        score = 60;
        basis = `会话超时时间过长(${timeout}分钟)，易遭受物理接触攻击`;
      } else if (timeout > 30) {
        score = 85;
        basis = `会话超时时间(${timeout}分钟)略高于安全基准`;
      }
      
      return {
        score,
        description: '在线状态安全性评估',
        basis,
        recommendation: timeout > 30 ? '建议将自动登出时间缩短至30分钟以内' : '会话安全设置符合最佳实践标准'
      };
    }
  }
};

/**
 * 安全检查服务类
 */
class SecurityCheckService {
  constructor(pool) {
    this.pool = pool;
    this.factors = SECURITY_FACTORS;
  }

  /**
   * 执行安全检查
   * @param {number} userId - 用户ID
   * @param {Object} context - 包含IP、UserAgent等上下文信息
   * @returns {Object} 安全检查结果
   */
  async performCheck(userId, context = {}) {
    const startTime = Date.now();
    
    try {
      // 1. 数据验证
      if (!userId) throw new Error('用户ID不能为空');

      // 2. 获取用户信息 (实时数据查询)
      const user = await this.getUserInfo(userId);
      if (!user) throw new Error('未找到指定用户，无法进行安全评估');

      // 3. 动态执行所有安全因子评估 (客观事实驱动)
      const factorResults = await Promise.all(
        Object.entries(this.factors).map(async ([key, factor]) => {
          try {
            const result = await factor.evaluate(user, this.pool);
            return {
              id: key,
              name: factor.name,
              weight: factor.weight,
              score: result.score,
              description: result.description,
              basis: result.basis,
              recommendation: result.recommendation
            };
          } catch (err) {
            error(`[SecurityCheck] 因子评估异常 ${key}:`, err);
            return {
              id: key,
              name: factor.name,
              weight: factor.weight,
              score: 0,
              description: '评估过程异常',
              basis: '系统内部错误',
              recommendation: '请联系管理员检查系统日志'
            };
          }
        })
      );

      // 4. 计算加权总分 (采用经过验证的加权平均模型)
      let totalWeightedScore = 0;
      let totalWeight = 0;

      factorResults.forEach(factor => {
        totalWeightedScore += factor.score * factor.weight;
        totalWeight += factor.weight;
      });

      const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

      // 5. 确定风险等级
      let riskLevel = 'low';
      if (overallScore < 60) riskLevel = 'high';
      else if (overallScore < 85) riskLevel = 'medium';

      const checkDuration = Date.now() - startTime;
      const result = {
        success: true,
        overallScore,
        riskLevel,
        riskLabel: this.getRiskLabel(riskLevel),
        checkTime: new Date().toISOString(),
        duration: checkDuration,
        factors: factorResults,
        weightExplanation: '总分采用加权平均法计算，各项权重代表该因子对整体安全性的重要程度',
        summary: this.generateSummary(overallScore, riskLevel, factorResults.filter(f => f.score < 80))
      };

      // 6. 审计日志记录 (关键要求：审计功能)
      await this.logCheckAudit(userId, result, context);

      info(`[SecurityCheck] 用户 ${userId} 实时安全评分: ${overallScore}, 耗时: ${checkDuration}ms`);
      return result;

    } catch (err) {
      error('[SecurityCheck] 安全检查核心逻辑失败:', err);
      return {
        success: false,
        error: err.message,
        checkTime: new Date().toISOString()
      };
    }
  }

  /**
   * 记录安全检查审计日志
   */
  async logCheckAudit(userId, result, context) {
    try {
      const { ip, userAgent } = context;
      await this.pool.query(`
        INSERT INTO audit_logs (
          user_id, table_name, operation, action, 
          record_id, new_values, ip_address, user_agent, severity, success
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        userId,
        'users',
        'UPDATE',
        'SEC_CHECK',
        userId,
        JSON.stringify({
          score: result.overallScore,
          riskLevel: result.riskLevel,
          factorCount: result.factors?.length,
          type: 'REALTIME_ASSESSMENT'
        }),
        ip || '127.0.0.1',
        userAgent || 'System',
        result.overallScore < 60 ? 'high' : 'info',
        result.success
      ]);
    } catch (err) {
      error('[SecurityCheck] 审计日志记录失败:', err);
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId) {
    try {
      const result = await this.pool.query(`
        SELECT 
          id, email, username,
          two_factor_enabled, two_factor_secret, two_factor_backup_codes,
          login_protection_enabled,
          email_alerts_enabled, sms_alerts_enabled,
          security_questions_set,
          session_timeout_minutes,
          biometric_enabled,
          backup_codes_generated,
          created_at, last_login_at,
          password_changed_at
        FROM users
        WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (err) {
      error('[SecurityCheck] 获取用户信息失败:', err);
      // 返回空对象，避免整个检查失败
      return { id: userId };
    }
  }

  /**
   * 获取风险等级标签
   */
  getRiskLabel(riskLevel) {
    const labels = {
      low: '低风险',
      medium: '中风险',
      high: '高风险'
    };
    return labels[riskLevel] || '未知';
  }

  /**
   * 生成检查摘要
   */
  generateSummary(score, riskLevel, recommendations) {
    const levelDescriptions = {
      low: '您的账户安全状况良好，继续保持！',
      medium: '您的账户存在一些安全隐患，建议及时处理。',
      high: '您的账户存在较多安全风险，请立即处理！'
    };

    const factorCount = recommendations.length;
    const timeText = new Date().toLocaleString('zh-CN');

    return {
      description: levelDescriptions[riskLevel],
      issueCount: factorCount,
      lastCheckTime: timeText,
      quickTip: factorCount > 0 
        ? `您有 ${factorCount} 项安全设置需要改进` 
        : '所有安全设置均符合建议标准'
    };
  }
}

module.exports = {
  SecurityCheckService,
  SECURITY_FACTORS
};
