<template>
  <div class="notification-list">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <el-icon class="title-icon"><Bell /></el-icon>
            通知提醒
          </h1>
          <p class="page-description">查看和管理您的所有通知消息</p>
        </div>
        
        <div class="header-actions">
          <!-- 批量操作 -->
          <div v-if="selectedNotifications.length > 0" class="batch-actions">
            <span class="selected-count">已选择 {{ selectedNotifications.length }} 项</span>
            <el-button size="small" @click="batchMarkAsRead">
              批量标为已读
            </el-button>
            <el-button size="small" @click="batchMarkAsUnread">
              批量标为未读
            </el-button>
            <el-button size="small" type="warning" @click="batchMarkAsImportant">
              批量标记重要
            </el-button>
            <el-button size="small" type="danger" @click="batchDelete">
              批量删除
            </el-button>
            <el-button size="small" @click="clearSelection">
              取消选择
            </el-button>
          </div>
          
          <!-- 筛选和操作按钮 -->
          <el-button-group v-else>
            <el-button 
              :type="filterType === 'all' ? 'primary' : ''" 
              @click="setFilter('all')"
              size="small"
            >
              全部
            </el-button>
            <el-button 
              :type="filterType === 'unread' ? 'primary' : ''" 
              @click="setFilter('unread')"
              size="small"
            >
              未读
            </el-button>
            <el-button 
              :type="filterType === 'important' ? 'primary' : ''" 
              @click="setFilter('important')"
              size="small"
            >
              重要
            </el-button>
          </el-button-group>
          
          <el-button 
            type="primary" 
            @click="markAllAsRead"
            size="small"
            :disabled="unreadCount === 0"
          >
            <el-icon><Check /></el-icon>
            全部标为已读
          </el-button>
          
          <el-button 
            @click="openSettings"
            size="small"
          >
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>

      <!-- 通知分类标签 -->
      <div class="category-tabs">
        <div class="category-tabs-container">
          <el-button 
            v-for="category in categories"
            :key="category.key"
            :type="selectedCategory === category.key ? 'primary' : ''"
            @click="selectCategory(category.key)"
            class="category-tab"
            size="small"
          >
            <el-icon><component :is="category.icon" /></el-icon>
            {{ category.name }}
            <el-badge 
              v-if="getCategoryCount(category.key) > 0" 
              :value="getCategoryCount(category.key)" 
              class="category-badge"
              type="primary"
            />
          </el-button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalCount }}</div>
              <div class="stat-label">总通知数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon unread">
              <el-icon><Message /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ unreadCount }}</div>
              <div class="stat-label">未读通知</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon important">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ importantCount }}</div>
              <div class="stat-label">重要通知</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ todayCount }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="notification-section">
        <div class="section-header">
          <h3 class="section-title">
            通知列表
            <span class="notification-count">({{ filteredList.length }})</span>
          </h3>
          
          <div class="section-actions">
            <el-select 
              v-model="sortBy" 
              placeholder="排序方式" 
              size="small"
              style="width: 120px;"
            >
              <el-option label="时间倒序" value="time-desc" />
              <el-option label="时间正序" value="time-asc" />
              <el-option label="重要性" value="importance" />
            </el-select>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredList.length === 0" class="empty-container">
          <el-empty description="暂无通知消息">
            <template #image>
              <el-icon :size="80" color="#909399">
                <Bell />
              </el-icon>
            </template>
            <p>您当前没有{{ filterType === 'all' ? '' : filterType === 'unread' ? '未读' : '重要' }}通知消息</p>
          </el-empty>
        </div>

        <!-- 通知列表内容 -->
        <div v-else class="notification-container">
          <!-- 待办任务提醒 -->
          <div v-if="hasTodoNotifications" class="todo-reminder">
            <el-alert
              title="待办事项提醒"
              type="warning"
              :description="`您有 ${todoCount} 项待办任务需要处理`"
              show-icon
              :closable="false"
            >
              <template #default>
                <div class="todo-actions">
                  <el-button size="small" type="primary" @click="viewTodos">
                    查看待办
                  </el-button>
                  <el-button size="small" @click="dismissTodoReminder">
                    稍后提醒
                  </el-button>
                </div>
              </template>
            </el-alert>
          </div>

          <!-- 通知项列表 -->
          <div class="notification-items">
            <div 
              v-for="notification in paginatedNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 
                'unread': !notification.isRead,
                'important': notification.isImportant,
                'has-action': notification.actionText,
                'selected': selectedNotifications.includes(notification.id)
              }"
              @click="handleNotificationClick(notification)"
            >
              <!-- 批量选择框 -->
              <div class="notification-select">
                <el-checkbox 
                  :model-value="selectedNotifications.includes(notification.id)"
                  @change="toggleNotificationSelection(notification.id)"
                  @click.stop
                />
              </div>

              <!-- 未读标识 -->
              <div v-if="!notification.isRead" class="unread-indicator">
                <el-icon class="unread-dot"><CircleCheck /></el-icon>
              </div>

              <!-- 通知图标 -->
              <div class="notification-icon">
                <el-icon 
                  :size="20" 
                  :color="getNotificationIconColor(notification)"
                >
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>

              <!-- 通知内容 -->
              <div class="notification-content">
                <div class="notification-header">
                  <h4 class="notification-title">
                    {{ notification.title }}
                    <el-tag 
                      v-if="notification.isImportant" 
                      type="danger" 
                      size="small"
                      effect="plain"
                    >
                      重要
                    </el-tag>
                  </h4>
                  <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                </div>
                
                <p class="notification-message">{{ notification.message }}</p>
                
                <!-- 操作按钮 -->
                <div v-if="notification.actionText" class="notification-actions">
                  <el-button 
                    :type="notification.isImportant ? 'primary' : 'default'"
                    size="small"
                    @click.stop="handleNotificationAction(notification)"
                  >
                    {{ notification.actionText }}
                  </el-button>
                </div>
              </div>

              <!-- 操作按钮组 -->
              <div class="notification-operations">
                <el-button 
                  v-if="!notification.isRead"
                  text 
                  type="primary" 
                  size="small"
                  @click.stop="markAsRead(notification.id)"
                >
                  标为已读
                </el-button>
                
                <el-button 
                  text 
                  type="danger" 
                  size="small"
                  @click.stop="deleteNotification(notification.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>

          <!-- 分页器 -->
          <div v-if="filteredList.length > pageSize" class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 8, 12, 20, 50]"
              :total="filteredList.length"
              layout="total, sizes, prev, pager, next, jumper"
              background
            />
          </div>
      </div>
    </div>
  </div>
  
  <!-- 通知设置对话框 -->
  <el-dialog 
    v-model="settingsVisible" 
    title="通知设置" 
    width="600px"
    :before-close="handleSettingsClose"
  >
    <el-tabs v-model="activeSettingsTab">
      <!-- 通用设置 -->
      <el-tab-pane label="通用设置" name="general">
        <div class="settings-section">
          <h4>通知方式</h4>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.emailNotifications"
              active-text="邮件通知"
            />
          </div>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.pushNotifications"
              active-text="推送通知"
            />
          </div>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.soundEnabled"
              active-text="声音提醒"
            />
          </div>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.vibrationEnabled"
              active-text="振动提醒"
            />
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 分类设置 -->
      <el-tab-pane label="分类设置" name="categories">
        <div class="settings-section">
          <h4>各类别通知偏好</h4>
          <div 
            v-for="category in categories.slice(1)" 
            :key="category.key"
            class="category-setting"
          >
            <div class="category-header">
              <el-icon><component :is="category.icon" /></el-icon>
              <span class="category-name">{{ category.name }}</span>
            </div>
            <div class="category-toggles">
              <el-switch 
                :model-value="notificationSettings.categories[category.key].enabled"
                @change="(val) => updateCategorySetting(category.key, 'enabled', val)"
                active-text="启用"
              />
              <el-switch 
                :model-value="notificationSettings.categories[category.key].email"
                @change="(val) => updateCategorySetting(category.key, 'email', val)"
                active-text="邮件"
              />
              <el-switch 
                :model-value="notificationSettings.categories[category.key].push"
                @change="(val) => updateCategorySetting(category.key, 'push', val)"
                active-text="推送"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 静默时间段 -->
      <el-tab-pane label="静默时间" name="quiet">
        <div class="settings-section">
          <h4>静默时间段设置</h4>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.quietHours.enabled"
              active-text="启用静默时间"
            />
          </div>
          
          <div v-if="notificationSettings.quietHours.enabled" class="quiet-time-setup">
            <div class="time-input-group">
              <label>开始时间：</label>
              <el-time-select
                v-model="notificationSettings.quietHours.start"
                :picker-options="{
                  start: '00:00',
                  step: '00:15',
                  end: '23:59'
                }"
                placeholder="选择开始时间"
                style="width: 120px;"
              />
            </div>
            
            <div class="time-input-group">
              <label>结束时间：</label>
              <el-time-select
                v-model="notificationSettings.quietHours.end"
                :picker-options="{
                  start: '00:00',
                  step: '00:15',
                  end: '23:59'
                }"
                placeholder="选择结束时间"
                style="width: 120px;"
              />
            </div>
            
            <div class="quiet-time-status">
              <el-alert
                :title="isInQuietHours() ? '当前处于静默时间' : '当前为正常通知时间'"
                :type="isInQuietHours() ? 'warning' : 'info'"
                :closable="false"
                show-icon
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button @click="resetSettings">重置</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </div>
    </template>
  </el-dialog>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bell, 
  Check, 
  Message, 
  Star,
  Warning,
  InfoFilled,
  SuccessFilled,
  CircleCheck,
  User,
  Wallet,
  Document,
  Setting
} from '@element-plus/icons-vue'

