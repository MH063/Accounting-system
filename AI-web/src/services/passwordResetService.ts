/**
 * 密码重置服务
 * 提供密码重置相关功能
 */

import { ElMessage } from 'element-plus'
import { hasSecurityQuestions } from './securityQuestionService'

// 用户信息接口
export interface UserInfo {
  id: string
  username: string
  email: string
  phone?: string
}

/**
 * 模拟获取用户信息
 * @param username 用户名
 * @param email 邮箱
 * @returns 用户信息或null
 */
export const getUserInfo = async (username: string, email: string): Promise<UserInfo | null> => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟用户数据库查询
    // 在实际应用中，这里应该调用后端API来验证用户信息
    if (username === 'admin' && email === 'admin@example.com') {
      return {
        id: '1',
        username: 'admin',
        email: 'admin@example.com'
      }
    }
    
    // 添加更多测试用户
    if (username === 'test' && email === 'test@example.com') {
      return {
        id: '2',
        username: 'test',
        email: 'test@example.com'
      }
    }
    
    // 模拟用户不存在的情况
    return null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 发送密码重置验证码
 * @param userInfo 用户信息
 * @returns 是否发送成功
 */
export const sendResetCode = async (userInfo: UserInfo): Promise<boolean> => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟发送验证码到用户邮箱或手机
    console.log(`向用户 ${userInfo.username} 发送密码重置验证码到 ${userInfo.email}`)
    
    // 在实际应用中，这里应该调用后端API发送验证码
    ElMessage.success(`密码重置验证码已发送到您的邮箱 ${userInfo.email}`)
    return true
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码失败，请稍后重试')
    return false
  }
}

/**
 * 验证重置验证码
 * @param userInfo 用户信息
 * @param code 验证码
 * @returns 是否验证成功
 */
export const verifyResetCode = async (userInfo: UserInfo, code: string): Promise<boolean> => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 在实际应用中，这里应该调用后端API验证验证码
    // 简单验证：验证码为6位数字
    if (/^\d{6}$/.test(code)) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('验证验证码失败:', error)
    return false
  }
}

/**
 * 重置密码
 * @param userInfo 用户信息
 * @param newPassword 新密码
 * @returns 是否重置成功
 */
export const resetPassword = async (userInfo: UserInfo, newPassword: string): Promise<boolean> => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 验证密码强度
    if (newPassword.length < 6) {
      ElMessage.error('密码长度不能少于6位')
      return false
    }
    
    // 检查密码复杂度
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      ElMessage.error('密码必须包含字母和数字')
      return false
    }
    
    // 检查新密码是否与旧密码相同
    const oldPassword = localStorage.getItem(`user_password_${userInfo.username}`);
    if (oldPassword && oldPassword === newPassword) {
      ElMessage.error('新密码不能与旧密码相同')
      return false
    }
    
    // 在实际应用中，这里应该调用后端API重置密码
    // 模拟密码重置成功
    console.log(`用户 ${userInfo.username} 的密码已重置`)
    
    // 保存到localStorage（模拟）
    localStorage.setItem(`user_password_${userInfo.username}`, newPassword)
    
    // 记录密码重置日志
    const resetLog = {
      userId: userInfo.id,
      username: userInfo.username,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1' // 模拟IP地址
    };
    localStorage.setItem(`password_reset_log_${userInfo.username}`, JSON.stringify(resetLog));
    
    // 记录安全事件日志
    const securityLog = {
      userId: userInfo.id,
      username: userInfo.username,
      eventType: 'password_reset',
      timestamp: new Date().toISOString(),
      details: 'Password reset successful'
    };
    const securityLogsStr = localStorage.getItem('security_events');
    let securityLogs: any[] = [];
    if (securityLogsStr) {
      securityLogs = JSON.parse(securityLogsStr);
    }
    securityLogs.push(securityLog);
    if (securityLogs.length > 100) {
      securityLogs = securityLogs.slice(-100);
    }
    localStorage.setItem('security_events', JSON.stringify(securityLogs));
    
    ElMessage.success('密码重置成功，请使用新密码登录')
    return true
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error('重置密码失败，请稍后重试')
    return false
  }
}

/**
 * 检查用户是否设置了安全问题
 * @param username 用户名
 * @returns 是否已设置安全问题
 */
export const checkSecurityQuestions = (username: string): boolean => {
  try {
    // 使用安全问题服务检查用户是否设置了安全问题
    return hasSecurityQuestions(username)
  } catch (error) {
    console.error('检查安全问题设置状态失败:', error)
    return false
  }
}

/**
 * 发送密码重置通知
 * @param userInfo 用户信息
 * @param method 通知方式 (email, sms)
 */
export const sendResetNotification = async (userInfo: UserInfo, method: string = 'email'): Promise<void> => {
  try {
    // 模拟发送通知
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (method === 'email') {
      console.log(`密码重置通知已发送到邮箱: ${userInfo.email}`);
      ElMessage.info(`密码重置通知已发送到您的邮箱 ${userInfo.email}`);
    } else if (method === 'sms' && userInfo.phone) {
      console.log(`密码重置通知已发送到手机: ${userInfo.phone}`);
      ElMessage.info(`密码重置通知已发送到您的手机 ${userInfo.phone}`);
    }
  } catch (error) {
    console.error('发送密码重置通知失败:', error);
    ElMessage.error('发送通知失败');
  }
}

export default {
  getUserInfo,
  sendResetCode,
  verifyResetCode,
  resetPassword,
  checkSecurityQuestions,
  sendResetNotification
}