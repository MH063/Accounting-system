<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <div class="logo-container">
          <img src="/accounting-logo.png" alt="Logo" />
          <div class="logo-glow"></div>
        </div>
        <span class="logo-text">记账系统</span>
      </div>
      
      <!-- 搜索功能 -->
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索功能、页面或帮助..."
          :prefix-icon="Search"
          clearable
          @input="handleSearchInput"
          @focus="handleSearchFocus"
          @blur="handleSearchBlur"
          @keyup.enter="performGlobalSearch"
          :loading="isSearching"
          class="header-search"
        />
        
        <!-- 搜索结果面板 -->
        <div v-if="showSearchResults || searchSuggestions.length > 0" class="search-results-panel">
          
          <!-- 搜索结果 -->
          <div v-if="showSearchResults && searchResults.length > 0" class="search-results-section">
            <div class="search-section-header">
              <span class="section-title">搜索结果 ({{ searchResults.length }})</span>
              <el-button link type="primary" size="small" @click="showSearchResults = false">关闭</el-button>
            </div>
            
            <!-- 按分类显示结果 -->
            <div v-for="(items, category) in getSearchResultCategories" :key="category" class="search-category-group">
              <div class="category-header">
                <el-icon><Folder /></el-icon>
                <span>{{ getCategoryDisplayName(category) }}</span>
                <span class="category-count">({{ items.length }})</span>
              </div>
              <div class="search-result-list">
                <div 
                  v-for="result in items" 
                  :key="result.id"
                  class="search-result-item"
                  @click="handleSearchResultClick(result)"
                >
                  <div class="result-icon">
                    <el-icon v-if="result.icon"><component :is="result.icon" /></el-icon>
                    <el-icon v-else><Document /></el-icon>
                  </div>
                  <div class="result-content">
                    <div class="result-title">{{ result.title }}</div>
                    <div class="result-description">{{ result.description }}</div>
                    <div class="result-keywords">
                      <el-tag 
                        v-for="keyword in result.keywords.slice(0, 3)" 
                        :key="keyword"
                        size="small"
                        type="info"
                      >
                        {{ keyword }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="result-priority" :class="'priority-' + result.priority">
                    <el-icon><Star /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 无结果提示 -->
          <div v-if="showSearchResults && searchResults.length === 0" class="no-results">
            <el-icon><Search /></el-icon>
            <p>未找到相关内容</p>
            <p class="suggestion">建议：检查关键词拼写，或尝试其他关键词</p>
          </div>
          
          <!-- 搜索建议 -->
          <div v-if="searchSuggestions.length > 0" class="search-suggestions">
            <div class="section-title">搜索建议</div>
            <div class="suggestion-list">
              <el-tag
                v-for="suggestion in searchSuggestions"
                :key="suggestion"
                @click="handleSuggestionClick(suggestion)"
                class="suggestion-tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ suggestion }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <nav class="nav">
        <div class="nav-background"></div>
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          ref="navItemRefs"
        >
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
        <div class="nav-spacer"></div>
        <div class="notification-wrapper" ref="notificationWrapper">
          <div class="notification-icon" @click.stop="toggleNotificationPopover">
            <el-icon :size="18"><Bell /></el-icon>
            <div class="notification-dot" v-if="hasUnreadNotifications"></div>
            <el-badge 
              v-if="unreadCount > 0" 
              :value="unreadCount" 
              :max="99" 
              class="notification-badge"
              type="danger"
            />
          </div>
          <NotificationPopover 
            v-model:visible="showNotificationPopover" 
            @close="showNotificationPopover = false"
          />
        </div>
        <!-- 用户信息区域 -->
        <div class="user-profile-wrapper">
          <UserProfile />
        </div>
        <!-- 全局滑动指示线 -->
        <div class="nav-slider" :style="sliderStyle"></div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Search, Folder, Document, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import UserProfile from './UserProfile.vue'
import NotificationPopover from './NotificationPopover.vue'
import type { SearchResult } from '../services/searchService'
import { useNotifications } from '../services/notificationService'

// 路由实例
const route = useRoute()
const router = useRouter()

// 使用通知服务
const { unreadCount } = useNotifications()

// 组件引用
const navItemRefs = ref<HTMLElement[]>([])
const notificationWrapper = ref<HTMLElement | null>(null)

// 滑动指示线状态
const sliderStyle = ref({
  width: '0px',
  left: '0px',
  opacity: '0'
})

// 是否显示指示线
const showIndicator = ref(true)

// 搜索功能
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchSuggestions = ref<string[]>([])
const showSearchResults = ref(false)
const isSearching = ref(false)

// 通知弹窗相关
const showNotificationPopover = ref(false)
const hasUnreadNotifications = computed(() => unreadCount.value > 0)

/**
 * 搜索防抖计时器
 */
let searchDebounceTimer: NodeJS.Timeout | null = null

// 导航项配置
const navItems = [
  { name: '仪表盘', path: '/dashboard' },
  { name: '寝室管理', path: '/dashboard/dormitory' },
  { name: '成员管理', path: '/dashboard/members' },
  { name: '费用管理', path: '/dashboard/expenses' },
  { name: '账单管理', path: '/dashboard/bills' },
  { name: '支付功能', path: '/dashboard/payment' },
  { name: '统计分析', path: '/dashboard/analytics' }
]

/**
 * 切换通知弹窗显示状态
 */
const toggleNotificationPopover = (): void => {
  showNotificationPopover.value = !showNotificationPopover.value
}

/**
 * 获取搜索建议
 */
const getSearchSuggestions = async (): Promise<void> => {
  if (!searchQuery.value.trim()) {
    searchSuggestions.value = []
    return
  }
  
  try {
    const { searchService } = await import('../services/searchService')
    searchSuggestions.value = searchService.getSmartSuggestions(searchQuery.value, 5)
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    searchSuggestions.value = []
  }
}

/**
 * 执行全局搜索
 */
const performGlobalSearch = async (): Promise<void> => {
  if (!searchQuery.value.trim()) {
    showSearchResults.value = false
    return
  }
  
  isSearching.value = true
  
  try {
    const { searchService } = await import('../services/searchService')
    
    // 执行全局搜索
    const results = await searchService.globalSearch(searchQuery.value, undefined, 15)
    searchResults.value = results
    showSearchResults.value = results.length > 0
    
    console.log(`全局搜索完成："${searchQuery.value}"，找到 ${results.length} 个结果`)
    
    if (results.length === 0) {
      ElMessage.info('未找到相关内容，请尝试其他关键词')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    searchResults.value = []
    showSearchResults.value = false
  } finally {
    isSearching.value = false
  }
}

/**
 * 处理搜索输入（带防抖）
 */
const handleSearchInput = (): void => {
  // 清除之前的计时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  
  // 如果输入为空，隐藏结果
  if (!searchQuery.value.trim()) {
    showSearchResults.value = false
    searchSuggestions.value = []
    return
  }
  
  // 设置新的计时器
  searchDebounceTimer = setTimeout(() => {
    // 获取搜索建议
    getSearchSuggestions()
    
    // 执行搜索
    performGlobalSearch()
  }, 300) // 300ms 防抖
}

/**
 * 处理搜索框获得焦点
 */
const handleSearchFocus = (): void => {
  // 搜索框获得焦点时显示搜索建议
  if (searchSuggestions.value.length > 0 || searchQuery.value.trim()) {
    showSearchResults.value = true
  }
}

/**
 * 处理搜索框失去焦点
 */
const handleSearchBlur = (): void => {
  // 延迟隐藏，允许点击结果项
  // 注意：如果已经通过点击隐藏了面板，则不再重复隐藏
  setTimeout(() => {
    if (showSearchResults.value) {
      showSearchResults.value = false
      searchSuggestions.value = []
    }
  }, 200)
}

/**
 * 处理搜索结果点击
 */
const handleSearchResultClick = (result: SearchResult): void => {
  try {
    console.log('点击搜索结果:', result)
    
    // 立即隐藏搜索面板，防止竞态条件
    showSearchResults.value = false
    searchSuggestions.value = []
    
    // 检查路径是否有效
    if (!result.path) {
      console.error('搜索结果缺少路径信息:', result)
      ElMessage.error('无效的搜索结果')
      return
    }
    
    // 执行路由跳转
    router.push(result.path)
      .then(() => {
        ElMessage.success(`已跳转到：${result.title}`)
        console.log(`成功跳转到: ${result.path}`)
      })
      .catch((error) => {
        console.error('路由跳转失败:', error)
        ElMessage.error(`跳转失败：${result.title}`)
      })
    
    // 清理搜索状态
    searchQuery.value = ''
    
  } catch (error) {
    console.error('处理搜索结果点击时发生错误:', error)
    ElMessage.error('操作失败，请重试')
  }
}

/**
 * 处理搜索建议点击
 */
const handleSuggestionClick = (suggestion: string): void => {
  try {
    console.log('点击搜索建议:', suggestion)
    
    // 立即隐藏搜索面板
    showSearchResults.value = false
    searchSuggestions.value = []
    
    // 设置搜索查询并执行搜索
    searchQuery.value = suggestion
    performGlobalSearch()
    
  } catch (error) {
    console.error('处理搜索建议点击时发生错误:', error)
    ElMessage.error('操作失败，请重试')
  }
}

/**
 * 获取搜索结果分类
 */
const getSearchResultCategories = computed(() => {
  const categories: Record<string, SearchResult[]> = {}
  searchResults.value.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = []
    }
    categories[result.category].push(result)
  })
  return categories
})

