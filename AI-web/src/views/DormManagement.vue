<template>
  <div class="dorm-management">
    <div class="page-header">
      <h1>宿舍管理</h1>
      <el-button type="primary" @click="router.push('/dashboard/dorm/create')">
        <el-icon><Plus /></el-icon>
        创建宿舍
      </el-button>
    </div>

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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { DormManagementItem, EditingDorm } from '@/types'

const router = useRouter()

// 宿舍列表数据
const dormList = ref<DormManagementItem[]>([
  {
    id: 1,
    name: '宿舍A101',
    dormNumber: 'A-101-2024012401',
    address: '学生公寓A栋101室',
    memberCount: 4,
    status: 'active',
    remark: '靠近食堂，生活便利'
  },
  {
    id: 2,
    name: '宿舍B205',
    dormNumber: 'B-205-2024012402',
    address: '学生公寓B栋205室',
    memberCount: 3,
    status: 'active',
    remark: '朝南向阳，环境安静'
  }
])

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
    saving.value = true
    
    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 查找并更新宿舍信息
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
      
      ElMessage.success('宿舍信息更新成功！')
      editDialogVisible.value = false
    }
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查输入信息是否正确')
  } finally {
    saving.value = false
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

.remark-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.no-remark {
  color: #909399;
  font-style: italic;
}
</style>