/**
 * CORS测试
 * 用于验证CORS配置是否正常工作
 */

const express = require('express');
const request = require('supertest');
const { createCorsMiddleware } = require('../../middleware/corsConfig');

describe('CORS测试', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(createCorsMiddleware());
    
    app.get('/', (req, res) => {
      res.status(200).json({ message: 'Hello World' });
    });
  });

  test('应该允许白名单中的来源', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:4000')
      .expect(200);

    expect(response.body.message).toBe('Hello World');
  });

  test('应该拒绝不在白名单中的来源', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://malicious-site.com')
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('不允许的跨域请求来源');
    expect(response.body.error.code).toBe('CORS_ERROR');
  });
});