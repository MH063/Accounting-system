<template>
  <div class="user-profile">
    <!-- 用户信息触发区域 -->
    <div class="user-info" @click="toggleDropdown">
      <el-avatar :size="36" :src="userInfo.avatar" class="user-avatar">
        <el-icon><User /></el-icon>
      </el-avatar>
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
          <el-avatar :size="48" :src="userInfo.avatar" class="preview-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
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
            <el-tag v-if="hasNewVersion" type="danger" size="small" effect="dark" class="update-badge">新</el-tag>
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
import { User, SwitchButton, ArrowDown, Refresh, QuestionFilled, InfoFilled } from '@element-plus/icons-vue'
import { getCurrentUser, getDefaultAvatar, getFullAvatarUrl, getUserAvatar } from '@/services/userService'
import { checkForUpdates } from '@/services/versionService'
import { showInfoMessage, showErrorMessage, showSuccessMessage, showConfirmDialog } from '@/utils/messageUtils'
import { logout } from '@/services/authService'
import { ElMessage } from 'element-plus'
import eventBus from '@/utils/eventBus'
import { onUnmounted } from 'vue'


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
  email: '',
  role: '管理员',
  avatar: getDefaultAvatar()
})

// 下拉菜单显示状态
const dropdownVisible = ref(false)

// 是否有新版本
const hasNewVersion = ref(false)

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
  
  try {
    // 显示检查更新提示
    showInfoMessage('正在检查更新...')
    
    // 调用版本检查服务
    const updateInfo = await checkForUpdates()
    
    // 更新新版本状态
    hasNewVersion.value = updateInfo.hasUpdate
    
    if (updateInfo.hasUpdate && updateInfo.latestVersion) {
      // 有更新时显示详细信息
      showConfirmDialog(
        `${updateInfo.updateMessage}

最新版本: ${updateInfo.latestVersion.version}
发布日期: ${updateInfo.latestVersion.releaseDate}

更新内容:
${updateInfo.latestVersion.releaseNotes}

是否立即更新？`,
        '发现新版本',
        {
          confirmButtonText: '立即更新',
          cancelButtonText: '稍后再说',
          distinguishCancelAndClose: true,
          type: 'info',
          dangerouslyUseHTMLString: true,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showClose: false,
          autofocus: false,
          beforeClose: (action: any, instance: any, done: () => void) => {
            if (action === 'cancel') {
              // 用户点击"稍后再说"
              showConfirmDialog(
                '您确定要暂时忽略此更新吗？<br/><br/>您可以选择：<br/>1. 暂时忽略（下次启动时仍会提醒）<br/>2. 永久忽略此版本<br/>3. 立即更新',
                '暂停更新选项',
                {
                  confirmButtonText: '永久忽略',
                  cancelButtonText: '暂时忽略',
                  type: 'warning',
                  dangerouslyUseHTMLString: true,
                  distinguishCancelAndClose: true
                }
              ).then(() => {
                // 用户选择永久忽略此版本
                localStorage.setItem('ignoredVersion', updateInfo.latestVersion!.version);
                showInfoMessage(`已永久忽略版本 ${updateInfo.latestVersion!.version} 的更新提醒`);
                done();
              }).catch((action) => {
                if (action === 'cancel') {
                  // 用户选择暂时忽略
                  showInfoMessage('已暂时忽略此次更新提醒，下次启动时仍会检查');
                  done();
                }
              });
            } else {
              // 用户选择立即更新或其他操作
              done();
            }
          }
        }
      ).then(async () => {
        try {
          showSuccessMessage('开始下载更新...')
          // 这里可以调用下载更新功能
          // await downloadUpdate(updateInfo.latestVersion!)
          // 调用真实的下载更新功能
          try {
            // 这里应该调用真实的下载更新API
            // await downloadUpdate(updateInfo.latestVersion!)
            
            // 模拟下载进度
            let progress = 0;
            const interval = setInterval(() => {
              progress += 10;
              if (progress >= 100) {
                clearInterval(interval);
                showSuccessMessage('更新下载完成，请重启应用以完成更新');
              }
            }, 200);
          } catch (error) {
            showErrorMessage('下载更新失败');
          }
        } catch (error) {
          showErrorMessage('下载更新失败')
        }
      }).catch((action) => {
        // 用户关闭对话框或取消操作
        if (action !== 'close') {
          // 不是通过关闭按钮关闭的，说明用户已经处理了暂停更新的选择
          return;
        }
        showInfoMessage('您稍后可以在设置中手动检查更新')
      })
    } else {
      showSuccessMessage(updateInfo.updateMessage || '您当前使用的是最新版本')
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    showErrorMessage('检查更新失败，请稍后重试')
  }
}

// 退出登录
const handleLogout = async () => {
  closeDropdown()
  
  try {
    console.log('开始执行登出流程')
    
    // 调用登出API
    const response = await logout()
    
    console.log('登出API响应:', response)
    
    if (response.success) {
      console.log('登出成功，跳转到首页')
      ElMessage.success('登出成功')
      
      // 清除本地登录状态
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('username')
      }
      
      // 跳转到首页
      router.push('/')
    } else {
      console.error('登出失败:', response.message)
      ElMessage.error(response.message || '登出失败')
    }
  } catch (error) {
    console.error('登出异常:', error)
    ElMessage.error('登出失败，请稍后重试')
  }
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
      const userData = { ...response.data }
      const avatar = userData.avatar || userData.avatar_url
      const finalAvatar = getUserAvatar(avatar, userData.email, userData.name)
      userData.avatar = finalAvatar
      
      Object.assign(userInfo, userData)
      console.log('用户信息获取成功，头像URL:', finalAvatar)
    } else {
      console.error('获取用户信息失败:', response?.message || '未知错误')
      showErrorMessage('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息异常:', error)
    showErrorMessage('获取用户信息失败')
  }
}

// 组件挂载时获取用户信息和检查更新
onMounted(() => {
  console.log('UserProfile组件已挂载')
  fetchUserInfo()
  
  // 监听用户信息更新事件
  eventBus.on('user-info-updated', fetchUserInfo)
  
  // 自动检查更新（可选）
  handleCheckUpdate()
})

// 组件销毁时移除监听
onUnmounted(() => {
  eventBus.off('user-info-updated', fetchUserInfo)
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
  margin-right: 10px;
  background-color: #f0f2f5;
  color: #909399;
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
  margin-right: 12px;
  background-color: #f0f2f5;
  color: #909399;
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
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item .el-icon {
  margin-right: 12px;
  color: #666;
  font-size: 16px;
}

.menu-item span {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.update-badge {
  position: absolute;
  right: 20px;
}

.logout {
  color: #f56c6c;
}

.logout .el-icon {
  color: #f56c6c;
}

.menu-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 8px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


</style>