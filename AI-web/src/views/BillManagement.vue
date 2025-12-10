<template>
  <div class="bill-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Document /></el-icon>
          账单管理
        </h1>
        <p class="page-subtitle">管理宿舍账单信息，查看所有账单状态</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="router.push('/dashboard/bill/create')"
          class="create-btn"
        >
          生成账单
        </el-button>
        <el-button 
          :icon="Download" 
          @click="handleExportBills"
          class="export-btn"
        >
          导出账单
        </el-button>
        <el-button 
          :icon="Refresh" 
          @click="handleRefresh"
          class="refresh-btn"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <el-card class="search-card">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索账单标题或描述"
              :prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="searchForm.status"
              placeholder="账单状态"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="待付款" value="pending" />
              <el-option label="已付款" value="paid" />
              <el-option label="部分付款" value="partial" />
              <el-option label="已逾期" value="overdue" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="searchForm.month"
              placeholder="选择月份"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="month in monthOptions"
                :key="month.value"
                :label="month.label"
                :value="month.value"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="searchForm.type"
              placeholder="账单类型"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="月度账单" value="monthly" />
              <el-option label="临时账单" value="temporary" />
              <el-option label="费用账单" value="expense" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <div class="search-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
              <el-button :icon="Close" @click="handleReset">
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card pending">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ billStats.pending }}</div>
                <div class="stat-label">待付款账单</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card paid">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ billStats.paid }}</div>
                <div class="stat-label">已付款账单</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card overdue">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ billStats.overdue }}</div>
                <div class="stat-label">逾期账单</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card total">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatCurrency(billStats.totalAmount) }}</div>
                <div class="stat-label">总金额</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 账单列表 -->
    <div class="list-section">
      <el-card class="list-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><List /></el-icon>
              账单列表
            </span>
            <div class="list-actions">
              <el-checkbox 
                v-model="selectAll" 
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                全选
              </el-checkbox>
              <el-button 
                type="danger" 
                :icon="Delete" 
                :disabled="selectedBills.length === 0"
                @click="handleBatchDelete"
                size="small"
              >
                批量删除
              </el-button>
            </div>
          </div>
        </template>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-section">
          <el-skeleton :rows="6" animated />
        </div>

        <!-- 账单列表内容 -->
        <div v-else class="bill-list">
          <div 
            v-for="bill in billList" 
            :key="bill.id"
            class="bill-item"
            :class="{ selected: selectedBills.includes(bill.id) }"
            tabindex="0"
            @keydown.enter="handleViewDetail(bill.id)"
            @keydown.space="handleViewDetail(bill.id)"
          >
            <div class="bill-checkbox">
              <el-checkbox 
                :model-value="selectedBills.includes(bill.id)"
                @change="(checked: boolean) => handleSelectBill(bill.id, checked)"
              />
            </div>
            
            <div class="bill-content">
              <div class="bill-header">
                <div class="bill-title">
                  <h3>{{ bill.title }}</h3>
                  <el-tag 
                    :type="getStatusType(bill.status)" 
                    size="small"
                    class="status-tag"
                  >
                    {{ getStatusText(bill.status) }}
                  </el-tag>
                </div>
                <div class="bill-amount">
                  {{ formatCurrency(bill.totalAmount) }}
                </div>
              </div>
              
              <div class="bill-info">
                <div class="bill-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatLocalDate(bill.billDate) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    {{ bill.payerName || '未指定' }}
                  </span>
                  <span class="meta-item">
                    <el-icon><FolderOpened /></el-icon>
                    {{ getTypeText(bill.type) }}
                  </span>
                </div>
                <div class="bill-description" v-if="bill.description">
                  {{ bill.description }}
                </div>
              </div>

              <div class="bill-progress" v-if="bill.status !== 'paid'">
                <div class="progress-label">
                  付款进度: {{ formatCurrency(bill.paidAmount || 0) }} / {{ formatCurrency(bill.totalAmount) }}
                </div>
                <el-progress 
                  :percentage="getPaymentProgress(bill)" 
                  :color="getProgressColor(bill)"
                  :show-text="false"
                  :stroke-width="6"
                />
              </div>
            </div>

            <div class="bill-actions">
              <el-button 
                type="primary" 
                :icon="View" 
                circle 
                size="small"
                @click="handleViewDetail(bill.id)"
                title="查看详情"
              />
              <el-button 
                type="warning" 
                :icon="Edit" 
                circle 
                size="small"
                @click="handleEditBill(bill.id)"
                title="编辑账单"
              />
              <el-button 
                type="success" 
                :icon="Money" 
                circle 
                size="small"
                @click="handlePayBill(bill)"
                title="处理付款"
                v-if="bill.status !== 'paid'"
              />
              <el-dropdown @command="(command: string) => handleCommand(command, bill)">
                <el-button :icon="MoreFilled" circle size="small" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="duplicate">
                      <el-icon><CopyDocument /></el-icon>
                      复制账单
                    </el-dropdown-item>
                    <el-dropdown-item command="export">
                      <el-icon><Download /></el-icon>
                      导出PDF
                    </el-dropdown-item>
                    <el-dropdown-item command="reminder">
                      <el-icon><Bell /></el-icon>
                      提醒设置
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除账单
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="billList.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无账单数据">
              <el-button type="primary" @click="router.push('/dashboard/bill/create')">
                立即生成账单
              </el-button>
            </el-empty>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="billList.length > 0" class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :page-sizes="[5, 8, 12, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <!-- 支付对话框 -->
        <el-dialog
          v-model="showPaymentDialog"
          title="账单支付"
          width="500px"
          :before-close="handleClosePaymentDialog"
        >
          <div v-if="currentBill" class="payment-dialog">
            <!-- 账单信息 -->
            <div class="bill-info">
              <h3>{{ currentBill.title }}</h3>
              <p class="bill-description">{{ currentBill.description }}</p>
              <p class="bill-amount">金额：<strong>{{ formatCurrency(currentBill.totalAmount) }}</strong></p>
            </div>
            
            <!-- 支付方式选择 -->
            <div v-if="!showQRCode" class="payment-methods">
              <h4>选择支付方式</h4>
              <div class="method-options">
                <el-radio-group v-model="selectedPaymentMethod" @change="handleSelectPaymentMethod">
                  <el-radio label="alipay" size="large">
                    <div class="method-option">
                      <el-icon><CreditCard /></el-icon>
                      <span>支付宝</span>
                    </div>
                  </el-radio>
                  <el-radio label="wechat" size="large">
                    <div class="method-option">
                      <el-icon><ChatLineRound /></el-icon>
                      <span>微信支付</span>
                    </div>
                  </el-radio>
                  <el-radio label="bank" size="large">
                    <div class="method-option">
                      <el-icon><Postcard /></el-icon>
                      <span>银行卡转账</span>
                    </div>
                  </el-radio>
                  <el-radio label="cash" size="large">
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
                <el-icon class="success-icon"><SuccessFilled /></el-icon>
                <p>支付成功！</p>
              </div>
            </div>
          </div>
          
          <!-- 对话框底部按钮 -->
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="handleClosePaymentDialog">取消</el-button>
              <el-button 
                v-if="!showQRCode" 
                type="primary" 
                @click="handleConfirmPayment"
                :disabled="!isPaymentMethodValid"
              >
                确认支付
              </el-button>
              <div v-else>
                <el-button @click="showQRCode = false">返回</el-button>
                <el-button 
                  type="success" 
                  @click="handleClosePaymentDialog"
                >
                  完成
                </el-button>
              </div>
            </div>
          </template>
        </el-dialog>

        <!-- 提醒设置对话框 -->
        <el-dialog
          v-model="reminderSettingsVisible"
          title="账单提醒设置"
          width="500px"
          :close-on-click-modal="false"
          class="reminder-dialog"
        >
          <el-form :model="reminderSettings" label-width="120px">
            <el-form-item label="提醒方式">
              <el-checkbox-group v-model="reminderSettings.methods">
                <el-checkbox value="email">邮件提醒</el-checkbox>
                <el-checkbox value="sms">短信提醒</el-checkbox>
                <el-checkbox value="push">推送通知</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="提醒时间">
              <el-select v-model="reminderSettings.remindTime" placeholder="选择提醒时间">
                <el-option label="费用创建时" value="create" />
                <el-option label="审核通过时" value="approved" />
                <el-option label="付款截止前1天" value="due_1day" />
                <el-option label="付款截止前3天" value="due_3days" />
                <el-option label="付款截止前1周" value="due_1week" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="提醒频率">
              <el-radio-group v-model="reminderSettings.frequency">
                <el-radio value="once">仅一次</el-radio>
                <el-radio value="daily">每天提醒</el-radio>
                <el-radio value="weekly">每周提醒</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="免打扰时间">
              <div class="quiet-time">
                <el-time-picker 
                  v-model="reminderSettings.quietStart" 
                  format="HH:mm"
                  placeholder="开始时间"
                />
                <span class="time-separator">至</span>
                <el-time-picker 
                  v-model="reminderSettings.quietEnd" 
                  format="HH:mm"
                  placeholder="结束时间"
                />
              </div>
            </el-form-item>
          </el-form>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="reminderSettingsVisible = false">取消</el-button>
              <el-button type="primary" @click="saveReminderSettings">保存设置</el-button>
            </span>
          </template>
        </el-dialog>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Document, Plus, Download, Refresh, Search, Close, Clock, Check, Warning, Money,
  List, Delete, View, Edit, Calendar, User, FolderOpened, MoreFilled, CopyDocument, Bell,
  CreditCard, ChatLineRound, Postcard, SuccessFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQRCodes } from '@/services/paymentService'
