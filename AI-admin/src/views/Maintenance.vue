<template>
  <div class="maintenance-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统维护</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleStartMaintenance">开始维护</el-button>
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <!-- 维护状态 -->
      <el-alert
        :title="maintenanceStatus.title"
        :type="maintenanceStatus.type"
        :description="maintenanceStatus.description"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <!-- 维护操作 -->
      <el-tabs v-model="activeTab">
        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="系统名称">{{ systemInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="系统版本">{{ systemInfo.version }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">{{ systemInfo.environment }}</el-descriptions-item>
            <el-descriptions-item label="启动时间">{{ systemInfo.startTime }}</el-descriptions-item>
            <el-descriptions-item label="运行时长">{{ systemInfo.uptime }}</el-descriptions-item>
            <el-descriptions-item label="内存使用率">
              <el-progress :percentage="systemInfo.memoryUsage" :status="systemInfo.memoryUsage > 80 ? 'exception' : ''" />
            </el-descriptions-item>
            <el-descriptions-item label="CPU使用率">
              <el-progress :percentage="systemInfo.cpuUsage" :status="systemInfo.cpuUsage > 80 ? 'exception' : ''" />
            </el-descriptions-item>
            <el-descriptions-item label="磁盘使用率">
              <el-progress :percentage="systemInfo.diskUsage" :status="systemInfo.diskUsage > 90 ? 'exception' : ''" />
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <!-- 维护计划 -->
        <el-tab-pane label="维护计划" name="schedule">
          <div class="toolbar">
            <el-button type="primary" @click="handleAddSchedule">新增计划</el-button>
          </div>
          
          <el-table :data="scheduleList" border stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="计划名称" />
            <el-table-column prop="type" label="维护类型">
              <template #default="scope">
                <el-tag :type="getScheduleTypeTag(scope.row.type)">
                  {{ getScheduleTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="executeTime" label="执行时间" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getScheduleStatusTag(scope.row.status)">
                  {{ getScheduleStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="handleEditSchedule(scope.row)">编辑</el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeleteSchedule(scope.row)"
                  :disabled="scope.row.status === 'executing'"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 日志清理 -->
        <el-tab-pane label="日志清理" name="log">
          <el-form :model="logCleanForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="保留天数">
              <el-input-number v-model="logCleanForm.keepDays" :min="1" :max="365" />
              <span class="form-tip">天</span>
            </el-form-item>
            
            <el-form-item label="日志类型">
              <el-checkbox-group v-model="logCleanForm.logTypes">
                <el-checkbox label="system">系统日志</el-checkbox>
                <el-checkbox label="operation">操作日志</el-checkbox>
                <el-checkbox label="error">错误日志</el-checkbox>
                <el-checkbox label="access">访问日志</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleCleanLog">立即清理</el-button>
              <el-button @click="handleAnalyzeLog">分析日志</el-button>
            </el-form-item>
          </el-form>
          
          <el-divider />
          
          <h4>最近清理记录</h4>
          <el-table :data="logCleanRecords" border stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="cleanTime" label="清理时间" width="180" />
            <el-table-column prop="cleanType" label="清理类型" />
            <el-table-column prop="deletedCount" label="删除条数" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getCleanStatusTag(scope.row.status)">
                  {{ getCleanStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 数据库维护 -->
        <el-tab-pane label="数据库维护" name="database">
          <div class="toolbar">
            <el-button type="primary" @click="handleBackupDatabase">备份数据库</el-button>
            <el-button @click="handleOptimizeDatabase">优化数据库</el-button>
            <el-button @click="handleCheckDatabase">检查数据库</el-button>
          </div>
          
          <el-table :data="dbOperations" border stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="操作名称" />
            <el-table-column prop="startTime" label="开始时间" width="180" />
            <el-table-column prop="endTime" label="结束时间" width="180" />
            <el-table-column prop="duration" label="耗时" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getDbOpStatusTag(scope.row.status)">
                  {{ getDbOpStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button size="small" @click="handleViewDbDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 开始维护对话框 -->
    <el-dialog v-model="maintenanceDialogVisible" title="开始系统维护" width="600px">
      <el-form :model="maintenanceForm" :rules="maintenanceRules" ref="maintenanceFormRef" label-width="120px">
        <el-form-item label="维护类型" prop="type">
          <el-select v-model="maintenanceForm.type" placeholder="请选择维护类型" style="width: 100%;">
            <el-option label="日常维护" value="routine" />
            <el-option label="紧急修复" value="emergency" />
            <el-option label="版本升级" value="upgrade" />
            <el-option label="数据迁移" value="migration" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="预计时长" prop="duration">
          <el-input-number v-model="maintenanceForm.duration" :min="1" :max="1440" />
          <span class="form-tip">分钟</span>
        </el-form-item>
        
        <el-form-item label="维护说明" prop="description">
          <el-input 
            v-model="maintenanceForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入维护说明"
          />
        </el-form-item>
        
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="maintenanceForm.notifyMethods">
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="in-app">站内信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="maintenanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMaintenanceForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const activeTab = ref('info')
const maintenanceDialogVisible = ref(false)
const maintenanceFormRef = ref()

const maintenanceStatus = ref({
  title: '系统运行正常',
  type: 'success',
  description: '当前系统运行稳定，无维护任务进行中。'
})

const systemInfo = ref({
  name: 'AI管理系统',
  version: 'v2.1.0',
  environment: '生产环境',
  startTime: '2023-11-01 08:30:15',
  uptime: '15天 4小时 25分钟',
  memoryUsage: 65,
  cpuUsage: 32,
  diskUsage: 45
})

const scheduleList = ref([
  {
    id: 1,
    name: '每日日志清理',
    type: 'log',
    executeTime: '每天凌晨2:00',
    status: 'scheduled'
  },
  {
    id: 2,
    name: '每周数据库优化',
    type: 'database',
    executeTime: '每周日凌晨3:00',
    status: 'scheduled'
  },
  {
    id: 3,
    name: '每月数据备份',
    type: 'backup',
    executeTime: '每月1号凌晨1:00',
    status: 'executing'
  }
])

const logCleanForm = reactive({
  keepDays: 30,
  logTypes: ['system', 'operation', 'error']
})

const logCleanRecords = ref([
  {
    id: 1,
    cleanTime: '2023-11-15 02:05:23',
    cleanType: '系统日志清理',
    deletedCount: 12560,
    status: 'success'
  },
  {
    id: 2,
    cleanTime: '2023-11-14 02:03:45',
    cleanType: '操作日志清理',
    deletedCount: 8920,
    status: 'success'
  },
  {
    id: 3,
    cleanTime: '2023-11-13 02:07:12',
    cleanType: '错误日志清理',
    deletedCount: 156,
    status: 'success'
  }
])

const dbOperations = ref([
  {
    id: 1,
    name: '数据库备份',
    startTime: '2023-11-15 01:00:00',
    endTime: '2023-11-15 01:15:32',
    duration: '15分32秒',
    status: 'success'
  },
  {
    id: 2,
    name: '数据库优化',
    startTime: '2023-11-12 03:00:00',
    endTime: '2023-11-12 03:22:18',
    duration: '22分18秒',
    status: 'success'
  },
  {
    id: 3,
    name: '数据库检查',
    startTime: '2023-11-10 14:30:00',
    endTime: '2023-11-10 14:32:45',
    duration: '2分45秒',
    status: 'success'
  }
])

const maintenanceForm = reactive({
  type: 'routine',
  duration: 60,
  description: '',
  notifyMethods: ['email', 'in-app']
})

const maintenanceRules = {
  type: [{ required: true, message: '请选择维护类型', trigger: 'change' }],
  duration: [{ required: true, message: '请输入预计时长', trigger: 'change' }],
  description: [{ required: true, message: '请输入维护说明', trigger: 'blur' }]
}

// 获取维护计划类型文本
const getScheduleTypeText = (type: string) => {
  switch (type) {
    case 'log':
      return '日志清理'
    case 'database':
      return '数据库维护'
    case 'backup':
      return '数据备份'
    default:
      return '未知'
  }
}

// 获取维护计划类型标签
const getScheduleTypeTag = (type: string) => {
  switch (type) {
    case 'log':
      return 'primary'
    case 'database':
      return 'success'
    case 'backup':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取维护计划状态文本
const getScheduleStatusText = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '已计划'
    case 'executing':
      return '执行中'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    default:
      return '未知'
  }
}

// 获取维护计划状态标签
const getScheduleStatusTag = (status: string) => {
  switch (status) {
    case 'scheduled':
      return ''
    case 'executing':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'info'
    default:
      return 'info'
  }
}

// 获取清理状态文本
const getCleanStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'processing':
      return '处理中'
    default:
      return '未知'
  }
}

// 获取清理状态标签
const getCleanStatusTag = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取数据库操作状态文本
const getDbOpStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'processing':
      return '处理中'
    default:
      return '未知'
  }
}

// 获取数据库操作状态标签
const getDbOpStatusTag = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'info'
  }
}

// 开始维护
const handleStartMaintenance = () => {
  maintenanceDialogVisible.value = true
}

// 提交维护表单
const submitMaintenanceForm = () => {
  if (!maintenanceFormRef.value) return
  
  maintenanceFormRef.value.validate((valid: boolean) => {
    if (valid) {
      console.log('开始维护:', maintenanceForm)
      ElMessage.success('维护任务已启动')
      maintenanceDialogVisible.value = false
      
      // 更新维护状态
      maintenanceStatus.value = {
        title: '系统维护中',
        type: 'warning',
        description: `正在进行${getScheduleTypeText(maintenanceForm.type)}，预计${maintenanceForm.duration}分钟后完成。`
      }
    } else {
      ElMessage.error('请填写必填项')
    }
  })
}

// 刷新
const handleRefresh = () => {
  ElMessage.success('刷新成功')
}

// 新增计划
const handleAddSchedule = () => {
  ElMessage.info('新增计划功能待实现')
}

// 编辑计划
const handleEditSchedule = (row: any) => {
  console.log('编辑计划:', row)
  ElMessage.info('编辑计划功能待实现')
}

// 删除计划
const handleDeleteSchedule = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除维护计划"${row.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('删除计划:', row)
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 清理日志
const handleCleanLog = () => {
  console.log('清理日志:', logCleanForm)
  ElMessage.success('日志清理任务已启动')
}

// 分析日志
const handleAnalyzeLog = () => {
  ElMessage.info('日志分析功能待实现')
}

// 备份数据库
const handleBackupDatabase = () => {
  ElMessage.success('数据库备份任务已启动')
}

// 优化数据库
const handleOptimizeDatabase = () => {
  ElMessage.success('数据库优化任务已启动')
}

// 检查数据库
const handleCheckDatabase = () => {
  ElMessage.success('数据库检查任务已启动')
}

// 查看数据库详情
const handleViewDbDetail = (row: any) => {
  console.log('查看数据库详情:', row)
  ElMessage.info('查看详情功能待实现')
}

// 组件挂载
onMounted(() => {
  console.log('🔧 系统维护页面加载完成')
})

/**
 * 系统维护页面
 * 提供系统信息查看、维护计划管理、日志清理、数据库维护等功能
 */
</script>

<style scoped>
.maintenance-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.toolbar {
  margin-bottom: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
}
</style>