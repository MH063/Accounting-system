<template>
  <div class="expense-edit">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Edit /></el-icon>
          编辑费用
        </h1>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="router.back()"
          class="back-btn"
        >
          返回
        </el-button>
        <el-button 
          @click="router.back()"
          class="cancel-btn"
        >
          取消
        </el-button>
        <el-button 
          type="primary" 
          :icon="DocumentCopy"
          @click="handleSaveDraft"
          class="draft-btn"
        >
          保存草稿
        </el-button>
        <el-button 
          type="success" 
          :icon="Check"
          @click="handleSubmit"
          class="submit-btn"
          :loading="submitting"
        >
          保存修改
        </el-button>
      </div>
    </div>

    <!-- 编辑表单 -->
    <div class="form-section">
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">费用信息</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          class="expense-form"
        >
          <!-- 基本信息 -->
          <div class="form-section-title">
            <el-icon><Document /></el-icon>
            基本信息
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="费用标题" prop="title">
                <el-input
                  v-model="formData.title"
                  placeholder="请输入费用标题"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="费用类别" prop="category">
                <el-select
                  v-model="formData.category"
                  placeholder="请选择费用类别"
                  style="width: 100%"
                  filterable
                >
                  <el-option-group 
                    v-for="group in expenseCategories" 
                    :key="group.label"
                    :label="group.label"
                  >
                    <el-option 
                      v-for="option in group.options" 
                      :key="option.value" 
                      :label="option.label" 
                      :value="option.value" 
                    />
                  </el-option-group>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="费用金额" prop="amount">
                <el-input-number
                  v-model="formData.amount"
                  :min="0"
                  :precision="2"
                  :step="1"
                  placeholder="0.00"
                  style="width: 100%"
                />
                <span class="currency-unit">元</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="费用日期" prop="date">
                <el-date-picker
                  v-model="formData.date"
                  type="date"
                  placeholder="选择费用日期"
                  style="width: 100%"
                  :disabled-date="disabledDate"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="费用描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="请详细描述费用用途和相关内容"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 申请人信息 -->
          <div class="form-section-title">
            <el-icon><User /></el-icon>
            申请人信息
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="申请人姓名" prop="applicant">
                <el-input
                  v-model="formData.applicant"
                  placeholder="请输入申请人姓名"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input
                  v-model="formData.phone"
                  placeholder="请输入联系电话"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="所属部门">
                <el-input
                  v-model="formData.department"
                  placeholder="请输入所属部门"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="职务">
                <el-input
                  v-model="formData.position"
                  placeholder="请输入职务"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 附件信息 -->
          <div class="form-section-title">
            <el-icon><Paperclip /></el-icon>
            附件信息
          </div>

          <el-form-item label="相关票据">
            <div class="upload-container">
              <!-- 上传进度条 -->
              <div v-if="uploading" class="upload-progress-container">
                <el-progress 
                  :percentage="uploadProgress" 
                  :stroke-width="12" 
                  striped 
                  striped-flow
                  :duration="10"
                />
              </div>
              
              <el-upload
                v-model:file-list="fileList"
                class="upload-demo"
                drag
                action="#"
                multiple
                :auto-upload="false"
                list-type="text"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                :on-exceed="handleFileExceed"
                :limit="5"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 pdf/jpg/png/gif 文件，单个文件不超过 10MB
                  </div>
                </template>
              </el-upload>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Document, User, Paperclip, Edit,
  DocumentCopy, Check, UploadFilled
} from '@element-plus/icons-vue'
import expenseService from '@/services/expenseService'

const route = useRoute()
const router = useRouter()

/**
 * 获取类别显示文本
 * @param category 类别值
 */