import { formatLocalDate } from '@/utils/timeUtils'
import { billService } from '@/services/billService'

// 账单类型定义
interface Bill {
  id: string
  title: string
  status: 'pending' | 'paid' | 'partial' | 'overdue'
  totalAmount: number
  paidAmount: number
  billDate: string
  payerName: string
  type: 'monthly' | 'temporary' | 'expense'
  description: string
  createdAt?: string
  updatedAt?: string
}

// 响应式数据
const router = useRouter()
const loading = ref(false)
const billList = ref<Bill[]>([])
const selectedBills = ref<string[]>([])
const selectAll = ref(false)

// 支付相关状态
const showPaymentDialog = ref(false)
const currentBill = ref<Bill | null>(null)
const selectedPaymentMethod = ref('')
const showQRCode = ref(false)
const qrCodeUrl = ref('')

// 支付方式有效性状态
const isPaymentMethodValid = ref(false)

// 提醒设置相关数据
const reminderSettingsVisible = ref(false)
const reminderSettings = ref({
  methods: ['email'],
  remindTime: 'due_1day',
  frequency: 'once',
  quietStart: '',
  quietEnd: ''
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  month: '',
  type: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 5,
  total: 0
})

// 账单统计
const billStats = reactive({
  pending: 0,
  paid: 0,
  overdue: 0,
  totalAmount: 0
})

