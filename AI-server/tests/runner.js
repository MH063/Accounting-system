#!/usr/bin/env node

/**
 * 测试运行器
 * 统一运行所有测试套件
 */

const { spawn } = require('child_process');
const path = require('path');
const { generateConsoleReport, generateHtmlReport } = require('./reportGenerator');

// 测试套件配置
const testSuites = [
  {
    name: 'API端点响应格式测试',
    file: './apiEndpoints.test.js',
    description: '测试所有API端点的响应格式一致性'
  },
  {
    name: '配置管理测试',
    file: './configManager.test.js',
    description: '测试配置管理功能'
  },
  {
    name: '配置验证测试',
    file: './configValidator.test.js',
    description: '测试配置验证功能'
  },
  {
    name: '敏感数据过滤测试',
    file: './sensitiveDataFilter.test.js',
    description: '测试敏感数据过滤功能'
  },
  {
    name: '认证中间件测试',
    file: './unit/auth.test.js',
    description: '测试认证中间件功能'
  },
  {
    name: '数据库测试',
    file: './unit/database.test.js',
    description: '测试数据库连接和查询功能'
  },
  {
    name: '文件上传测试',
    file: './unit/fileUpload.test.js',
    description: '测试文件上传功能'
  },
  {
    name: '日志管理测试',
    file: './unit/logManagement.test.js',
    description: '测试日志管理功能'
  },
  {
    name: '中间件测试',
    file: './unit/middleware.test.js',
    description: '测试通用中间件功能'
  },
  {
    name: 'API集成测试',
    file: './integration/api.test.js',
    description: '测试API集成功能'
  }
];

/**
 * 运行单个测试套件
 * @param {Object} suite - 测试套件配置
 * @returns {Promise} 测试结果Promise
 */
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n🧪 开始运行: ${suite.name}`);
    console.log(`📝 描述: ${suite.description}`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    
    // 使用Node.js直接运行测试文件
    const testProcess = spawn('node', [suite.file], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const status = code === 0 ? '✅ 通过' : '❌ 失败';
      
      console.log('─'.repeat(50));
      console.log(`${status} ${suite.name} (耗时: ${duration}ms)`);
      console.log('');
      
      resolve({
        name: suite.name,
        file: suite.file,
        passed: code === 0,
        duration: duration,
        exitCode: code
      });
    });
    
    testProcess.on('error', (error) => {
      console.error(`❌ 启动测试套件时出错: ${error.message}`);
      resolve({
        name: suite.name,
        file: suite.file,
        passed: false,
        duration: Date.now() - startTime,
        error: error.message
      });
    });
  });
}

/**
 * 运行所有测试套件
 */
async function runAllTestSuites() {
  console.log('🚀 开始运行所有测试套件');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const results = [];
  
  // 依次运行每个测试套件
  for (const suite of testSuites) {
    try {
      const result = await runTestSuite(suite);
      results.push(result);
    } catch (error) {
      console.error(`❌ 运行测试套件时出错: ${error.message}`);
      results.push({
        name: suite.name,
        file: suite.file,
        passed: false,
        duration: 0,
        error: error.message
      });
    }
  }
  
  // 生成控制台报告
  generateConsoleReport(results);
  
  // 生成HTML报告
  try {
    await generateHtmlReport(results, {
      title: 'API服务器测试报告',
      outputPath: './reports/test-report.html'
    });
    console.log('📄 HTML测试报告已生成: ./reports/test-report.html');
  } catch (error) {
    console.error('❌ 生成HTML报告时出错:', error.message);
  }
  
  // 如果有任何测试失败，返回非零退出码
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  if (passedCount !== totalCount) {
    console.log('⚠️  部分测试失败，请检查上述结果');
    process.exit(1);
  } else {
    console.log('🎉 所有测试通过！');
    process.exit(0);
  }
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  runAllTestSuites().catch(error => {
    console.error('❌ 测试运行器出错:', error);
    process.exit(1);
  });
}

module.exports = {
  runTestSuite,
  runAllTestSuites
};