<template>
  <div class="gray-release-control-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>灰度发布控制</span>
          <div>
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button type="primary" @click="handleCreate">创建灰度策略</el-button>
          </div>
        </div>
      </template>
      
      <el-alert
        title="功能说明"
        description="在此页面可以创建和管理灰度发布策略，控制新功能对不同用户群体的开放程度"
        type="info"
        show-icon
        style="margin-bottom: 20px;"
      />
      
      <!-- 灰度策略概览 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-primary">
                <el-icon size="24"><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">总策略数</div>
                <div class="stat-value">{{ stats.total }}</div>
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
                <div class="stat-title">进行中</div>
                <div class="stat-value">{{ stats.inProgress }}</div>
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
                <div class="stat-title">待开始</div>
                <div class="stat-value">{{ stats.pending }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon bg-info">
                <el-icon size="24"><Finished /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-title">已完成</div>
                <div class="stat-value">{{ stats.completed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :model="searchForm" label-width="80px" inline>
          <el-form-item label="策略名称">
            <el-input v-model="searchForm.name" placeholder="请输入策略名称" clearable />
          </el-form-item>
          
          <el-form-item label="功能名称">
            <el-input v-model="searchForm.featureName" placeholder="请输入功能名称" clearable />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待开始" value="pending" />
              <el-option label="进行中" value="in-progress" />
              <el-option label="暂停" value="paused" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 灰度策略列表 -->
      <el-table :data="strategyList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="策略名称" />
        <el-table-column prop="featureName" label="功能名称" />
        <el-table-column prop="targetGroup" label="目标用户组" width="150">
          <template #default="scope">
            {{ getUserGroupText(scope.row.targetGroup) }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.progress" 
              :status="getProgressStatus(scope.row.status)" 
            />
          </template>
        </el-table-column>
        <el-table-column prop="currentPercentage" label="当前比例" width="100">
          <template #default="scope">
            {{ scope.row.currentPercentage }}%
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="预计结束时间" width="160" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              @click="handleEdit(scope.row)" 
              :disabled="scope.row.status === 'completed'"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              :type="getActionButtonType(scope.row.status)" 
              @click="handleAction(scope.row)"
            >
              {{ getActionText(scope.row.status) }}
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
    </el-card>
    
    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="策略名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入策略名称" />
            </el-form-item>
            
            <el-form-item label="关联功能" prop="featureId">
              <el-select 
                v-model="formData.featureId" 
                placeholder="请选择关联功能" 
                style="width: 100%;"
                @change="handleFeatureChange"
              >
                <el-option 
                  v-for="feature in featureList" 
                  :key="feature.id" 
                  :label="feature.name" 
                  :value="feature.id" 
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="功能描述">
              {{ selectedFeatureDescription }}
            </el-form-item>
            
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="formData.startTime"
                type="datetime"
                placeholder="请选择开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="预计结束时间" prop="endTime">
              <el-date-picker
                v-model="formData.endTime"
                type="datetime"
                placeholder="请选择预计结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
            
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio label="pending">待开始</el-radio>
                <el-radio label="in-progress">进行中</el-radio>
                <el-radio label="paused">暂停</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="用户分组策略" name="userGroup">
            <el-form-item label="目标用户组" prop="targetGroup">
              <el-select v-model="formData.targetGroup" placeholder="请选择目标用户组" style="width: 100%;">
                <el-option label="所有用户" value="all" />
                <el-option label="管理员" value="admin" />
                <el-option label="普通用户" value="user" />
                <el-option label="VIP用户" value="vip" />
                <el-option label="内测用户" value="beta" />
                <el-option label="按地区划分" value="region" />
                <el-option label="按设备类型划分" value="device" />
                <el-option label="按用户标签划分" value="tag" />
                <el-option label="按用户行为划分" value="behavior" />
                <el-option label="自定义用户群组" value="custom" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="用户筛选条件" v-if="formData.targetGroup === 'region' || formData.targetGroup === 'device' || formData.targetGroup === 'tag' || formData.targetGroup === 'behavior'">
              <el-input 
                v-model="formData.userFilter" 
                placeholder="请输入筛选条件，如地区：北京、上海；设备：iOS、Android；标签：高价值用户；行为：频繁登录" 
              />
            </el-form-item>
            
            <el-form-item label="自定义用户群组" v-if="formData.targetGroup === 'custom'">
              <el-select 
                v-model="formData.customUserGroup" 
                placeholder="请选择自定义用户群组" 
                style="width: 100%;"
                multiple
              >
                <el-option 
                  v-for="group in userGroups" 
                  :key="group.id" 
                  :label="group.name" 
                  :value="group.id" 
                />
              </el-select>
              <div style="margin-top: 10px;">
                <el-button size="small" @click="handleCreateUserGroup">创建用户群组</el-button>
                <el-button size="small" @click="handleManageUserGroups">管理用户群组</el-button>
              </div>
            </el-form-item>
            
            <el-form-item label="A/B测试分组">
              <el-switch v-model="formData.abTestEnabled" />
              <div class="form-tip">启用A/B测试将随机分配用户到不同版本</div>
            </el-form-item>
            
            <el-form-item label="测试组比例" v-if="formData.abTestEnabled">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-slider 
                    v-model="formData.testGroupA" 
                    :min="0" 
                    :max="100" 
                    show-input 
                    style="width: 100%;" 
                  />
                  <div class="slider-label">A组 ({{ formData.testGroupA }}%)</div>
                </el-col>
                <el-col :span="12">
                  <el-slider 
                    v-model="formData.testGroupB" 
                    :min="0" 
                    :max="100" 
                    show-input 
                    style="width: 100%;" 
                  />
                  <div class="slider-label">B组 ({{ formData.testGroupB }}%)</div>
                </el-col>
              </el-row>
              <div class="form-tip">A组和B组的比例之和应为100%</div>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="发布策略" name="release">
            <el-form-item label="初始发布比例" prop="initialPercentage">
              <el-slider 
                v-model="formData.initialPercentage" 
                :min="0" 
                :max="100" 
                show-input 
                style="width: 100%;" 
              />
              <span class="form-tip">% (0-100)</span>
            </el-form-item>
            
            <el-form-item label="手动调整开关">
              <el-switch v-model="formData.manualAdjustment" />
              <div class="form-tip">开启后可手动调整发布比例</div>
            </el-form-item>
            
            <el-form-item label="手动调整比例" v-if="formData.manualAdjustment">
              <el-slider 
                v-model="formData.manualPercentage" 
                :min="0" 
                :max="100" 
                show-input 
                style="width: 100%;" 
              />
              <span class="form-tip">% (0-100)</span>
            </el-form-item>
            
            <el-form-item label="发布节奏" prop="releasePace">
              <el-select v-model="formData.releasePace" placeholder="请选择发布节奏" style="width: 100%;">
                <el-option label="快速发布（每天增加20%）" value="fast" />
                <el-option label="中速发布（每天增加10%）" value="medium" />
                <el-option label="慢速发布（每天增加5%）" value="slow" />
                <el-option label="自定义节奏" value="custom" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="自定义节奏" v-if="formData.releasePace === 'custom'">
              <el-input-number 
                v-model="formData.customPace" 
                :min="1" 
                :max="100" 
                controls-position="right" 
                style="width: 100%;" 
              />
              <span class="form-tip">% 每天增长比例</span>
            </el-form-item>
            
            <el-form-item label="动态调整">
              <el-switch v-model="formData.dynamicAdjustment" />
              <div class="form-tip">根据监控数据自动调整发布比例</div>
            </el-form-item>
            
            <el-form-item label="调整策略" v-if="formData.dynamicAdjustment">
              <el-select v-model="formData.adjustmentStrategy" placeholder="请选择调整策略" style="width: 100%;">
                <el-option label="保守策略" value="conservative" />
                <el-option label="平衡策略" value="balanced" />
                <el-option label="激进策略" value="aggressive" />
              </el-select>
              <div class="form-tip">不同策略影响发布比例调整的速度和幅度</div>
            </el-form-item>
            
            <el-form-item label="最大发布比例" v-if="formData.dynamicAdjustment">
              <el-slider 
                v-model="formData.maxPercentage" 
                :min="formData.initialPercentage" 
                :max="100" 
                show-input 
                style="width: 100%;" 
              />
              <span class="form-tip">% (不低于初始比例)</span>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="异常处理" name="exception">
            <el-form-item label="异常处理策略">
              <el-select v-model="formData.exceptionStrategy" placeholder="请选择异常处理策略" style="width: 100%;">
                <el-option label="自动回滚" value="rollback" />
                <el-option label="暂停发布" value="pause" />
                <el-option label="继续发布" value="continue" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="回滚触发条件">
              <el-checkbox-group v-model="formData.rollbackTriggers">
                <el-checkbox label="errorRate">错误率过高</el-checkbox>
                <el-checkbox label="responseTime">响应时间过长</el-checkbox>
                <el-checkbox label="userFeedback">负面反馈过多</el-checkbox>
                <el-checkbox label="performance">性能下降</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="回滚阈值">
              <el-slider 
                v-model="formData.rollbackThreshold" 
                :min="0" 
                :max="100" 
                show-input 
                style="width: 100%;" 
              />
              <span class="form-tip">% 错误率超过此值将触发回滚</span>
            </el-form-item>
            
            <el-form-item label="响应时间阈值" v-if="formData.rollbackTriggers.includes('responseTime')">
              <el-input-number 
                v-model="formData.responseTimeThreshold" 
                :min="100" 
                :max="10000" 
                controls-position="right" 
                style="width: 100%;" 
              />
              <span class="form-tip">毫秒 (响应时间超过此值将触发回滚)</span>
            </el-form-item>
            
            <el-form-item label="负面反馈阈值" v-if="formData.rollbackTriggers.includes('userFeedback')">
              <el-slider 
                v-model="formData.negativeFeedbackThreshold" 
                :min="0" 
                :max="100" 
                show-input 
                style="width: 100%;" 
              />
              <span class="form-tip">% 负面反馈比例超过此值将触发回滚</span>
            </el-form-item>
            
            <el-form-item label="监控指标">
              <el-checkbox-group v-model="formData.monitorMetrics">
                <el-checkbox label="errorRate">错误率</el-checkbox>
                <el-checkbox label="responseTime">响应时间</el-checkbox>
                <el-checkbox label="userFeedback">用户反馈</el-checkbox>
                <el-checkbox label="performance">性能指标</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="回滚延迟">
              <el-input-number 
                v-model="formData.rollbackDelay" 
                :min="0" 
                :max="3600" 
                controls-position="right" 
                style="width: 100%;" 
              />
              <span class="form-tip">秒 (触发回滚前的等待时间)</span>
            </el-form-item>
            
            <el-form-item label="回滚通知">
              <el-switch v-model="formData.rollbackNotification" />
              <div class="form-tip">回滚时发送通知给相关人员</div>
            </el-form-item>
            
            <el-form-item label="通知方式" v-if="formData.rollbackNotification">
              <el-checkbox-group v-model="formData.notificationMethods">
                <el-checkbox label="email">邮件</el-checkbox>
                <el-checkbox label="sms">短信</el-checkbox>
                <el-checkbox label="webhook">Webhook</el-checkbox>
                <el-checkbox label="dingtalk">钉钉</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="通知接收人" v-if="formData.rollbackNotification">
              <el-select 
                v-model="formData.notificationRecipients" 
                placeholder="请选择通知接收人" 
                style="width: 100%;"
                multiple
              >
                <el-option 
                  v-for="recipient in notificationRecipients" 
                  :key="recipient.id" 
                  :label="recipient.name" 
                  :value="recipient.id" 
                />
              </el-select>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="A/B测试配置" name="abtest">
            <div v-if="formData.abTestEnabled">
              <el-form-item label="测试目标">
                <el-select v-model="formData.abTestGoal" placeholder="请选择测试目标" style="width: 100%;">
                  <el-option label="转化率" value="conversion" />
                  <el-option label="用户留存" value="retention" />
                  <el-option label="用户满意度" value="satisfaction" />
                  <el-option label="性能指标" value="performance" />
                  <el-option label="收入增长" value="revenue" />
                  <el-option label="用户活跃度" value="engagement" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="测试周期">
                <el-input-number 
                  v-model="formData.abTestDuration" 
                  :min="1" 
                  :max="90" 
                  controls-position="right" 
                  style="width: 100%;" 
                />
                <span class="form-tip">天</span>
              </el-form-item>
              
              <el-form-item label="流量分配">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-slider 
                      v-model="formData.testGroupA" 
                      :min="0" 
                      :max="100" 
                      show-input 
                      style="width: 100%;" 
                    />
                    <div class="slider-label">A组 ({{ formData.testGroupA }}%)</div>
                  </el-col>
                  <el-col :span="12">
                    <el-slider 
                      v-model="formData.testGroupB" 
                      :min="0" 
                      :max="100" 
                      show-input 
                      style="width: 100%;" 
                    />
                    <div class="slider-label">B组 ({{ formData.testGroupB }}%)</div>
                  </el-col>
                </el-row>
                <div class="form-tip">A组和B组的比例之和应为100%</div>
              </el-form-item>
              
              <el-form-item label="统计显著性">
                <el-slider 
                  v-model="formData.abTestSignificance" 
                  :min="80" 
                  :max="99" 
                  show-input 
                  style="width: 100%;" 
                />
                <span class="form-tip">% (达到此置信度时可得出结论)</span>
              </el-form-item>
              
              <el-form-item label="多变量测试">
                <el-switch v-model="formData.multivariateTest" />
                <div class="form-tip">启用多变量测试可以同时测试多个变量</div>
              </el-form-item>
              
              <el-form-item label="变量数量" v-if="formData.multivariateTest">
                <el-input-number 
                  v-model="formData.variableCount" 
                  :min="2" 
                  :max="5" 
                  controls-position="right" 
                  style="width: 100%;" 
                />
                <span class="form-tip">最多可测试5个变量</span>
              </el-form-item>
              
              <el-form-item label="自动决策">
                <el-switch v-model="formData.abTestAutoDecision" />
                <div class="form-tip">测试结束后自动选择优胜版本</div>
              </el-form-item>
            </div>
            <div v-else>
              <el-alert
                title="请先启用A/B测试分组"
                description="在'用户分组策略'标签页中启用A/B测试分组后，可配置详细测试方案"
                type="info"
                show-icon
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="反馈收集" name="feedback">
            <el-form-item label="反馈收集方式">
              <el-checkbox-group v-model="formData.feedbackMethods">
                <el-checkbox label="inApp">应用内反馈</el-checkbox>
                <el-checkbox label="email">邮件调查</el-checkbox>
                <el-checkbox label="sms">短信调研</el-checkbox>
                <el-checkbox label="push">推送通知</el-checkbox>
                <el-checkbox label="web">网页调查</el-checkbox>
                <el-checkbox label="call">电话回访</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="反馈频率">
              <el-select v-model="formData.feedbackFrequency" placeholder="请选择反馈频率" style="width: 100%;">
                <el-option label="每次使用后" value="afterUse" />
                <el-option label="每日一次" value="daily" />
                <el-option label="每周一次" value="weekly" />
                <el-option label="每月一次" value="monthly" />
                <el-option label="仅一次" value="once" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="触发条件">
              <el-select v-model="formData.feedbackTrigger" placeholder="请选择触发条件" style="width: 100%;" multiple>
                <el-option label="使用特定功能后" value="featureUsed" />
                <el-option label="遇到错误后" value="errorOccurred" />
                <el-option label="使用一段时间后" value="timeElapsed" />
                <el-option label="达到某个里程碑" value="milestoneReached" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="反馈奖励">
              <el-switch v-model="formData.feedbackReward" />
              <div class="form-tip">用户提交反馈后给予奖励</div>
            </el-form-item>
            
            <el-form-item label="奖励策略" v-if="formData.feedbackReward">
              <el-select v-model="formData.rewardStrategy" placeholder="请选择奖励策略" style="width: 100%;">
                <el-option label="固定奖励" value="fixed" />
                <el-option label="根据反馈质量奖励" value="qualityBased" />
                <el-option label="根据反馈长度奖励" value="lengthBased" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="奖励类型" v-if="formData.feedbackReward">
              <el-select v-model="formData.rewardType" placeholder="请选择奖励类型" style="width: 100%;">
                <el-option label="积分" value="points" />
                <el-option label="优惠券" value="coupon" />
                <el-option label="现金红包" value="cash" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="奖励数量" v-if="formData.feedbackReward">
              <el-input-number 
                v-model="formData.rewardAmount" 
                :min="1" 
                :max="1000" 
                controls-position="right" 
                style="width: 100%;" 
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="策略详情" width="900px">
      <el-tabs v-model="detailActiveTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="策略名称">{{ detailData.name }}</el-descriptions-item>
            <el-descriptions-item label="关联功能">{{ getFeatureText(detailData.featureId) }}</el-descriptions-item>
            <el-descriptions-item label="功能描述" :span="2">{{ getFeatureDescription(detailData.featureId) }}</el-descriptions-item>
            <el-descriptions-item label="目标用户组">{{ getUserGroupText(detailData.targetGroup) }}</el-descriptions-item>
            <el-descriptions-item label="用户筛选条件">{{ detailData.userFilter || '无' }}</el-descriptions-item>
            <el-descriptions-item label="初始发布比例">{{ detailData.initialPercentage }}%</el-descriptions-item>
            <el-descriptions-item label="当前发布比例">{{ detailData.currentPercentage }}%</el-descriptions-item>
            <el-descriptions-item label="发布节奏">{{ getReleasePaceText(detailData.releasePace) }}</el-descriptions-item>
            <el-descriptions-item label="自定义节奏" v-if="detailData.releasePace === 'custom'">{{ detailData.customPace }}%/天</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ detailData.startTime }}</el-descriptions-item>
            <el-descriptions-item label="预计结束时间">{{ detailData.endTime }}</el-descriptions-item>
            <el-descriptions-item label="实际结束时间">{{ detailData.actualEndTime || '未结束' }}</el-descriptions-item>
            <el-descriptions-item label="异常处理策略">{{ getExceptionStrategyText(detailData.exceptionStrategy) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(detailData.status)">
                {{ getStatusText(detailData.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前进度">
              <el-progress 
                :percentage="detailData.progress" 
                :status="getProgressStatus(detailData.status)" 
              />
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ detailData.updateTime }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="实时监控" name="monitor">
          <div v-if="detailData.status === 'in-progress'">
            <!-- 实时监控图表 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>错误率监控</span>
                  </template>
                  <div ref="errorRateChartRef" style="height: 200px;"></div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>用户反馈</span>
                  </template>
                  <div ref="feedbackChartRef" style="height: 200px;"></div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>性能指标</span>
                  </template>
                  <div ref="performanceChartRef" style="height: 200px;"></div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 监控指标 -->
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="6">
                <el-card class="metric-card">
                  <div class="metric-value">{{ monitoringData.errorRate }}%</div>
                  <div class="metric-label">当前错误率</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="metric-card">
                  <div class="metric-value">{{ monitoringData.responseTime }}ms</div>
                  <div class="metric-label">平均响应时间</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="metric-card">
                  <div class="metric-value">{{ monitoringData.userFeedbackScore }}</div>
                  <div class="metric-label">用户满意度</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="metric-card">
                  <div class="metric-value">{{ monitoringData.qps }}</div>
                  <div class="metric-label">QPS</div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 动态调整控制 -->
            <el-card style="margin-top: 20px;">
              <template #header>
                <span>动态调整控制</span>
              </template>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-slider 
                    v-model="dynamicAdjustPercentage" 
                    :min="detailData.initialPercentage" 
                    :max="detailData.maxPercentage" 
                    show-input 
                    style="width: 100%;" 
                  />
                </el-col>
                <el-col :span="6">
                  <el-button type="primary" @click="applyDynamicAdjust">动态调整</el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="warning" @click="applyManualAdjust">手动调整</el-button>
                </el-col>
              </el-row>
            </el-card>
          </div>
          <div v-else>
            <el-alert
              title="当前策略不在进行中状态"
              description="只有在进行中的策略才能查看实时监控数据"
              type="info"
              show-icon
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="A/B测试" name="abtest">
          <div v-if="detailData.abTestEnabled">
            <div v-if="!detailData.multivariateTest">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>A组表现</span>
                    </template>
                    <el-descriptions :column="1" size="small">
                      <el-descriptions-item label="用户数">{{ abTestData.groupA.users }}</el-descriptions-item>
                      <el-descriptions-item label="转化率">{{ abTestData.groupA.conversionRate }}%</el-descriptions-item>
                      <el-descriptions-item label="留存率">{{ abTestData.groupA.retentionRate }}%</el-descriptions-item>
                      <el-descriptions-item label="满意度">{{ abTestData.groupA.satisfaction }}</el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>B组表现</span>
                    </template>
                    <el-descriptions :column="1" size="small">
                      <el-descriptions-item label="用户数">{{ abTestData.groupB.users }}</el-descriptions-item>
                      <el-descriptions-item label="转化率">{{ abTestData.groupB.conversionRate }}%</el-descriptions-item>
                      <el-descriptions-item label="留存率">{{ abTestData.groupB.retentionRate }}%</el-descriptions-item>
                      <el-descriptions-item label="满意度">{{ abTestData.groupB.satisfaction }}</el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
              </el-row>
            </div>
            <div v-else>
              <el-alert
                title="多变量测试结果"
                description="当前为多变量测试，包含多个变量组合的对比分析"
                type="info"
                show-icon
                style="margin-bottom: 20px;"
              />
              <el-table :data="multivariateTestData" style="width: 100%" border>
                <el-table-column prop="variant" label="变量组合" />
                <el-table-column prop="users" label="用户数" />
                <el-table-column prop="conversionRate" label="转化率" />
                <el-table-column prop="retentionRate" label="留存率" />
                <el-table-column prop="satisfaction" label="满意度" />
                <el-table-column prop="performance" label="性能指标" />
              </el-table>
            </div>
            
            <el-card style="margin-top: 20px;">
              <template #header>
                <span>测试结果分析</span>
              </template>
              <div v-if="abTestData.winner">
                <el-alert
                  :title="`推荐选择${abTestData.winner}组`"
                  :description="abTestData.analysis"
                  type="success"
                  show-icon
                />
              </div>
              <div v-else>
                <el-alert
                  title="测试进行中"
                  description="A/B测试仍在进行中，暂无明确结论"
                  type="info"
                  show-icon
                />
              </div>
            </el-card>
            
            <el-card style="margin-top: 20px;">
              <template #header>
                <span>A/B测试配置</span>
              </template>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="测试目标">{{ getAbTestGoalText(detailData.abTestGoal) }}</el-descriptions-item>
                <el-descriptions-item label="测试周期">{{ detailData.abTestDuration }}天</el-descriptions-item>
                <el-descriptions-item label="统计显著性">{{ detailData.abTestSignificance }}%</el-descriptions-item>
                <el-descriptions-item label="自动决策">{{ detailData.abTestAutoDecision ? '是' : '否' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
          <div v-else>
            <el-alert
              title="未启用A/B测试"
              description="该策略未启用A/B测试功能"
              type="info"
              show-icon
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="用户反馈" name="feedback">
          <el-tabs v-model="feedbackActiveTab">
            <el-tab-pane label="反馈列表" name="list">
              <el-table :data="userFeedback" style="width: 100%">
                <el-table-column prop="userName" label="用户名" />
                <el-table-column prop="feedback" label="反馈内容" />
                <el-table-column prop="rating" label="评分">
                  <template #default="scope">
                    <el-rate v-model="scope.row.rating" disabled />
                  </template>
                </el-table-column>
                <el-table-column prop="timestamp" label="时间" />
              </el-table>
              
              <div style="margin-top: 20px; text-align: center;">
                <el-pagination
                  layout="prev, pager, next"
                  :total="100"
                  :page-size="10"
                />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="反馈分析" name="analysis">
              <el-tabs v-model="feedbackAnalysisTab">
                <el-tab-pane label="基础分析" name="basic">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-card>
                        <template #header>
                          <span>反馈评分分布</span>
                        </template>
                        <div ref="ratingDistributionChartRef" style="height: 200px;"></div>
                      </el-card>
                    </el-col>
                    <el-col :span="12">
                      <el-card>
                        <template #header>
                          <span>关键词云</span>
                        </template>
                        <div ref="keywordCloudChartRef" style="height: 200px;"></div>
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <el-card style="margin-top: 20px;">
                    <template #header>
                      <span>情感分析</span>
                    </template>
                    <el-row :gutter="20">
                      <el-col :span="8">
                        <div class="sentiment-stat">
                          <div class="sentiment-value positive">{{ sentimentData.positive }}%</div>
                          <div class="sentiment-label">正面反馈</div>
                        </div>
                      </el-col>
                      <el-col :span="8">
                        <div class="sentiment-stat">
                          <div class="sentiment-value neutral">{{ sentimentData.neutral }}%</div>
                          <div class="sentiment-label">中性反馈</div>
                        </div>
                      </el-col>
                      <el-col :span="8">
                        <div class="sentiment-stat">
                          <div class="sentiment-value negative">{{ sentimentData.negative }}%</div>
                          <div class="sentiment-label">负面反馈</div>
                        </div>
                      </el-col>
                    </el-row>
                  </el-card>
                </el-tab-pane>
                
                <el-tab-pane label="深度分析" name="advanced">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-card>
                        <template #header>
                          <span>反馈趋势分析</span>
                        </template>
                        <div ref="feedbackTrendChartRef" style="height: 200px;"></div>
                      </el-card>
                    </el-col>
                    <el-col :span="12">
                      <el-card>
                        <template #header>
                          <span>用户群体分析</span>
                        </template>
                        <div ref="userGroupAnalysisChartRef" style="height: 200px;"></div>
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <el-card style="margin-top: 20px;">
                    <template #header>
                      <span>反馈分类统计</span>
                    </template>
                    <el-table :data="feedbackCategoryData" style="width: 100%">
                      <el-table-column prop="category" label="反馈类别" />
                      <el-table-column prop="count" label="反馈数量" />
                      <el-table-column prop="percentage" label="占比" />
                      <el-table-column prop="avgRating" label="平均评分" />
                    </el-table>
                  </el-card>
                </el-tab-pane>
              </el-tabs>
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
        
        <el-tab-pane label="回滚记录" name="rollback">
          <el-table :data="rollbackHistory" style="width: 100%">
            <el-table-column prop="version" label="回滚版本" />
            <el-table-column prop="rollbackTime" label="回滚时间" />
            <el-table-column prop="triggerReason" label="触发原因" />
            <el-table-column prop="operator" label="操作人" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Check, Warning, Finished } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 定义灰度策略类型
interface GrayReleaseStrategy {
  id: number
  name: string
  featureId: number
  featureName: string
  targetGroup: string
  userFilter: string
  initialPercentage: number
  currentPercentage: number
  releasePace: string
  customPace: number
  startTime: string
  endTime: string
  actualEndTime: string
  exceptionStrategy: string
  status: string
  progress: number
  createTime: string
  updateTime: string
  abTestEnabled: boolean
  dynamicAdjustment: boolean
  manualAdjustment?: boolean
  manualPercentage?: number
  adjustmentStrategy?: string
  maxPercentage: number
  rollbackThreshold: number
  responseTimeThreshold?: number
  negativeFeedbackThreshold?: number
  monitorMetrics: string[]
  rollbackTriggers: string[]
  customUserGroup: number[]
  testGroupA?: number
  testGroupB?: number
  rollbackDelay?: number
  rollbackNotification?: boolean
  notificationMethods?: string[]
  notificationRecipients?: number[]
  abTestGoal?: string
  abTestDuration?: number
  abTestSignificance?: number
  abTestAutoDecision?: boolean
  multivariateTest?: boolean
  variableCount?: number
  feedbackMethods?: string[]
  feedbackFrequency?: string
  feedbackTrigger?: string[]
  feedbackReward?: boolean
  rewardStrategy?: string
  rewardType?: string
  rewardAmount?: number
}

// 回滚记录类型
interface RollbackRecord {
  id: number
  version: string
  rollbackTime: string
  triggerReason: string
  operator: string
}

// 用户反馈类型
interface UserFeedback {
  id: number
  userName: string
  feedback: string
  rating: number
  timestamp: string
}

// 情感分析数据类型
interface SentimentData {
  positive: number
  neutral: number
  negative: number
}

// 响应式数据
const stats = ref({
  total: 8,
  inProgress: 3,
  pending: 2,
  completed: 3
})

const strategyList = ref<GrayReleaseStrategy[]>([
  {
    id: 1,
    name: '新支付功能灰度策略',
    featureId: 4,
    featureName: '支付功能升级',
    targetGroup: 'all',
    userFilter: '',
    initialPercentage: 10,
    currentPercentage: 100,
    releasePace: 'medium',
    customPace: 10,
    startTime: '2023-11-01 10:00:00',
    endTime: '2023-11-10 10:00:00',
    actualEndTime: '2023-11-09 15:30:00',
    exceptionStrategy: 'rollback',
    status: 'completed',
    progress: 100,
    createTime: '2023-10-25 10:00:00',
    updateTime: '2023-11-09 15:30:00',
    abTestEnabled: false,
    dynamicAdjustment: false,
    manualAdjustment: false,
    manualPercentage: 10,
    adjustmentStrategy: 'balanced',
    maxPercentage: 100,
    rollbackThreshold: 5,
    responseTimeThreshold: 1000,
    negativeFeedbackThreshold: 20,
    monitorMetrics: ['errorRate'],
    rollbackTriggers: ['errorRate'],
    customUserGroup: [],
    rollbackDelay: 30,
    rollbackNotification: true,
    notificationMethods: ['email'],
    notificationRecipients: [],
    feedbackMethods: ['inApp'],
    feedbackFrequency: 'afterUse',
    feedbackTrigger: ['featureUsed'],
    feedbackReward: true,
    rewardStrategy: 'fixed',
    rewardType: 'points',
    rewardAmount: 10
  },
  {
    id: 2,
    name: '夜间模式灰度策略',
    featureId: 2,
    featureName: '夜间模式',
    targetGroup: 'beta',
    userFilter: '',
    initialPercentage: 20,
    currentPercentage: 65,
    releasePace: 'slow',
    customPace: 5,
    startTime: '2023-11-15 10:00:00',
    endTime: '2023-11-30 10:00:00',
    actualEndTime: '',
    exceptionStrategy: 'pause',
    status: 'in-progress',
    progress: 65,
    createTime: '2023-11-10 10:00:00',
    updateTime: '2023-11-20 10:00:00',
    abTestEnabled: true,
    dynamicAdjustment: true,
    manualAdjustment: false,
    manualPercentage: 20,
    adjustmentStrategy: 'balanced',
    maxPercentage: 80,
    rollbackThreshold: 3,
    responseTimeThreshold: 1000,
    negativeFeedbackThreshold: 20,
    monitorMetrics: ['errorRate', 'responseTime', 'userFeedback'],
    rollbackTriggers: ['errorRate'],
    customUserGroup: [],
    testGroupA: 50,
    testGroupB: 50,
    rollbackDelay: 60,
    rollbackNotification: true,
    notificationMethods: ['email'],
    notificationRecipients: [],
    abTestGoal: 'conversion',
    abTestDuration: 7,
    abTestSignificance: 95,
    abTestAutoDecision: true,
    multivariateTest: false,
    variableCount: 2,
    feedbackMethods: ['inApp', 'email'],
    feedbackFrequency: 'daily',
    feedbackTrigger: ['featureUsed'],
    feedbackReward: true,
    rewardStrategy: 'fixed',
    rewardType: 'coupon',
    rewardAmount: 5
  },
  {
    id: 3,
    name: '智能推荐灰度策略',
    featureId: 1,
    featureName: '智能推荐功能',
    targetGroup: 'vip',
    userFilter: '',
    initialPercentage: 5,
    currentPercentage: 0,
    releasePace: 'fast',
    customPace: 20,
    startTime: '2023-12-01 10:00:00',
    endTime: '2023-12-05 10:00:00',
    actualEndTime: '',
    exceptionStrategy: 'continue',
    status: 'pending',
    progress: 0,
    createTime: '2023-11-20 10:00:00',
    updateTime: '2023-11-25 10:00:00',
    abTestEnabled: false,
    dynamicAdjustment: false,
    manualAdjustment: false,
    manualPercentage: 5,
    adjustmentStrategy: 'balanced',
    maxPercentage: 100,
    rollbackThreshold: 5,
    responseTimeThreshold: 1000,
    negativeFeedbackThreshold: 20,
    monitorMetrics: ['errorRate'],
    rollbackTriggers: ['errorRate'],
    customUserGroup: [],
    rollbackDelay: 0,
    rollbackNotification: false,
    notificationMethods: [],
    notificationRecipients: [],
    feedbackMethods: ['inApp'],
    feedbackFrequency: 'weekly',
    feedbackTrigger: ['featureUsed'],
    feedbackReward: false,
    rewardStrategy: 'fixed',
    rewardType: 'points',
    rewardAmount: 10
  }
])

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 按照分页设置规范，默认值为15
const total = ref(100)

const searchForm = ref({
  name: '',
  featureName: '',
  status: ''
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const activeTab = ref('basic')
const detailActiveTab = ref('basic')
const feedbackActiveTab = ref('list')
const feedbackAnalysisTab = ref('basic')

// 动态调整比例
const dynamicAdjustPercentage = ref(50)

const formData = ref({
  id: 0,
  name: '',
  featureId: 0,
  targetGroup: 'all',
  userFilter: '',
  initialPercentage: 10,
  currentPercentage: 10,
  releasePace: 'medium',
  customPace: 10,
  startTime: '',
  endTime: '',
  exceptionStrategy: 'rollback',
  status: 'pending',
  abTestEnabled: false,
  testGroupA: 50,
  testGroupB: 50,
  dynamicAdjustment: false,
  manualAdjustment: false,
  manualPercentage: 10,
  adjustmentStrategy: 'balanced',
  maxPercentage: 100,
  rollbackThreshold: 5,
  responseTimeThreshold: 1000,
  negativeFeedbackThreshold: 20,
  monitorMetrics: ['errorRate'],
  rollbackTriggers: ['errorRate'],
  customUserGroup: [],
  rollbackDelay: 30,
  rollbackNotification: true,
  notificationMethods: ['email'],
  notificationRecipients: [],
  abTestGoal: 'conversion',
  abTestDuration: 7,
  abTestSignificance: 95,
  abTestAutoDecision: true,
  multivariateTest: false,
  variableCount: 2,
  feedbackMethods: ['inApp'],
  feedbackFrequency: 'afterUse',
  feedbackTrigger: ['featureUsed'],
  feedbackReward: false,
  rewardStrategy: 'fixed',
  rewardType: 'points',
  rewardAmount: 10
})

// 监听初始发布比例变化，同步更新当前比例
watch(() => formData.value.initialPercentage, (newVal) => {
  if (!isEdit.value) {
    formData.value.currentPercentage = newVal
  }
})

const detailData = ref({
  id: 0,
  name: '',
  featureId: 0,
  targetGroup: 'all',
  userFilter: '',
  initialPercentage: 10,
  currentPercentage: 0,
  releasePace: 'medium',
  customPace: 10,
  startTime: '',
  endTime: '',
  actualEndTime: '',
  exceptionStrategy: 'rollback',
  status: 'pending',
  progress: 0,
  createTime: '',
  updateTime: '',
  abTestEnabled: false,
  dynamicAdjustment: false,
  manualAdjustment: false,
  manualPercentage: 10,
  adjustmentStrategy: 'balanced',
  maxPercentage: 100,
  rollbackThreshold: 5,
  responseTimeThreshold: 1000,
  negativeFeedbackThreshold: 20,
  monitorMetrics: ['errorRate'],
  rollbackTriggers: ['errorRate'],
  testGroupA: 50,
  testGroupB: 50,
  rollbackDelay: 30,
  rollbackNotification: true,
  notificationMethods: ['email'],
  notificationRecipients: [],
  abTestGoal: 'conversion',
  abTestDuration: 7,
  abTestSignificance: 95,
  abTestAutoDecision: true,
  multivariateTest: false,
  variableCount: 2,
  feedbackMethods: ['inApp'],
  feedbackFrequency: 'afterUse',
  feedbackTrigger: ['featureUsed'],
  feedbackReward: false,
  rewardStrategy: 'fixed',
  rewardType: 'points',
  rewardAmount: 10
})

// 监听A组比例变化，自动调整B组比例
watch(() => formData.value.testGroupA, (newVal) => {
  formData.value.testGroupB = 100 - newVal
})

// 监听B组比例变化，自动调整A组比例
watch(() => formData.value.testGroupB, (newVal) => {
  formData.value.testGroupA = 100 - newVal
})

// 监听详情数据中A组比例变化，自动调整B组比例
watch(() => detailData.value?.testGroupA, (newVal) => {
  if (detailData.value) {
    detailData.value.testGroupB = 100 - newVal
  }
})

// 监听详情数据中B组比例变化，自动调整A组比例
watch(() => detailData.value?.testGroupB, (newVal) => {
  if (detailData.value) {
    detailData.value.testGroupA = 100 - newVal
  }
})

// 回滚历史记录
const rollbackHistory = ref<RollbackRecord[]>([
  { id: 1, version: 'v1.0.0', rollbackTime: '2023-11-10 14:30:00', triggerReason: '错误率超过阈值', operator: '系统自动' },
  { id: 2, version: 'v0.9.0', rollbackTime: '2023-10-25 09:15:00', triggerReason: '性能问题', operator: '管理员' }
])

// 用户反馈数据
const userFeedback = ref<UserFeedback[]>([
  { id: 1, userName: '张三', feedback: '新功能很好用，界面简洁', rating: 5, timestamp: '2023-11-20 10:30:00' },
  { id: 2, userName: '李四', feedback: '响应速度有点慢', rating: 3, timestamp: '2023-11-20 11:15:00' },
  { id: 3, userName: '王五', feedback: '非常喜欢这个新功能', rating: 5, timestamp: '2023-11-20 14:20:00' },
  { id: 4, userName: '赵六', feedback: '有一些小bug，但整体不错', rating: 4, timestamp: '2023-11-20 16:45:00' }
])

// 反馈分类数据
const feedbackCategoryData = ref([
  { category: '功能建议', count: 15, percentage: '30%', avgRating: 4.2 },
  { category: '界面优化', count: 12, percentage: '24%', avgRating: 3.8 },
  { category: '性能问题', count: 8, percentage: '16%', avgRating: 2.5 },
  { category: 'Bug报告', count: 10, percentage: '20%', avgRating: 3.0 },
  { category: '其他', count: 5, percentage: '10%', avgRating: 4.0 }
])

// 情感分析数据
const sentimentData = ref<SentimentData>({
  positive: 65,
  neutral: 20,
  negative: 15
})

const formRules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  featureId: [{ required: true, message: '请选择关联功能', trigger: 'change' }],
  targetGroup: [{ required: true, message: '请选择目标用户组', trigger: 'change' }],
  initialPercentage: [{ required: true, message: '请设置初始发布比例', trigger: 'blur' }],
  releasePace: [{ required: true, message: '请选择发布节奏', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择预计结束时间', trigger: 'change' }]
}

const formRef = ref()

const featureList = ref([
  { id: 1, name: '智能推荐功能', description: '根据用户行为智能推荐相关内容' },
  { id: 2, name: '夜间模式', description: '提供夜间护眼模式' },
  { id: 3, name: '语音助手', description: '提供语音交互功能' },
  { id: 4, name: '支付功能升级', description: '优化支付流程，提升支付体验' }
])

const userGroups = ref([
  { id: 1, name: '高价值用户群' },
  { id: 2, name: '活跃用户群' },
  { id: 3, name: '新注册用户群' },
  { id: 4, name: '地区用户群' },
  { id: 5, name: '付费用户群' },
  { id: 6, name: '学生用户群' }
])

const notificationRecipients = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
  { id: 5, name: '系统管理员' }
])

// 监控数据
const monitoringData = ref({
  errorRate: 1.2,
  responseTime: 120,
  userFeedbackScore: 4.5,
  qps: 1200
})

// A/B测试数据
const abTestData = ref({
  groupA: {
    users: 1250,
    conversionRate: 15.3,
    retentionRate: 78.5,
    satisfaction: 4.2
  },
  groupB: {
    users: 1230,
    conversionRate: 18.7,
    retentionRate: 82.1,
    satisfaction: 4.6
  },
  winner: 'B',
  analysis: 'B组在转化率和留存率方面均优于A组，建议选择B组作为最终版本'
})

// 多变量测试数据
const multivariateTestData = ref([
  {
    variant: '变量组合A',
    users: 800,
    conversionRate: 12.5,
    retentionRate: 75.2,
    satisfaction: 4.0,
    performance: 95
  },
  {
    variant: '变量组合B',
    users: 750,
    conversionRate: 16.8,
    retentionRate: 79.5,
    satisfaction: 4.3,
    performance: 92
  },
  {
    variant: '变量组合C',
    users: 820,
    conversionRate: 14.2,
    retentionRate: 81.0,
    satisfaction: 4.5,
    performance: 90
  },
  {
    variant: '变量组合D',
    users: 780,
    conversionRate: 18.5,
    retentionRate: 83.2,
    satisfaction: 4.7,
    performance: 88
  }
])

// 图表引用
const errorRateChartRef = ref()
const feedbackChartRef = ref()
const ratingDistributionChartRef = ref()
const keywordCloudChartRef = ref()
const performanceChartRef = ref()
const feedbackTrendChartRef = ref()
const userGroupAnalysisChartRef = ref()
let errorRateChart: any = null
let feedbackChart: any = null
let ratingDistributionChart: any = null
let keywordCloudChart: any = null
let performanceChart: any = null
let feedbackTrendChart: any = null
let userGroupAnalysisChart: any = null

// 计算属性
const selectedFeatureDescription = computed(() => {
  const feature = featureList.value.find(item => item.id === formData.value.featureId)
  return feature ? feature.description : ''
})

// 获取用户组文本
const getUserGroupText = (group: string) => {
  switch (group) {
    case 'all':
      return '所有用户'
    case 'admin':
      return '管理员'
    case 'user':
      return '普通用户'
    case 'vip':
      return 'VIP用户'
    case 'beta':
      return '内测用户'
    case 'region':
      return '按地区划分'
    case 'device':
      return '按设备类型划分'
    case 'tag':
      return '按用户标签划分'
    case 'behavior':
      return '按用户行为划分'
    case 'custom':
      return '自定义用户群组'
    default:
      return '未知'
  }
}

// 获取发布节奏文本
const getReleasePaceText = (pace: string) => {
  switch (pace) {
    case 'fast':
      return '快速发布（每天增加20%）'
    case 'medium':
      return '中速发布（每天增加10%）'
    case 'slow':
      return '慢速发布（每天增加5%）'
    case 'custom':
      return '自定义节奏'
    default:
      return '未知'
  }
}

// 获取异常处理策略文本
const getExceptionStrategyText = (strategy: string) => {
  switch (strategy) {
    case 'rollback':
      return '自动回滚'
    case 'pause':
      return '暂停发布'
    case 'continue':
      return '继续发布'
    default:
      return '未知'
  }
}

// 获取A/B测试目标文本
const getAbTestGoalText = (goal: string) => {
  switch (goal) {
    case 'conversion':
      return '转化率'
    case 'retention':
      return '用户留存'
    case 'satisfaction':
      return '用户满意度'
    case 'performance':
      return '性能指标'
    case 'revenue':
      return '收入增长'
    case 'engagement':
      return '用户活跃度'
    default:
      return '未知'
  }
}

// 获取功能文本
const getFeatureText = (featureId: number) => {
  const feature = featureList.value.find(item => item.id === featureId)
  return feature ? feature.name : '未知功能'
}

// 获取功能描述
const getFeatureDescription = (featureId: number) => {
  const feature = featureList.value.find(item => item.id === featureId)
  return feature ? feature.description : '无描述'
}

// 获取进度状态
const getProgressStatus = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in-progress':
      return 'warning'
    case 'paused':
      return 'exception'
    default:
      return ''
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return ''
    case 'in-progress':
      return 'warning'
    case 'paused':
      return 'info'
    case 'completed':
      return 'success'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待开始'
    case 'in-progress':
      return '进行中'
    case 'paused':
      return '暂停'
    case 'completed':
      return '已完成'
    default:
      return '未知'
  }
}

// 获取操作按钮类型
const getActionButtonType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'primary'
    case 'in-progress':
      return 'warning'
    case 'paused':
      return 'primary'
    case 'completed':
      return 'info'
    default:
      return 'primary'
  }
}

// 获取操作文本
const getActionText = (status: string) => {
  switch (status) {
    case 'pending':
      return '启动'
    case 'in-progress':
      return '暂停'
    case 'paused':
      return '恢复'
    case 'completed':
      return '已完成'
    default:
      return '操作'
  }
}

// 功能变更处理
const handleFeatureChange = (featureId: number) => {
  const feature = featureList.value.find(item => item.id === featureId)
  if (feature) {
    formData.value.name = `${feature.name}灰度策略`
  }
}

// 搜索
const handleSearch = () => {
  console.log('🔍 搜索灰度策略:', searchForm.value)
  ElMessage.success('查询功能待实现')
}

// 重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    featureName: '',
    status: ''
  }
  ElMessage.success('重置搜索条件')
}

// 查看详情
const handleView = (row: any) => {
  detailData.value = { ...row }
  // 确保测试组比例正确
  if (detailData.value.testGroupA !== undefined && detailData.value.testGroupB === undefined) {
    detailData.value.testGroupB = 100 - detailData.value.testGroupA
  } else if (detailData.value.testGroupB !== undefined && detailData.value.testGroupA === undefined) {
    detailData.value.testGroupA = 100 - detailData.value.testGroupB
  } else if (detailData.value.testGroupA === undefined && detailData.value.testGroupB === undefined) {
    detailData.value.testGroupA = 50
    detailData.value.testGroupB = 50
  }
  detailDialogVisible.value = true
  detailActiveTab.value = 'basic'
  feedbackActiveTab.value = 'list'
  dynamicAdjustPercentage.value = row.currentPercentage
  
  // 延迟初始化图表
  setTimeout(() => {
    initCharts()
  }, 100)
}

// 初始化图表
const initCharts = () => {
  if (detailActiveTab.value === 'monitor') {
    // 错误率图表
    if (errorRateChartRef.value) {
      errorRateChart = echarts.init(errorRateChartRef.value)
      const errorRateOption = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} %'
          }
        },
        series: [{
          data: [1.0, 1.2, 0.8, 1.5, 1.2, 1.1, 1.2],
          type: 'line',
          smooth: true,
          areaStyle: {}
        }]
      }
      errorRateChart.setOption(errorRateOption)
    }
    
    // 用户反馈图表
    if (feedbackChartRef.value) {
      feedbackChart = echarts.init(feedbackChartRef.value)
      const feedbackOption = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: ['非常不满意', '不满意', '一般', '满意', '非常满意']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [2, 8, 25, 45, 20],
          type: 'bar'
        }]
      }
      feedbackChart.setOption(feedbackOption)
    }
    
    // 性能指标图表
    if (performanceChartRef.value) {
      performanceChart = echarts.init(performanceChartRef.value)
      const performanceOption = {
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
        series: [
          {
            name: 'QPS',
            type: 'line',
            data: [800, 900, 1200, 1500, 1300, 1100, 900],
            smooth: true
          },
          {
            name: '响应时间(ms)',
            type: 'line',
            data: [150, 140, 120, 100, 110, 130, 140],
            smooth: true
          }
        ]
      }
      performanceChart.setOption(performanceOption)
    }
  } else if (detailActiveTab.value === 'feedback' && feedbackActiveTab.value === 'analysis') {
    if (feedbackAnalysisTab.value === 'basic') {
      // 评分分布图表
      if (ratingDistributionChartRef.value) {
        ratingDistributionChart = echarts.init(ratingDistributionChartRef.value)
        const ratingDistributionOption = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            top: '5%',
            left: 'center'
          },
          series: [
            {
              name: '评分分布',
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
                { value: 10, name: '5星' },
                { value: 25, name: '4星' },
                { value: 30, name: '3星' },
                { value: 20, name: '2星' },
                { value: 15, name: '1星' }
              ]
            }
          ]
        }
        ratingDistributionChart.setOption(ratingDistributionOption)
      }
      
      // 关键词云图表
      if (keywordCloudChartRef.value) {
        keywordCloudChart = echarts.init(keywordCloudChartRef.value)
        const keywordCloudOption = {
          series: [{
            type: 'wordCloud',
            sizeRange: [12, 60],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            shape: 'pentagon',
            width: '100%',
            height: '100%',
            textStyle: {
              color: function () {
                return 'rgb(' + [
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160),
                  Math.round(Math.random() * 160)
                ].join(',') + ')';
              }
            },
            emphasis: {
              textStyle: {
                color: '#52c41a'
              }
            },
            data: [
              { name: '好用', value: 100 },
              { name: '界面', value: 80 },
              { name: '功能', value: 70 },
              { name: '速度', value: 60 },
              { name: '简洁', value: 50 },
              { name: '流畅', value: 40 },
              { name: '方便', value: 30 },
              { name: '实用', value: 20 }
            ]
          }]
        }
        keywordCloudChart.setOption(keywordCloudOption)
      }
    } else if (feedbackAnalysisTab.value === 'advanced') {
      // 反馈趋势分析图表
      if (feedbackTrendChartRef.value) {
        feedbackTrendChart = echarts.init(feedbackTrendChartRef.value)
        const feedbackTrendOption = {
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: ['第1周', '第2周', '第3周', '第4周']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '正面反馈',
              type: 'line',
              data: [15, 22, 18, 25],
              smooth: true
            },
            {
              name: '中性反馈',
              type: 'line',
              data: [8, 5, 10, 7],
              smooth: true
            },
            {
              name: '负面反馈',
              type: 'line',
              data: [5, 3, 2, 1],
              smooth: true
            }
          ]
        }
        feedbackTrendChart.setOption(feedbackTrendOption)
      }
      
      // 用户群体分析图表
      if (userGroupAnalysisChartRef.value) {
        userGroupAnalysisChart = echarts.init(userGroupAnalysisChartRef.value)
        const userGroupAnalysisOption = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            top: '5%',
            left: 'center'
          },
          series: [
            {
              name: '用户群体反馈',
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
                { value: 35, name: '新用户' },
                { value: 25, name: '老用户' },
                { value: 20, name: 'VIP用户' },
                { value: 15, name: '普通用户' },
                { value: 5, name: '内测用户' }
              ]
            }
          ]
        }
        userGroupAnalysisChart.setOption(userGroupAnalysisOption)
      }
    }
  }
}

