import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 成员信息接口
export interface Member {
  id: number
  name: string
  phone: string
  email?: string
  room: string
  role: 'admin' | 'member'
  status: 'active' | 'away' | 'inactive'
  joinDate: string
  remark?: string
  avatar?: string
  shareAmount?: number
  completedTasks?: number
  totalTasks?: number
}

// 成员列表宿舍信息接口
export interface MemberDormInfo {
  id: number
  name: string
  code: string
  building: string
  floor: number
  roomNumber: string
}

// 成员列表成员关系信息接口
export interface MemberMembershipInfo {
  id: number
  role: string
  status: string
  moveInDate: string
  moveOutDate: string
  bedNumber: string
  roomNumber: string
  monthlyShare: number
  depositPaid: number
  lastPaymentDate: string
  joinedAt: string
  updatedAt: string
}

// 成员列表费用信息接口
export interface MemberExpensesInfo {
  totalSplitAmount: number
  totalPaidAmount: number
  pendingAmount: number
  overdueAmount: number
}

// 成员列表完整信息接口
export interface MemberListItem {
  // 用户基本信息
  userId: number
  username: string
  nickname: string
  realName: string
  phone: string
  email: string
  gender: string
  birthday: string
  avatarUrl: string
  userStatus: string
  userCreatedAt: string

  // 宿舍信息
  dorm: MemberDormInfo

  // 成员关系信息
  membership: MemberMembershipInfo

  // 费用信息
  expenses: MemberExpensesInfo
}

// 分页信息接口
export interface PaginationInfo {
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
}

// 成员列表响应接口
export interface MembersResponse {
  members: MemberListItem[]
  pagination: PaginationInfo
}

// 财务统计数据接口
export interface FinancialStats {
  totalContribution: number
  monthlyShare: number
  pendingAmount: number
  paidAmount: number
  maxAmount: number
  contributionTrend: Array<{
    month: string
    amount: number
  }>
}

// 活跃度统计数据接口
export interface ActivityStats {
  onlineTime: number
  onlineTimeTrend: 'up' | 'down'
  onlineTimeChange: number
  interactionCount: number
  interactionTrend: 'up' | 'down'
  interactionChange: number
  lastActive: string
  activeStatus: 'active' | 'inactive'
  recentActivities: Array<{
    id: number
    action: string
    time: string
    type: string
  }>
}

// 更新成员状态请求参数接口
export interface UpdateMemberStatusRequest {
  status: 'active' | 'inactive' | 'pending'  // 必需，新的状态
  moveOutDate?: string  // 可选，搬离日期（状态变更为inactive时使用）
  moveInDate?: string   // 可选，入住日期（状态变更为active时使用）
  handleUnpaidExpenses?: 'waive' | 'keep'  // 可选，如何处理未结费用：'waive'（免除）、'keep'（保持）
  notifyUser?: boolean  // 可选，是否发送通知给用户，默认true
}

// 邀请成员请求参数接口
export interface InviteMemberRequest {
  email?: string           // 被邀请用户的邮箱（邮箱或手机二选一）
  phone?: string           // 被邀请用户的手机号（邮箱或手机二选一）
  memberRole?: 'admin' | 'member' | 'viewer'  // 成员角色，可选值：'admin'|'member'|'viewer'，默认为'member'
  monthlyShare?: number    // 月分摊费用，可选
  moveInDate?: string      // 预计入住日期（ISO格式），可选
  bedNumber?: string       // 分配床位号，可选
  inviteExpiresDays?: number // 邀请有效期天数，默认7天，可选
}
// 邀请成员响应数据接口
export interface InviteMemberResponse {
  inviteRecord: {
    id: number              // 邀请记录ID
    inviteCode: string      // 邀请码
    status: string          // 邀请状态
    expiresAt: string       // 邀请过期时间
  }
  userInfo: {
    id: number              // 被邀请用户ID
    username: string        // 用户名
    email: string           // 邮箱
    phone: string           // 手机号
    isNewUser: boolean      // 是否为新用户（未注册）
  }
  dormInfo: {
    id: number              // 宿舍ID
    dormName: string        // 宿舍名称
  }
}

/**
 * 获取成员信息
 * @param memberId 成员ID
 * @returns 成员信息
 */
export const getMemberById = async (memberId: string): Promise<ApiResponse<Member>> => {
  try {
    console.log('获取成员信息:', memberId)
    
    // 调用真实API获取成员信息
    const response = await request<Member>(`/members/${memberId}`)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData as Member
    }
  } catch (error) {
    console.error('获取成员信息失败:', error)
    return {
      success: false,
      data: {} as Member,
      message: '获取成员信息失败'
    }
  }
}

