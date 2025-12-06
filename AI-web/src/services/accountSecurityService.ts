/**
 * 账户安全服务
 * 提供登录频率限制和账户锁定功能
 */

// 登录尝试记录
export interface LoginAttempt {
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

// 账户锁定状态
export interface AccountLockStatus {
  isLocked: boolean;
  lockedUntil?: number;
  remainingTime?: number;
}

// 登录频率限制配置
export interface RateLimitConfig {
  maxAttempts: number;
  timeWindow: number; // 时间窗口（分钟）
  enabled: boolean;
}

// 账户锁定配置
export interface LockoutConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // 锁定持续时间（分钟）
  resetCounter: boolean; // 成功登录后是否重置计数器
}

// 安全配置
export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  lockout: LockoutConfig;
}

/**
 * 获取默认安全配置
 */
export const getDefaultSecurityConfig = (): SecurityConfig => {
  return {
    rateLimit: {
      maxAttempts: 5,
      timeWindow: 15,
      enabled: true
    },
    lockout: {
      maxFailedAttempts: 5,
      lockoutDuration: 30,
      resetCounter: true
    }
  };
};

/**
 * 从localStorage获取安全配置
 */
export const getSecurityConfig = (): SecurityConfig => {
  try {
    const configStr = localStorage.getItem('securityConfig');
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('解析安全配置失败，使用默认配置:', error);
  }
  return getDefaultSecurityConfig();
};

/**
 * 保存安全配置到localStorage
 * @param config 安全配置
 */
export const saveSecurityConfig = (config: SecurityConfig): void => {
  try {
    localStorage.setItem('securityConfig', JSON.stringify(config));
  } catch (error) {
    console.error('保存安全配置失败:', error);
  }
};

/**
 * 获取账户的登录尝试记录
 * @param accountId 账户ID
 */
export const getLoginAttempts = (accountId: string): LoginAttempt[] => {
  try {
    const attemptsStr = localStorage.getItem(`loginAttempts_${accountId}`);
    if (attemptsStr) {
      return JSON.parse(attemptsStr);
    }
  } catch (error) {
    console.warn('解析登录尝试记录失败:', error);
  }
  return [];
};

/**
 * 保存登录尝试记录
 * @param accountId 账户ID
 * @param attempts 登录尝试记录
 */
export const saveLoginAttempts = (accountId: string, attempts: LoginAttempt[]): void => {
  try {
    // 只保留最近100条记录以节省空间
    const recentAttempts = attempts.slice(-100);
    localStorage.setItem(`loginAttempts_${accountId}`, JSON.stringify(recentAttempts));
  } catch (error) {
    console.error('保存登录尝试记录失败:', error);
  }
};

/**
 * 记录登录尝试
 * @param accountId 账户ID
 * @param ipAddress IP地址
 * @param userAgent 用户代理
 * @param success 是否成功
 */
export const recordLoginAttempt = (
  accountId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean
): void => {
  const attempts = getLoginAttempts(accountId);
  attempts.push({
    timestamp: Date.now(),
    ipAddress,
    userAgent,
    success
  });
  saveLoginAttempts(accountId, attempts);
};

/**
 * 检查是否超出登录频率限制
 * @param accountId 账户ID
 * @param ipAddress IP地址
 * @param config 安全配置
 */
export const isRateLimited = (
  accountId: string,
  ipAddress: string,
  config: SecurityConfig
): boolean => {
  if (!config.rateLimit.enabled) {
    return false;
  }

  const attempts = getLoginAttempts(accountId);
  const timeWindow = config.rateLimit.timeWindow * 60 * 1000; // 转换为毫秒
  const cutoffTime = Date.now() - timeWindow;

  // 计算时间窗口内的失败尝试次数
  const recentFailures = attempts.filter(attempt => 
    !attempt.success && 
    attempt.timestamp > cutoffTime &&
    attempt.ipAddress === ipAddress
  );

  return recentFailures.length >= config.rateLimit.maxAttempts;
};

/**
 * 获取账户锁定状态
 * @param accountId 账户ID
 * @param config 安全配置
 */
export const getAccountLockStatus = (
  accountId: string,
  config: SecurityConfig
): AccountLockStatus => {
  const attempts = getLoginAttempts(accountId);
  
  // 检查是否有手动锁定
  const manualLockStr = localStorage.getItem(`manualLock_${accountId}`);
  if (manualLockStr) {
    try {
      const manualLock = JSON.parse(manualLockStr);
      if (manualLock.isLocked && manualLock.lockedUntil > Date.now()) {
        return {
          isLocked: true,
          lockedUntil: manualLock.lockedUntil,
          remainingTime: Math.ceil((manualLock.lockedUntil - Date.now()) / 1000)
        };
      } else {
        // 锁定时间已过，清除手动锁定并重置失败尝试计数器
        localStorage.removeItem(`manualLock_${accountId}`);
        resetFailedAttempts(accountId);
      }
    } catch (error) {
      console.warn('解析手动锁定状态失败:', error);
    }
  }

  // 检查自动锁定
  if (config.lockout.maxFailedAttempts > 0) {
    // 获取最近的失败尝试（不考虑时间窗口）
    const recentAttempts = [...attempts].reverse();
    let consecutiveFailures = 0;
    
    for (const attempt of recentAttempts) {
      if (attempt.success) {
        // 如果启用了重置计数器，成功登录后重置计数
        if (config.lockout.resetCounter) {
          consecutiveFailures = 0;
        }
        break;
      }
      consecutiveFailures++;
    }

    // 检查是否达到锁定阈值
    if (consecutiveFailures >= config.lockout.maxFailedAttempts) {
      // 查找最后一次失败尝试的时间
      const lastFailure = attempts.reverse().find((attempt: LoginAttempt) => !attempt.success);
      if (lastFailure) {
        const lockoutDuration = config.lockout.lockoutDuration * 60 * 1000; // 转换为毫秒
        const lockedUntil = lastFailure.timestamp + lockoutDuration;
        
        if (lockedUntil > Date.now()) {
          return {
            isLocked: true,
            lockedUntil,
            remainingTime: Math.ceil((lockedUntil - Date.now()) / 1000)
          };
        } else {
          // 锁定时间已过，重置失败尝试计数器
          resetFailedAttempts(accountId);
        }
      }
    }
  }

  return {
    isLocked: false
  };
};

