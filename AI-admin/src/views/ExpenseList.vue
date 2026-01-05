<template>
  <div class="expense-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="createExpense">
              <el-icon v-if="isMobile"><Plus /></el-icon>
              <span v-if="!isMobile">新建费用</span>
            </el-button>
            <el-button @click="refreshExpenses">
              <el-icon v-if="isMobile"><Refresh /></el-icon>
              <span v-if="!isMobile">刷新</span>
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 费用统计摘要 -->
      <div class="summary-section">
        <el-row :gutter="isMobile ? 10 : 20">
          <el-col :xs="12" :sm="6">
            <div class="summary-item total">
              <div class="summary-icon">
                <el-icon><Wallet /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-number">¥{{ formatCurrency(totalExpense) }}</div>
                <div class="summary-text">总费用</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="summary-item pending">
              <div class="summary-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-number">{{ pendingCount }}</div>
                <div class="summary-text">待审核</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6" :class="{ 'mt-10': isMobile }">
            <div class="summary-item approved">
              <div class="summary-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-number">{{ approvedCount }}</div>
                <div class="summary-text">审核通过</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6" :class="{ 'mt-10': isMobile }">
            <div class="summary-item monthly">
              <div class="summary-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-number">¥{{ formatCurrency(monthlyExpense) }}</div>
                <div class="summary-text">本月费用</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="operations-section">
        <!-- 快速筛选按钮组 -->
        <div class="quick-filters" :class="{ 'scrollable-filters': isMobile }">
          <el-button-group>
            <el-button 
              :size="isMobile ? 'small' : 'default'"
              :type="quickFilter === '' ? 'primary' : 'default'"
              @click="quickFilter = ''; resetFilters()"
            >
              全部
            </el-button>
            <el-button 
              :size="isMobile ? 'small' : 'default'"
              :type="quickFilter === 'pending' ? 'primary' : 'default'"
              @click="quickFilter = 'pending'; statusFilter = 'pending'; resetPagination()"
            >
              待审核
            </el-button>
            <el-button 
              :size="isMobile ? 'small' : 'default'"
              :type="quickFilter === 'approved' ? 'primary' : 'default'"
              @click="quickFilter = 'approved'; statusFilter = 'approved'; resetPagination()"
            >
              已通过
            </el-button>
            <el-button 
              :size="isMobile ? 'small' : 'default'"
              :type="quickFilter === 'rejected' ? 'primary' : 'default'"
              @click="quickFilter = 'rejected'; statusFilter = 'rejected'; resetPagination()"
            >
              已拒绝
            </el-button>
          </el-button-group>
        </div>
        
        <div class="filter-controls">
          <el-input
            v-model="searchQuery"
            placeholder="搜索费用..."
            :prefix-icon="Search"
            :class="{ 'search-input': !isMobile, 'search-input-mobile': isMobile }"
            clearable
            @keyup.enter="handleSearch"
          />
          
          <div v-if="isMobile" class="mobile-actions-row">
            <el-button 
              type="primary" 
              link 
              @click="showMoreFilters = !showMoreFilters"
              class="more-filter-btn"
            >
              {{ showMoreFilters ? '收起' : '更多' }}
              <el-icon class="el-icon--right">
                <component :is="showMoreFilters ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </el-button>
            
            <el-button 
              type="primary" 
              :icon="Refresh" 
              @click="resetFilters"
              class="reset-btn-mobile"
            >
            </el-button>
          </div>

          <div v-if="isMobile && showMoreFilters" class="mobile-filters-row">
            <el-select
              v-model="statusFilter"
              placeholder="状态"
              clearable
              style="width: 100%"
            >
              <el-option label="全部状态" value="" />
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
            
            <el-select
              v-model="categoryFilter"
              placeholder="分类"
              clearable
              style="width: 100%"
            >
              <el-option label="全部分类" value="" />
              <el-option label="住宿费" value="accommodation" />
              <el-option label="水电费" value="utilities" />
              <el-option label="维修费" value="maintenance" />
              <el-option label="其他" value="other" />
            </el-select>
          </div>

          <template v-if="!isMobile">
            <el-select
              v-model="statusFilter"
              placeholder="费用状态"
              clearable
              style="width: 130px"
            >
              <el-option label="全部状态" value="" />
              <el-option label="待审核" value="pending" />
              <el-option label="审核通过" value="approved" />
              <el-option label="审核拒绝" value="rejected" />
            </el-select>
            
            <el-select
              v-model="categoryFilter"
              placeholder="费用类别"
              clearable
              style="width: 130px"
            >
              <el-option label="全部分类" value="" />
              <el-option label="住宿费" value="accommodation" />
              <el-option label="水电费" value="utilities" />
              <el-option label="维修费" value="maintenance" />
              <el-option label="清洁费" value="cleaning" />
              <el-option label="活动费用" value="activities" />
              <el-option label="日用品" value="supplies" />
              <el-option label="食品饮料" value="food" />
              <el-option label="保险费用" value="insurance" />
              <el-option label="房租" value="rent" />
              <el-option label="其他" value="other" />
            </el-select>
            
            <el-button 
              type="primary" 
              :icon="Refresh" 
              @click="resetFilters"
            >
              重置
            </el-button>
          </template>
        </div>
      </div>
      
      <!-- 费用卡片列表 -->
      <div class="expenses-grid">
        <el-card 
          v-for="expense in paginatedExpenses" 
          :key="expense.id"
          class="expense-card"
          :class="{ 'highlight': selectedExpenseId === expense.id }"
          @click="selectExpense(expense)"
        >
          <div class="card-header-row">
            <div class="card-title-section">
              <h3 class="card-title">{{ expense.title }}</h3>
              <el-tag 
                :type="getCategoryType(expense.category)" 
                size="small"
                class="category-tag"
              >
                {{ getCategoryText(expense.category) }}
              </el-tag>
            </div>
            <div class="card-amount">¥{{ formatCurrency(expense.amount) }}</div>
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
            
            <div class="card-status-row">
              <el-tag 
                :type="getStatusType(expense.status)" 
                size="small"
              >
                <el-icon style="margin-right: 4px; vertical-align: text-top;">
                  <component :is="getStatusIcon(expense.status)" />
                </el-icon>
                {{ getStatusText(expense.status) }}
              </el-tag>
              <span v-if="expense.reviewer && !isMobile" class="reviewer-info">
                审核人：{{ expense.reviewer }}
              </span>
            </div>
          </div>
          
          <div class="card-actions">
            <el-button 
              type="primary" 
              size="small" 
              plain
              @click.stop="viewExpenseDetail(expense)"
            >
              {{ isMobile ? '详情' : '查看详情' }}
            </el-button>
            <el-button 
              v-if="expense.status === 'pending'"
              type="warning" 
              size="small" 
              @click.stop="reviewExpense(expense)"
            >
              审核
            </el-button>
            <el-button 
              v-else-if="expense.status === 'approved'"
              type="success" 
              size="small" 
              @click.stop="payExpense(expense)"
            >
              支付
            </el-button>
            <el-dropdown @command="handleExpenseAction" style="margin-left: 8px;">
              <el-button size="small">
                {{ isMobile ? '' : '更多' }}
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{action: 'edit', expense}">
                    <el-icon><Edit /></el-icon> 编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{action: 'delete', expense}" divided>
                    <el-icon><Delete /></el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-card>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredExpenses.length === 0" class="empty-state">
        <el-empty description="暂无费用记录" />
        <el-button type="primary" @click="createExpense">创建费用</el-button>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[8, 12, 20, 50]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :pager-count="isMobile ? 5 : 7"
          :total="filteredExpenses.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Wallet, Clock, CircleCheck, Calendar, User, 
  Search, Refresh, Edit, Delete, ArrowDown, Plus, ArrowUp
} from '@element-plus/icons-vue'

