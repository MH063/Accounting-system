<template>
  <div class="layout">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

/**
 * 布局主组件，作为路由的父级容器
 * 包含头部、内容区和底部组件
 */
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    max-width: 100%;
    padding: 15px;
  }
}
</style>