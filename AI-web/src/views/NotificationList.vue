<template>
  <div class="container">
    <div class="page-header">
      <div class="header-content">
        <div class="title-with-back">
          <el-button 
            class="back-button" 
            :icon="ArrowLeft" 
            @click="goToDashboard"
            circle
          />
          <div>
            <h1 class="page-title">
              <el-icon class="title-icon"><Bell /></el-icon>
              通知中心
            </h1>
            <p class="page-description">查看和管理系统通知</p>
          </div>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- 批量操作 -->
        <div v-if="selectedNotifications.length > 0" class="batch-actions">
          <span class="selected-count">已选择 {{ selectedNotifications.length }} 项</span>
          <el-button 
            size="small" 
            type="primary" 
            @click="handleBatchMarkAsRead"
          >
            标为已读
          </el-button>
          <el-button 
            size="small" 
            @click="handleBatchMarkAsUnread"
          >
            标为未读
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleBatchDelete"
          >
            删除
          </el-button>
          <el-button 
            size="small" 
            @click="clearSelection"
          >
            取消选择
          </el-button>
        </div>
        
        <!-- 操作按钮 -->
        <el-button 
          :icon="Setting" 
          @click="openSettings"
        >
          设置
        </el-button>
        
        <el-button 
          type="primary" 
          :icon="Check" 
          @click="handleMarkAllAsRead"
        >
          全部标为已读
        </el-button>
      </div>
    </div>
    
    <!-- 分类标签 -->
    <div class="category-tabs">
      <div class="category-tabs-container">
        <el-button
          v-for="category in categories"
          :key="category.key"
          :type="selectedCategory === category.key ? 'primary' : 'default'"
          :class="['category-tab', { active: selectedCategory === category.key }]"
          @click="selectCategory(category.key)"
        >
          <el-icon><component :is="category.icon" /></el-icon>
          {{ category.name }}
          <el-badge 
            :value="getCategoryCount(category.key)" 
            :max="99" 
            :type="category.key === 'all' ? 'primary' : 'info'"
            class="category-badge"
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
            <div class="stat-label">总通知数</div>
            <div class="stat-number">{{ notifications.length }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon unread">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">未读通知</div>
            <div class="stat-number">{{ unreadCount }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon important">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">重要通知</div>
            <div class="stat-number">{{ todoCount }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon today">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">今日通知</div>
            <div class="stat-number">{{ todayCount }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 筛选和排序 -->
    <div class="filters-section">
      <div class="filters-bar">
        <div class="filter-group">
          <el-button-group>
            <el-button 
              :type="filterType === 'all' ? 'primary' : 'default'"
              @click="setFilter('all')"
            >
              全部
            </el-button>
            <el-button 
              :type="filterType === 'unread' ? 'primary' : 'default'"
              @click="setFilter('unread')"
            >
              未读
            </el-button>
            <el-button 
              :type="filterType === 'important' ? 'primary' : 'default'"
              @click="setFilter('important')"
            >
              重要
            </el-button>
          </el-button-group>
        </div>
        
        <div class="sort-group">
          <el-select 
            v-model="sortBy" 
            placeholder="排序方式"
            size="small"
          >
            <el-option label="按时间倒序" value="time-desc" />
            <el-option label="按时间正序" value="time-asc" />
            <el-option label="按重要性" value="importance" />
          </el-select>
        </div>
      </div>
    </div>
    
    <!-- 通知列表 -->
    <div class="notifications-section">
      <div v-if="loading" class="loading-container">
        <el-skeleton animated>
          <template #template>
            <div v-for="i in 5" :key="i" class="notification-skeleton">
              <el-skeleton-item variant="circle" style="width: 40px; height: 40px;" />
              <div style="flex: 1; margin-left: 16px;">
                <el-skeleton-item variant="h3" style="width: 50%" />
                <div style="margin-top: 16px;">
                  <el-skeleton-item variant="text" style="width: 30%" />
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
      
      <div v-else>
        <div v-if="paginatedNotifications.length === 0" class="empty-state">
          <el-empty description="暂无通知">
            <el-button type="primary" @click="goToDashboard">返回仪表盘</el-button>
          </el-empty>
        </div>
        
        <div v-else>
          <div 
            v-for="notification in paginatedNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 
              unread: !notification.isRead,
              important: notification.isImportant,
              selected: selectedNotifications.includes(notification.id)
            }"
            @click="toggleNotificationSelection(notification.id)"
          >
            <!-- 选择框 -->
            <div class="selection-column">
              <el-checkbox 
                :model-value="selectedNotifications.includes(notification.id)"
                @click.stop
                @change="() => toggleNotificationSelection(notification.id)"
              />
            </div>
            
            <!-- 通知内容 -->
            <div class="content-column">
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
                <div v-if="notification.actionText || notification.actionPath" class="notification-actions">
                  <el-button 
                    :type="notification.isImportant ? 'primary' : 'default'"
                    size="small"
                    @click.stop="handleNotificationAction(notification)"
                  >
                    {{ notification.actionText || '处理' }}
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
                  @click.stop="handleSingleMarkAsRead(notification.id)"
                >
                  标为已读
                </el-button>
                
                <el-button 
                  text 
                  type="danger" 
                  size="small"
                  @click.stop="handleSingleDelete(notification.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
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
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.smsNotifications"
              active-text="短信通知"
            />
          </div>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.systemNotifications"
              active-text="系统通知"
              @change="saveNotificationPreferences"
            />
          </div>
        </div>
      </el-tab-pane>
      
      <!-- 提醒设置 -->
      <el-tab-pane label="提醒设置" name="reminders">
        <div class="settings-section">
          <h4>提醒偏好</h4>
          <div class="setting-item">
            <el-switch 
              v-model="notificationSettings.billReminder"
              active-text="账单提醒"
              @change="saveNotificationPreferences"
            />
          </div>
          
          <div class="setting-item" v-if="notificationSettings.billReminder">
            <span class="setting-label">提醒时间</span>
            <el-time-picker 
              v-model="notificationSettings.reminderTime" 
              format="HH:mm" 
              @change="saveNotificationPreferences"
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
                :model-value="getCategorySetting(category.key, 'enabled')"
                @change="(val: boolean) => updateCategorySetting(category.key, 'enabled', val)"
                active-text="启用"
              />
              <el-switch 
                :model-value="getCategorySetting(category.key, 'email')"
                @change="(val: boolean) => updateCategorySetting(category.key, 'email', val)"
                active-text="邮件"
              />
              <el-switch 
                :model-value="getCategorySetting(category.key, 'push')"
                @change="(val: boolean) => updateCategorySetting(category.key, 'push', val)"
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
  
  <!-- 确认处理对话框 -->
  <el-dialog
    v-model="confirmDialogVisible"
    title="确认操作"
    width="400px"
    :before-close="cancelNotificationAction"
  >
    <div class="confirm-dialog-content">
      <el-alert
        v-if="pendingNotification"
        :title="`您即将执行操作：${pendingNotification.actionText || '处理'}`
"
        type="warning"
        show-icon
        :closable="false"
      />
      <p class="confirm-message">
        确定要继续执行此操作吗？
      </p>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelNotificationAction">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmNotificationAction"
        >
          确认执行
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Bell, 
  Warning, 
  InfoFilled, 
  SuccessFilled, 
  Star,
  Wallet,
  Document,
  User,
  Setting,
  Folder,
  ArrowLeft,
  Check
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNotifications } from '../services/notificationService'
import type { Notification } from '../services/notificationService'

// 路由
const router = useRouter()

// 使用通知服务
const { 
  notifications, 
  markAsRead, 
  markAsUnread, 
  deleteNotification, 
  batchMarkAsRead, 
  batchMarkAsUnread, 
  batchDelete, 
  batchToggleImportance,
  markAllAsRead
} = useNotifications()

// 状态管理
const loading = ref(false)
const settingsVisible = ref(false)
const activeSettingsTab = ref('')
const selectedCategory = ref('')
const filterType = ref<'all' | 'unread' | 'important'>('all')
const sortBy = ref<'time-desc' | 'time-asc' | 'importance'>('time-desc')
const selectedNotifications = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(8)
const confirmDialogVisible = ref(false)
const pendingNotification = ref<Notification | null>(null)

// 定义通知分类类型
interface NotificationCategory {
  enabled: boolean
  email: boolean
  push: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  smsNotifications: boolean
  systemNotifications: boolean
  billReminder: boolean
  reminderTime: Date
  categories: Record<string, NotificationCategory>
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

// 通知设置
const notificationSettings = ref<NotificationSettings>({
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  smsNotifications: false,
  systemNotifications: true,
  billReminder: true,
  reminderTime: new Date(2023, 0, 1, 9, 0, 0), // 默认早上9点
  categories: {
    expense: { enabled: true, email: true, push: true },
    bill: { enabled: true, email: true, push: true },
    member: { enabled: true, email: true, push: true },
    system: { enabled: true, email: true, push: true },
    warning: { enabled: true, email: true, push: true }
  },
  quietHours: { enabled: false, start: '22:00', end: '08:00' }
})

// 分类定义
const categories = [
  { key: 'all', name: '全部', icon: Folder },
  { key: 'expense', name: '费用', icon: Wallet },
  { key: 'bill', name: '账单', icon: Document },
  { key: 'member', name: '成员', icon: User },
  { key: 'system', name: '系统', icon: Setting },
  { key: 'warning', name: '警告', icon: Warning }
]

// 计算属性
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isRead).length
})

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return notifications.value.filter(n => 
    new Date(n.createdAt).toDateString() === today
  ).length
})

