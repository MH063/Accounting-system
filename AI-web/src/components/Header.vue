<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <div class="logo-container">
          <img src="https://picsum.photos/40/40" alt="Logo" />
          <div class="logo-glow"></div>
        </div>
        <span class="logo-text">记账系统</span>
      </div>
      <nav class="nav">
        <div class="nav-background"></div>
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          ref="navItemRefs"
        >
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
        <div class="nav-spacer"></div>
        <div class="notification-icon" @click="handleNotification">
          <el-icon :size="18"><Bell /></el-icon>
          <div class="notification-dot"></div>
        </div>
        <!-- 用户信息区域 -->
        <div class="user-profile-wrapper">
          <UserProfile />
        </div>
        <!-- 全局滑动指示线 -->
        <div class="nav-slider" :style="sliderStyle"></div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import UserProfile from './UserProfile.vue'

// 路由实例
const route = useRoute()
const router = useRouter()

// 导航项配置
const navItems = [
  { name: '仪表盘', path: '/dashboard' },
  { name: '寝室管理', path: '/dashboard/dormitory' },
  { name: '成员管理', path: '/dashboard/members' },
  { name: '费用管理', path: '/dashboard/expenses' },
  { name: '账单管理', path: '/dashboard/bills' },
  { name: '支付功能', path: '/dashboard/payment' },
  { name: '统计分析', path: '/dashboard/analytics' }
]

// 组件引用
const navItemRefs = ref<HTMLElement[]>([])

// 滑动指示线状态
const sliderStyle = ref({
  width: '0px',
  left: '0px',
  opacity: '0'
})

// 是否显示指示线
const showIndicator = ref(true)

/**
 * 判断当前导航项是否激活
 * @param path 导航路径
 * @returns 是否激活
 */
const isActive = (path: string): boolean => {
  return route.path === path
}

/**
 * 更新滑动指示线位置
 */
const updateSliderPosition = async () => {
  await nextTick()
  const activeIndex = navItems.findIndex(item => item.path === route.path)
  
  if (activeIndex === -1 || !navItemRefs.value[activeIndex]) {
    sliderStyle.value = {
      width: '0px',
      left: '0px',
      opacity: '0'
    }
    return
  }
  
  const activeElement = navItemRefs.value[activeIndex]
  const navElement = activeElement.parentElement
  
  if (!navElement) return
  
  const navRect = navElement.getBoundingClientRect()
  const activeRect = activeElement.getBoundingClientRect()
  
  // 计算滑动指示线的位置和宽度
  const left = activeRect.left - navRect.left
  const width = activeRect.width
  
  sliderStyle.value = {
    width: `${width}px`,
    left: `${left}px`,
    opacity: showIndicator.value ? '1' : '0'
  }
}

/**
 * 切换指示线显示状态
 */
const toggleIndicator = () => {
  showIndicator.value = !showIndicator.value
  sliderStyle.value.opacity = showIndicator.value ? '1' : '0'
}

/**
 * 处理通知图标点击事件
 */
const handleNotification = (): void => {
  ElMessage.info('暂无新通知')
}

// 监听路由变化，更新指示线位置
watch(() => route.path, () => {
  updateSliderPosition()
})

// 组件挂载后初始化指示线位置
onMounted(() => {
  updateSliderPosition()
  
  // 监听窗口大小变化，更新指示线位置
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateSliderPosition)
    
    // 暴露切换指示线的方法到全局，方便调试
    ;(window as any).toggleNavIndicator = toggleIndicator
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateSliderPosition)
  }
})
</script>

<style scoped>
.header {
  height: 60px;
  width: 100%;
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
}

.header-container {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.logo-container {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.logo-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff, #36d1dc);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.logo:hover .logo-glow {
  opacity: 0.3;
}

.logo:hover img {
  transform: translateY(-2px);
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #2c3e50, #409eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 4px;
  border-radius: 12px;
  background-color: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(8px);
  margin-left: 24px;
  flex-grow: 1;
}

.nav-background {
  position: absolute;
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #409eff, #36d1dc);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.1;
  z-index: 0;
}

.nav-item {
  position: relative;
  padding: 10px 18px;
  color: #606266;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.nav-text {
  position: relative;
  z-index: 2;
  transition: color 0.3s ease;
}

.nav-item:hover {
  color: #409eff;
  transform: translateY(-1px);
}

.nav-item.active {
  color: #ffffff;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff, #36d1dc);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.nav-spacer {
  width: 8px;
  height: 100%;
}

.user-profile-wrapper {
  position: relative;
  z-index: 1002; /* 确保用户头像下拉菜单在最上层 */
}

/* 全局滑动指示线 */
.nav-slider {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, #409eff, #36d1dc);
  border-radius: 1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.notification-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-left: 16px;
  color: #606266;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1;
  flex-shrink: 0;
}

.notification-icon:hover {
  background: linear-gradient(135deg, #409eff, #36d1dc);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
  border: 2px solid #ffffff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}
/* 响应式设计 */
@media (max-width: 1200px) {
  .header-container {
    max-width: 100%;
    padding: 0 20px;
  }
  
  .nav {
    margin-left: 20px;
  }
  
  .nav-item {
    padding: 10px 14px;
    font-size: 14px;
  }
  
  .logo-text {
    font-size: 18px;
  }
}

@media (max-width: 900px) {
  .header-container {
    padding: 0 16px;
  }
  
  .nav {
    margin-left: 16px;
    padding: 2px;
  }
  
  .nav-item {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .notification-icon {
    width: 36px;
    height: 36px;
    margin-left: 12px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 12px;
  }
  
  .logo-text {
    display: none;
  }
  
  .nav {
    margin-left: 12px;
    gap: 0;
    padding: 2px;
  }
  
  .nav-item {
    padding: 8px 8px;
    font-size: 12px;
  }
  
  .nav-spacer {
    width: 4px;
  }
  
  .notification-icon {
    width: 32px;
    height: 32px;
    margin-left: 8px;
  }
  
  .notification-dot {
    width: 6px;
    height: 6px;
    top: 6px;
    right: 6px;
  }
}
</style>