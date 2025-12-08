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
        description="在此页面可以创建和管理新功能的发布计划，包括功能描述、发布时间、目标用户等"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 实时监控面板 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><InfoFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">待发布</div>
                <div class="stat-value">{{ stats.pendingCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><SuccessFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">已发布</div>
                <div class="stat-value">{{ stats.releasedCount }}</div>
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
                <div class="stat-title">发布中</div>
                <div class="stat-value">{{ stats.publishingCount }}</div>
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
                <div class="stat-title">发布失败</div>
                <div class="stat-value">{{ stats.failedCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
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
              <el-option label="发布中" value="publishing" />
              <el-option label="已发布" value="released" />
              <el-option label="发布失败" value="failed" />
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
        <el-table-column prop="releaseStrategy" label="发布策略" width="120">
          <template #default="scope">
            {{ getReleaseStrategyText(scope.row.releaseStrategy) }}
          </template>
        </el-table-column>
        <el-table-column prop="releaseDate" label="计划发布时间" width="160" />
        <el-table-column prop="progress" label="发布进度" width="120">
          <template #default="scope">
            <el-progress 
              v-if="scope.row.status === 'publishing'" 
              :percentage="scope.row.progress" 
              :show-text="false" 
              style="width: 80px;"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
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
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handlePublish(scope.row)" 
              :disabled="scope.row.status !== 'pending'"
            >
              发布
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleRollback(scope.row)" 
              :disabled="scope.row.status !== 'released'"
            >
              回滚
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
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
          </el-tab-pane>
          
          <el-tab-pane label="发布策略" name="strategy">
            <el-form-item label="目标用户" prop="targetUsers">
              <el-select v-model="formData.targetUsers" placeholder="请选择目标用户" style="width: 100%;">
                <el-option label="所有用户" value="all" />
                <el-option label="管理员" value="admin" />
                <el-option label="普通用户" value="user" />
                <el-option label="VIP用户" value="vip" />
                <el-option label="内测用户" value="beta" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="发布策略" prop="releaseStrategy">
              <el-radio-group v-model="formData.releaseStrategy">
                <el-radio label="immediate">立即发布</el-radio>
                <el-radio label="scheduled">定时发布</el-radio>
                <el-radio label="gradual">渐进发布</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item 
              label="计划发布时间" 
              prop="releaseDate" 
              v-if="formData.releaseStrategy === 'scheduled' || formData.releaseStrategy === 'gradual'"
            >
              <el-date-picker
                v-model="formData.releaseDate"
                type="datetime"
                placeholder="请选择计划发布时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item 
              label="渐进策略" 
              v-if="formData.releaseStrategy === 'gradual'"
            >
              <el-slider 
                v-model="formData.gradualPercentage" 
                :min="1" 
                :max="100" 
                show-input 
                style="width: 100%;"
              />
              <div class="form-tip">逐步向用户推送功能的百分比</div>
            </el-form-item>
            
            <el-form-item label="兼容性检查">
              <el-switch v-model="formData.compatibilityCheck" />
              <div class="form-tip">发布前检查与其他功能的兼容性</div>
            </el-form-item>
            
            <el-form-item v-if="formData.compatibilityCheck">
              <el-button type="primary" @click="checkCompatibility" :loading="compatibilityChecking">
                执行兼容性检查
              </el-button>
              
              <div v-if="compatibilityResults.length > 0" style="margin-top: 15px;">
                <el-table :data="compatibilityResults" style="width: 100%">
                  <el-table-column prop="feature" label="功能模块" />
                  <el-table-column prop="version" label="版本" />
                  <el-table-column prop="compatibility" label="兼容性">
                    <template #default="scope">
                      <el-tag :type="scope.row.compatibility === 'compatible' ? 'success' : scope.row.compatibility === 'incompatible' ? 'danger' : 'warning'">
                        {{ getCompatibilityText(scope.row.compatibility) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="说明" />
                </el-table>
                
                <div style="margin-top: 10px; text-align: right;">
                  <el-tag 
                    :type="overallCompatibility === 'compatible' ? 'success' : overallCompatibility === 'incompatible' ? 'danger' : 'warning'"
                  >
                    总体兼容性: {{ getCompatibilityText(overallCompatibility) }}
                  </el-tag>
                </div>
              </div>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="高级配置" name="advanced">
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
            
            <el-form-item label="热更新包">
              <el-table :data="hotUpdatePackages" style="width: 100%; margin-bottom: 15px;">
                <el-table-column prop="name" label="包名称" />
                <el-table-column prop="version" label="版本" />
                <el-table-column prop="size" label="大小" />
                <el-table-column prop="uploadTime" label="上传时间" />
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-button size="small" type="primary" @click="downloadHotUpdate(scope.row)">下载</el-button>
                    <el-button size="small" type="danger" @click="deleteHotUpdate(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <el-upload
                class="upload-demo"
                action="/api/upload"
                :auto-upload="false"
                :on-change="handleHotUpdateChange"
                :file-list="hotUpdateFiles"
              >
                <el-button size="small" type="primary">点击上传</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    仅支持.zip格式的热更新包，文件大小不超过50MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="回滚版本">
              <el-select v-model="formData.rollbackVersion" placeholder="请选择回滚版本" style="width: 100%;">
                <el-option 
                  v-for="version in rollbackVersions" 
                  :key="version.value" 
                  :label="version.label" 
                  :value="version.value" 
                />
              </el-select>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
        
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
    <el-dialog v-model="detailDialogVisible" title="功能详情" width="800px">
      <el-tabs v-model="detailActiveTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="功能名称">{{ detailData.name }}</el-descriptions-item>
            <el-descriptions-item label="版本号">{{ detailData.version }}</el-descriptions-item>
            <el-descriptions-item label="功能描述" :span="2">{{ detailData.description }}</el-descriptions-item>
            <el-descriptions-item label="详细说明" :span="2">{{ detailData.details }}</el-descriptions-item>
            <el-descriptions-item label="目标用户">{{ getUserTypeText(detailData.targetUsers) }}</el-descriptions-item>
            <el-descriptions-item label="发布策略">{{ getReleaseStrategyText(detailData.releaseStrategy) }}</el-descriptions-item>
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
        </el-tab-pane>
        
        <el-tab-pane label="发布进度" name="progress">
          <div v-if="detailData.status === 'publishing'">
            <el-progress 
              :percentage="detailData.progress" 
              :stroke-width="20" 
              striped 
              striped-flow 
              :duration="10"
            />
            <div style="margin-top: 20px;">
              <el-timeline>
                <el-timeline-item
                  v-for="(activity, index) in publishActivities"
                  :key="index"
                  :timestamp="activity.timestamp"
                  :type="activity.type"
                >
                  {{ activity.content }}
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
          <div v-else>
            <el-alert
              title="当前功能不在发布过程中"
              description="只有在发布中的功能才能查看发布进度"
              type="info"
              show-icon
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="兼容性检查" name="compatibility">
          <el-table :data="compatibilityData" style="width: 100%">
            <el-table-column prop="feature" label="功能模块" />
            <el-table-column prop="version" label="版本" />
            <el-table-column prop="compatibility" label="兼容性">
              <template #default="scope">
                <el-tag :type="scope.row.compatibility === 'compatible' ? 'success' : scope.row.compatibility === 'incompatible' ? 'danger' : 'warning'">
                  {{ getCompatibilityText(scope.row.compatibility) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
          </el-table>
          
          <div style="margin-top: 15px; text-align: right;">
            <el-tag 
              :type="overallCompatibilityDetail === 'compatible' ? 'success' : overallCompatibilityDetail === 'incompatible' ? 'danger' : 'warning'"
            >
              总体兼容性: {{ getCompatibilityText(overallCompatibilityDetail) }}
            </el-tag>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="热更新包" name="hotupdate">
          <el-table :data="hotUpdatePackagesDetail" style="width: 100%">
            <el-table-column prop="name" label="包名称" />
            <el-table-column prop="version" label="版本" />
            <el-table-column prop="size" label="大小" />
            <el-table-column prop="uploadTime" label="上传时间" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" type="primary" @click="downloadHotUpdate(scope.row)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="回滚记录" name="rollback">
          <el-table :data="rollbackHistory" style="width: 100%">
            <el-table-column prop="version" label="回滚版本" />
            <el-table-column prop="rollbackTime" label="回滚时间" />
            <el-table-column prop="operator" label="操作人" />
            <el-table-column prop="reason" label="回滚原因" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
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
import { 
  InfoFilled, SuccessFilled, Warning, CircleCloseFilled
} from '@element-plus/icons-vue'

// 定义兼容性检查结果的类型
interface CompatibilityResult {
  feature: string
  version: string
  compatibility: 'compatible' | 'incompatible' | 'warning'
  description: string
}

// 定义热更新包的类型
interface HotUpdatePackage {
  id: number
  name: string
  version: string
  size: string
  uploadTime: string
}

// 定义发布活动的类型
interface PublishActivity {
  timestamp: string
  content: string
  type: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

// 定义回滚记录的类型
interface RollbackRecord {
  id: number
  version: string
  rollbackTime: string
  operator: string
  reason: string
}

// 响应式数据
const stats = ref({
  pendingCount: 2,
  releasedCount: 5,
  publishingCount: 1,
  failedCount: 0
})

const featureList = ref([
  {
    id: 1,
    name: '智能推荐功能',
    version: 'v1.2.0',
    description: '根据用户行为智能推荐相关内容',
    details: '基于用户历史行为数据，使用机器学习算法为用户推荐可能感兴趣的内容，提高用户粘性。',
    targetUsers: 'all',
    releaseStrategy: 'immediate',
    releaseDate: '2023-12-01 10:00:00',
    progress: 0,
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
    releaseStrategy: 'scheduled',
    releaseDate: '2023-11-15 10:00:00',
    progress: 0,
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
    releaseStrategy: 'gradual',
    releaseDate: '2023-12-10 10:00:00',
    progress: 35,
    status: 'publishing',
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
const activeTab = ref('basic')
const detailActiveTab = ref('basic')

const hotUpdateFiles = ref([])

const formData = ref({
  id: 0,
  name: '',
  version: '',
  description: '',
  details: '',
  targetUsers: 'all',
  releaseStrategy: 'immediate',
  releaseDate: '',
  gradualPercentage: 10,
  compatibilityCheck: true,
  relatedModules: [],
  rollbackVersion: '',
  status: 'draft'
})

const detailData = ref({
  id: 0,
  name: '',
  version: '',
  description: '',
  details: '',
  targetUsers: 'all',
  releaseStrategy: 'immediate',
  releaseDate: '',
  progress: 0,
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
  releaseStrategy: [{ required: true, message: '请选择发布策略', trigger: 'change' }],
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

const rollbackVersions = ref([
  { value: 'v1.0.0', label: 'v1.0.0' },
  { value: 'v1.1.0', label: 'v1.1.0' }
])

const publishActivities = ref<PublishActivity[]>([
  { timestamp: '2023-11-20 10:00:00', content: '开始准备发布环境', type: '' },
  { timestamp: '2023-11-20 10:05:00', content: '上传热更新包', type: '' },
  { timestamp: '2023-11-20 10:10:00', content: '执行兼容性检查', type: '' },
  { timestamp: '2023-11-20 10:15:00', content: '开始向10%用户推送', type: 'primary' }
])

const compatibilityData = ref<CompatibilityResult[]>([
  { feature: '用户管理', version: 'v2.1.0', compatibility: 'compatible', description: '无冲突' },
  { feature: '寝室管理', version: 'v1.5.0', compatibility: 'warning', description: '可能存在轻微冲突' },
  { feature: '费用管理', version: 'v3.0.0', compatibility: 'compatible', description: '无冲突' }
])

// 热更新包相关
const hotUpdatePackages = ref<HotUpdatePackage[]>([
  { id: 1, name: 'feature-update.zip', version: 'v1.0.0', size: '2.5MB', uploadTime: '2023-11-15 10:30:00' },
  { id: 2, name: 'bug-fix.zip', version: 'v1.0.1', size: '1.2MB', uploadTime: '2023-11-18 14:20:00' }
])

const hotUpdatePackagesDetail = ref<HotUpdatePackage[]>([
  { id: 1, name: 'feature-update.zip', version: 'v1.0.0', size: '2.5MB', uploadTime: '2023-11-15 10:30:00' },
  { id: 2, name: 'bug-fix.zip', version: 'v1.0.1', size: '1.2MB', uploadTime: '2023-11-18 14:20:00' }
])

// 回滚记录
const rollbackHistory = ref<RollbackRecord[]>([
  { id: 1, version: 'v1.0.0', rollbackTime: '2023-11-10 14:30:00', operator: '管理员', reason: '发现严重Bug' },
  { id: 2, version: 'v0.9.0', rollbackTime: '2023-10-25 09:15:00', operator: '系统管理员', reason: '性能问题' }
])

// 兼容性检查相关
const compatibilityChecking = ref(false)
const compatibilityResults = ref<CompatibilityResult[]>([])
const overallCompatibility = ref<'compatible' | 'incompatible' | 'warning'>('compatible')
const overallCompatibilityDetail = ref<'compatible' | 'incompatible' | 'warning'>('compatible')

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

// 获取发布策略文本
const getReleaseStrategyText = (strategy: string) => {
  switch (strategy) {
    case 'immediate':
      return '立即发布'
    case 'scheduled':
      return '定时发布'
    case 'gradual':
      return '渐进发布'
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
    case 'publishing':
      return 'primary'
    case 'released':
      return 'success'
    case 'failed':
      return 'danger'
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
    case 'publishing':
      return '发布中'
    case 'released':
      return '已发布'
    case 'failed':
      return '发布失败'
    case 'deprecated':
      return '已废弃'
    default:
      return '未知'
  }
}

// 获取兼容性文本
const getCompatibilityText = (compatibility: string) => {
  switch (compatibility) {
    case 'compatible':
      return '兼容'
    case 'incompatible':
      return '不兼容'
    case 'warning':
      return '警告'
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
  // 清除表单验证状态
  const form = document.querySelector('.search-bar .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
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
  activeTab.value = 'basic'
  formData.value = {
    id: 0,
    name: '',
    version: '',
    description: '',
    details: '',
    targetUsers: 'all',
    releaseStrategy: 'immediate',
    releaseDate: '',
    gradualPercentage: 10,
    compatibilityCheck: true,
    relatedModules: [],
    rollbackVersion: '',
    status: 'draft'
  }
  hotUpdateFiles.value = []
  dialogVisible.value = true
}

// 编辑功能
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑功能'
  isEdit.value = true
  activeTab.value = 'basic'
  formData.value = { ...row }
  hotUpdateFiles.value = []
  dialogVisible.value = true
}

// 发布功能
const handlePublish = (row: any) => {
  ElMessageBox.confirm(
    `确定要发布"${row.name}"功能吗？`,
    '发布确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('🚀 发布功能:', row)
    
    // 更新状态为发布中
    const index = featureList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      featureList.value[index].status = 'publishing'
      stats.value.pendingCount--
      stats.value.publishingCount++
      
      // 初始化发布进度和活动
      featureList.value[index].progress = 0
      updatePublishActivity(row.id, '开始准备发布环境', '')
    }
    
    // 模拟发布过程
    simulatePublishProcess(index, row)
  }).catch(() => {
    // 取消发布
  })
}

// 模拟发布过程
const simulatePublishProcess = (index: number, row: any) => {
  if (index === -1) return
  
  // 模拟发布步骤
  let step = 0
  const steps = [
    { progress: 20, message: '上传热更新包', type: '' },
    { progress: 40, message: '执行兼容性检查', type: '' },
    { progress: 60, message: '开始向用户推送', type: 'primary' },
    { progress: 80, message: '验证功能完整性', type: '' },
    { progress: 100, message: '发布完成', type: 'success' }
  ]
  
  const interval = setInterval(() => {
    if (step < steps.length) {
      const currentStep = steps[step]
      featureList.value[index].progress = currentStep.progress
      updatePublishActivity(row.id, currentStep.message, currentStep.type as any)
      step++
    } else {
      clearInterval(interval)
      // 发布完成
      featureList.value[index].status = 'released'
      stats.value.publishingCount--
      stats.value.releasedCount++
      ElMessage.success(`"${row.name}"功能发布成功`)
    }
  }, 1500)
}

// 更新发布活动
const updatePublishActivity = (featureId: number, content: string, type: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info') => {
  const timestamp = new Date().toLocaleString()
  publishActivities.value.push({
    timestamp,
    content,
    type
  })
  
  // 保持最新的5条活动记录
  if (publishActivities.value.length > 5) {
    publishActivities.value.shift()
  }
}

// 回滚功能
const handleRollback = (row: any) => {
  ElMessageBox.prompt('请输入回滚原因：', '回滚确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{5,100}$/,
    inputErrorMessage: '回滚原因长度应在5-100个字符之间'
  }).then(({ value }) => {
    console.log('⏪ 回滚功能:', row, '原因:', value)
    
    // 更新状态
    const index = featureList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      featureList.value[index].status = 'pending'
      stats.value.releasedCount--
      stats.value.pendingCount++
    }
    
    // 添加回滚记录
    const newRecord: RollbackRecord = {
      id: rollbackHistory.value.length + 1,
      version: row.version,
      rollbackTime: new Date().toLocaleString(),
      operator: '当前用户',
      reason: value
    }
    
    rollbackHistory.value.unshift(newRecord)
    
    ElMessage.success(`"${row.name}"功能回滚成功`)
  }).catch(() => {
    // 取消回滚
  })
}

// 热更新包变化处理
const handleHotUpdateChange = (file: any, fileList: any) => {
  console.log('📦 热更新包变化:', file, fileList)
  hotUpdateFiles.value = fileList
}

// 下载热更新包
const downloadHotUpdate = (row: HotUpdatePackage) => {
  console.log('📥 下载热更新包:', row)
  ElMessage.success(`开始下载 "${row.name}"`)
}

// 删除热更新包
const deleteHotUpdate = (row: HotUpdatePackage) => {
  ElMessageBox.confirm(
    `确定要删除"${row.name}"热更新包吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('🗑️ 删除热更新包:', row)
    ElMessage.success(`"${row.name}"热更新包删除成功`)
  }).catch(() => {
    // 取消删除
  })
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

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新功能状态')
  ElMessage.success('功能状态刷新成功')
  
  // 模拟更新状态
  featureList.value.forEach(feature => {
    // 随机更新一些功能的状态
    if (Math.random() > 0.8 && feature.status === 'publishing') {
      feature.progress = Math.min(100, feature.progress + Math.floor(Math.random() * 20))
    }
  })
}

// 执行兼容性检查
const checkCompatibility = () => {
  compatibilityChecking.value = true
  compatibilityResults.value = []
  
  // 模拟兼容性检查过程
  setTimeout(() => {
    compatibilityChecking.value = false
    
    // 生成模拟的兼容性检查结果
    compatibilityResults.value = [
      { feature: '用户管理', version: 'v2.1.0', compatibility: 'compatible', description: '无冲突' },
      { feature: '寝室管理', version: 'v1.5.0', compatibility: 'warning', description: '可能存在轻微冲突' },
      { feature: '费用管理', version: 'v3.0.0', compatibility: 'compatible', description: '无冲突' },
      { feature: '支付管理', version: 'v1.2.0', compatibility: 'incompatible', description: '存在严重冲突' }
    ]
    
    // 计算总体兼容性
    const incompatibleCount = compatibilityResults.value.filter(item => item.compatibility === 'incompatible').length
    const warningCount = compatibilityResults.value.filter(item => item.compatibility === 'warning').length
    
    if (incompatibleCount > 0) {
      overallCompatibility.value = 'incompatible'
    } else if (warningCount > 0) {
      overallCompatibility.value = 'warning'
    } else {
      overallCompatibility.value = 'compatible'
    }
    
    ElMessage.success('兼容性检查完成')
  }, 2000)
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

.form-tip {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
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

.bg-info {
  background-color: #409EFF;
}

.bg-success {
  background-color: #67C23A;
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

.upload-demo {
  width: 100%;
}
</style>