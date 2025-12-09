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
          @click="router.push('/dashboard/expense/create')"
          class="create-btn"
        >
          新建费用
        </el-button>
        <el-button 
          type="warning" 
          :icon="DocumentChecked" 
          @click="router.push('/dashboard/expense/review')"
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
              <el-dropdown-item @click="handleQuickExport">
                <el-icon><Download /></el-icon>
                快速导出Excel
              </el-dropdown-item>
              <el-dropdown-item @click="handleBatchApprove">
                <el-icon><CircleCheck /></el-icon>
                审核待处理项目
              </el-dropdown-item>
              <el-dropdown-item @click="handleStatisticsView">
                <el-icon><DataAnalysis /></el-icon>
                查看统计数据
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
              @click="router.push('/dashboard/expense/create')"
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
  CreditCard, ChatLineRound, Money as BankIcon, SuccessFilled, Picture
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { confirmPayment, getQRCodes } from '@/services/paymentService'

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
const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`
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
    const qrResponse = await getQRCodes()
    if (qrResponse.success && qrResponse.data) {
      qrCodesData.value = qrResponse.data
      
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
      
      // 更新费用状态为已支付（这里简化处理，实际应该调用API更新状态）
      currentExpense.value.status = 'paid'
    } else {
      ElMessage.error('获取收款码失败')
    }
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

// 获取状态详细描述
const getStatusDescription = (status: 'pending' | 'approved' | 'rejected' | string) => {
  switch (status) {
    case 'pending': return '费用正在等待审核，请耐心等待'
    case 'approved': return '费用已通过审核，可以进行后续处理'
    case 'rejected': return '费用审核未通过，请查看审核意见'
    default: return '未知状态'
  }
}

// 获取状态图标
const getStatusIcon = (status: 'pending' | 'approved' | 'rejected' | string) => {
  switch (status) {
    case 'pending': return 'Clock'
    case 'approved': return 'CircleCheck'
    case 'rejected': return 'CircleClose'
    default: return 'InfoFilled'
  }
}

// 视图模式控制
const viewMode = ref<'table' | 'card'>('table')
const refreshing = ref(false)
const loadingMore = ref(false)

// 切换视图模式
const toggleViewMode = (mode: 'table' | 'card') => {
  viewMode.value = mode
  ElMessage.success(`已切换到${mode === 'table' ? '表格' : '卡片'}视图`)
}

// 下拉刷新
const handleRefresh = async () => {
  if (refreshing.value) return
  
  refreshing.value = true
  try {
    // 模拟API调用刷新数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 重新加载费用数据
    await loadExpenses()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('数据刷新失败，请检查网络连接或稍后重试')
  } finally {
    refreshing.value = false
  }
}

// 加载更多
const handleLoadMore = async () => {
  if (loadingMore.value) return
  
  loadingMore.value = true
  try {
    // 模拟API调用加载更多数据
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟加载更多费用数据
    const moreExpenses: Expense[] = [
      {
        id: 5,
        title: '宿舍门锁维修',
        description: '更换门锁锁芯',
        amount: 150.00,
        category: 'maintenance' as 'maintenance',
        applicant: '孙八',
        date: '2024-12-01',
        status: 'pending' as 'pending',
        createdAt: '2024-12-01T11:20:00'
      },
      {
        id: 6,
        title: '窗户玻璃更换',
        description: '更换破损的窗户玻璃',
        amount: 320.00,
        category: 'maintenance' as 'maintenance',
        applicant: '周九',
        date: '2024-11-28',
        status: 'approved' as 'approved',
        reviewer: '张三',
        reviewDate: '2024-11-29',
        reviewComment: '窗户维修必要，同意报销',
        createdAt: '2024-11-28T08:30:00'
      }
    ]
    
    expenses.value.push(...moreExpenses)
    ElMessage.success('已加载更多数据')
  } catch (error) {
    console.error('加载更多失败:', error)
    ElMessage.error('加载更多失败，请检查网络连接或稍后重试')
  } finally {
    loadingMore.value = false
  }
}

const getCategoryType = (category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other' | string) => {
  switch (category) {
    case 'accommodation': return ''
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'other': return 'danger'
    default: return 'info'
  }
}

const getCategoryText = (category: 'accommodation' | 'utilities' | 'maintenance' | 'cleaning' | 'other' | string) => {
  switch (category) {
    case 'accommodation': return '住宿费'
    case 'utilities': return '水电费'
    case 'maintenance': return '维修费'
    case 'cleaning': return '清洁费'
    case 'other': return '其他'
    default: return '未知'
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  monthFilter.value = ''
  currentPage.value = 1
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const handleRowClick = (row: Expense) => {
  router.push(`/dashboard/expense/detail/${row.id}`)
}

const handleView = (row: Expense) => {
  router.push(`/dashboard/expense/detail/${row.id}`)
}

const handleReview = (row: Expense) => {
  router.push(`/dashboard/expense/review?id=${row.id}`)
}

const handleDelete = async (row: Expense) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用"${row.title}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用API删除费用
    expenses.value = expenses.value.filter(e => e.id !== row.id)
    ElMessage.success('费用删除成功')
  } catch {
    // 用户取消删除
  }
}

const exportExpenses = async (format: 'csv' | 'xlsx' = 'csv') => {
  try {
    if (filteredExpenses.value.length === 0) {
      ElMessage.warning('没有数据可以导出')
      return
    }

    // 准备导出数据
    const exportData = filteredExpenses.value.map(expense => ({
      '费用ID': expense.id,
      '费用标题': expense.title,
      '费用描述': expense.description,
      '费用金额': expense.amount,
      '费用类别': getCategoryText(expense.category),
      '申请人': expense.applicant,
      '费用日期': formatDate(expense.date),
      '状态': getStatusText(expense.status),
      '审核人': expense.reviewer || '-',
      '审核日期': expense.reviewDate ? formatDate(expense.reviewDate) : '-',
      '审核意见': expense.reviewComment || '-',
      '创建时间': formatDate(expense.createdAt)
    }))

    if (format === 'xlsx') {
      // 导出为Excel格式
      ElMessage.info('正在生成Excel文件，请稍候...')
      
      // 这里应该调用实际的Excel导出服务
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 创建简单的CSV格式作为Excel替代（实际项目中应使用xlsx库）
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
        link.setAttribute('download', `费用记录_${new Date().toISOString().split('T')[0]}.xlsx`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success(`成功导出 ${exportData.length} 条费用记录 (Excel格式)`)
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
        link.setAttribute('download', `费用记录_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success(`成功导出 ${exportData.length} 条费用记录 (CSV格式)`)
      } else {
        ElMessage.error('您的浏览器版本较低，不支持文件下载功能，请升级浏览器或使用其他浏览器重试')
      }
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请检查网络连接或稍后重试')
  }
}

