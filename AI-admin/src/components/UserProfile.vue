<template>
  <div class="user-profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>用户信息</span>
          <el-button 
            v-if="isLoggedIn" 
            type="danger" 
            size="small" 
            @click="handleLogout"
          >
            退出登录
          </el-button>
        </div>
      </template>
      
      <div v-if="isLoggedIn">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.name }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ currentUser.role }}</el-descriptions-item>
          <el-descriptions-item label="权限">
            <el-tag 
              v-for="permission in currentUser.permissions" 
              :key="permission" 
              size="small" 
              style="margin-right: 5px;"
            >
              {{ permission }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div v-else>
        <el-alert title="用户未登录" type="info" description="请先登录系统" show-icon />
      </div>
    </el-card>
    
    <el-card class="system-info" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>系统信息</span>
        </div>
      </template>
      
      <el-descriptions :column="1" border>
        <el-descriptions-item label="主题">
          <el-tag :type="theme === 'dark' ? 'primary' : 'success'">
            {{ theme === 'dark' ? '深色' : '浅色' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="语言">{{ language }}</el-descriptions-item>
        <el-descriptions-item label="侧边栏状态">
          <el-tag :type="isSidebarCollapsed ? 'warning' : 'success'">
            {{ isSidebarCollapsed ? '收起' : '展开' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="通知数量">{{ notifications.length }}</el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px;">
        <el-button @click="toggleTheme" style="margin-right: 10px;">
          切换主题
        </el-button>
        <el-button @click="toggleSidebar">
          {{ isSidebarCollapsed ? '展开' : '收起' }}侧边栏
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

// 获取store实例
const store = useStore()

// 计算属性 - 从store中获取状态
const isLoggedIn = computed(() => store.getters['user/isLoggedIn'])
const currentUser = computed(() => store.getters['user/currentUser'])
const theme = computed(() => store.getters['system/theme'])
const language = computed(() => store.getters['system/language'])
const isSidebarCollapsed = computed(() => store.getters['system/isSidebarCollapsed'])
const notifications = computed(() => store.getters['system/notifications'])

// 方法 - dispatch actions
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
    store.dispatch('user/logout')
    ElMessage.success('已退出登录')
  }).catch(() => {
    // 取消退出
  })
}

const toggleTheme = () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  store.dispatch('system/setTheme', newTheme)
  ElMessage.success(`主题已切换为${newTheme === 'dark' ? '深色' : '浅色'}`)
}

const toggleSidebar = () => {
  store.dispatch('system/toggleSidebar')
  ElMessage.success(`侧边栏已${isSidebarCollapsed.value ? '展开' : '收起'}`)
}
</script>

<style scoped>
.user-profile {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-card {
  max-width: 600px;
}
</style>