import { get, post, put, del } from '@/utils/request'

/**
 * 通知类型定义
 */
export interface Notification {
  id: number
  title: string
  content: string
  type: string
  is_read: boolean
  read_at: string | null
  sender_id: number | null
  related_id: number | null
  related_table: string | null
  created_at: string
  updated_at: string
  is_important: boolean
}

/**
 * 通知筛选参数
 */
export interface NotificationFilters {
  type?: string
  isRead?: boolean
  page?: number
  pageSize?: number
}

/**
 * 通知列表响应
 */
export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  page: number
  pageSize: number
}

/**
 * 获取通知列表
 * @param filters 筛选参数
 * @returns 通知列表
 */
export const getNotifications = async (filters?: NotificationFilters): Promise<NotificationListResponse> => {
  console.log('获取通知列表，筛选参数:', filters)
  
  const params = new URLSearchParams()
  if (filters?.type) params.append('type', filters.type)
  if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString())
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())
  
  const url = `/notifications${params.toString() ? `?${params.toString()}` : ''}`
  const response = await get<any>(url)
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('通知列表获取成功，共', actualData.total, '条通知')
  return actualData
}

/**
 * 获取未读通知数量
 * @returns 未读通知数量和总数量
 */
export const getUnreadCount = async (): Promise<{ unreadCount: number; totalCount: number }> => {
  console.log('获取未读通知数量')
  
  const response = await get<any>(
    '/notifications/unread-count'
  )
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('未读通知数量:', actualData.unreadCount, '，总通知数量:', actualData.totalCount)
  return actualData
}

/**
 * 标记通知为已读
 * @param id 通知ID
 * @returns 操作结果
 */
export const markAsRead = async (id: number): Promise<{ message: string }> => {
  console.log('标记通知为已读，通知ID:', id)
  
  const response = await put<any>(`/notifications/${id}/read`)
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('通知已标记为已读')
  return actualData
}

/**
 * 标记通知为未读
 * @param id 通知ID
 * @returns 操作结果
 */
export const markAsUnread = async (id: number): Promise<{ message: string }> => {
  console.log('标记通知为未读，通知ID:', id)
  
  const response = await put<any>(`/notifications/${id}/unread`)
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('通知已标记为未读')
  return actualData
}

/**
 * 删除通知
 * @param id 通知ID
 * @returns 操作结果
 */
export const deleteNotification = async (id: number): Promise<{ message: string }> => {
  console.log('删除通知，通知ID:', id)
  
  const response = await del<any>(`/notifications/${id}`)
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('通知已删除')
  return actualData
}

/**
 * 标记所有通知为已读
 * @returns 操作结果
 */
export const markAllAsRead = async (): Promise<{ message: string; affectedCount: number }> => {
  console.log('标记所有通知为已读')
  
  const response = await put<any>(
    '/notifications/read-all'
  )
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('所有通知已标记为已读，影响行数:', actualData.affectedCount)
  return actualData
}

/**
 * 批量标记已读
 * @param ids 通知ID数组
 * @returns 操作结果
 */
export const batchMarkAsRead = async (ids: number[]): Promise<{ message: string; affectedCount: number }> => {
  console.log('批量标记通知为已读，通知ID列表:', ids)
  
  const response = await put<any>(
    '/notifications/batch/read',
    { ids }
  )
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('批量标记已读完成，影响行数:', actualData.affectedCount)
  return actualData
}

/**
 * 批量标记未读
 * @param ids 通知ID数组
 * @returns 操作结果
 */
export const batchMarkAsUnread = async (ids: number[]): Promise<{ message: string; affectedCount: number }> => {
  console.log('批量标记通知为未读，通知ID列表:', ids)
  
  const response = await put<any>(
    '/notifications/batch/unread',
    { ids }
  )
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('批量标记未读完成，影响行数:', actualData.affectedCount)
  return actualData
}

/**
 * 批量删除通知
 * @param ids 通知ID数组
 * @returns 操作结果
 */
export const batchDelete = async (ids: number[]): Promise<{ message: string; affectedCount: number }> => {
  console.log('批量删除通知，通知ID列表:', ids)
  
  const response = await del<any>(
    '/notifications/batch',
    { ids }
  )
  
  // 处理后端返回的双层嵌套结构 (Rule 5)
  const actualData = response.data?.data || response.data || response;
  
  console.log('批量删除完成，影响行数:', actualData.affectedCount)
  return actualData
}
