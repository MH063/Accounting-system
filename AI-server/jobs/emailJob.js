/**
 * 邮件处理作业
 * 使用队列处理邮件发送，提高系统性能
 */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const systemConfigService = require('../services/systemConfigService');

// 延后加载 messageQueue 以避免循环依赖
const getEmailQueue = () => {
  const { getQueue, QUEUES } = require('../config/messageQueue');
  return getQueue(QUEUES.EMAIL);
};

// 默认邮件传输配置（作为备选）
const defaultEmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
};

// 创建邮件传输器
let transporter = null;
let currentConfigVersion = null;

/**
 * 获取最新的邮件配置
 */
async function getLatestEmailConfig() {
  try {
    const configs = await systemConfigService.getAllConfigs({ group: 'notification' });
    
    // 检查配置是否启用
    const enabled = configs['notification.email_enabled']?.value !== false;
    if (!enabled) {
      logger.warn('邮件发送功能已在系统设置中禁用');
      return null;
    }

    const smtpHost = configs['notification.smtp_server']?.value;
    const smtpPort = parseInt(configs['notification.smtp_port']?.value);
    const smtpUser = configs['notification.email_account']?.value;
    const smtpPass = configs['notification.email_password']?.value;
    const smtpSecure = configs['notification.smtp_secure']?.value;
    const senderName = configs['notification.sender_name']?.value || '系统管理员';

    // 如果数据库配置不完整，退回到环境变量配置
    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.info('数据库邮件配置不完整，使用默认环境变量配置');
      return {
        ...defaultEmailConfig,
        senderName: '会计系统',
        smtpUser: defaultEmailConfig.auth.user
      };
    }

    return {
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpSecure !== undefined ? smtpSecure : (smtpPort === 465),
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      senderName,
      smtpUser: smtpUser,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5
    };
  } catch (error) {
    logger.error('获取邮件配置失败，使用默认配置', { error: error.message });
    return {
      ...defaultEmailConfig,
      senderName: '会计系统',
      smtpUser: defaultEmailConfig.auth.user
    };
  }
}

/**
 * 创建或更新邮件传输器
 */
async function createEmailTransporter(forceRefresh = false) {
  try {
    const config = await getLatestEmailConfig();
    if (!config) return null;

    // 如果已经有传输器且不需要强制刷新，则直接返回
    if (transporter && !forceRefresh) {
      return transporter;
    }

    // 关闭旧的传输器
    if (transporter) {
      transporter.close();
    }

    transporter = nodemailer.createTransport(config);
    
    // 挂载配置信息以便后续使用
    transporter.systemSenderName = config.senderName;
    transporter.systemSmtpUser = config.smtpUser;

    transporter.verify((error, success) => {
      if (error) {
        logger.error('邮件传输器验证失败', { error: error.message, host: config.host });
      } else {
        logger.info('邮件传输器验证成功', { host: config.host, user: config.auth.user });
      }
    });
    
    return transporter;
  } catch (error) {
    logger.error('邮件传输器创建失败', { error: error.message });
    throw error;
  }
}

/**
 * 邮件作业处理器
 */
