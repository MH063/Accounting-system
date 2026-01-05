<template>
  <div class="layout-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <Header @toggle-sidebar="toggleSidebar" />
    <div class="main-content">
      <LeftMenu :collapsed="isSidebarCollapsed" />
      <div class="content-area">
        <router-view />
      </div>
      <!-- 移动端遮罩层 -->
      <div class="sidebar-mask" v-if="!isSidebarCollapsed" @click="toggleSidebar"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Header from './Header.vue'
import LeftMenu from './LeftMenu.vue'

const isSidebarCollapsed = ref(false)

// 切换侧边栏状态
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 监听窗口大小变化
const handleResize = () => {
  if (window.innerWidth <= 768) {
    isSidebarCollapsed.value = true
  } else {
    isSidebarCollapsed.value = false
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

/**
 * 布局主组件
 * 作为路由的父级容器，包含Header、左侧菜单和右侧内容区
 */
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.main-content {
  display: flex;
  padding-top: 60px; /* 导航栏高度 */
}

.content-area {
  flex: 1;
  margin-left: 220px; /* 侧边栏宽度 */
  padding: 20px;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
  transition: margin-left 0.3s;
}

.sidebar-collapsed .content-area {
  margin-left: 0;
}

.sidebar-mask {
  display: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .content-area {
    margin-left: 0;
    padding: 15px;
  }

  .sidebar-mask {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 998;
  }
}
</style>