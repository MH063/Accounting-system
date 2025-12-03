/**
 * 支付服务模块
 * 统一管理所有支付相关的API调用
 */

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

// 基础HTTP请求函数
const request = async <T = unknown>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null
  
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
    
    const data = await response.json() as ApiResponse<T>
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

    // 生成模拟数据并根据筛选条件过滤
    const allRecords = generateMockPaymentRecords()
    const filteredRecords = filterPaymentRecords(allRecords, filter)
    
    // 分页处理
    const page = filter.page || 1
    const size = filter.size || 20
    const start = (page - 1) * size
    const end = start + size
    const paginatedRecords = filteredRecords.slice(start, end)

    return {
      success: true,
      data: {
        records: paginatedRecords,
        total: filteredRecords.length,
        page: page,
        size: size,
        pages: Math.ceil(filteredRecords.length / size)
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
 * @param _startDate 开始日期
 * @param _endDate 结束日期
 * @returns 统计数据
 */
export const getPaymentStatistics = async (_startDate?: string, _endDate?: string) => {
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
 * @returns 文件下载信息
 */
export const exportPaymentRecords = async (filter: PaymentFilter, format: 'csv' | 'excel' = 'csv') => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 获取当前需要导出的记录
    const response = await getPaymentRecords({
      ...filter,
      page: 1,
      size: 1000 // 获取大量记录用于导出
    })
    
    if (!response.success || !response.data.records) {
      throw new Error('获取导出数据失败')
    }
    
    const records = response.data.records
    
    // 生成导出文件名
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `payment_records_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`
    
    // 生成本地下载链接（避免404错误）
    const downloadUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(`
支付记录导出
===========

导出时间：${new Date().toLocaleString('zh-CN')}
总记录数：${records.length}
筛选条件：${JSON.stringify(filter, null, 2)}

详细记录：
${records.map((record: PaymentRecord, index: number) => `
${index + 1}. 订单ID: ${record.orderId}
   类型: ${record.transactionType === 'income' ? '收入' : '支出'}
   金额: ¥${record.amount.toFixed(2)}
   状态: ${getStatusText(record.status)}
   创建时间: ${new Date(record.createdAt).toLocaleString('zh-CN')}
   描述: ${record.description}
`).join('\n')}
    `)}`
    
    return {
      success: true,
      data: {
        downloadUrl,
        fileName,
        recordCount: records.length,
        exportedAt: new Date().toISOString()
      },
      message: '导出成功'
    }
  } catch (error) {
    console.error('导出支付记录失败:', error)
    throw new Error('导出支付记录失败')
  }
}

// 辅助函数：获取状态文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'success': '成功',
    'failed': '失败',
    'processing': '处理中',
    'pending': '待处理',
    'refunded': '已退款'
  }
  return statusMap[status] || status
}

// 辅助函数：根据筛选条件过滤支付记录
function filterPaymentRecords(records: PaymentRecord[], filter: PaymentFilter): PaymentRecord[] {
  let filteredRecords = [...records]

  // 关键词搜索
  if (filter.keyword && filter.keyword.trim()) {
    const keyword = filter.keyword.trim().toLowerCase()
    filteredRecords = filteredRecords.filter(record => 
      record.orderId.toLowerCase().includes(keyword) ||
      record.description.toLowerCase().includes(keyword) ||
      (record.recipientName && record.recipientName.toLowerCase().includes(keyword))
    )
  }

  // 支付状态筛选
  if (filter.status && filter.status.trim()) {
    filteredRecords = filteredRecords.filter(record => record.status === filter.status)
  }

  // 支付方式筛选
  if (filter.paymentMethod && filter.paymentMethod.trim()) {
    filteredRecords = filteredRecords.filter(record => record.paymentMethod === filter.paymentMethod)
  }

  // 交易类型筛选
  if (filter.transactionType && filter.transactionType.trim()) {
    filteredRecords = filteredRecords.filter(record => record.transactionType === filter.transactionType)
  }

  // 日期范围筛选
  if (filter.startDate && filter.startDate.trim()) {
    const startDate = new Date(filter.startDate)
    filteredRecords = filteredRecords.filter(record => new Date(record.createdAt) >= startDate)
  }

  if (filter.endDate && filter.endDate.trim()) {
    const endDate = new Date(filter.endDate)
    // 结束日期包含当天，需要设置为当天的结束时间
    endDate.setHours(23, 59, 59, 999)
    filteredRecords = filteredRecords.filter(record => new Date(record.createdAt) <= endDate)
  }

  // 金额范围筛选
  if (filter.minAmount !== undefined) {
    filteredRecords = filteredRecords.filter(record => Math.abs(record.amount) >= filter.minAmount!)
  }

  if (filter.maxAmount !== undefined) {
    filteredRecords = filteredRecords.filter(record => Math.abs(record.amount) <= filter.maxAmount!)
  }

  return filteredRecords
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
 * @param _id 收款码ID
 * @param _qrCodeData 收款码数据
 * @returns 更新结果
 */
export const updateQRCode = async (_id: number, _qrCodeData: Partial<QRCode>) => {
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
export const deleteQRCode = async (_id: number) => {
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
export const toggleQRCodeStatus = async (_id: number, status: 'active' | 'inactive') => {
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
 * 上传收款码图片并创建收款码记录
 * @param file 上传的图片文件
 * @param qrCodeData 收款码数据
 * @returns 上传结果
 */
export const uploadQRCodeImage = async (qrCodeData: {
  file: File
  platform: 'alipay' | 'wechat' | 'unionpay'
  description: string
}) => {
  try {
    // 模拟文件上传延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成唯一的图片URL（使用picsum模拟上传的图片）
    const imageId = Math.floor(Math.random() * 1000) + Date.now()
    const uploadedImageUrl = `https://picsum.photos/200/200?random=${imageId}`
    
    const newQRCode = {
      id: Date.now(),
      name: `${getPlatformName(qrCodeData.platform)}收款码 ${new Date().toLocaleDateString()}`,
      type: 'custom' as const,
      amount: 0, // 上传的收款码不预设金额
      currency: 'CNY',
      description: qrCodeData.description,
      status: 'active' as const,
      usageLimit: undefined,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: undefined,
      qrCodeUrl: uploadedImageUrl, // 使用上传的图片URL
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: false,
      tags: [],
      backgroundColor: undefined,
      logoUrl: undefined,
      platform: qrCodeData.platform,
      isUserUploaded: true // 标记为用户上传的收款码
    }
    
    return {
      success: true,
      data: newQRCode,
      message: '收款码上传成功'
    }
  } catch (error) {
    console.error('上传收款码失败:', error)
    throw new Error('上传收款码失败')
  }
}

