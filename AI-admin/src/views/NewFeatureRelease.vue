<template>
  <div class="new-feature-release-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新功能发布</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleCreate">创建新功能</el-button>
          </div>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以创建和管理新功能的发布，支持灰度发布、A/B测试等功能"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 新功能列表 -->
      <el-table :data="featureList" style="width: 100%" row-key="id">
        <el-table-column prop="name" label="功能名称" width="150" />
        <el-table-column prop="description" label="功能描述" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="targetUsers" label="目标用户" width="120" />
        <el-table-column prop="releaseStrategy" label="发布策略" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getFeatureStatusType(scope.row.status)">
              {{ getFeatureStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handlePublish(scope.row)" 
              :disabled="scope.row.status !== 'draft' && scope.row.status !== 'paused'"
            >
              发布
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handlePause(scope.row)" 
              :disabled="scope.row.status !== 'published'"
            >
              暂停
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 创建/编辑新功能对话框 -->
    <el-dialog 
      v-model="featureDialogVisible" 
      :title="editingFeature ? '编辑新功能' : '创建新功能'" 
      width="600px"
    >
      <el-form :model="featureForm" label-width="100px">
        <el-form-item label="功能名称" required>
          <el-input v-model="featureForm.name" placeholder="请输入功能名称" />
        </el-form-item>
        
        <el-form-item label="功能描述" required>
          <el-input 
            v-model="featureForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入功能描述" 
          />
        </el-form-item>
        
        <el-form-item label="版本号" required>
          <el-input v-model="featureForm.version" placeholder="请输入版本号，如v1.0.0" />
        </el-form-item>
        
        <el-form-item label="目标用户">
          <el-select v-model="featureForm.targetUsers" placeholder="请选择目标用户" style="width: 100%;">
            <el-option label="所有用户" value="all" />
            <el-option label="新用户" value="new" />
            <el-option label="老用户" value="old" />
            <el-option label="VIP用户" value="vip" />
            <el-option label="内测用户" value="beta" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发布策略">
          <el-select v-model="featureForm.releaseStrategy" placeholder="请选择发布策略" style="width: 100%;">
            <el-option label="全量发布" value="full" />
            <el-option label="灰度发布" value="gray" />
            <el-option label="A/B测试" value="abtest" />
            <el-option label="分阶段发布" value="staged" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="兼容性检查">
          <el-switch
            v-model="featureForm.compatibilityCheck"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">发布前自动执行兼容性检查</div>
        </el-form-item>
        
        <el-form-item label="热更新支持">
          <el-switch
            v-model="featureForm.hotUpdateSupport"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">支持热更新包推送</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="featureDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFeature">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 发布新功能对话框 -->
    <el-dialog v-model="publishDialogVisible" title="发布新功能" width="600px">
      <el-form :model="publishForm" label-width="120px">
        <el-form-item label="功能名称">
          {{ publishForm.featureName }}
        </el-form-item>
        
        <el-form-item label="发布策略">
          <el-select v-model="publishForm.strategy" placeholder="请选择发布策略" style="width: 100%;">
            <el-option label="全量发布" value="full" />
            <el-option label="灰度发布" value="gray" />
            <el-option label="A/B测试" value="abtest" />
            <el-option label="分阶段发布" value="staged" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发布范围" v-if="publishForm.strategy === 'gray'">
          <el-slider 
            v-model="publishForm.percentage" 
            :min="1" 
            :max="100" 
            show-input 
            style="width: 100%;" 
          />
          <div class="form-tip">灰度发布的用户百分比</div>
        </el-form-item>
        
        <el-form-item label="A/B测试组" v-if="publishForm.strategy === 'abtest'">
          <el-input 
            v-model="publishForm.testGroups" 
            placeholder="请输入测试组配置，如:A组50%,B组50%" 
          />
        </el-form-item>
        
        <el-form-item label="预热时间">
          <el-date-picker
            v-model="publishForm.warmupTime"
            type="datetime"
            placeholder="选择预热开始时间"
            style="width: 100%;"
          />
          <div class="form-tip">功能正式发布前的预热时间</div>
        </el-form-item>
        
        <el-form-item label="预计完成时间">
          <el-date-picker
            v-model="publishForm.estimatedCompletion"
            type="datetime"
            placeholder="选择预计完成时间"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="发布说明">
          <el-input 
            v-model="publishForm.releaseNotes" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入发布说明" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="executePublish">确定发布</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { newFeatureReleaseApi } from '@/api/newFeatureRelease'

// 定义新功能类型
interface NewFeature {
  id: number
  name: string
  description: string
  version: string
  targetUsers: string
  releaseStrategy: string
  status: string
  compatibilityCheck: boolean
  hotUpdateSupport: boolean
}

// 响应式数据
const featureList = ref<NewFeature[]>([])

const featureDialogVisible = ref(false)
const publishDialogVisible = ref(false)

const editingFeature = ref<NewFeature | null>(null)

const featureForm = ref({
  name: '',
  description: '',
  version: '',
  targetUsers: 'all',
  releaseStrategy: 'full',
  compatibilityCheck: true,
  hotUpdateSupport: false
})

const publishForm = ref({
  featureId: 0,
  featureName: '',
  strategy: 'full',
  percentage: 10,
  testGroups: '',
  warmupTime: '',
  estimatedCompletion: '',
  releaseNotes: ''
})

// 获取功能状态类型
const getFeatureStatusType = (status: string) => {
  switch (status) {
    case 'draft':
      return 'info'
    case 'published':
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

// 获取功能状态文本
const getFeatureStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'published':
      return '已发布'
    case 'paused':
      return '已暂停'
    case 'completed':
      return '已完成'
    case 'failed':
      return '发布失败'
    default:
      return '未知'
  }
}

// 获取新功能列表
const fetchNewFeatures = async () => {
  try {
    const res: any = await newFeatureReleaseApi.getNewFeatures()
    featureList.value = res.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      version: item.version,
      targetUsers: item.targetUsers || 'all',
      releaseStrategy: item.releaseStrategy || 'full',
      status: item.status || 'draft',
      compatibilityCheck: item.compatibilityCheck || false,
      hotUpdateSupport: item.hotUpdateSupport || false
    }))
  } catch (error) {
    console.error('获取新功能列表失败:', error)
    ElMessage.error('获取新功能列表失败')
  }
}

