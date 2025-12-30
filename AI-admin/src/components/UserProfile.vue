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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式状态，用于替代 Vuex
const theme = ref(localStorage.getItem('adminTheme') || 'light')
const isSidebarCollapsed = ref(localStorage.getItem('adminSidebarCollapsed') === 'true')
const language = ref('中文')
const notifications = ref([])

// 计算属性 - 从 localStorage 获取用户信息
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

const isLoggedIn = computed(() => !!localStorage.getItem('adminToken'))
const currentUser = computed(() => adminUser.value || { id: '-', name: '-', role: '-', permissions: [] })

// 方法
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
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('adminUser')
    ElMessage.success('已退出登录')
    window.location.href = '/login'
  }).catch(() => {})
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('adminTheme', theme.value)
  ElMessage.success(`已切换到${theme.value === 'dark' ? '深色' : '浅色'}主题`)
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  localStorage.setItem('adminSidebarCollapsed', String(isSidebarCollapsed.value))
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