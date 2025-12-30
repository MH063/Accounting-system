<template>
  <router-view />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useHeartbeat } from '@/composables/useHeartbeat'

// App组件作为路由的根容器
const { startHeartbeat, stopHeartbeat } = useHeartbeat()

// 使用 ref 和 localStorage 模拟登录状态
const isLoggedIn = ref(!!localStorage.getItem('adminToken'))

// 监听登录状态变化，自动启动/停止心跳
// 这里我们使用一个简单的定时轮询或事件监听来模拟登录状态变化
let statusCheckTimer: any = null

onMounted(() => {
  // 初始检查
  if (isLoggedIn.value) {
    console.log('用户已登录，启动心跳服务')
    startHeartbeat()
  }

  // 定期检查登录状态变化 (每5秒)
  statusCheckTimer = setInterval(() => {
    const currentStatus = !!localStorage.getItem('adminToken')
    if (currentStatus !== isLoggedIn.value) {
      isLoggedIn.value = currentStatus
      if (currentStatus) {
        console.log('检测到登录状态变化：已登录，启动心跳服务')
        startHeartbeat()
      } else {
        console.log('检测到登录状态变化：已退出，停止心跳服务')
        stopHeartbeat()
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (statusCheckTimer) clearInterval(statusCheckTimer)
  stopHeartbeat()
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>