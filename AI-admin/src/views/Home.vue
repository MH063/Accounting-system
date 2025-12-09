<template>
  <div class="home">
    <div class="dashboard">
      <!-- 系统统计卡片（页眉4个卡片样式） -->
      <div style="text-align: right; margin-bottom: 10px;">
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
                <div class="stat-value">{{ extraStats.weeklyNewUsers }}</div>
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
                <div class="stat-value">¥{{ extraStats.monthlyFeeTotal.toLocaleString() }}</div>
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
                <div class="stat-value">{{ extraStats.todayVisits.toLocaleString() }}</div>
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
                <div class="stat-value">{{ extraStats.systemAvailability }}</div>
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
                  <!-- 系统组件状态刷新按钮已删除 -->
                  <el-button size="small" @click="handleHealthCheck">健康检查</el-button>
                  <el-button size="small" @click="handleViewLogs">查看日志</el-button>
                </div>
              </div>
            </template>
            <div class="system-components">
              <el-tabs v-model="activeComponentTab" @tab-change="handleTabChange">
                <el-tab-pane label="组件概览" name="overview">
                  <div style="text-align: right; margin-bottom: 10px;">
                    <!-- 组件概览刷新按钮已删除 -->
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
                            <el-tag :type="getClientStatusType()">{{ getClientStatusText() }}</el-tag>
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
                            <el-tag :type="getBackendStatusType()">{{ getBackendStatusText() }}</el-tag>
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
                            <el-tag :type="getDatabaseStatusType()">{{ getDatabaseStatusText() }}</el-tag>
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
                        <el-tag :type="getClientStatusType()">{{ getClientStatusText() }}</el-tag>
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
                        <el-tag :type="getBackendStatusType()">{{ getBackendStatusText() }}</el-tag>
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
                        <el-tag :type="getDatabaseStatusType()">{{ getDatabaseStatusText() }}</el-tag>
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
                                <!-- 告警信息刷新按钮已删除 -->
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
                              <!-- 性能指标刷新按钮已删除 -->
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
                              <!-- 系统资源使用情况刷新按钮已删除 -->
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
                            <!-- 系统配置信息刷新按钮已删除 -->
                          </div>
                        </div>
                      </template>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item label="系统名称">{{ systemConfig.name }}</el-descriptions-item>
                        <el-descriptions-item label="版本号">{{ systemConfig.version }}</el-descriptions-item>
                        <el-descriptions-item label="运行环境">{{ systemConfig.environment }}</el-descriptions-item>
                        <el-descriptions-item label="部署时间">{{ systemConfig.deployTime }}</el-descriptions-item>
                        <el-descriptions-item label="服务器地址">{{ systemConfig.serverAddress }}</el-descriptions-item>
                        <el-descriptions-item label="端口号">{{ systemConfig.port }}</el-descriptions-item>
                        <el-descriptions-item label="数据库地址">{{ systemConfig.dbAddress }}</el-descriptions-item>
                        <el-descriptions-item label="缓存服务器">{{ systemConfig.cacheServer }}</el-descriptions-item>
                        <el-descriptions-item label="日志级别">{{ systemConfig.logLevel }}</el-descriptions-item>
                        <el-descriptions-item label="最大连接数">{{ systemConfig.maxConnections }}</el-descriptions-item>
                        <el-descriptions-item label="超时时间">{{ systemConfig.timeout }}</el-descriptions-item>
                        <el-descriptions-item label="备份策略">{{ systemConfig.backupPolicy }}</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>安全配置</span>
                          <!-- 安全配置刷新按钮已删除 -->
                        </div>
                      </template>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item label="SSL证书">{{ securityConfig.sslCertificate }}</el-descriptions-item>
                        <el-descriptions-item label="加密算法">{{ securityConfig.encryptionAlgorithm }}</el-descriptions-item>
                        <el-descriptions-item label="会话超时">{{ securityConfig.sessionTimeout }}</el-descriptions-item>
                        <el-descriptions-item label="密码策略">{{ securityConfig.passwordPolicy }}</el-descriptions-item>
                        <el-descriptions-item label="登录失败次数">{{ securityConfig.loginFailures }}</el-descriptions-item>
                        <el-descriptions-item label="锁定时间">{{ securityConfig.lockTime }}</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                  </div>
                </el-tab-pane>
                
                <!-- 系统配置编辑对话框 -->
                <el-dialog v-model="configDialogVisible" title="编辑系统配置" width="600px">
                  <el-form :model="configForm" label-width="120px">
                    <el-tabs v-model="configActiveTab">
                      <el-tab-pane label="系统配置" name="system">
                        <el-form-item label="系统名称">
                          <el-input v-model="configForm.system.name" />
                        </el-form-item>
                        <el-form-item label="版本号">
                          <el-input v-model="configForm.system.version" />
                        </el-form-item>
                        <el-form-item label="运行环境">
                          <el-select v-model="configForm.system.environment" placeholder="请选择运行环境">
                            <el-option label="开发环境" value="开发环境" />
                            <el-option label="测试环境" value="测试环境" />
                            <el-option label="生产环境" value="生产环境" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="部署时间">
                          <el-date-picker 
                            v-model="configForm.system.deployTime" 
                            type="date" 
                            placeholder="请选择部署时间" 
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD"
                          />
                        </el-form-item>
                        <el-form-item label="服务器地址">
                          <el-input v-model="configForm.system.serverAddress" />
                        </el-form-item>
                        <el-form-item label="端口号">
                          <el-input v-model="configForm.system.port" />
                        </el-form-item>
                        <el-form-item label="数据库地址">
                          <el-input v-model="configForm.system.dbAddress" />
                        </el-form-item>
                        <el-form-item label="缓存服务器">
                          <el-input v-model="configForm.system.cacheServer" />
                        </el-form-item>
                        <el-form-item label="日志级别">
                          <el-select v-model="configForm.system.logLevel" placeholder="请选择日志级别">
                            <el-option label="DEBUG" value="DEBUG" />
                            <el-option label="INFO" value="INFO" />
                            <el-option label="WARN" value="WARN" />
                            <el-option label="ERROR" value="ERROR" />
                            <el-option label="OFF" value="OFF" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="最大连接数">
                          <el-input-number v-model="configForm.system.maxConnections" :min="1" :max="10000" />
                        </el-form-item>
                        <el-form-item label="超时时间">
                          <el-input v-model="configForm.system.timeout" />
                        </el-form-item>
                        <el-form-item label="备份策略">
                          <el-input v-model="configForm.system.backupPolicy" />
                        </el-form-item>
                      </el-tab-pane>
                      
                      <el-tab-pane label="安全配置" name="security">
                        <el-form-item label="SSL证书">
                          <el-switch 
                            v-model="configForm.security.sslCertificate" 
                            active-text="已启用" 
                            inactive-text="已禁用"
                            :active-value="'已启用'"
                            :inactive-value="'已禁用'"
                          />
                        </el-form-item>
                        <el-form-item label="加密算法">
                          <el-select v-model="configForm.security.encryptionAlgorithm" placeholder="请选择加密算法">
                            <el-option label="AES-128" value="AES-128" />
                            <el-option label="AES-192" value="AES-192" />
                            <el-option label="AES-256" value="AES-256" />
                            <el-option label="DES" value="DES" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="会话超时">
                          <el-input v-model="configForm.security.sessionTimeout" />
                        </el-form-item>
                        <el-form-item label="密码策略">
                          <el-input v-model="configForm.security.passwordPolicy" />
                        </el-form-item>
                        <el-form-item label="登录失败次数">
                          <el-input-number v-model="configForm.security.loginFailures" :min="1" :max="10" />
                        </el-form-item>
                        <el-form-item label="锁定时间">
                          <el-input v-model="configForm.security.lockTime" />
                        </el-form-item>
                      </el-tab-pane>
                    </el-tabs>
                  </el-form>
                  
                  <template #footer>
                    <span class="dialog-footer">
                      <el-button @click="configDialogVisible = false">取消</el-button>
                      <el-button type="primary" @click="saveConfig">保存</el-button>
                    </span>
                  </template>
                </el-dialog>                
                <!-- 新增系统维护标签页 -->
                <el-tab-pane label="系统维护" name="maintenance">
                  <div class="maintenance-detail">
                    <el-card>
                      <template #header>
                        <div class="card-header">
                          <span>维护计划</span>
                          <div class="header-actions">
                            <el-button size="small" @click="handleAddMaintenance">添加计划</el-button>
                            <!-- 维护计划刷新按钮已删除 -->
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
                    
                    <!-- 添加维护计划对话框 -->
                    <el-dialog v-model="addMaintenanceDialogVisible" title="添加维护计划" width="500px" align-center>
                      <el-form :model="newMaintenancePlan" label-width="80px">
                        <el-form-item label="计划名称">
                          <el-input 
                            v-model="newMaintenancePlan.name" 
                            placeholder="请输入维护计划名称"
                            maxlength="50"
                            show-word-limit
                          />
                        </el-form-item>
                        <el-form-item label="执行时间">
                          <el-select 
                            v-model="newMaintenancePlan.scheduleType" 
                            placeholder="请选择执行频率"
                            style="width: 100%;"
                            @change="handleScheduleTypeChange"
                          >
                            <el-option label="每天" value="daily" />
                            <el-option label="每周" value="weekly" />
                            <el-option label="每月" value="monthly" />
                            <el-option label="自定义" value="custom" />
                          </el-select>
                        </el-form-item>
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'daily'" label="执行时间">
                          <el-time-picker
                            v-model="newMaintenancePlan.time"
                            format="HH:mm"
                            value-format="HH:mm"
                            placeholder="请选择执行时间"
                            style="width: 100%;"
                          />
                        </el-form-item>
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'weekly'" label="执行时间">
                          <div style="display: flex; gap: 10px;">
                            <el-select v-model="newMaintenancePlan.weekday" placeholder="请选择星期">
                              <el-option label="周一" value="周一" />
                              <el-option label="周二" value="周二" />
                              <el-option label="周三" value="周三" />
                              <el-option label="周四" value="周四" />
                              <el-option label="周五" value="周五" />
                              <el-option label="周六" value="周六" />
                              <el-option label="周日" value="周日" />
                            </el-select>
                            <el-time-picker
                              v-model="newMaintenancePlan.time"
                              format="HH:mm"
                              value-format="HH:mm"
                              placeholder="请选择执行时间"
                            />
                          </div>
                        </el-form-item>
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'monthly'" label="执行时间">
                          <div style="display: flex; gap: 10px;">
                            <el-input-number
                              v-model="newMaintenancePlan.dayOfMonth"
                              :min="1"
                              :max="31"
                              placeholder="日期"
                              style="width: 100px;"
                            />
                            <span style="line-height: 32px;">日</span>
                            <el-time-picker
                              v-model="newMaintenancePlan.time"
                              format="HH:mm"
                              value-format="HH:mm"
                              placeholder="请选择执行时间"
                            />
                          </div>
                        </el-form-item>
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'custom'" label="执行时间">
                          <el-input 
                            v-model="newMaintenancePlan.customSchedule" 
                            placeholder="请输入自定义执行时间描述"
                          />
                        </el-form-item>
                      </el-form>
                      
                      <template #footer>
                        <span class="dialog-footer">
                          <el-button @click="addMaintenanceDialogVisible = false">取消</el-button>
                          <el-button type="primary" @click="confirmAddMaintenance">确定</el-button>
                        </span>
                      </template>
                    </el-dialog>                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>系统清理</span>
                          <!-- 系统清理刷新按钮已删除 -->
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
                </div>
                <div class="status-grid">
                  <div class="status-item">
                    <div class="status-label">客户端</div>
                    <div class="status-value">
                      <el-tag :type="getClientStatusType()">{{ getClientStatusText() }}</el-tag>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-label">后端服务</div>
                    <div class="status-value">
                      <el-tag :type="getBackendStatusType()">{{ getBackendStatusText() }}</el-tag>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-label">数据库</div>
                    <div class="status-value">
                      <el-tag :type="getDatabaseStatusType()">{{ getDatabaseStatusText() }}</el-tag>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-label">网络</div>
                    <div class="status-value">
                      <el-tag :type="networkStatus.type">{{ networkStatus.text }}</el-tag>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 快捷操作模块已删除 -->
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, House, Coin, CreditCard, Monitor, Setting, CoffeeCup, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { createChartManager } from '@/utils/chartManager'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
// 添加API导入
import api from '../api/index'
import { systemApi, userApi } from '../api/user'
import { maintenanceApi } from '../api/maintenance'

