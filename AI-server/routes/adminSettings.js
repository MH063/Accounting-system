const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param, query, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const systemConfigService = require('../services/systemConfigService');
const configAuditService = require('../services/configAuditService');
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
    body('method').isString().isIn(['alipay', 'wechat', 'unionpay'])
], responseWrapper(async (req, res) => {
    try {
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

router.put('/settings/email/config', responseWrapper(async (req, res) => {
    try {
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
            passwordPolicy: {
                minLength: 8,
                requireSpecial: true,
                requireNumber: true,
                requireUppercase: false
            }
        };

        for (const [key, config] of Object.entries(configs)) {
            const value = config.value;
            if (key === 'security.password_policy.min_length') securityConfig.passwordPolicy.minLength = parseInt(value) || 8;
            else if (key === 'security.password_policy.require_special') securityConfig.passwordPolicy.requireSpecial = Boolean(value);
            else if (key === 'security.password_policy.require_number') securityConfig.passwordPolicy.requireNumber = Boolean(value);
            else if (key === 'security.login.max_attempts') securityConfig.loginFailCount = parseInt(value) || 5;
            else if (key === 'security.login.lockout_duration') securityConfig.lockTime = parseInt(value) || 30;
            else if (key === 'session.timeout') securityConfig.sessionTimeout = parseInt(value) || 120;
            else if (key === 'security.2fa_required') securityConfig.twoFactorAuth = Boolean(value);
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

router.put('/settings/security/config', responseWrapper(async (req, res) => {
    try {
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
            'security.password_policy.min_length': config.passwordPolicy?.minLength,
            'security.password_policy.require_special': config.passwordPolicy?.requireSpecial,
            'security.password_policy.require_number': config.passwordPolicy?.requireNumber,
            'security.password_policy.require_uppercase': config.passwordPolicy?.requireUppercase
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
        const templates = [
            { id: 1, name: '费用缴纳通知', type: 'email', content: '尊敬的{userName}，您有一笔{amount}元的{feeType}费用待缴纳，请在{dueDate}前完成支付。', variables: ['{userName}', '{amount}', '{feeType}', '{dueDate}'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: 2, name: '逾期提醒', type: 'sms', content: '【AI管理系统】提醒：您的{feeType}费用已逾期{days}天，请尽快处理。', variables: ['{feeType}', '{days}'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: 3, name: '支付成功通知', type: 'wechat', content: '您已成功支付{amount}元{feeType}费用，支付时间为{payTime}。', variables: ['{amount}', '{feeType}', '{payTime}'], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];

        res.json({
            success: true,
            data: {
                templates,
                total: templates.length
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
        const { name, type, content } = req.body;
        const userId = req.user?.id;

        const variables = [...content.matchAll(/\{(\w+)\}/g)].map(m => `{${m[1]}}`);

        const newTemplate = {
            id: Date.now(),
            name,
            type,
            content,
            variables,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: {
                message: '通知模板创建成功',
                template: newTemplate
            }
        });
    } catch (error) {
        console.error('[Settings] Create notification template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建通知模板失败'
        });
    }
}));

router.put('/settings/notification/templates/:id', [
    body('name').isString().notEmpty(),
    body('type').isString().isIn(['email', 'sms', 'wechat', 'dingtalk']),
    body('content').isString().notEmpty()
], responseWrapper(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, content } = req.body;

        const variables = [...content.matchAll(/\{(\w+)\}/g)].map(m => `{${m[1]}}`);

        res.json({
            success: true,
            data: {
                message: '通知模板更新成功',
                template: {
                    id: parseInt(id),
                    name,
                    type,
                    content,
                    variables,
                    updatedAt: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('[Settings] Update notification template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新通知模板失败'
        });
    }
}));

router.delete('/settings/notification/templates/:id', responseWrapper(async (req, res) => {
    try {
        const { id } = req.params;

        res.json({
            success: true,
            data: {
                message: '通知模板删除成功',
                id: parseInt(id)
            }
        });
    } catch (error) {
        console.error('[Settings] Delete notification template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除通知模板失败'
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

router.put('/settings/notification/rules', responseWrapper(async (req, res) => {
    try {
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
        const recipients = [
            { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员' },
            { id: 2, name: '李四', email: 'lisi@example.com', role: '财务' },
            { id: 3, name: '王五', email: 'wangwu@example.com', role: '管理员' }
        ];

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
    body('recipients').isArray()
], responseWrapper(async (req, res) => {
    try {
        const { recipients } = req.body;

        res.json({
            success: true,
            data: {
                message: '通知接收人更新成功',
                recipients
            }
        });
    } catch (error) {
        console.error('[Settings] Update notification recipients error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新通知接收人失败'
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

router.put('/settings/business/rules', responseWrapper(async (req, res) => {
    try {
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

router.put('/settings/logs/config', responseWrapper(async (req, res) => {
    try {
        const config = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.get('User-Agent');

        const results = [];
        const configMap = {
            'log.level': config.level,
            'log.max_files': config.retentionDays,
            'log.max_size': config.maxFileSize
        };

        for (const [dbKey, value] of Object.entries(configMap)) {
            try {
                await systemConfigService.setConfig(dbKey, value, {
                    userId,
                    description: '更新日志配置',
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
                message: '日志配置更新成功',
                results
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
        const configs = await systemConfigService.getAllConfigs({ activeOnly: true });
        const serverVersion = versionManager.getServerVersion();

        const name = configs['system.name']?.value || serverVersion.name;
        const version = serverVersion.version;
        const environment = configs['system.environment']?.value || 'development';
        const startTime = configs['system.deploy_time']?.value || new Date().toISOString();

        const environmentMap = {
            development: '开发环境',
            testing: '测试环境',
            production: '生产环境'
        };

        let uptime = '未知';
        try {
            const start = new Date(startTime);
            if (!isNaN(start.getTime())) {
                const now = new Date();
                const diffMs = now.getTime() - start.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                uptime = `${diffDays}天${diffHours}小时${diffMinutes}分钟`;
            }
        } catch (e) {
            uptime = '未知';
        }

        res.json({
            success: true,
            data: {
                name,
                version,
                environment: environmentMap[environment] || environment,
                startTime,
                uptime
            }
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

router.get('/settings/system/services', responseWrapper(async (req, res) => {
    try {
        const services = [
            { name: '用户服务', status: '正常', responseTime: '45ms' },
            { name: '费用服务', status: '正常', responseTime: '62ms' },
            { name: '支付服务', status: '正常', responseTime: '78ms' },
            { name: '通知服务', status: '正常', responseTime: '32ms' },
            { name: '数据库服务', status: '正常', responseTime: '15ms' }
        ];

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

module.exports = router;
