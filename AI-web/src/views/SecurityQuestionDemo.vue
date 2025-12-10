<template>
  <div class="security-question-demo">
    <div class="demo-container">
      <div class="demo-header">
        <h2>安全问题功能演示</h2>
        <p>展示如何使用安全问题进行身份验证</p>
      </div>
      
      <div class="demo-content">
        <el-card class="demo-card">
          <template #header>
            <div class="card-header">
              <span>安全问题设置状态</span>
            </div>
          </template>
          
          <div class="status-info">
            <el-tag :type="hasSecurityQuestions ? 'success' : 'danger'">
              {{ hasSecurityQuestions ? '已设置' : '未设置' }}
            </el-tag>
            <p class="status-desc">
              {{ hasSecurityQuestions 
                ? '您已设置安全问题，可以进行验证测试' 
                : '您尚未设置安全问题，请先设置' }}
            </p>
          </div>
          
          <div class="demo-actions">
            <el-button 
              type="primary" 
              @click="goToSecuritySettings"
              size="default"
            >
              {{ hasSecurityQuestions ? '修改安全问题' : '设置安全问题' }}
            </el-button>
            
            <el-button 
              v-if="hasSecurityQuestions"
              @click="goToVerification"
              size="default"
            >
              测试验证
            </el-button>
          </div>
        </el-card>
        
        <el-card class="demo-card">
          <template #header>
            <div class="card-header">
              <span>功能说明</span>
            </div>
          </template>
          
          <div class="instructions">
            <h4>安全问题功能介绍：</h4>
            <ul>
              <li>安全问题用于在敏感操作时进行身份验证</li>
              <li>系统要求设置3个安全问题及答案</li>
              <li>答案在存储时会进行加密处理</li>
              <li>验证时会忽略答案的大小写和首尾空格</li>
            </ul>
            
            <h4>使用场景：</h4>
            <ul>
              <li>找回密码时的身份验证</li>
              <li>修改重要账户信息时的确认</li>
              <li>大额支付前的安全确认</li>
            </ul>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { hasSecurityQuestions as checkHasSecurityQuestions } from '@/services/securityQuestionService'

// 路由实例
const router = useRouter()

// 当前用户ID（实际应用中应从用户信息获取）
const currentUserId = ref('')

// 是否已设置安全问题
const hasSecurityQuestionsValue = ref(false)

// 计算属性：是否已设置安全问题
const hasSecurityQuestions = ref(false)

// 检查是否已设置安全问题
const checkSecurityQuestions = (): void => {
  try {
    const userId = currentUserId.value
    hasSecurityQuestions.value = checkHasSecurityQuestions(userId)
  } catch (error) {
    console.error('检查安全问题设置状态失败:', error)
    hasSecurityQuestions.value = false
  }
}

// 跳转到安全设置页面
const goToSecuritySettings = (): void => {
  router.push('/security-settings')
}

// 跳转到验证页面
const goToVerification = (): void => {
  router.push('/security-question-verification')
}

// 生命周期
onMounted(() => {
  checkSecurityQuestions()
})
</script>

<style scoped>
.security-question-demo {
  padding: 20px;
}

.demo-container {
  max-width: 800px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.demo-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.demo-header p {
  font-size: 14px;
  color: #606266;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demo-card {
  border-radius: 8px;
}

.card-header {
  font-weight: 500;
  color: #303133;
}

.status-info {
  text-align: center;
  margin: 20px 0;
}

.status-desc {
  margin-top: 10px;
  color: #606266;
}

.demo-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.instructions h4 {
  margin: 15px 0 10px 0;
  color: #303133;
}

.instructions ul {
  padding-left: 20px;
  color: #606266;
}

.instructions li {
  margin-bottom: 8px;
}
</style>