/**
 * 账单服务 - 提供账单相关的API调用
 */

import { request } from '@/utils/request'

// 账单相关类型定义
export interface Bill {
  id: string
  title: string
  status: 'pending' | 'paid' | 'partial' | 'overdue'
  totalAmount: number
  paidAmount: number
  billDate: string
  payerName: string
  type: 'monthly' | 'temporary' | 'expense'
  description: string
  createdAt: string
  updatedAt: string
}

export interface BillStatistics {
  pending: number
  paid: number
  overdue: number
  totalAmount: number
}

export interface BillFilter {
  keyword?: string
  status?: string
  type?: string
  month?: string
  page?: number
  size?: number
}

export interface BillListResponse {
  bills: Bill[]
  total: number
  page: number
  size: number
  pages: number
  statistics: BillStatistics
}

/**
 * 获取账单列表
 * @param filter 筛选条件
 * @returns 账单列表和分页信息
 */
export const getBillList = async (filter: BillFilter = {}): Promise<any> => {
  try {
    // 构建查询参数
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    // 构建完整的URL
    const url = `/bills?${params.toString()}`
    
    // 调用真实API
    const response = await request<{
      success: boolean
      data: {
        bills: Bill[]
        total: number
        page: number
        size: number
        pages: number
        statistics: BillStatistics
      }
    }>(url)
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 获取账单列表失败:', error)
    throw new Error('获取账单列表失败')
  }
}

/**
 * 获取账单详情
 * @param id 账单ID
 * @returns 账单详情
 */
export const getBillDetail = async (id: string): Promise<any> => {
  try {
    const response = await request<{
      success: boolean
      data: Bill
    }>(`/bills/${id}`)
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 获取账单详情失败:', error)
    throw new Error('获取账单详情失败')
  }
}

/**
 * 创建账单
 * @param billData 账单数据
 * @returns 创建的账单
 */
export const createBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<any> => {
  try {
    const response = await request<{
      success: boolean
      data: Bill
    }>('/bills', {
      method: 'POST',
      body: JSON.stringify(billData)
    })
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 创建账单失败:', error)
    throw new Error('创建账单失败')
  }
}

/**
 * 更新账单
 * @param id 账单ID
 * @param billData 账单数据
 * @returns 更新后的账单
 */
export const updateBill = async (id: string, billData: Partial<Bill>): Promise<any> => {
  try {
    const response = await request<{
      success: boolean
      data: Bill
    }>(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData)
    })
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 更新账单失败:', error)
    throw new Error('更新账单失败')
  }
}

/**
 * 删除账单
 * @param id 账单ID
 * @returns 删除结果
 */
export const deleteBill = async (id: string): Promise<void> => {
  try {
    await request(`/bills/${id}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('[BillService] 删除账单失败:', error)
    throw new Error('删除账单失败')
  }
}

/**
 * 批量删除账单
 * @param ids 账单ID数组
 * @returns 删除结果
 */
export const deleteBillsBatch = async (ids: string[]): Promise<void> => {
  try {
    await request('/bills/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    })
  } catch (error) {
    console.error('[BillService] 批量删除账单失败:', error)
    throw new Error('批量删除账单失败')
  }
}

/**
 * 支付账单
 * @param id 账单ID
 * @param paymentData 支付数据
 * @returns 支付结果
 */
export const payBill = async (id: string, paymentData: {
  amount: number
  paymentMethod: string
  remark?: string
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await request<{
      success: boolean
      message: string
    }>(`/bills/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 正确访问数据
    return response.data
  } catch (error) {
    console.error('[BillService] 支付账单失败:', error)
    throw new Error('支付账单失败')
  }
}

/**
 * 导出账单
 * @param filter 筛选条件
 * @param format 导出格式
 * @returns 导出结果
 */
export const exportBills = async (filter: BillFilter, format: 'csv' | 'xlsx' = 'csv'): Promise<any> => {
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
    
    // 调用真实API导出账单
    const url = `/bills/export?${params.toString()}`
    const response = await request<{
      success: boolean
      data: {
        downloadUrl: string
        recordCount: number
        format: string
      }
    }>(url)
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 导出账单失败:', error)
    throw new Error('导出账单失败')
  }
}

/**
 * 获取收款码列表（用于支付）
 * @param params 查询参数
 * @returns 收款码列表
 */
export const getPaymentQRCodes = async (params: {
  page?: number
  size?: number
  status?: 'active' | 'inactive'
  platform?: 'alipay' | 'wechat' | 'unionpay'
} = {}): Promise<any> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })
    
    // 调用真实API获取收款码列表
    const url = `/qr-codes?${queryParams.toString()}`
    const response = await request<{
      success: boolean
      data: {
        records: Array<{
          id: number
          name: string
          type: string
          amount: number
          currency: string
          description: string
          status: string
          usageCount: number
          createdAt: string
          updatedAt: string
          qrCodeUrl: string
          merchantName: string
          merchantAccount: string
          isDefault: boolean
          platform: string
        }>
        total: number
        page: number
        size: number
        pages: number
      }
    }>(url)
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 获取收款码列表失败:', error)
    throw new Error('获取收款码列表失败')
  }
}

/**
 * 获取提醒设置
 * @returns 提醒设置
 */
export const getReminderSettings = async (): Promise<any> => {
  try {
    const response = await request<{
      success: boolean
      data: {
        methods: string[]
        remindTime: string
        frequency: string
        quietStart: string
        quietEnd: string
      }
    }>('/bills/reminder-settings')
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 获取提醒设置失败:', error)
    // 返回默认设置
    return {
      methods: ['email'],
      remindTime: 'due_1day',
      frequency: 'once',
      quietStart: '',
      quietEnd: ''
    }
  }
}

/**
 * 保存提醒设置
 * @param settings 提醒设置
 * @returns 保存结果
 */
export const saveReminderSettings = async (settings: {
  methods: string[]
  remindTime: string
  frequency: string
  quietStart: string
  quietEnd: string
}): Promise<any> => {
  try {
    const response = await request<{
      success: boolean
      message: string
    }>('/bills/reminder-settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
    
    // 根据后端返回的数据结构 {success: true, data: {...}} 返回整个响应对象
    return response.data
  } catch (error) {
    console.error('[BillService] 保存提醒设置失败:', error)
    throw new Error('保存提醒设置失败')
  }
}

// 账单服务导出
export const billService = {
  getBillList,
  getBillDetail,
  createBill,
  updateBill,
  deleteBill,
  deleteBillsBatch,
  payBill,
  exportBills,
  getPaymentQRCodes,
  getReminderSettings,
  saveReminderSettings
}

export default billService