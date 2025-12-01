#!/usr/bin/env node

/**
 * 安全检查CLI工具
 * 运行系统安全配置检查并输出报告
 */

const { runAllChecks, generateReport } = require('../utils/securityChecker');
const fs = require('fs');
const path = require('path');

// 设置日志级别为警告及以上，减少输出
process.env.LOG_LEVEL = 'warn';

console.log('开始运行安全配置检查...\n');

try {
  // 运行所有检查
  const results = runAllChecks();
  
  // 生成报告
  const report = generateReport(results);
  
  // 输出到控制台
  console.log(report);
  
  // 保存到文件
  const reportDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportFile = path.join(reportDir, `security-check-${new Date().toISOString().split('T')[0]}.txt`);
  fs.writeFileSync(reportFile, report);
  
  console.log(`详细报告已保存到: ${reportFile}\n`);
  
  // 检查是否有失败项
  if (results.overall.failed > 0) {
    console.log('⚠️  发现安全配置问题，请检查报告中的警告和错误项。\n');
    process.exit(1);
  } else {
    console.log('✅ 所有安全配置检查通过。\n');
    process.exit(0);
  }
} catch (error) {
  console.error('安全检查过程中发生错误:', error.message);
  process.exit(1);
}