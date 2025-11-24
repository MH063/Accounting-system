<template>
  <div class="charts-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>访问量统计</span>
            </div>
          </template>
          <div id="visitChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户分布</span>
            </div>
          </template>
          <div id="userChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>数据趋势</span>
            </div>
          </template>
          <div id="trendChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import * as echarts from 'echarts'

// 初始化图表
onMounted(() => {
  // 访问量统计图表
  const visitChartDom = document.getElementById('visitChart')
  if (visitChartDom) {
    const visitChart = echarts.init(visitChartDom)
    const visitOption = {
      title: {
        text: '月度访问量',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: [820, 932, 901, 934, 1290, 1330],
          type: 'line',
          smooth: true
        }
      ]
    }
    visitChart.setOption(visitOption)
  }
  
  // 用户分布图表
  const userChartDom = document.getElementById('userChart')
  if (userChartDom) {
    const userChart = echarts.init(userChartDom)
    const userOption = {
      title: {
        text: '用户地区分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      series: [
        {
          name: '用户分布',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 1048, name: '北京' },
            { value: 735, name: '上海' },
            { value: 580, name: '广州' },
            { value: 484, name: '深圳' },
            { value: 300, name: '其他' }
          ],
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
    userChart.setOption(userOption)
  }
  
  // 数据趋势图表
  const trendChartDom = document.getElementById('trendChart')
  if (trendChartDom) {
    const trendChart = echarts.init(trendChartDom)
    const trendOption = {
      title: {
        text: '年度数据趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['访问量', '用户量', '转化率'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '数量',
          min: 0,
          max: 1500
        },
        {
          type: 'value',
          name: '转化率',
          min: 0,
          max: 100
        }
      ],
      series: [
        {
          name: '访问量',
          type: 'line',
          data: [820, 932, 901, 934, 1290, 1330, 1320, 1230, 1450, 1560, 1670, 1780]
        },
        {
          name: '用户量',
          type: 'line',
          data: [620, 732, 701, 734, 1090, 1130, 1120, 1030, 1250, 1360, 1470, 1580]
        },
        {
          name: '转化率',
          type: 'line',
          yAxisIndex: 1,
          data: [20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48]
        }
      ]
    }
    trendChart.setOption(trendOption)
  }
})

/**
 * 图表分析页面
 * 展示各种数据统计图表
 */
</script>

<style scoped>
.charts-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>