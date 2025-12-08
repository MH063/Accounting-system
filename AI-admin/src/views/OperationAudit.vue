<template>
  <div class="operation-audit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作审计</span>
          <div class="header-actions">
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="exportAuditData">导出</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索表单 -->
      <el-form 
        :model="searchForm" 
        :inline="true" 
        label-width="80px" 
        class="search-form"
      >
        <el-form-item label="操作用户">
          <el-input 
            v-model="searchForm.user" 
            placeholder="请输入用户名" 
            clearable
            style="width: 150px;"
          />
        </el-form-item>
        
        <el-form-item label="操作类型">
          <el-select 
            v-model="searchForm.operationType" 
            placeholder="请选择操作类型" 
            clearable
            style="width: 150px;"
          >
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="查询" value="query" />
            <el-option label="导出" value="export" />
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="操作模块">
          <el-select 
            v-model="searchForm.module" 
            placeholder="请选择模块" 
            clearable
            style="width: 150px;"
          >
            <el-option label="用户管理" value="user" />
            <el-option label="寝室管理" value="dormitory" />
            <el-option label="费用管理" value="fee" />
            <el-option label="支付管理" value="payment" />
            <el-option label="系统配置" value="system" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.operateTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 220px;"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 统计信息 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">今日操作数</div>
              <div class="stat-value">{{ auditStats.todayOperations }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">活跃用户数</div>
              <div class="stat-value">{{ auditStats.activeUsers }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">异常操作数</div>
              <div class="stat-value">{{ auditStats.abnormalOperations }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">审计覆盖率</div>
              <div class="stat-value">{{ auditStats.coverageRate }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 审计记录表格 -->
      <el-table 
        :data="auditRecords" 
        v-loading="loading" 
        style="width: 100%; margin-top: 20px;"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user" label="操作用户" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="getOperationTypeTag(scope.row.operationType)">
              {{ getOperationTypeText(scope.row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="120">
          <template #default="scope">
            {{ getModuleText(scope.row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="operateTime" label="操作时间" width="180" />
        <el-table-column prop="result" label="操作结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'">
              {{ scope.row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(ms)" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button size="small" type="primary" @click="replayOperation(scope.row)">重放</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="操作详情" 
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="操作用户">{{ detailData.user }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getOperationTypeText(detailData.operationType) }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ getModuleText(detailData.module) }}</el-descriptions-item>
        <el-descriptions-item label="操作描述">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detailData.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ detailData.os }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ detailData.operateTime }}</el-descriptions-item>
        <el-descriptions-item label="操作结果">
          <el-tag :type="detailData.result === 'success' ? 'success' : 'danger'">
            {{ detailData.result === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.duration }} ms</el-descriptions-item>
        <el-descriptions-item label="请求参数" v-if="detailData.requestParams">
          <pre class="code-block">{{ detailData.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" v-if="detailData.responseResult">
          <pre class="code-block">{{ detailData.responseResult }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationAuditApi } from '@/api/operationAudit'

// 定义类型
interface AuditRecord {
  id: number
  user: string
  operationType: 'create' | 'update' | 'delete' | 'query' | 'export' | 'login' | 'logout'
  module: 'user' | 'dormitory' | 'fee' | 'payment' | 'system'
  description: string
  ipAddress: string
  browser: string
  os: string
  operateTime: string
  result: 'success' | 'fail'
  duration: number
  requestParams?: string
  responseResult?: string
}

interface AuditStats {
  todayOperations: number
  activeUsers: number
  abnormalOperations: number
  coverageRate: number
}

// 响应式数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const auditRecords = ref<AuditRecord[]>([])
const detailDialogVisible = ref(false)
const detailData = ref<AuditRecord>({} as AuditRecord)

const searchForm = ref({
  user: '',
  operationType: '',
  module: '',
  operateTime: []
})

const auditStats = ref<AuditStats>({
  todayOperations: 0,
  activeUsers: 0,
  abnormalOperations: 0,
  coverageRate: 0
})

// 获取操作类型标签类型
const getOperationTypeTag = (type: string) => {
  switch (type) {
    case 'create':
      return 'success'
    case 'update':
      return 'warning'
    case 'delete':
      return 'danger'
    case 'query':
      return 'info'
    case 'export':
      return 'primary'
    case 'login':
      return ''
    case 'logout':
      return ''
    default:
      return 'info'
  }
}

// 获取操作类型文本
const getOperationTypeText = (type: string) => {
  switch (type) {
    case 'create':
      return '创建'
    case 'update':
      return '更新'
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

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadAuditRecords()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    user: '',
    operationType: '',
    module: '',
    operateTime: []
  }
  currentPage.value = 1
  loadAuditRecords()
}

// 刷新
const handleRefresh = () => {
  loadAuditRecords()
  loadAuditStats()
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  loadAuditRecords()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadAuditRecords()
}

// 查看详情
const viewDetail = (row: AuditRecord) => {
  detailData.value = row
  detailDialogVisible.value = true
}

// 重放操作
const replayOperation = (row: AuditRecord) => {
  ElMessageBox.confirm(
    `确定要重放此操作吗？这可能会产生相同的操作效果。`,
    '操作重放确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该调用API来重放操作
    console.log('重放操作:', row)
    ElMessage.success('操作重放成功')
  }).catch(() => {
    // 取消重放
  })
}

// 导出审计数据
const exportAuditData = () => {
  ElMessageBox.confirm(
    '确定要导出当前筛选条件下的所有审计数据吗？',
    '导出确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 这里应该调用API来导出数据
    console.log('导出审计数据:', searchForm.value)
    ElMessage.success('审计数据导出成功')
  }).catch(() => {
    // 取消导出
  })
}

// 加载审计记录
const loadAuditRecords = async () => {
  loading.value = true
  try {
    // 构造请求参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      user: searchForm.value.user || undefined,
      operationType: searchForm.value.operationType || undefined,
      module: searchForm.value.module || undefined,
      startTime: searchForm.value.operateTime?.[0] || undefined,
      endTime: searchForm.value.operateTime?.[1] || undefined
    }
    
    // 调用API获取审计记录
    const response = await operationAuditApi.getAuditRecords(params)
    const data = response.data || response
    
    auditRecords.value = data.records || []
    total.value = data.total || 0
    
    ElMessage.success('审计记录加载成功')
  } catch (error) {
    console.error('加载审计记录失败:', error)
    ElMessage.error('加载审计记录失败')
  } finally {
    loading.value = false
  }
}

// 加载审计统计
const loadAuditStats = async () => {
  try {
    // 调用API获取审计统计
    const response = await operationAuditApi.getAuditStats()
    const data = response.data || response
    
    auditStats.value = data
    
    ElMessage.success('审计统计加载成功')
  } catch (error) {
    console.error('加载审计统计失败:', error)
    ElMessage.error('加载审计统计失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAuditRecords()
  loadAuditStats()
  
  console.log('📊 操作审计页面加载完成')
})
</script>

<style scoped>
.operation-audit-container {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.code-block {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}
</style>