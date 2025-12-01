/**
 * 持续监控脚本
 * 定期执行敏感信息检查、日志监控和第三方服务验证
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 导入各个监控模块
const SensitiveInfoMonitor = require('./sensitiveInfoMonitor');
const LogSensitiveInfoMonitor = require('./logSensitiveInfoMonitor');
const ThirdPartyServiceValidator = require('./thirdPartyServiceValidator');
const ProductionEnvValidator = require('./productionEnvValidator');

class ContinuousMonitoring {
    constructor() {
        this.config = {
            // 监控间隔（毫秒）
            intervals: {
                sensitiveInfo: 24 * 60 * 60 * 1000, // 24小时
                logMonitoring: 60 * 60 * 1000,     // 1小时
                serviceValidation: 4 * 60 * 60 * 1000, // 4小时
                environmentCheck: 12 * 60 * 60 * 1000 // 12小时
            },
            // 监控目录
            directories: {
                source: process.cwd(),
                logs: path.join(process.cwd(), 'logs'),
                reports: path.join(process.cwd(), 'security-reports')
            },
            // 通知配置
            notifications: {
                enabled: true,
                email: process.env.SECURITY_EMAIL,
                webhook: process.env.SECURITY_WEBHOOK
            }
        };

        this.isRunning = false;
        this.timers = {};
        this.monitoringLogs = [];
    }

    /**
     * 启动持续监控
     */
    async start() {
        console.log('🚀 启动持续监控系统...');
        
        this.isRunning = true;
        
        // 创建报告目录
        this.ensureDirectories();
        
        // 立即执行一次全面检查
        await this.performInitialCheck();
        
        // 设置定时任务
        this.setupScheduledTasks();
        
        console.log('✅ 持续监控系统已启动');
        console.log(`📊 监控配置: ${JSON.stringify(this.config.intervals, null, 2)}`);
        
        // 记录启动日志
        this.logMonitoringEvent('system', '监控启动', '持续监控系统已成功启动');
    }

    /**
     * 停止持续监控
     */
    stop() {
        console.log('🛑 停止持续监控系统...');
        
        this.isRunning = false;
        
        // 清除所有定时器
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        
        this.timers = {};
        
        // 记录停止日志
        this.logMonitoringEvent('system', '监控停止', '持续监控系统已停止');
        
        console.log('✅ 持续监控系统已停止');
    }

    /**
     * 确保必要的目录存在
     */
    ensureDirectories() {
        Object.values(this.config.directories).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * 执行初始检查
     */
    async performInitialCheck() {
        console.log('🔍 执行初始安全检查...');
        
        try {
            // 1. 敏感信息检查
            await this.checkSensitiveInfo();
            
            // 2. 日志监控
            await this.monitorLogs();
            
            // 3. 第三方服务验证
            await this.validateServices();
            
            // 4. 环境检查
            await this.checkEnvironment();
            
            console.log('✅ 初始安全检查完成');
            
        } catch (error) {
            console.error('❌ 初始检查失败:', error.message);
            this.logMonitoringEvent('error', '初始检查失败', error.message);
        }
    }

    /**
     * 设置定时任务
     */
    setupScheduledTasks() {
        console.log('⏰ 设置定时监控任务...');
        
        // 敏感信息检查（24小时）
        this.timers.sensitiveInfo = setInterval(
            () => this.checkSensitiveInfo(),
            this.config.intervals.sensitiveInfo
        );
        
        // 日志监控（1小时）
        this.timers.logMonitoring = setInterval(
            () => this.monitorLogs(),
            this.config.intervals.logMonitoring
        );
        
        // 服务验证（4小时）
        this.timers.serviceValidation = setInterval(
            () => this.validateServices(),
            this.config.intervals.serviceValidation
        );
        
        // 环境检查（12小时）
        this.timers.environmentCheck = setInterval(
            () => this.checkEnvironment(),
            this.config.intervals.environmentCheck
        );
    }

    /**
     * 检查敏感信息
     */
    async checkSensitiveInfo() {
        console.log('🔍 执行敏感信息检查...');
        
        try {
            const monitor = new SensitiveInfoMonitor();
            const results = await monitor.scanDirectory(this.config.directories.source);
            
            const hasIssues = results.ipAddresses.length > 0 || 
                             results.domains.length > 0 || 
                             results.apiKeys.length > 0 ||
                             results.placeholders.length > 0;
            
            if (hasIssues) {
                console.log('⚠️  发现敏感信息问题');
                this.logMonitoringEvent('security', '敏感信息检查', '发现敏感信息问题', results);
                
                if (this.config.notifications.enabled) {
                    await this.sendNotification('敏感信息检查警报', results);
                }
            } else {
                console.log('✅ 敏感信息检查通过');
                this.logMonitoringEvent('security', '敏感信息检查', '检查通过，未发现敏感信息泄露');
            }
            
        } catch (error) {
            console.error('❌ 敏感信息检查失败:', error.message);
            this.logMonitoringEvent('error', '敏感信息检查失败', error.message);
        }
    }

    /**
     * 监控日志
     */
    async monitorLogs() {
        console.log('📋 执行日志监控...');
        
        try {
            const logMonitor = new LogSensitiveInfoMonitor();
            
            // 检查日志目录是否存在
            if (!fs.existsSync(this.config.directories.logs)) {
                console.log('⚠️  日志目录不存在，跳过日志监控');
                return;
            }
            
            const results = await logMonitor.scanLogFiles(this.config.directories.logs);
            
            const hasIssues = results.ipAddresses.length > 0 || 
                             results.apiKeys.length > 0 || 
                             results.jwtTokens.length > 0 ||
                             results.placeholders.length > 0;
            
            if (hasIssues) {
                console.log('⚠️  发现日志中的敏感信息');
                this.logMonitoringEvent('security', '日志监控', '发现日志中的敏感信息', results);
                
                if (this.config.notifications.enabled) {
                    await this.sendNotification('日志安全警报', results);
                }
            } else {
                console.log('✅ 日志监控通过');
                this.logMonitoringEvent('security', '日志监控', '监控通过，日志中未发现敏感信息');
            }
            
        } catch (error) {
            console.error('❌ 日志监控失败:', error.message);
            this.logMonitoringEvent('error', '日志监控失败', error.message);
        }
    }

    /**
     * 验证第三方服务
     */
    async validateServices() {
        console.log('🔧 执行第三方服务验证...');
        
        try {
            const validator = new ThirdPartyServiceValidator();
            const results = await validator.validateAllServices();
            
            const hasIssues = results.summary.overallStatus.includes('❌') || 
                             results.summary.overallStatus.includes('⚠️');
            
            if (hasIssues) {
                console.log('⚠️  发现第三方服务配置问题');
                this.logMonitoringEvent('service', '第三方服务验证', '发现服务配置问题', results);
                
                if (this.config.notifications.enabled) {
                    await this.sendNotification('第三方服务配置警报', results);
                }
            } else {
                console.log('✅ 第三方服务验证通过');
                this.logMonitoringEvent('service', '第三方服务验证', '验证通过，所有服务配置正常');
            }
            
        } catch (error) {
            console.error('❌ 第三方服务验证失败:', error.message);
            this.logMonitoringEvent('error', '第三方服务验证失败', error.message);
        }
    }

    /**
     * 检查环境配置
     */
    async checkEnvironment() {
        console.log('🌍 执行环境配置检查...');
        
        try {
            const validator = new ProductionEnvValidator();
            const results = await validator.validateEnvironment();
            
            const hasIssues = results.score < 80; // 假设80分以下为有问题
            
            if (hasIssues) {
                console.log('⚠️  发现环境配置问题');
                this.logMonitoringEvent('environment', '环境配置检查', '发现环境配置问题', results);
                
                if (this.config.notifications.enabled) {
                    await this.sendNotification('环境配置警报', results);
                }
            } else {
                console.log('✅ 环境配置检查通过');
                this.logMonitoringEvent('environment', '环境配置检查', '检查通过，环境配置正常');
            }
            
        } catch (error) {
            console.error('❌ 环境配置检查失败:', error.message);
            this.logMonitoringEvent('error', '环境配置检查失败', error.message);
        }
    }

    /**
     * 记录监控事件
     */
    logMonitoringEvent(type, title, message, details = null) {
        const event = {
            timestamp: new Date().toISOString(),
            type,
            title,
            message,
            details
        };
        
        this.monitoringLogs.push(event);
        
        // 保持日志数量在合理范围内
        if (this.monitoringLogs.length > 1000) {
            this.monitoringLogs = this.monitoringLogs.slice(-500);
        }
        
        // 保存到文件
        this.saveMonitoringLog();
    }

    /**
     * 保存监控日志
     */
    saveMonitoringLog() {
        try {
            const logFile = path.join(this.config.directories.reports, 'monitoring-log.json');
            fs.writeFileSync(logFile, JSON.stringify(this.monitoringLogs, null, 2));
        } catch (error) {
            console.error('保存监控日志失败:', error.message);
        }
    }

    /**
     * 发送通知
     */
    async sendNotification(subject, data) {
        console.log(`📧 发送通知: ${subject}`);
        
        try {
            // 这里可以实现邮件或Webhook通知
            // 例如使用nodemailer发送邮件，或使用axios发送Webhook
            
            if (this.config.notifications.email) {
                // TODO: 实现邮件通知
                console.log(`📧 邮件通知已配置: ${this.config.notifications.email}`);
            }
            
            if (this.config.notifications.webhook) {
                // TODO: 实现Webhook通知
                console.log(`🌐 Webhook通知已配置: ${this.config.notifications.webhook}`);
            }
            
        } catch (error) {
            console.error('发送通知失败:', error.message);
        }
    }

    /**
     * 获取监控状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
            lastCheck: this.monitoringLogs.length > 0 ? this.monitoringLogs[this.monitoringLogs.length - 1] : null,
            totalEvents: this.monitoringLogs.length,
            recentEvents: this.monitoringLogs.slice(-10)
        };
    }

    /**
     * 获取监控统计
     */
    getStatistics() {
        const stats = {
            totalEvents: this.monitoringLogs.length,
            eventsByType: {},
            eventsByDay: {},
            alerts: 0,
            last24Hours: 0
        };
        
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        this.monitoringLogs.forEach(event => {
            // 按类型统计
            stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
            
            // 按天统计
            const date = event.timestamp.split('T')[0];
            stats.eventsByDay[date] = (stats.eventsByDay[date] || 0) + 1;
            
            // 统计警报
            if (event.type === 'security' || event.type === 'error') {
                stats.alerts++;
            }
            
            // 统计最近24小时
            if (new Date(event.timestamp) >= last24Hours) {
                stats.last24Hours++;
            }
        });
        
        return stats;
    }
}

