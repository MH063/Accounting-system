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
              <div class="stat-number">1</div>
              <div class="stat-label">宿舍数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">4</div>
              <div class="stat-label">成员数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">¥1,250</div>
              <div class="stat-label">本月支出</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">¥3,400</div>
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
                    <div class="notification-time">{{ formatTime(notification.time) }}</div>
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
          <el-card>
            <template #header>
              <span>最近活动</span>
            </template>
            <el-timeline>
              <el-timeline-item>张同学支付了电费 ¥120</el-timeline-item>
              <el-timeline-item>李同学创建了新的支出记录</el-timeline-item>
              <el-timeline-item>王同学更新了宿舍设置</el-timeline-item>
              <el-timeline-item>赵同学加入了宿舍</el-timeline-item>
            </el-timeline>
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
                  :format-tooltip="(val) => val + '秒'"
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Setting, 
  Refresh, 
  Bell,
  DataAnalysis,
  Grid,
  List,
  Clock,
  Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由实例
const router = useRouter()

// 响应式数据
const autoRefreshEnabled = ref(false)
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const lastUpdateTime = ref(new Date())

// Widget系统
const enabledWidgets = ref(['stats', 'smart-notifications', 'activities'])
const widgetSettings = reactive({
  autoRefresh: true,
  refreshInterval: 30, // 秒
  showSmartNotifications: true,
  layout: 'default' // default, compact, detailed
})

// 智能提醒数据类型
interface SmartNotification {
  id: number
  title: string
  message: string
  priority: 'warning' | 'danger' | 'info'
  type: 'notification' | 'action'
  actionType?: string
  actionPath?: string
  time: Date
}

// 智能提醒数据
const smartNotifications = ref<SmartNotification[]>([
  {
    id: 1,
    title: '预算提醒',
    message: '本月支出已达到预算的80%，请注意控制开支',
    priority: 'warning',
    type: 'notification', // notification: 通知类, action: 操作类
    time: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 2,
    title: '账单提醒',
    message: '有3笔账单等待确认，请及时处理',
    priority: 'danger',
    type: 'action',
    actionType: 'bill-review', // 具体的操作类型
    actionPath: '/dashboard/bills', // 跳转路径
    time: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: 3,
    title: '成员提醒',
    message: '新成员加入申请待审核',
    priority: 'info',
    type: 'action',
    actionType: 'member-approval',
    actionPath: '/dashboard/members',
    time: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 4,
    title: '支出审核',
    message: '有2笔支出记录需要审核',
    priority: 'danger',
    type: 'action',
    actionType: 'expense-review',
    actionPath: '/dashboard/expense-review',
    time: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: 5,
    title: '系统通知',
    message: '系统将于今晚进行维护，预计持续30分钟',
    priority: 'info',
    type: 'notification',
    time: new Date(Date.now() - 60 * 60 * 1000)
  }
])

// 设置对话框
const widgetSettingsVisible = ref(false)
const activeSettingsTab = ref('widgets')

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
    // 模拟数据更新
    updateDashboardData()
    lastUpdateTime.value = new Date()
  }, widgetSettings.refreshInterval * 1000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

const updateDashboardData = () => {
  // 这里可以调用实际的API来更新数据
  console.log('数据已更新:', new Date().toLocaleTimeString())
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
  return `${Math.floor(minutes / 1440)}天前`
}

const handleNotificationAction = (notification: SmartNotification) => {
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
      // 移除已处理的提醒
      const index = smartNotifications.value.findIndex(n => n.id === notification.id)
      if (index > -1) {
        smartNotifications.value.splice(index, 1)
      }
      
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
      // 用户确认后移除提醒
      const index = smartNotifications.value.findIndex(n => n.id === notification.id)
      if (index > -1) {
        smartNotifications.value.splice(index, 1)
      }
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

// 生命周期
onMounted(() => {
  // 组件挂载时的初始化逻辑
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
  color: #303133;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #606266;
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
  color: #606266;
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
  color: #606266;
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