<template>
  <div class="preference-settings">
    <div class="page-header">
      <h2>偏好设置</h2>
      <p>自定义您的使用偏好和界面设置</p>
    </div>
    
    <div class="settings-content">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 界面设置 -->
        <el-tab-pane label="界面设置" name="interface">
          <div class="setting-section">
            <h3>主题设置</h3>
            <div class="setting-item">
              <span class="setting-label">主题颜色</span>
              <el-radio-group v-model="interfaceSettings.theme">
                <el-radio label="light">浅色主题</el-radio>
                <el-radio label="dark">深色主题</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">主色调</span>
              <el-color-picker v-model="interfaceSettings.primaryColor" />
            </div>
          </div>
          
          <div class="setting-section">
            <h3>布局设置</h3>
            <div class="setting-item">
              <span class="setting-label">侧边栏折叠</span>
              <el-switch v-model="interfaceSettings.sidebarCollapsed" />
            </div>
            
            <div class="setting-item">
              <span class="setting-label">显示面包屑</span>
              <el-switch v-model="interfaceSettings.showBreadcrumb" />
            </div>
            
            <div class="setting-item">
              <span class="setting-label">标签页模式</span>
              <el-switch v-model="interfaceSettings.tabMode" />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notification">
          <div class="setting-section">
            <h3>消息通知</h3>
            <div class="setting-item">
              <span class="setting-label">系统通知</span>
              <el-switch v-model="notificationSettings.systemNotification" />
            </div>
            
            <div class="setting-item">
              <span class="setting-label">邮件通知</span>
              <el-switch v-model="notificationSettings.emailNotification" />
            </div>
            
            <div class="setting-item">
              <span class="setting-label">短信通知</span>
              <el-switch v-model="notificationSettings.smsNotification" />
            </div>
          </div>
          
          <div class="setting-section">
            <h3>提醒设置</h3>
            <div class="setting-item">
              <span class="setting-label">账单提醒</span>
              <el-switch v-model="notificationSettings.billReminder" />
            </div>
            
            <div class="setting-item" v-if="notificationSettings.billReminder">
              <span class="setting-label">提醒时间</span>
              <el-time-picker v-model="notificationSettings.reminderTime" format="HH:mm" />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 隐私设置 -->
        <el-tab-pane label="隐私设置" name="privacy">
          <div class="setting-section">
            <h3>个人信息</h3>
            <div class="setting-item">
              <span class="setting-label">公开个人资料</span>
              <el-switch v-model="privacySettings.publicProfile" />
            </div>
            
            <div class="setting-item">
              <span class="setting-label">允许搜索</span>
              <el-switch v-model="privacySettings.allowSearch" />
            </div>
          </div>
          
          <div class="setting-section">
            <h3>数据收集</h3>
            <div class="setting-item">
              <span class="setting-label">使用分析</span>
              <el-switch v-model="privacySettings.usageAnalytics" />
            </div>
            
            <div class="setting-item">
              <span class="setting-label">个性化推荐</span>
              <el-switch v-model="privacySettings.personalizedRecommendations" />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 语言和地区设置 -->
        <el-tab-pane label="语言和地区" name="locale">
          <div class="setting-section">
            <h3>语言设置</h3>
            <div class="setting-item">
              <span class="setting-label">界面语言</span>
              <el-select v-model="localeSettings.language" placeholder="选择语言">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="繁體中文" value="zh-TW" />
                <el-option label="English" value="en-US" />
                <el-option label="日本語" value="ja-JP" />
                <el-option label="한국어" value="ko-KR" />
              </el-select>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>地区设置</h3>
            <div class="setting-item">
              <span class="setting-label">时区</span>
              <el-select v-model="localeSettings.timezone" placeholder="选择时区">
                <el-option label="UTC+8 北京时间" value="Asia/Shanghai" />
                <el-option label="UTC+9 东京时间" value="Asia/Tokyo" />
                <el-option label="UTC-5 纽约时间" value="America/New_York" />
                <el-option label="UTC+0 伦敦时间" value="Europe/London" />
              </el-select>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">货币格式</span>
              <el-select v-model="localeSettings.currency" placeholder="选择货币">
                <el-option label="人民币 (¥)" value="CNY" />
                <el-option label="美元 ($)" value="USD" />
                <el-option label="欧元 (€)" value="EUR" />
                <el-option label="日元 (¥)" value="JPY" />
                <el-option label="韩元 (₩)" value="KRW" />
              </el-select>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">日期格式</span>
              <el-radio-group v-model="localeSettings.dateFormat">
                <el-radio label="YYYY-MM-DD">2024-01-01</el-radio>
                <el-radio label="MM/DD/YYYY">01/01/2024</el-radio>
                <el-radio label="DD/MM/YYYY">01/01/2024</el-radio>
              </el-radio-group>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 快捷操作定制 -->
        <el-tab-pane label="快捷操作" name="shortcuts">
          <div class="setting-section">
            <h3>快捷菜单</h3>
            <div class="setting-item">
              <span class="setting-label">显示快捷菜单</span>
              <el-switch v-model="shortcutSettings.showQuickMenu" />
            </div>
            
            <div class="setting-item" v-if="shortcutSettings.showQuickMenu">
              <span class="setting-label">快捷菜单项</span>
              <el-checkbox-group v-model="shortcutSettings.quickMenuItems">
                <el-checkbox label="dashboard">仪表盘</el-checkbox>
                <el-checkbox label="bill">账单管理</el-checkbox>
                <el-checkbox label="expense">费用报销</el-checkbox>
                <el-checkbox label="dorm">宿舍管理</el-checkbox>
                <el-checkbox label="member">成员管理</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>键盘快捷键</h3>
            <div class="setting-item">
              <span class="setting-label">启用快捷键</span>
              <el-switch v-model="shortcutSettings.enableKeyboardShortcuts" />
            </div>
            
            <div class="shortcut-list" v-if="shortcutSettings.enableKeyboardShortcuts">
              <div class="shortcut-item">
                <span class="shortcut-desc">保存表单</span>
                <el-tag>Ctrl + S</el-tag>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">新建项目</span>
                <el-tag>Ctrl + N</el-tag>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">搜索</span>
                <el-tag>Ctrl + F</el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 设置导入导出 -->
        <el-tab-pane label="备份与恢复" name="backup">
          <div class="setting-section">
            <h3>设置备份</h3>
            <div class="setting-item">
              <span class="setting-label">备份当前设置</span>
              <el-button type="primary" @click="exportSettings" icon="Download">
                导出设置
              </el-button>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">从文件恢复</span>
              <el-upload
                ref="uploadRef"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleImportSettings"
                accept=".json"
              >
                <el-button type="warning" icon="Upload">导入设置</el-button>
              </el-upload>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>重置选项</h3>
            <div class="setting-item">
              <span class="setting-label">重置所有设置</span>
              <el-popconfirm
                title="确定要重置所有设置吗？此操作不可恢复。"
                @confirm="resetAllSettings"
              >
                <template #reference>
                  <el-button type="danger" icon="Refresh">重置所有</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <div class="settings-actions">
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
        <el-button @click="resetSettings">重置默认</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance } from 'element-plus'

