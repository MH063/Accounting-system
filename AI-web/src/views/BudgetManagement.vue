<template>
  <div class="budget-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">预算管理</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAddBudget">新建预算</el-button>
        <el-button type="success" @click="suggestionDialog = true">预算建议</el-button>
        <el-button type="info" @click="historicalDialog = true">历史对比</el-button>
        <el-button :icon="Download" @click="handleExportReport">导出报告</el-button>
      </div>
    </div>

    <!-- 预算概览 -->
    <div class="budget-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card">
            <div class="card-icon" style="background: #409EFF;">
              <el-icon size="24" color="white"><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">¥{{ (totalBudget || 0).toLocaleString() }}</div>
              <div class="card-label">总预算</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card">
            <div class="card-icon" style="background: #67C23A;">
              <el-icon size="24" color="white"><Wallet /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">¥{{ (usedBudget || 0).toLocaleString() }}</div>
              <div class="card-label">已使用</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card">
            <div class="card-icon" style="background: #E6A23C;">
              <el-icon size="24" color="white"><Coin /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">¥{{ (remainingBudget || 0).toLocaleString() }}</div>
              <div class="card-label">剩余预算</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="overview-card">
            <div class="card-icon" style="background: #F56C6C;">
              <el-icon size="24" color="white"><Warning /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ getAlertStats.total }}</div>
              <div class="card-label">{{ getAlertStats.total > 0 ? `${getAlertStats.high}个严重 ${getAlertStats.medium}个关注` : '正常' }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预算执行进度 -->
    <div class="budget-progress">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>预算执行进度</span>
            <el-button type="primary" size="small" @click="showProgressDetails = !showProgressDetails">
              {{ showProgressDetails ? '隐藏详情' : '查看详情' }}
            </el-button>
          </div>
        </template>
        
        <div class="progress-overview">
          <el-row :gutter="20">
            <el-col :xs="24" :md="8">
              <div class="progress-item">
                <div class="progress-title">总体执行率</div>
                <el-progress 
                  type="circle" 
                  :percentage="Math.round((usedBudget / totalBudget) * 100)"
                  :color="getProgressColor(usedBudget / totalBudget)"
                  :width="120"
                />
                <div class="progress-desc">¥{{ (usedBudget || 0).toLocaleString() }} / ¥{{ (totalBudget || 0).toLocaleString() }}</div>
              </div>
            </el-col>
            <el-col :xs="24" :md="8">
              <div class="progress-item">
                <div class="progress-title">月度完成度</div>
                <el-progress 
                  type="circle" 
                  :percentage="getMonthlyCompletion()"
                  :color="getProgressColor(getMonthlyCompletion() / 100)"
                  :width="120"
                />
                <div class="progress-desc">{{ currentMonth }}月进度</div>
              </div>
            </el-col>
            <el-col :xs="24" :md="8">
              <div class="progress-item">
                <div class="progress-title">预警项目数</div>
                <div class="alert-number">{{ getAlertStats.total }}</div>
                <div class="progress-desc">{{ getAlertStats.total > 0 ? `${getAlertStats.high}个严重 ${getAlertStats.medium}个关注` : '正常' }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 进度详情 -->
        <div v-if="showProgressDetails" class="progress-details">
          <el-divider />
          <h4>分类执行进度</h4>
          <div class="category-progress-list">
            <div 
              v-for="category in categoryProgress" 
              :key="category.name"
              class="category-progress-item"
            >
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-stats">¥{{ (category.used || 0).toLocaleString() }} / ¥{{ (category.budget || 0).toLocaleString() }}</span>
              </div>
              <el-progress 
                :percentage="category.percentage"
                :color="getProgressColor(category.percentage / 100)"
                :stroke-width="6"
              />
            </div>
          </div>
          
          <h4>时间轴进度</h4>
          <div class="timeline-progress">
            <el-timeline>
              <el-timeline-item 
                v-for="item in timelineData" 
                :key="item.time"
                :timestamp="item.time"
                :type="item.type"
                :color="item.color"
              >
                <div class="timeline-content">
                  <div class="timeline-title">{{ item.title }}</div>
                  <div class="timeline-amount">{{ item.amount }}</div>
                  <div class="timeline-desc">{{ item.description }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 预算设置和调整 -->
    <div class="budget-settings">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <div class="chart-container">
            <div class="chart-header">
              <h3>预算执行分析</h3>
              <div class="chart-controls">
                <el-select v-model="executionPeriod" size="small" @change="handlePeriodChange">
                  <el-option label="按月" value="month" />
                  <el-option label="按季度" value="quarter" />
                  <el-option label="按年" value="year" />
                </el-select>
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Edit"
                  @click="templateDialog = true"
                >
                  模板
                </el-button>
              </div>
            </div>
            <div ref="executionChartRef" class="chart-box"></div>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-container">
            <div class="chart-header">
              <h3>预算分类占比</h3>
              <div class="chart-controls">
                <el-radio-group v-model="chartType" size="small" @change="handleChartTypeChange">
                  <el-radio-button label="pie">饼图</el-radio-button>
                  <el-radio-button label="donut">环形图</el-radio-button>
                </el-radio-group>
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="Edit"
                  @click="batchAdjustDialog = true"
                >
                  批量调整
                </el-button>
              </div>
            </div>
            <div ref="categoryChartRef" class="chart-box"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 预算使用情况 -->
    <div class="budget-usage">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>预算明细</span>
            <div class="header-controls">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索预算项目"
                :prefix-icon="Search"
                style="width: 200px; margin-right: 10px;"
                @input="handleSearch"
              />
              <el-select
                v-model="filterStatus"
                placeholder="筛选状态"
                style="width: 120px;"
                @change="handleFilterChange"
              >
                <el-option label="全部" value="all" />
                <el-option label="正常" value="normal" />
                <el-option label="预警" value="warning" />
                <el-option label="超支" value="exceeded" />
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table
          :data="filteredBudgetData"
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="category" label="预算分类" width="120" />
          <el-table-column prop="item" label="预算项目" min-width="150" />
          <el-table-column prop="budgetAmount" label="预算金额" width="120">
            <template #default="{ row }">
              ¥{{ (row.budgetAmount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="usedAmount" label="已使用" width="120">
            <template #default="{ row }">
              ¥{{ (row.usedAmount || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="使用率" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="Math.round((row.usedAmount / row.budgetAmount) * 100)"
                :color="getUsageRateStyle(row.usedAmount, row.budgetAmount).color"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag
                :type="getUsageRateStyle(row.usedAmount, row.budgetAmount).color === '#67C23A' ? 'success' :
                        getUsageRateStyle(row.usedAmount, row.budgetAmount).color === '#E6A23C' ? 'warning' : 'danger'"
              >
                {{ getUsageRateStyle(row.usedAmount, row.budgetAmount).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="period" label="周期" width="80">
            <template #default="{ row }">
              {{ row.period === 'month' ? '月度' : row.period === 'quarter' ? '季度' : '年度' }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="备注" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEditBudget(row)"
              >
                编辑
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="handleAdjustBudget(row)"
              >
                调整
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalBudgetRecords"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 新增预算对话框 -->
    <el-dialog
      v-model="addBudgetDialog"
      title="新增预算"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="budgetFormRef"
        :model="budgetForm"
        :rules="budgetRules"
        label-width="100px"
      >
        <el-form-item label="预算分类" prop="category">
          <el-select v-model="budgetForm.category" placeholder="请选择预算分类" style="width: 100%;">
            <el-option label="日常开销" value="日常开销" />
            <el-option label="交通出行" value="交通出行" />
            <el-option label="娱乐休闲" value="娱乐休闲" />
            <el-option label="学习提升" value="学习提升" />
            <el-option label="健康医疗" value="健康医疗" />
            <el-option label="其他支出" value="其他支出" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算项目" prop="item">
          <el-input v-model="budgetForm.item" placeholder="请输入预算项目名称" />
        </el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount">
          <el-input-number
            v-model="budgetForm.budgetAmount"
            :min="1"
            :precision="2"
            style="width: 100%;"
            placeholder="请输入预算金额"
          />
        </el-form-item>
        <el-form-item label="预算周期" prop="period">
          <el-radio-group v-model="budgetForm.period">
            <el-radio label="month">月度</el-radio>
            <el-radio label="quarter">季度</el-radio>
            <el-radio label="year">年度</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="description">
          <el-input
            v-model="budgetForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addBudgetDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitBudget">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑预算对话框 -->
    <el-dialog
      v-model="editBudgetDialog"
      title="编辑预算"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="budgetFormRef"
        :model="budgetForm"
        :rules="budgetRules"
        label-width="100px"
      >
        <el-form-item label="预算分类" prop="category">
          <el-select v-model="budgetForm.category" placeholder="请选择预算分类" style="width: 100%;">
            <el-option label="日常开销" value="日常开销" />
            <el-option label="交通出行" value="交通出行" />
            <el-option label="娱乐休闲" value="娱乐休闲" />
            <el-option label="学习提升" value="学习提升" />
            <el-option label="健康医疗" value="健康医疗" />
            <el-option label="其他支出" value="其他支出" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算项目" prop="item">
          <el-input v-model="budgetForm.item" placeholder="请输入预算项目名称" />
        </el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount">
          <el-input-number
            v-model="budgetForm.budgetAmount"
            :min="1"
            :precision="2"
            style="width: 100%;"
            placeholder="请输入预算金额"
          />
        </el-form-item>
        <el-form-item label="预算周期" prop="period">
          <el-radio-group v-model="budgetForm.period">
            <el-radio label="month">月度</el-radio>
            <el-radio label="quarter">季度</el-radio>
            <el-radio label="year">年度</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="description">
          <el-input
            v-model="budgetForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editBudgetDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量调整对话框 -->
    <el-dialog
      v-model="batchAdjustDialog"
      title="批量调整预算"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="batchAdjustFormRef"
        :model="batchAdjustForm"
        label-width="100px"
      >
        <el-form-item label="调整方式" prop="adjustType">
          <el-radio-group v-model="batchAdjustForm.adjustType">
            <el-radio label="percentage">按比例调整</el-radio>
            <el-radio label="amount">按金额调整</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数值" prop="value">
          <el-input-number
            v-model="batchAdjustForm.value"
            :min="batchAdjustForm.adjustType === 'percentage' ? -100 : -999999"
            :max="999999"
            :precision="batchAdjustForm.adjustType === 'percentage' ? 2 : 0"
            style="width: 100%;"
            :placeholder="batchAdjustForm.adjustType === 'percentage' ? '请输入百分比（如10表示增加10%）' : '请输入金额（如100表示增加100元）'"
          />
        </el-form-item>
        <el-form-item label="应用范围" prop="applyTo">
          <el-radio-group v-model="batchAdjustForm.applyTo">
            <el-radio label="all">全部预算</el-radio>
            <el-radio label="selected">指定分类</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchAdjustForm.applyTo === 'selected'" label="选择分类">
          <el-select
            v-model="batchAdjustForm.categories"
            multiple
            placeholder="请选择预算分类"
            style="width: 100%;"
          >
            <el-option label="日常开销" value="日常开销" />
            <el-option label="交通出行" value="交通出行" />
            <el-option label="娱乐休闲" value="娱乐休闲" />
            <el-option label="学习提升" value="学习提升" />
            <el-option label="健康医疗" value="健康医疗" />
            <el-option label="其他支出" value="其他支出" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchAdjustDialog = false">取消</el-button>
          <el-button type="warning" @click="handleBatchAdjust">调整</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预算模板对话框 -->
    <el-dialog
      v-model="templateDialog"
      title="预算模板"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="template-grid">
        <el-card
          v-for="template in budgetTemplates"
          :key="template.name"
          class="template-card"
          shadow="hover"
        >
          <div class="template-header">
            <h4>{{ template.name }}</h4>
            <el-tag size="small">{{ template.category }}</el-tag>
          </div>
          <div class="template-content">
            <div class="template-amount">¥{{ (template.amount || 0).toLocaleString() }}</div>
            <div class="template-period">{{ template.period === 'month' ? '月度' : template.period === 'quarter' ? '季度' : '年度' }}</div>
          </div>
          <div class="template-footer">
            <el-button
              type="primary"
              size="small"
              @click="applyTemplate(template)"
            >
              应用模板
            </el-button>
          </div>
        </el-card>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预算建议对话框 -->
    <el-dialog
      v-model="suggestionDialog"
      title="预算建议"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="suggestion-header">
        <div class="suggestion-stats">
          <el-tag type="info">总建议数: {{ getSuggestionStats.total }}</el-tag>
          <el-tag type="warning">高优先级: {{ getSuggestionStats.high }}</el-tag>
          <el-tag type="success">中优先级: {{ getSuggestionStats.medium }}</el-tag>
          <el-tag type="info">低优先级: {{ getSuggestionStats.low }}</el-tag>
          <el-tag type="primary">已应用: {{ getSuggestionStats.applied }}</el-tag>
        </div>
        <div class="suggestion-actions">
          <span class="refresh-time" v-if="lastRefreshTime">最后刷新: {{ formatTime(lastRefreshTime) }}</span>
          <el-button type="primary" size="small" @click="refreshSuggestions">
            重新生成建议
          </el-button>
        </div>
      </div>
      
      <div class="suggestion-list">
        <el-card
          v-for="suggestion in getSuggestionList"
          :key="suggestion.id"
          class="suggestion-item"
          shadow="hover"
          :class="{ applied: suggestion.applied }"
        >
          <div class="suggestion-content">
            <div class="suggestion-header-item">
              <el-tag :type="suggestion.priority === 'high' ? 'danger' : suggestion.priority === 'medium' ? 'warning' : 'info'" size="small">
                {{ suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级' }}
              </el-tag>
              <span class="suggestion-category">{{ suggestion.category }}</span>
            </div>
            <h4 class="suggestion-title">{{ suggestion.title }}</h4>
            <p class="suggestion-description">{{ suggestion.description }}</p>
            <div class="suggestion-impact">
              <span class="impact-label">预期影响：</span>
              <span :class="['impact-value', suggestion.impact > 0 ? 'positive' : 'negative']">
                {{ suggestion.impact > 0 ? '+' : '' }}{{ suggestion.impact }}%
              </span>
            </div>
          </div>
          <div class="suggestion-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="applySuggestion(suggestion)"
              :disabled="suggestion.applied"
            >
              {{ suggestion.applied ? '已应用' : '应用建议' }}
            </el-button>
            <el-button 
              size="small" 
              @click="ignoreSuggestion(suggestion)"
              :disabled="suggestion.applied"
            >
              {{ suggestion.applied ? '已处理' : '忽略' }}
            </el-button>
          </div>
        </el-card>
      </div>
      
      <div v-if="getSuggestionList.length === 0" class="empty-suggestions">
        <el-empty description="暂无预算建议">
          <template #description>
            <p>暂无可优化的预算建议</p>
            <p style="font-size: 12px; color: #909399; margin-top: 10px;">
              建议会在预算使用率异常或分类不平衡时自动生成
            </p>
          </template>
        </el-empty>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="suggestionDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 历史对比对话框 -->
    <el-dialog
      v-model="historicalDialog"
      title="预算历史对比"
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="comparisonTab" class="comparison-tabs">
        <el-tab-pane label="同比分析" name="year-over-year">
          <div class="comparison-content">
            <div class="comparison-header">
              <el-date-picker
                v-model="comparisonDate"
                type="month"
                placeholder="选择对比月份"
                size="small"
                style="width: 200px;"
              />
              <el-button type="primary" size="small" @click="generateHistoricalComparison">
                刷新数据
              </el-button>
            </div>
            
            <div class="comparison-stats">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-card class="stat-card">
                    <div class="stat-value">{{ getComparisonStats.total }}</div>
                    <div class="stat-label">对比项目数</div>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="stat-card">
                    <div class="stat-value increase">+{{ getComparisonStats.increases }}</div>
                    <div class="stat-label">增长项目</div>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="stat-card">
                    <div class="stat-value decrease">-{{ getComparisonStats.decreases }}</div>
                    <div class="stat-label">下降项目</div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
            
            <div class="comparison-table">
              <el-table :data="getHistoricalComparisonList" style="width: 100%">
                <el-table-column prop="category" label="预算分类" width="120" />
                <el-table-column prop="item" label="预算项目" width="120" />
                <el-table-column prop="currentAmount" label="本期金额" width="100">
                  <template #default="scope">
                    ¥{{ (scope.row.currentAmount || 0).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="previousAmount" label="同期金额" width="100">
                  <template #default="scope">
                    ¥{{ (scope.row.previousAmount || 0).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="change" label="变化幅度" width="100">
                  <template #default="scope">
                    <span :class="['change-value', scope.row.change > 0 ? 'increase' : 'decrease']">
                      {{ scope.row.change > 0 ? '+' : '' }}{{ scope.row.change }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="changeAmount" label="变化金额" width="100">
                  <template #default="scope">
                    <span :class="['change-value', (scope.row.changeAmount || 0) > 0 ? 'increase' : 'decrease']">
                      {{ (scope.row.changeAmount || 0) > 0 ? '+' : '' }}¥{{ (scope.row.changeAmount || 0).toLocaleString() }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="trend" label="趋势" width="80">
                  <template #default="scope">
                    <el-icon :class="['trend-icon', scope.row.trend]">
                      <TopRight v-if="scope.row.trend === 'up'" />
                      <BottomRight v-if="scope.row.trend === 'down'" />
                      <Right v-if="scope.row.trend === 'stable'" />
                    </el-icon>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="环比分析" name="month-over-month">
          <div class="comparison-content">
            <div class="comparison-header">
              <el-date-picker
                v-model="comparisonDate"
                type="month"
                placeholder="选择对比月份"
                size="small"
                style="width: 200px;"
              />
              <el-button type="primary" size="small" @click="generateHistoricalComparison">
                刷新数据
              </el-button>
            </div>
            
            <div class="trend-chart" ref="trendChartRef" style="height: 400px; margin: 20px 0; min-height: 400px; position: relative;">
              <!-- 图表加载状态提示 - 只在真正加载时显示 -->
              <div v-if="chartLoadingStatus.trend" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; background: rgba(255,255,255,0.9); position: absolute; width: 100%; z-index: 10;">
                <el-icon size="24" style="margin-right: 8px;"><Loading /></el-icon>
                <span>图表加载中...</span>
              </div>
              <!-- 图表错误状态提示 - 只在图表加载完成后仍然失败时显示 -->
              <div v-else-if="!trendChart && !chartLoadingStatus.trend" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; background: rgba(255,255,255,0.9); position: absolute; width: 100%; z-index: 10;">
                <el-icon size="24" style="margin-right: 8px;"><Warning /></el-icon>
                <span>图表初始化失败，请刷新重试</span>
              </div>
            </div>
            
            <div class="comparison-table">
              <el-table :data="getHistoricalComparisonList" style="width: 100%">
                <el-table-column prop="category" label="预算分类" width="120" />
                <el-table-column prop="item" label="预算项目" width="120" />
                <el-table-column prop="currentAmount" label="本月金额" width="100">
                  <template #default="scope">
                    ¥{{ (scope.row.currentAmount || 0).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="previousAmount" label="上月金额" width="100">
                  <template #default="scope">
                    ¥{{ (scope.row.previousAmount || 0).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="change" label="环比变化" width="100">
                  <template #default="scope">
                    <span :class="['change-value', scope.row.change > 0 ? 'increase' : 'decrease']">
                      {{ scope.row.change > 0 ? '+' : '' }}{{ scope.row.change }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="recommendation" label="建议" min-width="150" />
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="分类对比" name="category-comparison">
          <div class="comparison-content">
            <div class="comparison-header">
              <el-date-picker
                v-model="comparisonDate"
                type="month"
                placeholder="选择对比月份"
                size="small"
                style="width: 200px;"
              />
              <el-button type="primary" size="small" @click="generateHistoricalComparison">
                刷新数据
              </el-button>
            </div>
            <div class="category-comparison-chart" ref="categoryComparisonChartRef" style="height: 450px; margin: 20px 0; min-height: 450px; position: relative;">
              <!-- 图表加载状态提示 - 只在真正加载时显示 -->
              <div v-if="chartLoadingStatus.categoryComparison" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; background: rgba(255,255,255,0.9); position: absolute; width: 100%; z-index: 10;">
                <el-icon size="24" style="margin-right: 8px;"><Loading /></el-icon>
                <span>图表加载中...</span>
              </div>
              <!-- 图表错误状态提示 - 只在图表加载完成后仍然失败时显示 -->
              <div v-else-if="!categoryComparisonChart && !chartLoadingStatus.categoryComparison" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; background: rgba(255,255,255,0.9); position: absolute; width: 100%; z-index: 10;">
                <el-icon size="24" style="margin-right: 8px;"><Warning /></el-icon>
                <span>图表初始化失败，请刷新重试</span>
              </div>
            </div>
            
            <div class="comparison-table">
              <el-table :data="getCategoryComparisonList" style="width: 100%">
                <el-table-column prop="category" label="预算分类" width="150" />
                <el-table-column prop="currentTotal" label="本期总额" width="120">
                  <template #default="scope">
                    ¥{{ (scope.row.currentTotal || 0).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="previousTotal" label="对比期总额" width="120">
                  <template #default="scope">
                    ¥{{ (scope.row.previousTotal || 0).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="change" label="变化幅度" width="100">
                  <template #default="scope">
                    <span :class="['change-value', scope.row.change > 0 ? 'increase' : 'decrease']">
                      {{ scope.row.change > 0 ? '+' : '' }}{{ scope.row.change }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="itemCount" label="项目数量" width="100" />
                <el-table-column prop="avgAmount" label="平均金额" width="120">
                  <template #default="scope">
                    ¥{{ (scope.row.avgAmount || 0).toLocaleString() }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="趋势分析" name="trend-analysis">
          <div class="comparison-content">
            <div class="trend-analysis-header">
              <el-select v-model="trendAnalysisPeriod" placeholder="选择分析周期" size="small" style="width: 150px;">
                <el-option label="近3个月" value="3m" />
                <el-option label="近6个月" value="6m" />
                <el-option label="近12个月" value="12m" />
              </el-select>
              <el-select v-model="trendAnalysisCategory" placeholder="选择分类" size="small" style="width: 150px; margin-left: 10px;">
                <el-option label="全部分类" value="all" />
                <el-option label="生活费用" value="生活费用" />
                <el-option label="娱乐支出" value="娱乐支出" />
                <el-option label="交通出行" value="交通出行" />
                <el-option label="其他支出" value="其他支出" />
              </el-select>
              <el-button type="primary" size="small" @click="getTrendAnalysis">
                更新分析
              </el-button>
            </div>
            
            <div class="trend-analysis-content">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="trend-chart-card">
                    <template #header>
                      <span>预算趋势图</span>
                    </template>
                    <div class="trend-chart" ref="trendAnalysisChartRef" style="height: 350px; min-height: 350px; position: relative;">
                      <!-- 图表加载状态提示 - 只在真正加载时显示 -->
                      <div v-if="chartLoadingStatus.trendAnalysis" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; background: rgba(255,255,255,0.9); position: absolute; width: 100%; z-index: 10;">
                        <el-icon size="24" style="margin-right: 8px;"><Loading /></el-icon>
                        <span>图表加载中...</span>
                      </div>
                      <!-- 图表错误状态提示 - 只在图表加载完成后仍然失败时显示 -->
                      <div v-else-if="!trendAnalysisChart && !chartLoadingStatus.trendAnalysis" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #909399; background: rgba(255,255,255,0.9); position: absolute; width: 100%; z-index: 10;">
                        <el-icon size="24" style="margin-right: 8px;"><Warning /></el-icon>
                        <span>图表初始化失败，请刷新重试</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="trend-insights-card">
                    <template #header>
                      <span>趋势洞察</span>
                    </template>
                    <div class="trend-insights">
                      <div v-for="insight in getTrendAnalysisList" :key="insight.id" class="insight-item">
                        <div class="insight-header">
                          <el-icon :class="['insight-icon', insight.type]">
                            <TrendCharts v-if="insight.type === 'trend'" />
                            <Warning v-if="insight.type === 'alert'" />
                            <CircleCheck v-if="insight.type === 'opportunity'" />
                          </el-icon>
                          <span class="insight-title">{{ insight.title }}</span>
                        </div>
                        <p class="insight-description">{{ insight.description }}</p>
                        <div class="insight-recommendation">
                          <strong>建议：</strong>{{ insight.recommendation }}
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="historicalDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  ArrowLeft,
  Plus,
  Download,
  Money,
  Wallet,
  Coin,
  Warning,
  Search,
  TopRight,
  BottomRight,
  Right,
  TrendCharts,
  CircleCheck,
  Edit,
  Loading
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const isComponentMounted = ref(true) // 组件挂载状态

// 图表引用
const executionChartRef = ref<HTMLElement>()
const trendAnalysisChartRef = ref<HTMLElement>()


// 图表实例
let executionChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let trendAnalysisChart: echarts.ECharts | null = null
let categoryComparisonChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 图表加载状态
const chartLoadingStatus = reactive({
  trendAnalysis: false,
  categoryComparison: false,
  trend: false
})
const categoryChartRef = ref<HTMLElement>()
const categoryComparisonChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

// 数据状态
const executionPeriod = ref<'month' | 'quarter' | 'year'>('month')
const chartType = ref<'pie' | 'donut'>('pie')
const searchKeyword = ref('')
const filterStatus = ref<'all' | 'normal' | 'warning' | 'exceeded'>('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalBudgetRecords = ref(0)

// 预算概览数据
const totalBudget = ref(50000)
const usedBudget = ref(32000)
const remainingBudget = ref(18000)
const alertCount = ref(3)
const alertText = ref('需要关注')

// 预算数据
const budgetData = ref<Array<{
  id: string
  category: string
  item: string
  budgetAmount: number
  usedAmount: number
  period: string
  description?: string
}>>([])

// 预警预算
const alertBudgets = computed(() => {
  return budgetData.value.filter(item => {
    const usageRate = item.usedAmount / item.budgetAmount
    return usageRate >= 0.8 // 使用率超过80%的项目
  })
})

// 新增预算对话框
const addBudgetDialog = ref(false)
const budgetFormRef = ref()
const budgetForm = reactive({
  category: '',
  item: '',
  budgetAmount: 0,
  period: 'month',
  description: ''
})

// 预算建议对话框
const suggestionDialog = ref(false)
const appliedSuggestions = ref<any[]>([])
const lastRefreshTime = ref('')
const suggestions = ref<any[]>([])

// 历史对比对话框
const historicalDialog = ref(false)
const comparisonTab = ref('year-over-year')
const comparisonDate = ref(new Date())
const trendAnalysisPeriod = ref('6m')
const trendAnalysisCategory = ref('all')

// 编辑预算对话框
const editBudgetDialog = ref(false)
const editingBudget = ref<any>(null)

// 批量调整对话框
const batchAdjustDialog = ref(false)
const batchAdjustForm = reactive({
  adjustType: 'percentage', // percentage, amount
  value: 0,
  categories: [] as string[],
  applyTo: 'all' as 'all' | 'selected'
})

// 预算模板
const budgetTemplates = ref([
  { name: '个人月度预算', category: '日常开销', amount: 3000, period: 'month' },
  { name: '交通月度预算', category: '交通出行', amount: 1500, period: 'month' },
  { name: '娱乐月度预算', category: '娱乐休闲', amount: 2000, period: 'month' },
  { name: '学习月度预算', category: '学习提升', amount: 1000, period: 'month' }
])

const templateDialog = ref(false)

// 进度展示相关
const showProgressDetails = ref(false)

// 计算属性:分类进度
const categoryProgress = computed(() => {
  const categoryMap = new Map()
  
  budgetData.value.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        name: item.category,
        budget: 0,
        used: 0
      })
    }
    const category = categoryMap.get(item.category)
    category.budget += item.budgetAmount
    category.used += item.usedAmount
  })
  
  return Array.from(categoryMap.values()).map(category => ({
    ...category,
    percentage: Math.round((category.used / category.budget) * 100)
  }))
})

// 计算属性：时间轴数据
const timelineData = computed(() => {
  const data: any[] = [
    {
      time: '月初',
      title: '预算开始',
      amount: '¥' + (totalBudget.value || 0).toLocaleString(),
      description: '本月预算总额',
      type: 'primary',
      color: '#409EFF'
    },
    {
      time: '月中',
      title: '执行中',
      amount: '¥' + (usedBudget.value || 0).toLocaleString(),
      description: '已使用预算',
      type: 'warning',
      color: getProgressColor(usedBudget.value / totalBudget.value)
    }
  ]
  
  if (alertBudgets.value.length > 0) {
    data.push({
      time: '当前',
      title: '预警提醒',
      amount: alertBudgets.value.length + '项',
      description: '需要关注的预算项目',
      type: 'danger',
      color: '#F56C6C'
    })
  }
  
  return data
})

const budgetRules = {
  category: [{ required: true, message: '请选择预算分类', trigger: 'change' }],
  item: [{ required: true, message: '请输入预算项目名称', trigger: 'blur' }],
  budgetAmount: [
    { required: true, message: '请输入预算金额', trigger: 'blur' },
    { type: 'number', min: 1, message: '预算金额必须大于0', trigger: 'blur' }
  ],
  period: [{ required: true, message: '请选择预算周期', trigger: 'change' }]
}

// 获取预警统计
const getAlertStats = computed(() => {
  const alerts = alertBudgets.value
  const total = alerts.length
  const high = alerts.filter(item => item.usedAmount / item.budgetAmount >= 1).length
  const medium = alerts.filter(item => {
    const rate = item.usedAmount / item.budgetAmount
    return rate >= 0.9 && rate < 1
  }).length
  const low = total - high - medium
  
  return {
    total,
    high,
    medium,
    low
  }
})

// 计算属性
const currentMonth = computed(() => {
  return new Date().getMonth() + 1
})

const filteredBudgetData = computed(() => {
  let filtered = budgetData.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter(item => 
      item.item.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.category.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 状态过滤
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(item => {
      const usageRate = item.usedAmount / item.budgetAmount
      switch (filterStatus.value) {
        case 'normal':
          return usageRate < 0.7
        case 'warning':
          return usageRate >= 0.7 && usageRate < 1
        case 'exceeded':
          return usageRate >= 1
        default:
          return true
      }
    })
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  totalBudgetRecords.value = filtered.length
  
  return filtered.slice(start, end)
})

// 方法
const handleBack = () => {
  router.push('/dashboard/statistics')
}

// 图表自适应处理
const handleChartResize = () => {
  try {
    if (trendAnalysisChart) {
      trendAnalysisChart.resize()
    }
    if (categoryComparisonChart) {
      categoryComparisonChart.resize()
    }
    if (trendChart) {
      trendChart.resize()
    }
    if (executionChart) {
      executionChart.resize()
    }
    if (categoryChart) {
      categoryChart.resize()
    }
  } catch (error) {
    console.error('图表自适应失败:', error)
  }
}

const handleAddBudget = () => {
  addBudgetDialog.value = true
}

const handleSubmitBudget = async () => {
  if (!budgetFormRef.value) return
  
  await budgetFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟提交预算
      const newBudget = {
        id: Date.now().toString(),
        category: budgetForm.category,
        item: budgetForm.item,
        budgetAmount: budgetForm.budgetAmount,
        usedAmount: 0,
        period: budgetForm.period,
        description: budgetForm.description
      }
      
      budgetData.value.unshift(newBudget)
      totalBudget.value += budgetForm.budgetAmount
      remainingBudget.value += budgetForm.budgetAmount
      
      ElMessage.success('预算添加成功')
      addBudgetDialog.value = false
      
      // 重置表单
      budgetFormRef.value.resetFields()
      
      // 刷新图表
      nextTick(() => {
        initCharts()
      })
    }
  })
}

const handleExportReport = () => {
  ElMessageBox.confirm('确定要导出预算报告吗？', '导出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    ElMessage.success('预算报告导出成功')
  })
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handlePeriodChange = () => {
  nextTick(() => {
    initCharts()
  })
}

const handleChartTypeChange = () => {
  nextTick(() => {
    initCharts()
  })
}

// 编辑预算
const handleEditBudget = (row: any) => {
  editingBudget.value = { ...row }
  Object.assign(budgetForm, {
    category: row.category,
    item: row.item,
    budgetAmount: row.budgetAmount,
    period: row.period,
    description: row.description
  })
  editBudgetDialog.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!budgetFormRef.value) return
  
  await budgetFormRef.value.validate((valid: boolean) => {
    if (valid && editingBudget.value) {
      const index = budgetData.value.findIndex(item => item.id === editingBudget.value.id)
      if (index !== -1) {
        budgetData.value[index] = {
          ...budgetData.value[index],
          category: budgetForm.category,
          item: budgetForm.item,
          budgetAmount: budgetForm.budgetAmount,
          period: budgetForm.period,
          description: budgetForm.description
        }
      }
      ElMessage.success('预算修改成功')
      editBudgetDialog.value = false
      budgetFormRef.value.resetFields()
      editingBudget.value = null
      
      // 刷新图表
      nextTick(() => {
        initCharts()
      })
    }
  })
}

// 调整预算
const handleAdjustBudget = (row: any) => {
  ElMessageBox.prompt(`请输入${row.item}的新预算金额`, '调整预算', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+(\.\d{1,2})?$/,
    inputErrorMessage: '请输入有效的金额',
    inputValue: row.budgetAmount.toString()
  }).then(({ value }) => {
    const newAmount = parseFloat(value)
    const index = budgetData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      budgetData.value[index].budgetAmount = newAmount
      ElMessage.success('预算调整成功')
      
      // 刷新图表
      nextTick(() => {
        initCharts()
      })
    }
  }).catch(() => {
    // 用户取消
  })
}

// 批量调整预算
const handleBatchAdjust = () => {
  const adjustment = batchAdjustForm.value
  let adjustedCount = 0
  
  budgetData.value.forEach(item => {
    if (batchAdjustForm.applyTo === 'all' || batchAdjustForm.categories.includes(item.category)) {
      if (batchAdjustForm.adjustType === 'percentage') {
        item.budgetAmount = Math.round(item.budgetAmount * (1 + adjustment / 100))
      } else {
        item.budgetAmount += adjustment
      }
      adjustedCount++
    }
  })
  
  if (adjustedCount > 0) {
    ElMessage.success(`成功调整 ${adjustedCount} 项预算`)
    batchAdjustDialog.value = false
    resetBatchAdjustForm()
    
    // 刷新图表
    nextTick(() => {
      initCharts()
    })
  }
}

// 应用预算模板
const applyTemplate = (template: any) => {
  Object.assign(budgetForm, {
    category: template.category,
    item: template.name,
    budgetAmount: template.amount,
    period: template.period
  })
  templateDialog.value = false
  addBudgetDialog.value = true
}

// 获取进度颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 0.9) return '#F56C6C' // 红色 - 超支
  if (percentage >= 0.8) return '#E6A23C' // 橙色 - 警告
  return '#67C23A' // 绿色 - 正常
}

// 重置批量调整表单
const resetBatchAdjustForm = () => {
  batchAdjustForm.adjustType = 'percentage'
  batchAdjustForm.value = 0
  batchAdjustForm.categories = []
  batchAdjustForm.applyTo = 'all'
}

// 获取月度完成度
const getMonthlyCompletion = () => {
  const now = new Date()
  const currentDay = now.getDate()
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.round((currentDay / totalDays) * 100)
}

// 初始化图表
const initCharts = () => {
  initExecutionChart()
  initCategoryChart()
}

// 预算执行分析图表
const initExecutionChart = () => {
  if (!executionChartRef.value) return
  
  if (executionChart) {
    executionChart.dispose()
  }
  
  executionChart = echarts.init(executionChartRef.value)
  
  const periodData = getPeriodData()
  const option = {
    title: {
      text: '预算执行分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        let result = params[0].name + '<br/>'
        params.forEach((param: any) => {
          result += param.marker + param.seriesName + ': ' + param.value + '元<br/>'
        })
        return result
      }
    },
    legend: {
      data: ['预算金额', '已使用金额'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: periodData.categories,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '金额（元）',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '预算金额',
        type: 'bar',
        data: periodData.budgets,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '已使用金额',
        type: 'bar',
        data: periodData.used,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
  
  executionChart.setOption(option)
  
  // 响应式
  window.addEventListener('resize', () => {
    executionChart?.resize()
  })
}

// 预算分类饼图
const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  
  if (categoryChart) {
    categoryChart.dispose()
  }
  
  categoryChart = echarts.init(categoryChartRef.value)
  
  const categoryData = getCategoryData()
  const isDonut = chartType.value === 'donut'
  
  const option = {
    title: {
      text: '预算分类占比',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}元 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '预算分类',
        type: 'pie',
        radius: isDonut ? ['40%', '70%'] : '60%',
        center: ['60%', '50%'],
        data: categoryData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}\n{c}元\n({d}%)'
        }
      }
    ]
  }
  
  categoryChart.setOption(option)
  
  // 响应式
  window.addEventListener('resize', () => {
    categoryChart?.resize()
  })
}

// 获取期间数据
const getPeriodData = () => {
  const categories = []
  const budgets = []
  const used = []
  
  const now = new Date()
  const currentYear = now.getFullYear()
  
  switch (executionPeriod.value) {
    case 'month':
      // 显示最近6个月
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, now.getMonth() - i, 1)
        categories.push(`${date.getFullYear()}年${date.getMonth() + 1}月`)
        budgets.push(Math.floor(Math.random() * 5000) + 8000)
        used.push(Math.floor(Math.random() * 4000) + 6000)
      }
      break
    case 'quarter':
      // 显示最近4个季度
      for (let i = 3; i >= 0; i--) {
        const quarter = Math.floor(now.getMonth() / 3) - i
        const year = quarter < 0 ? currentYear - 1 : currentYear
        const quarterNum = quarter < 0 ? quarter + 4 : quarter + 1
        categories.push(`${year}年Q${quarterNum}`)
        budgets.push(Math.floor(Math.random() * 15000) + 20000)
        used.push(Math.floor(Math.random() * 12000) + 15000)
      }
      break
    case 'year':
      // 显示最近3年
      for (let i = 2; i >= 0; i--) {
        categories.push(`${currentYear - i}年`)
        budgets.push(Math.floor(Math.random() * 50000) + 80000)
        used.push(Math.floor(Math.random() * 40000) + 60000)
      }
      break
  }
  
  return { categories, budgets, used }
}

// 获取分类数据
const getCategoryData = () => {
  const categoryMap = new Map()
  
  budgetData.value.forEach(item => {
    if (categoryMap.has(item.category)) {
      categoryMap.set(item.category, categoryMap.get(item.category) + item.budgetAmount)
    } else {
      categoryMap.set(item.category, item.budgetAmount)
    }
  })
  
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B3D8FF']
  const data: any[] = []
  let index = 0
  
  categoryMap.forEach((value, key) => {
    data.push({
      name: key,
      value: value,
      itemStyle: {
        color: colors[index % colors.length]
      }
    })
    index++
  })
  
  return data
}

// 获取使用率样式
const getUsageRateStyle = (usedAmount: number, budgetAmount: number) => {
  const rate = usedAmount / budgetAmount
  if (rate < 0.7) {
    return { color: '#67C23A', text: '正常' }
  } else if (rate < 1) {
    return { color: '#E6A23C', text: '预警' }
  } else {
    return { color: '#F56C6C', text: '超支' }
  }
}

// 获取预警颜色
const getAlertColor = (level: string) => {
  switch (level) {
    case 'danger':
      return '#F56C6C'
    case 'warning':
      return '#E6A23C'
    case 'info':
      return '#909399'
    default:
      return '#409EFF'
  }
}

// 获取预警图标
const getAlertIcon = (level: string) => {
  switch (level) {
    case 'danger':
      return '⚠️'
    case 'warning':
      return '⚡'
    case 'info':
      return 'ℹ️'
    default:
      return '📊'
  }
}

// 检查预算预警
const checkBudgetAlerts = () => {
  const alerts: any[] = []
  const now = new Date()
  
  budgetData.value.forEach(budget => {
    const usageRate = budget.usedAmount / budget.budgetAmount
    
    // 超支预警
    if (usageRate >= 1) {
      alerts.push({
        id: `alert_${budget.id}_overspend`,
        type: 'overspend',
        level: 'danger',
        title: `${budget.category} - ${budget.item}`,
        description: `预算已超支 ${((usageRate - 1) * 100).toFixed(1)}%`,
        time: new Date().toLocaleString(),
        budgetId: budget.id,
        category: budget.category,
        item: budget.item,
        usageRate: usageRate
      })
    }
    // 预警阈值（80%）
    else if (usageRate >= 0.8) {
      alerts.push({
        id: `alert_${budget.id}_warning`,
        type: 'warning',
        level: 'warning',
        title: `${budget.category} - ${budget.item}`,
        description: `预算使用率已达 ${(usageRate * 100).toFixed(1)}%`,
        time: new Date().toLocaleString(),
        budgetId: budget.id,
        category: budget.category,
        item: budget.item,
        usageRate: usageRate
      })
    }
  })
  
  // 月度预算预警
  const monthlyTotal = budgetData.value.reduce((sum, item) => {
    if (item.period === 'month') {
      return sum + item.budgetAmount
    }
    return sum
  }, 0)
  
  const monthlyUsed = budgetData.value.reduce((sum, item) => {
    if (item.period === 'month') {
      return sum + item.usedAmount
    }
    return sum
  }, 0)
  
  if (monthlyUsed / monthlyTotal >= 0.9) {
    alerts.push({
      id: 'alert_monthly_total',
      type: 'monthly_total',
      level: 'warning',
      title: '月度总预算预警',
      description: `本月总预算使用率已达 ${((monthlyUsed / monthlyTotal) * 100).toFixed(1)}%`,
      time: new Date().toLocaleString(),
      usageRate: monthlyUsed / monthlyTotal
    })
  }
  
  return alerts
}

// 生成预算建议
const generateBudgetSuggestions = () => {
  const suggestions = []
  
  // 基于历史使用情况的建议
  budgetData.value.forEach(budget => {
    const usageRate = budget.usedAmount / budget.budgetAmount
    const avgMonthlyUsage = getAverageMonthlyUsage(budget.category, budget.item)
    
    // 检查是否已经应用过类似建议（30天内）
    const hasAppliedSimilar = appliedSuggestions.value.some(applied => 
      applied.category === budget.category && 
      applied.item === budget.item &&
      (applied.type === 'reduce_budget' || applied.type === 'optimize_budget') &&
      new Date(applied.appliedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    )
    
    if (!hasAppliedSimilar) {
      // 超支项目建议减少预算
      if (usageRate > 1.2) {
        suggestions.push({
          id: `suggestion_${budget.id}_reduce_${Date.now()}`,
          type: 'reduce_budget',
          title: `建议减少${budget.category}预算`,
          description: `${budget.item}连续超支${((usageRate - 1) * 100).toFixed(1)}%，建议调整预算至${Math.ceil(avgMonthlyUsage * 1.1)}元`,
          priority: 'high',
          category: budget.category,
          item: budget.item,
          recommendedAmount: Math.ceil(avgMonthlyUsage * 1.1),
          currentAmount: budget.budgetAmount,
          applied: false,
          createdAt: new Date().toISOString()
        })
      }
      
      // 低使用率项目建议减少预算
      if (usageRate < 0.5 && budget.budgetAmount > 500) {
        suggestions.push({
          id: `suggestion_${budget.id}_optimize_${Date.now()}`,
          type: 'optimize_budget',
          title: `优化${budget.category}预算配置`,
          description: `${budget.item}使用率仅${(usageRate * 100).toFixed(1)}%，可考虑减少预算至${Math.ceil(avgMonthlyUsage * 1.2)}元`,
          priority: 'medium',
          category: budget.category,
          item: budget.item,
          recommendedAmount: Math.ceil(avgMonthlyUsage * 1.2),
          currentAmount: budget.budgetAmount,
          applied: false,
          createdAt: new Date().toISOString()
        })
      }
    }
  })
  
  // 基于季节性趋势的建议（每月只生成一次）
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const hasSeasonalSuggestion = appliedSuggestions.value.some(applied => 
    applied.type === 'seasonal' &&
    new Date(applied.appliedAt).getMonth() === currentMonth &&
    new Date(applied.appliedAt).getFullYear() === currentYear
  )
  
  if (!hasSeasonalSuggestion) {
    const seasonalSuggestions = getSeasonalSuggestions()
    suggestions.push(...seasonalSuggestions)
  }
  
  // 基于分类平衡的建议（每周只生成一次）
  const lastBalanceSuggestion = appliedSuggestions.value
    .filter(applied => applied.type === 'balance')
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())[0]
  
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  if (!lastBalanceSuggestion || new Date(lastBalanceSuggestion.appliedAt).getTime() < weekAgo) {
    const categoryBalanceSuggestions = getCategoryBalanceSuggestions()
    suggestions.push(...categoryBalanceSuggestions)
  }
  
  return suggestions.sort((a: any, b: any) => {
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

// 获取平均月度使用量
const getAverageMonthlyUsage = (category: string, item: string) => {
  // 这里应该调用实际的API获取历史数据
  // 现在使用模拟数据
  const mockData: Record<string, Record<string, number>> = {
    '日常开销': { '餐饮费用': 2800, '交通费用': 1200 },
    '娱乐休闲': { '娱乐消费': 2200 },
    '学习提升': { '学习费用': 800 },
    '健康医疗': { '医疗费用': 600 },
    '其他支出': { '其他费用': 300 }
  }
  
  return mockData[category]?.[item] || 1000
}

// 获取季节性建议
const getSeasonalSuggestions = () => {
  const suggestions = []
  const month = new Date().getMonth() + 1
  
  // 夏季空调电费增加
  if (month >= 6 && month <= 8) {
    suggestions.push({
      id: `suggestion_summer_electricity_${Date.now()}`,
      type: 'seasonal',
      title: '夏季电费预算调整建议',
      description: '夏季空调使用增加，建议电费预算增加20-30%，约200-300元',
      priority: 'medium',
      category: '生活费用',
      recommendedAmount: 0,
      currentAmount: 0,
      applied: false,
      createdAt: new Date().toISOString()
    })
  }
  
  // 年末购物季
  if (month >= 11 && month <= 12) {
    suggestions.push({
      id: `suggestion_year_end_shopping_${Date.now()}`,
      type: 'seasonal',
      title: '年末购物预算规划',
      description: '双11、双12购物季来临，建议提前规划购物预算，避免超支',
      priority: 'high',
      category: '购物消费',
      recommendedAmount: 0,
      currentAmount: 0,
      applied: false,
      createdAt: new Date().toISOString()
    })
  }
  
  // 春节预算
  if (month === 1 || month === 2) {
    suggestions.push({
      id: `suggestion_spring_festival_${Date.now()}`,
      type: 'seasonal',
      title: '春节预算特别规划',
      description: '春节期间人情往来、聚餐聚会增加，建议增加专项预算2000-3000元',
      priority: 'high',
      category: '节日支出',
      recommendedAmount: 2500,
      currentAmount: 0,
      applied: false,
      createdAt: new Date().toISOString()
    })
  }
  
  return suggestions
}

// 获取分类平衡建议
const getCategoryBalanceSuggestions = () => {
  const suggestions: any[] = []
  const categoryTotals: Record<string, number> = {}
  
  // 计算各分类总预算
  budgetData.value.forEach(budget => {
    if (!categoryTotals[budget.category]) {
      categoryTotals[budget.category] = 0
    }
    categoryTotals[budget.category] += budget.budgetAmount
  })
  
  const totalBudget = Object.values(categoryTotals).reduce((sum: number, amount) => sum + amount, 0)
  
  // 检查各分类占比
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    const percentage = (amount / totalBudget) * 100
    
    // 生活必需品类占比建议
    if (['日常开销', '交通出行', '健康医疗'].includes(category) && percentage < 30) {
      suggestions.push({
        id: `suggestion_balance_${category}_${Date.now()}`,
        type: 'balance',
        title: `${category}预算占比偏低`,
        description: `${category}作为生活必需支出，建议占总预算的30-40%，当前仅${percentage.toFixed(1)}%`,
        priority: 'medium',
        category: category,
        recommendedAmount: Math.ceil(totalBudget * 0.35),
        currentAmount: amount,
        applied: false,
        createdAt: new Date().toISOString()
      })
    }
    
    // 娱乐类占比过高建议
    if (['娱乐休闲'].includes(category) && percentage > 25) {
      suggestions.push({
        id: `suggestion_balance_${category}_${Date.now()}`,
        type: 'balance',
        title: `${category}预算占比偏高`,
        description: `${category}支出占比${percentage.toFixed(1)}%过高，建议控制在15-20%以内`,
        priority: 'low',
        category: category,
        recommendedAmount: Math.ceil(totalBudget * 0.18),
        currentAmount: amount,
        applied: false,
        createdAt: new Date().toISOString()
      })
    }
  })
  
  return suggestions
}

// 应用建议
const applySuggestion = (suggestion: any) => {
  // 显示确认对话框
  ElMessageBox.confirm(
    `确定要应用此建议吗？\n\n建议：${suggestion.title}\n${suggestion.description}`,
    '确认应用建议',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'suggestion-confirm-dialog'
    }
  ).then(() => {
    if (suggestion.type === 'reduce_budget' || suggestion.type === 'optimize_budget') {
      // 查找对应的预算项目
      const budget = budgetData.value.find(b => 
        b.category === suggestion.category && b.item === suggestion.item
      )
      
      if (budget) {
        // 保存原始金额用于撤销
        const originalAmount = budget.budgetAmount
        
        // 更新预算金额
        budget.budgetAmount = suggestion.recommendedAmount
        
        // 显示成功消息，并提供撤销选项
        ElMessage.success({
          message: `已将${suggestion.category} - ${suggestion.item}的预算调整为${suggestion.recommendedAmount}元`,
          duration: 5000,
          showClose: true,
          customClass: 'suggestion-success-message'
        })
        
        // 记录到应用历史
        const appliedSuggestion = {
          ...suggestion,
          appliedAt: new Date().toISOString(),
          originalAmount: originalAmount,
          budgetId: budget.id
        }
        
        // 添加到已应用建议列表
        appliedSuggestions.value.push(appliedSuggestion)
        
        // 标记建议为已应用
        suggestion.applied = true
        
        console.log('应用建议:', appliedSuggestion)
        
        // 刷新图表数据
        nextTick(() => {
          initCharts()
        })
      }
    } else if (suggestion.type === 'seasonal' || suggestion.type === 'balance') {
      // 对于季节性或平衡建议，显示相关信息
      ElMessage.info({
        message: `建议已记录：${suggestion.title}`,
        duration: 4000,
        showClose: true
      })
      
      // 标记为已应用
      suggestion.applied = true
      
      // 记录到应用历史
      const appliedSuggestion = {
        ...suggestion,
        appliedAt: new Date().toISOString()
      }
      appliedSuggestions.value.push(appliedSuggestion)
    }
    
    // 重新生成建议列表
    refreshSuggestions()
    
  }).catch(() => {
    // 用户取消操作
    ElMessage.info('已取消应用建议')
  })
}

// 忽略建议
const ignoreSuggestion = (suggestion: any) => {
  ElMessageBox.confirm(
    '确定要忽略此建议吗？\n\n忽略后建议将不再显示',
    '确认忽略建议',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
      customClass: 'suggestion-ignore-dialog'
    }
  ).then(() => {
    // 标记建议为已忽略
    suggestion.applied = true
    
    // 记录到应用历史（标记为已忽略）
    const ignoredSuggestion = {
      ...suggestion,
      appliedAt: new Date().toISOString(),
      action: 'ignored'
    }
    appliedSuggestions.value.push(ignoredSuggestion)
    
    ElMessage.success('建议已忽略')
    
    // 重新生成建议列表
    refreshSuggestions()
    
  }).catch(() => {
    // 用户取消操作
    ElMessage.info('已取消忽略操作')
  })
}

// 格式化时间
const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取建议列表
const getSuggestionList = computed(() => {
  return generateBudgetSuggestions()
})

// 获取建议统计
const getSuggestionStats = computed(() => {
  const suggestions = getSuggestionList.value
  return {
    total: suggestions.length,
    high: suggestions.filter(s => s.priority === 'high').length,
    medium: suggestions.filter(s => s.priority === 'medium').length,
    low: suggestions.filter(s => s.priority === 'low').length,
    applied: appliedSuggestions.value.length
  }
})

// 获取已应用建议历史
const getAppliedSuggestions = computed(() => {
  return appliedSuggestions.value.sort((a, b) => 
    new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  )
})

// 刷新建议列表
const refreshSuggestions = () => {
  suggestions.value = generateBudgetSuggestions()
  
  // 记录刷新时间
  lastRefreshTime.value = new Date().toISOString()
  
  // 显示刷新结果
  const newSuggestionCount = suggestions.value.filter(s => !s.applied).length
  if (newSuggestionCount > 0) {
    ElMessage.success(`发现 ${newSuggestionCount} 条新建议`)
  } else {
    ElMessage.info('暂无可优化建议')
  }
  
  console.log('建议列表已刷新，新建议数量:', newSuggestionCount)
}

// 生成历史对比数据
const generateHistoricalComparison = () => {
  const comparisons: any[] = []
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  // 同比分析数据（去年同期）
  budgetData.value.forEach(budget => {
    const currentAmount = budget.budgetAmount
    const usedAmount = budget.usedAmount
    
    // 模拟去年同期数据（增加波动范围使数据更真实）
    const previousAmount = Math.round(currentAmount * (0.75 + Math.random() * 0.5)) // 75%-125%的波动
    const changeAmount = currentAmount - previousAmount
    const change = previousAmount > 0 ? Math.round((changeAmount / previousAmount) * 100) : 0
    
    comparisons.push({
      id: `comparison_${budget.id}_yoy`,
      type: 'year_over_year',
      category: budget.category,
      item: budget.item,
      currentAmount: currentAmount,
      previousAmount: previousAmount,
      changeAmount: changeAmount,
      change: change,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    })
  })
  
  return comparisons
}

// 生成环比对比数据
const generateMonthOverMonthComparison = () => {
  const comparisons: any[] = []
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  budgetData.value.forEach(budget => {
    const currentAmount = budget.budgetAmount
    const usedAmount = budget.usedAmount
    
    // 模拟上月数据（波动范围较小）
    const previousAmount = Math.round(currentAmount * (0.85 + Math.random() * 0.3)) // 85%-115%的波动
    const changeAmount = currentAmount - previousAmount
    const change = previousAmount > 0 ? Math.round((changeAmount / previousAmount) * 100) : 0
    
    // 生成建议
    let recommendation = ''
    if (change > 20) {
      recommendation = '预算增长较快，建议关注支出合理性'
    } else if (change > 10) {
      recommendation = '预算稳步增长，继续保持'
    } else if (change > -10) {
      recommendation = '预算变化平稳，维持现状'
    } else if (change > -20) {
      recommendation = '预算小幅下降，可优化配置'
    } else {
      recommendation = '预算显著下降，建议分析原因'
    }
    
    comparisons.push({
      id: `comparison_${budget.id}_mom`,
      type: 'month_over_month',
      category: budget.category,
      item: budget.item,
      currentAmount: currentAmount,
      previousAmount: previousAmount,
      changeAmount: changeAmount,
      change: change,
      recommendation: recommendation
    })
  })
  
  return comparisons
}

// 获取分类汇总对比
const getCategoryComparison = () => {
  const categoryComparisons: any[] = []
  const categoryData: Record<string, { currentTotal: number; itemCount: number }> = {}
  
  // 汇总当前数据
  budgetData.value.forEach(budget => {
    if (!categoryData[budget.category]) {
      categoryData[budget.category] = {
        currentTotal: 0,
        itemCount: 0
      }
    }
    
    categoryData[budget.category].currentTotal += budget.budgetAmount
    categoryData[budget.category].itemCount += 1
  })
  
  // 生成对比数据
  Object.entries(categoryData).forEach(([category, data]) => {
    // 模拟对比期数据（上年同期）
    const previousTotal = Math.round(data.currentTotal * (0.75 + Math.random() * 0.5)) // 75%-125%的波动
    const change = previousTotal > 0 ? Math.round(((data.currentTotal - previousTotal) / previousTotal) * 100) : 0
    const avgAmount = Math.round(data.currentTotal / data.itemCount)
    
    categoryComparisons.push({
      category,
      currentTotal: data.currentTotal,
      previousTotal: previousTotal,
      change: change,
      itemCount: data.itemCount,
      avgAmount: avgAmount
    })
  })
  
  // 按当前总额降序排序
  return categoryComparisons.sort((a, b) => b.currentTotal - a.currentTotal)
}

// 获取趋势分析
const getTrendAnalysis = () => {
  const insights: any[] = []
  
  // 根据选择的分类过滤数据
  let filteredData = budgetData.value
  if (trendAnalysisCategory.value !== 'all') {
    filteredData = budgetData.value.filter(budget => budget.category === trendAnalysisCategory.value)
  }
  
  // 如果没有数据，返回提示信息
  if (!filteredData || filteredData.length === 0) {
    insights.push({
      id: 'insight_no_data',
      type: 'trend',
      title: '暂无数据',
      description: '当前没有可分析的预算数据',
      recommendation: '请先添加预算项目以开始分析'
    })
    return insights
  }
  
  // 计算总体趋势
  const totalBudgetAmount = filteredData.reduce((sum, item) => sum + item.budgetAmount, 0)
  const totalUsedAmount = filteredData.reduce((sum, item) => sum + item.usedAmount, 0)
  const overallUsageRate = totalBudgetAmount > 0 ? (totalUsedAmount / totalBudgetAmount) : 0
  
  // 总体趋势洞察
  if (overallUsageRate > 0.9) {
    insights.push({
      id: 'insight_overall_high',
      type: 'alert',
      title: '整体预算使用率偏高',
      description: `当前整体预算使用率为 ${(overallUsageRate * 100).toFixed(1)}%，接近或超过预算上限`,
      recommendation: '建议审查各项支出，控制非必要开支，或考虑适当增加预算'
    })
  } else if (overallUsageRate < 0.5) {
    insights.push({
      id: 'insight_overall_low',
      type: 'opportunity',
      title: '整体预算利用率较低',
      description: `当前整体预算使用率仅为 ${(overallUsageRate * 100).toFixed(1)}%，预算配置可能过高`,
      recommendation: '可考虑优化预算配置，将富余预算调整到需要的项目'
    })
  } else {
    insights.push({
      id: 'insight_overall_normal',
      type: 'trend',
      title: '整体预算执行良好',
      description: `当前整体预算使用率为 ${(overallUsageRate * 100).toFixed(1)}%，在合理范围内`,
      recommendation: '继续保持当前的预算管理策略'
    })
  }
  
  // 分析超支项目
  const overspentItems = filteredData.filter(item => item.usedAmount > item.budgetAmount)
  if (overspentItems.length > 0) {
    const overspentCategories = [...new Set(overspentItems.map(item => item.category))].join('、')
    insights.push({
      id: 'insight_overspent',
      type: 'alert',
      title: `发现 ${overspentItems.length} 个超支项目`,
      description: `${overspentCategories} 等分类存在超支情况，需要重点关注`,
      recommendation: '建议调整超支项目的预算或控制相关支出'
    })
  }
  
  // 分析低使用率项目
  const underusedItems = filteredData.filter(item => {
    const rate = item.usedAmount / item.budgetAmount
    return rate < 0.4 && item.budgetAmount > 500
  })
  if (underusedItems.length > 0) {
    insights.push({
      id: 'insight_underused',
      type: 'opportunity',
      title: `发现 ${underusedItems.length} 个低使用率项目`,
      description: `部分预算项目使用率低于40%，存在优化空间`,
      recommendation: '建议评估这些项目的实际需求，适当调减预算配置'
    })
  }
  
  // 分类均衡性分析
  if (trendAnalysisCategory.value === 'all' && filteredData.length > 0) {
    const categoryBudgets: Record<string, number> = {}
    filteredData.forEach(item => {
      if (!categoryBudgets[item.category]) {
        categoryBudgets[item.category] = 0
      }
      categoryBudgets[item.category] += item.budgetAmount
    })
    
    const budgetValues = Object.values(categoryBudgets) as number[]
    if (budgetValues.length > 1) {
      const maxCategoryBudget = Math.max(...budgetValues)
      const minCategoryBudget = Math.min(...budgetValues)
      const ratio = maxCategoryBudget / minCategoryBudget
      
      if (ratio > 5) {
        insights.push({
          id: 'insight_balance',
          type: 'trend',
          title: '预算分类分布不均',
          description: `各分类预算差异较大，最高与最低相差 ${ratio.toFixed(1)} 倍`,
          recommendation: '建议根据实际需求平衡各分类预算配置'
        })
      }
    }
  }
  
  return insights
}

// 根据趋势获取建议
const getTrendRecommendation = (trend: string, usageRate: number) => {
  switch (trend) {
    case 'increasing':
      if (usageRate > 1.2) {
        return '建议增加预算或控制支出'
      }
      return '建议关注支出增长原因'
    case 'decreasing':
      if (usageRate < 0.4) {
        return '建议减少预算配置'
      }
      return '预算配置可能偏高'
    default:
      return '当前配置合理，继续保持'
  }
}

// 获取同比分析列表
const getHistoricalComparisonList = computed(() => {
  const tab = comparisonTab.value
  
  if (tab === 'year-over-year') {
    return generateHistoricalComparison()
  } else if (tab === 'month-over-month') {
    return generateMonthOverMonthComparison()
  }
  
  return generateHistoricalComparison()
})

// 获取分类对比列表
const getCategoryComparisonList = computed(() => {
  return getCategoryComparison()
})

// 获取趋势分析列表
const getTrendAnalysisList = computed(() => {
  return getTrendAnalysis()
})

// 获取对比统计
const getComparisonStats = computed(() => {
  const comparisons = getHistoricalComparisonList.value
  const increases = comparisons.filter(c => c.change > 0).length
  const decreases = comparisons.filter(c => c.change < 0).length
  const total = comparisons.length
  
  return {
    total,
    increases,
    decreases,
    stable: total - increases - decreases,
    avgChange: comparisons.reduce((sum, c) => sum + Math.abs(c.change), 0) / total
  }
})

// 初始化历史对比图表
const initHistoryCharts = (retryCount = 0) => {
  // 检查组件是否仍然挂载
  if (!isComponentMounted.value) {
    console.warn('组件已卸载，取消图表初始化')
    return
  }
  
  // 检查是否满足初始化条件
  const checkInitConditions = () => {
    // 确保数据已加载
    const hasBudgetData = budgetData.value && budgetData.value.length > 0
    
    // 确保图表容器已准备好
    const containerReady = trendAnalysisChartRef.value && categoryComparisonChartRef.value && trendChartRef.value
    
    console.log(`初始化检查 - 数据状态: ${hasBudgetData}, 容器状态: ${containerReady}, 重试次数: ${retryCount}`)
    
    return hasBudgetData && containerReady
  }
  
  // 如果条件不满足且未达到最大重试次数，则延迟重试
  if (!checkInitConditions() && retryCount < 5) {
    console.log(`图表初始化条件未满足，${(retryCount + 1) * 500}ms后重试...`)
    setTimeout(() => {
      if (isComponentMounted.value) {
        initHistoryCharts(retryCount + 1)
      }
    }, (retryCount + 1) * 500)
    return
  }
  
  // 延迟执行，确保DOM完全渲染
  nextTick(() => {
    setTimeout(() => {
      try {
        // 再次检查组件挂载状态
        if (!isComponentMounted.value) {
          console.warn('组件已卸载，取消图表初始化')
          return
        }
        
        console.log(`开始初始化历史对比图表... (重试次数: ${retryCount})`)
        
        // 初始化趋势分析图表
        if (trendAnalysisChartRef.value) {
          // 销毁现有图表实例
          if (trendAnalysisChart) {
            try {
              trendAnalysisChart.dispose()
            } catch (e) {
              console.warn('销毁趋势分析图表时出错:', e)
            }
          }
          trendAnalysisChart = echarts.init(trendAnalysisChartRef.value)
          updateTrendAnalysisChart()
          console.log('趋势分析图表初始化成功')
        } else {
          console.warn('趋势分析图表容器未找到')
        }
        
        // 初始化分类对比图表
        if (categoryComparisonChartRef.value) {
          // 销毁现有图表实例
          if (categoryComparisonChart) {
            try {
              categoryComparisonChart.dispose()
            } catch (e) {
              console.warn('销毁分类对比图表时出错:', e)
            }
          }
          categoryComparisonChart = echarts.init(categoryComparisonChartRef.value)
          updateCategoryComparisonChart()
          console.log('分类对比图表初始化成功')
        } else {
          console.warn('分类对比图表容器未找到')
        }
        
        // 初始化趋势图表
        if (trendChartRef.value) {
          // 销毁现有图表实例
          if (trendChart) {
            try {
              trendChart.dispose()
            } catch (e) {
              console.warn('销毁趋势图表时出错:', e)
            }
          }
          trendChart = echarts.init(trendChartRef.value)
          updateTrendChart()
          console.log('趋势图表初始化成功')
        } else {
          console.warn('趋势图表容器未找到')
        }
        
        console.log('历史对比图表初始化全部完成')
        
        // 重置所有图表加载状态
        chartLoadingStatus.trendAnalysis = false
        chartLoadingStatus.categoryComparison = false
        chartLoadingStatus.trend = false
        
      } catch (error) {
        console.error('图表初始化失败:', error)
        
        // 如果重试次数小于5次，延迟后重试
        if (retryCount < 5) {
          console.log(`图表初始化失败，${(retryCount + 1) * 1000}ms后重试...`)
          setTimeout(() => {
            if (isComponentMounted.value) {
              initHistoryCharts(retryCount + 1)
            }
          }, (retryCount + 1) * 1000)
        } else {
          ElMessage.error('图表初始化失败，请刷新页面重试')
          console.error('达到最大重试次数，图表初始化失败')
        }
      }
    }, 100) // 额外延迟100ms确保DOM稳定
  })
}

// 更新趋势分析图表
const updateTrendAnalysisChart = (retryCount = 0) => {
  // 检查图表实例
  if (!trendAnalysisChart) {
    console.warn('趋势分析图表实例不存在')
    // 尝试重新初始化
    if (retryCount < 3) {
      console.log(`尝试重新初始化趋势分析图表，重试次数: ${retryCount}`)
      setTimeout(() => {
        initHistoryCharts()
      }, (retryCount + 1) * 500)
    }
    return
  }
  
  chartLoadingStatus.trendAnalysis = true
  
  try {
    const trends = getTrendAnalysisList.value
    
    // 检查数据可用性
    if (!trends || trends.length === 0) {
      console.warn('趋势分析数据为空，设置默认空状态')
      const option = {
        title: {
          text: '分类使用率趋势',
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          name: '使用率(%)',
          min: 0,
          max: 100
        },
        series: [{
          data: [],
          type: 'bar'
        }]
      }
      trendAnalysisChart.setOption(option, true)
      chartLoadingStatus.trendAnalysis = false
      return
    }
    
    // 从 budgetData 中提取分类和使用率
    const categoryUsageRates: Record<string, { total: number; used: number; count: number }> = {}
    budgetData.value.forEach(item => {
      if (!categoryUsageRates[item.category]) {
        categoryUsageRates[item.category] = { total: 0, used: 0, count: 0 }
      }
      categoryUsageRates[item.category].total += item.budgetAmount
      categoryUsageRates[item.category].used += item.usedAmount
      categoryUsageRates[item.category].count += 1
    })
    
    const seriesData = Object.entries(categoryUsageRates).map(([category, data]) => {
      const avgUsageRate = data.total > 0 ? (data.used / data.total) * 100 : 0
      return {
        name: category,
        value: Math.round(avgUsageRate)
      }
    })
    
    const option = {
      title: {
        text: '分类使用率趋势',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}%'
      },
      xAxis: {
        type: 'category',
        data: seriesData.map(item => item.name),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '使用率(%)',
        min: 0,
        max: 150
      },
      series: [{
        data: seriesData.map(item => item.value),
        type: 'bar',
        itemStyle: {
          color: function(params: any) {
            const value = params.value
            if (value > 100) return '#F56C6C'
            if (value > 80) return '#E6A23C'
            return '#67C23A'
          }
        }
      }]
    }
    
    trendAnalysisChart.setOption(option, true)
    chartLoadingStatus.trendAnalysis = false
    console.log('趋势分析图表更新成功')
  } catch (error) {
    console.error('趋势分析图表更新失败:', error)
    chartLoadingStatus.trendAnalysis = false
    
    // 重试机制
    if (retryCount < 3) {
      console.log(`趋势分析图表更新失败，${(retryCount + 1) * 800}ms后重试...`)
      setTimeout(() => {
        updateTrendAnalysisChart(retryCount + 1)
      }, (retryCount + 1) * 800)
    } else {
      ElMessage.warning('趋势分析图表加载失败，正在尝试重新初始化...')
      initHistoryCharts()
    }
  }
}

// 更新分类对比图表
const updateCategoryComparisonChart = (retryCount = 0) => {
  // 检查图表实例
  if (!categoryComparisonChart) {
    console.warn('分类对比图表实例不存在')
    // 尝试重新初始化
    if (retryCount < 3) {
      console.log(`尝试重新初始化分类对比图表，重试次数: ${retryCount}`)
      setTimeout(() => {
        initHistoryCharts()
      }, (retryCount + 1) * 500)
    }
    return
  }
  
  chartLoadingStatus.categoryComparison = true
  
  try {
    const categoryData = getCategoryComparisonList.value
    
    // 检查数据可用性
    if (!categoryData || categoryData.length === 0) {
      console.warn('分类对比数据为空，设置默认空状态')
      const option = {
        title: {
          text: '分类预算对比分析',
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '暂无数据'
        },
        series: [{
          name: '预算分布',
          type: 'pie',
          radius: '50%',
          data: []
        }]
      }
      categoryComparisonChart.setOption(option, true)
      chartLoadingStatus.categoryComparison = false
      return
    }
    
    // 创建对比柱状图
    const categories = categoryData.map(item => item.category)
    const currentData = categoryData.map(item => item.currentTotal)
    const previousData = categoryData.map(item => item.previousTotal)
    
    const option = {
      title: {
        text: '分类预算同比对比',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: any) {
          let result = params[0].name + '<br/>'
          params.forEach((param: any) => {
            result += param.marker + param.seriesName + ': ¥' + param.value.toLocaleString() + '<br/>'
          })
          return result
        }
      },
      legend: {
        data: ['本期预算', '对比期预算'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 30,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '金额(¥)',
        axisLabel: {
          formatter: function(value: number) {
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value
          }
        }
      },
      series: [
        {
          name: '本期预算',
          type: 'bar',
          data: currentData,
          itemStyle: {
            color: '#409EFF'
          }
        },
        {
          name: '对比期预算',
          type: 'bar',
          data: previousData,
          itemStyle: {
            color: '#E6A23C'
          }
        }
      ]
    }
    
    categoryComparisonChart.setOption(option, true)
    chartLoadingStatus.categoryComparison = false
    console.log('分类对比图表更新成功')
  } catch (error) {
    console.error('分类对比图表更新失败:', error)
    chartLoadingStatus.categoryComparison = false
    
    // 重试机制
    if (retryCount < 3) {
      console.log(`分类对比图表更新失败，${(retryCount + 1) * 800}ms后重试...`)
      setTimeout(() => {
        updateCategoryComparisonChart(retryCount + 1)
      }, (retryCount + 1) * 800)
    } else {
      ElMessage.warning('分类对比图表加载失败，正在尝试重新初始化...')
      initHistoryCharts()
    }
  }
}

// 更新趋势图表（环比分析）
const updateTrendChart = (retryCount = 0) => {
  // 检查图表实例
  if (!trendChart) {
    console.warn('趋势图表实例不存在')
    // 尝试重新初始化
    if (retryCount < 3) {
      console.log(`尝试重新初始化趋势图表，重试次数: ${retryCount}`)
      setTimeout(() => {
        initHistoryCharts()
      }, (retryCount + 1) * 500)
    }
    return
  }
  
  chartLoadingStatus.trend = true
  
  try {
    // 生成最近6个月的数据
    const months: string[] = []
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      months.push(`${date.getMonth() + 1}月`)
    }
    
    // 按分类生成数据
    const categories = [...new Set(budgetData.value.map(item => item.category))]
    const series: any[] = []
    
    categories.forEach(category => {
      const categoryItems = budgetData.value.filter(item => item.category === category)
      const totalBudget = categoryItems.reduce((sum, item) => sum + item.budgetAmount, 0)
      
      // 模拟6个月的数据趋势
      const data = months.map((_, index) => {
        // 基础值加上波动
        const baseValue = totalBudget
        const trend = 1 + (index - 2.5) * 0.05 // 模拟趋势
        const random = 0.9 + Math.random() * 0.2 // 随机波动
        return Math.round(baseValue * trend * random)
      })
      
      series.push({
        name: category,
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      })
    })
    
    const option = {
      title: {
        text: '月度预算趋势',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          let result = params[0].name + '<br/>'
          params.forEach((param: any) => {
            result += param.marker + param.seriesName + ': ¥' + param.value.toLocaleString() + '<br/>'
          })
          return result
        }
      },
      legend: {
        data: categories,
        top: 30,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '金额(¥)',
        axisLabel: {
          formatter: function(value: number) {
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value
          }
        }
      },
      series: series
    }
    
    trendChart.setOption(option, true)
    chartLoadingStatus.trend = false
    console.log('趋势图表更新成功')
  } catch (error) {
    console.error('趋势图表更新失败:', error)
    chartLoadingStatus.trend = false
    
    // 重试机制
    if (retryCount < 3) {
      console.log(`趋势图表更新失败，${(retryCount + 1) * 800}ms后重试...`)
      setTimeout(() => {
        updateTrendChart(retryCount + 1)
      }, (retryCount + 1) * 800)
    } else {
      ElMessage.warning('趋势图表加载失败，正在尝试重新初始化...')
      initHistoryCharts()
    }
  }
}

// 生命周期
onMounted(() => {
  // 初始化数据
  console.log('预算管理组件挂载开始')
  
  // 初始化数据
  budgetData.value = [
    {
      id: '1',
      category: '日常开销',
      item: '餐饮费用',
      budgetAmount: 3000,
      usedAmount: 2800,
      period: 'month',
      description: '包括工作餐、聚餐等'
    },
    {
      id: '2',
      category: '交通出行',
      item: '交通费用',
      budgetAmount: 1500,
      usedAmount: 1200,
      period: 'month',
      description: '包括公交、地铁、打车等'
    },
    {
      id: '3',
      category: '娱乐休闲',
      item: '娱乐消费',
      budgetAmount: 2000,
      usedAmount: 2200,
      period: 'month',
      description: '包括电影、游戏、聚会等'
    },
    {
      id: '4',
      category: '学习提升',
      item: '学习费用',
      budgetAmount: 1000,
      usedAmount: 800,
      period: 'month',
      description: '包括书籍、课程等'
    },
    {
      id: '5',
      category: '健康医疗',
      item: '医疗费用',
      budgetAmount: 800,
      usedAmount: 600,
      period: 'month',
      description: '包括体检、药品等'
    },
    {
      id: '6',
      category: '其他支出',
      item: '其他费用',
      budgetAmount: 500,
      usedAmount: 300,
      period: 'month',
      description: '其他杂项支出'
    }
  ]
  
  // 更新预算概览
  const total = budgetData.value.reduce((sum, item) => sum + item.budgetAmount, 0)
  const used = budgetData.value.reduce((sum, item) => sum + item.usedAmount, 0)
  
  totalBudget.value = total
  usedBudget.value = used
  remainingBudget.value = total - used
  
  // 计算预警数量
  alertCount.value = getAlertStats.value.total
  alertText.value = alertCount.value > 0 ? `需要关注` : '正常'
  
  // 初始化图表 - 延迟执行确保DOM完全加载
  setTimeout(() => {
    nextTick(() => {
      initCharts()
      initHistoryCharts()
    })
  }, 300)
  
  // 监听图表引用变化
  watch([trendAnalysisPeriod, trendAnalysisCategory], () => {
    nextTick(() => {
      updateTrendAnalysisChart()
    })
  })
  
  watch(comparisonTab, (newTab, oldTab) => {
    console.log(`标签页切换: ${oldTab} -> ${newTab}`)
    
    // 检查组件是否仍然挂载
    if (!isComponentMounted.value) {
      console.warn('组件已卸载，取消标签页切换处理')
      return
    }
    
    nextTick(() => {
      // 确保组件仍然挂载且图表容器存在
      if (!trendAnalysisChartRef.value || !categoryComparisonChartRef.value || !trendChartRef.value) {
        console.warn('图表容器未准备好，延迟初始化')
        return
      }
      
      try {
        if (newTab === 'trend-analysis') {
          if (!trendAnalysisChart) {
            console.log('趋势分析标签页激活，初始化图表')
            initHistoryCharts()
          } else {
            updateTrendAnalysisChart()
          }
        } else if (newTab === 'category-comparison') {
          if (!categoryComparisonChart) {
            console.log('分类对比标签页激活，初始化图表')
            initHistoryCharts()
          } else {
            updateCategoryComparisonChart()
          }
        } else if (newTab === 'month-over-month') {
          if (!trendChart) {
            console.log('环比分析标签页激活，初始化图表')
            initHistoryCharts()
          } else {
            updateTrendChart()
          }
        }
      } catch (error) {
        console.error('标签页切换处理失败:', error)
      }
    })
  })
})

// 监听窗口大小变化
window.addEventListener('resize', handleChartResize)

// 监听数据变化
watch([executionPeriod, chartType], () => {
  nextTick(() => {
    initCharts()
  })
})

// 清理
const cleanup = () => {
  console.log('开始清理图表资源...')
  
  // 清理主图表
  if (executionChart) {
    try {
      executionChart.dispose()
      executionChart = null
      console.log('executionChart 清理完成')
    } catch (error) {
      console.error('清理 executionChart 时出错:', error)
    }
  }
  
  // 清理分类图表
  if (categoryChart) {
    try {
      categoryChart.dispose()
      categoryChart = null
      console.log('categoryChart 清理完成')
    } catch (error) {
      console.error('清理 categoryChart 时出错:', error)
    }
  }
  
  // 清理趋势分析图表
  if (trendAnalysisChart) {
    try {
      trendAnalysisChart.dispose()
      trendAnalysisChart = null
      console.log('trendAnalysisChart 清理完成')
    } catch (error) {
      console.error('清理 trendAnalysisChart 时出错:', error)
    }
  }
  
  // 清理分类对比图表
  if (categoryComparisonChart) {
    try {
      categoryComparisonChart.dispose()
      categoryComparisonChart = null
      console.log('categoryComparisonChart 清理完成')
    } catch (error) {
      console.error('清理 categoryComparisonChart 时出错:', error)
    }
  }
  
  // 清理环比分析图表
  if (trendChart) {
    try {
      trendChart.dispose()
      trendChart = null
      console.log('trendChart 清理完成')
    } catch (error) {
      console.error('清理 trendChart 时出错:', error)
    }
  }
  
  console.log('所有图表资源清理完成')
}

// 添加 onUnmounted 生命周期钩子
import { onUnmounted } from 'vue'

// 组件卸载时清理
let routeUnwatch: any = null

onMounted(() => {
  routeUnwatch = watch(() => router.currentRoute.value.path, (newPath) => {
    console.log('路由变化检测:', newPath)
    if (!newPath.includes('/dashboard/budget')) {
      console.log('离开预算管理页面，执行清理')
      cleanup()
    }
  })
})

onUnmounted(() => {
  console.log('预算管理组件卸载开始')
  
  // 设置组件卸载状态
  isComponentMounted.value = false
  
  // 停止路由监听
  if (routeUnwatch) {
    routeUnwatch()
  }
  
  // 清理图表资源
  cleanup()
  
  // 移除窗口大小监听
  window.removeEventListener('resize', handleChartResize)
  
  console.log('预算管理组件卸载完成')
})
</script>

<style scoped>
.budget-management {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.budget-overview {
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
  padding: 20px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
}

.card-content {
  text-align: center;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #909399;
}

.budget-settings {
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-box {
  width: 100%;
  height: 300px;
}

.budget-usage {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .budget-management {
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
  
  .chart-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-controls {
    width: 100%;
    justify-content: flex-end;
  }
}
.progress-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 预算建议对话框样式 */
.suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f7fa;
    border-radius: 8px;
  }
  
  .suggestion-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .refresh-time {
    font-size: 12px;
    color: #909399;
    margin-right: 10px;
  }

.suggestion-stats {
  display: flex;
  gap: 10px;
}

.suggestion-list {
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  margin-bottom: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.suggestion-item.applied {
  opacity: 0.7;
  background-color: #f5f7fa;
}

.suggestion-content {
  padding: 15px;
}

.suggestion-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.suggestion-category {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.suggestion-title {
  margin: 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.suggestion-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.suggestion-impact {
  display: flex;
  align-items: center;
  gap: 10px;
}

.impact-label {
  font-size: 12px;
  color: #909399;
}

.impact-value {
  font-weight: 600;
  font-size: 14px;
}

.impact-value.positive {
  color: #67c23a;
}

.impact-value.negative {
  color: #f56c6c;
}

.suggestion-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 15px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
}

.suggestion-ignore-dialog {
  width: 400px;
}

.empty-suggestions {
  text-align: center;
  padding: 40px 0;
}

/* 历史对比对话框样式 */
.comparison-tabs {
  margin-top: -10px;
}

.comparison-content {
  padding: 20px 0;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comparison-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-value.increase {
  color: #67c23a;
}

.stat-value.decrease {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.comparison-table {
  margin-top: 20px;
}

.change-value {
  font-weight: 600;
}

.change-value.increase {
  color: #67c23a;
}

.change-value.decrease {
  color: #f56c6c;
}

.trend-icon {
  font-size: 16px;
}

.trend-icon.up {
  color: #67c23a;
}

.trend-icon.down {
  color: #f56c6c;
}

.trend-icon.stable {
  color: #909399;
}

.trend-analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.trend-analysis-content {
  margin-top: 20px;
}

.trend-chart-card, .trend-insights-card {
  height: 100%;
}

.trend-insights {
  max-height: 300px;
  overflow-y: auto;
}

.insight-item {
  margin-bottom: 15px;
  padding: 12px;
  border-left: 3px solid #409EFF;
  background: #f5f7fa;
  border-radius: 4px;
}

.insight-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.insight-icon {
  margin-right: 8px;
  font-size: 16px;
}

.insight-icon.trend {
  color: #409EFF;
}

.insight-icon.alert {
  color: #F56C6C;
}

.insight-icon.opportunity {
  color: #67C23A;
}

.insight-title {
  font-weight: 600;
  color: #303133;
}

.insight-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.insight-recommendation {
  font-size: 13px;
  color: #909399;
  font-style: italic;
}

.trend-chart-card, .trend-insights-card {
  height: 100%;
}

.trend-insights {
  max-height: 300px;
  overflow-y: auto;
}

.insight-item {
  margin-bottom: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.insight-icon {
  font-size: 18px;
}

.insight-icon.trend {
  color: #409eff;
}

.insight-icon.alert {
  color: #e6a23c;
}

.insight-icon.opportunity {
  color: #67c23a;
}

.insight-title {
  font-weight: 600;
  color: #303133;
}

.insight-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.insight-recommendation {
  font-size: 13px;
  color: #909399;
  font-style: italic;
}

.progress-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.progress-item {
  text-align: center;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.progress-ring {
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.progress-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.category-progress {
  margin-bottom: 20px;
}

.category-progress h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

.progress-bar-item {
  margin-bottom: 15px;
}

.progress-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-bar-title {
  font-size: 14px;
  color: #606266;
}

.progress-bar-value {
  font-size: 14px;
  font-weight: bold;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.timeline-section {
  margin-top: 20px;
}

.timeline-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

.timeline-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-date {
  width: 80px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.timeline-content {
  flex: 1;
  padding: 0 15px;
}

.timeline-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 12px;
  color: #909399;
}

.timeline-status {
  width: 60px;
  text-align: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-normal {
  background: #f0f9ff;
  color: #67c23a;
}

.status-warning {
  background: #fffbe6;
  color: #e6a23c;
}

.status-danger {
  background: #fef0f0;
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.template-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.template-icon {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 10px;
}

.template-name {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
}

.alert-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.alert-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.alert-list {
  max-height: 200px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.alert-item:last-child {
  margin-bottom: 0;
}

.alert-icon {
  margin-right: 10px;
  font-size: 16px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.alert-desc {
  font-size: 12px;
  color: #909399;
}

.alert-time {
  font-size: 12px;
  color: #c0c4cc;
}

.alert-danger {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.alert-danger .alert-icon,
.alert-danger .alert-title {
  color: #f56c6c;
}

.alert-warning {
  background: #fffbe6;
  border: 1px solid #f9e08f;
}

.alert-warning .alert-icon,
.alert-warning .alert-title {
  color: #e6a23c;
}

.suggestion-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.suggestion-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.suggestion-list {
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

.suggestion-icon {
  margin-right: 10px;
  font-size: 16px;
  color: #409eff;
  margin-top: 2px;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.comparison-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comparison-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.comparison-item {
  text-align: center;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.comparison-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.comparison-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.comparison-change {
  font-size: 12px;
  font-weight: bold;
}

.change-positive {
  color: #67c23a;
}

.change-negative {
  color: #f56c6c;
}

.change-neutral {
  color: #909399;
}

.prediction-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.prediction-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.prediction-chart {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .budget-management {
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
  
  .chart-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-controls {
    width: 100%;
    justify-content: flex-end;
  }
  
  .progress-grid {
    grid-template-columns: 1fr;
  }
  
  .comparison-grid {
    grid-template-columns: 1fr;
  }
  
  .template-grid {
    grid-template-columns: 1fr;
  }
  
  .timeline-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .timeline-date {
    width: auto;
    text-align: left;
  }
  
  .timeline-status {
    width: auto;
    align-self: flex-end;
  }
}
</style>