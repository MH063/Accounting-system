/**
 * 支付服务模块
 * 统一管理所有支付相关的API调用
 */

import dataEncryptionManager from './dataEncryptionManager'

// 支付相关类型定义
interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface PaymentRecord {
  id: number
  orderId: string
  transactionId?: string
  transactionType: 'income' | 'expense'
  paymentMethod: 'wechat' | 'alipay' | 'bank' | 'cash'
  amount: number
  feeAmount?: number
  status: 'success' | 'failed' | 'processing' | 'pending' | 'refunded'
  description: string
  remark?: string
  createdAt: string
  completedAt?: string
  ipAddress?: string
  recipientName?: string
  recipientAccount?: string
  discountCode?: string
  discountAmount?: number
}

export interface PaymentStatistics {
  totalIncome: number
  totalExpense: number
  totalTransactions: number
  successfulPayments: number
  pendingPayments: number
  failedPayments: number
  monthlyTransactions: {
    month: string
    count: number
    amount: number
  }[]
  methodDistribution: {
    method: string
    count: number
    amount: number
    percentage: number
  }[]
}

export interface QRCode {
  id: number
  name: string
  type: 'fixed' | 'custom' | 'dynamic'
  amount: number
  currency: string
  description: string
  status: 'active' | 'inactive'
  usageLimit?: number
  usageCount: number
  createdAt: string
  updatedAt: string
  expiresAt?: string
  qrCodeUrl: string
  merchantName: string
  merchantAccount: string
  isDefault: boolean
  tags: string[]
  backgroundColor?: string
  logoUrl?: string
  // 新增支付平台字段
  platform: 'alipay' | 'wechat' | 'unionpay'
  isUserUploaded: boolean
}

export interface PaymentRequest {
  paymentMethod: 'wechat' | 'alipay' | 'bank' | 'cash'
  amount: number
  description: string
  remark?: string
  recipientName?: string
  recipientAccount?: string
  discountCode?: string
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

export interface PaymentResponse {
  success: boolean
  orderId: string
  transactionId?: string
  status: 'success' | 'failed' | 'processing'
  paymentUrl?: string
  qrCodeUrl?: string
  message: string
  data?: Record<string, unknown>
}

export interface PaymentFilter {
  status?: string
  paymentMethod?: string
  transactionType?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  keyword?: string
  page?: number
  size?: number
}

export interface SecurityCheckResult {
  qrCodeStatus: 'success' | 'warning' | 'error'
  usageAnalysis: 'success' | 'warning' | 'error'
  amountValidation: 'success' | 'warning' | 'error'
  permissions: 'success' | 'warning' | 'error'
  issues?: string[]
  recommendations?: string[]
  lastCheckTime: string
}

export interface TimeRange {
  startDate?: string
  endDate?: string
  type?: 'day' | 'week' | 'month' | 'year'
}

export interface ConfirmStatistics {
  pendingAmount: number
  paidAmount: number
  pendingCount: number
  totalCount: number
}

// 基础HTTP请求函数
const request = async <T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  // 获取API基础URL
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://10.111.53.9:4000/api'
  
  // 修正：使用正确的令牌键名
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  
  // 检查是否为 FormData，如果是则不设置 Content-Type（让浏览器自动设置）
  const isFormData = options.body instanceof FormData
  
