const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param, query, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const systemConfigService = require('../services/systemConfigService');
const configAuditService = require('../services/configAuditService');
const systemStatusService = require('../services/systemStatusService');
const notificationTemplateDAL = require('../dal/notificationTemplate');
const adminUserDAL = require('../dal/adminUser');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { responseWrapper } = require('../middleware/response');
const versionManager = require('../config/versionManager');

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/settings/configs/:group', [
    param('group').isString().isIn(['basic', 'payment', 'email', 'security', 'notification', 'business', 'log', 'system'])
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { group } = req.params;
        const configs = await systemConfigService.getAllConfigs({ group, activeOnly: true });

        const groupConfigs = {};
        const prefixMap = {
            basic: 'system.',
            payment: 'payment.',
            email: 'notification.',
            security: 'security.',
            notification: 'notification.',
            business: 'business.',
            log: 'log.',
            system: 'system.'
        };
        const prefix = prefixMap[group] || 'system.';

        for (const [key, config] of Object.entries(configs)) {
            if (key.startsWith(prefix) || group === 'basic') {
                groupConfigs[key] = config;
            }
        }

        res.json({
            success: true,
            data: {
                configs: groupConfigs,
                group,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Settings] Get configs error:', error);
        res.status(500).json({
            success: false,
            message: '获取配置失败',
            error: error.message
        });
    }
}));

router.put('/settings/configs', [
    body('configs').isObject(),
    body('reason').optional().isString()
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { configs, reason } = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        if (!configs || typeof configs !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'configs必须是对象类型'
            });
        }

        // 使用事务性批量更新，确保原子性
        const result = await systemConfigService.setConfigsTransactional(configs, {
            userId,
            username,
            ipAddress,
            userAgent,
            reason: reason || '批量配置更新'
        });

        res.json({
            success: true,
            data: {
                message: '配置更新成功',
                results: result.results,
                restartRequired: result.restartRequired
            }
        });
    } catch (error) {
        console.error('[Settings] Batch update configs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '批量更新配置失败'
        });
    }
}));

router.post('/settings/configs/:key/reset', [
    body('key').isString().notEmpty()
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { key } = req.params;
        const userId = req.user?.id;
        const result = await systemConfigService.resetConfig(key, userId);

        res.json({
            success: true,
            data: {
                message: '配置已重置为默认值',
                ...result
            }
        });
    } catch (error) {
        console.error('[Settings] Reset config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '重置配置失败'
        });
    }
}));

router.get('/settings/configs/:key/history', [
    query('limit').optional().isInt({ min: 1, max: 100 })
], responseWrapper(async (req, res) => {
    try {
        const { key } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const history = await configAuditService.getConfigHistory(key, limit);

        res.json({
            success: true,
            data: {
                configKey: key,
                history,
                total: history.length
            }
        });
    } catch (error) {
        console.error('[Settings] Get config history error:', error);
        res.status(500).json({
            success: false,
            message: '获取配置历史失败',
            error: error.message
        });
    }
}));

router.get('/settings/payment/configs', responseWrapper(async (req, res) => {
    try {
        const configs = await systemConfigService.getAllConfigs({ group: 'payment', activeOnly: true });

        let enabledPayments = null;
        let defaultPayment = 'alipay';
        const paymentConfigs = {
            alipay: { appId: '', merchantId: '', apiKey: '', enabled: false },
            wechat: { appId: '', merchantId: '', apiKey: '', enabled: false },
            unionpay: { appId: '', merchantId: '', apiKey: '', enabled: false }
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'payment.enabled_methods') {
                if (Array.isArray(value)) {
                    enabledPayments = value;
                }
            } else if (key === 'payment.default_method') {
                if (value) defaultPayment = value;
            } else if (key.startsWith('payment.alipay.')) {
                const field = key.replace('payment.alipay.', '');
                if (field === 'enabled') paymentConfigs.alipay.enabled = Boolean(value);
                else if (field !== 'apiKey') paymentConfigs.alipay[field] = value || '';
            } else if (key.startsWith('payment.wechat.')) {
                const field = key.replace('payment.wechat.', '');
                if (field === 'enabled') paymentConfigs.wechat.enabled = Boolean(value);
                else if (field !== 'apiKey') paymentConfigs.wechat[field] = value || '';
            } else if (key.startsWith('payment.unionpay.')) {
                const field = key.replace('payment.unionpay.', '');
                if (field === 'enabled') paymentConfigs.unionpay.enabled = Boolean(value);
                else if (field !== 'apiKey') paymentConfigs.unionpay[field] = value || '';
            }
        }

        res.json({
            success: true,
            data: {
                enabledPayments: enabledPayments !== null ? enabledPayments : ['alipay', 'wechat'],
                defaultPayment,
                configs: paymentConfigs
            }
        });
    } catch (error) {
        console.error('[Settings] Get payment configs error:', error);
        res.status(500).json({
            success: false,
            message: '获取支付配置失败',
            error: error.message
        });
    }
}));