// 创建灰度策略
const handleCreate = () => {
  dialogTitle.value = '创建灰度策略'
  isEdit.value = false
  activeTab.value = 'basic'
  formData.value = {
    id: 0,
    name: '',
    featureId: 0,
    targetGroup: 'all',
    userFilter: '',
    initialPercentage: 10,
    currentPercentage: 10, // 默认与初始比例相同
    releasePace: 'medium',
    customPace: 10,
    startTime: '',
    endTime: '',
    exceptionStrategy: 'rollback',
    status: 'pending',
    abTestEnabled: false,
    testGroupA: 50,
    testGroupB: 50,
    dynamicAdjustment: false,
    manualAdjustment: false,
    manualPercentage: 10,
    adjustmentStrategy: 'balanced',
    maxPercentage: 100,
    rollbackThreshold: 5,
    responseTimeThreshold: 1000,
    negativeFeedbackThreshold: 20,
    monitorMetrics: ['errorRate'],
    rollbackTriggers: ['errorRate'],
    customUserGroup: [],
    rollbackDelay: 30,
    rollbackNotification: true,
    notificationMethods: ['email'],
    notificationRecipients: [],
    abTestGoal: 'conversion',
    abTestDuration: 7,
    abTestSignificance: 95,
    abTestAutoDecision: true,
    multivariateTest: false,
    variableCount: 2,
    feedbackMethods: ['inApp'],
    feedbackFrequency: 'afterUse',
    feedbackTrigger: ['featureUsed'],
    feedbackReward: false,
    rewardStrategy: 'fixed',
    rewardType: 'points',
    rewardAmount: 10
  }
  dialogVisible.value = true
}

