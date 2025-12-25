/**
 * 预算图表组合式函数
 */
import { ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getBudgetHistory } from '@/services/budgetService'
import { ElMessage } from 'element-plus'

export function useBudgetCharts() {
  // 图表引用
  const historyChartRef = ref<HTMLElement | null>(null)
  let historyChart: echarts.ECharts | null = null

  const categoryChartRef = ref<HTMLElement | null>(null)
  let categoryChart: echarts.ECharts | null = null

  const trendChartRef = ref<HTMLElement | null>(null)
  let trendChart: echarts.ECharts | null = null

  // 历史对比周期
  const historyPeriod = ref<'3m' | '6m' | '12m'>('3m')
  
  // 趋势分析周期
  const trendPeriod = ref<'1m' | '3m' | '6m' | '1y'>('3m')

  /**
   * 初始化历史图表
   */
  const initHistoryChart = () => {
    if (!historyChartRef.value) return
    
    if (historyChart) {
      historyChart.dispose()
    }
    
    historyChart = echarts.init(historyChartRef.value)
    updateHistoryChart()
  }

  /**
   * 更新历史图表
   */
  const updateHistoryChart = () => {
    if (!historyChart) return
    
    // 简化的默认数据
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['预算金额', '预算内支出', '超支金额']
      },
      xAxis: {
        type: 'category',
        data: ['上月', '本月', '下月']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      series: [
        {
          name: '预算金额',
          type: 'bar',
          data: [3000, 3000, 3000],
          itemStyle: {
            color: '#409EFF'
          }
        },
        {
          name: '预算内支出',
          type: 'bar',
          stack: '实际支出',
          data: [2800, 2900, 2600],
          itemStyle: {
            color: '#67C23A'
          }
        },
        {
          name: '超支金额',
          type: 'bar',
          stack: '实际支出',
          data: [0, 200, 0],
          itemStyle: {
            color: '#F56C6C'
          }
        }
      ]
    }
    
    historyChart.setOption(option, { notMerge: true })
  }

  /**
   * 加载历史数据
   */
  const loadHistoryData = async () => {
    try {
      console.log('开始加载预算历史数据...')
      
      const response = await getBudgetHistory(historyPeriod.value)
      
      if (response.success && response.data) {
        console.log('预算历史数据加载成功:', response.data)
        
        if (historyChart && historyChartRef.value) {
          historyChart.dispose()
          historyChart = echarts.init(historyChartRef.value)
          updateHistoryChartWithRealData(response.data)
        }
      } else {
        console.error('获取预算历史数据失败:', response.message)
        ElMessage.error(response.message || '获取预算历史数据失败')
      }
    } catch (error) {
      console.error('加载预算历史数据失败:', error)
      ElMessage.error('加载预算历史数据失败')
    }
  }

  /**
   * 使用真实数据更新历史图表
   */
  const updateHistoryChartWithRealData = (historyData: any) => {
    if (!historyChart) return
    
    const months = historyData.months || []
    const budgetData = historyData.budgetData || []
    const expenseData = historyData.expenseData || []
    
    const withinBudgetData = expenseData.map((expense: number, index: number) => {
      return Math.min(expense, budgetData[index] || 0)
    })
    
    const overspendData = expenseData.map((expense: number, index: number) => {
      return Math.max(0, expense - (budgetData[index] || 0))
    })
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const month = params[0].name
          const budget = budgetData[params[0].dataIndex] || 0
          const expense = expenseData[params[0].dataIndex] || 0
          const withinBudget = withinBudgetData[params[0].dataIndex] || 0
          const overspend = overspendData[params[0].dataIndex] || 0
          
          let tooltip = `${month}<br/>`
          tooltip += `预算金额: ¥${budget.toLocaleString()}<br/>`
          tooltip += `实际支出: ¥${expense.toLocaleString()}<br/>`
          
          if (overspend > 0) {
            tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#67C23A;"></span>`
            tooltip += `预算内支出: ¥${withinBudget.toLocaleString()}<br/>`
            tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#F56C6C;"></span>`
            tooltip += `超支金额: ¥${overspend.toLocaleString()}<br/>`
          } else {
            tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#67C23A;"></span>`
            tooltip += `支出金额: ¥${expense.toLocaleString()}<br/>`
          }
          
          return tooltip
        }
      },
      legend: {
        data: ['预算金额', '预算内支出', '超支金额']
      },
      xAxis: {
        type: 'category',
        data: months
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      animation: true,
      animationDuration: 2000,
      animationEasing: 'quarticInOut',
      series: [
        {
          name: '预算金额',
          type: 'bar',
          data: budgetData,
          itemStyle: {
            color: '#409EFF'
          },
          barGap: '0%',
          animationDelay: (idx: number) => idx * 50
        },
        {
          name: '预算内支出',
          type: 'bar',
          stack: '实际支出',
          data: withinBudgetData,
          itemStyle: {
            color: '#67C23A'
          },
          barGap: '0%',
          animationDelay: (idx: number) => idx * 50 + 500
        },
        {
          name: '超支金额',
          type: 'bar',
          stack: '实际支出',
          data: overspendData,
          itemStyle: {
            color: '#F56C6C'
          },
          barGap: '0%',
          animationDelay: (idx: number) => idx * 50 + 1500
        }
      ]
    }
    
    historyChart.setOption(option, { notMerge: true })
  }

  /**
   * 初始化分类图表
   */
  const initCategoryChart = () => {
    if (!categoryChartRef.value) return
    
    if (categoryChart) {
      categoryChart.dispose()
    }
    
    categoryChart = echarts.init(categoryChartRef.value)
    updateCategoryChart()
  }

  /**
   * 更新分类图表
   */
  const updateCategoryChart = () => {
    if (!categoryChart) return
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '预算分类',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 1000, name: '餐饮' },
            { value: 800, name: '交通' },
            { value: 500, name: '娱乐' },
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
    
    categoryChart.setOption(option)
  }

  /**
   * 初始化趋势图表
   */
  const initTrendChart = () => {
    if (!trendChartRef.value) return
    
    if (trendChart) {
      trendChart.dispose()
    }
    
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }

  /**
   * 更新趋势图表
   */
  const updateTrendChart = async () => {
    if (!trendChart) return
    
    try {
      console.log('开始加载趋势图表数据...')
      
      const response = await getBudgetHistory(
        trendPeriod.value === '1m' ? '3m' : 
        trendPeriod.value === '1y' ? '12m' : 
        (trendPeriod.value as '3m' | '6m')
      )
      
      if (response.success && response.data) {
        console.log('趋势数据加载成功:', response.data)
        
        const dates = (response.data as any).dates || []
        const budgetData = response.data.budgetData || []
        const expenseData = response.data.expenseData || []
        
        const option = {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['预算金额', '实际支出']
          },
          xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '¥{value}'
            }
          },
          series: [
            {
              name: '预算金额',
              type: 'line',
              data: budgetData,
              smooth: true,
              lineStyle: {
                color: '#409EFF',
                width: 2
              }
            },
            {
              name: '实际支出',
              type: 'line',
              data: expenseData,
              smooth: true,
              lineStyle: {
                color: '#67C23A',
                width: 2
              }
            }
          ]
        }
        
        trendChart.setOption(option)
      } else {
        console.error('获取趋势数据失败:', response.message)
      }
    } catch (error) {
      console.error('加载趋势图表数据失败:', error)
    }
  }

  /**
   * 销毁所有图表
   */
  const disposeCharts = () => {
    if (historyChart) {
      historyChart.dispose()
      historyChart = null
    }
    if (categoryChart) {
      categoryChart.dispose()
      categoryChart = null
    }
    if (trendChart) {
      trendChart.dispose()
      trendChart = null
    }
  }

  return {
    // Refs
    historyChartRef,
    categoryChartRef,
    trendChartRef,
    historyPeriod,
    trendPeriod,
    
    // Methods
    initHistoryChart,
    updateHistoryChart,
    loadHistoryData,
    initCategoryChart,
    updateCategoryChart,
    initTrendChart,
    updateTrendChart,
    disposeCharts
  }
}
