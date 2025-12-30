<template>
  <div class="expense-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Wallet /></el-icon>
          费用管理
        </h1>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="router.push('/expense/create')"
          class="create-btn"
        >
          新建费用
        </el-button>
        <el-button 
          type="warning" 
          :icon="DocumentChecked" 
          @click="router.push('/expense/review')"
          class="review-btn"
        >
          费用审核
        </el-button>
      </div>
    </div>

    <!-- 费用统计摘要 -->
    <div class="summary-section">
      <div class="summary-grid">
        <div class="summary-item total">
          <div class="summary-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ formatCurrency(totalExpense) }}</div>
            <div class="summary-text">总费用</div>
          </div>
        </div>
        <div class="summary-item pending">
          <div class="summary-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ pendingCount }}</div>
            <div class="summary-text">待审核</div>
          </div>
        </div>
        <div class="summary-item approved">
          <div class="summary-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ approvedCount }}</div>
            <div class="summary-text">已通过</div>
          </div>
        </div>
        <div class="summary-item monthly">
          <div class="summary-icon">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-number">{{ formatCurrency(monthlyExpense) }}</div>
            <div class="summary-text">本月费用</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="operations-section">
      <!-- 批量操作栏 -->
      <div v-if="selectedItems.length > 0" class="batch-actions-bar">
        <el-alert
          :title="`已选择 ${selectedItems.length} 条记录`"
          type="info"
          :closable="false"
          class="selection-alert"
        >
          <template #default>
            <span>已选择 {{ selectedItems.length }} 条记录</span>
          </template>
        </el-alert>
        <div class="batch-buttons">
          <el-button 
            type="primary" 
            size="small"
            @click="handleBatchApprove"
            :loading="batchProcessing"
            :disabled="selectedItems.some(item => item.status !== 'pending')"
          >
            <el-icon><CircleCheck /></el-icon>
            批量审核通过 ({{ selectedItems.filter(item => item.status === 'pending').length }})
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            @click="handleBatchReject"
            :loading="batchProcessing"
            :disabled="selectedItems.some(item => item.status !== 'pending')"
          >
            <el-icon><Close /></el-icon>
            批量拒绝 ({{ selectedItems.filter(item => item.status === 'pending').length }})
          </el-button>
          <el-button 
            type="warning" 
            size="small"
            @click="handleBatchDelete"
            :loading="batchProcessing"
          >
            <el-icon><Delete /></el-icon>
            批量删除
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
      
      <div class="operations-row">
        <!-- 快速筛选按钮组 -->
        <div class="quick-filters">
          <el-button-group>
            <el-button 
              size="small"
              :type="quickFilter === '' ? 'primary' : 'default'"
              @click="quickFilter = ''; resetFilters()"
            >
              全部
            </el-button>
            <el-button 
              size="small"
              :type="quickFilter === 'pending' ? 'primary' : 'default'"
              @click="quickFilter = 'pending'; statusFilter = 'pending'; resetPagination()"
            >
              待审核
            </el-button>
            <el-button 
              size="small"
              :type="quickFilter === 'approved' ? 'primary' : 'default'"
              @click="quickFilter = 'approved'; statusFilter = 'approved'; resetPagination()"
            >
              已通过
            </el-button>
            <el-button 
              size="small"
              :type="quickFilter === 'rejected' ? 'primary' : 'default'"
              @click="quickFilter = 'rejected'; statusFilter = 'rejected'; resetPagination()"
            >
              已拒绝
            </el-button>
          </el-button-group>
        </div>

        <el-input
          v-model="searchQuery"
          placeholder="快速搜索费用..."
          :prefix-icon="Search"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        />
        
        <el-select
          v-model="statusFilter"
          placeholder="费用状态"
          clearable
        >
          <el-option label="全部状态" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>

        <el-select
          v-model="categoryFilter"
          placeholder="费用类别"
          clearable
        >
          <el-option label="全部分类" value="" />
          <el-option label="住宿费" value="accommodation" />
          <el-option label="水电费" value="utilities" />
          <el-option label="维修费" value="maintenance" />
          <el-option label="清洁费" value="cleaning" />
          <el-option label="其他" value="other" />
        </el-select>

        <el-select
          v-model="monthFilter"
          placeholder="费用月份"
          clearable
        >
          <el-option label="全部月份" value="" />
          <el-option 
            v-for="month in availableMonths" 
            :key="month.value" 
            :label="month.label" 
            :value="month.value" 
          />
        </el-select>

        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="resetFilters"
          class="reset-button"
        >
          重置
        </el-button>

        <!-- 更多操作 -->
        <el-dropdown trigger="click">
          <el-button 
            :icon="More"
            type="text"
            size="small"
            class="more-actions-btn"
          >
            更多
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleBatchApprove">
                <el-icon><CircleCheck /></el-icon>
                审核待处理项目
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleClearAll">
                <el-icon><Delete /></el-icon>
                清空所有记录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 费用列表 -->
    <div class="expense-list-section">
      <el-card class="list-card">
        <template #header>
          <div class="list-header">
            <span class="list-title">
              费用记录 ({{ filteredExpenses.length }})
            </span>
            <div class="list-actions">
              <el-button 
                type="text" 
                :icon="viewMode === 'table' ? Grid : List"
                @click="toggleViewMode(viewMode === 'table' ? 'card' : 'table')"
                class="view-mode-btn"
              >
                {{ viewMode === 'table' ? '卡片视图' : '表格视图' }}
              </el-button>
              <el-dropdown trigger="click" @command="handleExportCommand">
                <el-button 
                  type="text" 
                  :icon="Download"
                >
                  导出
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="csv">
                      <el-icon><Document /></el-icon>
                      CSV格式
                    </el-dropdown-item>
                    <el-dropdown-item command="xlsx">
                      <el-icon><Grid /></el-icon>
                      Excel格式
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="expense-table-container">
          <!-- 表格视图 -->
          <el-table
            :data="paginatedExpenses"
            style="width: 100%"
            class="expense-table"
            v-if="filteredExpenses.length > 0 && viewMode === 'table'"
          >
            <el-table-column prop="title" label="费用标题" min-width="150">
              <template #default="{ row }">
                <div class="title-cell">
                  <span class="expense-title">{{ row.title }}</span>
                  <el-tag 
                    :type="getCategoryType(row.category)" 
                    size="small"
                    class="category-tag"
                  >
                    {{ getCategoryText(row.category) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="amount" label="费用金额" width="100" align="right">
              <template #default="{ row }">
                <span class="amount-cell">{{ formatCurrency(row.amount) }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="applicant" label="申请人" width="100" />

            <el-table-column prop="date" label="费用日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tooltip 
                  :content="getStatusDescription(row.status)" 
                  placement="top"
                >
                  <el-tag 
                    :type="getStatusType(row.status)" 
                    size="small"
                    style="cursor: help;"
                  >
                    <el-icon 
                      :size="12" 
                      style="margin-right: 4px; vertical-align: text-top;"
                    >
                      <component :is="getStatusIcon(row.status)" />
                    </el-icon>
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </el-tooltip>
              </template>
            </el-table-column>

            <el-table-column prop="reviewer" label="审核人" width="100" />

            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    text
                    @click.stop="handleView(row)"
                    :icon="View"
                  >
                    查看
                  </el-button>
                  <el-button 
                    v-if="row.status === 'pending'"
                    type="warning" 
                    size="small" 
                    text
                    @click.stop="handleReview(row)"
                    :icon="Edit"
                  >
                    审核
                  </el-button>
                  <el-button 
                    v-else-if="row.status === 'approved'"
                    type="success" 
                    size="small" 
                    text
                    @click.stop="handlePayExpense(row)"
                    :icon="Money"
                  >
                    支付
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    text
                    @click.stop="handleDelete(row)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 卡片视图 -->
          <div 
            v-if="filteredExpenses.length > 0 && viewMode === 'card'"
            class="card-view-container"
          >
            <el-pullrefresh 
              v-model="refreshing" 
              @refresh="handleRefresh"
              class="pullrefresh-wrapper"
            >
              <!-- 按月份分组展示 -->
              <div v-for="group in groupedExpenses" :key="group.month" class="month-group">
                <div class="month-header">
                  <h3 class="month-title">{{ group.label }}</h3>
                  <div class="month-summary">
                    <span class="expense-count">{{ group.expenses.length }} 项费用</span>
                    <span class="month-total">总计: {{ formatCurrency(group.totalAmount) }}</span>
                  </div>
                </div>
                <div class="card-grid">
                  <el-card 
                    v-for="expense in group.expenses" 
                    :key="expense.id"
                    class="expense-card"
                    shadow="hover"
                    tabindex="0"
                    @keydown.enter="handleView(expense)"
                    @keydown.space="handleView(expense)"
                  >
                    <div class="card-header">
                      <div class="card-title-section">
                        <h4 class="card-title">{{ expense.title }}</h4>
                        <el-tag 
                          :type="getCategoryType(expense.category)" 
                          size="small"
                          class="category-tag"
                        >
                          {{ getCategoryText(expense.category) }}
                        </el-tag>
                      </div>
                      <div class="card-amount">{{ formatCurrency(expense.amount) }}</div>
                    </div>
                    
                    <div class="card-content">
                      <p class="card-description">{{ expense.description }}</p>
                      
                      <div class="card-info">
                        <div class="info-item">
                          <el-icon><Calendar /></el-icon>
                          <span>{{ formatDate(expense.date) }}</span>
                        </div>
                        <div class="info-item">
                          <el-icon><User /></el-icon>
                          <span>{{ expense.applicant }}</span>
                        </div>
                      </div>
                      
                      <div class="card-status">
                        <el-tooltip 
                          :content="getStatusDescription(expense.status)" 
                          placement="top"
                        >
                          <el-tag 
                            :type="getStatusType(expense.status)" 
                            size="small"
                            style="cursor: help;"
                          >
                            <el-icon 
                              :size="12" 
                              style="margin-right: 4px; vertical-align: text-top;"
                            >
                              <component :is="getStatusIcon(expense.status)" />
                            </el-icon>
                            {{ getStatusText(expense.status) }}
                          </el-tag>
                        </el-tooltip>
                        <span v-if="expense.reviewer" class="reviewer-info">
                          审核人：{{ expense.reviewer }}
                        </span>
                        <span v-if="expense.reviewDate" class="review-date">
                          审核时间：{{ formatDate(expense.reviewDate) }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="card-actions" @click.stop>
                      <el-button 
                        type="primary" 
                        size="small" 
                        text
                        @click="handleView(expense)"
                        :icon="View"
                      >
                        查看
                      </el-button>
                      <el-button 
                        v-if="expense.status === 'pending'"
                        type="warning" 
                        size="small" 
                        text
                        @click="handleReview(expense)"
                        :icon="Edit"
                      >
                        审核
                      </el-button>
                      <el-button 
                        v-else-if="expense.status === 'approved'"
                        type="success" 
                        size="small" 
                        text
                        @click="handlePayExpense(expense)"
                        :icon="Money"
                      >
                        支付
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        text
                        @click="handleDelete(expense)"
                        :icon="Delete"
                      >
                        删除
                      </el-button>
                    </div>
                  </el-card>
                </div>
              </div>
              
              <!-- 加载更多按钮 -->
              <div class="load-more-section">
                <el-button 
                  v-if="!loadingMore"
                  type="primary" 
                  plain
                  @click="handleLoadMore"
                  class="load-more-btn"
                >
                  加载更多
                </el-button>
                <el-button 
                  v-else
                  type="primary" 
                  loading
                  disabled
                  class="load-more-btn"
                >
                  加载中...
                </el-button>
              </div>
            </el-pullrefresh>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredExpenses.length === 0 && !loading" class="empty-state">
            <el-icon class="empty-icon"><Wallet /></el-icon>
            <p class="empty-text">
              {{ searchQuery || statusFilter || categoryFilter || monthFilter 
                ? '没有找到符合条件的费用记录' 
                : '暂无费用记录，请先创建费用' }}
            </p>
            <el-button 
              v-if="!searchQuery && !statusFilter && !categoryFilter && !monthFilter"
              type="primary" 
              @click="router.push('/expense/create')"
            >
              创建费用
            </el-button>
          </div>
        </div>

        <!-- 分页 (仅在表格视图显示) -->
        <div v-if="filteredExpenses.length > pageSize && viewMode === 'table'" class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 8, 12, 20, 50]"
            :total="filteredExpenses.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
    <!-- 支付对话框 -->
    <el-dialog
      v-model="showPaymentDialog"
      title="费用支付"
      width="500px"
      :before-close="handleClosePaymentDialog"
    >
      <div v-if="currentExpense" class="payment-dialog">
        <!-- 费用信息 -->
        <div class="expense-info">
          <h3>{{ currentExpense.title }}</h3>
          <p class="expense-description">{{ currentExpense.description }}</p>
          <p class="expense-amount">金额：<strong>{{ formatCurrency(currentExpense.amount) }}</strong></p>
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
                  <el-icon><BankIcon /></el-icon>
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
            <img :src="qrCodeUrl" alt="收款码" class="qr-code-image" role="img" aria-label="支付收款码，请使用相应支付应用扫描此码完成支付" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Plus, Search, Refresh, Wallet, Clock, CircleCheck,
  Calendar, Money, DocumentChecked, Download, View, Edit, Delete, Grid, List, User, More,
  CreditCard, ChatLineRound, Money as BankIcon, SuccessFilled, Picture, Close, InfoFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { feeApi } from '@/api/fee'
// 暂时注释掉支付服务导入，后续需要创建对应的管理端支付服务
// import { confirmPayment, getQRCodes } from '@/services/paymentService'

// 类型定义
interface Expense {
  id: number
  title: string
  description: string
  amount: number
  category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other'
  applicant: string
  date: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  reviewer?: string
  reviewDate?: string
  reviewComment?: string
  attachments?: string[]
  createdAt: string
}

const router = useRouter()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const monthFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const selectedItems = ref<Expense[]>([])
const batchProcessing = ref(false)
const viewMode = ref('table')
const refreshing = ref(false)
const loadingMore = ref(false)
const quickFilter = ref('')

// 支付相关状态
const showPaymentDialog = ref(false)
const currentExpense = ref<Expense | null>(null)
const selectedPaymentMethod = ref('')
const showQRCode = ref(false)
const qrCodeUrl = ref('')

// 支付方式有效性状态
const isPaymentMethodValid = ref(false)

// 存储收款码数据用于实时检查
const qrCodesData = ref<any[]>([])

// 费用数据
const expenses = ref<Expense[]>([])

// 计算属性
const totalExpense = computed(() => {
  return expenses.value
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0)
})

const monthlyExpense = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  return expenses.value
    .filter(e => e.date.startsWith(currentMonth) && e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0)
})

