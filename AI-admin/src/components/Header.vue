<template>
  <header class="header">
    <div class="header-left">
      <div class="logo-container">
        <img src="https://picsum.photos/seed/admin-logo/40/40.jpg" alt="Logo" class="logo" />
        <span class="title">AI管理系统</span>
      </div>
    </div>
    <div class="header-right">
      <div class="user-info">
        <el-dropdown>
          <span class="user-name">
            <img src="https://picsum.photos/seed/user-avatar/32/32.jpg" alt="用户头像" class="avatar" />
            管理员
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item>修改密码</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'

/**
 * 顶部导航栏组件
 * 包含系统Logo、标题和用户信息
 */
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 4px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  margin-left: 20px;
}

.user-name {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>