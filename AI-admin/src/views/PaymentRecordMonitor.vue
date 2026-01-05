<template>
  <div class="payment-record-monitor-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>支付记录监控</span>
            <span class="update-time" v-if="lastUpdateTime">数据最后更新时间: {{ lastUpdateTime }}</span>
            <el-tag :type="connectionStatus === 'connected' ? 'success' : 'danger'" size="small">
              {{ connectionStatus === 'connected' ? '实时连接中' : '连接已断开' }}
            </el-tag>
            <el-alert
              v-if="isDataDelayed"
              title="数据同步延迟警告: 延迟超过1分钟"
              type="warning"
              show-icon
              :closable="false"
              style="padding: 0 10px; margin-left: 10px; height: 28px; width: auto;"
            />
          </div>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20" style="margin-bottom: 20px;" v-loading="statsLoading">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><SuccessFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日成功支付</div>
                <div class="stat-value" :class="{ 'stat-value-update': statsUpdated.todaySuccess }">{{ stats.todaySuccess }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-danger">
                <el-icon size="24"><CircleCloseFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日失败支付</div>
                <div class="stat-value" :class="{ 'stat-value-update': statsUpdated.todayFailed }">{{ stats.todayFailed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">待处理异常</div>
                <div class="stat-value" :class="{ 'stat-value-update': statsUpdated.pendingExceptions }">{{ stats.pendingExceptions }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><Money /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日交易总额</div>
                <div class="stat-value" :class="{ 'stat-value-update': statsUpdated.todayAmount }">¥{{ formatAmount(stats.todayAmount) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-card v-loading="statusChartLoading">
            <template #header>
              <span>支付状态统计</span>
            </template>
            <div ref="statusChartRef" class="chart-transition" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card v-loading="methodChartLoading">
            <template #header>
              <span>支付方式分布</span>
            </template>
            <div ref="methodChartRef" class="chart-transition" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-card style="margin-bottom: 20px;" v-loading="successRateChartLoading">
        <template #header>
          <span>支付成功率趋势</span>
        </template>
        <div ref="successRateChartRef" class="chart-transition" style="height: 300px;"></div>
      </el-card>
      
      <el-card style="margin-bottom: 20px;" v-loading="timeDistributionChartLoading">
        <template #header>
          <span>支付时间分布</span>
        </template>
        <div ref="timeDistributionChartRef" class="chart-transition" style="height: 300px;"></div>
      </el-card>
      
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="订单号">
            <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          
          <el-form-item label="支付方式">
            <el-select v-model="searchForm.paymentMethod" placeholder="请选择支付方式" clearable>
              <el-option label="支付宝" value="alipay" />
              <el-option label="微信" value="wechat" />
              <el-option label="银行卡" value="bank" />
              <el-option label="现金" value="cash" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="支付状态">
            <el-select v-model="searchForm.status" placeholder="请选择支付状态" clearable>
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="处理中" value="processing" />
              <el-option label="已退款" value="refunded" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :shortcuts="dateShortcuts"
              @change="handleDateRangeChange"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="tableData" style="width: 100%" v-loading="tableLoading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户姓名" />
        <el-table-column prop="amount" label="金额(元)">
          <template #default="scope">
            ¥{{ formatAmount(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式">
          <template #default="scope">
            {{ getPaymentMethodText(scope.row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="支付状态">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="completeTime" label="完成时间" width="160" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleMarkException(scope.row)" 
              v-if="!scope.row.isException"
              :loading="markingExceptionId === scope.row.id"
            >
              标记异常
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="detailDialogVisible" title="支付详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户姓名">{{ detailData.userName }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ formatAmount(detailData.amount) }} 元</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodText(detailData.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ detailData.completeTime || '未完成' }}</el-descriptions-item>
        <el-descriptions-item label="商户订单号">{{ detailData.merchantOrderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付流水号">{{ detailData.transactionNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <el-descriptions title="异常信息" :column="1" v-if="detailData.exception || detailData.isException">
        <el-descriptions-item label="异常类型">{{ getExceptionTypeText(detailData.exception?.type) }}</el-descriptions-item>
        <el-descriptions-item label="异常描述">{{ detailData.exception?.description || '用户手动标记为异常' }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">{{ getExceptionStatusText(detailData.exception?.status) }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detailData.exception?.handler || '未处理' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ detailData.exception?.handleTime || '未处理' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="handleProcessException" 
            v-if="(detailData.exception && detailData.exception.status === 'pending') || detailData.isException"
            :loading="processingException"
          >
            处理异常
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <el-dialog v-model="exceptionDialogVisible" title="标记异常" width="500px">
      <el-form :model="exceptionFormData" label-width="100px" :rules="exceptionRules" ref="exceptionFormRef">
        <el-form-item label="异常类型" prop="type">
          <el-select v-model="exceptionFormData.type" placeholder="请选择异常类型" style="width: 100%;">
            <el-option label="支付超时" value="timeout" />
            <el-option label="金额不符" value="amount_mismatch" />
            <el-option label="重复支付" value="duplicate" />
            <el-option label="用户投诉" value="complaint" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="异常描述" prop="description">
          <el-input 
            v-model="exceptionFormData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入异常描述（选填）" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exceptionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitExceptionForm" :loading="submittingException">确定标记</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SuccessFilled, CircleCloseFilled, Warning, Money } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as echarts from 'echarts'
import { paymentMonitorApi } from '@/api/paymentMonitor'

interface ExceptionInfo {
  type: string
  description: string
  status: string
  handler: string
  handleTime: string
}

interface PaymentRecord {
  id: number
  orderNo: string
  userName: string
  amount: number
  paymentMethod: string
  status: string
  createTime: string
  completeTime: string | null
  merchantOrderNo: string
  transactionNo: string | null
  remark: string
  exception: ExceptionInfo | null
  isException: boolean
}

const statusChartRef = ref()
const methodChartRef = ref()
const successRateChartRef = ref()
const timeDistributionChartRef = ref()

let statusChart: echarts.ECharts | null = null
let methodChart: echarts.ECharts | null = null
let successRateChart: echarts.ECharts | null = null
let timeDistributionChart: echarts.ECharts | null = null

const statsLoading = ref(false)
const tableLoading = ref(false)
const statusChartLoading = ref(false)
const methodChartLoading = ref(false)
const successRateChartLoading = ref(false)
const timeDistributionChartLoading = ref(false)
const submittingException = ref(false)
const processingException = ref(false)
const markingExceptionId = ref<number | null>(null)
const exceptionFormRef = ref<FormInstance>()

const stats = ref({
  todaySuccess: 0,
  todayFailed: 0,
  pendingExceptions: 0,
  todayAmount: 0
})

const tableData = ref<PaymentRecord[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const lastUpdateTime = ref('')
let refreshTimer: any = null

// 查询结果缓存 (新需求)
const searchCache = new Map<string, { records: PaymentRecord[], total: number, timestamp: number }>()
const CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 缓存 5 分钟

/**
 * 生成搜索缓存 Key
 */
const getSearchCacheKey = (params: any): string => {
  return JSON.stringify({
    orderNo: params.orderNo,
    paymentMethod: params.paymentMethod,
    status: params.status,
    dateRange: params.dateRange,
    page: params.page,
    size: params.size
  })
}

const connectionStatus = ref<'connected' | 'disconnected'>('disconnected')
const isDataDelayed = ref(false)
const statsUpdated = ref({
  todaySuccess: false,
  todayFailed: false,
  pendingExceptions: false,
  todayAmount: false
})

const triggerValueAnimation = (field: string): void => {
  (statsUpdated.value as any)[field] = true
  setTimeout(() => {
    (statsUpdated.value as any)[field] = false
  }, 600)
}
const serverTimeOffset = ref(0)
let eventSource: EventSource | null = null
const lastValidTrend = ref<any[]>([])
const lastValidTimeDistribution = ref<{timeSlots: string[], data: number[]}>(
  {
    timeSlots: ['0-2点', '2-4点', '4-6点', '6-8点', '8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点', '20-22点', '22-24点'],
    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
)
const consecutiveEmptyTrendCount = ref(0)
const consecutiveEmptyTimeDistCount = ref(0)
const dataVersion = ref(0)
const lastHourlyCheck = ref<number>(0) // 记录最后一次每小时检查的时间戳

// 监听数据变更，触发渲染 (规则 3)
watch(() => lastValidTimeDistribution.value, (newVal) => {
  if (newVal.data.length > 0) {
    debouncedRenderTimeDist(newVal.timeSlots, newVal.data)
  }
}, { deep: true })

// 防抖处理函数 (规则 3)
const debounce = (fn: Function, delay: number) => {
  let timer: any = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const searchForm = ref({
  orderNo: '',
  paymentMethod: '',
  status: '',
  dateRange: []
})

const detailDialogVisible = ref(false)
const exceptionDialogVisible = ref(false)

const detailData = ref<PaymentRecord>({
  id: 0,
  orderNo: '',
  userName: '',
  amount: 0,
  paymentMethod: '',
  status: '',
  createTime: '',
  completeTime: '',
  merchantOrderNo: '',
  transactionNo: '',
  remark: '',
  exception: null,
  isException: false
})

const exceptionFormData = ref({
  type: '',
  description: ''
})

const exceptionRules: FormRules = {
  type: [
    { required: true, message: '请选择异常类型', trigger: 'change' }
  ]
}

const currentRow = ref<PaymentRecord | null>(null)

const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信',
    bank: '银行卡',
    cash: '现金'
  }
  return methodMap[method] || '未知'
}

const getStatusTagType = (status: string): string => {
  const statusMap: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    processing: 'warning',
    refunded: 'info',
    pending: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    processing: '处理中',
    refunded: '已退款',
    pending: '待支付'
  }
  return statusMap[status] || status || '未知'
}

/**
 * 格式化金额，确保能够安全调用 toFixed
 * @param amount 金额，可以是数字或字符串
 * @returns 格式化后的金额字符串
 */
const formatAmount = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0.00'
  
  // 使用 Intl.NumberFormat 进行货币格式化（不带货币符号，符号在模板中添加）
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const getExceptionTypeText = (type: string | undefined): string => {
  if (!type) return '手动标记'
  if (/[\u4e00-\u9fa5]/.test(type)) return type
  
  const typeMap: Record<string, string> = {
    timeout: '支付超时',
    amount_mismatch: '金额不符',
    duplicate: '重复支付',
    complaint: '用户投诉',
    other: '其他'
  }
  return typeMap[type] || type
}

const getExceptionStatusText = (status: string | undefined): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    processed: '已处理',
    ignored: '已忽略'
  }
  return statusMap[status] || '待处理'
}

const fetchMonitorStats = async (): Promise<void> => {
  try {
    statsLoading.value = true
    const response = await paymentMonitorApi.getMonitorStats()
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    const result = response?.data || response
    if (result) {
      stats.value = result
    }
  } catch (error: any) {
    console.error('获取监控统计数据失败:', error)
    ElMessage.error(error.response?.data?.message || '获取监控统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

const fetchPaymentRecords = async (useCache = true): Promise<void> => {
  try {
    tableLoading.value = true
    const params = {
      orderNo: searchForm.value.orderNo || undefined,
      paymentMethod: searchForm.value.paymentMethod || undefined,
      status: searchForm.value.status || undefined,
      dateRange: searchForm.value.dateRange?.length === 2 ? searchForm.value.dateRange : undefined,
      page: currentPage.value,
      size: pageSize.value
    }
    
    // 检查缓存
    const cacheKey = getSearchCacheKey(params)
    if (useCache && searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_EXPIRE_TIME) {
        console.log('🚀 使用缓存的搜索结果')
        tableData.value = cached.records
        total.value = cached.total
        // 稍微延迟关闭 loading，提升视觉体验
        setTimeout(() => {
          tableLoading.value = false
        }, 200)
        return
      }
      searchCache.delete(cacheKey)
    }
    
    const response = await paymentMonitorApi.getPaymentRecords(params)
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    const result = response?.data || response
    
    if (result.records) {
      tableData.value = result.records
      total.value = result.total || 0
      
      // 存入缓存
      searchCache.set(cacheKey, {
        records: result.records,
        total: result.total || 0,
        timestamp: Date.now()
      })
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error: any) {
    console.error('获取支付记录列表失败:', error)
    ElMessage.error(error.response?.data?.message || '获取支付记录列表失败')
    tableData.value = []
  } finally {
    tableLoading.value = false
  }
}

const fetchStatusChartData = async (): Promise<void> => {
  try {
    statusChartLoading.value = true
    const response = await paymentMonitorApi.getStatusChartData()
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    const result = response?.data || response
    const chartData = result?.data || result
    
    if (chartData && chartData.length > 0) {
      renderStatusChart(chartData)
    } else {
      renderStatusChart([
        { value: 0, name: '成功', itemStyle: { color: '#67C23A' } },
        { value: 0, name: '失败', itemStyle: { color: '#F56C6C' } },
        { value: 0, name: '处理中', itemStyle: { color: '#E6A23C' } },
        { value: 0, name: '已退款', itemStyle: { color: '#409EFF' } }
      ])
    }
  } catch (error: any) {
    console.error('获取支付状态统计图表数据失败:', error)
    renderStatusChart([
      { value: 0, name: '成功', itemStyle: { color: '#67C23A' } },
      { value: 0, name: '失败', itemStyle: { color: '#F56C6C' } },
      { value: 0, name: '处理中', itemStyle: { color: '#E6A23C' } },
      { value: 0, name: '已退款', itemStyle: { color: '#409EFF' } }
    ])
  } finally {
    statusChartLoading.value = false
  }
}

const fetchMethodChartData = async (): Promise<void> => {
  try {
    methodChartLoading.value = true
    const response = await paymentMonitorApi.getMethodChartData()
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    // 注意：由于返回数据本身包含 data 字段，需要优先检查是否已经是解构后的对象
    let categories: string[] = []
    let counts: number[] = []
    
    if (response?.categories && response?.data) {
      categories = response.categories
      counts = response.data
    } else if (response?.data?.categories && response?.data?.data) {
      categories = response.data.categories
      counts = response.data.data
    }
    
    if (categories.length > 0) {
      renderMethodChart(categories, counts)
    } else {
      renderMethodChart(['支付宝', '微信', '银行卡', '现金'], [0, 0, 0, 0])
    }
  } catch (error: any) {
    console.error('获取支付方式分布图表数据失败:', error)
    renderMethodChart(['支付宝', '微信', '银行卡', '现金'], [0, 0, 0, 0])
  } finally {
    methodChartLoading.value = false
  }
}

const fetchSuccessRateChartData = async (): Promise<void> => {
  try {
    successRateChartLoading.value = true
    const response = await paymentMonitorApi.getSuccessRateChartData(14)
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    const result = response?.data && response?.dates ? response : (response?.data || response)
    
    if (result.dates && result.rates) {
      renderSuccessRateChart(result.dates, result.rates)
    } else {
      renderSuccessRateChart([], [])
    }
  } catch (error: any) {
    console.error('获取支付成功率趋势图表数据失败:', error)
    renderSuccessRateChart([], [])
  } finally {
    successRateChartLoading.value = false
  }
}

const fetchTimeDistributionChartData = async (): Promise<void> => {
  try {
    timeDistributionChartLoading.value = true
    const response = await paymentMonitorApi.getTimeDistributionChartData()
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    // 注意：由于返回数据本身包含 data 字段，需要优先检查是否已经是解构后的对象
    let timeSlots: string[] = []
    let counts: number[] = []
    
    if (response?.timeSlots && response?.data) {
      timeSlots = response.timeSlots
      counts = response.data
    } else if (response?.data?.timeSlots && response?.data?.data) {
      timeSlots = response.data.timeSlots
      counts = response.data.data
    }
    
    if (timeSlots.length > 0) {
      // 数据有效性验证 (规则 4)
      const isValid = Array.isArray(timeSlots) && Array.isArray(counts) && 
                    timeSlots.length > 0 && counts.length === timeSlots.length &&
                    counts.some(v => v > 0)
      
      if (isValid) {
        lastValidTimeDistribution.value = { timeSlots, data: counts }
        // renderTimeDistributionChart 会由 watch 触发，或手动调用
        debouncedRenderTimeDist(timeSlots, counts)
      } else {
        console.warn('⚠️ API 返回的时间分布数据无效，将使用最后一次有效数据')
        if (lastValidTimeDistribution.value.data.some(v => v > 0)) {
          debouncedRenderTimeDist(lastValidTimeDistribution.value.timeSlots, lastValidTimeDistribution.value.data)
        }
      }
    } else {
      // 如果完全没数据且没有缓存，显示默认 0
      renderTimeDistributionChart(
        ['0-2点', '2-4点', '4-6点', '6-8点', '8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点', '20-22点', '22-24点'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      )
    }
  } catch (error: any) {
    console.error('获取支付时间分布图表数据失败:', error)
    // 错误处理：保持 UI 稳定性 (规则 4)
    if (lastValidTimeDistribution.value.data.some(v => v > 0)) {
      debouncedRenderTimeDist(lastValidTimeDistribution.value.timeSlots, lastValidTimeDistribution.value.data)
    } else {
      renderTimeDistributionChart(
        ['0-2点', '2-4点', '4-6点', '6-8点', '8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点', '20-22点', '22-24点'],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      )
    }
  } finally {
    timeDistributionChartLoading.value = false
  }
}

const fetchAllData = async (): Promise<void> => {
  try {
    await Promise.all([
      fetchMonitorStats(),
      fetchPaymentRecords(),
      fetchStatusChartData(),
      fetchMethodChartData(),
      fetchSuccessRateChartData(),
      fetchTimeDistributionChartData()
    ])
    updateLastUpdateTime()
  } catch (error) {
    console.error('获取所有监控数据失败:', error)
  }
}

/**
 * 检查并更新趋势图时间轴 (每小时执行一次)
 */
const checkAndRefreshTrendAxis = (): void => {
  const now = new Date()
  const currentHourTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime()
  
  if (currentHourTimestamp > lastHourlyCheck.value) {
    console.log(`[${now.toLocaleString()}] 触发成功率趋势图时间轴例行更新检查`)
    lastHourlyCheck.value = currentHourTimestamp
    fetchSuccessRateChartData()
  }
}

const updateLastUpdateTime = (): void => {
  const now = new Date()
  lastUpdateTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  // 顺便检查是否需要更新趋势图时间轴 (规则 2: 每小时自动检查时间变化)
  checkAndRefreshTrendAxis()

  // 检查数据延迟 (规则：当数据延迟超过1分钟时显示警告提示)
  // 如果是实时流推送，我们会根据推送的 timestamp 检查
}

/**
 * 初始化 SSE 实时连接
 * (规则：实现WebSocket或Server-Sent Events实时通信机制)
 */
const initRealtimeConnection = (): void => {
  if (eventSource) {
    eventSource.close()
  }

  const token = localStorage.getItem('adminToken')
  if (!token) {
    console.warn('⚠️ 未找到管理员令牌，无法建立实时连接')
    connectionStatus.value = 'disconnected'
    return
  }
  
  // 注意：EventSource 默认不支持 Header，这里通过 URL 参数传递或依靠 Cookie
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
  eventSource = new EventSource(`${baseUrl}/api/admin/payments/monitor/realtime?token=${token}`)

  eventSource.onopen = () => {
    console.log('✅ SSE 实时连接已建立')
    connectionStatus.value = 'connected'
  }

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log('📥 收到实时推送数据:', {
        timestamp: new Date().toLocaleTimeString(),
        stats: data.stats,
        hasStatusDist: !!data.statusDistribution,
        hasMethodDist: !!data.methodDistribution,
        trendPoints: data.trend?.length,
        version: data.version
      })
      
      // 1. 数据版本校验 (规则：避免无效数据覆盖)
      if (data.version && data.version <= dataVersion.value) {
        console.warn('⚠️ 收到过期数据包，已忽略')
        return
      }
      dataVersion.value = data.version || Date.now()

      if (data.stats) {
        // 视觉反馈：如果数据发生变化 (规则 4)
        if (data.stats.todaySuccess !== stats.value.todaySuccess) triggerValueAnimation('todaySuccess')
        if (data.stats.todayFailed !== stats.value.todayFailed) triggerValueAnimation('todayFailed')
        if (data.stats.pendingExceptions !== stats.value.pendingExceptions) triggerValueAnimation('pendingExceptions')
        if (data.stats.todayAmount !== stats.value.todayAmount) triggerValueAnimation('todayAmount')

        stats.value = { ...stats.value, ...data.stats }
        const serverDate = new Date(data.stats.serverTime)
        serverTimeOffset.value = serverDate.getTime() - Date.now()
        isDataDelayed.value = (Date.now() - data.stats.timestamp) > 60000
      }

      // 1.1 支付状态分布更新 (规则 2)
      if (data.statusDistribution && data.statusDistribution.length > 0) {
        renderStatusChart(data.statusDistribution)
      }

      // 1.2 支付方式分布更新 (规则 2)
      if (data.methodDistribution && data.methodDistribution.categories) {
        renderMethodChart(data.methodDistribution.categories, data.methodDistribution.data)
      }

      // 2. 趋势数据合并与异常处理 (规则：当收到新数据包 trend 为空时，保留之前有效的趋势数据)
      if (data.trend && data.trend.length > 0) {
        // 校验数据有效性：是否全为 null
        const hasValidData = data.trend.some((item: any) => item.rate !== null)
        
        if (hasValidData) {
          consecutiveEmptyTrendCount.value = 0
          lastValidTrend.value = data.trend
          processAndRenderTrend(data.trend)
        } else {
          handleEmptyTrend(data)
        }
      } else {
        handleEmptyTrend(data)
      }

      // 3. 支付时间分布数据合并与异常处理 (新需求)
      if (data.timeDistribution) {
        const { timeSlots, data: distData } = data.timeDistribution
        // 数据有效性验证：长度匹配且包含非零值
        const isValid = Array.isArray(timeSlots) && Array.isArray(distData) && 
                      timeSlots.length > 0 && distData.length === timeSlots.length &&
                      distData.some(v => v > 0)
        
        if (isValid) {
          consecutiveEmptyTimeDistCount.value = 0
          lastValidTimeDistribution.value = { timeSlots, data: distData }
          debouncedRenderTimeDist(timeSlots, distData)
        } else {
          handleEmptyTimeDist(data)
        }
      }

      updateLastUpdateTime()
    } catch (error) {
      console.error('解析实时推送数据失败:', error)
    }
  }

  eventSource.onerror = (error) => {
    console.error('❌ SSE 连接错误:', error)
    connectionStatus.value = 'disconnected'
    
    // 错误处理机制 (规则 5)
    ElMessage.error({
      message: '实时连接已断开，正在尝试自动重连。当前显示为最后一次有效数据。',
      duration: 5000
    })
    
    // 延迟重连
    setTimeout(() => {
      if (connectionStatus.value === 'disconnected') {
        console.log('🔄 尝试重新建立实时连接...')
        initRealtimeConnection()
      }
    }, 5000)
  }
}

/**
 * 处理时间分布数据异常分支
 */
const handleEmptyTimeDist = (rawData: any): void => {
  consecutiveEmptyTimeDistCount.value++
  console.warn(`⚠️ 收到空/无效时间分布数据 (第 ${consecutiveEmptyTimeDistCount.value} 次)`, {
    timestamp: Date.now(),
    data: rawData
  })

  // 保持显示当前已有的有效数据 (规则 1)
  if (lastValidTimeDistribution.value.data.some(v => v > 0)) {
    debouncedRenderTimeDist(lastValidTimeDistribution.value.timeSlots, lastValidTimeDistribution.value.data)
  }
}

/**
 * 防抖渲染支付时间分布图
 */
const debouncedRenderTimeDist = debounce((timeSlots: string[], data: number[]) => {
  renderTimeDistributionChart(timeSlots, data)
}, 300)

/**
 * 处理趋势数据异常分支 (规则：空数组时触发异常处理分支，记录数据异常事件)
 */
const handleEmptyTrend = (rawData: any): void => {
  consecutiveEmptyTrendCount.value++
  console.warn(`⚠️ 收到空/无效趋势数据 (第 ${consecutiveEmptyTrendCount.value} 次)`, {
    timestamp: Date.now(),
    data: rawData
  })

  // 数据回退机制 (规则：当连续N次收到空数组时触发告警)
  if (consecutiveEmptyTrendCount.value >= 5) {
    ElMessage.warning('监控趋势数据持续异常，请检查后端服务状态')
  }

  // 维持最后有效数据状态 (规则：维持最后有效数据状态，直到获取到新的有效数据)
  if (lastValidTrend.value.length > 0) {
    processAndRenderTrend(lastValidTrend.value)
  }
}

/**
 * 处理趋势数据补间与渲染 (规则：实现数据补间算法，在数据空缺时自动生成平滑过渡值)
 */
const processAndRenderTrend = (trendData: any[]): void => {
  const startTime = Date.now()
  
  // 补间逻辑：如果 rate 为 null，尝试取前后有效值的平均，或维持前一个值
  const processedData = trendData.map((item, index) => {
    if (item.rate !== null) return item
    
    // 寻找最近的前一个有效值
    let prevValid = 0
    for (let i = index - 1; i >= 0; i--) {
      if (trendData[i].rate !== null) {
        prevValid = trendData[i].rate
        break
      }
    }
    
    return {
      ...item,
      rate: prevValid, // 简单补间：使用前一值
      isInterpolated: true // 标记为补间数据
    }
  })

  const dates = processedData.map(item => item.time)
  const rates = processedData.map(item => item.rate)
  const isInterpolatedFlags = processedData.map(item => item.isInterpolated || false)
  
  renderSuccessRateChart(dates, rates, isInterpolatedFlags)
  
  const endTime = Date.now()
  if (endTime - startTime > 50) {
    console.warn(`⚠️ 趋势数据处理时间过长: ${endTime - startTime}ms`)
  }
}

const initCharts = (): void => {
  nextTick(() => {
    if (statusChartRef.value) {
      statusChart = echarts.init(statusChartRef.value)
      fetchStatusChartData()
    }
    
    if (methodChartRef.value) {
      methodChart = echarts.init(methodChartRef.value)
      fetchMethodChartData()
    }
    
    if (successRateChartRef.value) {
      successRateChart = echarts.init(successRateChartRef.value)
      fetchSuccessRateChartData()
    }
    
    if (timeDistributionChartRef.value) {
      timeDistributionChart = echarts.init(timeDistributionChartRef.value)
      fetchTimeDistributionChartData()
    }
  })
}

/* 
 * 渲染支付状态统计 (饼图)
 */
const renderStatusChart = (data: any[]): void => {
  if (!statusChartRef.value) return
  
  if (!statusChart) {
    statusChart = echarts.init(statusChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: '支付状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data,
        // 动画配置
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDuration: 1000
      }
    ]
  }
  
  statusChart.setOption(option)
}

/*
 * 渲染支付方式分布 (柱状图)
 */
const renderMethodChart = (categories: string[], data: number[]): void => {
  if (!methodChartRef.value) return
  
  if (!methodChart) {
    methodChart = echarts.init(methodChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '支付笔数',
        type: 'bar',
        barWidth: '60%',
        data: data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        },
        // 动画配置
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  }
  
  methodChart.setOption(option)
}

const renderSuccessRateChart = (dates: string[], rates: number[], isInterpolatedFlags: boolean[] = []): void => {
  if (!successRateChart) return
  
  // 确保数据长度一致
  const safeDates = dates || []
  const safeRates = rates || []
  
  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { 
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#67C23A', width: 1, type: 'dashed' }
      },
      formatter: (params: any) => {
        const item = params[0]
        const index = item.dataIndex
        const isInterpolated = isInterpolatedFlags[index]
        return `${item.name}<br/>成功率: <b>${item.value}%</b> ${isInterpolated ? '<span style="color: #E6A23C">(估算)</span>' : ''}`
      }
    },
    legend: { 
      data: ['成功率'],
      right: '4%',
      top: '10'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '40',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: safeDates,
      axisLabel: {
        interval: 0, // 显示所有日期 (15天范围内可容纳)
        rotate: 30,  // 旋转 30 度避免重叠
        color: '#606266',
        fontSize: 11,
        formatter: (value: string) => {
          // 如果是今天，可以特别标注，但按要求统一 YYYY-MM-DD
          return value
        }
      },
      axisLine: { lineStyle: { color: '#DCDFE6' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%',
        color: '#606266'
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#EBEEF5' } },
      min: 0,
      max: 100
    },
    series: [
      {
        name: '成功率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        emphasis: { showSymbol: true },
        data: safeRates.map((val, idx) => {
          return {
            value: val,
            itemStyle: isInterpolatedFlags[idx] ? { opacity: 0.5, color: '#E6A23C' } : { color: '#67C23A' },
            lineStyle: isInterpolatedFlags[idx] ? { type: 'dashed', opacity: 0.5 } : { type: 'solid', width: 3 }
          }
        }),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0)' }
          ])
        }
      }
    ]
  }
  
  successRateChart.setOption(option, { notMerge: false })
}

const renderTimeDistributionChart = (timeSlots: string[], data: number[]): void => {
  if (!timeDistributionChart) return
  
  // 类型检查与有效性验证 (规则 4)
  if (!Array.isArray(timeSlots) || !Array.isArray(data) || timeSlots.length === 0) {
    console.error('❌ 支付时间分布图表数据格式错误:', { timeSlots, data })
    return
  }

  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      axisPointer: { 
        type: 'shadow',
        shadowStyle: { color: 'rgba(64, 158, 255, 0.1)' }
      },
      formatter: (params: any) => {
        const item = params[0]
        return `${item.name}<br/>支付笔数: <b>${item.value}</b>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timeSlots,
      axisLabel: {
        interval: 0,
        rotate: 30,
        color: '#606266'
      },
      axisLine: { lineStyle: { color: '#DCDFE6' } }
    },
    yAxis: { 
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#EBEEF5' } }
    },
    series: [
      {
        name: '支付笔数',
        type: 'bar',
        barWidth: '50%',
        data: data,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#66b1ff' },
            { offset: 1, color: '#409EFF' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#2b85e4' }
            ])
          }
        }
      }
    ]
  }
  
  // 使用平滑过渡效果更新图表 (规则 2)
  timeDistributionChart.setOption(option, { notMerge: false, lazyUpdate: true })
}

const handleRefresh = async (): Promise<void> => {
  console.log('🔄 刷新支付记录 (清除缓存)')
  searchCache.clear()
  await fetchAllData()
  ElMessage.success('刷新成功')
}

const handleExport = async (): Promise<void> => {
  console.log('📤 导出支付记录')
  
  try {
    await ElMessageBox.confirm(
      '确定要导出当前查询条件下的所有支付记录吗？',
      '导出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const params = {
      orderNo: searchForm.value.orderNo || undefined,
      paymentMethod: searchForm.value.paymentMethod || undefined,
      status: searchForm.value.status || undefined,
      dateRange: searchForm.value.dateRange?.length === 2 ? searchForm.value.dateRange : undefined
    }
    
    const blob = await paymentMonitorApi.exportPaymentRecords(params)
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const fileName = `payment_records_${new Date().toISOString().slice(0, 10)}.csv`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('导出支付记录失败:', error)
      ElMessage.error(error.response?.data?.message || '导出支付记录失败')
    }
  }
}

const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return [start, end]
    },
  },
  {
    text: '昨天',
    value: () => {
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setTime(end.getTime() - 3600 * 1000 * 24)
      end.setHours(23, 59, 59, 999)
      return [start, end]
    },
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  }
]

const handleDateRangeChange = (val: [string, string] | null) => {
  if (!val) return
  
  const start = new Date(val[0])
  const end = new Date(val[1])
  
  // 验证开始时间不能晚于结束时间
  if (start > end) {
    ElMessage.warning('开始时间不能晚于结束时间')
    searchForm.value.dateRange = []
    return
  }
  
  // 验证时间范围不能超过3个月
  const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > threeMonthsInMs) {
    ElMessage.warning('查询范围不能超过3个月')
    searchForm.value.dateRange = []
    return
  }
  
  // 验证通过，执行搜索
  handleSearch()
}

const handleSearch = debounce(async (): Promise<void> => {
  console.log('🔍 搜索支付记录:', searchForm.value)
  currentPage.value = 1
  await fetchPaymentRecords()
}, 300)

const handleReset = (): void => {
  searchForm.value = {
    orderNo: '',
    paymentMethod: '',
    status: '',
    dateRange: []
  }
  currentPage.value = 1
  searchCache.clear() // 重置时清除缓存
  fetchPaymentRecords(false) // 强制不使用缓存
  ElMessage.success('重置搜索条件')
}

const handleView = async (row: PaymentRecord): Promise<void> => {
  try {
    const response = await paymentMonitorApi.getPaymentRecordDetail(row.id)
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    detailData.value = response?.data || response
    detailDialogVisible.value = true
  } catch (error: any) {
    console.error('获取支付记录详情失败:', error)
    detailData.value = { ...row }
    detailDialogVisible.value = true
  }
}

const handleMarkException = (row: PaymentRecord): void => {
  currentRow.value = row
  exceptionFormData.value = {
    type: '',
    description: ''
  }
  exceptionDialogVisible.value = true
}

const submitExceptionForm = async (): Promise<void> => {
  if (!currentRow.value) return
  
  try {
    const valid = await exceptionFormRef.value?.validate() ?? true
    if (!valid) return
    
    submittingException.value = true
    markingExceptionId.value = currentRow.value.id
    
    const response = await paymentMonitorApi.markException(currentRow.value.id, {
      type: exceptionFormData.value.type,
      description: exceptionFormData.value.description
    })
    
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    const result = response?.data || response
    
    const index = tableData.value.findIndex(item => item.id === currentRow.value!.id)
    if (index !== -1) {
      tableData.value[index] = {
        ...tableData.value[index],
        isException: result.isException,
        exception: result.exception
      }
    }
    
    exceptionDialogVisible.value = false
    ElMessage.success('异常标记成功')
    
    await fetchMonitorStats()
  } catch (error: any) {
    console.error('标记异常失败:', error)
    ElMessage.error(error.response?.data?.message || '标记异常失败')
  } finally {
    submittingException.value = false
    markingExceptionId.value = null
  }
}

const handleProcessException = async (): Promise<void> => {
  if (!detailData.value.id) return
  
  try {
    processingException.value = true
    
    const response = await paymentMonitorApi.processException(detailData.value.id, {
      status: 'processed',
      remark: '管理员通过监控面板处理'
    })
    
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构 (规则 5)
    const result = response?.data || response
    
    const index = tableData.value.findIndex(item => item.id === detailData.value.id)
    if (index !== -1) {
      tableData.value[index] = {
        ...tableData.value[index],
        exception: result.exception
      }
    }
    
    detailData.value = {
      ...detailData.value,
      exception: result.exception
    }
    
    ElMessage.success('异常处理成功')
    detailDialogVisible.value = false
    
    await fetchMonitorStats()
  } catch (error: any) {
    console.error('处理异常失败:', error)
    ElMessage.error(error.response?.data?.message || '处理异常失败')
  } finally {
    processingException.value = false
  }
}

const handleSizeChange = async (val: number): Promise<void> => {
  pageSize.value = val
  currentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
  await fetchPaymentRecords()
}

const handleCurrentChange = async (val: number): Promise<void> => {
  currentPage.value = val
  console.log(`📄 当前页: ${val}`)
  await fetchPaymentRecords()
}

const handleResize = (): void => {
  if (statusChart) statusChart.resize()
  if (methodChart) methodChart.resize()
  if (successRateChart) successRateChart.resize()
  if (timeDistributionChart) timeDistributionChart.resize()
}

onMounted(() => {
  console.log('💳 支付记录监控页面加载完成')
  initCharts()
  fetchAllData()
  
  // 初始化实时连接 (规则：WebSocket/SSE实时通信机制)
  initRealtimeConnection()
  
  // 设置自动刷新备用机制：每30秒刷新一次 (规则：数据刷新频率设置为每30秒自动更新一次)
  refreshTimer = setInterval(() => {
    console.log('⏱️ 自动刷新监控数据 (备用)...')
    fetchAllData()
  }, 30000)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  // 关闭实时连接
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  
  // 清除定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  // 销毁图表实例
  if (statusChart) statusChart.dispose()
  if (methodChart) methodChart.dispose()
  if (successRateChart) successRateChart.dispose()
  if (timeDistributionChart) timeDistributionChart.dispose()
})

watch(
  () => [statusChartRef.value, methodChartRef.value, successRateChartRef.value, timeDistributionChartRef.value],
  () => {
    if (statusChart) statusChart.resize()
    if (methodChart) methodChart.resize()
    if (successRateChart) successRateChart.resize()
    if (timeDistributionChart) timeDistributionChart.resize()
  },
  { flush: 'post' }
)
</script>

<style scoped>
.payment-record-monitor-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.update-time {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.bg-success {
  background-color: #67C23A;
}

.bg-danger {
  background-color: #F56C6C;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-info {
  background-color: #409EFF;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
.stat-value {
  font-size: 24px;
  font-weight: bold;
  transition: all 0.3s ease;
}

/* 数值更新动画 */
@keyframes valueUpdate {
  0% { transform: scale(1); color: inherit; }
  50% { transform: scale(1.1); color: #409EFF; }
  100% { transform: scale(1); color: inherit; }
}

.stat-value-update {
  animation: valueUpdate 0.5s ease-in-out;
}

.chart-transition {
  transition: all 0.3s ease;
}  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 图表平滑过渡动画 (规则 3) */
.chart-transition {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-loading {
  opacity: 0.6;
  filter: blur(2px);
}
</style>