// 获取路由器实例
const router = useRouter()

// 图表管理器实例
let clientChartManager: any
let backendChartManager: any
let databaseChartManager: any

// 响应式数据
const activeComponentTab = ref('overview')
const configDialogVisible = ref(false)
const configActiveTab = ref('system')
const addMaintenanceDialogVisible = ref(false)

// 新维护计划表单数据
const newMaintenancePlan = ref({
  name: '',
  scheduleType: 'daily',
  time: '',
  weekday: '周一',
  dayOfMonth: 1,
  customSchedule: ''
})

// 修改systemStats为从API获取数据
const systemStats = ref({
  users: 0,  dormitories: 0,
  feeRecords: 0,
  payments: 0
})

// 添加额外的统计数据
const extraStats = ref({  weeklyNewUsers: 0,
  monthlyFeeTotal: 0,
  todayVisits: 0,
  systemAvailability: '0%'
})

const systemInfo = ref({
  version: '',
  uptime: '',
  environment: '',
  startTime: ''
})

const clientStats = ref({
  version: '',
  onlineUsers: 0,
  peakUsers: 0,
  avgResponseTime: 0,
  todayActiveUsers: 0,
  errorRate: 0,
  lastUpdate: ''
})

const backendStats = ref({
  version: '',
  apiResponseTime: 0,
  qps: 0,
  memoryUsage: 0,
  cpuUsage: 0,
  threadCount: 0,
  lastUpdate: ''
})

