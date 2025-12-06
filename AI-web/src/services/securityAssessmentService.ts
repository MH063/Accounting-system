/**
 * 安全评估服务
 * 负责评估账户安全等级并提供改进建议
 */

import { logSecurityAssessment } from './securityAssessmentHistoryService';

interface SecurityFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  recommendation: string;
}

export interface SecurityAssessmentResult {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: SecurityFactor[];
  recommendations: string[];
}

/**
 * 执行安全评估
 * @param userId 用户ID
 * @returns 安全评估结果
 */
export const performSecurityAssessment = (userId: string): SecurityAssessmentResult => {
  // 获取各种安全因素的评估
  const factors: SecurityFactor[] = [
    getPasswordStrengthFactor(userId),
    getTwoFactorFactor(userId),
    getDataEncryptionFactor(userId),
    getLoginProtectionFactor(userId),
    getAbnormalLoginAlertFactor(userId),
    getSecurityQuestionFactor(userId),
    getDeviceManagementFactor(userId),
    getSessionTimeoutFactor(userId),
    getRecentLoginActivityFactor(userId),
    getPasswordLastChangedFactor(userId),
    getBiometricAuthFactor(userId),
    getBackupMethodFactor(userId),
    getAccountActivityFrequencyFactor(userId),
    getSecurityUpdateFactor(userId)
  ];  // 计算总体分数
  let totalScore = 0;
  let totalWeight = 0;
  
  factors.forEach(factor => {
    totalScore += factor.score * factor.weight;
    totalWeight += factor.weight;
  });
  
  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 100;
  
  // 确定风险等级
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (overallScore < 70) {
    riskLevel = 'high';
  } else if (overallScore < 90) {
    riskLevel = 'medium';
  }
  
  // 收集改进建议
  const recommendations = factors
    .filter(factor => factor.score < 80)
    .map(factor => factor.recommendation);
  
  // 记录评估历史
  logSecurityAssessment({
    userId,
    overallScore,
    riskLevel,
    factors: factors.map(factor => ({
      name: factor.name,
      score: factor.score,
      description: factor.description
    }))
  });
  
  // 返回评估结果
  return {
    overallScore,
    riskLevel,
    factors,
    recommendations
  };};

/**
 * 获取密码强度因素
 */
const getPasswordStrengthFactor = (userId: string): SecurityFactor => {
  // 模拟获取密码强度（实际应用中应从用户数据中获取）
  const passwordStrength = getPasswordStrengthFromStorage(userId);
  
  let score = 0;
  let description = '';
  let recommendation = '';
  
  switch (passwordStrength) {
    case 'strong':
      score = 100;
      description = '密码强度很强';
      recommendation = '继续保持使用强密码的好习惯';
      break;
    case 'medium':
      score = 70;
      description = '密码强度中等';
      recommendation = '建议使用更复杂的密码，包含大小写字母、数字和特殊字符';
      break;
    case 'weak':
      score = 40;
      description = '密码强度较弱';
      recommendation = '密码过于简单，容易被破解，请立即修改为强密码';
      break;
    default:
      score = 60;
      description = '密码强度一般';
      recommendation = '建议定期更换密码并使用复杂密码';
  }
  
  return {
    name: '密码强度',
    weight: 20,
    score,
    description,
    recommendation
  };
};

/**
 * 获取两步验证因素
 */
const getTwoFactorFactor = (userId: string): SecurityFactor => {
  // 模拟检查两步验证是否启用（实际应用中应从用户数据中获取）
  const twoFactorEnabled = getTwoFactorStatusFromStorage(userId);
  
  if (twoFactorEnabled) {
    return {
      name: '两步验证',
      weight: 15,
      score: 100,
      description: '已启用两步验证',
      recommendation: '继续保持使用两步验证的好习惯'
    };
  } else {
    return {
      name: '两步验证',
      weight: 15,
      score: 30,
      description: '未启用两步验证',
      recommendation: '强烈建议启用两步验证以增强账户安全性'
    };
  }
};

/**
 * 获取数据加密因素
 */
