<template>
  <header class="header">
    <div class="header-left">
      <div class="logo-container">
        <img src="../assets/admin-avatar.png" alt="Logo" class="logo" />
        <span class="title">AI管理系统</span>
      </div>
    </div>
    <div class="header-right">
      <!-- 通知按钮 -->
      <div class="notification-icon" @click.stop="toggleNotificationPanel">
        <el-badge :value="unreadNotifications" :max="99" v-if="unreadNotifications > 0">
          <el-icon size="20"><Bell /></el-icon>
        </el-badge>
        <el-icon size="20" v-else><Bell /></el-icon>
      </div>
      
      <div class="user-info">
        <el-dropdown>
          <span class="user-name">
            <img src="https://picsum.photos/seed/user-avatar/32/32.jpg" alt="用户头像" class="avatar" />
            管理员
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item>修改密码</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 通知面板 -->
    <div 
      v-show="showNotificationPanel" 
      class="notification-panel" 
      @click.stop
    >
      <div class="panel-header">
        <span>最新动态</span>
        <div class="panel-header-actions">
          <el-button size="small" @click.stop="refreshNotifications">刷新</el-button>
          <el-button size="small" @click.stop="closeNotificationPanel" icon="Close">退出</el-button>
        </div>
      </div>
      <div class="panel-content" @scroll="handlePanelScroll">
        <el-timeline v-if="notifications.length > 0">
          <el-timeline-item
            v-for="(notification, index) in notifications.slice(0, 5)"
            :key="index"
            :timestamp="notification.timestamp"
            :type="notification.type"
          >
            {{ notification.content }}
          </el-timeline-item>
        </el-timeline>
        <div v-else class="no-notifications">
          暂无通知
        </div>
      </div>
      <div class="panel-footer">
        <el-button link @click.stop="clearAllNotifications">清空所有</el-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowDown, Bell, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const showNotificationPanel = ref(false)
const unreadNotifications = ref(5)
const notifications = ref([
  {
    content: '用户张三新增了一条费用记录',
    timestamp: '2023-11-15 14:30:22',
    type: ''
  },
  {
    content: '系统自动执行了每日日志清理任务',
    timestamp: '2023-11-15 02:05:45',
    type: ''
  },
  {
    content: '管理员李四登录系统',
    timestamp: '2023-11-14 09:15:33',
    type: ''
  },
  {
    content: '支付记录监控发现一笔异常交易',
    timestamp: '2023-11-14 16:42:18',
    type: 'warning'
  },
  {
    content: '寝室管理模块新增了3个寝室',
    timestamp: '2023-11-14 10:25:17',
    type: ''
  }
])

// 处理面板滚动事件
const handlePanelScroll = (event: Event) => {
  const target = event.target as HTMLElement
  // 当用户滚动到接近底部时，标记通知为已读
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
    if (unreadNotifications.value > 0) {
      unreadNotifications.value = 0
    }
  }
}

// 切换通知面板显示状态
const toggleNotificationPanel = () => {
  showNotificationPanel.value = !showNotificationPanel.value
  console.log('切换通知面板:', showNotificationPanel.value)
}

// 关闭通知面板
const closeNotificationPanel = () => {
  showNotificationPanel.value = false
  console.log('关闭通知面板')
}

// 刷新通知
const refreshNotifications = (event: Event) => {
  event.stopPropagation()
  // 模拟获取最新通知
  notifications.value.unshift({
    content: '系统刷新了最新动态',
    timestamp: new Date().toLocaleString(),
    type: 'primary'
  })
  
  // 限制最多显示5条
  if (notifications.value.length > 5) {
    notifications.value = notifications.value.slice(0, 5)
  }
  
  ElMessage.success('动态刷新成功')
}

// 清空所有通知
const clearAllNotifications = (event: Event) => {
  event.stopPropagation()
  notifications.value = []
  unreadNotifications.value = 0
  ElMessage.success('已清空所有通知')
}

/**
 * 顶部导航栏组件
 * 包含系统Logo、标题、通知按钮和用户信息
 */
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 50%;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.notification-icon {
  margin-right: 20px;
  cursor: pointer;
  color: #606266;
  position: relative;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
}

.user-info {
  margin-left: 20px;
}

.user-name {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
}

.notification-panel {
  position: absolute;
  top: 60px;
  right: 0;
  width: 350px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.panel-header-actions {
  display: flex;
  gap: 10px;
}

.panel-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 15px;
}

.no-notifications {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.panel-footer {
  padding: 10px 15px;
  border-top: 1px solid #EBEEF5;
  text-align: right;
}
</style>