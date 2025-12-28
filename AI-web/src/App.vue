<template>
  <div id="app">
    <MaintenanceNotice />
    <LoadingOverlay v-if="isInitializing" message="正在验证身份..." />
    <router-view v-else />
    <AutoLogoutWarning 
      :show="showWarning"
      :remaining-seconds="computedRemainingSeconds"
      @keep-alive="keepSessionAlive"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import MaintenanceNotice from './components/MaintenanceNotice.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import AutoLogoutWarning from './components/AutoLogoutWarning.vue'
import authStorageService from '@/services/authStorageService'
import { useAutoLogout } from '@/composables/useAutoLogout'

const router = useRouter()
const isInitializing = ref(true)

const {
  showWarning,
  remainingSeconds,
  initialize: initAutoLogout,
  keepSessionAlive
} = useAutoLogout()

const computedRemainingSeconds = computed(() => {
  const seconds = remainingSeconds.value
  return typeof seconds === 'number' && !isNaN(seconds) ? seconds : 120
})

onMounted(async () => {
  try {
    const authState = authStorageService.getAuthState()
    
    const currentPath = window.location.pathname
    const requiresAuth = currentPath.startsWith('/dashboard') || 
                        currentPath.startsWith('/admin') ||
                        !currentPath.startsWith('/login') &&
                        !currentPath.startsWith('/register') &&
                        !currentPath.startsWith('/reset-password') &&
                        currentPath !== '/'

    if (requiresAuth && !authState.isAuthenticated) {
      const redirectUrl = encodeURIComponent(currentPath)
      window.location.href = `/login?redirect=${redirectUrl}&reason=not_authenticated`
      return
    }

    if (authState.isAuthenticated) {
      // 移除硬编码的令牌过期检查，交给路由守卫和请求拦截器处理自动刷新
      // 防止在刷新页面时因为令牌即将过期而直接登出
      
      initAutoLogout(router)
      console.log('[App] 自动登出已初始化，showWarning:', showWarning.value)
    }
  } catch (error) {
    console.error('[App] 初始化验证失败:', error)
  } finally {
    isInitializing.value = false
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f7fa;
}

#app {
  height: 100%;
  width: 100%;
}

.el-button {
  font-weight: normal;
}
</style>
