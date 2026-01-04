<template>
  <div class="gray-release-control-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>灰度发布控制</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleCreate">创建灰度策略</el-button>
          </div>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以管理灰度发布策略，动态调整发布比例，监控发布效果"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 灰度策略列表 -->
      <el-table :data="strategyList" style="width: 100%" row-key="id">
        <el-table-column prop="featureName" label="功能名称" width="150" />
        <el-table-column prop="description" label="策略描述" />
        <el-table-column prop="currentPercentage" label="当前比例" width="100">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.currentPercentage" 
              :status="getProgressStatus(scope.row.currentPercentage)" 
            />
          </template>
        </el-table-column>
        <el-table-column prop="targetPercentage" label="目标比例" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStrategyStatusType(scope.row.status)">
              {{ getStrategyStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleStart(scope.row)" 
              :disabled="scope.row.status === 'running'"
            >
              启动
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handlePause(scope.row)" 
              :disabled="scope.row.status !== 'running'"
            >
              暂停
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 创建/编辑灰度策略对话框 -->
    <el-dialog 
      v-model="strategyDialogVisible" 
      :title="editingStrategy ? '编辑灰度策略' : '创建灰度策略'" 
      width="600px"
    >
      <el-form :model="strategyForm" label-width="120px">
        <el-form-item label="关联功能" required>
          <el-select v-model="strategyForm.featureId" placeholder="请选择关联功能" style="width: 100%;">
            <el-option 
              v-for="feature in availableFeatures" 
              :key="feature.id" 
              :label="feature.name" 
              :value="feature.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="策略描述" required>
          <el-input 
            v-model="strategyForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入策略描述" 
          />
        </el-form-item>
        
        <el-form-item label="初始发布比例">
          <el-slider 
            v-model="strategyForm.initialPercentage" 
            :min="0" 
            :max="100" 
            show-input 
            style="width: 100%;" 
          />
          <div class="form-tip">策略启动时的初始用户百分比</div>
        </el-form-item>
        
        <el-form-item label="目标发布比例">
          <el-slider 
            v-model="strategyForm.targetPercentage" 
            :min="0" 
            :max="100" 
            show-input 
            style="width: 100%;" 
          />
          <div class="form-tip">策略完成时的目标用户百分比</div>
        </el-form-item>
        
        <el-form-item label="自动扩容">
          <el-switch
            v-model="strategyForm.autoScale"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">根据监控指标自动调整发布比例</div>
        </el-form-item>
        
        <el-form-item label="自动回滚">
          <el-switch
            v-model="strategyForm.autoRollback"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">当监控指标异常时自动回滚</div>
        </el-form-item>
        
        <el-form-item label="监控指标阈值">
          <el-input 
            v-model="strategyForm.monitorThreshold" 
            placeholder="请输入监控指标阈值" 
          />
          <div class="form-tip">触发自动回滚的监控指标阈值</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="strategyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStrategy">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 调整发布比例对话框 -->
    <el-dialog v-model="adjustDialogVisible" title="调整发布比例" width="500px">
      <el-form :model="adjustForm" label-width="120px">
        <el-form-item label="功能名称">
          {{ adjustForm.featureName }}
        </el-form-item>
        
        <el-form-item label="当前比例">
          {{ adjustForm.currentPercentage }}%
        </el-form-item>
        
        <el-form-item label="调整至">
          <el-slider 
            v-model="adjustForm.targetPercentage" 
            :min="0" 
            :max="100" 
            show-input 
            style="width: 100%;" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adjustDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="executeAdjust">确定调整</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 监控面板 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>实时监控</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <div ref="performanceChartRef" style="height: 300px;"></div>
        </el-col>
        <el-col :span="8">
          <div ref="errorRateChartRef" style="height: 300px;"></div>
        </el-col>
        <el-col :span="8">
          <div ref="userFeedbackChartRef" style="height: 300px;"></div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { grayReleaseControlApi } from '@/api/grayReleaseControl'

// 定义灰度策略类型
interface GrayReleaseStrategy {
  id: number
  featureId: number
  featureName: string
  description: string
  initialPercentage: number
  currentPercentage: number
  targetPercentage: number
  status: string
  autoScale: boolean
  autoRollback: boolean
  monitorThreshold: string
}

// 定义可用功能类型
interface AvailableFeature {
  id: number
  name: string
}

// 图表引用
const performanceChartRef = ref()
const errorRateChartRef = ref()
const userFeedbackChartRef = ref()

// 图表实例
let performanceChart: any = null
let errorRateChart: any = null
let userFeedbackChart: any = null

// 响应式数据
const strategyList = ref<GrayReleaseStrategy[]>([])

const strategyDialogVisible = ref(false)
const adjustDialogVisible = ref(false)

const editingStrategy = ref<GrayReleaseStrategy | null>(null)

const availableFeatures = ref<AvailableFeature[]>([
  { id: 1, name: '用户管理' },
  { id: 2, name: '寝室管理' },
  { id: 3, name: '费用管理' },
  { id: 4, name: '支付管理' },
  { id: 5, name: '系统配置' },
  { id: 6, name: '客户端功能' }
])

const strategyForm = ref({
  featureId: 1,
  description: '',
  initialPercentage: 10,
  targetPercentage: 100,
  autoScale: true,
  autoRollback: true,
  monitorThreshold: '95%'
})

const adjustForm = ref({
  strategyId: 0,
  featureName: '',
  currentPercentage: 0,
  targetPercentage: 0
})

// 获取进度条状态
const getProgressStatus = (percentage: number) => {
  if (percentage < 30) return ''
  if (percentage < 70) return 'warning'
  return 'success'
}

// 获取策略状态类型
const getStrategyStatusType = (status: string) => {
  switch (status) {
    case 'draft':
      return 'info'
    case 'running':
      return 'success'
    case 'paused':
      return 'warning'
    case 'completed':
      return 'info'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取策略状态文本
const getStrategyStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'running':
      return '运行中'
    case 'paused':
      return '已暂停'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

// 获取灰度策略列表
const fetchGrayReleaseStrategies = async () => {
  try {
    const res: any = await grayReleaseControlApi.getGrayReleaseStrategies()
    strategyList.value = res.map((item: any) => ({
      id: item.id,
      featureId: item.featureId,
      featureName: item.featureName || '未知功能',
      description: item.description,
      initialPercentage: item.initialPercentage || 0,
      currentPercentage: item.currentPercentage || 0,
      targetPercentage: item.targetPercentage || 100,
      status: item.status || 'draft',
      autoScale: item.autoScale || false,
      autoRollback: item.autoRollback || false,
      monitorThreshold: item.monitorThreshold || '95%'
    }))
  } catch (error) {
    console.error('获取灰度策略列表失败:', error)
    ElMessage.error('获取灰度策略列表失败')
  }
}

// 创建灰度策略
const handleCreate = () => {
  editingStrategy.value = null
  strategyForm.value = {
    featureId: 1,
    description: '',
    initialPercentage: 10,
    targetPercentage: 100,
    autoScale: true,
    autoRollback: true,
    monitorThreshold: '95%'
  }
  strategyDialogVisible.value = true
}

// 编辑灰度策略
const handleEdit = (row: GrayReleaseStrategy) => {
  editingStrategy.value = row
  strategyForm.value = {
    featureId: row.featureId,
    description: row.description,
    initialPercentage: row.initialPercentage,
    targetPercentage: row.targetPercentage,
    autoScale: row.autoScale,
    autoRollback: row.autoRollback,
    monitorThreshold: row.monitorThreshold
  }
  strategyDialogVisible.value = true
}

// 保存灰度策略
const saveStrategy = async () => {
  try {
    if (editingStrategy.value) {
      // 更新策略
      await grayReleaseControlApi.updateGrayReleaseStrategy(editingStrategy.value.id, strategyForm.value)
      ElMessage.success('策略更新成功')
    } else {
      // 创建策略
      await grayReleaseControlApi.createGrayReleaseStrategy(strategyForm.value)
      ElMessage.success('策略创建成功')
    }
    
    strategyDialogVisible.value = false
    await fetchGrayReleaseStrategies()
  } catch (error) {
    console.error('保存策略失败:', error)
    ElMessage.error('保存策略失败')
  }
}

// 启动灰度策略
const handleStart = async (row: GrayReleaseStrategy) => {
  try {
    await grayReleaseControlApi.startGrayReleaseStrategy(row.id)
    ElMessage.success('策略启动成功')
    await fetchGrayReleaseStrategies()
  } catch (error) {
    console.error('策略启动失败:', error)
    ElMessage.error('策略启动失败')
  }
}

// 暂停灰度策略
const handlePause = async (row: GrayReleaseStrategy) => {
  try {
    await grayReleaseControlApi.pauseGrayReleaseStrategy(row.id)
    ElMessage.success('策略暂停成功')
    await fetchGrayReleaseStrategies()
  } catch (error) {
    console.error('策略暂停失败:', error)
    ElMessage.error('策略暂停失败')
  }
}

// 删除策略
const handleDelete = (row: GrayReleaseStrategy) => {
  ElMessageBox.confirm(
    `确定要删除"${row.featureName}"的灰度策略吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await grayReleaseControlApi.deleteGrayReleaseStrategy(row.id)
      ElMessage.success('策略删除成功')
      await fetchGrayReleaseStrategies()
    } catch (error) {
      console.error('策略删除失败:', error)
      ElMessage.error('策略删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 调整发布比例
const handleAdjust = (row: GrayReleaseStrategy) => {
  adjustForm.value = {
    strategyId: row.id,
    featureName: row.featureName,
    currentPercentage: row.currentPercentage,
    targetPercentage: row.currentPercentage
  }
  adjustDialogVisible.value = true
}

// 执行调整
const executeAdjust = async () => {
  try {
    await grayReleaseControlApi.manualAdjustPercentage(
      adjustForm.value.strategyId, 
      adjustForm.value.targetPercentage
    )
    ElMessage.success('发布比例调整成功')
    adjustDialogVisible.value = false
    await fetchGrayReleaseStrategies()
  } catch (error) {
    console.error('发布比例调整失败:', error)
    ElMessage.error('发布比例调整失败')
  }
}

// 刷新
const handleRefresh = async () => {
  try {
    await fetchGrayReleaseStrategies()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  }
}

// 初始化监控图表
const initMonitoringCharts = () => {
  if (performanceChartRef.value) {
    performanceChart = echarts.init(performanceChartRef.value)
    renderPerformanceChart()
  }
  
  if (errorRateChartRef.value) {
    errorRateChart = echarts.init(errorRateChartRef.value)
    renderErrorRateChart()
  }
  
  if (userFeedbackChartRef.value) {
    userFeedbackChart = echarts.init(userFeedbackChartRef.value)
    renderUserFeedbackChart()
  }
}

// 渲染性能图表
const renderPerformanceChart = () => {
  if (!performanceChart) return
  
  const option = {
    title: {
      text: '性能指标'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#409EFF'
      }
    }]
  }
  
  performanceChart.setOption(option)
}

// 渲染错误率图表
const renderErrorRateChart = () => {
  if (!errorRateChart) return
  
  const option = {
    title: {
      text: '错误率'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [2, 3, 1, 4, 2, 3, 1],
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#F56C6C'
      }
    }]
  }
  
  errorRateChart.setOption(option)
}

// 渲染用户反馈图表
const renderUserFeedbackChart = () => {
  if (!userFeedbackChart) return
  
  const option = {
    title: {
      text: '用户反馈'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['正面', '中性', '负面']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [75, 20, 5],
      type: 'bar',
      itemStyle: {
        color: '#67C23A'
      }
    }]
  }
  
  userFeedbackChart.setOption(option)
}

// 组件挂载
onMounted(async () => {
  console.log('🚀 灰度发布控制页面加载完成')
  await fetchGrayReleaseStrategies()
  nextTick(() => {
    initMonitoringCharts()
  })
})

// 监听窗口大小变化，重新渲染图表
window.addEventListener('resize', () => {
  if (performanceChart) {
    performanceChart.resize()
  }
  if (errorRateChart) {
    errorRateChart.resize()
  }
  if (userFeedbackChart) {
    userFeedbackChart.resize()
  }
})

/**
 * 灰度发布控制页面
 * 支持灰度策略的创建、编辑、启动、暂停和删除操作
 */
</script>

<style scoped>
.gray-release-control-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>