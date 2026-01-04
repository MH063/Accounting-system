import api from './index'

/**
 * 费用创建相关 API
 * 对接费用创建页面需要的接口
 */
export const expenseCreateApi = {
  /**
   * 获取费用类别列表
   * GET /api/categories/expense
   */
  getExpenseCategories: () => 
    api.get('/categories/expense'),

  /**
   * 获取宿舍成员列表
   * GET /api/dorms/:dormId/members
   * @param dormId 宿舍 ID，支持 'all' 获取所有用户（仅限管理员）
   */
  getDormMembers: (dormId: number | string) => 
    api.get(`/dorms/${dormId}/members`),

  /**
   * 创建费用（提交审核）
   * POST /api/expenses
   * @param data 费用数据
   */
  createExpense: (data: {
    title: string
    description: string
    amount: number | string
    category: string
    date: string
    participants: number[]
    splitMethod: string
    customSplitDetails?: any[]
    attachments?: any[]
  }) => 
    api.post('/expenses', data),

  /**
   * 保存草稿
   * POST /api/expenses/draft
   * @param data 费用数据
   */
  saveDraft: (data: {
    title: string
    description?: string
    amount?: number | string
    category: string
    date?: string
    participants?: number[]
    splitMethod?: string
    customSplitDetails?: any[]
    attachments?: any[]
  }) => 
    api.post('/expenses/draft', data),

  /**
   * 获取费用详情
   * GET /api/expenses/:id
   */
  getExpenseDetail: (id: number | string) => 
    api.get(`/expenses/${id}`),

  /**
   * 更新费用
   * PUT /api/expenses/:id
   */
  updateExpense: (id: number | string, data: any) => 
    api.put(`/expenses/${id}`, data),

  /**
   * 上传附件
   * POST /api/upload/multiple
   * @param formData 表单数据
   */
  uploadAttachments: (formData: FormData) => 
    api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
}
