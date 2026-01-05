<template>
  <div class="expense-create-container" :class="{ 'is-mobile': isMobile }">
    <el-card>
      <template #header>
        <div class="card-header responsive-header">
          <span class="title">{{ isMobile ? '新建费用' : '创建费用' }}</span>
          <div class="header-buttons">
            <el-button @click="goBack" :size="isMobile ? 'small' : 'default'">
              {{ isMobile ? '返回' : '取消' }}
            </el-button>
            <el-button type="primary" @click="saveDraft" :loading="saving" :size="isMobile ? 'small' : 'default'">
              {{ isMobile ? '暂存' : '保存草稿' }}
            </el-button>
            <el-button type="success" @click="submitExpense" :loading="submitting" :size="isMobile ? 'small' : 'default'">
              {{ isMobile ? '提交' : '提交费用' }}
            </el-button>
          </div>
        </div>
      </template>
      
      <el-form
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseFormRules"
        :label-width="isMobile ? '80px' : '120px'"
        :label-position="isMobile ? 'top' : 'left'"
        class="expense-form"
      >
        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="费用标题" prop="title">
              <el-input
                v-model="expenseForm.title"
                placeholder="请输入费用标题"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
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
            :rows="isMobile ? 2 : 3"
            placeholder="请输入费用说明"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-row :gutter="isMobile ? 0 : 20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="费用金额" prop="amount">
              <el-input
                v-model="expenseForm.amount"
                placeholder="请输入费用金额"
                @input="handleAmountInput"
                @blur="handleAmountBlur"
              >
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
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
          <div class="transfer-container">
            <div v-if="currentDormId === 'all'" class="transfer-filter">
              <el-row :gutter="10" :style="{ width: isMobile ? '100%' : '100%', maxWidth: '600px', marginBottom: '10px' }">
                <el-col :xs="12" :sm="10">
                  <el-input
                    v-model="dormSearchName"
                    placeholder="寝室号"
                    clearable
                    @input="debouncedFilter"
                    :size="isMobile ? 'small' : 'default'"
                  >
                    <template #prefix>
                      <el-icon><HomeFilled /></el-icon>
                    </template>
                  </el-input>
                </el-col>
                <el-col :xs="12" :sm="10">
                  <el-input
                    v-model="dormSearchCode"
                    placeholder="宿舍编码"
                    clearable
                    @input="debouncedFilter"
                    :size="isMobile ? 'small' : 'default'"
                  >
                    <template #prefix>
                      <el-icon><OfficeBuilding /></el-icon>
                    </template>
                  </el-input>
                </el-col>
                <el-col v-if="!isMobile" :span="4">
                  <div v-if="isFiltering" class="filter-loading">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>筛选中...</span>
                  </div>
                </el-col>
              </el-row>
              <div v-if="isMobile && isFiltering" class="filter-loading mobile-filter-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>筛选中...</span>
              </div>
            </div>
            <el-transfer
              v-model="expenseForm.participants"
              :data="filteredMembers"
              :titles="isMobile ? ['待选', '已选'] : ['未选择', '已选择']"
              filterable
              :filter-method="filterMethod"
              :filter-placeholder="isMobile ? '搜索' : '搜索姓名/用户名'"
              :props="{
                key: 'key',
                label: 'label'
              }"
              :button-texts="isMobile ? ['', ''] : []"
              class="responsive-transfer"
            >
              <template #default="{ option }">
                <div class="member-item">
                  <span class="member-label">{{ option.label }}</span>
                  <el-tag v-if="option.dormName" size="small" type="info" class="member-dorm-tag">
                    {{ option.dormName }}
                  </el-tag>
                </div>
              </template>
              <template #left-footer>
                <div class="transfer-footer">
                  待选 {{ filteredMembers.filter(m => !expenseForm.participants.includes(m.key)).length }} 人
                </div>
              </template>
              <template #right-footer>
                <div class="transfer-footer">
                  已选 {{ expenseForm.participants.length }} 人
                </div>
              </template>
            </el-transfer>
          </div>
        </el-form-item>
        
        <el-form-item label="分摊方式" prop="splitMethod">
          <el-radio-group v-model="expenseForm.splitMethod" @change="calculateSplit" :class="{ 'mobile-radio-group': isMobile }">
            <el-radio label="equal">等额分摊</el-radio>
            <el-radio label="days">按天数分摊</el-radio>
            <el-radio label="custom">自定义比例</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <div v-if="expenseForm.splitMethod === 'custom' || expenseForm.splitMethod === 'days'" class="custom-split-section">
          <div class="mobile-scroll-container">
            <el-table :data="customSplitDetails" style="width: 100%">
              <el-table-column prop="name" label="成员" :min-width="isMobile ? 100 : 150" />
              <el-table-column v-if="expenseForm.splitMethod === 'days'" label="居住天数" :width="isMobile ? 80 : 100">
                <template #default="{ row }">
                  <span>{{ row.days }} 天</span>
                </template>
              </el-table-column>
              <el-table-column :label="expenseForm.splitMethod === 'days' ? '计算金额' : '分摊金额'" :min-width="isMobile ? 120 : 180">
                <template #default="{ row }">
                  <el-input
                    v-model="row.amount"
                    :readonly="expenseForm.splitMethod === 'days'"
                    :size="isMobile ? 'small' : 'default'"
                    @input="handleCustomSplitInput(row)"
                    @blur="handleCustomSplitBlur(row)"
                    placeholder="请输入金额"
                  >
                    <template #prepend>¥</template>
                  </el-input>
                </template>
              </el-table-column>
              <el-table-column label="比例" :width="isMobile ? 70 : 100">
                <template #default="{ row }">
                  {{ calculatePercentage(row.amount) }}%
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="split-summary">
            <div class="summary-item">
              <span>总额:</span>
              <span>¥{{ expenseForm.amount }}</span>
            </div>
            <div class="summary-item">
              <span>已配:</span>
              <span>¥{{ allocatedAmount }}</span>
            </div>
            <div class="summary-item" :class="{ 'warning': Math.abs(remainingAmount) > 0.01 }">
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
            name="files"
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, OfficeBuilding, Loading, Back, Checked, Promotion } from '@element-plus/icons-vue'
import { expenseCreateApi } from '@/api/expenseCreate'
import { userApi } from '@/api/user'
import { getCurrentUser, hasAnyRole } from '@/utils/permissionControl'
import { normalizeAmount } from '@/utils/amount'