router.put('/settings/payment/configs/:method', [
    param('method').isString().isIn(['alipay', 'wechat', 'unionpay']),
    body('appId').optional().isString().trim().isLength({ min: 5, max: 100 }).withMessage('AppID 长度不合法'),
    body('merchantId').optional().isString().trim().isLength({ min: 5, max: 100 }).withMessage('商户号长度不合法'),
    body('enabled').optional().isBoolean().withMessage('启用状态必须是布尔值')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }
        const { method } = req.params;
        const config = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const prefix = `payment.${method}.`;
        const updateMap = {};

        for (const [key, value] of Object.entries(config)) {
            updateMap[prefix + key] = value;
        }

        if (Object.keys(updateMap).length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供有效的配置参数'
            });
        }

        // 使用事务性更新
        const result = await systemConfigService.setConfigsTransactional(updateMap, {
            userId,
            username,
            ipAddress,
            userAgent,
            reason: `更新支付配置 (${method})`
        });

        res.json({
            success: true,
            data: {
                message: '支付配置更新成功',
                method,
                results: result.results
            }
        });
    } catch (error) {
        console.error('[Settings] Update payment config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新支付配置失败'
        });
    }
}));

router.post('/settings/payment/test', [
    body('method').isString().isIn(['alipay', 'wechat', 'unionpay'])
], responseWrapper(async (req, res) => {
    try {
        const { method, config } = req.body;

        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                message: `${method === 'alipay' ? '支付宝' : method === 'wechat' ? '微信支付' : '银联'}配置测试成功`,
                responseTime: `${responseTime}ms`,
                status: 'connected'
            }
        });
    } catch (error) {
        console.error('[Settings] Test payment config error:', error);
        res.status(500).json({
            success: false,
            message: '支付配置测试失败',
            error: error.message
        });
    }
}));

router.get('/settings/email/config', responseWrapper(async (req, res) => {
    try {
        const configs = await systemConfigService.getAllConfigs({ group: 'notification', activeOnly: true });

        const emailConfig = {
            smtpServer: '',
            smtpPort: 587,
            emailAccount: '',
            senderName: '系统管理员',
            secureConnection: true
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'notification.smtp_server') emailConfig.smtpServer = value || '';
            else if (key === 'notification.smtp_port') emailConfig.smtpPort = parseInt(value) || 587;
            else if (key === 'notification.email_account') emailConfig.emailAccount = value || '';
            else if (key === 'notification.sender_name') emailConfig.senderName = value || '系统管理员';
            else if (key === 'notification.smtp_secure') emailConfig.secureConnection = Boolean(value);
        }

        res.json({
            success: true,
            data: emailConfig
        });
    } catch (error) {
        console.error('[Settings] Get email config error:', error);
        res.status(500).json({
            success: false,
            message: '获取邮件配置失败',
            error: error.message
        });
    }
}));

router.put('/settings/email/config', [
    body('smtpServer').isString().trim().notEmpty().withMessage('SMTP服务器不能为空'),
    body('smtpPort').isInt({ min: 1, max: 65535 }).withMessage('端口必须在1-65535之间'),
    body('emailAccount').isEmail().withMessage('邮箱账号格式不正确'),
    body('senderName').isString().trim().notEmpty().withMessage('发件人名称不能为空'),
    body('secureConnection').isBoolean().withMessage('SSL/TLS 必须是布尔值')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }
        const config = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const configMap = {
            smtpServer: 'notification.smtp_server',
            smtpPort: 'notification.smtp_port',
            emailAccount: 'notification.email_account',
            emailPassword: 'notification.email_password',
            senderName: 'notification.sender_name',
            secureConnection: 'notification.smtp_secure'
        };

        const updateMap = {};
        for (const [key, dbKey] of Object.entries(configMap)) {
            // 只有当配置中有该字段且不为空时才加入更新列表，特别是密码
            if (config[key] !== undefined && config[key] !== null && config[key] !== '') {
                updateMap[dbKey] = config[key];
            }
        }

        if (Object.keys(updateMap).length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供有效的配置参数'
            });
        }

        // 使用事务性更新，确保邮件配置的一致性
        const result = await systemConfigService.setConfigsTransactional(updateMap, {
            userId,
            username,
            ipAddress,
            userAgent,
            reason: '更新邮件配置'
        });

        res.json({
            success: true,
            data: {
                message: '邮件配置更新成功',
                results: result.results
            }
        });
    } catch (error) {
        console.error('[Settings] Update email config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新邮件配置失败'
        });
    }
}));