class EmailJobProcessor {
  /**
   * 处理邮件发送作业
   */
  static async sendEmail(job) {
    const { data } = job;
    const { to, subject, html, text, attachments, from, replyTo } = data;
    
    try {
      logger.info('开始处理邮件作业', {
        jobId: job.id,
        to: to,
        subject: subject
      });
      
      // 验证必要参数
      if (!to || !subject || (!html && !text)) {
        throw new Error('缺少必要的邮件参数');
      }
      
      // 创建或获取传输器
      if (!transporter) {
        await createEmailTransporter();
      }
      
      if (!transporter) {
        throw new Error('邮件传输器不可用，请检查邮件配置是否开启');
      }
      
      // 邮件选项
      const mailOptions = {
        from: from || `"${transporter.systemSenderName}" <${transporter.systemSmtpUser}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject: subject,
        html: html || undefined,
        text: text || undefined,
        attachments: attachments || undefined,
        replyTo: replyTo || undefined,
        headers: {
          'X-Job-ID': job.id,
          'X-Queue-Name': 'email',
          'X-Timestamp': new Date().toISOString()
        }
      };
      
      // 发送邮件
      const info = await transporter.sendMail(mailOptions);
      
      logger.info('邮件发送成功', {
        jobId: job.id,
        messageId: info.messageId,
        to: to,
        subject: subject,
        response: info.response
      });
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        jobId: job.id
      };
      
    } catch (error) {
      logger.error('邮件发送失败', {
        jobId: job.id,
        to: to,
        subject: subject,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * 批量发送邮件作业
   */
  static async sendBatchEmail(job) {
    const { data } = job;
    const { emails, batchId } = data;
    
    try {
      logger.info('开始处理批量邮件作业', {
        jobId: job.id,
        batchId: batchId,
        emailCount: emails.length
      });
      
      const results = [];
      
      for (const emailData of emails) {
        try {
          // 为每封邮件创建新的作业
          const emailJob = await getEmailQueue().add('sendEmail', {
            ...emailData,
            batchId: batchId
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000
            }
          });
          
          results.push({
            email: emailData.to,
            jobId: emailJob.id,
            status: 'queued'
          });
          
        } catch (emailError) {
          logger.error('批量邮件中单封邮件入队失败', {
            email: emailData.to,
            error: emailError.message
          });
          
          results.push({
            email: emailData.to,
            status: 'failed',
            error: emailError.message
          });
        }
      }
      
      logger.info('批量邮件作业处理完成', {
        jobId: job.id,
        batchId: batchId,
        total: emails.length,
        queued: results.filter(r => r.status === 'queued').length,
        failed: results.filter(r => r.status === 'failed').length
      });
      
      return {
        success: true,
        batchId: batchId,
        results: results,
        jobId: job.id
      };
      
    } catch (error) {
      logger.error('批量邮件作业处理失败', {
        jobId: job.id,
        batchId: batchId,
        error: error.message
      });
      
      throw error;
    }
  }
}

/**
 * 注册邮件队列处理器
 */
function registerEmailProcessors() {
  try {
    const emailQueue = getEmailQueue();
    
    // 单封邮件处理器
    emailQueue.process('sendEmail', 5, async (job) => {
      return await EmailJobProcessor.sendEmail(job);
    });
    
    // 批量邮件处理器
    emailQueue.process('sendBatchEmail', 2, async (job) => {
      return await EmailJobProcessor.sendBatchEmail(job);
    });
    
    logger.info('邮件队列处理器注册成功');
    
  } catch (error) {
    logger.error('邮件队列处理器注册失败', { error: error.message });
    throw error;
  }
}

/**
 * 邮件作业辅助函数
 */
const EmailJobHelpers = {
  /**
   * 发送单封邮件
   */
  async sendSingleEmail(emailData) {
    const emailQueue = getEmailQueue();
    
    const job = await emailQueue.add('sendEmail', {
      ...emailData,
      timestamp: new Date().toISOString()
    }, {
      priority: emailData.priority || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    
    return {
      jobId: job.id,
      email: emailData.to,
      subject: emailData.subject
    };
  },
  
  /**
   * 批量发送邮件
   */
  async sendBatchEmails(emails, batchOptions = {}) {
    const emailQueue = getEmailQueue();
    
    const batchId = batchOptions.batchId || `batch_${Date.now()}`;
    
    const job = await emailQueue.add('sendBatchEmail', {
      emails: emails,
      batchId: batchId,
      ...batchOptions
    }, {
      priority: batchOptions.priority || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    
    return {
      jobId: job.id,
      batchId: batchId,
      emailCount: emails.length
    };
  },
  
  /**
   * 发送模板邮件
   */
  async sendTemplateEmail(templateData) {
    const { templateName, to, data, subject, from } = templateData;
    
    // 这里可以根据模板名称加载模板内容
    const templates = {
      welcome: {
        subject: '欢迎使用会计系统',
        html: `<h1>欢迎 ${data.name}!</h1><p>您的账户已成功创建。</p>`
      },
      password_reset: {
        subject: '密码重置请求',
        html: `<p>请点击以下链接重置密码: <a href="${data.resetUrl}">重置密码</a></p>`
      },
      report_ready: {
        subject: '财务报表已生成',
        html: `<p>您的财务报表 "${data.reportName}" 已生成完成。</p>`
      },
      email_verification: {
        subject: '验证您的邮箱地址',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>验证您的邮箱</h2>
            <p>您好，</p>
            <p>感谢您注册我们的系统。您的验证码是：</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4a90e2; border-radius: 5px;">
              ${data.code}
            </div>
            <p>该验证码将在 30 分钟后过期。如果您没有请求此验证，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">这是一封系统自动发送的邮件，请勿直接回复。</p>
          </div>
        `
      },
      email_verification_link: {
        subject: '验证您的邮箱地址',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>验证您的邮箱</h2>
            <p>您好，</p>
            <p>感谢您注册我们的系统。请点击下面的按钮验证您的邮箱地址：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verifyUrl}" style="background-color: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">验证邮箱</a>
            </div>
            <p>或者复制以下链接到浏览器打开：</p>
            <p style="word-break: break-all; color: #888;">${data.verifyUrl}</p>
            <p>该链接将在 24 小时后过期。如果您没有请求此验证，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">这是一封系统自动发送的邮件，请勿直接回复。</p>
          </div>
        `
      },
      login_alert: {
        subject: '异地登录提醒',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>安全提醒：新设备登录</h2>
            <p>您的账户刚刚在以下设备登录：</p>
            <ul>
              <li><strong>设备：</strong> ${data.device}</li>
              <li><strong>IP地址：</strong> ${data.ip}</li>
              <li><strong>时间：</strong> ${data.time}</li>
            </ul>
            <p>如果这不是您的操作，请立即修改密码并联系客服。</p>
          </div>
        `
      }
    };
    
    const template = templates[templateName];
    if (!template) {
      throw new Error(`模板 "${templateName}" 不存在`);
    }
    
    return await this.sendSingleEmail({
      to,
      subject: subject || template.subject,
      html: template.html.replace(/\${(\w+)}/g, (match, key) => data[key] || match),
      from
    });
  }
};

module.exports = {
  EmailJobProcessor,
  EmailJobHelpers,
  registerEmailProcessors,
  createEmailTransporter
};