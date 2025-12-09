<template>
  <div class="not-found">
    <div class="error-content">
      <div class="error-icon">🏠</div>
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移动</p>
      <div class="error-details" v-if="currentPath">
        <small>当前访问路径: {{ currentPath }}</small>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="goHome" size="large">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack" size="large">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
        <el-button @click="refreshPage" size="large">
          <el-icon><Refresh /></el-icon>
          刷新页面
        </el-button>
      </div>
      <div class="quick-links">
        <h3>常用功能</h3>
        <div class="link-grid">
          <router-link to="/dashboard" class="quick-link">
            <div class="link-icon">📊</div>
            <span>仪表盘</span>
          </router-link>
          <router-link to="/dashboard/dormitory" class="quick-link">
            <div class="link-icon">🏠</div>
            <span>寝室管理</span>
          </router-link>
          <router-link to="/dashboard/member" class="quick-link">
            <div class="link-icon">👥</div>
            <span>成员管理</span>
          </router-link>
          <router-link to="/dashboard/expense" class="quick-link">
            <div class="link-icon">💰</div>
            <span>费用管理</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Back, Refresh } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const currentPath = ref('')

onMounted(() => {
  currentPath.value = route.path
  // 记录404错误到控制台，便于调试
  console.warn(`404错误: 尝试访问不存在的路径: ${route.path}`)
})

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const refreshPage = () => {
  window.location.reload()
}
</script>

<style scoped>
.not-found {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.error-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

h1 {
  font-size: 6rem;
  color: #667eea;
  margin: 0;
  font-weight: 700;
}

h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 20px 0;
}

p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 30px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.quick-links {
  border-top: 1px solid #eee;
  padding-top: 30px;
}

.quick-links h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.1rem;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.quick-link:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  border-color: #667eea;
}

.link-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.quick-link span {
  font-size: 0.9rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-content {
    padding: 30px 20px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .link-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  h1 {
    font-size: 4rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
</style>