  const config: RequestInit = {
    ...options,
    headers: {
      // 只有在不是 FormData 时才设置 Content-Type
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    // 使用完整URL构建请求
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
    console.log(`发送请求到: ${fullUrl}`, config);
    
    // 对于需要认证的API端点，检查令牌是否存在
    const authRequiredPaths = ['/payments', '/qr-codes', '/members'];
    const isAuthRequired = authRequiredPaths.some(path => fullUrl.includes(path));
    
    if (isAuthRequired && !token) {
      console.error('认证失败: 访问需要认证的资源但未提供令牌');
      throw new Error('请先登录后再执行此操作');
    }
    
    const response = await fetch(fullUrl, config)
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API请求失败 (${response.status}):`, errorText);
      
      // 特殊处理401错误
      if (response.status === 401) {
        console.log('[paymentService] 检测到401错误，清除认证信息并跳转到登录页')
        authStorageService.clearAuthData()
        window.location.href = '/login?reason=token_expired'
        return
      }
      
      // 特殊处理500错误
      if (response.status === 500) {
        throw new Error('服务器内部错误，请稍后重试')
      }
      // 特殊处理404错误
      if (response.status === 404) {
        throw new Error('请求的资源不存在')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json() as ApiResponse<T>
    console.log(`请求成功:`, data);
    return data
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// ============= 支付记录相关 API =============

/**
 * 获取支付记录列表
 * @param filter 筛选条件
 * @returns 支付记录列表和分页信息
 */
export const getPaymentRecords = async (filter: PaymentFilter = {}) => {
  try {
    // 构建查询参数
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    // 构建完整的URL
    const url = `/payments?${params.toString()}`
    
    // 调用真实API
    const response = await request<{
      records: PaymentRecord[]
      total: number
      page: number
      size: number
      pages: number
    }>(url)
    
    return response
  } catch (error: any) {
    console.error('获取支付记录失败:', error)
    if (error.message && error.message.includes('500')) {
      throw new Error('服务器内部错误，请稍后重试')
    } else {
      throw new Error(error.message || '获取支付记录失败')
    }
  }
}

/**
 * 获取支付记录详情
 * @param orderId 订单ID
 * @returns 支付记录详情
 */
export const getPaymentRecordDetail = async (orderId: string) => {
  try {
    // 调用真实API获取支付记录详情
    const response = await request<any>(`/payments/${orderId}`)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    // 如果启用了数据加密，尝试解密敏感信息
    if (dataEncryptionManager.isEncryptionEnabled() && actualData && actualData.recipientName) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      // 解密敏感字段
      try {
        actualData.recipientName = dataEncryptionManager.decryptField(actualData.recipientName)
        actualData.recipientAccount = dataEncryptionManager.decryptField(actualData.recipientAccount || '')
      } catch (error) {
        console.warn('解密支付记录敏感信息失败:', error)
        // 如果解密失败，保持加密状态或使用默认值
      }
    }
    
    return {
      ...response,
      data: actualData
    }
  } catch (error) {
    console.error('获取支付记录详情失败:', error)
    throw new Error('获取支付记录详情失败')
  }
}

/**
 * 获取支付统计数据
 * @param timeRange 时间范围
 * @returns 支付统计数据
 */
export const getPaymentStatistics = async (timeRange?: TimeRange) => {
  try {
    // 构建查询参数
    const params = new URLSearchParams()
    if (timeRange) {
      if (timeRange.startDate) params.append('startDate', timeRange.startDate)
      if (timeRange.endDate) params.append('endDate', timeRange.endDate)
      if (timeRange.type) params.append('type', timeRange.type)
    }
    
    // 调用真实API获取支付统计数据
    const url = `/payments/statistics${params.toString() ? `?${params.toString()}` : ''}`
    const response = await request<any>(url)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    return {
      ...response,
      data: actualData
    }
  } catch (error: any) {
    console.error('获取支付统计数据失败:', error)
    if (error.message && error.message.includes('404')) {
      throw new Error('支付统计数据接口不存在')
    } else {
      throw new Error(error.message || '获取支付统计数据失败')
    }
  }
}

/**
 * 获取支付确认页面统计数据
 * @param params 查询参数
 * @returns 统计数据
 */
export const getConfirmStatistics = async (params: {
  keyword?: string
  status?: string
  category?: string
  startDate?: string
  endDate?: string
} = {}) => {
  try {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })
    
    const url = `/payments/confirm-statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await request<any>(url)
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    return {
      ...response,
      data: actualData
    }
  } catch (error: any) {
    console.error('获取支付确认统计数据失败:', error)
    throw new Error(error.message || '获取支付确认统计数据失败')
  }
}

/**
 * 获取收入趋势数据
 * @returns 收入趋势数据
 */
export const getIncomeTrend = async () => {
  try {
    // 调用真实API获取收入趋势数据
    const response = await request<{
      success: boolean;
      data: Array<{
        month: string;
        amount: number;
      }>;
      message?: string;
    }>('/payments/income-trend');
    
    return response;
  } catch (error) {
    console.error('获取收入趋势数据失败:', error);
    throw new Error('获取收入趋势数据失败');
  }
}

/**
 * 获取支付方式分布数据
 * @returns 支付方式分布数据
 */
export const getPaymentMethodDistribution = async () => {
  try {
    // 调用真实API获取支付方式分布数据
    const response = await request<{
      success: boolean;
      data: Array<{
        name: string;
        amount: number;
        percentage: number;
      }>;
      message?: string;
    }>('/payments/method-distribution');
    
    return response;
  } catch (error) {
    console.error('获取支付方式分布数据失败:', error);
    throw new Error('获取支付方式分布数据失败');
  }
}

/**
 * 导出支付记录
 * @param filter 筛选条件
 * @param format 导出格式
 * @returns 导出文件URL或二进制数据
 */
export const exportPaymentRecords = async (filter: PaymentFilter, format: 'csv' | 'excel' = 'excel') => {
  try {
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('format', format)
    
    // 添加筛选条件
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    // 获取认证令牌
    const token = localStorage.getItem('access_token')
    
    // 构建下载URL
    // 获取并保存基础URL，确保符合 rule #14 (不使用 localhost/127.0.0.1)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://10.111.53.9:4000/api'
    const downloadUrl = `${baseUrl}/payments/download-export?${params.toString()}`
    
    // 使用fetch直接下载文件
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    
    if (!response.ok) {
      throw new Error('导出文件失败')
    }
    
    // 获取文件blob
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `支付记录_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return {
      success: true,
      data: {
        downloadUrl: downloadUrl,
        recordCount: 0,
        format
      },
      message: '导出成功'
    }
  } catch (error: any) {
    console.error('导出支付记录失败:', error)
    throw new Error(error.message || '导出支付记录失败')
  }
}

/**
 * 确认支付
 * @param orderId 订单ID
 * @param paymentData 支付数据
 * @returns 支付结果
 */
export const confirmPayment = async (
  orderId: string,
  paymentData: {
    amount: number;
    qrCodeId?: number;
    merchantName: string;
    description: string;
    paymentMethod: 'wechat' | 'alipay' | 'bank' | 'cash';
  }
): Promise<ApiResponse<PaymentResponse>> => {
  try {
    console.log('确认支付:', orderId, paymentData);
    
    // 调用真实API确认支付
    const response = await request<PaymentResponse>(`/payments/${orderId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    return response;
  } catch (error) {
    console.error('支付确认失败:', error);
    return {
      success: false,
      data: {
        success: false,
        orderId: '',
        status: 'failed',
        message: '支付确认失败',
        data: {}
      }
    };
  }
};

/**
 * 创建支付订单
 * @param paymentRequest 支付请求参数
 * @returns 支付响应结果
 */
export const createPaymentOrder = async (paymentRequest: PaymentRequest): Promise<ApiResponse<PaymentResponse>> => {
  try {
    // 获取当前用户ID
    const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') || 'default_user' : 'default_user'
    
    // 加密敏感支付信息（如果启用加密）
    let encryptedMetadata = paymentRequest.metadata
    if (dataEncryptionManager.isEncryptionEnabled() && paymentRequest.metadata) {
      // 检查是否已有主密钥，如果没有则从存储中加载
      if (!dataEncryptionManager.hasMasterKey()) {
        // 设置主密钥（实际应用中应从安全存储获取）
        const masterKey = localStorage.getItem('master_encryption_key') || 'default_master_key'
        dataEncryptionManager.setMasterKey(masterKey)
      }
      
      // 加密元数据
      const sensitiveData = {
        type: 'payment_metadata' as any,
        payload: paymentRequest.metadata,
        userId,
        createdAt: new Date().toISOString(),
        version: 1
      }
      
      try {
        const encryptedData = dataEncryptionManager.encryptSensitiveData(sensitiveData)
        encryptedMetadata = { encrypted: encryptedData }
      } catch (error) {
        console.warn('加密支付元数据失败:', error)
        // 如果加密失败，仍然使用原始数据
      }
    }
    
    // 调用真实API创建支付订单
    const response = await request<PaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        ...paymentRequest,
        metadata: encryptedMetadata
      })
    })
    
    return response
  } catch (error) {
    console.error('创建支付订单失败:', error)
    return {
      success: false,
      data: {
        success: false,
        orderId: '',
        status: 'failed',
        message: '创建支付订单失败',
        data: {}
      }
    }
  }
}

