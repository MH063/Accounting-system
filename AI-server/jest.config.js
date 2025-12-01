/**
 * Jest测试配置文件
 * 配置测试环境和基本设置
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  
  // 测试超时
  testTimeout: 10000,
  
  // 并行运行测试
  maxWorkers: '50%',
  
  // 显示测试结果
  verbose: true,
  
  // 清理Mocks
  clearMocks: true,
  
  // 重置Mocks
  resetMocks: true,
  
  // 重置模块注册表
  resetModules: false,
  
  // 恢复Mocks
  restoreMocks: true,
  
  // 收集覆盖率的文件
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/reports/**',
    '!**/dist/**',
    '!**/build/**',
    '!server.js',
    '!jest.config.*.js',
    '!**/scripts/**',
    '!**/test*/**'  // 排除测试相关的文件
  ],
  
  // 覆盖率目录
  coverageDirectory: 'coverage',
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'clover'
  ]
};