const pendingCount = computed(() => {
  return expenses.value.filter(e => e.status === 'pending').length
})

const approvedCount = computed(() => {
  return expenses.value.filter(e => e.status === 'approved').length
})

const availableMonths = computed(() => {
  const months = [...new Set(expenses.value.map(e => e.date.slice(0, 7)))]
  return months.map(month => ({
    value: month,
    label: new Date(month + '-01').toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long' 
    })
  })).sort((a, b) => b.value.localeCompare(a.value))
})

const filteredExpenses = computed(() => {
  let filtered = expenses.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.applicant.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(e => e.status === statusFilter.value)
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(e => e.category === categoryFilter.value)
  }

  if (monthFilter.value) {
    filtered = filtered.filter(e => e.date.startsWith(monthFilter.value))
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const paginatedExpenses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredExpenses.value.slice(start, end)
})

// 按月份分组的费用
const groupedExpenses = computed(() => {
  const groups: Record<string, Expense[]> = {}
  
  filteredExpenses.value.forEach(expense => {
    const month = expense.date.slice(0, 7) // YYYY-MM
    if (!groups[month]) {
      groups[month] = []
    }
    groups[month].push(expense)
  })
  
  // 转换为数组并按月份倒序排列
  return Object.entries(groups)
    .map(([month, expenses]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long' 
      }),
      expenses: expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0)
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
})

