<template>
  <div class="dorm-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">宿舍详情</h1>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="handleBack"
          class="back-btn"
        >
          返回
        </el-button>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="h1" style="width: 30%" />
          <div style="margin-top: 20px">
            <el-skeleton-item variant="p" style="width: 50%" />
          </div>
          <div style="margin-top: 20px">
            <el-skeleton-item variant="rect" style="width: 100%; height: 200px" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result icon="error" title="加载失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="loadDormData">重新加载</el-button>
        </template>
      </el-result>
    </div>

    <!-- 内容区域 -->
    <div v-else class="content-wrapper">
      <el-row :gutter="20">
        <!-- 左侧：宿舍基本信息 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="card-title">基本信息</span>
                <div class="header-buttons">
                  <el-button v-if="userPermissions.canEdit" @click="editMode = !editMode" :type="editMode ? 'warning' : 'primary'">
                    <el-icon><Edit /></el-icon>
                    {{ editMode ? '取消编辑' : '编辑信息' }}
                  </el-button>
                  <el-button v-if="userPermissions.canShare" @click="showShareDialog = true" type="success">
                    <el-icon><Share /></el-icon>
                    分享
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 编辑模式 -->
            <div v-if="editMode" class="edit-form">
              <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="宿舍名称" prop="name">
                      <el-input v-model="editForm.name" placeholder="请输入宿舍名称"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="宿舍编号" prop="dormNumber">
                      <el-input v-model="editForm.dormNumber" readonly></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="建筑栋数" prop="building">
                      <el-input v-model="editForm.building" placeholder="例如：A栋"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="房间号" prop="roomNumber">
                      <el-input v-model="editForm.roomNumber" placeholder="例如：101"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="最大人数" prop="maxMembers">
                      <el-input-number v-model="editForm.maxMembers" :min="1" :max="12" style="width: 100%;"></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="宿舍类型" prop="genderType">
                      <el-select v-model="editForm.genderType" style="width: 100%;">
                        <el-option label="男生宿舍" value="male"></el-option>
                        <el-option label="女生宿舍" value="female"></el-option>
                        <el-option label="混合宿舍" value="mixed"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="详细地址" prop="address">
                  <el-input v-model="editForm.address" placeholder="请输入详细地址"></el-input>
                </el-form-item>

                <el-form-item label="宿舍描述" prop="description">
                  <el-input 
                    v-model="editForm.description" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入宿舍描述">
                  </el-input>
                </el-form-item>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="状态">
                      <el-select v-model="editForm.status" style="width: 100%;">
                        <el-option label="活跃" value="active"></el-option>
                        <el-option label="非活跃" value="inactive"></el-option>
                        <el-option label="维护中" value="maintenance"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="宿舍类型">
                      <el-select v-model="editForm.type" style="width: 100%;">
                        <el-option label="单人间" value="single"></el-option>
                        <el-option label="双人间" value="double"></el-option>
                        <el-option label="四人间" value="quad"></el-option>
                        <el-option label="公寓" value="apartment"></el-option>
                        <el-option label="标准间" value="standard"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="面积(平方米)">
                      <el-input-number v-model="editForm.area" :min="0" :step="0.1" style="width: 100%;" placeholder="请输入面积"></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="楼层">
                      <el-input-number v-model="editForm.floor" :min="0" style="width: 100%;" placeholder="请输入楼层"></el-input-number>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="月租金(元)">
                      <el-input-number v-model="editForm.monthlyRent" :min="0" :step="0.01" style="width: 100%;" placeholder="请输入月租金"></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="押金(元)">
                      <el-input-number v-model="editForm.deposit" :min="0" :step="0.01" style="width: 100%;" placeholder="请输入押金"></el-input-number>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="包含水电">
                  <el-switch v-model="editForm.utilityIncluded" active-text="是" inactive-text="否"></el-switch>
                </el-form-item>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="联系人">
                      <el-input v-model="editForm.contactPerson" placeholder="请输入联系人"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="联系电话">
                      <el-input v-model="editForm.contactPhone" placeholder="请输入联系电话"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="联系邮箱">
                  <el-input v-model="editForm.contactEmail" placeholder="请输入联系邮箱"></el-input>
                </el-form-item>

                <el-form-item label="设施列表">
                  <el-select 
                    v-model="editForm.facilities" 
                    multiple 
                    filterable 
                    allow-create 
                    default-first-option
                    style="width: 100%;"
                    placeholder="请选择或输入设施，可多选">
                    <el-option label="空调" value="空调"></el-option>
                    <el-option label="热水器" value="热水器"></el-option>
                    <el-option label="洗衣机" value="洗衣机"></el-option>
                    <el-option label="冰箱" value="冰箱"></el-option>
                    <el-option label="电视" value="电视"></el-option>
                    <el-option label="微波炉" value="微波炉"></el-option>
                    <el-option label="电风扇" value="电风扇"></el-option>
                    <el-option label="暖气" value="暖气"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="便利设施">
                  <el-select 
                    v-model="editForm.amenities" 
                    multiple 
                    filterable 
                    allow-create 
                    default-first-option
                    style="width: 100%;"
                    placeholder="请选择或输入便利设施，可多选">
                    <el-option label="WiFi" value="WiFi"></el-option>
                    <el-option label="健身房" value="健身房"></el-option>
                    <el-option label="游泳池" value="游泳池"></el-option>
                    <el-option label="停车场" value="停车场"></el-option>
                    <el-option label="洗衣房" value="洗衣房"></el-option>
                    <el-option label="厨房" value="厨房"></el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="管理员ID">
                  <el-input-number v-model="editForm.adminId" :min="1" style="width: 100%;" placeholder="请输入管理员ID"></el-input-number>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveEdit" :loading="saving">保存更改</el-button>
                  <el-button @click="cancelEdit">取消</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 显示模式 -->
            <div v-else class="info-display">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="宿舍ID">{{ dormData.id }}</el-descriptions-item>
                <el-descriptions-item label="宿舍名称">{{ dormData.dormName }}</el-descriptions-item>
                <el-descriptions-item label="宿舍编码">{{ dormData.dormCode }}</el-descriptions-item>
                <el-descriptions-item label="地址">{{ dormData.address }}</el-descriptions-item>
                <el-descriptions-item label="容量">{{ dormData.capacity }}人</el-descriptions-item>
                <el-descriptions-item label="当前入住人数">{{ dormData.currentOccupancy }}人</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(dormData.status)">
                    {{ getStatusText(dormData.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="类型">{{ getTypeText(dormData.type) }}</el-descriptions-item>
                <el-descriptions-item label="面积" v-if="dormData.area">{{ dormData.area }}平方米</el-descriptions-item>
                <el-descriptions-item label="性别限制" v-if="dormData.genderLimit">{{ getGenderLimitText(dormData.genderLimit) }}</el-descriptions-item>
                <el-descriptions-item label="月租金" v-if="dormData.monthlyRent !== '0.00'">￥{{ dormData.monthlyRent }}</el-descriptions-item>
                <el-descriptions-item label="押金" v-if="dormData.deposit !== '0.00'">￥{{ dormData.deposit }}</el-descriptions-item>
                <el-descriptions-item label="包含水电">
                  <el-tag :type="dormData.utilityIncluded ? 'success' : 'info'">
                    {{ dormData.utilityIncluded ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="建筑物" v-if="dormData.building">{{ dormData.building }}</el-descriptions-item>
                <el-descriptions-item label="楼层" v-if="dormData.floor">{{ dormData.floor }}</el-descriptions-item>
                <el-descriptions-item label="房间号" v-if="dormData.roomNumber">{{ dormData.roomNumber }}</el-descriptions-item>
                <el-descriptions-item label="入住率">{{ dormData.occupancyRate }}%</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDate(dormData.createdAt) }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ formatDate(dormData.updatedAt) }}</el-descriptions-item>
                <el-descriptions-item label="联系人" v-if="dormData.contactPerson">{{ dormData.contactPerson }}</el-descriptions-item>
                <el-descriptions-item label="联系电话" v-if="dormData.contactPhone">{{ dormData.contactPhone }}</el-descriptions-item>
                <el-descriptions-item label="联系邮箱" v-if="dormData.contactEmail">{{ dormData.contactEmail }}</el-descriptions-item>
                <el-descriptions-item label="描述" :span="2" v-if="dormData.description">
                  {{ dormData.description }}
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="2" v-else>
                  <span class="no-description">暂无描述</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>

          <!-- 设施信息 -->
          <el-card class="facilities-card" shadow="hover" v-if="dormData.facilities && dormData.facilities.length > 0">
            <template #header>
              <div class="card-header">
                <span class="card-title">设施列表</span>
              </div>
            </template>
            
            <div class="facilities-list">
              <el-tag 
                v-for="facility in dormData.facilities" 
                :key="facility" 
                class="facility-tag"
              >
                {{ facility }}
              </el-tag>
            </div>
          </el-card>

          <!-- 便利设施 -->
          <el-card class="amenities-card" shadow="hover" v-if="dormData.amenities && dormData.amenities.length > 0">
            <template #header>
              <div class="card-header">
                <span class="card-title">便利设施</span>
              </div>
            </template>
            
            <div class="amenities-list">
              <el-tag 
                v-for="amenity in dormData.amenities" 
                :key="amenity" 
                class="amenity-tag"
              >
                {{ amenity }}
              </el-tag>
            </div>
          </el-card>

          <!-- 成员管理区域 -->
          <el-card class="members-card" shadow="hover" v-if="userPermissions.canManageMembers">
            <template #header>
              <div class="card-header">
                <span class="card-title">成员管理</span>
                <el-button @click="showAddMemberDialog = true" type="primary" size="small">
                  <el-icon><UserFilled /></el-icon>
                  添加成员
                </el-button>
              </div>
            </template>

            <div class="members-section">
              <!-- 成员统计 -->
              <div class="member-stats">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-number">{{ dormData.currentOccupancy }}</div>
                      <div class="stat-label">当前成员</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-number">{{ dormData.capacity }}</div>
                      <div class="stat-label">最大容量</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="stat-item">
                      <div class="stat-number">{{ getCapacityPercentage() }}%</div>
                      <div class="stat-label">使用率</div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 容量进度条 -->
              <div class="capacity-bar">
                <el-progress 
                  :percentage="getCapacityPercentage()" 
                  :status="getCapacityStatus()"
                  :stroke-width="10"
                  :text-inside="true">
                </el-progress>
              </div>

              <!-- 成员列表 -->
              <div class="members-list">
                <el-table :data="membersData" v-loading="loadingMembers" style="width: 100%">
                  <el-table-column prop="name" label="姓名" width="120">
                    <template #default="{ row }">
                      <div class="member-info">
                        <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
                        <span>{{ row.name }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="role" label="角色" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleText(row.role) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="joinDate" label="加入时间">
                    <template #default="{ row }">{{ formatDate(row.joinDate) }}</template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                        {{ row.status === 'active' ? '活跃' : '非活跃' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="120" v-if="userPermissions.canManageMembers">
                    <template #default="{ row }">
                      <el-button type="danger" size="small" @click="removeMember(row.id)">移除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计概览 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <!-- 入住率统计 -->
          <el-card class="stats-card" shadow="hover">
            <template #header>
              <span class="card-title">入住统计</span>
            </template>

            <div class="occupancy-stats">
              <div class="stat-item">
                <div class="stat-number">{{ dormData.currentOccupancy }}</div>
                <div class="stat-label">当前入住</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ dormData.capacity }}</div>
                <div class="stat-label">总容量</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ dormData.occupancyRate }}%</div>
                <div class="stat-label">入住率</div>
              </div>
              
              <div class="occupancy-bar">
                <el-progress 
                  :percentage="dormData.occupancyRate" 
                  :status="getOccupancyStatus(dormData.occupancyRate)"
                  :stroke-width="10"
                  :text-inside="true">
                </el-progress>
              </div>
            </div>
          </el-card>

          <!-- 管理员信息 -->
          <el-card class="admin-card" shadow="hover" v-if="dormData.adminInfo">
            <template #header>
              <span class="card-title">管理员信息</span>
            </template>

            <div class="admin-info">
              <div class="admin-avatar">
                <el-avatar :size="60">{{ dormData.adminInfo.nickname?.charAt(0) || dormData.adminInfo.username?.charAt(0) || '管' }}</el-avatar>
              </div>
              <div class="admin-details">
                <div class="admin-name">{{ dormData.adminInfo.nickname || dormData.adminInfo.username }}</div>
                <div class="admin-username">@{{ dormData.adminInfo.username }}</div>
              </div>
            </div>
          </el-card>

          <!-- 成员列表 -->
          <el-card class="members-card" shadow="hover" v-if="dormData.currentUsers && dormData.currentUsers.length > 0">
            <template #header>
              <span class="card-title">当前成员 ({{ dormData.currentUsers.length }})</span>
            </template>

            <div class="members-list">
              <div 
                class="member-item" 
                v-for="member in dormData.currentUsers" 
                :key="member.id"
              >
                <div class="member-avatar">
                  <el-avatar :size="32">{{ member.name?.charAt(0) || '成' }}</el-avatar>
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-status">
                    <el-tag :type="member.status === 'active' ? 'success' : 'info'" size="small">
                      {{ member.status === 'active' ? '活跃' : '非活跃' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 最近的动态 -->
          <el-card class="activity-card" shadow="hover">
            <template #header>
              <span class="card-title">最近动态</span>
            </template>

            <div class="activity-list">
              <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
                <div class="activity-avatar">
                  <el-avatar :size="32">{{ activity.user.charAt(0) }}</el-avatar>
                </div>
                <div class="activity-content">
                  <div class="activity-text">{{ activity.description }}</div>
                  <div class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</div>
                </div>
              </div>
              
              <div v-if="recentActivities.length === 0" class="no-activity">
                暂无动态
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分享对话框 -->
    <el-dialog v-model="showShareDialog" title="分享宿舍" width="400px">
      <div class="share-content">
        <div class="qr-code" v-if="dormData.dormCode">
          <div class="qr-placeholder">
            <el-icon size="60"><Grid /></el-icon>
            <p>宿舍二维码</p>
            <p class="dorm-number">{{ dormData.dormCode }}</p>
          </div>
        </div>
        
        <div class="share-info">
          <h4>宿舍信息</h4>
          <p><strong>名称：</strong>{{ dormData.dormName }}</p>
          <p><strong>位置：</strong>{{ dormData.building }} - {{ dormData.roomNumber }}</p>
          <p><strong>人数：</strong>{{ dormData.currentOccupancy }}/{{ dormData.capacity }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="copyShareInfo">复制信息</el-button>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加成员" width="500px">
      <el-form :model="addMemberForm" label-width="80px">
        <el-form-item label="成员姓名">
          <el-input v-model="addMemberForm.name" placeholder="请输入成员姓名"></el-input>
        </el-form-item>
        <el-form-item label="成员角色">
          <el-select v-model="addMemberForm.role" style="width: 100%;">
            <el-option label="普通成员" value="member"></el-option>
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="财务" value="treasurer"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" @click="addMember">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Refresh, Edit, Share, UserFilled, Grid
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { dormService } from '@/services/dormService'

// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const error = ref('')
const editMode = ref(false)
const loadingMembers = ref(false)
const saving = ref(false)
const showShareDialog = ref(false)
const showAddMemberDialog = ref(false)
const editFormRef = ref<FormInstance>()

// 用户权限
const userPermissions = reactive({
  canEdit: true,
  canShare: true,
  canManageMembers: true,
  canManageExpenses: true,
  canManageBills: true,
  canManageSettings: true,
  canViewStatistics: true
})

// 宿舍数据
const dormData = ref({
  id: 0,
  dormName: '',
  dormCode: '',
  address: '',
  capacity: 0,
  currentOccupancy: 0,
  description: null,
  status: 'active' as 'active' | 'inactive' | 'maintenance',
  type: 'standard' as 'single' | 'double' | 'quad' | 'apartment' | 'standard',
  area: null as number | null,
  genderLimit: null as 'male' | 'female' | 'mixed' | null,
  monthlyRent: '0.00',
  deposit: '0.00',
  utilityIncluded: false,
  contactPerson: null as string | null,
  contactPhone: null as string | null,
  contactEmail: null as string | null,
  building: null as string | null,
  floor: null as number | null,
  roomNumber: null as string | null,
  facilities: [] as string[],
  amenities: [] as string[],
  adminId: null as number | null,
  createdAt: '',
  updatedAt: '',
  adminInfo: null as any,
  currentUsers: [] as any[],
  occupancyRate: 0
})

// 编辑表单数据
const editForm = reactive({
  name: '',
  dormNumber: '',
  building: '',
  roomNumber: '',
  maxMembers: 6,
  genderType: 'male',
  address: '',
  description: '',
  status: 'active',
  type: 'standard',
  area: null as number | null,
  monthlyRent: null as number | null,
  deposit: null as number | null,
  utilityIncluded: false,
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  floor: null as number | null,
  facilities: [] as string[],
  amenities: [] as string[],
  adminId: null as number | null
})

// 编辑表单验证规则
const editRules: FormRules = {
  name: [
    { required: true, message: '请输入宿舍名称', trigger: 'blur' }
  ],
  building: [
    { required: true, message: '请输入建筑栋数', trigger: 'blur' }
  ],
  roomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  maxMembers: [
    { required: true, message: '请选择最大人数', trigger: 'change' }
  ],
  genderType: [
    { required: true, message: '请选择宿舍类型', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 成员数据
const membersData = ref([
  { id: 1, name: '张三', role: 'admin', joinDate: '2024-01-15', status: 'active' },
  { id: 2, name: '李四', role: 'treasurer', joinDate: '2024-01-20', status: 'active' },
  { id: 3, name: '王五', role: 'member', joinDate: '2024-02-01', status: 'active' },
  { id: 4, name: '赵六', role: 'member', joinDate: '2024-02-10', status: 'active' }
])

// 添加成员表单
const addMemberForm = reactive({
  name: '',
  role: 'member'
})

// 最近动态数据
const recentActivities = ref([
  {
    id: 1,
    user: '张三',
    description: '添加了新费用：水费50元',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
  },
  {
    id: 2,
    user: '李四',
    description: '更新了宿舍信息',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5小时前
  },
  {
    id: 3,
    user: '王五',
    description: '加入宿舍',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1天前
  }
])

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    maintenance: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '非活跃',
    maintenance: '维护中'
  }
  return statusMap[status] || '未知'
}

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    single: '单人间',
    double: '双人间',
    quad: '四人间',
    apartment: '公寓',
    standard: '标准间'
  }
  return typeMap[type] || '标准间'
}

// 获取性别限制文本
const getGenderLimitText = (gender: string) => {
  const genderMap: Record<string, string> = {
    male: '男生',
    female: '女生',
    mixed: '混合'
  }
  return genderMap[gender] || '混合'
}

// 获取入住率状态
const getOccupancyStatus = (rate: number) => {
  if (rate >= 90) return 'exception'
  if (rate >= 70) return 'warning'
  return 'success'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '无'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化相对时间
const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// 计算容量百分比
const getCapacityPercentage = () => {
  return Math.round((dormData.value.currentOccupancy / dormData.value.capacity) * 100)
}

// 获取容量状态
const getCapacityStatus = () => {
  const percentage = getCapacityPercentage()
  if (percentage >= 90) return 'exception'
  if (percentage >= 70) return 'warning'
  return 'success'
}

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  const types = {
    admin: 'danger',
    treasurer: 'warning',
    member: 'info'
  }
  return types[role as keyof typeof types] || 'info'
}

// 获取角色文本
const getRoleText = (role: string) => {
  const texts = {
    admin: '管理员',
    treasurer: '财务',
    member: '成员'
  }
  return texts[role as keyof typeof texts] || '未知'
}

// 加载宿舍数据
const loadDormData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // 从路由参数获取宿舍ID
    const dormId = route.params.id as string
    
    if (!dormId) {
      throw new Error('宿舍ID不能为空')
    }
    
    // 调用服务获取宿舍详情
    const response = await dormService.getDormDetail(Number(dormId))
    
    if (response.success) {
      dormData.value = response.data
      // 初始化编辑表单
      editFormInit()
    } else {
      throw new Error(response.message || '获取宿舍详情失败')
    }
  } catch (err: any) {
    console.error('获取宿舍详情失败:', err)
    error.value = err.message || '获取宿舍详情失败，请稍后重试'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  await loadDormData()
  ElMessage.success('数据已刷新')
}

// 返回上一页
const handleBack = () => {
  router.back()
}

// 编辑表单初始化
const editFormInit = () => {
  Object.assign(editForm, {
    name: dormData.value.dormName,
    dormNumber: dormData.value.dormCode,
    building: dormData.value.building || '',
    roomNumber: dormData.value.roomNumber || '',
    maxMembers: dormData.value.capacity,
    genderType: dormData.value.genderLimit || 'mixed',
    address: dormData.value.address,
    description: dormData.value.description || '',
    status: dormData.value.status || 'active',
    type: dormData.value.type || 'standard',
    area: dormData.value.area,
    monthlyRent: dormData.value.monthlyRent ? parseFloat(dormData.value.monthlyRent as any) : null,
    deposit: dormData.value.deposit ? parseFloat(dormData.value.deposit as any) : null,
    utilityIncluded: dormData.value.utilityIncluded || false,
    contactPerson: dormData.value.contactPerson || '',
    contactPhone: dormData.value.contactPhone || '',
    contactEmail: dormData.value.contactEmail || '',
    floor: dormData.value.floor,
    facilities: dormData.value.facilities || [],
    amenities: dormData.value.amenities || [],
    adminId: dormData.value.adminId
  })
}

// 保存编辑
const saveEdit = async () => {
  if (!editFormRef.value) return
  
  saving.value = true
  try {
    await editFormRef.value.validate()
    
    // 准备更新数据
    const updateData = {
      dormName: editForm.name || undefined,
      dormCode: editForm.dormNumber || undefined,
      address: editForm.address || undefined,
      capacity: editForm.maxMembers || undefined,
      description: editForm.description || undefined,
      status: editForm.status || undefined,
      type: editForm.type || undefined,
      area: editForm.area || undefined,
      genderLimit: editForm.genderType || undefined,
      monthlyRent: editForm.monthlyRent || undefined,
      deposit: editForm.deposit || undefined,
      utilityIncluded: editForm.utilityIncluded,
      contactPerson: editForm.contactPerson || undefined,
      contactPhone: editForm.contactPhone || undefined,
      contactEmail: editForm.contactEmail || undefined,
      building: editForm.building || undefined,
      floor: editForm.floor || undefined,
      roomNumber: editForm.roomNumber || undefined,
      facilities: editForm.facilities.length > 0 ? editForm.facilities : undefined,
      amenities: editForm.amenities.length > 0 ? editForm.amenities : undefined,
      adminId: editForm.adminId || undefined
    }
    
    // 过滤掉undefined值
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )
    
    // 调用真实API更新宿舍信息
    const response = await dormService.updateDormInfo(dormData.value.id, filteredData)
    
    if (response.success) {
      // 更新成功，重新加载数据
      await loadDormData()
      editMode.value = false
      ElMessage.success('宿舍信息更新成功')
    } else {
      throw new Error(response.message || '更新失败')
    }
    
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败，请检查表单信息')
  } finally {
    saving.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
  editFormInit()
}

// 添加成员
const addMember = () => {
  if (!addMemberForm.name.trim()) {
    ElMessage.warning('请输入成员姓名')
    return
  }
  
  const newMember = {
    id: Date.now(),
    name: addMemberForm.name.trim(),
    role: addMemberForm.role,
    joinDate: new Date().toISOString(),
    status: 'active'
  }
  
  membersData.value.push(newMember)
  dormData.value.currentOccupancy++
  
  addMemberForm.name = ''
  addMemberForm.role = 'member'
  showAddMemberDialog.value = false
  
  ElMessage.success('成员添加成功')
}

// 移除成员
const removeMember = async (memberId: number) => {
  try {
    await ElMessageBox.confirm('确定要移除这个成员吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = membersData.value.findIndex(m => m.id === memberId)
    if (index > -1) {
      membersData.value.splice(index, 1)
      dormData.value.currentOccupancy--
      ElMessage.success('成员移除成功')
    }
  } catch {
    // 用户取消
  }
}

// 复制分享信息
const copyShareInfo = () => {
  const shareText = `宿舍信息：
名称：${dormData.value.dormName}
编号：${dormData.value.dormCode}
位置：${dormData.value.building} - ${dormData.value.roomNumber}
人数：${dormData.value.currentOccupancy}/${dormData.value.capacity}
地址：${dormData.value.address}`
  
  navigator.clipboard.writeText(shareText).then(() => {
    ElMessage.success('分享信息已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadDormData()
})

// 监听编辑模式变化
watch(editMode, (newValue) => {
  if (newValue) {
    editFormInit()
  }
})
</script>

<style scoped>
.dorm-detail {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.back-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

.loading-container,
.error-container {
  padding: 40px 20px;
  text-align: center;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.info-card,
.facilities-card,
.amenities-card,
.members-card,
.stats-card,
.admin-card,
.activity-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.edit-form {
  padding: 10px 0;
}

.info-display {
  padding: 10px 0;
}

.no-description {
  color: #909399;
  font-style: italic;
}

.facilities-list,
.amenities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 0;
}

.facility-tag,
.amenity-tag {
  margin: 0;
}

.members-section {
  padding: 10px 0;
}

.member-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 15px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.capacity-bar {
  margin: 20px 0;
}

.members-list {
  margin-top: 20px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.occupancy-stats {
  padding: 10px 0;
}

.occupancy-bar {
  margin: 20px 0;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
}

.admin-avatar {
  flex-shrink: 0;
}

.admin-details {
  flex: 1;
}

.admin-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.admin-username {
  color: #909399;
  font-size: 14px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.member-status {
  margin-top: 4px;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #303133;
  margin-bottom: 4px;
}

.activity-time {
  color: #909399;
  font-size: 12px;
}

.no-activity {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.share-content {
  text-align: center;
}

.qr-code {
  margin-bottom: 20px;
}

.qr-placeholder {
  padding: 40px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px dashed #c0c4cc;
}

.qr-placeholder p {
  margin: 10px 0;
  color: #606266;
}

.dorm-number {
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.share-info {
  text-align: left;
}

.share-info h4 {
  margin-bottom: 10px;
  color: #303133;
}

.share-info p {
  margin-bottom: 5px;
  color: #606266;
}

@media (max-width: 768px) {
  .dorm-detail {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .header-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>