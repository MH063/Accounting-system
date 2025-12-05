/**
 * 两步验证服务
 * 提供基于TOTP的两步验证功能
 */

// 两步验证配置
export interface TwoFactorConfig {
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  createdAt: number;
}

// 两步验证状态
export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesCount: number;
}

/**
 * 生成符合Base32编码规范的密钥
 * @returns 32字符的Base32编码字符串
 */
export const generateSecret = (): string => {
  // 生成20字节的随机数据（Base32编码后为32字符）
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return bytesToBase32(array);
};

/**
 * 将字节数组转换为Base32编码字符串
 * @param bytes 字节数组
 * @returns Base32编码字符串
 */
const bytesToBase32 = (bytes: Uint8Array): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]!;
    bits += 8;
    
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  
  // 补齐等号
  while (output.length % 8 !== 0) {
    output += '=';
  }
  
  return output;
};

/**
 * 将十六进制字符串转换为Base32编码字符串（为了向后兼容保留此函数）
 * @param hex 十六进制字符串
 * @returns Base32编码字符串
 */
export const hexToBase32 = (hex: string): string => {
  try {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return bytesToBase32(bytes);
  } catch (error) {
    // 如果转换失败，返回原始值（避免破坏现有功能）
    console.warn('Hex to Base32 conversion failed, returning original value');
    return hex;
  }
};

/**
 * 生成备份验证码
 * @param count 验证码数量，默认10个
 * @returns 备份验证码数组
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 8);
    codes.push(code);
  }
  return codes;
};

/**
 * 获取当前时间窗口
 * @param step 时间步长（秒），默认30秒
 * @returns 当前时间窗口计数
 */
const getTimeWindow = (step: number = 30): number => {
  return Math.floor(Date.now() / 1000 / step);
};

/**
 * 将Base32编码字符串转换为字节数组
 * @param base32 Base32编码字符串
 * @returns 字节数组
 */
const base32ToBytes = (base32: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  base32 = base32.replace(/=/g, '').toUpperCase();
  
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  
  for (let i = 0; i < base32.length; i++) {
    const char = base32[i]!;
    const index = alphabet.indexOf(char);
    
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xFF);
      bits -= 8;
    }
  }
  
  return new Uint8Array(bytes);
};

/**
 * 生成TOTP验证码
 * @param secret 密钥(Base32编码)
 * @param timeWindow 时间窗口
 * @returns 6位数字验证码
 */
export const generateTOTP = async (secret: string, timeWindow?: number): Promise<string> => {
  if (!timeWindow) {
    timeWindow = getTimeWindow();
  }
  
  try {
    // 将密钥从Base32编码转换为字节数组
    const secretBytes = base32ToBytes(secret);
    
    // 将时间窗口转换为字节数组
    const timeBytes = new ArrayBuffer(8);
    const timeView = new DataView(timeBytes);
    timeView.setBigUint64(0, BigInt(timeWindow), false);
    
    // 使用Web Crypto API计算HMAC-SHA1
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, timeBytes);
    const signatureArray = new Uint8Array(signature);
    
    // 动态截断
    const offset = signatureArray[signatureArray.length - 1]! & 0xf;
    const binary = (
      ((signatureArray[offset]! & 0x7f) << 24) |
      ((signatureArray[offset + 1]! & 0xff) << 16) |
      ((signatureArray[offset + 2]! & 0xff) << 8) |
      (signatureArray[offset + 3]! & 0xff)
    );
    
    // 取模1000000得到6位数字
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (error) {
    console.error('生成TOTP验证码失败:', error);
    throw new Error('无法生成验证码，请检查密钥格式');
  }
};

/**
 * 验证TOTP验证码
 * @param secret 密钥
 * @param token 用户输入的验证码
 * @param window 窗口大小，默认1（前后各一个时间窗口）
 * @returns 验证结果
 */