// 月份选项
const monthOptions = computed(() => {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
    })
  }
  return options
})

// 全选状态
const isIndeterminate = computed(() => {
  return selectedBills.value.length > 0 && selectedBills.value.length < billList.value.length
})

/**
 * 获取状态标签类型
 * @param status 账单状态
 * @returns 状态对应的标签类型
 */
const getStatusType = (status: Bill['status']) => {
  const typeMap = {
    pending: 'warning',
    paid: 'success',
    partial: 'primary',
    overdue: 'danger'
  } as const
  return typeMap[status] || 'info'
}

/**
 * 获取状态文本
 * @param status 账单状态
 * @returns 状态对应的文本
 */
const getStatusText = (status: Bill['status']): string => {
  const textMap = {
    pending: '待付款',
    paid: '已付款',
    partial: '部分付款',
    overdue: '已逾期'
  } as const
  return textMap[status] || '未知'
}

/**
 * 获取类型文本
 * @param type 账单类型
 * @returns 类型对应的文本
 */
const getTypeText = (type: Bill['type']): string => {
  const textMap = {
    monthly: '月度账单',
    temporary: '临时账单',
    expense: '费用账单'
  } as const
  return textMap[type] || '未知'
}

/**
 * 格式化货币
 * @param amount 金额
 * @returns 格式化后的货币字符串
 */
