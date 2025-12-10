<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="dashboard-header">
          <h1>仪表盘</h1>
          <p>欢迎使用宿舍管理系统</p>
          <div class="header-actions">
            <el-button type="primary" :icon="Setting" @click="openWidgetSettings">
              个性化设置
            </el-button>
            <el-button :type="autoRefreshEnabled ? 'success' : 'info'" :icon="Refresh" @click="toggleAutoRefresh">
              {{ autoRefreshEnabled ? '已开启实时更新' : '开启实时更新' }}
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 个性化Widget系统 -->
    <div class="widget-grid" v-if="enabledWidgets.includes('stats')">
      <el-row :gutter="20" class="dashboard-stats">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ dashboardData.dormitoryCount || 0 }}</div>
              <div class="stat-label">宿舍数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ dashboardData.memberCount || 0 }}</div>
              <div class="stat-label">成员数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">¥{{ dashboardData.monthlyExpense || 0 }}</div>
              <div class="stat-label">本月支出</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">¥{{ dashboardData.totalBudget || 0 }}</div>
              <div class="stat-label">总预算</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 智能提醒推送 -->
    <div class="widget-grid" v-if="enabledWidgets.includes('smart-notifications')">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="smart-notifications-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><Bell /></el-icon> 智能提醒</span>
                <el-tag :type="hasNewNotifications ? 'danger' : 'success'" size="small">
                  {{ hasNewNotifications ? '有新的提醒' : '暂无新提醒' }}
                </el-tag>
              </div>
            </template>
            <div class="smart-notifications">
              <div v-if="smartNotifications.length === 0" class="no-notifications">
                <el-empty description="暂无智能提醒" :image-size="60" />
              </div>
              <div v-else class="notifications-list">
                <div v-for="notification in smartNotifications" :key="notification.id" 
                     class="notification-item" :class="notification.priority">
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatRelativeTime(notification.time) }}</div>
                  </div>
                  <div class="notification-actions">
                    <el-button size="small" type="primary" @click="handleNotificationAction(notification)">
                      处理
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近活动区域 -->
    <div class="widget-grid" v-if="enabledWidgets.includes('activities')">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="activity-history-card">
            <template #header>
              <div class="card-header">
                <span><el-icon><Clock /></el-icon> 最近活动</span>
                <el-tag type="info" size="small">
                  {{ recentActivities.length }} 条记录
                </el-tag>
              </div>
            </template>
            <div class="activity-history">
              <div v-if="recentActivities.length === 0" class="no-activities">
                <el-empty description="暂无活动记录" :image-size="60" />
              </div>
              <div v-else class="activities-list">
                <div v-for="activity in recentActivities" :key="activity.id" 
                     class="activity-item" :class="getActivityTypeClass(activity.type)">
                  <div class="activity-icon">
                    <el-icon><component :is="getActivityIcon(activity.type)" /></el-icon>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ activity.title }}</div>
                    <div class="activity-description">{{ activity.description }}</div>
                    <div class="activity-meta">
                      <span class="activity-time">{{ formatRelativeTime(activity.time) }}</span>
                      <span v-if="activity.user" class="activity-user">{{ activity.user }}</span>
                      <span v-if="activity.amount" class="activity-amount">¥{{ activity.amount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 个性化Widget设置对话框 -->
    <el-dialog v-model="widgetSettingsVisible" title="个性化设置" width="600px" destroy-on-close>
      <el-tabs v-model="activeSettingsTab">
        <!-- Widget管理 -->
        <el-tab-pane label="Widget管理" name="widgets">
          <div class="widget-settings">
            <div class="settings-section">
              <h3>显示的Widget</h3>
              <div class="widget-toggles">
                <div class="widget-toggle" :class="{ active: enabledWidgets.includes('stats') }">
                  <div class="widget-info">
                    <el-icon class="widget-icon"><DataAnalysis /></el-icon>
                    <span>统计数据</span>
                  </div>
                  <el-switch :model-value="enabledWidgets.includes('stats')" @change="toggleWidget('stats')" />
                </div>
                <div class="widget-toggle" :class="{ active: enabledWidgets.includes('smart-notifications') }">
                  <div class="widget-info">
                    <el-icon class="widget-icon"><Bell /></el-icon>
                    <span>智能提醒</span>
                  </div>
                  <el-switch :model-value="enabledWidgets.includes('smart-notifications')" @change="toggleWidget('smart-notifications')" />
                </div>
                <div class="widget-toggle" :class="{ active: enabledWidgets.includes('activities') }">
                  <div class="widget-info">
                    <el-icon class="widget-icon"><Clock /></el-icon>
                    <span>最近活动</span>
                  </div>
                  <el-switch :model-value="enabledWidgets.includes('activities')" @change="toggleWidget('activities')" />
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h3>布局设置</h3>
              <div class="layout-options">
                <div class="layout-option" :class="{ active: widgetSettings.layout === 'default' }" @click="widgetSettings.layout = 'default'">
                  <el-icon :size="24"><Grid /></el-icon>
                  <div style="margin-top: 8px;">默认布局</div>
                </div>
                <div class="layout-option" :class="{ active: widgetSettings.layout === 'compact' }" @click="widgetSettings.layout = 'compact'">
                  <el-icon :size="24"><List /></el-icon>
                  <div style="margin-top: 8px;">紧凑布局</div>
                </div>
                <div class="layout-option" :class="{ active: widgetSettings.layout === 'detailed' }" @click="widgetSettings.layout = 'detailed'">
                  <el-icon :size="24"><Document /></el-icon>
                  <div style="margin-top: 8px;">详细布局</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 实时更新 -->
        <el-tab-pane label="实时更新" name="refresh">
          <div class="widget-settings">
            <div class="settings-section">
              <h3>自动刷新设置</h3>
              <div class="refresh-settings">
                <div>
                  <div style="font-weight: bold; margin-bottom: 5px;">启用自动刷新</div>
                  <div style="font-size: 12px; color: #606266;">定期自动更新仪表盘数据</div>
                </div>
                <el-switch v-model="widgetSettings.autoRefresh" />
              </div>
              
              <div style="margin-top: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px;">刷新间隔</div>
                <el-slider 
                  v-model="widgetSettings.refreshInterval" 
                  :min="10" 
                  :max="300" 
                  :step="10"
                  :format-tooltip="(val: number) => val + '秒'"
                  show-stops
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <div class="widget-settings">
            <div class="settings-section">
              <h3>智能提醒设置</h3>
              <div class="refresh-settings">
                <div>
                  <div style="font-weight: bold; margin-bottom: 5px;">启用智能提醒</div>
                  <div style="font-size: 12px; color: #606266;">根据使用习惯推送个性化提醒</div>
                </div>
                <el-switch v-model="widgetSettings.showSmartNotifications" />
              </div>
            </div>


          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetWidgetSettings">重置</el-button>
          <el-button @click="widgetSettingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveWidgetSettings">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, 
  Wallet, 
  Document,
  Bell,
  Warning,
  InfoFilled,
  SuccessFilled,
  Star,
  Setting,
  Refresh,
  CaretTop,
  CaretBottom,
  Clock,
  DataAnalysis,
  Grid,
  List
} from '@element-plus/icons-vue'
import { formatRelativeTime } from '@/utils/timeUtils'
import { useNotifications } from '../services/notificationService'
import type { Notification } from '../services/notificationService'
import dashboardService from '@/services/dashboardService'
import { withLoading } from '@/utils/loadingUtils'
import { handleApiError } from '@/utils/errorUtils'

// 路由实例
const route = useRoute()
const router = useRouter()

// 使用通知服务
const { notifications, getSmartReminders } = useNotifications()

// 活动历史数据类型
interface Activity {
  id: number
  title: string
  description: string
  time: Date
  type: 'payment' | 'expense' | 'member' | 'setting' | 'bill'
  amount?: number
  user?: string
}

// 状态管理
const loading = ref(false)
const autoRefreshEnabled = ref(true)
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const lastUpdateTime = ref(new Date())
const enabledWidgets = ref<string[]>([])
const widgetSettings = reactive({
  autoRefresh: true,
  refreshInterval: 30, // 秒
  showSmartNotifications: true,
  layout: 'default' // default, compact, detailed
})

// 仪表盘数据
const dashboardData = reactive({
  dormitoryCount: 0,
  memberCount: 0,
  monthlyExpense: 0,
  totalBudget: 0
})

// 活动历史数据 - 改为从真实API获取
const activityHistory = ref<Activity[]>([])

// 加载活动历史数据
const loadActivityHistory = async () => {
  try {
    console.log('加载活动历史数据...')
    
    const response = await dashboardService.getActivityHistory(10)
    
    if (response.success) {
      activityHistory.value = response.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        time: new Date(item.time),
        type: item.type,
        user: item.userName
      }))
    } else {
      console.error('加载活动历史失败:', response.message)
      activityHistory.value = []
    }
    
  } catch (error) {
    console.error('加载活动历史失败:', error)
    activityHistory.value = []
  }
}

