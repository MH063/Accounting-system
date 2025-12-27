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
          @click="router.back()"
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
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="支付ID" width="100" />
        <el-table-column prop="title" label="费用标题" min-width="120" />
        <el-table-column prop="applicant" label="申请人" width="90" />
        <el-table-column prop="amount" label="金额" width="100" align="right">
          <template #default="{ row }">
            <span class="amount-cell">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="申请日期" width="110">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
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
                :preview-teleported="true"
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
              :loading="uploading"
            >
              {{ uploading ? '上传中...' : '上传新附件' }}
            </el-button>
            <el-progress 
              v-if="uploading" 
              :percentage="uploadProgress" 
              :show-text="true" 
              style="margin-top: 10px; width: 200px;"
            />
          </div>
        </div>
        <div v-else class="no-attachments">
          <el-empty description="暂无支付凭证" />
          <el-button 
            type="primary" 
            @click="uploadAttachment(currentPayment)"
            :icon="Upload"
            :loading="uploading"
          >
            {{ uploading ? '上传中...' : '上传附件' }}
          </el-button>
          <el-progress 
            v-if="uploading" 
            :percentage="uploadProgress" 
            :show-text="true" 
            style="margin-top: 10px; width: 200px;"
          />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 支付对话框 -->
    <el-dialog
      v-model="paymentDialogVisible"
      title="费用支付"
      width="500px"
      @close="resetPaymentForm"
    >
      <div v-if="currentPayment" class="payment-dialog">
        <!-- 费用信息 -->
        <div class="expense-info">
          <h3>{{ currentPayment.title }}</h3>
          <p class="expense-description">代为支付其他成员的费用</p>
          <p class="expense-amount">金额：<strong>¥{{ (paymentForm.amount || 0).toFixed(2) }}</strong></p>
        </div>
        
        <!-- 支付方式选择 -->
        <div v-if="!showQRCode" class="payment-methods">
          <h4>选择支付方式</h4>
          <div class="method-options">
            <el-radio-group v-model="paymentForm.method" @change="handlePaymentMethodChange">
              <el-radio label="alipay" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><CreditCard /></el-icon>
                  <span>支付宝</span>
                </div>
              </el-radio>
              <el-radio label="wechat" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>微信支付</span>
                </div>
              </el-radio>
              <el-radio label="bank" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><Postcard /></el-icon>
                  <span>银行卡转账</span>
                </div>
              </el-radio>
              <el-radio label="cash" size="large" tabindex="0" @keydown.enter="$event.target.click()" @keydown.space="$event.target.click()">
                <div class="method-option">
                  <el-icon><Money /></el-icon>
                  <span>现金支付</span>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        
        <!-- 收款码展示 -->
        <div v-if="showQRCode" class="qr-code-section">
          <h4>请扫描下方二维码完成支付</h4>
          <div class="qr-code-container">
            <img :src="qrCodeUrl" alt="收款码" class="qr-code-image" />
            <p class="qr-code-tip">扫描二维码完成支付</p>
          </div>
          <div class="payment-status">
            <el-icon class="success-icon"><Check /></el-icon>
            <p>支付成功！</p>
          </div>
        </div>
      </div>
      
      <!-- 对话框底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <div v-if="!showQRCode">
            <el-button @click="paymentDialogVisible = false">取消</el-button>
            <el-button 
              type="primary" 
              @click="confirmPaymentSubmit"
              :disabled="!isPaymentMethodValid"
              :loading="processing"
            >
              确认支付
            </el-button>
          </div>
          <div v-else>
            <el-button @click="paymentDialogVisible = false">取消</el-button>
            <el-button @click="showQRCode = false">返回</el-button>
            <el-button 
              type="success" 
              @click="paymentDialogVisible = false"
            >
              完成
            </el-button>
          </div>
        </div>
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { 
  ArrowLeft, Money, List, Refresh, View, Check, Document, Tickets, Upload,
  Search, TrendCharts, Warning, CreditCard, ChatLineRound, Postcard, Download
} from '@element-plus/icons-vue'
import { confirmPayment as apiConfirmPayment, getQRCodes, getConfirmStatistics } from '@/services/paymentService'
import { request } from '@/utils/request'

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
const paymentDialogVisible = ref(false)
const processing = ref(false)
const isPaymentMethodValid = ref(false)
const exportProcessing = ref(false)
const showQRCode = ref(false)
const qrCodeUrl = ref('')
const uploadProgress = ref(0)
const uploading = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  category: '',
  dateRange: [] as string[]
})

