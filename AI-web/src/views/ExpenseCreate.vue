<template>
  <div class="expense-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Plus /></el-icon>
          新建费用
        </h1>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="$router.back()"
          class="back-btn"
        >
          返回
        </el-button>
        <el-button 
          @click="$router.back()"
          class="cancel-btn"
        >
          取消
        </el-button>
        <el-button 
          type="primary" 
          :icon="DocumentCopy"
          @click="handleSaveDraft"
          class="draft-btn"
        >
          保存草稿
        </el-button>
        <el-button 
          type="success" 
          :icon="Check"
          @click="handleSubmit"
          class="submit-btn"
          :loading="submitting"
        >
          提交费用
        </el-button>
      </div>
    </div>

    <!-- 创建表单 -->
    <div class="form-section">
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">费用信息</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          class="expense-form"
        >
          <!-- 基本信息 -->
          <div class="form-section-title">
            <el-icon><Document /></el-icon>
            基本信息
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="费用标题" prop="title">
                <el-input
                  v-model="formData.title"
                  placeholder="请输入费用标题"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="费用类别" prop="category">
                <el-select
                  v-model="formData.category"
                  placeholder="请选择费用类别"
                  style="width: 100%"
                  filterable
                >
                  <el-optgroup label="住宿费用">
                    <el-option label="房租租金" value="rent" />
                    <el-option label="住宿押金" value="deposit" />
                    <el-option label="住宿管理费" value="management_fee" />
                  </el-optgroup>
                  <el-optgroup label="生活费用">
                    <el-option label="水费" value="water_fee" />
                    <el-option label="电费" value="electricity_fee" />
                    <el-option label="燃气费" value="gas_fee" />
                    <el-option label="网费" value="internet_fee" />
                    <el-option label="有线电视费" value="tv_fee" />
                  </el-optgroup>
                  <el-optgroup label="维护费用">
                    <el-option label="设备维修" value="equipment_repair" />
                    <el-option label="家具维修" value="furniture_repair" />
                    <el-option label="电器维修" value="appliance_repair" />
                    <el-option label="门窗维修" value="door_window_repair" />
                    <el-option label="管道疏通" value="plumbing" />
                  </el-optgroup>
                  <el-optgroup label="清洁费用">
                    <el-option label="日常清洁" value="daily_cleaning" />
                    <el-option label="深度清洁" value="deep_cleaning" />
                    <el-option label="杀虫除害" value="pest_control" />
                    <el-option label="垃圾处理" value="waste_disposal" />
                  </el-optgroup>
                  <el-optgroup label="其他费用">
                    <el-option label="保险费用" value="insurance" />
                    <el-option label="中介服务费" value="agency_fee" />
                    <el-option label="法律咨询费" value="legal_fee" />
                    <el-option label="其他杂费" value="miscellaneous" />
                  </el-optgroup>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 智能金额输入 -->
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="费用金额" prop="amount">
                <div class="smart-amount-input">
                  <el-input
                    v-model="amountDisplay"
                    placeholder="0.00"
                    @input="handleAmountInput"
                    @blur="handleAmountBlur"
                    class="amount-input"
                  />
                  <span class="currency-unit">元</span>
                  <div class="amount-suggestions" v-if="amountSuggestions.length > 0">
                    <el-tag
                      v-for="suggestion in amountSuggestions"
                      :key="suggestion"
                      @click="applyAmountSuggestion(suggestion)"
                      class="suggestion-tag"
                      size="small"
                    >
                      ¥{{ (suggestion || 0).toFixed(2) }}
                    </el-tag>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="费用日期" prop="date">
                <el-date-picker
                  v-model="formData.date"
                  type="date"
                  placeholder="选择费用日期"
                  style="width: 100%"
                  :disabled-date="disabledDate"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 分摊方式计算器 -->
          <div class="form-section-title">
            <el-icon><TrendCharts /></el-icon>
            分摊方式计算
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="分摊方式">
                <el-select
                  v-model="formData.splitMethod"
                  placeholder="请选择分摊方式"
                  style="width: 100%"
                  @change="handleSplitMethodChange"
                >
                  <el-option label="平均分摊" value="average" />
                  <el-option label="按权重分摊" value="weight" />
                  <el-option label="按人数比例" value="person_ratio" />
                  <el-option label="自定义分摊" value="custom" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="参与人数">
                <el-input-number
                  v-model="formData.participantCount"
                  :min="1"
                  :max="10"
                  @change="handleParticipantCountChange"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 分摊结果展示 -->
          <el-form-item label="分摊结果" v-if="formData.amount && formData.splitMethod">
            <div class="split-result">
              <div class="per-person-amount">
                每人应付：<span class="amount-highlight">¥{{ formatCurrency(calculatePerPersonAmount()) }}</span>
              </div>
              <div class="split-details" v-if="showSplitDetails">
                <div class="split-item" v-for="(item, index) in splitDetails" :key="item.name + '-' + index">
                  <span>{{ item.name }}</span>
                  <span class="split-amount">¥{{ formatCurrency(item.amount) }}</span>
                </div>
              </div>
              <el-button 
                type="text" 
                size="small" 
                @click="showSplitDetails = !showSplitDetails"
                class="toggle-details-btn"
              >
                {{ showSplitDetails ? '隐藏详情' : '显示详情' }}
              </el-button>
            </div>
          </el-form-item>

          <!-- 参与成员选择 -->
          <div class="form-section-title">
            <el-icon><User /></el-icon>
            参与成员选择
          </div>

          <el-form-item label="选择参与成员">
            <div class="member-selection">
              <el-button 
                type="primary" 
                plain 
                @click="showMemberDialog = true"
                class="select-members-btn"
              >
                <el-icon><UserFilled /></el-icon>
                选择成员 ({{ selectedMembers.length }} 人已选)
              </el-button>
              
              <div class="selected-members" v-if="selectedMembers.length > 0">
                <div class="member-tags">
                  <el-tag
                    v-for="member in selectedMembers"
                    :key="member.id"
                    type="info"
                    closable
                    @close="removeMember(member)"
                    class="member-tag"
                  >
                    <el-avatar 
                      :size="16" 
                      :src="member.avatar"
                      class="member-avatar-small"
                    >
                      {{ member.name.charAt(0) }}
                    </el-avatar>
                    {{ member.name }} ({{ member.room }})
                  </el-tag>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="费用描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="请详细描述费用用途和相关内容"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 申请人信息 -->
          <div class="form-section-title">
            <el-icon><User /></el-icon>
            申请人信息
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="申请人姓名" prop="applicant">
                <el-input
                  v-model="formData.applicant"
                  placeholder="请输入申请人姓名"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input
                  v-model="formData.phone"
                  placeholder="请输入联系电话"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="所属部门">
                <el-input
                  v-model="formData.department"
                  placeholder="请输入所属部门"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="职务">
                <el-input
                  v-model="formData.position"
                  placeholder="请输入职务"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 附件信息 -->
          <div class="form-section-title">
            <el-icon><Paperclip /></el-icon>
            附件信息
          </div>

          <el-form-item label="相关票据">
            <el-upload
              v-model:file-list="fileList"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :on-exceed="handleFileExceed"
              :limit="5"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              class="upload-area"
            >
              <div class="upload-button">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">上传票据照片或文件</span>
                <span class="upload-hint">支持 JPG、PNG、PDF、DOC 格式，单个文件不超过 5MB</span>
              </div>
            </el-upload>
          </el-form-item>

          <!-- 审核相关 -->
          <div class="form-section-title">
            <el-icon><DocumentChecked /></el-icon>
            审核设置
          </div>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="是否紧急">
                <el-switch
                  v-model="formData.isUrgent"
                  active-text="是"
                  inactive-text="否"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="期望审核日期">
                <el-date-picker
                  v-model="formData.expectedReviewDate"
                  type="date"
                  placeholder="选择期望审核日期"
                  style="width: 100%"
                  :disabled-date="disabledDate"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注说明">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入其他需要说明的内容"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 成员选择对话框 -->
    <el-dialog
      v-model="showMemberDialog"
      title="选择参与成员"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="member-dialog-content">
        <!-- 房间信息提示 -->
        <div class="room-info-notice">
          <el-alert
            :title="`只能选择同一房间（${currentRoomInfo.roomNumber}）的成员进行费用分摊`"
            type="info"
            :closable="false"
            show-icon
            class="room-alert"
          />
        </div>

        <div class="member-search-bar">
          <el-input
            v-model="memberSearchQuery"
            placeholder="搜索成员姓名或房间号"
            :prefix-icon="Search"
            clearable
            class="member-search-input"
          />
        </div>

        <!-- 全选和反选按钮 -->
        <div class="selection-actions">
          <el-button 
            type="primary" 
            plain
            size="small"
            @click="selectAllMembers"
            :disabled="filteredMembers.length === 0"
          >
            <el-icon><Select /></el-icon>
            全选
          </el-button>
          <el-button 
            type="warning" 
            plain
            size="small"
            @click="invertSelection"
            :disabled="filteredMembers.length === 0"
          >
            <el-icon><Refresh /></el-icon>
            反选
          </el-button>
        </div>
        
        <div class="member-stats">
          <span class="stats-text">当前房间：{{ currentRoomInfo.roomNumber }} | 可选成员：{{ currentRoomInfo.availableMembers.length }} 人</span>
        </div>
        
        <div class="member-list">
          <div class="member-grid">
            <div
              v-for="member in filteredMembers"
              :key="member.id"
              class="member-item"
              :class="{ selected: isMemberSelected(member) }"
              @click="toggleMember(member)"
            >
              <div class="member-content">
                <el-avatar 
                  :size="50" 
                  :src="member.avatar"
                  class="member-avatar"
                >
                  {{ member.name.charAt(0) }}
                </el-avatar>
                <div class="member-details">
                  <div class="member-name-row">
                    <span class="member-name">{{ member.name }}</span>
                    <div class="member-status-indicator" :class="member.status"></div>
                  </div>
                  <div class="member-room">{{ member.room }}</div>
                  <div class="member-role-tags">
                    <el-tag 
                      v-if="member.role === 'dorm_leader'" 
                      size="small" 
                      type="warning"
                      class="role-tag"
                    >
                      寝室长
                    </el-tag>
                    <el-tag 
                      v-else-if="member.role === 'admin'" 
                      size="small" 
                      type="danger"
                      class="role-tag"
                    >
                      管理员
                    </el-tag>
                    <el-tag 
                      v-else 
                      size="small" 
                      type="info"
                      class="role-tag"
                    >
                      成员
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="member-selection-area">
                <div v-if="isMemberSelected(member)" class="selected-check">
                  <el-icon class="check-icon">
                    <CircleCheck />
                  </el-icon>
                  <span class="selected-text">已选择</span>
                </div>
                <el-button 
                  v-else
                  type="primary" 
                  plain
                  size="small"
                  class="select-btn"
                >
                  选择
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <div class="selected-count">
            已选择 {{ selectedMembers.length }} 人
          </div>
          <div class="dialog-actions">
            <el-button @click="showMemberDialog = false">
              取消
            </el-button>
            <el-button 
              type="primary" 
              @click="confirmMemberSelection"
            >
              确定 ({{ selectedMembers.length }})
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, Plus, Document, User, UserFilled, Paperclip, DocumentChecked,
  Check, DocumentCopy, TrendCharts, Search, CircleCheck, Select, Refresh
} from '@element-plus/icons-vue'
import { ElMessage, type UploadUserFile } from 'element-plus'

