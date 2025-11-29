<template>
  <div class="payment-confirm">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Money /></el-icon>
          支付确认
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
      </div>
    </div>

    <!-- 搜索和统计区域 -->
    <el-card class="search-statistics-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Search /></el-icon>
            搜索和统计
          </span>
        </div>
      </template>

      <div class="search-statistics-content">
        <!-- 搜索表单 -->
        <div class="search-section">
          <el-form 
            :model="searchForm" 
            :inline="true" 
            @submit.prevent="handleSearch"
            class="search-form"
          >
            <el-form-item label="关键词">
              <el-input
                v-model="searchForm.keyword"
                placeholder="支付ID、费用标题、申请人"
                clearable
                class="search-input"
              />
            </el-form-item>
            <el-form-item label="支付状态">
              <el-select
                v-model="searchForm.status"
                placeholder="请选择状态"
                clearable
                class="status-select"
              >
                <el-option label="全部状态" value="" />
                <el-option label="待审核" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已支付" value="paid" />
                <el-option label="支付失败" value="failed" />
              </el-select>
            </el-form-item>
            <el-form-item label="费用类别">
              <el-select
                v-model="searchForm.category"
                placeholder="请选择类别"
                clearable
                class="category-select"
              >
                <el-option label="全部类别" value="" />
                <el-option label="住宿费" value="accommodation" />
                <el-option label="水电费" value="utilities" />
                <el-option label="维修费" value="maintenance" />
                <el-option label="清洁费" value="cleaning" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                class="date-range-picker"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                native-type="submit"
                :icon="Search"
              >
                搜索
              </el-button>
              <el-button @click="resetSearch">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 统计信息 -->
        <div class="statistics-section">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon income">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">待支付总额</div>
                    <div class="stat-value income">{{ formatCurrency(statistics.pendingAmount) }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon success">
                    <el-icon><Check /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">已支付总额</div>
                    <div class="stat-value success">{{ formatCurrency(statistics.paidAmount) }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon warning">
                    <el-icon><Warning /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">待审核数量</div>
                    <div class="stat-value warning">{{ statistics.pendingCount }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon info">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-label">总记录数</div>
                    <div class="stat-value info">{{ statistics.totalCount }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 待确认支付列表 -->
    <el-card class="pending-payments-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><List /></el-icon>
            待确认支付列表
          </span>
          <div class="card-actions">
            <el-button 
              type="primary" 
              :icon="Refresh" 
              @click="loadPendingPayments"
              :loading="loading"
            >
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="pendingPayments" 
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="支付ID" width="120" />
        <el-table-column prop="title" label="费用标题" min-width="150" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-cell">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="申请日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button 
                type="primary" 
                size="small" 
                text
                @click="viewPaymentDetail(row)"
                :icon="View"
              >
                查看详情
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                text
                @click="confirmPayment(row)"
                :icon="Check"
              >
                确认支付
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div v-if="selectedPayments.length > 0" class="batch-actions">
        <el-alert
          :title="`已选择 ${selectedPayments.length} 条支付记录`"
          type="info"
          :closable="false"
          class="selection-alert"
        >
          <template #default>
            <div class="batch-actions-content">
              <span>已选择 {{ selectedPayments.length }} 条支付记录</span>
              <div class="batch-buttons">
                <el-button 
                  type="success" 
                  size="small"
                  @click="batchConfirmPayment"
                  :loading="batchProcessing"
                >
                  <el-icon><Check /></el-icon>
                  批量确认支付
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="clearSelection"
                >
                  取消选择
                </el-button>
              </div>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 支付凭证查看对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`支付详情 - ${currentPayment?.title || ''}`"
      width="600px"
      @close="resetDetailForm"
    >
      <div v-if="currentPayment" class="payment-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="支付ID">
            {{ currentPayment.id }}
          </el-descriptions-item>
          <el-descriptions-item label="费用标题">
            {{ currentPayment.title }}
          </el-descriptions-item>
          <el-descriptions-item label="费用描述">
            {{ currentPayment.description }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ currentPayment.applicant }}
          </el-descriptions-item>
          <el-descriptions-item label="金额">
            <span class="amount-text">{{ formatCurrency(currentPayment.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="申请日期">
            {{ formatDate(currentPayment.date) }}
          </el-descriptions-item>
          <el-descriptions-item label="费用类别">
            <el-tag :type="getCategoryType(currentPayment.category)">
              {{ getCategoryText(currentPayment.category) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentPayment.status)">
              {{ getStatusText(currentPayment.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人" v-if="currentPayment.reviewer">
            {{ currentPayment.reviewer }}
          </el-descriptions-item>
          <el-descriptions-item label="审核日期" v-if="currentPayment.reviewDate">
            {{ formatDate(currentPayment.reviewDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核意见" v-if="currentPayment.reviewComment">
            {{ currentPayment.reviewComment }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 支付凭证 -->
        <div class="payment-voucher" v-if="currentPayment?.attachments?.length">
          <h4>支付凭证</h4>
          <div class="voucher-list">
            <div 
              v-for="(attachment, index) in currentPayment.attachments" 
              :key="index"
              class="voucher-item"
            >
              <el-image
                :src="attachment"
                :preview-src-list="currentPayment.attachments"
                :initial-index="index"
                fit="cover"
                class="voucher-image"
              />
              <div class="voucher-info">
                <div class="voucher-name">{{ getAttachmentName(attachment) }}</div>
                <div class="voucher-size">{{ formatFileSize(getAttachmentSize(attachment)) }}</div>
              </div>
              <div class="voucher-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="previewAttachment(attachment)"
                >
                  预览
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="downloadAttachment(attachment)"
                >
                  下载
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteAttachment(attachment, currentPayment)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
          <div class="voucher-upload">
            <el-button 
              type="primary" 
              @click="uploadAttachment(currentPayment)"
              :icon="Upload"
            >
              上传新附件
            </el-button>
          </div>
        </div>
        <div v-else class="no-attachments">
          <el-empty description="暂无支付凭证" />
          <el-button 
            type="primary" 
            @click="uploadAttachment(currentPayment)"
            :icon="Upload"
          >
            上传附件
          </el-button>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 确认支付对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="确认支付"
      width="500px"
      @close="resetConfirmForm"
    >
      <div v-if="currentPayment" class="confirm-payment">
        <el-alert
          title="请仔细核对支付信息，确认无误后再进行支付操作"
          type="warning"
          show-icon
          class="confirm-warning"
        />

        <el-descriptions :column="1" class="payment-summary">
          <el-descriptions-item label="费用标题">
            {{ currentPayment.title }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">
            {{ currentPayment.applicant }}
          </el-descriptions-item>
          <el-descriptions-item label="支付金额">
            <span class="amount-text">{{ formatCurrency(currentPayment.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="费用类别">
            {{ getCategoryText(currentPayment.category) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 安全验证 -->
        <div class="security-verification">
          <h4>安全验证</h4>
          <el-form 
            :model="confirmForm" 
            :rules="confirmRules" 
            ref="confirmFormRef"
            label-width="100px"
          >
            <el-form-item label="支付密码" prop="password">
              <el-input 
                v-model="confirmForm.password"
                type="password"
                placeholder="请输入6位支付密码"
                maxlength="6"
                show-password
              />
            </el-form-item>
            <el-form-item label="验证码" prop="captcha">
              <div class="captcha-field">
                <el-input 
                  v-model="confirmForm.captcha"
                  placeholder="请输入验证码"
                  maxlength="4"
                />
                <el-button 
                  type="primary" 
                  @click="generateCaptcha"
                  :disabled="captchaTimer > 0"
                >
                  {{ captchaTimer > 0 ? `${captchaTimer}s后重新获取` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="短信验证码" prop="smsCode">
              <div class="sms-field">
                <el-input 
                  v-model="confirmForm.smsCode"
                  placeholder="请输入短信验证码"
                  maxlength="6"
                />
                <el-button 
                  type="primary" 
                  @click="sendSmsCode"
                  :disabled="smsTimer > 0"
                >
                  {{ smsTimer > 0 ? `${smsTimer}s后重新获取` : '获取短信验证码' }}
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitPaymentConfirmation"
            :loading="confirmProcessing"
          >
            确认支付
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 异常支付处理对话框 -->
    <el-dialog
      v-model="exceptionDialogVisible"
      title="异常支付处理"
      width="500px"
      @close="resetExceptionForm"
    >
      <div v-if="currentPayment" class="exception-payment">
        <el-alert
          title="检测到支付过程中的异常情况，请选择处理方式"
          type="error"
          show-icon
          class="exception-warning"
        />

        <el-descriptions :column="1" class="payment-summary">
          <el-descriptions-item label="支付ID">
            {{ currentPayment.id }}
          </el-descriptions-item>
          <el-descriptions-item label="费用标题">
            {{ currentPayment.title }}
          </el-descriptions-item>
          <el-descriptions-item label="支付金额">
            <span class="amount-text">{{ formatCurrency(currentPayment.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="异常原因">
            <span class="error-text">{{ exceptionReason }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form 
          :model="exceptionForm" 
          :rules="exceptionRules" 
          ref="exceptionFormRef"
          label-width="100px"
        >
          <el-form-item label="处理方式" prop="action">
            <el-radio-group v-model="exceptionForm.action">
              <el-radio label="retry">重新尝试支付</el-radio>
              <el-radio label="cancel">取消支付</el-radio>
              <el-radio label="manual">手动处理</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item 
            label="备注说明" 
            prop="remark"
            v-if="exceptionForm.action === 'manual'"
          >
            <el-input 
              v-model="exceptionForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入手动处理的详细说明"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exceptionDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitExceptionHandling"
            :loading="exceptionProcessing"
          >
            提交处理
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 确认记录导出 -->
    <el-card class="export-records-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Download /></el-icon>
            确认记录导出
          </span>
        </div>
      </template>

      <div class="export-controls">
        <div class="export-filters">
          <el-date-picker
            v-model="exportDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-range-picker"
          />
          <el-select
            v-model="exportStatus"
            placeholder="支付状态"
            clearable
            class="status-filter"
          >
            <el-option label="全部状态" value="" />
            <el-option label="支付成功" value="success" />
            <el-option label="支付失败" value="failed" />
            <el-option label="处理中" value="processing" />
          </el-select>
        </div>
        <div class="export-buttons">
          <el-button 
            type="primary" 
            @click="exportRecords('excel')"
            :loading="exportProcessing"
          >
            <el-icon><Document /></el-icon>
            导出Excel
          </el-button>
          <el-button 
            type="success" 
            @click="exportRecords('csv')"
            :loading="exportProcessing"
          >
            <el-icon><Tickets /></el-icon>
            导出CSV
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { 
  ArrowLeft, Money, List, Refresh, View, Check, Document, Tickets, Upload,
  Search, TrendCharts, Warning
} from '@element-plus/icons-vue'
import { confirmPayment as apiConfirmPayment } from '@/services/paymentService'

// 类型定义
interface Payment {
  id: string
  title: string
  description: string
  amount: number
  category: string
  applicant: string
  date: string
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'failed'
  reviewer?: string
  reviewDate?: string
  reviewComment?: string
  attachments?: string[]
  createdAt: string
}

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const batchProcessing = ref(false)
const confirmProcessing = ref(false)
const exceptionProcessing = ref(false)
const exportProcessing = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  category: '',
  dateRange: [] as string[]
})

// 统计数据
const statistics = reactive({
  pendingAmount: 1256.50,
  paidAmount: 8560.30,
  pendingCount: 3,
  totalCount: 28
})

// 表单引用
const confirmFormRef = ref<FormInstance>()
const exceptionFormRef = ref<FormInstance>()

// 数据
const pendingPayments = ref<Payment[]>([])
const selectedPayments = ref<Payment[]>([])
const currentPayment = ref<Payment | null>(null)
const exceptionReason = ref('')

// 对话框控制
const detailDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const exceptionDialogVisible = ref(false)

// 导出相关
const exportDateRange = ref<[string, string]>(['', ''])
const exportStatus = ref('')

// 验证码计时器
const captchaTimer = ref(0)
const smsTimer = ref(0)
let captchaTimerInterval: number | null = null
let smsTimerInterval: number | null = null

// 确认表单
const confirmForm = reactive({
  password: '',
  captcha: '',
  smsCode: ''
})

// 异常处理表单
const exceptionForm = reactive({
  action: 'retry',
  remark: ''
})

// 表单验证规则
const confirmRules = reactive<FormRules>({
  password: [
    { required: true, message: '请输入支付密码', trigger: 'blur' },
    { min: 6, max: 6, message: '支付密码为6位数字', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码为4位字符', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { len: 6, message: '短信验证码为6位数字', trigger: 'blur' }
  ]
})

const exceptionRules = reactive<FormRules>({
  action: [
    { required: true, message: '请选择处理方式', trigger: 'change' }
  ],
  remark: [
    { required: true, message: '请输入备注说明', trigger: 'blur' }
  ]
})

// 生命周期
onMounted(() => {
  loadPendingPayments()
})

// 方法
const loadPendingPayments = () => {
  loading.value = true
  
  // 模拟API调用
  setTimeout(() => {
    pendingPayments.value = [
      {
        id: 'PAY20241201001',
        title: '宿舍水电费',
        description: '2024年12月份水电费缴纳',
        amount: 156.50,
        category: 'utilities',
        applicant: '张三',
        date: '2024-12-15',
        status: 'approved',
        reviewer: '李四',
        reviewDate: '2024-12-16',
        reviewComment: '费用合理，同意报销',
        attachments: [
          'https://picsum.photos/200/300?random=1',
          'https://picsum.photos/200/300?random=2'
        ],
        createdAt: '2024-12-15T10:30:00'
      },
      {
        id: 'PAY20241201002',
        title: '洗衣机维修费',
        description: '宿舍洗衣机故障维修',
        amount: 280.00,
        category: 'maintenance',
        applicant: '王五',
        date: '2024-12-10',
        status: 'approved',
        reviewer: '李四',
        reviewDate: '2024-12-11',
        reviewComment: '维修费用合理',
        attachments: [
          'https://picsum.photos/200/300?random=3'
        ],
        createdAt: '2024-12-10T14:20:00'
      },
      {
        id: 'PAY20241201003',
        title: '清洁用品采购',
        description: '购买拖把、垃圾袋等清洁用品',
        amount: 85.60,
        category: 'cleaning',
        applicant: '赵六',
        date: '2024-12-08',
        status: 'approved',
        reviewer: '张三',
        reviewDate: '2024-12-09',
        reviewComment: '清洁用品采购合理',
        attachments: [],
        createdAt: '2024-12-08T16:45:00'
      }
    ]
    loading.value = false
  }, 800)
}

const handleSearch = () => {
  loading.value = true
  // 模拟搜索
  setTimeout(() => {
    ElMessage.success('搜索完成')
    loading.value = false
  }, 500)
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.category = ''
  searchForm.dateRange = []
  handleSearch()
}

const handleSelectionChange = (selection: Payment[]) => {
  selectedPayments.value = [...selection]
}

const clearSelection = () => {
  selectedPayments.value = []
}

const viewPaymentDetail = (payment: Payment) => {
  currentPayment.value = payment
  detailDialogVisible.value = true
}

const confirmPayment = (payment: Payment) => {
  currentPayment.value = payment
  confirmDialogVisible.value = true
  generateCaptcha()
  sendSmsCode()
}

const batchConfirmPayment = async () => {
  if (selectedPayments.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要批量确认支付 ${selectedPayments.value.length} 条记录吗？`,
      '批量支付确认',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    batchProcessing.value = true
    
    // 模拟批量支付API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新支付状态
    selectedPayments.value.forEach(payment => {
      payment.status = 'paid'
    })
    
    // 清空选择
    clearSelection()
    ElMessage.success(`成功确认支付 ${selectedPayments.value.length} 条记录`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量支付失败，请重试')
    }
  } finally {
    batchProcessing.value = false
  }
}

const generateCaptcha = () => {
  // 生成4位随机验证码
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let captcha = ''
  for (let i = 0; i < 4; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // 启动倒计时
  captchaTimer.value = 60
  if (captchaTimerInterval) {
    clearInterval(captchaTimerInterval)
  }
  captchaTimerInterval = window.setInterval(() => {
    captchaTimer.value--
    if (captchaTimer.value <= 0 && captchaTimerInterval) {
      clearInterval(captchaTimerInterval)
      captchaTimerInterval = null
    }
  }, 1000) as unknown as number
  
  ElMessage.success(`验证码已发送：${captcha}`)
}

const sendSmsCode = () => {
  // 模拟发送短信验证码
  const smsCode = Math.floor(100000 + Math.random() * 900000).toString() // 6位数字
  
  // 启动倒计时
  smsTimer.value = 120
  if (smsTimerInterval) {
    clearInterval(smsTimerInterval)
  }
  smsTimerInterval = window.setInterval(() => {
    smsTimer.value--
    if (smsTimer.value <= 0 && smsTimerInterval) {
      clearInterval(smsTimerInterval)
      smsTimerInterval = null
    }
  }, 1000) as unknown as number
  
  ElMessage.success(`短信验证码已发送至您的手机：${smsCode}`)
}

const submitPaymentConfirmation = async () => {
  if (!confirmFormRef.value || !currentPayment.value) return
  
  await confirmFormRef.value.validate(async (valid) => {
    if (valid) {
      confirmProcessing.value = true
      
      try {
        // 调用支付确认API
        const result = await apiConfirmPayment(currentPayment.value!.id, {
          amount: currentPayment.value!.amount,
          password: confirmForm.password,
          captcha: confirmForm.captcha,
          smsCode: confirmForm.smsCode
        })
        
        if (result.success) {
          ElMessage.success('支付确认成功')
          currentPayment.value!.status = 'paid'
          confirmDialogVisible.value = false
          resetConfirmForm()
        } else {
          // 处理支付异常
          exceptionReason.value = result.data?.error || '支付失败'
          exceptionDialogVisible.value = true
          confirmDialogVisible.value = false
        }
      } catch (error) {
        // 处理网络或其他异常
        exceptionReason.value = '网络连接异常或服务器错误'
        exceptionDialogVisible.value = true
        confirmDialogVisible.value = false
        ElMessage.error('支付确认失败')
      } finally {
        confirmProcessing.value = false
      }
    }
  })
}

const submitExceptionHandling = async () => {
  if (!exceptionFormRef.value || !currentPayment.value) return
  
  await exceptionFormRef.value.validate(async (valid) => {
    if (valid) {
      exceptionProcessing.value = true
      
      try {
        // 根据处理方式执行不同操作
        switch (exceptionForm.action) {
          case 'retry':
            // 重新打开确认对话框
            exceptionDialogVisible.value = false
            confirmDialogVisible.value = true
            ElMessage.info('请重新确认支付信息')
            break
          case 'cancel':
            // 取消支付
            currentPayment.value!.status = 'failed'
            exceptionDialogVisible.value = false
            ElMessage.success('支付已取消')
            break
          case 'manual':
            // 手动处理
            exceptionDialogVisible.value = false
            ElMessage.success('已提交手动处理请求')
            break
        }
        
        resetExceptionForm()
      } catch (error) {
        ElMessage.error('异常处理失败')
      } finally {
        exceptionProcessing.value = false
      }
    }
  })
}

const exportRecords = async (format: 'excel' | 'csv') => {
  try {
    exportProcessing.value = true
    
    // 准备导出数据
    const exportData = pendingPayments.value.map(payment => ({
      '支付ID': payment.id,
      '费用标题': payment.title,
      '费用描述': payment.description,
      '费用金额': payment.amount,
      '费用类别': getCategoryText(payment.category),
      '申请人': payment.applicant,
      '申请日期': formatDate(payment.date),
      '状态': getStatusText(payment.status),
      '审核人': payment.reviewer || '-',
      '审核日期': payment.reviewDate ? formatDate(payment.reviewDate) : '-',
      '审核意见': payment.reviewComment || '-',
      '创建时间': formatDate(payment.createdAt)
    }))
    
    if (exportData.length === 0) {
      ElMessage.warning('没有数据可以导出')
      return
    }
    
    if (format === 'excel') {
      // 导出为Excel格式
      ElMessage.info('正在生成Excel文件...')
      
      // 这里应该调用实际的Excel导出服务
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 创建简单的CSV格式作为Excel替代（实际项目中应使用xlsx库）
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // 处理包含逗号或引号的值
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          }).join(',')
        )
      ].join('\n')
      
      // 添加BOM标记解决Excel中文乱码问题
      const csvWithBom = '\uFEFF' + csvContent
      
      // 创建并下载文件
      const blob = new Blob([csvWithBom], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `支付确认记录_${new Date().toISOString().split('T')[0]}.xlsx`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success(`成功导出 ${exportData.length} 条支付确认记录 (Excel格式)`)
      } else {
        ElMessage.error('您的浏览器不支持文件下载')
      }
    } else {
      // 导出为CSV格式
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // 处理包含逗号或引号的值
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          }).join(',')
        )
      ].join('\n')
      
      // 添加BOM标记解决Excel中文乱码问题
      const csvWithBom = '\uFEFF' + csvContent
      
      // 创建并下载文件
      const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `支付确认记录_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success(`成功导出 ${exportData.length} 条支付确认记录 (CSV格式)`)
      } else {
        ElMessage.error('您的浏览器不支持文件下载')
      }
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exportProcessing.value = false
  }
}

const previewAttachment = (attachment: string) => {
  // 创建一个新的预览对话框来显示附件
  const previewDialog = document.createElement('div')
  previewDialog.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;">
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3>附件预览</h3>
          <button onclick="this.closest('div').parentElement.remove()" style="background: #f56c6c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
        </div>
        <img src="${attachment}" style="max-width: 100%; max-height: 70vh;" />
        <div style="margin-top: 15px; text-align: center;">
          <button onclick="(() => {
            const link = document.createElement('a');
            link.href = '${attachment}';
            link.download = '${attachment.split('/').pop() || 'attachment'}';
            link.click();
            this.closest('div').parentElement.remove();
          })()" style="background: #409eff; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">下载</button>
          <button onclick="this.closest('div').parentElement.remove()" style="background: #909399; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">关闭</button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(previewDialog)
}

const downloadAttachment = (attachment: string) => {
  // 创建下载链接
  const link = document.createElement('a')
  link.href = attachment
  link.download = attachment.split('/').pop() || 'attachment'
  link.click()
  ElMessage.success('附件下载已开始')
}

// 添加新的附件管理功能
const deleteAttachment = (attachment: string, payment: Payment) => {
  ElMessageBox.confirm(
    '确定要删除这个附件吗？此操作不可恢复。',
    '删除附件',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 从支付记录中移除附件
    if (payment.attachments) {
      const index = payment.attachments.indexOf(attachment)
      if (index > -1) {
        payment.attachments.splice(index, 1)
        ElMessage.success('附件删除成功')
      }
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const uploadAttachment = (payment: Payment) => {
  // 模拟文件上传
  ElMessage.info('打开文件上传对话框...')
  // 实际项目中应该打开文件选择器并上传文件
}

const resetDetailForm = () => {
  currentPayment.value = null
}

const resetConfirmForm = () => {
  confirmForm.password = ''
  confirmForm.captcha = ''
  confirmForm.smsCode = ''
  currentPayment.value = null
  
  // 清除验证码计时器
  if (captchaTimerInterval) {
    clearInterval(captchaTimerInterval)
    captchaTimerInterval = null
  }
  captchaTimer.value = 0
  
  if (smsTimerInterval) {
    clearInterval(smsTimerInterval)
    smsTimerInterval = null
  }
  smsTimer.value = 0
}

const resetExceptionForm = () => {
  exceptionForm.action = 'retry'
  exceptionForm.remark = ''
  currentPayment.value = null
  exceptionReason.value = ''
}

const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'primary'
    case 'paid': return 'success'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'paid': return '已支付'
    case 'failed': return '支付失败'
    default: return '未知'
  }
}

const getCategoryType = (category: string) => {
  switch (category) {
    case 'accommodation': return ''
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'other': return 'danger'
    default: return 'info'
  }
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'accommodation': return '住宿费'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    case 'other': return '其他'
    default: return '未知'
  }
}

const getAttachmentName = (url: string): string => {
  return url.split('/').pop() || '附件'
}

const getAttachmentSize = (url: string): number => {
  // 模拟获取文件大小
  return Math.floor(Math.random() * 1024) + 1024
}

const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }
}

</script>

<style scoped>
.payment-confirm {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

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

.search-statistics-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.search-statistics-content {
  padding: 20px 0;
}

.search-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: end;
}

.search-input,
.status-select,
.category-select,
.date-range-picker {
  width: 200px;
}

.statistics-section {
  margin-top: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.income {
  background-color: #f0f9eb;
  color: #67c23a;
}

.stat-icon.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.stat-icon.warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.stat-icon.info {
  background-color: #f4f4f5;
  color: #909399;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat-value.income,
.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.info {
  color: #909399;
}

.pending-payments-card,
.export-records-card {
  margin-bottom: 24px;
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

.card-actions {
  display: flex;
  gap: 8px;
}

.amount-cell {
  font-weight: 600;
  color: #f56c6c;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.batch-actions {
  margin-top: 16px;
}

.batch-actions-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.payment-detail {
  padding: 20px 0;
}

.amount-text {
  font-weight: 700;
  color: #f56c6c;
  font-size: 16px;
}

.payment-voucher {
  margin-top: 24px;
}

.payment-voucher h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.voucher-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.voucher-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voucher-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

.voucher-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.voucher-name {
  font-size: 14px;
  color: #303133;
}

.voucher-size {
  font-size: 12px;
  color: #909399;
}

.voucher-actions {
  display: flex;
  gap: 8px;
}

.voucher-upload {
  margin-top: 16px;
}

.confirm-payment,
.exception-payment {
  padding: 20px 0;
}

.confirm-warning,
.exception-warning {
  margin-bottom: 24px;
}

.payment-summary {
  margin-bottom: 24px;
}

.security-verification h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.captcha-field,
.sms-field {
  display: flex;
  gap: 12px;
  align-items: center;
}

.error-text {
  color: #f56c6c;
  font-weight: 500;
}

.export-records-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.export-records-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-records-card .card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.export-filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.date-range-picker,
.status-filter {
  width: 220px;
}

.export-buttons {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .status-select,
  .category-select,
  .date-range-picker {
    width: 100%;
  }
  
  .el-col {
    margin-bottom: 15px;
  }
  
  .export-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .export-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range-picker,
  .status-filter {
    width: 100%;
  }
  
  .export-buttons {
    justify-content: center;
  }
  
  .batch-actions-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .batch-buttons {
    justify-content: center;
  }
}
</style>