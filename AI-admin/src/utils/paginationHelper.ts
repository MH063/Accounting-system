/**
 * 分页管理工具
 * 提供统一的分页逻辑处理，包括错误处理、状态管理和数据缓存
 */

import { ref, Ref } from 'vue'
import { ElMessage } from 'element-plus'

// 分页状态类型
export interface PaginationState {
  currentPage: number
  pageSize: number
  total: number
  loading: boolean
  error: string | null
}

// 分页参数类型
export interface PaginationParams {
  page: number
  pageSize: number
  [key: string]: any
}

// 分页结果类型
export interface PaginationResult<T> {
  data: T[]
  total: number
}

/**
 * 创建分页管理器
 * @param fetchData 获取数据的函数
 * @returns 分页管理器对象
 */
export function createPaginationManager<T>(
  fetchData: (params: PaginationParams) => Promise<PaginationResult<T>>
) {
  // 分页状态
  const paginationState = ref<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    error: null
  })

  // 数据缓存
  const dataCache = new Map<string, { data: T[]; total: number; timestamp: number }>()

  // 数据列表
  const dataList = ref<T[]>([])

  /**
   * 加载数据
   * @param params 额外的查询参数
   * @param useCache 是否使用缓存
   */
  const loadData = async (params: Record<string, any> = {}, useCache = true) => {
    try {
      paginationState.value.loading = true
      paginationState.value.error = null

      // 构造缓存键
      const cacheKey = `${paginationState.value.currentPage}-${paginationState.value.pageSize}-${JSON.stringify(params)}`
      
      // 检查缓存
      if (useCache && dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey)!
        const now = Date.now()
        // 缓存有效期5分钟
        if (now - cached.timestamp < 5 * 60 * 1000) {
          dataList.value = cached.data
          paginationState.value.total = cached.total
          paginationState.value.loading = false
          return
        }
      }

      // 构造请求参数
      const requestParams = {
        page: paginationState.value.currentPage,
        pageSize: paginationState.value.pageSize,
        ...params
      }

      // 获取数据
      const result = await fetchData(requestParams)
      
      // 更新数据
      dataList.value = result.data
      paginationState.value.total = result.total
      
      // 缓存数据
      dataCache.set(cacheKey, {
        data: result.data,
        total: result.total,
        timestamp: Date.now()
      })
    } catch (error: any) {
      console.error('❌ 分页数据加载失败:', error)
      paginationState.value.error = error.message || '数据加载失败'
      ElMessage.error(paginationState.value.error || '数据加载失败')
      
      // 使用空数据作为兜底
      dataList.value = []
      paginationState.value.total = 0
    } finally {
      paginationState.value.loading = false
    }
  }

  /**
   * 处理页面大小变化
   * @param val 新的页面大小
   */
  const handleSizeChange = (val: number) => {
    paginationState.value.pageSize = val
    paginationState.value.currentPage = 1 // 重置到第一页
    return loadData()
  }

  /**
   * 处理当前页变化
   * @param val 新的当前页
   */
  const handleCurrentChange = (val: number) => {
    paginationState.value.currentPage = val
    return loadData()
  }

  /**
   * 刷新数据
   * @param params 额外的查询参数
   */
  const refresh = (params: Record<string, any> = {}) => {
    // 清除缓存
    dataCache.clear()
    return loadData(params, false)
  }

  /**
   * 重置分页状态
   */
  const reset = () => {
    paginationState.value.currentPage = 1
    paginationState.value.pageSize = 20
    paginationState.value.total = 0
    paginationState.value.loading = false
    paginationState.value.error = null
    dataList.value = []
    dataCache.clear()
  }

  return {
    // 状态
    paginationState: paginationState as Ref<PaginationState>,
    dataList: dataList as Ref<T[]>,
    
    // 方法
    loadData,
    handleSizeChange,
    handleCurrentChange,
    refresh,
    reset
  }
}