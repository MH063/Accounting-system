import api from './index'

interface SettingsConfigs {
    [key: string]: any
}

interface ConfigHistoryItem {
    id: number
    configKey: string
    configValue: any
    configVersion: number
    changedBy: number
    changedByUsername: string
    changeReason: string
    createdAt: string
}

interface PaymentConfigs {
    enabledPayments: string[]
    defaultPayment: string
    configs: {
        alipay: {
            appId: string
            merchantId: string
            apiKey: string
            enabled: boolean
        }
        wechat: {
            appId: string
            merchantId: string
            apiKey: string
            enabled: boolean
        }
        unionpay: {
            appId: string
            merchantId: string
            apiKey: string
            enabled: boolean
        }
    }
}

interface EmailConfig {
    smtpServer: string
    smtpPort: number
    emailAccount: string
    senderName: string
    secureConnection: boolean
}

interface SecurityConfig {
    passwordStrength: string
    loginFailCount: number
    lockTime: number
    sessionTimeout: number
    twoFactorAuth: boolean
    ipRestriction: boolean
    ipControlMode: 'whitelist' | 'blacklist'
    ipWhitelist: string[]
    ipBlacklist: string[]
    passwordPolicy: {
        minLength: number
        requireSpecial: boolean
        requireNumber: boolean
        requireUppercase: boolean
        historyLimit: number
        expirationDays: number
    }
}

interface NotificationTemplate {
    id: number
    name: string
    type: string
    content: string
    variables: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface NotificationRules {
    systemNotifications: string[]
    importantOperationNotify: boolean
    scheduledTaskNotify: boolean
    alertNotify: boolean
}

interface NotificationRecipient {
    id: number
    name: string
    email: string
    phone?: string
    role: string
}

interface BusinessRules {
    overdueGracePeriod: number
    lateFeeCalculation: string
    lateFeeRate: number
    maxLateFee: number
    refundPeriod: number
    refundFeeRate: number
}

interface LogConfig {
    level: string
    retentionDays: number
    maxFileSize: number
    rotationEnabled: boolean
    outputTargets: string[]
}

interface SystemInfo {
    name: string
    version: string
    environment: string
    startTime: string
    uptime: string
}

interface ServiceStatus {
    name: string
    status: string
    responseTime: string
}

export const settingsApi = {
    getConfigs: (group: string) =>
        api.get(`/admin/settings/configs/${group}`),

    updateConfigs: (data: { configs: SettingsConfigs; reason?: string }) =>
        api.put('/admin/settings/configs', data),

    resetConfig: (key: string) =>
        api.post(`/admin/settings/configs/${key}/reset`),

    getConfigHistory: (key: string, limit?: number) =>
        api.get(`/admin/settings/config-history/${key}`, { params: { limit } }),

    getAuditLogs: (params: {
        configKey?: string;
        userId?: number;
        startDate?: string;
        endDate?: string;
        page?: number;
        pageSize?: number;
    }) => api.get('/admin/settings/audit-logs', { params }),

    rollbackConfig: (data: { configKey: string; targetVersion: number; reason?: string }) =>
        api.post('/admin/settings/config-rollback', data),

    getPaymentConfigs: () =>
        api.get('/admin/settings/payment/configs'),

    updatePaymentConfig: (method: string, data: any) =>
        api.put(`/admin/settings/payment/configs/${method}`, data),

    testPaymentConfig: (data: { method: string; config: any }) =>
        api.post('/admin/settings/payment/test', data),

    getEmailConfig: () =>
        api.get('/admin/settings/email/config'),

    updateEmailConfig: (data: Partial<EmailConfig>) =>
        api.put('/admin/settings/email/config', data),

    testEmailConfig: (data: { testEmail: string; config: Partial<EmailConfig> }) =>
        api.post('/admin/settings/email/test', data),

    getSecurityConfig: () =>
        api.get('/admin/settings/security/config'),

    updateSecurityConfig: (data: Partial<SecurityConfig>) =>
        api.put('/admin/settings/security/config', data),

    getNotificationTemplates: () =>
        api.get('/admin/settings/notification/templates'),

    createNotificationTemplate: (data: { name: string; type: string; content: string }) =>
        api.post('/admin/settings/notification/templates', data),

    updateNotificationTemplate: (id: number, data: { name: string; type: string; content: string }) =>
        api.put(`/admin/settings/notification/templates/${id}`, data),

    deleteNotificationTemplate: (id: number) =>
        api.delete(`/admin/settings/notification/templates/${id}`),

    batchDeleteNotificationTemplates: (ids: number[]) =>
        api.delete('/admin/settings/notification/templates/batch', { data: { ids } }),

    getNotificationRules: () =>
        api.get('/admin/settings/notification/rules'),

    updateNotificationRules: (data: Partial<NotificationRules>) =>
        api.put('/admin/settings/notification/rules', data),

    getNotificationRecipients: () =>
        api.get('/admin/settings/notification/recipients'),

    updateNotificationRecipients: (data: { recipients: number[] }) =>
        api.put('/admin/settings/notification/recipients', data),

    getBusinessRules: () =>
        api.get('/admin/settings/business/rules'),

    updateBusinessRules: (data: Partial<BusinessRules>) =>
        api.put('/admin/settings/business/rules', data),

    getLogConfig: () =>
        api.get('/admin/settings/logs/config'),

    updateLogConfig: (data: Partial<LogConfig>) =>
        api.put('/admin/settings/logs/config', data),

    getSystemInfo: () =>
        api.get('/admin/settings/system/info'),

    getServiceStatus: () =>
        api.get('/admin/settings/system/services')
}

export type {
    SettingsConfigs,
    ConfigHistoryItem,
    PaymentConfigs,
    EmailConfig,
    SecurityConfig,
    NotificationTemplate,
    NotificationRules,
    NotificationRecipient,
    BusinessRules,
    LogConfig,
    SystemInfo,
    ServiceStatus
}
