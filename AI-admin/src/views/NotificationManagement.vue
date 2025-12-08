<template>
  <div class="system-notification-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统通知管理</span>
          <div class="header-actions">
            <el-button type="success" @click="handleExport" :loading="exportLoading">
              <el-icon><Download /></el-icon>导出记录
            </el-button>
            <el-button type="primary" @click="handleCreateNotification" :loading="loading">
              <el-icon><Plus /></el-icon>发送通知
            </el-button>
            <el-button @click="handleRefresh" :loading="refreshLoading">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 通知统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><Bell /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日发送</div>
                <div class="stat-value">{{ stats.todaySent }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><View /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">阅读率</div>
                <div class="stat-value">{{ stats.readRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Timer /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">待发送</div>
                <div class="stat-value">{{ stats.pendingSend }}</div>
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
                <div class="stat-title">发送失败</div>
                <div class="stat-value">{{ stats.failedSend }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 功能标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 全局通知消息发送 -->
        <el-tab-pane label="通知发送" name="send">
          <div class="tab-content">
            <!-- 搜索表单 -->
            <el-form :model="notificationSearchForm" inline class="search-form">
              <el-form-item label="通知标题">
                <el-input v-model="notificationSearchForm.keyword" placeholder="请输入通知标题" clearable />
              </el-form-item>
              <el-form-item label="通知类型">
                <el-select v-model="notificationSearchForm.type" placeholder="请选择通知类型" clearable>
                  <el-option label="系统通知" value="system" />
                  <el-option label="公告" value="announcement" />
                  <el-option label="提醒" value="reminder" />
                  <el-option label="紧急通知" value="urgent" />
                </el-select>
              </el-form-item>
              <el-form-item label="发送状态">
                <el-select v-model="notificationSearchForm.status" placeholder="请选择发送状态" clearable>
                  <el-option label="草稿" value="draft" />
                  <el-option label="已计划" value="scheduled" />
                  <el-option label="发送中" value="sending" />
                  <el-option label="已发送" value="sent" />
                  <el-option label="发送失败" value="failed" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleNotificationSearch">搜索</el-button>
                <el-button @click="handleNotificationReset">重置</el-button>
              </el-form-item>
            </el-form>
            
            <!-- 通知列表 -->
            <el-table :data="notificationList" border stripe v-loading="notificationLoading" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="title" label="通知标题" min-width="200" show-overflow-tooltip>
                <template #default="scope">
                  <el-link type="primary" @click="handleViewNotification(scope.row)">{{ scope.row.title }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100">
                <template #default="scope">
                  <el-tag :type="getNotificationTypeTagType(scope.row.type)">
                    {{ getNotificationTypeText(scope.row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="priority" label="优先级" width="100">
                <template #default="scope">
                  <el-tag :type="getPriorityTagType(scope.row.priority)">
                    {{ getPriorityText(scope.row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusTagType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="recipientCount" label="接收人数" width="100" />
              <el-table-column prop="senderName" label="发送人" width="120" />
              <el-table-column prop="sendTime" label="发送时间" width="160" />
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="handleViewNotification(scope.row)">查看</el-button>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="handleEditNotification(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    size="small" 
                    type="success" 
                    @click="handleSendNotification(scope.row)"
                    :disabled="scope.row.status === 'sent' || scope.row.status === 'sending'"
                  >
                    发送
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="notificationCurrentPage"
                v-model:page-size="notificationPageSize"
                :page-sizes="[10, 15, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="notificationTotal"
                @size-change="handleNotificationSizeChange"
                @current-change="handleNotificationCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 通知模板管理维护 -->
        <el-tab-pane label="通知模板" name="templates">
          <div class="tab-content">
            <!-- 搜索表单 -->
            <el-form :model="templateSearchForm" inline class="search-form">
              <el-form-item label="模板名称">
                <el-input v-model="templateSearchForm.keyword" placeholder="请输入模板名称" clearable />
              </el-form-item>
              <el-form-item label="模板类型">
                <el-select v-model="templateSearchForm.type" placeholder="请选择模板类型" clearable>
                  <el-option label="系统通知" value="system" />
                  <el-option label="公告" value="announcement" />
                  <el-option label="提醒" value="reminder" />
                  <el-option label="紧急通知" value="urgent" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="templateSearchForm.isActive" placeholder="请选择状态" clearable>
                  <el-option label="启用" :value="true" />
                  <el-option label="禁用" :value="false" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleTemplateSearch">搜索</el-button>
                <el-button @click="handleTemplateReset">重置</el-button>
                <el-button type="success" @click="handleCreateTemplate">创建模板</el-button>
              </el-form-item>
            </el-form>
            
            <!-- 模板列表 -->
            <el-table :data="templateList" border stripe v-loading="templateLoading" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="模板名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="scope">
                  <el-tag :type="getNotificationTypeTagType(scope.row.type)">
                    {{ getNotificationTypeText(scope.row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="variables" label="变量" width="200">
                <template #default="scope">
                  <el-tag v-for="variable in scope.row.variables" :key="variable" size="small" style="margin-right: 5px;">
                    {{ variable }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="usageCount" label="使用次数" width="100" />
              <el-table-column prop="isActive" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
                    {{ scope.row.isActive ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="handleViewTemplate(scope.row)">查看</el-button>
                  <el-button size="small" type="primary" @click="handleEditTemplate(scope.row)">编辑</el-button>
                  <el-button 
                    size="small" 
                    :type="scope.row.isActive ? 'warning' : 'success'"
                    @click="handleToggleTemplate(scope.row)"
                  >
                    {{ scope.row.isActive ? '禁用' : '启用' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="templateCurrentPage"
                v-model:page-size="templatePageSize"
                :page-sizes="[10, 15, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="templateTotal"
                @size-change="handleTemplateSizeChange"
                @current-change="handleTemplateCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 发送历史记录查询 -->
        <el-tab-pane label="发送历史" name="history">
          <div class="tab-content">
            <!-- 搜索表单 -->
            <el-form :model="historySearchForm" inline class="search-form">
              <el-form-item label="通知标题">
                <el-input v-model="historySearchForm.keyword" placeholder="请输入通知标题" clearable />
              </el-form-item>
              <el-form-item label="通知类型">
                <el-select v-model="historySearchForm.type" placeholder="请选择通知类型" clearable>
                  <el-option label="系统通知" value="system" />
                  <el-option label="公告" value="announcement" />
                  <el-option label="提醒" value="reminder" />
                  <el-option label="紧急通知" value="urgent" />
                </el-select>
              </el-form-item>
              <el-form-item label="发送方式">
                <el-select v-model="historySearchForm.method" placeholder="请选择发送方式" clearable>
                  <el-option label="邮件" value="email" />
                  <el-option label="短信" value="sms" />
                  <el-option label="站内信" value="in-app" />
                  <el-option label="推送通知" value="push" />
                </el-select>
              </el-form-item>
              <el-form-item label="发送状态">
                <el-select v-model="historySearchForm.status" placeholder="请选择发送状态" clearable>
                  <el-option label="待发送" value="pending" />
                  <el-option label="发送中" value="sending" />
                  <el-option label="已发送" value="sent" />
                  <el-option label="发送失败" value="failed" />
                </el-select>
              </el-form-item>
              <el-form-item label="发送时间">
                <el-date-picker
                  v-model="historySearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleHistorySearch">搜索</el-button>
                <el-button @click="handleHistoryReset">重置</el-button>
                <el-button type="success" @click="handleExportHistory">导出记录</el-button>
              </el-form-item>
            </el-form>
            
            <!-- 历史记录列表 -->
            <el-table :data="historyList" border stripe v-loading="historyLoading" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="notificationTitle" label="通知标题" min-width="200" show-overflow-tooltip />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="scope">
                  <el-tag :type="getNotificationTypeTagType(scope.row.type)">
                    {{ getNotificationTypeText(scope.row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="senderName" label="发送人" width="120" />
              <el-table-column prop="recipientGroup" label="接收群体" width="120" />
              <el-table-column prop="recipientCount" label="接收人数" width="100" />
              <el-table-column prop="sendMethod" label="发送方式" width="100">
                <template #default="scope">
                  <el-tag>{{ getSendMethodText(scope.row.sendMethod) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getHistoryStatusTagType(scope.row.status)">
                    {{ getHistoryStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sendTime" label="发送时间" width="160" />
              <el-table-column prop="readCount" label="阅读数" width="80" />
              <el-table-column prop="clickCount" label="点击数" width="80" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="handleViewHistory(scope.row)">查看</el-button>
                  <el-button 
                    v-if="scope.row.status === 'failed'"
                    size="small" 
                    type="warning" 
                    @click="handleRetryHistory(scope.row)"
                  >
                    重试
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="historyCurrentPage"
                v-model:page-size="historyPageSize"
                :page-sizes="[10, 15, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="historyTotal"
                @size-change="handleHistorySizeChange"
                @current-change="handleHistoryCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 通知效果统计分析 -->
        <el-tab-pane label="效果统计" name="stats">
          <div class="tab-content">
            <!-- 统计筛选 -->
            <el-form :model="statsSearchForm" inline class="search-form">
              <el-form-item label="统计时间">
                <el-date-picker
                  v-model="statsSearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
              <el-form-item label="通知类型">
                <el-select v-model="statsSearchForm.type" placeholder="请选择通知类型" clearable>
                  <el-option label="系统通知" value="system" />
                  <el-option label="公告" value="announcement" />
                  <el-option label="提醒" value="reminder" />
                  <el-option label="紧急通知" value="urgent" />
                </el-select>
              </el-form-item>
              <el-form-item label="发送方式">
                <el-select v-model="statsSearchForm.method" placeholder="请选择发送方式" clearable>
                  <el-option label="邮件" value="email" />
                  <el-option label="短信" value="sms" />
                  <el-option label="站内信" value="in-app" />
                  <el-option label="推送通知" value="push" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleStatsSearch">查询</el-button>
                <el-button @click="handleStatsReset">重置</el-button>
              </el-form-item>
            </el-form>
            
            <!-- 总体统计 -->
            <el-row :gutter="20" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-item">
                    <div class="stat-icon bg-primary">
                      <el-icon size="24"><Promotion /></el-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-title">总发送数</div>
                      <div class="stat-value">{{ notificationStats.totalSent }}</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-item">
                    <div class="stat-icon bg-success">
                      <el-icon size="24"><View /></el-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-title">总阅读数</div>
                      <div class="stat-value">{{ notificationStats.totalRead }}</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-item">
                    <div class="stat-icon bg-warning">
                      <el-icon size="24"><Pointer /></el-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-title">总点击数</div>
                      <div class="stat-value">{{ notificationStats.totalClick }}</div>
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
                      <div class="stat-title">阅读率</div>
                      <div class="stat-value">{{ notificationStats.readRate }}%</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 图表展示 -->
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card title="类型统计">
                  <template #header>
                    <span>类型统计</span>
                  </template>
                  <div ref="typeStatsChartRef" style="height: 300px;"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card title="发送方式统计">
                  <template #header>
                    <span>发送方式统计</span>
                  </template>
                  <div ref="methodStatsChartRef" style="height: 300px;"></div>
                </el-card>
              </el-col>
            </el-row>
            
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <el-card title="趋势统计">
                  <template #header>
                    <span>趋势统计</span>
                  </template>
                  <div ref="trendStatsChartRef" style="height: 400px;"></div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        
        <!-- 目标用户群体选择 -->
        <el-tab-pane label="用户群体" name="userGroups">
          <div class="tab-content">
            <!-- 搜索表单 -->
            <el-form :model="userGroupSearchForm" inline class="search-form">
              <el-form-item label="群体名称">
                <el-input v-model="userGroupSearchForm.keyword" placeholder="请输入群体名称" clearable />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="userGroupSearchForm.isActive" placeholder="请选择状态" clearable>
                  <el-option label="启用" :value="true" />
                  <el-option label="禁用" :value="false" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleUserGroupSearch">搜索</el-button>
                <el-button @click="handleUserGroupReset">重置</el-button>
                <el-button type="success" @click="handleCreateUserGroup">创建群体</el-button>
              </el-form-item>
            </el-form>
            
            <!-- 用户群体列表 -->
            <el-table :data="userGroupList" border stripe v-loading="userGroupLoading" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="群体名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column prop="userCount" label="用户数量" width="100" />
              <el-table-column prop="isActive" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
                    {{ scope.row.isActive ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column label="操作" width="250" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="handleViewUserGroup(scope.row)">查看</el-button>
                  <el-button size="small" type="primary" @click="handleEditUserGroup(scope.row)">编辑</el-button>
                  <el-button 
                    size="small" 
                    :type="scope.row.isActive ? 'warning' : 'success'"
                    @click="handleToggleUserGroup(scope.row)"
                  >
                    {{ scope.row.isActive ? '禁用' : '启用' }}
                  </el-button>
                  <el-button size="small" type="info" @click="handlePreviewUserGroup(scope.row)">预览</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="userGroupCurrentPage"
                v-model:page-size="userGroupPageSize"
                :page-sizes="[10, 15, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="userGroupTotal"
                @size-change="handleUserGroupSizeChange"
                @current-change="handleUserGroupCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 定时发送任务管理 -->
        <el-tab-pane label="定时任务" name="scheduledTasks">
          <div class="tab-content">
            <!-- 搜索表单 -->
            <el-form :model="taskSearchForm" inline class="search-form">
              <el-form-item label="任务名称">
                <el-input v-model="taskSearchForm.keyword" placeholder="请输入任务名称" clearable />
              </el-form-item>
              <el-form-item label="任务状态">
                <el-select v-model="taskSearchForm.status" placeholder="请选择任务状态" clearable>
                  <el-option label="待执行" value="pending" />
                  <el-option label="执行中" value="running" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="执行失败" value="failed" />
                  <el-option label="已取消" value="cancelled" />
                </el-select>
              </el-form-item>
              <el-form-item label="计划时间">
                <el-date-picker
                  v-model="taskSearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleTaskSearch">搜索</el-button>
                <el-button @click="handleTaskReset">重置</el-button>
                <el-button type="success" @click="handleCreateTask">创建任务</el-button>
              </el-form-item>
            </el-form>
            
            <!-- 定时任务列表 -->
            <el-table :data="taskList" border stripe v-loading="taskLoading" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="任务名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="notificationTitle" label="通知标题" min-width="200" show-overflow-tooltip />
              <el-table-column prop="scheduledTime" label="计划时间" width="160" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getTaskStatusTagType(scope.row.status)">
                    {{ getTaskStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="retryCount" label="重试次数" width="100">
                <template #default="scope">
                  {{ scope.row.retryCount }} / {{ scope.row.maxRetries }}
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column prop="runTime" label="执行时间" width="160" />
              <el-table-column label="操作" width="250" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="handleViewTask(scope.row)">查看</el-button>
                  <el-button size="small" type="primary" @click="handleEditTask(scope.row)">编辑</el-button>
                  <el-button 
                    v-if="scope.row.status === 'pending'"
                    size="small" 
                    type="success" 
                    @click="handleExecuteTask(scope.row)"
                  >
                    立即执行
                  </el-button>
                  <el-button 
                    v-if="scope.row.status === 'pending'"
                    size="small" 
                    type="warning" 
                    @click="handleCancelTask(scope.row)"
                  >
                    取消
                  </el-button>
                  <el-button 
                    v-if="scope.row.status === 'failed'"
                    size="small" 
                    type="danger" 
                    @click="handleRetryTask(scope.row)"
                  >
                    重试
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="taskCurrentPage"
                v-model:page-size="taskPageSize"
                :page-sizes="[10, 15, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="taskTotal"
                @size-change="handleTaskSizeChange"
                @current-change="handleTaskCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 创建/编辑/查看通知对话框 -->
    <el-dialog 
      v-model="notificationDialogVisible" 
      :title="notificationDialogTitle" 
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="notificationFormData" :rules="notificationDialogMode === 'view' ? {} : notificationFormRules" ref="notificationFormRef" label-width="100px">
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="notificationFormData.type" placeholder="请选择通知类型" style="width: 100%;" :disabled="notificationDialogMode === 'view'">
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="提醒" value="reminder" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="notificationFormData.priority" placeholder="请选择优先级" style="width: 100%;" :disabled="notificationDialogMode === 'view'">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="通知标题" prop="title">
          <el-input v-model="notificationFormData.title" placeholder="请输入通知标题" :disabled="notificationDialogMode === 'view'" />
        </el-form-item>
        
        <el-form-item label="通知内容" prop="content">
          <el-input 
            v-model="notificationFormData.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入通知内容" 
            maxlength="1000"
            show-word-limit
            :disabled="notificationDialogMode === 'view'"
          />
        </el-form-item>
        
        <el-form-item label="使用模板">
          <el-select 
            v-model="notificationFormData.templateId" 
            placeholder="请选择通知模板"
            style="width: 100%;"
            clearable
            @change="handleTemplateChange"
            :disabled="notificationDialogMode === 'view'"
          >
            <el-option 
              v-for="template in templateOptions" 
              :key="template.id" 
              :label="template.name" 
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="接收群体" prop="recipientGroups">
          <el-select 
            v-model="notificationFormData.recipientGroups" 
            multiple 
            placeholder="请选择接收群体"
            style="width: 100%;"
            :disabled="notificationDialogMode === 'view'"
          >
            <el-option 
              v-for="group in userGroupOptions" 
              :key="group.id" 
              :label="group.name" 
              :value="group.name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发送方式" prop="sendMethods">
          <el-checkbox-group v-model="notificationFormData.sendMethods" :disabled="notificationDialogMode === 'view'">
            <el-checkbox label="email">邮件</el-checkbox>
            <el-checkbox label="sms">短信</el-checkbox>
            <el-checkbox label="in-app">站内信</el-checkbox>
            <el-checkbox label="push">推送通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="定时发送">
          <el-switch v-model="notificationFormData.scheduleEnabled" :disabled="notificationDialogMode === 'view'" />
          <el-date-picker
            v-if="notificationFormData.scheduleEnabled"
            v-model="notificationFormData.scheduledTime"
            type="datetime"
            placeholder="选择发送时间"
            style="margin-left: 15px;"
            :disabled="notificationDialogMode === 'view'"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="notificationDialogVisible = false">
            {{ notificationDialogMode === 'view' ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="notificationDialogMode !== 'view' && !notificationFormData.id" type="primary" @click="handleSaveNotificationDraft" :loading="submitLoading">保存草稿</el-button>
          <el-button v-if="notificationDialogMode !== 'view'" type="success" @click="handleSaveAndSendNotification" :loading="submitLoading">
            {{ notificationFormData.scheduleEnabled ? '计划发送' : '立即发送' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑/查看模板对话框 -->
    <el-dialog 
      v-model="templateDialogVisible" 
      :title="templateDialogTitle" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="templateFormData" :rules="templateDialogMode === 'view' ? {} : templateFormRules" ref="templateFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateFormData.name" placeholder="请输入模板名称" :disabled="templateDialogMode === 'view'" />
        </el-form-item>
        
        <el-form-item label="模板类型" prop="type">
          <el-select v-model="templateFormData.type" placeholder="请选择模板类型" style="width: 100%;" :disabled="templateDialogMode === 'view'">
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="提醒" value="reminder" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标题模板" prop="title">
          <el-input v-model="templateFormData.title" placeholder="请输入标题模板，如：{title}" :disabled="templateDialogMode === 'view'" />
          <div class="form-tip">可使用变量：{title}, {date}, {sender} 等</div>
        </el-form-item>
        
        <el-form-item label="内容模板" prop="content">
          <el-input 
            v-model="templateFormData.content" 
            type="textarea" 
            :rows="8" 
            placeholder="请输入内容模板，如：{content}" 
            maxlength="2000"
            show-word-limit
            :disabled="templateDialogMode === 'view'"
          />
          <div class="form-tip">可使用变量：{title}, {content}, {date}, {sender}, {url} 等</div>
        </el-form-item>
        
        <el-form-item label="模板变量">
          <el-tag 
            v-for="variable in templateFormData.variables" 
            :key="variable" 
            :closable="templateDialogMode !== 'view'"
            @close="removeTemplateVariable(variable)"
            style="margin-right: 10px; margin-bottom: 10px;"
          >
            {{ variable }}
          </el-tag>
          <el-input
            v-if="variableInputVisible && templateDialogMode !== 'view'"
            ref="variableInputRef"
            v-model="variableInputValue"
            size="small"
            @keyup.enter="handleVariableInputConfirm"
            @blur="handleVariableInputConfirm"
            style="width: 120px;"
          />
          <el-button v-else-if="templateDialogMode !== 'view'" size="small" @click="showVariableInput">+ 添加变量</el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">
            {{ templateDialogMode === 'view' ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="templateDialogMode !== 'view'" type="primary" @click="handleSaveTemplate" :loading="submitLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑/查看用户群体对话框 -->
    <el-dialog 
      v-model="userGroupDialogVisible" 
      :title="userGroupDialogTitle" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="userGroupFormData" :rules="userGroupDialogMode === 'view' ? {} : userGroupFormRules" ref="userGroupFormRef" label-width="100px">
        <el-form-item label="群体名称" prop="name">
          <el-input v-model="userGroupFormData.name" placeholder="请输入群体名称" :disabled="userGroupDialogMode === 'view'" />
        </el-form-item>
        
        <el-form-item label="群体描述" prop="description">
          <el-input 
            v-model="userGroupFormData.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入群体描述" 
            :disabled="userGroupDialogMode === 'view'"
          />
        </el-form-item>
        
        <el-form-item label="用户类型">
          <el-checkbox-group v-model="userGroupFormData.criteria.userType" :disabled="userGroupDialogMode === 'view'">
            <el-checkbox label="admin">管理员</el-checkbox>
            <el-checkbox label="user">普通用户</el-checkbox>
            <el-checkbox label="vip">VIP用户</el-checkbox>
            <el-checkbox label="guest">游客</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="userGroupFormData.criteria.registerDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :disabled="userGroupDialogMode === 'view'"
          />
        </el-form-item>
        
        <el-form-item label="最后活跃时间">
          <el-date-picker
            v-model="userGroupFormData.criteria.lastActiveDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :disabled="userGroupDialogMode === 'view'"
          />
        </el-form-item>
        
        <el-form-item label="用户标签">
          <el-select 
            v-model="userGroupFormData.criteria.tags" 
            multiple 
            filterable 
            allow-create 
            placeholder="请选择或输入用户标签"
            style="width: 100%;"
            :disabled="userGroupDialogMode === 'view'"
          >
            <el-option label="活跃用户" value="active" />
            <el-option label="新用户" value="new" />
            <el-option label="高价值用户" value="high-value" />
            <el-option label="流失风险用户" value="churn-risk" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userGroupDialogVisible = false">
            {{ userGroupDialogMode === 'view' ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="userGroupDialogMode !== 'view'" type="info" @click="handlePreviewUserGroupSave">预览用户</el-button>
          <el-button v-if="userGroupDialogMode !== 'view'" type="primary" @click="handleSaveUserGroup" :loading="submitLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建/编辑定时任务对话框 -->
    <el-dialog 
      v-model="taskDialogVisible" 
      :title="taskDialogTitle" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="taskFormData" :rules="taskDialogMode === 'view' ? {} : taskFormRules" ref="taskFormRef" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskFormData.name" placeholder="请输入任务名称" :disabled="taskDialogMode === 'view'" />
        </el-form-item>
        
        <el-form-item label="选择通知" prop="notificationId">
          <el-select 
            v-model="taskFormData.notificationId" 
            placeholder="请选择通知"
            style="width: 100%;"
            :disabled="taskDialogMode === 'view'"
          >
            <el-option 
              v-for="notification in notificationOptions" 
              :key="notification.id" 
              :label="notification.title" 
              :value="notification.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="计划时间" prop="scheduledTime">
          <el-date-picker
            v-model="taskFormData.scheduledTime"
            type="datetime"
            placeholder="选择计划执行时间"
            style="width: 100%;"
            :disabled="taskDialogMode === 'view'"
          />
        </el-form-item>
        
        <el-form-item label="最大重试次数" prop="maxRetries">
          <el-input-number v-model="taskFormData.maxRetries" :min="0" :max="5" :disabled="taskDialogMode === 'view'" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialogVisible = false">
            {{ taskDialogMode === 'view' ? '关闭' : '取消' }}
          </el-button>
          <el-button v-if="taskDialogMode !== 'view'" type="primary" @click="handleSaveTask" :loading="submitLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 用户预览对话框 -->
    <el-dialog 
      v-model="userPreviewDialogVisible" 
      title="用户预览" 
      width="800px"
    >
      <el-table :data="userPreviewList" border stripe v-loading="userPreviewLoading" style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="userType" label="用户类型" width="100">
          <template #default="scope">
            <el-tag>{{ getUserTypeText(scope.row.userType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="160" />
        <el-table-column prop="lastActiveTime" label="最后活跃" width="160" />
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="userPreviewCurrentPage"
          v-model:page-size="userPreviewPageSize"
          :page-sizes="[10, 15, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="userPreviewTotal"
          @size-change="handleUserPreviewSizeChange"
          @current-change="handleUserPreviewCurrentChange"
        />
      </div>
    </el-dialog>
    
    <!-- 查看发送历史对话框 -->
    <el-dialog 
      v-model="historyDialogVisible" 
      :title="historyDialogTitle" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="historyFormData" label-width="100px">
        <el-form-item label="通知标题">
          <el-input v-model="historyFormData.title" readonly />
        </el-form-item>
        
        <el-form-item label="通知类型">
          <el-select v-model="historyFormData.type" style="width: 100%;" disabled>
            <el-option label="系统通知" value="system" />
            <el-option label="公告" value="announcement" />
            <el-option label="提醒" value="reminder" />
            <el-option label="紧急通知" value="urgent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="historyFormData.priority" style="width: 100%;" disabled>
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发送状态">
          <el-select v-model="historyFormData.status" style="width: 100%;" disabled>
            <el-option label="发送中" value="sending" />
            <el-option label="已发送" value="sent" />
            <el-option label="发送失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="发送时间">
          <el-input v-model="historyFormData.sendTime" readonly />
        </el-form-item>
        
        <el-form-item label="发送方式">
          <el-checkbox-group v-model="historyFormData.sendMethods" disabled>
            <el-checkbox label="app">应用内通知</el-checkbox>
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="通知内容">
          <el-input type="textarea" v-model="historyFormData.content" :rows="4" readonly />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="接收人数">
              <el-input v-model="historyFormData.recipientCount" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="成功发送">
              <el-input v-model="historyFormData.successCount" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发送失败">
              <el-input v-model="historyFormData.failureCount" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="阅读人数">
          <el-input v-model="historyFormData.readCount" readonly />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="historyDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Bell, View, Timer, Warning, Download, Plus, Refresh, 
  Promotion, Pointer, TrendCharts
} from '@element-plus/icons-vue'
import { 
  systemNotificationApi, 
  notificationTemplateApi, 
  notificationHistoryApi, 
  notificationStatsApi, 
  userGroupApi, 
  scheduledTaskApi,
  type SystemNotification,
  type NotificationTemplate,
  type NotificationHistory,
  type NotificationStats,
  type UserGroup,
  type ScheduledTask
} from '@/api/systemNotification'

// 响应式数据
const stats = ref({
  todaySent: 0,
  readRate: 0,
  pendingSend: 0,
  failedSend: 0
})

const activeTab = ref('send')
const loading = ref(false)
const refreshLoading = ref(false)
const exportLoading = ref(false)
const submitLoading = ref(false)

// 通知发送相关
const notificationLoading = ref(false)
const notificationList = ref<SystemNotification[]>([])
const notificationSearchForm = reactive({
  keyword: '',
  type: '',
  status: '',
  priority: ''
})
const notificationCurrentPage = ref(1)
const notificationPageSize = ref(15)
const notificationTotal = ref(0)

// 通知模板相关
const templateLoading = ref(false)
const templateList = ref<NotificationTemplate[]>([])
const templateSearchForm = reactive({
  keyword: '',
  type: '',
  isActive: undefined as boolean | undefined
})
const templateCurrentPage = ref(1)
const templatePageSize = ref(15)
const templateTotal = ref(0)

// 发送历史相关
const historyLoading = ref(false)
const historyList = ref<NotificationHistory[]>([])
const historySearchForm = reactive({
  keyword: '',
  type: '',
  method: '',
  status: '',
  dateRange: []
})
const historyCurrentPage = ref(1)
const historyPageSize = ref(15)
const historyTotal = ref(0)

// 统计数据相关
const notificationStats = ref<NotificationStats>({
  totalSent: 0,
  totalRead: 0,
  totalClick: 0,
  readRate: 0,
  clickRate: 0,
  typeStats: {},
  methodStats: {},
  dailyStats: [],
  monthlyStats: []
})
const statsSearchForm = reactive({
  dateRange: [],
  type: '',
  method: ''
})

// 用户群体相关
const userGroupLoading = ref(false)
const userGroupList = ref<UserGroup[]>([])
const userGroupSearchForm = reactive({
  keyword: '',
  isActive: undefined as boolean | undefined
})
const userGroupCurrentPage = ref(1)
const userGroupPageSize = ref(15)
const userGroupTotal = ref(0)

// 定时任务相关
const taskLoading = ref(false)
const taskList = ref<ScheduledTask[]>([])
const taskSearchForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
})
const taskCurrentPage = ref(1)
const taskPageSize = ref(15)
const taskTotal = ref(0)

// 对话框相关
const notificationDialogVisible = ref(false)
const notificationDialogTitle = ref('创建通知')
const notificationDialogMode = ref<'create' | 'edit' | 'view'>('create')
const notificationFormData = reactive({
  id: undefined as number | undefined,
  title: '',
  content: '',
  type: 'system',
  priority: 'normal',
  recipientGroups: [] as string[],
  sendMethods: ['email'],
  isScheduled: false,
  scheduledTime: '',
  templateId: undefined as number | undefined
})
const notificationFormRules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  recipientGroups: [{ required: true, message: '请选择接收群体', trigger: 'change' }],
  sendMethods: [{ required: true, message: '请选择发送方式', trigger: 'change' }]
}

const templateDialogVisible = ref(false)
const templateDialogTitle = ref('创建模板')
const templateDialogMode = ref<'create' | 'edit' | 'view'>('create')
const templateFormData = reactive({
  id: undefined as number | undefined,
  name: '',
  title: '',
  content: '',
  type: 'system',
  variables: [] as string[]
})
const templateFormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  title: [{ required: true, message: '请输入模板标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }]
}

const userGroupDialogVisible = ref(false)
const userGroupDialogTitle = ref('创建用户群体')
const userGroupDialogMode = ref<'create' | 'edit' | 'view'>('create')
const userGroupFormData = reactive({
  id: undefined as number | undefined,
  name: '',
  description: '',
  criteria: {
    userType: [] as string[],
    registerDateRange: [],
    lastActiveDateRange: [],
    tags: [] as string[]
  }
})
const userGroupFormRules = {
  name: [{ required: true, message: '请输入群体名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入群体描述', trigger: 'blur' }]
}

const taskDialogVisible = ref(false)
const taskDialogTitle = ref('创建定时任务')
const taskDialogMode = ref<'create' | 'edit' | 'view'>('create')
const taskFormData = reactive({
  id: undefined as number | undefined,
  name: '',
  notificationId: undefined as number | undefined,
  scheduledTime: '',
  maxRetries: 3
})
const taskFormRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  notificationId: [{ required: true, message: '请选择通知', trigger: 'change' }],
  scheduledTime: [{ required: true, message: '请选择计划执行时间', trigger: 'change' }],
  maxRetries: [{ required: true, message: '请输入最大重试次数', trigger: 'blur' }]
}

// 发送历史对话框
const historyDialogVisible = ref(false)
const historyDialogTitle = ref('查看发送历史')
const historyDialogMode = ref<'view'>('view')
const historyFormData = reactive({
  id: undefined as number | undefined,
  title: '',
  content: '',
  type: '',
  priority: '',
  status: '',
  sendTime: '',
  recipientCount: 0,
  successCount: 0,
  failureCount: 0,
  readCount: 0,
  sendMethods: [] as string[]
})

// 用户预览相关
const userPreviewDialogVisible = ref(false)
const userPreviewLoading = ref(false)
const userPreviewList = ref([])
const userPreviewCurrentPage = ref(1)
const userPreviewPageSize = ref(15)
const userPreviewTotal = ref(0)

// 通知选项
const notificationOptions = ref<SystemNotification[]>([])

// 模板变量输入相关
const variableInputVisible = ref(false)
const variableInputValue = ref('')
const variableInputRef = ref()

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await notificationStatsApi.getNotificationStats()
    stats.value = {
      todaySent: response.dailyStats?.[0]?.sent || 0,
      readRate: response.readRate || 0,
      pendingSend: 0, // 需要从其他API获取
      failedSend: 0  // 需要从其他API获取
    }
    notificationStats.value = response
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 使用模拟数据作为后备
    stats.value = {
      todaySent: 25,
      readRate: 68,
      pendingSend: 5,
      failedSend: 2
    }
    notificationStats.value = {
      totalSent: 1250,
      totalRead: 850,
      totalClick: 420,
      readRate: 68,
      clickRate: 49.4,
      typeStats: {
        system: { sent: 500, read: 350, click: 180, readRate: 70, clickRate: 51.4 },
        announcement: { sent: 400, read: 280, click: 150, readRate: 70, clickRate: 53.6 },
        reminder: { sent: 300, read: 180, click: 70, readRate: 60, clickRate: 38.9 },
        urgent: { sent: 50, read: 40, click: 20, readRate: 80, clickRate: 50 }
      },
      methodStats: {
        email: { sent: 600, read: 400, click: 200, readRate: 66.7, clickRate: 50 },
        sms: { sent: 200, read: 150, click: 80, readRate: 75, clickRate: 53.3 },
        'in-app': { sent: 400, read: 280, click: 130, readRate: 70, clickRate: 46.4 },
        push: { sent: 50, read: 20, click: 10, readRate: 40, clickRate: 50 }
      },
      dailyStats: [
        { date: '2023-11-15', sent: 25, read: 18, click: 9 },
        { date: '2023-11-14', sent: 30, read: 20, click: 11 },
        { date: '2023-11-13', sent: 22, read: 15, click: 7 },
        { date: '2023-11-12', sent: 28, read: 19, click: 10 },
        { date: '2023-11-11', sent: 35, read: 23, click: 13 }
      ],
      monthlyStats: [
        { month: '2023-11', sent: 500, read: 350, click: 180 },
        { month: '2023-10', sent: 450, read: 300, click: 150 },
        { month: '2023-09', sent: 300, read: 200, click: 90 }
      ]
    }
  }
}

// 获取通知列表
const fetchNotificationList = async () => {
  notificationLoading.value = true
  try {
    const params = {
      page: notificationCurrentPage.value,
      pageSize: notificationPageSize.value,
      keyword: notificationSearchForm.keyword || undefined,
      type: notificationSearchForm.type || undefined,
      status: notificationSearchForm.status || undefined,
      priority: notificationSearchForm.priority || undefined
    }
    const response = await systemNotificationApi.getSystemNotifications(params)
    notificationList.value = response.list || []
    notificationTotal.value = response.total || 0
  } catch (error) {
    console.error('获取通知列表失败:', error)
    // 使用模拟数据作为后备
    notificationList.value = [
      {
        id: 1,
        title: '系统维护通知',
        content: '系统将于今晚进行维护，请提前做好准备',
        type: 'system',
        status: 'sent',
        priority: 'high',
        senderId: 1,
        senderName: '系统管理员',
        recipientGroups: ['所有用户'],
        recipientCount: 1256,
        sendMethods: ['email', 'in-app'],
        sendTime: '2023-11-15 14:30:22',
        createTime: '2023-11-15 10:00:00',
        updateTime: '2023-11-15 14:30:22',
        readCount: 856,
        clickCount: 423
      },
      {
        id: 2,
        title: '新功能上线公告',
        content: '我们很高兴地宣布，新功能已经上线，欢迎体验',
        type: 'announcement',
        status: 'sent',
        priority: 'normal',
        senderId: 2,
        senderName: '产品经理',
        recipientGroups: ['VIP用户'],
        recipientCount: 328,
        sendMethods: ['email', 'push'],
        sendTime: '2023-11-14 09:15:30',
        createTime: '2023-11-13 16:20:00',
        updateTime: '2023-11-14 09:15:30',
        readCount: 295,
        clickCount: 187
      },
      {
        id: 3,
        title: '账户安全提醒',
        content: '您的账户近期有异常登录，请及时检查',
        type: 'reminder',
        status: 'scheduled',
        priority: 'high',
        senderId: 1,
        senderName: '系统管理员',
        recipientGroups: ['高风险用户'],
        recipientCount: 45,
        sendMethods: ['email', 'sms'],
        sendTime: '2023-11-16 10:00:00',
        createTime: '2023-11-15 15:30:00',
        updateTime: '2023-11-15 15:30:00',
        readCount: 0,
        clickCount: 0
      }
    ]
    notificationTotal.value = notificationList.value.length
  } finally {
    notificationLoading.value = false
  }
}

// 获取模板列表
const fetchTemplateList = async () => {
  templateLoading.value = true
  try {
    const params = {
      page: templateCurrentPage.value,
      pageSize: templatePageSize.value,
      keyword: templateSearchForm.keyword || undefined,
      type: templateSearchForm.type || undefined,
      isActive: templateSearchForm.isActive !== undefined ? templateSearchForm.isActive : undefined
    }
    const response = await notificationTemplateApi.getNotificationTemplates(params)
    templateList.value = response.list || []
    templateTotal.value = response.total || 0
  } catch (error) {
    console.error('获取模板列表失败:', error)
    // 使用模拟数据作为后备
    templateList.value = [
      {
        id: 1,
        name: '系统维护模板',
        title: '系统维护通知 - {date}',
        content: '尊敬的用户，系统将于{time}进行维护，预计持续{duration}，请提前做好准备。如有疑问，请联系客服。',
        type: 'system',
        variables: ['date', 'time', 'duration'],
        isActive: true,
        usageCount: 12,
        createTime: '2023-10-15 10:00:00',
        updateTime: '2023-11-10 14:30:00'
      },
      {
        id: 2,
        name: '新功能上线模板',
        title: '新功能上线公告 - {featureName}',
        content: '亲爱的用户，我们很高兴地宣布，{featureName}功能已经上线！{description}欢迎体验并提供反馈。',
        type: 'announcement',
        variables: ['featureName', 'description'],
        isActive: true,
        usageCount: 8,
        createTime: '2023-09-20 09:30:00',
        updateTime: '2023-11-05 16:45:00'
      },
      {
        id: 3,
        name: '账户安全提醒模板',
        title: '账户安全提醒',
        content: '尊敬的用户，我们检测到您的账户在{location}有异常登录，如非本人操作，请立即修改密码并联系客服。',
        type: 'reminder',
        variables: ['location'],
        isActive: true,
        usageCount: 25,
        createTime: '2023-08-10 14:20:00',
        updateTime: '2023-11-12 11:15:00'
      }
    ]
    templateTotal.value = templateList.value.length
  } finally {
    templateLoading.value = false
  }
}

// 获取历史记录列表
const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const params = {
      page: historyCurrentPage.value,
      pageSize: historyPageSize.value,
      keyword: historySearchForm.keyword || undefined,
      type: historySearchForm.type || undefined,
      method: historySearchForm.method || undefined,
      status: historySearchForm.status || undefined,
      startDate: historySearchForm.dateRange?.[0] || undefined,
      endDate: historySearchForm.dateRange?.[1] || undefined
    }
    const response = await notificationHistoryApi.getNotificationHistory(params)
    historyList.value = response.list || []
    historyTotal.value = response.total || 0
  } catch (error) {
    console.error('获取历史记录失败:', error)
    // 使用模拟数据作为后备
    historyList.value = [
      {
        id: 1,
        notificationId: 1,
        notificationTitle: '系统维护通知',
        type: 'system',
        senderId: 1,
        senderName: '系统管理员',
        recipientGroup: '所有用户',
        recipientCount: 1256,
        sendMethod: 'email',
        status: 'sent',
        sendTime: '2023-11-15 14:30:22',
        readCount: 856,
        clickCount: 423
      },
      {
        id: 2,
        notificationId: 1,
        notificationTitle: '系统维护通知',
        type: 'system',
        senderId: 1,
        senderName: '系统管理员',
        recipientGroup: '所有用户',
        recipientCount: 1256,
        sendMethod: 'in-app',
        status: 'sent',
        sendTime: '2023-11-15 14:30:25',
        readCount: 1024,
        clickCount: 567
      },
      {
        id: 3,
        notificationId: 2,
        notificationTitle: '新功能上线公告',
        type: 'announcement',
        senderId: 2,
        senderName: '产品经理',
        recipientGroup: 'VIP用户',
        recipientCount: 328,
        sendMethod: 'email',
        status: 'sent',
        sendTime: '2023-11-14 09:15:30',
        readCount: 295,
        clickCount: 187
      }
    ]
    historyTotal.value = historyList.value.length
  } finally {
    historyLoading.value = false
  }
}

// 获取用户群体列表
const fetchUserGroupList = async () => {
  userGroupLoading.value = true
  try {
    const params = {
      page: userGroupCurrentPage.value,
      pageSize: userGroupPageSize.value,
      keyword: userGroupSearchForm.keyword || undefined,
      isActive: userGroupSearchForm.isActive !== undefined ? userGroupSearchForm.isActive : undefined
    }
    const response = await userGroupApi.getUserGroups(params)
    userGroupList.value = response.list || []
    userGroupTotal.value = response.total || 0
  } catch (error) {
    console.error('获取用户群体失败:', error)
    // 使用模拟数据作为后备
    userGroupList.value = [
      {
        id: 1,
        name: '所有用户',
        description: '系统中的所有用户',
        userCount: 2568,
        criteria: {
          userType: ['admin', 'user', 'vip', 'guest'],
          registerDateRange: [],
          lastActiveDateRange: [],
          tags: []
        },
        isActive: true,
        createTime: '2023-05-10 10:00:00',
        updateTime: '2023-11-01 14:30:00'
      },
      {
        id: 2,
        name: 'VIP用户',
        description: '系统中的VIP用户',
        userCount: 328,
        criteria: {
          userType: ['vip'],
          registerDateRange: [],
          lastActiveDateRange: [],
          tags: ['high-value']
        },
        isActive: true,
        createTime: '2023-05-15 14:20:00',
        updateTime: '2023-10-20 09:15:00'
      },
      {
        id: 3,
        name: '活跃用户',
        description: '最近30天内有登录的用户',
        userCount: 1256,
        criteria: {
          userType: ['user', 'vip'],
          registerDateRange: [],
          lastActiveDateRange: ['2023-10-15', '2023-11-15'],
          tags: ['active']
        },
        isActive: true,
        createTime: '2023-06-20 16:45:00',
        updateTime: '2023-11-05 11:30:00'
      }
    ]
    userGroupTotal.value = userGroupList.value.length
  } finally {
    userGroupLoading.value = false
  }
}

// 获取定时任务列表
const fetchTaskList = async () => {
  taskLoading.value = true
  try {
    const params = {
      page: taskCurrentPage.value,
      pageSize: taskPageSize.value,
      keyword: taskSearchForm.keyword || undefined,
      status: taskSearchForm.status || undefined,
      startDate: taskSearchForm.dateRange?.[0] || undefined,
      endDate: taskSearchForm.dateRange?.[1] || undefined
    }
    const response = await scheduledTaskApi.getScheduledTasks(params)
    taskList.value = response.list || []
    taskTotal.value = response.total || 0
  } catch (error) {
    console.error('获取定时任务失败:', error)
    // 使用模拟数据作为后备
    taskList.value = [
      {
        id: 1,
        name: '账户安全提醒任务',
        notificationId: 3,
        notificationTitle: '账户安全提醒',
        scheduledTime: '2023-11-16 10:00:00',
        status: 'pending',
        maxRetries: 3,
        retryCount: 0,
        createTime: '2023-11-15 15:30:00',
        updateTime: '2023-11-15 15:30:00',
        executeTime: null,
        errorMessage: null
      },
      {
        id: 2,
        name: '系统维护通知任务',
        notificationId: 1,
        notificationTitle: '系统维护通知',
        scheduledTime: '2023-11-14 20:00:00',
        status: 'completed',
        maxRetries: 3,
        retryCount: 0,
        createTime: '2023-11-13 16:20:00',
        updateTime: '2023-11-14 20:05:00',
        executeTime: '2023-11-14 20:00:15',
        errorMessage: null
      }
    ]
    taskTotal.value = taskList.value.length
  } finally {
    taskLoading.value = false
  }
}

// 获取通知选项
const fetchNotificationOptions = async () => {
  try {
    const response = await systemNotificationApi.getSystemNotifications({ pageSize: 100 })
    notificationOptions.value = response.list || []
  } catch (error) {
    console.error('获取通知选项失败:', error)
    // 使用模拟数据作为后备
    notificationOptions.value = [
      {
        id: 1,
        title: '系统维护通知',
        content: '系统将于今晚进行维护，请提前做好准备',
        type: 'system',
        status: 'sent',
        priority: 'high',
        senderId: 1,
        senderName: '系统管理员',
        recipientGroups: ['所有用户'],
        recipientCount: 1256,
        sendMethods: ['email', 'in-app'],
        sendTime: '2023-11-15 14:30:22',
        createTime: '2023-11-15 10:00:00',
        updateTime: '2023-11-15 14:30:22',
        readCount: 856,
        clickCount: 423
      },
      {
        id: 2,
        title: '新功能上线公告',
        content: '我们很高兴地宣布，新功能已经上线，欢迎体验',
        type: 'announcement',
        status: 'sent',
        priority: 'normal',
        senderId: 2,
        senderName: '产品经理',
        recipientGroups: ['VIP用户'],
        recipientCount: 328,
        sendMethods: ['email', 'push'],
        sendTime: '2023-11-14 09:15:30',
        createTime: '2023-11-13 16:20:00',
        updateTime: '2023-11-14 09:15:30',
        readCount: 295,
        clickCount: 187
      }
    ]
  }
}

// 获取通知类型文本
const getNotificationTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    system: '系统通知',
    announcement: '公告',
    reminder: '提醒',
    urgent: '紧急通知'
  }
  return typeMap[type] || type
}

// 获取通知类型标签类型
const getNotificationTypeTagType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    system: 'primary',
    announcement: 'success',
    reminder: 'warning',
    urgent: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const priorityMap: { [key: string]: string } = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
  }
  return priorityMap[priority] || priority
}

// 获取优先级标签类型
const getPriorityTagType = (priority: string) => {
  const priorityMap: { [key: string]: string } = {
    low: 'info',
    normal: 'primary',
    high: 'warning',
    urgent: 'danger'
  }
  return priorityMap[priority] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    draft: '草稿',
    scheduled: '已计划',
    sending: '发送中',
    sent: '已发送',
    failed: '发送失败'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: { [key: string]: string } = {
    draft: 'info',
    scheduled: 'warning',
    sending: 'primary',
    sent: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取发送方式文本
const getSendMethodText = (method: string) => {
  const methodMap: { [key: string]: string } = {
    email: '邮件',
    sms: '短信',
    'in-app': '站内信',
    push: '推送通知'
  }
  return methodMap[method] || method
}

// 获取历史状态文本
const getHistoryStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: '待发送',
    sending: '发送中',
    sent: '已发送',
    failed: '发送失败'
  }
  return statusMap[status] || status
}

// 获取历史状态标签类型
const getHistoryStatusTagType = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: 'info',
    sending: 'primary',
    sent: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取任务状态文本
const getTaskStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    failed: '执行失败',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取任务状态标签类型
const getTaskStatusTagType = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: 'info',
    running: 'primary',
    completed: 'success',
    failed: 'danger',
    cancelled: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取用户类型文本
const getUserTypeText = (userType: string) => {
  const userTypeMap: { [key: string]: string } = {
    admin: '管理员',
    user: '普通用户',
    vip: 'VIP用户',
    guest: '游客'
  }
  return userTypeMap[userType] || userType
}

// 处理标签页切换
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}

// 处理刷新
const handleRefresh = () => {
  refreshLoading.value = true
  Promise.all([
    fetchStats(),
    fetchNotificationList(),
    fetchTemplateList(),
    fetchHistoryList(),
    fetchUserGroupList(),
    fetchTaskList()
  ]).finally(() => {
    refreshLoading.value = false
  })
}

// 处理导出
const handleExport = async () => {
  exportLoading.value = true
  try {
    // 构建导出参数
    const exportParams = {
      keyword: notificationSearchForm.keyword || '',
      type: notificationSearchForm.type || '',
      status: notificationSearchForm.status || '',
      priority: notificationSearchForm.priority || ''
    }

    // 调用导出API
    const response = await systemNotificationApi.exportSystemNotifications(exportParams)
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `系统通知记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    exportLoading.value = false
  }
}

// 通知相关处理函数
const handleCreateNotification = () => {
  notificationDialogTitle.value = '创建通知'
  notificationDialogMode.value = 'create'
  Object.assign(notificationFormData, {
    id: undefined,
    title: '',
    content: '',
    type: 'system',
    priority: 'normal',
    recipientGroups: [],
    sendMethods: ['email'],
    isScheduled: false,
    scheduledTime: '',
    templateId: undefined
  })
  notificationDialogVisible.value = true
}

const handleViewNotification = (row: SystemNotification) => {
  Object.assign(notificationFormData, row)
  notificationDialogTitle.value = '查看通知'
  notificationDialogMode.value = 'view'
  notificationDialogVisible.value = true
}

const handleEditNotification = (row: SystemNotification) => {
  Object.assign(notificationFormData, row)
  notificationDialogTitle.value = '编辑通知'
  notificationDialogMode.value = 'edit'
  notificationDialogVisible.value = true
}

const handleSendNotification = async (row: SystemNotification) => {
  try {
    await systemNotificationApi.sendSystemNotification(row.id)
    ElMessage.success('发送成功')
    fetchNotificationList()
  } catch (error) {
    console.error('发送通知失败:', error)
    ElMessage.error('发送失败')
  }
}

const handleSaveNotification = async () => {
  submitLoading.value = true
  try {
    if (notificationFormData.id) {
      await systemNotificationApi.updateSystemNotification(notificationFormData.id, notificationFormData)
      ElMessage.success('更新成功')
    } else {
      await systemNotificationApi.createSystemNotification(notificationFormData)
      ElMessage.success('创建成功')
    }
    notificationDialogVisible.value = false
    fetchNotificationList()
  } catch (error) {
    console.error('保存通知失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSaveNotificationDraft = async () => {
  submitLoading.value = true
  try {
    await systemNotificationApi.createSystemNotification(notificationFormData)
    ElMessage.success('草稿保存成功')
    notificationDialogVisible.value = false
    fetchNotificationList()
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSaveAndSendNotification = async () => {
  submitLoading.value = true
  try {
    if (notificationFormData.id) {
      await systemNotificationApi.updateSystemNotification(notificationFormData.id, notificationFormData)
    } else {
      await systemNotificationApi.createSystemNotification(notificationFormData)
    }
    
    if (notificationFormData.scheduleEnabled) {
      await systemNotificationApi.scheduleSystemNotification(notificationFormData.id || notificationFormData.id)
      ElMessage.success('计划发送成功')
    } else {
      await systemNotificationApi.sendSystemNotification(notificationFormData.id || notificationFormData.id)
      ElMessage.success('发送成功')
    }
    
    notificationDialogVisible.value = false
    fetchNotificationList()
  } catch (error) {
    console.error('保存并发送失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleTemplateChange = (templateId: number) => {
  const template = templateList.value.find(t => t.id === templateId)
  if (template) {
    notificationFormData.title = template.title
    notificationFormData.content = template.content
  }
}

const handleNotificationSearch = () => {
  notificationCurrentPage.value = 1
  fetchNotificationList()
}

const handleNotificationReset = () => {
  Object.assign(notificationSearchForm, {
    keyword: '',
    type: '',
    status: '',
    priority: ''
  })
  // 清除表单验证状态
  const form = document.querySelector('.notification-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleNotificationSizeChange = (size: number) => {
  notificationPageSize.value = size
  fetchNotificationList()
}

const handleNotificationCurrentChange = (page: number) => {
  notificationCurrentPage.value = page
  fetchNotificationList()
}

// 模板相关处理函数
const handleCreateTemplate = () => {
  templateDialogTitle.value = '创建模板'
  templateDialogMode.value = 'create'
  Object.assign(templateFormData, {
    id: undefined,
    name: '',
    title: '',
    content: '',
    type: 'system',
    variables: []
  })
  templateDialogVisible.value = true
}

const handleViewTemplate = (row: NotificationTemplate) => {
  Object.assign(templateFormData, row)
  templateDialogTitle.value = '查看模板'
  templateDialogMode.value = 'view'
  templateDialogVisible.value = true
}

const handleEditTemplate = (row: NotificationTemplate) => {
  Object.assign(templateFormData, row)
  templateDialogTitle.value = '编辑模板'
  templateDialogMode.value = 'edit'
  templateDialogVisible.value = true
}

const handleSaveTemplate = async () => {
  submitLoading.value = true
  try {
    if (templateFormData.id) {
      await notificationTemplateApi.updateNotificationTemplate(templateFormData.id, templateFormData)
      ElMessage.success('更新成功')
    } else {
      await notificationTemplateApi.createNotificationTemplate(templateFormData)
      ElMessage.success('创建成功')
    }
    templateDialogVisible.value = false
    fetchTemplateList()
  } catch (error) {
    console.error('保存模板失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleToggleTemplate = async (row: NotificationTemplate) => {
  try {
    await notificationTemplateApi.toggleNotificationTemplate(row.id, !row.isActive)
    ElMessage.success(`${row.isActive ? '禁用' : '启用'}成功`)
    fetchTemplateList()
  } catch (error) {
    console.error('切换模板状态失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleTemplateSearch = () => {
  templateCurrentPage.value = 1
  fetchTemplateList()
}

const handleTemplateReset = () => {
  Object.assign(templateSearchForm, {
    keyword: '',
    type: '',
    isActive: undefined
  })
  // 清除表单验证状态
  const form = document.querySelector('.template-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleTemplateSizeChange = (size: number) => {
  templatePageSize.value = size
  fetchTemplateList()
}

const handleTemplateCurrentChange = (page: number) => {
  templateCurrentPage.value = page
  fetchTemplateList()
}

// 模板变量相关处理函数
const removeTemplateVariable = (variable: string) => {
  const index = templateFormData.variables.indexOf(variable)
  if (index !== -1) {
    templateFormData.variables.splice(index, 1)
  }
}

const showVariableInput = () => {
  variableInputVisible.value = true
  nextTick(() => {
    variableInputRef.value?.focus()
  })
}

const handleVariableInputConfirm = () => {
  if (variableInputValue.value) {
    templateFormData.variables.push(variableInputValue.value)
  }
  variableInputVisible.value = false
  variableInputValue.value = ''
}

// 历史记录相关处理函数
const handleViewHistory = (row: NotificationHistory) => {
  // 设置发送历史表单数据
  Object.assign(historyFormData, row)
  historyDialogTitle.value = '查看发送历史'
  historyDialogMode.value = 'view'
  historyDialogVisible.value = true
}

const handleRetryHistory = async (row: NotificationHistory) => {
  try {
    await notificationHistoryApi.retryNotificationHistory(row.id)
    ElMessage.success('重试成功')
    fetchHistoryList()
  } catch (error) {
    console.error('重试失败:', error)
    ElMessage.error('重试失败')
  }
}

const handleExportHistory = async () => {
  try {
    // 构建导出参数
    const exportParams = {
      keyword: historySearchForm.keyword || '',
      type: historySearchForm.type || '',
      status: historySearchForm.status || '',
      method: historySearchForm.method || '',
      startDate: historySearchForm.dateRange?.[0] || '',
      endDate: historySearchForm.dateRange?.[1] || ''
    }

    // 调用导出历史记录API
    const response = await notificationHistoryApi.exportNotificationHistories(exportParams)
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `通知发送历史_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出历史记录失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

const handleHistorySearch = () => {
  historyCurrentPage.value = 1
  fetchHistoryList()
}

const handleHistoryReset = () => {
  Object.assign(historySearchForm, {
    keyword: '',
    type: '',
    method: '',
    status: '',
    dateRange: []
  })
  // 清除表单验证状态
  const form = document.querySelector('.history-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleHistorySizeChange = (size: number) => {
  historyPageSize.value = size
  fetchHistoryList()
}

const handleHistoryCurrentChange = (page: number) => {
  historyCurrentPage.value = page
  fetchHistoryList()
}

// 统计相关处理函数
const handleStatsSearch = () => {
  fetchStats()
}

const handleStatsReset = () => {
  Object.assign(statsSearchForm, {
    dateRange: [],
    type: '',
    method: ''
  })
  // 清除表单验证状态
  const form = document.querySelector('.stats-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

// 用户群体相关处理函数
const handleCreateUserGroup = () => {
  userGroupDialogTitle.value = '创建用户群体'
  userGroupDialogMode.value = 'create'
  Object.assign(userGroupFormData, {
    id: undefined,
    name: '',
    description: '',
    criteria: {
      userType: [],
      registerDateRange: [],
      lastActiveDateRange: [],
      tags: []
    }
  })
  userGroupDialogVisible.value = true
}

const handleViewUserGroup = (row: UserGroup) => {
  Object.assign(userGroupFormData, row)
  userGroupDialogTitle.value = '查看用户群体'
  userGroupDialogMode.value = 'view'
  userGroupDialogVisible.value = true
}

const handleEditUserGroup = (row: UserGroup) => {
  Object.assign(userGroupFormData, row)
  userGroupDialogTitle.value = '编辑用户群体'
  userGroupDialogMode.value = 'edit'
  userGroupDialogVisible.value = true
}

const handleSaveUserGroup = async () => {
  submitLoading.value = true
  try {
    if (userGroupFormData.id) {
      await userGroupApi.updateUserGroup(userGroupFormData.id, userGroupFormData)
      ElMessage.success('更新成功')
    } else {
      await userGroupApi.createUserGroup(userGroupFormData)
      ElMessage.success('创建成功')
    }
    userGroupDialogVisible.value = false
    fetchUserGroupList()
  } catch (error) {
    console.error('保存用户群体失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleToggleUserGroup = async (row: UserGroup) => {
  try {
    await userGroupApi.toggleUserGroup(row.id, !row.isActive)
    ElMessage.success(`${row.isActive ? '禁用' : '启用'}成功`)
    fetchUserGroupList()
  } catch (error) {
    console.error('切换用户群体状态失败:', error)
    ElMessage.error('操作失败')
  }
}

const handlePreviewUserGroup = async (row: UserGroup) => {
  userPreviewDialogVisible.value = true
  userPreviewLoading.value = true
  try {
    const response = await userGroupApi.previewUserGroup(row.id)
    userPreviewList.value = response.list || []
    userPreviewTotal.value = response.total || 0
  } catch (error) {
    console.error('预览用户群体失败:', error)
    // 使用模拟数据作为后备
    userPreviewList.value = [
      {
        id: 1,
        username: 'admin',
        realName: '管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        userType: 'admin',
        registerTime: '2023-01-01 10:00:00',
        lastActiveTime: '2023-11-15 14:30:00'
      },
      {
        id: 2,
        username: 'user001',
        realName: '用户001',
        email: 'user001@example.com',
        phone: '13800138001',
        userType: 'user',
        registerTime: '2023-02-15 09:30:00',
        lastActiveTime: '2023-11-14 16:20:00'
      }
    ]
    userPreviewTotal.value = userPreviewList.value.length
  } finally {
    userPreviewLoading.value = false
  }
}

const handlePreviewUserGroupSave = async () => {
  userPreviewLoading.value = true
  try {
    const response = await userGroupApi.previewUserGroupByCriteria(userGroupFormData.criteria)
    userPreviewList.value = response.list || []
    userPreviewTotal.value = response.total || 0
  } catch (error) {
    console.error('预览用户群体失败:', error)
    // 使用模拟数据作为后备
    userPreviewList.value = [
      {
        id: 1,
        username: 'admin',
        realName: '管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        userType: 'admin',
        registerTime: '2023-01-01 10:00:00',
        lastActiveTime: '2023-11-15 14:30:00'
      },
      {
        id: 2,
        username: 'user001',
        realName: '用户001',
        email: 'user001@example.com',
        phone: '13800138001',
        userType: 'user',
        registerTime: '2023-02-15 09:30:00',
        lastActiveTime: '2023-11-14 16:20:00'
      }
    ]
    userPreviewTotal.value = userPreviewList.value.length
  } finally {
    userPreviewLoading.value = false
  }
}

const handleUserGroupSearch = () => {
  userGroupCurrentPage.value = 1
  fetchUserGroupList()
}

const handleUserGroupReset = () => {
  Object.assign(userGroupSearchForm, {
    keyword: '',
    isActive: undefined
  })
  // 清除表单验证状态
  const form = document.querySelector('.usergroup-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleUserGroupSizeChange = (size: number) => {
  userGroupPageSize.value = size
  fetchUserGroupList()
}

const handleUserGroupCurrentChange = (page: number) => {
  userGroupCurrentPage.value = page
  fetchUserGroupList()
}

const handleUserPreviewSizeChange = (size: number) => {
  userPreviewPageSize.value = size
  // 这里需要重新获取预览数据
}

const handleUserPreviewCurrentChange = (page: number) => {
  userPreviewCurrentPage.value = page
  // 这里需要重新获取预览数据
}

// 定时任务相关处理函数
const handleCreateTask = () => {
  taskDialogTitle.value = '创建定时任务'
  taskDialogMode.value = 'create'
  Object.assign(taskFormData, {
    id: undefined,
    name: '',
    notificationId: undefined,
    scheduledTime: '',
    maxRetries: 3
  })
  taskDialogVisible.value = true
  fetchNotificationOptions()
}

const handleViewTask = (row: ScheduledTask) => {
  Object.assign(taskFormData, row)
  taskDialogTitle.value = '查看定时任务'
  taskDialogMode.value = 'view'
  taskDialogVisible.value = true
  fetchNotificationOptions()
}

const handleEditTask = (row: ScheduledTask) => {
  Object.assign(taskFormData, row)
  taskDialogTitle.value = '编辑定时任务'
  taskDialogMode.value = 'edit'
  taskDialogVisible.value = true
  fetchNotificationOptions()
}

const handleSaveTask = async () => {
  submitLoading.value = true
  try {
    if (taskFormData.id) {
      await scheduledTaskApi.updateScheduledTask(taskFormData.id, taskFormData)
      ElMessage.success('更新成功')
    } else {
      await scheduledTaskApi.createScheduledTask(taskFormData)
      ElMessage.success('创建成功')
    }
    taskDialogVisible.value = false
    fetchTaskList()
  } catch (error) {
    console.error('保存定时任务失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleCancelTask = async (row: ScheduledTask) => {
  try {
    await scheduledTaskApi.cancelScheduledTask(row.id)
    ElMessage.success('取消成功')
    fetchTaskList()
  } catch (error) {
    console.error('取消任务失败:', error)
    ElMessage.error('取消失败')
  }
}

const handleRetryTask = async (row: ScheduledTask) => {
  try {
    await scheduledTaskApi.retryScheduledTask(row.id)
    ElMessage.success('重试成功')
    fetchTaskList()
  } catch (error) {
    console.error('重试任务失败:', error)
    ElMessage.error('重试失败')
  }
}

const handleExecuteTask = async (row: ScheduledTask) => {
  try {
    await scheduledTaskApi.executeScheduledTask(row.id)
    ElMessage.success('执行成功')
    fetchTaskList()
  } catch (error) {
    console.error('执行任务失败:', error)
    ElMessage.error('执行失败')
  }
}

const handleTaskSearch = () => {
  taskCurrentPage.value = 1
  fetchTaskList()
}

const handleTaskReset = () => {
  Object.assign(taskSearchForm, {
    keyword: '',
    status: '',
    dateRange: []
  })
  // 清除表单验证状态
  const form = document.querySelector('.task-search-form .el-form')
  if (form) {
    const elFormInstance = (form as any).__vueParentComponent?.ctx?.$.setupState
    if (elFormInstance && elFormInstance.validate) {
      elFormInstance.clearValidate()
    }
  }
}

const handleTaskSizeChange = (size: number) => {
  taskPageSize.value = size
  fetchTaskList()
}

const handleTaskCurrentChange = (page: number) => {
  taskCurrentPage.value = page
  fetchTaskList()
}

// 初始化
onMounted(() => {
  fetchStats()
  fetchNotificationList()
  fetchTemplateList()
  fetchHistoryList()
  fetchUserGroupList()
  fetchTaskList()
})
</script>

<style scoped>
.system-notification-container {
  padding: 20px;
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
  height: 100px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: white;
}

.bg-primary {
  background-color: #409eff;
}

.bg-success {
  background-color: #67c23a;
}

.bg-warning {
  background-color: #e6a23c;
}

.bg-danger {
  background-color: #f56c6c;
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
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.tab-content {
  padding: 20px 0;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>