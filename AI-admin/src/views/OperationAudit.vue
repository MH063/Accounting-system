<template>
  <div class="operation-audit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作审计</span>
          <el-button type="primary" @click="handleExport">导出</el-button>
        </div>
      </template>
      
      <!-- 审计统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日操作数</div>
                <div class="stat-value">{{ stats.todayOperations }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">活跃用户数</div>
                <div class="stat-value">{{ stats.activeUsers }}</div>
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
                <div class="stat-title">异常操作数</div>
                <div class="stat-value">{{ stats.abnormalOperations }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><DataLine /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">操作覆盖率</div>
                <div class="stat-value">{{ stats.coverageRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="操作用户">
            <el-input v-model="searchForm.user" placeholder="请输入用户名" clearable />
          </el-form-item>
          
          <el-form-item label="操作类型">
            <el-select v-model="searchForm.operationType" placeholder="请选择操作类型" clearable>
              <el-option label="新增" value="create" />
              <el-option label="修改" value="update" />
              <el-option label="删除" value="delete" />
              <el-option label="查询" value="query" />
              <el-option label="导出" value="export" />
              <el-option label="登录" value="login" />
              <el-option label="登出" value="logout" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="操作模块">
            <el-select v-model="searchForm.module" placeholder="请选择操作模块" clearable>
              <el-option label="用户管理" value="user" />
              <el-option label="寝室管理" value="dormitory" />
              <el-option label="费用管理" value="fee" />
              <el-option label="支付管理" value="payment" />
              <el-option label="系统配置" value="system" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="操作结果">
            <el-select v-model="searchForm.result" placeholder="请选择操作结果" clearable>
              <el-option label="成功" value="success" />
              <el-option label="失败" value="fail" />
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
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 异常行为检测 -->
      <el-card style="margin-bottom: 20px;">
        <template #header>
          <span>异常行为检测</span>
        </template>
        <el-table :data="abnormalBehaviors" style="width: 100%" v-loading="abnormalLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="user" label="操作用户" width="120" />
          <el-table-column prop="behaviorType" label="异常类型" width="120">
            <template #default="scope">
              <el-tag type="danger">{{ getAbnormalTypeText(scope.row.behaviorType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="异常描述" />
          <el-table-column prop="operateTime" label="发生时间" width="160" />
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="scope">
              <el-tag :type="getRiskLevelTagType(scope.row.riskLevel)">
                {{ getRiskLevelText(scope.row.riskLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleViewAbnormal(scope.row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 统计分析图表 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>操作类型分布</span>
            </template>
            <div ref="operationTypeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>模块分布</span>
            </template>
            <div ref="moduleChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>操作结果统计</span>
            </template>
            <div ref="resultChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>用户操作频次</span>
            </template>
            <div ref="userFrequencyChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 操作审计列表 -->
      <el-table :data="auditList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user" label="操作用户" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="scope">
            {{ getOperationTypeText(scope.row.operationType) }}
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="120">
          <template #default="scope">
            {{ getModuleText(scope.row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column prop="operateTime" label="操作时间" width="160" />
        <el-table-column prop="result" label="操作结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'">
              {{ scope.row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关键行为" width="100">
          <template #default="scope">
            <el-tag v-if="isCriticalOperation(scope.row)" type="warning">关键</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 操作详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="操作详情" width="800px">
      <el-tabs v-model="activeDetailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="操作ID">{{ detailData.id }}</el-descriptions-item>
            <el-descriptions-item label="操作用户">{{ detailData.user }}</el-descriptions-item>
            <el-descriptions-item label="操作类型">{{ getOperationTypeText(detailData.operationType) }}</el-descriptions-item>
            <el-descriptions-item label="操作模块">{{ getModuleText(detailData.module) }}</el-descriptions-item>
            <el-descriptions-item label="操作描述" :span="2">{{ detailData.description }}</el-descriptions-item>
            <el-descriptions-item label="IP地址">{{ detailData.ipAddress }}</el-descriptions-item>
            <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
            <el-descriptions-item label="操作系统">{{ detailData.os }}</el-descriptions-item>
            <el-descriptions-item label="操作时间">{{ detailData.operateTime }}</el-descriptions-item>
            <el-descriptions-item label="操作结果">
              <el-tag :type="detailData.result === 'success' ? 'success' : 'danger'">
                {{ detailData.result === 'success' ? '成功' : '失败' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="耗时">{{ detailData.duration }}ms</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="请求详情" name="request">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="请求参数">
              <pre class="code-block">{{ detailData.requestParams }}</pre>
            </el-descriptions-item>
            <el-descriptions-item label="响应结果">
              <pre class="code-block">{{ detailData.responseResult }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="操作链追踪" name="trace">
          <el-table :data="operationTrace" style="width: 100%">
            <el-table-column prop="sequence" label="序号" width="60" />
            <el-table-column prop="time" label="时间" width="160" />
            <el-table-column prop="operation" label="操作" />
            <el-table-column prop="ip" label="IP地址" width="130" />
            <el-table-column prop="result" label="结果" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'">
                  {{ scope.row.result === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, Warning, DataLine } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const stats = ref({
  todayOperations: 1245,
  activeUsers: 86,
  abnormalOperations: 3,
  coverageRate: 92.5
})

// 图表引用
const operationTypeChartRef = ref()
const moduleChartRef = ref()
const resultChartRef = ref()
const userFrequencyChartRef = ref()

// 图表实例
let operationTypeChart: echarts.ECharts
let moduleChart: echarts.ECharts
let resultChart: echarts.ECharts
let userFrequencyChart: echarts.ECharts

const auditList = ref([
  {
    id: 1,
    user: '张三',
    operationType: 'create',
    module: 'user',
    description: '新增用户李四',
    ipAddress: '192.168.1.100',
    browser: 'Chrome 95.0.4638.69',
    os: 'Windows 10',
    operateTime: '2023-11-01 10:35:18',
    result: 'success',
    duration: 120,
    requestParams: '{\n  "name": "李四",\n  "age": 25,\n  "role": "user"\n}',
    responseResult: '{\n  "code": 200,\n  "message": "操作成功",\n  "data": {\n    "id": 1001\n  }\n}'
  },
  {
    id: 2,
    user: '李四',
    operationType: 'query',
    module: 'dormitory',
    description: '查询寝室分配情况',
    ipAddress: '192.168.1.101',
    browser: 'Firefox 94.0',
    os: 'macOS 12.0',
    operateTime: '2023-11-01 10:32:45',
    result: 'success',
    duration: 85,
    requestParams: '{\n  "building": "A栋",\n  "floor": 3\n}',
    responseResult: '{\n  "code": 200,\n  "message": "操作成功",\n  "data": [...]\n}'
  },
  {
    id: 3,
    user: '王五',
    operationType: 'update',
    module: 'fee',
    description: '修改费用类型配置',
    ipAddress: '192.168.1.102',
    browser: 'Safari 15.0',
    os: 'iOS 15',
    operateTime: '2023-11-01 10:30:12',
    result: 'fail',
    duration: 0,
    requestParams: '{\n  "id": 5,\n  "name": "网费",\n  "amount": 60\n}',
    responseResult: '{\n  "code": 500,\n  "message": "权限不足"\n}'
  },
  {
    id: 4,
    user: '赵六',
    operationType: 'login',
    module: 'system',
    description: '用户登录系统',
    ipAddress: '192.168.1.103',
    browser: 'Edge 95.0.1020.44',
    os: 'Windows 11',
    operateTime: '2023-11-01 09:45:33',
    result: 'success',
    duration: 320,
    requestParams: '{\n  "username": "zhaoliu",\n  "password": "******"\n}',
    responseResult: '{\n  "code": 200,\n  "message": "登录成功",\n  "data": {...}\n}'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  user: '',
  operationType: '',
  module: '',
  result: '',
  dateRange: []
})

const detailDialogVisible = ref(false)

const detailData = ref({
  id: 0,
  user: '',
  operationType: '',
  module: '',
  description: '',
  ipAddress: '',
  browser: '',
  os: '',
  operateTime: '',
  result: '',
  duration: 0,
  requestParams: '',
  responseResult: ''
})

const activeDetailTab = ref('basic')

// 操作链追踪数据
const operationTrace = ref([
  {
    sequence: 1,
    time: '2023-11-01 10:35:10',
    operation: '用户登录',
    ip: '192.168.1.100',
    result: 'success'
  },
  {
    sequence: 2,
    time: '2023-11-01 10:35:15',
    operation: '访问用户管理页面',
    ip: '192.168.1.100',
    result: 'success'
  },
  {
    sequence: 3,
    time: '2023-11-01 10:35:18',
    operation: '新增用户李四',
    ip: '192.168.1.100',
    result: 'success'
  }
])

// 异常行为数据
const abnormalBehaviors = ref([
  {
    id: 1,
    user: '张三',
    behaviorType: 'frequent_login',
    description: '10分钟内登录失败5次',
    operateTime: '2023-11-01 10:35:18',
    riskLevel: 'high'
  },
  {
    id: 2,
    user: '李四',
    behaviorType: 'abnormal_export',
    description: '非工作时间大量导出用户数据',
    operateTime: '2023-11-01 02:15:33',
    riskLevel: 'critical'
  },
  {
    id: 3,
    user: '王五',
    behaviorType: 'sensitive_operation',
    description: '频繁修改系统配置参数',
    operateTime: '2023-11-01 14:22:45',
    riskLevel: 'medium'
  }
])

const abnormalLoading = ref(false)

// 获取操作类型文本
const getOperationTypeText = (type: string) => {
  switch (type) {
    case 'create':
      return '新增'
    case 'update':
      return '修改'
    case 'delete':
      return '删除'
    case 'query':
      return '查询'
    case 'export':
      return '导出'
    case 'login':
      return '登录'
    case 'logout':
      return '登出'
    default:
      return '未知'
  }
}

// 获取模块文本
const getModuleText = (module: string) => {
  switch (module) {
    case 'user':
      return '用户管理'
    case 'dormitory':
      return '寝室管理'
    case 'fee':
      return '费用管理'
    case 'payment':
      return '支付管理'
    case 'system':
      return '系统配置'
    default:
      return '未知'
  }
}

// 获取异常类型文本
const getAbnormalTypeText = (type: string) => {
  switch (type) {
    case 'frequent_login':
      return '频繁登录'
    case 'abnormal_export':
      return '异常导出'
    case 'sensitive_operation':
      return '敏感操作'
    case 'mass_operation':
      return '批量操作'
    default:
      return '未知'
  }
}

// 获取风险等级文本
const getRiskLevelText = (level: string) => {
  switch (level) {
    case 'low':
      return '低风险'
    case 'medium':
      return '中风险'
    case 'high':
      return '高风险'
    case 'critical':
      return '严重'
    default:
      return '未知'
  }
}

// 获取风险等级标签类型
const getRiskLevelTagType = (level: string) => {
  switch (level) {
    case 'low':
      return 'info'
    case 'medium':
      return ''
    case 'high':
      return 'warning'
    case 'critical':
      return 'danger'
    default:
      return 'info'
  }
}

// 判断是否为关键操作
const isCriticalOperation = (row: any) => {
  // 关键操作类型：删除、导出、系统配置修改
  if (row.operationType === 'delete' || row.operationType === 'export') {
    return true
  }
  
  // 关键模块：系统配置
  if (row.module === 'system') {
    return true
  }
  
  // 关键用户操作：管理员操作
  if (row.user === 'admin' || row.user === 'administrator') {
    return true
  }
  
  return false
}

// 导出
const handleExport = () => {
  console.log('📤 导出操作审计数据')
  ElMessage.success('导出功能待实现')
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索操作审计:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    user: '',
    operationType: '',
    module: '',
    result: '',
    dateRange: []
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 查看异常行为详情
const handleViewAbnormal = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
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

// 初始化图表
const initCharts = () => {
  // 操作类型分布图
  operationTypeChart = echarts.init(operationTypeChartRef.value)
  operationTypeChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 'bottom'
    },
    series: [
      {
        name: '操作类型分布',
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
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '新增' },
          { value: 28, name: '修改' },
          { value: 15, name: '删除' },
          { value: 42, name: '查询' },
          { value: 8, name: '导出' },
          { value: 25, name: '登录' }
        ]
      }
    ]
  })
  
  // 模块分布图
  moduleChart = echarts.init(moduleChartRef.value)
  moduleChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 'bottom'
    },
    series: [
      {
        name: '模块分布',
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
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 45, name: '用户管理' },
          { value: 32, name: '寝室管理' },
          { value: 28, name: '费用管理' },
          { value: 18, name: '支付管理' },
          { value: 12, name: '系统配置' }
        ]
      }
    ]
  })
  
  // 操作结果统计图
  resultChart = echarts.init(resultChartRef.value)
  resultChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['成功', '失败']
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      name: '操作次数'
    },
    series: [
      {
        name: '成功',
        type: 'bar',
        stack: '总量',
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '失败',
        type: 'bar',
        stack: '总量',
        data: [2, 3, 1, 4, 2, 3, 1],
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  })
  
  // 用户操作频次图
  userFrequencyChart = echarts.init(userFrequencyChartRef.value)
  userFrequencyChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['操作频次']
    },
    xAxis: {
      type: 'category',
      data: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
    },
    yAxis: {
      type: 'value',
      name: '操作次数'
    },
    series: [
      {
        name: '操作频次',
        type: 'bar',
        data: [45, 38, 32, 28, 25, 22, 18, 15],
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  })
}

// 窗口大小变更处理
const handleResize = () => {
  if (operationTypeChart) operationTypeChart.resize()
  if (moduleChart) moduleChart.resize()
  if (resultChart) resultChart.resize()
  if (userFrequencyChart) userFrequencyChart.resize()
}

// 组件挂载
onMounted(() => {
  console.log('📋 操作审计页面加载完成')
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 组件卸载前
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (operationTypeChart) operationTypeChart.dispose()
  if (moduleChart) moduleChart.dispose()
  if (resultChart) resultChart.dispose()
  if (userFrequencyChart) userFrequencyChart.dispose()
})

/**
 * 操作审计页面
 * 记录和展示用户操作行为
 */
</script>

<style scoped>
.operation-audit-container {
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

.bg-primary {
  background-color: #409EFF;
}

.bg-success {
  background-color: #67C23A;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-info {
  background-color: #909399;
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

.code-block {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}
</style>