// 移动端适配
const isMobile = ref(false)
const showMoreFilters = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 路由实例
const router = useRouter()

// 响应式数据 - 初始化为空数组，通过API获取真实数据
const expenses = ref([])

const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const monthFilter = ref('')
const quickFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(8)
const selectedExpenseId = ref<number | null>(null)

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

// 方法
const formatCurrency = (amount: number | string): string => {
  // 处理可能不是数字的值
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  
  // 如果转换失败，返回默认值
  if (isNaN(num)) {
    return '0.00'
  }
  
  return num.toFixed(2)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'draft': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'draft': return '草稿'
    default: return '未知'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return Clock
    case 'approved': return CircleCheck
    case 'rejected': return Delete
    default: return CircleCheck
  }
}

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'pending': return '等待审核'
    case 'approved': return '审核已通过'
    case 'rejected': return '审核被拒绝'
    case 'draft': return '草稿状态'
    default: return '未知状态'
  }
}

const getCategoryType = (category: string) => {
  switch (category) {
    case 'accommodation': return 'primary'
    case 'utilities': return 'success'
    case 'maintenance': return 'warning'
    case 'cleaning': return 'info'
    case 'activities': return 'danger'
    case 'supplies': return 'success'
    case 'food': return 'warning'
    case 'insurance': return 'primary'
    case 'rent': return 'info'
    case 'other': return 'info'
    default: return 'info'
  }
}

