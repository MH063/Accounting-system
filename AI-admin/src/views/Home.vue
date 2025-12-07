<template>
  <div class="home">
    <div class="dashboard">
      <!-- 系统统计卡片（页眉4个卡片样式） -->
      <div style="text-align: right; margin-bottom: 10px;">
        <el-button size="small" @click="refreshSystemStats">刷新</el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">用户总数</div>
                <div class="stat-value">{{ systemStats.users || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><House /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">寝室总数</div>
                <div class="stat-value">{{ systemStats.dormitories || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Coin /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">费用记录</div>
                <div class="stat-value">{{ systemStats.feeRecords || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><CreditCard /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">支付记录</div>
                <div class="stat-value">{{ systemStats.payments || 0 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 新增系统统计（页眉处的额外统计信息） -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">本周新增用户</div>
                <div class="stat-value">42</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Coin /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">本月费用总额</div>
                <div class="stat-value">¥125,680</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-warning">
                <el-icon size="24"><Monitor /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">今日访问量</div>
                <div class="stat-value">1,245</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><DataAnalysis /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">系统可用率</div>
                <div class="stat-value">99.98%</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 系统组件状态 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>系统组件状态</span>
                <div class="header-actions">
                  <el-button size="small" @click="refreshSystemStatus">刷新</el-button>
                  <el-button size="small" @click="handleHealthCheck">健康检查</el-button>
                  <el-button size="small" @click="handleViewLogs">查看日志</el-button>
                </div>
              </div>
            </template>
            <div class="system-components">
              <el-tabs v-model="activeComponentTab">
                <el-tab-pane label="组件概览" name="overview">
                  <div style="text-align: right; margin-bottom: 10px;">
                    <el-button size="small" @click="refreshComponentOverview">刷新</el-button>
                  </div>
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <div class="component-item" @click="setActiveComponent('client')">
                        <div class="component-icon bg-success">
                          <el-icon size="24"><Monitor /></el-icon>
                        </div>
                        <div class="component-content">
                          <div class="component-title">客户端</div>
                          <div class="component-status">
                            <el-tag type="success">正常运行</el-tag>
                          </div>
                          <div class="component-info">在线用户: {{ clientStats.onlineUsers }}</div>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="component-item" @click="setActiveComponent('backend')">
                        <div class="component-icon bg-primary">
                          <el-icon size="24"><Setting /></el-icon>
                        </div>
                        <div class="component-content">
                          <div class="component-title">后端服务</div>
                          <div class="component-status">
                            <el-tag type="success">正常运行</el-tag>
                          </div>
                          <div class="component-info">API响应: {{ backendStats.apiResponseTime }}ms</div>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="component-item" @click="setActiveComponent('database')">
                        <div class="component-icon bg-info">
                          <el-icon size="24"><CoffeeCup /></el-icon>
                        </div>
                        <div class="component-content">
                          <div class="component-title">数据库</div>
                          <div class="component-status">
                            <el-tag type="success">正常运行</el-tag>
                          </div>
                          <div class="component-info">连接数: {{ databaseStats.connections }}</div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                  
                  <el-row :gutter="20" style="margin-top: 20px;">
                    <el-col :span="24">
                      <div class="system-overview">
                        <el-descriptions :column="3" border>
                          <el-descriptions-item label="系统版本">{{ systemInfo.version }}</el-descriptions-item>
                          <el-descriptions-item label="运行时长">{{ systemInfo.uptime }}</el-descriptions-item>
                          <el-descriptions-item label="部署环境">{{ systemInfo.environment }}</el-descriptions-item>
                          <el-descriptions-item label="客户端版本">{{ clientStats.version }}</el-descriptions-item>
                          <el-descriptions-item label="后端版本">{{ backendStats.version }}</el-descriptions-item>
                          <el-descriptions-item label="数据库版本">{{ databaseStats.version }}</el-descriptions-item>
                        </el-descriptions>
                      </div>
                    </el-col>
                  </el-row>
                  
                  <!-- 系统健康度评分 -->
                  <el-row :gutter="20" style="margin-top: 20px;">
                    <el-col :span="24">
                      <div class="health-score">
                        <div class="score-title">系统健康度评分</div>
                        <el-progress 
                          type="circle" 
                          :percentage="healthScore" 
                          :status="healthScore >= 90 ? 'success' : healthScore >= 70 ? 'warning' : 'exception'"
                          :width="120"
                        />
                        <div class="score-desc">{{ getHealthScoreDesc(healthScore) }}</div>
                      </div>
                    </el-col>
                  </el-row>
                </el-tab-pane>
                
                <el-tab-pane label="客户端详情" name="client">
                  <div class="component-detail">
                    <el-descriptions title="客户端状态详情" :column="2" border>
                      <el-descriptions-item label="版本号">{{ clientStats.version }}</el-descriptions-item>
                      <el-descriptions-item label="在线用户数">{{ clientStats.onlineUsers }}</el-descriptions-item>
                      <el-descriptions-item label="峰值用户数">{{ clientStats.peakUsers }}</el-descriptions-item>
                      <el-descriptions-item label="平均响应时间">{{ clientStats.avgResponseTime }}ms</el-descriptions-item>
                      <el-descriptions-item label="今日活跃用户">{{ clientStats.todayActiveUsers }}</el-descriptions-item>
                      <el-descriptions-item label="错误率">{{ clientStats.errorRate }}%</el-descriptions-item>
                      <el-descriptions-item label="最后更新">{{ clientStats.lastUpdate }}</el-descriptions-item>
                      <el-descriptions-item label="状态">
                        <el-tag type="success">正常运行</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                    
                    <div class="component-chart" style="margin-top: 20px;">
                      <div class="chart-title">24小时在线用户趋势</div>
                      <div id="clientChart" style="height: 200px;"></div>
                    </div>
                    
                    <!-- 客户端操作 -->
                    <div class="component-actions" style="margin-top: 20px;">
                      <el-button type="primary" @click="handleClientRestart">重启客户端服务</el-button>
                      <el-button @click="handleClientConfig">配置客户端</el-button>
                      <el-button @click="handleClientUpdate">更新客户端</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="后端详情" name="backend">
                  <div class="component-detail">
                    <el-descriptions title="后端服务详情" :column="2" border>
                      <el-descriptions-item label="版本号">{{ backendStats.version }}</el-descriptions-item>
                      <el-descriptions-item label="API响应时间">{{ backendStats.apiResponseTime }}ms</el-descriptions-item>
                      <el-descriptions-item label="QPS">{{ backendStats.qps }}</el-descriptions-item>
                      <el-descriptions-item label="内存使用率">{{ backendStats.memoryUsage }}%</el-descriptions-item>
                      <el-descriptions-item label="CPU使用率">{{ backendStats.cpuUsage }}%</el-descriptions-item>
                      <el-descriptions-item label="线程数">{{ backendStats.threadCount }}</el-descriptions-item>
                      <el-descriptions-item label="最后更新">{{ backendStats.lastUpdate }}</el-descriptions-item>
                      <el-descriptions-item label="状态">
                        <el-tag type="success">正常运行</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                    
                    <div class="component-chart" style="margin-top: 20px;">
                      <div class="chart-title">API响应时间趋势</div>
                      <div id="backendChart" style="height: 200px;"></div>
                    </div>
                    
                    <!-- 后端操作 -->
                    <div class="component-actions" style="margin-top: 20px;">
                      <el-button type="primary" @click="handleBackendRestart">重启后端服务</el-button>
                      <el-button @click="handleBackendConfig">配置后端服务</el-button>
                      <el-button @click="handleBackendUpdate">更新后端服务</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="数据库详情" name="database">
                  <div class="component-detail">
                    <el-descriptions title="数据库状态详情" :column="2" border>
                      <el-descriptions-item label="版本">{{ databaseStats.version }}</el-descriptions-item>
                      <el-descriptions-item label="当前连接数">{{ databaseStats.connections }}</el-descriptions-item>
                      <el-descriptions-item label="最大连接数">{{ databaseStats.maxConnections }}</el-descriptions-item>
                      <el-descriptions-item label="缓存命中率">{{ databaseStats.cacheHitRate }}%</el-descriptions-item>
                      <el-descriptions-item label="慢查询数">{{ databaseStats.slowQueries }}</el-descriptions-item>
                      <el-descriptions-item label="表空间使用">{{ databaseStats.tableSpaceUsage }}</el-descriptions-item>
                      <el-descriptions-item label="最后更新">{{ databaseStats.lastUpdate }}</el-descriptions-item>
                      <el-descriptions-item label="状态">
                        <el-tag type="success">正常运行</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                    
                    <div class="component-chart" style="margin-top: 20px;">
                      <div class="chart-title">数据库性能趋势</div>
                      <div id="databaseChart" style="height: 200px;"></div>
                    </div>
                    
                    <!-- 数据库操作 -->
                    <div class="component-actions" style="margin-top: 20px;">
                      <el-button type="primary" @click="handleDatabaseBackup">备份数据库</el-button>
                      <el-button @click="handleDatabaseOptimize">优化数据库</el-button>
                      <el-button @click="handleDatabaseRepair">修复数据库</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <!-- 新增系统监控标签页 -->
                <el-tab-pane label="系统监控" name="monitor">
                  <div class="monitor-detail">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-card>
                          <template #header>
                            <div class="card-header">
                              <span>告警信息</span>
                              <div class="header-actions">
                                <el-button size="small" @click="handleRefreshAlerts">刷新</el-button>
                                <el-button size="small" @click="handleExportAlerts">导出</el-button>
                                <el-button size="small" @click="handleClearAlerts">清空</el-button>
                              </div>
                            </div>
                          </template>
                          <el-table :data="alerts" style="width: 100%" max-height="300">
                            <el-table-column prop="level" label="级别" width="80">
                              <template #default="scope">
                                <el-tag :type="getAlertTagType(scope.row.level)">
                                  {{ scope.row.level }}
                                </el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column prop="content" label="内容" />
                            <el-table-column prop="time" label="时间" width="160" />
                          </el-table>
                        </el-card>
                      </el-col>
                      <el-col :span="12">
                        <el-card>
                          <template #header>
                            <div class="card-header">
                              <span>性能指标</span>
                              <el-button size="small" @click="refreshPerformanceMetrics">刷新</el-button>
                            </div>
                          </template>
                          <div class="performance-metrics">
                            <div class="metric-item">
                              <span class="metric-label">系统吞吐量:</span>
                              <span class="metric-value">{{ performanceMetrics.throughput }}/s</span>
                            </div>
                            <div class="metric-item">
                              <span class="metric-label">平均响应时间:</span>
                              <span class="metric-value">{{ performanceMetrics.avgResponseTime }}ms</span>
                            </div>
                            <div class="metric-item">
                              <span class="metric-label">错误率:</span>
                              <span class="metric-value">{{ performanceMetrics.errorRate }}%</span>
                            </div>
                            <div class="metric-item">
                              <span class="metric-label">并发用户数:</span>
                              <span class="metric-value">{{ performanceMetrics.concurrentUsers }}</span>
                            </div>
                          </div>
                        </el-card>
                      </el-col>
                    </el-row>
                    
                    <!-- 新增系统资源使用情况 -->
                    <el-row :gutter="20" style="margin-top: 20px;">
                      <el-col :span="24">
                        <el-card>
                          <template #header>
                            <div class="card-header">
                              <span>系统资源使用情况</span>
                              <el-button size="small" @click="refreshResourceUsage">刷新</el-button>
                            </div>
                          </template>
                          <el-row :gutter="20">
                            <el-col :span="8">
                              <div class="resource-item">
                                <div class="resource-title">CPU使用率</div>
                                <el-progress 
                                  type="circle" 
                                  :percentage="resourceUsage.cpu" 
                                  :status="resourceUsage.cpu > 80 ? 'exception' : resourceUsage.cpu > 60 ? 'warning' : ''"
                                  :width="100"
                                />
                                <div class="resource-value">{{ resourceUsage.cpu }}%</div>
                              </div>
                            </el-col>
                            <el-col :span="8">
                              <div class="resource-item">
                                <div class="resource-title">内存使用率</div>
                                <el-progress 
                                  type="circle" 
                                  :percentage="resourceUsage.memory" 
                                  :status="resourceUsage.memory > 80 ? 'exception' : resourceUsage.memory > 60 ? 'warning' : ''"
                                  :width="100"
                                />
                                <div class="resource-value">{{ resourceUsage.memory }}%</div>
                              </div>
                            </el-col>
                            <el-col :span="8">
                              <div class="resource-item">
                                <div class="resource-title">磁盘使用率</div>
                                <el-progress 
                                  type="circle" 
                                  :percentage="resourceUsage.disk" 
                                  :status="resourceUsage.disk > 80 ? 'exception' : resourceUsage.disk > 60 ? 'warning' : ''"
                                  :width="100"
                                />
                                <div class="resource-value">{{ resourceUsage.disk }}%</div>
                              </div>
                            </el-col>
                          </el-row>
                        </el-card>
                      </el-col>
                    </el-row>
                  </div>
                </el-tab-pane>
                
                <!-- 新增系统配置标签页 -->
                <el-tab-pane label="系统配置" name="config">
                  <div class="config-detail">
                    <el-card>
                      <template #header>
                        <div class="card-header">
                          <span>系统配置信息</span>
                          <div class="header-actions">
                            <el-button size="small" @click="handleEditConfig">编辑配置</el-button>
                            <el-button size="small" @click="refreshSystemConfig">刷新</el-button>
                          </div>
                        </div>
                      </template>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item label="系统名称">AI管理系统</el-descriptions-item>
                        <el-descriptions-item label="版本号">v2.1.0</el-descriptions-item>
                        <el-descriptions-item label="运行环境">生产环境</el-descriptions-item>
                        <el-descriptions-item label="部署时间">2023-11-01</el-descriptions-item>
                        <el-descriptions-item label="服务器地址">192.168.1.100</el-descriptions-item>
                        <el-descriptions-item label="端口号">8080</el-descriptions-item>
                        <el-descriptions-item label="数据库地址">192.168.1.200</el-descriptions-item>
                        <el-descriptions-item label="缓存服务器">Redis 192.168.1.201:6379</el-descriptions-item>
                        <el-descriptions-item label="日志级别">INFO</el-descriptions-item>
                        <el-descriptions-item label="最大连接数">1000</el-descriptions-item>
                        <el-descriptions-item label="超时时间">30秒</el-descriptions-item>
                        <el-descriptions-item label="备份策略">每日凌晨2点</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>安全配置</span>
                          <el-button size="small" @click="refreshSecurityConfig">刷新</el-button>
                        </div>
                      </template>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item label="SSL证书">已启用</el-descriptions-item>
                        <el-descriptions-item label="加密算法">AES-256</el-descriptions-item>
                        <el-descriptions-item label="会话超时">30分钟</el-descriptions-item>
                        <el-descriptions-item label="密码策略">必须包含大小写字母和数字</el-descriptions-item>
                        <el-descriptions-item label="登录失败次数">5次</el-descriptions-item>
                        <el-descriptions-item label="锁定时间">30分钟</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                  </div>
                </el-tab-pane>
                
                <!-- 新增系统维护标签页 -->
                <el-tab-pane label="系统维护" name="maintenance">
                  <div class="maintenance-detail">
                    <el-card>
                      <template #header>
                        <div class="card-header">
                          <span>维护计划</span>
                          <div class="header-actions">
                            <el-button size="small" @click="handleAddMaintenance">添加计划</el-button>
                            <el-button size="small" @click="refreshMaintenancePlans">刷新</el-button>
                          </div>
                        </div>
                      </template>
                      <el-table :data="maintenancePlans" style="width: 100%">
                        <el-table-column prop="name" label="计划名称" width="150"></el-table-column>
                        <el-table-column prop="schedule" label="执行时间" width="200"></el-table-column>
                        <el-table-column prop="status" label="状态" width="100">
                          <template #default="scope">
                            <el-tag :type="scope.row.status === '已执行' ? 'success' : scope.row.status === '进行中' ? 'warning' : 'info'">
                              {{ scope.row.status }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column prop="lastRun" label="上次执行" width="180"></el-table-column>
                        <el-table-column label="操作" width="150">
                          <template #default="scope">
                            <el-button size="small" @click="handleRunMaintenance(scope.row)">执行</el-button>
                            <el-button size="small" @click="handleEditMaintenance(scope.row)">编辑</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </el-card>
                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>系统清理</span>
                          <el-button size="small" @click="refreshSystemCleanup">刷新</el-button>
                        </div>
                      </template>
                      <div class="cleanup-actions">
                        <el-button @click="handleCleanupLogs">清理日志文件</el-button>
                        <el-button @click="handleCleanupTemp">清理临时文件</el-button>
                        <el-button @click="handleCleanupCache">清理缓存数据</el-button>
                        <el-button @click="handleOptimizeDatabase">优化数据库</el-button>
                      </div>
                    </el-card>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>实时监控</span>
                <el-button size="small" @click="refreshRealtimeData">刷新</el-button>
              </div>
            </template>
            <div class="realtime-monitor">
              <div class="monitor-item">
                <div class="monitor-label">今日支付成功</div>
                <div class="monitor-value text-success">{{ realtimeStats.todayPayments }}</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">今日异常操作</div>
                <div class="monitor-value text-danger">{{ realtimeStats.todayAbnormalOps }}</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">待处理通知</div>
                <div class="monitor-value text-warning">{{ realtimeStats.pendingNotifications }}</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">系统维护状态</div>
                <div class="monitor-value">
                  <el-tag :type="maintenanceStatus.type">{{ maintenanceStatus.text }}</el-tag>
                </div>
              </div>
              
              <!-- 系统资源使用情况 -->
              <div class="resource-usage" style="margin-top: 20px;">
                <div class="usage-title">资源使用情况</div>
                <div class="usage-item">
                  <span class="usage-label">CPU使用率</span>
                  <el-progress :percentage="resourceUsage.cpu" :stroke-width="10" :status="resourceUsage.cpu > 80 ? 'exception' : resourceUsage.cpu > 60 ? 'warning' : ''" />
                </div>
                <div class="usage-item">
                  <span class="usage-label">内存使用率</span>
                  <el-progress :percentage="resourceUsage.memory" :stroke-width="10" :status="resourceUsage.memory > 80 ? 'exception' : resourceUsage.memory > 60 ? 'warning' : ''" />
                </div>
                <div class="usage-item">
                  <span class="usage-label">磁盘使用率</span>
                  <el-progress :percentage="resourceUsage.disk" :stroke-width="10" :status="resourceUsage.disk > 80 ? 'exception' : resourceUsage.disk > 60 ? 'warning' : ''" />
                </div>
              </div>
              
              <!-- 系统状态概览 -->
              <div class="system-status-overview" style="margin-top: 20px;">
                <div class="status-title">系统状态概览</div>
                <div style="text-align: right; margin-bottom: 10px;">
                  <el-button size="small" @click="refreshSystemStatusOverview">刷新</el-button>
                </div>
                <div class="status-grid">
                  <div class="status-item">
                    <div class="status-label">客户端</div>
                    <div class="status-value">
                      <el-tag type="success">正常</el-tag>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-label">后端服务</div>
                    <div class="status-value">
                      <el-tag type="success">正常</el-tag>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-label">数据库</div>
                    <div class="status-value">
                      <el-tag type="success">正常</el-tag>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-label">网络</div>
                    <div class="status-value">
                      <el-tag type="success">正常</el-tag>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 快捷操作 -->
              <div class="quick-actions" style="margin-top: 20px;">
                <div class="actions-title">快捷操作</div>
                <div class="actions-grid">
                  <el-button size="small" @click="handleBackup">备份数据</el-button>
                  <el-button size="small" @click="handleClearCache">清空缓存</el-button>
                  <el-button size="small" @click="handleRestart">重启服务</el-button>
                  <el-button size="small" @click="handleMaintenance">维护模式</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { User, House, Coin, CreditCard, Monitor, Setting, CoffeeCup, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

// 响应式数据
const activeComponentTab = ref('overview')

const systemStats = ref({
  users: 1245,
  dormitories: 128,
  feeRecords: 3420,
  payments: 2980
})

const systemInfo = ref({
  version: 'v2.1.0',
  uptime: '15天 4小时 25分钟',
  environment: '生产环境',
  startTime: '2023-11-01 08:30:15'
})

const clientStats = ref({
  version: 'v1.5.2',
  onlineUsers: 245,
  peakUsers: 320,
  avgResponseTime: 45,
  todayActiveUsers: 892,
  errorRate: 0.2,
  lastUpdate: '2023-11-15 14:30:22'
})

const backendStats = ref({
  version: 'v2.1.0',
  apiResponseTime: 42,
  qps: 120,
  memoryUsage: 65,
  cpuUsage: 32,
  threadCount: 48,
  lastUpdate: '2023-11-15 14:30:22'
})

const databaseStats = ref({
  version: 'MySQL 8.0',
  connections: 18,
  maxConnections: 100,
  cacheHitRate: 98.5,
  slowQueries: 2,
  tableSpaceUsage: '45GB/100GB',
  lastUpdate: '2023-11-15 14:30:22'
})

const realtimeStats = ref({
  todayPayments: 126,
  todayAbnormalOps: 3,
  pendingNotifications: 8
})

const maintenanceStatus = ref({
  type: 'success',
  text: '正常运行'
})

// 系统健康度评分
const healthScore = ref(92)

// 告警信息
const alerts = ref([
  {
    level: 'INFO',
    content: '系统备份任务执行成功',
    time: '2023-11-15 02:05:45'
  },
  {
    level: 'WARNING',
    content: '数据库连接数接近上限',
    time: '2023-11-15 14:20:12'
  },
  {
    level: 'INFO',
    content: '客户端版本更新完成',
    time: '2023-11-15 10:30:22'
  }
])

// 性能指标
const performanceMetrics = ref({
  throughput: 1200,
  avgResponseTime: 42,
  errorRate: 0.15,
  concurrentUsers: 245
})

// 资源使用情况
const resourceUsage = ref({
  cpu: 32,
  memory: 65,
  disk: 45
})

// 维护计划
const maintenancePlans = ref([
  {
    id: 1,
    name: '每日备份',
    schedule: '每天 02:00',
    status: '已执行',
    lastRun: '2023-11-15 02:05:45',
    timerId: null as NodeJS.Timeout | null
  },
  {
    id: 2,
    name: '每周优化',
    schedule: '每周一 03:00',
    status: '待执行',
    lastRun: '2023-11-13 03:15:22',
    timerId: null as NodeJS.Timeout | null
  },
  {
    id: 3,
    name: '每月统计',
    schedule: '每月1日 04:00',
    status: '待执行',
    lastRun: '2023-11-01 04:22:18',
    timerId: null as NodeJS.Timeout | null
  }
])

// 系统配置信息
const systemConfig = ref({
  name: 'AI管理系统',
  version: 'v2.1.0',
  environment: '生产环境',
  deployTime: '2023-11-01',
  serverAddress: '192.168.1.100',
  port: '8080',
  dbAddress: '192.168.1.200',
  cacheServer: 'Redis 192.168.1.201:6379',
  logLevel: 'INFO',
  maxConnections: '1000',
  timeout: '30秒',
  backupPolicy: '每日凌晨2点',
  lastUpdate: '2023-11-15 14:30:22'
})

// 安全配置信息
const securityConfig = ref({
  sslCertificate: '已启用',
  encryptionAlgorithm: 'AES-256',
  sessionTimeout: '30分钟',
  passwordPolicy: '必须包含大小写字母和数字',
  loginFailures: '5次',
  lockTime: '30分钟'
})

// 获取健康度评分描述
const getHealthScoreDesc = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '较差'
}

// 获取告警标签类型
const getAlertTagType = (level: string) => {
  switch (level) {
    case 'ERROR':
      return 'danger'
    case 'WARNING':
      return 'warning'
    case 'INFO':
      return 'info'
    default:
      return ''
  }
}

// 设置激活的组件
const setActiveComponent = (component: string) => {
  activeComponentTab.value = component
}

// 系统监控相关功能
const handleClearAlerts = () => {
  ElMessageBox.confirm(
    '确定要清空所有告警信息吗？',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    alerts.value = []
    ElMessage.success('告警信息已清空')
  }).catch(() => {
    ElMessage.info('已取消清空')
  })
}

const handleRefreshAlerts = () => {
  ElMessage.success('正在刷新告警信息...')
  // 模拟添加新的告警信息
  const newAlert = {
    id: alerts.value.length + 1,
    level: ['INFO', 'WARNING', 'ERROR'][Math.floor(Math.random() * 3)] as 'INFO' | 'WARNING' | 'ERROR',
    content: '模拟新增的告警信息',
    time: new Date().toLocaleString()
  }
  alerts.value.unshift(newAlert)
  ElMessage.success('告警信息刷新完成')
}

const handleExportAlerts = () => {
  ElMessage.success('正在导出告警信息...')
  setTimeout(() => {
    ElMessage.success('告警信息已导出')
  }, 1500)
}

// 刷新系统状态
const refreshSystemStatus = () => {
  ElMessage.success('系统状态刷新成功')
  // 模拟更新数据
  clientStats.value.onlineUsers = Math.floor(Math.random() * 100) + 200
  backendStats.value.apiResponseTime = Math.floor(Math.random() * 20) + 30
  databaseStats.value.connections = Math.floor(Math.random() * 10) + 15
  
  // 更新资源使用情况
  resourceUsage.value.cpu = Math.floor(Math.random() * 30) + 20
  resourceUsage.value.memory = Math.floor(Math.random() * 20) + 60
  resourceUsage.value.disk = Math.floor(Math.random() * 10) + 40
}

// 健康检查
const handleHealthCheck = () => {
  ElMessageBox.confirm(
    '确定要执行系统健康检查吗？这可能需要几分钟时间。',
    '健康检查确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.info('正在执行健康检查...')
    // 模拟健康检查过程
    setTimeout(() => {
      healthScore.value = Math.floor(Math.random() * 20) + 80
      ElMessage.success('健康检查完成，系统评分：' + healthScore.value)
    }, 2000)
  }).catch(() => {
    ElMessage.info('已取消健康检查')
  })
}

// 查看日志（虽然删除了系统日志标签页，但保留此函数以防其他地方引用）
const handleViewLogs = () => {
  ElMessage.info('系统日志功能已在其他模块实现')
}

// 编辑配置
const handleEditConfig = () => {
  ElMessageBox.confirm(
    '确定要编辑系统配置吗？',
    '编辑确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('打开系统配置编辑页面')
    // 这里可以跳转到配置编辑页面或者打开一个模态框进行编辑
  }).catch(() => {
    ElMessage.info('已取消编辑')
  })
}

// 刷新系统配置
const refreshSystemConfig = () => {
  ElMessage.success('系统配置刷新成功')
  // 模拟更新配置数据
  systemConfig.value.version = 'v' + (parseFloat(systemConfig.value.version.slice(1)) + 0.1).toFixed(1)
  systemConfig.value.lastUpdate = new Date().toLocaleString()
}

// 刷新安全配置
const refreshSecurityConfig = () => {
  ElMessage.success('安全配置刷新成功')
  // 模拟更新安全配置数据
  securityConfig.value.sslCertificate = securityConfig.value.sslCertificate === '已启用' ? '已启用' : '已启用'
}

// 刷新系统清理
const refreshSystemCleanup = () => {
  ElMessage.success('系统清理信息刷新成功')
  // 模拟更新清理信息
}

// 刷新性能指标
const refreshPerformanceMetrics = () => {
  ElMessage.success('性能指标刷新成功')
  // 模拟更新性能指标数据
  performanceMetrics.value.throughput = Math.floor(Math.random() * 500) + 1000
  performanceMetrics.value.avgResponseTime = Math.floor(Math.random() * 20) + 30
  performanceMetrics.value.errorRate = parseFloat((Math.random() * 0.5).toFixed(2))
  performanceMetrics.value.concurrentUsers = Math.floor(Math.random() * 100) + 200
}

// 刷新资源使用情况
const refreshResourceUsage = () => {
  ElMessage.success('资源使用情况刷新成功')
  // 模拟更新资源使用情况数据
  resourceUsage.value.cpu = Math.floor(Math.random() * 50) + 10
  resourceUsage.value.memory = Math.floor(Math.random() * 50) + 30
  resourceUsage.value.disk = Math.floor(Math.random() * 50) + 20
}

// 刷新系统状态概览
const refreshSystemStatusOverview = () => {
  ElMessage.success('系统状态概览刷新成功')
  // 模拟更新系统状态概览数据
}

// 刷新组件概览
const refreshComponentOverview = () => {
  ElMessage.success('组件概览刷新成功')
  // 模拟更新组件概览数据
  clientStats.value.onlineUsers = Math.floor(Math.random() * 100) + 200
  backendStats.value.apiResponseTime = Math.floor(Math.random() * 20) + 30
  databaseStats.value.connections = Math.floor(Math.random() * 10) + 15
}

// 添加维护计划
const handleAddMaintenance = () => {
  ElMessageBox.prompt('请输入维护计划名称', '添加维护计划', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{1,50}$/,
    inputErrorMessage: '计划名称不能为空且不超过50个字符'
  }).then(({ value }) => {
    // 添加新的维护计划
    const newPlan = {
      id: maintenancePlans.value.length + 1,
      name: value,
      schedule: '待设置',
      status: '待执行',
      lastRun: '',
      timerId: null as NodeJS.Timeout | null
    }
    maintenancePlans.value.push(newPlan)
    ElMessage.success('维护计划添加成功')
  }).catch(() => {
    ElMessage.info('已取消添加')
  })
}

// 执行维护任务
const handleRunMaintenance = (row: any) => {
  ElMessageBox.confirm(
    `确定要立即执行"${row.name}"维护任务吗？`,
    '执行确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`"${row.name}"维护任务已启动`)
    // 更新维护计划状态
    row.status = '进行中'
    setTimeout(() => {
      row.status = '已执行'
      row.lastRun = new Date().toLocaleString()
      ElMessage.success(`"${row.name}"维护任务执行完成`)
    }, 3000)
  }).catch(() => {
    ElMessage.info('已取消执行')
  })
}

// 编辑维护计划
const handleEditMaintenance = (row: any) => {
  ElMessageBox.prompt('请输入新的维护计划名称', '编辑维护计划', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.name,
    inputPattern: /^.{1,50}$/,
    inputErrorMessage: '计划名称不能为空且不超过50个字符'
  }).then(({ value }) => {
    row.name = value
    ElMessage.success('维护计划更新成功')
  }).catch(() => {
    ElMessage.info('已取消编辑')
  })
}

// 刷新维护计划
const refreshMaintenancePlans = () => {
  ElMessage.success('维护计划刷新成功')
  // 模拟更新维护计划数据
  maintenancePlans.value.forEach(plan => {
    // 随机更新一些状态
    if (plan.status === '待执行' && Math.random() > 0.7) {
      plan.status = '进行中'
      setTimeout(() => {
        plan.status = '已执行'
        plan.lastRun = new Date().toLocaleString()
      }, 2000)
    }
  })
}

// 清理日志文件
const handleCleanupLogs = () => {
  ElMessageBox.confirm(
    '确定要清理日志文件吗？这将删除30天前的日志。',
    '清理确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在清理日志文件...')
    setTimeout(() => {
      ElMessage.success('日志文件清理完成')
    }, 2000)
  }).catch(() => {
    ElMessage.info('已取消清理')
  })
}

// 清理临时文件
const handleCleanupTemp = () => {
  ElMessage.success('正在清理临时文件...')
  setTimeout(() => {
    ElMessage.success('临时文件清理完成')
  }, 1500)
}

// 清理缓存数据
const handleCleanupCache = () => {
  ElMessageBox.confirm(
    '确定要清理系统缓存数据吗？这将清除应用缓存以提高性能。',
    '清理缓存确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.info('正在清理缓存数据...')
    
    try {
      // 清空浏览器本地存储
      localStorage.clear()
      sessionStorage.clear()
      
      // 清空应用内的缓存数据
      // 重置资源使用情况
      resourceUsage.value.memory = Math.max(5, resourceUsage.value.memory - 25)
      
      // 清空其他可能的缓存数据
      // 这里可以添加更多特定于应用的缓存清除逻辑
      
      // 模拟清理缓存过程
      setTimeout(() => {
        ElMessage.success('缓存数据清理完成，内存使用率已降低')
      }, 1500)
    } catch (error) {
      console.error('清理缓存时出现错误:', error)
      ElMessage.error('清理缓存时出现错误: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消清理缓存')
  })
}

// 优化数据库
const handleOptimizeDatabase = () => {
  ElMessageBox.confirm(
    '确定要优化数据库吗？这可能会暂时影响系统性能。',
    '优化确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在优化数据库...')
    setTimeout(() => {
      ElMessage.success('数据库优化完成')
    }, 3000)
  }).catch(() => {
    ElMessage.info('已取消优化')
  })
}