/**
 * 更新成员信息
 * @param memberId 成员ID
 * @param memberData 成员数据
 * @returns 更新结果
 */
export const updateMember = async (memberId: string, memberData: Partial<Member>): Promise<ApiResponse<Member>> => {
  try {
    console.log('更新成员信息:', memberId, memberData)
    
    // 调用真实API更新成员信息
    const response = await request<Member>(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(memberData)
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData as Member
    }
  } catch (error) {
    console.error('更新成员信息失败:', error)
    return {
      success: false,
      data: {} as Member,
      message: '更新成员信息失败'
    }
  }
}

/**
 * 获取成员财务统计数据
 * @param memberId 成员ID
 * @returns 财务统计数据
 */
export const getMemberFinancialStats = async (memberId: string): Promise<ApiResponse<FinancialStats>> => {
  try {
    console.log('获取成员财务统计数据:', memberId)
    
    // 调用真实API获取财务统计数据
    const response = await request<FinancialStats>(`/members/${memberId}/financial-stats`)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData as FinancialStats
    }
  } catch (error) {
    console.error('获取成员财务统计数据失败:', error)
    return {
      success: false,
      data: {
        totalContribution: 0,
        monthlyShare: 0,
        pendingAmount: 0,
        paidAmount: 0,
        maxAmount: 100,
        contributionTrend: []
      },
      message: '获取成员财务统计数据失败'
    }
  }
}

/**
 * 获取成员活跃度统计数据
 * @param memberId 成员ID
 * @returns 活跃度统计数据
 */
export const getMemberActivityStats = async (memberId: string): Promise<ApiResponse<ActivityStats>> => {
  try {
    console.log('获取成员活跃度统计数据:', memberId)
    
    // 调用真实API获取活跃度统计数据
    const response = await request<ActivityStats>(`/members/${memberId}/activity-stats`)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData as ActivityStats
    }
  } catch (error) {
    console.error('获取成员活跃度统计数据失败:', error)
    return {
      success: false,
      data: {
        onlineTime: 0,
        onlineTimeTrend: 'up',
        onlineTimeChange: 0,
        interactionCount: 0,
        interactionTrend: 'up',
        interactionChange: 0,
        lastActive: '',
        activeStatus: 'active',
        recentActivities: []
      },
      message: '获取成员活跃度统计数据失败'
    }
  }
}

/**
 * 获取成员列表
 * @param params 查询参数
 * @returns 成员列表
 */
export const getMembers = async (params: {
  page?: number
  limit?: number
  dormId?: number
  role?: string
  search?: string
  sortBy?: string
}): Promise<ApiResponse<MembersResponse>> => {
  try {
    console.log('获取成员列表:', params)
    
    // 构建查询参数
    const queryParams = new URLSearchParams()
    
    // 添加分页参数
    queryParams.append('page', (params.page || 1).toString())
    queryParams.append('limit', (params.limit || 20).toString())
    
    // 添加可选参数
    if (params.dormId !== undefined) {
      queryParams.append('dormId', params.dormId.toString())
    }
    if (params.role) {
      queryParams.append('role', params.role)
    }
    if (params.search) {
      queryParams.append('search', params.search)
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy)
    }
    
    // 调用真实API获取成员列表
    const url = `/members${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await request<MembersResponse>(url, {
      method: 'GET'
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData as MembersResponse,
      message: '成员列表信息获取成功'
    }
  } catch (error) {
    console.error('获取成员列表失败:', error)
    return {
      success: false,
      data: {
        members: [],
        pagination: {
          currentPage: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0
        }
      },
      message: '获取成员列表失败'
    }
  }
}

/**
 * 邀请成员
 * @param dormId 宿舍ID
 * @param inviteData 邀请数据
 * @returns 邀请结果
 */
export const inviteMember = async (
  dormId: number,
  inviteData: InviteMemberRequest
): Promise<ApiResponse<InviteMemberResponse>> => {
  try {
    console.log('邀请成员:', dormId, inviteData)
    
    // 调用真实API邀请成员
    const response = await request<InviteMemberResponse>(`/dorms/${dormId}/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData)
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData as InviteMemberResponse,
      message: '邀请已发送'
    }
  } catch (error) {
    console.error('邀请成员失败:', error)
    return {
      success: false,
      data: {} as InviteMemberResponse,
      message: '邀请成员失败'
    }
  }
}

/**
 * 更新成员角色
 * @param memberId 成员ID
 * @param roleData 角色数据
 * @returns 更新结果
 */