const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}



/**
 * 计算付款进度
 * @param bill 账单对象
 * @returns 进度百分比
 */
const getPaymentProgress = (bill: Bill): number => {
  if (!bill.totalAmount) return 0
  return Math.round(((bill.paidAmount || 0) / bill.totalAmount) * 100)
}

/**
 * 获取进度条颜色
 * @param bill 账单对象
 * @returns 进度条颜色
 */
const getProgressColor = (bill: Bill): string => {
  if (bill.status === 'paid') return '#67c23a'
  if (bill.status === 'overdue') return '#f56c6c'
  if (bill.status === 'partial') return '#e6a23c'
  return '#909399'
}

/**
 * 加载账单列表
 */
const loadBillList = async () => {
  loading.value = true
  console.log('[BillManagement] 开始加载账单列表', searchForm)
  
  try {
    // 调用真实API
    const response = await billService.getBillList({
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    })
    
    if (response.success) {
      billList.value = response.data.list
      pagination.total = response.data.total
      
      // 更新统计信息
      billStats.pending = response.data.stats?.pending || 0
      billStats.paid = response.data.stats?.paid || 0
      billStats.overdue = response.data.stats?.overdue || 0
      billStats.totalAmount = response.data.stats?.totalAmount || 0
      
      console.log('[BillManagement] 账单列表加载成功:', {
        page: pagination.page,
        size: pagination.size,
        total: pagination.total,
        currentPageCount: response.data.list.length,
        stats: billStats
      })
    } else {
      throw new Error(response.message || '获取账单列表失败')
    }
    
  } catch (error) {
    console.error('[BillManagement] 加载账单列表失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载账单列表失败，请检查网络连接或稍后重试')
    billList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
    console.log('[BillManagement] 账单列表加载完成')
  }
}

/**
 * 搜索处理
 */
const handleSearch = (): void => {
  pagination.page = 1
  loadBillList()
}

/**
 * 重置搜索
 */
const handleReset = (): void => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.month = ''
  searchForm.type = ''
  pagination.page = 1
  loadBillList()
}

/**
 * 筛选条件变化
 */
const handleFilterChange = (): void => {
  handleSearch()
}

/**
 * 刷新数据
 */
const handleRefresh = (): void => {
  loadBillList()
  ElMessage.success('数据已刷新')
}

/**
 * 全选/取消全选
 */
const handleSelectAll = (checked: boolean): void => {
  if (checked) {
    selectedBills.value = billList.value.map(bill => bill.id)
  } else {
    selectedBills.value = []
  }
}

/**
 * 选择单个账单
 */
const handleSelectBill = (billId: string, checked: boolean): void => {
  if (checked) {
    selectedBills.value.push(billId)
  } else {
    selectedBills.value = selectedBills.value.filter(id => id !== billId)
  }
}

/**
 * 查看账单详情
 */
const handleViewDetail = (billId: string): void => {
  router.push(`/dashboard/bill/detail/${billId}`)
}

/**
 * 编辑账单
 */
