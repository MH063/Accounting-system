/**
 * 安全问题服务
 * 提供安全问题的存储和验证功能
 */

import request from '@/utils/request'

// 安全问题配置接口
export interface SecurityQuestionConfig {
  question1: string
  answer1: string
  question2: string
  answer2: string
  question3: string
  answer3: string
}

// API响应接口
export interface SecurityQuestionResponse {
  hasSecurityQuestions: boolean
  questions?: Array<{ question: string }>
  isEnabled?: boolean
  isVerified?: boolean
}

/**
 * 获取默认安全问题配置
 */
export const getDefaultSecurityQuestionConfig = (): SecurityQuestionConfig => {
  return {
    question1: '',
    answer1: '',
    question2: '',
    answer2: '',
    question3: '',
    answer3: ''
  }
}

/**
 * 从后端获取安全问题配置（用于验证，不返回答案）
 * @param userId 用户ID
 */
export const getSecurityQuestionConfig = async (userId: string): Promise<SecurityQuestionResponse> => {
  try {
    console.log('[SecurityQuestionService] 获取安全问题配置', { userId })
    const response = await request<SecurityQuestionResponse>('/security-questions/config', {
      method: 'GET'
    })
    console.log('[SecurityQuestionService] 获取安全问题配置成功', response.data)
    return response.data
  } catch (error) {
    console.error('[SecurityQuestionService] 获取安全问题配置失败:', error)
    throw error
  }
}

/**
 * 获取用于验证的安全问题配置（包含答案）
 * 注意：此接口仅用于后端验证，前端不应直接调用
 * @param userId 用户ID
 */
export const getSecurityQuestionConfigForVerification = async (userId: string): Promise<SecurityQuestionConfig> => {
  try {
    console.log('[SecurityQuestionService] 获取安全问题配置用于验证', { userId })
    const response = await request<SecurityQuestionConfig>('/security-questions/config-for-verification', {
      method: 'POST'
    })
    console.log('[SecurityQuestionService] 获取安全问题配置用于验证成功', response.data)
    return response.data
  } catch (error) {
    console.error('[SecurityQuestionService] 获取安全问题配置用于验证失败:', error)
    throw error
  }
}

/**
 * 保存安全问题配置到后端
 * @param userId 用户ID
 * @param config 安全问题配置
 */
export const saveSecurityQuestionConfig = async (
  userId: string,
  config: SecurityQuestionConfig
): Promise<{ hasSecurityQuestions: boolean }> => {
  try {
    console.log('[SecurityQuestionService] 保存安全问题配置', { userId, config })
    const response = await request<{ hasSecurityQuestions: boolean }>('/security-questions/config', {
      method: 'POST',
      data: {
        question1: config.question1,
        answer1: config.answer1,
        question2: config.question2,
        answer2: config.answer2,
        question3: config.question3,
        answer3: config.answer3
      }
    })
    console.log('[SecurityQuestionService] 保存安全问题配置成功', response.data)
    return response.data
  } catch (error) {
    console.error('[SecurityQuestionService] 保存安全问题配置失败:', error)
    throw error
  }
}

/**
 * 验证安全问题答案
 * @param userId 用户ID
 * @param questionIndex 问题索引 (1, 2, 或 3)
 * @param answer 用户提供的答案
 * @returns 是否验证成功
 */
export const verifySecurityQuestionAnswer = async (
  userId: string,
  questionIndex: number,
  answer: string
): Promise<boolean> => {
  try {
    console.log('[SecurityQuestionService] 验证安全问题答案', { userId, questionIndex })
    
    const config = await getSecurityQuestionConfigForVerification(userId)
    
    let storedAnswer = ''
    switch (questionIndex) {
      case 1:
        storedAnswer = config.answer1
        break
      case 2:
        storedAnswer = config.answer2
        break
      case 3:
        storedAnswer = config.answer3
        break
      default:
        return false
    }
    
    if (!storedAnswer) {
      return false
    }
    
    const decryptedStoredAnswer = storedAnswer.toLowerCase().trim()
    const providedAnswer = answer.toLowerCase().trim()
    
    const isMatch = decryptedStoredAnswer === providedAnswer
    console.log('[SecurityQuestionService] 验证结果', { isMatch })
    
    return isMatch
  } catch (error) {
    console.error('[SecurityQuestionService] 验证安全问题答案失败:', error)
    return false
  }
}

/**
 * 批量验证安全问题答案
 * @param userId 用户ID
 * @param answers 答案数组
 * @returns 是否全部验证成功
 */
export const verifySecurityQuestionAnswers = async (
  userId: string,
  answers: string[]
): Promise<boolean> => {
  try {
    console.log('[SecurityQuestionService] 批量验证安全问题答案', { userId, answerCount: answers.length })
    
    if (answers.length !== 3) {
      console.warn('[SecurityQuestionService] 答案数量不正确', { expected: 3, actual: answers.length })
      return false
    }
    
    const response = await request<{ success: boolean; message: string }>('/security-questions/verify', {
      method: 'POST',
      data: {
        answers: answers
      }
    })
    
    console.log('[SecurityQuestionService] 批量验证结果', response.data)
    return response.data.success
  } catch (error) {
    console.error('[SecurityQuestionService] 批量验证安全问题答案失败:', error)
    return false
  }
}

/**
 * 检查用户是否已设置安全问题
 * @param userId 用户ID
 * @returns 是否已设置安全问题
 */
export const hasSecurityQuestions = async (userId: string): Promise<boolean> => {
  try {
    console.log('[SecurityQuestionService] 检查安全问题设置状态', { userId })
    const response = await request<{ hasSecurityQuestions: boolean }>('/security-questions/check', {
      method: 'GET'
    })
    console.log('[SecurityQuestionService] 检查安全问题设置状态成功', response.data)
    return response.data.hasSecurityQuestions
  } catch (error) {
    console.error('[SecurityQuestionService] 检查安全问题设置状态失败:', error)
    return false
  }
}

/**
 * 删除用户安全问题配置
 * @param userId 用户ID
 */
export const deleteSecurityQuestionConfig = async (userId: string): Promise<{ deleted: boolean }> => {
  try {
    console.log('[SecurityQuestionService] 删除安全问题配置', { userId })
    const response = await request<{ deleted: boolean }>('/security-questions/config', {
      method: 'DELETE'
    })
    console.log('[SecurityQuestionService] 删除安全问题配置成功', response.data)
    return response.data
  } catch (error) {
    console.error('[SecurityQuestionService] 删除安全问题配置失败:', error)
    throw error
  }
}

export default {
  getDefaultSecurityQuestionConfig,
  getSecurityQuestionConfig,
  getSecurityQuestionConfigForVerification,
  saveSecurityQuestionConfig,
  verifySecurityQuestionAnswer,
  verifySecurityQuestionAnswers,
  hasSecurityQuestions,
  deleteSecurityQuestionConfig
}