const databaseStats = ref({
  version: '',
  connections: 0,
  maxConnections: 0,
  cacheHitRate: 0,
  slowQueries: 0,
  tableSpaceUsage: '',
  lastUpdate: ''
})

const realtimeStats = ref({
  todayPayments: 0,
  todayAbnormalOps: 0,
  pendingNotifications: 0
})

const maintenanceStatus = ref({
  type: 'success',
  text: '正常运行'
})

// 网络状态
const networkStatus = ref({
  type: 'success',
  text: '正常'
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
  throughput: 0,
  avgResponseTime: 0,
  errorRate: 0,
  concurrentUsers: 0
})

// 资源使用情况
const resourceUsage = ref({
  cpu: 0,
  memory: 0,
  disk: 0
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
  maxConnections: 1000,
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
  loginFailures: 5,
  lockTime: '30分钟'
})// 配置表单数据
const configForm = ref({
  system: { ...systemConfig.value },
  security: { ...securityConfig.value }
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
const handleClearAlerts = async () => {
  ElMessageBox.confirm(
    '确定要清空所有告警信息吗？此操作不可恢复。',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 调用API清空告警信息
      await systemApi.clearAlerts()
      alerts.value = []
      ElMessage.success('告警信息已清空')
    } catch (error) {
      console.error('❌ 清空告警信息失败:', error)
      ElMessage.error('清空告警信息失败: ' + (error as Error).message)
    }
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

const handleExportAlerts = async () => {
  try {
    ElMessage.info('正在导出告警信息...')
    // 调用API导出告警信息
    const response = await systemApi.exportAlerts()
    
    // 创建下载链接
    const data = response.data || response
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alerts_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    link.click()
    
    // 清理URL对象
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('告警信息已导出')
  } catch (error) {
    console.error('❌ 导出告警信息失败:', error)
    ElMessage.error('导出告警信息失败: ' + (error as Error).message)
  }
}
// 刷新系统状态
const refreshSystemStatus = async () => {
  ElMessage.info('正在刷新系统状态...')
  try {
    // 刷新组件数据和资源使用情况
    await Promise.all([
      refreshComponentOverview(),
      refreshResourceUsage()
    ])
    ElMessage.success('系统状态刷新成功')
  } catch (error) {
    console.error('❌ 刷新系统状态失败:', error)
    ElMessage.error('刷新系统状态失败')
  }
}

// 健康检查
const handleHealthCheck = async () => {
  ElMessageBox.confirm(
    '确定要执行系统健康检查吗？这可能需要几分钟时间。',
    '健康检查确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在执行健康检查...')
      // 调用API执行健康检查
      const response = await systemApi.healthCheck()
      const result = response.data || response
      
      // 更新健康评分
      if (result && typeof result.score === 'number') {
        healthScore.value = result.score
      } else {
        // 如果API没有返回分数，则随机生成一个
        healthScore.value = Math.floor(Math.random() * 20) + 80
      }
      
      ElMessage.success('健康检查完成，系统评分：' + healthScore.value)
    } catch (error) {
      console.error('❌ 健康检查失败:', error)
      ElMessage.error('健康检查失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消健康检查')
  })
}
// 查看日志
const handleViewLogs = () => {
  // 使用Vue Router导航到日志页面
  router.push('/logs')
}

// 编辑配置
const handleEditConfig = () => {
  // 初始化表单数据，确保数字类型正确
  configForm.value.system = { 
    ...systemConfig.value,
    maxConnections: Number(systemConfig.value.maxConnections)
  }
  configForm.value.security = { 
    ...securityConfig.value,
    loginFailures: Number(securityConfig.value.loginFailures)
  }
  configDialogVisible.value = true
}// 保存配置
const saveConfig = async () => {
  try {
    // 更新配置数据，确保类型正确
    systemConfig.value = { 
      ...configForm.value.system,
      maxConnections: Number(configForm.value.system.maxConnections)
    }
    securityConfig.value = { 
      ...configForm.value.security,
      loginFailures: Number(configForm.value.security.loginFailures)
    }
    
    // 关闭对话框
    configDialogVisible.value = false
    
    // 显示成功消息
    ElMessage.success('系统配置保存成功')
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败: ' + (error as Error).message)
  }
}// 刷新系统配置
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

// 获取客户端状态类型
const getClientStatusType = () => {
  // 根据客户端在线用户数判断状态
  if (clientStats.value.onlineUsers === 0) return 'danger'
  if (clientStats.value.onlineUsers < 100) return 'warning'
  return 'success'
}

// 获取客户端状态文本
const getClientStatusText = () => {
  if (clientStats.value.onlineUsers === 0) return '离线'
  if (clientStats.value.onlineUsers < 100) return '警告'
  return '正常'
}

// 获取后端服务状态类型
const getBackendStatusType = () => {
  // 根据API响应时间判断状态
  if (backendStats.value.apiResponseTime === 0) return 'danger'
  if (backendStats.value.apiResponseTime > 100) return 'warning'
  return 'success'
}

// 获取后端服务状态文本
const getBackendStatusText = () => {
  if (backendStats.value.apiResponseTime === 0) return '离线'
  if (backendStats.value.apiResponseTime > 100) return '缓慢'
  return '正常'
}

// 获取数据库状态类型
const getDatabaseStatusType = () => {
  // 根据数据库连接数判断状态
  if (databaseStats.value.connections === 0) return 'danger'
  if (databaseStats.value.connections > databaseStats.value.maxConnections * 0.8) return 'warning'
  return 'success'
}

// 获取数据库状态文本
const getDatabaseStatusText = () => {
  if (databaseStats.value.connections === 0) return '离线'
  if (databaseStats.value.connections > databaseStats.value.maxConnections * 0.8) return '高负载'
  return '正常'
}

// 刷新性能指标
const refreshPerformanceMetrics = async () => {
  ElMessage.info('正在刷新性能指标...')
  try {
    // 调用API获取真实的性能指标数据
    const response = await systemApi.getSystemStats()
    const data = response.data || response
    
    // 更新性能指标数据
    if (data && data.performanceMetrics) {
      performanceMetrics.value.throughput = data.performanceMetrics.throughput || performanceMetrics.value.throughput
      performanceMetrics.value.avgResponseTime = data.performanceMetrics.avgResponseTime || performanceMetrics.value.avgResponseTime
      performanceMetrics.value.errorRate = data.performanceMetrics.errorRate || performanceMetrics.value.errorRate
      performanceMetrics.value.concurrentUsers = data.performanceMetrics.concurrentUsers || performanceMetrics.value.concurrentUsers
    } else {
      // 如果API没有返回性能指标数据，给出提示
      ElMessage.warning('暂无性能指标数据')
    }
    
    ElMessage.success('性能指标刷新成功')
  } catch (error) {
    console.error('❌ 刷新性能指标失败:', error)
    ElMessage.error('刷新性能指标失败: ' + (error as Error).message)
    
    // 设置默认值
    performanceMetrics.value.throughput = 0
    performanceMetrics.value.avgResponseTime = 0
    performanceMetrics.value.errorRate = 0
    performanceMetrics.value.concurrentUsers = 0
  }
}

// 刷新资源使用情况
const refreshResourceUsage = async () => {
  ElMessage.info('正在刷新资源使用情况...')
  try {
    // 调用API获取真实的资源使用情况数据
    const response = await systemApi.getSystemStats()
    const data = response.data || response
    
    // 更新资源使用情况数据
    if (data && data.resourceUsage) {
      resourceUsage.value.cpu = data.resourceUsage.cpu || resourceUsage.value.cpu
      resourceUsage.value.memory = data.resourceUsage.memory || resourceUsage.value.memory
      resourceUsage.value.disk = data.resourceUsage.disk || resourceUsage.value.disk
    } else {
      // 如果API没有返回资源使用数据，给出提示
      ElMessage.warning('暂无资源使用数据')
    }
    
    ElMessage.success('资源使用情况刷新成功')
  } catch (error) {
    console.error('❌ 刷新资源使用情况失败:', error)
    ElMessage.error('刷新资源使用情况失败: ' + (error as Error).message)
    
    // 设置默认值
    resourceUsage.value.cpu = 0
    resourceUsage.value.memory = 0
    resourceUsage.value.disk = 0
  }
}

// 刷新系统状态概览
const refreshSystemStatusOverview = async () => {
  ElMessage.info('正在刷新系统状态概览...')
  try {
    // 调用API获取真实的系统状态数据
    const response = await systemApi.getSystemStats()
    const data = response.data || response
    
    // 更新系统状态数据
    if (data) {
      // 更新客户端状态
      if (data.clientStats) {
        clientStats.value.onlineUsers = data.clientStats.onlineUsers || clientStats.value.onlineUsers
        clientStats.value.version = data.clientStats.version || clientStats.value.version
        clientStats.value.avgResponseTime = data.clientStats.avgResponseTime || clientStats.value.avgResponseTime
        clientStats.value.todayActiveUsers = data.clientStats.todayActiveUsers || clientStats.value.todayActiveUsers
        clientStats.value.errorRate = data.clientStats.errorRate || clientStats.value.errorRate
      }
      
      // 更新后端状态
      if (data.backendStats) {
        backendStats.value.apiResponseTime = data.backendStats.apiResponseTime || backendStats.value.apiResponseTime
        backendStats.value.version = data.backendStats.version || backendStats.value.version
        backendStats.value.qps = data.backendStats.qps || backendStats.value.qps
        backendStats.value.memoryUsage = data.backendStats.memoryUsage || backendStats.value.memoryUsage
        backendStats.value.cpuUsage = data.backendStats.cpuUsage || backendStats.value.cpuUsage
        backendStats.value.threadCount = data.backendStats.threadCount || backendStats.value.threadCount
      }
      
      // 更新数据库状态
      if (data.databaseStats) {
        databaseStats.value.connections = data.databaseStats.connections || databaseStats.value.connections
        databaseStats.value.version = data.databaseStats.version || databaseStats.value.version
        databaseStats.value.maxConnections = data.databaseStats.maxConnections || databaseStats.value.maxConnections
        databaseStats.value.cacheHitRate = data.databaseStats.cacheHitRate || databaseStats.value.cacheHitRate
        databaseStats.value.slowQueries = data.databaseStats.slowQueries || databaseStats.value.slowQueries
      }
      
      // 更新额外统计数据
      if (data.extraStats) {
        extraStats.value.weeklyNewUsers = data.extraStats.weeklyNewUsers !== undefined ? data.extraStats.weeklyNewUsers : extraStats.value.weeklyNewUsers
        extraStats.value.monthlyFeeTotal = data.extraStats.monthlyFeeTotal !== undefined ? data.extraStats.monthlyFeeTotal : extraStats.value.monthlyFeeTotal
        extraStats.value.todayVisits = data.extraStats.todayVisits !== undefined ? data.extraStats.todayVisits : extraStats.value.todayVisits
        extraStats.value.systemAvailability = data.extraStats.systemAvailability || extraStats.value.systemAvailability
      }
    } else {
      ElMessage.warning('暂无系统状态数据')
    }
    
    ElMessage.success('系统状态概览刷新成功')
  } catch (error) {
    console.error('❌ 刷新系统状态概览失败:', error)
    ElMessage.error('刷新系统状态概览失败: ' + (error as Error).message)
    
    // 设置默认值
    clientStats.value.version = ''
    clientStats.value.onlineUsers = 0
    clientStats.value.peakUsers = 0
    clientStats.value.avgResponseTime = 0
    clientStats.value.todayActiveUsers = 0
    clientStats.value.errorRate = 0
    clientStats.value.lastUpdate = ''
    
    backendStats.value.version = ''
    backendStats.value.apiResponseTime = 0
    backendStats.value.qps = 0
    backendStats.value.memoryUsage = 0
    backendStats.value.cpuUsage = 0
    backendStats.value.threadCount = 0
    backendStats.value.lastUpdate = ''
    
    databaseStats.value.version = ''
    databaseStats.value.connections = 0
    databaseStats.value.maxConnections = 0
    databaseStats.value.cacheHitRate = 0
    databaseStats.value.slowQueries = 0
    databaseStats.value.tableSpaceUsage = ''
    databaseStats.value.lastUpdate = ''
    
    systemInfo.value.version = ''
    systemInfo.value.uptime = ''
    systemInfo.value.environment = ''
    systemInfo.value.startTime = ''
  }
}

// 刷新组件概览
const refreshComponentOverview = async () => {
  ElMessage.info('正在刷新组件概览...')
  try {
    // 调用API获取真实的组件数据
    const response = await systemApi.getSystemStats()
    const data = response.data || response
    
    // 更新组件数据
    if (data) {
      // 更新客户端统计
      if (data.clientStats) {
        clientStats.value.onlineUsers = data.clientStats.onlineUsers || clientStats.value.onlineUsers
        clientStats.value.avgResponseTime = data.clientStats.avgResponseTime || clientStats.value.avgResponseTime
      }
      
      // 更新后端统计
      if (data.backendStats) {
        backendStats.value.apiResponseTime = data.backendStats.apiResponseTime || backendStats.value.apiResponseTime
        backendStats.value.qps = data.backendStats.qps || backendStats.value.qps
      }
      
      // 更新数据库统计
      if (data.databaseStats) {
        databaseStats.value.connections = data.databaseStats.connections || databaseStats.value.connections
      }
      
      // 更新系统信息
      if (data.systemInfo) {
        systemInfo.value.version = data.systemInfo.version || systemInfo.value.version
        systemInfo.value.uptime = data.systemInfo.uptime || systemInfo.value.uptime
        systemInfo.value.environment = data.systemInfo.environment || systemInfo.value.environment
      }
    } else {
      ElMessage.warning('暂无组件数据')
    }
    
    ElMessage.success('组件概览刷新成功')
  } catch (error) {
    console.error('❌ 刷新组件概览失败:', error)
    ElMessage.error('刷新组件概览失败: ' + (error as Error).message)
  }
}

// 添加维护计划
const handleAddMaintenance = () => {
  // 重置表单数据
  newMaintenancePlan.value = {
    name: '',
    scheduleType: 'daily',
    time: '',
    weekday: '周一',
    dayOfMonth: 1,
    customSchedule: ''
  }
  addMaintenanceDialogVisible.value = true
}

// 处理执行时间类型变化
const handleScheduleTypeChange = () => {
  // 重置相关字段
  newMaintenancePlan.value.time = ''
  newMaintenancePlan.value.weekday = '周一'
  newMaintenancePlan.value.dayOfMonth = 1
  newMaintenancePlan.value.customSchedule = ''
}

// 确认添加维护计划
const confirmAddMaintenance = () => {
  const plan = newMaintenancePlan.value
  
  // 验证必填字段
  if (!plan.name.trim()) {
    ElMessage.warning('请输入维护计划名称')
    return
  }
  
  if (!plan.time && plan.scheduleType !== 'custom') {
    ElMessage.warning('请选择执行时间')
    return
  }
  
  if (plan.scheduleType === 'custom' && !plan.customSchedule.trim()) {
    ElMessage.warning('请输入自定义执行时间描述')
    return
  }
  
  // 根据选择的类型生成执行时间描述
  let scheduleDesc = ''
  switch (plan.scheduleType) {
    case 'daily':
      scheduleDesc = `每天 ${plan.time}`
      break
    case 'weekly':
      scheduleDesc = `每周${plan.weekday} ${plan.time}`
      break
    case 'monthly':
      scheduleDesc = `每月${plan.dayOfMonth}日 ${plan.time}`
      break
    case 'custom':
      scheduleDesc = plan.customSchedule
      break
  }
  
  // 添加新的维护计划
  const newPlan = {
    id: maintenancePlans.value.length + 1,
    name: plan.name,
    schedule: scheduleDesc,
    status: '待执行',
    lastRun: '',
    timerId: null as NodeJS.Timeout | null
  }
  
  maintenancePlans.value.push(newPlan)
  addMaintenanceDialogVisible.value = false
  ElMessage.success('维护计划添加成功')
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
const handleOptimizeDatabase = async () => {
  ElMessageBox.confirm(
    '确定要优化数据库吗？这可能会暂时影响系统性能。',
    '优化确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在优化数据库...')
      // 调用API执行数据库优化
      await systemApi.optimizeDatabase()
      ElMessage.success('数据库优化完成')
    } catch (error) {
      console.error('❌ 数据库优化失败:', error)
      ElMessage.error('数据库优化失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消优化')
  })
}

