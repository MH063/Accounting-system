/**
 * 认证调试测试
 * 用于调试JWT认证问题
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp } = require('../../utils/testAppFactory');
const app = createTestApp();

describe('认证调试测试', () => {
  let authToken;

  beforeAll(() => {
    // 生成测试 JWT token
    authToken = jwt.sign(
      { userId: 1, email: 'test@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests',
      { expiresIn: '1h' }
    );
    
    console.log('测试环境变量:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('生成的令牌:', authToken);
  });

  test('测试根路径应该返回200', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:4000')  // 添加Origin头
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('测试健康检查路径应该返回200', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:4000')  // 添加Origin头
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('测试带认证的健康检查路径', async () => {
    const response = await request(app)
      .get('/api/health/performance')
      .set('Origin', 'http://localhost:4000')  // 添加Origin头
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('测试认证中间件直接调用', async () => {
    // 创建一个测试路由来验证认证中间件
    app.get('/debug/auth-test', (req, res, next) => {
      console.log('请求头:', req.headers);
      console.log('Authorization header:', req.headers.authorization);
      next();
    }, require('../../middleware/auth').authenticateToken, (req, res) => {
      res.json({ success: true, user: req.user });
    });

    const response = await request(app)
      .get('/debug/auth-test')
      .set('Origin', 'http://localhost:4000')  // 添加Origin头
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.userId).toBe(1);
  });
});