// 数据库备份
const handleDatabaseBackup = () => {
  ElMessageBox.confirm(
    '确定要执行数据库备份吗？',
    '备份确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在执行数据库备份...')
    setTimeout(() => {
      ElMessage.success('数据库备份完成')
    }, 5000)
  }).catch(() => {
    ElMessage.info('已取消备份')
  })
}

// 数据库修复
const handleDatabaseRepair = () => {
  ElMessageBox.confirm(
    '确定要修复数据库吗？这可能会暂时影响系统性能。',
    '修复确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在修复数据库...')
    setTimeout(() => {
      ElMessage.success('数据库修复完成')
    }, 4000)
  }).catch(() => {
    ElMessage.info('已取消修复')
  })
}

// 后端服务重启
const handleBackendRestart = () => {
  ElMessageBox.confirm(
    '确定要重启后端服务吗？这可能会导致系统短暂不可用。',
    '重启确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在重启后端服务...')
    setTimeout(() => {
      ElMessage.success('后端服务重启完成')
    }, 3000)
  }).catch(() => {
    ElMessage.info('已取消重启')
  })
}

// 后端服务配置
const handleBackendConfig = () => {
  ElMessage.info('打开后端配置页面')
}

// 后端服务更新
const handleBackendUpdate = () => {
  ElMessage.success('正在检查后端服务更新...')
  setTimeout(() => {
    ElMessage.info('当前已是最新版本')
  }, 2000)
}

