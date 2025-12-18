<template>
  <div class="budget-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Wallet /></el-icon>
          预算管理
        </h1>
      </div>
      <div class="header-actions">
        <!-- 返回按钮 -->
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="handleBack"
          class="back-btn"
        >
          返回
        </el-button>
        
        <!-- 导入导出按钮 -->
        <el-dropdown @command="handleExportImport">
          <el-button type="success">
            导入/导出
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export">导出预算数据</el-dropdown-item>
              <el-dropdown-item command="import">导入预算数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <!-- 测试提醒按钮（仅用于演示） -->
        <el-button type="warning" @click="testBudgetAlerts" v-if="false">
          测试提醒
        </el-button>
        
        <el-button type="primary" :icon="Plus" @click="handleCreateBudget">
          新建预算
        </el-button>
      </div>
    </div>

    <!-- 预算概览 -->
    <div class="budget-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon total">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">总预算</div>
              <div class="card-value">¥{{ formatCurrency(totalBudget) }}</div>
              <div class="card-desc">本月预算总额</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon used">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">已使用</div>
              <div class="card-value">¥{{ formatCurrency(usedBudget) }}</div>
              <div class="card-desc">本月已支出</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon remaining">
              <el-icon><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">剩余</div>
              <div class="card-value">¥{{ formatCurrency(remainingBudget) }}</div>
              <div class="card-desc">本月剩余预算</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="overview-card">
            <div class="card-icon utilization">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-label">使用率</div>
              <div class="card-value">{{ utilizationRate }}%</div>
              <div class="card-desc">预算使用比例</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 预算执行进度 -->
    <div class="budget-progress-section">
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><TrendCharts /></el-icon>
              预算执行进度
            </span>
          </div>
        </template>
        
        <div class="progress-content">
          <el-progress
            :percentage="utilizationRate"
            :status="utilizationRate > 90 ? 'exception' : utilizationRate > 70 ? 'warning' : ''"
            :stroke-width="20"
            striped
            striped-flow
          />
          <div class="progress-info">
            <span>已使用: ¥{{ formatCurrency(usedBudget) }}</span>
            <span>总预算: ¥{{ formatCurrency(totalBudget) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 超支预警 -->
    <div class="budget-warning-section" v-if="overBudgetItems.length > 0">
      <el-card class="warning-card">
        <template #header>
          <div class="card-header">
            <span class="card-title warning">
              <el-icon><Warning /></el-icon>
              超支预警
            </span>
          </div>
        </template>
        
        <div class="warning-content">
          <el-alert
            v-for="item in overBudgetItems"
            :key="item.id"
            :title="`${item.name} 预算超支`"
            :description="`预算金额: ¥${formatCurrency(item.amount)}, 实际支出: ¥${formatCurrency(item.used)}, 超支: ¥${formatCurrency(item.used - item.amount)}`"
            type="error"
            show-icon
            closable
            class="warning-item"
          />
        </div>
      </el-card>
    </div>

    <!-- 预算建议 -->
    <div class="budget-advice-section" v-if="budgetAdvice.length > 0">
      <el-card class="advice-card">
        <template #header>
          <div class="card-header">
            <span class="card-title advice">
              <el-icon><Lightning /></el-icon>
              预算建议
            </span>
          </div>
        </template>
        
        <div class="advice-content">
          <el-alert
            v-for="(advice, index) in budgetAdvice"
            :key="index"
            :title="advice.title"
            :description="advice.description"
            type="warning"
            show-icon
            class="advice-item"
          />
        </div>
      </el-card>
    </div>

    <!-- 预算列表 -->
    <div class="budget-list-section">
      <el-card class="list-card">
        <template #header>
          <div class="list-header">
            <span class="list-title">预算列表</span>
            <div class="list-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索预算..."
                :prefix-icon="Search"
                clearable
                class="search-input"
              />
            </div>
          </div>
        </template>

        <div class="budget-table-container">
          <el-table
            :data="filteredBudgetList"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="name" label="预算名称" min-width="150" />
            <el-table-column prop="category" label="预算类别" width="120">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(row.category)">
                  {{ getCategoryText(row.category) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="预算金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatCurrency(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="used" label="已使用" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatCurrency(row.used) }}
              </template>
            </el-table-column>
            <el-table-column prop="remaining" label="剩余" width="120" align="right">
              <template #default="{ row }">
                ¥{{ formatCurrency(row.remaining) }}
              </template>
            </el-table-column>
            <el-table-column prop="utilization" label="使用率" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.utilization"
                  :status="row.utilization > 90 ? 'exception' : row.utilization > 70 ? 'warning' : ''"
                  :stroke-width="10"
                  :show-text="false"
                />
                <div class="progress-text">{{ row.utilization }}%</div>
              </template>
            </el-table-column>
            <el-table-column prop="period" label="预算周期" width="120" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button type="primary" size="small" text @click="handleEdit(row)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" text @click="handleDelete(row)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 空状态 -->
          <div v-if="filteredBudgetList.length === 0 && !loading" class="empty-state">
            <el-icon class="empty-icon"><Wallet /></el-icon>
            <p class="empty-text">暂无预算记录</p>
            <el-button type="primary" @click="handleCreateBudget">
              创建预算
            </el-button>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="filteredBudgetList.length > 0" class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 预算历史对比 -->
    <div class="budget-history-section">
      <el-card class="history-card">
        <template #header>
          <div class="card-header">
            <span class="card-title history">
              <el-icon><DataLine /></el-icon>
              预算历史对比
            </span>
          </div>
        </template>
        
        <div class="history-content">
          <div class="history-chart-wrapper">
            <!-- 时间筛选器放置在图表右上角 -->
            <div class="chart-controls">
              <el-select 
                v-model="historyPeriod" 
                placeholder="选择对比周期" 
                @change="loadHistoryData"
                size="small"
                class="period-selector"
              >
                <el-option label="近3个月" value="3m" />
                <el-option label="近6个月" value="6m" />
                <el-option label="近12个月" value="12m" />
              </el-select>
            </div>
            <div ref="historyChartRef" class="history-chart"></div>
          </div>
          
          <!-- 超支说明 -->
          <div class="overspend-note">
            <el-alert
              title="说明：图表中绿色柱子表示预算内支出，红色柱子表示超支金额，蓝色柱子表示预算金额"
              type="info"
              :closable="false"
              size="small"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 预算分类统计 -->
    <div class="budget-category-section">
      <el-card class="category-card">
        <template #header>
          <div class="card-header">
            <span class="card-title category">
              <el-icon><PieChart /></el-icon>
              预算分类统计
            </span>
          </div>
        </template>
        
        <div class="category-content">
          <div ref="categoryChartRef" class="category-chart"></div>
        </div>
      </el-card>
    </div>

    <!-- 预算使用趋势 -->
    <div class="budget-trend-section">
      <el-card class="trend-card">
        <template #header>
          <div class="card-header">
            <span class="card-title trend">
              <el-icon><DataAnalysis /></el-icon>
              预算使用趋势
            </span>
            <div class="trend-controls">
              <el-select 
                v-model="trendPeriod" 
                placeholder="选择趋势周期" 
                @change="async () => await updateTrendChart()"
                size="small"
                class="period-selector"
              >
                <el-option label="近1个月" value="1m" />
                <el-option label="近3个月" value="3m" />
                <el-option label="近6个月" value="6m" />
                <el-option label="近1年" value="1y" />
              </el-select>
            </div>
          </div>
        </template>
        
        <div class="trend-content">
          <div ref="trendChartRef" class="trend-chart"></div>
        </div>
      </el-card>
    </div>

    <!-- 预算提醒设置 -->
    <div class="budget-reminder-section">
      <el-card class="reminder-card">
        <template #header>
          <div class="card-header">
            <span class="card-title reminder">
              <el-icon><Bell /></el-icon>
              预算提醒设置
            </span>
          </div>
        </template>
        
        <div class="reminder-content">
          <el-form :model="reminderSettings" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="超支提醒">
                  <el-switch
                    v-model="reminderSettings.overBudgetEnabled"
                    active-text="启用"
                    inactive-text="禁用"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="高使用率提醒">
                  <el-switch
                    v-model="reminderSettings.highUsageEnabled"
                    active-text="启用"
                    inactive-text="禁用"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="提醒阈值">
                  <el-slider
                    v-model="reminderSettings.threshold"
                    :min="50"
                    :max="100"
                    :step="5"
                    show-input
                    show-stops
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="提醒方式">
                  <el-checkbox-group v-model="reminderSettings.methods">
                    <el-checkbox label="notification">站内通知</el-checkbox>
                    <el-checkbox label="email">邮件提醒</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item>
              <el-button type="primary" @click="saveReminderSettings">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <!-- 预算设置对话框 -->
    <el-dialog
      v-model="budgetDialogVisible"
      :title="editingBudget ? '编辑预算' : '新建预算'"
      width="500px"
      @close="resetBudgetForm"
    >
      <el-form
        :model="budgetForm"
        :rules="budgetRules"
        ref="budgetFormRef"
        label-width="100px"
      >
        <el-form-item label="预算名称" prop="name">
          <el-input v-model="budgetForm.name" placeholder="请输入预算名称" />
        </el-form-item>
        
        <el-form-item label="预算类别" prop="category">
          <el-select v-model="budgetForm.category" placeholder="请选择预算类别" style="width: 100%;">
            <el-option label="餐饮" value="food" />
            <el-option label="交通" value="transport" />
            <el-option label="住宿" value="accommodation" />
            <el-option label="娱乐" value="entertainment" />
            <el-option label="购物" value="shopping" />
            <el-option label="医疗" value="medical" />
            <el-option label="教育" value="education" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="预算金额" prop="amount">
          <el-input-number
            v-model="budgetForm.amount"
            :min="0"
            :step="100"
            controls-position="right"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="预算周期" prop="period">
          <el-select v-model="budgetForm.period" placeholder="请选择预算周期" style="width: 100%;">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="budgetForm.startDate"
            type="date"
            placeholder="请选择开始日期"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="budgetForm.endDate"
            type="date"
            placeholder="请选择结束日期"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="budgetForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="budgetDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBudget" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { 
  Plus, 
  Search, 
  Wallet, 
  TrendCharts, 
  Money, 
  DataAnalysis,
  Edit,
  Delete,
  Warning,
  Lightning,
  DataLine,
  ArrowLeft,
  PieChart,
  Download,
  Upload,
  Bell
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { 
  getBudgetList, 
  createBudget, 
  updateBudget, 
  deleteBudget, 
  getBudgetHistory, 
  checkBudgetAlerts as checkBudgetAlertsAPI
} from '@/services/budgetService'
import type { BudgetItem } from '@/services/budgetService'

// 路由实例
const router = useRouter()

// 类型定义已移动到 @/services/budgetService

interface BudgetAdvice {
  title: string
  description: string
}

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const budgetDialogVisible = ref(false)
const editingBudget = ref<BudgetItem | null>(null)

// 定时检查预算使用情况的定时器
let budgetCheckInterval: NodeJS.Timeout | null = null;

// 图表引用
const historyChartRef = ref<HTMLElement | null>(null)
let historyChart: echarts.ECharts | null = null

const categoryChartRef = ref<HTMLElement | null>(null)
let categoryChart: echarts.ECharts | null = null

const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null

// 表单引用
const budgetFormRef = ref()

// 预算表单数据
const budgetForm = reactive({
  name: '',
  category: '',
  amount: 0,
  period: 'monthly',
  startDate: '',
  endDate: '',
  remark: ''
})

// 趋势分析周期
const trendPeriod = ref<'1m' | '3m' | '6m' | '1y'>('3m')

// 预算提醒设置
const reminderSettings = reactive({
  overBudgetEnabled: true,
  highUsageEnabled: true,
  threshold: 80,
  methods: ['notification', 'email']
})

// 在组件挂载时从localStorage恢复提醒设置
const loadReminderSettings = () => {
  const savedSettings = localStorage.getItem('budgetReminderSettings');
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings);
      Object.assign(reminderSettings, parsedSettings);
    } catch (error) {
      console.error('解析提醒设置失败:', error);
    }
  }
}

// 保存提醒设置到localStorage
const saveReminderSettingsToLocal = () => {
  try {
    localStorage.setItem('budgetReminderSettings', JSON.stringify(reminderSettings));
  } catch (error) {
    console.error('保存提醒设置失败:', error);
  }
}

// 表单验证规则
const budgetRules = {
  name: [{ required: true, message: '请输入预算名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择预算类别', trigger: 'change' }],
  amount: [{ required: true, message: '请输入预算金额', trigger: 'blur' }],
  period: [{ required: true, message: '请选择预算周期', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

// 历史对比周期
const historyPeriod = ref<'3m' | '6m' | '12m'>('3m')

// 预算数据
const budgetList = ref<BudgetItem[]>([])

// 计算属性
const totalBudget = computed(() => {
  return budgetList.value.reduce((sum, budget) => sum + budget.amount, 0)
})

const usedBudget = computed(() => {
  return budgetList.value.reduce((sum, budget) => sum + budget.used, 0)
})

const remainingBudget = computed(() => {
  return totalBudget.value - usedBudget.value
})

const utilizationRate = computed(() => {
  if (totalBudget.value === 0) return 0
  return Math.round((usedBudget.value / totalBudget.value) * 100)
})

const filteredBudgetList = computed(() => {
  if (!searchQuery.value) return budgetList.value
  
  const query = searchQuery.value.toLowerCase()
  return budgetList.value.filter(budget => 
    budget.name.toLowerCase().includes(query) ||
    budget.category.toLowerCase().includes(query)
  )
})

const overBudgetItems = computed(() => {
  return budgetList.value.filter(budget => budget.utilization > 100)
})

const budgetAdvice = computed(() => {
  const advice: BudgetAdvice[] = []
  
  // 超支建议
  overBudgetItems.value.forEach(item => {
    advice.push({
      title: `【${item.name}】预算超支`,
      description: `该预算已超支 ${(item.utilization - 100).toFixed(1)}%，建议减少相关支出或调整预算金额。`
    })
  })
  
  // 高使用率建议
  const highUtilizationItems = budgetList.value.filter(budget => 
    budget.utilization > 80 && budget.utilization <= 100
  )
  
  highUtilizationItems.forEach(item => {
    advice.push({
      title: `【${item.name}】预算即将用完`,
      description: `该预算使用率已达 ${item.utilization}%，请控制支出以免超支。`
    })
  })
  
  // 低使用率建议
  const lowUtilizationItems = budgetList.value.filter(budget => 
    budget.utilization < 30 && budget.utilization > 0
  )
  
  lowUtilizationItems.forEach(item => {
    advice.push({
      title: `【${item.name}】预算使用率较低`,
      description: `该预算使用率仅为 ${item.utilization}%，可考虑适当调整预算金额。`
    })
  })
  
  return advice
})

// 方法
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2)
}

const getCategoryType = (category: string): string => {
  const typeMap: Record<string, string> = {
    food: 'success',
    transport: 'primary',
    accommodation: 'info',
    entertainment: 'warning',
    shopping: 'danger',
    medical: 'info',
    education: 'info',
    other: 'info'
  }
  return typeMap[category] || 'info'
}

const getCategoryText = (category: string): string => {
  const textMap: Record<string, string> = {
    food: '餐饮',
    transport: '交通',
    accommodation: '住宿',
    entertainment: '娱乐',
    shopping: '购物',
    medical: '医疗',
    education: '教育',
    other: '其他'
  }
  return textMap[category] || '未知'
}

// 检查预算提醒
const checkBudgetAlerts = (budget: BudgetItem) => {
  // 检查是否启用超支提醒且预算已超支
  if (reminderSettings.overBudgetEnabled && budget.utilization > 100) {
    const overspendAmount = budget.used - budget.amount;
    showBudgetAlert(`${budget.name}预算超支`, 
      `您的${budget.name}预算已超支¥${overspendAmount.toFixed(2)}，请尽快调整支出计划。`, 
      'danger');
  }
  // 检查是否启用高使用率提醒且达到阈值
  else if (reminderSettings.highUsageEnabled && budget.utilization >= reminderSettings.threshold) {
    showBudgetAlert(`${budget.name}预算使用率提醒`, 
      `您的${budget.name}预算使用率已达${budget.utilization}%，请控制支出以免超支。`, 
      'warning');
  }
}

// 全局预算预警检查函数
const checkBudgetAlertsGlobal = async () => {
  try {
    console.log('开始全局预算预警检查...')
    
    // 调用后端API进行全局预算预警检查
    const response = await checkBudgetAlertsAPI()
    
    if (response.success && response.data) {
      console.log('全局预算预警检查结果:', response.data)
      
      // 按使用率从高到低排序
      const alerts = response.data.sort((a: any, b: any) => b.utilization - a.utilization)
      
      // 显示预警信息
      alerts.forEach((alert: any) => {
        if (alert.utilization > 100) {
          // 超支预警
          showBudgetAlert(`${alert.name}预算超支`, 
            `您的${alert.name}预算已超支¥${alert.overspendAmount.toFixed(2)}，请尽快调整支出计划。`, 
            'danger');
        } else if (alert.utilization > reminderSettings.threshold) {
          // 高使用率预警
          showBudgetAlert(`${alert.name}预算使用率提醒`, 
            `您的${alert.name}预算使用率已达${alert.utilization}%，请控制支出以免超支。`, 
            'warning');
        }
      })
      
      // 将预警信息推送到仪表盘
      if (alerts.length > 0) {
        pushNotificationToDashboard(alerts)
      }
      
    } else {
      console.error('全局预算预警检查失败:', response.message)
    }
  } catch (error) {
    console.error('全局预算预警检查失败:', error)
  }
}

// 全局预算预警检查（调用后端API） - 已合并到上面的函数中

// 显示预算提醒
const showBudgetAlert = (title: string, message: string, type: 'warning' | 'danger' | 'info') => {
  // 检查提醒方式
  if (reminderSettings.methods.includes('notification')) {
    // 站内通知
    ElMessage({
      message: `${title}：${message}`,
      type: type,
      duration: 5000,
      showClose: true
    });
  }
  
  if (reminderSettings.methods.includes('email')) {
    // 邮件提醒（这里只是模拟，实际项目中需要调用邮件服务）
    console.log(`[邮件提醒] ${title}: ${message}`);
  }
  
  // 推送提醒到仪表盘（通过localStorage模拟）
  pushNotificationToDashboard(title, message, type);
}

// 推送通知到仪表盘
const pushNotificationToDashboard = (title: string, message: string, priority: 'warning' | 'danger' | 'info') => {
  try {
    // 获取现有的仪表盘通知
    const dashboardNotificationsStr = localStorage.getItem('dashboardNotifications') || '[]';
    const dashboardNotifications = JSON.parse(dashboardNotificationsStr);
    
    // 添加新的通知
    const newNotification = {
      id: Date.now(),
      title,
      message,
      priority,
      type: 'action',
      actionType: 'budget-management',
      actionPath: '/dashboard/budget',
      time: new Date().toISOString()
    };
    
    dashboardNotifications.push(newNotification);
    
    // 保存到localStorage
    localStorage.setItem('dashboardNotifications', JSON.stringify(dashboardNotifications));
    
    // 触发自定义事件，通知仪表盘有新提醒
    window.dispatchEvent(new CustomEvent('dashboard-notification-update'));
  } catch (error) {
    console.error('推送通知到仪表盘失败:', error);
  }
}

// 启动定时检查预算使用情况
const startBudgetChecking = () => {
  // 清除现有的定时器
  if (budgetCheckInterval) {
    clearInterval(budgetCheckInterval);
  }
  
  // 每5分钟检查一次预算使用情况
  budgetCheckInterval = setInterval(() => {
    checkAllBudgets();
  }, 5 * 60 * 1000); // 5分钟
}

// 停止定时检查
const stopBudgetChecking = () => {
  if (budgetCheckInterval) {
    clearInterval(budgetCheckInterval);
    budgetCheckInterval = null;
  }
}

// 检查所有预算
const checkAllBudgets = () => {
  budgetList.value.forEach(budget => {
    // 检查是否需要触发提醒
    checkBudgetAlerts(budget);
  });
  
  // 同时调用后端API进行全局预算预警检查
  checkBudgetAlertsGlobal();
}

const handleCreateBudget = () => {
  editingBudget.value = null
  resetBudgetForm()
  budgetDialogVisible.value = true
}

const handleEdit = (row: BudgetItem) => {
  editingBudget.value = row
  Object.assign(budgetForm, {
    name: row.name,
    category: row.category,
    amount: row.amount,
    period: row.period === '月度' ? 'monthly' : row.period === '季度' ? 'quarterly' : 'yearly',
    startDate: row.startDate,
    endDate: row.endDate,
    remark: row.remark
  })
  budgetDialogVisible.value = true
}

const handleDelete = async (row: BudgetItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除预算"${row.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('开始删除预算:', row.id)
    
    // 调用真实API删除预算
    const response = await deleteBudget(row.id)
    
    if (response.success) {
      ElMessage.success('删除成功')
      
      // 重新加载预算列表
      await loadBudgetList()
      
      // 后续处理
      postDeleteBudget();
      
      console.log('预算删除成功:', row.id)
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除预算失败:', error)
      ElMessage.error('删除预算失败')
    }
  }
}

// 在预算数据变化时检查提醒
const checkBudgetAlertsOnUpdate = () => {
  // 延迟一段时间后检查，确保数据已更新
  setTimeout(() => {
    checkAllBudgets();
  }, 100);
  
  // 同时调用后端API进行全局预算预警检查
  checkBudgetAlertsGlobal();
}

// 保存预算后的处理
const postSaveBudget = () => {
  // 更新图表
  nextTick(() => {
    updateHistoryChart()
    updateCategoryChart()
  })
  
  // 检查提醒
  checkBudgetAlertsOnUpdate();
}

// 删除预算后的处理
const postDeleteBudget = () => {
  // 更新图表
  nextTick(() => {
    updateHistoryChart()
    updateCategoryChart()
  })
  
  // 检查提醒
  checkBudgetAlertsOnUpdate();
}

const resetBudgetForm = () => {
  Object.assign(budgetForm, {
    name: '',
    category: '',
    amount: 0,
    period: 'monthly',
    startDate: '',
    endDate: '',
    remark: ''
  })
  
  if (budgetFormRef.value) {
    budgetFormRef.value.resetFields()
  }
}

const saveBudget = async () => {
  if (!budgetFormRef.value) return
  
  try {
    await budgetFormRef.value.validate()
    
    saving.value = true
    console.log('开始保存预算...')
    
    // 构建预算数据
    const budgetData = {
      name: budgetForm.name,
      category: budgetForm.category,
      amount: budgetForm.amount,
      period: budgetForm.period,
      startDate: budgetForm.startDate,
      endDate: budgetForm.endDate,
      remark: budgetForm.remark
    }
    
    let response: any
    let savedBudget: BudgetItem
    
    if (editingBudget.value) {
      // 编辑预算
      response = await updateBudget(editingBudget.value.id, budgetData)
      if (response.success && response.data) {
        savedBudget = response.data
        ElMessage.success('预算更新成功')
      } else {
        ElMessage.error(response.message || '预算更新失败')
        return
      }
    } else {
      // 新建预算
      response = await createBudget(budgetData)
      if (response.success && response.data) {
        savedBudget = response.data
        ElMessage.success('预算创建成功')
      } else {
        ElMessage.error(response.message || '预算创建失败')
        return
      }
    }
    
    // 检查是否需要触发提醒
    checkBudgetAlerts(savedBudget)
    
    budgetDialogVisible.value = false
    
    // 重新加载预算列表
    await loadBudgetList()
    
    // 后续处理
    postSaveBudget();
    
    console.log('预算保存成功:', savedBudget)
  } catch (error) {
    console.error('保存预算失败:', error)
    ElMessage.error('保存预算失败')
  } finally {
    saving.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadBudgetList()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadBudgetList()
}

const loadBudgetList = async () => {
  try {
    loading.value = true
    console.log('开始加载预算列表...')
    
    // 调用真实API获取预算列表
    const response = await getBudgetList(currentPage.value, pageSize.value)
    
    if (response.success && response.data) {
      // 更新预算列表数据
      budgetList.value = response.data.records.map((budget: any) => ({
        ...budget,
        period: budget.period === 'monthly' ? '月度' : budget.period === 'quarterly' ? '季度' : '年度',
        status: budget.utilization > 100 ? 'danger' : budget.utilization > 80 ? 'warning' : 'normal'
      }))
      
      total.value = response.data.total
      console.log('预算列表加载成功:', response.data)
    } else {
      console.error('获取预算列表失败:', response.message)
      ElMessage.error(response.message || '获取预算列表失败')
    }
  } catch (error) {
    console.error('加载预算列表失败:', error)
    ElMessage.error('加载预算列表失败')
  } finally {
    loading.value = false
  }
}

const loadHistoryData = async () => {
  try {
    console.log('开始加载预算历史数据...')
    
    // 调用真实API获取预算历史数据
    const response = await getBudgetHistory(historyPeriod.value)
    
    if (response.success && response.data) {
      console.log('预算历史数据加载成功:', response.data)
      
      // 使用真实数据更新图表
      if (historyChart && historyChartRef.value) {
        // 先销毁再重新创建图表以确保动画重新播放
        historyChart.dispose()
        historyChart = echarts.init(historyChartRef.value)
        
        // 使用真实数据更新图表
        updateHistoryChartWithRealData(response.data)
      }
    } else {
      console.error('获取预算历史数据失败:', response.message)
      ElMessage.error(response.message || '获取预算历史数据失败')
    }
  } catch (error) {
    console.error('加载预算历史数据失败:', error)
    ElMessage.error('加载预算历史数据失败')
  }
}

// 使用真实数据更新历史图表
const updateHistoryChartWithRealData = (historyData: any) => {
  if (!historyChart) return
  
  const months = historyData.months || []
  const budgetData = historyData.budgetData || []
  const expenseData = historyData.expenseData || []
  
  // 计算在预算内的支出和超支部分
  const withinBudgetData = expenseData.map((expense: number, index: number) => {
    return Math.min(expense, budgetData[index] || 0)
  })
  
  const overspendData = expenseData.map((expense: number, index: number) => {
    return Math.max(0, expense - (budgetData[index] || 0))
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const month = params[0].name
        const budget = budgetData[params[0].dataIndex] || 0
        const expense = expenseData[params[0].dataIndex] || 0
        const withinBudget = withinBudgetData[params[0].dataIndex] || 0
        const overspend = overspendData[params[0].dataIndex] || 0
        
        let tooltip = `${month}<br/>`
        tooltip += `预算金额: ¥${budget.toLocaleString()}<br/>`
        tooltip += `实际支出: ¥${expense.toLocaleString()}<br/>`
        
        if (overspend > 0) {
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#67C23A;"></span>`
          tooltip += `预算内支出: ¥${withinBudget.toLocaleString()}<br/>`
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#F56C6C;"></span>`
          tooltip += `超支金额: ¥${overspend.toLocaleString()}<br/>`
        } else {
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#67C23A;"></span>`
          tooltip += `支出金额: ¥${expense.toLocaleString()}<br/>`
        }
        
        return tooltip
      }
    },
    legend: {
      data: ['预算金额', '预算内支出', '超支金额']
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    animation: true,
    animationDuration: 2000,
    animationEasing: 'quarticInOut',
    series: [
      {
        name: '预算金额',
        type: 'bar',
        data: budgetData,
        itemStyle: {
          color: '#409EFF'
        },
        barGap: '0%',
        animationDelay: (idx: number) => idx * 50
      },
      {
        name: '预算内支出',
        type: 'bar',
        stack: '实际支出',
        data: withinBudgetData,
        itemStyle: {
          color: '#67C23A'
        },
        barGap: '0%',
        animationDelay: (idx: number) => idx * 50 + 500
      },
      {
        name: '超支金额',
        type: 'bar',
        stack: '实际支出',
        data: overspendData,
        itemStyle: {
          color: '#F56C6C'
        },
        barGap: '0%',
        animationDelay: (idx: number) => idx * 50 + 1500
      }
    ]
  }
  
  // 使用 setOption 并设置 notMerge 为 true 以确保完全重新渲染
  historyChart.setOption(option, { notMerge: true })
}

const initHistoryChart = () => {
  if (!historyChartRef.value) return
  
  // 如果图表已经存在，先销毁再重新创建
  if (historyChart) {
    historyChart.dispose()
  }
  
  historyChart = echarts.init(historyChartRef.value)
  updateHistoryChart()
}

// 获取历史预算数据
const fetchHistoryData = async () => {
  try {
    const response = await getBudgetHistory(historyPeriod.value)
    
    if (response.success && response.data) {
      return response.data
    } else {
      ElMessage.error('获取历史预算数据失败')
      return { months: [], budgetData: [], expenseData: [] }
    }
  } catch (error) {
    console.error('获取历史预算数据失败:', error)
    ElMessage.error('获取历史预算数据失败')
    return { months: [], budgetData: [], expenseData: [] }
  }
}

const updateHistoryChart = async () => {
  if (!historyChart) return
  
  // 获取真实历史数据
  const historyData = await fetchHistoryData()
  
  let months: string[] = historyData.months || []
  let budgetData: number[] = historyData.budgetData || []
  let expenseData: number[] = historyData.expenseData || []
  
  // 如果数据为空，使用默认数据
  if (months.length === 0) {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    switch (historyPeriod.value) {
      case '3m':
        months = []
        budgetData = []
        expenseData = []
        for (let i = 2; i >= 0; i--) {
          const month = currentMonth - i
          const year = currentYear
          if (month <= 0) {
            months.push(`${year - 1}年${12 + month}月`)
          } else {
            months.push(`${year}年${month}月`)
          }
          budgetData.push(3000 + i * 100)
          expenseData.push(i === 1 ? 3300 + i * 100 : 2800 + i * 50)
        }
        break
      case '6m':
        months = []
        budgetData = []
        expenseData = []
        for (let i = 5; i >= 0; i--) {
          const month = currentMonth - i
          const year = currentYear
          if (month <= 0) {
            months.push(`${year - 1}年${12 + month}月`)
          } else {
            months.push(`${year}年${month}月`)
          }
          budgetData.push(2800 + i * 100)
          expenseData.push(i % 2 === 1 ? 3000 + i * 100 + 200 : 2600 + i * 80)
        }
        break
      case '12m':
        months = []
        budgetData = []
        expenseData = []
        for (let i = 11; i >= 0; i--) {
          const month = currentMonth - i
          const year = currentYear
          if (month <= 0) {
            months.push(`${year - 1}年${12 + month}月`)
          } else {
            months.push(`${year}年${month}月`)
          }
          budgetData.push(2500 + i * 80)
          expenseData.push(i % 3 === 0 ? 2900 + i * 80 + 400 : 2400 + i * 70)
        }
        break
      default:
        months = []
        budgetData = []
        expenseData = []
        for (let i = 2; i >= 0; i--) {
          const month = currentMonth - i
          const year = currentYear
          if (month <= 0) {
            months.push(`${year - 1}年${12 + month}月`)
          } else {
            months.push(`${year}年${month}月`)
          }
          budgetData.push(3000 + i * 100)
          expenseData.push(2800 + i * 50)
        }
    }
  }
  
  // 计算在预算内的支出和超支部分
  const withinBudgetData = expenseData.map((expense, index) => {
    return Math.min(expense, budgetData[index])
  })
  
  const overspendData = expenseData.map((expense, index) => {
    return Math.max(0, expense - budgetData[index])
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const month = params[0].name
        const budget = budgetData[params[0].dataIndex]
        const expense = expenseData[params[0].dataIndex]
        const withinBudget = withinBudgetData[params[0].dataIndex]
        const overspend = overspendData[params[0].dataIndex]
        
        let tooltip = `${month}<br/>`
        tooltip += `预算金额: ¥${budget.toLocaleString()}<br/>`
        tooltip += `实际支出: ¥${expense.toLocaleString()}<br/>`
        
        if (overspend > 0) {
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#67C23A;"></span>`
          tooltip += `预算内支出: ¥${withinBudget.toLocaleString()}<br/>`
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#F56C6C;"></span>`
          tooltip += `超支金额: ¥${overspend.toLocaleString()}<br/>`
        } else {
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#67C23A;"></span>`
          tooltip += `支出金额: ¥${expense.toLocaleString()}<br/>`
        }
        
        return tooltip
      }
    },
    legend: {
      data: ['预算金额', '预算内支出', '超支金额']
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    animation: true,
    animationDuration: 2000,
    animationEasing: 'quarticInOut',
    series: [
      {
        name: '预算金额',
        type: 'bar',
        data: budgetData,
        itemStyle: {
          color: '#409EFF'
        },
        barGap: '0%',
        animationDelay: (idx: number) => idx * 50
      },
      {
        name: '预算内支出',
        type: 'bar',
        stack: '实际支出',
        data: withinBudgetData,
        itemStyle: {
          color: '#67C23A'
        },
        barGap: '0%',
        animationDelay: (idx: number) => idx * 50 + 500
      },
      {
        name: '超支金额',
        type: 'bar',
        stack: '实际支出',
        data: overspendData,
        itemStyle: {
          color: '#F56C6C'
        },
        barGap: '0%',
        animationDelay: (idx: number) => idx * 50 + 1500
      }
    ]
  }
  
  // 使用 setOption 并设置 notMerge 为 true 以确保完全重新渲染
  historyChart.setOption(option, { notMerge: true })
}

const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  
  // 如果图表已经存在，先销毁再重新创建
  if (categoryChart) {
    categoryChart.dispose()
  }
  
  categoryChart = echarts.init(categoryChartRef.value)
  updateCategoryChart()
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  // 如果图表已经存在，先销毁再重新创建
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()
}

const updateTrendChart = async () => {
  if (!trendChart) return
  
  try {
    console.log('开始加载趋势图表数据...')
    
    // 调用真实API获取趋势数据
    const response = await getBudgetHistory(trendPeriod.value === '1m' ? '3m' : trendPeriod.value === '1y' ? '12m' : (trendPeriod.value as '3m' | '6m'))
    
    if (response.success && response.data) {
      console.log('趋势数据加载成功:', response.data)
      
      const dates = response.data.dates || []
      const budgetData = response.data.budgetData || []
      const expenseData = response.data.expenseData || []
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const date = params[0].name
            const budget = params[0].value
            const expense = params[1].value
            
            return `${date}<br/>
                    预算金额: ¥${budget}<br/>
                    实际支出: ¥${expense}<br/>
                    差额: ¥${(budget - expense).toFixed(2)}`
          }
        },
        legend: {
          data: ['预算金额', '实际支出']
        },
        xAxis: {
          type: 'category',
          data: dates,
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [
          {
            name: '预算金额',
            type: 'line',
            data: budgetData,
            smooth: true,
            itemStyle: { color: '#409EFF' },
            areaStyle: { opacity: 0.3 }
          },
          {
            name: '实际支出',
            type: 'line',
            data: expenseData,
            smooth: true,
            itemStyle: { color: '#67C23A' },
            areaStyle: { opacity: 0.3 }
          }
        ]
      }
      
      trendChart.setOption(option, { notMerge: true })
    } else {
      console.error('获取趋势数据失败:', response.message)
      ElMessage.error(response.message || '获取趋势数据失败')
    }
  } catch (error) {
    console.error('加载趋势数据失败:', error)
    ElMessage.error('加载趋势数据失败')
  }
}

