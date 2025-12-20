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
 * 获取用户信息
 * @param username 用户名
 * @param email 邮箱
 * @returns 用户信息或null
 */
export const getUserInfo = async (username: string, email: string): Promise<UserInfo | null> => {
  try {
    // 调用真实的API获取用户信息
    const response = await fetch('/users/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        return data.user;
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null;
  }
}

/**
 * 发送密码重置验证码
 * @param userInfo 用户信息
 * @returns 是否发送成功
 */
export const sendResetCode = async (userInfo: UserInfo): Promise<boolean> => {
  try {
    // 调用真实的API发送验证码
    const response = await fetch('/auth/send-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userInfo.id,
        username: userInfo.username, 
        email: userInfo.email 
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        ElMessage.success(`密码重置验证码已发送到您的邮箱 ${userInfo.email}`);
        return true;
      } else {
        ElMessage.error(data.message || '发送验证码失败');
        return false;
      }
    } else {
      ElMessage.error('发送验证码失败，请稍后重试');
      return false;
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    ElMessage.error('发送验证码时发生错误');
    return false;
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
    // 调用真实的API验证验证码
    const response = await fetch('/auth/verify-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userInfo.id,
        username: userInfo.username, 
        code: code 
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success || false;
    }
    
    return false;
  } catch (error) {
    console.error('验证验证码失败:', error);
    return false;
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
    
    // 调用真实的API重置密码
    const response = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userInfo.id,
        username: userInfo.username, 
        newPassword: newPassword 
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        ElMessage.success('密码重置成功，请使用新密码登录');
        return true;
      } else {
        ElMessage.error(data.message || '密码重置失败');
        return false;
      }
    } else {
      ElMessage.error('密码重置失败，请稍后重试');
      return false;
    }
  } catch (error) {
    console.error('重置密码失败:', error);
    ElMessage.error('重置密码时发生错误');
    return false;
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
    // 调用真实的API发送通知
    const response = await fetch('/auth/send-reset-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: userInfo.id,
        username: userInfo.username, 
        email: userInfo.email,
        phone: userInfo.phone,
        method: method
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        if (method === 'email') {
          ElMessage.info(`密码重置通知已发送到您的邮箱 ${userInfo.email}`);
        } else if (method === 'sms' && userInfo.phone) {
          ElMessage.info(`密码重置通知已发送到您的手机 ${userInfo.phone}`);
        }
      } else {
        ElMessage.error(data.message || '发送通知失败');
      }
    } else {
      ElMessage.error('发送通知失败');
    }
  } catch (error) {
    console.error('发送密码重置通知失败:', error);
    ElMessage.error('发送通知时发生错误');
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