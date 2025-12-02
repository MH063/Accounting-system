/**
 * 邮件处理作业
 * 使用队列处理邮件发送，提高系统性能
 */

const nodemailer = require('nodemailer');
const { getQueue, QUEUES } = require('../config/messageQueue');
const logger = require('../config/logger');

// 邮件传输配置
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
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

function createEmailTransporter() {
  try {
    transporter = nodemailer.createTransporter(emailConfig);
    
    transporter.verify((error, success) => {
      if (error) {
        logger.error('邮件传输器验证失败', { error: error.message });
      } else {
        logger.info('邮件传输器验证成功');
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
        createEmailTransporter();
      }
      
      // 邮件选项
      const mailOptions = {
        from: from || `"会计系统" <${process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject: subject,
        html: html || undefined,
        text: text || undefined,
        attachments: attachments || undefined,
        replyTo: replyTo || undefined,
        headers: {
          'X-Job-ID': job.id,
          'X-Queue-Name': QUEUES.EMAIL,
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
          const emailJob = await getQueue(QUEUES.EMAIL).add('sendEmail', {
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
    const emailQueue = getQueue(QUEUES.EMAIL);
    
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
    const emailQueue = getQueue(QUEUES.EMAIL);
    
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
    const emailQueue = getQueue(QUEUES.EMAIL);
    
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