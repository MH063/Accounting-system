#!/usr/bin/env node

/**
 * 测试运行脚本
 * 简化测试执行流程
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// 支持的测试类型
const TEST_TYPES = {
  all: '运行所有测试',
  unit: '运行单元测试',
  integration: '运行集成测试',
  api: '运行API测试',
  coverage: '运行测试并生成覆盖率报告'
};

// 默认配置
const DEFAULT_CONFIG = {
  testType: 'all',
  watch: false,
  verbose: false,
  coverage: false,
  outputFile: null
};

/**
 * 解析命令行参数
 * @returns {Object} 配置对象
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
      case '-t':
        config.testType = args[++i] || 'all';
        break;
      case '--watch':
      case '-w':
        config.watch = true;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--coverage':
      case '-c':
        config.coverage = true;
        break;
      case '--output':
      case '-o':
        config.outputFile = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`未知参数: ${arg}`);
        }
        break;
    }
  }
  
  return config;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
测试运行脚本

用法: node scripts/run-tests.js [选项]

选项:
  -t, --type <type>     测试类型: all, unit, integration, api, coverage
  -w, --watch          监听模式运行测试
  -v, --verbose        详细输出
  -c, --coverage       生成覆盖率报告
  -o, --output <file>  输出文件路径
  -h, --help           显示帮助信息

测试类型说明:
${Object.entries(TEST_TYPES).map(([key, desc]) => `  ${key}: ${desc}`).join('\n')}

环境变量:
  TEST_BASE_URL        测试基础URL (默认: http://localhost:4000)
  TEST_TIMEOUT         测试超时时间 (默认: 10000ms)
  TEST_RETRIES         测试重试次数 (默认: 3)

示例:
  node scripts/run-tests.js --type unit
  node scripts/run-tests.js --watch --verbose
  node scripts/run-tests.js --coverage --output ./reports/coverage
`);
}

/**
 * 运行测试
 * @param {Object} config - 配置对象
 */
async function runTests(config) {
  console.log('🧪 开始运行测试...');
  console.log(`测试类型: ${config.testType}`);
  console.log(`监听模式: ${config.watch ? '是' : '否'}`);
  console.log(`详细输出: ${config.verbose ? '是' : '否'}`);
  console.log(`覆盖率报告: ${config.coverage ? '是' : '否'}`);
  
  // 确保报告目录存在
  if (config.outputFile) {
    try {
      await fs.mkdir(path.dirname(config.outputFile), { recursive: true });
    } catch (error) {
      // 目录可能已经存在
    }
  }
  
  // 构建命令参数
  const cmdArgs = buildCommandArgs(config);
  
  console.log(`\n执行命令: npm test ${cmdArgs.join(' ')}\n`);
  
  // 运行测试
  const testProcess = spawn('npm', ['test', ...cmdArgs], {
    stdio: 'inherit',
    shell: true
  });
  
  // 处理进程事件
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ 测试运行完成');
      if (config.coverage) {
        console.log('📄 覆盖率报告已生成');
      }
    } else {
      console.log('\n❌ 测试运行失败');
      process.exit(code);
    }
  });
  
  testProcess.on('error', (error) => {
    console.error('❌ 启动测试时出错:', error.message);
    process.exit(1);
  });
}

/**
 * 构建命令参数
 * @param {Object} config - 配置对象
 * @returns {Array} 参数数组
 */
function buildCommandArgs(config) {
  const args = [];
  
  // 根据测试类型添加参数
  switch (config.testType) {
    case 'unit':
      args.push('--testPathPattern=unit');
      break;
    case 'integration':
      args.push('--testPathPattern=integration');
      break;
    case 'api':
      args.push('--testPathPattern=api');
      break;
    case 'coverage':
      args.push('--coverage');
      config.coverage = true;
      break;
  }
  
  // 添加其他选项
  if (config.watch) {
    args.push('--watch');
  }
  
  if (config.verbose) {
    args.push('--verbose');
  }
  
  if (config.coverage) {
    args.push('--coverage');
  }
  
  return args;
}

/**
 * 主函数
 */
async function main() {
  try {
    const config = parseArguments();
    await runTests(config);
  } catch (error) {
    console.error('❌ 运行测试时出错:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  parseArguments,
  runTests,
  buildCommandArgs
};