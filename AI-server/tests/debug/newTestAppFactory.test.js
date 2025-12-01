/**
 * 新的测试应用工厂测试
 * 用于验证测试应用工厂是否正常工作
 */

const request = require('supertest');
const { createTestApp } = require('../../utils/testAppFactory');

describe('新的测试应用工厂测试', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  test('应该能创建应用实例', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });

  test('根路径应该返回200', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:4000')  // 添加来源头
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.version).toBe('1.0.0');
  });
});