/**
 * 获取分类显示名称
 */
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'page': '页面',
    'function': '功能',
    'data': '数据',
    'help': '帮助'
  }
  return categoryMap[category] || category
}

/**
 * 判断当前导航项是否激活
 * @param path 导航路径
 * @returns 是否激活
 */
const isActive = (path: string): boolean => {
  return route.path === path
}

/**
 * 更新滑动指示线位置
 */
const updateSliderPosition = async () => {
  await nextTick()
  const activeIndex = navItems.findIndex(item => item.path === route.path)
  
  if (activeIndex === -1 || !navItemRefs.value[activeIndex]) {
    sliderStyle.value = {
      width: '0px',
      left: '0px',
      opacity: '0'
    }
    return
  }
  
  const activeElement = navItemRefs.value[activeIndex]
  const navElement = activeElement.parentElement
  
  if (!navElement) return
  
  const navRect = navElement.getBoundingClientRect()
  const activeRect = activeElement.getBoundingClientRect()
  
  // 计算滑动指示线的位置和宽度
  const left = activeRect.left - navRect.left
  const width = activeRect.width
  
  sliderStyle.value = {
    width: `${width}px`,
    left: `${left}px`,
    opacity: showIndicator.value ? '1' : '0'
  }
}

/**
 * 切换指示线显示状态
 */