// 创建用户群组
const handleCreateUserGroup = () => {
  ElMessage.info('创建用户群组功能待实现')
}

// 管理用户群组
const handleManageUserGroups = () => {
  ElMessage.info('管理用户群组功能待实现')
}

// 编辑策略
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑灰度策略'
  isEdit.value = true
  activeTab.value = 'basic'
  formData.value = { ...row }
  // 确保测试组比例正确
  if (formData.value.testGroupA !== undefined && formData.value.testGroupB === undefined) {
    formData.value.testGroupB = 100 - formData.value.testGroupA
  } else if (formData.value.testGroupB !== undefined && formData.value.testGroupA === undefined) {
    formData.value.testGroupA = 100 - formData.value.testGroupB
  } else if (formData.value.testGroupA === undefined && formData.value.testGroupB === undefined) {
    formData.value.testGroupA = 50
    formData.value.testGroupB = 50
  }
  dialogVisible.value = true
}

// 操作策略（启动/暂停/恢复）
const handleAction = (row: any) => {
  console.log('⚙️ 操作灰度策略:', row)
  let action = ''
  switch (row.status) {
    case 'pending':
      action = '启动'
      row.status = 'in-progress'
      stats.value.pending--
      stats.value.inProgress++
      break
    case 'in-progress':
      action = '暂停'
      row.status = 'paused'
      stats.value.inProgress--
      stats.value.pending++
      break
    case 'paused':
      action = '恢复'
      row.status = 'in-progress'
      stats.value.pending--
      stats.value.inProgress++
      break
    default:
      action = '操作'
  }
  ElMessage.success(`"${row.name}"策略${action}成功`)
}