export const verifyTOTP = async (secret: string, token: string, window: number = 1): Promise<boolean> => {
  try {
    const currentTimeWindow = getTimeWindow();
    
    // 检查当前时间窗口及前后几个窗口
    for (let i = -window; i <= window; i++) {
      const totp = await generateTOTP(secret, currentTimeWindow + i);
      if (totp === token) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('验证TOTP验证码失败:', error);
    // 如果验证过程出错，返回false而不是抛出异常
    return false;
  }
};

/**
 * 从localStorage获取两步验证配置
 * @param accountId 账户ID
 * @returns 两步验证配置
 */
export const getTwoFactorConfig = (accountId: string): TwoFactorConfig | null => {
  try {
    const configStr = localStorage.getItem(`twoFactor_${accountId}`);
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('解析两步验证配置失败:', error);
  }
  return null;
};

/**
 * 保存两步验证配置到localStorage
 * @param accountId 账户ID
 * @param config 两步验证配置
 */
export const saveTwoFactorConfig = (accountId: string, config: TwoFactorConfig): void => {
  try {
    localStorage.setItem(`twoFactor_${accountId}`, JSON.stringify(config));
  } catch (error) {
    console.error('保存两步验证配置失败:', error);
  }
};

/**
 * 启用两步验证
 * @param accountId 账户ID
 * @returns 生成的密钥和备份验证码
 */
export const enableTwoFactor = (accountId: string): { secret: string; backupCodes: string[] } => {
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  
  const config: TwoFactorConfig = {
    secret,
    enabled: false, // 初始时不启用，需要用户验证后才启用
    backupCodes,
    createdAt: Date.now()
  };
  
  saveTwoFactorConfig(accountId, config);
  
  return { secret, backupCodes };
};

/**
 * 禁用两步验证
 * @param accountId 账户ID
 */
export const disableTwoFactor = (accountId: string): void => {
  localStorage.removeItem(`twoFactor_${accountId}`);
};

/**
 * 启用两步验证（在用户完成验证后调用）
 * @param accountId 账户ID
 */
export const activateTwoFactor = (accountId: string): void => {
  const config = getTwoFactorConfig(accountId);
  
  if (config) {
    config.enabled = true;
    saveTwoFactorConfig(accountId, config);
  }
};

/**
 * 获取两步验证状态
 * @param accountId 账户ID
 * @returns 两步验证状态
 */
export const getTwoFactorStatus = (accountId: string): TwoFactorStatus => {
  const config = getTwoFactorConfig(accountId);
  
  if (!config) {
    return {
      enabled: false,
      backupCodesCount: 0
    };
  }
  
  return {
    enabled: config.enabled,
    backupCodesCount: config.backupCodes.length
  };
};

/**
 * 验证两步验证码
 * @param accountId 账户ID
 * @param token 验证码
 * @returns 验证结果
 */
export const verifyTwoFactorToken = async (accountId: string, token: string): Promise<boolean> => {
  const config = getTwoFactorConfig(accountId);
  
  if (!config) {
    return false; // 如果没有配置，则验证失败
  }
  
  // 如果已启用，检查备份验证码
  if (config.enabled) {
    const backupCodeIndex = config.backupCodes.indexOf(token.toUpperCase());
    if (backupCodeIndex !== -1) {
      // 使用了备份验证码，从列表中移除
      config.backupCodes.splice(backupCodeIndex, 1);
      saveTwoFactorConfig(accountId, config);
      return true;
    }
  }
  
  // 验证TOTP验证码
  return await verifyTOTP(config.secret, token);
};

/**
 * 重新生成备份验证码
 * @param accountId 账户ID
 * @returns 新的备份验证码数组
 */
export const regenerateBackupCodes = (accountId: string): string[] => {
  const config = getTwoFactorConfig(accountId);
  
  if (!config) {
    throw new Error('两步验证未启用');
  }
  
  const newBackupCodes = generateBackupCodes();
  config.backupCodes = newBackupCodes;
  saveTwoFactorConfig(accountId, config);
  
  return newBackupCodes;
};

export default {
  generateSecret,
  generateBackupCodes,
  generateTOTP,
  verifyTOTP,
  getTwoFactorConfig,
  saveTwoFactorConfig,
  enableTwoFactor,
  disableTwoFactor,
  activateTwoFactor,
  getTwoFactorStatus,
  verifyTwoFactorToken,
  regenerateBackupCodes,
  hexToBase32
};