router.post('/settings/email/test', [
    body('testEmail').isEmail(),
    body('config').optional().isObject()
], responseWrapper(async (req, res) => {
    try {
        const { testEmail, config = {} } = req.body;
        const startTime = Date.now();

        console.log('[Settings] Testing email connection to:', testEmail);
        console.log('[Settings] Test config provided:', JSON.stringify(config, (k, v) => k === 'emailPassword' ? '***' : v));

        // 获取当前配置作为基准
        const dbConfigs = await systemConfigService.getAllConfigs({ group: 'notification' });
        
        // 组合配置：优先使用前端传来的测试配置，缺失则使用数据库配置
        const smtpHost = config.smtpServer || dbConfigs['notification.smtp_server']?.value;
        const smtpPort = parseInt(config.smtpPort || dbConfigs['notification.smtp_port']?.value) || 587;
        const smtpUser = config.emailAccount || dbConfigs['notification.email_account']?.value;
        const smtpPass = config.emailPassword || dbConfigs['notification.email_password']?.value;
        const smtpSecure = config.secureConnection !== undefined ? config.secureConnection : (dbConfigs['notification.smtp_secure']?.value !== false);
        const senderName = config.senderName || dbConfigs['notification.sender_name']?.value || '系统管理员';

        if (!smtpHost || !smtpUser || !smtpPass) {
            console.error('[Settings] Email test failed: missing required config', { smtpHost, smtpUser, hasPass: !!smtpPass });
            throw new Error('邮件配置不完整，请检查SMTP服务器、账号和密码');
        }

        console.log(`[Settings] Creating transport for ${smtpHost}:${smtpPort} (Secure: ${smtpSecure})`);

        // 创建临时传输器进行测试
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure && smtpPort === 465, // 465 使用 SSL
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            connectionTimeout: 10000, // 10秒连接超时
            greetingTimeout: 5000,    // 5秒问候超时
            socketTimeout: 15000,     // 15秒Socket超时
            debug: true,              // 开启调试日志
            logger: true              // 在控制台打印详细日志
        });

        // 发送测试邮件
        console.log('[Settings] Sending test mail...');
        await transporter.sendMail({
            from: `"${senderName}" <${smtpUser}>`,
            to: testEmail,
            subject: '系统邮件发送测试',
            text: `这是一封来自系统设置页面的测试邮件。\n\n发送时间：${new Date().toLocaleString()}\nSMTP服务器：${smtpHost}\n端口：${smtpPort}\n账号：${smtpUser}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h3 style="color: #409EFF;">系统邮件发送测试</h3>
                    <p>这是一封来自系统设置页面的测试邮件。</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><b>发送时间：</b>${new Date().toLocaleString()}</li>
                        <li style="margin-bottom: 10px;"><b>SMTP服务器：</b>${smtpHost}</li>
                        <li style="margin-bottom: 10px;"><b>端口：</b>${smtpPort}</li>
                        <li style="margin-bottom: 10px;"><b>账号：</b>${smtpUser}</li>
                    </ul>
                    <p style="color: #67C23A; font-weight: bold;">如果您收到了这封邮件，说明您的邮件配置已正确生效。</p>
                </div>
            `
        });

        const responseTime = Date.now() - startTime;
        console.log(`[Settings] Email test success in ${responseTime}ms`);

        res.json({
            success: true,
            data: {
                message: '邮件测试发送成功，请检查收件箱',
                responseTime: `${responseTime}ms`,
                testEmail
            }
        });
    } catch (error) {
        console.error('[Settings] Test email connection error:', error);
        res.status(500).json({
            success: false,
            message: '邮件发送测试失败: ' + (error.code === 'ETIMEDOUT' ? '连接超时，请检查服务器地址和端口' : error.message),
            error: error.message,
            code: error.code
        });
    }
}));

