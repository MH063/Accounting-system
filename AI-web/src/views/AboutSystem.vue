<template>
  <div class="about-system">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><InfoFilled /></el-icon> 关于系统</span>
        </div>
      </template>
      
      <div class="about-content">
        <div class="system-info">
          <div class="logo-section">
            <el-icon :size="64"><Setting /></el-icon>
            <h2>财务管理系统</h2>
            <p class="version">版本 1.0.0</p>
          </div>
          
          <div class="info-section">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统名称">财务管理系统</el-descriptions-item>
              <el-descriptions-item label="版本号">v1.0.0 (Build 2024.01.01.001)</el-descriptions-item>
              <el-descriptions-item label="开发团队">财务管理系统开发团队</el-descriptions-item>
              <el-descriptions-item label="更新时间">2024-01-01</el-descriptions-item>
              <el-descriptions-item label="系统状态">
                <el-tag type="success">运行中</el-tag>
                <el-tag type="info" style="margin-left: 8px;">版本: v1.0.0</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开发者信息">
                <div class="developer-info">
                  <p><strong>主开发者:</strong> 财务管理系统团队</p>
                  <p><strong>联系邮箱:</strong> support@financial-system.com</p>
                  <p><strong>开发时间:</strong> 2024年</p>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="feature-section">
            <h4>主要功能</h4>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><Money /></el-icon>
                  <span>财务管理</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><User /></el-icon>
                  <span>用户管理</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><TrendCharts /></el-icon>
                  <span>数据分析</span>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <div class="legal-section">
            <h4>法律信息</h4>
            <div class="legal-links">
              <el-card shadow="hover" class="legal-card">
                <div class="legal-item" @click="openUserAgreement">
                  <el-icon><Document /></el-icon>
                  <span>用户协议</span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </div>
              </el-card>
              <el-card shadow="hover" class="legal-card">
                <div class="legal-item" @click="openPrivacyPolicy">
                  <el-icon><Lock /></el-icon>
                  <span>隐私政策</span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </div>
              </el-card>
            </div>
          </div>
          
          <div class="version-detail-section">
            <h4>版本详情</h4>
            <el-card>
              <div class="version-info">
                <div class="version-item">
                  <span class="version-label">当前版本:</span>
                  <span class="version-value">v1.0.0</span>
                  <el-tag type="success" size="small">最新版本</el-tag>
                </div>
                <div class="version-item">
                  <span class="version-label">构建版本:</span>
                  <span class="version-value">2024.01.01.001</span>
                </div>
                <div class="version-item">
                  <span class="version-label">发布日期:</span>
                  <span class="version-value">2024年1月1日</span>
                </div>
                <div class="version-item">
                  <span class="version-label">更新日志:</span>
                  <span class="version-value">首次发布版本</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { InfoFilled, Setting, Money, User, TrendCharts, Document, Lock, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 打开用户协议
const openUserAgreement = () => {
  ElMessage.info('用户协议功能开发中，敬请期待')
  // 这里可以跳转到用户协议页面或显示协议内容
  // router.push('/dashboard/user-agreement')
}

// 打开隐私政策
const openPrivacyPolicy = () => {
  ElMessage.info('隐私政策功能开发中，敬请期待')
  // 这里可以跳转到隐私政策页面或显示政策内容
  // router.push('/dashboard/privacy-policy')
}
</script>

<style scoped>
.about-system {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.about-content {
  min-height: 500px;
}

.system-info {
  text-align: center;
}

.logo-section {
  margin-bottom: 40px;
}

.logo-section .el-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.logo-section h2 {
  margin: 10px 0;
  color: #303133;
  font-size: 24px;
}

.version {
  color: #909399;
  font-size: 16px;
}

.info-section {
  margin-bottom: 40px;
  text-align: left;
}

.feature-section {
  text-align: left;
}

.feature-section h4 {
  margin-bottom: 20px;
  color: #303133;
  text-align: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.feature-item .el-icon {
  color: #409eff;
  margin-bottom: 10px;
}

.feature-item span {
  color: #606266;
  font-size: 14px;
}

.legal-section {
  margin-bottom: 40px;
}

.legal-section h4 {
  margin-bottom: 20px;
  color: #303133;
  text-align: center;
}

.legal-links {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.legal-card {
  flex: 1;
  max-width: 300px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.legal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.legal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
}

.legal-item .el-icon {
  color: #409eff;
  font-size: 20px;
}

.legal-item span {
  flex: 1;
  color: #303133;
  font-weight: 500;
}

.arrow-icon {
  color: #909399;
  font-size: 16px;
}

.version-detail-section {
  text-align: left;
}

.version-detail-section h4 {
  margin-bottom: 20px;
  color: #303133;
  text-align: center;
}

.version-info {
  padding: 20px;
}

.version-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.version-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.version-label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
  margin-right: 20px;
}

.version-value {
  color: #303133;
  margin-right: 10px;
  font-weight: 500;
}

.developer-info p {
  margin: 5px 0;
  color: #606266;
}

.developer-info strong {
  color: #303133;
}

@media (max-width: 768px) {
  .legal-links {
    flex-direction: column;
    align-items: center;
  }
  
  .legal-card {
    max-width: 100%;
  }
}
</style>