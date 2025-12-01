/**
 * 安全配置检查工具
 * 验证系统的安全配置是否符合最佳实践
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * 检查环境变量配置
 * @returns {Object} 检查结果
 */
const checkEnvironmentVariables = () => {
  const checks = [
    { name: 'NODE_ENV', required: true, productionValue: 'production' },
    { name: 'JWT_SECRET', required: true, minLength: 32 },
    { name: 'DB_PASSWORD', required: true },
    { name: 'SESSION_SECRET', required: true, minLength: 32 },
    { name: 'LOG_LEVEL', required: false, allowedValues: ['error', 'warn', 'info', 'debug'] }
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const value = process.env[check.name];
    let status = 'PASS';
    let message = '';

    if (check.required && !value) {
      status = 'FAIL';
      message = `环境变量 ${check.name} 未设置`;
    } else if (value && check.minLength && value.length < check.minLength) {
      status = 'WARN';
      message = `环境变量 ${check.name} 长度不足（当前: ${value.length}, 最小: ${check.minLength}）`;
    } else if (value && check.allowedValues && !check.allowedValues.includes(value)) {
      status = 'WARN';
      message = `环境变量 ${check.name} 值不在允许范围内（当前: ${value}, 允许: ${check.allowedValues.join(', ')}）`;
    } else if (check.productionValue && process.env.NODE_ENV === 'production' && value !== check.productionValue) {
      status = 'WARN';
      message = `环境变量 ${check.name} 在生产环境中应该设置为 ${check.productionValue}（当前: ${value}）`;
    }

    if (status === 'PASS') {
      passed++;
    } else {
      failed++;
    }

    results.push({
      name: check.name,
      status,
      message,
      value: value ? (check.name.includes('SECRET') || check.name.includes('PASSWORD') ? '***HIDDEN***' : value) : null
    });
  }

  return {
    name: '环境变量检查',
    passed,
    failed,
    total: checks.length,
    details: results
  };
};

/**
 * 检查文件权限
 * @returns {Object} 检查结果
 */
const checkFilePermissions = () => {
  const filesToCheck = [
    { path: path.join(__dirname, '../config/jwt-keys.json'), shouldExist: false },
    { path: path.join(__dirname, '../.env'), shouldExist: false },
    { path: path.join(__dirname, '../logs'), shouldExist: true }
  ];

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const file of filesToCheck) {
    const exists = fs.existsSync(file.path);
    let status = 'PASS';
    let message = '';

    if (file.shouldExist && !exists) {
      status = 'FAIL';
      message = `文件应该存在但未找到: ${file.path}`;
    } else if (!file.shouldExist && exists) {
      status = 'WARN';
      message = `敏感文件存在，可能存在安全风险: ${file.path}`;
    }

    if (status === 'PASS') {
      passed++;
    } else {
      failed++;
    }

    results.push({
      path: file.path,
      exists,
      status,
      message
    });
  }

  return {
    name: '文件权限检查',
    passed,
    failed,
    total: filesToCheck.length,
    details: results
  };
};

/**
 * 检查依赖包安全性
 * @returns {Object} 检查结果
 */
const checkDependencies = () => {
  // 这里可以实现依赖包安全性检查
  // 例如检查已知的漏洞包版本
  
  return {
    name: '依赖包安全性检查',
    passed: 0,
    failed: 0,
    total: 0,
    details: [{
      status: 'INFO',
      message: '依赖包安全性检查功能待实现',
      recommendation: '建议定期运行 npm audit 检查依赖包安全性'
    }]
  };
};

/**
 * 运行所有安全检查
 * @returns {Array} 所有检查结果
 */
const runAllChecks = () => {
  logger.info('[SECURITY_CHECKER] 开始运行安全配置检查');
  
  const checks = [
    checkEnvironmentVariables(),
    checkFilePermissions(),
    checkDependencies()
  ];
  
  // 计算总体统计
  const totalPassed = checks.reduce((sum, check) => sum + check.passed, 0);
  const totalFailed = checks.reduce((sum, check) => sum + check.failed, 0);
  const totalCount = checks.reduce((sum, check) => sum + check.total, 0);
  
  const overall = {
    passed: totalPassed,
    failed: totalFailed,
    total: totalCount,
    percentage: totalCount > 0 ? Math.round((totalPassed / totalCount) * 100) : 100
  };
  
  logger.info('[SECURITY_CHECKER] 安全配置检查完成', overall);
  
  return {
    timestamp: new Date().toISOString(),
    overall,
    checks
  };
};

/**
 * 生成安全报告
 * @param {Array} checkResults - 检查结果
 * @returns {string} 报告内容
 */
const generateReport = (checkResults) => {
  let report = `=== 系统安全配置检查报告 ===\n`;
  report += `检查时间: ${checkResults.timestamp}\n\n`;
  
  report += `总体统计:\n`;
  report += `  通过: ${checkResults.overall.passed}/${checkResults.overall.total} (${checkResults.overall.percentage}%)\n`;
  report += `  失败: ${checkResults.overall.failed}\n\n`;
  
  for (const check of checkResults.checks) {
    report += `${check.name}:\n`;
    report += `  通过: ${check.passed}/${check.total}\n`;
    
    for (const detail of check.details) {
      if (detail.status !== 'PASS') {
        report += `  ${detail.status}: ${detail.message}\n`;
      }
    }
    
    report += `\n`;
  }
  
  return report;
};

module.exports = {
  checkEnvironmentVariables,
  checkFilePermissions,
  checkDependencies,
  runAllChecks,
  generateReport
};