<template>
  <div class="payment-code-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收款码管理</span>
          <div>
            <el-button type="primary" @click="handleBatchCheck" :disabled="selectedRows.length === 0">批量安全检查</el-button>
            <el-button type="primary" @click="handleAdd">新增收款码</el-button>
          </div>
        </div>
      </template>
      
      <div class="search-bar">
        <el-form :model="searchForm" ref="searchFormRef" class="responsive-search-form" label-width="auto">
          <div class="search-items">
            <el-form-item label="收款码名称">
              <el-input v-model="searchForm.name" placeholder="请输入名称" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            
            <el-form-item label="收款码类型">
              <el-select v-model="searchForm.type" placeholder="全部类型" clearable>
                <el-option label="支付宝" value="alipay" />
                <el-option label="微信" value="wechat" />
                <el-option label="银联" value="unionpay" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
                <el-option label="审核中" value="pending" />
                <el-option label="已停用" value="stopped" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="安全状态">
              <el-select v-model="searchForm.securityStatus" placeholder="全部安全状态" clearable>
                <el-option label="安全" value="safe" />
                <el-option label="风险" value="risk" />
                <el-option label="异常" value="abnormal" />
              </el-select>
            </el-form-item>
          </div>
          
          <div class="search-actions">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </el-form>
      </div>
      
      <div class="table-wrapper">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading" 
          @selection-change="handleSelectionChange"
          class="responsive-table"
        >
          <el-table-column type="selection" width="45" fixed="left" />
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="收款码名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" min-width="90">
            <template #default="scope">
              {{ getPaymentTypeText(scope.row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="account" label="收款账户" min-width="180" show-overflow-tooltip />
          <el-table-column label="图片" min-width="120">
            <template #default="scope">
              <div class="qr-codes-container" v-if="scope.row.qrCodeUrls && scope.row.qrCodeUrls.length > 0">
                <el-image 
                  v-for="(qrCode, index) in scope.row.qrCodeUrls.slice(0, 2)" 
                  :key="index"
                  :src="qrCode" 
                  :preview-src-list="scope.row.qrCodeUrls" 
                  fit="cover" 
                  class="table-qr-image"
                />
                <div v-if="scope.row.qrCodeUrls.length > 2" class="more-images-badge">
                  +{{ scope.row.qrCodeUrls.length - 2 }}
                </div>
              </div>
              <span v-else class="no-image">暂无图片</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" min-width="90">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="securityStatus" label="安全" min-width="90">
            <template #default="scope">
              <el-tag :type="getSecurityStatusTagType(scope.row.securityStatus)" size="small">
                {{ getSecurityStatusText(scope.row.securityStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="auditStatus" label="审核" min-width="90">
            <template #default="scope">
              <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)" size="small">
                {{ getAuditStatusText(scope.row.auditStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="usageCount" label="使用" min-width="80" sortable />
          <el-table-column prop="lastUsedTime" label="最后使用" min-width="160" show-overflow-tooltip v-if="!isMobile" />
          <el-table-column prop="createTime" label="创建时间" min-width="160" show-overflow-tooltip v-if="!isMobile" />
          <el-table-column label="操作" min-width="220" fixed="right">
            <template #default="scope">
              <div class="action-buttons">
                <el-link type="primary" :underline="false" @click="handleView(scope.row)">查看</el-link>
                <el-link type="primary" :underline="false" @click="handleEdit(scope.row)">编辑</el-link>
                <el-link 
                  type="warning" 
                  :underline="false" 
                  @click="handleStop(scope.row)" 
                  v-if="scope.row.status === 'enabled'"
                >
                  停用
                </el-link>
                <el-link 
                  type="danger" 
                  :underline="false" 
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-link>
                <el-link 
                  type="primary" 
                  :underline="false" 
                  @click="handleSecurityCheck(scope.row)"
                >
                  安检
                </el-link>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="total"
          :small="isMobile"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      :width="dialogWidth"
      class="responsive-dialog"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="收款码名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入收款码名称" />
        </el-form-item>
        
        <el-form-item label="收款码类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择收款码类型" style="width: 100%;">
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wechat" />
            <el-option label="银联" value="unionpay" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="收款账户" prop="account">
          <el-input v-model="formData.account" placeholder="请输入收款账户" />
        </el-form-item>
        
        <el-form-item label="收款码图片" prop="qrCodeUrls">
          <div class="qr-code-uploads">
            <el-upload
              class="qr-code-uploader"
              action="/api/upload"
              list-type="picture-card"
              :file-list="fileList"
              :on-preview="handlePictureCardPreview"
              :on-remove="handleRemove"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
              :http-request="handleCustomUpload"
              multiple
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
            <el-radio label="pending">审核中</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <el-dialog 
      v-model="detailDialogVisible" 
      title="收款码详情" 
      :width="dialogWidth"
      class="responsive-dialog"
    >
      <div class="qr-code-detail" v-if="detailData.id">
        <div class="qr-codes-gallery" v-if="detailData.qrCodeUrls && detailData.qrCodeUrls.length > 0">
          <el-image 
            v-for="(qrCode, index) in detailData.qrCodeUrls" 
            :key="index"
            :src="qrCode" 
            :preview-src-list="detailData.qrCodeUrls" 
            fit="contain" 
            class="detail-qr-image"
          />
        </div>
        <div class="detail-info">
          <div class="info-item"><span class="label">收款码名称:</span> <span class="value">{{ detailData.name }}</span></div>
          <div class="info-item"><span class="label">收款码类型:</span> <span class="value">{{ getPaymentTypeText(detailData.type) }}</span></div>
          <div class="info-item"><span class="label">收款账户:</span> <span class="value">{{ detailData.account }}</span></div>
          <div class="info-item">
            <span class="label">状态:</span> 
            <el-tag :type="getStatusTagType(detailData.status)" size="small">
              {{ getStatusText(detailData.status) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">安全状态:</span> 
            <el-tag :type="getSecurityStatusTagType(detailData.securityStatus)" size="small">
              {{ getSecurityStatusText(detailData.securityStatus) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">审核状态:</span> 
            <el-tag :type="getAuditStatusTagType(detailData.auditStatus)" size="small">
              {{ getAuditStatusText(detailData.auditStatus) }}
            </el-tag>
          </div>
          <div class="info-item"><span class="label">使用次数:</span> <span class="value">{{ detailData.usageCount }}</span></div>
          <div class="info-item"><span class="label">最后使用时间:</span> <span class="value">{{ detailData.lastUsedTime || '-' }}</span></div>
          <div class="info-item"><span class="label">创建时间:</span> <span class="value">{{ detailData.createTime }}</span></div>
          <div class="info-item" v-if="detailData.remark"><span class="label">备注:</span> <span class="value">{{ detailData.remark }}</span></div>
        </div>
        
        <el-divider />
        <h3>使用统计</h3>
        <div ref="usageChartRef" class="usage-chart"></div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <el-dialog 
      v-model="securityDialogVisible" 
      title="安全检查报告" 
      :width="dialogWidth"
      class="responsive-dialog"
    >
      <el-descriptions :column="isMobile ? 1 : 2" border v-if="securityReport.checkTime">
        <el-descriptions-item label="检查时间">{{ securityReport.checkTime }}</el-descriptions-item>
        <el-descriptions-item label="检查结果">
          <el-tag :type="securityReport.result === 'safe' ? 'success' : securityReport.result === 'risk' ? 'warning' : 'danger'" size="small">
            {{ securityReport.result === 'safe' ? '安全' : securityReport.result === 'risk' ? '存在风险' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="风险等级">{{ securityReport.riskLevel }}</el-descriptions-item>
        <el-descriptions-item label="检查项目数">{{ securityReport.checkItems }}</el-descriptions-item>
        <el-descriptions-item label="发现问题数">{{ securityReport.issuesFound }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider v-if="securityReport.details && securityReport.details.length > 0" />
      
      <el-table :data="securityReport.details || []" style="width: 100%" class="security-details-table" v-if="securityReport.details">
        <el-table-column prop="item" label="检查项目" min-width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'pass' ? 'success' : scope.row.status === 'warning' ? 'warning' : 'danger'" size="small">
              {{ scope.row.status === 'pass' ? '通过' : scope.row.status === 'warning' ? '警告' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
      </el-table>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="securityDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleFixIssues" v-if="securityReport.issuesFound > 0">修复问题</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialogVisible" title="图片预览">
      <img :src="previewImageUrl" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import paymentCodeService, { 
  PaymentCode, 
  PaymentCodeParams,
  CreatePaymentCodeData,
  UpdatePaymentCodeData,
  SecurityCheckResult 
} from '@/api/paymentCode'

const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)
const dialogWidth = computed(() => isMobile.value ? '95%' : '700px')

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (usageChart) {
    usageChart.resize()
  }
}

const usageChartRef = ref()
let usageChart: any = null

const tableData = ref<PaymentCode[]>([])
const loading = ref(false)
const submitLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchForm = ref({
  name: '',
  type: '',
  status: '',
  securityStatus: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const securityDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const selectedRows = ref<PaymentCode[]>([])
const previewImageUrl = ref('')

const fileList = ref<{ name: string; url: string }[]>([])

const formData = ref({
  id: 0,
  name: '',
  type: '',
  account: '',
  qrCodeUrls: [] as string[],
  status: 'enabled',
  remark: ''
})

const detailData = ref<PaymentCode>({} as PaymentCode)

const securityReport = ref<SecurityCheckResult>({
  checkTime: '',
  result: 'safe',
  riskLevel: '无',
  checkItems: 0,
  issuesFound: 0,
  details: []
})

const formRules = {
  name: [{ required: true, message: '请输入收款码名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择收款码类型', trigger: 'change' }],
  account: [{ required: true, message: '请输入收款账户', trigger: 'blur' }]
}

const formRef = ref()

const getPaymentTypeText = (type: string) => {
  switch (type) {
    case 'alipay': return '支付宝'
    case 'wechat': return '微信'
    case 'unionpay': return '银联'
    default: return '未知'
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'enabled': return 'success'
    case 'disabled': return 'info'
    case 'pending': return 'warning'
    case 'stopped': return 'danger'
    case 'active': return 'success'
    case 'inactive': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'enabled': return '启用'
    case 'disabled': return '禁用'
    case 'pending': return '审核中'
    case 'stopped': return '已停用'
    case 'active': return '启用'
    case 'inactive': return '禁用'
    default: return '未知'
  }
}

const getSecurityStatusTagType = (status: string) => {
  switch (status) {
    case 'safe': return 'success'
    case 'risk': return 'warning'
    case 'abnormal': return 'danger'
    default: return 'info'
  }
}

const getSecurityStatusText = (status: string) => {
  switch (status) {
    case 'safe': return '安全'
    case 'risk': return '风险'
    case 'abnormal': return '异常'
    default: return '未知'
  }
}

const getAuditStatusTagType = (status: string) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'pending': return 'warning'
    default: return 'info'
  }
}

const getAuditStatusText = (status: string) => {
  switch (status) {
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'pending': return '审核中'
    default: return '未知'
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PaymentCodeParams = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (searchForm.value.name) params.name = searchForm.value.name
    if (searchForm.value.type) params.type = searchForm.value.type
    if (searchForm.value.status) params.status = searchForm.value.status
    if (searchForm.value.securityStatus) params.securityStatus = searchForm.value.securityStatus
    
    const response = await paymentCodeService.getList(params)
    // 统一处理响应结构，兼容解包和未解包的情况 (规则 5)
    const data = response?.data?.data || response?.data || response
    
    if (data && (data.records || data.list)) {
      tableData.value = data.records || data.list || []
      total.value = data.total || 0
    } else if (response?.success === false || data?.success === false) {
      ElMessage.error(response?.message || data?.message || '获取数据失败')
    } else {
      // 如果数据为空但请求成功，也可能是正常的
      tableData.value = []
      total.value = 0
    }
  } catch (error: any) {
    console.error('获取收款码列表失败:', error)
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleReset = () => {
  searchForm.value = {
    name: '',
    type: '',
    status: '',
    securityStatus: ''
  }
  currentPage.value = 1
  fetchData()
}

const handleView = async (row: PaymentCode) => {
  try {
    loading.value = true
    const response = await paymentCodeService.getById(row.id)
    
    // 兼容处理拦截器返回的数据结构
    const actualData = response?.id ? response : (response?.data || response)
    
    if (actualData && actualData.id) {
      detailData.value = actualData
      detailDialogVisible.value = true
      nextTick(() => {
        initUsageChart()
      })
    } else {
      ElMessage.error(response?.message || '获取详情失败')
    }
  } catch (error: any) {
    console.error('获取收款码详情失败:', error)
    ElMessage.error(error.message || '获取详情失败')
  } finally {
    loading.value = false
  }
}

const initUsageChart = async () => {
  if (!usageChartRef.value) return
  
  if (!usageChart) {
    usageChart = echarts.init(usageChartRef.value)
  }
  
  try {
    const response = await paymentCodeService.getUsageStatistics(detailData.value.id, 15)
    
    // 兼容处理拦截器返回的数据结构
    const stats = response?.dailyStats ? response : (response?.data || response)
    
    if (stats && stats.dailyStats) {
      const dates = stats.dailyStats.map((item: any) => item.date ? item.date.substring(5) : '')
      const counts = stats.dailyStats.map((item: any) => item.count || 0)
      
      const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['使用次数'] },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates
        },
        yAxis: { type: 'value' },
        series: [{
          name: '使用次数',
          type: 'line',
          data: counts,
          smooth: true,
          itemStyle: { color: '#409EFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          }
        }]
      }
      usageChart.setOption(option)
    }
  } catch (error) {
    console.error('获取使用统计失败:', error)
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增收款码'
  isEdit.value = false
  formData.value = {
    id: 0,
    name: '',
    type: '',
    account: '',
    qrCodeUrls: [],
    status: 'pending',
    remark: ''
  }
  fileList.value = []
  dialogVisible.value = true
}

const handleEdit = (row: PaymentCode) => {
  dialogTitle.value = '编辑收款码'
  isEdit.value = true
  formData.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    account: row.account,
    qrCodeUrls: row.qrCodeUrls || [],
    status: row.status,
    remark: row.remark || ''
  }
  fileList.value = (row.qrCodeUrls || []).map((url: string, index: number) => ({
    name: `qr-${index}.jpg`,
    url: url
  }))
  dialogVisible.value = true
}

const handleDelete = async (row: PaymentCode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收款码 "${row.name}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    const response = await paymentCodeService.delete(row.id)
    // 统一处理响应结构 (规则 5)
    const data = response?.data || response
    if (response?.success !== false && data?.success !== false) {
      ElMessage.success('删除收款码成功')
      fetchData()
    } else {
      ElMessage.error(response?.message || data?.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除收款码失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  } finally {
    loading.value = false
  }
}

const handleStop = async (row: PaymentCode) => {
  try {
    await ElMessageBox.confirm(
      `确定要停用收款码 "${row.name}" 吗？`,
      '确认停用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    const response = await paymentCodeService.updateStatus(row.id, { status: 'stopped' })
    // 统一处理响应结构 (规则 5)
    const data = response?.data || response
    if (response?.success !== false && data?.success !== false) {
      ElMessage.success(`收款码"${row.name}"已停用`)
      fetchData()
    } else {
      ElMessage.error(response?.message || data?.message || '停用失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('停用收款码失败:', error)
      ElMessage.error(error.message || '停用失败')
    }
  } finally {
    loading.value = false
  }
}

const handleCustomUpload = async (options: any) => {
  try {
    console.log('🚀 [Upload] 开始上传图片:', options.file.name)
    const response = await paymentCodeService.uploadImage(options.file)
    
    // 关键位置打印日志 (规则 7)
    console.log('✅ [Upload] paymentCodeService.uploadImage 返回:', response)
    
    if (!response) {
      console.error('❌ [Upload] 接口返回为空')
      options.onError(new Error('接口返回数据为空'))
      return
    }

    // 统一处理响应结构，根据规则 5 兼容多层嵌套
    // api 拦截器可能已经返回了 data.data 或 data
    let resultData = response
    if (response?.data?.data) {
      resultData = response.data.data
    } else if (response?.data) {
      resultData = response.data
    }
    
    console.log('🔍 [Upload] 尝试提取的数据:', resultData)

    // 提取最终的对象，确保它不是 undefined
    const finalData = resultData || response
    
    console.log('📦 [Upload] 准备调用 onSuccess, finalData:', finalData)
    
    if (finalData) {
      // 确保 finalData 是一个对象
      options.onSuccess(finalData)
    } else {
      console.error('❌ [Upload] 无法提取有效响应数据')
      options.onError(new Error('无法提取有效响应数据'))
    }
  } catch (error: any) {
    console.error('❌ [Upload] 捕获到异常:', error)
    options.onError(error)
  }
}

const handleUploadSuccess = (response: any, uploadFile: any) => {
  console.log('🎨 [Upload Success] ElementPlus 回调数据:', response)
  console.log('📂 [Upload Success] UploadFile:', uploadFile)
  
  if (!response) {
    console.error('❌ [Upload Success] 回调数据为 undefined. 尝试从 uploadFile 获取响应')
    // 尝试从 uploadFile.response 获取
    if (uploadFile && uploadFile.response) {
      response = uploadFile.response
      console.log('🔄 [Upload Success] 已从 uploadFile.response 恢复数据:', response)
    } else {
      console.error('❌ [Upload Success] 仍然无法获取有效响应数据')
      ElMessage.error('上传回调数据异常')
      return
    }
  }

  // 统一处理响应结构 (规则 5)
  // handleCustomUpload 传递过来的可能是解包后的数据，也可能是原始响应
  const data = response?.data?.data || response?.data || response
  
  if (data && data.url) {
    formData.value.qrCodeUrls.push(data.url)
    ElMessage.success('收款码上传成功')
    console.log('📍 [Upload Success] 图片已添加至列表:', data.url)
  } else {
    console.error('❌ [Upload Success] 未能从数据中找到 url 字段:', data)
    ElMessage.error('上传成功但未获取到图片地址')
  }
}

const handleRemove = (file: any, fileListParam: any) => {
  const index = formData.value.qrCodeUrls.findIndex((url: string) => url === file.url || url === file.response?.url)
  if (index !== -1) {
    formData.value.qrCodeUrls.splice(index, 1)
  }
}

const handlePictureCardPreview = (file: any) => {
  previewImageUrl.value = file.url || file.response?.url || ''
  previewDialogVisible.value = true
}

const beforeUpload = (file: any) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  fileList.value = []
}

const submitForm = async () => {
  try {
    await formRef.value?.validate()
    
    submitLoading.value = true
    
    if (isEdit.value) {
      const data: UpdatePaymentCodeData = {
        name: formData.value.name,
        type: formData.value.type,
        account: formData.value.account,
        qrCodeUrls: formData.value.qrCodeUrls,
        status: formData.value.status,
        remark: formData.value.remark
      }
      
      const response = await paymentCodeService.update(formData.value.id, data)
      // 统一处理响应结构 (规则 5)
      const resData = response?.data || response
      if (response?.success !== false && resData?.success !== false) {
        ElMessage.success('收款码编辑成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(response?.message || resData?.message || '编辑失败')
      }
    } else {
      const data: CreatePaymentCodeData = {
        name: formData.value.name,
        type: formData.value.type,
        account: formData.value.account,
        qrCodeUrls: formData.value.qrCodeUrls,
        status: formData.value.status,
        remark: formData.value.remark
      }
      
      const response = await paymentCodeService.create(data)
      // 统一处理响应结构 (规则 5)
      const resData = response?.data || response
      if (response?.success !== false && resData?.success !== false) {
        ElMessage.success('收款码创建成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(response?.message || resData?.message || '创建失败')
      }
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('请填写完整信息')
  } finally {
    submitLoading.value = false
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

const handleSelectionChange = (rows: PaymentCode[]) => {
  selectedRows.value = rows
}

const handleBatchCheck = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要检查的收款码')
    return
  }
  
  const ids = selectedRows.value.map(row => row.id)
  
  try {
    loading.value = true
    ElMessage.info(`正在对${selectedRows.value.length}个收款码进行安全检查...`)
    
    const response = await paymentCodeService.batchSecurityCheck(ids)
    // 统一处理响应结构 (规则 5)
    const data = response?.data || response
    if (response?.success !== false && data?.success !== false) {
      ElMessage.success(`批量安全检查完成，成功: ${data.successCount || 0}，失败: ${data.failCount || 0}`)
      fetchData()
    } else {
      ElMessage.error(response?.message || data?.message || '批量安全检查失败')
    }
  } catch (error: any) {
    console.error('批量安全检查失败:', error)
    ElMessage.error(error.message || '批量安全检查失败')
  } finally {
    loading.value = false
  }
}

const handleSecurityCheck = async (row: PaymentCode) => {
  try {
    loading.value = true
    ElMessage.info(`正在对收款码"${row.name}"进行安全检查...`)
    
    const response = await paymentCodeService.performSecurityCheck(row.id)
    // 统一处理响应结构 (规则 5)
    const data = response?.data || response
    if (response?.success !== false && data !== undefined) {
      securityReport.value = data
      securityDialogVisible.value = true
      ElMessage.success('安全检查完成')
      fetchData()
    } else {
      ElMessage.error(response?.message || data?.message || '安全检查失败')
    }
  } catch (error: any) {
    console.error('安全检查失败:', error)
    ElMessage.error(error.message || '安全检查失败')
  } finally {
    loading.value = false
  }
}

const handleFixIssues = () => {
  ElMessage.success('问题修复功能待实现')
  securityDialogVisible.value = false
}

onMounted(() => {
  console.log('📱 收款码管理页面加载完成')
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (usageChart) {
    usageChart.dispose()
    usageChart = null
  }
})
</script>

<style scoped>
.payment-code-management-container {
  width: 100%;
  box-sizing: border-box;
}

:deep(.el-card) {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-bar {
  margin-bottom: 20px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.responsive-search-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 20px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
  border-radius: 4px;
}

:deep(.el-table__body), :deep(.el-table__header) {
  width: 100% !important;
  min-width: 1000px;
}

@media screen and (max-width: 768px) {
  :deep(.el-table__body), :deep(.el-table__header) {
    min-width: 800px;
  }
}

.responsive-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.qr-codes-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.table-qr-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.table-qr-image:hover {
  transform: scale(1.1);
}

.more-images-badge {
  font-size: 10px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 4px;
  border-radius: 10px;
}

.no-image {
  color: #909399;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.qr-code-detail {
  max-width: 100%;
}

.qr-codes-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-qr-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  text-align: left;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
  margin-right: 8px;
  min-width: 90px;
}

.info-item .value {
  color: #303133;
  word-break: break-all;
}

.usage-chart {
  width: 100%;
  height: 300px;
  margin-top: 20px;
}

@media screen and (max-width: 768px) {
  .card-header span {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .card-header div {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .search-items {
    grid-template-columns: 1fr;
  }
  
  .search-actions {
    width: 100%;
    justify-content: center;
  }
  
  .search-actions .el-button {
    flex: 1;
  }

  .detail-info {
    grid-template-columns: 1fr;
  }
  
  .responsive-dialog :deep(.el-dialog__body) {
    padding: 10px 15px;
  }
  
  .responsive-dialog :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    margin-bottom: 5px;
  }
  
  .responsive-dialog :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  .usage-chart {
    height: 200px;
  }
}

@media screen and (max-width: 480px) {
  .table-qr-image {
    width: 32px;
    height: 32px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}

.qr-code-uploads {
  width: 100%;
}

.qr-code-uploader :deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
  line-height: 80px;
}

.qr-code-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}
</style>