// 智能提醒数据 - 改为从通知服务获取
const smartNotifications = computed(() => {
  return getSmartReminders().map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    priority: notification.isImportant ? (notification.type === 'warning' ? 'danger' : 'warning') : 'info',
    type: notification.actionPath ? 'action' : 'notification',
    actionType: notification.type,
    actionPath: notification.actionPath,
    time: new Date(notification.createdAt)
  }))
})

// 最近活动数据（只显示最近的5条）
const recentActivities = computed(() => {
  return [...activityHistory.value]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5)
})

// 设置对话框
const widgetSettingsVisible = ref(false)
const activeSettingsTab = ref('')

// 计算属性
const hasNewNotifications = computed(() => {
  return smartNotifications.value.length > 0
})

// 方法
const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshInterval.value = setInterval(() => {
    // 自动刷新仪表盘数据
    updateDashboardData()
    loadActivityHistory() // 同时刷新活动历史
    lastUpdateTime.value = new Date()
  }, widgetSettings.refreshInterval * 1000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

const updateDashboardData = async () => {
  try {
    const response = await dashboardService.getDashboardStats()
    console.log('仪表盘数据更新成功:', response)
    
    // 更新仪表盘数据
    if (response.success && response.data) {
      dashboardData.dormitoryCount = response.data.dormitoryCount || 0
      dashboardData.memberCount = response.data.memberCount || 0
      dashboardData.monthlyExpense = response.data.monthlyExpense || 0
      dashboardData.totalBudget = response.data.totalBudget || 0
    }
  } catch (error) {
    handleApiError(error, '数据更新失败')
  }
}



// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    payment: Wallet,
    expense: Document,
    member: User,
    setting: Setting,
    bill: Document
  }
  return iconMap[type] || Clock
}

