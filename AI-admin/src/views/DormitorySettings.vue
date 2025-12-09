<template>
  <div class="dormitory-settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>寝室设置</span>
          <div>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <div class="settings-content">
        <el-tabs v-model="activeTab" class="settings-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <div class="tab-content">
              <el-form
                ref="basicFormRef"
                :model="basicForm"
                :rules="basicFormRules"
                label-width="120px"
                class="settings-form"
              >
                <el-form-item label="寝室名称" prop="name">
                  <el-input
                    v-model="basicForm.name"
                    placeholder="请输入寝室名称"
                    maxlength="30"
                    show-word-limit
                  />
                </el-form-item>
                
                <el-form-item label="寝室描述" prop="description">
                  <el-input
                    v-model="basicForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入寝室描述"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="saveBasicInfo"
                    :loading="savingBasic"
                  >
                    保存基本信息
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="费用分摊规则" name="expense">
            <div class="tab-content">
              <el-form
                ref="expenseFormRef"
                :model="expenseForm"
                label-width="120px"
                class="settings-form"
              >
                <el-form-item label="默认分摊方式">
                  <el-radio-group v-model="expenseForm.defaultSplitMethod">
                    <el-radio label="equal">平均分摊</el-radio>
                    <el-radio label="custom">自定义分摊</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="费用审批流程">
                  <el-switch
                    v-model="expenseForm.approvalRequired"
                    active-text="需要审批"
                    inactive-text="无需审批"
                  />
                </el-form-item>
                
                <div v-if="expenseForm.approvalRequired">
                  <el-form-item label="审批人">
                    <el-select
                      v-model="expenseForm.approver"
                      placeholder="请选择审批人"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="member in dormMembers"
                        :key="member.id"
                        :label="member.name"
                        :value="member.id"
                      />
                    </el-select>
                  </el-form-item>
                </div>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="saveExpenseRules"
                    :loading="savingExpense"
                  >
                    保存费用规则
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="通知偏好" name="notification">
            <div class="tab-content">
              <el-form
                ref="notificationFormRef"
                :model="notificationForm"
                label-width="150px"
                class="settings-form"
              >
                <el-form-item label="费用相关通知">
                  <el-switch
                    v-model="notificationForm.expenseNotifications"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                
                <el-form-item label="审批相关通知">
                  <el-switch
                    v-model="notificationForm.approvalNotifications"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                
                <el-form-item label="系统公告通知">
                  <el-switch
                    v-model="notificationForm.announcementNotifications"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                </el-form-item>
                
                <el-form-item label="通知方式">
                  <el-checkbox-group v-model="notificationForm.notificationMethods">
                    <el-checkbox label="inApp">站内信</el-checkbox>
                    <el-checkbox label="email">邮件</el-checkbox>
                    <el-checkbox label="sms">短信</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="saveNotificationSettings"
                    :loading="savingNotification"
                  >
                    保存通知设置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="寝室解散" name="dissolve">
            <div class="tab-content">
              <div class="dissolve-section">
                <el-alert
                  title="注意：解散寝室是不可逆操作"
                  type="warning"
                  description="解散寝室后，所有成员将被移出寝室，相关费用记录将被保留但无法继续操作。请谨慎操作。"
                  show-icon
                />
                
                <div class="dissolve-form">
                  <el-form
                    ref="dissolveFormRef"
                    :model="dissolveForm"
                    :rules="dissolveFormRules"
                  >
                    <el-form-item label="确认寝室名称" prop="confirmName">
                      <el-input
                        v-model="dissolveForm.confirmName"
                        placeholder="请输入寝室名称以确认"
                      />
                    </el-form-item>
                    
                    <el-form-item label="解散原因" prop="reason">
                      <el-input
                        v-model="dissolveForm.reason"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入解散原因（可选）"
                      />
                    </el-form-item>
                  </el-form>
                  
                  <el-button 
                    type="danger" 
                    @click="dissolveDormitory"
                    :loading="dissolving"
                    :disabled="dissolveForm.confirmName !== dormitory.name"
                  >
                    确认解散寝室
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="设置变更历史" name="history">
            <div class="tab-content">
              <el-timeline>
                <el-timeline-item
                  v-for="record in settingHistory"
                  :key="record.id"
                  :timestamp="formatDateTime(record.timestamp)"
                  placement="top"
                >
                  <el-card>
                    <h4>{{ record.title }}</h4>
                    <p>{{ record.description }}</p>
                    <p>操作人: {{ record.operator }}</p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由实例