const getCategoryText = (category: string) => {
  if (!category) return '未知'
  if (/[\u4e00-\u9fa5]/.test(category)) return category

  // 尝试在 expenseCategories 中查找
  for (const group of expenseCategories) {
    const option = group.options.find(opt => opt.value === category)
    if (option) return option.label
  }

  const map: Record<string, string> = {
    'accommodation': '住宿费',
    'utilities': '水电费',
    'maintenance': '维修费',
    'cleaning': '清洁费',
    'activities': '活动费用',
    'supplies': '日用品',
    'food': '食品饮料',
    'insurance': '保险费用',
    'other': '其他',
    'rent': '房租',
    'deposit': '押金',
    'management_fee': '管理费',
    'water_fee': '水费',
    'electricity_fee': '电费',
    'gas_fee': '燃气费',
    'internet_fee': '网费',
    'tv_fee': '电视费',
    'equipment_repair': '设备维修',
    'furniture_repair': '家具维修',
    'appliance_repair': '电器维修',
    'door_window_repair': '门窗维修',
    'plumbing': '管道疏通',
    'daily_cleaning': '日常清洁',
    'deep_cleaning': '深度清洁',
    'pest_control': '杀虫除害',
    'waste_disposal': '垃圾处理',
    'agency_fee': '中介服务费',
    'legal_fee': '法律咨询费',
    'miscellaneous': '其他杂费'
  }
  return map[category] || category
}

// 费用类别数据
const expenseCategories = [
  {
    label: '住宿费用',
    options: [
      { label: '住宿费', value: 'accommodation' },
      { label: '房租租金', value: 'rent' },
      { label: '住宿押金', value: 'deposit' },
      { label: '住宿管理费', value: 'management_fee' }
    ]
  },
  {
    label: '生活费用',
    options: [
      { label: '水电费', value: 'utilities' },
      { label: '水费', value: 'water_fee' },
      { label: '电费', value: 'electricity_fee' },
      { label: '燃气费', value: 'gas_fee' },
      { label: '网费', value: 'internet_fee' },
      { label: '有线电视费', value: 'tv_fee' }
    ]
  },
  {
    label: '维护费用',
    options: [
      { label: '维修费', value: 'maintenance' },
      { label: '设备维修', value: 'equipment_repair' },
      { label: '家具维修', value: 'furniture_repair' },
      { label: '电器维修', value: 'appliance_repair' },
      { label: '门窗维修', value: 'door_window_repair' },
      { label: '管道疏通', value: 'plumbing' }
    ]
  },
  {
    label: '清洁费用',
    options: [
      { label: '清洁费', value: 'cleaning' },
      { label: '日常清洁', value: 'daily_cleaning' },
      { label: '深度清洁', value: 'deep_cleaning' },
      { label: '杀虫除害', value: 'pest_control' },
      { label: '垃圾处理', value: 'waste_disposal' }
    ]
  },
  {
    label: '其他费用',
    options: [
      { label: '活动费用', value: 'activities' },
      { label: '日用品', value: 'supplies' },
      { label: '食品饮料', value: 'food' },
      { label: '保险费用', value: 'insurance' },
      { label: '中介服务费', value: 'agency_fee' },
      { label: '法律咨询费', value: 'legal_fee' },
      { label: '其他杂费', value: 'miscellaneous' },
      { label: '其他', value: 'other' }
    ]
  }
]

