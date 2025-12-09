/**
 * 通用时间格式化工具函数
 */

/**
 * 格式化相对时间显示（如：5分钟前，2小时前等）
 * @param time 时间
 * @returns 格式化后的相对时间字符串
 */
export const formatRelativeTime = (time: Date): string => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
  return `${Math.floor(minutes / 1440)}天前`
}

/**
 * 格式化时间为本地字符串
 * @param date 日期
 * @returns 格式化后的本地时间字符串
 */
export const formatLocalTime = (date: Date): string => {
  return date.toLocaleString('zh-CN')
}

/**
 * 格式化日期为本地日期字符串
 * @param date 日期
 * @returns 格式化后的本地日期字符串
 */
export const formatLocalDate = (date: string | Date): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

/**
 * 格式化秒数为时间显示（如：2小时30分钟）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatTimeDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}