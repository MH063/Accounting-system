<template>
  <div class="fee-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="handleEdit">编辑</el-button>
            <el-button type="success" @click="handlePayment">缴费</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="16">
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="记录ID">{{ feeInfo.id }}</el-descriptions-item>
            <el-descriptions-item label="学生姓名">{{ feeInfo.studentName }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ feeInfo.studentId }}</el-descriptions-item>
            <el-descriptions-item label="费用类型">{{ getFeeTypeText(feeInfo.feeType) }}</el-descriptions-item>
            <el-descriptions-item label="金额">{{ feeInfo.amount }} 元</el-descriptions-item>
            <el-descriptions-item label="应缴日期">{{ feeInfo.dueDate }}</el-descriptions-item>
            <el-descriptions-item label="缴费日期">{{ feeInfo.paymentDate || '未缴费' }}</el-descriptions-item>
            <el-descriptions-item label="缴费状态">
              <el-tag :type="getStatusTagType(feeInfo.status)">
                {{ getStatusText(feeInfo.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ feeInfo.remark }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <el-descriptions title="学生信息" :column="2" border>
            <el-descriptions-item label="学院">{{ studentInfo.college }}</el-descriptions-item>
            <el-descriptions-item label="专业">{{ studentInfo.major }}</el-descriptions-item>
            <el-descriptions-item label="年级">{{ studentInfo.grade }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ studentInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="寝室">{{ studentInfo.dormitory }}</el-descriptions-item>
            <el-descriptions-item label="辅导员">{{ studentInfo.counselor }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
        
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>费用统计</span>
            </template>
            <div class="fee-statistics">
              <div class="stat-item">
                <div class="stat-label">总费用</div>
                <div class="stat-value">¥{{ statistics.totalAmount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">已缴费用</div>
                <div class="stat-value">¥{{ statistics.paidAmount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">欠费金额</div>
                <div class="stat-value">¥{{ statistics.arrearsAmount }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">缴费率</div>
                <div class="stat-value">{{ statistics.paymentRate }}%</div>
              </div>
            </div>
          </el-card>
          
          <el-card shadow="never" style="margin-top: 20px;">
            <template #header>
              <span>缴费历史</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in paymentHistory"
                :key="index"
                :timestamp="record.date"
                placement="top"
              >
                <el-card>
                  <h4>{{ record.type }}</h4>
                  <p>金额: ¥{{ record.amount }}</p>
                  <p>操作人: {{ record.operator }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑费用信息" width="600px">
      <el-form :model="editFormData" :rules="editFormRules" ref="editFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生姓名" prop="studentName">
              <el-input v-model="editFormData.studentName" placeholder="请输入学生姓名" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="editFormData.studentId" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="费用类型" prop="feeType">
              <el-select v-model="editFormData.feeType" placeholder="请选择费用类型" style="width: 100%;">
                <el-option label="住宿费" value="accommodation" />
                <el-option label="水电费" value="utilities" />
                <el-option label="网费" value="internet" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="金额(元)" prop="amount">
              <el-input-number v-model="editFormData.amount" :min="0" :precision="2" :step="100" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应缴日期" prop="dueDate">
              <el-date-picker
                v-model="editFormData.dueDate"
                type="date"
                placeholder="请选择应缴日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="缴费状态" prop="status">
              <el-select v-model="editFormData.status" placeholder="请选择缴费状态" style="width: 100%;">
                <el-option label="已缴费" value="paid" />
                <el-option label="未缴费" value="unpaid" />
                <el-option label="部分缴费" value="partial" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="缴费日期">
          <el-date-picker
            v-model="editFormData.paymentDate"
            type="date"
            placeholder="请选择缴费日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="editFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 缴费对话框 -->
    <el-dialog v-model="paymentDialogVisible" title="费用缴纳" width="500px">
      <el-form :model="paymentFormData" :rules="paymentFormRules" ref="paymentFormRef" label-width="100px">
        <el-form-item label="缴费金额" prop="amount">
          <el-input-number v-model="paymentFormData.amount" :min="0" :max="feeInfo.amount" :precision="2" controls-position="right" style="width: 100%;" />
        </el-form-item>
        
        <el-form-item label="缴费方式" prop="method">
          <el-select v-model="paymentFormData.method" placeholder="请选择缴费方式" style="width: 100%;">
            <el-option label="现金" value="cash" />
            <el-option label="银行卡" value="bankCard" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="缴费日期" prop="date">
          <el-date-picker
            v-model="paymentFormData.date"
            type="date"
            placeholder="请选择缴费日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="paymentFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="paymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPaymentForm">确定缴费</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由相关
const router = useRouter()

// 响应式数据
const feeInfo = ref({
  id: 1,
  studentName: '张三',
  studentId: '2023001',
  feeType: 'accommodation',
  amount: 1200.00,
  dueDate: '2023-09-30',
  paymentDate: '2023-09-25',
  status: 'paid',
  remark: '按时缴费'
})

const studentInfo = ref({
  college: '计算机学院',
  major: '计算机科学与技术',
  grade: '2023级',
  phone: '13800138001',
  dormitory: 'A栋101室',
  counselor: '李老师'
})

const statistics = ref({
  totalAmount: 1500.00,
  paidAmount: 1200.00,
  arrearsAmount: 300.00,
  paymentRate: 80
})

const paymentHistory = ref([
  {
    date: '2023-09-25',
    type: '住宿费缴纳',
    amount: 1200.00,
    operator: '财务处-王会计'
  },
  {
    date: '2023-09-15',
    type: '网费缴纳',
    amount: 80.00,
    operator: '自助缴费机'
  }
])

const editDialogVisible = ref(false)
const paymentDialogVisible = ref(false)

const editFormData = ref({
  id: 1,
  studentName: '张三',
  studentId: '2023001',
  feeType: 'accommodation',
  amount: 1200.00,
  dueDate: '2023-09-30',
  paymentDate: '2023-09-25',
  status: 'paid',
  remark: '按时缴费'
})

const paymentFormData = ref({
  amount: 0,
  method: '',
  date: '',
  remark: ''
})

const editFormRules = {
  studentName: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  feeType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  dueDate: [{ required: true, message: '请选择应缴日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择缴费状态', trigger: 'change' }]
}

const paymentFormRules = {
  amount: [{ required: true, message: '请输入缴费金额', trigger: 'blur' }],
  method: [{ required: true, message: '请选择缴费方式', trigger: 'change' }],
  date: [{ required: true, message: '请选择缴费日期', trigger: 'change' }]
}

const editFormRef = ref()
const paymentFormRef = ref()

// 获取费用类型文本
const getFeeTypeText = (type: string) => {
  switch (type) {
    case 'accommodation':
      return '住宿费'
    case 'utilities':
      return '水电费'
    case 'internet':
      return '网费'
    case 'other':
      return '其他'
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'unpaid':
      return 'danger'
    case 'partial':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return '已缴费'
    case 'unpaid':
      return '未缴费'
    case 'partial':
      return '部分缴费'
    default:
      return '未知'
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 编辑
const handleEdit = () => {
  editFormData.value = { ...feeInfo.value }
  editDialogVisible.value = true
}

// 提交编辑表单
const submitEditForm = () => {
  editFormRef.value.validate((valid: boolean) => {
    if (valid) {
      feeInfo.value = { ...editFormData.value }
      editDialogVisible.value = false
      ElMessage.success('费用信息更新成功')
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 缴费
const handlePayment = () => {
  paymentFormData.value = {
    amount: feeInfo.value.amount,
    method: '',
    date: '',
    remark: ''
  }
  paymentDialogVisible.value = true
}

// 提交缴费表单
const submitPaymentForm = () => {
  paymentFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 更新费用信息
      feeInfo.value.paymentDate = paymentFormData.value.date
      feeInfo.value.status = 'paid'
      
      // 添加到缴费历史
      paymentHistory.value.unshift({
        date: paymentFormData.value.date,
        type: `${getFeeTypeText(feeInfo.value.feeType)}缴纳`,
        amount: paymentFormData.value.amount,
        operator: '系统操作员'
      })
      
      paymentDialogVisible.value = false
      ElMessage.success('缴费成功')
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 组件挂载
onMounted(() => {
  console.log('💳 费用详情页面加载完成')
})

/**
 * 费用详情页面
 * 展示费用的详细信息、学生信息和缴费历史
 */
</script>

<style scoped>
.fee-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fee-statistics {
  padding: 20px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.stat-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
</style>