const toggleIndicator = () => {
  showIndicator.value = !showIndicator.value
  sliderStyle.value.opacity = showIndicator.value ? '1' : '0'
}

// 监听路由变化，更新指示线位置
watch(() => route.path, () => {
  updateSliderPosition()
  
  // 路由变化时自动隐藏搜索面板
  showSearchResults.value = false
  searchSuggestions.value = []
})

// 组件挂载后初始化指示线位置
onMounted(() => {
  updateSliderPosition()
  
  // 监听窗口大小变化，更新指示线位置
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateSliderPosition)
    
    // 暴露切换指示线的方法到全局，方便调试
    ;(window as any).toggleNavIndicator = toggleIndicator
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateSliderPosition)
  }
})
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #f0f0f0;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 24px;
}

.logo-container {
  position: relative;
  width: 40px;
  height: 40px;
}

.logo-container img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.logo-glow {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: linear-gradient(45deg, #409eff, #67c23a);
  opacity: 0.3;
  animation: pulse 2s infinite;
  z-index: -1;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  background: linear-gradient(45deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-container {
  flex: 1;
  max-width: 500px;
  margin-right: 24px;
  position: relative;
}

.header-search {
  border-radius: 20px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
}

.header-search:focus-within {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.nav {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.nav-background {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  opacity: 0.1;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  text-decoration: none;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.nav-item.active {
  color: #409eff;
  font-weight: 600;
}

.nav-text {
  position: relative;
  z-index: 1;
}

.nav-spacer {
  flex: 1;
}

.notification-wrapper {
  position: relative;
  margin: 0 16px;
}

.notification-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s ease;
}

.notification-icon:hover {
  background: #f5f7fa;
  color: #409eff;
}

.notification-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
}

.user-profile-wrapper {
  display: flex;
  align-items: center;
}

.nav-slider {
  position: absolute;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px 3px 0 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 搜索结果面板 */
.search-results-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 2000;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 8px;
}

.search-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.search-category-group {
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.search-category-group:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  background: #f5f7fa;
}

.category-count {
  font-size: 12px;
  color: #909399;
}

.search-result-list {
  padding: 8px 0;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-item:hover {
  background: #f5f7fa;
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #909399;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-description {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-keywords {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.suggestion-tag {
  cursor: pointer;
}

.suggestion-tag:hover {
  opacity: 0.8;
}

.search-suggestions {
  padding: 16px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.no-results .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.suggestion {
  font-size: 12px;
  margin-top: 8px;
}

/* 动画 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-container {
    padding: 0 16px;
  }
  
  .logo-text {
    display: none;
  }
  
  .search-container {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .nav-item:not(.active) {
    display: none;
  }
  
  .search-container {
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }
  
  .logo {
    margin-right: 12px;
  }
  
  .search-container {
    display: none;
  }
  
  .nav-item {
    padding: 0 12px;
  }
}
</style>