// 客户端重启
const handleClientRestart = () => {
  ElMessageBox.confirm(
    '确定要重启客户端服务吗？这可能会导致用户短暂断开连接。',
    '重启确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在重启客户端服务...')
    setTimeout(() => {
      ElMessage.success('客户端服务重启完成')
    }, 2500)
  }).catch(() => {
    ElMessage.info('已取消重启')
  })
}

// 客户端配置
const handleClientConfig = () => {
  ElMessage.info('打开客户端配置页面')
}

// 客户端更新
const handleClientUpdate = () => {
  ElMessage.success('正在检查客户端更新...')
  setTimeout(() => {
    ElMessage.info('当前已是最新版本')
  }, 2000)
}

// 数据库优化
const handleDatabaseOptimize = () => {
  ElMessageBox.confirm(
    '确定要优化数据库吗？这可能会暂时影响系统性能。',
    '优化确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('正在优化数据库...')
    setTimeout(() => {
      ElMessage.success('数据库优化完成')
    }, 3000)
  }).catch(() => {
    ElMessage.info('已取消优化')
  })
}

// 刷新实时数据
const refreshRealtimeData = () => {
  ElMessage.success('实时数据刷新成功')
  // 模拟更新数据
  realtimeStats.value.todayPayments = Math.floor(Math.random() * 20) + 120
  realtimeStats.value.todayAbnormalOps = Math.floor(Math.random() * 5)
  
  // 更新资源使用情况
  resourceUsage.value.cpu = Math.floor(Math.random() * 30) + 20
  resourceUsage.value.memory = Math.floor(Math.random() * 20) + 60
  resourceUsage.value.disk = Math.floor(Math.random() * 10) + 40
}

