/**
 * 支付服务模块
 * 统一管理所有支付相关的API调用
 */

import { ElMessage } from 'element-plus'

// 支付相关类型定义
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
  metadata?: Record<string, any>
}

export interface PaymentResponse {
  success: boolean
  orderId: string
  transactionId?: string
  status: 'success' | 'failed' | 'processing'
  paymentUrl?: string
  qrCodeUrl?: string
  message: string
  data?: any
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

// 基础HTTP请求函数
const request = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken')
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`/api${url}`, config)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
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
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 构建查询参数
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    // 模拟返回数据结构
    return {
      success: true,
      data: {
        records: generateMockPaymentRecords(),
        total: 150,
        page: filter.page || 1,
        size: filter.size || 20,
        pages: Math.ceil(150 / (filter.size || 20))
      }
    }
  } catch (error) {
    console.error('获取支付记录失败:', error)
    throw new Error('获取支付记录失败')
  }
}

/**
 * 获取支付记录详情
 * @param orderId 订单ID
 * @returns 支付记录详情
 */
export const getPaymentRecordDetail = async (orderId: string) => {
  try {
    const response = await request(`/payments/records/${orderId}`, {
      method: 'GET'
    })
    
    return response
  } catch (error) {
    console.error('获取支付记录详情失败:', error)
    throw new Error('获取支付记录详情失败')
  }
}

/**
 * 获取支付统计数据
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 统计数据
 */
export const getPaymentStatistics = async (startDate?: string, endDate?: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // 模拟统计数据
    const mockStats = generateMockStatistics()
    
    return {
      success: true,
      data: mockStats
    }
  } catch (error) {
    console.error('获取支付统计数据失败:', error)
    throw new Error('获取支付统计数据失败')
  }
}

/**
 * 导出支付记录
 * @param filter 筛选条件
 * @param format 导出格式 (csv, excel)
 * @returns 文件下载链接
 */
export const exportPaymentRecords = async (filter: PaymentFilter, format: 'csv' | 'excel' = 'csv') => {
  try {
    const response = await request(`/payments/records/export`, {
      method: 'POST',
      body: JSON.stringify({ filter, format })
    })
    
    return response
  } catch (error) {
    console.error('导出支付记录失败:', error)
    throw new Error('导出支付记录失败')
  }
}

// ============= 收款码管理相关 API =============

/**
 * 获取收款码列表
 * @returns 收款码列表
 */
export const getQRCodes = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return {
      success: true,
      data: generateMockQRCodes()
    }
  } catch (error) {
    console.error('获取收款码列表失败:', error)
    throw new Error('获取收款码列表失败')
  }
}

/**
 * 创建收款码
 * @param qrCodeData 收款码数据
 * @returns 创建结果
 */
export const createQRCode = async (qrCodeData: Omit<QRCode, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'qrCodeUrl'>) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newQRCode = {
      id: Date.now(),
      ...qrCodeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_${Date.now()}`
    }
    
    return {
      success: true,
      data: newQRCode,
      message: '收款码创建成功'
    }
  } catch (error) {
    console.error('创建收款码失败:', error)
    throw new Error('创建收款码失败')
  }
}

/**
 * 更新收款码
 * @param id 收款码ID
 * @param qrCodeData 收款码数据
 * @returns 更新结果
 */
export const updateQRCode = async (id: number, qrCodeData: Partial<QRCode>) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      success: true,
      message: '收款码更新成功'
    }
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
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return {
      success: true,
      message: '收款码删除成功'
    }
  } catch (error) {
    console.error('删除收款码失败:', error)
    throw new Error('删除收款码失败')
  }
}

/**
 * 切换收款码状态
 * @param id 收款码ID
 * @param status 新状态
 * @returns 更新结果
 */
export const toggleQRCodeStatus = async (id: number, status: 'active' | 'inactive') => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      message: `收款码已${status === 'active' ? '启用' : '禁用'}`
    }
  } catch (error) {
    console.error('更新收款码状态失败:', error)
    throw new Error('更新收款码状态失败')
  }
}

/**
 * 生成收款码图片
 * @param id 收款码ID
 * @param options 生成选项
 * @returns 图片URL
 */
export const generateQRCodeImage = async (id: number, options: {
  format?: 'png' | 'svg'
  size?: number
  logo?: string
}) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      data: {
        imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${options.size || 200}x${options.size || 200}&data=PAY_${id}_${Date.now()}`,
        downloadUrl: `https://api.qrserver.com/v1/create-qr-code/?size=${options.size || 200}x${options.size || 200}&data=PAY_${id}_${Date.now()}&format=${options.format || 'png'}`
      }
    }
  } catch (error) {
    console.error('生成收款码图片失败:', error)
    throw new Error('生成收款码图片失败')
  }
}