// 类型定义
interface Notification {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  isImportant: boolean
  actionText?: string
  createdAt: string
}

// 响应式数据
const loading = ref(false)
const filterType = ref<'all' | 'unread' | 'important'>('all')
const sortBy = ref<'time-desc' | 'time-asc' | 'importance'>('time-desc')
const currentPage = ref(1)
const pageSize = ref(5)

// 分类相关
const selectedCategory = ref('all')
const categories = ref([
  { key: 'all', name: '全部', icon: Bell },
  { key: 'expense', name: '费用报销', icon: Wallet },
  { key: 'bill', name: '账单管理', icon: Document },
  { key: 'member', name: '成员管理', icon: User },
  { key: 'system', name: '系统通知', icon: Setting },
  { key: 'warning', name: '警告提醒', icon: Warning }
])

// 批量操作相关
const selectedNotifications = ref<number[]>([])

// 设置对话框相关
const settingsVisible = ref(false)
const activeSettingsTab = ref('general')

// 通知偏好设置
const notificationSettings = ref({
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  categories: {
    expense: { enabled: true, email: true, push: true },
    bill: { enabled: true, email: true, push: true },
    member: { enabled: true, email: true, push: true },
    system: { enabled: true, email: true, push: true },
    warning: { enabled: true, email: true, push: true }
  },
  quietHours: { enabled: false, start: '22:00', end: '08:00' }
})