// 路由
const router = useRouter()

// 表单引用
const formRef = ref()

// 提交状态
const submitting = ref(false)

// 文件列表
const fileList = ref<UploadUserFile[]>([])

// 智能金额输入
const amountDisplay = ref('')
const amountSuggestions = ref<number[]>([100, 200, 300, 500, 1000, 1500, 2000, 3000])

// 分摊方式相关
const showSplitDetails = ref(false)
const splitDetails = ref([
  { name: '张三', amount: 100.50 },
  { name: '李四', amount: 100.50 },
  { name: '王五', amount: 100.50 },
  { name: '赵六', amount: 100.50 }
])

// 类型定义
interface Member {
  id: number
  name: string
  room: string
  avatar: string
  role: string
  status?: string
}

// 成员相关
const showMemberDialog = ref(false)
const memberSearchQuery = ref('')
const selectedMembers = ref<Member[]>([])

// 获取当前用户的房间信息
const getCurrentUserRoom = () => {
  // 模拟获取当前用户的房间信息
  // 在实际项目中，这里应该从用户状态管理或API获取
  const currentUsername = localStorage.getItem('username') || '张三'
  
  // 根据当前用户名返回对应的房间
  const userRoomMap: { [key: string]: string } = {
    '张三': 'A-101',
    '李四': 'A-101', 
    '王五': 'A-101',
    '赵六': 'A-102',
    '钱七': 'A-102',
    '孙八': 'A-103',
    '周九': 'A-103'
  }
  
  return userRoomMap[currentUsername] || 'A-101'
}