/**
 * 分享收款码
 * @param id 收款码ID
 * @param method 分享方式
 * @returns 分享结果
 */
export const shareQRCode = async (id: number, method: 'copy' | 'email' | 'sms' | 'social') => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const shareData = {
      url: `https://pay.example.com/qr/${id}`,
      message: '收款码分享链接',
      title: '收款码'
    }
    
    return {
      success: true,
      data: shareData,
      message: '分享链接已生成'
    }
  } catch (error) {
    console.error('分享收款码失败:', error)
    throw new Error('分享收款码失败')
  }
}



// ============= 支付确认相关 API =============

/**
 * 确认支付
 * @param orderId 订单ID
 * @param paymentData 支付数据
 * @returns 支付结果
 */
export const confirmPayment = async (orderId: string, paymentData: any) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟90%成功率
    const success = Math.random() > 0.1
    
    const response = {
      success,
      data: {
        orderId,
        transactionId: success ? `TXN${Date.now()}` : undefined,
        status: success ? 'success' : 'failed',
        completeTime: success ? new Date().toISOString() : undefined,
        message: success ? '支付成功' : '支付失败',
        error: success ? undefined : '余额不足'
      }
    }
    
    return response
  } catch (error) {
    console.error('确认支付失败:', error)
    throw new Error('确认支付失败')
  }
}

/**
 * 申请退款
 * @param orderId 订单ID
 * @param refundData 退款数据
 * @returns 退款申请结果
 */
export const requestRefund = async (orderId: string, refundData: {
  reason: string
  amount?: number
}) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      success: true,
      data: {
        refundId: `REF${Date.now()}`,
        status: 'pending',
        message: '退款申请已提交，等待审核'
      }
    }
  } catch (error) {
    console.error('申请退款失败:', error)
    throw new Error('申请退款失败')
  }
}

/**
 * 查询退款状态
 * @param refundId 退款ID
 * @returns 退款状态
 */
export const getRefundStatus = async (refundId: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return {
      success: true,
      data: {
        refundId,
        status: 'approved',
        message: '退款已批准，将在1-3个工作日内到账'
      }
    }
  } catch (error) {
    console.error('查询退款状态失败:', error)
    throw new Error('查询退款状态失败')
  }
}

/**
 * 下载支付收据
 * @param orderId 订单ID
 * @returns 收据下载链接
 */
export const downloadReceipt = async (orderId: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      success: true,
      data: {
        downloadUrl: `https://receipt.example.com/download/${orderId}`,
        message: '收据生成成功'
      }
    }
  } catch (error) {
    console.error('下载收据失败:', error)
    throw new Error('下载收据失败')
  }
}

// ============= 优惠码相关 API =============

/**
 * 验证优惠码
 * @param code 优惠码
 * @param amount 订单金额
 * @returns 优惠信息
 */
export const validateDiscountCode = async (code: string, amount: number) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let result = { success: false, discountAmount: 0, message: '优惠码无效' }
    
    if (code.toUpperCase() === 'SAVE10') {
      result = {
        success: true,
        discountAmount: amount * 0.1,
        message: `享受10%折扣，立省 ¥${(amount * 0.1).toFixed(2)}`
      }
    } else if (code.toUpperCase() === 'WELCOME20') {
      result = {
        success: true,
        discountAmount: 20.00,
        message: '新用户专享，立省 ¥20.00'
      }
    }
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('验证优惠码失败:', error)
    throw new Error('验证优惠码失败')
  }
}

/**
 * 获取可用的优惠码列表
 * @returns 优惠码列表
 */
export const getAvailableDiscountCodes = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return {
      success: true,
      data: [
        { code: 'SAVE10', description: '10%折扣', discount: 0.1, type: 'percentage' },
        { code: 'WELCOME20', description: '新用户专享 ¥20', discount: 20, type: 'fixed' },
        { code: 'SAVE50', description: '满200减50', discount: 50, type: 'fixed', minAmount: 200 }
      ]
    }
  } catch (error) {
    console.error('获取优惠码列表失败:', error)
    throw new Error('获取优惠码列表失败')
  }
}

// ============= 辅助函数 - 生成模拟数据 =============