// 通知数据（占位数据）
const notifications = ref<Notification[]>([
  {
    id: 1,
    title: '费用报销申请待审批',
    message: '您的费用报销申请已提交，等待管理员审批处理。',
    type: 'expense',
    isRead: false,
    isImportant: true,
    actionText: '查看详情',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    title: '月度账单生成完成',
    message: '2024年1月份的集体账单已生成完成，请及时查看。',
    type: 'bill',
    isRead: false,
    isImportant: false,
    actionText: '查看账单',
    createdAt: '2024-01-15T09:15:00Z'
  },
  {
    id: 3,
    title: '新成员加入申请',
    message: '张三申请加入您的寝室，需要您进行审核。',
    type: 'member',
    isRead: false,
    isImportant: true,
    actionText: '审核申请',
    createdAt: '2024-01-15T08:45:00Z'
  }
])

// 计算属性
const totalCount = computed(() => notifications.value.length)
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)
const importantCount = computed(() => notifications.value.filter(n => n.isImportant).length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return notifications.value.filter(n => 
    new Date(n.createdAt).toDateString() === today
  ).length
})

const todoCount = computed(() => {
  return notifications.value.filter(n => !n.isRead && n.isImportant).length
})

const hasTodoNotifications = computed(() => todoCount.value > 0)