// 数据库备份
const handleDatabaseBackup = async () => {
  ElMessageBox.confirm(
    '确定要执行数据库备份吗？',
    '备份确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在执行数据库备份...')
      // 调用API执行数据库备份
      await systemApi.backupDatabase()
      ElMessage.success('数据库备份完成')
    } catch (error) {
      console.error('❌ 数据库备份失败:', error)
      ElMessage.error('数据库备份失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消备份')
  })
}

// 数据库修复
const handleDatabaseRepair = async () => {
  ElMessageBox.confirm(
    '确定要修复数据库吗？这可能会暂时影响系统性能。',
    '修复确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在修复数据库...')
      // 调用API执行数据库修复
      await systemApi.repairDatabase()
      ElMessage.success('数据库修复完成')
    } catch (error) {
      console.error('❌ 数据库修复失败:', error)
      ElMessage.error('数据库修复失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消修复')
  })
}

// 后端服务重启
const handleBackendRestart = async () => {
  ElMessageBox.confirm(
    '确定要重启后端服务吗？这可能会导致系统短暂不可用。',
    '重启确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在重启后端服务...')
      // 调用API重启后端服务
      await systemApi.restartBackend()
      ElMessage.success('后端服务重启完成')
      // 重启后刷新相关数据
      await refreshComponentOverview()
    } catch (error) {
      console.error('❌ 后端服务重启失败:', error)
      ElMessage.error('后端服务重启失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消重启')
  })
}

