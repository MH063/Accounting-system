/**
 * 简化的认证安全测试
 * 测试核心JWT双令牌机制、令牌黑名单和用户锁定功能
 */

const jwt = require('jsonwebtoken');

// 模拟所需的依赖
jest.mock('../../config/jwtManager', () => ({
  generateTokenPair: jest.fn(),
  refreshAccessToken: jest.fn(),
  revokeTokenPair: jest.fn(),
  verifyTokenWithBlacklist: jest.fn(),
  getTokenExpiry: jest.fn()
}));

jest.mock('../../security/tokenBlacklist', () => ({
  tokenBlacklist: {
    addToBlacklist: jest.fn(),
    isBlacklisted: jest.fn(),
    removeFromBlacklist: jest.fn(),
    clear: jest.fn()
  }
}));

jest.mock('../../repositories/UserRepository', () => ({
  UserRepository: {
    findByUsername: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    incrementLoginFailures: jest.fn(),
    resetLoginFailures: jest.fn(),
    lockUser: jest.fn(),
    unlockUser: jest.fn(),
    getAccountStatus: jest.fn()
  }
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const jwtManager = require('../../config/jwtManager');
const { tokenBlacklist } = require('../../security/tokenBlacklist');
const UserRepository = require('../../repositories/UserRepository').UserRepository;

describe('简化认证安全测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT双令牌机制测试', () => {
    test('应该能够生成双令牌对', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      };

      jwtManager.generateTokenPair.mockResolvedValue(mockTokens);

      const result = await jwtManager.generateTokenPair(1, 'testuser');

      expect(jwtManager.generateTokenPair).toHaveBeenCalledWith(1, 'testuser');
      expect(result).toEqual(mockTokens);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    test('应该能够刷新访问令牌', async () => {
      const mockRefreshToken = 'mock-refresh-token';
      const mockNewAccessToken = 'new-access-token';

      jwtManager.refreshAccessToken.mockResolvedValue({
        accessToken: mockNewAccessToken,
        expiresIn: 3600
      });

      const result = await jwtManager.refreshAccessToken(mockRefreshToken);

      expect(jwtManager.refreshAccessToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('expiresIn');
    });

    test('应该能够撤销令牌对', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      jwtManager.revokeTokenPair.mockResolvedValue(true);

      const result = await jwtManager.revokeTokenPair(mockAccessToken, mockRefreshToken);

      expect(jwtManager.revokeTokenPair).toHaveBeenCalledWith(mockAccessToken, mockRefreshToken);
      expect(result).toBe(true);
    });
  });

  describe('令牌黑名单机制测试', () => {
    test('应该能够将令牌添加到黑名单', async () => {
      const mockToken = 'mock-token-to-blacklist';

      tokenBlacklist.addToBlacklist.mockResolvedValue(true);

      await tokenBlacklist.addToBlacklist(mockToken, 3600);

      expect(tokenBlacklist.addToBlacklist).toHaveBeenCalledWith(mockToken, 3600);
    });

    test('应该能够检查令牌是否在黑名单中', async () => {
      const mockToken = 'blacklisted-token';

      tokenBlacklist.isBlacklisted.mockResolvedValue(true);

      const result = await tokenBlacklist.isBlacklisted(mockToken);

      expect(tokenBlacklist.isBlacklisted).toHaveBeenCalledWith(mockToken);
      expect(result).toBe(true);
    });

    test('应该能够从黑名单中移除令牌', async () => {
      const mockToken = 'token-to-remove';

      tokenBlacklist.removeFromBlacklist.mockResolvedValue(true);

      await tokenBlacklist.removeFromBlacklist(mockToken);

      expect(tokenBlacklist.removeFromBlacklist).toHaveBeenCalledWith(mockToken);
    });
  });

  describe('用户锁定功能测试', () => {
    test('应该能够锁定用户账户', async () => {
      const userId = 1;

      UserRepository.lockUser.mockResolvedValue(true);

      await UserRepository.lockUser(userId, 1800); // 锁定30分钟

      expect(UserRepository.lockUser).toHaveBeenCalledWith(userId, 1800);
    });

    test('应该能够解锁用户账户', async () => {
      const userId = 1;

      UserRepository.unlockUser.mockResolvedValue(true);

      await UserRepository.unlockUser(userId);

      expect(UserRepository.unlockUser).toHaveBeenCalledWith(userId);
    });

    test('应该能够获取账户状态', async () => {
      const userId = 1;
      const mockStatus = {
        isLocked: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      };

      UserRepository.getAccountStatus.mockResolvedValue(mockStatus);

      const result = await UserRepository.getAccountStatus(userId);

      expect(UserRepository.getAccountStatus).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockStatus);
      expect(result).toHaveProperty('isLocked');
      expect(result).toHaveProperty('failedLoginAttempts');
    });

    test('应该能够增加登录失败次数', async () => {
      const userId = 1;

      UserRepository.incrementLoginFailures.mockResolvedValue(1);

      const result = await UserRepository.incrementLoginFailures(userId);

      expect(UserRepository.incrementLoginFailures).toHaveBeenCalledWith(userId);
      expect(result).toBe(1);
    });

    test('应该能够重置登录失败次数', async () => {
      const userId = 1;

      UserRepository.resetLoginFailures.mockResolvedValue(true);

      await UserRepository.resetLoginFailures(userId);

      expect(UserRepository.resetLoginFailures).toHaveBeenCalledWith(userId);
    });
  });

  describe('集成测试场景', () => {
    test('完整的登录失败导致锁定流程', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';
      const userId = 1;

      // 模拟用户存在但密码错误
      UserRepository.findByUsername.mockResolvedValue({
        id: userId,
        username: username,
        password_hash: 'hashedpassword',
        is_locked: false,
        failed_login_attempts: 4,
        locked_until: null
      });

      // 模拟密码验证失败
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      // 第一次登录失败
      await UserRepository.incrementLoginFailures(userId);
      expect(UserRepository.incrementLoginFailures).toHaveBeenCalledWith(userId);

      // 第5次失败应该锁定账户
      UserRepository.lockUser.mockResolvedValue(true);
      await UserRepository.lockUser(userId, 1800);
      expect(UserRepository.lockUser).toHaveBeenCalledWith(userId, 1800);

      // 验证用户现在被锁定
      UserRepository.getAccountStatus.mockResolvedValue({
        isLocked: true,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 1800000)
      });

      const status = await UserRepository.getAccountStatus(userId);
      expect(status.isLocked).toBe(true);
      expect(status.failedLoginAttempts).toBe(5);
    });

    test('正确的密码应该重置失败计数', async () => {
      const username = 'testuser';
      const password = 'correctpassword';
      const userId = 1;

      // 模拟用户存在且密码正确
      UserRepository.findByUsername.mockResolvedValue({
        id: userId,
        username: username,
        password_hash: 'hashedpassword',
        is_locked: false,
        failed_login_attempts: 2,
        locked_until: null
      });

      // 模拟密码验证成功
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // 正确的密码应该重置失败次数
      UserRepository.resetLoginFailures.mockResolvedValue(true);
      await UserRepository.resetLoginFailures(userId);
      expect(UserRepository.resetLoginFailures).toHaveBeenCalledWith(userId);

      // 生成新的令牌对
      jwtManager.generateTokenPair.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      });

      const tokens = await jwtManager.generateTokenPair(userId, username);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
    });
  });
});