// 方法
const formatCurrency = (amount: number | string): string => {
  // 处理可能不是数字的值
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  
  // 如果转换失败，返回默认值
  if (isNaN(num)) {
    return '¥0.00'
  }
  
  return `¥${num.toFixed(2)}`
}

// 处理支付 - 第一步：打开支付对话框
const handlePayExpense = (expense: Expense) => {
  // 检查费用状态是否可以支付
  if (expense.status !== 'approved') {
    ElMessage.warning('只有已通过审核的费用才能进行支付')
    return
  }
  
  // 设置当前费用并打开支付对话框
  currentExpense.value = expense
  selectedPaymentMethod.value = ''
  isPaymentMethodValid.value = false
  showQRCode.value = false
  showPaymentDialog.value = true
}

// 处理支付方式选择 - 第二步：选择支付方式
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
    // 暂时注释掉支付服务调用
    // const qrResponse = await getQRCodes()
    // if (qrResponse.success && qrResponse.data) {
    //   qrCodesData.value = qrResponse.data
    //   
    //   // 根据支付方式检查收款码状态
    //   const platformMap: Record<string, string> = {
    //     'alipay': 'alipay',
    //     'wechat': 'wechat',
    //     'bank': 'unionpay'
    //   }
    //   
    //   const platform = platformMap[method]
    //   
    //   // 查找启用的收款码
    //   const activeQRCode = qrResponse.data.find((qr: any) => 
    //     qr.platform === platform && qr.status === 'active' && qr.isUserUploaded
    //   )
    //   
    //   // 如果找到了启用的收款码，不显示任何提示
    //   if (activeQRCode) {
    //     // 不需要提示，收款码正常
    //     isPaymentMethodValid.value = true
    //     return
    //   }
    //   
    //   // 查找禁用的收款码
    //   const disabledQRCode = qrResponse.data.find((qr: any) => 
    //     qr.platform === platform && qr.status === 'inactive' && qr.isUserUploaded
    //   )
    //   
    //   // 如果找到了禁用的收款码，提示用户
    //   if (disabledQRCode) {
    //     ElMessage.warning(`该支付方式的收款码已被停用或禁用，请联系管理员`)
    //     return
    //   }
    //   
    //   // 如果完全没有找到对应平台的收款码
    //   ElMessage.warning(`未找到对应的收款码，请联系管理员`)
    // }
  } catch (error) {
    ElMessage.error('获取收款码信息失败，请检查网络连接或联系管理员')
    console.error('获取收款码信息失败:', error)
  }
}

