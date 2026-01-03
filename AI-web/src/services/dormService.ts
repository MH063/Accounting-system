import { request } from '@/utils/request'
import type { ApiResponse } from '@/types'

/**
 * 寝室设置服务
 */
export interface DormSettings {
  basic?: {
    name: string
    description?: string
    maxCapacity?: number
    currentCapacity?: number
    adminId?: number
  }
  notifications?: {
    methods: string[]
    quietStart?: string
    quietEnd?: string
  }
  billing?: {
    cycle: string
    dueDay: number
    publicItems?: string[]
  }
}

export interface UpdateDormSettingsRequest {
  type: 'basic' | 'billing' | 'notification'
  data: any
}

export class DormService {
  /**
   * 获取寝室列表
   */
  async getDormitoryList(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    try {
      const response = await request<any>(`/dorms`, {
        method: 'GET',
        params
      })
      
      // 处理后端返回的双层嵌套结构
      const responseData = response.data?.data || response.data || null
      
      return {
        success: response.success,
        data: responseData,
        message: response.message || '获取成功',
        code: response.code || 200
      }
    } catch (error: any) {
      console.error('获取寝室列表失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '获取寝室列表失败'
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = `服务器错误: ${error.response.status}`
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        code: error.status || 500
      }
    }
  }

  /**
   * 获取单个寝室详情
   */
  async getDormitoryDetail(dormId: string | number): Promise<ApiResponse<any>> {
    try {
      // 验证参数
      if (!dormId) {
        return {
          success: false,
          data: null,
          message: '寝室ID不能为空',
          code: 400
        }
      }
      
      // 修正：直接调用 /dorms/${dormId} 而不是 /dorms/${dormId}/detail
      const response = await request<any>(`/dorms/${dormId}`)
      
      // 处理后端返回的双层嵌套结构
      const responseData = response.data?.data || response.data || null
      
      return {
        success: response.success,
        data: responseData,
        message: response.message || '获取成功',
        code: response.code || 200
      }
    } catch (error: any) {
      console.error('获取寝室详情失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '获取寝室详情失败'
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = `服务器错误: ${error.response.status}`
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        code: error.status || 500
      }
    }
  }

  /**
   * 获取单个寝室详情（别名，兼容 getDormDetail 调用）
   */
  async getDormDetail(dormId: string | number): Promise<ApiResponse<any>> {
    return this.getDormitoryDetail(dormId)
  }

