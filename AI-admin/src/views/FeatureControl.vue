<template>
  <div class="feature-control-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>功能模块控制</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleSave">保存设置</el-button>
          </div>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以控制各个功能模块的开启/关闭状态，以及设置模块的访问权限"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 实时监控面板 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><SuccessFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">已启用功能</div>
                <div class="stat-value">{{ stats.enabledCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><InfoFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">已禁用功能</div>
                <div class="stat-value">{{ stats.disabledCount }}</div>
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
                <div class="stat-title">警告功能</div>
                <div class="stat-value">{{ stats.warningCount }}</div>
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
                <div class="stat-title">异常功能</div>
                <div class="stat-value">{{ stats.errorCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 功能模块列表 -->
      <el-table :data="featureList" style="width: 100%" row-key="id">
        <el-table-column prop="name" label="功能模块名称" width="200">
          <template #default="scope">
            <el-icon v-if="scope.row.icon"><component :is="scope.row.icon" /></el-icon>
            <span style="margin-left: 10px;">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="功能描述" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.enabled"
              active-text="开启"
              inactive-text="关闭"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="运行状态" width="120">
          <template #default="scope">
            <el-tag :type="getFeatureStatusType(scope.row.status)">
              {{ getFeatureStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="100" />
        <el-table-column label="访问权限" width="150">
          <template #default="scope">
            <el-button size="small" @click="handlePermission(scope.row)">设置权限</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleConfig(scope.row)">配置</el-button>
            <el-button size="small" @click="handleHistory(scope.row)">历史</el-button>
            <el-button size="small" type="primary" @click="handleRollback(scope.row)" v-if="scope.row.hasRollback">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 权限设置对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="设置访问权限" width="600px">
      <el-form :model="permissionForm" label-width="100px">
        <el-form-item label="功能模块">
          {{ permissionForm.featureName }}
        </el-form-item>
        
        <el-form-item label="允许角色">
          <el-checkbox-group v-model="permissionForm.allowedRoles">
            <el-checkbox 
              v-for="role in roleList" 
              :key="role.id" 
              :label="role.id"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="用户白名单">
          <el-select 
            v-model="permissionForm.whitelistUsers" 
            multiple 
            filterable 
            remote 
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            placeholder="请输入用户名搜索"
            style="width: 100%;"
          >
            <el-option 
              v-for="user in userList" 
              :key="user.id" 
              :label="user.name" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="IP白名单">
          <el-input 
            v-model="permissionForm.whitelistIPs" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入允许访问的IP地址，每行一个" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermission">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 功能配置对话框 -->
    <el-dialog v-model="configDialogVisible" title="功能配置" width="600px">
      <el-form :model="configForm" label-width="120px">
        <el-form-item label="功能模块">
          {{ configForm.featureName }}
        </el-form-item>
        
        <el-form-item label="最大并发数">
          <el-input-number 
            v-model="configForm.maxConcurrency" 
            :min="1" 
            :max="1000" 
            controls-position="right" 
            style="width: 100%;" 
          />
        </el-form-item>
        
        <el-form-item label="请求频率限制">
          <el-input-number 
            v-model="configForm.rateLimit" 
            :min="1" 
            :max="10000" 
            controls-position="right" 
            style="width: 100%;" 
          />
          <span class="form-tip">次/分钟</span>
        </el-form-item>
        
        <el-form-item label="缓存策略">
          <el-select v-model="configForm.cacheStrategy" placeholder="请选择缓存策略" style="width: 100%;">
            <el-option label="不缓存" value="none" />
            <el-option label="内存缓存" value="memory" />
            <el-option label="Redis缓存" value="redis" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="缓存时间">
          <el-input-number 
            v-model="configForm.cacheTime" 
            :min="0" 
            :max="86400" 
            controls-position="right" 
            style="width: 100%;" 
          />
          <span class="form-tip">秒（0表示不过期）</span>
        </el-form-item>
        
        <el-form-item label="日志级别">
          <el-select v-model="configForm.logLevel" placeholder="请选择日志级别" style="width: 100%;">
            <el-option label="关闭" value="off" />
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="configDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 功能依赖关系配置对话框 -->
    <el-dialog v-model="dependencyDialogVisible" title="功能依赖关系配置" width="700px">
      <el-form :model="dependencyForm" label-width="120px">
        <el-form-item label="功能模块">
          {{ dependencyForm.featureName }}
        </el-form-item>
        
        <el-form-item label="前置依赖">
          <el-select 
            v-model="dependencyForm.dependencies" 
            multiple 
            placeholder="请选择前置依赖功能"
            style="width: 100%;"
          >
            <el-option 
              v-for="feature in availableFeatures" 
              :key="feature.id" 
              :label="feature.name" 
              :value="feature.id" 
              :disabled="feature.id === dependencyForm.featureId"
            />
          </el-select>
          <div class="form-tip">该功能启动前必须先启动的其他功能</div>
        </el-form-item>
        
        <el-form-item label="冲突功能">
          <el-select 
            v-model="dependencyForm.conflicts" 
            multiple 
            placeholder="请选择冲突功能"
            style="width: 100%;"
          >
            <el-option 
              v-for="feature in availableFeatures" 
              :key="feature.id" 
              :label="feature.name" 
              :value="feature.id" 
              :disabled="feature.id === dependencyForm.featureId"
            />
          </el-select>
          <div class="form-tip">不能与此功能同时启用的其他功能</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dependencyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDependency">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 功能切换历史记录对话框 -->
    <el-dialog v-model="historyDialogVisible" title="功能切换历史记录" width="800px">
      <el-table :data="historyData" style="width: 100%">
        <el-table-column prop="time" label="切换时间" width="180" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="action" label="操作类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.action === 'enable' ? 'success' : 'danger'">
              {{ scope.row.action === 'enable' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因说明" />
        <el-table-column prop="version" label="版本" width="100" />
      </el-table>
      
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="historyPage"
          v-model:page-size="historyPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="historyTotal"
          @size-change="handleHistorySizeChange"
          @current-change="handleHistoryCurrentChange"
        />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="historyDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 功能使用统计对话框 -->
    <el-dialog v-model="statsDialogVisible" title="功能使用统计" width="700px">
      <div ref="statsChartRef" style="height: 400px;"></div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, Document, DataLine, Setting, House, Coin, CreditCard, Tools, 
  Phone, Monitor, TrendCharts, Warning, Lock, Message, Operation,
  SuccessFilled, InfoFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 图表引用
const statsChartRef = ref()

// 图表实例
let statsChart: any = null

// 响应式数据
const stats = ref({
  enabledCount: 6,
  disabledCount: 2,
  warningCount: 1,
  errorCount: 1
})

const featureList = ref([
  {
    id: 1,
    name: '用户管理',
    icon: 'User',
    description: '管理用户信息、权限分配等',
    enabled: true,
    status: 'normal', // normal, warning, error
    usageCount: 1256,
    hasRollback: false
  },
  {
    id: 2,
    name: '寝室管理',
    icon: 'House',
    description: '管理寝室分配、入住情况等',
    enabled: true,
    status: 'normal',
    usageCount: 892,
    hasRollback: true
  },
  {
    id: 3,
    name: '费用管理',
    icon: 'Coin',
    description: '管理各类费用的收取、统计等',
    enabled: true,
    status: 'warning',
    usageCount: 2103,
    hasRollback: true
  },
  {
    id: 4,
    name: '支付管理',
    icon: 'CreditCard',
    description: '处理支付流程、对账等',
    enabled: true,
    status: 'normal',
    usageCount: 1756,
    hasRollback: false
  },
  {
    id: 5,
    name: '系统配置',
    icon: 'Tools',
    description: '系统参数设置、基础配置等',
    enabled: true,
    status: 'normal',
    usageCount: 423,
    hasRollback: false
  },
  {
    id: 6,
    name: '客户端功能',
    icon: 'Phone',
    description: '移动端功能控制、版本管理等',
    enabled: true,
    status: 'normal',
    usageCount: 3456,
    hasRollback: true
  },
  {
    id: 7,
    name: '数据监控',
    icon: 'Monitor',
    description: '实时监控系统运行状态',
    enabled: false,
    status: 'error',
    usageCount: 0,
    hasRollback: false
  },
  {
    id: 8,
    name: '行为分析',
    icon: 'TrendCharts',
    description: '分析用户行为模式',
    enabled: true,
    status: 'normal',
    usageCount: 789,
    hasRollback: false
  }
])

const permissionDialogVisible = ref(false)
const configDialogVisible = ref(false)
const dependencyDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const statsDialogVisible = ref(false)

const permissionForm = ref({
  featureId: 0,
  featureName: '',
  allowedRoles: [] as number[],
  whitelistUsers: [] as number[],
  whitelistIPs: ''
})

const configForm = ref({
  featureId: 0,
  featureName: '',
  maxConcurrency: 100,
  rateLimit: 1000,
  cacheStrategy: 'memory',
  cacheTime: 300,
  logLevel: 'info'
})

const dependencyForm = ref({
  featureId: 0,
  featureName: '',
  dependencies: [] as number[],
  conflicts: [] as number[]
})

const roleList = ref([
  { id: 1, name: '超级管理员' },
  { id: 2, name: '管理员' },
  { id: 3, name: '普通用户' },
  { id: 4, name: '访客' }
])

const userList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

const availableFeatures = ref([
  { id: 1, name: '用户管理' },
  { id: 2, name: '寝室管理' },
  { id: 3, name: '费用管理' },
  { id: 4, name: '支付管理' },
  { id: 5, name: '系统配置' },
  { id: 6, name: '客户端功能' },
  { id: 7, name: '数据监控' },
  { id: 8, name: '行为分析' }
])

const historyData = ref([
  {
    time: '2023-10-15 14:30:25',
    operator: '管理员',
    action: 'enable',
    reason: '新功能上线',
    version: 'v1.2.0'
  },
  {
    time: '2023-10-10 09:15:42',
    operator: '系统',
    action: 'disable',
    reason: '功能异常，自动禁用',
    version: 'v1.1.5'
  },
  {
    time: '2023-09-25 16:42:18',
    operator: '管理员',
    action: 'enable',
    reason: '修复bug后重新启用',
    version: 'v1.1.3'
  }
])

const historyPage = ref(1)
const historyPageSize = ref(10)
const historyTotal = ref(25)

const userSearchLoading = ref(false)

// 获取功能状态类型
const getFeatureStatusType = (status: string) => {
  switch (status) {
    case 'normal':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取功能状态文本
const getFeatureStatusText = (status: string) => {
  switch (status) {
    case 'normal':
      return '正常'
    case 'warning':
      return '警告'
    case 'error':
      return '异常'
    default:
      return '未知'
  }
}

// 搜索用户
const searchUsers = (query: string) => {
  if (query !== '') {
    userSearchLoading.value = true
    setTimeout(() => {
      userSearchLoading.value = false
      // 模拟搜索结果
      userList.value = [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' }
      ].filter(item => item.name.includes(query))
    }, 200)
  } else {
    userList.value = []
  }
}

// 状态变更
const handleStatusChange = (row: any) => {
  console.log('🔄 功能模块状态变更:', row)
  ElMessage.success(`"${row.name}"功能模块状态已更新`)
  
  // 更新统计信息
  if (row.enabled) {
    stats.value.enabledCount++
    stats.value.disabledCount--
  } else {
    stats.value.enabledCount--
    stats.value.disabledCount++
  }
}

// 设置权限
const handlePermission = (row: any) => {
  permissionForm.value = {
    featureId: row.id,
    featureName: row.name,
    allowedRoles: [1, 2], // 默认允许超级管理员和管理员
    whitelistUsers: [],
    whitelistIPs: ''
  }
  permissionDialogVisible.value = true
}

// 功能配置
const handleConfig = (row: any) => {
  configForm.value = {
    featureId: row.id,
    featureName: row.name,
    maxConcurrency: 100,
    rateLimit: 1000,
    cacheStrategy: 'memory',
    cacheTime: 300,
    logLevel: 'info'
  }
  configDialogVisible.value = true
}

// 功能依赖关系配置
const handleDependency = (row: any) => {
  dependencyForm.value = {
    featureId: row.id,
    featureName: row.name,
    dependencies: [],
    conflicts: []
  }
  dependencyDialogVisible.value = true
}

// 功能切换历史记录
const handleHistory = (row: any) => {
  historyDialogVisible.value = true
}

// 功能回滚
const handleRollback = (row: any) => {
  ElMessageBox.confirm(
    `确定要回滚"${row.name}"功能到上一个稳定版本吗？`,
    '功能回滚确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('⏪ 功能回滚:', row)
    ElMessage.success('功能回滚成功')
  }).catch(() => {
    // 取消回滚
  })
}

// 功能使用统计
const handleStats = (row: any) => {
  statsDialogVisible.value = true
  // 初始化图表
  nextTick(() => {
    initStatsChart()
  })
}

// 初始化统计图表
const initStatsChart = () => {
  if (statsChartRef.value) {
    statsChart = echarts.init(statsChartRef.value)
    renderStatsChart()
  }
}

// 渲染统计图表
const renderStatsChart = () => {
  if (!statsChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['使用次数', '活跃用户']
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
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '使用次数',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210],
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '活跃用户',
        type: 'line',
        data: [80, 92, 71, 104, 60, 150, 130],
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
  
  statsChart.setOption(option)
}

// 保存权限设置
const savePermission = () => {
  console.log('🔐 保存权限设置:', permissionForm.value)
  ElMessage.success('权限设置保存成功')
  permissionDialogVisible.value = false
}

// 保存功能配置
const saveConfig = () => {
  console.log('⚙️ 保存功能配置:', configForm.value)
  ElMessage.success('功能配置保存成功')
  configDialogVisible.value = false
}

// 保存依赖关系配置
const saveDependency = () => {
  console.log('🔗 保存依赖关系配置:', dependencyForm.value)
  ElMessage.success('依赖关系配置保存成功')
  dependencyDialogVisible.value = false
}

// 保存设置
const handleSave = () => {
  console.log('💾 保存功能控制设置:', featureList.value)
  ElMessage.success('功能控制设置保存成功')
}

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新功能状态')
  ElMessage.success('功能状态刷新成功')
  
  // 模拟更新状态
  featureList.value.forEach(feature => {
    // 随机更新一些功能的状态
    if (Math.random() > 0.7) {
      const statuses = ['normal', 'warning', 'error']
      feature.status = statuses[Math.floor(Math.random() * statuses.length)]
    }
  })
  
  // 更新统计信息
  stats.value.warningCount = featureList.value.filter(f => f.status === 'warning').length
  stats.value.errorCount = featureList.value.filter(f => f.status === 'error').length
}

// 历史记录分页相关
const handleHistorySizeChange = (val: number) => {
  historyPageSize.value = val
  historyPage.value = 1
  console.log(`📈 历史记录每页显示 ${val} 条`)
}

const handleHistoryCurrentChange = (val: number) => {
  historyPage.value = val
  console.log(`📄 历史记录当前页: ${val}`)
}

// 组件挂载
onMounted(() => {
  console.log('🎛️ 功能模块控制页面加载完成')
})

// 监听窗口大小变化，重新渲染图表
window.addEventListener('resize', () => {
  if (statsChart) {
    statsChart.resize()
  }
})

/**
 * 功能模块控制页面
 * 控制各个功能模块的开启/关闭状态及配置
 */
</script>

<style scoped>
.feature-control-container {
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

.bg-info {
  background-color: #409EFF;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-danger {
  background-color: #F56C6C;
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
</style>