// 快捷操作
const handleBackup = async () => {
  ElMessageBox.confirm(
    '确定要执行系统备份吗？',
    '备份确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 尝试使用现代浏览器的文件系统API
      if ('showDirectoryPicker' in window) {
        ElMessage.info('请选择备份文件夹位置')
        try {
          // 请求用户选择目录
          const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite'
          })
          
          // 创建备份文件名
          const backupFileName = 'system_backup_' + new Date().toISOString().slice(0, 10) + '.zip'
          
          // 模拟备份过程
          ElMessage.info('正在执行系统备份...')
          setTimeout(() => {
            ElMessage.success(`系统备份完成，备份文件已保存到所选文件夹: ${dirHandle.name}/${backupFileName}`)
          }, 3000)
        } catch (err: any) {
          // 用户取消选择或权限拒绝
          if (err.name === 'AbortError') {
            ElMessage.info('已取消备份')
          } else {
            // 降级到默认下载方式
            fallbackBackupDownload()
          }
        }
      } else {
        // 浏览器不支持文件系统API，降级到默认下载方式
        fallbackBackupDownload()
      }
    } catch (error) {
      console.error('备份过程中出现错误:', error)
      ElMessage.error('备份过程中出现错误')
    }
  }).catch(() => {
    ElMessage.info('已取消备份')
  })
}