const getDataEncryptionFactor = (userId: string): SecurityFactor => {
  // 模拟检查数据加密是否启用（实际应用中应从用户数据中获取）
  const dataEncryptionEnabled = getDataEncryptionStatusFromStorage(userId);
  
  if (dataEncryptionEnabled) {
    return {
      name: '数据加密',
      weight: 15,
      score: 100,
      description: '已启用端到端数据加密',
      recommendation: '继续保持使用数据加密的好习惯'
    };
  } else {
    return {
      name: '数据加密',
      weight: 15,
      score: 20,
      description: '未启用数据加密',
      recommendation: '强烈建议启用数据加密以保护敏感信息'
    };
  }
};

/**
 * 获取登录保护因素
 */
const getLoginProtectionFactor = (userId: string): SecurityFactor => {
  // 模拟检查登录保护是否启用（实际应用中应从用户数据中获取）
  const loginProtectionEnabled = getLoginProtectionStatusFromStorage(userId);
  
  if (loginProtectionEnabled) {
    return {
      name: '登录保护',
      weight: 10,
      score: 100,
      description: '已启用登录保护',
      recommendation: '继续保持使用登录保护的好习惯'
    };
  } else {
    return {
      name: '登录保护',
      weight: 10,
      score: 40,
      description: '未启用登录保护',
      recommendation: '建议启用登录保护以防止未授权访问'
    };
  }
};

/**
 * 获取异常登录提醒因素
 */
const getAbnormalLoginAlertFactor = (userId: string): SecurityFactor => {
  // 模拟检查异常登录提醒是否启用（实际应用中应从用户数据中获取）
  const abnormalLoginAlertEnabled = getAbnormalLoginAlertStatusFromStorage(userId);
  
  if (abnormalLoginAlertEnabled) {
    return {
      name: '异常登录提醒',
      weight: 10,
      score: 100,
      description: '已启用异常登录提醒',
      recommendation: '继续保持使用异常登录提醒的好习惯'
    };
  } else {
    return {
      name: '异常登录提醒',
      weight: 10,
      score: 50,
      description: '未启用异常登录提醒',
      recommendation: '建议启用异常登录提醒以及时发现可疑活动'
    };
  }
};

/**
 * 获取安全问题因素
 */
const getSecurityQuestionFactor = (userId: string): SecurityFactor => {
  // 模拟检查安全问题是否设置（实际应用中应从用户数据中获取）
  const securityQuestionsSet = getSecurityQuestionsStatusFromStorage(userId);
  
  if (securityQuestionsSet) {
    return {
      name: '安全问题',
      weight: 10,
      score: 100,
      description: '已设置安全问题',
      recommendation: '继续保持使用安全问题的好习惯'
    };
  } else {
    return {
      name: '安全问题',
      weight: 10,
      score: 30,
      description: '未设置安全问题',
      recommendation: '建议设置安全问题以增强账户恢复能力'
    };
  }
};

/**
 * 获取设备管理因素
 */
const getDeviceManagementFactor = (userId: string): SecurityFactor => {
  // 模拟检查设备管理情况（实际应用中应从用户数据中获取）
  const activeDevices = getActiveDevicesCountFromStorage(userId);
  const maxDevices = getMaxDevicesFromStorage(userId);
  
  let score = 100;
  let description = '设备管理良好';
  let recommendation = '设备管理状况良好';
  
  if (activeDevices > maxDevices * 0.8) {
    score = 60;
    description = `活跃设备较多(${activeDevices}台)`;
    recommendation = '建议定期清理不常用的设备会话';
  } else if (activeDevices > maxDevices * 0.5) {
    score = 80;
    description = `活跃设备适中(${activeDevices}台)`;
    recommendation = '设备管理状况良好，可定期检查设备列表';
  }
  
  return {
    name: '设备管理',
    weight: 10,
    score,
    description,
    recommendation
  };
};

/**
 * 获取会话超时因素
 */
