/**
 * 错误处理工具
 */

import { ElMessage } from 'element-plus'

/**
 * 处理API错误
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 */
export const handleApiError = (error: any, defaultMessage = '操作失败'): void => {
  console.error('API Error:', error)
  
  let message = defaultMessage
  
  // 如果是网络错误
  if (error.name === 'NetworkError' || error.message?.includes('Network Error')) {
    message = '网络连接失败，请检查网络设置'
  }
  // 如果是超时错误
  else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    message = '请求超时，请稍后重试'
  }
  // 如果是HTTP错误响应
  else if (error.response) {
    const { status, data } = error.response
    switch (status) {
      case 400:
        message = data?.message || '请求参数错误'
        break
      case 401:
        message = '未授权访问，请重新登录'
        // 可以在这里添加登出逻辑
        break
      case 403:
        message = '权限不足，无法执行此操作'
        break
      case 404:
        message = '请求的资源不存在'
        break
      case 500:
        message = '服务器内部错误，请稍后重试'
        break
      default:
        message = data?.message || `请求失败 (${status})`
    }
  }
  // 如果是业务逻辑错误
  else if (error.message) {
    message = error.message
  }
  
  ElMessage.error(message)
}

/**
 * 处理表单验证错误
 * @param error 错误对象
 */
export const handleValidationError = (error: any): void => {
  console.error('Validation Error:', error)
  
  if (error.field && error.message) {
    ElMessage.error(`${error.field}: ${error.message}`)
  } else {
    ElMessage.error('表单验证失败，请检查输入内容')
  }
}

/**
 * 显示成功消息
 * @param message 成功消息
 */
export const showSuccessMessage = (message: string): void => {
  ElMessage.success(message)
}

/**
 * 显示警告消息
 * @param message 警告消息
 */
export const showWarningMessage = (message: string): void => {
  ElMessage.warning(message)
}

/**
 * 显示信息消息
 * @param message 信息消息
 */
export const showInfoMessage = (message: string): void => {
  ElMessage.info(message)
}

// 默认导出
export default {
  handleApiError,
  handleValidationError,
  showSuccessMessage,
  showWarningMessage,
  showInfoMessage
}