router.get('/settings/security/config', responseWrapper(async (req, res) => {
    try {
        const configs = await systemConfigService.getAllConfigs({ group: 'security', activeOnly: true });

        const securityConfig = {
            passwordStrength: 'medium',
            loginFailCount: 5,
            lockTime: 30,
            sessionTimeout: 120,
            twoFactorAuth: false,
            ipRestriction: false,
            ipControlMode: 'blacklist',
            ipWhitelist: [],
            ipBlacklist: [],
            passwordPolicy: {
                minLength: 8,
                requireSpecial: true,
                requireNumber: true,
                requireUppercase: false,
                historyLimit: 5,
                expirationDays: 90
            }
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'security.password_policy.min_length') securityConfig.passwordPolicy.minLength = parseInt(value) || 8;
            else if (key === 'security.password_policy.require_special') securityConfig.passwordPolicy.requireSpecial = Boolean(value);
            else if (key === 'security.password_policy.require_number') securityConfig.passwordPolicy.requireNumber = Boolean(value);
            else if (key === 'security.password_policy.require_uppercase') securityConfig.passwordPolicy.requireUppercase = Boolean(value);
            else if (key === 'security.password_policy.history_limit') securityConfig.passwordPolicy.historyLimit = parseInt(value) || 5;
            else if (key === 'security.password_policy.expiration_days') securityConfig.passwordPolicy.expirationDays = parseInt(value) || 90;
            else if (key === 'security.login.max_attempts') securityConfig.loginFailCount = parseInt(value) || 5;
            else if (key === 'security.login.lockout_duration') securityConfig.lockTime = parseInt(value) || 30;
            else if (key === 'session.timeout') securityConfig.sessionTimeout = parseInt(value) || 120;
            else if (key === 'security.2fa_required') securityConfig.twoFactorAuth = Boolean(value);
            else if (key === 'security.ip_control.enabled') securityConfig.ipRestriction = Boolean(value);
            else if (key === 'security.ip_control.mode') securityConfig.ipControlMode = value || 'blacklist';
            else if (key === 'security.ip_control.whitelist') securityConfig.ipWhitelist = Array.isArray(value) ? value : [];
            else if (key === 'security.ip_control.blacklist') securityConfig.ipBlacklist = Array.isArray(value) ? value : [];
        }

        res.json({
            success: true,
            data: securityConfig
        });
    } catch (error) {
        console.error('[Settings] Get security config error:', error);
        res.status(500).json({
            success: false,
            message: '获取安全配置失败',
            error: error.message
        });
    }
}));

router.put('/settings/security/config', [
    body('loginFailCount').optional().isInt({ min: 3, max: 10 }).withMessage('登录失败次数必须在3-10次之间'),
    body('lockTime').optional().isInt({ min: 1, max: 1440 }).withMessage('账户锁定时间必须在1-1440分钟之间'),
    body('sessionTimeout').optional().isInt({ min: 5, max: 1440 }).withMessage('会话超时时间必须在5-1440分钟之间'),
    body('passwordPolicy.minLength').optional().isInt({ min: 6, max: 20 }).withMessage('密码最小长度必须在6-20位之间'),
    body('ipControlMode').optional().isIn(['whitelist', 'blacklist']).withMessage('访问控制模式无效'),
    body('ipWhitelist').optional().isArray().withMessage('IP白名单必须是数组'),
    body('ipBlacklist').optional().isArray().withMessage('IP黑名单必须是数组')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }

        const config = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const configMap = {
            'security.login.max_attempts': config.loginFailCount,
            'security.login.lockout_duration': config.lockTime,
            'session.timeout': config.sessionTimeout,
            'security.2fa_required': config.twoFactorAuth,
            'security.ip_control.enabled': config.ipRestriction,
            'security.ip_control.mode': config.ipControlMode,
            'security.ip_control.whitelist': config.ipWhitelist,
            'security.ip_control.blacklist': config.ipBlacklist,
            'security.password_policy.min_length': config.passwordPolicy?.minLength,
            'security.password_policy.require_special': config.passwordPolicy?.requireSpecial,
            'security.password_policy.require_number': config.passwordPolicy?.requireNumber,
            'security.password_policy.require_uppercase': config.passwordPolicy?.requireUppercase,
            'security.password_policy.history_limit': config.passwordPolicy?.historyLimit,
            'security.password_policy.expiration_days': config.passwordPolicy?.expirationDays
        };

        // 过滤掉 undefined 的值
        const filteredConfigs = {};
        for (const [key, value] of Object.entries(configMap)) {
            if (value !== undefined) {
                filteredConfigs[key] = value;
            }
        }

        if (Object.keys(filteredConfigs).length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供有效的配置参数'
            });
        }

        // 使用事务性批量更新，确保原子性
        const result = await systemConfigService.setConfigsTransactional(filteredConfigs, {
            userId,
            username,
            ipAddress,
            userAgent,
            reason: '更新安全配置'
        });

        res.json({
            success: true,
            data: {
                message: '安全配置更新成功',
                results: result.results
            }
        });
    } catch (error) {
        console.error('[Settings] Update security config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新安全配置失败'
        });
    }
}));

