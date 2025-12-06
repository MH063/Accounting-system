/**
 * 数据加密管理器
 * 负责管理敏感数据的端到端加密和解密
 */

import { 
  generateEncryptionKey, 
  encryptData, 
  decryptData, 
  encryptSensitiveData, 
  decryptSensitiveData,
  isEncrypted,
  encryptAndSign,
  verifyAndDecrypt
} from './encryptionService'

// 敏感数据类型枚举
export enum SensitiveDataType {
  PERSONAL_INFO = 'personal_info',
  FINANCIAL_DATA = 'financial_data',
  PAYMENT_RECORD = 'payment_record',
  SECURITY_QUESTION = 'security_question',
  USER_CREDENTIALS = 'user_credentials'
}

// 加密配置接口
export interface EncryptionConfig {
  enabled: boolean
  algorithm: 'AES' | 'RSA'
  keyDerivation: 'PBKDF2' | 'Scrypt'
  iterations: number
}

// 敏感数据接口
export interface SensitiveData {
  type: SensitiveDataType
  payload: Record<string, any>
  userId: string
  createdAt: string
  version: number
}

/**
 * 数据加密管理器类
 */
class DataEncryptionManager {
  private static instance: DataEncryptionManager
  private config: EncryptionConfig
  private masterKey: string | null = null
  private encryptionKey: string | null = null

  private constructor() {
    // 默认配置
    this.config = {
      enabled: true, // 默认启用数据加密
      algorithm: 'AES',
      keyDerivation: 'PBKDF2',
      iterations: 10000
    }
    
    // 从localStorage加载配置
    this.loadConfig()
    
    // 尝试从安全存储加载主密钥
    this.loadMasterKeyFromSecureStorage()
    
    // 注意：不要在这里强制启用加密，应尊重用户的设置
    // 只有在初始化时（localStorage中没有配置）才使用默认值
  }

