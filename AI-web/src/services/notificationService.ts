import { ref, Ref, onMounted, onUnmounted } from 'vue'
import * as notificationApi from './notificationApi'

/**
 * 通知类型定义
 */
export interface Notification {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  isImportant: boolean
  actionText?: string
  createdAt: string
  actionPath?: string
  reminderType?: 'immediate' | 'delayed' | 'historical'
  priorityLevel?: 'high' | 'medium' | 'low'
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
 * 通知服务类
 * 使用后端API进行通知管理
 */
class NotificationService {
  private notifications: Ref<Notification[]>
  private unreadCount: Ref<number>
  private listeners: Array<() => void> = []
  private isLoading: Ref<boolean>
  private error: Ref<string | null>
  
  constructor() {
    this.notifications = ref<Notification[]>([])
    this.unreadCount = ref(0)
    this.isLoading = ref(false)
    this.error = ref(null)
  }
  
  /**
   * 转换后端通知数据为前端格式
   */
  private transformNotification(apiNotification: notificationApi.Notification): Notification {
    return {
      id: apiNotification.id,
      title: apiNotification.title,
      message: apiNotification.content,
      type: apiNotification.type,
      isRead: apiNotification.is_read,
      isImportant: apiNotification.is_important,
      createdAt: apiNotification.created_at,
      actionPath: this.getActionPath(apiNotification)
    }
  }
  
  /**
   * 根据通知类型获取操作路径
   */
  private getActionPath(notification: notificationApi.Notification): string | undefined {
    const typeToPath: Record<string, string> = {
      'expense': '/dashboard/expense',
      'bill': '/dashboard/bills',
      'member': '/dashboard/member',
      'warning': '/dashboard/budget',
      'info': '/dashboard/bills',
      'success': '/dashboard',
      'error': '/dashboard',
      'system': '/dashboard'
    }
    return typeToPath[notification.type]
  }
  
  /**
   * 获取所有通知
   */
  getAllNotifications(): Ref<Notification[]> {
    return this.notifications
  }
  
  /**
   * 获取未读数量
   */
  getUnreadCount(): Ref<number> {
    return this.unreadCount
  }
  
  /**
   * 获取加载状态
   */
  getIsLoading(): Ref<boolean> {
    return this.isLoading
  }
  
  /**
   * 获取错误信息
   */
  getError(): Ref<string | null> {
    return this.error
  }
  
  /**
   * 从后端加载通知列表
   */
  async loadNotifications(filters?: NotificationFilters): Promise<void> {
    try {
      this.isLoading.value = true
      this.error.value = null
      
      const response = await notificationApi.getNotifications(filters)
      this.notifications.value = response.notifications.map(n => this.transformNotification(n))
      
      console.log('通知列表加载成功，共', this.notifications.value.length, '条通知')
    } catch (error) {
      console.error('加载通知列表失败:', error)
      this.error.value = '加载通知列表失败: ' + (error as Error).message
      throw error
    } finally {
      this.isLoading.value = false
    }
  }
  