const getSessionTimeoutFactor = (userId: string): SecurityFactor => {
  // 模拟检查会话超时设置（实际应用中应从用户数据中获取）
  const sessionTimeout = getSessionTimeoutFromStorage(userId);
  
  let score = 100;
  let description = '会话超时设置合理';
  let recommendation = '会话超时设置合理';
  
  if (sessionTimeout > 60) {
    score = 60;
    description = `会话超时时间较长(${sessionTimeout}分钟)`;
    recommendation = '建议缩短会话超时时间以增强安全性';
  } else if (sessionTimeout > 30) {
    score = 80;
    description = `会话超时时间适中(${sessionTimeout}分钟)`;
    recommendation = '会话超时设置较为合理';
  }
  
  return {
    name: '会话超时',
    weight: 10,
    score,
    description,
    recommendation
  };
};

/**
 * 获取近期登录活动因素
 */
const getRecentLoginActivityFactor = (userId: string): SecurityFactor => {
  // 模拟检查近期登录活动（实际应用中应从用户数据中获取）
  const lastLoginDaysAgo = getLastLoginDaysAgoFromStorage(userId);
  
  let score = 100;
  let description = '近期登录活动正常';
  let recommendation = '继续保持良好的登录习惯';
  
  if (lastLoginDaysAgo > 30) {
    score = 50;
    description = `账户长时间未登录(${lastLoginDaysAgo}天前)`;
    recommendation = '建议定期登录账户以确保账户活跃性';
  } else if (lastLoginDaysAgo > 7) {
    score = 80;
    description = `账户近期有登录(${lastLoginDaysAgo}天前)`;
    recommendation = '建议保持定期登录以维持账户活跃性';
  }
  
  return {
    name: '登录活跃度',
    weight: 8,
    score,
    description,
    recommendation
  };
};

/**
 * 获取密码最近修改因素
 */
const getPasswordLastChangedFactor = (userId: string): SecurityFactor => {
  // 模拟检查密码最近修改时间（实际应用中应从用户数据中获取）
  const daysSinceLastChange = getPasswordLastChangedDaysFromStorage(userId);
  
  let score = 100;
  let description = '密码更新及时';
  let recommendation = '继续保持定期更新密码的好习惯';
  
  if (daysSinceLastChange > 365) {
    score = 40;
    description = `密码长期未更新(${daysSinceLastChange}天前)`;
    recommendation = '强烈建议立即更改密码，以提高账户安全性';
  } else if (daysSinceLastChange > 180) {
    score = 70;
    description = `密码较长时间未更新(${daysSinceLastChange}天前)`;
    recommendation = '建议在适当时候更新密码';
  }
  
  return {
    name: '密码更新频率',
    weight: 8,
    score,
    description,
    recommendation
  };
};

/**
 * 获取生物识别认证因素
 */
const getBiometricAuthFactor = (userId: string): SecurityFactor => {
  // 模拟检查生物识别认证是否启用（实际应用中应从用户数据中获取）
  const biometricAuthEnabled = getBiometricAuthStatusFromStorage(userId);
  
  if (biometricAuthEnabled) {
    return {
      name: '生物识别认证',
      weight: 7,
      score: 100,
      description: '已启用生物识别认证',
      recommendation: '继续保持使用生物识别认证的好习惯'
    };
  } else {
    return {
      name: '生物识别认证',
      weight: 7,
      score: 50,
      description: '未启用生物识别认证',
      recommendation: '建议启用生物识别认证以增强账户安全性'
    };
  }
};

/**
 * 获取备用验证方法因素
 */
const getBackupMethodFactor = (userId: string): SecurityFactor => {
  // 模拟检查是否有备用验证方法（实际应用中应从用户数据中获取）
  const hasBackupMethods = getBackupMethodStatusFromStorage(userId);
  
  if (hasBackupMethods) {
    return {
      name: '备用验证方法',
      weight: 6,
      score: 100,
      description: '已设置备用验证方法',
      recommendation: '继续保持设置备用验证方法的好习惯'
    };
  } else {
    return {
      name: '备用验证方法',
      weight: 6,
      score: 40,
      description: '未设置备用验证方法',
      recommendation: '建议设置备用验证方法以防主要验证方式失效'
    };
  }
};

/**
 * 获取账户活动频率因素
 */
