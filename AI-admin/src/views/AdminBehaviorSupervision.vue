<template>
  <div class="admin-behavior-supervision-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员行为监督</span>
          <el-button type="primary" @click="handleRefresh">刷新</el-button>
        </div>
      </template>
      
      <!-- 行为统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">管理员总数</div>
                <div class="stat-value">{{ stats.totalAdmins }}</div>
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
                <div class="stat-title">异常行为数</div>
                <div class="stat-value">{{ stats.abnormalBehaviors }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">合规率</div>
                <div class="stat-value">{{ stats.complianceRate }}%</div>
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
                <div class="stat-title">本周异常</div>
                <div class="stat-value">{{ stats.weeklyAbnormal }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="管理员">
            <el-select v-model="searchForm.admin" placeholder="请选择管理员" clearable filterable>
              <el-option 
                v-for="admin in adminList" 
                :key="admin.id" 
                :label="admin.name" 
                :value="admin.id" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="行为类型">
            <el-select v-model="searchForm.behaviorType" placeholder="请选择行为类型" clearable>
              <el-option label="登录" value="login" />
              <el-option label="登出" value="logout" />
              <el-option label="新增数据" value="create" />
              <el-option label="修改数据" value="update" />
              <el-option label="删除数据" value="delete" />
              <el-option label="权限变更" value="permission" />
              <el-option label="系统配置" value="config" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="风险等级">
            <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
              <el-option label="低风险" value="low" />
              <el-option label="中风险" value="medium" />
              <el-option label="高风险" value="high" />
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
      
      <!-- 行为列表 -->
      <el-table :data="behaviorList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="adminName" label="管理员" width="120" />
        <el-table-column prop="behaviorType" label="行为类型" width="120">
          <template #default="scope">
            {{ getBehaviorTypeText(scope.row.behaviorType) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="行为描述" />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column prop="riskLevel" label="风险等级" width="100">
          <template #default="scope">
            <el-tag :type="getRiskLevelTagType(scope.row.riskLevel)">
              {{ getRiskLevelText(scope.row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="behaviorTime" label="行为时间" width="160" />
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
    
    <!-- 行为详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="行为详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="行为ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="管理员">{{ detailData.adminName }}</el-descriptions-item>
        <el-descriptions-item label="行为类型">{{ getBehaviorTypeText(detailData.behaviorType) }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :type="getRiskLevelTagType(detailData.riskLevel)">
            {{ getRiskLevelText(detailData.riskLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="行为描述" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="code-block">{{ detailData.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre class="code-block">{{ detailData.responseResult }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detailData.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ detailData.os }}</el-descriptions-item>
        <el-descriptions-item label="行为时间">{{ detailData.behaviorTime }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.duration }}ms</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="danger" 
            @click="handleBlockAdmin(detailData)" 
            :disabled="detailData.blocked"
          >
            {{ detailData.blocked ? '已封禁' : '封禁管理员' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Warning, Check, DataLine } from '@element-plus/icons-vue'

// 响应式数据
const stats = ref({
  totalAdmins: 12,
  abnormalBehaviors: 3,
  complianceRate: 97.5,
  weeklyAbnormal: 1
})

const behaviorList = ref([
  {
    id: 1,
    adminId: 1,
    adminName: '张三',
    behaviorType: 'delete',
    description: '批量删除用户数据',
    ipAddress: '192.168.1.100',
    browser: 'Chrome 95.0.4638.69',
    os: 'Windows 10',
    behaviorTime: '2023-11-01 10:35:18',
    riskLevel: 'high',
    duration: 120,
    blocked: false,
    requestParams: '{\n  "ids": [1001, 1002, 1003, ...],\n  "reason": "清理无效数据"\n}',
    responseResult: '{\n  "code": 200,\n  "message": "操作成功",\n  "data": {\n    "deletedCount": 50\n  }\n}'
  },
  {
    id: 2,
    adminId: 2,
    adminName: '李四',
    behaviorType: 'permission',
    description: '修改用户权限配置',
    ipAddress: '192.168.1.101',
    browser: 'Firefox 94.0',
    os: 'macOS 12.0',
    behaviorTime: '2023-11-01 09:45:33',
    riskLevel: 'medium',
    duration: 85,
    blocked: false,
    requestParams: '{\n  "userId": 2001,\n  "permissions": ["user.read", "user.write", "admin.read"]\n}',
    responseResult: '{\n  "code": 200,\n  "message": "权限更新成功"\n}'
  },
  {
    id: 3,
    adminId: 3,
    adminName: '王五',
    behaviorType: 'config',
    description: '修改系统核心配置',
    ipAddress: '192.168.1.102',
    browser: 'Safari 15.0',
    os: 'iOS 15',
    behaviorTime: '2023-10-31 15:22:45',
    riskLevel: 'high',
    duration: 0,
    blocked: false,
    requestParams: '{\n  "configKey": "system.security.level",\n  "configValue": "low"\n}',
    responseResult: '{\n  "code": 200,\n  "message": "配置更新成功"\n}'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  admin: '',
  behaviorType: '',
  riskLevel: '',
  dateRange: []
})

const detailDialogVisible = ref(false)

const detailData = ref({
  id: 0,
  adminId: 0,
  adminName: '',
  behaviorType: '',
  description: '',
  ipAddress: '',
  browser: '',
  os: '',
  behaviorTime: '',
  riskLevel: '',
  duration: 0,
  blocked: false,
  requestParams: '',
  responseResult: ''
})

const adminList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
  { id: 5, name: '孙七' }
])

// 获取行为类型文本
const getBehaviorTypeText = (type: string) => {
  switch (type) {
    case 'login':
      return '登录'
    case 'logout':
      return '登出'
    case 'create':
      return '新增数据'
    case 'update':
      return '修改数据'
    case 'delete':
      return '删除数据'
    case 'permission':
      return '权限变更'
    case 'config':
      return '系统配置'
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
    default:
      return '未知'
  }
}

// 获取风险等级标签类型
const getRiskLevelTagType = (level: string) => {
  switch (level) {
    case 'low':
      return 'success'
    case 'medium':
      return 'warning'
    case 'high':
      return 'danger'
    default:
      return 'info'
  }
}

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新管理员行为数据')
  ElMessage.success('数据刷新成功')
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索管理员行为:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    admin: '',
    behaviorType: '',
    riskLevel: '',
    dateRange: []
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 封禁管理员
const handleBlockAdmin = (row: any) => {
  ElMessageBox.confirm(
    `确定要封禁管理员"${row.adminName}"吗？此操作不可逆。`,
    '确认封禁',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('🚫 封禁管理员:', row)
    ElMessage.success(`管理员"${row.adminName}"已封禁`)
    
    // 更新状态
    const index = behaviorList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      behaviorList.value[index].blocked = true
    }
    
    detailDialogVisible.value = false
  }).catch(() => {
    // 用户取消操作
  })
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
  console.log('👮 管理员行为监督页面加载完成')
})

/**
 * 管理员行为监督页面
 * 监督和审计管理员的行为操作
 */
</script>

<style scoped>
.admin-behavior-supervision-container {
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

.bg-warning {
  background-color: #E6A23C;
}

.bg-success {
  background-color: #67C23A;
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