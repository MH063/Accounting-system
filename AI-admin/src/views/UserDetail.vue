<template>
  <div class="user-detail-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>用户详情</span>
          <div>
            <el-button @click="handleBack">返回</el-button>
            <el-button type="primary" @click="handleEdit" v-if="!isEditing">编辑</el-button>
            <el-button type="success" @click="handleSave" v-else>保存</el-button>
            <el-button @click="handleCancel" v-if="isEditing">取消</el-button>
          </div>
        </div>
      </template>

      <!-- 用户基本信息 -->
      <el-descriptions title="基本信息" :column="2" border>
        <el-descriptions-item label="用户ID">{{ userDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">
          <el-input v-model="userDetail.username" v-if="isEditing" />
          <span v-else>{{ userDetail.username }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          <el-input v-model="userDetail.email" v-if="isEditing" />
          <span v-else>{{ userDetail.email }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          <el-input v-model="userDetail.phone" v-if="isEditing" />
          <span v-else>{{ userDetail.phone }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-select v-model="userDetail.role" v-if="isEditing">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
          <el-tag v-else :type="userDetail.role === 'admin' ? 'success' : 'info'">
            {{ userDetail.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-select v-model="userDetail.status" v-if="isEditing">
            <el-option label="激活" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
          <el-tag v-else :type="userDetail.status === 'active' ? 'success' : 'danger'">
            {{ userDetail.status === 'active' ? '激活' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="寝室号">
          <el-input v-model="userDetail.dormitory" v-if="isEditing" placeholder="请输入寝室号" />
          <el-tag v-else :type="(userDetail.dormitory || userDetail.room_number) ? 'primary' : 'info'">
            {{ userDetail.dormitory || userDetail.room_number || '未分配' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          <span :class="{ 'text-gray': !userDetail.createdAt && !userDetail.created_at }">
            {{ (userDetail.createdAt || userDetail.created_at) ? formatDate(userDetail.createdAt || userDetail.created_at) : '未知' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="最后登录时间">
          <el-tag v-if="!userDetail.lastLoginTime && !userDetail.last_login_at" type="info">从未登录</el-tag>
          <span v-else>{{ formatDate(userDetail.lastLoginTime || userDetail.last_login_at) }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 操作按钮 -->
      <div class="action-buttons" style="margin-top: 20px;">
        <el-button type="warning" @click="handleResetPassword">重置密码</el-button>
        <el-button type="danger" @click="handleDeleteUser">删除用户</el-button>
      </div>
    </el-card>

    <!-- 用户登录日志 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>登录日志</span>
          <el-button size="small" @click="loadLoginLogs">刷新</el-button>
        </div>
      </template>

      <el-table :data="loginLogs" v-loading="logsLoading" style="width: 100%">
        <el-table-column prop="id" label="日志ID" width="100" />
        <el-table-column prop="loginTime" label="登录时间">
          <template #default="scope">
            {{ formatDate(scope.row.loginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="userAgent" label="设备信息" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="logsPage"
          v-model:page-size="logsPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="logsTotal"
          @size-change="handleLogsSizeChange"
          @current-change="handleLogsCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户支付记录 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>支付记录</span>
          <el-button size="small" @click="loadPaymentRecords">刷新</el-button>
        </div>
      </template>

      <el-table :data="paymentRecords" v-loading="paymentsLoading" style="width: 100%">
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column prop="type" label="费用类型" />
        <el-table-column prop="amount" label="金额">
          <template #default="scope">
            ¥{{ scope.row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentTime" label="支付时间">
          <template #default="scope">
            {{ formatDate(scope.row.paymentTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'paid' ? 'success' : 'danger'">
              {{ scope.row.status === 'paid' ? '已支付' : '未支付' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="paymentsPage"
          v-model:page-size="paymentsPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="paymentsTotal"
          @size-change="handlePaymentsSizeChange"
          @current-change="handlePaymentsCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户权限角色管理 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>权限角色管理</span>
          <div>
            <el-button size="small" @click="loadUserRoles">刷新</el-button>
            <el-button size="small" type="primary" @click="handleEditRoles" v-if="!isEditingRoles">编辑权限</el-button>
            <el-button size="small" type="success" @click="handleSaveRoles" v-else>保存权限</el-button>
            <el-button size="small" @click="handleCancelRoles" v-if="isEditingRoles">取消</el-button>
          </div>
        </div>
      </template>

      <div class="roles-section">
        <div class="current-roles">
          <h4>当前角色</h4>
          <div class="roles-list">
            <el-tag
              v-for="role in currentRoles"
              :key="role.id"
              :type="role.type || 'info'"
              style="margin: 5px;"
            >
              {{ role.name }}
            </el-tag>
            <span v-if="currentRoles.length === 0">暂无分配角色</span>
          </div>
        </div>

        <div class="available-roles" v-if="isEditingRoles">
          <h4>可分配角色</h4>
          <el-checkbox-group v-model="selectedRoleIds">
            <el-checkbox
              v-for="role in availableRoles"
              :key="role.id"
              :label="role.id"
              style="margin: 5px;"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </el-card>

    <!-- 用户所属寝室信息 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>所属寝室信息</span>
          <el-button size="small" @click="loadUserDormitory">刷新</el-button>
        </div>
      </template>

      <div v-loading="dormitoryLoading">
        <el-descriptions :column="2" border v-if="userDormitory">
          <el-descriptions-item label="寝室号">{{ userDormitory.roomNumber }}</el-descriptions-item>
          <el-descriptions-item label="楼栋">{{ userDormitory.building }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ userDormitory.floor }}</el-descriptions-item>
          <el-descriptions-item label="床位号">{{ userDormitory.bedNumber }}</el-descriptions-item>
          <el-descriptions-item label="入住时间">{{ formatDate(userDormitory.checkInTime) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="userDormitory.status === 'active' ? 'success' : 'warning'">
              {{ userDormitory.status === 'active' ? '入住中' : '已退房' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="该用户暂无寝室信息">
          <template #image>
            <el-icon size="80" color="#409EFF">
              <House />
            </el-icon>
          </template>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '../api/user'
import { House } from '@element-plus/icons-vue'

// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const isEditing = ref(false)
const userDetail = ref<any>({})
const originalUserDetail = ref<any>({})

// 登录日志相关
const loginLogs = ref<any[]>([])
const logsLoading = ref(false)
const logsPage = ref(1)
const logsPageSize = ref(10)
const logsTotal = ref(0)

// 支付记录相关
const paymentRecords = ref<any[]>([])
const paymentsLoading = ref(false)
const paymentsPage = ref(1)
const paymentsPageSize = ref(10)
const paymentsTotal = ref(0)

// 权限角色相关
const currentRoles = ref<any[]>([])
const availableRoles = ref<any[]>([])
const isEditingRoles = ref(false)
const selectedRoleIds = ref<number[]>([])
const originalSelectedRoleIds = ref<number[]>([])
const rolesLoading = ref(false)

// 寝室信息相关
const userDormitory = ref<any>({})
const dormitoryLoading = ref(false)

// 格式化日期 (V3: 终极鲁棒性，处理各种异常数据)
const formatDate = (val: any) => {
  if (val === null || val === undefined || val === '') return ''

  let date: Date | null = null
  
  // 1. 处理已经是 Date 对象的情况
  if (val instanceof Date) {
    date = val
  } 
  // 2. 处理 ISO 字符串或数字时间戳
  else if (typeof val === 'string' || typeof val === 'number') {
    if (typeof val === 'string' && val.trim() === '') return ''
    date = new Date(val)
  } 
  // 3. 处理对象情况 (处理可能是空对象 {} 的情况)
  else if (typeof val === 'object') {
    // 检查是否是包装后的日期对象
    const possibleValue = val.value || val.timestamp || val.time || val.date || val.$date
    if (possibleValue) {
      date = new Date(possibleValue)
    } else {
      // 检查是否有 toISOString 方法 (即使 instanceof 失败也可能存在)
      if (typeof val.toISOString === 'function') {
        date = new Date(val.toISOString())
      } else {
        // 尝试转换为字符串
        const str = String(val)
        if (str !== '[object Object]') {
          date = new Date(str)
        }
      }
    }
  }

  // 确保 date 是有效的 Date 对象
  if (!date || isNaN(date.getTime())) {
    // 检查是否是特殊字符串 "never" 或其他代表空值的标记
    if (typeof val === 'string' && (val.toLowerCase() === 'never' || val.trim() === '')) {
      return ''
    }
    console.warn('⚠️ [UserDetail] 无法解析的日期:', val)
    return ''
  }
  
  try {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
  } catch (e) {
    return ''
  }
}

// 加载用户详情
const loadUserDetail = async () => {
  try {
    loading.value = true
    const userId = route.params.id as string
    
    const response = await userApi.getUserById(parseInt(userId))
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    // 此时 response 已经是拦截器返回的 response.data
    const userData = response?.data || response
    userDetail.value = userData
    originalUserDetail.value = JSON.parse(JSON.stringify(userData)) // 深拷贝
    
  } catch (error: any) {
    console.error('❌ 加载用户详情失败:', error)
    ElMessage.error('加载用户详情失败')
  } finally {
    loading.value = false
  }
}

// 加载登录日志
const loadLoginLogs = async () => {
  try {
    logsLoading.value = true
    const userId = route.params.id as string
    
    const response = await userApi.getUserLoginLogs(parseInt(userId), {
      page: logsPage.value,
      pageSize: logsPageSize.value
    })
    console.log('✅ 登录日志响应:', response)
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    const innerData = response?.data || response
    const logsData = innerData?.items || (Array.isArray(innerData) ? innerData : [])
    const totalCount = innerData?.total || innerData?.count || (Array.isArray(innerData) ? innerData.length : 0)
    
    loginLogs.value = logsData
    logsTotal.value = totalCount
    
  } catch (error: any) {
    console.error('❌ 加载登录日志失败:', error)
    ElMessage.error('加载登录日志失败')
    
    // 使用空数组作为默认值
    loginLogs.value = []
    logsTotal.value = 0
  } finally {
    logsLoading.value = false
  }
}

// 加载支付记录
const loadPaymentRecords = async () => {
  try {
    paymentsLoading.value = true
    const userId = route.params.id as string
    
    const response = await userApi.getUserPaymentRecords(parseInt(userId), {
      page: paymentsPage.value,
      pageSize: paymentsPageSize.value
    })
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    const innerData = response?.data || response
    const paymentsData = innerData?.items || (Array.isArray(innerData) ? innerData : [])
    const totalCount = innerData?.total || innerData?.count || (Array.isArray(innerData) ? innerData.length : 0)
    
    paymentRecords.value = paymentsData
    paymentsTotal.value = totalCount
    
  } catch (error: any) {
    console.error('❌ 加载支付记录失败:', error)
    ElMessage.error('加载支付记录失败')
    
    // 使用空数组作为默认值
    paymentRecords.value = []
    paymentsTotal.value = 0
  } finally {
    paymentsLoading.value = false
  }
}

// 加载用户权限角色
const loadUserRoles = async () => {
  try {
    rolesLoading.value = true
    const userId = route.params.id as string
    
    const response = await userApi.getUserRoles(parseInt(userId))
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    const innerData = response?.data || response
    const rolesData = innerData?.roles || (Array.isArray(innerData) ? innerData : [])
    const availableRolesData = innerData?.availableRoles || []
    
    currentRoles.value = rolesData
    availableRoles.value = availableRolesData
    
    // 初始化选中的角色ID
    selectedRoleIds.value = rolesData.map((role: any) => role.id)
    originalSelectedRoleIds.value = JSON.parse(JSON.stringify(selectedRoleIds.value))
    
  } catch (error: any) {
    console.error('❌ 加载用户权限角色失败:', error)
    ElMessage.error('加载用户权限角色失败')
    
    // 使用空数组作为默认值
    currentRoles.value = []
    availableRoles.value = []
    selectedRoleIds.value = []
  } finally {
    rolesLoading.value = false
  }
}

// 加载用户所属寝室信息
const loadUserDormitory = async () => {
  try {
    dormitoryLoading.value = true
    const userId = route.params.id as string
    
    const response = await userApi.getUserDormitory(parseInt(userId))
    
    // 处理后端返回的数据结构 (符合规则 5: response.data.data.xxx)
    const dormitoryData = response?.data || response
    userDormitory.value = dormitoryData
    
  } catch (error: any) {
    console.error('❌ 加载用户寝室信息失败:', error)
    ElMessage.error('加载用户寝室信息失败')
    userDormitory.value = null
  } finally {
    dormitoryLoading.value = false
  }
}

// 操作方法
const handleBack = () => {
  router.push('/users')
}

const handleEdit = () => {
  isEditing.value = true
}

const handleSave = async () => {
  try {
    const userId = route.params.id as string
    
    await userApi.updateUser(parseInt(userId), userDetail.value)
    ElMessage.success('用户信息更新成功')
    isEditing.value = false
    originalUserDetail.value = JSON.parse(JSON.stringify(userDetail.value)) // 更新原始数据
    
  } catch (error: any) {
    console.error('❌ 更新用户信息失败:', error)
    const errorMsg = error.response?.data?.message || '更新用户信息失败'
    ElMessage.error(errorMsg)
  }
}

const handleCancel = () => {
  userDetail.value = JSON.parse(JSON.stringify(originalUserDetail.value)) // 恢复原始数据
  isEditing.value = false
}

const handleResetPassword = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置该用户的密码吗？',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userId = route.params.id as string
    
    await userApi.resetUserPassword(parseInt(userId))
    ElMessage.success('密码重置成功，新密码已发送到用户邮箱')
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }
}

const handleDeleteUser = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${userDetail.value.username}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userId = route.params.id as string
    
    await userApi.deleteUser(parseInt(userId))
    ElMessage.success('用户删除成功')
    router.push('/users')
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 删除用户失败:', error)
      const errorMsg = error.response?.data?.message || '删除用户失败'
      ElMessage.error(errorMsg)
    }
  }
}

// 权限角色管理操作
const handleEditRoles = () => {
  isEditingRoles.value = true
}

const handleSaveRoles = async () => {
  try {
    const userId = route.params.id as string
    
    await userApi.updateUserRoles(parseInt(userId), selectedRoleIds.value)
    ElMessage.success('用户权限更新成功')
    
    // 重新加载权限角色
    await loadUserRoles()
    isEditingRoles.value = false
    
  } catch (error: any) {
    console.error('❌ 更新用户权限失败:', error)
    const errorMsg = error.response?.data?.message || '更新用户权限失败'
    ElMessage.error(errorMsg)
  }
}

const handleCancelRoles = () => {
  selectedRoleIds.value = JSON.parse(JSON.stringify(originalSelectedRoleIds.value))
  isEditingRoles.value = false
}

// 分页处理
const handleLogsSizeChange = (val: number) => {
  logsPageSize.value = val
  logsPage.value = 1
  loadLoginLogs()
}

const handleLogsCurrentChange = (val: number) => {
  logsPage.value = val
  loadLoginLogs()
}

const handlePaymentsSizeChange = (val: number) => {
  paymentsPageSize.value = val
  paymentsPage.value = 1
  loadPaymentRecords()
}

const handlePaymentsCurrentChange = (val: number) => {
  paymentsPage.value = val
  loadPaymentRecords()
}

// 组件挂载时加载数据
onMounted(() => {
  
  // 检查是否进入编辑模式
  if (route.query.mode === 'edit') {
    isEditing.value = true
  }
  
  loadUserDetail()
  loadLoginLogs()
  loadPaymentRecords()
  loadUserRoles()
  loadUserDormitory()
})

/**
 * 用户详情页面
 * 展示用户详细信息、登录日志和支付记录
 */
</script>

<style scoped>
.user-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.roles-section {
  padding: 20px 0;
}

.current-roles {
  margin-bottom: 20px;
}

.current-roles h4,
.available-roles h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.roles-list {
  min-height: 40px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
}

.available-roles {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.roles-list span {
  color: #909399;
  font-style: italic;
}

.text-gray {
  color: #909399;
}
</style>