const router = useRouter()
const route = useRoute()

// 移动端适配
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}
const expenseFormRef = ref()
const saving = ref(false)
const submitting = ref(false)
const loadingCategories = ref(false)
const currentDormId = ref<number | string | null>(null)
const currentExpenseId = ref<string | number | null>(null)

const categories = ref<Array<{ value: string; label: string; color?: string }>>([])
const members = ref<Array<{ 
  key: number; 
  label: string; 
  username: string; 
  nickname: string; 
  realName: string; 
  dormName: string; 
  building: string; 
  moveInDate?: string;
  moveOutDate?: string;
  memberRole?: string;
}>>([])

const dormSearchName = ref('')
const dormSearchCode = ref('')
const isFiltering = ref(false)
let debounceTimer: any = null

const debouncedFilter = () => {
  isFiltering.value = true
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    isFiltering.value = false
  }, 300)
}

const filteredMembers = computed(() => {
  return members.value.filter(m => {
    // 寝室号模糊匹配
    const matchName = !dormSearchName.value || 
      (m.dormName && m.dormName.toLowerCase().includes(dormSearchName.value.toLowerCase()))
    
    // 宿舍编码精确匹配 (假设后端返回的数据中有 building 或 dormCode 字段，这里先兼容 m.building)
    const matchCode = !dormSearchCode.value || 
      (m.building && m.building === dormSearchCode.value)
    
    return matchName && matchCode
  })
})

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

const customSplitDetails = ref<Array<{ key: number; name: string; amount: string; weight: number; days: number }>>([])

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