/**
 * 手动锁定账户
 * @param accountId 账户ID
 * @param duration 锁定持续时间（分钟）
 */
export const manuallyLockAccount = (
  accountId: string,
  duration: number
): void => {
  const lockedUntil = Date.now() + (duration * 60 * 1000);
  const lockInfo = {
    isLocked: true,
    lockedUntil
  };
  localStorage.setItem(`manualLock_${accountId}`, JSON.stringify(lockInfo));
};

/**
 * 解锁账户
 * @param accountId 账户ID
 */
export const unlockAccount = (accountId: string): void => {
  localStorage.removeItem(`manualLock_${accountId}`);
};

/**
 * 重置账户的失败尝试计数器
 * @param accountId 账户ID
 */
export const resetFailedAttempts = (accountId: string): void => {
  const attempts = getLoginAttempts(accountId);
  // 清除所有失败尝试记录
  const successAttempts = attempts.filter(attempt => attempt.success);
  saveLoginAttempts(accountId, successAttempts);
};

/**
 * 设备信息
 */
export interface DeviceInfo {
  id: string;
  userAgent: string;
  ipAddress: string;
  firstLoginTime: number;
  lastLoginTime: number;
}

/**
 * 生成设备指纹
 * @param userAgent 用户代理字符串
 * @param ipAddress IP地址
 * @returns 设备指纹
 */
export const generateDeviceFingerprint = (userAgent: string, ipAddress: string): string => {
  // 简单的设备指纹生成，实际应用中应该使用更复杂的方法
  return btoa(userAgent + ipAddress).slice(0, 32);
};

/**
 * 获取账户的已知设备列表
 * @param accountId 账户ID
 * @returns 设备列表
 */
export const getKnownDevices = (accountId: string): DeviceInfo[] => {
  try {
    const devicesStr = localStorage.getItem(`knownDevices_${accountId}`);
    if (devicesStr) {
      return JSON.parse(devicesStr);
    }
  } catch (error) {
    console.warn('解析已知设备列表失败:', error);
  }
  return [];
};

/**
 * 保存账户的已知设备列表
 * @param accountId 账户ID
 * @param devices 设备列表
 */
export const saveKnownDevices = (accountId: string, devices: DeviceInfo[]): void => {
  try {
    localStorage.setItem(`knownDevices_${accountId}`, JSON.stringify(devices));
  } catch (error) {
    console.error('保存已知设备列表失败:', error);
  }
};

/**
 * 检查是否是新设备
 * @param accountId 账户ID
 * @param userAgent 用户代理
 * @param ipAddress IP地址
 * @returns 是否是新设备
 */
export const isNewDevice = (accountId: string, userAgent: string, ipAddress: string): boolean => {
  const devices = getKnownDevices(accountId);
  const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
  
  // 检查设备指纹是否存在
  return !devices.some(device => device.id === fingerprint);
};

/**
 * 记录新设备
 * @param accountId 账户ID
 * @param userAgent 用户代理
 * @param ipAddress IP地址
 */
export const recordNewDevice = (accountId: string, userAgent: string, ipAddress: string): void => {
  const devices = getKnownDevices(accountId);
  const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
  const now = Date.now();
  
  // 检查设备是否已存在
  const existingDeviceIndex = devices.findIndex(device => device.id === fingerprint);
  
  if (existingDeviceIndex >= 0) {
    // 更新现有设备的最后登录时间
    if (devices[existingDeviceIndex]) {
      devices[existingDeviceIndex].lastLoginTime = now;
    }
  } else {
    // 添加新设备
    devices.push({
      id: fingerprint,
      userAgent,
      ipAddress,
      firstLoginTime: now,
      lastLoginTime: now
    });
  }
  
  // 保存设备列表
  saveKnownDevices(accountId, devices);
};

/**
 * 获取客户端IP地址（模拟）
 * 在实际应用中，应该从服务器获取真实IP
 */
export const getClientIpAddress = (): string => {
  // 在实际应用中，应该从服务器获取真实IP
  // 这里返回一个模拟的IP地址
  return '192.168.1.100';
};

/**
 * 获取用户代理字符串
 */
export const getUserAgent = (): string => {
  return navigator.userAgent;
};

export default {
  getDefaultSecurityConfig,
  getSecurityConfig,
  saveSecurityConfig,
  getLoginAttempts,
  saveLoginAttempts,
  recordLoginAttempt,
  isRateLimited,
  getAccountLockStatus,
  manuallyLockAccount,
  unlockAccount,
  resetFailedAttempts,
  getClientIpAddress,
  getUserAgent
};