// 降级备份下载方法
const fallbackBackupDownload = () => {
  ElMessage.info('正在执行系统备份...')
  // 模拟备份过程
  setTimeout(() => {
    ElMessage.success('系统备份完成，备份文件已下载到默认下载目录')
    // 创建一个虚拟的下载链接
    const link = document.createElement('a')
    link.href = 'data:text/plain;charset=utf-8,系统备份文件内容'
    link.download = 'system_backup_' + new Date().toISOString().slice(0, 10) + '.zip'
    link.click()
  }, 3000)
}

const handleClearCache = () => {
  ElMessageBox.confirm(
    '确定要清空系统缓存吗？这可能会影响系统性能直到缓存重建完成。',
    '清空缓存确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.info('正在清空系统缓存...')
    
    try {
      // 清空浏览器本地存储
      localStorage.clear()
      sessionStorage.clear()
      
      // 清空应用内的缓存数据
      // 重置资源使用情况
      resourceUsage.value.memory = Math.max(10, resourceUsage.value.memory - 30)
      
      // 清空其他可能的缓存数据
      // 这里可以添加更多特定于应用的缓存清除逻辑
      
      // 模拟清空缓存过程
      setTimeout(() => {
        ElMessage.success('系统缓存已清空，内存使用率已降低')
        
        // 可选：刷新页面以确保所有缓存都被清除
        // window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('清空缓存时出现错误:', error)
      ElMessage.error('清空缓存时出现错误: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消清空缓存')
  })
}

const handleRestart = () => {
  ElMessageBox.confirm(
    '确定要重启系统服务吗？这将导致系统短暂不可用（预计2-3分钟）。',
    '重启确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.info('正在重启系统服务...')
    
    // 模拟向后端发送重启请求
    // 在实际项目中，这里应该是一个真实的API调用
    // 例如: axios.post('/api/system/restart')
    
    // 模拟网络请求延迟
    setTimeout(() => {
      // 模拟重启过程的不同阶段
      ElMessage.info('正在停止服务...')
      
      setTimeout(() => {
        ElMessage.info('正在启动服务...')
        
        setTimeout(() => {
          ElMessage.success('系统服务重启完成')
          // 重置一些系统状态
          maintenanceStatus.value.type = 'success'
          maintenanceStatus.value.text = '正常运行'
          
          // 更新系统运行时间
          const now = new Date()
          systemInfo.value.startTime = now.toLocaleString()
          systemInfo.value.uptime = '0天 0小时 0分钟'
          
          // 模拟更新一些系统指标
          resourceUsage.value.cpu = Math.floor(Math.random() * 20) + 10
          resourceUsage.value.memory = Math.floor(Math.random() * 30) + 20
        }, 1500)
      }, 1500)
    }, 1000)
  }).catch(() => {
    ElMessage.info('已取消重启')
  })
}

const handleMaintenance = () => {
  ElMessageBox.confirm(
    '确定要进入维护模式吗？这将使客户端用户在30分钟后无法使用系统，但不影响管理端。',
    '维护模式确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.info('系统正在进入维护模式...')
    
    // 设置维护状态
    maintenanceStatus.value.type = 'warning'
    maintenanceStatus.value.text = '维护准备中'
    
    // 模拟向后端发送维护请求
    // 在实际项目中，这里应该是一个真实的API调用
    // 例如: axios.post('/api/system/maintenance/start')
    
    // 30分钟后真正进入维护模式
    setTimeout(() => {
      ElMessage.warning('系统将在30分钟后进入维护模式，客户端用户将无法使用系统')
      
      // 更新维护状态
      maintenanceStatus.value.type = 'warning'
      maintenanceStatus.value.text = '30分钟后维护'
      
      // 30分钟后真正进入维护模式
      const maintenanceTimer = setTimeout(() => {
        // 真正进入维护模式
        maintenanceStatus.value.type = 'danger'
        maintenanceStatus.value.text = '系统维护中'
        
        // 显示维护通知
        ElNotification({
          title: '系统维护',
          message: '系统正在维护中，客户端用户暂时无法使用系统',
          type: 'warning',
          duration: 0 // 不自动关闭
        })
        
        // 在实际项目中，这里应该通知后端真正进入维护模式
        // 例如: axios.post('/api/system/maintenance/activate')
        
        ElMessage.success('系统已进入维护模式，客户端用户无法使用系统')
      }, 30 * 60 * 1000) // 30分钟
      
      // 将定时器ID保存到maintenancePlans中，以便后续可能取消
      const maintenancePlan = maintenancePlans.value.find(plan => plan.name === '临时维护任务')
      if (maintenancePlan) {
        maintenancePlan.timerId = maintenanceTimer
      } else {
        // 添加一个新的维护计划
        maintenancePlans.value.push({
          id: maintenancePlans.value.length + 1,
          name: '临时维护任务',
          schedule: '即时',
          status: '进行中',
          lastRun: new Date().toLocaleString(),
          timerId: maintenanceTimer
        })
      }
    }, 1000)
  }).catch(() => {
    ElMessage.info('已取消维护模式')
  })
}

