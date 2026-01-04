<template>
  <div class="fee-detail-container">
    <!-- 如果没有费用ID，显示费用选择列表 -->
    <div v-if="!feeId">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>请选择费用记录查看详情</span>
          </div>
        </template>
        
        <el-table :data="feeList" style="width: 100%" v-loading="loading" border>
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column prop="title" label="费用标题"></el-table-column>
          <el-table-column prop="applicant" label="申请人"></el-table-column>
          <el-table-column prop="amount" label="金额">
            <template #default="scope">
              {{ formatCurrency(scope.row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" size="small" @click="viewDetail(scope.row.id)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container" style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 如果有费用ID，显示费用详情 -->
    <el-card v-else>
      <template #header>
        <div class="card-header">
          <span>费用详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="handleEdit" v-if="isAdmin">强制编辑</el-button>
            <el-button type="success" @click="handlePayment">缴费</el-button>
            <el-button type="warning" @click="handleChangeStatus">状态调整</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="16">
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="记录ID">{{ feeInfo.id }}</el-descriptions-item>
            <el-descriptions-item label="费用标题">{{ feeInfo.title }}</el-descriptions-item>
            <el-descriptions-item label="成员姓名">{{ feeInfo.studentName }}</el-descriptions-item>
            <el-descriptions-item label="费用类型">{{ getFeeTypeText(feeInfo.feeType) }}</el-descriptions-item>
            <el-descriptions-item label="关联宿舍">{{ studentInfo.dormitory }}</el-descriptions-item>
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
          
          <!-- 分摊计算结果 -->
          <el-descriptions title="分摊计算结果" :column="1" border>
            <el-descriptions-item label="总金额">{{ allocationResult.totalAmount }} 元</el-descriptions-item>
            <el-descriptions-item label="分摊人数">{{ allocationResult.personCount }} 人</el-descriptions-item>
            <el-descriptions-item label="人均分摊">{{ allocationResult.perPersonAmount }} 元/人</el-descriptions-item>
            <el-descriptions-item label="计算说明">{{ allocationResult.calculationDescription }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <el-descriptions title="成员信息" :column="2" border>
            <el-descriptions-item label="联系电话">{{ studentInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="寝室">{{ studentInfo.dormitory }}</el-descriptions-item>
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

      <!-- 审核历史记录 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <span>审核历史记录</span>
        </template>
        <el-table :data="auditHistory" style="width: 100%" border>
          <el-table-column prop="date" label="审核时间" width="180"></el-table-column>
          <el-table-column prop="auditor" label="审核人" width="150"></el-table-column>
          <el-table-column prop="status" label="审核状态" width="120">
            <template #default="scope">
              <el-tag :type="getAuditStatusTagType(scope.row.status)">
                {{ getAuditStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="审核意见"></el-table-column>
        </el-table>
      </el-card>
      
      <!-- 费用凭证管理 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>费用凭证</span>
            <el-button type="primary" @click="handleUploadCertificate" size="small">上传凭证</el-button>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6" v-for="(certificate, index) in certificates" :key="index">
            <el-card :body-style="{ padding: '0px' }" shadow="hover">
              <img :src="certificate.url" class="image" />
              <div style="padding: 14px;">
                <div class="certificate-title">{{ certificate.name }}</div>
                <div class="certificate-info">{{ certificate.uploadDate }}</div>
                <div class="certificate-actions">
                  <el-button type="primary" link @click="handleViewCertificate(certificate)">查看</el-button>
                  <el-button type="danger" link @click="handleDeleteCertificate(certificate, index)">删除</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑费用信息" width="600px">
      <el-form :model="editFormData" :rules="editFormRules" ref="editFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="成员姓名" prop="studentName">
              <el-input v-model="editFormData.studentName" placeholder="请输入成员姓名" />
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
    
    <!-- 状态调整对话框 -->
    <el-dialog v-model="statusDialogVisible" title="费用状态调整" width="500px">
      <el-form :model="statusFormData" :rules="statusFormRules" ref="statusFormRef" label-width="100px">
        <el-form-item label="新状态" prop="status">
          <el-select v-model="statusFormData.status" placeholder="请选择新的缴费状态" style="width: 100%;">
            <el-option label="已缴费" value="paid" />
            <el-option label="未缴费" value="unpaid" />
            <el-option label="部分缴费" value="partial" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="调整原因">
          <el-input v-model="statusFormData.reason" type="textarea" placeholder="请输入状态调整的原因" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitStatusForm">确定调整</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 凭证上传对话框 -->
    <el-dialog v-model="certificateDialogVisible" title="上传费用凭证" width="500px">
      <el-upload
        class="certificate-uploader"
        drag
        action="/api/upload"
        :auto-upload="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传jpg/png文件，且不超过500kb
          </div>
        </template>
      </el-upload>
      
      <el-form :model="certificateFormData" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="凭证名称">
          <el-input v-model="certificateFormData.name" placeholder="请输入凭证名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="certificateFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="certificateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCertificateForm">确定上传</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 凭证预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="凭证预览" width="600px">
      <img :src="previewImage" alt="凭证预览" style="width: 100%;" />
      <div style="margin-top: 10px; text-align: center;">{{ previewCertificateName }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { validateCustomFile, createCustomFileType } from '@/utils/fileUploadValidator'
import { feeApi } from '@/api/fee'

// 路由相关
const router = useRouter()
const route = useRoute()

// 从路由参数获取费用ID
const feeId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

// 权限判断（模拟）
const isAdmin = ref(true) // 实际应用中应从用户信息中获取

// 响应式数据
const loading = ref(false)
const feeList = ref([])
const total = ref(0)
const queryParams = ref({
  page: 1,
  pageSize: 10
})

const feeInfo = ref({
  id: 0,
  title: '',
  studentName: '',
  feeType: '',
  amount: 0,
  dueDate: '',
  paymentDate: '',
  status: '',
  remark: ''
})

const studentInfo = ref({
  phone: '-',
  dormitory: '-',
  counselor: '-'
})

const statistics = ref({
  totalAmount: 0,
  paidAmount: 0,
  arrearsAmount: 0,
  paymentRate: 0
})

const paymentHistory = ref([])

// 分摊计算结果
const allocationResult = ref({
  totalAmount: 0,
  personCount: 0,
  perPersonAmount: 0,
  calculationDescription: '-'
})

// 审核历史记录
const auditHistory = ref([])

// 费用凭证
const certificates = ref([])

const editDialogVisible = ref(false)
const paymentDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const certificateDialogVisible = ref(false)
const previewDialogVisible = ref(false)

const editFormData = ref({
  id: 1,
  studentName: '张三',
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

const statusFormData = ref({
  status: '',
  reason: ''
})

const certificateFormData = ref({
  name: '',
  remark: ''
})

const fileList = ref([])
const previewImage = ref('')
const previewCertificateName = ref('')

const editFormRules = {
  studentName: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
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

const statusFormRules = {
  status: [{ required: true, message: '请选择新的缴费状态', trigger: 'change' }]
}

const editFormRef = ref()
const paymentFormRef = ref()
const statusFormRef = ref()

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return '已缴费'
    case 'unpaid':
      return '未缴费'
    case 'partial':
      return '部分缴费'
    case 'pending':
      return '待审核'
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
    default:
      return status || '未知'
  }
}

// 获取费用类型文本
const getFeeTypeText = (type: string) => {
  if (!type) return '未知'
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(type)) return type
  
  switch (type) {
    case 'accommodation':
      return '住宿费'
    case 'utilities':
      return '水电费'
    case 'internet':
      return '网费'
    case 'maintenance':
      return '维修费'
    case 'cleaning':
      return '清洁费'
    case 'rent':
      return '房租'
    case 'other':
      return '其他'
    default:
      return type || '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'paid':
    case 'approved':
      return 'success'
    case 'unpaid':
    case 'rejected':
      return 'danger'
    case 'partial':
    case 'pending':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取审核状态标签类型
const getAuditStatusTagType = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'pending':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取审核状态文本
const getAuditStatusText = (status: string) => {
  switch (status) {
    case 'approved':
      return '审核通过'
    case 'rejected':
      return '审核拒绝'
    case 'pending':
      return '待审核'
    default:
      return '未知'
  }
}

// 格式化货币
const formatCurrency = (value: number | string) => {
  const amount = Number(value)
  if (isNaN(amount)) return '¥0.00'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/fee-detail/${id}`)
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.value.pageSize = val
  loadFeeList()
}

// 当前页变化
const handleCurrentChange = (val: number) => {
  queryParams.value.page = val
  loadFeeList()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 编辑
const handleEdit = () => {
  if (!isAdmin.value) {
    ElMessage.warning('仅管理员可进行强制编辑')
    return
  }
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

// 状态调整
const handleChangeStatus = () => {
  statusFormData.value = {
    status: feeInfo.value.status,
    reason: ''
  }
  statusDialogVisible.value = true
}

// 提交状态调整表单
const submitStatusForm = () => {
  statusFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 更新费用状态
      feeInfo.value.status = statusFormData.value.status
      
      // 添加到审核历史
      auditHistory.value.unshift({
        date: new Date().toLocaleString(),
        auditor: '当前操作员',
        status: 'approved',
        comment: `手动调整状态：${getStatusText(statusFormData.value.status)}，原因：${statusFormData.value.reason || '无'}`
      })
      
      statusDialogVisible.value = false
      ElMessage.success('状态调整成功')
    } else {
      ElMessage.warning('请选择新的缴费状态')
    }
  })
}

// 上传凭证
const handleUploadCertificate = () => {
  certificateFormData.value = {
    name: '',
    remark: ''
  }
  fileList.value = []
  certificateDialogVisible.value = true
}

// 文件变化处理
const handleFileChange = (file: any, fileList: any) => {
  // 实际应用中这里会处理文件上传逻辑
  console.log('文件变化:', file, fileList)
}

// 上传前检查
const beforeUpload = (file: any) => {
  // 创建自定义文件类型配置（凭证图片）
  const certificateFileType = createCustomFileType(
    ['.jpg', '.jpeg', '.png'],
    ['image/jpeg', 'image/png'],
    0.5, // 500KB
    '凭证图片'
  )
  
  return validateCustomFile(file, certificateFileType)
}

// 提交凭证表单
const submitCertificateForm = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  // 模拟上传成功
  certificates.value.push({
    name: certificateFormData.value.name || `凭证${certificates.value.length + 1}`,
    url: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
    uploadDate: new Date().toLocaleDateString()
  })
  
  certificateDialogVisible.value = false
  ElMessage.success('凭证上传成功')
}

// 查看凭证
const handleViewCertificate = (certificate: any) => {
  previewImage.value = certificate.url
  previewCertificateName.value = certificate.name
  previewDialogVisible.value = true
}

// 删除凭证
const handleDeleteCertificate = (certificate: any, index: number) => {
  ElMessageBox.confirm(`确定要删除凭证"${certificate.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    certificates.value.splice(index, 1)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 组件挂载
onMounted(() => {
  console.log('💳 费用详情页面加载完成', {
    hasId: !!feeId.value,
    id: feeId.value
  })
  
  if (feeId.value) {
    // 如果有ID，加载具体费用详情
    loadFeeDetail()
  } else {
    // 如果没有ID，加载费用列表供选择
    loadFeeList()
  }
})

// 监听路由参数变化，当进入或返回页面时加载对应数据
watch(() => feeId.value, (newId, oldId) => {
  console.log('🔄 路由参数变化:', { newId, oldId })
  if (newId) {
    loadFeeDetail()
  } else {
    loadFeeList()
  }
})

// 加载费用详情
const loadFeeDetail = async () => {
  if (!feeId.value) {
    return
  }
  
  loading.value = true
  console.log('🔄 加载费用详情:', feeId.value)
  try {
    const response = await feeApi.getExpenseDetail(feeId.value)
    // 根据规则 5：处理双层嵌套结构
    const data = response.data?.data || response.data || response
    
    if (data) {
      feeInfo.value = {
        id: data.id,
        title: data.title,
        studentName: data.applicant || data.studentName || '-',
        feeType: data.categoryCode || data.category || data.feeType || '-',
        amount: Number(data.amount) || 0,
        dueDate: data.date || data.dueDate || '-',
        paymentDate: data.paymentDate || data.reviewDate || '',
        status: data.status,
        remark: data.description || data.remark || '-'
      }
      
      studentInfo.value = {
        phone: data.phone || '-',
        dormitory: data.dormName || data.dormitory || '未分配',
        counselor: data.counselor || '-'
      }
      
      // 更新统计信息
      statistics.value = {
        totalAmount: Number(data.amount) || 0,
        paidAmount: data.status === 'paid' ? Number(data.amount) : 0,
        arrearsAmount: data.status === 'paid' ? 0 : Number(data.amount),
        paymentRate: data.status === 'paid' ? 100 : 0
      }

      // 如果有分摊信息
      if (data.splitDetails || data.participants) {
        const personCount = data.participants?.length || (Array.isArray(data.splitDetails) ? data.splitDetails.length : 0)
        allocationResult.value = {
          totalAmount: Number(data.amount) || 0,
          personCount: personCount,
          perPersonAmount: personCount > 0 ? (Number(data.amount) / personCount).toFixed(2) : 0,
          calculationDescription: data.splitMethod === 'equal' ? '按成员平均分摊' : '自定义分摊'
        }
      }

      // 如果有审核信息，添加到审核历史
      if (data.reviewer || data.reviewer_user) {
        auditHistory.value = [{
          date: data.reviewDate || data.updatedAt || '-',
          auditor: data.reviewer || (data.reviewer_user?.username) || '-',
          status: data.status === 'approved' || data.status === 'paid' ? 'approved' : data.status,
          comment: data.reviewComment || '无'
        }]
      }

      // 处理附件/凭证
      if (data.attachments && Array.isArray(data.attachments)) {
        certificates.value = data.attachments.map((url: string, index: number) => ({
          name: `附件 ${index + 1}`,
          url: url.startsWith('http') ? url : `${window.location.origin}${url}`,
          uploadDate: data.createdAt || '-'
        }))
      } else {
        certificates.value = []
      }
    }
  } catch (error) {
    console.error('获取费用详情失败:', error)
    ElMessage.error('获取费用详情失败')
  } finally {
    loading.value = false
  }
}

// 加载费用列表
const loadFeeList = async () => {
  loading.value = true
  try {
    const response = await feeApi.getExpenseList(queryParams.value)
    // 处理嵌套结构
    const result = response.data?.data || response.data || response
    
    if (result) {
      feeList.value = result.list || result.records || (Array.isArray(result) ? result : [])
      total.value = result.total || feeList.value.length
    }
  } catch (error) {
    console.error('获取费用列表失败:', error)
    ElMessage.error('获取费用列表失败')
  } finally {
    loading.value = false
  }
}

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

.image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.certificate-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.certificate-info {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}

.certificate-actions {
  text-align: right;
}

.certificate-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.certificate-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon--upload {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  text-align: center;
}
</style>