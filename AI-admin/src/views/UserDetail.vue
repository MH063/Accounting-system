<template>
  <div class="user-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户详情</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-form :model="userForm" label-width="120px" v-loading="loading">
        <el-form-item label="用户ID">
          <el-input v-model="userForm.id" disabled />
        </el-form-item>
        
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch
            v-model="userForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="激活"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item label="创建时间">
          <el-input v-model="userForm.createdAt" disabled />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveUser">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '../api/user'

// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const userForm = ref({
  id: '',
  username: '',
  email: '',
  role: '',
  status: 'active',
  createdAt: ''
})

const loading = ref(false)

// 返回上一页
const goBack = () => {
  router.back()
}

// 保存用户信息
const saveUser = async () => {
  try {
    loading.value = true
    console.log('🔄 保存用户信息:', userForm.value)
    
    // 这里应该调用更新用户API
    // await userApi.updateUser(userForm.value.id, userForm.value)
    
    ElMessage.success('用户信息保存成功')
  } catch (error: any) {
    console.error('❌ 保存用户信息失败:', error)
    ElMessage.error('保存用户信息失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  userForm.value = {
    id: '',
    username: '',
    email: '',
    role: '',
    status: 'active',
    createdAt: ''
  }
}

// 加载用户详情
const loadUserDetail = async () => {
  try {
    loading.value = true
    console.log('🔄 开始加载用户详情...')
    
    // 模拟用户ID，实际应该从路由参数获取
    const userId = route.params.id || '1'
    
    // 这里应该调用获取用户详情API
    // const userData = await userApi.getUserById(userId)
    
    // 模拟数据
    userForm.value = {
      id: userId as string,
      username: '张三',
      email: 'zhangsan@example.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toLocaleString()
    }
    
    console.log('✅ 用户详情加载完成:', userForm.value)
  } catch (error: any) {
    console.error('❌ 加载用户详情失败:', error)
    ElMessage.error('加载用户详情失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('👤 用户详情页面加载完成')
  loadUserDetail()
})

/**
 * 用户详情页面
 * 展示和编辑用户详细信息
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
</style>