const router = useRouter()
const route = useRoute()

// 响应式数据
const activeTab = ref('basic')
const basicFormRef = ref()
const expenseFormRef = ref()
const notificationFormRef = ref()
const dissolveFormRef = ref()

const savingBasic = ref(false)
const savingExpense = ref(false)
const savingNotification = ref(false)
const dissolving = ref(false)

const dormitory = ref({
  id: 1,
  name: 'A栋101室',
  description: '一楼朝南，采光良好，靠近洗衣房'
})

const dormMembers = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
])

const basicForm = reactive({
  name: 'A栋101室',
  description: '一楼朝南，采光良好，靠近洗衣房'
})

const basicFormRules = {
  name: [
    { required: true, message: '请输入寝室名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ]
}

const expenseForm = reactive({
  defaultSplitMethod: 'equal',
  approvalRequired: true,
  approver: 1
})

const notificationForm = reactive({
  expenseNotifications: true,
  approvalNotifications: true,
  announcementNotifications: true,
  notificationMethods: ['inApp', 'email']
})

const dissolveForm = reactive({
  confirmName: '',
  reason: ''
})

const dissolveFormRules = {
  confirmName: [
    { required: true, message: '请输入寝室名称以确认', trigger: 'blur' }
  ]
}

const settingHistory = ref([
  {
    id: 1,
    title: '修改寝室名称',
    description: '将寝室名称从"A101"修改为"A栋101室"',
    operator: '张三',
    timestamp: '2023-10-15T10:30:00Z'
  },
  {
    id: 2,
    title: '更新费用分摊规则',
    description: '将默认分摊方式设置为平均分摊',
    operator: '李四',
    timestamp: '2023-10-10T14:20:00Z'
  },
  {
    id: 3,
    title: '修改通知偏好',
    description: '开启费用相关通知和审批相关通知',
    operator: '王五',
    timestamp: '2023-10-05T09:15:00Z'
  }
])

// 方法
const goBack = () => {
  router.back()
}

const saveBasicInfo = () => {
  basicFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      savingBasic.value = true
      
      // 模拟保存基本信息
      setTimeout(() => {
        dormitory.value.name = basicForm.name
        dormitory.value.description = basicForm.description
        ElMessage.success('基本信息保存成功')
        savingBasic.value = false
      }, 1000)
    } else {
      ElMessage.warning('请填写完整的寝室基本信息')
    }
  })
}

const saveExpenseRules = () => {
  savingExpense.value = true
  
  // 模拟保存费用规则
  setTimeout(() => {
    ElMessage.success('费用分摊规则保存成功')
    savingExpense.value = false
  }, 1000)
}

const saveNotificationSettings = () => {
  savingNotification.value = true
  
  // 模拟保存通知设置
  setTimeout(() => {
    ElMessage.success('通知偏好设置保存成功')
    savingNotification.value = false
  }, 1000)
}

const dissolveDormitory = async () => {
  if (dissolveForm.confirmName !== dormitory.value.name) {
    ElMessage.warning('请输入正确的寝室名称以确认')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要解散该寝室吗？此操作不可恢复！',
      '确认解散',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    dissolving.value = true
    
    // 模拟解散寝室
    setTimeout(() => {
      ElMessage.success('寝室已成功解散')
      dissolving.value = false
      router.push('/dormitory/list')
    }, 1000)
  } catch {
    // 用户取消操作
  }
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载时的操作
onMounted(() => {
  console.log('⚙️ 寝室设置页面加载完成', route.params.id)
  
  // 初始化表单数据
  basicForm.name = dormitory.value.name
  basicForm.description = dormitory.value.description
})
</script>

<style scoped>
.dormitory-settings-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-content {
  padding: 20px 0;
}

.settings-form {
  max-width: 600px;
}

.dissolve-section {
  max-width: 600px;
}

.dissolve-form {
  margin-top: 20px;
}

.tab-content {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .settings-form {
    max-width: 100%;
  }
  
  .dissolve-section {
    max-width: 100%;
  }
}
</style>