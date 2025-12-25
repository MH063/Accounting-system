import { DeviceInfo, getKnownDevices, saveKnownDevices, generateDeviceFingerprint } from './accountSecurityService';
import { getClientIpAddress as apiGetClientIpAddress } from './authService';

// 登录设备限制配置
export interface LoginDeviceLimitConfig {
  maxDevices: number; // 最大设备数量
  autoLogout: boolean; // 是否启用自动登出最早设备
  enabled: boolean; // 是否启用设备限制功能
}

// 当前登录设备会话信息
export interface ActiveDeviceSession {
  id: string; // 设备ID
  userId: string; // 用户ID
  loginTime: number; // 登录时间
  lastActiveTime: number; // 最后活跃时间
  userAgent: string; // 用户代理
  ipAddress: string; // IP地址
  isActive: boolean; // 是否活跃
}

// 默认登录设备限制配置
export const getDefaultLoginDeviceLimitConfig = (): LoginDeviceLimitConfig => {
  return {
    maxDevices: 3,
    autoLogout: true,
    enabled: true
  };
};

/**
 * 从localStorage获取登录设备限制配置
 * @param userId 用户ID
 */
export const getLoginDeviceLimitConfig = (userId: string): LoginDeviceLimitConfig => {
  try {
    const configStr = localStorage.getItem(`loginDeviceLimit_${userId}`);
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('解析登录设备限制配置失败，使用默认配置:', error);
  }
  return getDefaultLoginDeviceLimitConfig();
};

/**
 * 保存登录设备限制配置到localStorage
 * @param userId 用户ID
 * @param config 登录设备限制配置
 */
export const saveLoginDeviceLimitConfig = (userId: string, config: LoginDeviceLimitConfig): void => {
  try {
    localStorage.setItem(`loginDeviceLimit_${userId}`, JSON.stringify(config));
  } catch (error) {
    console.error('保存登录设备限制配置失败:', error);
  }
};

/**
 * 获取当前用户的所有活跃设备会话
 * @param userId 用户ID
 */
export const getActiveDeviceSessions = (userId: string): ActiveDeviceSession[] => {
  try {
    const sessionsStr = localStorage.getItem(`activeSessions_${userId}`);
    if (sessionsStr) {
      return JSON.parse(sessionsStr);
    }
  } catch (error) {
    console.warn('解析活跃设备会话失败:', error);
  }
  return [];
};

/**
 * 保存当前用户的所有活跃设备会话
 * @param userId 用户ID
 * @param sessions 活跃设备会话列表
 */
export const saveActiveDeviceSessions = (userId: string, sessions: ActiveDeviceSession[]): void => {
  try {
    localStorage.setItem(`activeSessions_${userId}`, JSON.stringify(sessions));
  } catch (error) {
    console.error('保存活跃设备会话失败:', error);
  }
};

/**
 * 记录新的设备登录会话
 * @param userId 用户ID
 * @param userAgent 用户代理
 * @param ipAddress IP地址
 */
export const recordNewDeviceSession = (
  userId: string,
  userAgent: string,
  ipAddress: string
): ActiveDeviceSession => {
  const sessions = getActiveDeviceSessions(userId);
  const config = getLoginDeviceLimitConfig(userId);
  const deviceId = generateDeviceFingerprint(userAgent, ipAddress);
  const now = Date.now();
  
  // 检查设备是否已存在活跃会话
  const existingSessionIndex = sessions.findIndex(session => 
    session.id === deviceId && session.isActive
  );
  
  let session: ActiveDeviceSession;
  
  if (existingSessionIndex >= 0) {
    // 更新现有会话的最后活跃时间
    const existingSession = sessions[existingSessionIndex];
    if (existingSession) {
      session = existingSession;
      session.lastActiveTime = now;
      session.isActive = true;
    } else {
      // 创建新会话
      session = {
        id: deviceId,
        userId,
        loginTime: now,
        lastActiveTime: now,
        userAgent,
        ipAddress,
        isActive: true
      };
      
      sessions.push(session);
    }
  } else {
    // 创建新会话
    session = {
      id: deviceId,
      userId,
      loginTime: now,
      lastActiveTime: now,
      userAgent,
      ipAddress,
      isActive: true
    };
    
    sessions.push(session);
  }
  
  // 如果启用了设备限制并且超过最大设备数量
  if (config.enabled && config.autoLogout) {
    const activeSessions = sessions.filter(s => s.isActive);
    
    if (activeSessions.length > config.maxDevices) {
      // 按登录时间排序，最早的在前
      const sortedSessions = [...activeSessions].sort((a, b) => a.loginTime - b.loginTime);
      
      // 标记最早的设备为非活跃（真实登出）
      const sessionToLogout = sortedSessions[0];
      if (sessionToLogout) {
        sessionToLogout.isActive = false;
        
        // 更新sessions数组中的对应项
        const indexToLogout = sessions.findIndex(s => s.id === sessionToLogout.id);
        if (indexToLogout >= 0) {
          sessions[indexToLogout] = sessionToLogout;
        }
        
        console.log(`设备 ${sessionToLogout.id} 已自动登出，因为超过最大设备数量限制`);
        
        // 在实际应用中，这里应该调用后端API通知服务器登出该设备
        // 例如：await api.logoutDevice(userId, sessionToLogout.id);
      }
    }
  }
  
  // 保存会话列表
  saveActiveDeviceSessions(userId, sessions);
  
  return session;
};

