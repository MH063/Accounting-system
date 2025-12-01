/**
 * 生产环境配置验证器
 * 用于验证生产环境部署前的配置完整性
 */

const fs = require('fs');
const path = require('path');

class ProductionEnvValidator {
    constructor() {
        this.requiredEnvVars = [
            'NODE_ENV',
            'PORT',
            'SERVER_HOST',
            'DB_HOST',
            'DB_PORT',
            'DB_USER',
            'DB_PASSWORD',
            'DB_NAME',
            'JWT_SECRET',
            'REDIS_HOST',
            'REDIS_PORT'
        ];

        this.optionalEnvVars = [
            'REDIS_PASSWORD',
            'CLAMAV_HOST',
            'CLAMAV_PORT',
            'MONITORING_HOST',
            'NODE_EXPORTER_HOST',
            'ALERTMANAGER_HOST',
            'CORS_WHITELIST',
            'LOG_LEVEL',
            'LOG_FILE_PATH'
        ];

        this.placeholderFiles = [
            'config/database.js',
            'config/monitoring.js',
            'middleware/virusScanner.js',
            'security/tokenBlacklist.js',
            'utils/penetrationTesting.js',
            'middleware/security/zeroTrustAccessControl.js',
            'middleware/security/microsegmentation.js'
        ];

        this.validationResults = {
            envVars: {},
            placeholders: {},
            security: {},
            recommendations: []
        };
    }

    /**
     * 执行完整的生产环境验证
     */
    async validateAll() {
        console.log('🔍 开始生产环境配置验证...\n');

        // 1. 验证环境变量
        await this.validateEnvironmentVariables();

        // 2. 检查占位符
        await this.checkPlaceholders();

        // 3. 安全检查
        await this.performSecurityChecks();

        // 4. 生成报告
        return this.generateValidationReport();
    }

