<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除。</p>
      <router-link to="/" class="home-link">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404页面组件逻辑
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
}

.content {
  max-width: 500px;
}

h1 {
  font-size: 6rem;
  color: #3498db;
  margin-bottom: 1rem;
}

h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

p {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 2rem;
}

.home-link {
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #2980b9;
}
</style>