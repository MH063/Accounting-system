<template>
  <div class="batch-operation-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>批量操作</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="批量导入" name="import">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>用户数据导入</span>
              </div>
            </template>
            
            <el-alert
              title="导入说明"
              type="info"
              description="请按照指定格式准备Excel文件，支持.xls和.xlsx格式，文件大小不超过10MB"
              show-icon
              closable
              style="margin-bottom: 20px;"
            />
            
            <el-upload
              class="upload-demo"
              drag
              action="/api/users/import"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  xls/xlsx files with a size less than 10MB
                </div>
              </template>
            </el-upload>
            
            <div style="margin-top: 20px;">
              <el-button type="primary" @click="submitImport" :disabled="!selectedFile">开始导入</el-button>
              <el-button @click="downloadTemplate">下载模板</el-button>
            </div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="批量删除" name="delete">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>批量删除用户</span>
              </div>
            </template>
            
            <el-alert
              title="注意"
              type="warning"
              description="批量删除操作不可恢复，请谨慎操作"
              show-icon
              style="margin-bottom: 20px;"
            />
            
            <el-form :model="deleteForm" label-width="120px">
              <el-form-item label="用户ID列表">
                <el-input
                  v-model="deleteForm.userIds"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入要删除的用户ID，每行一个"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="danger" @click="confirmBatchDelete">批量删除</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="批量修改" name="update">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>批量修改用户状态</span>
              </div>
            </template>
            
            <el-form :model="updateForm" label-width="120px">
              <el-form-item label="用户ID列表">
                <el-input
                  v-model="updateForm.userIds"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入要修改的用户ID，每行一个"
                />
              </el-form-item>
              
              <el-form-item label="修改状态">
                <el-radio-group v-model="updateForm.status">
                  <el-radio label="active">激活</el-radio>
                  <el-radio label="inactive">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="角色分配">
                <el-select v-model="updateForm.role" placeholder="请选择角色">
                  <el-option label="管理员" value="admin" />
                  <el-option label="普通用户" value="user" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="confirmBatchUpdate">批量修改</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

// 路由相关
const router = useRouter()

// 响应式数据
const activeTab = ref('import')
const selectedFile = ref<File | null>(null)

const deleteForm = ref({
  userIds: ''
})

const updateForm = ref({
  userIds: '',
  status: 'active',
  role: ''
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 文件选择处理
const handleFileChange = (file: any) => {
  console.log('📁 选择文件:', file)
  selectedFile.value = file.raw
}

// 上传成功处理
const handleUploadSuccess = (response: any) => {
  console.log('✅ 文件上传成功:', response)
  ElMessage.success('文件上传成功')
}

// 上传失败处理
const handleUploadError = (error: any) => {
  console.error('❌ 文件上传失败:', error)
  ElMessage.error('文件上传失败')
}

// 提交导入
const submitImport = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  console.log('📤 开始导入文件:', selectedFile.value.name)
  ElMessage.info('开始导入文件...')
  // 这里应该调用实际的导入API
}

// 下载模板
const downloadTemplate = () => {
  console.log('📥 下载导入模板')
  ElMessage.info('下载导入模板功能待实现')
}

// 确认批量删除
const confirmBatchDelete = async () => {
  if (!deleteForm.value.userIds.trim()) {
    ElMessage.warning('请输入要删除的用户ID')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要批量删除这些用户吗？此操作不可恢复！',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    console.log('🗑️ 批量删除用户:', deleteForm.value.userIds)
    ElMessage.success('批量删除用户成功')
    // 这里应该调用实际的批量删除API
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('❌ 批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 确认批量修改
const confirmBatchUpdate = () => {
  if (!updateForm.value.userIds.trim()) {
    ElMessage.warning('请输入要修改的用户ID')
    return
  }
  
  console.log('✏️ 批量修改用户:', updateForm.value)
  ElMessage.success('批量修改用户成功')
  // 这里应该调用实际的批量修改API
}

/**
 * 批量操作页面
 * 支持用户数据的批量导入、删除和修改
 */
</script>

<style scoped>
.batch-operation-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-demo {
  width: 100%;
}
</style>