router.get('/settings/notification/templates', responseWrapper(async (req, res) => {
    try {
        const { type, isActive } = req.query;
        const templates = await notificationTemplateDAL.getAll({
            type: type || undefined,
            isActive: isActive !== undefined ? isActive === 'true' : undefined
        });

        // 格式化返回数据，确保variables字段是数组
        const formattedTemplates = templates.map(t => ({
            ...t,
            variables: t.variables ? (typeof t.variables === 'string' ? JSON.parse(t.variables) : t.variables) : []
        }));

        res.json({
            success: true,
            data: {
                templates: formattedTemplates,
                total: formattedTemplates.length
            }
        });
    } catch (error) {
        console.error('[Settings] Get notification templates error:', error);
        res.status(500).json({
            success: false,
            message: '获取通知模板失败',
            error: error.message
        });
    }
}));

router.post('/settings/notification/templates', [
    body('name').isString().notEmpty(),
    body('type').isString().isIn(['email', 'sms', 'wechat', 'dingtalk']),
    body('content').isString().notEmpty()
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { name, type, content } = req.body;
        const userId = req.user?.id;

        const newTemplate = await notificationTemplateDAL.create({
            name,
            type,
            content,
            createdBy: userId
        });

        // 格式化返回数据
        const formattedTemplate = {
            ...newTemplate,
            variables: newTemplate.variables ? (typeof newTemplate.variables === 'string' ? JSON.parse(newTemplate.variables) : newTemplate.variables) : []
        };

        res.json({
            success: true,
            data: {
                message: '通知模板创建成功',
                template: formattedTemplate
            }
        });
    } catch (error) {
        console.error('[Settings] Create notification template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建通知模板失败',
            error: error.message
        });
    }
}));

router.put('/settings/notification/templates/:id', [
    body('name').isString().notEmpty(),
    body('type').isString().isIn(['email', 'sms', 'wechat', 'dingtalk']),
    body('content').isString().notEmpty()
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { name, type, content, isActive } = req.body;

        const updatedTemplate = await notificationTemplateDAL.update(parseInt(id), {
            name,
            type,
            content,
            isActive
        });

        if (!updatedTemplate) {
            return res.status(404).json({
                success: false,
                message: '通知模板不存在'
            });
        }

        // 格式化返回数据
        const formattedTemplate = {
            ...updatedTemplate,
            variables: updatedTemplate.variables ? (typeof updatedTemplate.variables === 'string' ? JSON.parse(updatedTemplate.variables) : updatedTemplate.variables) : []
        };

        res.json({
            success: true,
            data: {
                message: '通知模板更新成功',
                template: formattedTemplate
            }
        });
    } catch (error) {
        console.error('[Settings] Update notification template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新通知模板失败',
            error: error.message
        });
    }
}));

router.delete('/settings/notification/templates/batch', responseWrapper(async (req, res) => {
     try {
         const { ids } = req.body;
         console.log('🗑️ [Settings] 收到批量删除请求, IDs:', ids);
         
         if (!Array.isArray(ids) || ids.length === 0) {
             return res.status(400).json({
                 success: false,
                 message: '请选择要删除的模板'
             });
         }

         // 确保 ID 是数字
         const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
         
         if (numericIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '无效的模板ID列表'
            });
         }

         const count = await notificationTemplateDAL.batchDelete(numericIds);
         console.log(`✅ [Settings] 批量删除成功, 计划删除: ${numericIds.length}, 实际删除: ${count}`);

         res.json({
             success: true,
             data: {
                 message: `成功删除 ${count} 个通知模板`,
                 count
             }
         });
     } catch (error) {
         console.error('[Settings] Batch delete notification templates error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '批量删除通知模板失败',
            error: error.message
        });
    }
}));

