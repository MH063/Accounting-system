/**
 * 后端安全检查服务
 * 对接后端真实API进行安全状态评估
 */

import { request as requestFn } from '@/utils/request'

export interface SecurityFactorResult {
  id: string
  name: string
  weight: number
  score: number
  description: string
  basis?: string
  recommendation: string
}

export interface SecurityCheckResult {
  success: boolean
  message?: string
  data?: {
    overallScore: number
    riskLevel: string
    riskLabel: string
    checkTime: string
    duration: number
    factors: SecurityFactorResult[]
    weightExplanation: string
    summary: {
      description: string
      issueCount: number
      lastCheckTime: string
      quickTip: string
    }
  }
  error?: string
}

/**
 * 执行安全检查（调用后端真实API）
 * @returns 安全检查结果
 */
export const performSecurityCheck = async (): Promise<SecurityCheckResult> => {
  try {
    console.log('[SecurityCheckService] 正在执行安全检查...')
    
    const response = await requestFn<any>('/security/check', {
      method: 'POST'
    })
    
    if (response.success) {
      // 处理双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      console.log('[SecurityCheckService] 安全检查完成:', {
        score: actualData?.overallScore,
        riskLevel: actualData?.riskLevel,
        duration: actualData?.duration
      })
      
      return {
        success: true,
        data: actualData
      }
    } else {
      console.error('[SecurityCheckService] 安全检查失败:', response.error || response.message)
      return {
        success: false,
        error: response.error || response.message || '安全检查失败'
      }
    }
  } catch (error: any) {
    console.error('[SecurityCheckService] 安全检查异常:', error)
    return {
      success: false,
      error: error.message || '网络错误，请稍后重试'
    }
  }
}

/**
 * 获取安全检查因子详情
 * @returns 安全因子列表
 */
export const getSecurityFactors = async (): Promise<{
  success: boolean
  factors: {
    id: string
    name: string
    weight: number
    maxScore: number
    description: string
  }[]
  totalWeight: number
}> => {
  try {
    const response = await requestFn<any>('/security/check/factors', {
      method: 'GET'
    })
    
    if (response.success) {
      // 处理双层嵌套结构 (Rule 5)
      const actualData = response.data?.data || response.data
      
      return {
        success: true,
        factors: actualData?.factors || [],
        totalWeight: actualData?.totalWeight || 0
      }
    }
    
    return {
      success: false,
      factors: [],
      totalWeight: 0
    }
  } catch (error: any) {
    console.error('[SecurityCheckService] 获取安全因子失败:', error)
    return {
      success: false,
      factors: [],
      totalWeight: 0
    }
  }
}

/**
 * 计算风险等级颜色
 * @param riskLevel - 风险等级
 * @returns Element Plus 标签类型
 */
export const getRiskLevelType = (riskLevel: string): 'success' | 'warning' | 'danger' => {
  const types: Record<string, 'success' | 'warning' | 'danger'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return types[riskLevel] || 'warning'
}

/**
 * 获取分数颜色
 * @param score - 分数
 * @returns 颜色类名
 */
export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#67C23A' // 绿色 - 优秀
  if (score >= 70) return '#E6A23C' // 黄色 - 良好
  if (score >= 50) return '#F56C6C' // 红色 - 警告
  return '#909399' // 灰色 - 危险
}

export default {
  performSecurityCheck,
  getSecurityFactors,
  getRiskLevelType,
  getScoreColor
}
