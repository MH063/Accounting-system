/**
 * 综合认证安全测试
 * 测试所有新实现的安全功能：
 * - JWT双令牌机制
 * - 令牌黑名单/撤销机制  
 * - 登录失败限制与账户锁定
 * - UserRepository用户锁定功能
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { JWTManager } = require('../../config/jwtManager');
const { tokenBlacklist } = require('../../security/tokenBlacklist');
const { UserRepository } = require('../../repositories/UserRepository');
const jwtManager = require('../../config/jwtManager');
const { authenticateToken } = require('../../middleware/auth');

describe('综合认证安全测试', () => {
  let testUserId;
  let testUsername = 'security_test_user';
  let testEmail = 'security_test@example.com';
  let testPassword = 'SecurePassword123!';

  beforeAll(async () => {
    // 清理可能的测试数据
    try {
      const existingUser = await UserRepository.findByUsername(testUsername);
      if (existingUser) {
        await UserRepository.delete(existingUser.id);
      }
    } catch (error) {
      // 用户不存在，继续
    }

    // 创建测试用户
    try {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      
      const testUser = await UserRepository.create({
        username: testUsername,
        email: testEmail,
        password_hash: hashedPassword,
        role: 'user',
        is_active: true
      });
      testUserId = testUser.id;
    } catch (error) {
      console.error('创建测试用户失败:', error.message);
    }
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      if (testUserId) {
        await UserRepository.delete(testUserId);
      }
    } catch (error) {
      console.error('清理测试用户失败:', error.message);
    }
    
    // 清理令牌黑名单
    await tokenBlacklist.clear();
  });

  describe('JWT双令牌机制测试', () => {
    test('应该生成有效的access和refresh令牌对', () => {
      const payload = { 
        userId: testUserId, 
        username: testUsername,
        role: 'user'
      };
      
      const tokenPair = JWTManager.generateTokenPair(payload);
      
      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('expiresIn');
      expect(tokenPair).toHaveProperty('refreshExpiresIn');
      
      // 验证access token
      const decodedAccess = jwt.verify(tokenPair.accessToken, JWTManager.getCurrentKey().secret);
      expect(decodedAccess.userId).toBe(testUserId);
      expect(decodedAccess.type).toBe('access');
      expect(decodedAccess.jti).toBeDefined();
      
      // 验证refresh token
      const decodedRefresh = jwt.verify(tokenPair.refreshToken, JWTManager.getCurrentKey().secret);
      expect(decodedRefresh.userId).toBe(testUserId);
      expect(decodedRefresh.type).toBe('refresh');
      expect(decodedRefresh.jti).toBeDefined();
    });

    test('应该能使用refresh token刷新access token', () => {
      const payload = { userId: testUserId, username: testUsername, role: 'user' };
      const tokenPair = JWTManager.generateTokenPair(payload);
      
      // 使用refresh token生成新的access token
      const newAccessToken = JWTManager.refreshAccessToken(tokenPair.refreshToken);
      expect(newAccessToken).toBeDefined();
      
      // 验证新生成的access token
      const decoded = jwt.verify(newAccessToken, JWTManager.getCurrentKey().secret);
      expect(decoded.type).toBe('access');
      expect(decoded.userId).toBe(testUserId);
    });

    test('access token过期时间应该正确', () => {
      const expiry = JWTManager.getTokenExpiry('access');
      expect(expiry).toBe(15 * 60); // 15分钟
    });

    test('refresh token过期时间应该正确', () => {
      const expiry = JWTManager.getTokenExpiry('refresh');
      expect(expiry).toBe(7 * 24 * 60 * 60); // 7天
    });
  });

  describe('令牌黑名单机制测试', () => {
    let testAccessToken, testRefreshToken;

    beforeEach(async () => {
      const payload = { userId: testUserId, username: testUsername, role: 'user' };
      const tokenPair = JWTManager.generateTokenPair(payload);
      testAccessToken = tokenPair.accessToken;
      testRefreshToken = tokenPair.refreshToken;
      
      // 提取JWT ID用于测试
      const decodedAccess = jwt.decode(testAccessToken);
      const decodedRefresh = jwt.decode(testRefreshToken);
      
      testAccessToken = { token: testAccessToken, jti: decodedAccess.jti };
      testRefreshToken = { token: testRefreshToken, jti: decodedRefresh.jti };
    });

    test('应该能够撤销单个令牌', async () => {
      const result = await tokenBlacklist.revokeToken(testAccessToken.token, 'access');
      expect(result).toBe(true);
      
      // 检查令牌是否在黑名单中
      const isRevoked = await tokenBlacklist.isTokenRevoked(testAccessToken.jti);
      expect(isRevoked).toBe(true);
    });

    test('应该能够撤销令牌对', async () => {
      const result = await tokenBlacklist.revokeTokenPair(
        testAccessToken.jti,
        testRefreshToken.jti
      );
      expect(result).toBe(true);
      
      // 检查两个令牌是否都在黑名单中
      const accessRevoked = await tokenBlacklist.isTokenRevoked(testAccessToken.jti);
      const refreshRevoked = await tokenBlacklist.isTokenRevoked(testRefreshToken.jti);
      
      expect(accessRevoked).toBe(true);
      expect(refreshRevoked).toBe(true);
    });

    test('应该能够检查令牌是否被撤销', async () => {
      // 首先撤销令牌
      await tokenBlacklist.revokeToken(testAccessToken.token, 'access');
      
      // 验证黑名单检查
      const isRevoked = await tokenBlacklist.isTokenRevoked(testAccessToken.jti);
      expect(isRevoked).toBe(true);
      
      // 未撤销的令牌应该返回false
      const isNotRevoked = await tokenBlacklist.isTokenRevoked('nonexistent-jti');
      expect(isNotRevoked).toBe(false);
    });

    test('应该能够统计黑名单中的令牌数量', async () => {
      // 撤销几个令牌
      await tokenBlacklist.revokeToken(testAccessToken.token, 'access');
      await tokenBlacklist.revokeToken(testRefreshToken.token, 'refresh');
      
      const stats = await tokenBlacklist.getStats();
      expect(stats).toHaveProperty('totalRevoked');
      expect(stats.totalRevoked).toBeGreaterThanOrEqual(2);
    });
  });

  describe('用户锁定功能测试', () => {
    test('应该能够检查用户锁定状态', async () => {
      // 首先重置用户登录尝试次数
      await UserRepository.resetLoginAttempts(testUserId);
      
      // 检查用户是否被锁定
      const isLocked = await UserRepository.checkUserLocked(testUserId);
      expect(isLocked).toBe(false);
    });

    test('应该能够增加登录失败次数并在达到限制时锁定账户', async () => {
      // 重置登录尝试次数
      await UserRepository.resetLoginAttempts(testUserId);
      
      // 模拟5次失败登录
      for (let i = 0; i < 5; i++) {
        await UserRepository.incrementLoginAttempts(testUserId);
      }
      
      // 检查用户是否被锁定
      const isLocked = await UserRepository.checkUserLocked(testUserId);
      expect(isLocked).toBe(true);
      
      // 获取用户状态
      const user = await UserRepository.findById(testUserId);
      expect(user.lock_until).toBeDefined();
    });

    test('应该能够重置登录尝试次数', async () => {
      // 先锁定用户
      await UserRepository.resetLoginAttempts(testUserId);
      for (let i = 0; i < 5; i++) {
        await UserRepository.incrementLoginAttempts(testUserId);
      }
      
      let isLocked = await UserRepository.checkUserLocked(testUserId);
      expect(isLocked).toBe(true);
      
      // 重置登录尝试次数
      await UserRepository.resetLoginAttempts(testUserId);
      
      // 检查用户是否解锁
      isLocked = await UserRepository.checkUserLocked(testUserId);
      expect(isLocked).toBe(false);
    });

    test('应该能够手动锁定和解锁用户', async () => {
      // 手动锁定用户
      await UserRepository.lockUser(testUserId, 30); // 锁定30分钟
      
      let isLocked = await UserRepository.checkUserLocked(testUserId);
      expect(isLocked).toBe(true);
      
      // 手动解锁用户
      await UserRepository.unlockUser(testUserId);
      
      isLocked = await UserRepository.checkUserLocked(testUserId);
      expect(isLocked).toBe(false);
    });
  });

  describe('完整认证流程测试', () => {
    test('应该能够正常登录获取双令牌', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      
      // 验证令牌格式
      const { accessToken, refreshToken } = response.body.data.tokens;
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(0);
      expect(refreshToken.length).toBeGreaterThan(0);
    });

    test('应该能够使用refresh token刷新access token', async () => {
      // 首先登录获取令牌
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });
      
      const { refreshToken } = loginResponse.body.data.tokens;
      
      // 使用refresh token刷新
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });
      
      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken');
    });

    test('应该拒绝错误的登录凭据', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrong_password'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('应该在连续失败登录后锁定账户', async () => {
      // 重置用户状态
      await UserRepository.resetLoginAttempts(testUserId);
      
      // 连续5次失败登录
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: `wrong_password_${i}`
          });
        
        expect(response.status).toBe(401);
      }
      
      // 尝试第6次登录，应该被锁定
      const lockedResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });
      
      expect(lockedResponse.status).toBe(423); // 账户被锁定
      expect(lockedResponse.body.success).toBe(false);
    });

    test('应该能够在正确登录后重置失败计数', async () => {
      // 重置用户状态
      await UserRepository.resetLoginAttempts(testUserId);
      
      // 先失败几次
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: testUsername,
            password: `wrong_password_${i}`
          });
      }
      
      // 正确登录应该重置失败计数
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });
      
      expect(response.status).toBe(200);
      
      // 再次尝试错误登录，失败计数应该重新开始
      const wrongResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrong_password'
        });
      
      expect(wrongResponse.status).toBe(401);
    });
  });

  describe('令牌验证集成测试', () => {
    test('应该能够验证令牌并检查黑名单', async () => {
      // 生成令牌对
      const payload = { userId: testUserId, username: testUsername, role: 'user' };
      const tokenPair = JWTManager.generateTokenPair(payload);
      
      // 验证未撤销的令牌
      const validResult = JWTManager.verifyTokenWithBlacklist(tokenPair.accessToken);
      expect(validResult).toHaveProperty('valid', true);
      expect(validResult.payload).toBeDefined();
      
      // 撤销令牌
      await tokenBlacklist.revokeToken(tokenPair.accessToken, 'access');
      
      // 验证已撤销的令牌
      const invalidResult = JWTManager.verifyTokenWithBlacklist(tokenPair.accessToken);
      expect(invalidResult).toHaveProperty('valid', false);
      expect(invalidResult.reason).toBe('Token has been revoked');
    });
  });
});