const filteredList = computed(() => {
  let filtered = notifications.value
  
  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedCategory.value)
  }
  
  // 按类型筛选
  switch (filterType.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.isRead)
      break
    case 'important':
      filtered = filtered.filter(n => n.isImportant)
      break
  }
  
  // 排序
  switch (sortBy.value) {
    case 'time-asc':
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      break
    case 'importance':
      filtered.sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1
        if (!a.isImportant && b.isImportant) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      break
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  return filtered
})

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// 方法
const setFilter = (type: 'all' | 'unread' | 'important') => {
  filterType.value = type
  currentPage.value = 1
}

// 分类相关方法
const selectCategory = (category: string) => {
  selectedCategory.value = category
  currentPage.value = 1
  // 重置筛选条件
  filterType.value = 'all'
}

const getCategoryCount = (categoryKey: string) => {
  if (categoryKey === 'all') {
    return notifications.value.length
  }
  return notifications.value.filter(n => n.type === categoryKey).length
}

// 批量操作方法
const toggleNotificationSelection = (id: number) => {
  const index = selectedNotifications.value.indexOf(id)
  if (index > -1) {
    selectedNotifications.value.splice(index, 1)
  } else {
    selectedNotifications.value.push(id)
  }
}

const clearSelection = () => {
  selectedNotifications.value = []
}

const batchMarkAsRead = () => {
  selectedNotifications.value.forEach(id => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = true
    }
  })
  ElMessage.success(`已批量标为已读 ${selectedNotifications.value.length} 项`)
  clearSelection()
}

const batchMarkAsUnread = () => {
  selectedNotifications.value.forEach(id => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isRead = false
    }
  })
  ElMessage.success(`已批量标为未读 ${selectedNotifications.value.length} 项`)
  clearSelection()
}

const batchMarkAsImportant = () => {
  selectedNotifications.value.forEach(id => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.isImportant = !notification.isImportant
    }
  })
  ElMessage.success(`已批量标记重要性 ${selectedNotifications.value.length} 项`)
  clearSelection()
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedNotifications.value.length} 条通知吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    selectedNotifications.value.forEach(id => {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    })
    
    ElMessage.success(`已批量删除 ${selectedNotifications.value.length} 条通知`)
    clearSelection()
  } catch {
    // 用户取消操作
  }
}

// 设置相关方法
const openSettings = () => {
  settingsVisible.value = true
}

const updateCategorySetting = (categoryKey: string, settingKey: string, value: boolean) => {
  notificationSettings.value.categories[categoryKey][settingKey] = value
}

const handleSettingsClose = (done: () => void) => {
  // 可以在这里添加确认逻辑
  done()
}

const resetSettings = () => {
  ElMessageBox.confirm('确定要重置所有设置吗？', '重置确认', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重置为默认值
    notificationSettings.value = {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      categories: {
        expense: { enabled: true, email: true, push: true },
        bill: { enabled: true, email: true, push: true },
        member: { enabled: true, email: true, push: true },
        system: { enabled: true, email: true, push: true },
        warning: { enabled: true, email: true, push: true }
      },
      quietHours: { enabled: false, start: '22:00', end: '08:00' }
    }
    ElMessage.success('设置已重置')
  }).catch(() => {
    // 用户取消
  })
}

const saveSettings = () => {
  // TODO: 这里可以调用API保存设置到后端
  ElMessage.success('设置已保存')
  settingsVisible.value = false
}

