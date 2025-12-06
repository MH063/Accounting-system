<template>
  <div class="gray-release-control-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>灰度发布控制</span>
          <el-button type="primary" @click="handleCreate">创建灰度策略</el-button>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以创建和管理灰度发布策略，控制新功能对不同用户群体的开放程度"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 灰度策略概览 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">总策略数</div>
                <div class="stat-value">{{ stats.total }}</div>
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
                <div class="stat-title">进行中</div>
                <div class="stat-value">{{ stats.inProgress }}</div>
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
                <div class="stat-title">待开始</div>
                <div class="stat-value">{{ stats.pending }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><Finished /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">已完成</div>
                <div class="stat-value">{{ stats.completed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="策略名称">
            <el-input v-model="searchForm.name" placeholder="请输入策略名称" clearable />
          </el-form-item>
          
          <el-form-item label="功能名称">
            <el-input v-model="searchForm.featureName" placeholder="请输入功能名称" clearable />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待开始" value="pending" />
              <el-option label="进行中" value="in-progress" />
              <el-option label="暂停" value="paused" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 灰度策略列表 -->
      <el-table :data="strategyList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="策略名称" />
        <el-table-column prop="featureName" label="功能名称" />
        <el-table-column prop="targetGroup" label="目标用户组" width="150">
          <template #default="scope">
            {{ getUserGroupText(scope.row.targetGroup) }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.progress" 
              :status="getProgressStatus(scope.row.status)" 
            />
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="预计结束时间" width="160" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              @click="handleEdit(scope.row)" 
              :disabled="scope.row.status === 'completed'"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              :type="getActionButtonType(scope.row.status)" 
              @click="handleAction(scope.row)"
            >
              {{ getActionText(scope.row.status) }}
            </el-button>
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
    
    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入策略名称" />
        </el-form-item>
        
        <el-form-item label="关联功能" prop="featureId">
          <el-select 
            v-model="formData.featureId" 
            placeholder="请选择关联功能" 
            style="width: 100%;"
            @change="handleFeatureChange"
          >
            <el-option 
              v-for="feature in featureList" 
              :key="feature.id" 
              :label="feature.name" 
              :value="feature.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="功能描述">
          {{ selectedFeatureDescription }}
        </el-form-item>
        
        <el-form-item label="目标用户组" prop="targetGroup">
          <el-select v-model="formData.targetGroup" placeholder="请选择目标用户组" style="width: 100%;">
            <el-option label="所有用户" value="all" />
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="VIP用户" value="vip" />
            <el-option label="内测用户" value="beta" />
            <el-option label="按地区划分" value="region" />
            <el-option label="按设备类型划分" value="device" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="用户筛选条件" v-if="formData.targetGroup === 'region' || formData.targetGroup === 'device'">
          <el-input 
            v-model="formData.userFilter" 
            placeholder="请输入筛选条件，如地区：北京、上海；设备：iOS、Android" 
          />
        </el-form-item>
        
        <el-form-item label="初始发布比例" prop="initialPercentage">
          <el-slider 
            v-model="formData.initialPercentage" 
            :min="0" 
            :max="100" 
            show-input 
            style="width: 100%;" 
          />
          <span class="form-tip">% (0-100)</span>
        </el-form-item>
        
        <el-form-item label="发布节奏" prop="releasePace">
          <el-select v-model="formData.releasePace" placeholder="请选择发布节奏" style="width: 100%;">
            <el-option label="快速发布（每天增加20%）" value="fast" />
            <el-option label="中速发布（每天增加10%）" value="medium" />
            <el-option label="慢速发布（每天增加5%）" value="slow" />
            <el-option label="自定义节奏" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="自定义节奏" v-if="formData.releasePace === 'custom'">
          <el-input-number 
            v-model="formData.customPace" 
            :min="1" 
            :max="100" 
            controls-position="right" 
            style="width: 100%;" 
          />
          <span class="form-tip">% 每天增长比例</span>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            type="datetime"
            placeholder="请选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="预计结束时间" prop="endTime">
          <el-date-picker
            v-model="formData.endTime"
            type="datetime"
            placeholder="请选择预计结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="异常处理策略">
          <el-select v-model="formData.exceptionStrategy" placeholder="请选择异常处理策略" style="width: 100%;">
            <el-option label="自动回滚" value="rollback" />
            <el-option label="暂停发布" value="pause" />
            <el-option label="继续发布" value="continue" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="pending">待开始</el-radio>
            <el-radio label="in-progress">进行中</el-radio>
            <el-radio label="paused">暂停</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="策略详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="策略名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="关联功能">{{ getFeatureText(detailData.featureId) }}</el-descriptions-item>
        <el-descriptions-item label="功能描述" :span="2">{{ getFeatureDescription(detailData.featureId) }}</el-descriptions-item>
        <el-descriptions-item label="目标用户组">{{ getUserGroupText(detailData.targetGroup) }}</el-descriptions-item>
        <el-descriptions-item label="用户筛选条件">{{ detailData.userFilter || '无' }}</el-descriptions-item>
        <el-descriptions-item label="初始发布比例">{{ detailData.initialPercentage }}%</el-descriptions-item>
        <el-descriptions-item label="发布节奏">{{ getReleasePaceText(detailData.releasePace) }}</el-descriptions-item>
        <el-descriptions-item label="自定义节奏" v-if="detailData.releasePace === 'custom'">{{ detailData.customPace }}%/天</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detailData.startTime }}</el-descriptions-item>
        <el-descriptions-item label="预计结束时间">{{ detailData.endTime }}</el-descriptions-item>
        <el-descriptions-item label="实际结束时间">{{ detailData.actualEndTime || '未结束' }}</el-descriptions-item>
        <el-descriptions-item label="异常处理策略">{{ getExceptionStrategyText(detailData.exceptionStrategy) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前进度">
          <el-progress 
            :percentage="detailData.progress" 
            :status="getProgressStatus(detailData.status)" 
          />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updateTime }}</el-descriptions-item>
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Check, Warning, Finished } from '@element-plus/icons-vue'

// 响应式数据
const stats = ref({
  total: 8,
  inProgress: 3,
  pending: 2,
  completed: 3
})

const strategyList = ref([
  {
    id: 1,
    name: '新支付功能灰度策略',
    featureId: 4,
    featureName: '支付功能升级',
    targetGroup: 'all',
    userFilter: '',
    initialPercentage: 10,
    releasePace: 'medium',
    customPace: 10,
    startTime: '2023-11-01 10:00:00',
    endTime: '2023-11-10 10:00:00',
    actualEndTime: '2023-11-09 15:30:00',
    exceptionStrategy: 'rollback',
    status: 'completed',
    progress: 100,
    createTime: '2023-10-25 10:00:00',
    updateTime: '2023-11-09 15:30:00'
  },
  {
    id: 2,
    name: '夜间模式灰度策略',
    featureId: 2,
    featureName: '夜间模式',
    targetGroup: 'beta',
    userFilter: '',
    initialPercentage: 20,
    releasePace: 'slow',
    customPace: 5,
    startTime: '2023-11-15 10:00:00',
    endTime: '2023-11-30 10:00:00',
    actualEndTime: '',
    exceptionStrategy: 'pause',
    status: 'in-progress',
    progress: 65,
    createTime: '2023-11-10 10:00:00',
    updateTime: '2023-11-20 10:00:00'
  },
  {
    id: 3,
    name: '智能推荐灰度策略',
    featureId: 1,
    featureName: '智能推荐功能',
    targetGroup: 'vip',
    userFilter: '',
    initialPercentage: 5,
    releasePace: 'fast',
    customPace: 20,
    startTime: '2023-12-01 10:00:00',
    endTime: '2023-12-05 10:00:00',
    actualEndTime: '',
    exceptionStrategy: 'continue',
    status: 'pending',
    progress: 0,
    createTime: '2023-11-20 10:00:00',
    updateTime: '2023-11-25 10:00:00'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  name: '',
  featureName: '',
  status: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  name: '',
  featureId: 0,
  targetGroup: 'all',
  userFilter: '',
  initialPercentage: 10,
  releasePace: 'medium',
  customPace: 10,
  startTime: '',
  endTime: '',
  exceptionStrategy: 'rollback',
  status: 'pending'
})

const detailData = ref({
  id: 0,
  name: '',
  featureId: 0,
  targetGroup: 'all',
  userFilter: '',
  initialPercentage: 10,
  releasePace: 'medium',
  customPace: 10,
  startTime: '',
  endTime: '',
  actualEndTime: '',
  exceptionStrategy: 'rollback',
  status: 'pending',
  progress: 0,
  createTime: '',
  updateTime: ''
})

const formRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  featureId: [{ required: true, message: '请选择关联功能', trigger: 'change' }],
  targetGroup: [{ required: true, message: '请选择目标用户组', trigger: 'change' }],
  initialPercentage: [{ required: true, message: '请设置初始发布比例', trigger: 'blur' }],
  releasePace: [{ required: true, message: '请选择发布节奏', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择预计结束时间', trigger: 'change' }]
}

const formRef = ref()

const featureList = ref([
  { id: 1, name: '智能推荐功能', description: '根据用户行为智能推荐相关内容' },
  { id: 2, name: '夜间模式', description: '提供夜间护眼模式' },
  { id: 3, name: '语音助手', description: '提供语音交互功能' },
  { id: 4, name: '支付功能升级', description: '优化支付流程，提升支付体验' }
])

// 计算属性
const selectedFeatureDescription = computed(() => {
  const feature = featureList.value.find(item => item.id === formData.value.featureId)
  return feature ? feature.description : ''
})

// 获取用户组文本
const getUserGroupText = (group: string) => {
  switch (group) {
    case 'all':
      return '所有用户'
    case 'admin':
      return '管理员'
    case 'user':
      return '普通用户'
    case 'vip':
      return 'VIP用户'
    case 'beta':
      return '内测用户'
    case 'region':
      return '按地区划分'
    case 'device':
      return '按设备类型划分'
    default:
      return '未知'
  }
}

// 获取发布节奏文本
const getReleasePaceText = (pace: string) => {
  switch (pace) {
    case 'fast':
      return '快速发布（每天增加20%）'
    case 'medium':
      return '中速发布（每天增加10%）'
    case 'slow':
      return '慢速发布（每天增加5%）'
    case 'custom':
      return '自定义节奏'
    default:
      return '未知'
  }
}

// 获取异常处理策略文本
const getExceptionStrategyText = (strategy: string) => {
  switch (strategy) {
    case 'rollback':
      return '自动回滚'
    case 'pause':
      return '暂停发布'
    case 'continue':
      return '继续发布'
    default:
      return '未知'
  }
}

// 获取功能文本
const getFeatureText = (featureId: number) => {
  const feature = featureList.value.find(item => item.id === featureId)
  return feature ? feature.name : '未知功能'
}

// 获取功能描述
const getFeatureDescription = (featureId: number) => {
  const feature = featureList.value.find(item => item.id === featureId)
  return feature ? feature.description : '无描述'
}

// 获取进度状态
const getProgressStatus = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in-progress':
      return 'warning'
    case 'paused':
      return 'exception'
    default:
      return ''
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return ''
    case 'in-progress':
      return 'warning'
    case 'paused':
      return 'info'
    case 'completed':
      return 'success'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待开始'
    case 'in-progress':
      return '进行中'
    case 'paused':
      return '暂停'
    case 'completed':
      return '已完成'
    default:
      return '未知'
  }
}

// 获取操作按钮类型
const getActionButtonType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'primary'
    case 'in-progress':
      return 'warning'
    case 'paused':
      return 'primary'
    case 'completed':
      return 'info'
    default:
      return 'primary'
  }
}

