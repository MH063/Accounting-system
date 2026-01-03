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
                :loading="loadingCategories"
              >
                <el-option
                  v-for="item in categories"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
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
            action="/api/upload/multiple"
            multiple
            :limit="5"
            :on-exceed="handleExceed"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
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
import { expenseCreateApi } from '@/api/expenseCreate'

const router = useRouter()
const expenseFormRef = ref()
const saving = ref(false)
const submitting = ref(false)
const loadingCategories = ref(false)
const currentDormId = ref<number | null>(null)

const categories = ref<Array<{ value: string; label: string; color?: string }>>([])
const members = ref<Array<{ key: number; label: string }>>([])

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

const customSplitDetails = ref<Array<{ key: number; name: string; amount: string }>>([])

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

const goBack = () => {
  router.back()
}

const loadExpenseCategories = async () => {
  try {
    loadingCategories.value = true
    console.log('📂 加载费用类别列表...')
    const response = await expenseCreateApi.getExpenseCategories()
    console.log('✅ 费用类别列表加载成功:', response)
    categories.value = response.categories || []
  } catch (error: any) {
    console.error('❌ 加载费用类别失败:', error)
    ElMessage.error(error.message || '加载费用类别失败')
  } finally {
    loadingCategories.value = false
  }
}

const loadDormMembers = async (dormId: number) => {
  try {
    console.log(`📂 加载宿舍 ${dormId} 的成员列表...`)
    const response = await expenseCreateApi.getDormMembers(dormId)
    console.log('✅ 宿舍成员列表加载成功:', response)
    
    const rawMembers = response.rawMembers || response.members || []
    members.value = rawMembers.map((member: any) => ({
      key: member.userId,
      label: member.label || member.nickname || member.username
    }))
    
    updateCustomSplitDetails()
  } catch (error: any) {
    console.error('❌ 加载宿舍成员失败:', error)
    ElMessage.error(error.message || '加载宿舍成员失败')
  }
}

const updateCustomSplitDetails = () => {
  customSplitDetails.value = members.value.map(member => ({
    key: member.key,
    name: member.label,
    amount: ''
  }))
  calculateSplit()
}

const saveDraft = async () => {
  expenseFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      saving.value = true
      try {
        console.log('💾 保存费用草稿...', expenseForm)
        const response = await expenseCreateApi.saveDraft({
          title: expenseForm.title,
          description: expenseForm.description,
          amount: expenseForm.amount,
          category: expenseForm.category,
          date: expenseForm.date,
          participants: expenseForm.participants,
          splitMethod: expenseForm.splitMethod
        })
        console.log('✅ 草稿保存成功:', response)
        ElMessage.success('草稿保存成功')
        router.push('/expense/list')
      } catch (error: any) {
        console.error('❌ 草稿保存失败:', error)
        ElMessage.error(error.message || '草稿保存失败')
      } finally {
        saving.value = false
      }
    } else {
      ElMessage.warning('请填写完整的费用信息')
    }
  })
}

const submitExpense = async () => {
  expenseFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (expenseForm.splitMethod === 'custom' && remainingAmount.value !== 0) {
        ElMessage.warning('自定义分摊金额不平衡，请检查分摊详情')
        return
      }
      
      submitting.value = true
      try {
        console.log('📤 提交费用...', expenseForm)
        const response = await expenseCreateApi.createExpense({
          title: expenseForm.title,
          description: expenseForm.description,
          amount: expenseForm.amount,
          category: expenseForm.category,
          date: expenseForm.date,
          participants: expenseForm.participants,
          splitMethod: expenseForm.splitMethod
        })
        console.log('✅ 费用提交成功:', response)
        ElMessage.success('费用提交成功')
        router.push('/expense/list')
      } catch (error: any) {
        console.error('❌ 费用提交失败:', error)
        ElMessage.error(error.message || '费用提交失败')
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('请填写完整的费用信息')
    }
  })
}

const handleAmountInput = (value: string) => {
  expenseForm.amount = value.replace(/[^\d.]/g, '')
  calculateSplit()
}

const calculateSplit = () => {
  if (expenseForm.splitMethod === 'equal') {
    const total = parseFloat(expenseForm.amount) || 0
    const count = expenseForm.participants.length || 1
    const equalAmount = (total / count).toFixed(2)
    
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
  console.log('📎 上传成功:', response, file)
}

const handleUploadError = (error: any, file: any) => {
  ElMessage.error('文件上传失败')
  console.error('❌ 上传失败:', error, file)
}

const beforeUpload = (file: any) => {
  const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isValidType) {
    ElMessage.error('只能上传jpg/png/pdf文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过5MB!')
    return false
  }
  return true
}

watch(() => expenseForm.participants, () => {
  updateCustomSplitDetails()
})

onMounted(async () => {
  console.log('💸 费用创建页面加载完成')
  
  const today = new Date()
  expenseForm.date = today.toISOString().split('T')[0]
  
  await loadExpenseCategories()
  
  currentDormId.value = 1
  if (currentDormId.value) {
    await loadDormMembers(currentDormId.value)
    expenseForm.participants = members.value.map(m => m.key)
  }
  
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