// 统计数据
const statistics = reactive({
  pendingAmount: 0,
  paidAmount: 0,
  pendingCount: 0,
  totalCount: 0
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    console.log('加载统计数据')
    
    const params: Record<string, string> = {}
    
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }
    if (searchForm.category) {
      params.category = searchForm.category
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await getConfirmStatistics(params)
    
    if (response.success && response.data) {
      console.log('统计数据加载成功:', response.data)
      statistics.pendingAmount = response.data.pendingAmount || 0
      statistics.paidAmount = response.data.paidAmount || 0
      statistics.pendingCount = response.data.pendingCount || 0
      statistics.totalCount = response.data.totalCount || 0
    } else {
      console.warn('统计数据接口返回失败:', response.message)
    }
  } catch (error: any) {
    console.error('加载统计数据失败:', error)
  }
}

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
// 支付表单
interface PaymentForm {
  amount: number
  method: string
  remark: string
}

const paymentForm = reactive<PaymentForm>({
  amount: 0,
  method: '',
  remark: ''
})

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
  loadStatistics()
})

// 方法
const loadPendingPayments = async () => {
  loading.value = true
  
  try {
    console.log('获取待确认支付列表')
    
    // 调用真实API获取待确认支付列表
    const response = await request('/payments/pending-confirmation', {
      method: 'GET'
    })
    
    if (response.success && response.data) {
      pendingPayments.value = response.data.records || []
      console.log(`获取到 ${pendingPayments.value.length} 条待确认支付记录`)
    } else {
      console.warn('获取待确认支付列表失败:', response.message)
      pendingPayments.value = []
    }
  } catch (error) {
    console.error('获取待确认支付列表失败:', error)
    ElMessage.error('获取待确认支付列表失败，请稍后重试')
    pendingPayments.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loading.value = true
  // 调用真实API搜索
  loadPendingPayments()
  // 重新加载统计数据
  loadStatistics()
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
  // 使用与Payment.vue相同的支付流程
  paymentDialogVisible.value = true
  // 重置支付表单
  Object.assign(paymentForm, {
    amount: payment.amount,
    method: '',
    remark: ''
  })
  isPaymentMethodValid.value = false
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
    
    // 调用真实API进行批量支付确认
    const paymentIds = selectedPayments.value.map(payment => payment.id)
    const response = await request('/payments/batch-confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIds })
    })
    
    if (response.success) {
      // 更新支付状态
      selectedPayments.value.forEach(payment => {
        payment.status = 'paid'
      })
    }
    
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

const generateCaptcha = async () => {
  try {
    console.log('请求发送验证码')
    
    // 调用真实API发送验证码
    const response = await request('/auth/send-captcha', {
      method: 'POST'
    })
    
    if (response.success) {
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
      
      ElMessage.success('验证码已发送，请查收')
    } else {
      ElMessage.error(response.message || '发送验证码失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码失败，请稍后重试')
  }
}

const sendSmsCode = async () => {
  try {
    console.log('请求发送短信验证码')
    
    // 调用真实API发送短信验证码
    const response = await request('/auth/send-sms-code', {
      method: 'POST'
    })
    
    if (response.success) {
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
      
      ElMessage.success('短信验证码已发送至您的手机，请查收')
    } else {
      ElMessage.error(response.message || '发送短信验证码失败')
    }
  } catch (error) {
    console.error('发送短信验证码失败:', error)
    ElMessage.error('发送短信验证码失败，请稍后重试')
  }
}

// 处理支付方式选择
const handlePaymentMethodChange = async (method: string) => {
  paymentForm.method = method
  isPaymentMethodValid.value = false
  
  // 现金支付不需要检查收款码
  if (method === 'cash') {
    isPaymentMethodValid.value = true
    return
  }
  
  // 获取最新的收款码数据
  try {
    const qrResponse = await getQRCodes()
    if (qrResponse.success && qrResponse.data) {
      // 根据支付方式检查收款码状态
      const platformMap: Record<string, string> = {
        'alipay': 'alipay',
        'wechat': 'wechat',
        'bank': 'unionpay'
      }
      
      const platform = platformMap[method]
      
      // 查找启用的收款码
      const activeQRCode = qrResponse.data.find(qr => 
        qr.platform === platform && qr.status === 'active' && qr.isUserUploaded
      )
      
      // 如果找到了启用的收款码，不显示任何提示
      if (activeQRCode) {
        // 不需要提示，收款码正常
        isPaymentMethodValid.value = true
        return
      }
      
      // 查找禁用的收款码
      const disabledQRCode = qrResponse.data.find(qr => 
        qr.platform === platform && qr.status === 'inactive' && qr.isUserUploaded
      )
      
      // 如果找到了禁用的收款码，提示用户
      if (disabledQRCode) {
        ElMessage.warning(`该支付方式的收款码已被停用或禁用，请联系管理员`)
        return
      }
      
      // 如果完全没有找到对应平台的收款码
      ElMessage.warning(`未找到对应的收款码，请联系管理员`)
    }
  } catch (error) {
    console.error('获取收款码信息失败:', error)
  }
}

const confirmPaymentSubmit = async () => {
  if (!paymentForm.method) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  try {
    processing.value = true
    
    // 特殊处理现金支付
    if (paymentForm.method === 'cash') {
      // 现金支付直接完成，不需要显示二维码
      ElMessage.success('现金支付已完成')
      paymentDialogVisible.value = false
      resetPaymentForm()
      // 更新支付状态
      if (currentPayment.value) {
        currentPayment.value.status = 'paid'
      }
      return
    }
    
    // 获取对应的收款码
    const qrResponse = await getQRCodes()
    if (qrResponse.success && qrResponse.data) {
      // 根据支付方式筛选收款码
      const platformMap: Record<string, string> = {
        'alipay': 'alipay',
        'wechat': 'wechat',
        'bank': 'unionpay'
      }
      
      const platform = platformMap[paymentForm.method]
      // 首先查找启用的收款码
      let matchingQRCode = qrResponse.data.find(qr => 
        qr.platform === platform && qr.status === 'active' && qr.isUserUploaded
      )
      
      // 如果找到了启用的收款码，直接使用
      if (matchingQRCode && matchingQRCode.qrCodeUrl) {
        qrCodeUrl.value = matchingQRCode.qrCodeUrl
        showQRCode.value = true
      } 
      // 如果没有找到启用的收款码，则查找禁用的收款码
      else {
        const disabledQRCode = qrResponse.data.find(qr => 
          qr.platform === platform && qr.status === 'inactive' && qr.isUserUploaded
        )
        
        // 如果找到了禁用的收款码，提示用户
        if (disabledQRCode) {
          ElMessage.warning(`该支付方式的收款码已被停用或禁用，请联系管理员`)
          // 不显示二维码，保持showQRCode为false
          return
        } 
        // 如果完全没有找到对应平台的收款码
        else {
          ElMessage.warning(`未找到对应的收款码，请联系管理员`)
          // 不显示二维码，保持showQRCode为false
          return
        }
      }
    } else {
      ElMessage.error('获取收款码失败')
    }
  } catch (error) {
    console.error('获取收款码过程中出现错误:', error)
    ElMessage.error('获取收款码过程中出现错误')
  } finally {
    processing.value = false
  }
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
      const headers = exportData.length > 0 ? Object.keys(exportData[0] as Record<string, any>) : []
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
      const headers = exportData.length > 0 ? Object.keys(exportData[0] as Record<string, any>) : []
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
  // 直接使用Element Plus的图片预览功能
  // 由于已经在el-image中设置了preview-src-list，我们只需要触发对应索引的预览即可
  
  // 查找当前支付记录中该附件的索引
  if (currentPayment.value && currentPayment.value.attachments) {
    const index = currentPayment.value.attachments.indexOf(attachment)
    if (index !== -1) {
      // 触发Element Plus图片预览
      const imageElements = document.querySelectorAll('.voucher-image')
      if (imageElements[index]) {
        const previewBtn = imageElements[index].querySelector('.el-image__preview')
        if (previewBtn) {
          (previewBtn as HTMLElement).click()
        } else {
          // 如果没有预览按钮，尝试直接点击图片
          const imgEl = imageElements[index].querySelector('img')
          if (imgEl) {
            (imgEl as HTMLElement).click()
          }
        }
      }
    }
  }
}

const downloadAttachment = (attachment: string) => {
  // 严格遵守规范：下载照片后仅在新浏览器窗口中打开查看，禁止在原窗口跳转或打开
  try {
    // 仅在新窗口中打开图片查看，确保原窗口不跳转
    const newWindow = window.open(attachment, '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      ElMessage.success('已在新窗口打开图片');
      
      // 可选：如果需要下载功能，使用fetch+blob方式避免原窗口跳转
      fetch(attachment)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.split('/').pop() || 'attachment';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch(() => {
          // 下载失败不影响预览
        });
    } else {
      ElMessage.warning('浏览器阻止了新窗口打开，请检查弹窗权限设置');
    }
  } catch (error) {
    console.error('打开新窗口失败:', error);
    ElMessage.error('操作失败，请稍后重试');
  }
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

const uploadAttachment = (payment?: Payment) => {
  if (!payment) {
    ElMessage.warning('未选择支付记录')
    return
  }
  
  // 创建文件输入元素
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*,.pdf,.doc,.docx' // 允许常见文件类型
  fileInput.multiple = true // 允许多选
  fileInput.style.display = 'none'
  
  fileInput.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      try {
        uploading.value = true
        uploadProgress.value = 0
        
        // 验证文件大小（限制每个文件不超过5MB）
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file && file.size > 5 * 1024 * 1024) {
            ElMessage.error(`文件 ${file.name} 超过5MB限制`)
            uploading.value = false
            return
          }
        }
        
        ElMessage.info(`正在上传 ${files.length} 个附件...`)
        
        console.log(`开始上传 ${files.length} 个附件...`)
        
        // 真实文件上传API调用
        const formData = new FormData()
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file) {
            formData.append('files', file)
          }
        }
        
        // 模拟上传进度
        // 使用固定进度增长，实际应用中应通过API获取真实进度
        const interval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += 15
          } else {
            clearInterval(interval)
          }
        }, 300)
        
        // 调用真实API上传文件
        const response = await request('/payments/upload-attachments', {
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        clearInterval(interval)
        
        if (response.success && response.data) {
          uploadProgress.value = 100
          
          // 添加上传后的真实URL
          if (!payment.attachments) {
            payment.attachments = []
          }
          
          // 添加返回的文件URL
          if (Array.isArray(response.data.urls)) {
            response.data.urls.forEach(url => {
              payment.attachments!.push(url)
            })
          }
          
          setTimeout(() => {
            uploading.value = false
            uploadProgress.value = 0
            ElMessage.success(`${files.length} 个附件上传成功`)
          }, 500)
        } else {
          throw new Error(response.message || '文件上传失败')
        }
      } catch (error) {
        uploading.value = false
        uploadProgress.value = 0
        console.error('上传失败:', error)
        ElMessage.error('上传失败，请稍后重试')
      }
    }
  }
  
  document.body.appendChild(fileInput)
  fileInput.click()
  document.body.removeChild(fileInput)
}