const todoCount = computed(() => {
  return notifications.value.filter(n => !n.isRead && n.isImportant).length
})

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

// 获取分类设置
const getCategorySetting = (categoryKey: string, settingKey: string): boolean => {
  if (notificationSettings.value.categories[categoryKey]) {
    return notificationSettings.value.categories[categoryKey][settingKey as keyof NotificationCategory]
  }
  return false
}

// 更新分类设置
const updateCategorySetting = (categoryKey: string, settingKey: string, value: boolean) => {
  if (notificationSettings.value.categories[categoryKey]) {
    notificationSettings.value.categories[categoryKey][settingKey as keyof NotificationCategory] = value
  }
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

const handleBatchMarkAsRead = () => {
  batchMarkAsRead(selectedNotifications.value)
  ElMessage.success(`已批量标为已读 ${selectedNotifications.value.length} 项`)
  clearSelection()
}

const handleBatchMarkAsUnread = () => {
  batchMarkAsUnread(selectedNotifications.value)
  ElMessage.success(`已批量标为未读 ${selectedNotifications.value.length} 项`)
  clearSelection()
}

const handleBatchDelete = async () => {
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
    
    batchDelete(selectedNotifications.value)
    
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

const handleSettingsClose = (done: () => void) => {
  // 可以在这里添加确认逻辑
  done()
}

// 保存通知偏好设置到localStorage
const saveNotificationPreferences = () => {
  try {
    const preferences = {
      systemNotifications: notificationSettings.value.systemNotifications,
      emailNotifications: notificationSettings.value.emailNotifications,
      smsNotifications: notificationSettings.value.smsNotifications,
      billReminder: notificationSettings.value.billReminder,
      reminderTime: notificationSettings.value.reminderTime.toISOString()
    }
    
    localStorage.setItem('notification-preferences', JSON.stringify(preferences))
    ElMessage.success('通知设置已保存')
  } catch (error) {
    console.error('保存通知设置失败:', error)
    ElMessage.error('保存通知设置失败')
  }
}

// 从localStorage加载通知偏好设置
const loadNotificationPreferences = () => {
  try {
    const preferencesStr = localStorage.getItem('notification-preferences')
    if (preferencesStr) {
      const preferences = JSON.parse(preferencesStr)
      
      // 更新通知设置
      notificationSettings.value.systemNotifications = preferences.systemNotifications ?? true
      notificationSettings.value.emailNotifications = preferences.emailNotifications ?? true
      notificationSettings.value.smsNotifications = preferences.smsNotifications ?? false
      notificationSettings.value.billReminder = preferences.billReminder ?? true
      
      // 解析提醒时间
      if (preferences.reminderTime) {
        notificationSettings.value.reminderTime = new Date(preferences.reminderTime)
      }
    }
  } catch (error) {
    console.error('加载通知设置失败:', error)
  }
}

const resetSettings = () => {
  ElMessageBox.confirm('确定要重置所有设置吗？', '重置确认', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重置为默认值
    notificationSettings.value.emailNotifications = true
    notificationSettings.value.pushNotifications = true
    notificationSettings.value.soundEnabled = true
    notificationSettings.value.vibrationEnabled = true
    notificationSettings.value.smsNotifications = false
    notificationSettings.value.systemNotifications = true
    notificationSettings.value.billReminder = true
    notificationSettings.value.reminderTime = new Date(2023, 0, 1, 9, 0, 0)
    notificationSettings.value.categories = {
      expense: { enabled: true, email: true, push: true },
      bill: { enabled: true, email: true, push: true },
      member: { enabled: true, email: true, push: true },
      system: { enabled: true, email: true, push: true },
      warning: { enabled: true, email: true, push: true }
    }
    notificationSettings.value.quietHours = { enabled: false, start: '22:00', end: '08:00' }
    
    // 保存重置后的设置
    saveNotificationPreferences()
    ElMessage.success('设置已重置')
  }).catch(() => {
    // 用户取消
  })
}

const saveSettings = async () => {
  // 保存通知偏好设置到localStorage
  saveNotificationPreferences()
  
  // 调用真实API保存设置到后端
  try {
    const { saveNotificationSettings } = await import('@/services/notificationSettingsService')
    
    // 构造设置对象
    const settings = {
      systemNotifications: notificationSettings.value.systemNotifications,
      emailNotifications: notificationSettings.value.emailNotifications,
      smsNotifications: notificationSettings.value.smsNotifications,
      pushNotifications: notificationSettings.value.pushNotifications,
      soundEnabled: notificationSettings.value.soundEnabled,
      vibrationEnabled: notificationSettings.value.vibrationEnabled,
      billReminder: notificationSettings.value.billReminder,
      reminderTime: notificationSettings.value.reminderTime.toISOString(),
      categories: notificationSettings.value.categories,
      quietHours: notificationSettings.value.quietHours
    }
    
    const response = await saveNotificationSettings(settings)
    
    if (response.success) {
      ElMessage.success('设置已保存')
    } else {
      ElMessage.error(response.message || '保存设置失败')
    }
  } catch (error) {
    console.error('保存设置到后端失败:', error)
    ElMessage.error('保存设置到后端失败: ' + (error as Error).message)
  }
  
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

const handleMarkAllAsRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有通知标为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    markAllAsRead()
    ElMessage.success('已将所有通知标为已读')
  } catch {
    // 用户取消操作
  }
}

