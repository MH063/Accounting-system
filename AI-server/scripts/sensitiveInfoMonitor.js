/**
 * 敏感信息监控脚本
 * 用于定期检查代码中的敏感信息泄露
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

class SensitiveInfoMonitor {
    constructor() {
        this.sensitivePatterns = [
            // IP地址模式
            /\b(?:127\.0\.0\.1|localhost|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2[0-9]|3[01])\.\d+\.\d+)\b/g,
            // 私有域名
            /\b[a-zA-Z0-9.-]+\.(com|net|org|io|co)\b(?!\.(com|net|org|io|co))/g,
            // 邮箱地址
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            // API密钥模式
            /\b(?:api[_-]?key|apikey|secret|password|token)["'\s]*[:=]["'\s]*[A-Za-z0-9_-]{16,}\b/gi,
            // 数据库连接字符串
            /(?:mongodb|mysql|postgresql|postgres):\/\/[A-Za-z0-9._-]+:[A-Za-z0-9._-]+@[A-Za-z0-9.-]+/gi,
            // JWT令牌
            /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,
            // AWS密钥
            /\b(?:AKIA[A-Z0-9]{16}|ASIA[A-Z0-9]{16})\b/g,
            // 信用卡号
            /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11})\b/g
        ];

        this.placeholderPatterns = [
            /\[SERVER_HOST\]/g,
            /\[DB_HOST\]/g,
            /\[REDIS_HOST\]/g,
            /\[CLAMAV_HOST\]/g,
            /\[MONITORING_HOST\]/g,
            /\[NODE_EXPORTER_HOST\]/g,
            /\[ALERTMANAGER_HOST\]/g,
            /\[TRUSTED_IP_\d+\]/g,
            /\[SUSPICIOUS_IP_\d+\]/g,
            /\[TRUSTED_SOURCE\]/g
        ];

        this.ignorePatterns = [
            /node_modules/,
            /\.git/,
            /\.env/,
            /uploads/,
            /logs/,
            /dist/,
            /build/,
            /coverage/,
            /\.log$/,
            /\.tmp$/
        ];

        this.results = {
            sensitiveFindings: [],
            placeholderUsage: {},
            fileAnalysis: {},
            securityScore: 0,
            recommendations: []
        };
    }

    /**
     * 扫描指定目录
     */
    async scanDirectory(dirPath) {
        console.log(`🔍 开始扫描目录: ${dirPath}`);
        this.results = {
            sensitiveFindings: [],
            placeholderUsage: {},
            fileAnalysis: {},
            securityScore: 0,
            recommendations: []
        };

        await this.walkDirectory(dirPath);
        this.analyzeResults();
        return this.results;
    }

    /**
     * 递归遍历目录
     */
    async walkDirectory(dirPath) {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            // 检查是否应该忽略
            if (this.shouldIgnore(fullPath)) {
                continue;
            }
            
            if (stat.isDirectory()) {
                await this.walkDirectory(fullPath);
            } else if (stat.isFile() && this.isCodeFile(item)) {
                await this.analyzeFile(fullPath);
            }
        }
    }

    /**
     * 检查是否应该忽略该路径
     */
    shouldIgnore(filePath) {
        return this.ignorePatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * 判断是否为代码文件
     */
    isCodeFile(filename) {
        const codeExtensions = ['.js', '.json', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.cs'];
        return codeExtensions.some(ext => filename.endsWith(ext));
    }

    /**
     * 分析单个文件
     */
    async analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(process.cwd(), filePath);
            
            const fileResult = {
                path: relativePath,
                sensitiveMatches: [],
                placeholderMatches: [],
                riskLevel: 'low',
                lines: content.split('\n').length
            };

            // 检查敏感信息
            this.sensitivePatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    fileResult.sensitiveMatches.push({
                        pattern: this.getPatternName(index),
                        matches: matches.slice(0, 5), // 限制显示数量
                        count: matches.length
                    });
                }
            });

            // 检查占位符使用情况
            this.placeholderPatterns.forEach((pattern, index) => {
                const matches = content.match(pattern);
                if (matches) {
                    fileResult.placeholderMatches.push({
                        placeholder: this.getPlaceholderName(index),
                        count: matches.length
                    });
                    
                    // 统计占位符使用情况
                    const placeholderName = this.getPlaceholderName(index);
                    this.results.placeholderUsage[placeholderName] = 
                        (this.results.placeholderUsage[placeholderName] || 0) + matches.length;
                }
            });

            // 评估风险等级
            fileResult.riskLevel = this.assessRiskLevel(fileResult);
            
            this.results.fileAnalysis[relativePath] = fileResult;
            
            if (fileResult.sensitiveMatches.length > 0) {
                this.results.sensitiveFindings.push(fileResult);
            }

        } catch (error) {
            console.warn(`⚠️  无法读取文件 ${filePath}: ${error.message}`);
        }
    }

    /**
     * 获取模式名称
     */
    getPatternName(index) {
        const names = [
            'IP_ADDRESS', 'DOMAIN', 'EMAIL', 'API_KEY', 
            'DATABASE_CONNECTION', 'JWT_TOKEN', 'AWS_KEY', 'CREDIT_CARD'
        ];
        return names[index] || 'UNKNOWN';
    }

    /**
     * 获取占位符名称
     */
    getPlaceholderName(index) {
        const names = [
            'SERVER_HOST', 'DB_HOST', 'REDIS_HOST', 'CLAMAV_HOST',
            'MONITORING_HOST', 'NODE_EXPORTER_HOST', 'ALERTMANAGER_HOST',
            'TRUSTED_IP', 'SUSPICIOUS_IP', 'TRUSTED_SOURCE'
        ];
        return names[index] || 'UNKNOWN_PLACEHOLDER';
    }

    /**
     * 评估风险等级
     */
    assessRiskLevel(fileResult) {
        let riskScore = 0;
        
        fileResult.sensitiveMatches.forEach(match => {
            switch (match.pattern) {
                case 'API_KEY':
                case 'AWS_KEY':
                case 'DATABASE_CONNECTION':
                    riskScore += 10;
                    break;
                case 'IP_ADDRESS':
                case 'EMAIL':
                    riskScore += 5;
                    break;
                case 'DOMAIN':
                    riskScore += 3;
                    break;
                default:
                    riskScore += 2;
            }
        });

        if (riskScore >= 20) return 'high';
        if (riskScore >= 10) return 'medium';
        return 'low';
    }

    /**
     * 分析结果
     */
    analyzeResults() {
        const findings = this.results.sensitiveFindings;
        const totalFiles = Object.keys(this.results.fileAnalysis).length;
        
        // 计算安全评分
        let securityScore = 100;
        findings.forEach(finding => {
            switch (finding.riskLevel) {
                case 'high':
                    securityScore -= 15;
                    break;
                case 'medium':
                    securityScore -= 10;
                    break;
                case 'low':
                    securityScore -= 5;
                    break;
            }
        });
        
        this.results.securityScore = Math.max(0, securityScore);

        // 生成建议
        this.generateRecommendations(findings, totalFiles);
    }

    /**
     * 生成建议
     */
    generateRecommendations(findings, totalFiles) {
        const recommendations = [];

        if (findings.length > 0) {
            recommendations.push({
                type: 'immediate',
                priority: 'high',
                description: `发现 ${findings.length} 个文件包含敏感信息，需要立即处理`,
                action: '检查并替换所有敏感信息为占位符或环境变量'
            });
        }

        const highRiskFiles = findings.filter(f => f.riskLevel === 'high');
        if (highRiskFiles.length > 0) {
            recommendations.push({
                type: 'security',
                priority: 'critical',
                description: `发现 ${highRiskFiles.length} 个高风险文件包含API密钥或数据库连接信息`,
                action: '立即移除或加密所有高敏感信息，审查访问权限'
            });
        }

        // 检查占位符使用情况
        const placeholderUsage = this.results.placeholderUsage;
        if (Object.keys(placeholderUsage).length === 0) {
            recommendations.push({
                type: 'configuration',
                priority: 'medium',
                description: '未检测到占位符使用，建议实施统一的占位符策略',
                action: '使用标准占位符替换敏感信息，便于环境配置管理'
            });
        }

        recommendations.push({
            type: 'process',
            priority: 'medium',
            description: '建议建立定期安全扫描流程',
            action: '将敏感信息扫描集成到CI/CD流程，每周执行一次'
        });

        this.results.recommendations = recommendations;
    }

    /**
     * 生成报告
     */
    generateReport() {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            summary: {
                totalFiles: Object.keys(this.results.fileAnalysis).length,
                sensitiveFiles: this.results.sensitiveFindings.length,
                securityScore: this.results.securityScore,
                placeholderUsage: this.results.placeholderUsage
            },
            findings: this.results.sensitiveFindings,
            recommendations: this.results.recommendations
        };

        return report;
    }

    /**
     * 保存报告到文件
     */
    saveReport(outputPath = 'security-reports') {
        const report = this.generateReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `sensitive-info-scan-${timestamp}.json`;
        
        // 确保输出目录存在
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        
        const fullPath = path.join(outputPath, filename);
        fs.writeFileSync(fullPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 报告已保存到: ${fullPath}`);
        return fullPath;
    }
}

/**
 * 命令行接口
 */
async function main() {
    const monitor = new SensitiveInfoMonitor();
    
    try {
        console.log('🔒 启动敏感信息监控扫描...\n');
        
        // 扫描当前目录
        await monitor.scanDirectory(process.cwd());
        
        // 显示结果摘要
        const report = monitor.generateReport();
        
        console.log('\n📊 扫描结果摘要:');
        console.log(`📁 扫描文件数: ${report.summary.totalFiles}`);
        console.log(`⚠️  敏感文件数: ${report.summary.sensitiveFiles}`);
        console.log(`🔐 安全评分: ${report.summary.securityScore}/100`);
        
        console.log('\n📋 占位符使用情况:');
        Object.entries(report.summary.placeholderUsage).forEach(([key, value]) => {
            console.log(`  ${key}: ${value} 次`);
        });
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 安全建议:');
            report.recommendations.forEach(rec => {
                console.log(`  [${rec.priority.toUpperCase()}] ${rec.description}`);
                console.log(`    建议操作: ${rec.action}`);
            });
        }
        
        // 保存报告
        const reportPath = monitor.saveReport();
        console.log(`\n✅ 扫描完成，详细报告已保存`);
        
        // 如果有高风险发现，退出码非0
        const hasHighRisk = report.recommendations.some(r => r.priority === 'critical');
        process.exit(hasHighRisk ? 1 : 0);
        
    } catch (error) {
        console.error('❌ 扫描失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = SensitiveInfoMonitor;