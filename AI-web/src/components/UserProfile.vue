<template>
  <div class="user-profile">
    <!-- 用户信息触发区域 -->
    <div class="user-info" @click="toggleDropdown">
      <img :src="userInfo.avatar" alt="用户头像" class="user-avatar" />
      <span class="user-name">{{ userInfo.name }}</span>
      <el-icon class="dropdown-icon" :class="{ 'is-open': dropdownVisible }">
        <ArrowDown />
      </el-icon>
    </div>

    <!-- 下拉菜单 -->
    <transition name="fade">
      <div v-if="dropdownVisible" class="dropdown-menu" v-click-outside="closeDropdown">
        <!-- 用户预览区 -->
        <div class="user-preview">
          <img :src="userInfo.avatar" alt="用户头像" class="preview-avatar" />
          <div class="preview-info">
            <div class="preview-name">{{ userInfo.name }}</div>
            <div class="preview-role">{{ userInfo.role }}</div>
          </div>
        </div>

        <!-- 菜单项 -->
        <div class="menu-items">
          <div class="menu-item" @click="navigateTo('/dashboard/profile?tab=basic')">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </div>
          <div class="menu-item" @click="navigateTo('/dashboard/help-center')">
            <el-icon><QuestionFilled /></el-icon>
            <span>帮助中心</span>
          </div>
          <div class="menu-item" @click="navigateTo('/dashboard/about-system')">
            <el-icon><InfoFilled /></el-icon>
            <span>关于系统</span>
          </div>
          <div class="menu-item" @click="handleCheckUpdate">
            <el-icon><Refresh /></el-icon>
            <span>检查更新</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item logout" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, SwitchButton, ArrowDown, Refresh, QuestionFilled, InfoFilled } from '@element-plus/icons-vue'
import { getCurrentUser } from '@/services/userService'


// 路由
const router = useRouter()

// 用户信息接口定义
interface UserInfo {
  name: string
  email: string
  role: string
  avatar: string
}

// 用户信息
const userInfo = reactive<UserInfo>({
  name: typeof localStorage !== 'undefined' ? localStorage.getItem('username') || '用户' : '用户',
  email: 'zhangsan@example.com',
  role: '管理员',
  avatar: 'https://picsum.photos/seed/user123/100/100.jpg'
})

// 下拉菜单显示状态
const dropdownVisible = ref(false)

// 切换下拉菜单显示状态
const toggleDropdown = (event?: Event): void => {
  if (event) {
    event.stopPropagation()
  }
  console.log('切换下拉菜单状态，当前状态:', dropdownVisible.value)
  dropdownVisible.value = !dropdownVisible.value
  
  // 确保下拉菜单在下一个渲染周期显示
  if (dropdownVisible.value) {
    nextTick(() => {
      console.log('下拉菜单已显示')
    })
  }
}

// 关闭下拉菜单
const closeDropdown = (): void => {
  console.log('关闭下拉菜单')
  dropdownVisible.value = false
}

// 导航到指定页面
const navigateTo = (path: string): void => {
  console.log('导航到:', path)
  closeDropdown()
  router.push(path)
}

// 检查更新
const handleCheckUpdate = async (): Promise<void> => {
  closeDropdown()
  
  // 这里可以调用实际的更新检查API
  // 例如：检查服务器版本
  try {
    // 模拟API调用
    console.log('正在检查更新...')
    
    // 这里可以加入实际的更新检查逻辑
    // 例如：检查最新版本号、下载链接等
    
    // 模拟检查结果（90%的概率有更新，10%概率无更新）
    const hasUpdate = Math.random() > 0.1
    
    if (hasUpdate) {
      // 有更新时显示对话框或跳转更新页面
      ElMessageBox.confirm(
        '发现新版本，是否立即更新？',
        '检查更新',
        {
          confirmButtonText: '立即更新',
          cancelButtonText: '稍后再说',
          type: 'info',
        }
      ).then(() => {
        ElMessage.success('正在跳转到更新页面...')
        // 这里可以跳转到更新页面或打开下载链接
        // router.push('/update')
      }).catch(() => {
        ElMessage.info('您稍后可以在设置中手动检查更新')
      })
    } else {
      ElMessage.success('您当前使用的是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    ElMessage.error('检查更新失败，请稍后重试')
  }
}

// 退出登录
const handleLogout = () => {
  closeDropdown()
  
  // 清除登录状态
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
  }
  
  // 立即跳转到首页
  router.push('/')
}

// 自定义指令绑定接口定义
interface ClickOutsideBinding {
  value: (event: Event) => void
}

// 自定义指令：点击外部关闭下拉菜单
interface ClickOutsideHTMLElement extends HTMLElement {
  clickOutsideEvent?: (event: Event) => void
}

const vClickOutside = {
  beforeMount(el: ClickOutsideHTMLElement, binding: ClickOutsideBinding) {
    el.clickOutsideEvent = function(event: Event) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: ClickOutsideHTMLElement) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}

// 获取用户信息
const fetchUserInfo = async (): Promise<void> => {
  try {
    console.log('开始获取用户信息...')
    const response = await getCurrentUser()
    console.log('用户信息响应:', response)
    
    if (response && response.success && response.data) {
      // 更新用户信息，使用Object.assign保持响应性
      Object.assign(userInfo, response.data)
      console.log('用户信息获取成功:', userInfo)
    } else {
      console.error('获取用户信息失败:', response?.message || '未知错误')
      ElMessage.error('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息异常:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 组件挂载时获取用户信息
onMounted(() => {
  console.log('UserProfile组件已挂载')
  fetchUserInfo()
})
</script>

<style scoped>
.user-profile {
  position: relative;
  display: inline-block;
  z-index: 1001; /* 确保在其他元素之上 */
  margin-left: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  margin-right: 6px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.dropdown-icon {
  transition: transform 0.3s;
  color: #666;
}

.dropdown-icon.is-open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.user-preview {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.preview-info {
  flex: 1;
}

.preview-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: #333;
}

.preview-email {
  font-size: 14px;
  color: #666;
}

.preview-role {
  font-size: 14px;
  color: #666;
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item .el-icon {
  margin-right: 10px;
  color: #666;
}

.menu-item.logout {
  color: #f56c6c;
}

.menu-item.logout .el-icon {
  color: #f56c6c;
}

.menu-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 8px 0;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-name {
    display: none;
  }
  
  .dropdown-menu {
    width: 240px;
  }
  
  .user-preview {
    padding: 12px;
  }
  
  .preview-avatar {
    width: 40px;
    height: 40px;
  }
  
  .preview-name {
    font-size: 14px;
  }
  
  .preview-email {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .dropdown-menu {
    width: 200px;
    right: -10px;
  }
  
  .menu-item {
    padding: 8px 12px;
  }
  
  .user-info {
    padding: 6px 8px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
  }
}
</style>