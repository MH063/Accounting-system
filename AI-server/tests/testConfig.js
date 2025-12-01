/**
 * 测试配置文件
 * 统一管理测试环境配置和设置
 */

// 测试环境配置
const testConfig = {
  // 基础配置
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:4000',
  timeout: parseInt(process.env.TEST_TIMEOUT) || 10000,
  retries: parseInt(process.env.TEST_RETRIES) || 3,
  
  // 数据库测试配置
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT) || 5432,
    user: process.env.TEST_DB_USER || 'testuser',
    password: process.env.TEST_DB_PASSWORD || 'testpass',
    database: process.env.TEST_DB_NAME || 'testdb'
  },
  
  // JWT测试配置
  jwt: {
    secret: process.env.TEST_JWT_SECRET || 'test-secret-key-for-testing-purposes-only',
    expiresIn: process.env.TEST_JWT_EXPIRES_IN || '1h'
  },
  
  // 文件上传测试配置
  upload: {
    maxFileSize: parseInt(process.env.TEST_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    maxFiles: parseInt(process.env.TEST_MAX_FILES) || 10,
    allowedTypes: process.env.TEST_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png', 'application/pdf']
  },
  
  // 日志测试配置
  logging: {
    level: process.env.TEST_LOG_LEVEL || 'info',
    file: process.env.TEST_LOG_FILE || './test-logs/test.log'
  },
  
  // 安全测试配置
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.TEST_RATE_LIMIT_WINDOW) || 60000,
      max: parseInt(process.env.TEST_RATE_LIMIT_MAX) || 100
    }
  }
};

// 测试用户数据
const testUsers = {
  admin: {
    username: 'admin',
    email: 'admin@test.com',
    password: 'AdminPass123!',
    role: 'admin'
  },
  user: {
    username: 'testuser',
    email: 'user@test.com',
    password: 'UserPass123!',
    role: 'user'
  },
  guest: {
    username: 'guest',
    email: 'guest@test.com',
    password: 'GuestPass123!',
    role: 'guest'
  }
};

// 测试数据
const testData = {
  // 测试表名
  testTables: [
    'users',
    'user_profiles',
    'roles',
    'permissions'
  ],
  
  // 测试日志级别
  logLevels: [
    'info',
    'warn',
    'error',
    'debug',
    'audit',
    'security'
  ],
  
  // 测试API端点
  apiEndpoints: [
    '/',
    '/api/health',
    '/api/health/performance',
    '/api/db-test',
    '/api/db/health',
    '/api/logs',
    '/api/logs/stats',
    '/api/cache/stats',
    '/api/security/stats'
  ]
};

// 测试工具函数
const testUtils = {
  /**
   * 生成随机测试数据
   * @param {string} type - 数据类型
   * @param {Object} options - 选项
   * @returns {any} 生成的数据
   */
  generateTestData(type, options = {}) {
    switch (type) {
      case 'username':
        return `testuser_${Math.random().toString(36).substr(2, 9)}`;
      case 'email':
        return `test_${Math.random().toString(36).substr(2, 9)}@example.com`;
      case 'password':
        return 'TestPass123!';
      case 'filename':
        const extensions = ['.jpg', '.png', '.pdf', '.txt'];
        const ext = extensions[Math.floor(Math.random() * extensions.length)];
        return `testfile_${Date.now()}${ext}`;
      default:
        return null;
    }
  },
  
  /**
   * 等待指定时间
   * @param {number} ms - 毫秒数
   * @returns {Promise} Promise
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * 重试函数
   * @param {Function} fn - 要重试的函数
   * @param {Object} options - 重试选项
   * @returns {Promise} Promise
   */
  async retry(fn, options = {}) {
    const { times = 3, delay = 1000 } = options;
    
    for (let i = 0; i < times; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === times - 1) {
          throw error;
        }
        await this.sleep(delay * Math.pow(2, i)); // 指数退避
      }
    }
  }
};

module.exports = {
  testConfig,
  testUsers,
  testData,
  testUtils
};