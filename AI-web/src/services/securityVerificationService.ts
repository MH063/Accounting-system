/**
 * 安全验证服务
 * 提供统一的安全问题验证接口
 */

import { hasSecurityQuestions } from './securityQuestionService'
import { request } from '@/utils/request'
import { ElMessage } from 'element-plus'

/**
 * 记录安全验证日志
 * @param operation 操作类型
 * @param verificationType 验证类型（如 'security_question'）
 * @param success 是否成功
 * @param reason 验证原因
 * @returns 是否记录成功
 */
export const logSecurityVerification = async (
  operation: string,
  verificationType: string,
  success: boolean,
  reason?: string
): Promise<boolean> => {
  try {
    console.log('[SecurityVerificationService] 记录安全验证日志', { operation, verificationType, success, reason })
    
    const response = await request<any>('/security-verification/log', {
      method: 'POST',
      data: {
        operation,
        verificationType,
        success,
        reason: reason || null
      }
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data || response;
    const logId = typeof actualData === 'object' ? actualData.logId : actualData;
    
    console.log('[SecurityVerificationService] 安全验证日志记录成功', { logId })
    return true
  } catch (error) {
    console.error('[SecurityVerificationService] 记录安全验证日志失败:', error)
    return false
  }
}

/**
 * 获取用户安全验证日志
 * @param params 查询参数
 * @returns 验证日志列表
 */
export const getSecurityVerificationLogs = async (params?: {
  limit?: number
  offset?: number
  operation?: string
  verificationType?: string
  success?: boolean
}): Promise<any[]> => {
  try {
    console.log('[SecurityVerificationService] 获取安全验证日志', { params })
    
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.operation) queryParams.append('operation', params.operation)
    if (params?.verificationType) queryParams.append('verificationType', params.verificationType)
    if (params?.success !== undefined) queryParams.append('success', params.success.toString())
    
    const response = await request<any>(`/security-verification/logs?${queryParams.toString()}`, {
      method: 'GET'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data || response;
    const logs = actualData.logs || (Array.isArray(actualData) ? actualData : []);
    
    console.log('[SecurityVerificationService] 获取安全验证日志成功', { count: logs.length })
    return logs
  } catch (error) {
    console.error('[SecurityVerificationService] 获取安全验证日志失败:', error)
    return []
  }
}

export default {
  logSecurityVerification,
  getSecurityVerificationLogs
}