const getAccountActivityFrequencyFactor = (userId: string): SecurityFactor => {
  // 模拟检查账户活动频率（实际应用中应从用户数据中获取）
  const activityFrequency = getAccountActivityFrequencyFromStorage(userId);
  
  let score = 100;
  let description = '账户活动频率正常';
  let recommendation = '继续保持良好的账户使用习惯';
  
  if (activityFrequency < 1) {
    score = 60;
    description = '账户活动较少';
    recommendation = '建议定期使用账户以保持活跃状态';
  } else if (activityFrequency > 50) {
    score = 70;
    description = '账户活动频繁';
    recommendation = '注意账户安全，避免在不安全的环境中频繁操作';
  }
  
  return {
    name: '账户活动频率',
    weight: 5,
    score,
    description,
    recommendation
  };
};

/**
 * 获取安全更新因素
 */
const getSecurityUpdateFactor = (userId: string): SecurityFactor => {
  // 模拟检查是否及时更新安全设置（实际应用中应从用户数据中获取）
  const securityUpdateStatus = getSecurityUpdateStatusFromStorage(userId);
  
  if (securityUpdateStatus) {
    return {
      name: '安全更新',
      weight: 5,
      score: 100,
      description: '已及时更新安全设置',
      recommendation: '继续保持及时更新安全设置的好习惯'
    };
  } else {
    return {
      name: '安全更新',
      weight: 5,
      score: 50,
      description: '安全设置更新不及时',
      recommendation: '建议定期检查并更新安全设置'
    };
  }
};

// 模拟从存储中获取数据的辅助函数
const getPasswordStrengthFromStorage = (userId: string): string => {
  // 实际应用中应从用户数据中获取真实密码强度
  const strength = localStorage.getItem(`password_strength_${userId}`);
  return strength || 'medium';
};

const getTwoFactorStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem(`two_factor_enabled_${userId}`) === 'true';
};

const getDataEncryptionStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem(`data_encryption_enabled_${userId}`) === 'true';
};

const getLoginProtectionStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem('loginProtectionEnabled') === 'true';
};

const getAbnormalLoginAlertStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem('abnormalLoginAlert') === 'true';
};

const getSecurityQuestionsStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem(`security_questions_set_${userId}`) === 'true';
};

const getActiveDevicesCountFromStorage = (userId: string): number => {
  // 实际应用中应从用户数据中获取真实数据
  const count = localStorage.getItem(`active_devices_count_${userId}`);
  return count ? parseInt(count, 10) : 3;
};

const getMaxDevicesFromStorage = (userId: string): number => {
  // 实际应用中应从用户数据中获取真实数据
  const max = localStorage.getItem(`max_devices_${userId}`);
  return max ? parseInt(max, 10) : 5;
};

const getSessionTimeoutFromStorage = (userId: string): number => {
  // 实际应用中应从用户数据中获取真实数据
  const timeout = localStorage.getItem(`session_timeout_${userId}`);
  return timeout ? parseInt(timeout, 10) : 30;
};

const getLastLoginDaysAgoFromStorage = (userId: string): number => {
  // 实际应用中应从用户数据中获取真实数据
  const days = localStorage.getItem(`last_login_days_ago_${userId}`);
  return days ? parseInt(days, 10) : 1;
};

const getPasswordLastChangedDaysFromStorage = (userId: string): number => {
  // 实际应用中应从用户数据中获取真实数据
  const days = localStorage.getItem(`password_last_changed_days_${userId}`);
  return days ? parseInt(days, 10) : 30;
};

const getBiometricAuthStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem(`biometric_auth_enabled_${userId}`) === 'true';
};

const getBackupMethodStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem(`backup_method_set_${userId}`) === 'true';
};

const getAccountActivityFrequencyFromStorage = (userId: string): number => {
  // 实际应用中应从用户数据中获取真实数据
  const frequency = localStorage.getItem(`account_activity_frequency_${userId}`);
  return frequency ? parseInt(frequency, 10) : 10;
};

const getSecurityUpdateStatusFromStorage = (userId: string): boolean => {
  // 实际应用中应从用户数据中获取真实状态
  return localStorage.getItem(`security_update_status_${userId}`) === 'true';
};

export default {
  performSecurityAssessment
};