  /**
   * 更新寝室信息
   */
  async updateDormInfo(dormId: string | number, dormData: any): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}`, {
        method: 'PUT',
        data: dormData
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '更新成功'
      }
    } catch (error: any) {
      console.error('更新寝室信息失败:', error)
      return {
        success: false,
        data: false,
        message: error.message || '更新失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室成员列表
   */
  async getDormMembers(dormId: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<ApiResponse<any>> {
    try {
      // 验证参数
      if (!dormId) {
        return {
          success: false,
          data: null,
          message: '寝室ID不能为空',
          code: 400
        }
      }
      
      const response = await request<any>(`/dorms/${dormId}/members`, {
        params
      })
      
      // 处理后端返回的双层嵌套结构
      const responseData = response.data?.data || response.data || null
      
      return {
        success: response.success,
        data: responseData,
        message: response.message || '获取成功',
        code: response.code || 200
      }
    } catch (error: any) {
      console.error('获取寝室成员列表失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '获取寝室成员列表失败'
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = `服务器错误: ${error.response.status}`
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        code: error.status || 500
      }
    }
  }

  /**
   * 获取寝室设置
   */
  async getDormSettings(dormId: string): Promise<ApiResponse<DormSettings>> {
    try {
      console.log('获取寝室设置:', dormId)
      
      // 验证参数
      if (!dormId) {
        return {
          success: false,
          data: null,
          message: '寝室ID不能为空',
          code: 400
        }
      }
      
      // 调用真实API获取寝室设置
      const response = await request<any>(`/dorms/${dormId}/settings`)
      
      // 处理后端返回的双层嵌套结构
      // 根据规则，后端返回的数据结构是 {success: true, data: {xxx: []}}
      const responseData = response.data?.data || response.data || null
      
      return {
        success: response.success,
        data: responseData,
        message: response.message || '获取寝室设置成功',
        code: response.code || 200
      }
    } catch (error: any) {
      console.error('获取寝室设置失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '获取寝室设置失败'
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = `服务器错误: ${error.response.status}`
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        code: error.status || 500
      }
    }
  }

  /**
   * 更新寝室设置
   */
  async updateDormSettings(dormId: string, settings: UpdateDormSettingsRequest | DormSettings): Promise<ApiResponse<boolean>> {
    try {
      console.log('更新寝室设置:', dormId, settings)
      
      // 验证参数
      if (!dormId) {
        return {
          success: false,
          data: false,
          message: '寝室ID不能为空',
          code: 400
        }
      }
      
      // 转换数据格式，适配后端接口
      let requestData = {};
      if ('type' in settings && 'data' in settings) {
        // 前端页面传递的格式：{type: 'basic', data: {...}}
        if (settings.type === 'basic') {
          requestData = { basic: settings.data };
        } else if (settings.type === 'billing') {
          requestData = { billing: settings.data };
        } else if (settings.type === 'notification') {
          requestData = { notifications: settings.data };
        }
      } else {
        // 直接传递的格式：{basic: {...}, notifications: {...}}
        requestData = settings;
      }
      
      console.log('转换后的数据格式:', requestData)
      
      // 调用真实API更新设置
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/settings/update`, {
        method: 'PUT',
        data: requestData
      })
      
      // 处理后端返回的双层嵌套结构
      const success = response.success;
      const message = response.message || '设置更新成功';
      
      return {
        success: success,
        data: success,
        message: message
      }
    } catch (error: any) {
      console.error('更新寝室设置失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '更新寝室设置失败'
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = `服务器错误: ${error.response.status}`
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        data: false,
        message: errorMessage,
        code: error.status || 500
      }
    }
  }

  /**
   * 加入寝室
   */
  async joinDorm(dormId: string, joinData: { name: string; phone: string; appliedRoom?: string }): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/join`, {
        method: 'POST',
        data: joinData
      })
      return {
        success: response.success,
        data: response.success,
        message: response.message || '加入寝室成功'
      }
    } catch (error) {
      console.error('加入寝室失败:', error)
      return {
        success: false,
        data: false,
        message: '加入寝室失败',
        code: 500
      }
    }
  }

  /**
   * 退出寝室
   */
  async leaveDorm(dormId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/leave`, {
        method: 'POST'
      })
      return {
        success: response.success,
        data: response.success,
        message: response.message || '退出寝室成功'
      }
    } catch (error) {
      console.error('退出寝室失败:', error)
      return {
        success: false,
        data: false,
        message: '退出寝室失败',
        code: 500
      }
    }
  }

  /**
   * 创建寝室
   */
  async createDorm(dormData: {
    name: string
    description?: string
    maxCapacity?: number
    adminId?: number
    initialMembers?: { name: string; phone: string }[]
  }): Promise<ApiResponse<number>> {
    try {
      const response = await request<any>('/dorms/create', {
        method: 'POST',
        data: dormData
      })
      
      // 处理双层嵌套结构 (Rule 5)
      const responseData = response.data?.data || response.data
      const id = typeof responseData === 'object' ? responseData.id : responseData
      
      return {
        success: response.success,
        data: id,
        message: response.message || '创建寝室成功'
      }
    } catch (error) {
      console.error('创建寝室失败:', error)
      return {
        success: false,
        data: null,
        message: '创建寝室失败',
        code: 500
      }
    }
  }

  /**
   * 解散寝室
   */
  async dismissDorm(dormId: string, reason?: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/dismiss`, {
        method: 'POST',
        data: { reason }
      })
      return {
        success: response.success,
        data: response.success,
        message: response.message || '解散寝室成功'
      }
    } catch (error) {
      console.error('解散寝室失败:', error)
      return {
        success: false,
        data: false,
        message: '解散寝室失败',
        code: 500
      }
    }
  }

  /**
   * 邀请成员加入寝室
   */
  async inviteMembers(dormId: string, invitees: {
    name: string
    phone: string
    role?: 'member' | 'admin' | 'viewer'
  }[]): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/invite`, {
        method: 'POST',
        data: { invitees }
      })
      return {
        success: response.success,
        data: response.success,
        message: response.message || '邀请成员成功'
      }
    } catch (error) {
      console.error('邀请成员失败:', error)
      return {
        success: false,
        data: false,
        message: '邀请成员失败',
        code: 500
      }
    }
  }

  /**
   * 获取邀请记录
   */
  async getInviteRecords(dormId: string, params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<any>> {
    try {
      const response = await request<any>(`/dorms/${dormId}/invite-records`, {
        params
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '获取邀请记录成功'
      }
    } catch (error) {
      console.error('获取邀请记录失败:', error)
      return {
        success: false,
        data: null,
        message: '获取邀请记录失败',
        code: 500
      }
    }
  }

  /**
   * 处理邀请
   */
  async handleInvite(inviteId: string, action: 'accept' | 'reject'): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/invites/${inviteId}/handle`, {
        method: 'POST',
        data: { action }
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '处理邀请成功'
      }
    } catch (error) {
      console.error('处理邀请失败:', error)
      return {
        success: false,
        data: false,
        message: '处理邀请失败',
        code: 500
      }
    }
  }

  /**
   * 移除成员
   */
  async removeMember(dormId: string, memberId: string, reason?: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/members/${memberId}/remove`, {
        method: 'POST',
        data: { reason }
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '移除成员成功'
      }
    } catch (error) {
      console.error('移除成员失败:', error)
      return {
        success: false,
        data: false,
        message: '移除成员失败',
        code: 500
      }
    }
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(dormId: string, memberId: string, role: 'member' | 'admin' | 'viewer'): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/members/${memberId}/role`, {
        method: 'PUT',
        data: { role }
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '更新成员角色成功'
      }
    } catch (error) {
      console.error('更新成员角色失败:', error)
      return {
        success: false,
        data: false,
        message: '更新成员角色失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室活动日志
   */
  async getActivityLogs(dormId: string, params?: { page?: number; limit?: number; type?: string }): Promise<ApiResponse<any>> {
    try {
      const response = await request<any>(`/dorms/${dormId}/activity-logs`, {
        params
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '获取活动日志成功'
      }
    } catch (error) {
      console.error('获取活动日志失败:', error)
      return {
        success: false,
        data: null,
        message: '获取活动日志失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室统计信息
   */
  async getDormStatistics(dormId: string, period?: string): Promise<ApiResponse<any>> {
    try {
      const response = await request<any>(`/dorms/${dormId}/statistics`, {
        params: { period }
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '获取统计信息成功'
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return {
        success: false,
        data: null,
        message: '获取统计信息失败',
        code: 500
      }
    }
  }

  /**
   * 申请成为寝室管理员
   */
  async applyForAdmin(dormId: string, reason: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/apply-admin`, {
        method: 'POST',
        data: { reason }
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '申请管理员成功'
      }
    } catch (error) {
      console.error('申请管理员失败:', error)
      return {
        success: false,
        data: false,
        message: '申请管理员失败',
        code: 500
      }
    }
  }

  /**
   * 转移管理员权限
   */
  async transferAdmin(dormId: string, newAdminId: string, reason?: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/transfer-admin`, {
        method: 'POST',
        data: { newAdminId, reason }
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '转移管理员权限成功'
      }
    } catch (error) {
      console.error('转移管理员权限失败:', error)
      return {
        success: false,
        data: false,
        message: '转移管理员权限失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室公告
   */
  async getDormAnnouncements(dormId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    try {
      const response = await request<any>(`/dorms/${dormId}/announcements`, {
        params
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '获取寝室公告成功'
      }
    } catch (error) {
      console.error('获取寝室公告失败:', error)
      return {
        success: false,
        data: null,
        message: '获取寝室公告失败',
        code: 500
      }
    }
  }

  /**
   * 创建寝室公告
   */
  async createAnnouncement(dormId: string, announcement: {
    title: string
    content: string
    type?: 'notice' | 'event' | 'reminder'
    expiresAt?: string
    important?: boolean
  }): Promise<ApiResponse<number>> {
    try {
      const response = await request<{ success: boolean; data: { id: number } }>(`/dorms/${dormId}/announcements`, {
        method: 'POST',
        data: announcement
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      const id = actualData?.id || actualData
      
      return {
        success: response.success,
        data: id,
        message: response.message || '创建公告成功'
      }
    } catch (error) {
      console.error('创建公告失败:', error)
      return {
        success: false,
        data: null,
        message: '创建公告失败',
        code: 500
      }
    }
  }

  /**
   * 更新寝室公告
   */
  async updateAnnouncement(dormId: string, announcementId: string, announcement: {
    title?: string
    content?: string
    type?: 'notice' | 'event' | 'reminder'
    expiresAt?: string
    important?: boolean
  }): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/announcements/${announcementId}`, {
        method: 'PUT',
        data: announcement
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '更新公告成功'
      }
    } catch (error) {
      console.error('更新公告失败:', error)
      return {
        success: false,
        data: false,
        message: '更新公告失败',
        code: 500
      }
    }
  }

  /**
   * 删除寝室公告
   */
  async deleteAnnouncement(dormId: string, announcementId: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/announcements/${announcementId}`, {
        method: 'DELETE'
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = (response as any).data?.data || (response as any).data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '删除公告成功'
      }
    } catch (error) {
      console.error('删除公告失败:', error)
      return {
        success: false,
        data: false,
        message: '删除公告失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室历史记录
   */
  async getDormHistory(dormId: string, params?: { current?: number; size?: number; type?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    try {
      console.log('获取寝室历史记录:', dormId, params)
      
      // 调用真实API获取寝室历史记录
      const response = await request<any>(`/dorms/${dormId}/history`, {
        method: 'GET',
        params
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '获取寝室历史记录成功',
        code: 200
      }
    } catch (error) {
      console.error('获取寝室历史记录失败:', error)
      return {
        success: false,
        data: null,
        message: '获取寝室历史记录失败',
        code: 500
      }
    }
  }

  /**
   * 获取当前用户所在寝室信息
   */
  async getCurrentUserDorm(userId: string): Promise<ApiResponse<any>> {
    try {
      console.log('获取当前用户所在寝室信息:', userId)
      
      // 验证参数
      if (!userId) {
        return {
          success: false,
          data: null,
          message: '用户ID不能为空',
          code: 400
        }
      }
      
      // 调用真实API获取用户所在的寝室信息，使用指定的接口路径
      const response = await request<any>(`/dorms/users/${userId}`, {
        method: 'GET'
      })
      
      console.log('获取用户寝室信息响应:', response)
      
      // 处理后端返回的双层嵌套结构
      const responseData = response.data?.data || response.data || null
      
      return {
        success: response.success,
        data: responseData,
        message: response.message || '获取用户所在寝室信息成功',
        code: response.code || 200
      }
    } catch (error: any) {
      console.error('获取用户所在寝室信息失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '获取用户所在寝室信息失败'
      let statusCode = error.status || 500
      
      if (error.response) {
        // 服务器返回了错误响应
        statusCode = error.response.status
        
        // 特殊处理：404错误视为用户未加入任何寝室
        if (error.response.status === 404) {
          console.log('用户未加入任何寝室，返回空数据')
          return {
            success: true,
            data: null,
            message: '用户未加入任何寝室',
            code: 404
          }
        }
        
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          
          // 特殊处理：用户未加入任何寝室
          if (errorMessage.includes('用户未加入任何寝室') || errorMessage.includes('未加入任何寝室')) {
            console.log('用户未加入任何寝室，返回空数据')
            return {
              success: true,
              data: null,
              message: '用户未加入任何寝室',
              code: error.response.status
            }
          }
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
        
        // 特殊处理：用户未加入任何寝室
        if (error.message.includes('用户未加入任何寝室') || error.message.includes('未加入任何寝室') || error.message.includes('404')) {
          console.log('用户未加入任何寝室，返回空数据')
          return {
            success: true,
            data: null,
            message: '用户未加入任何寝室',
            code: 404
          }
        }
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        code: statusCode
      }
    }
  }

  /**
   * 获取用户所在寝室信息（别名，兼容旧版代码）
   */
  async getUserDormitory(userId: string): Promise<ApiResponse<any>> {
    // 调用getCurrentUserDorm方法，保持兼容
    return this.getCurrentUserDorm(userId)
  }

  /**
   * 获取待结算费用
   */
  async getPendingFees(dormId: string): Promise<ApiResponse<any>> {
    try {
      console.log('获取待结算费用:', dormId)
      
      // 调用真实API获取待结算费用
      const response = await request<any>(`/dorms/${dormId}/pending-fees`, {
        method: 'GET'
      })
      
      // 处理后端返回的双层嵌套结构
      const responseData = response.data?.data || response.data || null
      
      return {
        success: response.success,
        data: responseData,
        message: response.message || '获取待结算费用成功',
        code: response.code || 200
      }
    } catch (error: any) {
      console.error('获取待结算费用失败:', error)
      
      // 提取更详细的错误信息
      let errorMessage = '获取待结算费用失败'
      if (error.response) {
        // 服务器返回了错误响应
        errorMessage = `服务器错误: ${error.response.status}`
        try {
          const errorData = await error.response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // 无法解析错误响应
          errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        code: error.status || 500
      }
    }
  }

  /**
   * 开始解散流程
   */
  async startDismissProcess(dormId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('开始解散流程:', dormId)
      
      // 调用真实API开始解散流程
      const response = await request<any>(`/dorms/${dormId}/dismiss/start`, {
        method: 'POST'
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '开始解散流程成功',
        code: 200
      }
    } catch (error) {
      console.error('开始解散流程失败:', error)
      return {
        success: false,
        data: false,
        message: '开始解散流程失败',
        code: 500
      }
    }
  }

  /**
   * 确认解散
   */
  async confirmDismiss(dormId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('确认解散:', dormId)
      
      // 调用真实API确认解散
      const response = await request<any>(`/dorms/${dormId}/dismiss/confirm`, {
        method: 'POST'
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '确认解散成功',
        code: 200
      }
    } catch (error) {
      console.error('确认解散失败:', error)
      return {
        success: false,
        data: false,
        message: '确认解散失败',
        code: 500
      }
    }
  }

  /**
   * 取消解散
   */
  async cancelDismiss(dormId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('取消解散:', dormId)
      
      // 调用真实API取消解散
      const response = await request<any>(`/dorms/${dormId}/dismiss/cancel`, {
        method: 'POST'
      })
      
      // 处理后端返回的双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data || response.success
      
      return {
        success: response.success,
        data: actualData,
        message: response.message || '取消解散成功',
        code: 200
      }
    } catch (error) {
      console.error('取消解散失败:', error)
      return {
        success: false,
        data: false,
        message: '取消解散失败',
        code: 500
      }
    }
  }
}

export default new DormService()