// 获取活动类型样式
const getActivityTypeClass = (type: string) => {
  const classMap: Record<string, string> = {
    payment: 'payment',
    expense: 'expense',
    member: 'member',
    setting: 'setting',
    bill: 'bill'
  }
  return classMap[type] || ''
}

// 智能提醒处理方法
const handleNotificationAction = (notification: any) => {
  console.log('处理智能提醒:', notification)
  
  // 判断提醒类型
  if (notification.type === 'action' && notification.actionPath) {
    // 操作类提醒：需要人工干预，跳转到相关页面
    ElMessageBox.confirm(
      `${notification.message}<br><br><strong>点击确定将跳转至处理页面</strong>`, 
      notification.title, 
      {
        confirmButtonText: '立即处理',
        cancelButtonText: '稍后处理',
        type: notification.priority === 'danger' ? 'warning' : 'info',
        dangerouslyUseHTMLString: true
      }
    ).then(() => {
      // 跳转到相关页面
      router.push(notification.actionPath)
      ElMessage.success('正在跳转到处理页面...')
    }).catch(() => {
      // 用户选择稍后处理，不做任何操作
      console.log('用户选择稍后处理提醒')
    })
  } else {
    // 通知类提醒：仅需知晓，保持弹窗展示形式
    ElMessageBox.alert(
      notification.message,
      notification.title,
      {
        confirmButtonText: '我知道了',
        type: notification.priority === 'warning' ? 'warning' : 'info'
      }
    ).then(() => {
      ElMessage.success('提醒已确认')
    })
  }
}