const updateCategoryChart = async () => {
  if (!categoryChart) return
  
  try {
    console.log('开始加载分类统计图表数据...')
    
    // 调用真实API获取分类统计数据
    const response = await getBudgetHistory(historyPeriod.value)
    
    if (response.success && response.data) {
      console.log('分类统计数据加载成功:', response.data)
      
      const categoryData = response.data.categoryData || {}
      const categories = Object.keys(categoryData)
      const budgetData = categories.map(cat => categoryData[cat].budget || 0)
      const expenseData = categories.map(cat => categoryData[cat].expense || 0)
      const categoryNames = categories.map(cat => getCategoryText(cat))
      
      // 计算总预算和总支出用于百分比计算
      const totalBudget = budgetData.reduce((sum, val) => sum + val, 0)
      const totalExpense = expenseData.reduce((sum, val) => sum + val, 0)
      
      // 颜色配置
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#34C759', '#FF9F43', '#48C774']
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const { name, value } = params
            // 计算百分比
            const percent = totalBudget > 0 ? ((value / totalBudget) * 100).toFixed(1) : '0.0'
            return `${name}<br/>金额: ¥${value.toLocaleString()}<br/>占比: ${percent}%`
          }
        },
        legend: {
          bottom: '5%',
          left: 'center',
          data: categoryNames
        },
        series: [
          {
            name: '预算金额',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['25%', '50%'],
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
                fontSize: '14',
                fontWeight: 'bold',
                formatter: (params: any) => {
                  return `{title|预算金额}\n{value|¥${params.value.toLocaleString()}}`
                },
                rich: {
                  title: {
                    color: '#666',
                    fontSize: 14,
                    lineHeight: 20
                  },
                  value: {
                    color: '#333',
                fontSize: 16,
                fontWeight: 'bold',
                lineHeight: 30
              }
            }
          }
        },
        labelLine: {
          show: false
        },
        data: categories.map((cat, index) => ({
          name: getCategoryText(cat),
          value: categoryData[cat].budget || 0,
          itemStyle: { color: colors[index % colors.length] }
        }))
      },
      {
        name: '实际支出',
        type: 'pie',
        radius: ['20%', '35%'],
        center: ['25%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
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
            fontSize: '14',
            fontWeight: 'bold',
            formatter: (params: any) => {
              return `{title|实际支出}\n{value|¥${params.value.toLocaleString()}}`
            },
            rich: {
              title: {
                color: '#666',
                fontSize: 14,
                lineHeight: 20
              },
              value: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'bold',
                lineHeight: 30
              }
            }
          }
        },
        labelLine: {
          show: false
        },
        data: categories.map((cat, index) => ({
          name: getCategoryText(cat),
          value: categoryData[cat].expense || 0,
          itemStyle: { color: colors[index % colors.length] }
        }))
      },
      {
        name: '预算使用情况',
        type: 'bar',
        xAxisIndex: 0,
        yAxisIndex: 0,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
          color: (params: any) => {
            const index = params.dataIndex
            const budget = categoryData[categories[index]].budget || 0
            const expense = categoryData[categories[index]].expense || 0
            const utilization = budget > 0 ? (expense / budget) * 100 : 0
            // 根据使用率设置颜色
            if (utilization > 100) {
              return '#F56C6C' // 超支红色
            } else if (utilization > 80) {
              return '#E6A23C' // 高使用率橙色
            } else {
              return '#67C23A' // 正常绿色
            }
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const index = params.dataIndex
            const budget = categoryData[categories[index]].budget || 0
            const expense = categoryData[categories[index]].expense || 0
            const utilization = budget > 0 ? ((expense / budget) * 100).toFixed(1) : '0'
            return `${utilization}%`
          }
        },
        data: categories.map(cat => {
          const budget = categoryData[cat].budget || 0
          const expense = categoryData[cat].expense || 0
          return {
            value: expense,
            budget: budget
          }
        })
      }
    ],
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'category',
      data: categoryNames,
      axisTick: { show: false },
      axisLabel: {
        margin: 20,
        fontSize: 12
      }
    },
    grid: {
      left: '45%',
      right: '10%',
      top: '10%',
      bottom: '15%'
    }
  }
  
  categoryChart.setOption(option, { notMerge: true })
}

