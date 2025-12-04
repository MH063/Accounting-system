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
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
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
  ArrowLeft
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'

// 路由实例
const router = useRouter()

// 类型定义
interface BudgetItem {
  id: number
  name: string
  category: string
  amount: number
  used: number
  remaining: number
  utilization: number
  period: string
  startDate: string
  endDate: string
  remark?: string
}

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

// 图表引用
const historyChartRef = ref<HTMLElement | null>(null)
let historyChart: echarts.ECharts | null = null

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
const historyPeriod = ref('3m')

// 预算数据
const budgetList = ref<BudgetItem[]>([
  {
    id: 1,
    name: '餐饮预算',
    category: 'food',
    amount: 2000,
    used: 1500,
    remaining: 500,
    utilization: 75,
    period: '月度',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  },
  {
    id: 2,
    name: '交通预算',
    category: 'transport',
    amount: 800,
    used: 900,
    remaining: -100,
    utilization: 112.5,
    period: '月度',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  },
  {
    id: 3,
    name: '娱乐预算',
    category: 'entertainment',
    amount: 500,
    used: 300,
    remaining: 200,
    utilization: 60,
    period: '月度',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
])

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
    medical: '',
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

const handleDelete = (row: BudgetItem) => {
  ElMessageBox.confirm(
    `确定要删除预算"${row.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    budgetList.value = budgetList.value.filter(budget => budget.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 用户取消删除
  })
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
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingBudget.value) {
      // 编辑预算
      const index = budgetList.value.findIndex(budget => budget.id === editingBudget.value!.id)
      if (index !== -1) {
        budgetList.value[index] = {
          ...budgetList.value[index],
          name: budgetForm.name,
          category: budgetForm.category,
          amount: budgetForm.amount,
          period: budgetForm.period === 'monthly' ? '月度' : budgetForm.period === 'quarterly' ? '季度' : '年度',
          startDate: budgetForm.startDate,
          endDate: budgetForm.endDate,
          remark: budgetForm.remark,
          remaining: budgetForm.amount - budgetList.value[index].used,
          utilization: Math.round((budgetList.value[index].used / budgetForm.amount) * 100)
        }
      }
      ElMessage.success('预算更新成功')
    } else {
      // 新建预算
      const newBudget: BudgetItem = {
        id: Date.now(),
        name: budgetForm.name,
        category: budgetForm.category,
        amount: budgetForm.amount,
        used: 0,
        remaining: budgetForm.amount,
        utilization: 0,
        period: budgetForm.period === 'monthly' ? '月度' : budgetForm.period === 'quarterly' ? '季度' : '年度',
        startDate: budgetForm.startDate,
        endDate: budgetForm.endDate,
        remark: budgetForm.remark
      }
      budgetList.value.push(newBudget)
      ElMessage.success('预算创建成功')
    }
    
    budgetDialogVisible.value = false
  } catch (error) {
    console.error('保存预算失败:', error)
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

const loadBudgetList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const loadHistoryData = () => {
  // 强制重新渲染图表以播放动画
  if (historyChart && historyChartRef.value) {
    // 先销毁再重新创建图表以确保动画重新播放
    historyChart.dispose()
    historyChart = echarts.init(historyChartRef.value)
    
    // 使用 setTimeout 确保重新创建图表后再更新数据
    setTimeout(() => {
      updateHistoryChart()
    }, 10)
  }
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

const updateHistoryChart = () => {
  if (!historyChart) return
  
  // 根据选择的时间范围生成不同的数据
  let months: string[] = []
  let budgetData: number[] = []
  let expenseData: number[] = []
  
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // getMonth() 返回 0-11，所以需要 +1
  
  switch (historyPeriod.value) {
    case '3m':
      // 近3个月
      months = []
      budgetData = []
      expenseData = []
      for (let i = 2; i >= 0; i--) {
        const month = currentMonth - i
        const year = currentYear
        if (month <= 0) {
          // 去年的月份
          months.push(`${year - 1}年${12 + month}月`)
        } else {
          months.push(`${year}年${month}月`)
        }
        // 生成模拟数据
        budgetData.push(3000 + i * 100)
        // 为了让某些月份超支，我们特意设置一些月份的实际支出超过预算
        if (i === 1) {
          // 中间月份设置为超支
          expenseData.push(3000 + i * 100 + 300)
        } else {
          expenseData.push(2800 + i * 50)
        }
      }
      break
    case '6m':
      // 近6个月
      months = []
      budgetData = []
      expenseData = []
      for (let i = 5; i >= 0; i--) {
        const month = currentMonth - i
        const year = currentYear
        if (month <= 0) {
          // 去年的月份
          months.push(`${year - 1}年${12 + month}月`)
        } else {
          months.push(`${year}年${month}月`)
        }
        // 生成模拟数据
        budgetData.push(2800 + i * 100)
        // 设置某些月份超支
        if (i % 2 === 1) {
          // 奇数月份设置为超支
          expenseData.push(2800 + i * 100 + 200)
        } else {
          expenseData.push(2600 + i * 80)
        }
      }
      break
    case '12m':
      // 近12个月
      months = []
      budgetData = []
      expenseData = []
      for (let i = 11; i >= 0; i--) {
        const month = currentMonth - i
        const year = currentYear
        if (month <= 0) {
          // 去年的月份
          months.push(`${year - 1}年${12 + month}月`)
        } else {
          months.push(`${year}年${month}月`)
        }
        // 生成模拟数据
        budgetData.push(2500 + i * 80)
        // 设置某些月份超支
        if (i % 3 === 0) {
          // 每3个月设置一次超支
          expenseData.push(2500 + i * 80 + 400)
        } else {
          expenseData.push(2400 + i * 70)
        }
      }
      break
    default:
      // 默认显示近3个月
      months = []
      budgetData = []
      expenseData = []
      for (let i = 2; i >= 0; i--) {
        const month = currentMonth - i
        const year = currentYear
        if (month <= 0) {
          // 去年的月份
          months.push(`${year - 1}年${12 + month}月`)
        } else {
          months.push(`${year}年${month}月`)
        }
        // 生成模拟数据
        budgetData.push(3000 + i * 100)
        // 默认情况下不超支
        expenseData.push(2800 + i * 50)
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

const handleBack = () => {
  router.push('/dashboard/analytics')
}

// 生命周期
onMounted(() => {
  loadBudgetList()
  nextTick(() => {
    initHistoryChart()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (historyChart) {
      historyChart.resize()
    }
  })
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