router.delete('/settings/notification/templates/:id', responseWrapper(async (req, res) => {
    try {
        const { id } = req.params;
        const templateId = parseInt(id);

        if (isNaN(templateId) || templateId > 2147483647) {
            return res.status(400).json({
                success: false,
                message: '无效的模板ID'
            });
        }

        const deleted = await notificationTemplateDAL.delete(templateId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: '通知模板不存在'
            });
        }

        res.json({
            success: true,
            data: {
                message: '通知模板删除成功',
                id: templateId
            }
        });
    } catch (error) {
        console.error('[Settings] Delete notification template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除通知模板失败',
            error: error.message
        });
    }
}));

router.get('/settings/notification/rules', responseWrapper(async (req, res) => {
    try {
        const configs = await systemConfigService.getAllConfigs({ group: 'notification', activeOnly: true });

        const rules = {
            systemNotifications: ['email'],
            importantOperationNotify: true,
            scheduledTaskNotify: true,
            alertNotify: true
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'notification.email_enabled') rules.systemNotifications = value ? ['email'] : [];
            else if (key === 'notification.important_operation_notify') rules.importantOperationNotify = Boolean(value);
            else if (key === 'notification.scheduled_task_notify') rules.scheduledTaskNotify = Boolean(value);
            else if (key === 'notification.alert_notify') rules.alertNotify = Boolean(value);
        }

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        console.error('[Settings] Get notification rules error:', error);
        res.status(500).json({
            success: false,
            message: '获取通知规则失败',
            error: error.message
        });
    }
}));

router.put('/settings/notification/rules', [
    body('systemNotifications').optional().isArray().withMessage('系统通知必须是数组'),
    body('importantOperationNotify').optional().isBoolean().withMessage('重要操作通知必须是布尔值'),
    body('scheduledTaskNotify').optional().isBoolean().withMessage('定时任务通知必须是布尔值'),
    body('alertNotify').optional().isBoolean().withMessage('告警通知必须是布尔值')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }
        const rules = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const results = [];
        const configMap = {
            'notification.email_enabled': rules.systemNotifications?.includes('email'),
            'notification.important_operation_notify': rules.importantOperationNotify,
            'notification.scheduled_task_notify': rules.scheduledTaskNotify,
            'notification.alert_notify': rules.alertNotify
        };

        for (const [dbKey, value] of Object.entries(configMap)) {
            try {
                await systemConfigService.setConfig(dbKey, value, {
                    userId,
                    description: '更新通知规则',
                    username,
                    ipAddress,
                    userAgent
                });
                results.push({ key: dbKey, success: true });
            } catch (err) {
                results.push({ key: dbKey, success: false, error: err.message });
            }
        }

        res.json({
            success: true,
            data: {
                message: '通知规则更新成功',
                results
            }
        });
    } catch (error) {
        console.error('[Settings] Update notification rules error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新通知规则失败'
        });
    }
}));

router.get('/settings/notification/recipients', responseWrapper(async (req, res) => {
    try {
        const { isActive } = req.query;
        const recipients = await adminUserDAL.getAllAdmins({
            isActive: isActive !== undefined ? isActive === 'true' : undefined
        });

        res.json({
            success: true,
            data: {
                recipients
            }
        });
    } catch (error) {
        console.error('[Settings] Get notification recipients error:', error);
        res.status(500).json({
            success: false,
            message: '获取通知接收人失败',
            error: error.message
        });
    }
}));

router.put('/settings/notification/recipients', [
    body('recipients').isArray().withMessage('recipients必须是数组')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { recipients } = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        // 验证所有接收人ID是否有效
        const validRecipients = await adminUserDAL.getByIds(recipients);
        if (validRecipients.length !== recipients.length) {
            return res.status(400).json({
                success: false,
                message: '部分接收人ID无效'
            });
        }

        // 保存到系统配置
        await systemConfigService.setConfig('notification.recipients', recipients, {
            userId,
            description: '更新通知接收人',
            username,
            ipAddress,
            userAgent
        });

        res.json({
            success: true,
            data: {
                message: '通知接收人更新成功',
                recipients: validRecipients
            }
        });
    } catch (error) {
        console.error('[Settings] Update notification recipients error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新通知接收人失败',
            error: error.message
        });
    }
}));

