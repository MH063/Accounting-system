<template>
  <div class="profile">
    <div class="profile-header">
      <h1>个人中心</h1>
      <p>管理您的个人信息和账户设置</p>
    </div>
    
    <div class="profile-content">
      <!-- 侧边导航 -->
      <div class="profile-sidebar">
        <div class="user-info-card">
          <div class="avatar-container">
            <img :src="userInfo.avatar" alt="用户头像" class="user-avatar" />
          </div>
          <h3 class="user-name">{{ userInfo.name }}</h3>
          <p class="user-email">{{ userInfo.email }}</p>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="profile-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="personal-info">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
          <el-menu-item index="preference-settings">
            <el-icon><Setting /></el-icon>
            <span>偏好设置</span>
          </el-menu-item>
          <el-menu-item index="security-settings">
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <!-- 内容区域 -->
      <div class="profile-main">
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Setting, Lock } from '@element-plus/icons-vue'
import PersonalInfo from './PersonalInfo.vue'
import PreferenceSettings from './PreferenceSettings.vue'
import SecuritySettings from './SecuritySettings.vue'
import { getCurrentUser } from '@/services/userService'

// 当前激活的菜单
const activeMenu = ref('personal-info')

// 路由相关
const route = useRoute()
const router = useRouter()

// 用户信息
const userInfo = ref({
  name: '用户名',
  email: 'user@example.com',
  avatar: 'https://picsum.photos/100/100'
})

// 组件映射
const components = {
  'personal-info': markRaw(PersonalInfo),
  'preference-settings': markRaw(PreferenceSettings),
  'security-settings': markRaw(SecuritySettings)
}

// 当前显示的组件
const currentComponent = shallowRef(components['personal-info'])

// 路由参数到菜单索引的映射
const tabMapping: Record<string, string> = {
  'basic': 'personal-info',
  'preferences': 'preference-settings',
  'security': 'security-settings'
}

// 反向映射，用于更新URL
const reverseTabMapping: Record<string, string> = {
  'personal-info': 'basic',
  'preference-settings': 'preferences',
  'security-settings': 'security'
}

// 菜单选择处理
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  currentComponent.value = components[index as keyof typeof components]
  
  // 更新路由参数但不刷新页面
  const tabParam = reverseTabMapping[index] || index
  router.replace({ query: { ...route.query, tab: tabParam } })
}

// 根据路由参数设置激活的菜单项
const setActiveMenuFromRoute = () => {
  const tab = route.query.tab as string
  const menuIndex = tabMapping[tab] || tab
  
  if (menuIndex && components[menuIndex as keyof typeof components]) {
    activeMenu.value = menuIndex
    currentComponent.value = components[menuIndex as keyof typeof components]
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getCurrentUser()
    if (response.success && response.data) {
      userInfo.value.name = response.data.name
      userInfo.value.email = response.data.email
      userInfo.value.avatar = response.data.avatar || 'https://picsum.photos/100/100'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 组件挂载时处理路由参数并获取用户信息
onMounted(() => {
  setActiveMenuFromRoute()
  fetchUserInfo()
})

// 监听路由变化
watch(() => route.query, () => {
  setActiveMenuFromRoute()
})
</script>

<style scoped>
.profile {
  padding: 20px;
  min-height: calc(100vh - 120px);
}

.profile-header {
  margin-bottom: 30px;
}

.profile-header h1 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.profile-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.profile-content {
  display: flex;
  gap: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.profile-sidebar {
  width: 280px;
  background: #f8f9fa;
  border-radius: 8px 0 0 8px;
  padding: 20px;
  border-right: 1px solid #e4e7ed;
}

.user-info-card {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.avatar-container {
  margin-bottom: 15px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-name {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 18px;
}

.user-email {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.profile-menu {
  background: transparent;
  border: none;
}

.profile-menu .el-menu-item {
  margin: 5px 0;
  border-radius: 6px;
  height: 50px;
  line-height: 50px;
}

.profile-menu .el-menu-item:hover {
  background: #e6f7ff;
}

.profile-menu .el-menu-item.is-active {
  background: #409eff;
  color: #fff;
}

.profile-menu .el-icon {
  margin-right: 8px;
}

.profile-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .profile-sidebar {
    width: 100%;
    border-radius: 8px 8px 0 0;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .profile-main {
    min-height: 400px;
  }
}
</style>