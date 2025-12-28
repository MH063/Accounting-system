import { DeviceInfo, getKnownDevices, saveKnownDevices, generateDeviceFingerprint } from './accountSecurityService';
import { getClientIpAddress as apiGetClientIpAddress } from './authService';
import { request } from '@/utils/request';
import type { ApiResponse } from '@/types';

// 登录设备限制配置
export interface LoginDeviceLimitConfig {
  maxDevices: number; // 最大设备数量
  autoLogout: boolean; // 是否启用自动登出最早设备
  enabled: boolean; // 是否启用设备限制功能
}

// 当前登录设备会话信息
export interface ActiveDeviceSession {
  id: string | number; // 设备ID
  userId?: string | number; // 用户ID
  loginTime?: number | string; // 登录时间
  lastActiveTime?: number | string; // 最后活跃时间
  userAgent: string; // 用户代理
  ipAddress: string; // IP地址
  isActive: boolean; // 是否活跃
  deviceInfo?: any; // 设备详细信息
  isCurrent?: boolean; // 是否为当前设备
  createdAt?: string; // 创建时间
  expiresAt?: string; // 过期时间
}

/**
 * 获取后端所有的活跃设备会话
 */
export const getBackendDeviceSessionsAPI = async (): Promise<ApiResponse<{ sessions: ActiveDeviceSession[], count: number }>> => {
  try {
    const response = await request<any>('/device-sessions', {
      method: 'GET'
    });
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data;
    
    return {
      ...response,
      data: actualData
    };
  } catch (error) {
    console.error('获取后端设备会话失败:', error);
    return {
      success: false,
      message: '获取后端设备会话失败',
      data: { sessions: [], count: 0 }
    };
  }
};

/**
 * 撤销指定的后端设备会话
 * @param sessionId 会话ID
 */
export const revokeBackendDeviceSessionAPI = async (sessionId: string | number): Promise<ApiResponse<null>> => {
  try {
    return await request<null>(`/device-sessions/${sessionId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('撤销后端设备会话失败:', error);
    return {
      success: false,
      message: '撤销后端设备会话失败'
    };
  }
};

/**
 * 撤销除当前会话外的所有后端设备会话
 */
export const revokeOtherBackendDeviceSessionsAPI = async (): Promise<ApiResponse<{ revokedCount: number }>> => {
  try {
    return await request<{ revokedCount: number }>('/device-sessions/other', {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('撤销其他后端设备会话失败:', error);
    return {
      success: false,
      message: '撤销其他后端设备会话失败'
    };
  }
};

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
    // 将同一IP地址的算作一个设备
    const activeIps = new Set(activeSessions.map(s => s.ipAddress));
    
    if (activeIps.size > config.maxDevices) {
      // 获取所有活跃IP，并按该IP下最早的登录时间排序
      const ipLoginTimes: Record<string, number> = {};
      activeSessions.forEach(s => {
        if (!ipLoginTimes[s.ipAddress] || (typeof s.loginTime === 'number' && s.loginTime < ipLoginTimes[s.ipAddress])) {
          ipLoginTimes[s.ipAddress] = typeof s.loginTime === 'number' ? s.loginTime : Date.now();
        }
      });
      
      const sortedIps = Array.from(activeIps).sort((a, b) => ipLoginTimes[a] - ipLoginTimes[b]);
      
      // 标记最早IP下的所有会话为非活跃
      const ipToLogout = sortedIps[0];
      if (ipToLogout) {
        sessions.forEach(s => {
          if (s.ipAddress === ipToLogout) {
            s.isActive = false;
          }
        });
        
        console.log(`IP ${ipToLogout} 下的所有设备已自动登出，因为超过最大设备数量限制`);
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
  
  // 检查当前设备或当前IP是否已有活跃会话
  const existingSession = activeSessions.find(session => 
    session.id === deviceId || session.ipAddress === ipAddress
  );
  if (existingSession) {
    return { allowed: true };
  }
  
  // 将同一IP地址的算作一个设备
  const activeIps = new Set(activeSessions.map(s => s.ipAddress));
  
  // 检查是否超过最大设备数量
  if (activeIps.size >= config.maxDevices) {
    if (config.autoLogout) {
      return { 
        allowed: true, 
        message: `已超过最大设备数量限制(${config.maxDevices}个IP地址)，最早的IP设备将被自动登出` 
      };
    } else {
      return { 
        allowed: false, 
        message: `已超过最大设备数量限制(${config.maxDevices}个IP地址)，请先登出其他设备的IP` 
      };
    }
  }
  
  return { allowed: true };
};

/**
 * 获取活跃设备数量（以唯一IP计算）
 * @param userId 用户ID
 */
export const getActiveDeviceCount = (userId: string): number => {
  const sessions = getActiveDeviceSessions(userId);
  const activeSessions = sessions.filter(session => session.isActive);
  const activeIps = new Set(activeSessions.map(s => s.ipAddress));
  return activeIps.size;
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
 * 强制登出最早的设备以确保不超过限制（以唯一IP计算）
 * @param userId 用户ID
 * @param maxDevices 最大设备数量
 */
export const enforceDeviceLimit = (userId: string, maxDevices: number): void => {
  const sessions = getActiveDeviceSessions(userId);
  const activeSessions = sessions.filter(session => session.isActive);
  const activeIps = new Set(activeSessions.map(s => s.ipAddress));
  
  // 如果活跃IP数量超过限制
  if (activeIps.size > maxDevices) {
    // 获取所有活跃IP，并按该IP下最早的登录时间排序
    const ipLoginTimes: Record<string, number> = {};
    activeSessions.forEach(s => {
      if (!ipLoginTimes[s.ipAddress] || (typeof s.loginTime === 'number' && s.loginTime < ipLoginTimes[s.ipAddress])) {
        ipLoginTimes[s.ipAddress] = typeof s.loginTime === 'number' ? s.loginTime : Date.now();
      }
    });
    
    const sortedIps = Array.from(activeIps).sort((a, b) => ipLoginTimes[a] - ipLoginTimes[b]);
    
    // 计算需要登出的IP数量
    const excessCount = activeIps.size - maxDevices;
    
    // 登出最早的IP及其下的所有会话
    for (let i = 0; i < excessCount; i++) {
      const ipToLogout = sortedIps[i];
      if (ipToLogout) {
        sessions.forEach(s => {
          if (s.ipAddress === ipToLogout) {
            s.isActive = false;
          }
        });
        
        console.log(`IP ${ipToLogout} 下的所有设备已被强制登出，因为超过最大设备数量限制`);
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