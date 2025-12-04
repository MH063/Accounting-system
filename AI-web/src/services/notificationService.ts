import { ref, Ref, onMounted, onUnmounted } from 'vue'

// 通知类型定义
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
  reminderType?: 'immediate' | 'delayed' | 'historical' // 新增字段：提醒类型
  priorityLevel?: 'high' | 'medium' | 'low' // 新增字段：优先级
}

// 通知服务类
class NotificationService {
  private notifications: Ref<Notification[]>
  private listeners: Array<() => void> = []
  
  constructor() {
    // 从localStorage加载通知数据
    this.notifications = ref<Notification[]>(this.loadFromStorage())
    
    // 监听storage事件以实现跨标签页同步
    this.setupStorageListener()
  }
  
  // 加载存储的通知数据
  private loadFromStorage(): Notification[] {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载通知数据失败:', error)
    }
    
    // 默认通知数据
    return [
      {
        id: 1,
        title: '费用报销申请待审批',
        message: '您的费用报销申请已提交，等待管理员审批处理。',
        type: 'expense',
        isRead: false,
        isImportant: true,
        actionText: '查看详情',
        actionPath: '/dashboard/expenses',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: '月度账单生成完成',
        message: '2024年1月份的集体账单已生成完成，请及时查看。',
        type: 'bill',
        isRead: false,
        isImportant: false,
        actionText: '查看账单',
        actionPath: '/dashboard/bills',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        title: '新成员加入申请',
        message: '张三申请加入您的寝室，需要您进行审核。',
        type: 'member',
        isRead: false,
        isImportant: true,
        actionText: '审核申请',
        actionPath: '/dashboard/member/list',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        title: '预算提醒',
        message: '本月支出已达到预算的80%，请注意控制开支',
        type: 'warning',
        isRead: false,
        isImportant: true,
        actionPath: '/dashboard/budget',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        title: '账单提醒',
        message: '有3笔账单等待确认，请及时处理',
        type: 'info',
        isRead: false,
        isImportant: true,
        actionPath: '/dashboard/bills',
        createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
  
  // 保存通知数据到localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications.value))
    } catch (error) {
      console.error('保存通知数据失败:', error)
    }
  }
  
  // 设置存储监听器以实现跨标签页同步
  private setupStorageListener(): void {
    const handler = (event: StorageEvent) => {
      if (event.key === 'notifications' && event.newValue) {
        try {
          this.notifications.value = JSON.parse(event.newValue)
          // 通知所有监听器
          this.listeners.forEach(listener => listener())
        } catch (error) {
          console.error('解析存储的通知数据失败:', error)
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handler)
    }
  }
  
  // 获取所有通知
  getAllNotifications(): Ref<Notification[]> {
    return this.notifications
  }
  
  // 获取智能提醒（近期重要通知）
  getSmartReminders(): Notification[] {
    const now = new Date()
    const recentTime = new Date(now.getTime() - 60 * 60 * 1000) // 1小时内
    
    return this.notifications.value.filter(n => 
      !n.isRead && 
      n.isImportant && 
      new Date(n.createdAt) > recentTime
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // 获取历史未处理通知
  getHistoricalUnread(): Notification[] {
    const now = new Date()
    const recentTime = new Date(now.getTime() - 60 * 60 * 1000) // 1小时前
    
    return this.notifications.value.filter(n => 
      !n.isRead && 
      new Date(n.createdAt) <= recentTime
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // 获取最近的通知（用于Header中的弹窗）- 修改为优先显示历史未处理的通知
  getRecentNotifications(count: number = 5): Notification[] {
    const now = new Date()
    const recentTime = new Date(now.getTime() - 60 * 60 * 1000) // 1小时前
    
    // 优先显示历史未处理的通知
    const historicalUnread = this.notifications.value.filter(n => 
      !n.isRead && 
      new Date(n.createdAt) <= recentTime
    )
    
    // 然后是近期的通知
    const recentUnread = this.notifications.value.filter(n => 
      !n.isRead && 
      new Date(n.createdAt) > recentTime &&
      !historicalUnread.includes(n)
    )
    
    return [...historicalUnread, ...recentUnread].slice(0, count)
  }
  
  // 添加通知监听器
  addListener(listener: () => void): void {
    this.listeners.push(listener)
  }
  
  // 移除通知监听器
  removeListener(listener: () => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  // 添加新通知
  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(), // 使用时间戳作为ID
      createdAt: new Date().toISOString()
    }
    
    this.notifications.value.unshift(newNotification)
    this.saveToStorage()
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener())
  }
  
  // 删除通知
  deleteNotification(id: number): void {
    const index = this.notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.value.splice(index, 1)
      this.saveToStorage()
      
      // 通知所有监听器
      this.listeners.forEach(listener => listener())
    }
  }
  
  // 标记为已读
  markAsRead(id: number): void {
    const notification = this.notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = true
      this.saveToStorage()
      
      // 通知所有监听器
      this.listeners.forEach(listener => listener())
    }
  }
  
  // 标记为未读
  markAsUnread(id: number): void {
    const notification = this.notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = false
      this.saveToStorage()
      
      // 通知所有监听器
      this.listeners.forEach(listener => listener())
    }
  }
  
