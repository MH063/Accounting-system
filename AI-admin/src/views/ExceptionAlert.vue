<template>
  <div class="exception-alert-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常告警</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <!-- 告警统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-danger">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日告警总数</div>
                <div class="stat-value">{{ stats.todayTotal }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Bell /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">未处理告警</div>
                <div class="stat-value">{{ stats.unhandled }}</div>
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
                <div class="stat-title">已处理告警</div>
                <div class="stat-value">{{ stats.handled }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><TrendCharts /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">告警处理率</div>
                <div class="stat-value">{{ stats.handleRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-danger">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">安全威胁</div>
                <div class="stat-value">{{ stats.securityThreats }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 告警统计分析 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>告警级别分布</span>
            </template>
            <div ref="levelChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>安全威胁趋势</span>
            </template>
            <div ref="securityChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>告警类型分布</span>
            </template>
            <div ref="typeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>处理状态统计</span>
            </template>
            <div ref="statusChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="告警列表" name="alerts">
            <el-form :model="searchForm" label-width="80px" inline>
              <el-form-item label="告警类型">
                <el-select v-model="searchForm.type" placeholder="请选择告警类型" clearable>
                  <el-option label="系统异常" value="system" />
                  <el-option label="业务异常" value="business" />
                  <el-option label="网络异常" value="network" />
                  <el-option label="数据库异常" value="database" />
                  <el-option label="安全异常" value="security" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="威胁等级">
                <el-select v-model="searchForm.threatLevel" placeholder="请选择威胁等级" clearable>
                  <el-option label="高危" value="high" />
                  <el-option label="中危" value="medium" />
                  <el-option label="低危" value="low" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="告警级别">
                <el-select v-model="searchForm.level" placeholder="请选择告警级别" clearable>
                  <el-option label="紧急" value="critical" />
                  <el-option label="严重" value="major" />
                  <el-option label="一般" value="minor" />
                  <el-option label="提示" value="info" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="处理状态">
                <el-select v-model="searchForm.status" placeholder="请选择处理状态" clearable>
                  <el-option label="未处理" value="unhandled" />
                  <el-option label="处理中" value="processing" />
                  <el-option label="已处理" value="handled" />
                  <el-option label="已忽略" value="ignored" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="告警来源">
                <el-input v-model="searchForm.source" placeholder="请输入告警来源" clearable />
              </el-form-item>
              
              <el-form-item label="关键字">
                <el-input v-model="searchForm.keyword" placeholder="请输入关键字" clearable />
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
          </el-tab-pane>
          
          <el-tab-pane label="异常行为" name="behaviors">
            <el-form :model="behaviorSearchForm" label-width="80px" inline>
              <el-form-item label="用户">
                <el-input v-model="behaviorSearchForm.user" placeholder="请输入用户名" clearable />
              </el-form-item>
              
              <el-form-item label="行为类型">
                <el-select v-model="behaviorSearchForm.type" placeholder="请选择行为类型" clearable>
                  <el-option label="频繁登录" value="login" />
                  <el-option label="异常查询" value="query" />
                  <el-option label="敏感操作" value="operation" />
                  <el-option label="数据导出" value="export" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="风险等级">
                <el-select v-model="behaviorSearchForm.riskLevel" placeholder="请选择风险等级" clearable>
                  <el-option label="高风险" value="high" />
                  <el-option label="中风险" value="medium" />
                  <el-option label="低风险" value="low" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="behaviorSearchForm.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleBehaviorSearch">查询</el-button>
                <el-button @click="handleBehaviorReset">重置</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <el-tab-pane label="告警规则" name="rules">
            <div class="rule-toolbar">
              <el-button type="primary" @click="handleAddRule">新增规则</el-button>
              <el-button @click="handleBatchDelete">批量删除</el-button>
            </div>
            
            <div v-show="activeTab === 'rules'">
              <el-table :data="ruleList" style="width: 100%" @selection-change="handleRuleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="规则名称" />
                <el-table-column prop="type" label="规则类型" width="120">
                  <template #default="scope">
                    {{ getRuleTypeText(scope.row.type) }}
                  </template>
                </el-table-column>
                <el-table-column prop="level" label="告警级别" width="100">
                  <template #default="scope">
                    <el-tag :type="getLevelTagType(scope.row.level)">
                      {{ getLevelText(scope.row.level) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="启用状态" width="100">
                  <template #default="scope">
                    <el-switch 
                      v-model="scope.row.enabled" 
                      @change="handleRuleStatusChange(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="160" />
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button size="small" @click="handleEditRule(scope.row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDeleteRule(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="ruleCurrentPage"
                  v-model:page-size="rulePageSize"
                  :page-sizes="[5, 10, 15, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="ruleTotal"
                  @size-change="handleRuleSizeChange"
                  @current-change="handleRuleCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="应急响应" name="emergency">
            <div class="emergency-toolbar">
              <el-button type="primary" @click="handleAddEmergencyPlan">新增预案</el-button>
              <el-button @click="handleStartEmergencyResponse">启动应急响应</el-button>
            </div>
            
            <div v-show="activeTab === 'emergency'">
              <el-table :data="emergencyPlanList" style="width: 100%">
                <el-table-column prop="name" label="预案名称" />
                <el-table-column prop="level" label="响应级别" width="120">
                  <template #default="scope">
                    <el-tag :type="getEmergencyLevelTagType(scope.row.level)">
                      {{ getEmergencyLevelText(scope.row.level) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
                      {{ scope.row.status === 'active' ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="creator" label="创建人" width="120" />
                <el-table-column prop="createTime" label="创建时间" width="160" />
                <el-table-column label="操作" width="250">
                  <template #default="scope">
                    <el-button size="small" @click="handleViewEmergencyPlan(scope.row)">查看详情</el-button>
                    <el-button size="small" @click="handleEditEmergencyPlan(scope.row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDeleteEmergencyPlan(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="emergencyCurrentPage"
                  v-model:page-size="emergencyPageSize"
                  :page-sizes="[5, 10, 15, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="emergencyTotal"
                  @size-change="handleEmergencySizeChange"
                  @current-change="handleEmergencyCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 告警列表 -->
      <div v-show="activeTab === 'alerts'">
        <el-table :data="alertList" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="type" label="告警类型" width="120">
            <template #default="scope">
              {{ getAlertTypeText(scope.row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="告警级别" width="100">
            <template #default="scope">
              <el-tag :type="getLevelTagType(scope.row.level)">
                {{ getLevelText(scope.row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="告警标题" />
          <el-table-column prop="source" label="告警来源" width="150" />
          <el-table-column prop="occurTime" label="发生时间" width="160" />
          <el-table-column prop="status" label="处理状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click="handleProcess(scope.row)" 
                :disabled="scope.row.status === 'handled' || scope.row.status === 'ignored'"
              >
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 15, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
      
      <!-- 异常行为列表 -->
      <div v-show="activeTab === 'behaviors'">
        <el-table :data="behaviorList" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="user" label="用户" width="120" />
          <el-table-column prop="type" label="行为类型" width="120">
            <template #default="scope">
              {{ getBehaviorTypeText(scope.row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险等级" width="100">
            <template #default="scope">
              <el-tag :type="getRiskLevelTagType(scope.row.riskLevel)">
                {{ getRiskLevelText(scope.row.riskLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="行为描述" />
          <el-table-column prop="ip" label="IP地址" width="150" />
          <el-table-column prop="time" label="发生时间" width="160" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleViewBehavior(scope.row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="behaviorCurrentPage"
            v-model:page-size="behaviorPageSize"
            :page-sizes="[5, 10, 15, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="behaviorTotal"
            @size-change="handleBehaviorSizeChange"
            @current-change="handleBehaviorCurrentChange"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 告警详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="告警详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="告警ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="告警类型">{{ getAlertTypeText(detailData.type) }}</el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :type="getLevelTagType(detailData.level)">
            {{ getLevelText(detailData.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="getStatusTagType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="告警内容" :span="2">{{ detailData.content }}</el-descriptions-item>
        <el-descriptions-item label="告警来源">{{ detailData.source }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ detailData.occurTime }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ detailData.handler || '未处理' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ detailData.handleTime || '未处理' }}</el-descriptions-item>
        <el-descriptions-item label="处理结果" :span="2">{{ detailData.result || '未处理' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 处理告警对话框 -->
    <el-dialog v-model="processDialogVisible" title="处理告警" width="600px">
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="告警标题">
          {{ processForm.title }}
        </el-form-item>
        
        <el-form-item label="处理结果" prop="result">
          <el-input 
            v-model="processForm.result" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入处理结果" 
          />
        </el-form-item>
        
        <el-form-item label="处理状态">
          <el-radio-group v-model="processForm.status">
            <el-radio label="handled">已处理</el-radio>
            <el-radio label="ignored">已忽略</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProcess">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Bell, Check, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const stats = ref({
  todayTotal: 24,
  unhandled: 8,
  handled: 14,
  handleRate: 75,
  securityThreats: 3
})

const alertList = ref([
  {
    id: 1,
    type: 'system',
    level: 'critical',
    title: '数据库连接失败',
    content: '主数据库连接超时，无法建立连接',
    source: '支付服务',
    occurTime: '2023-11-01 10:35:18',
    status: 'unhandled',
    handler: '',
    handleTime: '',
    result: ''
  },
  {
    id: 2,
    type: 'business',
    level: 'major',
    title: '支付超时',
    content: '订单PAY202311010001支付超时',
    source: '支付网关',
    occurTime: '2023-11-01 10:32:45',
    status: 'processing',
    handler: '张三',
    handleTime: '2023-11-01 10:33:00',
    result: '正在重试支付'
  },
  {
    id: 3,
    type: 'network',
    level: 'minor',
    title: '网络延迟',
    content: 'API响应时间超过阈值',
    source: '用户服务',
    occurTime: '2023-11-01 10:30:12',
    status: 'handled',
    handler: '李四',
    handleTime: '2023-11-01 10:31:00',
    result: '网络恢复正常'
  },
  {
    id: 4,
    type: 'security',
    level: 'critical',
    title: '异常登录尝试',
    content: '检测到多次失败登录尝试',
    source: '认证服务',
    occurTime: '2023-11-01 09:45:33',
    status: 'ignored',
    handler: '王五',
    handleTime: '2023-11-01 09:46:00',
    result: '误报，正常用户行为'
  },
  {
    id: 5,
    type: 'security',
    level: 'critical',
    title: 'SQL注入攻击尝试',
    content: '检测到可疑的SQL注入攻击模式',
    source: 'Web应用防火墙',
    occurTime: '2023-11-01 11:20:45',
    status: 'unhandled',
    handler: '',
    handleTime: '',
    result: ''
  },
  {
    id: 6,
    type: 'security',
    level: 'major',
    title: '恶意文件上传尝试',
    content: '检测到可疑的文件上传行为',
    source: '应用安全网关',
    occurTime: '2023-11-01 11:05:12',
    status: 'processing',
    handler: '安全团队',
    handleTime: '2023-11-01 11:06:00',
    result: '正在分析上传文件'
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  type: '',
  level: '',
  status: '',
  threatLevel: '',
  source: '',
  keyword: '',
  dateRange: []
})

const behaviorSearchForm = ref({
  user: '',
  type: '',
  riskLevel: '',
  dateRange: []
})

const activeTab = ref('alerts')

const detailDialogVisible = ref(false)
const processDialogVisible = ref(false)

// 异常行为相关数据
const behaviorList = ref([
  {
    id: 1,
    user: '张三',
    type: 'login',
    riskLevel: 'high',
    description: '10分钟内连续登录失败5次',
    ip: '192.168.1.100',
    time: '2023-11-01 10:35:18'
  },
  {
    id: 2,
    user: '李四',
    type: 'query',
    riskLevel: 'medium',
    description: '高频查询敏感数据',
    ip: '192.168.1.101',
    time: '2023-11-01 10:32:45'
  },
  {
    id: 3,
    user: '王五',
    type: 'export',
    riskLevel: 'high',
    description: '非工作时间大量导出用户数据',
    ip: '192.168.1.102',
    time: '2023-11-01 10:30:12'
  }
])

const behaviorCurrentPage = ref(1)
const behaviorPageSize = ref(15)
const behaviorTotal = ref(100)

// 告警规则相关数据
const ruleList = ref([
  {
    id: 1,
    name: '数据库连接失败告警',
    type: 'system',
    level: 'critical',
    enabled: true,
    createTime: '2023-10-01 09:00:00'
  },
  {
    id: 2,
    name: '支付超时告警',
    type: 'business',
    level: 'major',
    enabled: true,
    createTime: '2023-10-05 14:30:00'
  },
  {
    id: 3,
    name: '频繁登录失败告警',
    type: 'security',
    level: 'critical',
    enabled: false,
    createTime: '2023-10-10 10:15:00'
  }
])

const ruleCurrentPage = ref(1)
const rulePageSize = ref(15)
const ruleTotal = ref(100)
const selectedRules = ref<any[]>([])

// 应急响应相关数据
const emergencyPlanList = ref([
  {
    id: 1,
    name: '数据库故障应急响应预案',
    level: 'high',
    status: 'active',
    creator: '系统管理员',
    createTime: '2023-09-01 09:00:00'
  },
  {
    id: 2,
    name: '网络安全攻击应急响应预案',
    level: 'critical',
    status: 'active',
    creator: '安全管理员',
    createTime: '2023-09-15 14:30:00'
  }
])

const emergencyCurrentPage = ref(1)
const emergencyPageSize = ref(15)
const emergencyTotal = ref(100)

const detailData = ref({
  id: 0,
  type: '',
  level: '',
  title: '',
  content: '',
  source: '',
  occurTime: '',
  status: '',
  handler: '',
  handleTime: '',
  result: ''
})

const processForm = ref({
  id: 0,
  title: '',
  result: '',
  status: 'handled'
})

// 图表引用
const levelChartRef = ref()
const securityChartRef = ref()
const typeChartRef = ref()
const statusChartRef = ref()

// 图表实例
let levelChart: echarts.ECharts
let securityChart: echarts.ECharts
let typeChart: echarts.ECharts
let statusChart: echarts.ECharts

// 初始化图表
const initCharts = () => {
  // 告警级别分布图
  levelChart = echarts.init(levelChartRef.value)
  levelChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 'bottom'
    },
    series: [
      {
        name: '告警级别分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 5, name: '紧急' },
          { value: 8, name: '严重' },
          { value: 12, name: '一般' },
          { value: 15, name: '提示' }
        ]
      }
    ]
  })
  
  // 安全威胁趋势图
  securityChart = echarts.init(securityChartRef.value)
  securityChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['高危', '中危', '低危']
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '威胁数量'
    },
    series: [
      {
        name: '高危',
        type: 'line',
        stack: '总量',
        areaStyle: {},
        data: [2, 3, 1, 4, 2, 3, 1]
      },
      {
        name: '中危',
        type: 'line',
        stack: '总量',
        areaStyle: {},
        data: [5, 4, 6, 3, 4, 5, 3]
      },
      {
        name: '低危',
        type: 'line',
        stack: '总量',
        areaStyle: {},
        data: [8, 10, 7, 9, 8, 7, 6]
      }
    ]
  })
  
  // 告警类型分布图
  typeChart = echarts.init(typeChartRef.value)
  typeChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 'bottom'
    },
    series: [
      {
        name: '告警类型分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 8, name: '系统异常' },
          { value: 6, name: '业务异常' },
          { value: 4, name: '网络异常' },
          { value: 3, name: '数据库异常' },
          { value: 5, name: '安全异常' }
        ]
      }
    ]
  })
  
  // 处理状态统计图
  statusChart = echarts.init(statusChartRef.value)
  statusChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['未处理', '处理中', '已处理', '已忽略']
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      name: '告警数量'
    },
    series: [
      {
        name: '未处理',
        type: 'bar',
        stack: '总量',
        data: [2, 1, 3, 2, 1, 0, 2]
      },
      {
        name: '处理中',
        type: 'bar',
        stack: '总量',
        data: [1, 2, 1, 1, 2, 1, 0]
      },
      {
        name: '已处理',
        type: 'bar',
        stack: '总量',
        data: [5, 6, 4, 5, 6, 8, 7]
      },
      {
        name: '已忽略',
        type: 'bar',
        stack: '总量',
        data: [1, 0, 1, 0, 1, 0, 1]
      }
    ]
  })
}

// 获取告警类型文本
const getAlertTypeText = (type: string) => {
  switch (type) {
    case 'system':
      return '系统异常'
    case 'business':
      return '业务异常'
    case 'network':
      return '网络异常'
    case 'database':
      return '数据库异常'
    case 'security':
      return '安全异常'
    default:
      return '未知'
  }
}

// 获取告警级别文本
const getLevelText = (level: string) => {
  switch (level) {
    case 'critical':
      return '紧急'
    case 'major':
      return '严重'
    case 'minor':
      return '一般'
    case 'info':
      return '提示'
    default:
      return '未知'
  }
}

// 获取告警级别标签类型
const getLevelTagType = (level: string) => {
  switch (level) {
    case 'critical':
      return 'danger'
    case 'major':
      return 'warning'
    case 'minor':
      return ''
    case 'info':
      return 'info'
    default:
      return 'info'
  }
}

// 获取处理状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'unhandled':
      return '未处理'
    case 'processing':
      return '处理中'
    case 'handled':
      return '已处理'
    case 'ignored':
      return '已忽略'
    default:
      return '未知'
  }
}

// 获取处理状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'unhandled':
      return 'danger'
    case 'processing':
      return 'warning'
    case 'handled':
      return 'success'
    case 'ignored':
      return 'info'
    default:
      return 'info'
  }
}

// 获取行为类型文本
const getBehaviorTypeText = (type: string) => {
  switch (type) {
    case 'login':
      return '频繁登录'
    case 'query':
      return '异常查询'
    case 'operation':
      return '敏感操作'
    case 'export':
      return '数据导出'
    default:
      return '未知'
  }
}

// 获取风险等级文本
const getRiskLevelText = (level: string) => {
  switch (level) {
    case 'high':
      return '高风险'
    case 'medium':
      return '中风险'
    case 'low':
      return '低风险'
    default:
      return '未知'
  }
}

// 获取风险等级标签类型
const getRiskLevelTagType = (level: string) => {
  switch (level) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

// 获取规则类型文本
const getRuleTypeText = (type: string) => {
  switch (type) {
    case 'system':
      return '系统规则'
    case 'business':
      return '业务规则'
    case 'network':
      return '网络规则'
    case 'database':
      return '数据库规则'
    case 'security':
      return '安全规则'
    default:
      return '未知'
  }
}

// 获取应急响应级别文本
const getEmergencyLevelText = (level: string) => {
  switch (level) {
    case 'critical':
      return '特别重大'
    case 'high':
      return '重大'
    case 'medium':
      return '较大'
    case 'low':
      return '一般'
    default:
      return '未知'
  }
}

// 获取应急响应级别标签类型
const getEmergencyLevelTagType = (level: string) => {
  switch (level) {
    case 'critical':
      return 'danger'
    case 'high':
      return 'warning'
    case 'medium':
      return ''
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新告警数据')
  ElMessage.success('数据刷新成功')
}

// 导出
const handleExport = () => {
  console.log('📤 导出告警数据')
  ElMessage.success('导出功能待实现')
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索告警:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    type: '',
    level: '',
    status: '',
    threatLevel: '',
    source: '',
    keyword: '',
    dateRange: []
  }
  ElMessage.success('重置搜索条件')
}

// 异常行为搜索
const handleBehaviorSearch = () => {
  console.log('🔍 搜索异常行为:', behaviorSearchForm.value)
  ElMessage.success('查询异常行为功能待实现')
}

// 异常行为重置
const handleBehaviorReset = () => {
  behaviorSearchForm.value = {
    user: '',
    type: '',
    riskLevel: '',
    dateRange: []
  }
  ElMessage.success('重置异常行为搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

// 处理告警
const handleProcess = (row: any) => {
  processForm.value = {
    id: row.id,
    title: row.title,
    result: '',
    status: 'handled'
  }
  processDialogVisible.value = true
}

// 提交处理结果
const submitProcess = () => {
  console.log('✅ 提交处理结果:', processForm.value)
  ElMessage.success('告警处理成功')
  
  // 更新列表状态
  const index = alertList.value.findIndex(item => item.id === processForm.value.id)
  if (index !== -1) {
    alertList.value[index].status = processForm.value.status
    alertList.value[index].handler = '当前用户'
    alertList.value[index].handleTime = new Date().toLocaleString()
    alertList.value[index].result = processForm.value.result
  }
  
  processDialogVisible.value = false
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  console.log(`📈 每页显示 ${val} 条`)
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  console.log(`📄 当前页: ${val}`)
}

// 异常行为分页相关
const handleBehaviorSizeChange = (val: number) => {
  behaviorPageSize.value = val
  behaviorCurrentPage.value = 1
  console.log(`📈 异常行为每页显示 ${val} 条`)
}

const handleBehaviorCurrentChange = (val: number) => {
  behaviorCurrentPage.value = val
  console.log(`📄 异常行为当前页: ${val}`)
}

// 查看异常行为详情
const handleViewBehavior = (row: any) => {
  ElMessage.info(`查看异常行为详情: ${row.id}`)
}

// 告警规则相关方法
const handleAddRule = () => {
  ElMessage.info('新增告警规则')
}

const handleBatchDelete = () => {
  if (selectedRules.value.length === 0) {
    ElMessage.warning('请先选择要删除的规则')
    return
  }
  ElMessage.info(`批量删除 ${selectedRules.value.length} 条规则`)
}

const handleRuleSelectionChange = (selection: any[]) => {
  selectedRules.value = selection
}

const handleRuleStatusChange = (row: any) => {
  ElMessage.info(`规则状态已更新: ${row.name}`)
}

const handleEditRule = (row: any) => {
  ElMessage.info(`编辑告警规则: ${row.name}`)
}

const handleDeleteRule = (row: any) => {
  ElMessage.info(`删除告警规则: ${row.name}`)
}

const handleRuleSizeChange = (val: number) => {
  rulePageSize.value = val
  ruleCurrentPage.value = 1
  console.log(`📈 告警规则每页显示 ${val} 条`)
}

const handleRuleCurrentChange = (val: number) => {
  ruleCurrentPage.value = val
  console.log(`📄 告警规则当前页: ${val}`)
}

// 应急响应相关方法
const handleAddEmergencyPlan = () => {
  ElMessage.info('新增应急响应预案')
}

const handleStartEmergencyResponse = () => {
  ElMessage.info('启动应急响应')
}

const handleViewEmergencyPlan = (row: any) => {
  ElMessage.info(`查看应急响应预案: ${row.name}`)
}

const handleEditEmergencyPlan = (row: any) => {
  ElMessage.info(`编辑应急响应预案: ${row.name}`)
}

const handleDeleteEmergencyPlan = (row: any) => {
  ElMessage.info(`删除应急响应预案: ${row.name}`)
}

const handleEmergencySizeChange = (val: number) => {
  emergencyPageSize.value = val
  emergencyCurrentPage.value = 1
  console.log(`📈 应急响应预案每页显示 ${val} 条`)
}

const handleEmergencyCurrentChange = (val: number) => {
  emergencyCurrentPage.value = val
  console.log(`📄 应急响应预案当前页: ${val}`)
}

// 窗口大小变更处理
const handleResize = () => {
  if (levelChart) levelChart.resize()
  if (securityChart) securityChart.resize()
  if (typeChart) typeChart.resize()
  if (statusChart) statusChart.resize()
}

// 组件挂载
onMounted(() => {
  console.log('🔔 异常告警页面加载完成')
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 组件卸载前
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (levelChart) levelChart.dispose()
  if (securityChart) securityChart.dispose()
  if (typeChart) typeChart.dispose()
  if (statusChart) statusChart.dispose()
})

/**
 * 异常告警页面
 * 展示系统异常告警信息并提供处理功能
 */
</script>

<style scoped>
.exception-alert-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.bg-danger {
  background-color: #F56C6C;
}

.bg-warning {
  background-color: #E6A23C;
}

.bg-success {
  background-color: #67C23A;
}

.bg-info {
  background-color: #409EFF;
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

.rule-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.emergency-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>