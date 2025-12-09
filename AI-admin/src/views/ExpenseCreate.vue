<template>
  <div class="expense-create-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>创建费用</span>
          <div>
            <el-button @click="goBack">取消</el-button>
            <el-button type="primary" @click="saveDraft" :loading="saving">保存草稿</el-button>
            <el-button type="success" @click="submitExpense" :loading="submitting">提交费用</el-button>
          </div>
        </div>
      </template>
      
      <el-form
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseFormRules"
        label-width="120px"
        class="expense-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="费用标题" prop="title">
              <el-input
                v-model="expenseForm.title"
                placeholder="请输入费用标题"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="费用类别" prop="category">
              <el-select
                v-model="expenseForm.category"
                placeholder="请选择费用类别"
                style="width: 100%"
              >
                <el-option label="住宿费" value="accommodation" />
                <el-option label="水电费" value="utilities" />
                <el-option label="维修费" value="maintenance" />
                <el-option label="清洁费" value="cleaning" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="费用说明" prop="description">
          <el-input
            v-model="expenseForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入费用说明"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="费用金额" prop="amount">
              <el-input
                v-model="expenseForm.amount"
                placeholder="请输入费用金额"
                @input="handleAmountInput"
              >
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="费用日期" prop="date">
              <el-date-picker
                v-model="expenseForm.date"
                type="date"
                placeholder="请选择费用日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="参与成员" prop="participants">
          <el-transfer
            v-model="expenseForm.participants"
            :data="members"
            :titles="['未选择', '已选择']"
            filterable
            filter-placeholder="请输入成员姓名"
          />
        </el-form-item>
        
        <el-form-item label="分摊方式" prop="splitMethod">
          <el-radio-group v-model="expenseForm.splitMethod" @change="calculateSplit">
            <el-radio label="equal">平均分摊</el-radio>
            <el-radio label="custom">自定义分摊</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 自定义分摊详情 -->
        <div v-if="expenseForm.splitMethod === 'custom'" class="custom-split-section">
          <el-table :data="customSplitDetails" style="width: 100%">
            <el-table-column prop="name" label="成员" />
            <el-table-column label="分摊金额">
              <template #default="{ row }">
                <el-input
                  v-model="row.amount"
                  @input="handleCustomSplitInput(row)"
                  placeholder="请输入金额"
                >
                  <template #prepend>¥</template>
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="分摊比例">
              <template #default="{ row }">
                {{ calculatePercentage(row.amount) }}%
              </template>
            </el-table-column>
          </el-table>
          
          <div class="split-summary">
            <div class="summary-item">
              <span>总金额:</span>
              <span>¥{{ expenseForm.amount }}</span>
            </div>
            <div class="summary-item">
              <span>已分配:</span>
              <span>¥{{ allocatedAmount }}</span>
            </div>
            <div class="summary-item" :class="{ 'warning': remainingAmount !== 0 }">
              <span>剩余:</span>
              <span>¥{{ remainingAmount }}</span>
            </div>
          </div>
        </div>
        
        <el-form-item label="附件上传" prop="attachments">
          <el-upload
            v-model:file-list="expenseForm.attachments"
            class="upload-demo"
            action="/api/upload"
            multiple
            :limit="5"
            :on-exceed="handleExceed"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png/pdf文件，且不超过5MB，最多可上传5个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 路由实例
const router = useRouter()

// 响应式数据
const expenseFormRef = ref()
const saving = ref(false)
const submitting = ref(false)

const expenseForm = reactive({
  title: '',
  category: '',
  description: '',
  amount: '',
  date: '',
  participants: [] as number[],
  splitMethod: 'equal',
  attachments: [] as any[]
})