export const updateMemberRole = async (
  memberId: number,
  roleData: {
    memberRole: 'admin' | 'member' | 'viewer'
    updatePermissions?: boolean
    notifyUser?: boolean
  }
): Promise<ApiResponse<any>> => {
  try {
    console.log('更新成员角色:', memberId, roleData)
    
    // 使用指定的API端点
    const endpoint = `/dorms/members/${memberId}/role`
    
    const response = await request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData,
      message: '成员角色更新成功'
    }
  } catch (error) {
    console.error('更新成员角色失败:', error)
    return {
      success: false,
      data: null,
      message: '更新成员角色失败'
    }
  }
}

/**
 * 删除成员（新版接口）
 * @param id 用户宿舍关联记录ID（路径参数）
 * @param deleteParams 删除参数
 * @returns 删除结果
 */
export const deleteDormMember = async (
  id: number,
  deleteParams: {
    deleteType?: 'physical' | 'logical',
    handleUnpaidExpenses?: 'waive' | 'reallocate' | 'keep',
    refundDeposit?: boolean,
    newAdminId?: number,
    notifyUser?: boolean
  } = {}
): Promise<ApiResponse<any>> => {
  try {
    console.log('删除宿舍成员:', id, deleteParams)
    
    // 设置默认值
    const params = {
      deleteType: deleteParams.deleteType || 'logical',
      handleUnpaidExpenses: deleteParams.handleUnpaidExpenses || 'waive',
      refundDeposit: deleteParams.refundDeposit !== undefined ? deleteParams.refundDeposit : false,
      notifyUser: deleteParams.notifyUser !== undefined ? deleteParams.notifyUser : true,
      ...(deleteParams.newAdminId && { newAdminId: deleteParams.newAdminId })
    };
    
    // 调用真实API删除成员
    const response = await request<any>(`/dorms/members/${id}`, {
      method: 'DELETE',
      data: params
    });
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = (response as any)?.data?.data || (response as any)?.data || response
    
    return {
      success: true,
      data: actualData,
      message: '成员删除成功'
    };
  } catch (error) {
    console.error('删除宿舍成员失败:', error);
    return {
      success: false,
      data: null,
      message: '删除成员失败'
    };
  }
}

/**
 * 获取待审核成员列表
 * @param roomName 房间名称
 * @returns 待审核成员列表
 */
export const getPendingMembers = async (roomName: string): Promise<ApiResponse<any[]>> => {
  try {
    console.log('获取待审核成员列表:', roomName)
    
    // 调用真实API获取待审核成员列表
    // 注意：根据后端路由配置，可能需要调整API路径
    // 目前使用的/dorms/members/pending是根据常见RESTful设计推测的，实际路径需要根据后端实现调整
    const response = await request<any>(`/dorms/members/pending`, {
      method: 'GET',
      params: { room: roomName }
    })
    
    // 处理后端返回的双层嵌套结构
    const responseData = response.data?.data || response.data || []
    const membersData = Array.isArray(responseData) ? responseData : []
    
    return {
      success: response.success,
      data: membersData,
      message: response.message || '待审核成员列表获取成功',
      code: response.code || 200
    }
  } catch (error: any) {
    console.error('获取待审核成员列表失败:', error)
    
    // 提取更详细的错误信息
    let errorMessage = '获取待审核成员列表失败'
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
      data: [],
      message: errorMessage,
      code: error.status || 500
    }
  }
}

// 导出默认实例
export default {
  getMemberById,
  updateMember,
  getMemberFinancialStats,
  getMemberActivityStats,
  getMembers,
  inviteMember,
  updateMemberRole,
  deleteDormMember,
  getPendingMembers,
  
  /**
   * 更新成员状态
   * @param memberId 成员ID
   * @param statusData 状态数据
   * @returns 更新结果
   */
  updateMemberStatus: async (
    memberId: number,
    statusData: UpdateMemberStatusRequest
  ): Promise<ApiResponse<any>> => {
    try {
      console.log('更新成员状态:', memberId, statusData);
      
      // 使用指定的API端点
      const endpoint = `/dorms/members/${memberId}/status`;
      
      const response = await request<any>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(statusData)
      });
      
      // 处理双层嵌套结构 (Rule 5)
      const actualData = (response as any)?.data?.data || (response as any)?.data || response
      
      return {
        success: true,
        data: actualData,
        message: '成员状态更新成功'
      };
    } catch (error) {
      console.error('更新成员状态失败:', error);
      return {
        success: false,
        data: null,
        message: '更新成员状态失败'
      };
    }
  }
}
