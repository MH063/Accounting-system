<template>
  <div class="left-menu">
    <el-menu
      :default-active="activeMenu"
      class="menu"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
      :unique-opened="true"
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
        <el-menu-item index="/user-detail">用户详情</el-menu-item>
        <el-menu-item index="/batch-operation">批量操作</el-menu-item>
      </el-sub-menu>
      
      <!-- 新增模块 -->
      <el-sub-menu index="2">
        <template #title>
          <el-icon><House /></el-icon>
          <span>寝室管理</span>
        </template>
        <el-menu-item index="/dormitory-list">寝室列表</el-menu-item>
        <el-menu-item index="/dormitory-detail">寝室详情</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="3">
        <template #title>
          <el-icon><Coin /></el-icon>
          <span>费用管理</span>
        </template>
        <el-menu-item index="/fee-record-list">费用记录列表</el-menu-item>
        <el-menu-item index="/fee-detail">费用详情</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="4">
        <template #title>
          <el-icon><CreditCard /></el-icon>
          <span>支付管理</span>
        </template>
        <el-menu-item index="/payment-record-monitor">支付记录监控</el-menu-item>
        <el-menu-item index="/payment-code-management">收款码管理</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="5">
        <template #title>
          <el-icon><Tools /></el-icon>
          <span>系统配置</span>
        </template>
        <el-menu-item index="/system-settings">系统设置</el-menu-item>
        <el-menu-item index="/fee-type-management">费用类型管理</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="6">
        <template #title>
          <el-icon><Phone /></el-icon>
          <span>客户端功能</span>
        </template>
        <el-menu-item index="/feature-control">功能模块控制</el-menu-item>
        <el-menu-item index="/new-feature-release">新功能发布</el-menu-item>
        <el-menu-item index="/gray-release-control">灰度发布控制</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="7">
        <template #title>
          <el-icon><Monitor /></el-icon>
          <span>数据监控</span>
        </template>
        <el-menu-item index="/realtime-dashboard">实时监控仪表盘</el-menu-item>
        <el-menu-item index="/exception-alert">异常告警</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="8">
        <template #title>
          <el-icon><TrendCharts /></el-icon>
          <span>行为分析</span>
        </template>
        <el-menu-item index="/operation-audit">操作审计</el-menu-item>
        <el-menu-item index="/data-report">数据报表</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="9">
        <template #title>
          <el-icon><Warning /></el-icon>
          <span>纠纷处理</span>
        </template>
        <el-menu-item index="/dispute-acceptance">争议受理</el-menu-item>
        <el-menu-item index="/arbitration-decision">仲裁决策</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="10">
        <template #title>
          <el-icon><Lock /></el-icon>
          <span>管理员监督</span>
        </template>
        <el-menu-item index="/admin-behavior-supervision">管理员行为监督</el-menu-item>
        <el-menu-item index="/admin-permission-management">管理员权限管理</el-menu-item>
      </el-sub-menu>
      
      <!-- 修改通知管理为二级菜单 -->
      <el-sub-menu index="11">
        <template #title>
          <el-icon><Message /></el-icon>
          <span>通知管理</span>
        </template>
        <el-menu-item index="/notification">系统通知</el-menu-item>
      </el-sub-menu>
      
      <!-- 修改系统维护为二级菜单 -->
      <el-sub-menu index="12">
        <template #title>
          <el-icon><Operation /></el-icon>
          <span>系统维护</span>
        </template>
        <el-menu-item index="/maintenance">系统维护</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, User, Document, DataLine, Setting, House, Coin, CreditCard, Tools, Phone, Monitor, TrendCharts, Warning, Lock, Message, Operation } from '@element-plus/icons-vue'

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
  /* 移除固定高度，让菜单栏可以根据内容自适应高度 */
  min-height: calc(100vh - 60px);
  background-color: #304156;
  overflow-y: auto;
}

.menu {
  border-right: none;
  /* 移除固定高度，让菜单可以根据内容自适应 */
  min-height: 100%;
}

.menu:not(.el-menu--collapse) {
  width: 220px;
}

/* 自定义菜单项样式 */
:deep(.el-menu-item), :deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  color: #bfcbd9 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF !important;
  color: #ffffff !important;
}

:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
  color: #ffffff !important;
}

/* 确保子菜单项文字可见 */
:deep(.el-menu--inline .el-menu-item) {
  color: #bfcbd9 !important;
  background-color: #1f2d3d !important;
}

:deep(.el-menu--inline .el-menu-item:hover) {
  color: #ffffff !important;
  background-color: #001528 !important;
}

:deep(.el-menu--inline .el-menu-item.is-active) {
  color: #ffffff !important;
  background-color: #409EFF !important;
}
</style>