  /**
   * 获取单例实例
   * @returns DataEncryptionManager实例
   */
  public static getInstance(): DataEncryptionManager {
    if (!DataEncryptionManager.instance) {
      DataEncryptionManager.instance = new DataEncryptionManager()
    }
    return DataEncryptionManager.instance
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const configStr = localStorage.getItem('data_encryption_config')
      if (configStr) {
        this.config = { ...this.config, ...JSON.parse(configStr) }
      } else {
        // 如果没有配置，默认启用数据加密
        this.config.enabled = true
      }
    } catch (error) {
      console.warn('加载数据加密配置失败:', error)
      // 出错时默认启用数据加密
      this.config.enabled = true
    }
  }

  /**
   * 从安全存储加载主密钥
   */
  private loadMasterKeyFromSecureStorage(): void {
    try {
      // 在实际应用中，这里应该从更安全的地方加载主密钥
      // 例如：Web Crypto API、IndexedDB 或其他安全存储机制
      const userId = localStorage.getItem('userId') || 'default_user'
      const encryptedMasterKey = localStorage.getItem(`master_encryption_key_${userId}`)
      
      if (encryptedMasterKey) {
        // 在实际应用中，这里应该使用设备特定的密钥来解密主密钥
        // 这里为了演示目的，直接使用存储的值
        this.masterKey = encryptedMasterKey
        this.encryptionKey = generateEncryptionKey(encryptedMasterKey)
      }
    } catch (error) {
      console.warn('从安全存储加载主密钥失败:', error)
    }
  }

  /**
   * 保存主密钥到安全存储
   * @param key 主密钥
   */
  private saveMasterKeyToSecureStorage(key: string): void {
    try {
      // 在实际应用中，这里应该将主密钥保存到更安全的地方
      // 例如：Web Crypto API、IndexedDB 或其他安全存储机制
      const userId = localStorage.getItem('userId') || 'default_user'
      // 注意：在实际应用中，不应直接存储明文密钥，而应加密存储
      localStorage.setItem(`master_encryption_key_${userId}`, key)
    } catch (error) {
      console.warn('保存主密钥到安全存储失败:', error)
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('data_encryption_config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('保存数据加密配置失败:', error)
    }
  }

  /**
   * 设置主密钥
   * @param key 主密钥
   */
  public setMasterKey(key: string): void {
    this.masterKey = key
    // 生成加密密钥
    this.encryptionKey = generateEncryptionKey(key)
    
    // 保存到安全存储
    this.saveMasterKeyToSecureStorage(key)
  }

  /**
   * 启用数据加密
   */
  public enableEncryption(): void {
    this.config.enabled = true
    this.saveConfig()
    
    // 如果已经有主密钥，重新生成加密密钥
    if (this.masterKey) {
      this.encryptionKey = generateEncryptionKey(this.masterKey)
    }
  }

  /**
   * 禁用数据加密
   */
  public disableEncryption(): void {
    this.config.enabled = false
    this.saveConfig()
    
    // 清除加密密钥
    this.encryptionKey = null
  }

  /**
   * 检查是否启用加密
   * @returns 是否启用加密
   */
  public isEncryptionEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * 加密敏感数据
   * @param data 敏感数据
   * @returns 加密后的数据
   */
  public encryptSensitiveData(data: SensitiveData): string {
    if (!this.config.enabled || !this.masterKey) {
      // 如果未启用加密或没有主密钥，返回原始数据的JSON字符串
      return JSON.stringify(data)
    }

    try {
      // 创建包含元数据的包装对象
      const wrappedData = {
        ...data,
        encrypted: true,
        timestamp: new Date().toISOString()
      }

      // 序列化数据
      const serializedData = JSON.stringify(wrappedData)

      // 加密并签名数据
      return encryptAndSign(serializedData, this.masterKey)
    } catch (error) {
      console.error('加密敏感数据失败:', error)
      throw new Error('数据加密失败')
    }
  }

  /**
   * 批量加密敏感数据对象
   * @param dataList 敏感数据对象数组
   * @param masterKey 主密钥
   * @returns 加密后的数据对象
   */
  public encryptSensitiveDataBatchWithKey<T extends Record<string, any>>(
    dataList: T[], 
    masterKey: string
  ): Record<string, string>[] {
    try {
      return dataList.map(data => encryptSensitiveData(data, masterKey))
    } catch (error) {
      console.error('批量加密敏感数据失败:', error)
      throw new Error('批量数据加密失败')
    }
  }

  /**
   * 解密敏感数据
   * @param encryptedData 加密的数据
   * @returns 解密后的敏感数据
   */
  public decryptSensitiveData(encryptedData: string): SensitiveData {
    if (!this.config.enabled || !this.masterKey) {
      // 如果未启用加密或没有主密钥，尝试解析为原始数据
      try {
        return JSON.parse(encryptedData) as SensitiveData
      } catch (error) {
        console.error('解析未加密数据失败:', error)
        throw new Error('数据解析失败')
      }
    }

    try {
      // 验证并解密数据
      const decryptedData = verifyAndDecrypt(encryptedData, this.masterKey)
      
      // 解析解密后的数据
      const parsedData = JSON.parse(decryptedData)
      
      // 移除包装元数据，返回原始数据结构
      const { encrypted, timestamp, ...originalData } = parsedData
      return originalData as SensitiveData
    } catch (error) {
      console.error('解密敏感数据失败:', error)
      throw new Error('数据解密失败')
    }
  }

  /**
   * 批量解密敏感数据对象
   * @param encryptedDataList 加密的数据对象数组
   * @param masterKey 主密钥
   * @returns 解密后的数据对象
   */
  public decryptSensitiveDataBatchWithKey<T extends Record<string, any>>(
    encryptedDataList: Record<string, string>[], 
    masterKey: string
  ): T[] {
    try {
      return encryptedDataList.map(data => decryptSensitiveData(data, masterKey))
    } catch (error) {
      console.error('批量解密敏感数据失败:', error)
      throw new Error('批量数据解密失败')
    }
  }

  /**
   * 批量加密敏感数据数组
   * @param dataList 敏感数据数组
   * @returns 加密后的数据数组
   */
  public encryptSensitiveDataBatch(dataList: SensitiveData[]): string[] {
    return dataList.map(data => this.encryptSensitiveData(data))
  }

  /**
   * 批量解密敏感数据数组
   * @param encryptedDataList 加密的数据数组
   * @returns 解密后的敏感数据数组
   */
  public decryptSensitiveDataBatch(encryptedDataList: string[]): SensitiveData[] {
    return encryptedDataList.map(data => this.decryptSensitiveData(data))
  }

  /**
   * 加密单个字段
   * @param value 要加密的值
   * @returns 加密后的值
   */
  public encryptField(value: string): string {
    if (!this.config.enabled || !this.masterKey || !this.encryptionKey) {
      return value
    }

    try {
      return encryptData(value, this.encryptionKey)
    } catch (error) {
      console.error('加密字段失败:', error)
      return value // 返回原始值以防加密失败
    }
  }

  /**
   * 解密单个字段
   * @param encryptedValue 加密的值
   * @returns 解密后的值
   */
  public decryptField(encryptedValue: string): string {
    if (!this.config.enabled || !this.masterKey || !this.encryptionKey || !isEncrypted(encryptedValue)) {
      return encryptedValue
    }

    try {
      return decryptData(encryptedValue, this.encryptionKey)
    } catch (error) {
      console.error('解密字段失败:', error)
      return encryptedValue // 返回加密值以防解密失败
    }
  }

  /**
   * 获取加密配置
   * @returns 加密配置
   */
  public getConfig(): EncryptionConfig {
    return { ...this.config }
  }

  /**
   * 检查主密钥是否存在
   * @returns 是否存在主密钥
   */
  public hasMasterKey(): boolean {
    return !!this.masterKey
  }

  /**
   * 更新加密配置
   * @param config 新的加密配置
   */
  public updateConfig(config: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...config }
    this.saveConfig()
  }
}

