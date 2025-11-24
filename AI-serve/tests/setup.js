// 测试环境设置文件
const fs = require('fs');
const path = require('path');

// 确保测试目录存在
const testDirs = [
  'tests/unit',
  'tests/integration', 
  'tests/api',
  'coverage'
];

testDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '4001'; // 使用不同端口避免冲突
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'ai_serve_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.UPLOAD_DIR = './uploads';

// 模拟数据库连接池
jest.mock('../config/database', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn(),
    end: jest.fn()
  },
  healthCheck: jest.fn(() => Promise.resolve(true)),
  testConnection: jest.fn(() => Promise.resolve({ connected: true })),
  getTables: jest.fn(() => Promise.resolve(['users', 'files', 'logs'])),
  getDatabases: jest.fn(() => Promise.resolve(['ai_serve_test']))
}));

// 模拟文件系统操作
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn((path) => {
    // 对于测试，返回假值除非是特定文件
    if (path.includes('tests/') || path.includes('coverage/')) {
      return true;
    }
    return false;
  }),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// 模拟 winston 日志器
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(), 
  error: jest.fn(),
  debug: jest.fn()
}));

beforeAll(() => {
  console.log('🚀 启动测试环境...');
});

afterAll(() => {
  console.log('🧹 清理测试环境...');
});

beforeEach(() => {
  // 重置所有 mocks
  jest.clearAllMocks();
});

// 全局测试超时设置
jest.setTimeout(30000);