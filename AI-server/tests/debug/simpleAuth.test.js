/**
 * 简单认证测试
 * 用于验证JWT认证是否正常工作
 */

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../config/jwtManager');

describe('简单认证测试', () => {
  test('JWT签名和验证应该正常工作', () => {
    // 生成测试 JWT token
    const payload = { userId: 1, email: 'test@example.com', role: 'admin' };
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests';
    
    console.log('测试环境变量:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    console.log('生成的令牌:', token);
    
    // 验证令牌
    const decoded = jwt.verify(token, secret);
    console.log('解码的令牌:', decoded);
    
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('admin');
  });

  test('JWT管理器验证应该正常工作', () => {
    // 生成测试 JWT token
    const payload = { userId: 1, email: 'test@example.com', role: 'admin' };
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests';
    
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    
    // 使用JWT管理器验证令牌
    const decoded = verifyToken(token);
    console.log('JWT管理器解码的令牌:', decoded);
    
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('admin');
  });
});