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
            <h2>记账系统</h2>
            <p class="version">版本 1.0.0</p>
          </div>
          
          <div class="info-section">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统名称">记账系统</el-descriptions-item>
              <el-descriptions-item label="版本号">v1.0.0 (Build 2024.01.01.001)</el-descriptions-item>
              <el-descriptions-item label="开发团队">记账系统开发团队</el-descriptions-item>
              <el-descriptions-item label="更新时间">2024-01-01</el-descriptions-item>
              <el-descriptions-item label="系统状态">
                <el-tag :type="systemStatus.type">{{ systemStatus.text }}</el-tag>
                <el-tag type="info" style="margin-left: 8px;">版本: v1.0.0</el-tag>
                <!-- 移除了手动刷新按钮 -->
              </el-descriptions-item>
              <el-descriptions-item label="最后检查时间">
                {{ formatTime(systemStatus.lastCheckTime) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="systemStatus.uptime !== undefined" label="运行时间">
                {{ formatUptime(systemStatus.uptime) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="systemStatus.cpuUsage !== undefined" label="CPU使用率">
                {{ formatPercentage(systemStatus.cpuUsage) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="systemStatus.memoryUsage !== undefined" label="内存使用率">
                {{ formatPercentage(systemStatus.memoryUsage) }}
              </el-descriptions-item>
              <el-descriptions-item label="开发者信息">
                <div class="developer-info">
                  <p><strong>主开发者:</strong> 记账系统团队</p>
                  <p><strong>联系邮箱:</strong> support@accountingsystem.com</p>
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
                  <el-icon><House /></el-icon>
                  <span>寝室管理</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><User /></el-icon>
                  <span>成员管理</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><Wallet /></el-icon>
                  <span>费用管理</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><Document /></el-icon>
                  <span>账单管理</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><CreditCard /></el-icon>
                  <span>支付功能</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-item">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>统计分析</span>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <div class="legal-section">
            <h4>法律信息</h4>
            <div class="legal-links">
              <el-card shadow="hover" class="legal-card">
                <div class="legal-item" @click="goToUserAgreement">
                  <el-icon><Document /></el-icon>
                  <span>用户协议</span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </div>
              </el-card>
              <el-card shadow="hover" class="legal-card">
                <div class="legal-item" @click="goToPrivacyPolicy">
                  <el-icon><Lock /></el-icon>
                  <span>隐私政策</span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </div>
              </el-card>
              <el-card shadow="hover" class="legal-card">
                <div class="legal-item" @click="goToTermsOfService">
                  <el-icon><Reading /></el-icon>
                  <span>服务条款</span>
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </div>
              </el-card>
            </div>
            
            <!-- 法律声明内容 -->
            <div class="legal-disclaimer">
              <el-card class="disclaimer-card">
                <h5>版权信息</h5>
                <p>© 2024 记账系统. 保留所有权利。本系统的所有内容，包括但不限于文字、图片、音频、视频、软件、代码等，均受中华人民共和国著作权法及相关法律法规保护。</p>
                
                <h5>免责声明</h5>
                <p>1. 本系统提供的所有信息和服务仅供用户参考，不构成任何形式的投资建议或财务建议。</p>
                <p>2. 用户在使用本系统时应遵守相关法律法规，不得利用本系统从事任何违法活动。</p>
                <p>3. 本系统不对因不可抗力或第三方原因导致的数据丢失、服务中断等情况承担责任。</p>
                <p>4. 用户应妥善保管自己的账户信息，因账户信息泄露造成的损失由用户自行承担。</p>
                
                <h5>数据安全</h5>
                <p>我们高度重视用户数据的安全和隐私保护，采用行业标准的安全技术和措施保护用户信息。所有敏感数据均经过加密处理，确保用户信息安全。</p>
                
                <h5>知识产权</h5>
                <p>本系统的商标、标识、软件、技术、设计等相关知识产权均归记账系统开发团队所有，未经许可不得擅自使用。</p>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { InfoFilled, Setting, House, User, Wallet, Document, CreditCard, DataAnalysis, Lock, ArrowRight, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getSystemStatus, formatUptime, formatPercentage } from '@/services/systemStatusService'
import type { SystemStatus } from '@/services/systemStatusService'

const router = useRouter()

// 系统状态
const systemStatus = ref<SystemStatus>({
  type: 'success',
  text: '运行中',
  lastCheckTime: new Date()
})

// 自动刷新定时器
let refreshTimer: number | null = null

// 跳转到用户协议页面
const goToUserAgreement = () => {
  router.push('/dashboard/user-agreement')
}

// 跳转到隐私政策页面
const goToPrivacyPolicy = () => {
  router.push('/dashboard/privacy-policy')
}

// 跳转到服务条款页面
const goToTermsOfService = () => {
  router.push('/dashboard/terms-of-service')
}

// 检查系统状态
const checkSystemStatus = async () => {
  try {
    const status = await getSystemStatus()
    systemStatus.value = status
  } catch (error) {
    console.error('检查系统状态时发生错误:', error)
    // 出错时默认显示运行中状态
    systemStatus.value = { 
      type: 'danger', 
      text: '检查失败', 
      lastCheckTime: new Date() 
    } as SystemStatus
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  // 每30秒自动刷新一次系统状态
  refreshTimer = window.setInterval(() => {
    checkSystemStatus()
  }, 30000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleString('zh-CN')
}

// 格式化运行时间
const formatUptimeDisplay = (seconds: number): string => {
  return formatUptime(seconds)
}

// 格式化百分比
const formatPercentageDisplay = (value: number): string => {
  return formatPercentage(value)
}

// 组件挂载时检查一次系统状态并启动自动刷新
onMounted(() => {
  checkSystemStatus()
  startAutoRefresh()
})

// 组件卸载时停止自动刷新
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.about-system {
  padding: 20px;
  height: 100%;
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
  margin-bottom: 30px;
}

.legal-card {
  flex: 1;
  max-width: 250px;
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

.disclaimer-card {
  text-align: left;
}

.disclaimer-card h5 {
  color: #303133;
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 600;
}

.disclaimer-card p {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 15px;
  text-align: justify;
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
    margin-bottom: 15px;
  }
  
  .legal-links {
    margin-bottom: 20px;
  }
}
</style>