  // 切换重要性标记
  toggleImportance(id: number): void {
    const notification = this.notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isImportant = !notification.isImportant
      this.saveToStorage()
      
      // 通知所有监听器
      this.listeners.forEach(listener => listener())
    }
  }
  
  // 批量删除通知
  batchDelete(ids: number[]): void {
    this.notifications.value = this.notifications.value.filter(n => !ids.includes(n.id))
    this.saveToStorage()
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener())
  }
  
  // 批量标记为已读
  batchMarkAsRead(ids: number[]): void {
    this.notifications.value.forEach(notification => {
      if (ids.includes(notification.id)) {
        notification.isRead = true
      }
    })
    this.saveToStorage()
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener())
  }
  
  // 批量标记为未读
  batchMarkAsUnread(ids: number[]): void {
    this.notifications.value.forEach(notification => {
      if (ids.includes(notification.id)) {
        notification.isRead = false
      }
    })
    this.saveToStorage()
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener())
  }
  
  // 批量切换重要性标记
  batchToggleImportance(ids: number[]): void {
    this.notifications.value.forEach(notification => {
      if (ids.includes(notification.id)) {
        notification.isImportant = !notification.isImportant
      }
    })
    this.saveToStorage()
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener())
  }
  
  // 获取未读通知数量
  getUnreadCount(): number {
    return this.notifications.value.filter(n => !n.isRead).length
  }
  
  // 标记所有通知为已读
  markAllAsRead(): void {
    this.notifications.value.forEach(notification => {
      notification.isRead = true
    })
    this.saveToStorage()
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener())
  }
}

// 创建通知服务实例
export const notificationService = new NotificationService()

// Composable hook for using notification service in Vue components
export function useNotifications() {
  const notifications = notificationService.getAllNotifications()
  const unreadCount = ref(notificationService.getUnreadCount())
  
  // 更新未读数量的回调
  const updateUnreadCount = () => {
    unreadCount.value = notificationService.getUnreadCount()
  }
  
  // 添加监听器
  onMounted(() => {
    notificationService.addListener(updateUnreadCount)
  })
  
  // 移除监听器
  onUnmounted(() => {
    notificationService.removeListener(updateUnreadCount)
  })
  
  return {
    notifications,
    unreadCount,
    getRecentNotifications: (count?: number) => notificationService.getRecentNotifications(count),
    getSmartReminders: () => notificationService.getSmartReminders(),
    getHistoricalUnread: () => notificationService.getHistoricalUnread(),
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => 
      notificationService.addNotification(notification),
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