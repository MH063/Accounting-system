/**
 * 通用消息提示工具函数
 */
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 显示成功消息
 * @param message 消息内容
 */
export const showSuccessMessage = (message: string) => {
  ElMessage.success(message)
}

/**
 * 显示错误消息
 * @param message 消息内容
 */
export const showErrorMessage = (message: string) => {
  ElMessage.error(message)
}

/**
 * 显示警告消息
 * @param message 消息内容
 */
export const showWarningMessage = (message: string) => {
  ElMessage.warning(message)
}

/**
 * 显示信息消息
 * @param message 消息内容
 */
export const showInfoMessage = (message: string) => {
  ElMessage.info(message)
}

/**
 * 显示确认对话框
 * @param message 消息内容
 * @param title 标题
 * @param options 配置选项
 * @returns Promise
 */
export const showConfirmDialog = (
  message: string, 
  title: string, 
  options: Record<string, any> = {}
) => {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    ...options
  })
}