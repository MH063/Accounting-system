/**
 * 代码审查标准工具
 * 提供统一的代码审查标准和检查清单
 */

/**
 * 代码审查标准分类
 */
export interface ReviewStandard {
  category: string
  items: ReviewItem[]
}

/**
 * 审查项目
 */
export interface ReviewItem {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  required: boolean
}

/**
 * 代码审查检查清单
 */
export const CODE_REVIEW_STANDARDS: ReviewStandard[] = [
  {
    category: '功能性',
    items: [
      {
        id: 'func-1',
        title: '功能完整性',
        description: '代码是否实现了预期的功能，满足需求规格说明书的要求',
        severity: 'critical',
        required: true
      },
      {
        id: 'func-2',
        title: '边界条件处理',
        description: '是否正确处理了各种边界条件和异常情况',
        severity: 'high',
        required: true
      },
      {
        id: 'func-3',
        title: '错误处理',
        description: '是否包含了适当的错误处理机制，避免程序崩溃',
        severity: 'high',
        required: true
      }
    ]
  },
  {
    category: '可读性',
    items: [
      {
        id: 'read-1',
        title: '命名规范',
        description: '变量、函数、类等命名是否清晰、具有描述性且符合团队规范',
        severity: 'medium',
        required: true
      },
      {
        id: 'read-2',
        title: '代码注释',
        description: '关键逻辑是否有适当注释，注释内容是否准确、有意义',
        severity: 'medium',
        required: true
      },
      {
        id: 'read-3',
        title: '代码结构',
        description: '代码结构是否清晰，模块划分是否合理',
        severity: 'medium',
        required: true
      }
    ]
  },
  {
    category: '性能',
    items: [
      {
        id: 'perf-1',
        title: '算法效率',
        description: '算法和数据结构的选择是否合适，时间复杂度是否可接受',
        severity: 'high',
        required: true
      },
      {
        id: 'perf-2',
        title: '资源管理',
        description: '是否正确管理内存、文件句柄等资源，避免泄漏',
        severity: 'critical',
        required: true
      },
      {
        id: 'perf-3',
        title: '避免重复计算',
        description: '是否存在不必要的重复计算或查询',
        severity: 'medium',
        required: false
      }
    ]
  },
  {
    category: '安全性',
    items: [
      {
        id: 'sec-1',
        title: '输入验证',
        description: '是否对所有外部输入进行了适当的验证和过滤',
        severity: 'critical',
        required: true
      },
      {
        id: 'sec-2',
        title: '敏感信息处理',
        description: '是否避免在日志或错误信息中暴露敏感信息',
        severity: 'high',
        required: true
      },
      {
        id: 'sec-3',
        title: '权限控制',
        description: '是否正确实施了权限控制和访问检查',
        severity: 'critical',
        required: true
      }
    ]
  },
  {
    category: '可维护性',
    items: [
      {
        id: 'maint-1',
        title: '代码复用',
        description: '是否合理复用了现有代码，避免重复实现',
        severity: 'medium',
        required: true
      },
      {
        id: 'maint-2',
        title: '依赖管理',
        description: '是否合理管理了外部依赖，避免不必要的依赖',
        severity: 'medium',
        required: true
      },
      {
        id: 'maint-3',
        title: '测试覆盖',
        description: '是否包含了适当的单元测试和集成测试',
        severity: 'high',
        required: true
      }
    ]
  },
  {
    category: '一致性',
    items: [
      {
        id: 'cons-1',
        title: '编码风格',
        description: '代码风格是否与项目现有代码保持一致',
        severity: 'low',
        required: true
      },
      {
        id: 'cons-2',
        title: '设计模式',
        description: '是否遵循了项目约定的设计模式和架构原则',
        severity: 'medium',
        required: true
      },
      {
        id: 'cons-3',
        title: 'API一致性',
        description: '新增API是否与现有API风格保持一致',
        severity: 'medium',
        required: true
      }
    ]
  }
]

/**
 * 获取特定类别的审查标准
 * @param category 类别名称
 * @returns 审查标准数组
 */
export const getReviewStandardsByCategory = (category: string): ReviewItem[] => {
  const standard = CODE_REVIEW_STANDARDS.find(s => s.category === category)
  return standard ? standard.items : []
}

/**
 * 获取所有必须的审查项目
 * @returns 必须的审查项目数组
 */
export const getRequiredReviewItems = (): ReviewItem[] => {
  return CODE_REVIEW_STANDARDS.flatMap(standard => 
    standard.items.filter(item => item.required)
  )
}

/**
 * 根据严重程度过滤审查项目
 * @param severity 严重程度
 * @returns 对应严重程度的审查项目数组
 */
export const getReviewItemsBySeverity = (severity: 'critical' | 'high' | 'medium' | 'low'): ReviewItem[] => {
  return CODE_REVIEW_STANDARDS.flatMap(standard => 
    standard.items.filter(item => item.severity === severity)
  )
}

/**
 * 代码审查结果
 */
export interface ReviewResult {
  itemId: string
  passed: boolean
  comment?: string
}

/**
 * 代码审查报告
 */
export interface ReviewReport {
  reviewer: string
  reviewDate: string
  results: ReviewResult[]
  overallComment?: string
  approvalStatus: 'approved' | 'rejected' | 'needs_work'
}

/**
 * 创建代码审查报告模板
 * @param reviewer 审查者姓名
 * @returns 审查报告模板
 */
export const createReviewReportTemplate = (reviewer: string): ReviewReport => {
  const requiredItems = getRequiredReviewItems()
  const results: ReviewResult[] = requiredItems.map(item => ({
    itemId: item.id,
    passed: false
  }))
  
  return {
    reviewer,
    reviewDate: new Date().toISOString(),
    results,
    approvalStatus: 'needs_work'
  }
}

/**
 * 检查审查报告是否完整
 * @param report 审查报告
 * @returns 是否完整
 */
export const isReviewReportComplete = (report: ReviewReport): boolean => {
  return report.results.every(result => result.passed !== undefined)
}

/**
 * 计算审查通过率
 * @param report 审查报告
 * @returns 通过率百分比
 */
export const calculatePassRate = (report: ReviewReport): number => {
  if (report.results.length === 0) return 0
  
  const passedCount = report.results.filter(r => r.passed).length
  return Math.round((passedCount / report.results.length) * 100)
}

export default {
  CODE_REVIEW_STANDARDS,
  getReviewStandardsByCategory,
  getRequiredReviewItems,
  getReviewItemsBySeverity,
  createReviewReportTemplate,
  isReviewReportComplete,
  calculatePassRate
}