const loadDormMembers = async (dormId: number | string) => {
  try {
    console.log(`� 加载宿舍成员列表 (ID: ${dormId})...`)
    const response = await expenseCreateApi.getDormMembers(dormId)
    console.log('✅ 宿舍成员列表加载成功:', response)
    
    // 转换格式以适配 el-transfer (Rule 5)
    // 根据用户规则 5：实际上应该访问 response.data.data.xxx
    // 这里的 response 已经是拦截器返回的 resData.data
    const membersData = (response && response.members) || 
                       (response && response.data && response.data.members) || 
                       response || []
    
    console.log('📦 处理成员数据:', {
      count: Array.isArray(membersData) ? membersData.length : 'not an array',
      firstMember: Array.isArray(membersData) && membersData.length > 0 ? membersData[0] : 'none'
    })

    members.value = (Array.isArray(membersData) ? membersData : []).map((m: any) => {
      const realName = m.realName || ''
      const nickname = m.nickname || ''
      const username = m.username || ''
      const displayName = nickname || realName || username
      
      // 优化标签显示：只有当实名或用户名与显示名称不同时，才在括号中显示
      const details = []
      if (realName && realName !== displayName) details.push(realName)
      if (username && username !== displayName) details.push(username)
      
      const detailInfo = details.join('/')
      const label = detailInfo ? `${displayName}(${detailInfo})` : displayName
      
      // 关键：确保 dormName 能够正确获取，增加对多种命名风格的兼容
      const dormName = m.dormName || m.dorm_name || m.dorm?.dorm_name || m.dorm?.name
      
      return {
        key: m.key || m.userId || m.id,
        label: label,
        username: username,
        nickname: nickname,
        realName: realName,
        dormName: dormName || '未分配',
        building: m.building || m.dorm?.building || ''
      }
    })
    
    // 如果没有选择过参与者，保持为空（Rule: 初始状态右侧“已选择人员”列表初始为空）
    if (expenseForm.participants.length === 0) {
      expenseForm.participants = []
    }
    
    updateCustomSplitDetails()
  } catch (error: any) {
    console.error('❌ 加载宿舍成员失败:', error)
    ElMessage.error(error.message || '加载宿舍成员失败')
    members.value = []
  }
}

const filterMethod = (query: string, item: any) => {
  return (
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.username.toLowerCase().includes(query.toLowerCase()) ||
    (item.realName && item.realName.toLowerCase().includes(query.toLowerCase()))
  )
}

