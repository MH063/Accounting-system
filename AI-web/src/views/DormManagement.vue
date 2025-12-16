<template>
  <div class="dorm-management">
    <div class="page-header">
      <h1>宿舍管理</h1>
      <el-button type="primary" @click="router.push('/dashboard/dorm/create')">
        <el-icon><Plus /></el-icon>
        创建宿舍
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入宿舍名称"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
        style="width: 300px; margin-right: 20px;"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 宿舍列表 -->
    <el-table :data="dormList" stripe style="width: 100%">
      <el-table-column prop="dormNumber" label="寝室编号" width="100">
        <template #default="scope">
          <el-tag type="info" effect="plain">{{ getDormNumberShort(scope.row.dormNumber) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="宿舍名称" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="memberCount" label="成员数" width="100">
        <template #default="scope">
          <el-tag type="success">{{ scope.row.memberCount }}人</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="200">
        <template #default="scope">
          <span v-if="scope.row.remark" class="remark-text">
            {{ scope.row.remark }}
          </span>
          <span v-else class="no-remark">暂无备注</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="viewDorm(scope.row)">查看</el-button>
          <el-button size="small" type="primary" @click="editDorm(scope.row)">
            编辑
          </el-button>
          <el-button size="small" type="warning" @click="dormSettings(scope.row)">
            设置
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑宿舍对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑宿舍信息"
      width="600px"
      :before-close="handleCloseEdit"
    >
      <el-form
        ref="editFormRef"
        :model="editingDorm"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-form-item label="宿舍名称" prop="name">
          <el-input v-model="editingDorm.name" placeholder="请输入宿舍名称" />
        </el-form-item>
        
        <el-form-item label="寝室编号" prop="dormNumber">
          <el-input v-model="editingDorm.dormNumber" readonly style="background-color: #f5f7fa; color: #606266">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="宿舍地址" prop="address">
          <el-input v-model="editingDorm.address" placeholder="请输入宿舍地址" />
        </el-form-item>
        
        <el-form-item label="成员数量" prop="memberCount">
          <el-input-number 
            v-model="editingDorm.memberCount" 
            :min="1" 
            :max="8" 
            placeholder="成员数量"
          />
        </el-form-item>
        
        <el-form-item label="宿舍状态" prop="status">
          <el-select v-model="editingDorm.status" placeholder="选择宿舍状态">
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="待分配" value="pending" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注信息">
          <el-input 
            v-model="editingDorm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseEdit">取消</el-button>
          <el-button type="primary" @click="handleSaveEdit" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Document, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { DormManagementItem, EditingDorm } from '@/types'
import { dormService } from '@/services/dormService'
import { withLoading } from '@/utils/loadingUtils'
import { handleApiError } from '@/utils/errorUtils'

const router = useRouter()

// 宿舍列表数据
const dormList = ref<DormManagementItem[]>([])

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索关键字
const searchKeyword = ref('')

// 编辑对话框相关数据
const editDialogVisible = ref(false)
const saving = ref(false)
const editFormRef = ref<FormInstance>()
const editingDorm = reactive<EditingDorm>({
  id: 0,
  name: '',
  dormNumber: '',
  address: '',
  memberCount: 1,
  status: 'active',
  remark: ''
})

// 编辑表单验证规则
const editFormRules: FormRules = {
  name: [
    { required: true, message: '请输入宿舍名称', trigger: 'blur' },
    { min: 2, max: 20, message: '宿舍名称长度应在2-20个字符', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入宿舍地址', trigger: 'blur' },
    { min: 5, max: 50, message: '宿舍地址长度应在5-50个字符', trigger: 'blur' }
  ],
  memberCount: [
    { required: true, message: '请输入成员数量', trigger: 'change' },
    { type: 'number', min: 1, max: 8, message: '成员数量应在1-8之间', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择宿舍状态', trigger: 'change' }
  ]
}

// 查看宿舍详情
const viewDorm = (dorm: DormManagementItem) => {
  console.log('查看宿舍:', dorm)
  router.push(`/dashboard/dorm/info/${dorm.id}`)
}

// 编辑宿舍信息
const editDorm = (dorm: DormManagementItem) => {
  console.log('编辑宿舍:', dorm)
  // 复制宿舍信息到编辑表单
  Object.assign(editingDorm, {
    id: dorm.id,
    name: dorm.name,
    dormNumber: dorm.dormNumber, // 寝室编号只读显示，不可修改
    address: dorm.address,
    memberCount: dorm.memberCount,
    status: dorm.status,
    remark: dorm.remark || ''
  })
  editDialogVisible.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    
    await withLoading(async () => {
      const response = await dormService.updateDormitory(editingDorm.id, {
        name: editingDorm.name,
        address: editingDorm.address,
        memberCount: editingDorm.memberCount,
        status: editingDorm.status,
        remark: editingDorm.remark
      })
      
      console.log('宿舍信息更新成功:', response)
      
      // 更新本地数据
      const index = dormList.value.findIndex(item => item.id === editingDorm.id)
      if (index !== -1) {
        dormList.value[index] = {
          ...dormList.value[index],
          name: editingDorm.name,
          address: editingDorm.address,
          memberCount: editingDorm.memberCount,
          status: editingDorm.status,
          remark: editingDorm.remark
        }
      }
      
      ElMessage.success('宿舍信息更新成功！')
      editDialogVisible.value = false
    })
  } catch (error) {
    handleApiError(error, '宿舍信息更新失败')
  }
}

// 关闭编辑对话框
const handleCloseEdit = () => {
  ElMessageBox.confirm('确定要关闭编辑对话框吗？未保存的数据将丢失。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    editDialogVisible.value = false
    // 重置表单
    if (editFormRef.value) {
      editFormRef.value.resetFields()
    }
  }).catch(() => {
    // 用户取消关闭
  })
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    maintenance: 'warning',
    pending: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '非活跃',
    maintenance: '维修中',
    pending: '待分配'
  }
  return statusMap[status] || '未知'
}

// 宿舍设置
const dormSettings = (dorm: DormManagementItem) => {
  console.log('宿舍设置:', dorm)
  router.push(`/dashboard/dorm/settings/${dorm.id}`)
}

// 获取寝室编号后四位
const getDormNumberShort = (dormNumber: string) => {
  if (!dormNumber) return ''
  return dormNumber.slice(-4)
}

// 生命周期钩子
onMounted(async () => {
  await loadDormList()
})

// 加载宿舍列表
const loadDormList = async () => {
  try {
    await withLoading(async () => {
      const response = await dormService.getDormitoryList({
        page: currentPage.value,
        limit: pageSize.value,
        search: searchKeyword.value
      })
      console.log('获取宿舍列表成功:', response)
      if (response.success && response.data) {
        // 从返回的数据中提取宿舍列表和分页信息
        dormList.value = response.data.dorms || []
        total.value = response.data.pagination?.total || 0
      }
    })
  } catch (error) {
    handleApiError(error, '获取宿舍列表失败')
  }
}

// 搜索处理
const handleSearch = async () => {
  currentPage.value = 1
  await loadDormList()
}

// 分页大小改变处理
const handleSizeChange = async (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  await loadDormList()
}

// 当前页改变处理
const handleCurrentChange = async (val: number) => {
  currentPage.value = val
  await loadDormList()
}
</script>

<style scoped>
.dorm-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  color: #303133;
  margin: 0;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.remark-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.no-remark {
  color: #909399;
  font-style: italic;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>