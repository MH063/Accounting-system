<template>
  <div class="feature-control-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>功能模块控制</span>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以控制各个功能模块的开启/关闭状态，以及设置模块的访问权限"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 功能模块列表 -->
      <el-table :data="featureList" style="width: 100%" row-key="id">
        <el-table-column prop="name" label="功能模块名称" width="200">
          <template #default="scope">
            <el-icon v-if="scope.row.icon"><component :is="scope.row.icon" /></el-icon>
            <span style="margin-left: 10px;">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="功能描述" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.enabled"
              active-text="开启"
              inactive-text="关闭"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="访问权限" width="150">
          <template #default="scope">
            <el-button size="small" @click="handlePermission(scope.row)">设置权限</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="handleConfig(scope.row)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 权限设置对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="设置访问权限" width="600px">
      <el-form :model="permissionForm" label-width="100px">
        <el-form-item label="功能模块">
          {{ permissionForm.featureName }}
        </el-form-item>
        
        <el-form-item label="允许角色">
          <el-checkbox-group v-model="permissionForm.allowedRoles">
            <el-checkbox 
              v-for="role in roleList" 
              :key="role.id" 
              :label="role.id"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="用户白名单">
          <el-select 
            v-model="permissionForm.whitelistUsers" 
            multiple 
            filterable 
            remote 
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            placeholder="请输入用户名搜索"
            style="width: 100%;"
          >
            <el-option 
              v-for="user in userList" 
              :key="user.id" 
              :label="user.name" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="IP白名单">
          <el-input 
            v-model="permissionForm.whitelistIPs" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入允许访问的IP地址，每行一个" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermission">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 功能配置对话框 -->
    <el-dialog v-model="configDialogVisible" title="功能配置" width="600px">
      <el-form :model="configForm" label-width="120px">
        <el-form-item label="功能模块">
          {{ configForm.featureName }}
        </el-form-item>
        
        <el-form-item label="最大并发数">
          <el-input-number 
            v-model="configForm.maxConcurrency" 
            :min="1" 
            :max="1000" 
            controls-position="right" 
            style="width: 100%;" 
          />
        </el-form-item>
        
        <el-form-item label="请求频率限制">
          <el-input-number 
            v-model="configForm.rateLimit" 
            :min="1" 
            :max="10000" 
            controls-position="right" 
            style="width: 100%;" 
          />
          <span class="form-tip">次/分钟</span>
        </el-form-item>
        
        <el-form-item label="缓存策略">
          <el-select v-model="configForm.cacheStrategy" placeholder="请选择缓存策略" style="width: 100%;">
            <el-option label="不缓存" value="none" />
            <el-option label="内存缓存" value="memory" />
            <el-option label="Redis缓存" value="redis" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="缓存时间">
          <el-input-number 
            v-model="configForm.cacheTime" 
            :min="0" 
            :max="86400" 
            controls-position="right" 
            style="width: 100%;" 
          />
          <span class="form-tip">秒（0表示不过期）</span>
        </el-form-item>
        
        <el-form-item label="日志级别">
          <el-select v-model="configForm.logLevel" placeholder="请选择日志级别" style="width: 100%;">
            <el-option label="关闭" value="off" />
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="configDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Document, DataLine, Setting, House, Coin, CreditCard, Tools, Phone, Monitor, TrendCharts, Warning, Lock, Message, Operation } from '@element-plus/icons-vue'

// 响应式数据
const featureList = ref([
  {
    id: 1,
    name: '用户管理',
    icon: 'User',
    description: '管理用户信息、权限分配等',
    enabled: true
  },
  {
    id: 2,
    name: '寝室管理',
    icon: 'House',
    description: '管理寝室分配、入住情况等',
    enabled: true
  },
  {
    id: 3,
    name: '费用管理',
    icon: 'Coin',
    description: '管理各类费用的收取、统计等',
    enabled: true
  },
  {
    id: 4,
    name: '支付管理',
    icon: 'CreditCard',
    description: '处理支付流程、对账等',
    enabled: true
  },
  {
    id: 5,
    name: '系统配置',
    icon: 'Tools',
    description: '系统参数设置、基础配置等',
    enabled: true
  },
  {
    id: 6,
    name: '客户端功能',
    icon: 'Phone',
    description: '移动端功能控制、版本管理等',
    enabled: true
  },
  {
    id: 7,
    name: '数据监控',
    icon: 'Monitor',
    description: '实时监控系统运行状态',
    enabled: false
  },
  {
    id: 8,
    name: '行为分析',
    icon: 'TrendCharts',
    description: '分析用户行为模式',
    enabled: true
  }
])

const permissionDialogVisible = ref(false)
const configDialogVisible = ref(false)

const permissionForm = ref({
  featureId: 0,
  featureName: '',
  allowedRoles: [] as number[],
  whitelistUsers: [] as number[],
  whitelistIPs: ''
})

const configForm = ref({
  featureId: 0,
  featureName: '',
  maxConcurrency: 100,
  rateLimit: 1000,
  cacheStrategy: 'memory',
  cacheTime: 300,
  logLevel: 'info'
})

const roleList = ref([
  { id: 1, name: '超级管理员' },
  { id: 2, name: '管理员' },
  { id: 3, name: '普通用户' },
  { id: 4, name: '访客' }
])

const userList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

const userSearchLoading = ref(false)

// 搜索用户
const searchUsers = (query: string) => {
  if (query !== '') {
    userSearchLoading.value = true
    setTimeout(() => {
      userSearchLoading.value = false
      // 模拟搜索结果
      userList.value = [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' }
      ].filter(item => item.name.includes(query))
    }, 200)
  } else {
    userList.value = []
  }
}

// 状态变更
const handleStatusChange = (row: any) => {
  console.log('🔄 功能模块状态变更:', row)
  ElMessage.success(`"${row.name}"功能模块状态已更新`)
}

// 设置权限
const handlePermission = (row: any) => {
  permissionForm.value = {
    featureId: row.id,
    featureName: row.name,
    allowedRoles: [1, 2], // 默认允许超级管理员和管理员
    whitelistUsers: [],
    whitelistIPs: ''
  }
  permissionDialogVisible.value = true
}

// 功能配置
const handleConfig = (row: any) => {
  configForm.value = {
    featureId: row.id,
    featureName: row.name,
    maxConcurrency: 100,
    rateLimit: 1000,
    cacheStrategy: 'memory',
    cacheTime: 300,
    logLevel: 'info'
  }
  configDialogVisible.value = true
}

// 保存权限设置
const savePermission = () => {
  console.log('🔐 保存权限设置:', permissionForm.value)
  ElMessage.success('权限设置保存成功')
  permissionDialogVisible.value = false
}

// 保存功能配置
const saveConfig = () => {
  console.log('⚙️ 保存功能配置:', configForm.value)
  ElMessage.success('功能配置保存成功')
  configDialogVisible.value = false
}

// 保存设置
const handleSave = () => {
  console.log('💾 保存功能控制设置:', featureList.value)
  ElMessage.success('功能控制设置保存成功')
}

// 组件挂载
onMounted(() => {
  console.log('🎛️ 功能模块控制页面加载完成')
})

/**
 * 功能模块控制页面
 * 控制各个功能模块的开启/关闭状态及配置
 */
</script>

<style scoped>
.feature-control-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
}
</style>