/**
 * 状态文本转换函数
 * @param status 状态值
 * @returns 对应的状态文本
 */
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    success: '成功',
    failed: '失败',
    processing: '处理中',
    pending: '待处理',
    refunded: '已退款'
  }
  return statusMap[status] || status
}

/**
 * 记录筛选函数
 * @param records 记录列表
 * @param filter 筛选条件
 * @returns 筛选后的记录列表
 */
export const filterPaymentRecords = (records: PaymentRecord[], filter: PaymentFilter): PaymentRecord[] => {
  return records.filter(record => {
    // 状态筛选
    if (filter.status && record.status !== filter.status) return false
    
    // 支付方式筛选
    if (filter.paymentMethod && record.paymentMethod !== filter.paymentMethod) return false
    
    // 交易类型筛选
    if (filter.transactionType && record.transactionType !== filter.transactionType) return false
    
    // 金额范围筛选
    if (filter.minAmount && record.amount < filter.minAmount) return false
    if (filter.maxAmount && record.amount > filter.maxAmount) return false
    
    // 日期范围筛选
    if (filter.startDate && new Date(record.createdAt) < new Date(filter.startDate)) return false
    if (filter.endDate && new Date(record.createdAt) > new Date(filter.endDate)) return false
    
    // 关键词筛选
    if (filter.keyword && !record.description.includes(filter.keyword) && !record.orderId.includes(filter.keyword)) return false
    
    return true
  })
}