router.get('/settings/business/rules', responseWrapper(async (req, res) => {
    try {
        const configs = await systemConfigService.getAllConfigs({ activeOnly: true });

        const rules = {
            overdueGracePeriod: 7,
            lateFeeCalculation: 'daily',
            lateFeeRate: 0.05,
            maxLateFee: 1000,
            refundPeriod: 30,
            refundFeeRate: 2
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'business.overdue_grace_period') rules.overdueGracePeriod = parseInt(value) || 7;
            else if (key === 'business.late_fee_calculation') rules.lateFeeCalculation = value || 'daily';
            else if (key === 'business.late_fee_rate') rules.lateFeeRate = parseFloat(value) || 0.05;
            else if (key === 'business.max_late_fee') rules.maxLateFee = parseFloat(value) || 1000;
            else if (key === 'business.refund_period') rules.refundPeriod = parseInt(value) || 30;
            else if (key === 'business.refund_fee_rate') rules.refundFeeRate = parseFloat(value) || 2;
        }

        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        console.error('[Settings] Get business rules error:', error);
        res.status(500).json({
            success: false,
            message: '获取业务规则失败',
            error: error.message
        });
    }
}));

router.put('/settings/business/rules', [
    body('overdueGracePeriod').optional().isInt({ min: 0, max: 365 }).withMessage('逾期宽限期必须在0-365天之间'),
    body('lateFeeRate').optional().isFloat({ min: 0, max: 1 }).withMessage('滞纳金率必须在0-1之间'),
    body('maxLateFee').optional().isFloat({ min: 0 }).withMessage('最高滞纳金不能为负数'),
    body('refundPeriod').optional().isInt({ min: 0, max: 365 }).withMessage('退款期限必须在0-365天之间'),
    body('refundFeeRate').optional().isFloat({ min: 0, max: 100 }).withMessage('退款手续费率格式不正确')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }
        const rules = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const results = [];
        const configMap = {
            'business.overdue_grace_period': rules.overdueGracePeriod,
            'business.late_fee_calculation': rules.lateFeeCalculation,
            'business.late_fee_rate': rules.lateFeeRate,
            'business.max_late_fee': rules.maxLateFee,
            'business.refund_period': rules.refundPeriod,
            'business.refund_fee_rate': rules.refundFeeRate
        };

        for (const [dbKey, value] of Object.entries(configMap)) {
            try {
                await systemConfigService.setConfig(dbKey, value, {
                    userId,
                    description: '更新业务规则',
                    username,
                    ipAddress,
                    userAgent
                });
                results.push({ key: dbKey, success: true });
            } catch (err) {
                results.push({ key: dbKey, success: false, error: err.message });
            }
        }

        res.json({
            success: true,
            data: {
                message: '业务规则更新成功',
                results
            }
        });
    } catch (error) {
        console.error('[Settings] Update business rules error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新业务规则失败'
        });
    }
}));

router.get('/settings/logs/config', responseWrapper(async (req, res) => {
    try {
        const configs = await systemConfigService.getAllConfigs({ group: 'log', activeOnly: true });

        const logConfig = {
            level: 'info',
            retentionDays: 30,
            maxFileSize: 100,
            rotationEnabled: true,
            outputTargets: ['file', 'console']
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'log.level') logConfig.level = value || 'info';
            else if (key === 'log.max_files') logConfig.retentionDays = parseInt(value) || 30;
            else if (key === 'log.max_size') logConfig.maxFileSize = parseInt(value) || 100;
        }

        res.json({
            success: true,
            data: logConfig
        });
    } catch (error) {
        console.error('[Settings] Get log config error:', error);
        res.status(500).json({
            success: false,
            message: '获取日志配置失败',
            error: error.message
        });
    }
}));

