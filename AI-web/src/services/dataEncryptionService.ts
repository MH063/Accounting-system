/**
 * 数据加密服务
 * 提供与后端数据加密API的交互功能
 */

import { request as requestFn } from '@/utils/request'

export interface EncryptionConfig {
  enabled: boolean
  dataType: string
  dataId?: string
  metadata?: Record<string, any>
}

export interface EncryptedDataResult {
  success: boolean
  dataHash?: string
  error?: string
}

export interface DecryptedDataResult {
  success: boolean
  data?: any
  metadata?: Record<string, any>
  createdAt?: string
  updatedAt?: string
  error?: string
}

export interface EncryptionStats {
  [key: string]: number
}

/**
 * 加密并保存数据到后端
 */
export const encryptAndSaveData = async (
  dataType: string,
  data: any,
  dataId?: string,
  metadata?: Record<string, any>
): Promise<EncryptedDataResult> => {
  try {
    const response = await requestFn<{ dataHash: string }>('/encryption/data', {
      method: 'POST',
      data: {
        dataType,
        dataId: dataId || 'default',
        data,
        metadata
      }
    })
    
    console.log(`[EncryptionService] ${dataType} 数据加密保存成功`)
    return { success: true, dataHash: response.data?.dataHash }
  } catch (error: any) {
    console.error(`[EncryptionService] ${dataType} 数据加密保存失败:`, error)
    return { success: false, error: error.message || '加密保存失败' }
  }
}

/**
 * 从后端解密并读取数据
 */
export const decryptAndReadData = async (
  dataType: string,
  dataId?: string
): Promise<DecryptedDataResult> => {
  try {
    const params = dataId ? `?dataId=${encodeURIComponent(dataId)}` : ''
    const response = await requestFn<any>(`/encryption/data/${dataType}${params}`, {
      method: 'GET'
    })
    
    console.log(`[EncryptionService] ${dataType} 数据解密读取成功`)
    return {
      success: true,
      data: response.data?.content,
      metadata: response.data?.metadata,
      createdAt: response.data?.createdAt,
      updatedAt: response.data?.updatedAt
    }
  } catch (error: any) {
    console.error(`[EncryptionService] ${dataType} 数据解密读取失败:`, error)
    return { success: false, error: error.message || '解密读取失败' }
  }
}

/**
 * 批量解密数据
 */
export const decryptBatchData = async (
  dataType: string
): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    const response = await requestFn<any[]>(`/encryption/data/${dataType}/batch`, {
      method: 'GET'
    })
    
    console.log(`[EncryptionService] ${dataType} 批量解密成功`)
    return { success: true, data: response.data || [] }
  } catch (error: any) {
    console.error(`[EncryptionService] ${dataType} 批量解密失败:`, error)
    return { success: false, data: [], error: error.message }
  }
}

/**
 * 删除加密数据
 */
export const deleteEncryptedData = async (
  dataType: string,
  dataId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await requestFn(`/encryption/data/${dataType}/${dataId}`, {
      method: 'DELETE'
    })
    
    console.log(`[EncryptionService] ${dataType}/${dataId} 数据删除成功`)
    return { success: true }
  } catch (error: any) {
    console.error(`[EncryptionService] ${dataType}/${dataId} 数据删除失败:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * 获取加密数据统计
 */
export const getEncryptionStats = async (): Promise<{
  success: boolean
  stats?: EncryptionStats
  error?: string
}> => {
  try {
    const response = await requestFn<EncryptionStats>('/encryption/stats', {
      method: 'GET'
    })
    
    return { success: true, stats: response.data }
  } catch (error: any) {
    console.error('[EncryptionService] 获取加密统计失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 加密用户个人信息
 */
export const encryptPersonalInfo = async (
  personalInfo: Record<string, any>,
  userId: string
): Promise<EncryptedDataResult> => {
  return encryptAndSaveData('personal_info', {
    ...personalInfo,
    userId,
    encryptedAt: new Date().toISOString()
  }, userId, { category: 'personal' })
}

/**
 * 解密用户个人信息
 */
export const decryptPersonalInfo = async (
  userId: string
): Promise<DecryptedDataResult> => {
  return decryptAndReadData('personal_info', userId)
}

/**
 * 加密财务数据
 */
export const encryptFinancialData = async (
  financialData: Record<string, any>,
  userId: string
): Promise<EncryptedDataResult> => {
  return encryptAndSaveData('financial_data', {
    ...financialData,
    userId,
    encryptedAt: new Date().toISOString()
  }, userId, { category: 'financial' })
}

/**
 * 解密财务数据
 */
export const decryptFinancialData = async (
  userId: string
): Promise<DecryptedDataResult> => {
  return decryptAndReadData('financial_data', userId)
}

/**
 * 加密支付记录
 */
export const encryptPaymentRecord = async (
  paymentRecord: Record<string, any>,
  userId: string
): Promise<EncryptedDataResult> => {
  return encryptAndSaveData('payment_record', {
    ...paymentRecord,
    userId,
    encryptedAt: new Date().toISOString()
  }, paymentRecord.id || `payment_${Date.now()}`, { category: 'payment' })
}

/**
 * 解密支付记录
 */
export const decryptPaymentRecords = async (
  userId: string
): Promise<{ success: boolean; data: any[]; error?: string }> => {
  return decryptBatchData('payment_record')
}

/**
 * 加密安全问题和答案
 */
export const encryptSecurityQuestions = async (
  questions: Record<string, string>,
  userId: string
): Promise<EncryptedDataResult> => {
  return encryptAndSaveData('security_questions', {
    questions,
    userId,
    encryptedAt: new Date().toISOString()
  }, userId, { category: 'security' })
}

/**
 * 解密安全问题和答案
 */
export const decryptSecurityQuestions = async (
  userId: string
): Promise<DecryptedDataResult> => {
  return decryptAndReadData('security_questions', userId)
}

/**
 * 初始化数据加密服务
 * 在启用加密功能时调用
 */
export const initializeEncryption = async (): Promise<boolean> => {
  try {
    // 初始化密钥管理
    const { initializeKeyManagement } = await import('./keyManagementService')
    await initializeKeyManagement()
    
    console.log('[EncryptionService] 数据加密服务初始化成功')
    return true
  } catch (error) {
    console.error('[EncryptionService] 数据加密服务初始化失败:', error)
    return false
  }
}

/**
 * 检查数据加密是否已启用且可用
 */
export const checkEncryptionAvailable = async (): Promise<{
  available: boolean
  reason?: string
}> => {
  try {
    const stats = await getEncryptionStats()
    return { available: true, reason: stats.success ? '服务正常' : undefined }
  } catch (error: any) {
    return { available: false, reason: error.message }
  }
}

export default {
  // 核心API
  encryptAndSaveData,
  decryptAndReadData,
  decryptBatchData,
  deleteEncryptedData,
  getEncryptionStats,
  
  // 业务数据加密
  encryptPersonalInfo,
  decryptPersonalInfo,
  encryptFinancialData,
  decryptFinancialData,
  encryptPaymentRecord,
  decryptPaymentRecords,
  encryptSecurityQuestions,
  decryptSecurityQuestions,
  
  // 初始化
  initializeEncryption,
  checkEncryptionAvailable
}