// 处理确认支付 - 第三步：确认支付并生成收款码
const handleConfirmPayment = async () => {
  if (!currentExpense.value) return
  
  if (!selectedPaymentMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  // 直接显示二维码，不需要调用支付服务（因为是线下扫码支付）
  try {
    // 特殊处理现金支付
    if (selectedPaymentMethod.value === 'cash') {
      // 现金支付直接完成，不需要显示二维码
      currentExpense.value.status = 'paid'
      ElMessage.success('现金支付已完成')
      // 关闭支付对话框
      setTimeout(() => {
        handleClosePaymentDialog()
      }, 1000)
      return
    }
    
    // 获取对应的收款码
    // const qrResponse = await getQRCodes()
    // if (qrResponse.success && qrResponse.data) {
    //   // 根据支付方式筛选收款码
    //   const platformMap: Record<string, string> = {
    //     'alipay': 'alipay',
    //     'wechat': 'wechat',
    //     'bank': 'unionpay'
    //   }
    //   
    //   const platform = platformMap[selectedPaymentMethod.value]
    //   // 首先查找启用的收款码
    //   let matchingQRCode = qrResponse.data.find((qr: any) => 
    //     qr.platform === platform && qr.status === 'active' && qr.isUserUploaded
    //   )
    //   
    //   // 如果找到了启用的收款码，直接使用
    //   if (matchingQRCode && matchingQRCode.qrCodeUrl) {
    //     qrCodeUrl.value = matchingQRCode.qrCodeUrl
    //     showQRCode.value = true
    //   } 
    //   // 如果没有找到启用的收款码，则查找禁用的收款码
    //   else {
    //     const disabledQRCode = qrResponse.data.find((qr: any) => 
    //       qr.platform === platform && qr.status === 'inactive' && qr.isUserUploaded
    //     )
    //     
    //     // 如果找到了禁用的收款码，提示用户
    //     if (disabledQRCode) {
    //       ElMessage.warning(`该支付方式的收款码已被停用或禁用，请联系管理员`)
    //       // 不显示二维码，保持showQRCode为false
    //       return
    //     } 
    //     // 如果完全没有找到对应平台的收款码
    //     else {
    //       ElMessage.warning(`未找到对应的收款码，请联系管理员`)
    //       // 不显示二维码，保持showQRCode为false
    //       return
    //     }
    //   }
    //   
    //   // 更新费用状态为已支付（这里简化处理，实际应该调用API更新状态）
    //   currentExpense.value.status = 'paid'
    // } else {
    //   ElMessage.error('获取收款码失败')
    // }
  } catch (error) {
    ElMessage.error('获取收款码过程中出现错误，请稍后重试或联系技术支持')
  }
}

// 关闭支付对话框
const handleClosePaymentDialog = () => {
  showPaymentDialog.value = false
  currentExpense.value = null
  selectedPaymentMethod.value = ''
  showQRCode.value = false
  qrCodeUrl.value = ''
}

// 处理导出命令
const handleExportCommand = (command: 'csv' | 'xlsx') => {
  exportExpenses(command)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusType = (status: 'pending' | 'approved' | 'rejected' | string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: 'pending' | 'approved' | 'rejected' | string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '未知'
  }
}

const getStatusIcon = (status: 'pending' | 'approved' | 'rejected' | string) => {
  switch (status) {
    case 'pending': return Clock
    case 'approved': return CircleCheck
    case 'rejected': return Close
    default: return InfoFilled
  }
}

const getStatusDescription = (status: 'pending' | 'approved' | 'rejected' | string) => {
  switch (status) {
    case 'pending': return '等待审核'
    case 'approved': return '审核已通过'
    case 'rejected': return '审核被拒绝'
    default: return '未知状态'
  }
}

const getCategoryType = (category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other') => {
  switch (category) {
    case 'accommodation': return 'primary'
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'other': return ''
    default: return 'info'
  }
}

const getCategoryText = (category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other') => {
  switch (category) {
    case 'accommodation': return '住宿费'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    case 'other': return '其他'
    default: return '未知'
  }
}

// 处理查看
const handleView = (expense: Expense) => {
  router.push(`/expense/detail/${expense.id}`)
}

// 处理审核
const handleReview = (expense: Expense) => {
  router.push(`/expense/review/${expense.id}`)
}

// 处理删除
const handleDelete = async (expense: Expense) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用 "${expense.title}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除API
    // await expenseApi.deleteExpense(expense.id)
    
    // 从列表中移除
    const index = expenses.value.findIndex(e => e.id === expense.id)
    if (index !== -1) {
      expenses.value.splice(index, 1)
      ElMessage.success('费用删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除费用失败:', error)
      ElMessage.error('删除费用失败')
    }
  }
}