// 静默时间段相关方法
const isInQuietHours = () => {
  const settings = notificationSettings.value.quietHours
  if (!settings.enabled) return false
  
  const now = new Date()
  const currentTime = now.getHours() * 100 + now.getMinutes()
  const startTime = parseInt(settings.start.replace(':', ''))
  const endTime = parseInt(settings.end.replace(':', ''))
  
  if (startTime > endTime) {
    // 跨越午夜的情况，如 22:00 到 08:00
    return currentTime >= startTime || currentTime <= endTime
  } else {
    // 同一天内的情况
    return currentTime >= startTime && currentTime <= endTime
  }
}

const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有通知标为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    notifications.value.forEach(notification => {
      notification.isRead = true
    })
    
    ElMessage.success('已全部标为已读')
  } catch {
    // 用户取消操作
  }
}

const markAsRead = (id: number) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.isRead = true
    ElMessage.success('已标为已读')
  }
}

const deleteNotification = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
      ElMessage.success('已删除通知')
    }
  } catch {
    // 用户取消操作
  }
}

const handleNotificationClick = (notification: Notification) => {
  if (!notification.isRead) {
    markAsRead(notification.id)
  }
  
  // TODO: 跳转到相关页面
  console.log('跳转到通知详情:', notification.id)
}

const handleNotificationAction = (notification: Notification) => {
  // TODO: 处理通知操作
  console.log('执行通知操作:', notification.actionText, notification.id)
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}分钟前`
    }
    return `${diffHours}小时前`
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}

const getNotificationIcon = (type: string) => {
  const iconMap = {
    expense: Wallet,
    bill: Document,
    member: User,
    system: Setting,
    warning: Warning,
    info: InfoFilled,
    success: SuccessFilled
  }
  return iconMap[type] || Bell
}

const getNotificationIconColor = (notification: Notification): string => {
  if (notification.isImportant) return '#f56c6c'
  if (!notification.isRead) return '#409eff'
  return '#909399'
}

const viewTodos = () => {
  // TODO: 跳转到待办页面
  ElMessage.info('跳转到待办页面')
}

const dismissTodoReminder = () => {
  // TODO: 关闭待办提醒
  ElMessage.info('将在下次访问时再次提醒')
}

// 生命周期
onMounted(() => {
  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style scoped>
.notification-list {
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 批量操作区域 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
}

.selected-count {
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
}

/* 分类标签 */
.category-tabs {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-tabs-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.category-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  font-size: 10px;
}

/* 通知项选择和未读标识 */
.notification-select {
  margin-right: 12px;
  flex-shrink: 0;
}

.unread-indicator {
  position: absolute;
  top: 16px;
  left: 52px;
  z-index: 2;
}

.unread-dot {
  color: #409eff;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 0 2px white;
}

.notification-item.selected {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
}

/* 设置对话框样式 */
.settings-section {
  padding: 8px 0;
}

.settings-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 0;
}

.category-setting {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #2c3e50;
}

.category-name {
  font-size: 14px;
}

.category-toggles {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quiet-time-setup {
  margin-top: 16px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.time-input-group label {
  width: 80px;
  font-weight: 500;
  color: #2c3e50;
}

.quiet-time-status {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content .page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.title-icon {
  color: #409eff;
}

.page-description {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 统计区域 */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.stat-icon.total { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.unread { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.important { background: linear-gradient(135deg, #ffecd2, #fcb69f); }
.stat-icon.today { background: linear-gradient(135deg, #a8edea, #fed6e3); }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

/* 通知列表区域 */
.notification-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.notification-count {
  color: #909399;
  font-weight: 400;
  font-size: 14px;
}

.loading-container,
.empty-container {
  padding: 60px 24px;
  text-align: center;
}

.todo-reminder {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.todo-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.notification-items {
  padding: 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 24px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  background-color: #fafafa;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-item.important {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.notification-icon {
  margin-right: 16px;
  padding-top: 2px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.notification-time {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
  margin-left: 12px;
}

.notification-message {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-operations {
  display: flex;
  gap: 8px;
  margin-left: 16px;
  flex-shrink: 0;
}

/* 分页器 */
.pagination-container {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .notification-item {
    padding: 12px 16px;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .notification-time {
    margin-left: 0;
  }
  
  .notification-operations {
    margin-left: 8px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>