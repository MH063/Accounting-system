<template>
  <div class="help-center">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><QuestionFilled /></el-icon> 帮助中心</span>
        </div>
      </template>
      
      <div class="help-content">
        <!-- 搜索框 -->
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索帮助内容..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </div>

        <!-- 快速导航 -->
        <div class="quick-nav">
          <el-button
            v-for="item in helpCategories"
            :key="item.key"
            :type="activeCategory === item.key ? 'primary' : 'default'"
            @click="switchCategory(item.key)"
          >
            <el-icon style="margin-right: 4px;">
              <component :is="item.icon" />
            </el-icon>
            {{ item.title }}
          </el-button>
        </div>

        <!-- 帮助内容区域 -->
        <div class="help-main-content">
          <!-- 使用教程 -->
          <div v-if="activeCategory === 'tutorial'" class="content-section">
            <h3>使用教程</h3>
            <el-collapse v-model="activeTutorial" accordion>
              <el-collapse-item title="如何开始使用系统" name="1">
                <div class="tutorial-content">
                  <h4>第一步：登录系统</h4>
                  <p>使用您的用户名和密码登录系统。如果您还没有账户，请联系管理员进行注册。</p>
                  
                  <h4>第二步：完善个人信息</h4>
                  <p>登录后，请先完善您的个人信息，包括姓名、联系方式、邮箱等基本信息。</p>
                  
                  <h4>第三步：浏览主要功能</h4>
                  <p>系统主要功能包括：财务管理、成员管理、费用管理、统计分析等。您可以通过左侧导航菜单访问各个功能模块。</p>
                  
                  <h4>第四步：开始使用</h4>
                  <p>根据您的需求选择相应的功能模块开始使用。每个模块都有详细的操作指引。</p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="财务管理功能使用指南" name="2">
                <div class="tutorial-content">
                  <h4>查看财务报表</h4>
                  <p>在财务管理模块中，您可以查看收入、支出、预算等各类财务报表。支持按时间范围筛选和导出功能。</p>
                  
                  <h4>添加财务记录</h4>
                  <p>点击"新增记录"按钮，填写相关信息（金额、类别、描述等），保存后即可添加新的财务记录。</p>
                  
                  <h4>预算管理</h4>
                  <p>设置每月预算，系统会自动跟踪预算使用情况，超出预算时会发送提醒通知。</p>
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="成员管理操作说明" name="3">
                <div class="tutorial-content">
                  <h4>添加新成员</h4>
                  <p>在成员管理页面，点击"添加成员"按钮，输入成员基本信息，设置相应权限后保存。</p>
                  
                  <h4>权限设置</h4>
                  <p>管理员可以为不同成员设置不同的操作权限，确保系统安全性和数据隐私。</p>
                  
                  <h4>成员状态管理</h4>
                  <p>可以查看成员的活跃状态，对离职或调岗的成员进行状态更新。</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 常见问题 -->
          <div v-if="activeCategory === 'faq'" class="content-section">
            <h3>常见问题解答</h3>
            <el-collapse v-model="activeFaq" accordion>
              <el-collapse-item 
                v-for="item in faqItems" 
                :key="item.id" 
                :title="item.question"
                :name="item.id"
              >
                <div class="faq-answer">{{ item.answer }}</div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 在线客服 -->
          <div v-if="activeCategory === 'support'" class="content-section">
            <h3>在线客服</h3>
            <div class="support-container">
              <div class="support-status">
                <el-icon :size="48" color="#67c23a"><CircleCheck /></el-icon>
                <h4>客服在线</h4>
                <p>工作日 9:00-18:00</p>
              </div>
              
              <div class="support-actions">
                <el-button type="primary" @click="startChat" :icon="ChatLineRound">
                  开始对话
                </el-button>
                <el-button @click="showContactInfo" :icon="Phone">
                  联系方式
                </el-button>
              </div>
              
              <div class="support-notice">
                <el-alert
                  title="温馨提示"
                  type="info"
                  description="客服响应时间通常为5-10分钟，如遇繁忙请耐心等待或留言"
                  :closable="false"
                />
              </div>
            </div>
          </div>

          <!-- 问题反馈 -->
          <div v-if="activeCategory === 'feedback'" class="content-section">
            <h3>问题反馈</h3>
            <el-form :model="feedbackForm" label-width="100px" class="feedback-form">
              <el-form-item label="问题类型">
                <el-select v-model="feedbackForm.type" placeholder="请选择问题类型">
                  <el-option label="功能建议" value="feature" />
                  <el-option label="错误报告" value="bug" />
                  <el-option label="操作疑问" value="question" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="问题描述">
                <el-input
                  v-model="feedbackForm.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请详细描述您遇到的问题..."
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="联系方式">
                <el-input
                  v-model="feedbackForm.contact"
                  placeholder="请输入您的邮箱或手机号（可选）"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="submitFeedback" :loading="submitting">
                  提交反馈
                </el-button>
                <el-button @click="resetFeedback">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  QuestionFilled, 
  Phone, 
  Search, 
  CircleCheck, 
  ChatLineRound, 
  Service, 
  Edit,
  Guide
} from '@element-plus/icons-vue'

// 搜索功能
const searchQuery = ref('')
const handleSearch = () => {
  console.log('搜索内容：', searchQuery.value)
  // 这里可以添加实际的搜索逻辑
}

// 分类切换
const activeCategory = ref('tutorial')
const activeTutorial = ref('')
const activeFaq = ref('')

