<template>
  <div class="payment-records">
    <div class="page-header">
      <h1>支付记录</h1>
      <div class="header-actions">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">总收入</div>
              <div class="stat-value income">¥{{ (statistics.totalIncome || 0).toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">总支出</div>
              <div class="stat-value expense">¥{{ (statistics.totalExpense || 0).toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">交易笔数</div>
              <div class="stat-value">{{ statistics.totalTransactions || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">成功率</div>
              <div class="stat-value">
                {{ (statistics.successfulPayments && statistics.totalTransactions) ? ((statistics.successfulPayments / statistics.totalTransactions) * 100).toFixed(1) : 0 }}%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-card class="filter-card">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon><Search /></el-icon>
                关键词搜索
              </label>
              <el-input
                v-model="filterForm.keyword"
                placeholder="搜索订单号、描述、收款人"
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              />
            </div>
          </el-col>
          <el-col :span="4">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon><Document /></el-icon>
                支付状态
              </label>
              <el-select
                v-model="filterForm.status"
                placeholder="全部状态"
                clearable
                @change="handleSearch"
              >
                <el-option label="全部" value="" />
                <el-option label="成功" value="success" />
                <el-option label="失败" value="failed" />
                <el-option label="处理中" value="processing" />
                <el-option label="待支付" value="pending" />
                <el-option label="已退款" value="refunded" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon><Wallet /></el-icon>
                支付方式
              </label>
              <el-select
                v-model="filterForm.paymentMethod"
                placeholder="全部方式"
                clearable
                @change="handleSearch"
              >
                <el-option label="全部" value="" />
                <el-option label="微信支付" value="wechat" />
                <el-option label="支付宝" value="alipay" />
                <el-option label="银行卡" value="bank" />
                <el-option label="现金" value="cash" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon><TrendCharts /></el-icon>
                交易类型
              </label>
              <el-select
                v-model="filterForm.transactionType"
                placeholder="全部类型"
                clearable
                @change="handleSearch"
              >
                <el-option label="全部" value="" />
                <el-option label="收入" value="income" />
                <el-option label="支出" value="expense" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="filter-item">
              <label class="filter-label">
                <el-icon><Calendar /></el-icon>
                日期范围
              </label>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleDateChange"
                style="width: 100%;"
              />
            </div>
          </el-col>
          <el-col :span="2">
            <div class="filter-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch" class="search-btn">
                搜索
              </el-button>
              <el-button :icon="Refresh" @click="handleReset" class="reset-btn">
                重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 支付记录时间线 -->
    <div class="timeline-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>支付历史时间线</span>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="timeline">时间线</el-radio-button>
              <el-radio-button label="table">表格</el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <!-- 时间线视图 -->
        <div v-if="viewMode === 'timeline'" class="timeline-view">
          <el-timeline>
            <el-timeline-item
              v-for="record in paginatedPaymentRecords"
              :key="record.id"
              :timestamp="formatDateTime(record.createdAt)"
              :type="getTimelineType(record.status)"
              placement="top"
            >
              <el-card :class="['record-card', record.status]">
                <div class="record-header">
                  <div class="record-title">
                    <el-tag :type="getStatusType(record.status)" size="small">
                      {{ getStatusText(record.status) }}
                    </el-tag>
                    <span class="order-id">{{ record.orderId }}</span>
                  </div>
                  <div class="record-amount" :class="record.transactionType">
                    {{ record.transactionType === 'income' ? '+' : '-' }}¥{{ Math.abs(record.amount).toFixed(2) }}
                  </div>
                </div>
                <div class="record-content">
                  <div class="record-info">
                    <div class="info-item">
                      <el-icon><Document /></el-icon>
                      <span>{{ record.description }}</span>
                    </div>
                    <div class="info-item">
                      <el-icon><Wallet /></el-icon>
                      <span>{{ getPaymentMethodText(record.paymentMethod) }}</span>
                    </div>
                    <div v-if="record.recipientName" class="info-item">
                      <el-icon><User /></el-icon>
                      <span>{{ record.recipientName }}</span>
                    </div>
                  </div>
                  <div class="record-actions">
                    <el-button
                      type="primary"
                      link
                      size="small"
                      @click="handleViewDetail(record)"
                    >
                      查看详情
                    </el-button>
                    <el-button
                      v-if="record.status === 'success'"
                      type="success"
                      link
                      size="small"
                      @click="handleDownloadVoucher(record)"
                    >
                      下载凭证
                    </el-button>
                    <el-button
                      v-if="record.status === 'success' && record.transactionType === 'income'"
                      type="warning"
                      link
                      size="small"
                      @click="handleRefund(record)"
                    >
                      申请退款
                    </el-button>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 表格视图 -->
        <div v-else class="table-view">
          <el-table
            :data="paymentRecords"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="orderId" label="订单号" width="180" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="transactionType" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.transactionType === 'income' ? 'success' : 'danger'">
                  {{ row.transactionType === 'income' ? '收入' : '支出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="['amount', row.transactionType]">
                  {{ row.transactionType === 'income' ? '+' : '-' }}¥{{ Math.abs(row.amount).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="支付方式" width="100">
              <template #default="{ row }">
                {{ getPaymentMethodText(row.paymentMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="handleViewDetail(row)"
                >
                  详情
                </el-button>
                <el-button
                  v-if="row.status === 'success'"
                  type="success"
                  link
                  size="small"
                  @click="handleDownloadVoucher(row)"
                >
                  凭证
                </el-button>
                <el-button
                  v-if="row.status === 'success' && row.transactionType === 'income'"
                  type="warning"
                  link
                  size="small"
                  @click="handleRefund(row)"
                >
                  退款
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[5, 8, 12, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 支付详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="支付详情"
      width="600px"
      destroy-on-close
    >
      <div v-if="detailDialog.record" class="payment-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detailDialog.record.orderId }}</el-descriptions-item>
          <el-descriptions-item label="交易号">{{ detailDialog.record.transactionId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易类型">
            <el-tag :type="detailDialog.record.transactionType === 'income' ? 'success' : 'danger'">
              {{ detailDialog.record.transactionType === 'income' ? '收入' : '支出' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getStatusType(detailDialog.record.status)">
              {{ getStatusText(detailDialog.record.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="金额">
            <span :class="['amount', detailDialog.record.transactionType]">
              {{ detailDialog.record.transactionType === 'income' ? '+' : '-' }}¥{{ Math.abs(detailDialog.record.amount).toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="手续费">¥{{ (detailDialog.record.feeAmount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ getPaymentMethodText(detailDialog.record.paymentMethod) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(detailDialog.record.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间" v-if="detailDialog.record.completedAt">
            {{ formatDateTime(detailDialog.record.completedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ detailDialog.record.description }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2" v-if="detailDialog.record.remark">
            {{ detailDialog.record.remark }}
          </el-descriptions-item>
          <el-descriptions-item label="收款人" v-if="detailDialog.record.recipientName">
            {{ detailDialog.record.recipientName }}
          </el-descriptions-item>
          <el-descriptions-item label="收款账号" v-if="detailDialog.record.recipientAccount">
            {{ detailDialog.record.recipientAccount }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址" v-if="detailDialog.record.ipAddress">
            {{ detailDialog.record.ipAddress }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
          <el-button
            v-if="detailDialog.record?.status === 'success'"
            type="primary"
            @click="handleDownloadVoucher(detailDialog.record)"
          >
            下载凭证
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Download, 
  ArrowLeft,
  Document,
  User,
  Wallet,
  Calendar,
  TrendCharts
} from '@element-plus/icons-vue'
import type { PaymentRecord, PaymentFilter, PaymentStatistics } from '@/services/paymentService'
import {
  getPaymentRecords,
  getPaymentStatistics,
  exportPaymentRecords
} from '@/services/paymentService'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const viewMode = ref<'timeline' | 'table'>('timeline')
const paymentRecords = ref<PaymentRecord[]>([])
const statistics = ref<PaymentStatistics>({
  totalIncome: 0,
  totalExpense: 0,
  totalTransactions: 0,
  successfulPayments: 0,
  pendingPayments: 0,
  failedPayments: 0,
  monthlyTransactions: [],
  methodDistribution: []
})

// 筛选表单
const filterForm = reactive<PaymentFilter>({
  keyword: '',
  status: '',
  paymentMethod: '',
  transactionType: '',
  startDate: '',
  endDate: '',
  minAmount: undefined,
  maxAmount: undefined,
  page: 1,
  size: 20
})

// 日期范围
const dateRange = ref<string[]>([])

// 分页
const pagination = reactive({
  page: 1,
  size: 5,
  total: 0,
  pages: 0
})

// 计算分页后的支付记录
const paginatedPaymentRecords = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return paymentRecords.value.slice(start, end)
})

// 详情对话框
const detailDialog = reactive({
  visible: false,
  record: null as PaymentRecord | null
})

// 方法定义
const formatDateTime = (dateString: string | number | undefined | null): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getStatusType = (status: string) => {
  const statusMap = {
    success: 'success',
    failed: 'danger',
    processing: 'warning',
    pending: 'info',
    refunded: 'info'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap = {
    success: '成功',
    failed: '失败',
    processing: '处理中',
    pending: '待支付',
    refunded: '已退款'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getPaymentMethodText = (method: string) => {
  const methodMap = {
    wechat: '微信支付',
    alipay: '支付宝',
    bank: '银行卡',
    cash: '现金'
  }
  return methodMap[method as keyof typeof methodMap] || method
}

const getTimelineType = (status: string) => {
  const typeMap = {
    success: 'success',
    failed: 'danger',
    processing: 'warning',
    pending: 'primary',
    refunded: 'info'
  }
  return typeMap[status as keyof typeof typeMap] || 'primary'
}

const handleDateChange = (dates: string[]) => {
  if (dates && dates.length === 2) {
    filterForm.startDate = dates[0]
    filterForm.endDate = dates[1]
  } else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
  handleSearch()
}

const handleSearch = async () => {
  loading.value = true
  try {
    const response = await getPaymentRecords(filterForm)
    if (response.success && response.data) {
      paymentRecords.value = response.data.records
      pagination.total = response.data.total
      pagination.pages = response.data.pages
    }
  } catch (error: any) {
    const errorMsg = error.message || '获取支付记录失败'
    ElMessage.error(errorMsg)
    console.error('获取支付记录失败:', error)
    // 显示友好的错误提示
    if (error.message && error.message.includes('服务器内部错误')) {
      ElMessage.info('服务器正在维护中，请稍后再试')
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.paymentMethod = ''
  filterForm.transactionType = ''
  filterForm.startDate = ''
  filterForm.endDate = ''
  filterForm.minAmount = undefined
  filterForm.maxAmount = undefined
  dateRange.value = []
  handleSearch()
}

const handleSizeChange = (size: number) => {
  filterForm.size = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  filterForm.page = page
  handleSearch()
}

const handleViewDetail = (record: PaymentRecord) => {
  detailDialog.record = record
  detailDialog.visible = true
}

const handleDownloadVoucher = async (record: PaymentRecord) => {
  try {
    // TODO: 对接下载凭证API
    ElMessage.info('凭证下载功能尚未实现')
    console.log('下载凭证:', record.orderId)
  } catch (error) {
    ElMessage.error('下载凭证失败')
    console.error('下载凭证失败:', error)
  }
}

const handleRefund = async (record: PaymentRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要申请退款 ¥${Math.abs(record.amount).toFixed(2)} 吗？`,
      '申请退款',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // TODO: 对接退款API
    ElMessage.info('退款功能尚未实现')
    console.log('申请退款:', record.orderId)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('申请退款失败')
      console.error('申请退款失败:', error)
    }
  }
}

const handleExport = async () => {
  try {
    await exportPaymentRecords(filterForm, 'excel')
    ElMessage.success('导出成功，文件将自动下载')
  } catch (error: any) {
    const errorMsg = error.message || '导出失败'
    ElMessage.error(errorMsg)
    console.error('导出失败:', error)
    // 提供更具体的错误提示
    if (error.message && error.message.includes('导出服务暂时不可用')) {
      ElMessage.info('导出功能正在维护中，请稍后再试')
    } else if (error.message && error.message.includes('没有符合条件的支付记录')) {
      ElMessage.info('当前筛选条件下没有可导出的支付记录')
    }
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await getPaymentStatistics()
    if (response.success && response.data) {
      statistics.value = response.data
    }
  } catch (error: any) {
    const errorMsg = error.message || '获取统计数据失败'
    ElMessage.warning(errorMsg)
    console.error('获取统计数据失败:', error)
    // 显示友好的错误提示
    if (error.message && error.message.includes('接口不存在')) {
      ElMessage.info('统计功能正在升级中，请稍后再试')
    }
  }
}

// 返回上一页
const handleBack = () => {
  // 返回支付页面
  router.push('/dashboard/payment')
}

// 生命周期
onMounted(() => {
  handleSearch()
  loadStatistics()
})
</script>

<style scoped>
.payment-records {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.statistics-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-value.income {
  color: #67c23a;
}

.stat-value.expense {
  color: #f56c6c;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-card {
  padding: 20px;
}

.filter-item {
  width: 100%;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.filter-label .el-icon {
  font-size: 16px;
  color: #909399;
}

.filter-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  justify-content: flex-end;
}

.search-btn {
  width: 100%;
}

.reset-btn {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-view {
  padding: 20px 0;
}

.record-card {
  margin-bottom: 10px;
}

.record-card.success {
  border-left: 4px solid #67c23a;
}

.record-card.failed {
  border-left: 4px solid #f56c6c;
}

.record-card.processing {
  border-left: 4px solid #e6a23c;
}

.record-card.pending {
  border-left: 4px solid #909399;
}

.record-card.refunded {
  border-left: 4px solid #409eff;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.record-amount {
  font-size: 18px;
  font-weight: 600;
}

.record-amount.income {
  color: #67c23a;
}

.record-amount.expense {
  color: #f56c6c;
}

.record-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.record-actions {
  display: flex;
  gap: 10px;
}

.table-view {
  margin-top: 20px;
}

.amount {
  font-weight: 600;
}

.amount.income {
  color: #67c23a;
}

.amount.expense {
  color: #f56c6c;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.payment-detail {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .filter-form {
    flex-direction: column;
  }
  
  .record-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .record-actions {
    align-self: flex-end;
  }
}
</style>