<template>
  <div class="new-feature-release-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新功能发布</span>
          <el-button type="primary" @click="handleCreate">创建新功能</el-button>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以创建和管理新功能的发布计划，包括功能描述、发布时间、目标用户等"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="功能名称">
            <el-input v-model="searchForm.name" placeholder="请输入功能名称" clearable />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="草稿" value="draft" />
              <el-option label="待发布" value="pending" />
              <el-option label="已发布" value="released" />
              <el-option label="已废弃" value="deprecated" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 新功能列表 -->
      <el-table :data="featureList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="功能名称" />
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="description" label="功能描述" />
        <el-table-column prop="targetUsers" label="目标用户" width="150">
          <template #default="scope">
            {{ getUserTypeText(scope.row.targetUsers) }}
          </template>
        </el-table-column>
        <el-table-column prop="releaseDate" label="计划发布时间" width="160" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handlePublish(scope.row)" 
              :disabled="scope.row.status !== 'pending'"
            >
              发布
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
        <el-form-item label="功能名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入功能名称" />
        </el-form-item>
        
        <el-form-item label="版本号" prop="version">
          <el-input v-model="formData.version" placeholder="请输入版本号，如 v1.0.0" />
        </el-form-item>
        
        <el-form-item label="功能描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入功能描述" 
          />
        </el-form-item>
        
        <el-form-item label="详细说明">
          <el-input 
            v-model="formData.details" 
            type="textarea" 
            :rows="5" 
            placeholder="请输入功能的详细说明、使用方法等" 
          />
        </el-form-item>
        
        <el-form-item label="目标用户" prop="targetUsers">
          <el-select v-model="formData.targetUsers" placeholder="请选择目标用户" style="width: 100%;">
            <el-option label="所有用户" value="all" />
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="VIP用户" value="vip" />
            <el-option label="内测用户" value="beta" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="计划发布时间" prop="releaseDate">
          <el-date-picker
            v-model="formData.releaseDate"
            type="datetime"
            placeholder="请选择计划发布时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="关联模块">
          <el-checkbox-group v-model="formData.relatedModules">
            <el-checkbox 
              v-for="module in moduleList" 
              :key="module.id" 
              :label="module.id"
            >
              {{ module.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="pending">待发布</el-radio>
            <el-radio label="released">已发布</el-radio>
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
    <el-dialog v-model="detailDialogVisible" title="功能详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="功能名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ detailData.version }}</el-descriptions-item>
        <el-descriptions-item label="功能描述" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="详细说明" :span="2">{{ detailData.details }}</el-descriptions-item>
        <el-descriptions-item label="目标用户">{{ getUserTypeText(detailData.targetUsers) }}</el-descriptions-item>
        <el-descriptions-item label="计划发布时间">{{ detailData.releaseDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="关联模块" :span="2">
          <el-tag 
            v-for="moduleId in detailData.relatedModules" 
            :key="moduleId" 
            style="margin-right: 10px;"
          >
            {{ getModuleText(moduleId) }}
          </el-tag>
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
import { ElMessage } from 'element-plus'

// 响应式数据
const featureList = ref([
  {
    id: 1,
    name: '智能推荐功能',
    version: 'v1.2.0',
    description: '根据用户行为智能推荐相关内容',
    details: '基于用户历史行为数据，使用机器学习算法为用户推荐可能感兴趣的内容，提高用户粘性。',
    targetUsers: 'all',
    releaseDate: '2023-12-01 10:00:00',
    status: 'released',
    relatedModules: [1, 3],
    createTime: '2023-10-01 10:00:00',
    updateTime: '2023-12-01 10:00:00'
  },
  {
    id: 2,
    name: '夜间模式',
    version: 'v1.1.0',
    description: '提供夜间护眼模式',
    details: '为保护用户视力，在夜间提供深色主题模式，减少屏幕亮度对眼睛的刺激。',
    targetUsers: 'all',
    releaseDate: '2023-11-15 10:00:00',
    status: 'pending',
    relatedModules: [5],
    createTime: '2023-10-15 10:00:00',
    updateTime: '2023-11-10 10:00:00'
  },
  {
    id: 3,
    name: '语音助手',
    version: 'v1.0.0',
    description: '提供语音交互功能',
    details: '集成语音识别技术，用户可以通过语音指令操作系统，提升用户体验。',
    targetUsers: 'beta',
    releaseDate: '2023-12-10 10:00:00',
    status: 'draft',
    relatedModules: [6],
    createTime: '2023-11-01 10:00:00',
    updateTime: '2023-11-20 10:00:00'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  name: '',
  status: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  name: '',
  version: '',
  description: '',
  details: '',
  targetUsers: 'all',
  releaseDate: '',
  relatedModules: [],
  status: 'draft'
})

const detailData = ref({
  id: 0,
  name: '',
  version: '',
  description: '',
  details: '',
  targetUsers: 'all',
  releaseDate: '',
  relatedModules: [],
  status: 'draft',
  createTime: '',
  updateTime: ''
})

const formRules = {
  name: [{ required: true, message: '请输入功能名称', trigger: 'blur' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  description: [{ required: true, message: '请输入功能描述', trigger: 'blur' }],
  targetUsers: [{ required: true, message: '请选择目标用户', trigger: 'change' }],
  releaseDate: [{ required: true, message: '请选择计划发布时间', trigger: 'change' }]
}

const formRef = ref()

const moduleList = ref([
  { id: 1, name: '用户管理' },
  { id: 2, name: '寝室管理' },
  { id: 3, name: '费用管理' },
  { id: 4, name: '支付管理' },
  { id: 5, name: '系统配置' },
  { id: 6, name: '客户端功能' },
  { id: 7, name: '数据监控' },
  { id: 8, name: '行为分析' }
])

// 获取用户类型文本
const getUserTypeText = (type: string) => {
  switch (type) {
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
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'draft':
      return ''
    case 'pending':
      return 'warning'
    case 'released':
      return 'success'
    case 'deprecated':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'pending':
      return '待发布'
    case 'released':
      return '已发布'
    case 'deprecated':
      return '已废弃'
    default:
      return '未知'
  }
}

// 获取模块文本
const getModuleText = (moduleId: number) => {
  const module = moduleList.value.find(item => item.id === moduleId)
  return module ? module.name : '未知模块'
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索新功能:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 创建新功能
const handleCreate = () => {
  dialogTitle.value = '创建新功能'
  isEdit.value = false
  formData.value = {
    id: 0,
    name: '',
    version: '',
    description: '',
    details: '',
    targetUsers: 'all',
    releaseDate: '',
    relatedModules: [],
    status: 'draft'
  }
  dialogVisible.value = true
}

// 编辑功能
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑功能'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 发布功能
const handlePublish = (row: any) => {
  console.log('🚀 发布功能:', row)
  ElMessage.success(`"${row.name}"功能发布成功`)
  // 更新状态
  const index = featureList.value.findIndex(item => item.id === row.id)
  if (index !== -1) {
    featureList.value[index].status = 'released'
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑功能:', formData.value)
        ElMessage.success('功能编辑成功')
      } else {
        console.log('➕ 创建功能:', formData.value)
        ElMessage.success('功能创建成功')
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
  console.log('🆕 新功能发布页面加载完成')
})

/**
 * 新功能发布页面
 * 管理新功能的创建、编辑和发布
 */
</script>

<style scoped>
.new-feature-release-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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