import { ElMessage } from 'element-plus'

/**
 * 搜索结果项接口
 */
export interface SearchResult {
  id: string
  title: string
  description: string
  category: 'page' | 'function' | 'data' | 'help'
  path: string
  icon?: string
  priority: number
  keywords: string[]
  createTime?: string
}



/**
 * 搜索筛选条件接口
 */
export interface SearchFilters {
  category?: string[]
  dateRange?: [Date, Date]
  priority?: number[]
  tags?: string[]
}

/**
 * 搜索服务类
 */
class SearchService {
  private searchResults: SearchResult[] = []

  constructor() {
    this.initializeSearchData()
  }

  /**
   * 初始化搜索数据
   */
  private initializeSearchData(): void {
    this.searchResults = [
      // 页面搜索结果
      { id: '1', title: '仪表盘', description: '查看系统概览和数据统计', category: 'page', path: '/dashboard', icon: 'dashboard', priority: 1, keywords: ['仪表盘', 'dashboard', '首页', '概览'] },
      { id: '2', title: '寝室管理', description: '管理寝室信息和入住情况', category: 'page', path: '/dashboard/dormitory', icon: 'house', priority: 1, keywords: ['寝室', '宿舍', 'dormitory', '房间', '住宿'] },
      { id: '3', title: '成员管理', description: '管理系统用户和成员信息', category: 'page', path: '/dashboard/member', icon: 'user', priority: 1, keywords: ['成员', '用户', 'member', '用户管理', '人员'] },
      { id: '4', title: '费用管理', description: '记录和管理各项费用支出', category: 'page', path: '/dashboard/expense', icon: 'money', priority: 1, keywords: ['费用', '支出', 'expense', '费用管理', '开销'] },
      { id: '5', title: '账单管理', description: '查看和管理所有账单记录', category: 'page', path: '/dashboard/bills', icon: 'document', priority: 1, keywords: ['账单', 'bill', '账单管理', '记账', '记录'] },
      { id: '6', title: '支付功能', description: '处理支付相关功能和记录', category: 'page', path: '/dashboard/payment', icon: 'credit-card', priority: 1, keywords: ['支付', 'payment', '付款', '支付功能', '交易'] },
      { id: '7', title: '统计分析', description: '查看数据统计和分析报告', category: 'page', path: '/dashboard/analytics', icon: 'trend-charts', priority: 1, keywords: ['统计', '分析', 'analytics', '数据', '图表'] },
      { id: '8', title: '帮助中心', description: '获取使用帮助和系统支持', category: 'help', path: '/dashboard/help-center', icon: 'question', priority: 2, keywords: ['帮助', 'help', '支持', '帮助中心', '指南'] },
      { id: '9', title: '通知中心', description: '查看系统通知和消息', category: 'function', path: '/dashboard/notifications', icon: 'bell', priority: 2, keywords: ['通知', '消息', 'notification', '提醒', '公告'] },
      
      // 功能搜索结果
      { id: '10', title: '创建账单', description: '快速创建新的账单记录', category: 'function', path: '/dashboard/bill/create', icon: 'plus', priority: 2, keywords: ['创建', '新增', 'create', '账单', '记录'] },
      { id: '11', title: '添加费用', description: '记录新的费用支出项目', category: 'function', path: '/dashboard/expense', icon: 'plus', priority: 2, keywords: ['添加', '新增', 'add', '费用', '支出'] },
      { id: '12', title: '邀请成员', description: '邀请新成员加入系统', category: 'function', path: '/dashboard/member/invite', icon: 'user-plus', priority: 2, keywords: ['邀请', 'invite', '成员', '用户', '加入'] },
      { id: '13', title: '寝室设置', description: '配置寝室相关参数', category: 'function', path: '/dashboard/dorm/settings', icon: 'setting', priority: 2, keywords: ['设置', '配置', 'settings', '寝室', '参数'] },
      { id: '14', title: '个人中心', description: '查看和编辑个人信息', category: 'page', path: '/dashboard/profile', icon: 'user-filled', priority: 2, keywords: ['个人', 'profile', '信息', '资料', '账户'] },
      { id: '15', title: '系统设置', description: '配置系统偏好设置', category: 'page', path: '/dashboard/profile', icon: 'tools', priority: 2, keywords: ['设置', '配置', 'settings', '系统', '偏好'] }
    ]
  }

  /**
   * 全局搜索接口
   * @param query 搜索关键词
   * @param filters 筛选条件
   * @param limit 结果数量限制
   * @returns 搜索结果
   */
  async globalSearch(query: string, filters?: SearchFilters, limit: number = 20): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return []
    }

    const searchQuery = query.toLowerCase().trim()
    
    try {
      // 执行搜索
      let results = this.performSearch(searchQuery, filters)
      
      // 按优先级排序
      results = this.sortResultsByPriority(results)
      
      // 限制结果数量
      results = results.slice(0, limit)
      
      console.log(`全局搜索完成："${query}"，找到 ${results.length} 个结果`)
      
      return results
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error('搜索失败，请稍后重试')
      return []
    }
  }

  /**
   * 执行搜索逻辑
   */
  private performSearch(query: string, filters?: SearchFilters): SearchResult[] {
    let results: SearchResult[] = []
    
    // 搜索本地数据
    results = this.searchLocalData(query)
    
    // 应用筛选条件
    if (filters) {
      results = this.applyFilters(results, filters)
    }
    
    return results
  }

  /**
   * 搜索本地数据
   */
  private searchLocalData(query: string): SearchResult[] {
    return this.searchResults.filter(item => {
      // 搜索标题
      if (item.title.toLowerCase().includes(query)) {
        return true
      }
      
      // 搜索描述
      if (item.description.toLowerCase().includes(query)) {
        return true
      }
      
      // 搜索关键词
      if (item.keywords.some(keyword => keyword.toLowerCase().includes(query))) {
        return true
      }
      
      // 模糊匹配 - 如果查询词很短，允许更宽松的匹配
      if (query.length <= 2) {
        const titleMatch = this.calculateSimilarity(item.title, query) > 0.3
        const descMatch = this.calculateSimilarity(item.description, query) > 0.3
        return titleMatch || descMatch
      }
      
      return false
    })
  }

  /**
   * 应用筛选条件
   */
  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(item => {
      // 分类筛选
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(item.category)) {
          return false
        }
      }
      
      // 优先级筛选
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(item.priority)) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * 按优先级排序搜索结果
   */
  private sortResultsByPriority(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => {
      // 首先按优先级排序
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      
      // 然后按标题长度排序（较短的优先）
      return a.title.length - b.title.length
    })
  }

  /**
   * 计算字符串相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) {
      return 1.0
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  

  /**
 * 获取智能搜索建议
   */
  getSmartSuggestions(query: string, limit: number = 5): string[] {
    if (!query || query.trim().length === 0) {
      return []
    }
    
    const searchQuery = query.toLowerCase().trim()
    const suggestions: string[] = []
    
    // 从搜索数据获取建议
    const dataSuggestions = this.searchResults
      .filter(item => {
        return item.title.toLowerCase().includes(searchQuery) ||
               item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
      })
      .slice(0, limit)
      .map(item => item.title)
    
    suggestions.push(...dataSuggestions)
    
    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, limit)
  }
}

// 创建全局搜索服务实例
export const searchService = new SearchService()

export default searchService