// 刷新系统统计数据
const refreshSystemStats = () => {
  ElMessage.success('系统统计数据刷新成功')
  // 模拟更新统计数据
  systemStats.value.users = Math.floor(Math.random() * 2000) + 1000
  systemStats.value.dormitories = Math.floor(Math.random() * 200) + 100
  systemStats.value.feeRecords = Math.floor(Math.random() * 5000) + 3000
  systemStats.value.payments = Math.floor(Math.random() * 5000) + 3000
}

// 初始化图表
const initCharts = () => {
  // 客户端图表
  const clientChartDom = document.getElementById('clientChart')
  if (clientChartDom) {
    const clientChart = echarts.init(clientChartDom)
    clientChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [120, 132, 101, 134, 90, 230, 210],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    })
  }
  
  // 后端图表
  const backendChartDom = document.getElementById('backendChart')
  if (backendChartDom) {
    const backendChart = echarts.init(backendChartDom)
    backendChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [42, 38, 45, 40, 35, 48, 42],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    })
  }
  
  // 数据库图表
  const databaseChartDom = document.getElementById('databaseChart')
  if (databaseChartDom) {
    const databaseChart = echarts.init(databaseChartDom)
    databaseChart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [18, 22, 15, 19, 16, 24, 18],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    })
  }
}