const handleExportImport = (command: string) => {
  if (command === 'export') {
    // 导出预算数据
    const data = JSON.stringify(budgetList.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget_data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('预算数据已导出')
  } else if (command === 'import') {
    // 导入预算数据
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event: any) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e: any) => {
          try {
            const importedData = JSON.parse(e.target.result)
            budgetList.value = importedData
            ElMessage.success('预算数据已导入')
            
            // 更新图表
            nextTick(() => {
              updateHistoryChart()
              updateCategoryChart()
              updateTrendChart()
            })
          } catch (error) {
            ElMessage.error('导入失败，请检查文件格式')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
}

const saveReminderSettings = () => {
  // 保存提醒设置
  ElMessage.success('预算提醒设置已保存')
  console.log('提醒设置:', reminderSettings)
  saveReminderSettingsToLocal();
}

const handleBack = () => {
  router.push('/dashboard/analytics')
}

// 测试提醒（仅用于演示）
const testBudgetAlerts = () => {
  // 测试超支提醒
  showBudgetAlert('餐饮预算超支', '您的餐饮预算已超支¥300.00，请尽快调整支出计划。', 'danger');
  
  // 测试高使用率提醒
  showBudgetAlert('交通预算使用率提醒', '您的交通预算使用率已达95%，请控制支出以免超支。', 'warning');
}

// 生命周期
onMounted(() => {
  // 加载提醒设置
  loadReminderSettings();
  
  loadBudgetList()
  nextTick(() => {
    initHistoryChart()
    initCategoryChart()
    initTrendChart()
  })
  
  // 启动定时检查预算使用情况
  startBudgetChecking();
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (historyChart) {
      historyChart.resize()
    }
    if (categoryChart) {
      categoryChart.resize()
    }
    if (trendChart) {
      trendChart.resize()
    }
  })
})

