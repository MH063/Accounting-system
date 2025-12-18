import type { ApiResponse } from '@/types'
import { request } from '@/utils/request'

// 成员信息接口
export interface Member {
  id: number
  studentId: string
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
    
    return {
      success: true,
      data: response
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
    
    return {
      success: true,
      data: response
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
    
    return {
      success: true,
      data: response
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
    
    return {
      success: true,
      data: response
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
    const url = `/api/members${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await request<MembersResponse>(url, {
      method: 'GET'
    })
    
    return {
      success: true,
      data: response,
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
    const response = await request<InviteMemberResponse>(`/api/dorms/${dormId}/invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData)
    })
    
    return {
      success: true,
      data: response,
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
    const endpoint = `/api/dorms/members/${memberId}/role`
    
    const response = await request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    })
    
    return {
      success: true,
      data: response,
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
 * 删除成员
 * @param memberId 成员ID
 * @returns 删除结果
 */
export const deleteMember = async (memberId: number): Promise<ApiResponse<any>> => {
  try {
    console.log('删除成员:', memberId)
    
    // 调用真实API删除成员
    const response = await request<any>(`/api/members/${memberId}`, {
      method: 'DELETE'
    })
    
    return {
      success: true,
      data: response,
      message: '成员删除成功'
    }
  } catch (error) {
    console.error('删除成员失败:', error)
    return {
      success: false,
      data: null,
      message: '删除成员失败'
    }
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
    const response = await request<any[]>(`/api/members/pending?room=${roomName}`, {
      method: 'GET'
    })
    
    return {
      success: true,
      data: response,
      message: '待审核成员列表获取成功'
    }
  } catch (error) {
    console.error('获取待审核成员列表失败:', error)
    return {
      success: false,
      data: [],
      message: '获取待审核成员列表失败'
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
  deleteMember,
  getPendingMembers
}