// ============= 收款码相关 API =============

/**
 * 获取收款码列表
 * @param params 查询参数
 * @returns 收款码列表
 */
export const getQRCodes = async (params: {
  page?: number
  size?: number
  status?: 'active' | 'inactive'
  platform?: 'alipay' | 'wechat' | 'unionpay'
} = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })
    
    // 调用真实API获取收款码列表
    const url = `/qr-codes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await request<{
      records: QRCode[]
      total: number
      page: number
      size: number
      pages: number
    }>(url)
    
    return response
  } catch (error) {
    console.error('获取收款码列表失败:', error)
    throw new Error('获取收款码列表失败')
  }
}

/**
 * 创建收款码
 * @param qrCodeData 收款码数据
 * @returns 创建的收款码
 */
export const createQRCode = async (qrCodeData: Omit<QRCode, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
  try {
    // 调用真实API创建收款码
    const response = await request<QRCode>('/qr-codes', {
      method: 'POST',
      body: JSON.stringify(qrCodeData)
    })
    
    return response
  } catch (error) {
    console.error('创建收款码失败:', error)
    throw new Error('创建收款码失败')
  }
}

/**
 * 更新收款码
 * @param id 收款码ID
 * @param qrCodeData 更新的收款码数据
 * @returns 更新后的收款码
 */
export const updateQRCode = async (id: number, qrCodeData: Partial<QRCode>) => {
  try {
    // 调用真实API更新收款码
    const response = await request<QRCode>(`/qr-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(qrCodeData)
    })
    
    return response
  } catch (error) {
    console.error('更新收款码失败:', error)
    throw new Error('更新收款码失败')
  }
}

/**
 * 删除收款码
 * @param id 收款码ID
 * @returns 删除结果
 */
export const deleteQRCode = async (id: number) => {
  try {
    // 调用真实API删除收款码
    const response = await request<void>(`/qr-codes/${id}`, {
      method: 'DELETE'
    })
    
    return response
  } catch (error) {
    console.error('删除收款码失败:', error)
    throw new Error('删除收款码失败')
  }
}

/**
 * 设置默认收款码
 * @param id 收款码ID
 * @returns 设置结果
 */
export const setDefaultQRCode = async (id: number) => {
  try {
    // 调用真实API设置默认收款码
    const response = await request<void>(`/qr-codes/${id}/default`, {
      method: 'PUT'
    })
    
    return response
  } catch (error) {
    console.error('设置默认收款码失败:', error)
    throw new Error('设置默认收款码失败')
  }
}

/**
 * 收款码安全检测
 * @param qrCodeIds 要检测的收款码ID列表
 * @returns 安全检测结果
 */
export const performSecurityCheck = async (qrCodeIds: number[]) => {
  try {
    // 调用真实API进行安全检测
    const response = await request<SecurityCheckResult>('/qr-codes/security-check', {
      method: 'POST',
      body: JSON.stringify({ qrCodeIds })
    })
    
    return response
  } catch (error) {
    console.error('安全检测失败:', error)
    throw new Error('安全检测失败')
  }
}

