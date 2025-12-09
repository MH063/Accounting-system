<template>
  <teleport to="body">
    <div class="notification-popover" v-if="visible">
      <div class="popover-arrow"></div>
      <div class="popover-header">
        <span class="header-title">
          最近通知
          <el-badge 
            v-if="unreadNotificationsCount > 0" 
            :value="unreadNotificationsCount" 
            :max="99" 
            type="danger"
            class="unread-count-badge"
          />
        </span>
        <el-button 
          link 
          type="primary" 
          size="small" 
          @click="viewAllNotifications"
          class="view-all-btn"
        >
          查看全部
        </el-button>
      </div>
      <div class="popover-content">
        <div v-if="recentNotifications.length === 0" class="empty-state">
          <el-icon><Bell /></el-icon>
          <p>暂无通知</p>
        </div>
        <div 
          v-else 
          class="notification-list"
        >
          <div 
            v-for="notification in recentNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon" :class="getPriorityClass(notification.isImportant ? 'high' : 'medium')">
              <el-icon><component :is="getNotificationIcon(notification.type)" /></el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatRelativeTime(new Date(notification.createdAt)) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Bell, 
  Warning, 
  InfoFilled, 
  SuccessFilled, 
  Star,
  Wallet,
  Document,
  User
} from '@element-plus/icons-vue'
import { useNotifications } from '../services/notificationService'
import { formatRelativeTime } from '@/utils/timeUtils'

// Props
const props = defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

// 路由
const router = useRouter()

// 使用通知服务
const { getRecentNotifications, markAsRead, notifications, unreadCount } = useNotifications()

// 最近通知数据
const recentNotifications = ref<any[]>([])

// 计算未读通知数量
const unreadNotificationsCount = computed(() => {
  return recentNotifications.value.filter(n => !n.isRead).length
})

// 更新最近通知
const updateRecentNotifications = () => {
  recentNotifications.value = getRecentNotifications(8)
}

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    updateRecentNotifications()
  }
})

// 监听通知数据变化
watch(notifications, () => {
  if (props.visible) {
    updateRecentNotifications()
  }
}, { deep: true })

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    info: InfoFilled,
    warning: Warning,
    success: SuccessFilled,
    error: Warning,
    system: Bell,
    expense: Wallet,
    bill: Document,
    member: User
  }
  return iconMap[type] || Bell
}

// 获取优先级样式类
const getPriorityClass = (priority: string) => {
  const classMap: Record<string, string> = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high'
  }
  return classMap[priority] || ''
}



// 查看全部通知
const viewAllNotifications = () => {
  router.push('/notifications')
  closePopover()
}

// 处理通知点击
const handleNotificationClick = (notification: any) => {
  // 标记为已读
  markAsRead(notification.id)
  
  // 如果有跳转路径，则跳转
  if (notification.actionPath) {
    router.push(notification.actionPath)
  }
  
  closePopover()
}

// 关闭弹窗
const closePopover = () => {
  emit('update:visible', false)
  emit('close')
}

// 点击外部关闭弹窗
const handleClickOutside = (event: MouseEvent) => {
  const popover = document.querySelector('.notification-popover')
  const notificationIcon = document.querySelector('.notification-icon')
  
  // 检查点击的元素是否在弹窗内或通知图标上
  if (popover && !popover.contains(event.target as Node) && 
      notificationIcon && !notificationIcon.contains(event.target as Node)) {
    closePopover()
  }
}

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 初始化最近通知
  updateRecentNotifications()
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-popover {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 2000;
  animation: fadeIn 0.2s ease-out;
}

.popover-arrow {
  position: absolute;
  top: -6px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  transform: rotate(45deg);
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-all-btn {
  font-size: 12px;
}

.popover-content {
  max-height: 320px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.notification-item:hover {
  background-color: rgba(64, 158, 255, 0.08);
}

.notification-item.unread {
  background-color: rgba(245, 108, 108, 0.05);
  border-left-color: #f56c6c;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.notification-icon.priority-low {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.notification-icon.priority-medium {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.notification-icon.priority-high {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-message {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.unread-count-badge {
  margin-left: 8px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-popover {
    right: 10px;
    width: calc(100vw - 20px);
    max-width: 320px;
  }
  
  .popover-arrow {
    right: 15px;
  }
}
</style>