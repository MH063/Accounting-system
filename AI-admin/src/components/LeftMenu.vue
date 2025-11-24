<template>
  <div class="left-menu">
    <el-menu
      :default-active="activeMenu"
      class="menu"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <el-menu-item index="/">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>
      
      <el-sub-menu index="1">
        <template #title>
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </template>
        <el-menu-item index="/users">用户列表</el-menu-item>
        <el-menu-item index="/roles">角色管理</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="2">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>内容管理</span>
        </template>
        <el-menu-item index="/articles">文章管理</el-menu-item>
        <el-menu-item index="/categories">分类管理</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="3">
        <template #title>
          <el-icon><DataLine /></el-icon>
          <span>数据统计</span>
        </template>
        <el-menu-item index="/charts">图表分析</el-menu-item>
        <el-menu-item index="/reports">报表管理</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="4">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </template>
        <el-menu-item index="/settings">基本设置</el-menu-item>
        <el-menu-item index="/logs">操作日志</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, User, Document, DataLine, Setting } from '@element-plus/icons-vue'

const route = useRoute()

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

/**
 * 左侧菜单栏组件
 * 包含系统各功能模块的导航菜单
 */
</script>

<style scoped>
.left-menu {
  width: 220px;
  height: calc(100vh - 60px);
  background-color: #304156;
  overflow-y: auto;
}

.menu {
  border-right: none;
  height: 100%;
}

.menu:not(.el-menu--collapse) {
  width: 220px;
}

/* 自定义菜单项样式 */
:deep(.el-menu-item), :deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF !important;
}

:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
}
</style>