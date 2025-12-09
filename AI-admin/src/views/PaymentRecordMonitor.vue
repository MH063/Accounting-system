<template>
  <div class="payment-record-monitor-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>支付记录监控</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <!-- 实时监控面板 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><SuccessFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日成功支付</div>
                <div class="stat-value">{{ stats.todaySuccess }}</div>
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
                <div class="stat-value">{{ stats.todayFailed }}</div>
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
                <div class="stat-value">{{ stats.pendingExceptions }}</div>
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
                <div class="stat-value">¥{{ stats.todayAmount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 统计分析面板 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>支付状态统计</span>
            </template>
            <div ref="statusChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>支付方式分布</span>
            </template>
            <div ref="methodChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 成功率监控 -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <span>支付成功率趋势</span>
        </template>
        <div ref="successRateChartRef" style="height: 300px;"></div>
      </el-card>
      
      <!-- 时间分布分析 -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <span>支付时间分布</span>
        </template>
        <div ref="timeDistributionChartRef" style="height: 300px;"></div>
      </el-card>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="订单号">
            <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable />
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
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 支付记录表格 -->
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户姓名" />
        <el-table-column prop="amount" label="金额(元)" />
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
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
            <el-button size="small" type="warning" @click="handleMarkException(scope.row)" v-if="!scope.row.isException">标记异常</el-button>
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
    
    <!-- 支付详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="支付详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户姓名">{{ detailData.userName }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ detailData.amount }} 元</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPaymentMethodText(detailData.paymentMethod) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ detailData.completeTime || '未完成' }}</el-descriptions-item>
        <el-descriptions-item label="商户订单号">{{ detailData.merchantOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="支付流水号">{{ detailData.transactionNo }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <el-descriptions title="异常信息" :column="1" v-if="detailData.exception || detailData.isException">
        <el-descriptions-item label="异常类型">{{ detailData.exception?.type || '手动标记' }}</el-descriptions-item>
        <el-descriptions-item label="异常描述">{{ detailData.exception?.description || '用户手动标记为异常' }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">{{ detailData.exception?.status || '待处理' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detailData.exception?.handler || '未处理' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ detailData.exception?.handleTime || '未处理' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleProcessException" v-if="(detailData.exception && detailData.exception.status === 'pending') || detailData.isException">处理异常</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 标记异常对话框 -->
    <el-dialog v-model="exceptionDialogVisible" title="标记异常" width="500px">
      <el-form :model="exceptionFormData" label-width="100px">
        <el-form-item label="异常类型">
          <el-select v-model="exceptionFormData.type" placeholder="请选择异常类型">
            <el-option label="支付超时" value="timeout" />
            <el-option label="金额不符" value="amount_mismatch" />
            <el-option label="重复支付" value="duplicate" />
            <el-option label="用户投诉" value="complaint" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="异常描述">
          <el-input v-model="exceptionFormData.description" type="textarea" placeholder="请输入异常描述" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exceptionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitExceptionForm">确定标记</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SuccessFilled, CircleCloseFilled, Warning, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 异常信息接口
interface ExceptionInfo {
  type: string
  description: string
  status: string
  handler: string
  handleTime: string
}

// 支付记录接口
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
  isException: boolean // 新增字段用于标记异常
}

// 图表引用
const statusChartRef = ref()
const methodChartRef = ref()
const successRateChartRef = ref()
const timeDistributionChartRef = ref()

// 图表实例
let statusChart: any = null
let methodChart: any = null
let successRateChart: any = null
let timeDistributionChart: any = null

// 响应式数据
const stats = ref({
  todaySuccess: 128,
  todayFailed: 3,
  pendingExceptions: 2,
  todayAmount: 25680.50
})

const tableData = ref<PaymentRecord[]>([
  {
    id: 1,
    orderNo: 'PAY202310150001',
    userName: '张三',
    amount: 1200.00,
    paymentMethod: 'alipay',
    status: 'success',
    createTime: '2023-10-15 10:30:25',
    completeTime: '2023-10-15 10:30:30',
    merchantOrderNo: 'M202310150001',
    transactionNo: 'T202310150001ALI',
    remark: '住宿费',
    exception: null,
    isException: false
  },
  {
    id: 2,
    orderNo: 'PAY202310150002',
    userName: '李四',
    amount: 150.50,
    paymentMethod: 'wechat',
    status: 'failed',
    createTime: '2023-10-15 11:15:42',
    completeTime: null,
    merchantOrderNo: 'M202310150002',
    transactionNo: null,
    remark: '水电费',
    exception: {
      type: '支付超时',
      description: '用户支付超时，订单自动关闭',
      status: 'processed',
      handler: '系统自动处理',
      handleTime: '2023-10-15 11:20:42'
    },
    isException: true
  },
  {
    id: 3,
    orderNo: 'PAY202310150003',
    userName: '王五',
    amount: 80.00,
    paymentMethod: 'bank',
    status: 'processing',
    createTime: '2023-10-15 14:22:18',
    completeTime: null,
    merchantOrderNo: 'M202310150003',
    transactionNo: null,
    remark: '网费',
    exception: null,
    isException: false
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10) // 按照分页设置规范，默认值为10
const total = ref(100)

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
  type: 'timeout',
  description: ''
})

const currentRow = ref<PaymentRecord | null>(null)

// 获取支付方式文本
const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'alipay':
      return '支付宝'
    case 'wechat':
      return '微信'
    case 'bank':
      return '银行卡'
    case 'cash':
      return '现金'
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    case 'refunded':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'processing':
      return '处理中'
    case 'refunded':
      return '已退款'
    default:
      return '未知'
  }
}

// 初始化图表
const initCharts = () => {
  // 确保DOM已经渲染
  nextTick(() => {
    if (statusChartRef.value) {
      statusChart = echarts.init(statusChartRef.value)
      renderStatusChart()
    }
    
    if (methodChartRef.value) {
      methodChart = echarts.init(methodChartRef.value)
      renderMethodChart()
    }
    
    if (successRateChartRef.value) {
      successRateChart = echarts.init(successRateChartRef.value)
      renderSuccessRateChart()
    }
    
    if (timeDistributionChartRef.value) {
      timeDistributionChart = echarts.init(timeDistributionChartRef.value)
      renderTimeDistributionChart()
    }
  })
}

// 渲染支付状态统计图表
const renderStatusChart = () => {
  if (!statusChart) return
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
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
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: '成功', itemStyle: { color: '#67C23A' } },
          { value: 735, name: '失败', itemStyle: { color: '#F56C6C' } },
          { value: 580, name: '处理中', itemStyle: { color: '#E6A23C' } },
          { value: 484, name: '已退款', itemStyle: { color: '#409EFF' } }
        ]
      }
    ]
  }
  
  statusChart.setOption(option)
}