// 单个操作方法
const handleSingleMarkAsRead = (id: number) => {
  markAsRead(id)
  ElMessage.success('已标为已读')
}

const handleSingleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    deleteNotification(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消操作
  }
}

// 处理通知操作 - 新增确认对话框功能
const handleNotificationAction = (notification: Notification) => {
  // 标记为已读
  markAsRead(notification.id)
  
  // 检查是否需要确认对话框
  // 对于需要用户确认的操作（如审批、审核等），显示确认对话框
  const needsConfirmation = ['审核申请', '查看详情', '审批'].some(keyword => 
    notification.actionText?.includes(keyword)
  )
  
  if (needsConfirmation) {
    // 显示确认对话框
    pendingNotification.value = notification
    confirmDialogVisible.value = true
  } else {
    // 直接执行跳转
    executeNotificationAction(notification)
  }
}

// 执行通知操作
const executeNotificationAction = (notification: Notification) => {
  // 如果有跳转路径，则跳转
  if (notification.actionPath) {
    router.push(notification.actionPath)
    console.log(`跳转到: ${notification.actionPath}`)
  }
  
  // 执行特定操作
  console.log(`执行通知操作: ${notification.actionText || '处理'}`)
}

// 确认处理操作
const confirmNotificationAction = () => {
  if (pendingNotification.value) {
    executeNotificationAction(pendingNotification.value)
    confirmDialogVisible.value = false
    pendingNotification.value = null
  }
}

// 取消处理操作
const cancelNotificationAction = () => {
  confirmDialogVisible.value = false
  pendingNotification.value = null
}

// 返回仪表盘
const goToDashboard = () => {
  router.push('/dashboard')
  console.log('返回仪表盘页面')
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
  return `${Math.floor(minutes / 1440)}天前`
}

// 组件挂载时的初始化逻辑
onMounted(() => {
  // 模拟加载数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
  
  loadNotificationPreferences()
})

// 监听通知变化，更新分页
watch(notifications, () => {
  // 如果当前页没有数据，回到第一页
  if (paginatedNotifications.value.length === 0 && currentPage.value > 1) {
    currentPage.value = 1
  }
})
</script>

<style scoped>
.container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(120deg, #ecf5ff, #f0f9ff);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  flex: 1;
}

.title-with-back {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  background: white;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.back-button:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.title-icon {
  color: #409eff;
}

.page-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f9ff;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #d0e9ff;
}

.selected-count {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

.category-tabs {
  margin-bottom: 24px;
}

.category-tabs-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-badge {
  margin-left: 4px;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-icon.total {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.stat-icon.unread {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.stat-icon.important {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.stat-icon.today {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

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