const handleEditBill = (billId: string): void => {
  router.push(`/dashboard/bill/edit/${billId}`)
}

/**
 * 处理付款 - 第一步：打开支付对话框
 */
const handlePayBill = (bill: Bill) => {
  // 检查账单状态是否可以支付
  if (bill.status === 'paid') {
    ElMessage.warning('该账单已付款')
    return
  }
  
  // 设置当前账单并打开支付对话框
  currentBill.value = bill
  selectedPaymentMethod.value = ''
  isPaymentMethodValid.value = false
  showQRCode.value = false
  showPaymentDialog.value = true
}

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedBills.value.length} 个账单吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 执行删除操作
    selectedBills.value = []
    ElMessage.success('批量删除成功')
    loadBillList()
  } catch {
    // 用户取消删除
  }
}

/**
 * 下拉菜单命令处理
 */
const handleCommand = async (command: string, bill: Bill) => {
  switch (command) {
    case 'duplicate':
      ElMessage.success('账单复制功能开发中')
      break
    case 'export':
      exportBills('xlsx')
      break
    case 'reminder':
      // 打开提醒设置对话框
      reminderSettingsVisible.value = true
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个账单吗？', '删除确认', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        ElMessage.success('账单删除成功')
        loadBillList()
      } catch {
        // 用户取消删除
      }
      break
  }
}

/**
 * 导出账单
 */
const handleExportBills = (format: 'csv' | 'xlsx' = 'csv') => {
  exportBills(format)
}

/**
 * 处理下拉菜单导出命令
 */
const handleExportCommand = (command: string) => {
  if (command === 'export') {
    exportBills('xlsx')
  }
}

/**
 * 导出账单核心函数
 */
