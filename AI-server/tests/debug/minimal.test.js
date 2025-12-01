/**
 * 最小化测试
 * 用于验证基本功能
 */

const request = require('supertest');
const { createTestApp } = require('../../utils/testAppFactory');
const app = createTestApp();

describe('最小化测试', () => {
  test('根路径应该返回200', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('健康检查路径应该返回200', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});