// 当前激活的标签页
const activeTab = ref('interface')

// 文件上传引用
const uploadRef = ref<UploadInstance>()

// 界面设置
const interfaceSettings = reactive({
  theme: 'light',
  primaryColor: '#409EFF',
  sidebarCollapsed: false,
  showBreadcrumb: true,
  tabMode: false
})

// 通知设置
const notificationSettings = reactive({
  systemNotification: true,
  emailNotification: true,
  smsNotification: false,
  billReminder: true,
  reminderTime: new Date(2023, 0, 1, 9, 0, 0) // 默认早上9点
})

// 隐私设置
const privacySettings = reactive({
  publicProfile: false,
  allowSearch: true,
  usageAnalytics: true,
  personalizedRecommendations: false
})

// 语言和地区设置
const localeSettings = reactive({
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  currency: 'CNY',
  dateFormat: 'YYYY-MM-DD'
})

// 快捷操作设置
const shortcutSettings = reactive({
  showQuickMenu: true,
  quickMenuItems: ['dashboard', 'bill', 'expense'],
  enableKeyboardShortcuts: true
})

// 保存设置
const saveSettings = () => {
  console.log('保存偏好设置:', {
    interface: interfaceSettings,
    notification: notificationSettings,
    privacy: privacySettings,
    locale: localeSettings,
    shortcut: shortcutSettings
  })
  ElMessage.success('设置保存成功')
}

