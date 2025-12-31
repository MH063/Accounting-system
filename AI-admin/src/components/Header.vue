<template>
  <header class="header">
    <div class="header-left">
      <div class="logo-container">
        <img src="../assets/admin-avatar.png" alt="Logo" class="logo" />
        <span class="title">{{ systemName }}</span>
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
            <el-avatar :size="32" src="https://picsum.photos/seed/user-avatar/32/32.jpg" class="avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            {{ userName }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleChangePassword">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
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
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showChangePasswordDialog"
      title="修改密码"
      width="500px"
      :before-close="closeChangePasswordDialog"
    >
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="旧密码">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            placeholder="请输入旧密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeChangePasswordDialog">取消</el-button>
          <el-button type="primary" @click="submitPasswordChange">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowDown, Bell, Close, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'
import { useRouter } from 'vue-router'
import { getSystemConfig } from '@/utils/systemConfig'

// 从全局配置获取系统名称
const systemConfig = getSystemConfig()
const systemName = computed(() => systemConfig.name || '记账管理系统')

// 获取 router 实例
const router = useRouter()

// 从 localStorage 获取用户信息
const adminUser = computed(() => {
  const userStr = localStorage.getItem('adminUser')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      return null
    }
  }
  return null
})

const userName = computed(() => adminUser.value?.name || '管理员')

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

// 修改密码对话框相关数据
const showChangePasswordDialog = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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

// 处理修改密码点击事件
const handleChangePassword = () => {
  // 重置表单数据
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  showChangePasswordDialog.value = true
}

// 关闭修改密码对话框
const closeChangePasswordDialog = () => {
  showChangePasswordDialog.value = false
}

// 提交密码修改
const submitPasswordChange = async () => {
  // 表单验证
  if (!passwordForm.value.oldPassword) {
    ElMessage.warning('请输入旧密码')
    return
  }
  
  if (!passwordForm.value.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  
  // 调用API修改密码
  try {
    const response = await api.put('/user/change-password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    // 由于api实例已经处理了响应拦截器，直接判断是否有data属性
    if (response && response.data) {
      ElMessage.success('密码修改成功')
      closeChangePasswordDialog()
      
      // 清除表单数据
      passwordForm.value.oldPassword = ''
      passwordForm.value.newPassword = ''
      passwordForm.value.confirmPassword = ''
    } else {
      ElMessage.error('密码修改失败')
    }
  } catch (error: any) {
    console.error('密码修改失败:', error)
    ElMessage.error('密码修改失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '退出登录',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 清除本地存储
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('adminUser')
    
    ElMessage.success('已退出登录')
    
    // 跳转到登录页面
    router.push('/login')
  }).catch(() => {
    // 用户取消退出
  })
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