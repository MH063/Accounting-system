/**
 * JWT安全测试
 */

const crypto = require('crypto');
const { JWTManager } = require('../../config/jwtManager');

describe('JWT安全管理测试', () => {
  let jwtManager;

  beforeEach(() => {
    // 使用导出的JWT管理器实例
    jwtManager = JWTManager;
  });

  test('应该生成足够强度的密钥', () => {
    const keyPair = jwtManager.generateKeyPair();
    
    // 检查密钥ID长度
    expect(keyPair.id).toHaveLength(64); // 32字节转换为hex是64字符
    
    // 检查密钥长度
    expect(keyPair.secret).toHaveLength(512); // 256字节转换为hex是512字符
    
    // 检查密钥应该是十六进制字符串
    expect(keyPair.id).toMatch(/^[a-f0-9]+$/);
    expect(keyPair.secret).toMatch(/^[a-f0-9]+$/);
  });

  test('应该正确验证密钥强度', () => {
    const keyPair = jwtManager.generateKeyPair();
    
    // 生成的密钥应该有足够的强度
    expect(keyPair.secret.length).toBeGreaterThanOrEqual(256);
  });

  test('应该能够轮换密钥', () => {
    const initialKey = jwtManager.getCurrentKey();
    const initialKeyId = jwtManager.currentKeyId;
    
    // 轮换密钥
    const newKey = jwtManager.rotateKey();
    
    // 检查新密钥是否生成
    expect(newKey).toBeDefined();
    expect(newKey.id).not.toBe(initialKeyId);
    
    // 检查当前密钥是否更新
    const currentKey = jwtManager.getCurrentKey();
    expect(currentKey.id).toBe(newKey.id);
  });

  test('应该能够获取密钥状态', () => {
    const status = jwtManager.getKeyStatus();
    
    // 检查状态对象结构
    expect(status).toHaveProperty('currentKeyId');
    expect(status).toHaveProperty('currentKey');
    expect(status).toHaveProperty('verificationKeyCount');
    expect(status).toHaveProperty('totalKeyCount');
    expect(status).toHaveProperty('expiringKeys');
  });
});