// 创建并导出单例实例
const dataEncryptionManager = DataEncryptionManager.getInstance()

export default dataEncryptionManager

// 导出辅助函数
export const encryptPersonalInfo = (personalInfo: Record<string, any>, userId: string): string => {
  const sensitiveData: SensitiveData = {
    type: SensitiveDataType.PERSONAL_INFO,
    payload: personalInfo,
    userId,
    createdAt: new Date().toISOString(),
    version: 1
  }
  
  return dataEncryptionManager.encryptSensitiveData(sensitiveData)
}

export const decryptPersonalInfo = (encryptedData: string): Record<string, any> => {
  const sensitiveData = dataEncryptionManager.decryptSensitiveData(encryptedData)
  return sensitiveData.payload
}

export const encryptFinancialData = (financialData: Record<string, any>, userId: string): string => {
  const sensitiveData: SensitiveData = {
    type: SensitiveDataType.FINANCIAL_DATA,
    payload: financialData,
    userId,
    createdAt: new Date().toISOString(),
    version: 1
  }
  
  return dataEncryptionManager.encryptSensitiveData(sensitiveData)
}

export const decryptFinancialData = (encryptedData: string): Record<string, any> => {
  const sensitiveData = dataEncryptionManager.decryptSensitiveData(encryptedData)
  return sensitiveData.payload
}

export const encryptPaymentRecord = (paymentRecord: Record<string, any>, userId: string): string => {
  const sensitiveData: SensitiveData = {
    type: SensitiveDataType.PAYMENT_RECORD,
    payload: paymentRecord,
    userId,
    createdAt: new Date().toISOString(),
    version: 1
  }
  
  return dataEncryptionManager.encryptSensitiveData(sensitiveData)
}

export const decryptPaymentRecord = (encryptedData: string): Record<string, any> => {
  const sensitiveData = dataEncryptionManager.decryptSensitiveData(encryptedData)
  return sensitiveData.payload
}