/**
 * 获取支付平台中文名称
 * @param platform 支付平台
 * @returns 中文名称
 */
const getPlatformName = (platform: 'alipay' | 'wechat' | 'unionpay'): string => {
  const platformNames = {
    alipay: '支付宝',
    wechat: '微信',
    unionpay: '银联'
  }
  return platformNames[platform] || platform
}

/**
 * 生成收款码图片
 * @param id 收款码ID
 * @param options 生成选项
 * @returns 图片URL
 */
export const generateQRCodeImage = async (_id: number, options: {
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
export const shareQRCode = async (_id: number, _method: 'copy' | 'email' | 'sms' | 'social') => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const shareData = {
      url: `/qr/share/${_id}`,
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
 * 确认支付（支持收款码收入记录）
 * @param orderId 订单ID
 * @param paymentData 支付数据
 * @returns 支付结果
 */
export const confirmPayment = async (orderId: string, paymentData?: {
  amount?: number
  qrCodeId?: number
  merchantName?: string
  description?: string
  paymentMethod?: 'wechat' | 'alipay' | 'bank' | 'cash'
}) => {
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
        error: success ? undefined : '余额不足',
        amount: paymentData?.amount || 0,
        qrCodeId: paymentData?.qrCodeId
      }
    }
    
    // 如果支付成功且有收款码ID，则更新收款码使用次数并记录收入
    if (success && paymentData?.qrCodeId && paymentData?.amount) {
      await recordQRCodecIncome(paymentData.qrCodeId, paymentData.amount, paymentData)
    }
    
    return response
  } catch (error) {
    console.error('确认支付失败:', error)
    throw new Error('确认支付失败')
  }
}

/**
 * 记录收款码收入
 * @param qrCodeId 收款码ID
 * @param amount 金额
 * @param paymentData 支付数据
 */
const recordQRCodecIncome = async (qrCodeId: number, amount: number, paymentData: any) => {
  try {
    console.log(`记录收款码收入 - ID: ${qrCodeId}, 金额: ${amount}`)
    
    // 更新收款码使用次数（模拟）
    const qrCodes = generateMockQRCodes()
    const targetQRCode = qrCodes.find(qr => qr.id === qrCodeId)
    
    if (targetQRCode) {
      targetQRCode.usageCount += 1
      targetQRCode.updatedAt = new Date().toISOString()
      console.log(`更新收款码使用次数: ${targetQRCode.name}, 当前使用次数: ${targetQRCode.usageCount}`)
    }
    
    // 记录收入到支付记录中
    const incomeRecord: PaymentRecord = {
      id: Date.now(),
      orderId: `INCOME_${Date.now()}`,
      transactionType: 'income',
      paymentMethod: paymentData.paymentMethod || 'wechat',
      amount: amount,
      status: 'success',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      description: paymentData.description || '收款码收入',
      remark: `通过收款码(${qrCodeId})收取`,
      transactionId: `TXN${Date.now()}`,
      ipAddress: '127.0.0.1',
      recipientName: paymentData.merchantName || '宿舍管理系统',
      recipientAccount: 'dorm_manager'
    }
    
    // 将收入记录添加到全局收入记录中
    addIncomeRecord(incomeRecord)
    
    console.log('收款码收入记录已创建:', incomeRecord)
  } catch (error) {
    console.error('记录收款码收入失败:', error)
    // 记录失败不影响支付流程
  }
}

