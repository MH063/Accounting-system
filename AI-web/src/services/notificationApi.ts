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
  const response = await get<NotificationListResponse>(url)
  
  console.log('通知列表获取成功，共', response.total, '条通知')
  return response
}

/**
 * 获取未读通知数量
 * @returns 未读通知数量和总数量
 */
export const getUnreadCount = async (): Promise<{ unreadCount: number; totalCount: number }> => {
  console.log('获取未读通知数量')
  
  const response = await get<{ unreadCount: number; totalCount: number }>(
    '/notifications/unread-count'
  )
  
  console.log('未读通知数量:', response.unreadCount, '，总通知数量:', response.totalCount)
  return response
}

/**
 * 标记通知为已读
 * @param id 通知ID
 * @returns 操作结果
 */
export const markAsRead = async (id: number): Promise<{ message: string }> => {
  console.log('标记通知为已读，通知ID:', id)
  
  const response = await put<{ message: string }>(`/notifications/${id}/read`)
  
  console.log('通知已标记为已读')
  return response
}

/**
 * 标记通知为未读
 * @param id 通知ID
 * @returns 操作结果
 */
export const markAsUnread = async (id: number): Promise<{ message: string }> => {
  console.log('标记通知为未读，通知ID:', id)
  
  const response = await put<{ message: string }>(`/notifications/${id}/unread`)
  
  console.log('通知已标记为未读')
  return response
}

/**
 * 删除通知
 * @param id 通知ID
 * @returns 操作结果
 */
export const deleteNotification = async (id: number): Promise<{ message: string }> => {
  console.log('删除通知，通知ID:', id)
  
  const response = await del<{ message: string }>(`/notifications/${id}`)
  
  console.log('通知已删除')
  return response
}

/**
 * 标记所有通知为已读
 * @returns 操作结果
 */
export const markAllAsRead = async (): Promise<{ message: string; affectedCount: number }> => {
  console.log('标记所有通知为已读')
  
  const response = await put<{ message: string; affectedCount: number }>(
    '/notifications/read-all'
  )
  
  console.log('所有通知已标记为已读，影响行数:', response.affectedCount)
  return response
}

/**
 * 批量标记已读
 * @param ids 通知ID数组
 * @returns 操作结果
 */
export const batchMarkAsRead = async (ids: number[]): Promise<{ message: string; affectedCount: number }> => {
  console.log('批量标记通知为已读，通知ID列表:', ids)
  
  const response = await put<{ message: string; affectedCount: number }>(
    '/notifications/batch/read',
    { ids }
  )
  
  console.log('批量标记已读完成，影响行数:', response.affectedCount)
  return response
}

/**
 * 批量标记未读
 * @param ids 通知ID数组
 * @returns 操作结果
 */
export const batchMarkAsUnread = async (ids: number[]): Promise<{ message: string; affectedCount: number }> => {
  console.log('批量标记通知为未读，通知ID列表:', ids)
  
  const response = await put<{ message: string; affectedCount: number }>(
    '/notifications/batch/unread',
    { ids }
  )
  
  console.log('批量标记未读完成，影响行数:', response.affectedCount)
  return response
}

/**
 * 批量删除通知
 * @param ids 通知ID数组
 * @returns 操作结果
 */
export const batchDelete = async (ids: number[]): Promise<{ message: string; affectedCount: number }> => {
  console.log('批量删除通知，通知ID列表:', ids)
  
  const response = await del<{ message: string; affectedCount: number }>(
    '/notifications/batch',
    { ids }
  )
  
  console.log('批量删除完成，影响行数:', response.affectedCount)
  return response
}