function generateMockPaymentRecords(): PaymentRecord[] {
  const methods = ['wechat', 'alipay', 'bank', 'cash']
  const statuses = ['success', 'failed', 'processing', 'pending']
  const types = ['income', 'expense']
  const descriptions = [
    '月度房租收款',
    '水电费缴费',
    '物业费支付',
    '网费支付',
    '维修费支出',
    '清洁费支出',
    '设备购买',
    '其他支出'
  ]
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
  
  const records: PaymentRecord[] = []
  for (let i = 0; i < 50; i++) {
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const paymentMethod = methods[Math.floor(Math.random() * methods.length)]
    const transactionType = types[Math.floor(Math.random() * types.length)]
    const amount = Math.floor(Math.random() * 500) + 10
    const name = names[Math.floor(Math.random() * names.length)]
    
    records.push({
      id: i + 1,
      orderId: `PAY${Date.now()}${i.toString().padStart(3, '0')}`,
      transactionType,
      paymentMethod,
      amount: transactionType === 'income' ? amount : -amount,
      status: status,
      createdAt: createdAt.toISOString(),
      completedAt: status === 'success' ? new Date(createdAt.getTime() + Math.random() * 60000).toISOString() : null,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      remark: Math.random() > 0.7 ? '特殊备注信息' : '',
      feeAmount: Math.random() * 2,
      transactionId: `TXN${Date.now()}${i.toString().padStart(3, '0')}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      recipientName: transactionType === 'income' ? name : '',
      recipientAccount: transactionType === 'income' ? `${paymentMethod}_${name.toLowerCase()}` : ''
    })
  }
  
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function generateMockStatistics(): PaymentStatistics {
  return {
    totalIncome: 15680.50,
    totalExpense: 8920.30,
    totalTransactions: 156,
    successfulPayments: 142,
    pendingPayments: 8,
    failedPayments: 6,
    monthlyTransactions: [
      { month: '2024-11', count: 32, amount: 3250.80 },
      { month: '2024-10', count: 28, amount: 2890.50 },
      { month: '2024-09', count: 35, amount: 4120.30 },
      { month: '2024-08', count: 31, amount: 2980.20 },
      { month: '2024-07', count: 30, amount: 3360.80 }
    ],
    methodDistribution: [
      { method: '微信支付', count: 78, amount: 12350.40, percentage: 50.0 },
      { method: '支付宝', count: 52, amount: 8245.20, percentage: 33.3 },
      { method: '银行卡', count: 20, amount: 3450.60, percentage: 12.8 },
      { method: '现金', count: 6, amount: 554.60, percentage: 3.9 }
    ]
  }
}

function generateMockQRCodes(): QRCode[] {
  return [
    {
      id: 1,
      name: '房租收款码',
      type: 'fixed',
      amount: 1500.00,
      currency: 'CNY',
      description: '月度房租收款',
      status: 'active',
      usageLimit: null,
      usageCount: 15,
      createdAt: '2024-11-01T08:00:00.000Z',
      updatedAt: '2024-11-23T14:30:00.000Z',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_1',
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: true,
      tags: ['房租', '固定'],
      backgroundColor: '#667eea',
      logoUrl: 'https://picsum.photos/40/40?random=7'
    },
    {
      id: 2,
      name: '水电费收款',
      type: 'custom',
      amount: 0,
      currency: 'CNY',
      description: '水电费灵活收款',
      status: 'active',
      usageLimit: null,
      usageCount: 8,
      createdAt: '2024-11-10T10:15:00.000Z',
      updatedAt: '2024-11-22T16:45:00.000Z',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_2',
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: false,
      tags: ['水电费', '灵活'],
      backgroundColor: '#10b981',
      logoUrl: 'https://picsum.photos/40/40?random=8'
    },
    {
      id: 3,
      name: '临时收款',
      type: 'dynamic',
      amount: 0,
      currency: 'CNY',
      description: '临时费用收款',
      status: 'inactive',
      usageLimit: 1,
      usageCount: 1,
      createdAt: '2024-11-20T14:20:00.000Z',
      updatedAt: '2024-11-20T14:20:00.000Z',
      expiresAt: '2024-11-27T14:20:00.000Z',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_3',
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: false,
      tags: ['临时', '一次性'],
      backgroundColor: '#f59e0b',
      logoUrl: 'https://picsum.photos/40/40?random=9'
    }
  ]
}

// 导出默认实例配置
export const paymentConfig = {
  defaultPaymentMethod: 'wechat' as const,
  maxPaymentAmount: 10000,
  minPaymentAmount: 0.01,
  retryAttempts: 3,
  timeout: 30000
}