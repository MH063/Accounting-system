<template>
  <div class="payment-code-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收款码管理</span>
          <el-button type="primary" @click="handleAdd">新增收款码</el-button>
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
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 收款码表格 -->
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="收款码名称" />
        <el-table-column prop="type" label="收款码类型">
          <template #default="scope">
            {{ getPaymentTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="account" label="收款账户" />
        <el-table-column label="收款码图片" width="120">
          <template #default="scope">
            <el-image 
              :src="scope.row.qrCodeUrl" 
              :preview-src-list="[scope.row.qrCodeUrl]" 
              fit="cover" 
              style="width: 80px; height: 80px; border-radius: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="enabled"
              inactive-value="disabled"
              @change="handleStatusChange(scope.row)"
            />
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'" style="margin-left: 10px;">
              {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
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
        
        <el-form-item label="收款码图片" prop="qrCodeUrl">
          <el-upload
            class="qr-code-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="formData.qrCodeUrl" :src="formData.qrCodeUrl" class="qr-code" />
            <el-icon v-else class="qr-code-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
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
    <el-dialog v-model="detailDialogVisible" title="收款码详情" width="500px">
      <div class="qr-code-detail">
        <el-image 
          :src="detailData.qrCodeUrl" 
          :preview-src-list="[detailData.qrCodeUrl]" 
          fit="contain" 
          style="width: 100%; height: 300px;"
        />
        <div class="detail-info">
          <p><strong>收款码名称:</strong> {{ detailData.name }}</p>
          <p><strong>收款码类型:</strong> {{ getPaymentTypeText(detailData.type) }}</p>
          <p><strong>收款账户:</strong> {{ detailData.account }}</p>
          <p><strong>状态:</strong> 
            <el-tag :type="detailData.status === 'enabled' ? 'success' : 'danger'">
              {{ detailData.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </p>
          <p><strong>创建时间:</strong> {{ detailData.createTime }}</p>
          <p><strong>备注:</strong> {{ detailData.remark }}</p>
        </div>
      </div>
      
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
import { Plus } from '@element-plus/icons-vue'

// 响应式数据
const tableData = ref([
  {
    id: 1,
    name: '学费收款码',
    type: 'alipay',
    account: 'alipay@school.edu.cn',
    qrCodeUrl: 'https://picsum.photos/seed/alipay/200/200',
    status: 'enabled',
    createTime: '2023-01-01 10:00:00',
    remark: '用于收取学费'
  },
  {
    id: 2,
    name: '住宿费收款码',
    type: 'wechat',
    account: 'wechat@school.edu.cn',
    qrCodeUrl: 'https://picsum.photos/seed/wechat/200/200',
    status: 'enabled',
    createTime: '2023-01-02 10:00:00',
    remark: '用于收取住宿费'
  },
  {
    id: 3,
    name: '其他费用收款码',
    type: 'unionpay',
    account: 'unionpay@school.edu.cn',
    qrCodeUrl: 'https://picsum.photos/seed/unionpay/200/200',
    status: 'disabled',
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
  status: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  name: '',
  type: '',
  account: '',
  qrCodeUrl: '',
  status: 'enabled',
  remark: ''
})

const detailData = ref({
  id: 0,
  name: '',
  type: '',
  account: '',
  qrCodeUrl: '',
  status: 'enabled',
  createTime: '',
  remark: ''
})

const formRules = {
  name: [{ required: true, message: '请输入收款码名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择收款码类型', trigger: 'change' }],
  account: [{ required: true, message: '请输入收款账户', trigger: 'blur' }],
  qrCodeUrl: [{ required: true, message: '请上传收款码图片', trigger: 'change' }]
}

const formRef = ref()

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
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
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
    qrCodeUrl: '',
    status: 'enabled',
    remark: ''
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑收款码'
  isEdit.value = true
  formData.value = { ...row }
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

// 状态变更
const handleStatusChange = (row: any) => {
  console.log('🔄 收款码状态变更:', row)
  ElMessage.success(`收款码"${row.name}"状态已更新`)
}

// 上传成功处理
const handleUploadSuccess = (response: any, file: any) => {
  console.log('📤 上传成功:', response)
  formData.value.qrCodeUrl = URL.createObjectURL(file.raw)
  ElMessage.success('收款码上传成功')
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

// 组件挂载
onMounted(() => {
  console.log('📱 收款码管理页面加载完成')
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

.qr-code-uploader .qr-code {
  width: 178px;
  height: 178px;
  display: block;
}

.qr-code-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.qr-code-uploader .el-upload:hover {
  border-color: #409EFF;
}

.qr-code-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.qr-code-detail {
  text-align: center;
}

.detail-info {
  text-align: left;
  margin-top: 20px;
}

.detail-info p {
  margin: 10px 0;
}
</style>