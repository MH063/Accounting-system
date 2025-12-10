/**
 * 加载状态管理工具
 */

import { ref } from 'vue'

// 创建全局加载状态
const loading = ref(false)
const loadingMessage = ref('')

/**
 * 显示加载状态
 * @param message 加载消息
 */
export const showLoading = (message = '加载中...'): void => {
  loading.value = true
  loadingMessage.value = message
}

/**
 * 隐藏加载状态
 */
export const hideLoading = (): void => {
  loading.value = false
  loadingMessage.value = ''
}

/**
 * 带加载状态的异步操作包装器
 * @param asyncFn 异步函数
 * @param message 加载消息
 */
export const withLoading = async <T>(
  asyncFn: () => Promise<T>,
  message?: string
): Promise<T> => {
  showLoading(message)
  try {
    const result = await asyncFn()
    return result
  } finally {
    hideLoading()
  }
}

// 默认导出
export default {
  loading,
  loadingMessage,
  showLoading,
  hideLoading,
  withLoading
}