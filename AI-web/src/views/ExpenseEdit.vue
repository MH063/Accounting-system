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
          @click="$router.back()"
          class="back-btn"
        >
          返回
        </el-button>
        <el-button 
          @click="$router.back()"
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
                >
                  <el-option 
                    label="住宿费" 
                    value="accommodation" 
                  />
                  <el-option 
                    label="水电费" 
                    value="utilities" 
                  />
                  <el-option 
                    label="维修费" 
                    value="maintenance" 
                  />
                  <el-option 
                    label="清洁费" 
                    value="cleaning" 
                  />
                  <el-option 
                    label="其他" 
                    value="other" 
                  />
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
            <el-upload
              v-model:file-list="fileList"
              class="upload-demo"
              drag
              action="#"
              multiple
              :auto-upload="false"
              list-type="text"
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

const route = useRoute()
const router = useRouter()

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
const fileList = ref([])

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
    
    // 检查是否有传入的数据（从路由query或state中获取）
    let passedData = null
    
    if (route.query.data) {
      // 先解码URL编码的数据，再解析JSON
      const decodedData = decodeURIComponent(route.query.data as string)
      passedData = JSON.parse(decodedData)
    } else if (route.state?.expenseData) {
      passedData = route.state.expenseData
    }
    
    console.log(`加载费用数据，ID: ${expenseId}`, passedData)
    
    if (passedData) {
      // 使用传入的数据
      formData.value = {
        title: passedData.description || '',
        category: passedData.category === '餐饮' ? 'other' : 
                 passedData.category === '交通' ? 'utilities' :
                 passedData.category === '生活用品' ? 'accommodation' :
                 passedData.category === '娱乐' ? 'maintenance' : 'other',
        amount: passedData.amount || 0,
        date: passedData.date || '',
        description: passedData.description || '',
        applicant: passedData.payer || '当前用户',
        phone: '13800138000', // 默认值
        department: '财务部', // 默认值
        position: '员工' // 默认值
      }
      console.log('使用传入的数据加载表单:', formData.value)
    } else {
      // 模拟API调用获取数据
      setTimeout(() => {
        // 模拟数据
        const mockData = {
          title: '办公室清洁费用',
          category: 'cleaning',
          amount: 300.00,
          date: '2024-12-15',
          description: '月度办公室清洁服务，包括地面清洁、垃圾清理等',
          applicant: '张三',
          phone: '13800138000',
          department: '行政部门',
          position: '清洁员'
        }
        
        formData.value = { ...mockData }
        console.log('使用默认模拟数据加载表单')
      }, 500)
    }
    
  } catch (error) {
    console.error('加载费用数据失败:', error)
    ElMessage.error('加载费用数据失败')
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  try {
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存草稿失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    submitting.value = true
    
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('费用修改成功')
      router.push(`/dashboard/expense/detail/${route.params.id}`)
      submitting.value = false
    }, 1000)
    
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请检查表单信息')
    submitting.value = false
  }
}

onMounted(() => {
  loadExpenseData()
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

/* 上传组件样式 */
.upload-demo {
  width: 100%;
}

.el-upload-dragger {
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