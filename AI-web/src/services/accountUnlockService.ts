import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

/**
 * 解锁账户
 * @param accountId 账户ID
 * @returns 解锁结果
 */
export const unlockAccountAPI = async (accountId: string): Promise<ApiResponse<boolean>> => {
  try {
    console.log('解锁账户:', accountId)
    
    // 调用真实API解锁账户
    const response = await request<boolean>(`/accounts/${accountId}/unlock`, {
      method: 'POST'
    })
    
    return {
      success: true,
      data: response,
      message: '账户解锁成功'
    }
  } catch (error) {
    console.error('解锁账户失败:', error)
    return {
      success: false,
      data: false,
      message: '账户解锁失败: ' + (error as Error).message
    }
  }
}

// 导出默认实例
export default {
  unlockAccountAPI
}