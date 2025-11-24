/**
 * API 集成测试
 * 测试完整的 API 请求响应流程
 */

const request = require('supertest');
const app = require('../../server');
const { pool } = require('../../config/database');

describe('API 集成测试', () => {
  let authToken;

  beforeAll(async () => {
    // 生成测试 JWT token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: 1, email: 'test@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-jwt-secret-key',
      { expiresIn: '1h' }
    );

    // 模拟数据库连接
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  afterAll(async () => {
    // 清理资源
    if (pool.end) {
      await pool.end();
    }
  });

  describe('健康检查 API', () => {
    test('GET /api/health 应该返回 200 状态', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks).toHaveProperty('storage');
    });

    test('GET /api/health/performance 应该返回性能指标', async () => {
      const response = await request(app)
        .get('/api/health/performance')
        .expect(200);

      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('文件上传 API', () => {
    test('POST /api/upload 应该返回认证错误', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('POST /api/upload 应该接受有效的图片文件', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('files');
    });

    test('POST /api/upload 应该拒绝超大文件', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'a'); // 6MB
      
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large.jpg')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('认证 API', () => {
    test('POST /api/auth/login 应该返回认证错误（未实现）', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/auth/profile 应该返回认证错误', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('GET /api/auth/profile 应该返回用户信息（已认证）', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
    });
  });

  describe('安全防护 API', () => {
    test('GET /api/security/rate-limit-test 应该返回成功', async () => {
      const response = await request(app)
        .get('/api/security/rate-limit-test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', '请求成功');
    });

    test('POST /api/security/scan-test 应该返回扫描结果', async () => {
      const response = await request(app)
        .post('/api/security/scan-test')
        .send({ data: '测试数据' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scanResult');
    });
  });

  describe('错误处理 API', () => {
    test('GET /api/health/test/errors/validation 应该返回验证错误', async () => {
      const response = await request(app)
        .get('/api/health/test/errors/validation')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('数据验证失败：用户输入无效');
    });

    test('GET /api/health/test/errors/timeout 应该返回超时错误', async () => {
      const response = await request(app)
        .get('/api/health/test/errors/timeout')
        .expect(408);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TIMEOUT_ERROR');
      expect(response.body.error.message).toBe('请求超时：服务器响应时间过长');
    });

    test('GET /api/health/test/retry 应该返回成功', async () => {
      const response = await request(app)
        .get('/api/health/test/retry')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', '重试机制测试成功');
    });
  });

  describe('API 响应格式测试', () => {
    test('所有成功响应应该符合统一格式', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
    });

    test('所有错误响应应该符合统一格式', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});