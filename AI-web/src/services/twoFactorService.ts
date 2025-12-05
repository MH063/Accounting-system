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
 * 生成密钥密文
 * @returns 32字符的十六进制字符串
 */
export const generateSecret = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
 * 生成TOTP验证码
 * @param secret 密钥
 * @param timeWindow 时间窗口
 * @returns 6位数字验证码
 */
export const generateTOTP = async (secret: string, timeWindow?: number): Promise<string> => {
  if (!timeWindow) {
    timeWindow = getTimeWindow();
  }
  
  // 将密钥从十六进制转换为字节数组
  const secretBytes = new Uint8Array(secret.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
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
};

/**
 * 验证TOTP验证码
 * @param secret 密钥
 * @param token 用户输入的验证码
 * @param window 窗口大小，默认1（前后各一个时间窗口）
 * @returns 验证结果
 */
export const verifyTOTP = async (secret: string, token: string, window: number = 1): Promise<boolean> => {
  const currentTimeWindow = getTimeWindow();
  
  // 检查当前时间窗口及前后几个窗口
  for (let i = -window; i <= window; i++) {
    const totp = await generateTOTP(secret, currentTimeWindow + i);
    if (totp === token) {
      return true;
    }
  }
  
  return false;
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
    enabled: true,
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
  
  if (!config || !config.enabled) {
    return true; // 如果未启用两步验证，则验证通过
  }
  
  // 首先检查是否为备份验证码
  const backupCodeIndex = config.backupCodes.indexOf(token.toUpperCase());
  if (backupCodeIndex !== -1) {
    // 使用了备份验证码，从列表中移除
    config.backupCodes.splice(backupCodeIndex, 1);
    saveTwoFactorConfig(accountId, config);
    return true;
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
  getTwoFactorStatus,
  verifyTwoFactorToken,
  regenerateBackupCodes
};