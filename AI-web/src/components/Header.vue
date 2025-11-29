<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <div class="logo-container">
          <img src="https://picsum.photos/40/40" alt="Logo" />
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
                @click="searchQuery = suggestion; performGlobalSearch()"
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
        <div class="notification-icon" @click="handleNotification">
          <el-icon :size="18"><Bell /></el-icon>
          <div class="notification-dot"></div>
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

// 路由实例
const route = useRoute()
const router = useRouter()

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

// 组件引用
const navItemRefs = ref<HTMLElement[]>([])

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
const searchResults = ref([])
const searchSuggestions = ref<string[]>([])
const showSearchResults = ref(false)
const isSearching = ref(false)

/**
 * 搜索防抖计时器
 */
let searchDebounceTimer: NodeJS.Timeout | null = null

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
 * 处理搜索框失去焦点
 */
const handleSearchBlur = (): void => {
  // 延迟隐藏，允许点击结果项
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

/**
 * 处理搜索结果点击
 */
const handleSearchResultClick = (result: any): void => {
  try {
    console.log('点击搜索结果:', result)
    
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
    showSearchResults.value = false
    
  } catch (error) {
    console.error('处理搜索结果点击时发生错误:', error)
    ElMessage.error('操作失败，请重试')
  }
}

/**
 * 获取搜索结果分类
 */
const getSearchResultCategories = computed(() => {
  const categories = {}
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
  const categoryMap = {
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

/**
 * 处理通知图标点击事件
 */
const handleNotification = (): void => {
  router.push('/notifications')
}

// 监听路由变化，更新指示线位置
watch(() => route.path, () => {
  updateSliderPosition()
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
  height: 60px;
  width: 100%;
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
}

.header-container {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  margin-right: 24px;
}

.logo-container {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo img {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo:hover img {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.logo-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(54, 209, 220, 0.3));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.logo:hover .logo-glow {
  opacity: 1;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #36d1dc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(64, 158, 255, 0.3);
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(248, 249, 250, 0.1));
  border-radius: 12px;
  z-index: 0;
}

.nav-item {
  position: relative;
  padding: 10px 18px;
  color: #606266;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.nav-text {
  position: relative;
  z-index: 2;
  transition: color 0.3s ease;
}

.nav-item:hover {
  color: #409eff;
  transform: translateY(-1px);
}

.nav-item.active {
  color: #ffffff;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff, #36d1dc);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.nav-spacer {
  width: 8px;
  height: 100%;
}

.user-profile-wrapper {
  position: relative;
  z-index: 1002;
}

/* 全局滑动指示线 */
.nav-slider {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, #409eff, #36d1dc);
  border-radius: 1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.notification-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: 8px;
  color: #606266;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1;
  flex-shrink: 0;
}

.search-container {
  margin-left: 24px;
  display: flex;
  align-items: center;
}

.header-search {
  width: 200px;
}

.header-search :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.header-search :deep(.el-input__wrapper):hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.4);
}

.header-search :deep(.el-input__inner) {
  color: #606266;
  font-size: 14px;
}

.header-search :deep(.el-input__inner)::placeholder {
  color: #a8abb2;
}

/* 搜索结果面板样式 */
.search-results-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.8);
  max-height: 500px;
  overflow-y: auto;
  z-index: 1000;
  animation: searchSlideDown 0.2s ease-out;
}

@keyframes searchSlideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 搜索结果样式 */
.search-results-section {
  padding: 0;
}

.search-category-group {
  margin-bottom: 16px;
}

.search-category-group:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  background-color: rgba(248, 249, 250, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.category-header .el-icon {
  color: #409eff;
}

.category-count {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.search-result-list {
  padding: 4px 0;
}

.search-result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 0 8px;
}

.search-result-item:hover {
  background-color: rgba(64, 158, 255, 0.08);
  transform: translateX(2px);
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  color: #409eff;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.result-description {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.result-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.result-keywords .el-tag {
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
}

.result-priority {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  flex-shrink: 0;
}

.result-priority.priority-1 {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.result-priority.priority-2 {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.result-priority.priority-3 {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

/* 无结果提示 */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-results .el-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.no-results p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.no-results .suggestion {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

/* 搜索建议 */
.search-suggestions {
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-icon:hover {
  background: linear-gradient(135deg, #409eff, #36d1dc);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
  border: 2px solid #ffffff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}

@media (max-width: 1200px) {
  .header-container {
    max-width: 100%;
    padding: 0 20px;
  }
  
  .logo {
    margin-right: 20px;
  }
  
  .nav-item {
    padding: 10px 14px;
    font-size: 14px;
  }
  
  .logo-text {
    font-size: 18px;
  }
  
  .search-container {
    margin-left: 16px;
  }
  
  .header-search {
    width: 160px;
  }
}

@media (max-width: 900px) {
  .header-container {
    padding: 0 16px;
  }
  
  .logo {
    margin-right: 16px;
  }
  
  .nav {
    padding: 2px;
  }
  
  .nav-item {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .notification-icon {
    width: 36px;
    height: 36px;
    margin-right: 8px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 12px;
  }
  
  .logo {
    margin-right: 12px;
  }
  
  .logo-text {
    display: none;
  }
  
  .nav {
    gap: 0;
    padding: 2px;
  }
  
  .nav-item {
    padding: 8px 8px;
    font-size: 12px;
  }
  
  .nav-spacer {
    width: 4px;
  }
  
  .notification-icon {
    width: 32px;
    height: 32px;
    margin-right: 4px;
  }
  
  .notification-dot {
    width: 6px;
    height: 6px;
    top: 6px;
    right: 6px;
  }
  
  .search-container {
    margin-left: 8px;
    margin-right: 8px;
  }
  
  .header-search {
    width: 120px;
  }
  
  .search-results-panel {
    max-height: 400px;
  }
  
  .search-result-item {
    padding: 10px 12px;
    gap: 8px;
  }
  
  .result-icon {
    width: 28px;
    height: 28px;
  }
  
  .result-title {
    font-size: 13px;
  }
  
  .result-description {
    font-size: 11px;
  }
}
</style>