// 当前用户房间
const currentUserRoom = ref(getCurrentUserRoom())

const allMembers = ref<Member[]>([
  { id: 1, name: '张三', room: 'A-101', avatar: 'https://picsum.photos/40/40?random=1', role: 'dorm_leader', status: 'active' },
  { id: 2, name: '李四', room: 'A-101', avatar: 'https://picsum.photos/40/40?random=2', role: 'member', status: 'active' },
  { id: 3, name: '王五', room: 'A-101', avatar: 'https://picsum.photos/40/40?random=3', role: 'member', status: 'active' },
  { id: 4, name: '赵六', room: 'A-102', avatar: 'https://picsum.photos/40/40?random=4', role: 'member', status: 'active' },
  { id: 5, name: '钱七', room: 'A-102', avatar: 'https://picsum.photos/40/40?random=5', role: 'member', status: 'away' },
  { id: 6, name: '孙八', room: 'A-103', avatar: 'https://picsum.photos/40/40?random=6', role: 'member', status: 'inactive' },
  { id: 7, name: '周九', room: 'A-103', avatar: 'https://picsum.photos/40/40?random=7', role: 'admin', status: 'active' }
])

// 草稿保存相关
let draftSaveTimer: NodeJS.Timeout | null = null

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  amount: 0,
  category: '',
  date: '',
  applicant: '',
  phone: '',
  department: '',
  position: '',
  isUrgent: false,
  expectedReviewDate: '',
  remark: '',
  splitMethod: '',
  participantCount: 0
})