/**
 * 添加收入记录到全局记录中
 * @param record 收入记录
 */
const addIncomeRecord = (record: PaymentRecord) => {
  // 这里应该将记录添加到实际的支付记录数组中
  // 在真实应用中，这会调用后端API保存到数据库
  console.log('添加收入记录:', record)
  
  // 模拟添加到支付记录数组（在真实应用中这会在后端处理）
  const existingRecords = (window as any).paymentRecords || []
  existingRecords.push(record)
  ;(window as any).paymentRecords = existingRecords
}

/**
 * 申请退款
 * @param orderId 订单ID
 * @param refundData 退款数据
 * @returns 退款申请结果
 */
export const requestRefund = async () => {
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
    
    // 生成本地收据下载链接，避免外部域名解析错误
    const receiptId = `receipt_${orderId}_${Date.now()}`
    
    return {
      success: true,
      data: {
        downloadUrl: `/api/receipts/download/${receiptId}`,
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
      name: '我的支付宝收款码',
      type: 'fixed',
      amount: 1500.00,
      currency: 'CNY',
      description: '月度房租收款',
      status: 'active',
      usageLimit: null,
      usageCount: 15,
      createdAt: '2024-11-01T08:00:00.000Z',
      updatedAt: '2024-11-23T14:30:00.000Z',
      qrCodeUrl: 'https://picsum.photos/200/200?random=1001',
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: true,
      tags: ['房租', '固定'],
      backgroundColor: '#667eea',
      logoUrl: 'https://picsum.photos/40/40?random=7',
      platform: 'alipay',
      isUserUploaded: true
    },
    {
      id: 2,
      name: '我的微信收款码',
      type: 'custom',
      amount: 0,
      currency: 'CNY',
      description: '水电费灵活收款',
      status: 'active',
      usageLimit: null,
      usageCount: 8,
      createdAt: '2024-11-10T10:15:00.000Z',
      updatedAt: '2024-11-22T16:45:00.000Z',
      qrCodeUrl: 'https://picsum.photos/200/200?random=1002',
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: false,
      tags: ['水电费', '灵活'],
      backgroundColor: '#10b981',
      logoUrl: 'https://picsum.photos/40/40?random=8',
      platform: 'wechat',
      isUserUploaded: true
    },
    {
      id: 3,
      name: '我的银联收款码',
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
      qrCodeUrl: 'https://picsum.photos/200/200?random=1003',
      merchantName: '宿舍管理系统',
      merchantAccount: 'dorm_manager',
      isDefault: false,
      tags: ['临时', '一次性'],
      backgroundColor: '#f59e0b',
      logoUrl: 'https://picsum.photos/40/40?random=9',
      platform: 'unionpay',
      isUserUploaded: true
    }
  ]
}

// ============= 安全检测相关 API =============

/**
 * 执行安全检测
 * @param qrCodeId 收款码ID，为空则检测所有
 * @returns 安全检测结果
 */
