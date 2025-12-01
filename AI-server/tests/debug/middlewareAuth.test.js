/**
 * 认证中间件测试
 * 用于验证认证中间件是否正常工作
 */

const express = require('express');
const request = require('supertest');
const { authenticateToken } = require('../../middleware/auth');

describe('认证中间件测试', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('应该允许带有有效令牌的请求通过', async () => {
    // 创建一个简单的路由来测试认证中间件
    app.get('/protected', authenticateToken, (req, res) => {
      res.json({ success: true, user: req.user });
    });

    // 生成测试 JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: 1, email: 'test@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.userId).toBe(1);
  });

  test('应该拒绝没有令牌的请求', async () => {
    // 创建一个简单的路由来测试认证中间件
    app.get('/protected', authenticateToken, (req, res) => {
      res.json({ success: true });
    });

    const response = await request(app)
      .get('/protected')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('访问令牌缺失，请先登录');
  });

  test('应该拒绝带有无效令牌的请求', async () => {
    // 创建一个简单的路由来测试认证中间件
    app.get('/protected', authenticateToken, (req, res) => {
      res.json({ success: true });
    });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});