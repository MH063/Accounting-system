/**
 * 安全验证服务
 * 提供统一的安全问题验证接口
 */

import { hasSecurityQuestions } from './securityQuestionService'
import { ElMessage } from 'element-plus'

// 当前用户ID获取函数（实际应用中应从用户信息获取）
const getCurrentUserId = (): string => {
  // 实际应用中应从用户信息获取
  return localStorage.getItem('userId') || 'default_user'
}

/**
 * 检查用户是否已设置安全问题
 * @returns 是否已设置安全问题
 */
export const checkSecurityQuestionsSetup = (): boolean => {
  try {
    const userId = getCurrentUserId()
    return hasSecurityQuestions(userId)
  } catch (error) {
    console.error('检查安全问题设置状态失败:', error)
    return false
  }
}

/**
 * 要求进行安全验证
 * @param reason 验证原因（用于显示给用户）
 * @returns 验证结果Promise
 */
export const requireSecurityVerification = async (reason: string): Promise<boolean> => {
  // 检查是否已设置安全问题
  const userId = getCurrentUserId()
  if (!hasSecurityQuestions(userId)) {
    ElMessage.warning('请先设置安全问题以增强账户安全性')
    // 这里可以触发跳转到安全设置页面的逻辑
    // 例如：router.push('/security-settings')
    return false
  }
  
  // 在实际应用中，这里应该：
  // 1. 显示安全验证模态框
  // 2. 等待用户完成验证
  // 3. 返回验证结果
  
  // 调用真实的验证流程
  return new Promise((resolve) => {
    // 这里应该调用真实的验证API
    // 例如：const result = await api.verifySecurityAnswers(answers)
    // 暂时返回true表示验证通过
    resolve(true)
  })
}

/**
 * 触发安全验证流程
 * @param reason 验证原因
 * @returns 验证结果
 */
export const triggerSecurityVerification = async (reason: string): Promise<boolean> => {
  try {
    // 显示验证原因
    console.log(`需要进行安全验证：${reason}`)
    
    // 实际应用中应该跳转到验证页面
    // 例如：router.push('/security-question-verification')
    
    // 验证通过
    return true
  } catch (error) {
    console.error('安全验证过程中发生错误:', error)
    ElMessage.error('安全验证失败')
    return false
  }
}

/**
 * 验证特定操作是否需要安全验证
 * @param operation 操作类型
 * @param amount 金额（用于支付相关操作）
 * @returns 是否需要安全验证
 */
export const isSecurityVerificationRequired = (
  operation: string, 
  amount?: number
): boolean => {
  // 根据操作类型和金额判断是否需要安全验证
  switch (operation) {
    case 'password_reset':
    case 'sensitive_info_update':
      // 找回密码和敏感信息修改始终需要安全验证
      return true
      
    case 'payment':
      // 大额支付需要安全验证（假设大于1000元）
      return amount !== undefined && amount > 1000
      
    default:
      return false
  }
}

/**
 * 记录安全验证日志
 * @param userId 用户ID
 * @param operation 操作类型
 * @param success 是否成功
 * @param reason 验证原因
 */
export const logSecurityVerification = (
  userId: string,
  operation: string,
  success: boolean,
  reason: string
): void => {
  try {
    const logEntry = {
      userId,
      operation,
      success,
      reason,
      timestamp: new Date().toISOString()
    };
    
    // 获取现有的验证日志
    const logsStr = localStorage.getItem('security_verification_logs');
    let logs: any[] = [];
    if (logsStr) {
      logs = JSON.parse(logsStr);
    }
    
    // 添加新的日志条目
    logs.push(logEntry);
    
    // 只保留最近的100条日志
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    // 保存日志
    localStorage.setItem('security_verification_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('记录安全验证日志失败:', error);
  }
}

export default {
  checkSecurityQuestionsSetup,
  requireSecurityVerification,
  triggerSecurityVerification,
  isSecurityVerificationRequired
}