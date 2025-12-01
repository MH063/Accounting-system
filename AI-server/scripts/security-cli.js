#!/usr/bin/env node

/**
 * 安全审计和渗透测试CLI工具
 * 提供命令行接口执行安全审计和渗透测试
 */

const path = require('path');
const { securityAuditor } = require('../utils/securityAudit');
const { penTester, scanScheduler } = require('../utils/penetrationTesting');
const logger = require('../config/logger');

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
安全审计和渗透测试CLI工具

用法:
  node security-cli.js <command> [options]

命令:
  audit          执行安全审计
  pentest        执行渗透测试
  schedule       启动计划任务
  report         查看最新报告
  help           显示此帮助信息

选项:
  --target-url   指定测试目标URL
  --report-dir   指定报告目录
  --verbose      详细输出模式

示例:
  node security-cli.js audit
  node security-cli.js pentest --target-url https://example.com
  node security-cli.js schedule
  node security-cli.js report
  `);
}

/**
 * 执行安全审计
 */
async function runAudit() {
  console.log('开始执行安全审计...');
  
  try {
    const results = await securityAuditor.performAudit();
    
    console.log('\n=== 安全审计结果 ===');
    console.log(`时间: ${results.timestamp}`);
    console.log(`耗时: ${results.duration}ms`);
    console.log(`通过: ${results.summary.passed}`);
    console.log(`警告: ${results.summary.warnings}`);
    console.log(`失败: ${results.summary.failed}`);
    
    if (results.summary.failed > 0) {
      console.log('\n发现严重问题:');
      for (const [checkName, checkResult] of Object.entries(results.checks)) {
        if (checkResult.status === 'FAIL') {
          console.log(`  - ${checkName}: ${checkResult.message}`);
        }
      }
    }
    
    console.log('\n审计完成。详细报告已保存到reports目录。');
  } catch (error) {
    console.error('审计执行失败:', error.message);
    process.exit(1);
  }
}

/**
 * 执行渗透测试
 */
async function runPenTest() {
  console.log('开始执行渗透测试...');
  
  try {
    const results = await penTester.runFullPenTest();
    
    console.log('\n=== 渗透测试结果 ===');
    console.log(`目标: ${results.target}`);
    console.log(`时间: ${results.timestamp}`);
    console.log(`耗时: ${results.duration}ms`);
    console.log(`总计漏洞: ${results.summary.vulnerabilities}`);
    console.log(`高危: ${results.summary.high}`);
    console.log(`中危: ${results.summary.medium}`);
    console.log(`低危: ${results.summary.low}`);
    
    console.log('\n发现的漏洞:');
    for (const [toolName, toolResult] of Object.entries(results.tools)) {
      if (toolResult.vulnerabilities && toolResult.vulnerabilities.length > 0) {
        console.log(`  ${toolName.toUpperCase()}:`);
        for (const vuln of toolResult.vulnerabilities) {
          console.log(`    [${vuln.severity}] ${vuln.name}`);
          console.log(`      描述: ${vuln.description}`);
        }
      }
    }
    
    console.log('\n渗透测试完成。详细报告已保存到penetration-reports目录。');
  } catch (error) {
    console.error('渗透测试执行失败:', error.message);
    process.exit(1);
  }
}

/**
 * 启动计划任务
 */
function startSchedule() {
  console.log('启动安全审计和渗透测试计划任务...');
  console.log('按Ctrl+C退出');
  
  // 保持进程运行
  setInterval(() => {
    // 空循环保持进程活跃
  }, 60000);
  
  process.on('SIGINT', () => {
    console.log('\n正在停止计划任务...');
    process.exit(0);
  });
}

/**
 * 查看最新报告
 */
function viewReport() {
  console.log('查看最新安全报告...');
  
  try {
    // 查看最新的安全审计报告
    const auditReport = securityAuditor.getLatestAuditReport();
    if (auditReport) {
      console.log('\n=== 最新安全审计报告 ===');
      console.log(`时间: ${auditReport.timestamp}`);
      console.log(`通过: ${auditReport.summary.passed}`);
      console.log(`警告: ${auditReport.summary.warnings}`);
      console.log(`失败: ${auditReport.summary.failed}`);
    } else {
      console.log('未找到安全审计报告');
    }
    
    // 查看最新的渗透测试报告
    const penTestReport = penTester.getLatestPenTestReport();
    if (penTestReport) {
      console.log('\n=== 最新渗透测试报告 ===');
      console.log(`目标: ${penTestReport.target}`);
      console.log(`时间: ${penTestReport.timestamp}`);
      console.log(`总计漏洞: ${penTestReport.summary.vulnerabilities}`);
      console.log(`高危: ${penTestReport.summary.high}`);
      console.log(`中危: ${penTestReport.summary.medium}`);
      console.log(`低危: ${penTestReport.summary.low}`);
    } else {
      console.log('未找到渗透测试报告');
    }
  } catch (error) {
    console.error('查看报告失败:', error.message);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  switch (command) {
    case 'audit':
      await runAudit();
      break;
      
    case 'pentest':
      await runPenTest();
      break;
      
    case 'schedule':
      startSchedule();
      break;
      
    case 'report':
      viewReport();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      if (!command) {
        console.log('错误: 请指定命令');
      } else {
        console.log(`错误: 未知命令 '${command}'`);
      }
      showHelp();
      process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('程序执行出错:', error);
    process.exit(1);
  });
}

module.exports = {
  runAudit,
  runPenTest,
  startSchedule,
  viewReport
};