const helpCategories = [
  { key: 'tutorial', title: '使用教程', icon: Guide },
  { key: 'faq', title: '常见问题', icon: QuestionFilled },
  { key: 'support', title: '在线客服', icon: Service },
  { key: 'feedback', title: '问题反馈', icon: Edit }
]

const switchCategory = (key: string) => {
  activeCategory.value = key
  console.log('切换到分类：', key)
}

// 常见问题数据
const faqItems = [
  {
    id: '1',
    question: '如何重置密码？',
    answer: '在登录页面点击"忘记密码"，输入您的注册邮箱，系统会发送重置密码的链接到您的邮箱。点击链接按照提示重置密码即可。如果收不到邮件，请检查垃圾邮件箱或联系客服。'
  },
  {
    id: '2',
    question: '数据如何备份？',
    answer: '系统会自动定期备份您的数据，您也可以手动导出重要数据。在"系统设置"-"数据管理"中可以选择导出数据的格式和范围。建议每月至少手动备份一次重要数据。'
  },
  {
    id: '3',
    question: '如何添加新成员？',
    answer: '管理员可以在"成员管理"页面点击"添加成员"按钮，填写新成员的基本信息（姓名、邮箱、角色等），设置相应的权限后保存即可。新成员会收到激活邮件。'
  },
  {
    id: '4',
    question: '权限设置说明',
    answer: '系统提供多级权限管理：超级管理员拥有所有权限，管理员可以管理用户和数据，普通用户只能查看和操作自己的数据。权限可以在"系统设置"-"权限管理"中配置。'
  },
  {
    id: '5',
    question: '系统支持哪些浏览器？',
    answer: '系统支持主流浏览器：Chrome、Firefox、Safari、Edge（最新版本）。建议使用Chrome浏览器以获得最佳体验。IE浏览器不支持部分功能。'
  },
  {
    id: '6',
    question: '如何导出报表？',
    answer: '在各个功能模块中，找到"导出"或"下载"按钮，选择需要的格式（Excel、PDF、CSV）和时间范围，点击确认即可导出。大文件导出可能需要几分钟时间。'
  }
]

// 反馈表单
const feedbackForm = reactive({
  type: '',
  description: '',
  contact: ''
})

const submitting = ref(false)

const submitFeedback = () => {
  if (!feedbackForm.type || !feedbackForm.description) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  submitting.value = true
  console.log('提交反馈：', feedbackForm)
  
  // 模拟提交过程
  setTimeout(() => {
    ElMessage.success('反馈提交成功！我们会尽快处理您的问题')
    resetFeedback()
    submitting.value = false
  }, 1500)
}

const resetFeedback = () => {
  feedbackForm.type = ''
  feedbackForm.description = ''
  feedbackForm.contact = ''
}

// 在线客服功能
const startChat = () => {
  ElMessage.info('客服功能开发中，即将开放...')
  console.log('开始客服对话')
}

const showContactInfo = () => {
  ElMessage({
    message: '客服电话：400-123-4567\n客服邮箱：support@company.com\n工作时间：周一至周五 9:00-18:00',
    type: 'info',
    duration: 5000,
    showClose: true
  })
}
</script>

<style scoped>
.help-center {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.help-content {
  min-height: 500px;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 30px;
  max-width: 600px;
}

/* 快速导航 */
.quick-nav {
  margin-bottom: 30px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-nav .el-button {
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

/* 主要内容区域 */
.help-main-content {
  min-height: 400px;
  margin-bottom: 40px;
}

.content-section {
  background-color: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.content-section h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

/* 教程内容样式 */
.tutorial-content {
  padding: 20px 0;
}

.tutorial-content h4 {
  color: #409eff;
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 600;
}

.tutorial-content p {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 15px 0;
}

/* FAQ样式 */
.faq-answer {
  color: #606266;
  line-height: 1.6;
  padding: 10px 0;
}

/* 在线客服样式 */
.support-container {
  text-align: center;
  padding: 40px 20px;
}

.support-status {
  margin-bottom: 30px;
}

.support-status h4 {
  color: #67c23a;
  margin: 15px 0 5px 0;
  font-size: 18px;
}

.support-status p {
  color: #909399;
  margin: 0;
}

.support-actions {
  margin-bottom: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.support-notice {
  max-width: 500px;
  margin: 0 auto;
}

/* 反馈表单样式 */
.feedback-form {
  max-width: 600px;
  margin: 0 auto;
}

/* 原有样式兼容 */
.help-sections {
  margin-top: 40px;
}

.help-section {
  text-align: center;
  padding: 30px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.help-section:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.help-section .el-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.help-section h4 {
  margin: 15px 0 10px;
  color: #303133;
}

.help-section p {
  color: #606266;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-center {
    padding: 10px;
  }
  
  .content-section {
    padding: 20px;
  }
  
  .quick-nav {
    flex-direction: column;
  }
  
  .quick-nav .el-button {
    width: 100%;
    justify-content: flex-start;
  }
  
  .support-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .help-section {
    padding: 20px;
    margin-bottom: 16px;
  }
  
  .help-sections .el-col {
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .search-section {
    margin-bottom: 20px;
  }
  
  .content-section {
    padding: 15px;
  }
  
  .tutorial-content {
    padding: 15px 0;
  }
  
  .support-container {
    padding: 20px 10px;
  }
}
</style>}]}