// 表单数据
const formData = ref({
  title: '',
  category: '',
  amount: 0,
  date: '',
  description: '',
  applicant: '',
  phone: '',
  department: '',
  position: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入费用标题', trigger: 'blur' },
    { min: 1, max: 100, message: '费用标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择费用类别', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入费用金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '费用金额必须大于0', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择费用日期', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入费用描述', trigger: 'blur' }
  ],
  applicant: [
    { required: true, message: '请输入申请人姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 文件列表
const fileList = ref<any[]>([])

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)

// 加载状态
const loading = ref(false)

// 提交状态
const submitting = ref(false)

// 表单引用
const formRef = ref()

// 禁用未来日期
const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}

// 加载费用数据
const loadExpenseData = async () => {
  try {
    const expenseId = route.params.id as string
    loading.value = true
    
    // 检查是否有传入的数据（从路由query或state中获取）
    let passedData = null
    
    if (route.query.data) {
      // 先解码URL编码的数据，再解析JSON
      const decodedData = decodeURIComponent(route.query.data as string)
      passedData = JSON.parse(decodedData)
    } else if ((route as any).state?.expenseData) {
      passedData = (route as any).state.expenseData
    }
    
    console.log(`加载费用数据，ID: ${expenseId}`, passedData)
    
    if (passedData) {
      // 使用传入的数据
      formData.value = {
        title: passedData.description || '',
        category: passedData.category || 'other',
        amount: passedData.amount || 0,
        date: passedData.date || '',
        description: passedData.description || '',
        applicant: passedData.payer || '当前用户',
        phone: '13800138000', // 默认值
        department: '财务部', // 默认值
        position: '员工' // 默认值
      }
      
      // 如果 category 是中文，尝试转换回英文 key
      if (/[\u4e00-\u9fa5]/.test(formData.value.category)) {
        const reverseMap: Record<string, string> = {
          '住宿费': 'accommodation',
          '房租': 'rent',
          '房租租金': 'rent',
          '押金': 'deposit',
          '住宿押金': 'deposit',
          '管理费': 'management_fee',
          '住宿管理费': 'management_fee',
          '水电费': 'utilities',
          '水费': 'water_fee',
          '电费': 'electricity_fee',
          '燃气费': 'gas_fee',
          '网费': 'internet_fee',
          '有线电视费': 'tv_fee',
          '维修费': 'maintenance',
          '设备维修': 'equipment_repair',
          '家具维修': 'furniture_repair',
          '电器维修': 'appliance_repair',
          '门窗维修': 'door_window_repair',
          '管道疏通': 'plumbing',
          '清洁费': 'cleaning',
          '日常清洁': 'daily_cleaning',
          '深度清洁': 'deep_cleaning',
          '杀虫除害': 'pest_control',
          '垃圾处理': 'waste_disposal',
          '活动费用': 'activities',
          '日用品': 'supplies',
          '食品饮料': 'food',
          '保险费用': 'insurance',
          '中介服务费': 'agency_fee',
          '法律咨询费': 'legal_fee',
          '其他杂费': 'miscellaneous',
          '其他': 'other'
        }
        formData.value.category = reverseMap[formData.value.category] || formData.value.category
      }
      
      console.log('使用传入的数据加载表单:', formData.value)
    } else {
      // 直接调用真实API获取费用详情
      const expenseId = route.params.id as string
      const response = await expenseService.getExpenseById(expenseId)
      if (response.success) {
        // 转换数据类型以匹配表单组件的要求
        const data = response.data
        
        // 确保 amount 是数字类型
        let amount = data.amount
        if (typeof amount === 'string') {
          amount = parseFloat(amount)
        }
        
        // 确保 date 是字符串或 Date 类型
        let date = data.date
        if (date && typeof date === 'object' && !(date instanceof Date)) {
          // 如果是对象,尝试转换为字符串
          date = date.toString()
        }
        
        formData.value = {
          title: data.title || '',
          category: data.category || '',
          amount: amount || 0,
          date: date || '',
          description: data.description || '',
          applicant: data.applicant || '',
          phone: data.phone || '',
          department: data.department || '',
          position: data.position || ''
        }
        
        fileList.value = response.data.attachments || []
        console.log('费用数据加载成功:', formData.value)
      } else {
        throw new Error(response.message || '获取费用详情失败')
      }
    }
    
  } catch (error) {
    console.error('加载费用数据失败:', error)
    ElMessage.error('加载费用数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  try {
    console.log('保存草稿:', formData.value)
    
    // 调用真实API保存草稿
    const response = await expenseService.saveDraft(formData.value)
    if (response.success) {
      ElMessage.success('草稿保存成功')
    } else {
      throw new Error(response.message || '保存失败')
    }
    
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败，请重试')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    submitting.value = true
    console.log('开始提交费用修改:', formData.value)
    
    // 调用真实API更新费用记录
    const expenseId = route.params.id as string
    const response = await expenseService.updateExpense(expenseId, formData.value)
    if (response.success) {
      ElMessage.success('费用修改成功')
      router.push(`/dashboard/expense/detail/${expenseId}`)
    } else {
      throw new Error(response.message || '提交失败')
    }
    
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请检查表单信息')
  } finally {
    submitting.value = false
  }
}

// 文件变化处理
const handleFileChange = async (file: any) => {
  try {
    console.log('File changed:', file)
    
    // 验证文件大小（限制每个文件不超过10MB）
    if (file.raw) {
      if (file.raw.size > 10 * 1024 * 1024) {
        ElMessage.error(`文件 ${file.name} 超过10MB限制`)
        // 从文件列表中移除
        const index = fileList.value.findIndex((f: any) => f.uid === file.uid)
        if (index > -1) {
          fileList.value.splice(index, 1)
        }
        return
      }
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.raw.type)) {
        ElMessage.error(`文件 ${file.name} 格式不支持，请选择 pdf/jpg/png/gif 格式的文件`)
        const index = fileList.value.findIndex((f: any) => f.uid === file.uid)
        if (index > -1) {
          fileList.value.splice(index, 1)
        }
        return
      }
    }
    
    // 显示上传状态
    uploading.value = true
    uploadProgress.value = 0
    file.status = 'uploading'
    
    // 调用真实的文件上传API
    const formDataObj = new FormData()
    formDataObj.append('file', file.raw)
    formDataObj.append('expenseId', route.params.id as string)
    
    // 调用真实的文件上传API
    const response = await expenseService.uploadFile(formDataObj)
    if (response.success) {
      file.status = 'success'
      file.url = response.data.fileUrl
      ElMessage.success(`文件 ${file.name} 上传成功`)
    } else {
      throw new Error(response.message || '上传失败')
    }
    
  } catch (error) {
    console.error('文件上传失败:', error)
    file.status = 'error'
    uploading.value = false
    uploadProgress.value = 0
    ElMessage.error(`文件 ${file.name} 上传失败，请重试`)
  }
}

