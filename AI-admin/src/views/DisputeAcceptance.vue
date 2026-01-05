<template>
  <div class="dispute-acceptance-container">
    <!-- 统计概览 -->
    <el-row :gutter="isMobile ? 10 : 20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">今日新增</div>
            <div class="stat-value text-primary">{{ stats.todayNew }}</div>
          </div>
          <el-icon class="stat-icon"><Document /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">待处理</div>
            <div class="stat-value text-warning">{{ stats.pending }}</div>
          </div>
          <el-icon class="stat-icon"><Warning /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">已处理</div>
            <div class="stat-value text-success">{{ stats.processed }}</div>
          </div>
          <el-icon class="stat-icon"><Check /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">及时率</div>
            <div class="stat-value text-info">{{ stats.timelyRate }}%</div>
          </div>
          <el-icon class="stat-icon"><TrendCharts /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="list-card">
      <template #header>
        <div class="card-header" :style="isMobile ? 'flex-direction: column; align-items: stretch; gap: 10px;' : ''">
          <div class="header-left">
            <span>争议受理列表</span>
          </div>
          <div class="header-right" :style="isMobile ? 'display: flex; justify-content: space-between;' : ''">
            <el-button type="primary" @click="handleCreate" :size="isMobile ? 'small' : 'default'">新增争议</el-button>
            <el-button type="success" @click="handleExport" :size="isMobile ? 'small' : 'default'">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :model="searchForm" :inline="!isMobile" label-width="80px" :label-position="isMobile ? 'top' : 'right'">
          <el-row :gutter="isMobile ? 10 : 20">
            <el-col :xs="12" :sm="6">
              <el-form-item label="争议编号">
                <el-input v-model="searchForm.disputeNo" placeholder="编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6">
              <el-form-item label="申请人">
                <el-input v-model="searchForm.applicant" placeholder="姓名" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6" v-if="!isMobile || showMoreFilters">
              <el-form-item label="争议类型">
                <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 100%;">
                  <el-option label="费用争议" value="fee" />
                  <el-option label="服务争议" value="service" />
                  <el-option label="系统争议" value="system" />
                  <el-option label="其他争议" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="6" v-if="!isMobile || showMoreFilters">
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100%;">
                  <el-option label="待受理" value="pending" />
                  <el-option label="受理中" value="accepted" />
                  <el-option label="已驳回" value="rejected" />
                  <el-option label="已转交" value="transferred" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" v-if="!isMobile || showMoreFilters">
              <el-form-item label="提交时间">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="6">
              <el-form-item label-width="0">
                <div :style="isMobile ? 'display: flex; gap: 10px;' : ''">
                  <el-button type="primary" @click="handleSearch" :style="isMobile ? 'flex: 1;' : ''">
                    <el-icon><Search /></el-icon>{{ isMobile ? '' : '查询' }}
                  </el-button>
                  <el-button @click="handleReset" :style="isMobile ? 'flex: 1;' : ''">
                    <el-icon><RefreshRight /></el-icon>{{ isMobile ? '' : '重置' }}
                  </el-button>
                  <el-button v-if="isMobile" type="info" plain @click="showMoreFilters = !showMoreFilters" style="flex: 1;">
                    <el-icon><Filter /></el-icon>
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="disputeList" v-loading="loading" border style="width: 100%" :size="isMobile ? 'small' : 'default'">
        <el-table-column prop="disputeNo" label="争议编号" width="150" fixed="left" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="contact" label="联系方式" width="120" v-if="!isMobile" />
        <el-table-column prop="type" label="争议类型" width="120">
          <template #default="scope">
            {{ getDisputeTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="争议标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="submitTime" label="提交时间" width="170" v-if="!isMobile" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="isMobile ? 110 : 200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
            <el-dropdown v-if="isMobile" trigger="click" style="margin-left: 10px;">
              <el-button size="small" type="primary" link>更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEdit(scope.row)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="handleDelete(scope.row)" style="color: #f56c6c;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <template v-else>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'total, prev, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="total"
          :small="isMobile"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新建/编辑争议对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" :width="isMobile ? '95%' : '700px'">
      <el-form :model="formData" :rules="formRules" ref="formRef" :label-width="isMobile ? '80px' : '100px'" :label-position="isMobile ? 'top' : 'right'">
        <el-form-item label="争议编号" prop="disputeNo">
          <el-input v-model="formData.disputeNo" placeholder="请输入争议编号" />
        </el-form-item>
        
        <el-form-item label="申请人" prop="applicant">
          <el-input v-model="formData.applicant" placeholder="请输入申请人" />
        </el-form-item>
        
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="formData.contact" placeholder="请输入联系方式" />
        </el-form-item>
        
        <el-form-item label="争议类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择争议类型" style="width: 100%;">
            <el-option label="费用争议" value="fee" />
            <el-option label="服务争议" value="service" />
            <el-option label="系统争议" value="system" />
            <el-option label="其他争议" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="争议标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入争议标题" />
        </el-form-item>
        
        <el-form-item label="争议描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入争议详细描述" 
          />
        </el-form-item>
        
        <el-form-item label="相关附件">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :file-list="fileList"
            multiple
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传jpg/png/pdf文件，且不超过5MB</div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="pending">待受理</el-radio>
            <el-radio label="accepted">受理中</el-radio>
            <el-radio label="rejected">已驳回</el-radio>
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
    
    <!-- 争议详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="争议详情" :width="isMobile ? '95%' : '700px'">
      <el-descriptions :column="isMobile ? 1 : 2" border>
        <el-descriptions-item label="争议编号">{{ detailData.disputeNo }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detailData.applicant }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ detailData.contact }}</el-descriptions-item>
        <el-descriptions-item label="争议类型">{{ getDisputeTypeText(detailData.type) }}</el-descriptions-item>
        <el-descriptions-item label="争议标题" :span="isMobile ? 1 : 2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="争议描述" :span="isMobile ? 1 : 2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detailData.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="受理时间">{{ detailData.acceptTime || '未受理' }}</el-descriptions-item>
        <el-descriptions-item label="受理人">{{ detailData.acceptor || '未受理' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="相关附件" :span="isMobile ? 1 : 2">
          <div v-if="detailData.attachments && detailData.attachments.length > 0">
            <el-link 
              v-for="(attachment, index) in detailData.attachments" 
              :key="index" 
              :href="attachment.url" 
              target="_blank" 
              style="margin-right: 10px;"
            >
              {{ attachment.name }}
            </el-link>
          </div>
          <div v-else>无附件</div>
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="handleTransferToArbitration(detailData)" 
            :disabled="detailData.status !== 'accepted'"
          >
            转交仲裁
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Warning, Check, TrendCharts, Search, RefreshRight, Filter } from '@element-plus/icons-vue'

// 导入统一验证规则库
import { commonRules, businessRules } from '@/utils/validationRules'

// 移动端适配逻辑
const isMobile = ref(false)
const showMoreFilters = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 响应式数据
const stats = ref({
  todayNew: 5,
  pending: 12,
  processed: 28,
  timelyRate: 92.5
})

const disputeList = ref([
  {
    id: 1,
    disputeNo: 'DIS20231101001',
    applicant: '张三',
    contact: '13800138000',
    type: 'fee',
    title: '费用计算错误争议',
    description: '本月水电费计算有误，多收了50元',
    submitTime: '2023-11-01 10:35:18',
    acceptTime: '2023-11-01 11:00:00',
    acceptor: '李四',
    status: 'accepted',
    attachments: [
      { name: '费用明细.pdf', url: '#' }
    ]
  },
  {
    id: 2,
    disputeNo: 'DIS20231101002',
    applicant: '王五',
    contact: '13900139000',
    type: 'service',
    title: '维修服务不及时',
    description: '报修已3天仍未处理',
    submitTime: '2023-11-01 09:45:33',
    acceptTime: '',
    acceptor: '',
    status: 'pending',
    attachments: []
  },
  {
    id: 3,
    disputeNo: 'DIS20231031001',
    applicant: '赵六',
    contact: '13700137000',
    type: 'system',
    title: '系统功能异常',
    description: '支付功能无法正常使用',
    submitTime: '2023-10-31 15:22:45',
    acceptTime: '2023-10-31 16:00:00',
    acceptor: '孙七',
    status: 'transferred',
    attachments: [
      { name: '截图1.png', url: '#' },
      { name: '截图2.png', url: '#' }
    ]
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

const searchForm = ref({
  disputeNo: '',
  applicant: '',
  type: '',
  status: '',
  dateRange: []
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  disputeNo: '',
  applicant: '',
  contact: '',
  type: '',
  title: '',
  description: '',
  status: 'pending'
})

const detailData = ref({
  id: 0,
  disputeNo: '',
  applicant: '',
  contact: '',
  type: '',
  title: '',
  description: '',
  submitTime: '',
  acceptTime: '',
  acceptor: '',
  status: '',
  attachments: [] as any[]
})

const fileList = ref([])

const formRules = {
  disputeNo: businessRules.disputeNo,
  applicant: commonRules.name,
  contact: commonRules.phone,
  type: commonRules.select,
  title: commonRules.name,
  description: commonRules.description
}

const formRef = ref()

// 获取争议类型文本
const getDisputeTypeText = (type: string) => {
  const map: Record<string, string> = {
    'fee': '费用争议',
    'service': '服务争议',
    'system': '系统争议',
    'other': '其他争议'
  }
  return map[type] || '未知'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'pending': '待受理',
    'accepted': '受理中',
    'rejected': '已驳回',
    'transferred': '已转交'
  }
  return map[status] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    'pending': 'warning',
    'accepted': 'primary',
    'rejected': 'danger',
    'transferred': 'success'
  }
  return map[status] || 'info'
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索争议:', searchForm.value)
  ElMessage.success('正在搜索...')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    disputeNo: '',
    applicant: '',
    type: '',
    status: '',
    dateRange: []
  }
  handleSearch()
}

// 生命周期钩子
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  console.log('📋 争议受理页面加载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 查看详情
const handleDetail = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 新增
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增争议'
  formData.value = {
    id: 0,
    disputeNo: `DIS${new Date().getTime()}`,
    applicant: '',
    contact: '',
    type: '',
    title: '',
    description: '',
    status: 'pending'
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑争议'
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除争议编号为 ${row.disputeNo} 的记录吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功')
  })
}

// 导出
const handleExport = () => {
  ElMessage.success('正在导出数据...')
}

// 转交仲裁
const handleTransferToArbitration = (row: any) => {
  ElMessageBox.confirm(
    `确定要将争议"${row.disputeNo}"转交给仲裁决策吗？`,
    '确认转交',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('⚖️ 转交仲裁:', row)
    ElMessage.success(`争议"${row.disputeNo}"已转交仲裁`)
    const index = disputeList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      disputeList.value[index].status = 'transferred'
    }
    detailDialogVisible.value = false
  }).catch(() => {})
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        ElMessage.success('编辑成功')
      } else {
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>

<style scoped>
.dispute-acceptance-container {
  padding: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  height: 100px;
  display: flex;
  align-items: center;
}

.stat-content {
  z-index: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 60px;
  color: rgba(0, 0, 0, 0.05);
  transform: rotate(-15deg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-primary { color: #409eff; }
.text-warning { color: #e6a23c; }
.text-success { color: #67c23a; }
.text-info { color: #909399; }

@media (max-width: 768px) {
  .dispute-acceptance-container {
    padding: 5px;
  }
  
  .stat-card {
    height: 80px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .search-bar {
    padding: 15px 10px;
  }
}
</style>