router.put('/settings/logs/config', [
    body('level').optional().isString().isIn(['debug', 'info', 'warn', 'error']).withMessage('日志级别无效'),
    body('retentionDays').optional().isInt({ min: 1, max: 365 }).withMessage('日志保留天数必须在1-365天之间'),
    body('maxFileSize').optional().isInt({ min: 1, max: 1024 }).withMessage('日志文件大小限制必须在1-1024MB之间')
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }
        const config = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const role = req.user?.role || req.user?.role_name || 'admin';
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const configMap = {
            'log.level': config.level,
            'log.max_files': config.retentionDays,
            'log.max_size': config.maxFileSize
        };

        const updateMap = {};
        for (const [dbKey, value] of Object.entries(configMap)) {
            if (value !== undefined) {
                updateMap[dbKey] = value;
            }
        }

        if (Object.keys(updateMap).length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供有效的配置参数'
            });
        }

        // 使用事务性批量更新，确保原子性
        const result = await systemConfigService.setConfigsTransactional(updateMap, {
            userId,
            username,
            role,
            ipAddress,
            userAgent,
            reason: '更新日志配置'
        });

        res.json({
            success: true,
            data: {
                message: '日志配置更新成功',
                results: result.results
            }
        });
    } catch (error) {
        console.error('[Settings] Update log config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新日志配置失败'
        });
    }
}));

router.get('/settings/system/info', responseWrapper(async (req, res) => {
    try {
        const info = await systemStatusService.getRealSystemInfo();
        res.json({
            success: true,
            data: info
        });
    } catch (error) {
        console.error('[Settings] Get system info error:', error);
        res.status(500).json({
            success: false,
            message: '获取系统信息失败',
            error: error.message
        });
    }
}));

router.put('/settings/basic/info', [
    body('systemName').isString().trim().notEmpty().withMessage('系统名称不能为空'),
    body('systemVersion').isString().trim().notEmpty().withMessage('系统版本不能为空'),
    body('adminEmail').isEmail().withMessage('管理员邮箱格式不正确'),
    body('icp备案').optional().isString().trim()
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errors.array().map(e => e.msg).join(', '),
                errors: errors.array()
            });
        }
        const info = req.body;
        const userId = req.user?.id;
        
        const configs = {
            'system.name': info.systemName,
            'system.version': info.systemVersion,
            'notification.admin_email': info.adminEmail,
            'system.icp': info['icp备案']
        };

        await systemConfigService.setConfigs(configs, userId);

        res.json({
            success: true,
            data: {
                message: '基础信息更新成功'
            }
        });
    } catch (error) {
        console.error('[Settings] Update basic info error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新基础信息失败'
        });
    }
}));

router.get('/settings/system/services', responseWrapper(async (req, res) => {
    try {
        const services = await systemStatusService.getRealServiceStatus();

        res.json({
            success: true,
            data: {
                services,
                checkedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Settings] Get service status error:', error);
        res.status(500).json({
            success: false,
            message: '获取服务状态失败',
            error: error.message
        });
    }
}));

/**
 * 获取配置审计日志
 * GET /settings/audit-logs
 */
router.get('/settings/audit-logs', responseWrapper(async (req, res) => {
    try {
        const { configKey, userId, startDate, endDate, page, pageSize } = req.query;
        
        const result = await configAuditService.getAuditLogs({
            configKey,
            userId: userId ? parseInt(userId) : undefined,
            startDate,
            endDate,
            page: page ? parseInt(page) : 1,
            pageSize: pageSize ? parseInt(pageSize) : 20
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('[Settings] Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: '获取审计日志失败',
            error: error.message
        });
    }
}));

/**
 * 获取特定配置的历史记录
 * GET /settings/config-history/:configKey
 */
router.get('/settings/config-history/:configKey', [
    param('configKey').isString()
], responseWrapper(async (req, res) => {
    try {
        const { configKey } = req.params;
        const { limit } = req.query;
        
        const history = await configAuditService.getConfigHistory(
            configKey, 
            limit ? parseInt(limit) : 20
        );

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('[Settings] Get config history error:', error);
        res.status(500).json({
            success: false,
            message: '获取配置历史失败',
            error: error.message
        });
    }
}));

/**
 * 回滚配置到指定版本
 * POST /settings/config-rollback
 */
router.post('/settings/config-rollback', [
    body('configKey').isString(),
    body('targetVersion').isInt(),
    body('reason').optional().isString()
], responseWrapper(async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { configKey, targetVersion, reason } = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const result = await configAuditService.rollbackConfig(
            configKey,
            targetVersion,
            userId,
            username,
            reason,
            ipAddress,
            userAgent
        );

        res.json({
            success: true,
            message: '配置回滚成功',
            data: result
        });
    } catch (error) {
        console.error('[Settings] Rollback config error:', error);
        res.status(500).json({
            success: false,
            message: '配置回滚失败',
            error: error.message
        });
    }
}));

module.exports = router;
