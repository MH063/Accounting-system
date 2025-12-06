<template>
  <el-dialog
    v-model="visible"
    title="安全验证"
    width="500px"
    :before-close="handleClose"
  >
    <div class="verification-header">
      <p>为了保护您的账户安全，请回答以下安全问题</p>
      <p v-if="verificationReason">验证原因：{{ verificationReason }}</p>
    </div>
    
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
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelVerification">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitVerification"
          :loading="submitting"
        >
          验证
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { 
  getSecurityQuestionConfigForVerification,
  verifySecurityQuestionAnswer
} from '@/services/securityQuestionService'
import { logSecurityVerification } from '@/services/securityVerificationService'

// 定义组件属性
interface Props {
  modelValue: boolean;
  onVerificationSuccess?: (result: boolean) => void;
  onVerificationCancel?: () => void;
  verificationReason?: string;
}

// 定义事件
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  onVerificationSuccess: () => {},
  onVerificationCancel: () => {},
  verificationReason: '安全验证'
})

const emit = defineEmits<Emits>()

// 表单引用
const verificationFormRef = ref<FormInstance>()

// 控制模态框显示
const visible = ref(props.modelValue)

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 当前用户ID（实际应用中应从用户信息获取）
const currentUserId = ref('default_user')

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
      // 记录验证日志
      logSecurityVerification(userId, 'security_question_verification', true, props.verificationReason || '安全验证')
      // 调用成功回调函数
      props.onVerificationSuccess(true)
      // 关闭模态框
      visible.value = false
      emit('update:modelValue', false)
    } else {
      ElMessage.error('答案不正确，请重新输入')
      // 记录验证日志
      logSecurityVerification(userId, 'security_question_verification', false, props.verificationReason || '安全验证')
      // 调用失败回调函数
      props.onVerificationSuccess(false)
    }
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('验证过程中发生错误')
    // 记录验证日志
    logSecurityVerification(currentUserId.value, 'security_question_verification', false, props.verificationReason || '安全验证')
    // 调用失败回调函数
    props.onVerificationSuccess(false)
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
    // 记录验证日志
    logSecurityVerification(currentUserId.value, 'security_question_verification', false, '用户取消验证')
    // 调用取消回调函数
    props.onVerificationCancel()
    // 关闭模态框
    visible.value = false
    emit('update:modelValue', false)
  }).catch(() => {
    // 用户取消操作
  })
}

// 处理关闭事件
const handleClose = () => {
  cancelVerification()
}

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
  if (newValue) {
    // 当模态框打开时加载安全问题
    loadSecurityQuestions()
  }
})

// 监听visible变化
watch(visible, (newValue) => {
  if (!newValue) {
    // 重置表单
    selectedQuestions.value = [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' }
    ]
  }
})

// 生命周期
onMounted(() => {
  visible.value = props.modelValue
  if (props.modelValue) {
    loadSecurityQuestions()
  }
})
</script>

<style scoped>
.verification-header {
  margin-bottom: 20px;
}

.verification-header p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.question-text {
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>