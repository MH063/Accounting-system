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
            <h3>预设管理</h3>
            <div class="setting-item">
              <span class="setting-label">保存为预设</span>
              <el-button @click="showPresetDialog = true" icon="Document">
                保存预设
              </el-button>
            </div>
            
            <div class="setting-item">
              <span class="setting-label">加载预设</span>
              <el-select 
                v-model="selectedPreset" 
                placeholder="选择预设" 
                @change="loadPreset"
                clearable
              >
                <el-option
                  v-for="preset in presets"
                  :key="preset.id"
                  :label="preset.name"
                  :value="preset.id"
                />
              </el-select>
            </div>
            
            <div class="setting-item" v-if="presets.length > 0">
              <span class="setting-label">删除预设</span>
              <el-button @click="deleteSelectedPreset" type="danger" icon="Delete">
                删除选中预设
              </el-button>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>自动保存</h3>
            <div class="setting-item">
              <span class="setting-label">启用自动保存</span>
              <el-switch 
                v-model="enableAutoSave" 
                @change="toggleAutoSave"
                active-text="开启后将每隔30秒自动保存设置"
              />
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
    
    <!-- 保存预设对话框 -->
    <el-dialog v-model="showPresetDialog" title="保存预设" width="400px">
      <el-form>
        <el-form-item label="预设名称">
          <el-input v-model="newPresetName" placeholder="请输入预设名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPresetDialog = false">取消</el-button>
        <el-button type="primary" @click="savePreset">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

// 预设管理
const showPresetDialog = ref(false)
const newPresetName = ref('')
const selectedPreset = ref('')
const presets = ref<Array<{id: string, name: string, settings: any}>>([])

// 自动保存功能
const enableAutoSave = ref(false)
let autoSaveTimer: number | null = null

// 保存设置
const saveSettings = () => {
  try {
    // 保存到 localStorage
    const settings = {
      interface: interfaceSettings,
      notification: notificationSettings,
      privacy: privacySettings,
      locale: localeSettings,
      shortcut: shortcutSettings,
      lastSaved: new Date().toISOString()
    }
    
    localStorage.setItem('user-preferences', JSON.stringify(settings))
    
    // 应用设置到系统
    applySettings()
    
    ElMessage.success('设置保存成功')
    console.log('偏好设置已保存:', settings)
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('设置保存失败，请重试')
  }
}

// 应用设置到系统
const applySettings = () => {
  // 应用主题设置
  document.documentElement.setAttribute('data-theme', interfaceSettings.theme)
  
  // 应用主色调
  document.documentElement.style.setProperty('--primary-color', interfaceSettings.primaryColor)
  
  // 触发自定义事件，通知其他组件设置已更新
  window.dispatchEvent(new CustomEvent('preferences-updated', {
    detail: {
      interface: interfaceSettings,
      notification: notificationSettings,
      privacy: privacySettings,
      locale: localeSettings,
      shortcut: shortcutSettings
    }
  }))
}

// 重置设置
const resetSettings = () => {
  ElMessageBox.confirm(
    '确定要重置所有设置为默认值吗？此操作不可恢复。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
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
    
    // 保存重置后的设置
    saveSettings()
    
    ElMessage.success('设置已重置为默认值')
  }).catch(() => {
    // 用户取消操作
  })
}