// 计算属性
const filteredMembers = computed(() => {
  // 首先按房间筛选（只显示同一房间的成员）
  const sameRoomMembers = allMembers.value.filter(member => member.room === currentUserRoom.value)
  
  if (!memberSearchQuery.value) return sameRoomMembers
  
  const query = memberSearchQuery.value.toLowerCase()
  return sameRoomMembers.filter(member => 
    member.name.toLowerCase().includes(query) ||
    member.room.toLowerCase().includes(query)
  )
})

// 计算属性：获取当前房间信息
const currentRoomInfo = computed(() => {
  return {
    roomNumber: currentUserRoom.value,
    memberCount: allMembers.value.filter(m => m.room === currentUserRoom.value).length,
    availableMembers: filteredMembers.value
  }
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入费用标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择费用类别', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入费用金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于 0', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择费用日期', trigger: 'change' }
  ],
  applicant: [
    { required: true, message: '请输入申请人姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 货币格式化函数
const formatCurrency = (amount: number): string => {
  return (amount || 0).toFixed(2)
}

// 智能金额输入相关方法
const handleAmountInput = (value: string) => {
  // 移除非数字字符（除了小数点）
  const cleanValue = value.replace(/[^\d.]/g, '')
  
  // 确保只有一个小数点
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    amountDisplay.value = parts[0] + '.' + parts.slice(1).join('')
  } else {
    amountDisplay.value = cleanValue
  }
  
  // 更新实际金额值
  const numValue = parseFloat(amountDisplay.value)
  formData.amount = isNaN(numValue) ? 0 : numValue
  
  // 启动草稿保存
  debounceSaveDraft()
}

const handleAmountBlur = () => {
  // 失焦时格式化金额显示
  if (amountDisplay.value) {
    const numValue = parseFloat(amountDisplay.value)
    if (!isNaN(numValue)) {
      amountDisplay.value = (numValue || 0).toFixed(2)
      formData.amount = numValue
    }
  }
}

const applyAmountSuggestion = (suggestion: number) => {
  formData.amount = suggestion
  amountDisplay.value = (suggestion || 0).toFixed(2)
  debounceSaveDraft()
}

// 分摊方式相关方法
const handleSplitMethodChange = () => {
  // 更新参与人数为已选成员数
  if (selectedMembers.value.length > 0) {
    formData.participantCount = selectedMembers.value.length
  }
  
  // 重新计算分摊
  calculateSplitDetails()
  
  // 启动草稿保存
  debounceSaveDraft()
}

const handleParticipantCountChange = () => {
  calculateSplitDetails()
  debounceSaveDraft()
}

const calculatePerPersonAmount = (): number => {
  if (!formData.amount || !formData.participantCount) return 0
  
  return formData.amount / formData.participantCount
}

const calculateSplitDetails = () => {
  if (!formData.amount || !formData.participantCount || !formData.splitMethod) {
    splitDetails.value = []
    return
  }
  
  const perPerson = formData.amount / formData.participantCount
  const members = selectedMembers.value.length > 0 ? selectedMembers.value : []
  
  switch (formData.splitMethod) {
    case 'average':
      splitDetails.value = members.map(member => ({
        name: member.name,
        amount: perPerson
      }))
      break
    case 'weight':
      // 假设寝室长权重为1.5，其他为1
      splitDetails.value = members.map(member => ({
        name: member.name,
        amount: member.role === 'dorm_leader' ? perPerson * 1.5 : perPerson
      }))
      break
    case 'person_ratio':
      // 按成员数量比例分摊
      splitDetails.value = members.map(member => ({
        name: member.name,
        amount: perPerson
      }))
      break
    default:
      splitDetails.value = members.map(member => ({
        name: member.name,
        amount: perPerson
      }))
  }
}

// 成员选择相关方法
const isMemberSelected = (member: Member): boolean => {
  return selectedMembers.value.some(m => m.id === member.id)
}

const toggleMember = (member: Member) => {
  if (isMemberSelected(member)) {
    removeMember(member)
  } else {
    selectedMembers.value.push(member)
    formData.participantCount = selectedMembers.value.length
    calculateSplitDetails()
    debounceSaveDraft()
  }
}

const removeMember = (member: Member) => {
  const index = selectedMembers.value.findIndex(m => m.id === member.id)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
    formData.participantCount = selectedMembers.value.length
    calculateSplitDetails()
    debounceSaveDraft()
  }
}

const confirmMemberSelection = () => {
  showMemberDialog.value = false
  calculateSplitDetails()
  debounceSaveDraft()
}

// 全选和反选相关方法
const selectAllMembers = () => {
  // 清空已选成员
  selectedMembers.value = []
  
  // 添加所有筛选后的成员
  selectedMembers.value = [...filteredMembers.value]
  
  // 更新参与人数
  formData.participantCount = selectedMembers.value.length
  
  // 重新计算分摊
  calculateSplitDetails()
  
  // 启动草稿保存
  debounceSaveDraft()
  
  // 提示信息
  ElMessage.success(`已全选 ${selectedMembers.value.length} 人`)
}

const invertSelection = () => {
  // 获取当前未选中的成员
  const unselectedMembers = filteredMembers.value.filter(member => !isMemberSelected(member))
  
  // 清空已选成员
  selectedMembers.value = []
  
  // 添加之前未选中的成员（现在是选中状态）
  selectedMembers.value = [...unselectedMembers]
  
  // 更新参与人数
  formData.participantCount = selectedMembers.value.length
  
  // 重新计算分摊
  calculateSplitDetails()
  
  // 启动草稿保存
  debounceSaveDraft()
  
  // 提示信息
  if (selectedMembers.value.length > 0) {
    ElMessage.success(`已反选，当前选中 ${selectedMembers.value.length} 人`)
  } else {
    ElMessage.info('已取消所有选择')
  }
}

// 草稿自动保存相关方法
const debounceSaveDraft = () => {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer)
  }
  draftSaveTimer = setTimeout(() => {
    saveDraft()
  }, 2000) // 2秒后自动保存
}