/**
 * 更新设备会话的最后活跃时间
 * @param userId 用户ID
 * @param deviceId 设备ID
 */
export const updateDeviceSessionActivity = (userId: string, deviceId: string): boolean => {
  const sessions = getActiveDeviceSessions(userId);
  const sessionIndex = sessions.findIndex(session => session.id === deviceId && session.isActive);
  
  if (sessionIndex >= 0) {
    const session = sessions[sessionIndex];
    if (session) {
      session.lastActiveTime = Date.now();
      saveActiveDeviceSessions(userId, sessions);
      return true;
    }
  }
  
  return false;
};

/**
 * 手动登出指定设备
 * @param userId 用户ID
 * @param deviceId 设备ID
 */
export const logoutDevice = (userId: string, deviceId: string): boolean => {
  const sessions = getActiveDeviceSessions(userId);
  const sessionIndex = sessions.findIndex(session => session.id === deviceId);
  
  if (sessionIndex >= 0) {
    const session = sessions[sessionIndex];
    if (session) {
      session.isActive = false;
      saveActiveDeviceSessions(userId, sessions);
      return true;
    }
  }
  
  return false;
};

/**
 * 登出指定用户的所有设备
 * @param userId 用户ID
 */
export const logoutAllDevices = (userId: string): void => {
  const sessions = getActiveDeviceSessions(userId);
  sessions.forEach(session => {
    if (session) {
      session.isActive = false;
    }
  });
  saveActiveDeviceSessions(userId, sessions);
};

/**
 * 获取当前设备的活跃会话
 * @param userId 用户ID
 * @param userAgent 用户代理
 * @param ipAddress IP地址
 */
export const getCurrentDeviceSession = (
  userId: string,
  userAgent: string,
  ipAddress: string
): ActiveDeviceSession | null => {
  const sessions = getActiveDeviceSessions(userId);
  const deviceId = generateDeviceFingerprint(userAgent, ipAddress);
  
  return sessions.find(session => 
    session.id === deviceId && session.isActive
  ) || null;
};

/**
 * 检查当前设备是否被允许登录
 * @param userId 用户ID
 * @param userAgent 用户代理
 * @param ipAddress IP地址
 */
export const isDeviceAllowedToLogin = (
  userId: string,
  userAgent: string,
  ipAddress: string
): { allowed: boolean; message?: string } => {
  const config = getLoginDeviceLimitConfig(userId);
  
  // 如果未启用设备限制，总是允许
  if (!config.enabled) {
    return { allowed: true };
  }
  
  const sessions = getActiveDeviceSessions(userId);
  const activeSessions = sessions.filter(session => session.isActive);
  const deviceId = generateDeviceFingerprint(userAgent, ipAddress);
  
  // 检查当前设备是否已有活跃会话
  const existingSession = activeSessions.find(session => session.id === deviceId);
  if (existingSession) {
    return { allowed: true };
  }
  
  // 检查是否超过最大设备数量
  if (activeSessions.length >= config.maxDevices) {
    if (config.autoLogout) {
      return { 
        allowed: true, 
        message: `已超过最大设备数量限制(${config.maxDevices}台)，最早的设备将被自动登出` 
      };
    } else {
      return { 
        allowed: false, 
        message: `已超过最大设备数量限制(${config.maxDevices}台)，请先登出其他设备` 
      };
    }
  }
  
  return { allowed: true };
};