// 渲染支付方式分布图表
const renderMethodChart = () => {
  if (!methodChart) return
  
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
    xAxis: [
      {
        type: 'category',
        data: ['支付宝', '微信', '银行卡', '现金'],
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '支付笔数',
        type: 'bar',
        barWidth: '60%',
        data: [1048, 735, 580, 320],
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
        }
      }
    ]
  }
  
  methodChart.setOption(option)
}

// 渲染支付成功率趋势图表
const renderSuccessRateChart = () => {
  if (!successRateChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['成功率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07', '10-08', '10-09', '10-10', '10-11', '10-12', '10-13', '10-14', '10-15']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} %'
      }
    },
    series: [
      {
        name: '成功率',
        type: 'line',
        data: [98.2, 97.8, 98.5, 99.1, 97.9, 98.3, 98.7, 99.0, 98.6, 98.1, 98.4, 98.8, 99.2, 98.9, 98.5],
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(103, 194, 58, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(103, 194, 58, 0.1)'
            }
          ])
        }
      }
    ]
  }
  
  successRateChart.setOption(option)
}

// 渲染支付时间分布图表
const renderTimeDistributionChart = () => {
  if (!timeDistributionChart) return
  
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
      data: ['0-2点', '2-4点', '4-6点', '6-8点', '8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点', '20-22点', '22-24点']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '支付笔数',
        type: 'bar',
        barWidth: '60%',
        data: [12, 8, 15, 45, 89, 120, 135, 110, 95, 150, 180, 90],
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  
  timeDistributionChart.setOption(option)
}

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新支付记录')
  ElMessage.success('刷新成功')
  // 重新渲染图表
  renderAllCharts()
}

// 重新渲染所有图表
const renderAllCharts = () => {
  renderStatusChart()
  renderMethodChart()
  renderSuccessRateChart()
  renderTimeDistributionChart()
}

// 导出
const handleExport = () => {
  console.log('📤 导出支付记录')
  ElMessageBox.confirm('确定要导出当前查询条件下的所有支付记录吗？', '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟导出过程
    ElMessage.success('支付记录导出成功')
  }).catch(() => {
    // 取消导出
  })
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索支付记录:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    orderNo: '',
    paymentMethod: '',
    status: '',
    dateRange: []
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 标记异常
const handleMarkException = (row: PaymentRecord) => {
  currentRow.value = row
  exceptionFormData.value = {
    type: '',
    description: ''
  }
  exceptionDialogVisible.value = true
}

// 提交异常标记
const submitExceptionForm = () => {
  if (!currentRow.value) return
  
  // 更新行数据
  const index = tableData.value.findIndex(item => item.id === currentRow.value!.id)
  if (index !== -1) {
    tableData.value[index].isException = true
    tableData.value[index].exception = {
      type: exceptionFormData.value.type || 'manual',
      description: exceptionFormData.value.description || '手动标记异常',
      status: 'pending',
      handler: '',
      handleTime: ''
    }
  }
  
  exceptionDialogVisible.value = false
  ElMessage.success('异常标记成功')
}

// 处理异常
const handleProcessException = () => {
  console.log('🔧 处理异常:', detailData.value)
  
  // 更新行数据
  const index = tableData.value.findIndex(item => item.id === detailData.value.id)
  if (index !== -1) {
    const existingException = tableData.value[index].exception;
    tableData.value[index].exception = {
      type: existingException?.type || 'unknown',
      description: existingException?.description || '未指定',
      status: 'processed',
      handler: '管理员',
      handleTime: new Date().toLocaleString()
    }
  }
  
  ElMessage.success('异常处理成功')
  detailDialogVisible.value = false
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log(`📄 当前页: ${val}`)
}

// 组件挂载
onMounted(() => {
  console.log('💳 支付记录监控页面加载完成')
  initCharts()
})

// 监听窗口大小变化，重新渲染图表
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

/**
 * 支付记录监控页面
 * 实时监控支付记录状态和异常情况
 */
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
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>