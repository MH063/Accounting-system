<template>
  <div class="layout-container">
    <Header />
    <div class="main-content">
      <LeftMenu />
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import LeftMenu from './LeftMenu.vue'

/**
 * 布局主组件
 * 作为路由的父级容器，包含Header、左侧菜单和右侧内容区
 */
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  display: flex;
  flex: 1;
}

.content-area {
  flex: 1;
  padding: 20px;
  background-color: #f5f5f5;
  overflow-y: auto;
}
</style>