// 创建新功能
const handleCreate = () => {
  editingFeature.value = null
  featureForm.value = {
    name: '',
    description: '',
    version: '',
    targetUsers: 'all',
    releaseStrategy: 'full',
    compatibilityCheck: true,
    hotUpdateSupport: false
  }
  featureDialogVisible.value = true
}

// 编辑新功能
const handleEdit = (row: NewFeature) => {
  editingFeature.value = row
  featureForm.value = {
    name: row.name,
    description: row.description,
    version: row.version,
    targetUsers: row.targetUsers,
    releaseStrategy: row.releaseStrategy,
    compatibilityCheck: row.compatibilityCheck,
    hotUpdateSupport: row.hotUpdateSupport
  }
  featureDialogVisible.value = true
}

// 保存新功能
const saveFeature = async () => {
  try {
    if (editingFeature.value) {
      // 更新功能
      await newFeatureReleaseApi.updateNewFeature(editingFeature.value.id, featureForm.value)
      ElMessage.success('功能更新成功')
    } else {
      // 创建功能
      await newFeatureReleaseApi.createNewFeature(featureForm.value)
      ElMessage.success('功能创建成功')
    }
    
    featureDialogVisible.value = false
    await fetchNewFeatures()
  } catch (error) {
    console.error('保存功能失败:', error)
    ElMessage.error('保存功能失败')
  }
}

// 发布新功能
const handlePublish = (row: NewFeature) => {
  publishForm.value = {
    featureId: row.id,
    featureName: row.name,
    strategy: row.releaseStrategy,
    percentage: 10,
    testGroups: '',
    warmupTime: '',
    estimatedCompletion: '',
    releaseNotes: ''
  }
  publishDialogVisible.value = true
}

// 执行发布
const executePublish = async () => {
  try {
    const publishData = {
      strategy: publishForm.value.strategy,
      percentage: publishForm.value.percentage,
      testGroups: publishForm.value.testGroups,
      warmupTime: publishForm.value.warmupTime,
      estimatedCompletion: publishForm.value.estimatedCompletion,
      releaseNotes: publishForm.value.releaseNotes
    }
    
    await newFeatureReleaseApi.publishNewFeature(publishForm.value.featureId, publishData)
    ElMessage.success('功能发布成功')
    publishDialogVisible.value = false
    await fetchNewFeatures()
  } catch (error) {
    console.error('功能发布失败:', error)
    ElMessage.error('功能发布失败')
  }
}

// 暂停发布（通过更新状态实现）
const handlePause = async (row: NewFeature) => {
  try {
    // 使用更新功能接口来改变状态
    const updateData = {
      ...row,
      status: 'paused'
    }
    await newFeatureReleaseApi.updateNewFeature(row.id, updateData)
    ElMessage.success('功能暂停成功')
    await fetchNewFeatures()
  } catch (error) {
    console.error('功能暂停失败:', error)
    ElMessage.error('功能暂停失败')
  }
}

// 删除功能
const handleDelete = (row: NewFeature) => {
  ElMessageBox.confirm(
    `确定要删除"${row.name}"功能吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await newFeatureReleaseApi.deleteNewFeature(row.id)
      ElMessage.success('功能删除成功')
      await fetchNewFeatures()
    } catch (error) {
      console.error('功能删除失败:', error)
      ElMessage.error('功能删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 刷新
const handleRefresh = async () => {
  try {
    await fetchNewFeatures()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  }
}

// 组件挂载
onMounted(async () => {
  console.log('🚀 新功能发布页面加载完成')
  await fetchNewFeatures()
})

/**
 * 新功能发布页面
 * 支持新功能的创建、编辑、发布、暂停和删除操作
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

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>