const saveDraft = () => {
  try {
    const draftData = {
      ...formData,
      selectedMembers: selectedMembers.value,
      amountDisplay: amountDisplay.value,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('expense_draft', JSON.stringify(draftData))
    console.log('草稿已自动保存', draftData)
  } catch (error) {
    console.error('草稿保存失败:', error)
  }
}



// 通用方法
const disabledDate = (date: Date) => {
  // 不能选择未来的日期
  const today = new Date()
  return date.getTime() > today.getTime()
}

const handleFileChange = (file: UploadUserFile) => {
  // 文件变化处理
  console.log('File changed:', file)
}

const handleFileRemove = (file: UploadUserFile) => {
  // 文件移除处理
  console.log('File removed:', file)
}

const handleFileExceed = () => {
  // 文件超出限制处理
  ElMessage.warning('最多只能上传 5 个文件')
}



const handleSaveDraft = async () => {
  try {
    // 保存草稿逻辑
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('草稿保存失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 提交费用逻辑
    setTimeout(() => {
      ElMessage.success('费用提交成功，等待审核')
      router.back()
      submitting.value = false
    }, 2000)
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入内容')
    submitting.value = false
  }
}
</script>

<style scoped>
/* 页面容器 */
.expense-create {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 180px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  color: #409eff;
  font-size: 32px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  border-color: #dcdfe6;
  color: #606266;
}

.cancel-btn:hover {
  border-color: #c0c4cc;
  color: #409eff;
}

.draft-btn {
  background: linear-gradient(135deg, #909399 0%, #82868b 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(144, 147, 153, 0.3);
}

.draft-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4);
}

.submit-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

/* 表单区域 */
.form-section {
  margin-bottom: 24px;
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.expense-form {
  padding: 20px 0;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 32px 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.form-section-title:first-of-type {
  margin-top: 0;
}

.form-section-title .el-icon {
  color: #409eff;
}

.currency-unit {
  margin-left: 8px;
  color: #606266;
  font-size: 14px;
}

/* 上传区域 */
.upload-area {
  width: 100%;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-button:hover {
  border-color: #409eff;
  background-color: #f0f8ff;
}

.upload-icon {
  font-size: 32px;
  color: #d9d9d9;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .expense-create {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
  }
}

/* 表单样式调整 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #c0c4cc;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  border: none;
}

/* 智能金额输入样式 */
.smart-amount-input {
  position: relative;
  width: 100%;
}

.amount-input {
  width: 100%;
}

.amount-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.suggestion-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 成员选择样式 */
.member-selection {
  width: 100%;
}

.select-members-btn {
  margin-bottom: 12px;
}

.selected-members {
  margin-top: 12px;
}

.member-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-avatar-small {
  margin-right: 4px;
}

/* 成员选择对话框样式 */
.member-dialog {
  border-radius: 12px;
}

.member-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.member-search-input {
  margin-bottom: 16px;
}

.selection-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.selection-actions .el-button {
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.selection-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.member-list {
  max-height: 400px;
  overflow-y: auto;
}

/* 房间信息提示样式 */
.room-info-notice {
  margin-bottom: 16px;
}

.room-alert {
  border-radius: 8px;
}

.member-stats {
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.stats-text {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.member-card {
  padding: 20px;
  border: 2px solid #ebeef5;
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.member-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: #e1f3d8;
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.member-card:hover {
  border-color: #409eff;
  background-color: #f5f8ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.member-card:hover::before {
  transform: scaleY(1);
}

.member-card.selected {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e8 100%);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
}

.member-card.selected::before {
  background: #67c23a;
  transform: scaleY(1);
}

.member-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.member-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-details {
  flex: 1;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.member-status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.member-status-indicator.online {
  background-color: #67c23a;
}

.member-status-indicator.offline {
  background-color: #909399;
}

.member-room {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.member-role-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.member-selection-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.selected-check {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-weight: 600;
}

.check-icon {
  font-size: 24px;
}

.selected-text {
  font-size: 12px;
}

.select-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.select-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 分摊计算器样式 */
.split-result {
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 8px;
  border: 1px solid #e1f3d8;
}

.per-person-amount {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  text-align: center;
}

.amount-highlight {
  color: #67c23a;
  font-size: 20px;
  font-weight: 700;
}

.split-details {
  margin: 16px 0;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e1f3d8;
}

.split-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.split-item:last-child {
  border-bottom: none;
}

.split-amount {
  font-weight: 600;
  color: #67c23a;
}

.toggle-details-btn {
  color: #409eff;
}

.toggle-details-btn:hover {
  color: #66b1ff;
}
</style>