// 导出设置
const exportSettings = () => {
  try {
    const settings = {
      interface: interfaceSettings,
      notification: notificationSettings,
      privacy: privacySettings,
      locale: localeSettings,
      shortcut: shortcutSettings,
      exportTime: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `preference-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('设置导出成功')
  } catch (error) {
    console.error('导出设置失败:', error)
    ElMessage.error('设置导出失败，请重试')
  }
}

// 导入设置
const handleImportSettings = (file: any) => {
  if (!file.raw) return
  
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    try {
      const settings = JSON.parse(e.target?.result as string) as {
        interface?: Partial<typeof interfaceSettings>
        notification?: Partial<typeof notificationSettings>
        privacy?: Partial<typeof privacySettings>
        locale?: Partial<typeof localeSettings>
        shortcut?: Partial<typeof shortcutSettings>
        version?: string
      }
      
      ElMessageBox.confirm(
        `确定要导入此设置文件吗？这将覆盖您当前的所有设置。${settings.version ? `文件版本: ${settings.version}` : ''}`,
        '确认导入',
        {
          confirmButtonText: '确定导入',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
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
        
        // 保存导入的设置
        saveSettings()
        
        ElMessage.success('设置导入成功')
      }).catch(() => {
        // 用户取消导入
      })
    } catch (error) {
      console.error('导入设置失败:', error)
      ElMessage.error('设置文件格式错误，请检查文件内容')
    }
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  reader.readAsText(file.raw)
}

// 重置所有设置
const resetAllSettings = () => {
  resetSettings()
}

// 预设管理功能
const savePreset = () => {
  if (!newPresetName.value.trim()) {
    ElMessage.warning('请输入预设名称')
    return
  }
  
  const preset = {
    id: Date.now().toString(),
    name: newPresetName.value.trim(),
    settings: {
      interface: { ...interfaceSettings },
      notification: { ...notificationSettings },
      privacy: { ...privacySettings },
      locale: { ...localeSettings },
      shortcut: { ...shortcutSettings }
    }
  }
  
  // 保存到预设列表
  presets.value.push(preset)
  savePresetsToStorage()
  
  // 重置表单
  newPresetName.value = ''
  showPresetDialog.value = false
  
  ElMessage.success('预设保存成功')
}

const loadPreset = (presetId: string) => {
  if (!presetId) return
  
  const preset = presets.value.find(p => p.id === presetId)
  if (!preset) {
    ElMessage.error('未找到指定预设')
    return
  }
  
  ElMessageBox.confirm(
    `确定要加载预设"${preset.name}"吗？这将覆盖您当前的所有设置。`,
    '确认加载',
    {
      confirmButtonText: '确定加载',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 加载预设设置
    if (preset.settings.interface) {
      Object.assign(interfaceSettings, preset.settings.interface)
    }
    
    if (preset.settings.notification) {
      Object.assign(notificationSettings, preset.settings.notification)
    }
    
    if (preset.settings.privacy) {
      Object.assign(privacySettings, preset.settings.privacy)
    }
    
    if (preset.settings.locale) {
      Object.assign(localeSettings, preset.settings.locale)
    }
    
    if (preset.settings.shortcut) {
      Object.assign(shortcutSettings, preset.settings.shortcut)
    }
    
    // 保存并应用设置
    saveSettings()
    
    ElMessage.success(`预设"${preset.name}"加载成功`)
  }).catch(() => {
    // 用户取消操作
    selectedPreset.value = ''
  })
}

const deleteSelectedPreset = () => {
  if (!selectedPreset.value) {
    ElMessage.warning('请先选择要删除的预设')
    return
  }
  
  const preset = presets.value.find(p => p.id === selectedPreset.value)
  if (!preset) {
    ElMessage.error('未找到指定预设')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除预设"${preset.name}"吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    presets.value = presets.value.filter(p => p.id !== selectedPreset.value)
    selectedPreset.value = ''
    savePresetsToStorage()
    
    ElMessage.success(`预设"${preset.name}"删除成功`)
  }).catch(() => {
    // 用户取消操作
  })
}

const savePresetsToStorage = () => {
  try {
    localStorage.setItem('user-presets', JSON.stringify(presets.value))
  } catch (error) {
    console.error('保存预设失败:', error)
  }
}

const loadPresetsFromStorage = () => {
  try {
    const presetsStr = localStorage.getItem('user-presets')
    if (presetsStr) {
      presets.value = JSON.parse(presetsStr)
    }
  } catch (error) {
    console.error('加载预设失败:', error)
  }
}

// 切换自动保存功能
const toggleAutoSave = (value: boolean) => {
  enableAutoSave.value = value
  if (value) {
    startAutoSave()
    ElMessage.info('已开启自动保存，设置将每隔30秒自动保存')
  } else {
    stopAutoSave()
    ElMessage.info('已关闭自动保存')
  }
}

// 启动自动保存
const startAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  
  autoSaveTimer = window.setInterval(() => {
    saveSettings()
  }, 30000) // 每30秒自动保存一次
}

// 停止自动保存
const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 加载设置
const loadSettings = () => {
  try {
    // 从 localStorage 加载设置
    const savedSettingsStr = localStorage.getItem('user-preferences')
    if (savedSettingsStr) {
      const savedSettings = JSON.parse(savedSettingsStr)
      
      // 恢复界面设置
      if (savedSettings.interface) {
        Object.assign(interfaceSettings, savedSettings.interface)
      }
      
      // 恢复通知设置
      if (savedSettings.notification) {
        Object.assign(notificationSettings, savedSettings.notification)
      }
      
      // 恢复隐私设置
      if (savedSettings.privacy) {
        Object.assign(privacySettings, savedSettings.privacy)
      }
      
      // 恢复语言和地区设置
      if (savedSettings.locale) {
        Object.assign(localeSettings, savedSettings.locale)
      }
      
      // 恢复快捷操作设置
      if (savedSettings.shortcut) {
        Object.assign(shortcutSettings, savedSettings.shortcut)
      }
      
      // 应用设置
      applySettings()
      
      console.log('用户偏好设置已加载:', savedSettings)
    } else {
      // 如果没有保存的设置，使用默认设置并保存
      saveSettings()
      console.log('使用默认偏好设置')
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('加载用户设置失败，将使用默认设置')
  }
}

// 组件挂载时加载设置和预设
onMounted(() => {
  loadSettings()
  loadPresetsFromStorage()
})

// 组件卸载时清理
onUnmounted(() => {
  stopAutoSave()
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
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
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
  border-bottom: 1px dashed #e4e7ed;
}

.setting-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
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

/* 预设选择器样式 */
.el-select {
  width: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .setting-label {
    min-width: auto;
  }
  
  .el-select {
    width: 100%;
  }
  
  .settings-actions {
    text-align: center;
  }
  
  .settings-actions .el-button {
    margin-bottom: 10px;
  }
}
</style>