    /**
     * 验证环境变量
     */
    async validateEnvironmentVariables() {
        console.log('📋 验证环境变量配置...');
        
        this.requiredEnvVars.forEach(varName => {
            const value = process.env[varName];
            this.validationResults.envVars[varName] = {
                present: !!value,
                value: this.maskSensitiveValue(value),
                status: value ? '✅ 已配置' : '❌ 缺失'
            };
        });

        this.optionalEnvVars.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                this.validationResults.envVars[varName] = {
                    present: true,
                    value: this.maskSensitiveValue(value),
                    status: '✅ 已配置'
                };
            }
        });

        // 检查敏感信息强度
        this.checkCredentialStrength();
    }

    /**
     * 检查占位符
     */
    async checkPlaceholders() {
        console.log('\n🔍 检查占位符替换情况...');
        
        const placeholderPattern = /\[(SERVER_HOST|DB_HOST|REDIS_HOST|CLAMAV_HOST|MONITORING_HOST|NODE_EXPORTER_HOST|ALERTMANAGER_HOST|TRUSTED_IP_|SUSPICIOUS_IP_|TRUSTED_SOURCE)\]/g;
        
        for (const filePath of this.placeholderFiles) {
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
                this.validationResults.placeholders[filePath] = {
                    status: '⚠️  文件不存在',
                    placeholders: []
                };
                continue;
            }

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const matches = content.match(placeholderPattern) || [];
                const uniquePlaceholders = [...new Set(matches)];
                
                this.validationResults.placeholders[filePath] = {
                    status: uniquePlaceholders.length > 0 ? '⚠️  发现未替换占位符' : '✅ 无占位符',
                    placeholders: uniquePlaceholders,
                    count: uniquePlaceholders.length
                };
            } catch (error) {
                this.validationResults.placeholders[filePath] = {
                    status: '❌ 读取失败',
                    error: error.message
                };
            }
        }
    }

    /**
     * 执行安全检查
     */
    async performSecurityChecks() {
        console.log('\n🔒 执行安全检查...');

        // 检查JWT密钥
        const jwtSecret = process.env.JWT_SECRET;
        this.validationResults.security.jwtSecret = {
            present: !!jwtSecret,
            strong: jwtSecret && jwtSecret.length >= 32,
            status: this.getJwtSecretStatus(jwtSecret)
        };

        // 检查数据库密码
        const dbPassword = process.env.DB_PASSWORD;
        this.validationResults.security.dbPassword = {
            present: !!dbPassword,
            strong: this.isStrongPassword(dbPassword),
            status: this.getPasswordStrengthStatus(dbPassword)
        };

        // 检查CORS配置
        const corsWhitelist = process.env.CORS_WHITELIST;
        this.validationResults.security.corsConfig = {
            configured: !!corsWhitelist,
            domains: corsWhitelist ? corsWhitelist.split(',').length : 0,
            status: corsWhitelist ? '✅ 已配置' : '⚠️  使用默认配置'
        };

        // 检查日志配置
        this.validationResults.security.logConfig = {
            level: process.env.LOG_LEVEL || 'info',
            filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
            status: '✅ 基本配置'
        };
    }

    /**
     * 检查凭据强度
     */
    checkCredentialStrength() {
        const weakCredentials = [];

        // 检查默认JWT密钥
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && (jwtSecret.includes('default') || jwtSecret.length < 16)) {
            weakCredentials.push('JWT_SECRET 强度不足');
        }

        // 检查数据库密码
        const dbPassword = process.env.DB_PASSWORD;
        if (dbPassword && (dbPassword.length < 8 || dbPassword.includes('123') || dbPassword.includes('password'))) {
            weakCredentials.push('DB_PASSWORD 强度不足');
        }

        if (weakCredentials.length > 0) {
            this.validationResults.recommendations.push({
                type: 'security',
                priority: 'high',
                items: weakCredentials
            });
        }
    }

    /**
     * 获取JWT密钥状态
     */
    getJwtSecretStatus(jwtSecret) {
        if (!jwtSecret) return '❌ 未配置';
        if (jwtSecret.length < 16) return '⚠️  强度不足';
        if (jwtSecret.includes('default')) return '⚠️  使用默认值';
        return '✅ 配置良好';
    }

    /**
     * 检查密码强度
     */
    isStrongPassword(password) {
        if (!password) return false;
        return password.length >= 12 && 
               /[a-z]/.test(password) && 
               /[A-Z]/.test(password) && 
               /\d/.test(password) && 
               /[!@#$%^&*]/.test(password) &&
               !password.includes('password') &&
               !password.includes('123');
    }

    /**
     * 获取密码强度状态
     */
    getPasswordStrengthStatus(password) {
        if (!password) return '❌ 未配置';
        if (password.length < 8) return '❌ 长度过短';
        if (this.isStrongPassword(password)) return '✅ 强度良好';
        return '⚠️  强度一般';
    }

    /**
     * 生成验证报告
     */
    generateValidationReport() {
        console.log('\n📊 生成验证报告...');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalEnvVars: Object.keys(this.validationResults.envVars).length,
                missingRequired: this.countMissingRequired(),
                placeholdersRemaining: this.countRemainingPlaceholders(),
                securityScore: this.calculateSecurityScore()
            },
            details: this.validationResults,
            recommendations: this.generateFinalRecommendations()
        };

        // 显示摘要
        console.log('\n📈 验证摘要:');
        console.log(`🔧 环境变量: ${report.summary.totalEnvVars} 个已检查`);
        console.log(`❌ 缺失必需: ${report.summary.missingRequired} 个`);
        console.log(`🔍 剩余占位符: ${report.summary.placeholdersRemaining} 个`);
        console.log(`🔒 安全评分: ${report.summary.securityScore}/100`);

        // 显示关键问题
        if (report.summary.missingRequired > 0) {
            console.log('\n❌ 缺失的必需环境变量:');
            Object.entries(this.validationResults.envVars)
                .filter(([_, value]) => !value.present && this.requiredEnvVars.includes(key))
                .forEach(([key, _]) => console.log(`  - ${key}`));
        }

        if (report.summary.placeholdersRemaining > 0) {
            console.log('\n⚠️  包含未替换占位符的文件:');
            Object.entries(this.validationResults.placeholders)
                .filter(([_, value]) => value.count > 0)
                .forEach(([file, data]) => console.log(`  - ${file}: ${data.count} 个占位符`));
        }

        // 保存报告
        this.saveReport(report);
        
        return report;
    }

    /**
     * 统计缺失的必需环境变量
     */
    countMissingRequired() {
        return Object.entries(this.validationResults.envVars)
            .filter(([key, value]) => !value.present && this.requiredEnvVars.includes(key))
            .length;
    }

    /**
     * 统计剩余占位符
     */
    countRemainingPlaceholders() {
        return Object.values(this.validationResults.placeholders)
            .reduce((total, file) => total + (file.count || 0), 0);
    }

    /**
     * 计算安全评分
     */
    calculateSecurityScore() {
        let score = 100;

        // 缺失必需环境变量扣分
        const missingRequired = this.countMissingRequired();
        score -= missingRequired * 10;

        // 剩余占位符扣分
        const remainingPlaceholders = this.countRemainingPlaceholders();
        score -= remainingPlaceholders * 5;

        // 弱凭据扣分
        if (this.validationResults.security.jwtSecret?.strong === false) score -= 15;
        if (this.validationResults.security.dbPassword?.strong === false) score -= 15;

        return Math.max(0, score);
    }

    /**
     * 生成最终建议
     */
    generateFinalRecommendations() {
        const recommendations = [];

        // 环境变量建议
        const missingRequired = Object.entries(this.validationResults.envVars)
            .filter(([key, value]) => !value.present && this.requiredEnvVars.includes(key))
            .map(([key]) => key);

        if (missingRequired.length > 0) {
            recommendations.push({
                type: 'immediate',
                priority: 'critical',
                description: '必需环境变量未配置完整',
                action: `请配置以下环境变量: ${missingRequired.join(', ')}`
            });
        }

        // 占位符建议
        const filesWithPlaceholders = Object.entries(this.validationResults.placeholders)
            .filter(([_, value]) => value.count > 0);

        if (filesWithPlaceholders.length > 0) {
            recommendations.push({
                type: 'configuration',
                priority: 'high',
                description: '存在未替换的占位符',
                action: '请将占位符替换为实际的环境变量值或配置'
            });
        }

        // 安全建议
        if (this.validationResults.security.jwtSecret?.strong === false) {
            recommendations.push({
                type: 'security',
                priority: 'high',
                description: 'JWT密钥强度不足',
                action: '生成一个至少32位的强随机密钥作为JWT_SECRET'
            });
        }

        if (this.validationResults.security.dbPassword?.strong === false) {
            recommendations.push({
                type: 'security',
                priority: 'high',
                description: '数据库密码强度不足',
                action: '使用包含大小写字母、数字和特殊字符的强密码'
            });
        }

        return recommendations;
    }

    /**
     * 掩码敏感值
     */
    maskSensitiveValue(value) {
        if (!value) return '未设置';
        if (value.length <= 8) return '*'.repeat(value.length);
        return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }

    /**
     * 保存报告
     */
    saveReport(report) {
        const fs = require('fs');
        const path = require('path');
        
        const reportsDir = 'security-reports';
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `production-env-validation-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 详细报告已保存到: ${filepath}`);
    }
}

/**
 * 命令行接口
 */
async function main() {
    const validator = new ProductionEnvValidator();
    
    try {
        await validator.validateAll();
        
        const report = validator.generateValidationReport();
        const score = report.summary.securityScore;
        
        console.log('\n' + '='.repeat(50));
        if (score >= 80) {
            console.log('✅ 生产环境配置验证通过！');
            process.exit(0);
        } else if (score >= 60) {
            console.log('⚠️  生产环境配置需要改进！');
            process.exit(1);
        } else {
            console.log('❌ 生产环境配置验证失败！');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = ProductionEnvValidator;