<template>
  <div class="payment-code-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收款码管理</span>
          <div>
            <el-button type="primary" @click="handleBatchCheck">批量安全检查</el-button>
            <el-button type="primary" @click="handleAdd">新增收款码</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="收款码名称">
            <el-input v-model="searchForm.name" placeholder="请输入收款码名称" clearable />
          </el-form-item>
          
          <el-form-item label="收款码类型">
            <el-select v-model="searchForm.type" placeholder="请选择收款码类型" clearable>
              <el-option label="支付宝" value="alipay" />
              <el-option label="微信" value="wechat" />
              <el-option label="银联" value="unionpay" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="审核中" value="pending" />
              <el-option label="已停用" value="stopped" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="安全状态">
            <el-select v-model="searchForm.securityStatus" placeholder="请选择安全状态" clearable>
              <el-option label="安全" value="safe" />
              <el-option label="风险" value="risk" />
              <el-option label="异常" value="abnormal" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 收款码表格 -->
      <el-table :data="tableData" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="收款码名称" />
        <el-table-column prop="type" label="收款码类型">
          <template #default="scope">
            {{ getPaymentTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="account" label="收款账户" />
        <el-table-column label="收款码图片" width="150">
          <template #default="scope">
            <div class="qr-codes-container">
              <el-image 
                v-for="(qrCode, index) in scope.row.qrCodeUrls.slice(0, 2)" 
                :key="index"
                :src="qrCode" 
                :preview-src-list="scope.row.qrCodeUrls" 
                fit="cover" 
                style="width: 60px; height: 60px; border-radius: 4px; margin: 2px;"
              />
              <div v-if="scope.row.qrCodeUrls.length > 2" class="more-images">
                +{{ scope.row.qrCodeUrls.length - 2 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="securityStatus" label="安全状态" width="100">
          <template #default="scope">
            <el-tag :type="getSecurityStatusTagType(scope.row.securityStatus)">
              {{ getSecurityStatusText(scope.row.securityStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditStatus" label="审核状态" width="100">
          <template #default="scope">
            <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)">
              {{ getAuditStatusText(scope.row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="100" />
        <el-table-column prop="lastUsedTime" label="最后使用时间" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="handleStop(scope.row)" 
              v-if="scope.row.status === 'enabled'"
            >
              停用
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleSecurityCheck(scope.row)"
            >
              安全检查
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
    
    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
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
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="收款码详情" width="700px">
      <div class="qr-code-detail">
        <div class="qr-codes-gallery">
          <el-image 
            v-for="(qrCode, index) in detailData.qrCodeUrls" 
            :key="index"
            :src="qrCode" 
            :preview-src-list="detailData.qrCodeUrls" 
            fit="contain" 
            style="width: 150px; height: 150px; margin: 5px; border-radius: 4px;"
          />
        </div>
        <div class="detail-info">
          <p><strong>收款码名称:</strong> {{ detailData.name }}</p>
          <p><strong>收款码类型:</strong> {{ getPaymentTypeText(detailData.type) }}</p>
          <p><strong>收款账户:</strong> {{ detailData.account }}</p>
          <p><strong>状态:</strong> 
            <el-tag :type="getStatusTagType(detailData.status)">
              {{ getStatusText(detailData.status) }}
            </el-tag>
          </p>
          <p><strong>安全状态:</strong> 
            <el-tag :type="getSecurityStatusTagType(detailData.securityStatus)">
              {{ getSecurityStatusText(detailData.securityStatus) }}
            </el-tag>
          </p>
          <p><strong>审核状态:</strong> 
            <el-tag :type="getAuditStatusTagType(detailData.auditStatus)">
              {{ getAuditStatusText(detailData.auditStatus) }}
            </el-tag>
          </p>
          <p><strong>使用次数:</strong> {{ detailData.usageCount }}</p>
          <p><strong>最后使用时间:</strong> {{ detailData.lastUsedTime }}</p>
          <p><strong>创建时间:</strong> {{ detailData.createTime }}</p>
          <p><strong>备注:</strong> {{ detailData.remark }}</p>
        </div>
        
        <!-- 使用统计 -->
        <el-divider />
        <h3>使用统计</h3>
        <div ref="usageChartRef" style="height: 300px;"></div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 安全检查对话框 -->
    <el-dialog v-model="securityDialogVisible" title="安全检查报告" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="检查时间">{{ securityReport.checkTime }}</el-descriptions-item>
        <el-descriptions-item label="检查结果">
          <el-tag :type="securityReport.result === 'safe' ? 'success' : securityReport.result === 'risk' ? 'warning' : 'danger'">
            {{ securityReport.result === 'safe' ? '安全' : securityReport.result === 'risk' ? '存在风险' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="风险等级">{{ securityReport.riskLevel }}</el-descriptions-item>
        <el-descriptions-item label="检查项目数">{{ securityReport.checkItems }}</el-descriptions-item>
        <el-descriptions-item label="发现问题数">{{ securityReport.issuesFound }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <el-table :data="securityReport.details" style="width: 100%">
        <el-table-column prop="item" label="检查项目" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'pass' ? 'success' : scope.row.status === 'warning' ? 'warning' : 'danger'">
              {{ scope.row.status === 'pass' ? '通过' : scope.row.status === 'warning' ? '警告' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
      </el-table>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="securityDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleFixIssues" v-if="securityReport.issuesFound > 0">修复问题</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="图片预览">
      <img :src="previewImageUrl" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 图表引用
const usageChartRef = ref()

// 图表实例
let usageChart: any = null

// 响应式数据
const tableData = ref([
  {
    id: 1,
    name: '学费收款码',
    type: 'alipay',
    account: 'alipay@school.edu.cn',
    qrCodeUrls: [
      'https://picsum.photos/seed/alipay1/200/200',
      'https://picsum.photos/seed/alipay2/200/200',
      'https://picsum.photos/seed/alipay3/200/200'
    ],
    status: 'enabled',
    securityStatus: 'safe',
    auditStatus: 'approved',
    usageCount: 128,
    lastUsedTime: '2023-10-15 14:30:25',
    createTime: '2023-01-01 10:00:00',
    remark: '用于收取学费'
  },
  {
    id: 2,
    name: '住宿费收款码',
    type: 'wechat',
    account: 'wechat@school.edu.cn',
    qrCodeUrls: [
      'https://picsum.photos/seed/wechat1/200/200',
      'https://picsum.photos/seed/wechat2/200/200'
    ],
    status: 'enabled',
    securityStatus: 'risk',
    auditStatus: 'approved',
    usageCount: 86,
    lastUsedTime: '2023-10-15 11:15:42',
    createTime: '2023-01-02 10:00:00',
    remark: '用于收取住宿费'
  },
  {
    id: 3,
    name: '其他费用收款码',
    type: 'unionpay',
    account: 'unionpay@school.edu.cn',
    qrCodeUrls: [
      'https://picsum.photos/seed/unionpay1/200/200'
    ],
    status: 'disabled',
    securityStatus: 'abnormal',
    auditStatus: 'rejected',
    usageCount: 0,
    lastUsedTime: '-',
    createTime: '2023-01-03 10:00:00',
    remark: '用于收取其他杂费'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

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

const selectedRows = ref<any[]>([])
const previewImageUrl = ref('')

const fileList = ref([])

const formData = ref({
  id: 0,
  name: '',
  type: '',
  account: '',
  qrCodeUrls: [],
  status: 'enabled',
  remark: ''
})

const detailData = ref({
  id: 0,
  name: '',
  type: '',
  account: '',
  qrCodeUrls: [],
  status: 'enabled',
  securityStatus: 'safe',
  auditStatus: 'pending',
  usageCount: 0,
  lastUsedTime: '',
  createTime: '',
  remark: ''
})

// 安全检查报告
const securityReport = ref({
  checkTime: '2023-10-15 15:30:00',
  result: 'risk',
  riskLevel: '中等',
  checkItems: 12,
  issuesFound: 2,
  details: [
    { item: '二维码有效性', status: 'pass', description: '二维码可正常识别' },
    { item: '账户状态', status: 'pass', description: '收款账户状态正常' },
    { item: '风控检测', status: 'warning', description: '近期有异常交易记录' },
    { item: '合规性检查', status: 'pass', description: '符合平台规范' },
    { item: '安全证书', status: 'fail', description: 'SSL证书即将过期' }
  ]
})

const formRules = {
  name: [{ required: true, message: '请输入收款码名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择收款码类型', trigger: 'change' }],
  account: [{ required: true, message: '请输入收款账户', trigger: 'blur' }],
  qrCodeUrls: [{ required: true, message: '请上传收款码图片', trigger: 'change', validator: validateQrCodeUrls }]
}

const formRef = ref()

// 自定义验证规则
function validateQrCodeUrls(rule: any, value: any, callback: any) {
  if (!value || value.length === 0) {
    callback(new Error('请上传收款码图片'));
  } else {
    callback();
  }
}

// 获取支付类型文本
const getPaymentTypeText = (type: string) => {
  switch (type) {
    case 'alipay':
      return '支付宝'
    case 'wechat':
      return '微信'
    case 'unionpay':
      return '银联'
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'enabled':
      return 'success'
    case 'disabled':
      return 'info'
    case 'pending':
      return 'warning'
    case 'stopped':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'enabled':
      return '启用'
    case 'disabled':
      return '禁用'
    case 'pending':
      return '审核中'
    case 'stopped':
      return '已停用'
    default:
      return '未知'
  }
}

// 获取安全状态标签类型
const getSecurityStatusTagType = (status: string) => {
  switch (status) {
    case 'safe':
      return 'success'
    case 'risk':
      return 'warning'
    case 'abnormal':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取安全状态文本
const getSecurityStatusText = (status: string) => {
  switch (status) {
    case 'safe':
      return '安全'
    case 'risk':
      return '风险'
    case 'abnormal':
      return '异常'
    default:
      return '未知'
  }
}

// 获取审核状态标签类型
const getAuditStatusTagType = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'pending':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取审核状态文本
const getAuditStatusText = (status: string) => {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
    case 'pending':
      return '审核中'
    default:
      return '未知'
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索收款码:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    type: '',
    status: '',
    securityStatus: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
  // 初始化使用统计图表
  nextTick(() => {
    initUsageChart()
  })
}

// 初始化使用统计图表
const initUsageChart = () => {
  if (usageChartRef.value) {
    usageChart = echarts.init(usageChartRef.value)
    renderUsageChart()
  }
}

// 渲染使用统计图表
const renderUsageChart = () => {
  if (!usageChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['使用次数']
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
      data: ['10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07', '10-08', '10-09', '10-10', '10-11', '10-12', '10-13', '10-14', '10-15']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '使用次数',
        type: 'line',
        data: [12, 8, 15, 18, 22, 19, 25, 30, 28, 35, 40, 38, 42, 39, 45],
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.1)'
            }
          ])
        }
      }
    ]
  }
  
  usageChart.setOption(option)
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增收款码'
  isEdit.value = false
  formData.value = {
    id: 0,
    name: '',
    type: '',
    account: '',
    qrCodeUrls: [],
    status: 'pending', // 默认为审核中
    remark: ''
  }
  fileList.value = []
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑收款码'
  isEdit.value = true
  formData.value = { ...row }
  // 构建文件列表用于显示
  fileList.value = row.qrCodeUrls.map((url: string, index: number) => ({
    name: `qr-${index}.jpg`,
    url: url
  }))
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收款码 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 删除收款码:', row.id)
    ElMessage.success('收款码删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除收款码失败:', error)
      ElMessage.error('删除收款码失败')
    }
  }
}

// 强制停用
const handleStop = async (row: any) => {
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
    
    // 更新状态
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value[index].status = 'stopped'
    }
    
    ElMessage.success(`收款码"${row.name}"已停用`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 停用收款码失败:', error)
      ElMessage.error('停用收款码失败')
    }
  }
}

// 上传成功处理
const handleUploadSuccess = (response: any, file: any, fileList: any) => {
  console.log('📤 上传成功:', response)
  // 更新表单数据中的图片URL列表
  formData.value.qrCodeUrls = fileList.map((item: any) => item.url || URL.createObjectURL(item.raw))
  ElMessage.success('收款码上传成功')
}

// 移除图片
const handleRemove = (file: any, fileList: any) => {
  console.log('🗑️ 移除文件:', file)
  // 更新表单数据中的图片URL列表
  formData.value.qrCodeUrls = fileList.map((item: any) => item.url || URL.createObjectURL(item.raw))
}

// 图片预览
const handlePictureCardPreview = (file: any) => {
  previewImageUrl.value = file.url || URL.createObjectURL(file.raw)
  previewDialogVisible.value = true
}

// 上传前检查
const beforeUpload = (file: any) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG) {
    ElMessage.error('收款码图片只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('收款码图片大小不能超过 2MB!')
  }
  
  return isJPG && isLt2M
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑收款码:', formData.value)
        ElMessage.success('收款码编辑成功')
      } else {
        console.log('➕ 新增收款码:', formData.value)
        ElMessage.success('收款码新增成功')
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

// 表格选择变更
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

// 批量安全检查
const handleBatchCheck = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要检查的收款码')
    return
  }
  
  loading.value = true
  ElMessage.info(`正在对${selectedRows.value.length}个收款码进行安全检查...`)
  
  // 模拟检查过程
  setTimeout(() => {
    loading.value = false
    ElMessage.success('批量安全检查完成')
    
    // 更新选中行的安全状态
    selectedRows.value.forEach((row: any) => {
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        // 随机设置安全状态
        const statuses = ['safe', 'risk', 'abnormal']
        tableData.value[index].securityStatus = statuses[Math.floor(Math.random() * statuses.length)]
      }
    })
  }, 2000)
}

// 单个安全检查
const handleSecurityCheck = async (row: any) => {
  loading.value = true
  ElMessage.info(`正在对收款码"${row.name}"进行安全检查...`)
  
  // 模拟检查过程
  setTimeout(() => {
    loading.value = false
    securityDialogVisible.value = true
    ElMessage.success('安全检查完成')
  }, 1500)
}

// 修复问题
const handleFixIssues = () => {
  ElMessage.success('问题修复功能待实现')
  securityDialogVisible.value = false
}

// 组件挂载
onMounted(() => {
  console.log('📱 收款码管理页面加载完成')
})

// 监听窗口大小变化，重新渲染图表
window.addEventListener('resize', () => {
  if (usageChart) {
    usageChart.resize()
  }
})

/**
 * 收款码管理页面
 * 管理各种支付方式的收款码
 */
</script>

<style scoped>
.payment-code-management-container {
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

.qr-codes-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.more-images {
  width: 60px;
  height: 60px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  margin: 2px;
}

.qr-code-uploads {
  width: 100%;
}

.qr-code-uploader :deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

.qr-code-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

.qr-code-detail {
  text-align: center;
}

.qr-codes-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;
}

.detail-info {
  text-align: left;
  margin-top: 20px;
}

.detail-info p {
  margin: 10px 0;
}
</style>