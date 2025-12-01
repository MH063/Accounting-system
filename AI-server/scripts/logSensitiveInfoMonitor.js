/**
 * 日志敏感信息监控器
 * 实时监控应用日志中的敏感信息泄露
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class LogSensitiveInfoMonitor {
    constructor() {
        this.logPaths = [
            'logs/app.log',
            'logs/error.log',
            'logs/access.log',
            'logs/security.log'
        ];

        this.sensitivePatterns = [
            // IP地址
            /\b(?:127\.0\.0\.1|localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2[0-9]|3[01])\.\d+\.\d+)\b/g,
            // API密钥
            /\b(?:api[_-]?key|apikey|secret|password|token)["'\s]*[:=]["'\s]*[A-Za-z0-9_-]{16,}\b/gi,
            // JWT令牌
            /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,
            // 数据库连接字符串
            /(?:mongodb|mysql|postgresql|postgres):\/\/[A-Za-z0-9._-]+:[A-Za-z0-9._-]+@[A-Za-z0-9.-]+/gi,
            // AWS密钥
            /\b(?:AKIA[A-Z0-9]{16}|ASIA[A-Z0-9]{16})\b/g,
            // 未替换的占位符（反向检查）
            /\[(SERVER_HOST|DB_HOST|REDIS_HOST|CLAMAV_HOST|MONITORING_HOST|NODE_EXPORTER_HOST|ALERTMANAGER_HOST)\]/g
        ];

        this.alerts = [];
        this.monitoring = false;
        this.fileWatchers = new Map();
    }

    /**
     * 开始监控日志文件
     */
    async startMonitoring() {
        console.log('🔍 启动日志敏感信息监控...');
        
        this.monitoring = true;
        
        // 检查日志目录是否存在
        await this.ensureLogDirectory();
        
        // 扫描现有日志文件
        await this.scanExistingLogs();
        
        // 设置文件监听器
        this.setupFileWatchers();
        
        console.log('✅ 日志监控已启动，正在实时监控敏感信息...');
        console.log('按 Ctrl+C 停止监控\n');
    }

    /**
     * 确保日志目录存在
     */
    async ensureLogDirectory() {
        const logDir = path.dirname(this.logPaths[0]);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
            console.log(`📁 创建日志目录: ${logDir}`);
        }
    }

    /**
     * 扫描现有日志文件
     */
    async scanExistingLogs() {
        console.log('\n📖 扫描现有日志文件...');
        
        for (const logPath of this.logPaths) {
            const fullPath = path.resolve(logPath);
            
            if (fs.existsSync(fullPath)) {
                console.log(`  📄 扫描: ${logPath}`);
                await this.scanLogFile(fullPath);
            } else {
                console.log(`  ⚠️  文件不存在: ${logPath}`);
            }
        }
        
        if (this.alerts.length > 0) {
            console.log(`\n⚠️  发现 ${this.alerts.length} 个潜在敏感信息泄露`);
            this.generateAlertReport();
        }
    }

    /**
     * 扫描单个日志文件
     */
    async scanLogFile(filePath) {
        try {
            const fileStream = fs.createReadStream(filePath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let lineNumber = 0;
            for await (const line of rl) {
                lineNumber++;
                await this.analyzeLogLine(line, filePath, lineNumber);
            }
        } catch (error) {
            console.error(`❌ 读取文件失败 ${filePath}:`, error.message);
        }
    }

    /**
     * 分析日志行
     */
    async analyzeLogLine(line, filePath, lineNumber) {
        const findings = [];
        
        this.sensitivePatterns.forEach((pattern, index) => {
            const matches = line.match(pattern);
            if (matches) {
                findings.push({
                    type: this.getPatternType(index),
                    matches: matches.slice(0, 3), // 限制显示数量
                    count: matches.length
                });
            }
        });

        if (findings.length > 0) {
            this.alerts.push({
                timestamp: new Date().toISOString(),
                file: path.basename(filePath),
                lineNumber,
                line: this.maskSensitiveLine(line, findings),
                findings,
                severity: this.calculateSeverity(findings)
            });
        }
    }

    /**
     * 获取模式类型
     */
    getPatternType(index) {
        const types = [
            'IP_ADDRESS',
            'API_KEY',
            'JWT_TOKEN',
            'DATABASE_CONNECTION',
            'AWS_KEY',
            'UNREPLACED_PLACEHOLDER'
        ];
        return types[index] || 'UNKNOWN';
    }

    /**
     * 计算严重程度
     */
    calculateSeverity(findings) {
        let severity = 'low';
        let score = 0;

        findings.forEach(finding => {
            switch (finding.type) {
                case 'API_KEY':
                case 'AWS_KEY':
                case 'DATABASE_CONNECTION':
                    score += 10;
                    break;
                case 'JWT_TOKEN':
                    score += 8;
                    break;
                case 'IP_ADDRESS':
                    score += 3;
                    break;
                case 'UNREPLACED_PLACEHOLDER':
                    score += 5;
                    break;
            }
        });

        if (score >= 15) severity = 'high';
        else if (score >= 8) severity = 'medium';

        return severity;
    }

    /**
     * 掩码敏感行
     */
    maskSensitiveLine(line, findings) {
        let maskedLine = line;
        
        findings.forEach(finding => {
            finding.matches.forEach(match => {
                if (match.length > 10) {
                    const masked = match.substring(0, 4) + '*'.repeat(match.length - 8) + match.substring(match.length - 4);
                    maskedLine = maskedLine.replace(match, masked);
                } else {
                    maskedLine = maskedLine.replace(match, '*'.repeat(match.length));
                }
            });
        });

        return maskedLine;
    }

    /**
     * 设置文件监听器
     */
    setupFileWatchers() {
        this.logPaths.forEach(logPath => {
            const fullPath = path.resolve(logPath);
            
            if (fs.existsSync(fullPath)) {
                try {
                    const watcher = fs.watch(fullPath, (eventType, filename) => {
                        if (eventType === 'change') {
                            this.handleLogFileChange(fullPath);
                        }
                    });

                    this.fileWatchers.set(fullPath, watcher);
                    console.log(`👁️  正在监控: ${logPath}`);
                } catch (error) {
                    console.error(`❌ 无法监控文件 ${logPath}:`, error.message);
                }
            }
        });
    }

    /**
     * 处理日志文件变化
     */
    async handleLogFileChange(filePath) {
        try {
            // 读取文件的最后几行
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            const chunkSize = Math.min(8192, fileSize); // 读取最后8KB或整个文件
            
            const buffer = Buffer.alloc(chunkSize);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, chunkSize, fileSize - chunkSize);
            fs.closeSync(fd);
            
            const newContent = buffer.toString();
            const lines = newContent.split('\n').filter(line => line.trim());
            
            // 分析新添加的行
            for (const line of lines.slice(-10)) { // 只检查最后10行
                await this.analyzeLogLine(line, filePath, 'new');
            }
            
            // 如果有新发现，立即报告
            const recentAlerts = this.alerts.filter(alert => 
                alert.timestamp > new Date(Date.now() - 60000).toISOString() // 最近1分钟
            );
            
            if (recentAlerts.length > 0) {
                console.log(`\n⚠️  检测到 ${recentAlerts.length} 个新的敏感信息泄露`);
                this.generateAlertReport(recentAlerts);
            }
            
        } catch (error) {
            console.error(`❌ 处理文件变化失败:`, error.message);
        }
    }

    /**
     * 生成告警报告
     */
    generateAlertReport(alerts = null) {
        const targetAlerts = alerts || this.alerts;
        
        if (targetAlerts.length === 0) {
            console.log('✅ 未发现敏感信息泄露');
            return;
        }

        console.log('\n' + '='.repeat(60));
        console.log('🚨 敏感信息泄露告警报告');
        console.log('='.repeat(60));
        
        // 按严重程度分组
        const grouped = {
            high: targetAlerts.filter(a => a.severity === 'high'),
            medium: targetAlerts.filter(a => a.severity === 'medium'),
            low: targetAlerts.filter(a => a.severity === 'low')
        };

        ['high', 'medium', 'low'].forEach(severity => {
            if (grouped[severity].length > 0) {
                const severityText = severity === 'high' ? '🔴 高危' : 
                                   severity === 'medium' ? '🟡 中危' : '🟢 低危';
                console.log(`\n${severityText} (${grouped[severity].length} 个):`);
                
                grouped[severity].forEach(alert => {
                    console.log(`  📁 ${alert.file}:${alert.lineNumber}`);
                    console.log(`     ${alert.line}`);
                    console.log(`     类型: ${alert.findings.map(f => f.type).join(', ')}`);
                    console.log('');
                });
            }
        });

        // 统计信息
        const totalFindings = targetAlerts.reduce((sum, alert) => 
            sum + alert.findings.reduce((fSum, f) => fSum + f.count, 0), 0
        );
        
        console.log(`📊 统计信息:`);
        console.log(`  总告警数: ${targetAlerts.length}`);
        console.log(`  总发现数: ${totalFindings}`);
        console.log(`  高危: ${grouped.high.length}`);
        console.log(`  中危: ${grouped.medium.length}`);
        console.log(`  低危: ${grouped.low.length}`);
        
        console.log('\n' + '='.repeat(60));
    }

    /**
     * 保存监控报告
     */
    saveMonitoringReport() {
        const report = {
            timestamp: new Date().toISOString(),
            monitoringDuration: this.monitoring ? 
                new Date(Date.now() - this.startTime).toISOString().substr(11, 8) : '00:00:00',
            totalAlerts: this.alerts.length,
            alerts: this.alerts.slice(-100), // 只保存最近100条
            summary: {
                bySeverity: {
                    high: this.alerts.filter(a => a.severity === 'high').length,
                    medium: this.alerts.filter(a => a.severity === 'medium').length,
                    low: this.alerts.filter(a => a.severity === 'low').length
                },
                byType: this.getAlertSummaryByType()
            }
        };

        const reportsDir = 'security-reports';
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `log-monitoring-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 监控报告已保存到: ${filepath}`);
    }

    /**
     * 获取按类型统计的告警摘要
     */
    getAlertSummaryByType() {
        const summary = {};
        this.alerts.forEach(alert => {
            alert.findings.forEach(finding => {
                summary[finding.type] = (summary[finding.type] || 0) + finding.count;
            });
        });
        return summary;
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        console.log('\n🛑 正在停止日志监控...');
        
        this.monitoring = false;
        
        // 关闭文件监听器
        this.fileWatchers.forEach((watcher, filePath) => {
            watcher.close();
            console.log(`  ✅ 停止监控: ${path.basename(filePath)}`);
        });
        
        // 保存最终报告
        if (this.alerts.length > 0) {
            this.saveMonitoringReport();
        }
        
        console.log('✅ 日志监控已停止');
    }
}

/**
 * 命令行接口
 */
async function main() {
    const monitor = new LogSensitiveInfoMonitor();
    monitor.startTime = Date.now();
    
    try {
        await monitor.startMonitoring();
        
        // 设置优雅退出
        process.on('SIGINT', async () => {
            console.log('\n🔄 收到中断信号，正在清理...');
            await monitor.stopMonitoring();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🔄 收到终止信号，正在清理...');
            await monitor.stopMonitoring();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 监控启动失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = LogSensitiveInfoMonitor;