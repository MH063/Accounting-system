<template>
  <div class="admin-permission-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员权限管理</span>
          <el-button type="primary" @click="handleCreateRole">新建角色</el-button>
        </div>
      </template>
      
      <!-- 权限统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">角色总数</div>
                <div class="stat-value">{{ stats.totalRoles }}</div>
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
                <div class="stat-title">管理员总数</div>
                <div class="stat-value">{{ stats.totalAdmins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">活跃管理员</div>
                <div class="stat-value">{{ stats.activeAdmins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><DataLine /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">权限分配数</div>
                <div class="stat-value">{{ stats.assignedPermissions }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 角色列表 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="角色管理" name="roles">
          <el-table :data="roleList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="角色名称" />
            <el-table-column prop="description" label="角色描述" />
            <el-table-column prop="adminCount" label="管理员数" width="100" />
            <el-table-column prop="permissionCount" label="权限数" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="250">
              <template #default="scope">
                <el-button size="small" @click="handleViewRole(scope.row)">查看详情</el-button>
                <el-button size="small" @click="handleEditRole(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteRole(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="管理员管理" name="admins">
          <div class="search-bar">
            <el-form :model="adminSearchForm" label-width="80px" inline>
              <el-form-item label="管理员">
                <el-input v-model="adminSearchForm.keyword" placeholder="请输入管理员姓名或账号" clearable />
              </el-form-item>
              
              <el-form-item label="角色">
                <el-select v-model="adminSearchForm.roleId" placeholder="请选择角色" clearable>
                  <el-option 
                    v-for="role in roleList" 
                    :key="role.id" 
                    :label="role.name" 
                    :value="role.id" 
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="状态">
                <el-select v-model="adminSearchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="启用" value="enabled" />
                  <el-option label="禁用" value="disabled" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleAdminSearch">查询</el-button>
                <el-button @click="handleAdminReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-table :data="adminList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="管理员姓名" />
            <el-table-column prop="account" label="账号" />
            <el-table-column prop="roleNames" label="角色" width="200">
              <template #default="scope">
                <el-tag 
                  v-for="roleName in scope.row.roleNames" 
                  :key="roleName" 
                  style="margin-right: 5px;"
                >
                  {{ roleName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginTime" label="最后登录时间" width="160" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-value="enabled"
                  inactive-value="disabled"
                  @change="handleAdminStatusChange(scope.row)"
                />
                <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'" style="margin-left: 10px;">
                  {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="handleViewAdmin(scope.row)">查看详情</el-button>
                <el-button size="small" @click="handleEditAdmin(scope.row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="adminCurrentPage"
              v-model:page-size="adminPageSize"
              :page-sizes="[5, 10, 15, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="adminTotal"
              @size-change="handleAdminSizeChange"
              @current-change="handleAdminCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 角色详情对话框 -->
    <el-dialog v-model="roleDetailDialogVisible" title="角色详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="角色ID">{{ roleDetailData.id }}</el-descriptions-item>
        <el-descriptions-item label="角色名称">{{ roleDetailData.name }}</el-descriptions-item>
        <el-descriptions-item label="角色描述" :span="2">{{ roleDetailData.description }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ roleDetailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ roleDetailData.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="管理员数">{{ roleDetailData.adminCount }}</el-descriptions-item>
        <el-descriptions-item label="权限数">{{ roleDetailData.permissionCount }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <div class="permission-tree-container">
        <div class="permission-tree-header">
          <span>权限列表</span>
          <el-button size="small" @click="handleExpandAll">展开/折叠</el-button>
        </div>
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTreeData"
          show-checkbox
          node-key="id"
          :props="treeProps"
          :default-expanded-keys="defaultExpandedKeys"
          :default-checked-keys="roleDetailData.permissions"
        />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDetailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleSaveRolePermissions">保存权限</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新建/编辑角色对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="600px">
      <el-form :model="roleFormData" :rules="roleFormRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleFormData.name" placeholder="请输入角色名称" />
        </el-form-item>
        
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="roleFormData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入角色描述" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRoleForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 管理员详情对话框 -->
    <el-dialog v-model="adminDetailDialogVisible" title="管理员详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="管理员ID">{{ adminDetailData.id }}</el-descriptions-item>
        <el-descriptions-item label="管理员姓名">{{ adminDetailData.name }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ adminDetailData.account }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ adminDetailData.email }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ adminDetailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag 
            v-for="roleName in adminDetailData.roleNames" 
            :key="roleName" 
            style="margin-right: 5px;"
          >
            {{ roleName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ adminDetailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间">{{ adminDetailData.lastLoginTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="adminDetailData.status === 'enabled' ? 'success' : 'danger'">
            {{ adminDetailData.status === 'enabled' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <div class="role-assignment-container">
        <div class="role-assignment-header">
          <span>角色分配</span>
        </div>
        <el-checkbox-group v-model="adminDetailData.roleIds">
          <el-checkbox 
            v-for="role in roleList" 
            :key="role.id" 
            :label="role.id"
          >
            {{ role.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adminDetailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleSaveAdminRoles">保存角色</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Warning, Check, DataLine } from '@element-plus/icons-vue'

// 响应式数据
const stats = ref({
  totalRoles: 5,
  totalAdmins: 12,
  activeAdmins: 10,
  assignedPermissions: 86
})

const roleList = ref([
  {
    id: 1,
    name: '超级管理员',
    description: '拥有系统最高权限',
    adminCount: 1,
    permissionCount: 50,
    createTime: '2023-01-01 10:00:00',
    updateTime: '2023-01-01 10:00:00',
    permissions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  {
    id: 2,
    name: '系统管理员',
    description: '负责系统日常维护和管理',
    adminCount: 3,
    permissionCount: 35,
    createTime: '2023-01-02 10:00:00',
    updateTime: '2023-01-02 10:00:00',
    permissions: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  {
    id: 3,
    name: '财务管理员',
    description: '负责财务管理相关权限',
    adminCount: 2,
    permissionCount: 20,
    createTime: '2023-01-03 10:00:00',
    updateTime: '2023-01-03 10:00:00',
    permissions: [1, 2, 3, 4, 5]
  },
  {
    id: 4,
    name: '宿舍管理员',
    description: '负责宿舍管理相关权限',
    adminCount: 4,
    permissionCount: 15,
    createTime: '2023-01-04 10:00:00',
    updateTime: '2023-01-04 10:00:00',
    permissions: [1, 2, 3]
  },
  {
    id: 5,
    name: '审计员',
    description: '负责系统审计和监督',
    adminCount: 2,
    permissionCount: 25,
    createTime: '2023-01-05 10:00:00',
    updateTime: '2023-01-05 10:00:00',
    permissions: [1, 2, 3, 4, 5, 6, 7]
  }
])

const adminList = ref([
  {
    id: 1,
    name: '张三',
    account: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    roleIds: [1],
    roleNames: ['超级管理员'],
    lastLoginTime: '2023-11-01 10:35:18',
    status: 'enabled',
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: 2,
    name: '李四',
    account: 'lisi',
    email: 'lisi@example.com',
    phone: '13900139000',
    roleIds: [2],
    roleNames: ['系统管理员'],
    lastLoginTime: '2023-11-01 09:45:33',
    status: 'enabled',
    createTime: '2023-01-02 10:00:00'
  },
  {
    id: 3,
    name: '王五',
    account: 'wangwu',
    email: 'wangwu@example.com',
    phone: '13700137000',
    roleIds: [2, 3],
    roleNames: ['系统管理员', '财务管理员'],
    lastLoginTime: '2023-10-31 15:22:45',
    status: 'enabled',
    createTime: '2023-01-03 10:00:00'
  }
])

const loading = ref(false)
const activeTab = ref('roles')

const adminSearchForm = ref({
  keyword: '',
  roleId: '',
  status: ''
})

const adminCurrentPage = ref(1)
const adminPageSize = ref(15) // 按照分页设置规范，默认值为15
const adminTotal = ref(100)

const roleDetailDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const adminDetailDialogVisible = ref(false)

const roleDialogTitle = ref('')
const isEditRole = ref(false)

const roleDetailData = ref({
  id: 0,
  name: '',
  description: '',
  createTime: '',
  updateTime: '',
  adminCount: 0,
  permissionCount: 0,
  permissions: [] as number[]
})

const roleFormData = ref({
  id: 0,
  name: '',
  description: ''
})

const adminDetailData = ref({
  id: 0,
  name: '',
  account: '',
  email: '',
  phone: '',
  roleIds: [] as number[],
  roleNames: [] as string[],
  lastLoginTime: '',
  status: 'enabled',
  createTime: ''
})

const permissionTreeData = ref([
  {
    id: 1,
    label: '用户管理',
    children: [
      { id: 2, label: '用户列表' },
      { id: 3, label: '用户详情' },
      { id: 4, label: '用户编辑' },
      { id: 5, label: '用户删除' }
    ]
  },
  {
    id: 6,
    label: '寝室管理',
    children: [
      { id: 7, label: '寝室列表' },
      { id: 8, label: '寝室详情' },
      { id: 9, label: '寝室分配' }
    ]
  },
  {
    id: 10,
    label: '费用管理',
    children: [
      { id: 11, label: '费用记录' },
      { id: 12, label: '费用详情' },
      { id: 13, label: '费用统计' }
    ]
  }
])

const treeProps = {
  children: 'children',
  label: 'label'
}

const defaultExpandedKeys = ref([1, 6, 10])

const permissionTreeRef = ref()

const roleFormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
}

const roleFormRef = ref()

// 标签页切换
const handleTabChange = (tabName: string) => {
  console.log('탭 변경:', tabName)
}

// 新建角色
const handleCreateRole = () => {
  roleDialogTitle.value = '新建角色'
  isEditRole.value = false
  roleFormData.value = {
    id: 0,
    name: '',
    description: ''
  }
  roleDialogVisible.value = true
}

// 查看角色详情
const handleViewRole = (row: any) => {
  roleDetailData.value = { ...row }
  roleDetailDialogVisible.value = true
}

// 编辑角色
const handleEditRole = (row: any) => {
  roleDialogTitle.value = '编辑角色'
  isEditRole.value = true
  roleFormData.value = {
    id: row.id,
    name: row.name,
    description: row.description
  }
  roleDialogVisible.value = true
}

// 删除角色
const handleDeleteRole = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除角色"${row.name}"吗？此操作不可逆。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('🗑️ 删除角色:', row)
    ElMessage.success(`角色"${row.name}"已删除`)
    
    // 从列表中移除
    const index = roleList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      roleList.value.splice(index, 1)
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 管理员搜索
const handleAdminSearch = () => {
  console.log('🔍 搜索管理员:', adminSearchForm.value)
  ElMessage.success('查询功能待实现')
}

// 管理员重置
const handleAdminReset = () => {
  adminSearchForm.value = {
    keyword: '',
    roleId: '',
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看管理员详情
const handleViewAdmin = (row: any) => {
  adminDetailData.value = { ...row }
  adminDetailDialogVisible.value = true
}

// 编辑管理员
const handleEditAdmin = (row: any) => {
  console.log('✏️ 编辑管理员:', row)
  ElMessage.info('编辑管理员功能待实现')
}

// 管理员状态变更
const handleAdminStatusChange = (row: any) => {
  console.log('🔄 管理员状态变更:', row)
  ElMessage.success(`管理员"${row.name}"状态已更新`)
}

// 展开/折叠权限树
const handleExpandAll = () => {
  if (permissionTreeRef.value) {
    // 这里只是一个示例，实际实现可能需要更复杂的逻辑
    ElMessage.info('展开/折叠功能待实现')
  }
}

// 保存角色权限
const handleSaveRolePermissions = () => {
  if (permissionTreeRef.value) {
    const checkedKeys = permissionTreeRef.value.getCheckedKeys()
    console.log('💾 保存角色权限:', checkedKeys)
    ElMessage.success('角色权限保存成功')
    roleDetailDialogVisible.value = false
  }
}

// 提交角色表单
const submitRoleForm = () => {
  roleFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditRole.value) {
        console.log('✏️ 编辑角色:', roleFormData.value)
        ElMessage.success('角色编辑成功')
      } else {
        console.log('➕ 新建角色:', roleFormData.value)
        ElMessage.success('角色新建成功')
      }
      roleDialogVisible.value = false
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
}

// 保存管理员角色
const handleSaveAdminRoles = () => {
  console.log('💾 保存管理员角色:', adminDetailData.value)
  ElMessage.success('管理员角色保存成功')
  adminDetailDialogVisible.value = false
}

// 管理员分页相关
const handleAdminSizeChange = (val: number) => {
  adminPageSize.value = val
  adminCurrentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
}

const handleAdminCurrentChange = (val: number) => {
  adminCurrentPage.value = val
  console.log(`📄 当前页: ${val}`)
}

// 组件挂载
onMounted(() => {
  console.log('🔑 管理员权限管理页面加载完成')
})

/**
 * 管理员权限管理页面
 * 管理系统中的角色和管理员权限分配
 */
</script>

<style scoped>
.admin-permission-management-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.bg-primary {
  background-color: #409EFF;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-success {
  background-color: #67C23A;
}

.bg-info {
  background-color: #909399;
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

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.permission-tree-container,
.role-assignment-container {
  margin-top: 20px;
}

.permission-tree-header,
.role-assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}
</style>