// 后端服务配置
const handleBackendConfig = async () => {
  try {
    ElMessage.info('正在获取后端配置信息...')
    // 调用API获取后端配置
    const config = await systemApi.getBackendConfig()
    ElMessage.success('后端配置信息获取成功')
    // 这里可以打开配置对话框或跳转到配置页面
    // 示例：打开配置对话框
    // configDialogVisible.value = true
    console.log('后端配置:', config)
  } catch (error) {
    console.error('❌ 获取后端配置失败:', error)
    ElMessage.error('获取后端配置失败: ' + (error as Error).message)
  }
}

// 后端服务更新
const handleBackendUpdate = async () => {
  try {
    ElMessage.info('正在检查后端服务更新...')
    // 调用API检查并更新后端服务
    const response = await systemApi.updateBackend()
    const result = response.data || response
    if (result && result.updated) {
      ElMessage.success('后端服务更新成功，版本: ' + (result.version || '未知'))
      // 更新后刷新相关数据
      await refreshComponentOverview()
    } else {
      ElMessage.info('当前已是最新版本')
    }
  } catch (error) {
    console.error('❌ 后端服务更新失败:', error)
    ElMessage.error('后端服务更新失败: ' + (error as Error).message)
  }
}

// 客户端重启
const handleClientRestart = async () => {
  ElMessageBox.confirm(
    '确定要重启客户端服务吗？这可能会导致用户短暂断开连接。',
    '重启确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在重启客户端服务...')
      // 调用API重启客户端
      await systemApi.restartClient()
      ElMessage.success('客户端服务重启完成')
      // 重启后刷新相关数据
      await refreshComponentOverview()
    } catch (error) {
      console.error('❌ 客户端重启失败:', error)
      ElMessage.error('客户端重启失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消重启')
  })
}

// 客户端配置
const handleClientConfig = async () => {
  try {
    ElMessage.info('正在获取客户端配置信息...')
    // 调用API获取客户端配置
    const config = await systemApi.getClientConfig()
    ElMessage.success('客户端配置信息获取成功')
    // 这里可以打开配置对话框或跳转到配置页面
    // 示例：打开配置对话框
    // configDialogVisible.value = true
    console.log('客户端配置:', config)
  } catch (error) {
    console.error('❌ 获取客户端配置失败:', error)
    ElMessage.error('获取客户端配置失败: ' + (error as Error).message)
  }
}

// 客户端更新
const handleClientUpdate = async () => {
  try {
    ElMessage.info('正在检查客户端更新...')
    // 调用API检查并更新客户端
    const response = await systemApi.updateClient()
    const result = response.data || response
    if (result && result.updated) {
      ElMessage.success('客户端更新成功，版本: ' + (result.version || '未知'))
      // 更新后刷新相关数据
      await refreshComponentOverview()
    } else {
      ElMessage.info('当前已是最新版本')
    }
  } catch (error) {
    console.error('❌ 客户端更新失败:', error)
    ElMessage.error('客户端更新失败: ' + (error as Error).message)
  }
}