const expenseFormRules = {
  title: [
    { required: true, message: '请输入费用标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择费用类别', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入费用说明', trigger: 'blur' },
    { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入费用金额', trigger: 'blur' },
    { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的金额格式', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择费用日期', trigger: 'change' }
  ],
  participants: [
    { required: true, message: '请选择参与成员', trigger: 'change' }
  ]
}

// 成员数据
const members = ref([
  { key: 1, label: '张三 (寝室长)' },
  { key: 2, label: '李四' },
  { key: 3, label: '王五' },
  { key: 4, label: '赵六' },
  { key: 5, label: '钱七' }
])

// 自定义分摊详情
const customSplitDetails = ref([
  { key: 1, name: '张三 (寝室长)', amount: '' },
  { key: 2, name: '李四', amount: '' },
  { key: 3, name: '王五', amount: '' },
  { key: 4, name: '赵六', amount: '' },
  { key: 5, name: '钱七', amount: '' }
])

// 计算属性
const allocatedAmount = computed(() => {
  return customSplitDetails.value.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0
    return sum + amount
  }, 0)
})

const remainingAmount = computed(() => {
  const total = parseFloat(expenseForm.amount) || 0
  return parseFloat((total - allocatedAmount.value).toFixed(2))
})

// 方法
const goBack = () => {
  router.back()
}

const saveDraft = () => {
  expenseFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      saving.value = true
      // 模拟保存草稿
      setTimeout(() => {
        ElMessage.success('草稿保存成功')
        saving.value = false
      }, 1000)
    } else {
      ElMessage.warning('请填写完整的费用信息')
    }
  })
}

const submitExpense = () => {
  expenseFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 检查自定义分摊是否平衡
      if (expenseForm.splitMethod === 'custom' && remainingAmount.value !== 0) {
        ElMessage.warning('自定义分摊金额不平衡，请检查分摊详情')
        return
      }
      
      submitting.value = true
      // 模拟提交费用
      setTimeout(() => {
        ElMessage.success('费用提交成功')
        submitting.value = false
        router.push('/expense/list')
      }, 1000)
    } else {
      ElMessage.warning('请填写完整的费用信息')
    }
  })
}

const handleAmountInput = (value: string) => {
  // 限制只能输入数字和小数点
  expenseForm.amount = value.replace(/[^\d.]/g, '')
  // 计算分摊
  calculateSplit()
}

const calculateSplit = () => {
  if (expenseForm.splitMethod === 'equal') {
    const total = parseFloat(expenseForm.amount) || 0
    const count = expenseForm.participants.length || 1
    const equalAmount = (total / count).toFixed(2)
    
    // 更新自定义分摊详情
    customSplitDetails.value.forEach(item => {
      if (expenseForm.participants.includes(item.key)) {
        item.amount = equalAmount
      } else {
        item.amount = ''
      }
    })
  }
}

const handleCustomSplitInput = (row: any) => {
  // 限制只能输入数字和小数点
  row.amount = row.amount.replace(/[^\d.]/g, '')
}

const calculatePercentage = (amount: string) => {
  const total = parseFloat(expenseForm.amount) || 0
  if (total === 0) return 0
  const amt = parseFloat(amount) || 0
  return ((amt / total) * 100).toFixed(2)
}

const handleExceed = () => {
  ElMessage.warning('最多只能上传5个文件')
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('文件上传成功')
  console.log('上传成功:', response, file)
}

const handleUploadError = (error: any, file: any) => {
  ElMessage.error('文件上传失败')
  console.error('上传失败:', error, file)
}

// 监听参与成员变化
watch(() => expenseForm.participants, () => {
  calculateSplit()
})

// 组件挂载时的操作
onMounted(() => {
  console.log('💸 费用创建页面加载完成')
  
  // 设置默认日期为今天
  const today = new Date()
  expenseForm.date = today.toISOString().split('T')[0]
  
  // 设置默认参与者为所有成员
  expenseForm.participants = members.value.map(member => member.key)
  
  // 初始化分摊详情
  calculateSplit()
})
</script>

<style scoped>
.expense-create-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expense-form {
  max-width: 800px;
  margin: 0 auto;
}

.custom-split-section {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.split-summary {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.summary-item {
  display: flex;
  gap: 8px;
  font-weight: 600;
}

.summary-item.warning {
  color: #e6a23c;
}

.upload-demo {
  width: 100%;
}

@media (max-width: 768px) {
  .expense-form {
    max-width: 100%;
  }
  
  .split-summary {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>