// 模拟数据加载
const loadExpenses = () => {
  loading.value = true
  
  // 模拟API调用
  setTimeout(() => {
    expenses.value = [
      {
        id: 1,
        title: '宿舍水电费',
        description: '2024年12月份水电费缴纳',
        amount: 156.50,
        category: 'utilities' as 'utilities',
        applicant: '张三',
        date: '2024-12-15',
        status: 'approved' as 'approved',
        reviewer: '李四',
        reviewDate: '2024-12-16',
        reviewComment: '费用合理，同意报销',
        createdAt: '2024-12-15T10:30:00'
      },
      {
        id: 2,
        title: '洗衣机维修费',
        description: '宿舍洗衣机故障维修',
        amount: 280.00,
        category: 'maintenance' as 'maintenance',
        applicant: '王五',
        date: '2024-12-10',
        status: 'pending' as 'pending',
        createdAt: '2024-12-10T14:20:00'
      },
      {
        id: 3,
        title: '清洁用品采购',
        description: '购买拖把、垃圾袋等清洁用品',
        amount: 85.60,
        category: 'cleaning' as 'cleaning',
        applicant: '赵六',
        date: '2024-12-08',
        status: 'approved' as 'approved',
        reviewer: '张三',
        reviewDate: '2024-12-09',
        reviewComment: '清洁用品采购合理',
        createdAt: '2024-12-08T16:45:00'
      },
      {
        id: 4,
        title: '网费缴纳',
        description: '2024年12月份宿舍网络费用',
        amount: 120.00,
        category: 'utilities' as 'utilities',
        applicant: '钱七',
        date: '2024-12-05',
        status: 'rejected' as 'rejected',
        reviewer: '李四',
        reviewDate: '2024-12-06',
        reviewComment: '网费应该由学校承担，不予报销',
        createdAt: '2024-12-05T09:15:00'
      }
    ]
    loading.value = false
  }, 800)
}