// 动态调整发布比例
const adjustReleasePercentage = (strategyId: number, newPercentage: number) => {
  const strategy = strategyList.value.find(item => item.id === strategyId)
  if (strategy) {
    strategy.currentPercentage = newPercentage
    strategy.progress = newPercentage
    ElMessage.success(`"${strategy.name}"策略发布比例已调整为${newPercentage}%`)
  }
}

// 手动调整发布比例
const manualAdjustPercentage = (strategyId: number, newPercentage: number) => {
  const strategy = strategyList.value.find(item => item.id === strategyId)
  if (strategy) {
    strategy.currentPercentage = newPercentage
    strategy.progress = newPercentage
    ElMessage.success(`"${strategy.name}"策略发布比例已手动调整为${newPercentage}%`)
  }
}

// 应用动态调整
const applyDynamicAdjust = () => {
  adjustReleasePercentage(detailData.value.id, dynamicAdjustPercentage.value)
  ElMessage.success('动态调整已应用')
}

// 应用手动调整
const applyManualAdjust = () => {
  manualAdjustPercentage(detailData.value.id, dynamicAdjustPercentage.value)
  ElMessage.success('手动调整已应用')
}

// 触发自动回滚
const triggerAutoRollback = (strategyId: number, reason: string) => {
  const strategy = strategyList.value.find(item => item.id === strategyId)
  if (strategy) {
    // 更新策略状态
    strategy.status = 'completed'
    strategy.progress = 100
    strategy.actualEndTime = new Date().toLocaleString()
    
    // 添加回滚记录
    const newRecord: RollbackRecord = {
      id: rollbackHistory.value.length + 1,
      version: `v${strategy.featureId}.${strategy.currentPercentage}`,
      rollbackTime: new Date().toLocaleString(),
      triggerReason: reason,
      operator: '系统自动'
    }
    rollbackHistory.value.unshift(newRecord)
    
    // 更新统计
    stats.value.inProgress--
    stats.value.completed++
    
    // 发送通知
    if (strategy.rollbackNotification) {
      sendRollbackNotification(strategy, reason)
    }
    
    ElMessage.success(`"${strategy.name}"策略已自动回滚`)
  }
}