// 重置设置
const resetSettings = () => {
  // 重置为默认值
  interfaceSettings.theme = 'light'
  interfaceSettings.primaryColor = '#409EFF'
  interfaceSettings.sidebarCollapsed = false
  interfaceSettings.showBreadcrumb = true
  interfaceSettings.tabMode = false
  
  notificationSettings.systemNotification = true
  notificationSettings.emailNotification = true
  notificationSettings.smsNotification = false
  notificationSettings.billReminder = true
  notificationSettings.reminderTime = new Date(2023, 0, 1, 9, 0, 0)
  
  privacySettings.publicProfile = false
  privacySettings.allowSearch = true
  privacySettings.usageAnalytics = true
  privacySettings.personalizedRecommendations = false
  
  localeSettings.language = 'zh-CN'
  localeSettings.timezone = 'Asia/Shanghai'
  localeSettings.currency = 'CNY'
  localeSettings.dateFormat = 'YYYY-MM-DD'
  
  shortcutSettings.showQuickMenu = true
  shortcutSettings.quickMenuItems = ['dashboard', 'bill', 'expense']
  shortcutSettings.enableKeyboardShortcuts = true
  
  ElMessage.success('设置已重置为默认值')
}

// 导出设置
const exportSettings = () => {
  const settings = {
    interface: interfaceSettings,
    notification: notificationSettings,
    privacy: privacySettings,
    locale: localeSettings,
    shortcut: shortcutSettings,
    exportTime: new Date().toISOString()
  }
  
  const dataStr = JSON.stringify(settings, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `preference-settings-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('设置导出成功')
}

// 导入设置
const handleImportSettings = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const settings = JSON.parse(e.target?.result as string)
      
      // 导入界面设置
      if (settings.interface) {
        Object.assign(interfaceSettings, settings.interface)
      }
      
      // 导入通知设置
      if (settings.notification) {
        Object.assign(notificationSettings, settings.notification)
      }
      
      // 导入隐私设置
      if (settings.privacy) {
        Object.assign(privacySettings, settings.privacy)
      }
      
      // 导入语言和地区设置
      if (settings.locale) {
        Object.assign(localeSettings, settings.locale)
      }
      
      // 导入快捷操作设置
      if (settings.shortcut) {
        Object.assign(shortcutSettings, settings.shortcut)
      }
      
      ElMessage.success('设置导入成功')
    } catch (error) {
      ElMessage.error('设置文件格式错误，请检查文件内容')
    }
  }
  reader.readAsText(file.raw)
}

// 重置所有设置
const resetAllSettings = () => {
  resetSettings()
  ElMessage.success('所有设置已重置为默认值')
}

// 加载设置
const loadSettings = () => {
  // 模拟从后端加载设置
  console.log('加载用户偏好设置')
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.preference-settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.settings-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.settings-tabs {
  padding: 20px;
}

.setting-section {
  margin-bottom: 30px;
}

.setting-section h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
}

.setting-label {
  font-size: 14px;
  color: #606266;
  min-width: 120px;
}

.shortcut-list {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.shortcut-item:last-child {
  margin-bottom: 0;
}

.shortcut-desc {
  font-size: 14px;
  color: #606266;
}

.settings-actions {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  text-align: right;
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .setting-label {
    min-width: auto;
  }
}
</style>