// 文件移除处理
const handleFileRemove = async (file: any) => {
  try {
    console.log('File removed:', file)
    
    // 调用真实的文件删除API
    if (file.url) {
      const response = await expenseService.deleteFile(file.url)
      if (!response.success) {
        throw new Error(response.message || '删除文件失败')
      }
    }
    
    ElMessage.info(`文件 ${file.name} 已移除`)
    console.log('文件移除成功:', file.name)
    
  } catch (error) {
    console.error('移除文件失败:', error)
    ElMessage.error('移除文件失败，请重试')
  }
}

// 文件超出限制处理
const handleFileExceed = () => {
  ElMessage.warning('最多只能上传 5 个文件')
}

onMounted(async () => {
  try {
    console.log('开始初始化费用编辑页面')
    await loadExpenseData()
  } catch (error) {
    console.error('初始化费用编辑页面失败:', error)
    ElMessage.error('页面初始化失败')
  }
})
</script>

<style scoped>
/* 页面容器 */
.expense-edit {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  color: #409eff;
  font-size: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.draft-btn {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  border: none;
  color: white;
}

.submit-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
}

/* 表单区域 */
.form-section {
  margin-bottom: 24px;
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title .el-icon {
  color: #409eff;
}

.expense-form {
  padding: 20px 0;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.form-section-title .el-icon {
  color: #409eff;
}

.currency-unit {
  margin-left: 8px;
  color: #909399;
}

/* 上传区域样式 */
.upload-container {
  width: 100%;
}

.upload-progress-container {
  margin-bottom: 16px;
}

.upload-demo :deep(.el-upload) {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
}

.el-upload__text {
  color: #909399;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
}

.el-upload__tip {
  color: #909399;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expense-edit {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
  }
  
  .form-section-title {
    font-size: 14px;
  }
}
</style>