/**
 * 获取活跃设备数量
 * @param userId 用户ID
 */
export const getActiveDeviceCount = (userId: string): number => {
  const sessions = getActiveDeviceSessions(userId);
  return sessions.filter(session => session.isActive).length;
};

/**
 * 清理过期的设备会话
 * @param userId 用户ID
 * @param maxAge 最大会话年龄（毫秒），默认为7天
 */
export const cleanupExpiredSessions = (userId: string, maxAge: number = 7 * 24 * 60 * 60 * 1000): void => {
  const sessions = getActiveDeviceSessions(userId);
  const now = Date.now();
  const cutoffTime = now - maxAge;
  
  // 过滤掉过期的会话
  const validSessions = sessions.filter(session => session.lastActiveTime > cutoffTime);
  
  // 如果有会话被清理，保存更新后的列表
  if (validSessions.length < sessions.length) {
    saveActiveDeviceSessions(userId, validSessions);
  }
};

/**
 * 获取客户端IP地址
 */
export const getClientIpAddress = async (): Promise<string> => {
  try {
    const response = await apiGetClientIpAddress();
    
    if (response.success && response.data?.ip) {
      return response.data.ip;
    }
    
    return '0.0.0.0';
  } catch (error) {
    console.error('获取客户端IP地址失败:', error);
    return '0.0.0.0';
  }
};

/**
 * 获取用户代理字符串
 */
export const getUserAgent = (): string => {
  return navigator.userAgent;
};

/**
 * 检查当前会话是否仍然有效
 * @param userId 用户ID
 * @param sessionId 会话ID
 */
export const isSessionValid = (userId: string, sessionId: string): boolean => {
  const sessions = getActiveDeviceSessions(userId);
  const session = sessions.find(s => s.id === sessionId);
  
  // 检查会话是否存在且仍然活跃
  if (!session || !session.isActive) {
    return false;
  }
  
  return true;
};

/**
 * 强制登出最早的设备以确保不超过限制
 * @param userId 用户ID
 * @param maxDevices 最大设备数量
 */
export const enforceDeviceLimit = (userId: string, maxDevices: number): void => {
  const sessions = getActiveDeviceSessions(userId);
  const activeSessions = sessions.filter(session => session.isActive);
  
  // 如果活跃设备数量超过限制
  if (activeSessions.length > maxDevices) {
    // 按登录时间排序，最早的在前
    const sortedSessions = [...activeSessions].sort((a, b) => a.loginTime - b.loginTime);
    
    // 计算需要登出的设备数量
    const excessCount = activeSessions.length - maxDevices;
    
    // 登出最早的设备
    for (let i = 0; i < excessCount; i++) {
      const sessionToLogout = sortedSessions[i];
      if (sessionToLogout) {
        sessionToLogout.isActive = false;
        
        // 更新sessions数组中的对应项
        const indexToLogout = sessions.findIndex(s => s.id === sessionToLogout.id);
        if (indexToLogout >= 0) {
          sessions[indexToLogout] = sessionToLogout;
        }
        
        console.log(`设备 ${sessionToLogout.id} 已被强制登出，因为超过最大设备数量限制`);
      }
    }
    
    // 保存更新后的会话列表
    saveActiveDeviceSessions(userId, sessions);
  }
};

export default {
  getDefaultLoginDeviceLimitConfig,
  getLoginDeviceLimitConfig,
  saveLoginDeviceLimitConfig,
  getActiveDeviceSessions,
  saveActiveDeviceSessions,
  recordNewDeviceSession,
  updateDeviceSessionActivity,
  logoutDevice,
  logoutAllDevices,
  getCurrentDeviceSession,
  isDeviceAllowedToLogin,
  getActiveDeviceCount,
  cleanupExpiredSessions,
  getClientIpAddress,
  getUserAgent,
  isSessionValid,
  enforceDeviceLimit
};