// 发送回滚通知
const sendRollbackNotification = (strategy: GrayReleaseStrategy, reason: string) => {
  console.log(`发送回滚通知: ${strategy.name} - ${reason}`)
  ElMessage.info(`已向相关人员发送回滚通知`)
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEdit.value) {
        console.log('✏️ 编辑灰度策略:', formData.value)
        ElMessage.success('灰度策略编辑成功')
      } else {
        console.log('➕ 创建灰度策略:', formData.value)
        ElMessage.success('灰度策略创建成功')
      }
      dialogVisible.value = false
    } else {
      ElMessage.warning('请填写完整信息')
    }
  })
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

// 刷新
const handleRefresh = () => {
  console.log('🔄 刷新灰度策略状态')
  ElMessage.success('灰度策略状态刷新成功')
  
  // 模拟更新状态
  strategyList.value.forEach(strategy => {
    // 随机更新一些策略的状态
    if (Math.random() > 0.7 && strategy.status === 'in-progress') {
      strategy.progress = Math.min(100, strategy.progress + Math.floor(Math.random() * 10))
      strategy.currentPercentage = strategy.progress
      
      // 如果启用了动态调整且当前比例小于最大比例，则可能增加比例
      if (strategy.dynamicAdjustment && strategy.currentPercentage < strategy.maxPercentage) {
        if (Math.random() > 0.5) {
          const increment = Math.min(
            strategy.maxPercentage - strategy.currentPercentage,
            Math.floor(Math.random() * 5) + 1
          )
          strategy.currentPercentage += increment
          strategy.progress = strategy.currentPercentage
        }
      }
      
      // 检查是否需要自动回滚（模拟错误率超过阈值的情况）
      if (strategy.exceptionStrategy === 'rollback' && Math.random() > 0.9) {
        const errorRate = Math.random() * 10 // 模拟错误率
        if (errorRate > strategy.rollbackThreshold) {
          // 延迟回滚（如果设置了延迟）
          if (strategy.rollbackDelay && strategy.rollbackDelay > 0) {
            setTimeout(() => {
              triggerAutoRollback(strategy.id, `错误率${errorRate.toFixed(2)}%超过阈值${strategy.rollbackThreshold}%`)
            }, strategy.rollbackDelay * 1000)
          } else {
            triggerAutoRollback(strategy.id, `错误率${errorRate.toFixed(2)}%超过阈值${strategy.rollbackThreshold}%`)
          }
        }
      }
    }
  })
}

// 组件挂载
onMounted(() => {
  console.log('🎯 灰度发布控制页面加载完成')
})

/**
 * 灰度发布控制页面
 * 管理灰度发布策略的创建、编辑和控制
 */
</script>

<style scoped>
.gray-release-control-container {
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

.bg-primary {
  background-color: #409EFF;
}

.bg-success {
  background-color: #67C23A;
}

.bg-warning {
  background-color: #E6A23C;
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

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.slider-label {
  text-align: center;
  margin-top: 10px;
  color: #606266;
  font-size: 12px;
}

.metric-card {
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.sentiment-stat {
  text-align: center;
}

.sentiment-value {
  font-size: 24px;
  font-weight: bold;
}

.sentiment-value.positive {
  color: #67C23A;
}

.sentiment-value.neutral {
  color: #909399;
}

.sentiment-value.negative {
  color: #F56C6C;
}

.sentiment-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>