/**
 * 命令行接口
 */
async function main() {
    const monitoring = new ContinuousMonitoring();
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    const command = args[0];
    
    try {
        switch (command) {
            case 'start':
                await monitoring.start();
                
                // 保持进程运行
                process.on('SIGINT', () => {
                    console.log('\n🛑 接收到停止信号，正在关闭监控...');
                    monitoring.stop();
                    process.exit(0);
                });
                
                process.on('SIGTERM', () => {
                    console.log('\n🛑 接收到终止信号，正在关闭监控...');
                    monitoring.stop();
                    process.exit(0);
                });
                
                break;
                
            case 'stop':
                monitoring.stop();
                break;
                
            case 'status':
                const status = monitoring.getStatus();
                console.log('📊 监控状态:', JSON.stringify(status, null, 2));
                break;
                
            case 'stats':
                const stats = monitoring.getStatistics();
                console.log('📈 监控统计:', JSON.stringify(stats, null, 2));
                break;
                
            case 'check':
                // 执行一次性检查
                await monitoring.performInitialCheck();
                break;
                
            default:
                console.log('🔧 持续监控工具');
                console.log('用法:');
                console.log('  node continuousMonitoring.js start   - 启动持续监控');
                console.log('  node continuousMonitoring.js stop    - 停止持续监控');
                console.log('  node continuousMonitoring.js status  - 查看监控状态');
                console.log('  node continuousMonitoring.js stats   - 查看监控统计');
                console.log('  node continuousMonitoring.js check   - 执行一次性检查');
                break;
        }
        
    } catch (error) {
        console.error('❌ 执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = ContinuousMonitoring;