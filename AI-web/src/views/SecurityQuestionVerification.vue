<template>
  <div class="security-question-verification">
    <div class="verification-container">
      <div class="verification-header">
        <h2>安全验证</h2>
        <p>为了保护您的账户安全，请回答以下安全问题</p>
        <p v-if="props.verificationReason">验证原因：{{ props.verificationReason }}</p>
      </div>
      
      <div class="verification-content">
        <el-form 
          ref="verificationFormRef" 
          :model="verificationForm" 
          :rules="verificationRules"
          v-loading="loading"
        >
          <el-form-item 
            v-for="(question, index) in selectedQuestions" 
            :key="index"
            :label="'问题' + (index + 1)"
            :prop="'answer' + (index + 1)"
          >
            <div class="question-text">{{ getQuestionText(question.question) }}</div>
            <el-input 
              v-model="question.answer" 
              :type="index === 0 ? 'text' : 'password'"
              :placeholder="'请输入答案'"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="submitVerification"
              :loading="submitting"
              size="default"
            >
              验证
            </el-button>
            <el-button @click="cancelVerification" size="default">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { 
  getSecurityQuestionConfigForVerification,
  verifySecurityQuestionAnswer
} from '@/services/securityQuestionService'

// 定义组件属性
interface Props {
  onVerificationSuccess?: () => void;
  onVerificationCancel?: () => void;
  verificationReason?: string;
}

const props = withDefaults(defineProps<Props>(), {
  onVerificationSuccess: () => {},
  onVerificationCancel: () => {},
  verificationReason: '安全验证'
})

// 路由实例
const router = useRouter()

// 表单引用
const verificationFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 当前用户ID（实际应用中应从用户信息获取）
const currentUserId = ref('')

// 选中的问题
const selectedQuestions = ref([
  { question: '', answer: '' },
  { question: '', answer: '' },
  { question: '', answer: '' }
])

// 验证表单数据
const verificationForm = reactive({
  answer1: '',
  answer2: '',
  answer3: ''
})

// 验证规则
const verificationRules: FormRules = {
  answer1: [
    { required: true, message: '请输入答案', trigger: 'blur' }
  ],
  answer2: [
    { required: true, message: '请输入答案', trigger: 'blur' }
  ],
  answer3: [
    { required: true, message: '请输入答案', trigger: 'blur' }
  ]
}

// 问题文本映射
const questionTextMap: Record<string, string> = {
  'birthplace': '您的出生地是哪里？',
  'mother_name': '您母亲的姓名是？',
  'first_pet': '您的第一个宠物名字是？',
  'favorite_teacher': '您最喜欢的老师是？',
  'first_car': '您的第一辆车是？',
  'favorite_color': '您最喜欢的颜色是？',
  'father_name': '您父亲的姓名是？',
  'best_friend': '您最好的朋友是？',
  'favorite_food': '您最喜欢的食物是？',
  'first_job': '您的第一个工作是？',
  'favorite_sport': '您最喜欢的运动是？',
  'memorable_trip': '您最难忘的旅行是？',
  'favorite_movie': '您最喜欢的电影是？',
  'childhood_nickname': '您小时候的昵称是？',
  'favorite_book': '您最喜欢的书籍是？'
}

// 获取问题文本
const getQuestionText = (questionKey: string): string => {
  return questionTextMap[questionKey] || questionKey
}

// 加载安全问题
const loadSecurityQuestions = (): void => {
  try {
    loading.value = true
    const userId = currentUserId.value
    const config = getSecurityQuestionConfigForVerification(userId)
    
    // 设置选中的问题
    selectedQuestions.value = [
      { question: config.question1, answer: '' },
      { question: config.question2, answer: '' },
      { question: config.question3, answer: '' }
    ]
  } catch (error) {
    console.error('加载安全问题失败:', error)
    ElMessage.error('加载安全问题失败')
  } finally {
    loading.value = false
  }
}

// 提交验证
const submitVerification = async (): Promise<void> => {
  try {
    submitting.value = true
    
    // 验证表单
    const valid = await verificationFormRef.value?.validate()
    if (!valid) {
      return
    }
    
    // 验证每个答案
    const userId = currentUserId.value
    
    // 确保答案存在
    const answer1 = selectedQuestions.value[0]?.answer || ''
    const answer2 = selectedQuestions.value[1]?.answer || ''
    const answer3 = selectedQuestions.value[2]?.answer || ''
    
    const results = [
      verifySecurityQuestionAnswer(userId, 1, answer1),
      verifySecurityQuestionAnswer(userId, 2, answer2),
      verifySecurityQuestionAnswer(userId, 3, answer3)
    ]
    
    // 检查所有答案是否正确
    const allCorrect = results.every(result => result)
    
    if (allCorrect) {
      ElMessage.success('验证成功')
      // 调用成功回调函数
      props.onVerificationSuccess()
    } else {
      ElMessage.error('答案不正确，请重新输入')
    }
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('验证过程中发生错误')
  } finally {
    submitting.value = false
  }
}

// 取消验证
const cancelVerification = (): void => {
  ElMessageBox.confirm(
    '确定要取消安全验证吗？这将退出当前操作。',
    '确认取消',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 调用取消回调函数
    props.onVerificationCancel()
  }).catch(() => {
    // 用户取消操作
  })
}

// 生命周期
onMounted(() => {
  loadSecurityQuestions()
})
</script>

<style scoped>
.security-question-verification {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.verification-container {
  width: 100%;
  max-width: 500px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.verification-header {
  text-align: center;
  margin-bottom: 30px;
}

.verification-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.verification-header p {
  font-size: 14px;
  color: #606266;
}

.question-text {
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
}

.el-form-item {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>