// 批量审核通过
const handleBatchApprove = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一项费用记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量审核通过选中的 ${selectedItems.value.length} 项费用吗？`,
      '批量审核通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用批量审核API
    // await expenseApi.batchApprove(selectedItems.value.map(item => item.id))
    
    // 更新本地状态
    selectedItems.value.forEach(item => {
      const expense = expenses.value.find(e => e.id === item.id)
      if (expense) {
        expense.status = 'approved'
      }
    })
    
    // 清空选择
    selectedItems.value = []
    
    ElMessage.success('批量审核通过成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核通过失败:', error)
      ElMessage.error('批量审核通过失败')
    }
  }
}

// 批量拒绝
const handleBatchReject = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一项费用记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量拒绝选中的 ${selectedItems.value.length} 项费用吗？`,
      '批量拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用批量拒绝API
    // await expenseApi.batchReject(selectedItems.value.map(item => item.id))
    
    // 更新本地状态
    selectedItems.value.forEach(item => {
      const expense = expenses.value.find(e => e.id === item.id)
      if (expense) {
        expense.status = 'rejected'
      }
    })
    
    // 清空选择
    selectedItems.value = []
    
    ElMessage.success('批量拒绝成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量拒绝失败:', error)
      ElMessage.error('批量拒绝失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一项费用记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${selectedItems.value.length} 项费用吗？此操作不可恢复！`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用批量删除API
    // await expenseApi.batchDelete(selectedItems.value.map(item => item.id))
    
    // 从列表中移除
    selectedItems.value.forEach(item => {
      const index = expenses.value.findIndex(e => e.id === item.id)
      if (index !== -1) {
        expenses.value.splice(index, 1)
      }
    })
    
    // 清空选择
    selectedItems.value = []
    
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 快速导出
// 清空所有记录
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有费用记录吗？此操作不可恢复！',
      '清空所有记录',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用清空API
    // await expenseApi.clearAll()
    
    // 清空本地列表
    expenses.value = []
    
    ElMessage.success('已清空所有费用记录')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空所有记录失败:', error)
      ElMessage.error('清空所有记录失败')
    }
  }
}