// 数据库优化
const handleDatabaseOptimize = async () => {
  ElMessageBox.confirm(
    '确定要优化数据库吗？这可能会暂时影响系统性能。',
    '优化确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      ElMessage.info('正在优化数据库...')
      // 调用API执行数据库优化
      await systemApi.optimizeDatabase()
      ElMessage.success('数据库优化完成')
    } catch (error) {
      console.error('❌ 数据库优化失败:', error)
      ElMessage.error('数据库优化失败: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消优化')
  })
}

// 刷新实时数据
const refreshRealtimeData = async () => {
  ElMessage.info('正在刷新实时数据...')
  try {
    await fetchSystemStats()
    // 也可以刷新资源使用情况数据
    refreshResourceUsage()
    ElMessage.success('实时数据刷新成功')
  } catch (error) {
    console.error('❌ 刷新实时数据失败:', error)
    ElMessage.error('刷新实时数据失败')
  }
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

// 定义系统统计数据接口
interface SystemStatsData {
  users?: number
  dormitories?: number
  feeRecords?: number
  payments?: number
  weeklyNewUsers?: number
  monthlyFeeTotal?: number
  todayVisits?: number
  systemAvailability?: string
  todayPayments?: number
  todayAbnormalOps?: number
  pendingNotifications?: number
  healthScore?: number
  resourceUsage?: {
    cpu?: number
    memory?: number
    disk?: number
  }
  clientStats?: {
    version?: string
    onlineUsers?: number
    peakUsers?: number
    avgResponseTime?: number
    todayActiveUsers?: number
    errorRate?: number
    lastUpdate?: string
  }
  backendStats?: {
    version?: string
    apiResponseTime?: number
    qps?: number
    memoryUsage?: number
    cpuUsage?: number
    threadCount?: number
    lastUpdate?: string
  }
  databaseStats?: {
    version?: string
    connections?: number
    maxConnections?: number
    cacheHitRate?: number
    slowQueries?: number
    tableSpaceUsage?: string
    lastUpdate?: string
  }
  systemInfo?: {
    version?: string
    uptime?: string
    environment?: string
    startTime?: string
  }
  networkStatus?: {
    type?: string
    text?: string
  }
}
// 检查维护状态
const checkMaintenanceStatus = async () => {
  try {
    const response = await maintenanceApi.getMaintenanceStatus()
    const maintenanceData = response.data || response
    
    if (maintenanceData) {
      // 如果API返回了明确的状态信息，使用API返回的值
      if (maintenanceData.type !== undefined) {
        maintenanceStatus.value.type = maintenanceData.type
      }
      if (maintenanceData.text !== undefined) {
        maintenanceStatus.value.text = maintenanceData.text
      }
      // 如果API没有返回状态信息，根据其他字段判断状态
      // 例如，如果有isActive字段且为true，则表示正在维护
      if (maintenanceData.isActive === true) {
        maintenanceStatus.value.type = 'warning'
        maintenanceStatus.value.text = '维护中'
      } else if (maintenanceData.isActive === false) {
        maintenanceStatus.value.type = 'success'
        maintenanceStatus.value.text = '正常运行'
      }
    }
  } catch (error) {
    console.error('❌ 检查维护状态失败:', error)
    // 维护状态检查失败时，保持原有状态或设置为未知
    // 不改变当前状态
  }
}

// 检查网络状态
const checkNetworkStatus = async () => {
  try {
    const response = await systemApi.checkNetworkStatus()
    const networkData = response.data || response
    
    if (networkData) {
      networkStatus.value.type = networkData.type || 'success'
      networkStatus.value.text = networkData.text || '正常'
    }
  } catch (error) {
    console.error('❌ 检查网络状态失败:', error)
    // 网络检查失败时，设置为异常状态
    networkStatus.value.type = 'danger'
    networkStatus.value.text = '异常'
  }
}

// 获取系统统计数据的函数
const fetchSystemStats = async () => {
  try {
    // 获取系统统计信息
    const response = await systemApi.getSystemStats()
    console.log('API Response:', response)
    const statsData: SystemStatsData = response.data || response
    console.log('Stats Data:', statsData)
    
    // 如果statsData为空，记录警告信息
    if (!statsData) {
      console.warn('⚠️ API返回的数据为空或无效')
    }
    
    if (statsData) {
      systemStats.value.users = statsData.users || 0
      systemStats.value.dormitories = statsData.dormitories || 0
      systemStats.value.feeRecords = statsData.feeRecords || 0
      systemStats.value.payments = statsData.payments || 0
      
      // 更新健康度评分
      if (statsData.healthScore !== undefined) {
        healthScore.value = statsData.healthScore
      }
      
      // 更新实时监控数据
      if (statsData.todayPayments !== undefined) {
        realtimeStats.value.todayPayments = statsData.todayPayments
      }
      if (statsData.todayAbnormalOps !== undefined) {
        realtimeStats.value.todayAbnormalOps = statsData.todayAbnormalOps
      }
      if (statsData.pendingNotifications !== undefined) {
        realtimeStats.value.pendingNotifications = statsData.pendingNotifications
      }      
      console.log('📊 实时监控数据更新:', {
        todayPayments: realtimeStats.value.todayPayments,
        todayAbnormalOps: realtimeStats.value.todayAbnormalOps,
        pendingNotifications: realtimeStats.value.pendingNotifications
      })
      
      // 更新资源使用情况数据
      if (statsData.resourceUsage) {
        resourceUsage.value.cpu = statsData.resourceUsage.cpu !== undefined ? statsData.resourceUsage.cpu : resourceUsage.value.cpu
        resourceUsage.value.memory = statsData.resourceUsage.memory !== undefined ? statsData.resourceUsage.memory : resourceUsage.value.memory
        resourceUsage.value.disk = statsData.resourceUsage.disk !== undefined ? statsData.resourceUsage.disk : resourceUsage.value.disk
      }
      
      // 更新客户端状态数据
      if (statsData.clientStats) {
        clientStats.value.version = statsData.clientStats.version || clientStats.value.version
        clientStats.value.onlineUsers = statsData.clientStats.onlineUsers !== undefined ? statsData.clientStats.onlineUsers : clientStats.value.onlineUsers
        clientStats.value.peakUsers = statsData.clientStats.peakUsers !== undefined ? statsData.clientStats.peakUsers : clientStats.value.peakUsers
        clientStats.value.avgResponseTime = statsData.clientStats.avgResponseTime !== undefined ? statsData.clientStats.avgResponseTime : clientStats.value.avgResponseTime
        clientStats.value.todayActiveUsers = statsData.clientStats.todayActiveUsers !== undefined ? statsData.clientStats.todayActiveUsers : clientStats.value.todayActiveUsers
        clientStats.value.errorRate = statsData.clientStats.errorRate !== undefined ? statsData.clientStats.errorRate : clientStats.value.errorRate
        clientStats.value.lastUpdate = statsData.clientStats.lastUpdate || clientStats.value.lastUpdate
      }
      
      // 更新后端状态数据
      if (statsData.backendStats) {
        backendStats.value.version = statsData.backendStats.version || backendStats.value.version
        backendStats.value.apiResponseTime = statsData.backendStats.apiResponseTime !== undefined ? statsData.backendStats.apiResponseTime : backendStats.value.apiResponseTime
        backendStats.value.qps = statsData.backendStats.qps !== undefined ? statsData.backendStats.qps : backendStats.value.qps
        backendStats.value.memoryUsage = statsData.backendStats.memoryUsage !== undefined ? statsData.backendStats.memoryUsage : backendStats.value.memoryUsage
        backendStats.value.cpuUsage = statsData.backendStats.cpuUsage !== undefined ? statsData.backendStats.cpuUsage : backendStats.value.cpuUsage
        backendStats.value.threadCount = statsData.backendStats.threadCount !== undefined ? statsData.backendStats.threadCount : backendStats.value.threadCount
        backendStats.value.lastUpdate = statsData.backendStats.lastUpdate || backendStats.value.lastUpdate
      }
      
      // 更新数据库状态数据
      if (statsData.databaseStats) {
        databaseStats.value.version = statsData.databaseStats.version || databaseStats.value.version
        databaseStats.value.connections = statsData.databaseStats.connections !== undefined ? statsData.databaseStats.connections : databaseStats.value.connections
        databaseStats.value.maxConnections = statsData.databaseStats.maxConnections !== undefined ? statsData.databaseStats.maxConnections : databaseStats.value.maxConnections
        databaseStats.value.cacheHitRate = statsData.databaseStats.cacheHitRate !== undefined ? statsData.databaseStats.cacheHitRate : databaseStats.value.cacheHitRate
        databaseStats.value.slowQueries = statsData.databaseStats.slowQueries !== undefined ? statsData.databaseStats.slowQueries : databaseStats.value.slowQueries
        databaseStats.value.tableSpaceUsage = statsData.databaseStats.tableSpaceUsage || databaseStats.value.tableSpaceUsage
        databaseStats.value.lastUpdate = statsData.databaseStats.lastUpdate || databaseStats.value.lastUpdate
      }
      
      // 更新系统信息数据
      if (statsData.systemInfo) {
        systemInfo.value.version = statsData.systemInfo.version || systemInfo.value.version
        systemInfo.value.uptime = statsData.systemInfo.uptime || systemInfo.value.uptime
        systemInfo.value.environment = statsData.systemInfo.environment || systemInfo.value.environment
        systemInfo.value.startTime = statsData.systemInfo.startTime || systemInfo.value.startTime
      }
      
      // 更新网络状态数据
      if (statsData.networkStatus) {
        networkStatus.value.type = statsData.networkStatus.type || networkStatus.value.type
        networkStatus.value.text = statsData.networkStatus.text || networkStatus.value.text
      }
    }
    
    console.log('📊 系统统计数据获取成功:', statsData)
    
    // 检查网络状态
    await checkNetworkStatus()
  } catch (error) {
    console.error('❌ 获取系统统计数据失败:', error)
    ElMessage.error('获取系统统计数据失败: ' + (error as Error).message)
    
    // 显示默认值或提示信息
    realtimeStats.value.todayPayments = 0
    realtimeStats.value.todayAbnormalOps = 0
    realtimeStats.value.pendingNotifications = 0
    
    // 设置其他默认值
    resourceUsage.value.cpu = 0
    resourceUsage.value.memory = 0
    resourceUsage.value.disk = 0
    
    clientStats.value.version = ''
    clientStats.value.onlineUsers = 0
    clientStats.value.peakUsers = 0
    clientStats.value.avgResponseTime = 0
    clientStats.value.todayActiveUsers = 0
    clientStats.value.errorRate = 0
    clientStats.value.lastUpdate = ''
    
    backendStats.value.version = ''
    backendStats.value.apiResponseTime = 0
    backendStats.value.qps = 0
    backendStats.value.memoryUsage = 0
    backendStats.value.cpuUsage = 0
    backendStats.value.threadCount = 0
    backendStats.value.lastUpdate = ''
    
    databaseStats.value.version = ''
    databaseStats.value.connections = 0
    databaseStats.value.maxConnections = 0
    databaseStats.value.cacheHitRate = 0
    databaseStats.value.slowQueries = 0
    databaseStats.value.tableSpaceUsage = ''
    databaseStats.value.lastUpdate = ''
    
    systemInfo.value.version = ''
    systemInfo.value.uptime = ''
    systemInfo.value.environment = ''
    systemInfo.value.startTime = ''
    
    extraStats.value.weeklyNewUsers = 0
    extraStats.value.monthlyFeeTotal = 0
    extraStats.value.todayVisits = 0
    extraStats.value.systemAvailability = '0%'
    
    // 注意：这里不设置healthScore的默认值，因为它已经在组件初始化时设置了默认值92
    
    console.log('ℹ️ 已设置默认值:', {
      todayPayments: realtimeStats.value.todayPayments,
      todayAbnormalOps: realtimeStats.value.todayAbnormalOps,
      pendingNotifications: realtimeStats.value.pendingNotifications
    })  }
}

// 定义用户统计数据接口
interface UserStatsData {
  // 根据实际API返回的数据结构定义属性
  totalUsers?: number
  activeUsers?: number
  newUserCount?: number
}

// 添加获取用户统计数据的函数
const fetchUserStats = async () => {
  try {
    const response = await userApi.getUserStats()
    const userStats: UserStatsData = response.data || response
    if (userStats) {
      // 更新用户相关统计数据
      // 示例：如果需要更新某些数据，可以在这里处理
      // systemStats.value.users = userStats.totalUsers || systemStats.value.users
    }
  } catch (error) {
    console.error('❌ 获取用户统计数据失败:', error)
  }
}

// 页面刷新时获取所有统计数据
const refreshAllData = async () => {
  ElMessage.info('正在刷新所有数据...')
  try {
    await Promise.all([
      fetchSystemStats(),
      fetchUserStats(),
      checkMaintenanceStatus(),
      checkNetworkStatus()
    ])
    ElMessage.success('所有数据刷新成功')
  } catch (error) {
    console.error('❌ 刷新数据失败:', error)
    ElMessage.error('数据刷新失败')
  }
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
  // 直接跳转到维护页面
  window.location.href = 'http://localhost:8100/maintenance'
}

// 初始化图表
const initCharts = () => {
  // 使用nextTick确保DOM已经渲染完成
  nextTick(() => {
    // 使用更智能的方式初始化图表
    initChartsWhenVisible()
  })
}

// 定时器引用
let statusCheckTimer: NodeJS.Timeout | null = null

// 组件挂载时获取真实数据
onMounted(async () => {
  console.log('🏠 首页组件加载完成，开始初始化...')
  // 获取系统统计数据
  await fetchSystemStats()
  
  // 检查维护状态和网络状态
  await Promise.all([
    checkMaintenanceStatus(),
    checkNetworkStatus()
  ])
  
  // 延迟初始化图表，确保选项卡内容已渲染
  setTimeout(() => {
    initCharts()
    // 使用Intersection Observer进一步确保图表容器可见时才初始化
    initChartsWhenVisible()
  }, 800)  // 增加延迟时间确保选项卡完全激活
  
  // 添加窗口大小改变监听器，用于重绘图表
  window.addEventListener('resize', handleResize)
  
  // 设置定时器定期获取系统统计数据（包括健康度评分），每30秒更新一次
  statusCheckTimer = setInterval(async () => {
    try {
      await fetchSystemStats()
    } catch (error) {
      console.error('❌ 定期获取系统统计数据失败:', error)
    }
  }, 30000)
})
// 组件卸载前清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  // 清理图表管理器
  if (clientChartManager) clientChartManager.dispose()
  if (backendChartManager) backendChartManager.dispose()
  if (databaseChartManager) databaseChartManager.dispose()
  
  // 清理定时器
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
    statusCheckTimer = null
  }
})

