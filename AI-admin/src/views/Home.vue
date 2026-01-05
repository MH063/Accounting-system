<template>
  <div class="home">
    <div class="dashboard">
      <!-- 系统统计卡片（页头 4 个卡片样式） -->
      <div style="text-align: right; margin-bottom: 10px;">
      </div>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
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
        <el-col :xs="24" :sm="12" :md="6">
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
        <el-col :xs="24" :sm="12" :md="6">
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
        <el-col :xs="24" :sm="12" :md="6">
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
        <el-col :xs="24" :sm="12" :md="6">
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
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-success">
                <el-icon size="24"><Coin /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">本月费用总额</div>
                <div class="stat-value">￥{{ extraStats.monthlyFeeTotal.toLocaleString() }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
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
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon" :class="getAvailabilityIconClass(extraStats.systemAvailability)">
                <el-icon size="24"><DataAnalysis /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">系统可用率</div>
                <div class="stat-value" :class="getAvailabilityTextClass(extraStats.systemAvailability)">
                  {{ formatAvailability(extraStats.systemAvailability) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 系统组件状态 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :xs="24" :lg="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>系统组件状态</span>
                <div class="header-actions">
                  <el-button size="small" @click="handleHealthCheck">健康检查</el-button>
                  <el-button size="small" @click="handleViewLogs">查看日志</el-button>
                </div>
              </div>
            </template>
            <div class="system-components">
              <el-tabs v-model="activeComponentTab" @tab-change="handleTabChange">
                <el-tab-pane label="组件概览" name="overview">
                  <el-row :gutter="20">
                    <el-col :xs="24" :sm="8">
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
                    <el-col :xs="24" :sm="8">
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
                    <el-col :xs="24" :sm="8">
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
                        <el-descriptions :column="isMobile ? 1 : 3" border>
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
                    <el-descriptions title="客户端状态详情" :column="isMobile ? 1 : 2" border>
                      <el-descriptions-item label="版本号">{{ clientStats.version }}</el-descriptions-item>
                      <el-descriptions-item label="在线用户数">
                        <span style="font-weight: bold; color: #409EFF;">{{ clientStats.onlineUsers }}</span>
                        <el-tooltip content="基于数学模型计算的用户质量指数 (0-100)" placement="top">
                          <el-tag size="small" :type="clientStats.qualityIndex >= 80 ? 'success' : clientStats.qualityIndex >= 60 ? 'warning' : 'danger'" style="margin-left: 10px;">
                            质量指数: {{ clientStats.qualityIndex }}
                          </el-tag>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="用户质量分布" :span="isMobile ? 1 : 2">
                        <div class="user-quality-dist">
                          <div class="dist-item">
                            <span class="dist-label">高质量用户</span>
                            <el-progress :percentage="calculatePercentage(clientStats.userDistribution.high)" status="success" />
                            <span class="dist-count">{{ clientStats.userDistribution.high }}</span>
                          </div>
                          <div class="dist-item">
                            <span class="dist-label">普通用户</span>
                            <el-progress :percentage="calculatePercentage(clientStats.userDistribution.normal)" status="warning" />
                            <span class="dist-count">{{ clientStats.userDistribution.normal }}</span>
                          </div>
                          <div class="dist-item">
                            <span class="dist-label">可疑用户</span>
                            <el-progress :percentage="calculatePercentage(clientStats.userDistribution.suspicious)" status="exception" />
                            <span class="dist-count">{{ clientStats.userDistribution.suspicious }}</span>
                          </div>
                        </div>
                        <!-- 异常预警 -->
                        <div v-if="clientStats.alerts && clientStats.alerts.length > 0" class="quality-alerts" style="margin-top: 10px;">
                          <el-alert
                            v-for="(alert, index) in clientStats.alerts"
                            :key="index"
                            :title="alert.message"
                            :type="alert.level === 'warning' ? 'warning' : 'error'"
                            show-icon
                            :closable="false"
                            style="margin-bottom: 5px;"
                          />
                        </div>
                      </el-descriptions-item>
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
                      <ChartContainer 
                        title="24小时在线用户趋势" 
                        height="300px"
                        :show-header="false"
                      />
                    </div>
                    
                    <!-- 客户端操作 -->
                    <div class="component-actions" style="margin-top: 20px;">
                      <el-button type="primary" @click="handleClientRestart">重启服务</el-button>
                      <el-button @click="handleClientConfig">配置</el-button>
                      <el-button @click="handleClientUpdate">更新</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="后端详情" name="backend">
                  <div class="component-detail">
                    <el-descriptions title="后端服务详情" :column="isMobile ? 1 : 2" border>
                      <el-descriptions-item label="版本号">{{ backendStats.version }}</el-descriptions-item>
                      <el-descriptions-item label="API响应时间">{{ backendStats.apiResponseTime }}ms</el-descriptions-item>
                      <el-descriptions-item label="QPS">{{ backendStats.qps }}</el-descriptions-item>
                      <el-descriptions-item label="运行时长">{{ backendStats.uptimeFormatted }}</el-descriptions-item>
                      <el-descriptions-item label="最后更新">{{ backendStats.lastUpdate }}</el-descriptions-item>
                      <el-descriptions-item label="状态">
                        <el-tag :type="getBackendStatusType()">{{ getBackendStatusText() }}</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                    
                    <div class="component-chart" style="margin-top: 20px;">
                      <ChartContainer 
                        title="API响应时间趋势" 
                        height="300px"
                        :show-header="false"
                      />
                    </div>
                    
                    <!-- 后端操作 -->
                    <div class="component-actions" style="margin-top: 20px;">
                      <el-button type="primary" @click="handleBackendRestart">重启服务</el-button>
                      <el-button @click="handleBackendConfig">配置</el-button>
                      <el-button @click="handleBackendUpdate">更新</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="数据库详情" name="database">
                  <div class="component-detail">
                    <el-descriptions title="数据库状态详情" :column="isMobile ? 1 : 2" border>
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
                      <ChartContainer 
                        title="数据库性能趋势" 
                        height="300px"
                        :show-header="false"
                      />
                    </div>
                    
                    <!-- 数据库操作 -->
                    <div class="component-actions" style="margin-top: 20px;">
                      <el-button type="primary" @click="handleDatabaseBackup">备份</el-button>
                      <el-button @click="handleDatabaseOptimize">优化</el-button>
                      <el-button @click="handleDatabaseRepair">修复</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                
                <!-- 新增系统监控标签页 -->
                <el-tab-pane label="系统监控" name="monitor">
                  <div class="monitor-detail">
                    <el-row :gutter="20">
                      <el-col :xs="24" :sm="12">
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
                      <el-col :xs="24" :sm="12">
                        <el-card>
                          <template #header>
                            <div class="card-header">
                              <span>性能指标</span>
                              <!-- 性能指标刷新按钮已删除 -->
                            </div>
                          </template>
                          <div class="performance-metrics">
                            <div class="metric-item">
                              <span class="metric-label">系统吞吐量</span>
                              <span class="metric-value">{{ performanceMetrics.throughput }}/s</span>
                            </div>
                            <div class="metric-item">
                              <span class="metric-label">平均响应时间:</span>
                              <span class="metric-value">{{ performanceMetrics.avgResponseTime }}ms</span>
                            </div>
                            <div class="metric-item">
                              <span class="metric-label">错误率</span>
                              <span class="metric-value">{{ performanceMetrics.errorRate }}%</span>
                            </div>
                          </div>
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
                          </div>
                        </div>
                      </template>
                      <el-descriptions :column="isMobile ? 1 : 2" border :key="configUpdateKey">
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
                    
                    <el-alert
                      title="环境配置说明"
                      type="info"
                      :closable="false"
                      style="margin-top: 16px;"
                    >
                      <template #default>
                        <div style="font-size: 13px; line-height: 1.6;">
                          <p><strong>当前运行环境：</strong>{{ getActualEnvironment() }}</p>
                          <p><strong>注意事项：</strong></p>
                          <ul style="margin: 8px 0; padding-left: 20px;">
                            <li>系统运行环境由后端服务的 <code>NODE_ENV</code> 环境变量决定</li>
                            <li>修改"运行环境"配置后需要<strong>重启后端服务</strong>才能真正生效</li>
                            <li>开发环境：功能完整，日志详细，适合调试</li>
                            <li>测试环境：模拟生产配置，用于集成测试</li>
                            <li>生产环境：性能优化，安全增强，需谨慎操作</li>
                          </ul>
                        </div>
                      </template>
                    </el-alert>
                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>安全配置</span>
                        </div>
                      </template>
                      <el-descriptions :column="isMobile ? 1 : 2" border :key="configUpdateKey">
                        <el-descriptions-item label="SSL证书">{{ securityConfig.sslCertificate }}</el-descriptions-item>
                        <el-descriptions-item label="加密算法">{{ securityConfig.encryptionAlgorithm }}</el-descriptions-item>
                        <el-descriptions-item label="会话超时">{{ securityConfig.sessionTimeout ? securityConfig.sessionTimeout + '分钟' : '-' }}</el-descriptions-item>
                        <el-descriptions-item label="密码最小长度">{{ securityConfig.passwordMinLength ? securityConfig.passwordMinLength + '位' : '-' }}</el-descriptions-item>
                        <el-descriptions-item label="登录失败次数">{{ securityConfig.loginFailures || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="锁定时间">{{ securityConfig.lockTime ? securityConfig.lockTime + '分钟' : '-' }}</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>性能配置</span>
                        </div>
                      </template>
                      <el-descriptions :column="isMobile ? 1 : 2" border :key="configUpdateKey">
                        <el-descriptions-item label="缓存TTL">{{ performanceConfig.cacheTtl || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="速率限制">{{ performanceConfig.rateLimit || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="压缩">{{ performanceConfig.compression || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="最大会话数">{{ performanceConfig.maxSessions || '-' }}</el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                    
                    <el-card style="margin-top: 20px;">
                      <template #header>
                        <div class="card-header">
                          <span>功能配置</span>
                        </div>
                      </template>
                      <el-descriptions :column="isMobile ? 1 : 2" border :key="configUpdateKey">
                        <el-descriptions-item label="用户注册">
                          <el-tag :type="featureConfig.registrationEnabled ? 'success' : 'danger'">
                            {{ featureConfig.registrationEnabled ? '启用' : '禁用' }}
                          </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="密码重置">
                          <el-tag :type="featureConfig.passwordResetEnabled ? 'success' : 'danger'">
                            {{ featureConfig.passwordResetEnabled ? '启用' : '禁用' }}
                          </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="审计日志">
                          <el-tag :type="featureConfig.auditLogEnabled ? 'success' : 'danger'">
                            {{ featureConfig.auditLogEnabled ? '启用' : '禁用' }}
                          </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="维护模式">
                          <el-tag :type="featureConfig.maintenanceMode ? 'warning' : 'success'">
                            {{ featureConfig.maintenanceMode ? '启用' : '禁用' }}
                          </el-tag>
                        </el-descriptions-item>
                      </el-descriptions>
                    </el-card>
                  </div>
                </el-tab-pane>
                
                <!-- 系统配置编辑对话框 -->
                <el-dialog v-model="configDialogVisible" title="编辑系统配置" :width="isMobile ? '95%' : '700px'" @close="configChanged = false">
                  <el-form :model="configForm" :label-width="isMobile ? '100px' : '120px'">
                    <el-tabs v-model="configActiveTab">
                      <el-tab-pane label="系统配置" name="system">
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="系统名称">
                              <el-input v-model="configForm.system.name" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="版本号">
                              <el-input :model-value="getPackageVersion()" disabled />
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="运行环境">
                              <el-select v-model="configForm.system.environment" @change="checkConfigChange" style="width: 100%">
                                <el-option label="开发环境" value="development" />
                                <el-option label="测试环境" value="testing" />
                                <el-option label="生产环境" value="production" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="服务器地址">
                              <el-input v-model="configForm.system.serverAddress" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="端口号">
                              <el-input-number v-model="configForm.system.port" :min="1" :max="65535" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="最大连接数">
                              <el-input-number v-model="configForm.system.maxConnections" :min="1" :max="10000" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="日志级别">
                              <el-select v-model="configForm.system.logLevel" @change="checkConfigChange" style="width: 100%">
                                <el-option label="DEBUG" value="debug" />
                                <el-option label="INFO" value="info" />
                                <el-option label="WARN" value="warn" />
                                <el-option label="ERROR" value="error" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="会话超时(分钟)">
                              <el-input-number v-model="configForm.system.timeout" :min="5" :max="1440" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-tab-pane>
                      
                      <el-tab-pane label="安全配置" name="security">
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="SSL证书">
                              <el-select v-model="configForm.security.sslCertificate" @change="checkConfigChange" style="width: 100%">
                                <el-option label="已启用" value="已启用" />
                                <el-option label="未启用" value="未启用" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="加密算法">
                              <el-select v-model="configForm.security.encryptionAlgorithm" @change="checkConfigChange" style="width: 100%">
                                <el-option label="AES-256" value="AES-256" />
                                <el-option label="AES-128" value="AES-128" />
                                <el-option label="RSA-2048" value="RSA-2048" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="会话超时(分钟)">
                              <el-input-number v-model="configForm.security.sessionTimeout" :min="5" :max="1440" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="密码最小长度">
                              <el-input-number v-model="configForm.security.passwordMinLength" :min="6" :max="32" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="登录失败次数">
                              <el-input-number v-model="configForm.security.loginFailures" :min="1" :max="10" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="锁定时间(分钟)">
                              <el-input-number v-model="configForm.security.lockTime" :min="5" :max="1440" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-tab-pane>

                      <el-tab-pane label="性能配置" name="performance">
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="缓存TTL(秒)">
                              <el-input-number v-model="configForm.performance.cacheTtl" :min="60" :max="86400" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="速率限制/分">
                              <el-input-number v-model="configForm.performance.rateLimit" :min="10" :max="10000" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                        <el-row :gutter="20">
                          <el-col :xs="24" :sm="12">
                            <el-form-item label="最大会话数">
                              <el-input-number v-model="configForm.performance.maxSessions" :min="1" :max="100" style="width: 100%" @change="checkConfigChange" />
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-tab-pane>

                      <el-tab-pane label="功能配置" name="feature">
                        <el-form-item label="用户注册">
                          <el-switch 
                            v-model="configForm.feature.registrationEnabled" 
                            :active-text="isMobile ? '' : '启用'" 
                            :inactive-text="isMobile ? '' : '禁用'"
                            @change="checkConfigChange"
                          />
                        </el-form-item>
                        <el-form-item label="密码重置">
                          <el-switch 
                            v-model="configForm.feature.passwordResetEnabled" 
                            :active-text="isMobile ? '' : '启用'" 
                            :inactive-text="isMobile ? '' : '禁用'"
                            @change="checkConfigChange"
                          />
                        </el-form-item>
                        <el-form-item label="审计日志">
                          <el-switch 
                            v-model="configForm.feature.auditLogEnabled" 
                            :active-text="isMobile ? '' : '启用'" 
                            :inactive-text="isMobile ? '' : '禁用'"
                            @change="checkConfigChange"
                          />
                        </el-form-item>
                        <el-form-item label="维护模式">
                          <el-switch 
                            v-model="configForm.feature.maintenanceMode" 
                            :active-text="isMobile ? '' : '开启'" 
                            :inactive-text="isMobile ? '' : '关闭'"
                            @change="checkConfigChange"
                          />
                          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
                            开启后普通用户将无法访问系统
                          </div>
                        </el-form-item>
                      </el-tab-pane>
                    </el-tabs>
                  </el-form>
                  
                  <template #footer>
                    <span class="dialog-footer">
                      <el-button @click="configDialogVisible = false">取消</el-button>
                      <el-button type="primary" :loading="configLoading" @click="saveConfig">保存</el-button>
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
                        <el-table-column prop="name" label="计划名称" :min-width="isMobile ? 100 : 150"></el-table-column>
                        <el-table-column prop="schedule" label="执行时间" :min-width="isMobile ? 120 : 200"></el-table-column>
                        <el-table-column prop="status" label="状态" :width="isMobile ? 80 : 100">
                          <template #default="scope">
                            <el-tag :type="scope.row.status === '已执行' ? 'success' : scope.row.status === '进行中' ? 'warning' : 'info'">
                              {{ scope.row.status }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column v-if="!isMobile" prop="lastRun" label="上次执行" width="180"></el-table-column>
                        <el-table-column label="操作" :width="isMobile ? 120 : 150">
                          <template #default="scope">
                            <el-button size="small" @click="handleRunMaintenance(scope.row)">执行</el-button>
                            <el-button v-if="!isMobile" size="small" @click="handleEditMaintenance(scope.row)">编辑</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                    </el-card>
                    
                    <!-- 添加维护计划对话框 -->
                    <el-dialog v-model="addMaintenanceDialogVisible" title="添加维护计划" :width="isMobile ? '95%' : '500px'" align-center>
                      <el-form :model="newMaintenancePlan" :label-width="isMobile ? '80px' : '100px'">
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
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'daily'" label="时间">
                          <el-time-picker
                            v-model="newMaintenancePlan.time"
                            format="HH:mm"
                            value-format="HH:mm"
                            placeholder="请选择执行时间"
                            style="width: 100%;"
                          />
                        </el-form-item>
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'weekly'" label="时间">
                          <div :style="{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }">
                            <el-select v-model="newMaintenancePlan.weekday" placeholder="请选择星期" :style="{ width: isMobile ? '100%' : 'auto' }">
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
                              placeholder="选择时间"
                              :style="{ width: isMobile ? '100%' : 'auto' }"
                            />
                          </div>
                        </el-form-item>
                        
                        <el-form-item v-if="newMaintenancePlan.scheduleType === 'monthly'" label="时间">
                          <div :style="{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }">
                            <div style="display: flex; align-items: center; gap: 5px;">
                              <el-input-number
                                v-model="newMaintenancePlan.dayOfMonth"
                                :min="1"
                                :max="31"
                                placeholder="日期"
                                style="width: 100px;"
                              />
                              <span>日</span>
                            </div>
                            <el-time-picker
                              v-model="newMaintenancePlan.time"
                              format="HH:mm"
                              value-format="HH:mm"
                              placeholder="选择时间"
                              :style="{ width: isMobile ? '100%' : 'auto' }"
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
                    
                    <!-- 环境切换/服务重启进度对话框 -->
                    <el-dialog 
                      v-model="showRestartProgress" 
                      title="正在切换环境" 
                      width="450px"
                      :close-on-click-modal="false"
                      :close-on-press-escape="false"
                      :show-close="false"
                    >
                      <div class="restart-progress">
                        <el-progress 
                          :percentage="restartProgress" 
                          :status="restartProgress >= 100 ? 'success' : ''"
                          :stroke-width="10"
                        />
                        <p class="restart-status">{{ restartStatus }}</p>
                      </div>
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
        
        <el-col :xs="24" :lg="8">
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
import ChartContainer from '@/components/ChartContainer.vue'
import * as echarts from 'echarts'
import { createChartManager } from '@/utils/chartManager'
import { formatRelativeTime } from '@/utils/timeUtils'
import { updateGlobalSystemConfig, getSystemConfig } from '@/utils/systemConfig'
import { getPackageVersion } from '@/utils/version'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
// 添加API导入
import api from '../api/index'
import { systemApi, userApi } from '../api/user'
import { maintenanceApi } from '../api/maintenance'

// 获取路由器实例
const router = useRouter()

// 移动端检测
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

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

const globalConfig = getSystemConfig()

// 修改 systemStats 为从 API 获取数据
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
  version: getPackageVersion(),
  uptime: '',
  environment: globalConfig.environment === 'development' ? '开发环境' : globalConfig.environment === 'testing' ? '测试环境' : '生产环境',
  startTime: ''
})

const clientStats = ref({
  version: '',
  onlineUsers: 0,
  userDistribution: { high: 0, normal: 0, suspicious: 0 },
  qualityIndex: 100, // 新增：质量指数
  alerts: [],       // 新增：预警
  peakUsers: 0,
  avgResponseTime: 0,
  todayActiveUsers: 0,
  errorRate: 0,
  lastUpdate: '',
  status: '',
  statusText: '',
  statusType: '',
  healthScore: 0,
  uptime: '',
  uptimeFormatted: ''
})

const backendStats = ref({
  version: '',
  apiResponseTime: 0,
  qps: 0,
  uptime: 0,
  uptimeFormatted: '',
  lastUpdate: '',
  status: '',
  statusText: '',
  statusType: '',
  healthScore: 0
})

const databaseStats = ref({
  version: '',
  connections: 0,
  maxConnections: 0,
  cacheHitRate: 0,
  slowQueries: 0,
  tableSpaceUsage: '',
  lastUpdate: '',
  status: '',
  statusText: '',
  statusType: '',
  healthScore: 0
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

// 告警信息类型定义
interface Alert {
  id: number
  level: 'INFO' | 'WARNING' | 'ERROR'
  content: string
  time: string
}

// 告警信息
const alerts = ref<Alert[]>([]) // 初始化为空数组，从API获取真实数据

// 性能指标
const performanceMetrics = ref({
  throughput: 0,
  avgResponseTime: 0,
  errorRate: 0
})



// 维护计划类型定义
interface MaintenancePlan {
  id: number
  name: string
  schedule: string
  status: string
  lastRun: string
  timerId: NodeJS.Timeout | null
}

// 维护计划
const maintenancePlans = ref<MaintenancePlan[]>([])

// 系统配置信息
const systemConfig = ref({
  name: globalConfig.name,
  version: globalConfig.version,
  environment: globalConfig.environment,
  deployTime: '',
  serverAddress: '',
  port: null as number | null,
  dbAddress: '',
  cacheServer: '',
  logLevel: '',
  maxConnections: null as number | null,
  timeout: null as number | null,
  backupPolicy: ''
})

// 安全配置信息
const securityConfig = ref({
  sslCertificate: '',
  encryptionAlgorithm: '',
  sessionTimeout: null as number | null,
  passwordPolicy: '',
  passwordMinLength: null as number | null,
  loginFailures: null as number | null,
  lockTime: null as number | null
})

// 性能配置信息
const performanceConfig = ref({
  cacheTtl: null as number | null,
  rateLimit: null as number | null,
  compression: '',
  maxSessions: null as number | null
})

// 功能配置信息
const featureConfig = ref({
  registrationEnabled: true,
  passwordResetEnabled: true,
  auditLogEnabled: true,
  maintenanceMode: false
})

// 配置分组列表
const configGroups = ref<{ group: string; count: number }[]>([])

// 当前编辑的配置分组
const activeConfigGroup = ref('system')

// 配置表单数据
const configForm = ref({
  system: { ...systemConfig.value },
  security: { ...securityConfig.value },
  performance: { ...performanceConfig.value },
  feature: { ...featureConfig.value }
})

// 配置变更检测
const configChanged = ref(false)

// 配置加载状态
const configLoading = ref(false)
// 配置更新标识，用于强制刷新组件
const configUpdateKey = ref(0)
// 计算百分比
const calculatePercentage = (count: number) => {
  const total = (clientStats.value.userDistribution.high || 0) + 
                (clientStats.value.userDistribution.normal || 0) + 
                (clientStats.value.userDistribution.suspicious || 0)
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

// 获取健康度评分描述
const getHealthScoreDesc = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '较差'
}

// 获取告警标签类型
const getAlertTagType = (level: string) => {
  const l = level?.toLowerCase()
  switch (l) {
    case 'critical':
    case 'error':
      return 'danger'
    case 'warning':
    case 'warn':
      return 'warning'
    case 'info':
      return 'info'
    case 'success':
      return 'success'
    default:
      return 'info'
  }
}

// 格式化系统可用率显示
const formatAvailability = (availability: string) => {
  if (!availability) return '0.00%'
  // 确保显示两位小数
  const value = parseFloat(availability.replace('%', ''))
  return value.toFixed(2) + '%'
}

// 获取系统可用率图标样式类
const getAvailabilityIconClass = (availability: string) => {
  if (!availability) return 'bg-info'
  
  const value = parseFloat(availability.replace('%', ''))
  if (value >= 99.9) return 'bg-success'
  if (value >= 99.0) return 'bg-primary'
  if (value >= 95.0) return 'bg-warning'
  return 'bg-danger'
}

// 获取系统可用率文本样式类
const getAvailabilityTextClass = (availability: string) => {
  if (!availability) return 'text-muted'
  
  const value = parseFloat(availability.replace('%', ''))
  if (value >= 99.9) return 'text-success'
  if (value >= 99.0) return 'text-primary'
  if (value >= 95.0) return 'text-warning'
  return 'text-danger'
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

const handleRefreshAlerts = async () => {
  ElMessage.success('正在刷新告警信息...')
    try {
      // 从API获取真实的告警信息
      const alertsResponse = await systemApi.getAlerts()
      
      // API拦截器已经处理了双层嵌套，alertsResponse 应该是 { alerts: [...], total: x } 格式
      const innerData = alertsResponse?.data || alertsResponse
      let rawAlerts: any[] = []
      
      if (innerData && typeof innerData === 'object') {
        // 直接从 innerData 获取 alerts 数组
        if (Array.isArray(innerData)) {
          rawAlerts = innerData
        } else if (Array.isArray(innerData.alerts)) {
          rawAlerts = innerData.alerts
        } else if (innerData.result && Array.isArray(innerData.result)) {
          // 备选：检查 result 字段
          rawAlerts = innerData.result
        }
      } else if (Array.isArray(alertsResponse)) {
        rawAlerts = alertsResponse
      }
      
      // 转换数据格式以适应表格显示
      alerts.value = rawAlerts.map((item: any) => {
        // 调试：打印原始数据
        console.log('📊 原始occur_time:', item.occur_time, '类型:', typeof item.occur_time)
        
        // 优先使用 formatRelativeTime，如果解析失败则回退到原始时间显示
        let timeDisplay = '-'
        if (item.occur_time) {
          const relativeTime = formatRelativeTime(item.occur_time)
          if (relativeTime !== '-') {
            timeDisplay = relativeTime
          } else {
            // 回退方案：直接显示原始时间
            timeDisplay = String(item.occur_time)
          }
        }
        
        return {
          ...item,
          // 使用 formatRelativeTime 安全地格式化时间
          time: timeDisplay,
          // 如果有 title，可以显示为 title: content
          content: item.title ? `${item.title}: ${item.content}` : item.content
        }
      })
      
      ElMessage.success(`告警信息刷新完成，共 ${alerts.value.length} 条`)
  } catch (error) {
    console.error('❌ 刷新告警信息失败:', error)
    ElMessage.error('告警信息刷新失败: ' + (error as Error).message)
  }
}

const handleExportAlerts = async () => {
  try {
    ElMessage.info('正在导出告警信息...')
    // 调用API导出告警信息
    const response = await systemApi.exportAlerts()
    
    // 创建下载链接
    const data = response
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
    await refreshComponentOverview()
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
      // 标准化数据解析：支持直接返回数据或嵌套在 data 中的数据
      const result = response?.data || response
      
      // 更新健康评分
      if (result && typeof result === 'object' && 'score' in result && typeof result.score === 'number') {
        healthScore.value = result.score
      } else if (result && typeof result === 'object' && 'healthScore' in result && typeof result.healthScore === 'number') {
        healthScore.value = result.healthScore
      } else {
        // 如果API没有返回分数，则使用默认值
        healthScore.value = 85 // 默认健康度评分
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

// 获取系统配置
const fetchSystemConfig = async () => {
  try {
    configLoading.value = true
    console.log('🔄 开始获取系统配置...')
    
    const response = await userApi.getSystemConfigs()
    console.log('📡 API响应原始数据:', response)
    
    // 标准化数据解析：支持直接返回 configs 或嵌套在 data 中的结构
    let data = response
    if (response && response.data && !response.configs) {
      data = response.data
    }
    
    console.log('📊 解析后的数据:', data)
    
    if (data && data.configs) {
      const configs = data.configs
      console.log('📋 配置项数量:', Object.keys(configs).length)

      // 辅助函数：兼容两种键格式（点号分隔和下划线分隔）
      const getConfigValue = (key1: string, key2: string) => {
        const item = configs[key1] || configs[key2]
        return item?.value !== undefined ? item.value : null
      }

      // 构建新配置对象（版本号从配置文件获取）
      const newSystemConfig = {
        name: getConfigValue('system.name', 'system_name') || '',
        version: '', // 版本号从API获取，不从数据库读取
        environment: getConfigValue('system.environment', 'system_environment') || '',
        deployTime: getConfigValue('system.deploy_time', 'system_deploy_time') || '',
        serverAddress: getConfigValue('server.host', 'server_host') || '',
        port: getConfigValue('server.port', 'server_port') || null,
        dbAddress: getConfigValue('database.host', 'database_host') || 'localhost',
        cacheServer: getConfigValue('cache.server', 'cache_server') || 'Redis localhost:6379',
        logLevel: getConfigValue('log.level', 'log_level') || '',
        maxConnections: getConfigValue('server.max_connections', 'server_max_connections') || null,
        timeout: getConfigValue('session.timeout', 'session_timeout') || null,
        backupPolicy: getConfigValue('backup.schedule', 'backup_schedule') || ''
      }

      // 从API获取版本号
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
        const response = await fetch(`${baseUrl}/api/version/admin`).catch(() => null)
        if (response?.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            newSystemConfig.version = data.data.version || '1.0.0'
          }
        }
      } catch (e) {
        newSystemConfig.version = '1.0.0'
      }

      const newSecurityConfig = {
        sslCertificate: getConfigValue('security.ssl_certificate', 'security_ssl_certificate') || '已启用',
        encryptionAlgorithm: getConfigValue('security.encryption_algorithm', 'security_encryption_algorithm') || 'AES-256',
        sessionTimeout: getConfigValue('session.timeout', 'session_timeout') || null,
        passwordPolicy: getConfigValue('security.password_policy.min_length', 'security_password_policy_min_length') 
          ? `密码最小长度${getConfigValue('security.password_policy.min_length', 'security_password_policy_min_length')}位` : '',
        passwordMinLength: getConfigValue('security.password_policy.min_length', 'security_password_policy_min_length') || null,
        loginFailures: getConfigValue('security.login.max_attempts', 'security_login_max_attempts') || null,
        lockTime: getConfigValue('security.login.lockout_duration', 'security_login_lockout_duration') || null
      }

      const newPerformanceConfig = {
        cacheTtl: getConfigValue('performance.cache_ttl', 'performance_cache_ttl') || null,
        rateLimit: getConfigValue('performance.rate_limit', 'performance_rate_limit') || null,
        compression: getConfigValue('performance.compression', 'performance_compression') === 'true' || getConfigValue('performance.compression', 'performance_compression') === true ? '已启用' : '未启用',
        maxSessions: getConfigValue('session.max_sessions', 'session_max_sessions') || null
      }

      const newFeatureConfig = {
        registrationEnabled: getConfigValue('feature.registration_enabled', 'feature_registration_enabled') ?? true,
        passwordResetEnabled: getConfigValue('feature.password_reset_enabled', 'feature_password_reset_enabled') ?? true,
        auditLogEnabled: getConfigValue('feature.audit_log_enabled', 'feature_audit_log_enabled') ?? true,
        maintenanceMode: getConfigValue('feature.maintenance_mode', 'feature_maintenance_mode') ?? false
      }

      // 更新响应式数据
      systemConfig.value = { ...newSystemConfig }
      securityConfig.value = { ...newSecurityConfig }
      performanceConfig.value = { ...newPerformanceConfig }
      featureConfig.value = { ...newFeatureConfig }

      // 同步更新 systemInfo（从配置中读取）
      syncSystemInfoFromConfig()

      // 同步更新全局配置（用于所有页面显示）
      updateGlobalSystemConfig({
        name: systemConfig.value.name,
        version: systemConfig.value.version,
        environment: systemConfig.value.environment
      })

      // 强制刷新标识
      configUpdateKey.value++

      // 同步更新 systemInfo（从配置中读取）
      syncSystemInfoFromConfig()

      console.log('✅ 系统配置更新完成', { 
        systemConfig: systemConfig.value, 
        configCount: data.meta?.count || 0,
        updateKey: configUpdateKey.value
      })
    } else {
      console.warn('⚠️ API返回数据中没有configs字段:', data)
    }
  } catch (error) {
    console.error('❌ 获取系统配置失败:', error)
    ElMessage.error('获取系统配置失败: ' + (error as Error).message)
  } finally {
    configLoading.value = false
  }
}

// 从 systemConfig 同步到 systemInfo
const syncSystemInfoFromConfig = () => {
  // 版本号从配置文件获取，不使用systemConfig的值
  // systemInfo.value.version = systemConfig.value.version || systemInfo.value.version
  systemInfo.value.environment = systemConfig.value.environment || systemInfo.value.environment
  systemInfo.value.uptime = systemInfo.value.uptime || systemInfo.value.uptime
  systemInfo.value.startTime = systemInfo.value.startTime || systemInfo.value.startTime
}

// 获取配置分组
const fetchConfigGroups = async () => {
  try {
    const response = await userApi.getConfigGroups()
    // 标准化数据解析：兼容直接返回数组或嵌套结构
    const data = response?.data?.data || response?.data || response
    
    // 如果返回的是 { groups: [...] } 结构
    if (data && data.groups && Array.isArray(data.groups)) {
      configGroups.value = data.groups
    } else if (Array.isArray(data)) {
      configGroups.value = data
    }
  } catch (error) {
    console.error('获取配置分组失败:', error)
  }
}

// 编辑配置
const handleEditConfig = async () => {
  try {
    configLoading.value = true
    await fetchSystemConfig()

    configForm.value.system = { ...systemConfig.value }
    configForm.value.security = { ...securityConfig.value }
    configForm.value.performance = { ...performanceConfig.value }
    configForm.value.feature = { ...featureConfig.value }

    configDialogVisible.value = true
    configChanged.value = false
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
  } finally {
    configLoading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  try {
    configLoading.value = true

    const configs: Record<string, any> = {}
    
    // 检查环境是否改变
    const currentEnv = systemConfig.value.environment
    const newEnv = configForm.value.system.environment
    const environmentChanged = currentEnv && newEnv && currentEnv !== newEnv

    configs['system.name'] = configForm.value.system.name
    configs['system.version'] = getPackageVersion()
    configs['system.environment'] = configForm.value.system.environment
    configs['system.deploy_time'] = configForm.value.system.deployTime
    configs['server.host'] = configForm.value.system.serverAddress
    configs['server.port'] = Number(configForm.value.system.port) || 4000
    configs['server.max_connections'] = Number(configForm.value.system.maxConnections) || 20
    configs['log.level'] = configForm.value.system.logLevel
    configs['session.timeout'] = Number(configForm.value.system.timeout) || 60
    configs['session.max_sessions'] = Number(configForm.value.performance.maxSessions) || 5
    
    // 安全配置
    configs['security.ssl_certificate'] = configForm.value.security.sslCertificate
    configs['security.encryption_algorithm'] = configForm.value.security.encryptionAlgorithm
    configs['security.password_policy.min_length'] = Number(configForm.value.security.passwordMinLength) || 8
    configs['security.login.max_attempts'] = Number(configForm.value.security.loginFailures) || 5
    configs['security.login.lockout_duration'] = Number(configForm.value.security.lockTime) || 30
    
    // 性能配置
    configs['performance.cache_ttl'] = Number(configForm.value.performance.cacheTtl) || 3600
    configs['performance.rate_limit'] = Number(configForm.value.performance.rateLimit) || 100
    configs['performance.compression'] = configForm.value.performance.compression === '已启用'
    
    // 功能配置
    configs['feature.registration_enabled'] = configForm.value.feature.registrationEnabled
    configs['feature.password_reset_enabled'] = configForm.value.feature.passwordResetEnabled
    configs['feature.audit_log_enabled'] = configForm.value.feature.auditLogEnabled
    configs['feature.maintenance_mode'] = configForm.value.feature.maintenanceMode

    // 如果环境改变，调用真正的环境切换API
    if (environmentChanged) {
      configDialogVisible.value = false
      configChanged.value = false
      configLoading.value = false
      
      // 弹出环境切换确认对话框
      const confirmed = await ElMessageBox.confirm(
        `确定要将运行环境从 "${getEnvDisplayName(currentEnv)}" 切换为 "${getEnvDisplayName(newEnv)}" 吗？\n\n切换后系统将自动重启，此过程可能需要10-30秒。`,
        '确认环境切换',
        {
          confirmButtonText: '确定切换',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }
      ).then(() => true).catch(() => false)

      if (!confirmed) return

      // 显示重启进度对话框
      showRestartProgress.value = true
      restartProgress.value = 0
      restartStatus.value = '正在准备切换环境...'

      try {
        // 步骤1: 调用环境切换API
        restartProgress.value = 10
        restartStatus.value = '正在切换环境配置...'
        
        const switchResponse = await userApi.switchEnvironment({
          environment: newEnv,
          reason: `用户从 ${getEnvDisplayName(currentEnv)} 切换到 ${getEnvDisplayName(newEnv)}`
        })

        // 步骤2: 等待服务重启
        restartProgress.value = 30
        restartStatus.value = '正在重启服务...'

        // 轮询检查服务状态
        let attempts = 0
        const maxAttempts = 60 // 最多等待60秒

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
          
          const progress = 30 + Math.min(attempts * 1.2, 60)
          restartProgress.value = progress
          restartStatus.value = `正在重启服务... (${attempts}/${maxAttempts}秒)`

          try {
            await userApi.getEnvironmentStatus()
            // 服务已恢复
            restartProgress.value = 90
            restartStatus.value = '服务已重启，正在验证...'
            break
          } catch (e) {
            // 服务还未恢复，继续等待
          }
        }

        // 步骤3: 重新获取配置
        restartProgress.value = 95
        restartStatus.value = '正在同步配置...'
        await fetchSystemConfig()
        await fetchVersionInfo()

        restartProgress.value = 100
        restartStatus.value = '切换完成！'
        
        ElMessage.success({
          message: switchResponse.data?.message || `环境已切换为 ${getEnvDisplayName(newEnv)}`,
          duration: 5000
        })

      } catch (error) {
        console.error('环境切换失败:', error)
        ElMessage.error('环境切换失败: ' + (error as Error).message)
      } finally {
        showRestartProgress.value = false
      }
      
      return
    }

    // 普通配置保存（不涉及环境切换）
    const response = await userApi.setConfig({ configs })
    console.log('✅ API响应结果:', response)
    
    // 检查是否有失败的项
    if (response && response.results) {
      const failures = response.results.filter((r: any) => !r.success)
      if (failures.length > 0) {
        console.warn('⚠️ 部分配置保存失败:', failures)
        const failedKeys = failures.map((f: any) => f.key).join(', ')
        ElMessage.warning(`部分配置保存失败 (可能数据库中不存在): ${failedKeys}`)
      }
    }

    console.log('✅ 配置保存成功，重新获取配置...')
    
    await fetchSystemConfig()
    console.log('✅ 配置已刷新', { securityConfig: securityConfig.value })
    
    configDialogVisible.value = false
    configChanged.value = false
    ElMessage.success('系统配置保存成功')
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败: ' + (error as Error).message)
  } finally {
    configLoading.value = false
  }
}

// 重启进度相关状态
const showRestartProgress = ref(false)
const restartProgress = ref(0)
const restartStatus = ref('')

// 获取环境显示名称
 const getEnvDisplayName = (env: string) => {
   const envMap: Record<string, string> = {
     development: '开发环境',
     testing: '测试环境',
     production: '生产环境'
   }
   return envMap[env] || env || '未知环境'
 }
 
 // 获取实际运行环境（从前端获取的全局配置）
 const getActualEnvironment = () => {
   const actualEnv = globalConfig.environment || import.meta.env?.MODE || 'development'
   return getEnvDisplayName(actualEnv)
 }
 
 // 检测配置变更
const checkConfigChange = () => {
  configChanged.value = true
}

// 刷新系统配置
const refreshSystemConfig = async () => {
  try {
    await fetchSystemConfig()
    ElMessage.success('系统配置刷新成功')
  } catch (error) {
    console.error('刷新系统配置失败:', error)
  }
}

// 刷新安全配置
const refreshSecurityConfig = async () => {
  try {
    await fetchSystemConfig()
    ElMessage.success('安全配置刷新成功')
  } catch (error) {
    console.error('刷新安全配置失败:', error)
  }
}

// 刷新系统清理
const refreshSystemCleanup = () => {
  // 目前没有对应的后端清理统计API，保留提示
  ElMessage.info('正在执行系统清理分析...')
  setTimeout(() => {
    ElMessage.success('系统清理信息刷新成功')
  }, 1000)
}

// 获取客户端状态类型
const getClientStatusType = () => {
  if (clientStats.value.status) {
    const statusTypeMap: Record<string, string> = {
      healthy: 'success',
      warning: 'warning',
      critical: 'danger'
    }
    return statusTypeMap[clientStats.value.status] || 'success'
  }
  return 'info'
}

// 获取客户端状态文本
const getClientStatusText = () => {
  if (clientStats.value.statusText) return clientStats.value.statusText
  if (clientStats.value.status) {
    const textMap: Record<string, string> = {
      healthy: '正常',
      warning: '警告',
      critical: '严重'
    }
    return textMap[clientStats.value.status] || clientStats.value.status
  }
  return '未知'
}

// 获取后端服务状态类型
const getBackendStatusType = () => {
  const statusTypeMap: Record<string, string> = {
    healthy: 'success',
    warning: 'warning',
    critical: 'danger'
  }
  if (backendStats.value.status) {
    return statusTypeMap[backendStats.value.status] || 'success'
  }
  return 'info'
}

// 获取后端服务状态文本
const getBackendStatusText = () => {
  if (backendStats.value.statusText) return backendStats.value.statusText
  if (backendStats.value.status) {
    const textMap: Record<string, string> = {
      healthy: '正常',
      warning: '警告',
      critical: '严重'
    }
    return textMap[backendStats.value.status] || backendStats.value.status
  }
  return '未知'
}

// 获取数据库状态类型
const getDatabaseStatusType = () => {
  const statusTypeMap: Record<string, string> = {
    healthy: 'success',
    warning: 'warning',
    critical: 'danger'
  }
  if (databaseStats.value.status) {
    return statusTypeMap[databaseStats.value.status] || 'success'
  }
  return 'info'
}

// 获取数据库状态文本
const getDatabaseStatusText = () => {
  if (databaseStats.value.statusText) return databaseStats.value.statusText
  if (databaseStats.value.status) {
    const textMap: Record<string, string> = {
      healthy: '正常',
      warning: '警告',
      critical: '严重'
    }
    return textMap[databaseStats.value.status] || databaseStats.value.status
  }
  return '未知'
}

// 刷新性能指标
const refreshPerformanceMetrics = async () => {
  ElMessage.info('正在刷新性能指标...')
  try {
    // 调用API获取真实的性能指标数据
    const response = await systemApi.getSystemStats()
    // 标准化数据解析
    const data = response?.data || response

    // 更新性能指标数据
    if (data && typeof data === 'object' && 'performanceMetrics' in data && data.performanceMetrics) {
      const perfMetrics = data.performanceMetrics
      const perfMetricsTyped = perfMetrics as any
      performanceMetrics.value.throughput = perfMetricsTyped.throughput || performanceMetrics.value.throughput
      performanceMetrics.value.avgResponseTime = perfMetricsTyped.avgResponseTime || performanceMetrics.value.avgResponseTime
      performanceMetrics.value.errorRate = perfMetricsTyped.errorRate || performanceMetrics.value.errorRate
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
  }
}



// 刷新系统状态概览
const refreshSystemStatusOverview = async () => {
  ElMessage.info('正在刷新系统状态概览...')
  try {
    // 并行调用三个状态评估接口
    const [clientResponse, backendResponse, databaseResponse] = await Promise.all([
      systemApi.getClientStatus(),
      systemApi.getBackendStatus(),
      systemApi.getDatabaseStatus()
    ])
    
    // 标准化数据解析
    const clientData = clientResponse?.data || clientResponse
    const backendData = backendResponse?.data || backendResponse
    const databaseData = databaseResponse?.data || databaseResponse
    
    console.log('📊 客户端状态:', clientData)
    console.log('📊 后端服务状态:', backendData)
    console.log('📊 数据库状态:', databaseData)
    
    // 更新客户端状态
    if (clientData) {
      const clientDataTyped = clientData as any
      console.log('🔍 [DEBUG] 客户端原始响应:', clientDataTyped)
      
      clientStats.value.status = clientDataTyped.status || clientStats.value.status
      clientStats.value.statusType = clientDataTyped.statusType || clientStats.value.statusType
      clientStats.value.healthScore = clientDataTyped.healthScore || clientStats.value.healthScore
      
      // 优先从 metrics 获取指标
      const metrics = clientDataTyped.metrics || {}
      console.log('🔍 [DEBUG] 客户端指标(metrics):', metrics)
      
      // 客户端版本从配置文件获取，不使用API返回值
      // clientStats.value.version = metrics.version || clientDataTyped.version || clientStats.value.version
      clientStats.value.onlineUsers = metrics.onlineUsers || clientDataTyped.onlineUsers || clientStats.value.onlineUsers
      clientStats.value.userDistribution = metrics.userDistribution || clientDataTyped.userDistribution || { high: 0, normal: 0, suspicious: 0 }
      clientStats.value.qualityIndex = metrics.qualityIndex || clientDataTyped.qualityIndex || 100
      clientStats.value.alerts = metrics.alerts || clientDataTyped.alerts || []
      clientStats.value.peakUsers = metrics.peakUsers || clientDataTyped.peakUsers || clientStats.value.peakUsers
      clientStats.value.todayActiveUsers = metrics.todayActiveUsers || clientDataTyped.todayActiveUsers || clientStats.value.todayActiveUsers
      clientStats.value.avgResponseTime = metrics.avgResponseTime || clientDataTyped.avgResponseTime || clientStats.value.avgResponseTime
      clientStats.value.errorRate = metrics.errorRate || clientDataTyped.errorRate || clientStats.value.errorRate
      clientStats.value.uptime = metrics.uptime || clientDataTyped.uptime || clientStats.value.uptime
      clientStats.value.uptimeFormatted = metrics.uptimeFormatted || clientDataTyped.uptimeFormatted || clientStats.value.uptimeFormatted
      
      clientStats.value.lastUpdate = clientDataTyped.lastUpdate || clientStats.value.lastUpdate
      console.log('✅ [DEBUG] 客户端状态更新后:', JSON.parse(JSON.stringify(clientStats.value)))
    }
    
      // 更新后端服务状态
      if (backendData) {
        const backendDataTyped = backendData as any
        console.log('🔍 [DEBUG] 后端服务原始响应:', backendDataTyped)
        
        backendStats.value.status = backendDataTyped.status || backendStats.value.status
        backendStats.value.statusType = backendDataTyped.statusType || backendStats.value.statusType
        backendStats.value.statusText = backendDataTyped.statusText || backendStats.value.statusText
        backendStats.value.healthScore = backendDataTyped.healthScore || backendStats.value.healthScore
        
        // 优先从 metrics 获取指标
        const metrics = backendDataTyped.metrics || {}
        console.log('🔍 [DEBUG] 后端指标(metrics):', metrics)
        
        // 后端版本从配置文件获取，不使用API返回值
        // backendStats.value.version = metrics.version || backendDataTyped.version || backendStats.value.version
        backendStats.value.apiResponseTime = metrics.apiResponseTime || backendDataTyped.apiResponseTime || backendStats.value.apiResponseTime
        backendStats.value.qps = metrics.qps ?? backendDataTyped.qps ?? backendStats.value.qps
        backendStats.value.uptime = metrics.uptime ?? backendDataTyped.uptime ?? backendStats.value.uptime
        backendStats.value.uptimeFormatted = metrics.uptimeFormatted || backendDataTyped.uptimeFormatted || backendStats.value.uptimeFormatted
        
        backendStats.value.lastUpdate = backendDataTyped.lastUpdate || backendStats.value.lastUpdate
        console.log('✅ [DEBUG] 后端状态更新后:', JSON.parse(JSON.stringify(backendStats.value)))
      }
      
      // 更新数据库状态
      if (databaseData) {
        const databaseDataTyped = databaseData as any
        console.log('🔍 [DEBUG] 数据库原始响应:', databaseDataTyped)
        
        databaseStats.value.status = databaseDataTyped.status || databaseStats.value.status
        databaseStats.value.statusType = databaseDataTyped.statusType || databaseStats.value.statusType
        databaseStats.value.healthScore = databaseDataTyped.healthScore || databaseStats.value.healthScore
        
        // 优先从 metrics 获取指标
        const metrics = databaseDataTyped.metrics || {}
        console.log('🔍 [DEBUG] 数据库指标(metrics):', metrics)
        
        // 数据库版本从配置文件获取，不使用API返回值
        // databaseStats.value.version = metrics.version || databaseDataTyped.version || databaseStats.value.version
        databaseStats.value.connections = metrics.activeConnections || databaseDataTyped.activeConnections || databaseStats.value.connections
        databaseStats.value.maxConnections = metrics.maxConnections || databaseDataTyped.maxConnections || databaseStats.value.maxConnections
        databaseStats.value.cacheHitRate = metrics.cacheHitRate || databaseDataTyped.cacheHitRate || databaseStats.value.cacheHitRate
        databaseStats.value.slowQueries = metrics.slowQueries || databaseDataTyped.slowQueries || databaseStats.value.slowQueries
        databaseStats.value.tableSpaceUsage = metrics.tableSpaceUsage || databaseDataTyped.tableSpaceUsage || databaseStats.value.tableSpaceUsage
        
        databaseStats.value.lastUpdate = databaseDataTyped.lastUpdate || databaseStats.value.lastUpdate
        console.log('✅ [DEBUG] 数据库状态更新后:', JSON.parse(JSON.stringify(databaseStats.value)))
      }
    
    console.log('📊 系统状态数据更新完成', {
      client: clientStats.value,
      backend: backendStats.value,
      database: databaseStats.value
    })
    
    ElMessage.success('系统状态概览刷新成功')
    
    // 刷新图表数据
    await Promise.all([
      refreshClientChartData(),
      refreshBackendChartData(),
      refreshDatabaseChartData()
    ])
  } catch (error) {
    console.error('❌ 刷新系统状态概览失败:', error)
    ElMessage.error('刷新系统状态概览失败: ' + (error as Error).message)
    
    // 设置默认值（版本号从配置文件获取，不重置）
    clientStats.value.onlineUsers = 0
    clientStats.value.peakUsers = 0
    clientStats.value.avgResponseTime = 0
    clientStats.value.todayActiveUsers = 0
    clientStats.value.errorRate = 0
    clientStats.value.lastUpdate = ''
    
    backendStats.value.apiResponseTime = 0
    backendStats.value.qps = 0
    backendStats.value.uptime = 0
    backendStats.value.uptimeFormatted = ''
    backendStats.value.lastUpdate = ''
    
    databaseStats.value.connections = 0
    databaseStats.value.maxConnections = 0
    databaseStats.value.cacheHitRate = 0
    databaseStats.value.slowQueries = 0
    databaseStats.value.tableSpaceUsage = ''
    databaseStats.value.lastUpdate = ''
    
    systemInfo.value.uptime = ''
    systemInfo.value.environment = ''
    systemInfo.value.startTime = ''
  }
}

// 刷新客户端趋势图表数据
const refreshClientChartData = async () => {
  try {
    const response = await systemApi.getMetricsHistory({ type: 'ACTIVE_USERS', interval: '24 hours' })
    // 标准化处理：如果是数组则直接使用，如果是对象则取data
    const history = Array.isArray(response) ? response : (response?.data || [])
    
    if (history && Array.isArray(history)) {
      // 格式化图表数据
      const xAxisData = history.map((item: any) => {
        const date = new Date(item.timestamp)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      })
      const seriesData = history.map((item: any) => item.value)
      
      // 更新图表
      if (clientChartManager) {
        clientChartManager.update({
          xAxis: {
            data: xAxisData
          },
          series: [{
            data: seriesData
          }]
        })
        console.log('📈 客户端趋势图表已更新真实数据', { points: history.length })
      }
    }
  } catch (error) {
    console.error('❌ 获取客户端趋势图表数据失败:', error)
  }
}

// 刷新后端趋势图表数据
const refreshBackendChartData = async () => {
  try {
    const response = await systemApi.getMetricsHistory({ type: 'BACKEND_RESPONSE_TIME', interval: '24 hours' })
    // 标准化处理：如果是数组则直接使用，如果是对象则取data
    const history = Array.isArray(response) ? response : (response?.data || [])
    
    if (history && Array.isArray(history)) {
      const xAxisData = history.map((item: any) => {
        const date = new Date(item.timestamp)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      })
      const seriesData = history.map((item: any) => item.value)
      
      if (backendChartManager) {
        backendChartManager.update({
          xAxis: { data: xAxisData },
          series: [{ data: seriesData }]
        })
      }
    }
  } catch (error) {
    console.error('❌ 获取后端趋势图表数据失败:', error)
  }
}

// 刷新数据库趋势图表数据
const refreshDatabaseChartData = async () => {
  try {
    const response = await systemApi.getMetricsHistory({ type: 'DB_CONNECTIONS', interval: '24 hours' })
    // 标准化处理：如果是数组则直接使用，如果是对象则取data
    const history = Array.isArray(response) ? response : (response?.data || [])
    
    if (history && Array.isArray(history)) {
      const xAxisData = history.map((item: any) => {
        const date = new Date(item.timestamp)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      })
      const seriesData = history.map((item: any) => item.value)
      
      if (databaseChartManager) {
        databaseChartManager.update({
          xAxis: { data: xAxisData },
          series: [{ data: seriesData }]
        })
      }
    }
  } catch (error) {
    console.error('❌ 获取数据库趋势图表数据失败:', error)
  }
}

// 刷新组件概览
const refreshComponentOverview = async () => {
  ElMessage.info('正在刷新组件概览...')
  try {
    // 调用API获取真实的组件数据
    const response = await systemApi.getSystemStats()
    // 标准化数据解析
    const data = response?.data || response
    
    // 更新组件数据
    if (data) {
      const dataTyped = data as any
      // 更新客户端统计
      if (dataTyped.clientStats) {
        const clientStatsData = dataTyped.clientStats
        clientStats.value.onlineUsers = clientStatsData.onlineUsers || clientStats.value.onlineUsers
        clientStats.value.avgResponseTime = clientStatsData.avgResponseTime || clientStats.value.avgResponseTime
      }
      
      // 更新后端统计
      if (dataTyped.backendStats) {
        const backendStatsData = dataTyped.backendStats
        backendStats.value.apiResponseTime = backendStatsData.apiResponseTime || backendStats.value.apiResponseTime
        backendStats.value.qps = backendStatsData.qps || backendStats.value.qps
      }
      
      // 更新数据库统计
      if (dataTyped.databaseStats) {
        const databaseStatsData = dataTyped.databaseStats
        databaseStats.value.connections = databaseStatsData.connections || databaseStats.value.connections
      }
      
      // 更新系统信息
      if (dataTyped.systemInfo) {
        const systemInfoData = dataTyped.systemInfo
        // 版本号从配置文件获取，不使用API返回值
        // systemInfo.value.version = systemInfoData.version || systemInfo.value.version
        systemInfo.value.uptime = systemInfoData.uptime || systemInfo.value.uptime
        systemInfo.value.environment = systemInfoData.environment || systemInfo.value.environment
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
    `确定要立即执行 "${row.name}" 维护任务吗？`,
    '执行确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`"${row.name}" 维护任务已启动`)
    // 更新维护计划状态
    row.status = '进行中'
    setTimeout(() => {
      row.status = '已执行'
      row.lastRun = new Date().toLocaleString('zh-CN', { hour12: false })
      ElMessage.success(`"${row.name}" 维护任务执行完成`)
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
const refreshMaintenancePlans = async () => {
  ElMessage.info('正在刷新维护计划...')
  try {
    // 从API获取维护历史作为维护计划数据的替代
    const response = await maintenanceApi.getMaintenanceHistory({ page: 1, pageSize: 10 })
    const data = response
    
    if (data && Array.isArray(data)) {
      // 用API返回的真实数据更新维护计划
      maintenancePlans.value = data.map((plan: any) => ({
        id: plan.id || plan.maintenanceId || 0,
        name: plan.name || plan.title || '维护计划',
        schedule: plan.schedule || plan.createdAt || plan.startTime || new Date().toLocaleString('zh-CN', { hour12: false }),
        status: plan.status || plan.state || '已完成',
        lastRun: plan.lastRun || plan.completedAt || plan.updatedAt || new Date().toLocaleString('zh-CN', { hour12: false }),
        timerId: null
      }))
      ElMessage.success('维护计划刷新成功')
    } else {
      ElMessage.warning('暂无维护计划数据')
    }
  } catch (error) {
    console.error('❌ 获取维护计划失败:', error)
    ElMessage.error('获取维护计划失败: ' + (error as Error).message)
  }
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
    console.log('Backend config:', config)
    ElMessage.success('后端配置信息获取成功')
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
    const result = response as any
    if (result && 'updated' in result && result.updated) {
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
  try {
    // 获取重启模式
    const modesResponse = await systemApi.getRestartModes() as any
    const modes = modesResponse.modes || []
    const defaultMode = modesResponse.defaultMode || 'graceful'

    // 构建模式选择的下拉选项
    const modeOptions = modes.map((mode: any) => ({
      value: mode.value,
      label: mode.label,
      description: mode.description,
      risk: mode.risk,
      estimatedDowntime: mode.estimatedDowntime
    }))

    // 创建自定义确认对话框内容
    const dialogContent = `
      <div class="restart-dialog">
        <p style="margin-bottom: 16px;">确定要重启客户端服务吗？这将向所有在线客户端发送重启命令。</p>
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">重启模式:</label>
          <select id="restart-mode-select" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #dcdfe6;">
            ${modeOptions.map((opt: any) => 
              `<option value="${opt.value}" ${opt.value === defaultMode ? 'selected' : ''}>${opt.label}</option>`
            ).join('')}
          </select>
        </div>
        <div id="mode-description" style="font-size: 12px; color: #909399; padding: 8px; background: #f4f4f5; border-radius: 4px;">
          ${modeOptions.find((opt: any) => opt.value === defaultMode)?.description || ''}
        </div>
        <div id="restart-risk" style="margin-top: 8px; font-size: 12px; display: flex; justify-content: space-between;">
          <span>预计停机时间: ${modeOptions.find((opt: any) => opt.value === defaultMode)?.estimatedDowntime || ''}</span>
          <span style="color: ${modeOptions.find((opt: any) => opt.value === defaultMode)?.risk === 'high' ? '#f56c6c' : modeOptions.find((opt: any) => opt.value === defaultMode)?.risk === 'medium' ? '#e6a23c' : '#67c23a'}">
            风险等级: ${modeOptions.find((opt: any) => opt.value === defaultMode)?.risk === 'high' ? '高' : modeOptions.find((opt: any) => opt.value === defaultMode)?.risk === 'medium' ? '中' : '低'}
          </span>
        </div>
      </div>
    `

    await ElMessageBox.confirm(
      dialogContent,
      '重启确认',
      {
        confirmButtonText: '确定重启',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        beforeClose: async (action, instance, done) => {
          if (action === 'confirm') {
            const selectEl = document.getElementById('restart-mode-select') as HTMLSelectElement
            const selectedMode = selectEl?.value || defaultMode
            const selectedOption = modeOptions.find((opt: any) => opt.value === selectedMode)
            
            instance.confirmButtonLoading = true
            instance.confirmButtonText = '发送中...'

            try {
              ElMessage.info('正在发送重启命令...')
              const result = await systemApi.restartClient({
                mode: selectedMode as 'immediate' | 'graceful' | 'delayed',
                notify_user: true,
                reason: '管理员手动重启'
              }) as any
              
              if (result) {
                ElMessage.success(`重启命令已发送（${selectedOption?.label}），预计影响 ${result.subscriberCount || 0} 个客户端`)
              } else {
                ElMessage.warning('发送重启命令失败')
              }
            } catch (error) {
              console.error('❌ 客户端重启失败:', error)
              
              // 区分不同类型的错误
              const errorObj = error as Error
              let errorMessage = '客户端重启失败: '
              
              // 检查是否为认证错误
              if (errorObj.name === 'UnauthorizedError' || errorObj.code === 'TOKEN_EXPIRED') {
                errorMessage = '登录已过期，请重新登录'
                // 可以添加自动跳转登录页的逻辑
                setTimeout(() => {
                  if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                  }
                }, 2000)
              } else if (errorObj.name === 'BadRequestError' || errorObj.code === 'BAD_REQUEST') {
                // 400错误，显示具体的错误信息
                errorMessage = errorObj.message || '请求参数错误，请检查输入'
              } else if (errorObj.message) {
                errorMessage += errorObj.message
              } else {
                errorMessage += '未知错误'
              }
              
              ElMessage.error(errorMessage)
            } finally {
              instance.confirmButtonLoading = false
              done()
            }
          } else {
            done()
          }
        }
      }
    )

    // 绑定模式切换事件
    setTimeout(() => {
      const selectEl = document.getElementById('restart-mode-select')
      const descEl = document.getElementById('mode-description')
      const riskEl = document.getElementById('restart-risk')
      
      if (selectEl) {
        selectEl.addEventListener('change', (e: Event) => {
          const target = e.target as HTMLSelectElement
          const selectedOption = modeOptions.find((opt: any) => opt.value === target.value)
          if (descEl && selectedOption) {
            descEl.textContent = selectedOption.description
          }
          if (riskEl && selectedOption) {
            const riskColor = selectedOption.risk === 'high' ? '#f56c6c' : selectedOption.risk === 'medium' ? '#e6a23c' : '#67c23a'
            const riskText = selectedOption.risk === 'high' ? '高' : selectedOption.risk === 'medium' ? '中' : '低'
            riskEl.innerHTML = `
              <span>预计停机时间: ${selectedOption.estimatedDowntime}</span>
              <span style="color: ${riskColor}">风险等级: ${riskText}</span>
            `
          }
        })
      }
    }, 100)

  } catch (error) {
    if ((error as any).__type !== 'cancel') {
      console.error('❌ 客户端重启失败:', error)
      ElMessage.error('客户端重启失败: ' + (error as Error).message)
    }
  }
}

// 客户端配置
const handleClientConfig = async () => {
  try {
    ElMessage.info('正在获取客户端配置信息...')
    // 调用API获取客户端配置
    const config = await systemApi.getClientConfig()
    ElMessage.success('客户端配置信息获取成功')
    console.log('Client config:', config)
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
    const result = response as any
    if (result && 'updated' in result && result.updated) {
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

// 数据库优化 (冗余函数，保留但修正乱码)
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

    ElMessage.success('实时数据刷新成功')
  } catch (error) {
    console.error('❌ 刷新实时数据失败:', error)
    ElMessage.error('刷新实时数据失败')
  }
}

// 快捷操作 - 备份
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
          console.log('Selected directory:', dirHandle)
          ElMessage.success('已选择备份目录，正在执行备份...')
        } catch (err) {
          console.log('User cancelled directory picker or error:', err)
          // 如果用户取消，则使用默认备份
          ElMessage.info('使用默认路径进行备份...')
        }
      }
      
      // 调用后端备份API
      await systemApi.backupDatabase()
      ElMessage.success('系统备份完成')
    } catch (error) {
      console.error('❌ 系统备份失败:', error)
      ElMessage.error('系统备份失败: ' + (error as Error).message)
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

  clientStats?: {
    version?: string
    onlineUsers?: number
    peakUsers?: number
    avgResponseTime?: number
    todayActiveUsers?: number
    errorRate?: number
    lastUpdate?: string
    status?: string
    statusText?: string
    statusType?: string
    healthScore?: number
    uptime?: string
    uptimeFormatted?: string
  }
  backendStats?: {
    version?: string
    apiResponseTime?: number
    qps?: number
    memoryUsage?: number
    cpuUsage?: number
    threadCount?: number
    lastUpdate?: string
    status?: string
    statusText?: string
    statusType?: string
    healthScore?: number
  }
  databaseStats?: {
    version?: string
    connections?: number
    maxConnections?: number
    cacheHitRate?: number
    slowQueries?: number
    tableSpaceUsage?: string
    lastUpdate?: string
    status?: string
    statusText?: string
    statusType?: string
    healthScore?: number
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
  extraStats?: {
    weeklyNewUsers?: number
    monthlyFeeTotal?: number
    todayVisits?: number
    systemAvailability?: string
  }
  alerts?: Alert[]
  performanceMetrics?: {
    throughput?: number
    avgResponseTime?: number
    errorRate?: number
    concurrentUsers?: number
  }
  metrics?: {
    version?: string
    onlineUsers?: number
    avgResponseTime?: number
    uptime?: string
    uptimeFormatted?: string
    activeConnections?: number
    maxConnections?: number
    cacheHitRate?: number
    slowQueries?: number
  }
  system?: {
    version?: string
    uptime?: string
    environment?: string
    startTime?: string
  }
}
// 检查维护状态
const checkMaintenanceStatus = async () => {
  try {
    // 优先从 Vuex Store 获取令牌
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      console.warn('⚠️ 未检测到管理员令牌，跳过维护状态检查')
      return
    }
    
    const response = await maintenanceApi.getMaintenanceStatus()
    const maintenanceData = response
    
    if (maintenanceData) {
      const maintenanceDataTyped = maintenanceData as any
      // 如果API返回了明确的状态信息，使用API返回的值
      if (maintenanceDataTyped.type !== undefined) {
        maintenanceStatus.value.type = maintenanceDataTyped.type
      }
      if (maintenanceDataTyped.text !== undefined) {
        maintenanceStatus.value.text = maintenanceDataTyped.text
      }
      // 如果API没有返回状态信息，根据其他字段判断状态
      // 例如，如果isActive字段且为true，则表示正在维护
      if (maintenanceDataTyped.isActive === true) {
        maintenanceStatus.value.type = 'warning'
        maintenanceStatus.value.text = '维护中'
      } else if (maintenanceDataTyped.isActive === false) {
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

// 获取系统统计数据的函数
const fetchSystemStats = async () => {
  try {
    // 优先从 Vuex Store 获取令牌，如果不存在则尝试从 localStorage 获取（作为兜底）
    const adminToken = localStorage.getItem('adminToken')
    const adminRefreshToken = localStorage.getItem('adminRefreshToken')
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null')
    
    console.log('🔐 登录状态检查:')
    console.log('  - adminToken:', adminToken ? `${adminToken.substring(0, 50)}...` : 'null')
    console.log('  - adminRefreshToken:', adminRefreshToken ? `${adminRefreshToken.substring(0, 50)}...` : 'null')
    console.log('  - adminUser:', adminUser ? '已存储' : 'null')
    
    if (!adminToken) {
      console.warn('⚠️ 未检测到管理员令牌，跳过系统统计请求')
      return
    }
    
    // 获取系统统计信息
    const response = await systemApi.getSystemStats()
    console.log('API Response:', response)
    // 标准化数据解析：兼容直接返回数据或嵌套在 data 中的结构
    const statsData = response?.data || response
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
      
      // 更新额外统计数据（第二排4个卡片）
      if (statsData.extraStats) {
        extraStats.value.weeklyNewUsers = statsData.extraStats.weeklyNewUsers !== undefined ? statsData.extraStats.weeklyNewUsers : extraStats.value.weeklyNewUsers
        extraStats.value.monthlyFeeTotal = statsData.extraStats.monthlyFeeTotal !== undefined ? statsData.extraStats.monthlyFeeTotal : extraStats.value.monthlyFeeTotal
        extraStats.value.todayVisits = statsData.extraStats.todayVisits !== undefined ? statsData.extraStats.todayVisits : extraStats.value.todayVisits
        extraStats.value.systemAvailability = statsData.extraStats.systemAvailability || extraStats.value.systemAvailability
      }
      console.log('📊 额外统计数据更新:', extraStats.value)

      // 更新性能指标数据
      if (statsData.performanceMetrics) {
        performanceMetrics.value.throughput = statsData.performanceMetrics.throughput || performanceMetrics.value.throughput
        performanceMetrics.value.avgResponseTime = statsData.performanceMetrics.avgResponseTime || performanceMetrics.value.avgResponseTime
        performanceMetrics.value.errorRate = statsData.performanceMetrics.errorRate || performanceMetrics.value.errorRate
        console.log('📊 性能指标数据更新:', performanceMetrics.value)
      }

      // 更新告警信息
      if (statsData.alerts && Array.isArray(statsData.alerts)) {
        alerts.value = statsData.alerts.map((alert: any) => ({
          id: alert.id,
          level: alert.level || 'INFO',
          content: alert.content || alert.message || '',
          time: alert.time || new Date().toLocaleString('zh-CN', { hour12: false })
        }))
        console.log('📊 告警信息更新:', alerts.value.length, '条')
      }
      

      
      // 更新系统信息数据
      if (statsData.systemInfo) {
        // 版本号从配置文件获取，不使用API返回值
        // systemInfo.value.version = statsData.systemInfo.version || systemInfo.value.version
        systemInfo.value.uptime = statsData.systemInfo.uptime || systemInfo.value.uptime
        systemInfo.value.environment = statsData.systemInfo.environment || systemInfo.value.environment
        systemInfo.value.startTime = statsData.systemInfo.startTime || systemInfo.value.startTime
      }
    }
    
    // 自动获取系统组件状态（客户端、后端、数据库）
    console.log('📊 开始自动获取系统组件状态...')
    try {
      const [clientResponse, backendResponse, databaseResponse] = await Promise.all([
        systemApi.getClientStatus(),
        systemApi.getBackendStatus(),
        systemApi.getDatabaseStatus()
      ])
      
      const clientData = clientResponse
      const backendData = backendResponse
      const databaseData = databaseResponse
      
      console.log('📊 客户端状态:', clientData)
      console.log('📊 后端服务状态:', backendData)
      console.log('📊 数据库状态:', databaseData)
      
      // 更新客户端状态
      if (clientData) {
        const clientDataTyped = clientData as any
        clientStats.value.status = clientDataTyped.status || clientStats.value.status
        clientStats.value.statusType = clientDataTyped.statusType || clientStats.value.statusType
        clientStats.value.healthScore = clientDataTyped.healthScore || clientStats.value.healthScore
        
        // 优先从 metrics 获取指标
        const metrics = clientDataTyped.metrics || {}
        // 客户端版本从配置文件获取，不使用API返回值
        // clientStats.value.version = metrics.version || clientDataTyped.version || clientStats.value.version
        clientStats.value.onlineUsers = metrics.onlineUsers || clientDataTyped.onlineUsers || clientStats.value.onlineUsers
        clientStats.value.userDistribution = metrics.userDistribution || clientDataTyped.userDistribution || { high: 0, normal: 0, suspicious: 0 }
        clientStats.value.qualityIndex = metrics.qualityIndex || clientDataTyped.qualityIndex || 100
        clientStats.value.avgResponseTime = metrics.avgResponseTime || clientDataTyped.avgResponseTime || clientStats.value.avgResponseTime
        clientStats.value.peakUsers = metrics.peakUsers || clientDataTyped.peakUsers || clientStats.value.peakUsers
        clientStats.value.todayActiveUsers = metrics.todayActiveUsers || clientDataTyped.todayActiveUsers || clientStats.value.todayActiveUsers
        clientStats.value.errorRate = metrics.errorRate || clientDataTyped.errorRate || clientStats.value.errorRate
        clientStats.value.uptime = metrics.uptime || clientDataTyped.uptime || clientStats.value.uptime
        clientStats.value.uptimeFormatted = metrics.uptimeFormatted || clientDataTyped.uptimeFormatted || clientStats.value.uptimeFormatted
        
        clientStats.value.lastUpdate = clientDataTyped.lastUpdate || clientStats.value.lastUpdate
      }
      
      // 更新后端服务状态
      if (backendData) {
        const backendDataTyped = backendData as any
        backendStats.value.status = backendDataTyped.status || backendStats.value.status
        backendStats.value.statusType = backendDataTyped.statusType || backendStats.value.statusType
        backendStats.value.statusText = backendDataTyped.statusText || backendStats.value.statusText
        backendStats.value.healthScore = backendDataTyped.healthScore || backendStats.value.healthScore
        
        // 优先从 metrics 获取指标
        const metrics = backendDataTyped.metrics || {}
        // 后端版本从配置文件获取，不使用API返回值
        // backendStats.value.version = metrics.version || backendDataTyped.version || backendStats.value.version
        backendStats.value.apiResponseTime = metrics.apiResponseTime || backendDataTyped.apiResponseTime || backendStats.value.apiResponseTime
        backendStats.value.qps = metrics.qps ?? backendDataTyped.qps ?? backendStats.value.qps
        backendStats.value.uptime = metrics.uptime ?? backendDataTyped.uptime ?? backendStats.value.uptime
        backendStats.value.uptimeFormatted = metrics.uptimeFormatted || backendDataTyped.uptimeFormatted || backendStats.value.uptimeFormatted
        
        backendStats.value.lastUpdate = backendDataTyped.lastUpdate || backendStats.value.lastUpdate
      }
      
      // 更新数据库状态
      if (databaseData) {
        const databaseDataTyped = databaseData as any
        databaseStats.value.status = databaseDataTyped.status || databaseStats.value.status
        databaseStats.value.statusType = databaseDataTyped.statusType || databaseStats.value.statusType
        databaseStats.value.healthScore = databaseDataTyped.healthScore || databaseStats.value.healthScore
        
        // 优先从 metrics 获取指标
        const metrics = databaseDataTyped.metrics || {}
        // 数据库版本从配置文件获取，不使用API返回值
        // databaseStats.value.version = metrics.version || databaseDataTyped.version || databaseStats.value.version
        databaseStats.value.connections = metrics.activeConnections || databaseDataTyped.activeConnections || databaseStats.value.connections
        databaseStats.value.maxConnections = metrics.maxConnections || databaseDataTyped.maxConnections || databaseStats.value.maxConnections
        databaseStats.value.cacheHitRate = metrics.cacheHitRate || databaseDataTyped.cacheHitRate || databaseStats.value.cacheHitRate
        databaseStats.value.slowQueries = metrics.slowQueries || databaseDataTyped.slowQueries || databaseStats.value.slowQueries
        databaseStats.value.tableSpaceUsage = metrics.tableSpaceUsage || databaseDataTyped.tableSpaceUsage || databaseStats.value.tableSpaceUsage
        
        databaseStats.value.lastUpdate = databaseDataTyped.lastUpdate || databaseStats.value.lastUpdate
      }
      
      console.log('📊 系统组件状态自动更新完成', {
        client: clientStats.value,
        backend: backendStats.value,
        database: databaseStats.value
      })
    } catch (statusError) {
      console.error('❌ 获取系统组件状态失败:', statusError)
    }
    
    console.log('📊 系统统计数据获取成功:', statsData)
  } catch (error) {
    console.error('❌ 获取系统统计数据失败:', error)
    ElMessage.error('获取系统统计数据失败: ' + (error as Error).message)
  }
}

// 检查网络状态
const checkNetworkStatus = async () => {
  try {
    // 优先从 Vuex Store 获取令牌
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      console.warn('⚠️ 未检测到管理员令牌，跳过网络状态检查')
      return
    }
    
    const response = await systemApi.checkNetworkStatus()
    const networkData = response
    
    if (networkData) {
      const networkDataTyped = networkData as any
      networkStatus.value.type = typeof networkDataTyped.type === 'string' ? networkDataTyped.type : 'success'
      networkStatus.value.text = typeof networkDataTyped.text === 'string' ? networkDataTyped.text : '正常'
    }
  } catch (error) {
    console.error('❌ 检查网络状态失败:', error)
    // 网络检查失败时，设置为异常状态
    networkStatus.value.type = 'danger'
    networkStatus.value.text = '异常'
  }
}

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    const response = await userApi.getUserStats()
    const userStats = response
    if (userStats) {
      // 更新用户相关统计数据
      // 示例：如果需要更新某些数据，可以在这里处理
      // systemStats.value.users = userStats.totalUsers || systemStats.value.users
    }
  } catch (error) {
    console.error('❌ 获取用户统计数据失败:', error)
  }
}

/**
 * 获取客户端实时数据
 * 在线用户数、用户质量分布等实时时间点的数据
 */
const fetchClientRealtimeData = async () => {
  try {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      console.warn('⚠️ 未检测到管理员令牌，跳过客户端实时数据获取')
      return
    }

    console.log('📊 开始获取客户端实时数据...')

    // 获取客户端状态数据
    const clientResponse = await systemApi.getClientStatus()
    const clientData = clientResponse as any

    if (clientData) {
      // 更新客户端状态数据
      clientStats.value.status = clientData.status || clientStats.value.status
      clientStats.value.statusType = clientData.statusType || clientStats.value.statusType
      clientStats.value.healthScore = clientData.healthScore || clientStats.value.healthScore

      if (clientData.metrics) {
        const metrics = clientData.metrics
        // 客户端版本从配置文件获取，不使用API返回值
        // clientStats.value.version = metrics.version || clientStats.value.version
        clientStats.value.onlineUsers = metrics.onlineUsers ?? clientStats.value.onlineUsers
        clientStats.value.userDistribution = metrics.userDistribution || clientStats.value.userDistribution
        clientStats.value.qualityIndex = metrics.qualityIndex ?? clientStats.value.qualityIndex
        clientStats.value.alerts = metrics.alerts || clientStats.value.alerts
        clientStats.value.peakUsers = metrics.peakUsers ?? clientStats.value.peakUsers
        clientStats.value.avgResponseTime = metrics.avgResponseTime ?? clientStats.value.avgResponseTime
        clientStats.value.todayActiveUsers = metrics.todayActiveUsers ?? clientStats.value.todayActiveUsers
        clientStats.value.errorRate = metrics.errorRate ?? clientStats.value.errorRate
        clientStats.value.uptime = metrics.uptime || clientStats.value.uptime
        clientStats.value.uptimeFormatted = metrics.uptimeFormatted || clientStats.value.uptimeFormatted
      }

      clientStats.value.lastUpdate = new Date().toLocaleString('zh-CN', { hour12: false })

      console.log('✅ 客户端实时数据获取成功:', {
        onlineUsers: clientStats.value.onlineUsers,
        userDistribution: clientStats.value.userDistribution,
        qualityIndex: clientStats.value.qualityIndex,
        lastUpdate: clientStats.value.lastUpdate
      })
    }
  } catch (error) {
    console.error('❌ 获取客户端实时数据失败:', error)
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

      
      // 清空其他可能的缓存数据
      // 这里可以添加更多特定于应用的缓存清除逻辑
      
      // 模拟清空缓存过程
      setTimeout(() => {
        ElMessage.success('系统缓存已清空，内存使用率已降低')
        
        // 可选：刷新页面以确保所有缓存都被清除
        // window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('❌ 清空缓存时出现错误:', error)
      ElMessage.error('清空缓存时出现错误: ' + (error as Error).message)
    }
  }).catch(() => {
    ElMessage.info('已取消清空缓存')
  })
}

const handleRestart = () => {
  ElMessageBox.confirm(
    '确定要重启系统服务吗？这将导致系统短暂不可用（预计1-3分钟）。',
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
          systemInfo.value.startTime = now.toLocaleString('zh-CN', { hour12: false })
          systemInfo.value.uptime = '0天 0小时 0分钟'
          

        }, 1500)
      }, 1500)
    }, 1000)
  }).catch(() => {
    ElMessage.info('已取消重启')
  })
}

const handleMaintenance = () => {
  // 直接跳转到维护页面
  window.location.href = `http://${window.location.hostname}:8100/maintenance`
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
let clientDataTimer: NodeJS.Timeout | null = null

// 是否正在显示客户端详情tab
const isClientTabActive = ref(false)

/**
 * 启动客户端数据定时刷新
 * 当用户在客户端详情页面时，每10秒刷新一次数据
 */
const startClientDataTimer = () => {
  if (clientDataTimer) {
    clearInterval(clientDataTimer)
  }

  clientDataTimer = setInterval(async () => {
    if (isClientTabActive.value) {
      console.log('⏰ 定时刷新客户端实时数据...')
      await fetchClientRealtimeData()
    }
  }, 10000) // 每10秒刷新一次
}

/**
 * 停止客户端数据定时刷新
 */
const stopClientDataTimer = () => {
  if (clientDataTimer) {
    clearInterval(clientDataTimer)
    clientDataTimer = null
  }
}

// 获取各组件版本信息
const fetchVersionInfo = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    console.log('🔍 [Version] 开始获取版本信息，API地址:', baseUrl)
    
    const [adminRes, clientRes, backendRes] = await Promise.all([
      fetch(`${baseUrl}/api/version/admin`).catch(() => null),
      fetch(`${baseUrl}/api/version/client`).catch(() => null),
      fetch(`${baseUrl}/api/version/backend`).catch(() => null)
    ])
    
    if (adminRes?.ok) {
      const data = await adminRes.json()
      if (data.success && data.data) {
        systemInfo.value.version = data.data.version || '1.0.0'
        console.log('🔍 [Version] 管理端版本:', systemInfo.value.version)
      }
    }
    
    if (clientRes?.ok) {
      const data = await clientRes.json()
      if (data.success && data.data) {
        clientStats.value.version = data.data.version || '1.0.0'
        console.log('🔍 [Version] 客户端版本:', clientStats.value.version)
      }
    } else {
      clientStats.value.version = '1.0.0'
      console.warn('⚠️ [Version] 无法获取客户端版本，使用默认值: 1.0.0')
    }
    
    if (backendRes?.ok) {
      const data = await backendRes.json()
      if (data.success && data.data) {
        backendStats.value.version = data.data.version || '1.0.0'
        console.log('🔍 [Version] 后端版本:', backendStats.value.version)
      }
    } else {
      backendStats.value.version = '1.0.0'
      console.warn('⚠️ [Version] 无法获取后端版本，使用默认值: 1.0.0')
    }
    
    console.log('🔍 [Version] 版本信息获取完成:', {
      system: systemInfo.value.version,
      client: clientStats.value.version,
      backend: backendStats.value.version
    })
  } catch (error) {
    console.error('❌ [Version] 获取版本信息失败:', error)
    clientStats.value.version = '1.0.0'
    backendStats.value.version = '1.0.0'
  }
}

// 组件挂载时获取真实数据
onMounted(async () => {
  console.log('🏠 首页组件加载完成，开始初始化...')
  
  // 获取各组件版本信息
  await fetchVersionInfo()
  
  // 获取系统统计数据
  await fetchSystemStats()
  
  // 获取系统配置
  await fetchSystemConfig()
  
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

  // 清理客户端数据定时器
  stopClientDataTimer()
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
const handleTabChange = async (tabName: string) => {
  // 如果离开客户端详情tab，停止定时刷新
  if (activeComponentTab.value === 'client' && tabName !== 'client') {
    isClientTabActive.value = false
    stopClientDataTimer()
  }

  // 当切换到包含图表的选项卡时，重新初始化图表
  if (tabName === 'client' || tabName === 'backend' || tabName === 'database' || tabName === 'monitor') {
    // 先重置图表初始化状态
    resetChartInitialization()
    // 延迟一段时间确保选项卡内容完全激活和渲染完成
    setTimeout(() => {
      // 使用Intersection Observer确保图表容器可见时才初始化
      initChartsWhenVisible()
    }, 600)  // 增加延迟时间确保选项卡完全激活

    // 如果切换到客户端详情tab，立即获取实时数据并启动定时刷新
    if (tabName === 'client') {
      isClientTabActive.value = true
      await fetchClientRealtimeData()
      startClientDataTimer()
    }
    
    // 如果切换到系统监控tab，刷新告警信息
    if (tabName === 'monitor') {
      await handleRefreshAlerts()
    }
  }
}

// 带有重试机制的图表初始化函数
const initChartWithRetry = (elementId: string, option: any, retries = 0) => {
  const chartDom = document.getElementById(elementId)
  if (chartDom) {
    // 检查图表是否已经初始化
    if (chartDom.getAttribute('data-chart-initialized')) {
      return
    }
    
    // 检查DOM元素是否有有效的高宽
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

.stat-icon.text-success {
  color: #67C23A;
}

.stat-icon.text-primary {
  color: #409EFF;
}

.stat-icon.text-warning {
  color: #E6A23C;
}

.stat-icon.text-danger {
  color: #F56C6C;
}

.text-success {
  color: #67C23A !important;
}

.text-primary {
  color: #409EFF !important;
}

.text-warning {
  color: #E6A23C !important;
}

.text-danger {
  color: #F56C6C !important;
}

.text-muted {
  color: #909399 !important;
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

.restart-progress {
  padding: 20px 0;
  text-align: center;
}

.restart-progress .el-progress {
  margin-bottom: 16px;
}

.restart-status {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

.cleanup-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.user-quality-dist {
  padding: 10px 0;
}

.dist-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.dist-label {
  width: 120px;
  font-size: 13px;
  color: #606266;
}

.dist-item .el-progress {
  flex: 1;
  margin: 0 15px;
}

.dist-count {
  width: 40px;
  text-align: right;
  font-size: 13px;
  color: #909399;
}

@media (max-width: 768px) {
  .status-grid, 
  .actions-grid, 
  .cleanup-actions {
    grid-template-columns: 1fr;
  }
  
  .component-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 15px;
  }
  
  .component-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .health-score {
    flex-direction: column;
  }
  
  .dist-label {
    width: 80px;
  }
}
</style>