  /**
   * 从后端加载未读数量
   */
  async loadUnreadCount(): Promise<void> {
    try {
      const response = await notificationApi.getUnreadCount()
      this.unreadCount.value = response.unreadCount
      
      console.log('未读数量加载成功:', this.unreadCount.value)
    } catch (error) {
      console.error('加载未读数量失败:', error)
      this.error.value = '加载未读数量失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 获取智能提醒（近期重要通知）
   */
  getSmartReminders(): Notification[] {
    const now = new Date()
    const recentTime = new Date(now.getTime() - 60 * 60 * 1000)
    
    return this.notifications.value.filter(n => 
      !n.isRead && 
      n.isImportant && 
      new Date(n.createdAt) > recentTime
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  /**
   * 获取历史未处理通知
   */
  getHistoricalUnread(): Notification[] {
    const now = new Date()
    const recentTime = new Date(now.getTime() - 60 * 60 * 1000)
    
    return this.notifications.value.filter(n => 
      !n.isRead && 
      new Date(n.createdAt) <= recentTime
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  /**
   * 获取最近的通知（用于Header中的弹窗）
   */
  getRecentNotifications(count: number = 5): Notification[] {
    const now = new Date()
    const recentTime = new Date(now.getTime() - 60 * 60 * 1000)
    
    const historicalUnread = this.notifications.value.filter(n => 
      !n.isRead && 
      new Date(n.createdAt) <= recentTime
    )
    
    const recentUnread = this.notifications.value.filter(n => 
      !n.isRead && 
      new Date(n.createdAt) > recentTime &&
      !historicalUnread.includes(n)
    )
    
    return [...historicalUnread, ...recentUnread].slice(0, count)
  }
  
  /**
   * 添加通知监听器
   */
  addListener(listener: () => void): void {
    this.listeners.push(listener)
  }
  
  /**
   * 移除通知监听器
   */
  removeListener(listener: () => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
  
  /**
   * 删除通知
   */
  async deleteNotification(id: number): Promise<void> {
    try {
      await notificationApi.deleteNotification(id)
      
      const index = this.notifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.value.splice(index, 1)
      }
      
      this.notifyListeners()
      console.log('通知删除成功，通知ID:', id)
    } catch (error) {
      console.error('删除通知失败:', error)
      this.error.value = '删除通知失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 标记为已读
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await notificationApi.markAsRead(id)
      
      const notification = this.notifications.value.find(n => n.id === id)
      if (notification) {
        notification.isRead = true
      }
      
      this.notifyListeners()
      console.log('通知已标记为已读，通知ID:', id)
    } catch (error) {
      console.error('标记已读失败:', error)
      this.error.value = '标记已读失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 标记为未读
   */
  async markAsUnread(id: number): Promise<void> {
    try {
      await notificationApi.markAsUnread(id)
      
      const notification = this.notifications.value.find(n => n.id === id)
      if (notification) {
        notification.isRead = false
      }
      
      this.notifyListeners()
      console.log('通知已标记为未读，通知ID:', id)
    } catch (error) {
      console.error('标记未读失败:', error)
      this.error.value = '标记未读失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 切换重要性标记
   */
  async toggleImportance(id: number): Promise<void> {
    try {
      const notification = this.notifications.value.find(n => n.id === id)
      if (notification) {
        notification.isImportant = !notification.isImportant
      }
      
      this.notifyListeners()
      console.log('通知重要性已切换，通知ID:', id)
    } catch (error) {
      console.error('切换重要性失败:', error)
      this.error.value = '切换重要性失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 批量删除通知
   */
  async batchDelete(ids: number[]): Promise<void> {
    try {
      await notificationApi.batchDelete(ids)
      
      this.notifications.value = this.notifications.value.filter(n => !ids.includes(n.id))
      
      this.notifyListeners()
      console.log('批量删除成功，影响行数:', ids.length)
    } catch (error) {
      console.error('批量删除失败:', error)
      this.error.value = '批量删除失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 批量标记为已读
   */
  async batchMarkAsRead(ids: number[]): Promise<void> {
    try {
      await notificationApi.batchMarkAsRead(ids)
      
      this.notifications.value.forEach(notification => {
        if (ids.includes(notification.id)) {
          notification.isRead = true
        }
      })
      
      this.notifyListeners()
      console.log('批量标记已读成功，影响行数:', ids.length)
    } catch (error) {
      console.error('批量标记已读失败:', error)
      this.error.value = '批量标记已读失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 批量标记为未读
   */
  async batchMarkAsUnread(ids: number[]): Promise<void> {
    try {
      await notificationApi.batchMarkAsUnread(ids)
      
      this.notifications.value.forEach(notification => {
        if (ids.includes(notification.id)) {
          notification.isRead = false
        }
      })
      
      this.notifyListeners()
      console.log('批量标记未读成功，影响行数:', ids.length)
    } catch (error) {
      console.error('批量标记未读失败:', error)
      this.error.value = '批量标记未读失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 批量切换重要性标记
   */
  async batchToggleImportance(ids: number[]): Promise<void> {
    try {
      this.notifications.value.forEach(notification => {
        if (ids.includes(notification.id)) {
          notification.isImportant = !notification.isImportant
        }
      })
      
      this.notifyListeners()
      console.log('批量切换重要性成功，影响行数:', ids.length)
    } catch (error) {
      console.error('批量切换重要性失败:', error)
      this.error.value = '批量切换重要性失败: ' + (error as Error).message
      throw error
    }
  }
  
  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<void> {
    try {
      await notificationApi.markAllAsRead()
      
      this.notifications.value.forEach(notification => {
        notification.isRead = true
      })
      
      this.notifyListeners()
      console.log('所有通知已标记为已读')
    } catch (error) {
      console.error('标记全部已读失败:', error)
      this.error.value = '标记全部已读失败: ' + (error as Error).message
      throw error
    }
  }
}

/**
 * 创建通知服务实例
 */
export const notificationService = new NotificationService()

/**
 * Composable hook for using notification service in Vue components
 */
export function useNotifications() {
  const notifications = notificationService.getAllNotifications()
  const unreadCount = notificationService.getUnreadCount()
  const isLoading = notificationService.getIsLoading()
  const error = notificationService.getError()
  
  const updateUnreadCount = () => {
    notificationService.loadUnreadCount()
  }
  
  onMounted(() => {
    notificationService.addListener(updateUnreadCount)
  })
  
  onUnmounted(() => {
    notificationService.removeListener(updateUnreadCount)
  })
  
  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications: (filters?: NotificationFilters) => notificationService.loadNotifications(filters),
    loadUnreadCount: () => notificationService.loadUnreadCount(),
    getRecentNotifications: (count?: number) => notificationService.getRecentNotifications(count),
    getSmartReminders: () => notificationService.getSmartReminders(),
    getHistoricalUnread: () => notificationService.getHistoricalUnread(),
    deleteNotification: (id: number) => notificationService.deleteNotification(id),
    markAsRead: (id: number) => notificationService.markAsRead(id),
    markAsUnread: (id: number) => notificationService.markAsUnread(id),
    toggleImportance: (id: number) => notificationService.toggleImportance(id),
    batchDelete: (ids: number[]) => notificationService.batchDelete(ids),
    batchMarkAsRead: (ids: number[]) => notificationService.batchMarkAsRead(ids),
    batchMarkAsUnread: (ids: number[]) => notificationService.batchMarkAsUnread(ids),
    batchToggleImportance: (ids: number[]) => notificationService.batchToggleImportance(ids),
    markAllAsRead: () => notificationService.markAllAsRead()
  }
}
