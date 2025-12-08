<template>
  <div class="maintenance-test">
    <h2>维护模式测试页面</h2>
    <p>这个页面用于测试维护模式提醒功能。</p>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>测试操作</span>
        </div>
      </template>
      
      <el-form :model="testForm" label-width="120px">
        <el-form-item label="倒计时时间">
          <el-input-number v-model="testForm.countdownMinutes" :min="1" :max="1440" />
          <span class="form-tip">分钟</span>
        </el-form-item>
        
        <el-form-item label="维护消息">
          <el-input 
            v-model="testForm.message" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入维护通知消息"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="warning" @click="triggerMaintenance">触发维护模式</el-button>
          <el-button type="danger" @click="cancelMaintenanceClick" style="margin-left: 10px;">取消维护模式</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>说明</span>
        </div>
      </template>
      
      <div class="instructions">
        <h3>功能说明</h3>
        <ul>
          <li>点击"触发维护模式"按钮将启动维护模式倒计时</li>
          <li>页面顶部将显示红色维护提醒横幅</li>
          <li>倒计时期间会显示剩余时间</li>
          <li>倒计时结束后，提醒将变为"系统维护中"状态</li>
          <li>点击"取消维护模式"按钮可以立即取消维护状态</li>
        </ul>
        
        <h3>预期效果</h3>
        <ul>
          <li>维护提醒横幅固定在页面顶部</li>
          <li>倒计时期间背景为浅黄色</li>
          <li>维护期间背景为浅红色</li>
          <li>倒计时数字实时更新</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { startMaintenance, cancelMaintenance } from '@/services/maintenanceService'

const testForm = reactive({
  countdownMinutes: 1,
  message: '系统将在1分钟后进行维护，请提前保存好您的数据。'
})

const triggerMaintenance = async () => {
  try {
    await startMaintenance(testForm.countdownMinutes, testForm.message)
    ElMessage.success('维护模式已启动')
  } catch (error) {
    ElMessage.error('启动维护模式失败')
    console.error('启动维护模式失败:', error)
  }
}

const cancelMaintenanceClick = async () => {
  try {
    await cancelMaintenance()
    ElMessage.success('维护模式已取消')
  } catch (error) {
    ElMessage.error('取消维护模式失败')
    console.error('取消维护模式失败:', error)
  }
}
</script>

<style scoped>
.maintenance-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
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

.instructions h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.instructions ul {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
}
</style>