/**
 * 保存提醒设置
 * @param settings 提醒设置
 * @returns 保存结果
 */
export const saveReminderSettings = async (settings: {
  enabled: boolean;
  methods: string[];
  intervalMinutes: number;
}) => {
  try {
    // 调用真实API保存提醒设置
    const response = await request<boolean>('/payments/reminder-settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    
    return response;
  } catch (error) {
    console.error('保存提醒设置失败:', error);
    return {
      success: false,
      data: false,
      message: '保存提醒设置失败'
    };
  }
}

/**
 * 获取提醒设置
 * @returns 提醒设置
 */
export const getReminderSettings = async () => {
  try {
    // 调用真实API获取提醒设置
    const response = await request<{
      enabled: boolean;
      methods: string[];
      intervalMinutes: number;
    }>('/payments/reminder-settings');
    
    return response;
  } catch (error) {
    console.error('获取提醒设置失败:', error);
    return {
      success: false,
      data: {
        enabled: false,
        methods: ['email', 'sms'],
        intervalMinutes: 60
      },
      message: '获取提醒设置失败'
    };
  }
}

/**
 * 获取安全检测历史记录
 * @param days 天数，默认30天
 * @returns 历史记录列表
 */
export const getSecurityCheckHistory = async (days: number = 30) => {
  try {
    // 调用真实API获取安全检测历史记录
    const response = await request<{
      id: number
      checkTime: string
      status: 'success' | 'warning' | 'error'
      issueCount: number
      checkedQRCodes: number
      responseTime: number
    }[]>(`/qr-codes/security-history?days=${days}`)
    
    return response
  } catch (error) {
    console.error('获取安全检测历史失败:', error)
    throw new Error('获取安全检测历史失败')
  }
}

/**
 * 上传收款码图片
 * @param data 上传数据
 * @returns 上传结果
 */
export const uploadQRCodeImage = async (data: {
  file: File;
  platform: 'alipay' | 'wechat' | 'unionpay';
  description?: string;
}) => {
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('platform', data.platform);
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // 调用真实API上传收款码图片
    const response = await request<QRCode>('/qr-codes/upload', {
      method: 'POST',
      body: formData
    });
    
    return {
      success: true,
      data: response,
      message: '收款码上传成功'
    };
  } catch (error) {
    console.error('上传收款码图片失败:', error);
    return {
      success: false,
      data: {} as QRCode,
      message: '上传收款码图片失败'
    };
  }
}

/**
 * 计算费用分摊
 * @param sharingData 分摊数据
 * @returns 分摊结果
 */
export const calculateSharing = async (sharingData: {
  expenses: Array<{
    id: number
    name: string
    description: string
    amount: number
    category: string
    payer: string
  }>
  members: Array<{
    name: string
    phone: string
    email: string
  }>
}) => {
  try {
    // 检查用户是否已认证
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      console.error('费用分摊计算失败: 用户未认证')
      throw new Error('请先登录后再进行费用分摊计算')
    }
    
    console.log('开始费用分摊计算，认证令牌存在')
    
    // 调用真实API计算费用分摊
    const response = await request<{
      sharingResults: Array<{
        name: string
        shouldPay: number
        paid: number
        pending: number
        status: string
      }>
      totalExpense: number
      perPersonShare: number
      totalPaid: number
      totalPending: number
    }>('/payments/calculate-sharing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sharingData)
    })
    
    return response
  } catch (error: any) {
    console.error('费用分摊计算失败:', error)
    
    if (error.message && error.message.includes('401')) {
      console.log('[paymentService] 检测到401错误，清除认证信息并跳转到登录页')
      authStorageService.clearAuthData()
      window.location.href = '/login?reason=token_expired'
      return
    } else if (error.message && error.message.includes('403')) {
      throw new Error('您没有权限执行此操作')
    } else {
      throw new Error(error.message || '费用分摊计算失败，请稍后重试')
    }
  }
}

// 导出默认实例配置
export const paymentConfig = {
  defaultPaymentMethod: 'wechat' as const,
  maxPaymentAmount: 10000,
  minPaymentAmount: 0.01,
  retryAttempts: 3,
  timeout: 30000
}