onUnmounted(() => {
  // 停止定时检查预算使用情况
  stopBudgetChecking();
})
</script>

<style scoped>
.budget-management {
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

.header-left {
  display: flex;
  align-items: center;
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

.back-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

/* 预算概览 */
.budget-overview {
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.card-icon.total {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.card-icon.used {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.card-icon.remaining {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.card-icon.utilization {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: #909399;
}

/* 预算执行进度 */
.budget-progress-section {
  margin-bottom: 24px;
}

.progress-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-content {
  padding: 20px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}

/* 超支预警 */
.budget-warning-section {
  margin-bottom: 24px;
}

.warning-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-title.warning {
  color: #f56c6c;
}

.warning-content {
  padding: 20px 0;
}

.warning-item {
  margin-bottom: 12px;
}

.warning-item:last-child {
  margin-bottom: 0;
}

/* 预算建议 */
.budget-advice-section {
  margin-bottom: 24px;
}

.advice-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-title.advice {
  color: #e6a23c;
}

.advice-content {
  padding: 20px 0;
}

.advice-item {
  margin-bottom: 12px;
}

.advice-item:last-child {
  margin-bottom: 0;
}

/* 预算列表 */
.budget-list-section {
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

.search-input {
  width: 240px;
}

.budget-table-container {
  min-height: 400px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

/* 预算历史对比 */
.budget-history-section {
  margin-bottom: 24px;
}

.history-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-title.history {
  color: #409eff;
}

.history-content {
  padding: 20px 0;
}

.history-controls {
  margin-bottom: 20px;
}

.history-chart-wrapper {
  position: relative;
}

.history-chart {
  width: 100%;
  height: 300px;
  padding-top: 10px;
}

.chart-controls {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 4px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.period-selector {
  width: 120px;
}

.period-selector .el-input__wrapper {
  background: transparent;
}

.overspend-note {
  margin-top: 15px;
  padding: 0 15px;
}

/* 预算分类统计 */
.budget-category-section {
  margin-bottom: 24px;
}

.category-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-title.category {
  color: #67c23a;
}

.category-content {
  padding: 20px 0;
}

.category-chart {
  width: 100%;
  height: 300px;
  padding-top: 10px;
}

/* 预算使用趋势 */
.budget-trend-section {
  margin-bottom: 24px;
}

.trend-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-title.trend {
  color: #909399;
}

.trend-content {
  padding: 20px 0;
}

.trend-chart {
  width: 100%;
  height: 300px;
  padding-top: 10px;
}

.trend-controls {
  margin-left: auto;
}

/* 预算提醒设置 */
.budget-reminder-section {
  margin-bottom: 24px;
}

.reminder-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.card-title.reminder {
  color: #e6a23c;
}

.reminder-content {
  padding: 20px 0;
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

/* 分页 */
.pagination-section {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding: 16px;
}

/* 对话框 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .budget-overview {
    margin-bottom: 16px;
  }
  
  .overview-card {
    padding: 16px;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .card-value {
    font-size: 18px;
  }
  
  .list-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .search-input {
    width: 100%;
  }
  
  .history-chart {
    height: 250px;
  }
}
</style>
