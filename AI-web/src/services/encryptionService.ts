/**
 * 数据加密服务
 * 提供端到端加密功能
 */

import CryptoJS from 'crypto-js'

// 加密密钥（实际应用中应该从环境变量或安全存储中获取）
const ENCRYPTION_KEY = 'accounting_system_encryption_key_2024'

/**
 * 生成加密密钥
 * @param password 用户密码或主密钥
 * @returns 加密密钥
 */
export const generateEncryptionKey = (password: string): string => {
  // 使用SHA-256哈希函数生成固定长度的密钥
  return CryptoJS.SHA256(password).toString()
}

/**
 * AES加密数据
 * @param data 要加密的数据
 * @param key 加密密钥
 * @returns 加密后的数据（Base64编码）
 */
export const encryptData = (data: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, key)
    return encrypted.toString()
  } catch (error) {
    console.error('数据加密失败:', error)
    throw new Error('数据加密失败')
  }
}

/**
 * AES解密数据
 * @param encryptedData 加密的数据（Base64编码）
 * @param key 解密密钥
 * @returns 解密后的原始数据
 */
export const decryptData = (encryptedData: string, key: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('数据解密失败:', error)
    throw new Error('数据解密失败')
  }
}

/**
 * 加密敏感数据对象
 * @param data 敏感数据对象
 * @param masterKey 主密钥
 * @returns 加密后的数据对象
 */
export const encryptSensitiveData = <T extends Record<string, any>>(
  data: T, 
  masterKey: string
): Record<string, string> => {
  try {
    const encryptedData: Record<string, string> = {}
    const encryptionKey = generateEncryptionKey(masterKey)
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        encryptedData[key] = encryptData(value, encryptionKey)
      } else if (typeof value === 'object' && value !== null) {
        // 递归加密嵌套对象
        encryptedData[key] = encryptData(JSON.stringify(value), encryptionKey)
      } else {
        // 其他类型转换为字符串后加密
        encryptedData[key] = encryptData(String(value), encryptionKey)
      }
    }
    
    return encryptedData
  } catch (error) {
    console.error('敏感数据加密失败:', error)
    throw new Error('敏感数据加密失败')
  }
}

/**
 * 解密敏感数据对象
 * @param encryptedData 加密的数据对象
 * @param masterKey 主密钥
 * @returns 解密后的原始数据对象
 */
export const decryptSensitiveData = <T extends Record<string, any>>(
  encryptedData: Record<string, string>, 
  masterKey: string
): T => {
  try {
    const decryptedData: Record<string, any> = {}
    const encryptionKey = generateEncryptionKey(masterKey)
    
    for (const [key, value] of Object.entries(encryptedData)) {
      const decryptedValue = decryptData(value, encryptionKey)
      
      // 尝试解析JSON对象
      try {
        decryptedData[key] = JSON.parse(decryptedValue)
      } catch {
        // 如果不是JSON，则保持原样
        decryptedData[key] = decryptedValue
      }
    }
    
    return decryptedData as T
  } catch (error) {
    console.error('敏感数据解密失败:', error)
    throw new Error('敏感数据解密失败')
  }
}

/**
 * 检查数据是否已加密
 * @param data 数据
 * @returns 是否已加密
 */
export const isEncrypted = (data: string): boolean => {
  try {
    // 简单检查是否为Base64格式的加密数据
    // 实际应用中可以根据加密数据的特征进行更准确的判断
    return data.startsWith('U2FsdGVkX1')
  } catch {
    return false
  }
}

/**
 * 生成随机盐值
 * @returns 随机盐值
 */
export const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128/8).toString()
}

/**
 * 使用盐值和密码生成更强的密钥
 * @param password 密码
 * @param salt 盐值
 * @returns 强化密钥
 */
export const deriveKey = (password: string, salt: string): string => {
  const result = CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  });
  return result.toString();
}

/**
 * 加密并签名数据
 * @param data 数据
 * @param key 密钥
 * @returns 加密并签名的数据
 */
export const encryptAndSign = (data: string, key: string): string => {
  try {
    // 生成随机盐值
    const salt = generateSalt();
    
    // 使用盐值强化密钥
    const derivedKey = deriveKey(key, salt);
    
    // 加密数据
    const encrypted = encryptData(data, derivedKey);
    
    // 生成签名
    const signature = CryptoJS.HmacSHA256(encrypted, derivedKey).toString();
    
    // 返回盐值、加密数据和签名的组合
    return `${salt}:${encrypted}:${signature}`;
  } catch (error) {
    console.error('数据加密和签名失败:', error);
    throw new Error('数据加密和签名失败');
  }
}

/**
 * 验证并解密数据
 * @param signedData 签名的数据
 * @param key 密钥
 * @returns 解密后的数据
 */
export const verifyAndDecrypt = (signedData: string, key: string): string => {
  try {
    // 分离盐值、加密数据和签名
    const parts = signedData.split(':')
    if (parts.length !== 3) {
      throw new Error('数据格式不正确')
    }
    
    const salt = parts[0];
    const encryptedData = parts[1];
    const signature = parts[2];
    
    // 使用盐值强化密钥
    const derivedKey = deriveKey(key, salt);
    
    // 验证签名
    const expectedSignature = CryptoJS.HmacSHA256(encryptedData, derivedKey).toString();
    if (signature !== expectedSignature) {
      throw new Error('数据签名验证失败')
    }
    
    // 解密数据
    return decryptData(encryptedData, derivedKey);
  } catch (error) {
    console.error('数据验证和解密失败:', error)
    throw new Error('数据验证和解密失败')
  }
}

export default {
  generateEncryptionKey,
  encryptData,
  decryptData,
  encryptSensitiveData,
  decryptSensitiveData,
  isEncrypted,
  generateSalt,
  deriveKey,
  encryptAndSign,
  verifyAndDecrypt
}