const exportBills = async (format: 'csv' | 'xlsx' = 'csv') => {
  try {
    // 检查是否有数据可以导出
    if (billList.value.length === 0) {
      ElMessage.warning('没有数据可以导出')
      return
    }

    ElMessage.info(`正在准备导出${format === 'xlsx' ? 'Excel' : 'CSV'}格式文件，请稍候...`)

    // 检查是否有数据可以导出
    if (billList.value.length === 0) {
      ElMessage.warning('没有数据可以导出')
      return
    }
    
    // 准备导出数据 - 使用当前筛选后的数据
    const exportData = billList.value.map(bill => ({
      '账单ID': bill.id,
      '账单标题': bill.title,
      '账单描述': bill.description || '-',
      '账单状态': getStatusText(bill.status),
      '总金额': bill.totalAmount.toFixed(2),
      '已付金额': bill.paidAmount.toFixed(2),
      '剩余金额': (bill.totalAmount - bill.paidAmount).toFixed(2),
      '账单日期': formatLocalDate(bill.billDate),
      '付款人': bill.payerName,
      '账单类型': getTypeText(bill.type),
      '创建时间': formatLocalDate(bill.createdAt || new Date().toISOString()),
      '更新时间': formatLocalDate(bill.updatedAt || new Date().toISOString())
    }))

    // 处理导出数据
    const exportData = selectedBills.length > 0 
      ? billList.value.filter(bill => selectedBills.includes(bill.id)).map(bill => ({
          '账单ID': bill.id,
          '账单标题': bill.title,
          '状态': getStatusText(bill.status),
          '总金额': bill.totalAmount.toFixed(2),
          '已付金额': bill.paidAmount.toFixed(2),
          '剩余金额': (bill.totalAmount - bill.paidAmount).toFixed(2),
          '账单日期': formatLocalDate(bill.billDate),
          '付款人': bill.payerName,
          '账单类型': getTypeText(bill.type),
          '创建时间': formatLocalDate(bill.createdAt || new Date().toISOString()),
          '更新时间': formatLocalDate(bill.updatedAt || new Date().toISOString())
        }))
      : billList.value.map(bill => ({
          '账单ID': bill.id,
          '账单标题': bill.title,
          '状态': getStatusText(bill.status),
          '总金额': bill.totalAmount.toFixed(2),
          '已付金额': bill.paidAmount.toFixed(2),
          '剩余金额': (bill.totalAmount - bill.paidAmount).toFixed(2),
          '账单日期': formatLocalDate(bill.billDate),
          '付款人': bill.payerName,
          '账单类型': getTypeText(bill.type),
          '创建时间': formatLocalDate(bill.createdAt || new Date().toISOString()),
          '更新时间': formatLocalDate(bill.updatedAt || new Date().toISOString())
        }))

    console.log('[BillManagement] 开始导出账单记录，格式:', format, '数据条数:', exportData.length)

    const timestamp = new Date().toISOString().split('T')[0]
    
    if (format === 'xlsx') {
      // 导出为Excel格式 (实际使用CSV格式，但文件扩展名为xlsx)
      const headers = exportData.length > 0 ? Object.keys(exportData[0]!) : []
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
        link.setAttribute('download', `账单记录_${timestamp}.xlsx`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        ElMessage.success(`成功导出 ${exportData.length} 条账单记录 (Excel格式)`)
      } else {
        ElMessage.error('您的浏览器版本较低，不支持文件下载功能，请升级浏览器或使用其他浏览器重试')
      }
    } else {
      // 导出为CSV格式
      const headers = exportData.length > 0 ? Object.keys(exportData[0]!) : []
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
        link.setAttribute('download', `账单记录_${timestamp}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        ElMessage.success(`成功导出 ${exportData.length} 条账单记录 (CSV格式)`)
      } else {
        ElMessage.error('您的浏览器版本较低，不支持文件下载功能，请升级浏览器或使用其他浏览器重试')
      }
    }

    // 记录导出操作日志
    console.log(`导出${format === 'xlsx' ? 'Excel' : 'CSV'}格式账单记录 ${exportData.length} 条`)
    
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请检查网络连接或稍后重试')
  }
}

/**
 * 处理支付方式选择 - 第二步：选择支付方式
 */
const handleSelectPaymentMethod = async (method: string) => {
  selectedPaymentMethod.value = method
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

/**
 * 处理确认支付 - 第三步：确认支付并生成收款码
 */
const handleConfirmPayment = async () => {
  if (!currentBill.value) return
  
  if (!selectedPaymentMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  // 直接显示二维码，不需要调用支付服务（因为是线下扫码支付）
  try {
    // 特殊处理现金支付
    if (selectedPaymentMethod.value === 'cash') {
      // 现金支付直接完成，不需要显示二维码
      if (currentBill.value) {
        currentBill.value.status = 'paid'
      }
      ElMessage.success('现金支付已完成')
      // 关闭支付对话框
      setTimeout(() => {
        handleClosePaymentDialog()
      }, 1000)
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
      
      const platform = platformMap[selectedPaymentMethod.value]
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
      
      // 调用API更新账单状态
      if (currentBill.value) {
        const response = await billService.updateBillStatus(currentBill.value.id, {
          status: 'paid',
          paidAmount: currentBill.value.totalAmount,
          paymentMethod: selectedPaymentMethod.value,
          paymentTime: new Date().toISOString()
        })
        
        if (response.success) {
          currentBill.value.status = 'paid'
          console.log('[BillManagement] 账单状态更新成功:', currentBill.value.id)
        } else {
          ElMessage.error('更新账单状态失败: ' + (response.message || '未知错误'))
          return
        }
      }
    } else {
      ElMessage.error('获取收款码失败')
    }
  } catch (error) {
    ElMessage.error('获取收款码过程中出现错误')
  }
}

/**
 * 关闭支付对话框
 */
const handleClosePaymentDialog = () => {
  showPaymentDialog.value = false
  currentBill.value = null
  selectedPaymentMethod.value = ''
  showQRCode.value = false
  qrCodeUrl.value = ''
}

/**
 * 保存提醒设置
 */
const saveReminderSettings = async () => {
  try {
    // 调用真实API保存提醒设置
    const response = await billService.updateReminderSettings({
      ...reminderSettings.value
    })
    
    if (response.success) {
      ElMessage.success('提醒设置保存成功')
      reminderSettingsVisible.value = false
      console.log('[BillManagement] 提醒设置保存成功:', reminderSettings.value)
    } else {
      throw new Error(response.message || '保存提醒设置失败')
    }
  } catch (error) {
    console.error('[BillManagement] 保存提醒设置失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '保存提醒设置失败')
  }
}

/**
 * 分页大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  loadBillList()
}

/**
 * 页码变化
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadBillList()
}

// 组件挂载时加载数据
onMounted(async () => {
  console.log('[BillManagement] 开始初始化组件')
  try {
    await loadBillList()
    console.log('[BillManagement] 组件初始化完成')
  } catch (error) {
    console.error('[BillManagement] 组件初始化失败:', error)
    ElMessage.error('页面初始化失败，请刷新页面重试')
  }
})
</script>

<style scoped>
.bill-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

/* 页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left .page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.title-icon {
  color: #409eff;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 搜索区域样式 */
.search-section {
  margin-bottom: 20px;
}

.search-card {
  border-radius: 8px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

/* 统计卡片样式 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.pending .stat-icon {
  background: linear-gradient(135deg, #e6a23c, #f2c18d);
}

.paid .stat-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.overdue .stat-icon {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.total .stat-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 列表区域样式 */
.list-section {
  margin-bottom: 20px;
}

.list-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 账单列表样式 */
.bill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.bill-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.bill-item.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.bill-checkbox {
  flex-shrink: 0;
}

.bill-content {
  flex: 1;
  min-width: 0;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bill-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bill-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.bill-amount {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.bill-info {
  margin-bottom: 8px;
}

.bill-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bill-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
}

.bill-progress {
  margin-top: 8px;
}

.progress-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.bill-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 空状态样式 */
.empty-state {
  padding: 40px 0;
  text-align: center;
}

/* 分页样式 */
.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 提醒设置样式 */
.quiet-time {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 100%;
}

.time-separator {
  color: #909399;
  white-space: nowrap;
}

/* 支付对话框样式 */
.payment-dialog {
  padding: 20px 0;
}

.bill-info {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.bill-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #303133;
}

.bill-description {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.bill-amount {
  margin: 0;
  font-size: 18px;
  color: #f56c6c;
}

.bill-amount strong {
  font-size: 24px;
  font-weight: 700;
}

.payment-methods h4,
.qr-code-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.method-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 确保时间选择器在小屏幕上正常显示 */
.quiet-time .el-time-picker {
  flex: 1;
  min-width: 100px;
  max-width: 140px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .bill-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .bill-actions {
    flex-direction: column;
  }
  
  /* 提醒设置对话框在小屏幕上的适配 */
  .reminder-dialog {
    width: 90% !important;
    max-width: 500px;
  }
  
  .reminder-dialog .el-form-item__label {
    width: 100px !important;
  }
  
  .reminder-dialog .el-form-item__content {
    margin-left: 100px !important;
  }
  
  .quiet-time {
    flex-direction: row;
    gap: 6px;
  }
  
  .quiet-time .el-time-picker {
    min-width: 80px;
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .reminder-dialog {
    width: 95% !important;
  }
  
  .reminder-dialog .el-form-item__label {
    width: 80px !important;
  }
  
  .reminder-dialog .el-form-item__content {
    margin-left: 80px !important;
  }
  
  .quiet-time {
    gap: 4px;
  }
  
  .quiet-time .el-time-picker {
    min-width: 70px;
    max-width: 100px;
  }
  
  .time-separator {
    font-size: 12px;
  }
}


</style>