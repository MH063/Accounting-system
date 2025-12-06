<template>
  <div class="dormitory-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室列表</span>
          <el-button type="primary" @click="handleAdd">新增寝室</el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="寝室号">
            <el-input v-model="searchForm.dormNumber" placeholder="请输入寝室号" clearable />
          </el-form-item>
          
          <el-form-item label="楼栋">
            <el-input v-model="searchForm.building" placeholder="请输入楼栋" clearable />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="维修中" value="maintenance" />
              <el-option label="已满" value="full" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="dormNumber" label="寝室号" />
        <el-table-column prop="building" label="楼栋" />
        <el-table-column prop="capacity" label="容量" />
        <el-table-column prop="currentOccupancy" label="当前入住人数" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" />
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="寝室号" prop="dormNumber">
          <el-input v-model="formData.dormNumber" placeholder="请输入寝室号" />
        </el-form-item>
        
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="formData.building" placeholder="请输入楼栋" />
        </el-form-item>
        
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="formData.capacity" :min="1" :max="20" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="正常" value="normal" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="已满" value="full" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const tableData = ref([
  {
    id: 1,
    dormNumber: 'A101',
    building: 'A栋',
    capacity: 4,
    currentOccupancy: 3,
    status: 'normal',
    createdAt: '2023-01-01 10:00:00',
    description: '一楼朝南'
  },
  {
    id: 2,
    dormNumber: 'A102',
    building: 'A栋',
    capacity: 4,
    currentOccupancy: 4,
    status: 'full',
    createdAt: '2023-01-01 10:00:00',
    description: '一楼朝北'
  },
  {
    id: 3,
    dormNumber: 'B201',
    building: 'B栋',
    capacity: 6,
    currentOccupancy: 2,
    status: 'normal',
    createdAt: '2023-01-02 10:00:00',
    description: '二楼朝南'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(100)

const searchForm = ref({
  dormNumber: '',
  building: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: 0,
  dormNumber: '',
  building: '',
  capacity: 4,
  status: 'normal',
  description: ''
})

const formRules = {
  dormNumber: [{ required: true, message: '请输入寝室号', trigger: 'blur' }],
  building: [{ required: true, message: '请输入楼栋', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入容量', trigger: 'change' }]
}

const formRef = ref()

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'normal':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'full':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'normal':
      return '正常'
    case 'maintenance':
      return '维修中'
    case 'full':
      return '已满'
    default:
      return '未知'
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索寝室:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    dormNumber: '',
    building: '',
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  console.log('👁️ 查看寝室详情:', row)
  ElMessage.info(`查看寝室详情: ${row.dormNumber}`)
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增寝室'
  isEdit.value = false
  formData.value = {
    id: 0,
    dormNumber: '',
    building: '',
    capacity: 4,
    status: 'normal',
    description: ''
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑寝室'
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除寝室 "${row.dormNumber}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 删除寝室:', row.id)
    ElMessage.success('寝室删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除寝室失败:', error)
      ElMessage.error('删除寝室失败')
    }
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑寝室:', formData.value)
        ElMessage.success('寝室编辑成功')
      } else {
        console.log('➕ 新增寝室:', formData.value)
        ElMessage.success('寝室新增成功')
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
  console.log('🏠 寝室列表页面加载完成')
})

/**
 * 寝室列表页面
 * 展示寝室信息列表和操作功能
 */
</script>

<style scoped>
.dormitory-list-container {
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