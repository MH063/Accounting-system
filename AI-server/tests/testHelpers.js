/**
 * 测试助手函数
 * 提供常用的测试工具和辅助函数
 */

const supertest = require('supertest');
const { testConfig, testUsers } = require('./testConfig');

/**
 * 创建测试客户端
 * @param {Object} app - Express应用实例
 * @returns {Object} Supertest客户端
 */
function createTestClient(app) {
  return supertest(app);
}

/**
 * 生成认证令牌
 * @param {Object} user - 用户信息
 * @returns {string} JWT令牌
 */
function generateAuthToken(user) {
  // 在实际测试中，这应该调用真实的认证函数
  // 这里只是一个示例实现
  return `Bearer mock-token-for-${user.username}`;
}

/**
 * 创建认证请求
 * @param {Object} client - 测试客户端
 * @param {string} method - HTTP方法
 * @param {string} url - URL
 * @param {Object} user - 用户信息
 * @returns {Object} 请求对象
 */
function createAuthRequest(client, method, url, user) {
  const token = generateAuthToken(user);
  return client[method](url).set('Authorization', token);
}

/**
 * 清理测试数据
 * @param {Array} cleanupFunctions - 清理函数数组
 * @returns {Promise} Promise
 */
async function cleanupTestResources(cleanupFunctions = []) {
  const errors = [];
  
  for (const cleanupFn of cleanupFunctions) {
    try {
      await cleanupFn();
    } catch (error) {
      errors.push(error);
    }
  }
  
  if (errors.length > 0) {
    console.warn('清理测试资源时出现错误:', errors);
  }
}

/**
 * 等待异步操作完成
 * @param {Function} condition - 条件函数
 * @param {Object} options - 选项
 * @returns {Promise} Promise
 */
async function waitForCondition(condition, options = {}) {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('等待条件超时');
}

/**
 * 验证API响应格式
 * @param {Object} response - 响应对象
 * @param {Object} expected - 期望的响应结构
 */
function validateApiResponse(response, expected = {}) {
  const { status, success, message, data } = expected;
  
  // 验证状态码
  if (status !== undefined) {
    expect(response.status).toBe(status);
  }
  
  // 验证响应体结构
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('timestamp');
  
  // 验证成功状态
  if (success !== undefined) {
    expect(response.body.success).toBe(success);
  }
  
  // 验证消息
  if (message !== undefined) {
    expect(response.body).toHaveProperty('message');
    if (typeof message === 'string') {
      expect(response.body.message).toBe(message);
    }
  }
  
  // 验证数据
  if (data !== undefined) {
    if (data === null) {
      expect(response.body).not.toHaveProperty('data');
    } else {
      expect(response.body).toHaveProperty('data');
      if (typeof data === 'object') {
        expect(response.body.data).toMatchObject(data);
      }
    }
  }
}

/**
 * 创建测试数据库连接
 * @returns {Object} 数据库连接对象
 */
function createTestDatabaseConnection() {
  // 这里应该实现真实的数据库连接逻辑
  // 示例实现：
  return {
    query: jest.fn(),
    close: jest.fn()
  };
}

/**
 * 模拟文件系统操作
 * @param {Object} mockFiles - 模拟的文件列表
 * @returns {Object} 模拟的文件系统对象
 */
function mockFileSystem(mockFiles = {}) {
  const fs = require('fs');
  
  // 重置所有mock
  jest.resetAllMocks();
  
  // 设置文件存在性
  fs.existsSync = jest.fn((filePath) => {
    return mockFiles.hasOwnProperty(filePath);
  });
  
  // 设置文件内容
  fs.readFileSync = jest.fn((filePath, encoding = 'utf8') => {
    if (mockFiles.hasOwnProperty(filePath)) {
      return mockFiles[filePath];
    }
    throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
  });
  
  // 设置文件写入
  fs.writeFileSync = jest.fn((filePath, data) => {
    mockFiles[filePath] = data;
  });
  
  return mockFiles;
}

/**
 * 创建测试环境
 * @param {Object} overrides - 配置覆盖
 * @returns {Object} 测试环境对象
 */
function createTestEnvironment(overrides = {}) {
  const env = { ...process.env };
  
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_USER = 'testuser';
  process.env.DB_NAME = 'testdb';
  
  // 应用覆盖
  Object.keys(overrides).forEach(key => {
    process.env[key] = overrides[key];
  });
  
  return {
    originalEnv: env,
    restore: () => {
      Object.keys(process.env).forEach(key => {
        if (env.hasOwnProperty(key)) {
          process.env[key] = env[key];
        } else {
          delete process.env[key];
        }
      });
    }
  };
}

/**
 * 测试数据生成器
 */
const testDataGenerator = {
  /**
   * 生成随机字符串
   * @param {number} length - 长度
   * @returns {string} 随机字符串
   */
  randomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  },
  
  /**
   * 生成随机邮箱
   * @returns {string} 随机邮箱
   */
  randomEmail() {
    return `${this.randomString(8)}@test.com`;
  },
  
  /**
   * 生成随机用户名
   * @returns {string} 随机用户名
   */
  randomUsername() {
    return `user_${this.randomString(6)}`;
  },
  
  /**
   * 生成随机密码
   * @returns {string} 随机密码
   */
  randomPassword() {
    return `Pass${this.randomString(6)}123!`;
  },
  
  /**
   * 生成测试用户
   * @param {Object} overrides - 覆盖属性
   * @returns {Object} 测试用户
   */
  generateTestUser(overrides = {}) {
    return {
      username: this.randomUsername(),
      email: this.randomEmail(),
      password: this.randomPassword(),
      ...overrides
    };
  }
};

module.exports = {
  createTestClient,
  generateAuthToken,
  createAuthRequest,
  cleanupTestResources,
  waitForCondition,
  validateApiResponse,
  createTestDatabaseConnection,
  mockFileSystem,
  createTestEnvironment,
  testDataGenerator
};