// 生命周期
onMounted(() => {
  loadExpenses()
})

// 批量操作相关
const selectedItems = ref<Expense[]>([])
const batchProcessing = ref(false)
const quickFilter = ref('')

// 批量操作方法
const handleBatchApprove = async () => {
  // 获取所有待审核的记录
  const pendingItems = expenses.value.filter(item => item.status === 'pending')
  
  if (pendingItems.length === 0) {
    ElMessage.warning('当前没有待审核的费用记录')
    return
  }
  
  // 如果有待审核记录，跳转到费用审核页面进行批量处理
  if (pendingItems.length > 0) {
    router.push('/dashboard/expense/review?batch=true')
    return
  }
}

const handleBatchReject = async () => {
  if (selectedItems.value.length === 0) return
  
  const pendingItems = selectedItems.value.filter(item => item.status === 'pending')
  if (pendingItems.length === 0) {
    ElMessage.warning('没有待审核的记录可以拒绝')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量拒绝 ${pendingItems.length} 条待审核记录吗？`,
      '批量拒绝确认',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    batchProcessing.value = true
    
    // 模拟批量拒绝API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新费用状态
    pendingItems.forEach(item => {
      item.status = 'rejected'
      item.reviewer = '当前用户'
      item.reviewDate = new Date().toISOString().split('T')[0]
      item.reviewComment = '批量拒绝审核'
    })
    
    // 清空选择
    clearSelection()
    ElMessage.success(`成功拒绝 ${pendingItems.length} 条记录`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量拒绝失败，请重试')
    }
  } finally {
    batchProcessing.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedItems.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${selectedItems.value.length} 条记录吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    batchProcessing.value = true
    
    // 模拟批量删除API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 删除选中的费用
    const selectedIds = selectedItems.value.map(item => item.id)
    expenses.value = expenses.value.filter(item => !selectedIds.includes(item.id))
    
    // 清空选择
    clearSelection()
    ElMessage.success(`成功删除 ${selectedItems.value.length} 条记录`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败，请重试')
    }
  } finally {
    batchProcessing.value = false
  }
}

const clearSelection = () => {
  selectedItems.value = []
}

// 快速筛选相关方法
const resetPagination = () => {
  currentPage.value = 1
}

const handleSearch = () => {
  resetPagination()
  // 搜索逻辑已经在 computed 的 filteredExpenses 中实现
}

// 更多操作相关方法
const handleQuickExport = () => {
  exportExpenses()
}

const handleStatisticsView = () => {
  router.push('/dashboard/expense-statistics')
}

const handleClearAll = async () => {
  if (expenses.value.length === 0) {
    ElMessage.warning('没有数据可以清空')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要清空所有费用记录吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 模拟清空API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expenses.value = []
    ElMessage.success('所有费用记录已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空失败，请重试')
    }
  }
}




</script>

<style scoped>
/* 页面容器 */
.expense-management {
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
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
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

.create-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.review-btn {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

/* 统计摘要区 */
.summary-section {
  margin-bottom: 24px;
}

.summary-grid {
  display: flex;
  gap: 20px;
  flex-wrap: nowrap;
}

.summary-grid .summary-item {
  flex: 1;
  min-width: 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-width: 0;
}

.summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
}

.summary-item.total {
  border-left: 4px solid #409eff;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
}

.summary-item.pending {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, #fff8e6 0%, #fef3cd 100%);
}

.summary-item.approved {
  border-left: 4px solid #67c23a;
  background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
}

.summary-item.monthly {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.summary-item.total .summary-icon {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.summary-item.pending .summary-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.summary-item.approved .summary-icon {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.summary-item.monthly .summary-icon {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.summary-content {
  flex: 1;
}

.summary-number {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-text {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .summary-grid {
    gap: 15px;
  }
  
  .summary-item {
    padding: 16px 12px;
    gap: 10px;
  }
  
  .summary-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .summary-number {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .summary-grid .summary-item {
    flex: 1 1 calc(50% - 6px);
    min-width: 140px;
  }
  
  .summary-item {
    padding: 14px 10px;
    gap: 8px;
  }
  
  .summary-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .summary-number {
    font-size: 16px;
  }
  
  .summary-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .summary-grid .summary-item {
    flex: 1 1 100%;
  }
}

/* 批量操作栏 */
.batch-operations-bar {
  margin-bottom: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border: 1px solid #91d5ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #1890ff;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

/* 快速筛选按钮组 */
.quick-filter-group {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-filter-group .el-button {
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.quick-filter-group .el-button.is-active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 搜索筛选区 */
.operations-section {
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.operations-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.operations-row .el-input,
.operations-row .el-select {
  width: 200px;
}

.search-input {
  width: 300px;
}

.reset-button {
  background: linear-gradient(135deg, #909399 0%, #82868b 100%);
  border: none;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(144, 147, 153, 0.3);
}

.reset-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4);
}

/* 列表区域 */
.expense-list-section {
  margin-bottom: 24px;
}

.list-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.expense-table-container {
  min-height: 400px;
}

.expense-table {
  border-radius: 8px;
  overflow: hidden;
}

.expense-table .el-table__cell {
  padding: 8px 12px;
}

.expense-table .el-table__header-wrapper th {
  padding: 12px 8px;
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expense-title {
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.category-tag {
  align-self: flex-start;
}

.amount-cell {
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-text {
  font-size: 16px;
  margin: 0 0 24px 0;
}

/* 分页区域 */
.pagination-section {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .expense-management {
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
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .operations-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .operations-row .el-input,
  .operations-row .el-select,
  .search-input {
    width: 100%;
  }
}

/* 卡片视图样式 */
.card-view-container {
  position: relative;
}

.pullrefresh-wrapper {
  min-height: 400px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 8px;
}

.expense-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.expense-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title-section {
  flex: 1;
  margin-right: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
  word-break: break-word;
}

.card-amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
  white-space: nowrap;
}

.card-content {
  margin-bottom: 16px;
}

.card-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 16px 0;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.info-item .el-icon {
  color: #c0c4cc;
}

.card-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reviewer-info {
  font-size: 12px;
  color: #909399;
}

.review-date {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.load-more-section {
  text-align: center;
  padding: 24px 0;
}

.load-more-btn {
  width: 200px;
  border-radius: 25px;
  font-weight: 500;
}

/* 视图切换按钮样式 */
.view-mode-btn {
  font-weight: 500;
}

/* 分组展示样式 */
.month-group {
  margin-bottom: 32px;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.month-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.month-summary {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #606266;
}

.expense-count {
  background: #e6f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  color: #1890ff;
}

.month-total {
  font-weight: 600;
  color: #f56c6c;
}

/* 响应式卡片布局 */
@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-title-section {
    margin-right: 0;
  }
}

/* 批量操作响应式设计 */
@media (max-width: 768px) {
  .batch-operations-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .batch-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .quick-filter-group {
    justify-content: center;
  }
}

/* 支付对话框样式 */
.payment-dialog {
  padding: 20px 0;
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


</style>