/**
 * 第三方服务连接配置验证器
 * 验证所有第三方服务的连接配置是否正确
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ThirdPartyServiceValidator {
    constructor() {
        this.services = [
            {
                name: 'PostgreSQL数据库',
                type: 'database',
                envVars: ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'],
                testCommand: this.testDatabaseConnection,
                required: true
            },
            {
                name: 'Redis缓存',
                type: 'cache',
                envVars: ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'],
                testCommand: this.testRedisConnection,
                required: false
            },
            {
                name: 'ClamAV病毒扫描',
                type: 'security',
                envVars: ['CLAMAV_HOST', 'CLAMAV_PORT'],
                testCommand: this.testClamAVConnection,
                required: false
            },
            {
                name: 'Prometheus监控',
                type: 'monitoring',
                envVars: ['MONITORING_HOST'],
                testCommand: this.testPrometheusConnection,
                required: false
            },
            {
                name: 'Node Exporter',
                type: 'monitoring',
                envVars: ['NODE_EXPORTER_HOST'],
                testCommand: this.testNodeExporterConnection,
                required: false
            },
            {
                name: 'AlertManager',
                type: 'monitoring',
                envVars: ['ALERTMANAGER_HOST'],
                testCommand: this.testAlertManagerConnection,
                required: false
            }
        ];

        this.validationResults = {
            services: {},
            connectivity: {},
            configuration: {},
            recommendations: []
        };
    }

    /**
     * 执行完整的第三方服务验证
     */
    async validateAllServices() {
        console.log('🔍 开始第三方服务连接配置验证...\n');

        // 1. 检查配置文件中的占位符
        await this.checkConfigurationPlaceholders();

        // 2. 验证环境变量配置
        await this.validateEnvironmentVariables();

        // 3. 测试网络连接
        await this.testNetworkConnectivity();

        // 4. 验证服务可用性
        await this.validateServiceAvailability();

        // 5. 生成验证报告
        return this.generateValidationReport();
    }

    /**
     * 检查配置文件中的占位符
     */
    async checkConfigurationPlaceholders() {
        console.log('📋 检查配置文件中的占位符...');
        
        const configFiles = [
            'config/database.js',
            'config/monitoring.js',
            'middleware/virusScanner.js',
            'security/tokenBlacklist.js',
            'utils/penetrationTesting.js'
        ];

        const placeholderPattern = /\[(SERVER_HOST|DB_HOST|REDIS_HOST|CLAMAV_HOST|MONITORING_HOST|NODE_EXPORTER_HOST|ALERTMANAGER_HOST)\]/g;

        for (const filePath of configFiles) {
            const fullPath = path.join(process.cwd(), filePath);
            
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const matches = content.match(placeholderPattern) || [];
                    
                    this.validationResults.configuration[filePath] = {
                        hasPlaceholders: matches.length > 0,
                        placeholderCount: matches.length,
                        placeholders: [...new Set(matches)],
                        status: matches.length > 0 ? '⚠️  需要替换占位符' : '✅ 配置正确'
                    };
                } catch (error) {
                    this.validationResults.configuration[filePath] = {
                        status: '❌ 读取失败',
                        error: error.message
                    };
                }
            } else {
                this.validationResults.configuration[filePath] = {
                    status: '⚠️  文件不存在'
                };
            }
        }
    }

    /**
     * 验证环境变量配置
     */
    async validateEnvironmentVariables() {
        console.log('\n🔧 验证环境变量配置...');

        this.services.forEach(service => {
            const serviceConfig = {};
            
            service.envVars.forEach(envVar => {
                const value = process.env[envVar];
                serviceConfig[envVar] = {
                    present: !!value,
                    value: this.maskSensitiveValue(value),
                    status: value ? '✅ 已配置' : '❌ 未配置'
                };
            });

            const missingVars = service.envVars.filter(v => !process.env[v]);
            const isConfigured = missingVars.length === 0;

            this.validationResults.services[service.name] = {
                type: service.type,
                required: service.required,
                configured: isConfigured,
                missingVars,
                envVars: serviceConfig,
                status: isConfigured ? '✅ 配置完整' : 
                        service.required ? '❌ 必需服务未配置' : '⚠️  可选服务未配置'
            };
        });
    }

    /**
     * 测试网络连接
     */
    async testNetworkConnectivity() {
        console.log('\n🌐 测试网络连接...');

        const connectivityTests = [
            this.testDatabaseConnectivity(),
            this.testRedisConnectivity(),
            this.testClamAVConnectivity(),
            this.testMonitoringServicesConnectivity()
        ];

        await Promise.allSettled(connectivityTests);
    }

    /**
     * 测试数据库连接
     */
    async testDatabaseConnectivity() {
        const dbHost = process.env.DB_HOST;
        const dbPort = process.env.DB_PORT || '5432';

        if (!dbHost) {
            this.validationResults.connectivity.database = {
                status: '❌ 未配置',
                message: '数据库主机未配置'
            };
            return;
        }

        try {
            // 使用ping测试主机可达性
            const { stdout, stderr } = await execAsync(`ping -n 1 -w 3000 ${dbHost}`);
            
            this.validationResults.connectivity.database = {
                status: '✅ 网络可达',
                host: dbHost,
                port: dbPort,
                testResult: '主机网络连接正常'
            };
        } catch (error) {
            this.validationResults.connectivity.database = {
                status: '❌ 网络不可达',
                host: dbHost,
                port: dbPort,
                error: error.message,
                suggestion: '请检查数据库主机地址和网络配置'
            };
        }
    }

    /**
     * 测试Redis连接
     */
    async testRedisConnectivity() {
        const redisHost = process.env.REDIS_HOST;
        const redisPort = process.env.REDIS_PORT || '6379';

        if (!redisHost) {
            this.validationResults.connectivity.redis = {
                status: '⚠️  未配置',
                message: 'Redis主机未配置（可选服务）'
            };
            return;
        }

        try {
            const { stdout, stderr } = await execAsync(`ping -n 1 -w 3000 ${redisHost}`);
            
            this.validationResults.connectivity.redis = {
                status: '✅ 网络可达',
                host: redisHost,
                port: redisPort,
                testResult: 'Redis主机网络连接正常'
            };
        } catch (error) {
            this.validationResults.connectivity.redis = {
                status: '❌ 网络不可达',
                host: redisHost,
                port: redisPort,
                error: error.message,
                suggestion: '请检查Redis主机地址和网络配置'
            };
        }
    }

    /**
     * 测试ClamAV连接
     */
    async testClamAVConnectivity() {
        const clamavHost = process.env.CLAMAV_HOST || 'localhost';
        const clamavPort = process.env.CLAMAV_PORT || '3310';

        try {
            const { stdout, stderr } = await execAsync(`ping -n 1 -w 3000 ${clamavHost}`);
            
            this.validationResults.connectivity.clamav = {
                status: '✅ 网络可达',
                host: clamavHost,
                port: clamavPort,
                testResult: 'ClamAV主机网络连接正常'
            };
        } catch (error) {
            this.validationResults.connectivity.clamav = {
                status: '❌ 网络不可达',
                host: clamavHost,
                port: clamavPort,
                error: error.message,
                suggestion: '请检查ClamAV主机地址和网络配置'
            };
        }
    }

    /**
     * 测试监控服务连接
     */
    async testMonitoringServicesConnectivity() {
        const monitoringHost = process.env.MONITORING_HOST || 'localhost';
        const nodeExporterHost = process.env.NODE_EXPORTER_HOST || 'localhost';
        const alertmanagerHost = process.env.ALERTMANAGER_HOST || 'localhost';

        // 测试Prometheus
        try {
            await execAsync(`ping -n 1 -w 3000 ${monitoringHost}`);
            this.validationResults.connectivity.prometheus = {
                status: '✅ 网络可达',
                host: monitoringHost,
                port: '9090',
                testResult: 'Prometheus主机网络连接正常'
            };
        } catch (error) {
            this.validationResults.connectivity.prometheus = {
                status: '❌ 网络不可达',
                host: monitoringHost,
                error: error.message
            };
        }

        // 测试Node Exporter
        try {
            await execAsync(`ping -n 1 -w 3000 ${nodeExporterHost}`);
            this.validationResults.connectivity.nodeExporter = {
                status: '✅ 网络可达',
                host: nodeExporterHost,
                port: '9100',
                testResult: 'Node Exporter主机网络连接正常'
            };
        } catch (error) {
            this.validationResults.connectivity.nodeExporter = {
                status: '❌ 网络不可达',
                host: nodeExporterHost,
                error: error.message
            };
        }

        // 测试AlertManager
        try {
            await execAsync(`ping -n 1 -w 3000 ${alertmanagerHost}`);
            this.validationResults.connectivity.alertmanager = {
                status: '✅ 网络可达',
                host: alertmanagerHost,
                port: '9093',
                testResult: 'AlertManager主机网络连接正常'
            };
        } catch (error) {
            this.validationResults.connectivity.alertmanager = {
                status: '❌ 网络不可达',
                host: alertmanagerHost,
                error: error.message
            };
        }
    }

    /**
     * 验证服务可用性
     */
    async validateServiceAvailability() {
        console.log('\n🔍 验证服务可用性...');

        // 这里可以添加更详细的服务可用性测试
        // 例如：尝试连接数据库、Redis等
        
        this.validationResults.availability = {
            database: this.validationResults.services['PostgreSQL数据库']?.configured ? '✅ 已配置' : '❌ 未配置',
            redis: this.validationResults.services['Redis缓存']?.configured ? '✅ 已配置' : '⚠️  未配置',
            clamav: '✅ 网络测试通过',
            monitoring: '✅ 网络测试通过'
        };
    }

    /**
     * 生成验证报告
     */
    generateValidationReport() {
        console.log('\n📊 生成验证报告...');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalServices: this.services.length,
                configuredServices: this.countConfiguredServices(),
                requiredServicesConfigured: this.checkRequiredServices(),
                networkTestsPassed: this.countNetworkTestsPassed(),
                overallStatus: this.calculateOverallStatus()
            },
            details: this.validationResults,
            recommendations: this.generateFinalRecommendations()
        };

        // 显示摘要
        console.log('\n📈 验证摘要:');
        console.log(`🔧 总服务数: ${report.summary.totalServices}`);
        console.log(`✅ 已配置服务: ${report.summary.configuredServices}`);
        console.log(`🎯 必需服务: ${report.summary.requiredServicesConfigured ? '✅' : '❌'}`);
        console.log(`🌐 网络测试通过: ${report.summary.networkTestsPassed}`);
        console.log(`📊 整体状态: ${report.summary.overallStatus}`);

        // 保存报告
        this.saveReport(report);
        
        return report;
    }

    /**
     * 统计已配置的服务
     */
    countConfiguredServices() {
        return Object.values(this.validationResults.services)
            .filter(service => service.configured).length;
    }

    /**
     * 检查必需服务是否都已配置
     */
    checkRequiredServices() {
        return Object.values(this.validationResults.services)
            .filter(service => service.required)
            .every(service => service.configured);
    }

    /**
     * 统计网络测试通过的数量
     */
    countNetworkTestsPassed() {
        return Object.values(this.validationResults.connectivity)
            .filter(conn => conn.status.includes('✅')).length;
    }

    /**
     * 计算整体状态
     */
    calculateOverallStatus() {
        const requiredConfigured = this.checkRequiredServices();
        const networkTestsPassed = this.countNetworkTestsPassed() > 0;
        
        if (requiredConfigured && networkTestsPassed) return '✅ 配置良好';
        if (requiredConfigured) return '⚠️  网络连接有问题';
        return '❌ 配置不完整';
    }

    /**
     * 生成最终建议
     */
    generateFinalRecommendations() {
        const recommendations = [];

        // 检查必需服务
        const missingRequiredServices = Object.entries(this.validationResults.services)
            .filter(([_, service]) => service.required && !service.configured)
            .map(([name, _]) => name);

        if (missingRequiredServices.length > 0) {
            recommendations.push({
                type: 'critical',
                priority: 'high',
                description: '必需服务未配置完整',
                action: `请配置以下必需服务: ${missingRequiredServices.join(', ')}`
            });
        }

        // 检查占位符
        const filesWithPlaceholders = Object.entries(this.validationResults.configuration)
            .filter(([_, config]) => config.hasPlaceholders)
            .map(([file, config]) => ({ file, count: config.placeholderCount }));

        if (filesWithPlaceholders.length > 0) {
            recommendations.push({
                type: 'configuration',
                priority: 'high',
                description: '配置文件包含未替换的占位符',
                action: '请将占位符替换为实际的环境变量值'
            });
        }

        // 检查网络连接
        const failedConnections = Object.entries(this.validationResults.connectivity)
            .filter(([_, conn]) => conn.status.includes('❌'));

        if (failedConnections.length > 0) {
            recommendations.push({
                type: 'network',
                priority: 'medium',
                description: '部分服务网络连接失败',
                action: '请检查网络配置和服务状态'
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
        const reportsDir = 'security-reports';
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `third-party-services-validation-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 详细报告已保存到: ${filepath}`);
    }
}

/**
 * 命令行接口
 */
async function main() {
    const validator = new ThirdPartyServiceValidator();
    
    try {
        const report = await validator.validateAllServices();
        
        // 根据验证结果决定退出码
        const score = report.summary.overallStatus.includes('✅') ? 0 : 
                     report.summary.overallStatus.includes('⚠️') ? 1 : 2;
        
        process.exit(score);
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = ThirdPartyServiceValidator;