const openWidgetSettings = () => {
  widgetSettingsVisible.value = true
}

const saveWidgetSettings = () => {
  // 保存设置
  ElMessage.success('设置已保存')
  widgetSettingsVisible.value = false
}

const resetWidgetSettings = () => {
  // 重置设置
  widgetSettings.autoRefresh = true
  widgetSettings.refreshInterval = 30
  widgetSettings.showSmartNotifications = true
  widgetSettings.layout = 'default'
  ElMessage.info('设置已重置')
}

const toggleWidget = (widgetType: string) => {
  const index = enabledWidgets.value.indexOf(widgetType)
  if (index > -1) {
    enabledWidgets.value.splice(index, 1)
  } else {
    enabledWidgets.value.push(widgetType)
  }
}

// 组件挂载和卸载生命周期
onMounted(async () => {
  loading.value = true
  try {
    // 加载仪表盘统计数据
    await updateDashboardData()
    
    // 加载活动历史数据
    await loadActivityHistory()
    
    // 启动自动刷新
    if (widgetSettings.autoRefresh) {
      startAutoRefresh()
    }
  } catch (error) {
    console.error('初始化仪表盘失败:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.dashboard-header h1 {
  color: #1f2937;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #4b5563;
  font-size: 16px;
}

.dashboard-stats {
  margin-bottom: 30px;
}

.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 10px;
}

.stat-card {
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.stat-content {
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  color: #4b5563;
  font-size: 14px;
}

.widget-grid {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.smart-notifications-card {
  min-height: 300px;
}

.smart-notifications {
  max-height: 250px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.warning {
  border-left: 3px solid #E6A23C;
}

.notification-item.danger {
  border-left: 3px solid #F56C6C;
}

.notification-item.info {
  border-left: 3px solid #909399;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #303133;
}

.notification-message {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 6px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-actions {
  margin-left: 12px;
}

.no-notifications {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.activity-history-card {
  min-height: 300px;
}

.activity-history {
  max-height: 250px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background-color: #f5f7fa;
}

.activity-item.payment {
  border-left: 3px solid #409EFF;
}

.activity-item.expense {
  border-left: 3px solid #E6A23C;
}

.activity-item.member {
  border-left: 3px solid #67C23A;
}

.activity-item.setting {
  border-left: 3px solid #909399;
}

.activity-item.bill {
  border-left: 3px solid #F56C6C;
}

.activity-icon {
  margin-right: 12px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #303133;
}

.activity-description {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 6px;
}

.activity-meta {
  font-size: 12px;
  color: #909399;
}

.activity-time {
  margin-right: 8px;
}

.activity-user {
  margin-right: 8px;
}

.activity-amount {
  font-weight: bold;
}

.no-activities {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.widget-settings {
  padding: 10px 0;
}

.settings-section {
  margin-bottom: 25px;
}

.settings-section h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 16px;
}

.widget-toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.widget-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #DCDFE6;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.widget-toggle:hover {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.widget-toggle.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.widget-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.widget-icon {
  color: #409EFF;
}

.layout-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #DCDFE6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.layout-option:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.layout-option.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
  color: #409EFF;
}

.refresh-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}


</style>