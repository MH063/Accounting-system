<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="dashboard-header">
          <h1>仪表盘</h1>
          <p>欢迎使用宿舍管理系统</p>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="dashboard-stats">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">1</div>
            <div class="stat-label">宿舍数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">4</div>
            <div class="stat-label">成员数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">¥1,250</div>
            <div class="stat-label">本月支出</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">¥3,400</div>
            <div class="stat-label">总预算</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item>张同学支付了电费 ¥120</el-timeline-item>
            <el-timeline-item>李同学创建了新的支出记录</el-timeline-item>
            <el-timeline-item>王同学更新了宿舍设置</el-timeline-item>
            <el-timeline-item>赵同学加入了宿舍</el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/dashboard/dorm/create')" style="width: 100%; margin-bottom: 10px;">
              创建新宿舍
            </el-button>
            <el-button type="success" @click="$router.push('/dashboard/expenses')" style="width: 100%; margin-bottom: 10px;">
              记录支出
            </el-button>
            <el-button type="warning" @click="$router.push('/dashboard/payment')" style="width: 100%;">
              费用分摊
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
// 仪表盘页面
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #606266;
  font-size: 16px;
}

.dashboard-stats {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}
</style>