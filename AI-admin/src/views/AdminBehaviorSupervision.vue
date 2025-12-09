<template>
  <div class="admin-behavior-supervision-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员行为监督</span>
          <div class="header-actions">
            <el-button type="success" @click="handleExport" :loading="exportLoading">
              <el-icon><Download /></el-icon>导出记录
            </el-button>
            <el-button type="primary" @click="handleRefresh" :loading="refreshLoading">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 行为统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">管理员总数</div>
                <div class="stat-value">{{ stats.totalAdmins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">异常行为数</div>
                <div class="stat-value">{{ stats.abnormalBehaviors }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">合规率</div>
                <div class="stat-value">{{ stats.complianceRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><DataLine /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">本周异常</div>
                <div class="stat-value">{{ stats.weeklyAbnormal }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 功能选项卡 -->
      <el-tabs v-model="activeTab" type="card" style="margin-bottom: 20px;">
        <el-tab-pane label="实时监控" name="realtime">
          <div class="realtime-monitor">
            <div class="monitor-header">
              <el-tag type="danger" effect="dark" v-if="newAlerts > 0">
                <el-icon><Bell /></el-icon> 新告警: {{ newAlerts }}
              </el-tag>
              <el-switch
                v-model="autoRefresh"
                active-text="自动刷新"
                inactive-text="手动刷新"
                @change="handleAutoRefreshChange"
              />
            </div>
            <el-table :data="realtimeBehaviors" style="width: 100%" v-loading="realtimeLoading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="adminName" label="管理员" width="120" />
              <el-table-column prop="behaviorType" label="行为类型" width="120">
                <template #default="scope">
                  {{ getBehaviorTypeText(scope.row.behaviorType) }}
                </template>
              </el-table-column>
              <el-table-column prop="description" label="行为描述" />
              <el-table-column prop="ipAddress" label="IP地址" width="130" />
              <el-table-column prop="riskLevel" label="风险等级" width="100">
                <template #default="scope">
                  <el-tag :type="getRiskLevelTagType(scope.row.riskLevel)">
                    {{ getRiskLevelText(scope.row.riskLevel) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="behaviorTime" label="行为时间" width="160" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="handleBlockAdmin(scope.row)"
                    :disabled="scope.row.blocked"
                  >
                    {{ scope.row.blocked ? '已封禁' : '封禁' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="操作日志" name="logs">
          <!-- 搜索和筛选 -->
          <div class="search-bar">
            <el-form :model="searchForm" label-width="80px" inline>
              <el-form-item label="管理员">
                <el-select v-model="searchForm.adminId" placeholder="请选择管理员" clearable filterable>
                  <el-option 
                    v-for="admin in adminList" 
                    :key="admin.id" 
                    :label="admin.name" 
                    :value="admin.id" 
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="行为类型">
                <el-select v-model="searchForm.behaviorType" placeholder="请选择行为类型" clearable>
                  <el-option label="登录" value="login" />
                  <el-option label="登出" value="logout" />
                  <el-option label="新增数据" value="create" />
                  <el-option label="修改数据" value="update" />
                  <el-option label="删除数据" value="delete" />
                  <el-option label="权限变更" value="permission" />
                  <el-option label="系统配置" value="config" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="风险等级">
                <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
                  <el-option label="低风险" value="low" />
                  <el-option label="中风险" value="medium" />
                  <el-option label="高风险" value="high" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 行为列表 -->
          <el-table :data="behaviorList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="adminName" label="管理员" width="120" />
            <el-table-column prop="behaviorType" label="行为类型" width="120">
              <template #default="scope">
                {{ getBehaviorTypeText(scope.row.behaviorType) }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="行为描述" />
            <el-table-column prop="ipAddress" label="IP地址" width="130" />
            <el-table-column prop="riskLevel" label="风险等级" width="100">
              <template #default="scope">
                <el-tag :type="getRiskLevelTagType(scope.row.riskLevel)">
                  {{ getRiskLevelText(scope.row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="behaviorTime" label="行为时间" width="160" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleBlockAdmin(scope.row)"
                  :disabled="scope.row.blocked"
                >
                  {{ scope.row.blocked ? '已封禁' : '封禁' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="行为轨迹" name="track">
          <div class="track-analysis">
            <el-form :inline="true" class="track-form">
              <el-form-item label="选择管理员">
                <el-select v-model="trackAdminId" placeholder="请选择管理员" filterable @change="handleTrackAdminChange">
                  <el-option 
                    v-for="admin in adminList" 
                    :key="admin.id" 
                    :label="admin.name" 
                    :value="admin.id" 
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="trackDateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleAnalyzeTrack">分析轨迹</el-button>
              </el-form-item>
            </el-form>
            
            <div v-if="trackData.length > 0" class="track-timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="(activity, index) in trackData"
                  :key="index"
                  :timestamp="activity.behaviorTime"
                  :type="getTimelineType(activity.riskLevel)"
                >
                  <el-card>
                    <h4>{{ activity.adminName }} - {{ getBehaviorTypeText(activity.behaviorType) }}</h4>
                    <p>{{ activity.description }}</p>
                    <p class="track-detail">
                      <el-tag :type="getRiskLevelTagType(activity.riskLevel)" size="small">
                        {{ getRiskLevelText(activity.riskLevel) }}
                      </el-tag>
                      <span class="track-ip">IP: {{ activity.ipAddress }}</span>
                      <span class="track-duration">耗时: {{ activity.duration }}ms</span>
                    </p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
            <el-empty v-else description="请选择管理员并点击分析轨迹" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="异常告警" name="alerts">
          <div class="abnormal-alerts">
            <el-table :data="alertList" style="width: 100%" v-loading="alertsLoading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="adminName" label="管理员" width="120" />
              <el-table-column prop="alertType" label="告警类型" width="120">
                <template #default="scope">
                  <el-tag :type="getAlertTypeTagType(scope.row.alertType)">
                    {{ getAlertTypeText(scope.row.alertType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="告警描述" />
              <el-table-column prop="level" label="风险等级" width="100">
                <template #default="scope">
                  <el-tag :type="getRiskLevelTagType(scope.row.level)">
                    {{ getRiskLevelText(scope.row.level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'handled' ? 'success' : 'danger'">
                    {{ scope.row.status === 'handled' ? '已处理' : '待处理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="告警时间" width="160" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="handleViewAlert(scope.row)">查看详情</el-button>
                  <el-button 
                    size="small" 
                    type="success" 
                    @click="handleMarkAsHandled(scope.row)"
                    :disabled="scope.row.status === 'handled'"
                  >
                    {{ scope.row.status === 'handled' ? '已处理' : '标记处理' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="统计报告" name="reports">
          <div class="operation-reports">
            <el-form :inline="true" class="report-form">
              <el-form-item label="报告类型">
                <el-select v-model="reportType" placeholder="请选择报告类型">
                  <el-option label="日报" value="daily" />
                  <el-option label="周报" value="weekly" />
                  <el-option label="月报" value="monthly" />
                </el-select>
              </el-form-item>
              <el-form-item label="管理员">
                <el-select v-model="reportAdminId" placeholder="全部管理员" clearable filterable>
                  <el-option 
                    v-for="admin in adminList" 
                    :key="admin.id" 
                    :label="admin.name" 
                    :value="admin.id" 
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="reportDateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleGenerateReport">生成报告</el-button>
              </el-form-item>
            </el-form>
            
            <div v-if="reportData" class="report-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card>
                    <div ref="behaviorChartRef" style="height: 300px;"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card>
                    <div ref="riskChartRef" style="height: 300px;"></div>
                  </el-card>
                </el-col>
              </el-row>
              
              <el-card style="margin-top: 20px;">
                <h3>操作统计详情</h3>
                <el-table :data="reportData.operationStats" style="width: 100%">
                  <el-table-column prop="adminName" label="管理员" />
                  <el-table-column prop="totalOperations" label="总操作数" />
                  <el-table-column prop="normalOperations" label="正常操作" />
                  <el-table-column prop="abnormalOperations" label="异常操作" />
                  <el-table-column prop="complianceRate" label="合规率">
                    <template #default="scope">
                      {{ scope.row.complianceRate }}%
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </div>
            <el-empty v-else description="请选择条件并生成报告" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 行为详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="行为详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="行为ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="管理员">{{ detailData.adminName }}</el-descriptions-item>
        <el-descriptions-item label="行为类型">{{ getBehaviorTypeText(detailData.behaviorType) }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :type="getRiskLevelTagType(detailData.riskLevel)">
            {{ getRiskLevelText(detailData.riskLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="行为描述" :span="2">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="code-block">{{ detailData.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre class="code-block">{{ detailData.responseResult }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detailData.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ detailData.os }}</el-descriptions-item>
        <el-descriptions-item label="行为时间">{{ detailData.behaviorTime }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.duration }}ms</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="danger" 
            @click="handleBlockAdmin(detailData)" 
            :disabled="detailData.blocked"
          >
            {{ detailData.blocked ? '已封禁' : '封禁管理员' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 告警详情对话框 -->
    <el-dialog v-model="alertDialogVisible" title="告警详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="告警ID">{{ alertDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="管理员">{{ alertDetail.adminName }}</el-descriptions-item>
        <el-descriptions-item label="告警类型">
          <el-tag :type="getAlertTypeTagType(alertDetail.alertType)">
            {{ getAlertTypeText(alertDetail.alertType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :type="getRiskLevelTagType(alertDetail.level)">
            {{ getRiskLevelText(alertDetail.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警描述" :span="2">{{ alertDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="相关行为ID">{{ alertDetail.behaviorId }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="alertDetail.status === 'handled' ? 'success' : 'danger'">
            {{ alertDetail.status === 'handled' ? '已处理' : '待处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警时间" :span="2">{{ alertDetail.createTime }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="alertDialogVisible = false">关闭</el-button>
          <el-button 
            type="success" 
            @click="handleMarkAsHandled(alertDetail)"
            :disabled="alertDetail.status === 'handled'"
          >
            {{ alertDetail.status === 'handled' ? '已处理' : '标记处理' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Warning, Check, DataLine, Download, Refresh, Bell } from '@element-plus/icons-vue'
import { adminBehaviorApi } from '@/api/adminBehavior'
import * as echarts from 'echarts'

// 响应式数据
const stats = ref({
  totalAdmins: 0,
  abnormalBehaviors: 0,
  complianceRate: 0,
  weeklyAbnormal: 0
})

const behaviorList = ref([])
const realtimeBehaviors = ref([])
const alertList = ref([])
const adminList = ref([])
const trackData = ref([])
const reportData = ref(null)

const loading = ref(false)
const realtimeLoading = ref(false)
const alertsLoading = ref(false)
const refreshLoading = ref(false)
const exportLoading = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const activeTab = ref('realtime')
const autoRefresh = ref(true)
const refreshTimer = ref(null)
const newAlerts = ref(0)

const searchForm = ref({
  adminId: '',
  behaviorType: '',
  riskLevel: '',
  dateRange: []
})

const trackAdminId = ref('')
const trackDateRange = ref([])

const reportType = ref('daily')
const reportAdminId = ref('')
const reportDateRange = ref([])

const detailDialogVisible = ref(false)
const alertDialogVisible = ref(false)

const detailData = ref({
  id: 0,
  adminId: 0,
  adminName: '',
  behaviorType: '',
  description: '',
  ipAddress: '',
  browser: '',
  os: '',
  behaviorTime: '',
  riskLevel: '',
  duration: 0,
  blocked: false,
  requestParams: '',
  responseResult: ''
})

const alertDetail = ref({
  id: 0,
  adminName: '',
  alertType: '',
  description: '',
  level: '',
  status: '',
  behaviorId: 0,
  createTime: ''
})

// 图表引用
const behaviorChartRef = ref(null)
const riskChartRef = ref(null)
let behaviorChart = null
let riskChart = null

// 获取行为统计数据
const fetchBehaviorStats = async () => {
  try {
    console.log('📊 获取管理员行为统计数据')
    const response = await adminBehaviorApi.getBehaviorStats()
    stats.value = response
    console.log('✅ 行为统计数据获取成功:', stats.value)
  } catch (error) {
    console.error('❌ 获取行为统计数据失败:', error)
    // 使用模拟数据作为后备
    stats.value = {
      totalAdmins: 12,
      abnormalBehaviors: 3,
      complianceRate: 97.5,
      weeklyAbnormal: 1
    }
  }
}

// 获取管理员行为列表
const fetchBehaviorList = async () => {
  loading.value = true
  try {
    console.log('📋 获取管理员行为列表')
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      adminId: searchForm.value.adminId,
      behaviorType: searchForm.value.behaviorType,
      riskLevel: searchForm.value.riskLevel,
      startTime: searchForm.value.dateRange?.[0],
      endTime: searchForm.value.dateRange?.[1]
    }
    
    const response = await adminBehaviorApi.getBehaviorList(params)
    behaviorList.value = response.list || []
    total.value = response.total || 0
    console.log('✅ 行为列表获取成功:', behaviorList.value.length, '条记录')
  } catch (error) {
    console.error('❌ 获取行为列表失败:', error)
    ElMessage.error('获取行为列表失败')
  } finally {
    loading.value = false
  }
}

// 获取实时行为数据
const fetchRealtimeBehaviors = async () => {
  realtimeLoading.value = true
  try {
    console.log('⏱️ 获取实时管理员行为数据')
    const response = await adminBehaviorApi.getLatestBehaviors(20)
    realtimeBehaviors.value = response || []
    console.log('✅ 实时行为数据获取成功:', realtimeBehaviors.value.length, '条记录')
  } catch (error) {
    console.error('❌ 获取实时行为数据失败:', error)
    // 使用模拟数据作为后备
    realtimeBehaviors.value = [
      {
        id: 1,
        adminId: 1,
        adminName: '张三',
        behaviorType: 'delete',
        description: '批量删除用户数据',
        ipAddress: '192.168.1.100',
        browser: 'Chrome 95.0.4638.69',
        os: 'Windows 10',
        behaviorTime: '2023-11-01 10:35:18',
        riskLevel: 'high',
        duration: 120,
        blocked: false,
        requestParams: '{\n  "ids": [1001, 1002, 1003, ...],\n  "reason": "清理无效数据"\n}',
        responseResult: '{\n  "code": 200,\n  "message": "操作成功",\n  "data": {\n    "deletedCount": 50\n  }\n}'
      },
      {
        id: 2,
        adminId: 2,
        adminName: '李四',
        behaviorType: 'permission',
        description: '修改用户权限配置',
        ipAddress: '192.168.1.101',
        browser: 'Firefox 94.0',
        os: 'macOS 12.0',
        behaviorTime: '2023-11-01 09:45:33',
        riskLevel: 'medium',
        duration: 85,
        blocked: false,
        requestParams: '{\n  "userId": 2001,\n  "permissions": ["user.read", "user.write", "admin.read"]\n}',
        responseResult: '{\n  "code": 200,\n  "message": "权限更新成功"\n}'
      }
    ]
  } finally {
    realtimeLoading.value = false
  }
}

// 获取异常告警列表
const fetchAlertList = async () => {
  alertsLoading.value = true
  try {
    console.log('🚨 获取异常告警列表')
    const response = await adminBehaviorApi.getAbnormalAlerts()
    alertList.value = response || []
    newAlerts.value = alertList.value.filter(alert => alert.status === 'pending').length
    console.log('✅ 异常告警列表获取成功:', alertList.value.length, '条记录')
  } catch (error) {
    console.error('❌ 获取异常告警列表失败:', error)
    // 使用模拟数据作为后备
    alertList.value = [
      {
        id: 1,
        adminName: '张三',
        alertType: 'frequent_operation',
        description: '短时间内频繁执行删除操作',
        level: 'high',
        status: 'pending',
        behaviorId: 101,
        createTime: '2023-11-01 10:40:22'
      },
      {
        id: 2,
        adminName: '王五',
        alertType: 'abnormal_time',
        description: '非工作时间执行敏感操作',
        level: 'medium',
        status: 'pending',
        behaviorId: 102,
        createTime: '2023-11-01 22:15:33'
      }
    ]
    newAlerts.value = alertList.value.filter(alert => alert.status === 'pending').length
  } finally {
    alertsLoading.value = false
  }
}

// 获取管理员列表
const fetchAdminList = async () => {
  try {
    console.log('👥 获取管理员列表')
    const response = await adminBehaviorApi.getAdminList()
    adminList.value = response || []
    console.log('✅ 管理员列表获取成功:', adminList.value.length, '名管理员')
  } catch (error) {
    console.error('❌ 获取管理员列表失败:', error)
    // 使用模拟数据作为后备
    adminList.value = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
      { id: 4, name: '赵六' },
      { id: 5, name: '孙七' }
    ]
  }
}

// 获取行为类型文本
const getBehaviorTypeText = (type: string) => {
  switch (type) {
    case 'login':
      return '登录'
    case 'logout':
      return '登出'
    case 'create':
      return '新增数据'
    case 'update':
      return '修改数据'
    case 'delete':
      return '删除数据'
    case 'permission':
      return '权限变更'
    case 'config':
      return '系统配置'
    default:
      return '未知'
  }
}

// 获取风险等级文本
const getRiskLevelText = (level: string) => {
  switch (level) {
    case 'low':
      return '低风险'
    case 'medium':
      return '中风险'
    case 'high':
      return '高风险'
    default:
      return '未知'
  }
}

// 获取风险等级标签类型
const getRiskLevelTagType = (level: string) => {
  switch (level) {
    case 'low':
      return 'success'
    case 'medium':
      return 'warning'
    case 'high':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取告警类型文本
const getAlertTypeText = (type: string) => {
  switch (type) {
    case 'frequent_operation':
      return '频繁操作'
    case 'abnormal_time':
      return '异常时间'
    case 'sensitive_operation':
      return '敏感操作'
    case 'multiple_login':
      return '多地登录'
    case 'privilege_escalation':
      return '权限提升'
    default:
      return '未知类型'
  }
}

// 获取告警类型标签类型
const getAlertTypeTagType = (type: string) => {
  switch (type) {
    case 'frequent_operation':
      return 'danger'
    case 'abnormal_time':
      return 'warning'
    case 'sensitive_operation':
      return 'danger'
    case 'multiple_login':
      return 'warning'
    case 'privilege_escalation':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取时间线类型
const getTimelineType = (level: string) => {
  switch (level) {
    case 'low':
      return 'success'
    case 'medium':
      return 'warning'
    case 'high':
      return 'danger'
    default:
      return 'primary'
  }
}

// 刷新
const handleRefresh = async () => {
  refreshLoading.value = true
  try {
    console.log('🔄 刷新管理员行为数据')
    await Promise.all([
      fetchBehaviorStats(),
      fetchBehaviorList(),
      fetchRealtimeBehaviors(),
      fetchAlertList()
    ])
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('❌ 刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    refreshLoading.value = false
  }
}

// 导出记录
const handleExport = async () => {
  exportLoading.value = true
  try {
    console.log('� 导出监督记录')
    const params = {
      format: 'excel',
      adminId: searchForm.value.adminId,
      behaviorType: searchForm.value.behaviorType,
      riskLevel: searchForm.value.riskLevel,
      startTime: searchForm.value.dateRange?.[0],
      endTime: searchForm.value.dateRange?.[1]
    }
    
    const response = await adminBehaviorApi.exportBehaviorRecords(params)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `admin-behavior-${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('❌ 导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 自动刷新切换
const handleAutoRefreshChange = (value: boolean) => {
  if (value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  console.log('⏰ 开始自动刷新')
  refreshTimer.value = setInterval(() => {
    fetchRealtimeBehaviors()
    fetchAlertList()
  }, 30000) // 每30秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  console.log('⏹️ 停止自动刷新')
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchBehaviorList()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    adminId: '',
    behaviorType: '',
    riskLevel: '',
    dateRange: []
  }
  // 清除表单验证状态
  const form = document.querySelector('.search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 查看告警详情
const handleViewAlert = (row: any) => {
  alertDetail.value = { ...row }
  alertDialogVisible.value = true
}

// 封禁管理员
const handleBlockAdmin = (row: any) => {
  ElMessageBox.confirm(
    `确定要封禁管理员"${row.adminName}"吗？此操作不可逆。`,
    '确认封禁',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      console.log('🚫 封禁管理员:', row)
      await adminBehaviorApi.blockAdmin(row.adminId, '异常操作')
      ElMessage.success(`管理员"${row.adminName}"已封禁`)
      
      // 更新状态
      const index = behaviorList.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        behaviorList.value[index].blocked = true
      }
      
      const realtimeIndex = realtimeBehaviors.value.findIndex(item => item.id === row.id)
      if (realtimeIndex !== -1) {
        realtimeBehaviors.value[realtimeIndex].blocked = true
      }
      
      detailDialogVisible.value = false
    } catch (error) {
      console.error('❌ 封禁管理员失败:', error)
      ElMessage.error('封禁管理员失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 标记告警为已处理
const handleMarkAsHandled = async (row: any) => {
  try {
    console.log('✅ 标记告警为已处理:', row)
    await adminBehaviorApi.markAlertAsHandled(row.id)
    ElMessage.success('告警已标记为已处理')
    
    // 更新状态
    const index = alertList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      alertList.value[index].status = 'handled'
    }
    
    // 更新新告警数量
    newAlerts.value = alertList.value.filter(alert => alert.status === 'pending').length
    
    alertDialogVisible.value = false
  } catch (error) {
    console.error('❌ 标记告警为已处理失败:', error)
    ElMessage.error('标记告警为已处理失败')
  }
}

// 分析行为轨迹
const handleAnalyzeTrack = async () => {
  if (!trackAdminId.value) {
    ElMessage.warning('请选择管理员')
    return
  }
  
  try {
    console.log('🔍 分析管理员行为轨迹:', trackAdminId.value)
    const params = {
      startTime: trackDateRange.value?.[0],
      endTime: trackDateRange.value?.[1]
    }
    
    const response = await adminBehaviorApi.getBehaviorTrack(trackAdminId.value, params)
    trackData.value = response || []
    console.log('✅ 行为轨迹分析完成:', trackData.value.length, '条记录')
  } catch (error) {
    console.error('❌ 分析行为轨迹失败:', error)
    ElMessage.error('分析行为轨迹失败')
  }
}

// 轨迹管理员变更
const handleTrackAdminChange = () => {
  trackData.value = []
}

// 生成报告
const handleGenerateReport = async () => {
  try {
    console.log('� 生成操作统计报告')
    const params = {
      type: reportType.value,
      adminId: reportAdminId.value,
      startTime: reportDateRange.value?.[0],
      endTime: reportDateRange.value?.[1]
    }
    
    const response = await adminBehaviorApi.getOperationReport(params)
    reportData.value = response
    console.log('✅ 报告生成成功')
    
    // 渲染图表
    nextTick(() => {
      renderCharts()
    })
  } catch (error) {
    console.error('❌ 生成报告失败:', error)
    ElMessage.error('生成报告失败')
  }
}

// 渲染图表
const renderCharts = () => {
  if (!reportData.value) return
  
  // 渲染行为类型分布图
  if (behaviorChartRef.value) {
    behaviorChart = echarts.init(behaviorChartRef.value)
    const behaviorOption = {
      title: {
        text: '行为类型分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '行为类型',
          type: 'pie',
          radius: '50%',
          data: reportData.value.behaviorTypeStats || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    behaviorChart.setOption(behaviorOption)
  }
  
  // 渲染风险等级分布图
  if (riskChartRef.value) {
    riskChart = echarts.init(riskChartRef.value)
    const riskOption = {
      title: {
        text: '风险等级分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: ['低风险', '中风险', '高风险']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '操作数量',
          type: 'bar',
          data: reportData.value.riskLevelStats || []
        }
      ]
    }
    riskChart.setOption(riskOption)
  }
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchBehaviorList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchBehaviorList()
}

// 组件挂载
onMounted(async () => {
  console.log('👮 管理员行为监督页面加载完成')
  
  // 初始化数据
  await Promise.all([
    fetchBehaviorStats(),
    fetchBehaviorList(),
    fetchRealtimeBehaviors(),
    fetchAlertList(),
    fetchAdminList()
  ])
  
  // 启动自动刷新
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

// 组件卸载
onUnmounted(() => {
  stopAutoRefresh()
  
  // 销毁图表实例
  if (behaviorChart) {
    behaviorChart.dispose()
  }
  if (riskChart) {
    riskChart.dispose()
  }
})

/**
 * 管理员行为监督页面
 * 监督和审计管理员的行为操作
 */
</script>

<style scoped>
.admin-behavior-supervision-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.bg-primary {
  background-color: #409EFF;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-success {
  background-color: #67C23A;
}

.bg-info {
  background-color: #909399;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.code-block {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
}

/* 实时监控样式 */
.realtime-monitor {
  width: 100%;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

/* 行为轨迹样式 */
.track-analysis {
  width: 100%;
}

.track-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.track-timeline {
  margin-top: 20px;
}

.track-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.track-ip {
  color: #666;
  font-size: 12px;
}

.track-duration {
  color: #666;
  font-size: 12px;
}

/* 异常告警样式 */
.abnormal-alerts {
  width: 100%;
}

/* 统计报告样式 */
.operation-reports {
  width: 100%;
}

.report-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.report-content {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stat-item {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .monitor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>