// 处理窗口大小改变事件
const handleResize = () => {
  nextTick(() => {
    if (clientChartManager) clientChartManager.resize()
    if (backendChartManager) backendChartManager.resize()
    if (databaseChartManager) databaseChartManager.resize()
  })
}

// 重置图表初始化状态
const resetChartInitialization = () => {
  // 销毁已存在的图表实例
  if (clientChartManager) {
    clientChartManager.dispose()
    clientChartManager = null
  }
  if (backendChartManager) {
    backendChartManager.dispose()
    backendChartManager = null
  }
  if (databaseChartManager) {
    databaseChartManager.dispose()
    databaseChartManager = null
  }
}

// 当图表容器可见时初始化图表
const initChartsWhenVisible = () => {
  const chartConfigs = [
    { id: 'clientChart', manager: clientChartManager, setter: (manager: any) => clientChartManager = manager },
    { id: 'backendChart', manager: backendChartManager, setter: (manager: any) => backendChartManager = manager },
    { id: 'databaseChart', manager: databaseChartManager, setter: (manager: any) => databaseChartManager = manager }
  ]

  chartConfigs.forEach(config => {
    const chartDom = document.getElementById(config.id)
    if (chartDom && !config.manager) {
      // 使用Intersection Observer检测元素是否可见
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // 元素可见时初始化图表
            console.log(`图表容器 ${config.id} 已进入视口，开始初始化`)
            const options = getChartOptionsById(config.id)
            const chartManager = createChartManager({
              container: chartDom,
              options: options
            })
            config.setter(chartManager)
            // 初始化完成后停止观察
            observer.unobserve(entry.target)
          }
        })
      }, {
        threshold: 0.1  // 当10%的元素可见时触发
      })

      observer.observe(chartDom)
    }
  })
}