const updateCustomSplitDetails = () => {
  // 保持现有的分摊详情，只添加新增的成员，删除移除的成员
  const currentDetails = [...customSplitDetails.value]
  const expenseDate = new Date(expenseForm.date || new Date())
  expenseDate.setHours(0, 0, 0, 0)
  
  customSplitDetails.value = members.value
    .filter(member => expenseForm.participants.includes(member.key))
    .map(member => {
      const existing = currentDetails.find(d => d.key === member.key)
      
      // 计算居住天数 (与后端逻辑一致)
      let days = 1
      // @ts-ignore
      const moveIn = member.moveInDate ? new Date(member.moveInDate) : null
      // @ts-ignore
      const moveOut = member.moveOutDate ? new Date(member.moveOutDate) : null
      
      if (moveIn) {
        moveIn.setHours(0, 0, 0, 0)
        if (moveIn > expenseDate) {
          days = 0
        } else {
          const end = (moveOut && moveOut <= expenseDate) ? moveOut : expenseDate
          end.setHours(0, 0, 0, 0)
          days = Math.floor((end.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }
      }

      // 默认权重逻辑 (保持兼容)
      let defaultWeight = 1.0
      // @ts-ignore
      if (member.memberRole === 'admin') defaultWeight = 1.5
      // @ts-ignore
      else if (member.memberRole === 'deputy') defaultWeight = 1.2

      return {
        key: member.key,
        name: member.label,
        amount: existing ? existing.amount : '',
        weight: existing ? (existing.weight || defaultWeight) : defaultWeight,
        days: days
      }
    })
  
  calculateSplit()
}

const saveDraft = async () => {
  expenseFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      saving.value = true
      try {
        console.log('💾 保存费用草稿...', expenseForm)
        
        const draftData = {
          title: expenseForm.title,
          description: expenseForm.description,
          amount: expenseForm.amount,
          category: expenseForm.category,
          date: expenseForm.date,
          participants: expenseForm.participants,
          splitMethod: expenseForm.splitMethod,
          customSplitDetails: expenseForm.splitMethod === 'custom' ? customSplitDetails.value : undefined,
          status: 'draft'
        }

        let response
        if (currentExpenseId.value) {
          console.log(`📝 更新现有草稿 (ID: ${currentExpenseId.value})`)
          response = await expenseCreateApi.updateExpense(currentExpenseId.value, draftData)
        } else {
          console.log('🆕 创建新草稿')
          response = await expenseCreateApi.saveDraft(draftData)
        }

        console.log('✅ 草稿保存成功:', response)
        
        // 如果是新创建的草稿，保存其 ID 以便后续更新
        if (!currentExpenseId.value && response && response.id) {
          currentExpenseId.value = response.id
        }
        
        ElMessage.success('草稿已保存')
        // 不再跳转，保留编辑状态
      } catch (error: any) {
        console.error('❌ 草稿保存失败:', error)
        ElMessage.error(error.message || '草稿保存失败，请重试')
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
        
        const expenseData = {
          title: expenseForm.title,
          description: expenseForm.description,
          amount: expenseForm.amount,
          category: expenseForm.category,
          date: expenseForm.date,
          participants: expenseForm.participants,
          splitMethod: expenseForm.splitMethod,
          customSplitDetails: expenseForm.splitMethod === 'custom' ? customSplitDetails.value : undefined,
          status: 'pending' // 明确设置为待审核状态
        }

        let response
        if (currentExpenseId.value) {
          console.log(`📝 提交现有草稿 (ID: ${currentExpenseId.value})`)
          response = await expenseCreateApi.updateExpense(currentExpenseId.value, expenseData)
        } else {
          console.log('🆕 直接创建并提交费用')
          response = await expenseCreateApi.createExpense(expenseData)
        }

        console.log('✅ 费用提交成功:', response)
        ElMessage.success('费用提交成功')
        router.push('/expense-management')
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

const handleAmountBlur = () => {
  expenseForm.amount = normalizeAmount(expenseForm.amount)
  calculateSplit()
}

const handleCustomSplitBlur = (row: any) => {
  row.amount = normalizeAmount(row.amount)
  calculateSplit()
}

/**
 * 实时过滤金额输入，仅保留数字和小数点，限制两位小数
 */
const filterAmount = (value: string): string => {
  let cleanValue = value.replace(/[^\d.]/g, '')
  
  // 确保只有一个小数点
  const dotCount = (cleanValue.match(/\./g) || []).length
  if (dotCount > 1) {
    const firstDotIndex = cleanValue.indexOf('.')
    cleanValue = cleanValue.slice(0, firstDotIndex + 1) + 
                 cleanValue.slice(firstDotIndex + 1).replace(/\./g, '')
  }
  
  // 限制小数点后最多两位
  if (cleanValue.includes('.')) {
    const parts = cleanValue.split('.')
    if (parts[1].length > 2) {
      cleanValue = `${parts[0]}.${parts[1].slice(0, 2)}`
    }
  }
  return cleanValue
}

const handleAmountInput = (value: string) => {
  expenseForm.amount = filterAmount(value)
  calculateSplit()
}

const calculateSplit = () => {
  const total = parseFloat(expenseForm.amount) || 0
  const participantsCount = expenseForm.participants.length || 0
  
  if (participantsCount === 0) return

  if (expenseForm.splitMethod === 'equal') {
    const equalAmount = (total / participantsCount).toFixed(2)
    customSplitDetails.value.forEach(item => {
      item.amount = equalAmount
    })
  } else if (expenseForm.splitMethod === 'days') {
    let totalDays = 0
    customSplitDetails.value.forEach(item => {
      totalDays += item.days
    })

    if (totalDays > 0) {
      customSplitDetails.value.forEach(item => {
        item.amount = ((total * item.days) / totalDays).toFixed(2)
      })
    } else {
      // 如果总天数为0，回退到等额分摊
      const equalAmount = (total / participantsCount).toFixed(2)
      customSplitDetails.value.forEach(item => {
        item.amount = equalAmount
      })
    }
  } else if (expenseForm.splitMethod === 'custom') {
    // 自定义模式下不自动计算金额，由用户输入
    // 但如果金额为空，可以默认一个等额分摊作为起始
    customSplitDetails.value.forEach(item => {
      if (!item.amount) {
        item.amount = (total / participantsCount).toFixed(2)
      }
    })
  }
}

const handleCustomSplitInput = (row: any) => {
  row.amount = filterAmount(row.amount)
  // 如果是自定义分摊，输入时不需要实时计算分摊逻辑，但可能需要更新比例
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
  
  // 更新表单中的附件信息，确保存储后端返回的文件路径
  if (response.success && response.data && response.data.files) {
    // 找到当前上传的文件并更新其 url
    const uploadedFile = expenseForm.attachments.find(f => f.uid === file.uid)
    if (uploadedFile) {
      // 假设后端返回的数据中包含文件路径，这里根据 Rule 5 处理双层嵌套
      const fileData = response.data.files[0] // 对应单次上传中的第一个文件
      // @ts-ignore
      uploadedFile.url = fileData.url || fileData.path
      // @ts-ignore
      uploadedFile.id = fileData.id
    }
  }
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
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  console.log('💸 费用创建页面加载完成')
  
  const today = new Date()
  expenseForm.date = today.toISOString().split('T')[0]
  
  await loadExpenseCategories()
  
  // 动态获取当前用户所属宿舍或权限 (Rule 2)
  const user = getCurrentUser()
  if (user) {
    console.log('👤 当前用户:', user)
    // 使用权限控制工具检查角色 (兼容不同数据结构)
    const isAdmin = hasAnyRole(['超级管理员', '管理员', 'system_admin', 'admin'])
    
    if (isAdmin) {
      console.log('👑 管理员角色，加载全系统用户')
      currentDormId.value = 'all'
      await loadDormMembers('all')
    } else {
      console.log('🏠 普通用户角色，尝试获取所属宿舍')
      try {
        const response = await userApi.getUserDormitory(user.id)
        if (response && response.dorm) {
          currentDormId.value = response.dorm.id
          await loadDormMembers(currentDormId.value!)
        } else {
          console.warn('⚠️ 未找到所属宿舍信息')
          ElMessage.warning('您尚未加入任何宿舍，可能无法选择参与成员')
        }
      } catch (error) {
        console.error('❌ 获取宿舍信息失败:', error)
      }
    }
  } else {
    console.warn('⚠️ 未获取到用户信息')
    // 降级处理：尝试加载默认宿舍
    currentDormId.value = 1
    await loadDormMembers(1)
  }
  
  // 检查是否是从草稿编辑跳转过来的
  const queryId = route.query.id as string
  if (queryId) {
    console.log(`📝 加载草稿详情 (ID: ${queryId})`)
    currentExpenseId.value = queryId
    try {
      const response = await expenseCreateApi.getExpenseDetail(queryId)
      if (response) {
        // 填充表单数据
        expenseForm.title = response.title || ''
        expenseForm.description = response.description || ''
        expenseForm.amount = response.amount ? response.amount.toString() : ''
        expenseForm.category = response.category || response.categoryName || ''
        expenseForm.date = response.date || ''
        
        // 处理参与者与分摊详情
        if (response.splitDetails || Array.isArray(response.participants)) {
          let participants: number[] = []
          let loadedDetails: any[] = []
          
          const splitDetails = typeof response.splitDetails === 'string' 
            ? JSON.parse(response.splitDetails) 
            : (response.splitDetails || [])
          
          if (Array.isArray(splitDetails) && splitDetails.length > 0) {
            participants = splitDetails.map((d: any) => d.key || d.userId || d.id)
            loadedDetails = splitDetails.map((d: any) => ({
              key: d.key || d.userId || d.id,
              name: d.name || d.nickname || d.realName || '',
              amount: d.amount ? d.amount.toString() : '',
              weight: d.weight || 1.0,
              days: d.days || 1
            }))
            
            // 设置分摊方式
            if (response.splitType === 'custom' || response.splitMethod === 'custom') {
              expenseForm.splitMethod = 'custom'
            } else {
              expenseForm.splitMethod = response.splitType || response.splitMethod || 'equal'
            }
          } else if (Array.isArray(response.participants)) {
            participants = response.participants.map((p: any) => typeof p === 'object' ? p.id : p)
            expenseForm.splitMethod = response.splitType || response.splitMethod || 'equal'
          }
          
          // 先设置详情，再设置参与者，触发 watcher 
          // watcher 中的 updateCustomSplitDetails 会通过 currentDetails.find 找到并保留这些加载的数据
          customSplitDetails.value = loadedDetails
          expenseForm.participants = participants
        }
        
        // 处理附件
        if (Array.isArray(response.attachments)) {
          expenseForm.attachments = response.attachments.map((a: any) => ({
            name: a.filename || a.name || '附件',
            url: a.url,
            id: a.id
          }))
        }
        
        console.log('✅ 草稿数据填充完成', expenseForm)
      }
    } catch (error) {
      console.error('❌ 加载草稿详情失败:', error)
      ElMessage.error('加载草稿详情失败')
    }
  }
  
  calculateSplit()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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

.header-buttons {
  display: flex;
  gap: 10px;
}

.expense-form {
  max-width: 1000px;
  margin: 0 auto;
}

.custom-split-section {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
  max-width: 1000px;
  margin: 0 auto 20px;
  border: 1px solid #ebeef5;
}

.split-summary {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ebeef5;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.summary-item span:last-child {
  font-weight: bold;
  color: #409eff;
}

.summary-item.warning span:last-child {
  color: #f56c6c;
}

.upload-demo {
  width: 100%;
}

.transfer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: stretch;
  gap: 15px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.member-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.member-dorm-tag {
  flex-shrink: 0;
}

.transfer-footer {
  padding: 6px 15px;
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #ebeef5;
}

.filter-loading {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  color: #409eff;
  font-size: 13px;
}

.mobile-filter-loading {
  margin-bottom: 10px;
  justify-content: center;
}

.mobile-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.el-transfer) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

:deep(.el-transfer-panel) {
  flex: 1;
  min-width: 200px;
  max-width: 450px;
}

:deep(.el-transfer__buttons) {
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;
}

:deep(.el-transfer__button) {
  margin-left: 0 !important;
  padding: 8px 12px;
}

:deep(.el-transfer-panel__body) {
  height: 350px;
}

:deep(.el-transfer-panel__list) {
  height: 300px;
}

@media (max-width: 768px) {
  .expense-create-container {
    padding: 10px;
  }

  .responsive-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .responsive-header .title {
    font-size: 16px;
    font-weight: bold;
  }

  .header-buttons {
    gap: 5px;
  }

  .expense-form {
    max-width: 100%;
  }
  
  .split-summary {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    padding: 10px 0;
  }

  .summary-item {
    width: 100%;
    justify-content: flex-end;
  }

  .mobile-radio-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
  }

  .mobile-radio-group :deep(.el-radio) {
    margin-right: 0;
    width: 100%;
  }

  :deep(.el-transfer) {
    flex-direction: column;
    height: auto;
  }

  :deep(.el-transfer-panel) {
    width: 100%;
    max-width: none;
  }

  :deep(.el-transfer__buttons) {
    flex-direction: row;
    padding: 10px 0;
  }

  :deep(.el-transfer__button:first-child) {
    transform: rotate(90deg);
  }

  :deep(.el-transfer__button:last-child) {
    transform: rotate(90deg);
  }
}
</style>