// 导出费用
const exportExpenses = async (format: 'csv' | 'xlsx') => {
  try {
    ElMessage.info(`正在导出${format === 'xlsx' ? 'Excel' : 'CSV'}文件...`)
    
    // 调用导出API
    // const response = await expenseApi.exportExpenses(format)
    
    // 创建下载链接
    // const blob = new Blob([response.data], { type: format === 'xlsx' ? 'application/vnd.ms-excel' : 'text/csv' })
    // const url = window.URL.createObjectURL(blob)
    // const link = document.createElement('a')
    // link.href = url
    // link.download = `费用数据_${new Date().getTime()}.${format === 'xlsx' ? 'xlsx' : 'csv'}`
    // link.click()
    
    // 清理URL对象
    // window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + ((error as any).message || '未知错误'))
  }
}

// 重置筛选器
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  monthFilter.value = ''
  currentPage.value = 1
}

// 重置分页
const resetPagination = () => {
  currentPage.value = 1
}

// 切换视图模式
const toggleViewMode = (mode: 'table' | 'card') => {
  viewMode.value = mode
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 处理大小改变
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

// 处理当前页改变
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 处理刷新
const handleRefresh = async () => {
  refreshing.value = true
  try {
    // 模拟刷新延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 实际应该重新加载数据
    // await loadExpenses()
    ElMessage.success('刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 加载更多
const handleLoadMore = async () => {
  loadingMore.value = true
  try {
    // 模拟加载更多延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 实际应该加载更多数据
    // const moreExpenses = await expenseApi.loadMore(pageSize.value, expenses.value.length)
    // expenses.value = [...expenses.value, ...moreExpenses]
    ElMessage.success('加载更多成功')
  } catch (error) {
    console.error('加载更多失败:', error)
    ElMessage.error('加载更多失败')
  } finally {
    loadingMore.value = false
  }
}

// 清除选择
const clearSelection = () => {
  selectedItems.value = []
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('💰 费用管理页面加载完成')
  // loadExpenses()
})
</script>

<style scoped>
.expense-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.summary-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
}

.summary-icon.el-icon {
  color: white;
}

.summary-content {
  flex: 1;
}

.summary-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.summary-text {
  color: #606266;
  font-size: 14px;
}

.operations-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.batch-actions-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.selection-alert {
  flex: 1;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.operations-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-input {
  width: 200px;
}

.reset-button {
  margin-left: auto;
}

.more-actions-btn {
  margin-left: 8px;
}

.expense-list-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-weight: 600;
  color: #303133;
}

.list-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.expense-table-container {
  min-height: 400px;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expense-title {
  font-weight: 500;
}

.category-tag {
  margin-left: auto;
}

.amount-cell {
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.card-view-container {
  padding: 20px 0;
}

.month-group {
  margin-bottom: 32px;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.month-title {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.month-summary {
  display: flex;
  gap: 16px;
  color: #606266;
  font-size: 14px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 0 20px;
}

.expense-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.expense-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
}

.card-title {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.card-amount {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-content {
  margin-bottom: 16px;
}

.card-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.card-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.card-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reviewer-info,
.review-date {
  color: #909399;
  font-size: 12px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-text {
  color: #606266;
  font-size: 14px;
  margin-bottom: 20px;
}

.load-more-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.pagination-section {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.payment-dialog {
  padding: 20px 0;
}

.expense-info {
  margin-bottom: 24px;
}

.expense-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.expense-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
}

.expense-amount {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.expense-amount strong {
  font-size: 20px;
  color: #f56c6c;
}

.payment-methods h4,
.qr-code-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.method-options {
  margin-bottom: 24px;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.qr-code-tip {
  color: #606266;
  font-size: 14px;
}

.payment-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.success-icon {
  font-size: 48px;
  color: #67c23a;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .operations-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .reset-button {
    margin-left: 0;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
    padding: 0 12px;
  }
  
  .month-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>