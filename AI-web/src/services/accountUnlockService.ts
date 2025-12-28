import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

/**
 * 解锁账户
 * @param accountId 账户ID
 * @returns 解锁结果
 */
export const unlockAccountAPI = async (accountId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('解锁账户:', accountId)
    
    // 调用真实API解锁账户
    const response = await request<ApiResponse<any>>(`/accounts/${accountId}/unlock`, {
      method: 'POST'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const actualData = (response.data as any)?.data || response.data;
      return {
        ...response,
        data: actualData
      };
    }
    
    return response
  } catch (error) {
    console.error('解锁账户失败:', error)
    return {
      success: false,
      data: null,
      message: '账户解锁失败: ' + (error as Error).message
    }
  }
}

/**
 * 锁定账户
 * @param accountId 账户ID
 * @param duration 锁定时长（分钟）
 * @returns 锁定结果
 */
export const lockAccountAPI = async (accountId: string, duration: number = 30): Promise<ApiResponse<any>> => {
  try {
    console.log('锁定账户:', accountId, '时长:', duration)
    
    // 调用真实API锁定账户
    const response = await request<ApiResponse<any>>(`/accounts/${accountId}/lock`, {
      method: 'POST',
      data: { lockDuration: duration }
    })
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const actualData = (response.data as any)?.data || response.data;
      return {
        ...response,
        data: actualData
      };
    }
    
    return response
  } catch (error) {
    console.error('锁定账户失败:', error)
    return {
      success: false,
      data: null,
      message: '账户锁定失败: ' + (error as Error).message
    }
  }
}

/**
 * 获取账户状态
 * @param accountId 账户ID
 * @returns 账户状态
 */
export const getAccountStatusAPI = async (accountId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('获取账户状态:', accountId)
    
    // 调用真实API获取账户状态
    const response = await request<ApiResponse<any>>(`/accounts/${accountId}/status`, {
      method: 'GET'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    if (response && response.success) {
      const actualData = (response.data as any)?.data || response.data;
      return {
        ...response,
        data: actualData
      };
    }
    
    return response
  } catch (error) {
    console.error('获取账户状态失败:', error)
    return {
      success: false,
      data: null,
      message: '获取账户状态失败: ' + (error as Error).message
    }
  }
}

// 导出默认实例
export default {
  unlockAccountAPI,
  lockAccountAPI,
  getAccountStatusAPI
}