const resetDetailForm = () => {
  currentPayment.value = null
  // 确保关闭所有可能的预览层
  setTimeout(() => {
    const previewWrappers = document.querySelectorAll('.el-image-viewer__wrapper')
    previewWrappers.forEach(wrapper => {
      wrapper.remove()
    })
    
    // 移除可能存在的遮罩层
    const overlays = document.querySelectorAll('.el-overlay')
    overlays.forEach(overlay => {
      if (overlay.parentElement && overlay.parentElement.tagName === 'BODY') {
        overlay.remove()
      }
    })
  }, 100)
}

const resetPaymentForm = () => {
  Object.assign(paymentForm, {
    amount: 0,
    method: '',
    remark: ''
  })
  showQRCode.value = false
  qrCodeUrl.value = ''
  currentPayment.value = null
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

const formatDate = (dateString: string | number | undefined | null): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN')
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
    case 'accommodation': return 'info'
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

const getAttachmentName = (attachment: string): string => {
  // 从URL中提取文件名
  const urlParts = attachment.split('/')
  const fileName = urlParts[urlParts.length - 1]
  return fileName || '附件'
}

const getAttachmentSize = async (url: string): Promise<number> => {
  try {
    console.log(`获取文件大小: ${url}`)
    
    // 调用真实API获取文件大小
    const response = await request('/payments/file-size', {
      method: 'POST',
      data: { url }
    })
    
    if (response.success && response.data && response.data.size) {
      return response.data.size
    } else {
      // 如果API调用失败，返回默认值
      console.warn('获取文件大小失败，返回默认值')
      return 1024
    }
  } catch (error) {
    console.error('获取文件大小失败:', error)
    return 1024 // 返回默认值
  }
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

.el-table {
  font-size: 14px;
}

.el-table th {
  font-weight: 600;
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
  justify-content: center;
  align-items: center;
  height: 100%;
}

.table-actions .el-button {
  padding: 6px 10px;
  font-size: 12px;
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
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.no-attachments {
  text-align: center;
  padding: 20px;
}

.no-attachments .el-progress {
  margin: 10px auto 0;
  width: 200px;
}

.confirm-payment,
.exception-payment,
.payment-dialog {
  padding: 20px 0;
}

.confirm-warning,
.exception-warning {
  margin-bottom: 24px;
}

.payment-summary {
  margin-bottom: 24px;
}

.security-verification h4,
.payment-methods h4,
.qr-code-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.captcha-field,
.sms-field,
.method-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-text {
  color: #f56c6c;
  font-weight: 500;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #303133;
}

.method-option .el-icon {
  font-size: 20px;
}

.payment-methods h4,
.qr-code-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.qr-code-container {
  text-align: center;
  margin: 24px 0;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  display: block;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}

.qr-code-tip {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.payment-status {
  text-align: center;
  margin-top: 24px;
}

.payment-status .success-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 16px;
}

.payment-status p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.expense-info {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.expense-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
}

.expense-description {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.expense-amount {
  margin: 0;
  font-size: 18px;
  color: #f56c6c;
}

.expense-amount strong {
  font-size: 24px;
  font-weight: 700;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #303133;
}

.method-option .el-icon {
  font-size: 20px;
}

.payment-methods h4,
.qr-code-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.qr-code-container {
  text-align: center;
  margin: 24px 0;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  display: block;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}

.qr-code-tip {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.payment-status {
  text-align: center;
  margin-top: 24px;
}

.payment-status .success-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 16px;
}

.payment-status p {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.expense-info {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.expense-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
}

.expense-description {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.expense-amount {
  margin: 0;
  font-size: 18px;
  color: #f56c6c;
}

.expense-amount strong {
  font-size: 24px;
  font-weight: 700;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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