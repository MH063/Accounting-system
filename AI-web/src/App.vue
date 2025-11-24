<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 应用主组件
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

/* Element Plus 样式覆盖 */
.el-button {
  font-weight: normal;
}
</style>