// 组件挂载
onMounted(() => {
  console.log('🏠 首页组件加载完成，开始初始化...')
  initCharts()
})

/**
 * 首页组件
 * 展示系统概览信息和数据统计
 */
</script>

<style scoped>
.home {
  width: 100%;
}

.stat-card {
  margin-bottom: 20px;
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

.stat-icon.bg-primary {
  background-color: #409EFF;
}

.stat-icon.bg-success {
  background-color: #67C23A;
}

.stat-icon.bg-warning {
  background-color: #E6A23C;
}

.stat-icon.bg-info {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.system-components {
  padding: 10px 0;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 4px;
  background-color: #f5f7fa;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.component-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.component-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.component-icon.bg-success {
  background-color: #67C23A;
}

.component-icon.bg-primary {
  background-color: #409EFF;
}

.component-icon.bg-info {
  background-color: #909399;
}

.component-content {
  flex: 1;
}

.component-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.component-status {
  margin-bottom: 5px;
}

.component-info {
  font-size: 14px;
  color: #909399;
}

.system-overview {
  padding: 10px 0;
}

.health-score {
  text-align: center;
  padding: 20px 0;
}

.score-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
}

.score-desc {
  font-size: 14px;
  color: #606266;
  margin-top: 10px;
}

.component-detail {
  padding: 10px 0;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.component-actions {
  text-align: center;
}

.realtime-monitor {
  padding: 10px 0;
}

.monitor-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #EBEEF5;
}

.monitor-label {
  color: #606266;
}

.monitor-value {
  font-weight: bold;
}

.monitor-value.text-success {
  color: #67C23A;
}

.monitor-value.text-danger {
  color: #F56C6C;
}

.monitor-value.text-warning {
  color: #E6A23C;
}

.resource-usage {
  padding: 10px 0;
}

.usage-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.usage-item {
  margin-bottom: 15px;
}

.usage-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.performance-metrics {
  padding: 10px 0;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.metric-label {
  color: #606266;
}

.metric-value {
  font-weight: bold;
  color: #303133;
}

.resource-item {
  text-align: center;
  padding: 10px 0;
}

.resource-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.resource-value {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-top: 5px;
}

.logs-detail {
  padding: 10px 0;
}

.status-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.status-label {
  color: #606266;
}

.status-value {
  font-weight: bold;
}

.system-status-overview {
  padding: 10px 0;
}

.quick-actions {
  padding: 10px 0;
}

.actions-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.config-detail {
  padding: 10px 0;
}

.maintenance-detail {
  padding: 10px 0;
}

.cleanup-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
</style>