// 获取操作文本
const getActionText = (status: string) => {
  switch (status) {
    case 'pending':
      return '启动'
    case 'in-progress':
      return '暂停'
    case 'paused':
      return '恢复'
    case 'completed':
      return '已完成'
    default:
      return '操作'
  }
}

// 功能变更处理
const handleFeatureChange = (featureId: number) => {
  const feature = featureList.value.find(item => item.id === featureId)
  if (feature) {
    formData.value.name = `${feature.name}灰度策略`
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索灰度策略:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    featureName: '',
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 创建灰度策略
const handleCreate = () => {
  dialogTitle.value = '创建灰度策略'
  isEdit.value = false
  formData.value = {
    id: 0,
    name: '',
    featureId: 0,
    targetGroup: 'all',
    userFilter: '',
    initialPercentage: 10,
    releasePace: 'medium',
    customPace: 10,
    startTime: '',
    endTime: '',
    exceptionStrategy: 'rollback',
    status: 'pending'
  }
  dialogVisible.value = true
}

// 编辑策略
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑灰度策略'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 操作策略（启动/暂停/恢复）
const handleAction = (row: any) => {
  console.log('⚙️ 操作灰度策略:', row)
  let action = ''
  switch (row.status) {
    case 'pending':
      action = '启动'
      row.status = 'in-progress'
      break
    case 'in-progress':
      action = '暂停'
      row.status = 'paused'
      break
    case 'paused':
      action = '恢复'
      row.status = 'in-progress'
      break
    default:
      action = '操作'
  }
  ElMessage.success(`"${row.name}"策略${action}成功`)
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑灰度策略:', formData.value)
        ElMessage.success('灰度策略编辑成功')
      } else {
        console.log('➕ 创建灰度策略:', formData.value)
        ElMessage.success('灰度策略创建成功')
      }
      dialogVisible.value = false
    } else {
      ElMessage.warning('请填写完整信息')
    }
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
  console.log('🎯 灰度发布控制页面加载完成')
})

/**
 * 灰度发布控制页面
 * 管理灰度发布策略的创建、编辑和控制
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

.form-tip {
  margin-left: 10px;
  color: #909399;
}
</style>