export const performSecurityCheck = async (qrCodeId?: number) => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 获取收款码数据
    const qrCodes = generateMockQRCodes()
    const targetQRCodes = qrCodeId ? qrCodes.filter(qr => qr.id === qrCodeId) : qrCodes
    
    const result: SecurityCheckResult = {
      qrCodeStatus: 'success',
      usageAnalysis: 'success', 
      amountValidation: 'success',
      permissions: 'success',
      issues: [],
      recommendations: [],
      lastCheckTime: new Date().toISOString()
    }
    
    // 1. 收款码状态检查
    const inactiveQRCodes = targetQRCodes.filter(qr => qr.status === 'inactive')
    const expiredQRCodes = targetQRCodes.filter(qr => {
      if (!qr.expiresAt) return false
      return new Date(qr.expiresAt) < new Date()
    })
    
    if (inactiveQRCodes.length > 0) {
      result.qrCodeStatus = 'warning'
      result.issues?.push(`发现 ${inactiveQRCodes.length} 个已禁用的收款码`)
      result.recommendations?.push('建议启用必要的收款码或删除不使用的收款码')
    }
    
    if (expiredQRCodes.length > 0) {
      result.qrCodeStatus = 'error'
      result.issues?.push(`发现 ${expiredQRCodes.length} 个已过期的收款码`)
      result.recommendations?.push('立即更新或删除过期的收款码')
    }
    
    // 2. 使用频率分析
    const lowUsageQRCodes = targetQRCodes.filter(qr => {
      const daysSinceCreation = Math.floor((Date.now() - new Date(qr.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceCreation > 30 && qr.usageCount === 0
    })
    
    if (lowUsageQRCodes.length > targetQRCodes.length * 0.5) {
      result.usageAnalysis = 'warning'
      result.issues?.push(`${lowUsageQRCodes.length} 个收款码使用频率较低`)
      result.recommendations?.push('分析使用率低的收款码，考虑优化或替换')
    }
    
    // 检查异常使用模式
    const highUsageQRCodes = targetQRCodes.filter(qr => qr.usageCount > 100)
    if (highUsageQRCodes.length > 0) {
      result.usageAnalysis = 'warning'
      result.issues?.push(`发现 ${highUsageQRCodes.length} 个高频率使用的收款码，建议监控`)
      result.recommendations?.push('对高频使用收款码加强监控和安全保障')
    }
    
    // 3. 金额验证
    const invalidAmountQRCodes = targetQRCodes.filter(qr => {
      if (qr.type === 'fixed' && (!qr.amount || qr.amount <= 0)) return true
      if (qr.amount && qr.amount > 10000) return true
      return false
    })
    
    if (invalidAmountQRCodes.length > 0) {
      result.amountValidation = 'error'
      result.issues?.push(`${invalidAmountQRCodes.length} 个收款码金额设置异常`)
      result.recommendations?.push('检查并修正收款码金额设置')
    }
    
    // 检查零金额收款码
    const zeroAmountQRCodes = targetQRCodes.filter(qr => qr.amount === 0)
    if (zeroAmountQRCodes.length > 2) {
      result.amountValidation = 'warning'
      result.issues?.push(`发现 ${zeroAmountQRCodes.length} 个零金额收款码`)
      result.recommendations?.push('合理设置收款码金额，避免误导用户')
    }
    
    // 4. 权限检查
    const duplicateNames = targetQRCodes.filter((qr, index, arr) => 
      arr.findIndex(q => q.name === qr.name) !== index
    )
    
    if (duplicateNames.length > 0) {
      result.permissions = 'warning'
      result.issues?.push(`发现 ${duplicateNames.length} 个重复名称的收款码`)
      result.recommendations?.push('避免使用相同名称的收款码，防止混淆')
    }
    
    // 检查默认收款码设置
    const defaultQRCodes = targetQRCodes.filter(qr => qr.isDefault)
    if (defaultQRCodes.length === 0 && targetQRCodes.length > 0) {
      result.permissions = 'warning'
      result.issues?.push('未设置默认收款码')
      result.recommendations?.push('建议设置一个默认收款码以提高用户体验')
    } else if (defaultQRCodes.length > 1) {
      result.permissions = 'error'
      result.issues?.push(`设置了 ${defaultQRCodes.length} 个默认收款码`)
      result.recommendations?.push('只能设置一个默认收款码')
    }
    
    // 总体风险评估
    const totalIssues = (result.issues?.length || 0)
    if (totalIssues > 5) {
      // 保持现有状态，但添加综合建议
      result.recommendations?.unshift('安全风险较高，建议立即进行全面检查和整改')
    } else if (totalIssues > 2) {
      result.recommendations?.unshift('存在一定安全风险，建议及时处理相关问题')
    }
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('安全检测失败:', error)
    throw new Error('安全检测失败')
  }
}

/**
 * 获取安全检测历史记录
 * @param days 天数，默认30天
 * @returns 历史记录列表
 */
export const getSecurityCheckHistory = async (days: number = 30) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const history = []
    const now = new Date()
    
    for (let i = 0; i < Math.min(days, 10); i++) {
      const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const issueCount = Math.floor(Math.random() * 5)
      
      history.push({
        id: i + 1,
        checkTime: checkDate.toISOString(),
        status: issueCount === 0 ? 'success' : issueCount > 3 ? 'error' : 'warning',
        issueCount,
        checkedQRCodes: 3,
        responseTime: Math.floor(Math.random() * 2000) + 500
      })
    }
    
    return {
      success: true,
      data: history
    }
  } catch (error) {
    console.error('获取安全检测历史失败:', error)
    throw new Error('获取安全检测历史失败')
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