const getCategoryText = (category: string) => {
  if (!category) return '未知'
  // 如果已经是中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(category)) return category

  switch (category) {
    case 'accommodation': return '住宿费'
    case 'rent': return '房租'
    case 'deposit': return '押金'
    case 'management_fee': return '管理费'
    case 'utilities': return '水电费'
    case 'water_fee': return '水费'
    case 'electricity_fee': return '电费'
    case 'gas_fee': return '燃气费'
    case 'internet_fee': return '网费'
    case 'tv_fee': return '电视费'
    case 'maintenance': return '维修费'
    case 'equipment_repair': return '设备维修'
    case 'furniture_repair': return '家具维修'
    case 'appliance_repair': return '电器维修'
    case 'cleaning': return '清洁费'
    case 'daily_cleaning': return '日常清洁'
    case 'pest_control': return '杀虫除害'
    case 'activities': return '活动费用'
    case 'supplies': return '日用品'
    case 'food': return '食品饮料'
    case 'insurance': return '保险费用'
    case 'other': return '其他'
    default: return category || '未知'
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  monthFilter.value = ''
  quickFilter.value = ''
  currentPage.value = 1
}

const resetPagination = () => {
  currentPage.value = 1
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const refreshExpenses = () => {
  // 模拟刷新数据
  ElMessage.success('费用列表已刷新')
}

const createExpense = () => {
  router.push('/expense/create')
}

/**
 * 查看费用详情
 * @param expense 费用对象
 */
const viewExpenseDetail = (expense: any) => {
  router.push(`/fee-detail/${expense.id}`)
}

const reviewExpense = (expense: any) => {
  router.push(`/expense/review/${expense.id}`)
}

const payExpense = (expense: any) => {
  ElMessage.info(`支付费用: ${expense.title}`)
}

const selectExpense = (expense: any) => {
  selectedExpenseId.value = expense.id
}

const handleExpenseAction = async (command: any) => {
  const { action, expense } = command
  
  switch (action) {
    case 'edit':
      ElMessage.info(`编辑费用: ${expense.title}`)
      break
    case 'delete':
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
        
        // 从列表中移除
        const index = expenses.value.findIndex(e => e.id === expense.id)
        if (index !== -1) {
          expenses.value.splice(index, 1)
          ElMessage.success('费用删除成功')
        }
      } catch {
        // 用户取消操作
      }
      break
  }
}

// 组件挂载时的操作
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  console.log('💰 费用列表页面加载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.expense-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-section {
  margin: 20px 0;
}

.summary-item {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
}

.summary-icon .el-icon {
  color: white;
  font-size: 20px;
}

.summary-content {
  flex: 1;
}

.summary-number {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.summary-text {
  color: #606266;
  font-size: 12px;
}

.operations-section {
  margin: 20px 0;
}

.quick-filters {
  margin-bottom: 15px;
}

.scrollable-filters {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 5px;
  -webkit-overflow-scrolling: touch;
}

.scrollable-filters::-webkit-scrollbar {
  display: none;
}

.filter-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 200px;
}

.search-input-mobile {
  width: 100%;
}

.mobile-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.mobile-filters-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.reset-btn-mobile {
  padding: 8px 12px;
}

.expenses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.expense-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.expense-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.expense-card.highlight {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px #409EFF;
}

.card-header-row {
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
  color: #f56c6c;
}

.card-content {
  margin-bottom: 16px;
}

.card-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.card-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-info {
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
  padding: 40px 0;
  text-align: center;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.mt-10 {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .expense-list-container {
    padding: 10px;
  }
  
  .expenses-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .summary-item {
    padding: 10px;
  }
  
  .summary-number {
    font-size: 16px;
  }
  
  .summary-icon {
    width: 32px;
    height: 32px;
  }
  
  .summary-icon .el-icon {
    font-size: 16px;
  }
  
  .card-amount {
    font-size: 16px;
  }
}
</style>
  .expenses-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .summary-section .el-row {
    flex-direction: column;
  }
  
  .summary-item {
    width: 100%;
  }
}
</style>