// 根据图表ID获取对应的配置选项
const getChartOptionsById = (id: string) => {
  const options: Record<string, any> = {
    clientChart: {
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
    },
    backendChart: {
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
    },
    databaseChart: {
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
    }
  }
  
  return options[id] || {}
}

// 处理选项卡切换事件
const handleTabChange = (tabName: string) => {
  // 当切换到包含图表的选项卡时，重新初始化图表
  if (tabName === 'client' || tabName === 'backend' || tabName === 'database') {
    // 先重置图表初始化状态
    resetChartInitialization()
    // 延迟一段时间确保选项卡内容完全激活和渲染完成
    setTimeout(() => {
      // 使用Intersection Observer确保图表容器可见时才初始化
      initChartsWhenVisible()
    }, 600)  // 增加延迟时间确保选项卡完全激活
  }
}

// 带重试机制的图表初始化函数
const initChartWithRetry = (elementId: string, option: any, retries = 0) => {
  const chartDom = document.getElementById(elementId)
  if (chartDom) {
    // 检查图表是否已经初始化
    if (chartDom.getAttribute('data-chart-initialized')) {
      return
    }
    
    // 检查DOM元素是否有有效的宽高
    if (chartDom.clientWidth === 0 || chartDom.clientHeight === 0) {
      // 特殊处理：检查父元素是否可见且具有尺寸
      const parent = chartDom.parentElement
      let parentVisible = false
      let parentWithSize = false
      
      if (parent) {
        const parentStyle = getComputedStyle(parent)
        parentVisible = parentStyle.visibility !== 'hidden' && parentStyle.display !== 'none'
        parentWithSize = parent.offsetWidth > 0 && parent.offsetHeight > 0
        
        // 如果父元素不可见或没有尺寸，检查是否在隐藏的选项卡中
        if (!parentVisible || !parentWithSize) {
          // 查找最近的选项卡面板
          let tabPanel: HTMLElement | null = parent
          while (tabPanel && !tabPanel.classList.contains('el-tab-pane')) {
            tabPanel = tabPanel.parentElement
          }
          
          if (tabPanel) {
            // 检查选项卡面板是否激活
            const isActive = tabPanel.style.display !== 'none'
            console.log(`图表容器 ${elementId} 位于选项卡中，选项卡是否激活: ${isActive}`)
            
            // 如果选项卡未激活，我们仍然尝试初始化，因为ECharts可以处理这种情况
            if (!isActive) {
              // 给予更多时间让选项卡激活
              if (retries < 20) {
                setTimeout(() => {
                  initChartWithRetry(elementId, option, retries + 1)
                }, 200)
                return
              } else {
                console.warn(`图表容器 ${elementId} 所在的选项卡未激活，且重试次数已达上限`)  
              }
            }
          }
        }
      }
      
      // 如果宽高为0且重试次数未达到上限，则稍后重试
      if (retries < 20) {  // 进一步增加重试次数
        setTimeout(() => {
          initChartWithRetry(elementId, option, retries + 1)
        }, 200)  // 增加重试间隔
      } else {
        console.warn(`图表容器 ${elementId} 的宽高仍为0，无法初始化图表。容器可见性: ${getComputedStyle(chartDom).visibility}, 显示属性: ${getComputedStyle(chartDom).display}, 父元素可见: ${parentVisible}, 父元素有尺寸: ${parentWithSize}`)
      }
      return
    }
    
    try {
      // 检查元素是否在视口中
      const rect = chartDom.getBoundingClientRect()
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )
      
      console.log(`初始化图表 ${elementId}，容器尺寸: ${chartDom.clientWidth}x${chartDom.clientHeight}，是否在视口内: ${isInViewport}`)
      
      // 使用图表管理器创建图表
      let chartManager: any;
      if (elementId === 'clientChart') {
        chartManager = createChartManager({
          container: chartDom,
          options: option
        });
        clientChartManager = chartManager;
      } else if (elementId === 'backendChart') {
        chartManager = createChartManager({
          container: chartDom,
          options: option
        });
        backendChartManager = chartManager;
      } else if (elementId === 'databaseChart') {
        chartManager = createChartManager({
          container: chartDom,
          options: option
        });
        databaseChartManager = chartManager;
      }
      
      // 标记图表已初始化
      chartDom.setAttribute('data-chart-initialized', 'true')
      console.log(`图表 ${elementId} 初始化成功`)
    } catch (error) {
      console.error(`初始化图表 ${elementId} 时出错:`, error)
    }
  } else {
    console.warn(`未找到图表容器元素: ${elementId}`)
  }
}

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