/**
 * 统一的日期时间格式化工具
 * 支持多种日期格式和输入类型
 */

/**
 * 安全地解析日期字符串或时间戳
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 解析后的Date对象，如果解析失败返回null
 */
const parseDate = (dateInput: string | number | Date | undefined | null): Date | null => {
  if (!dateInput) return null
  
  // 处理字符串 "Invalid Date"
  if (dateInput === 'Invalid Date') return null
  
  // 处理空字符串
  if (typeof dateInput === 'string' && dateInput.trim() === '') return null
  
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    
    // 验证日期有效性
    if (isNaN(date.getTime())) {
      // 只有在不是常见的空/无效状态时才记录警告
      if (dateInput !== 'undefined' && dateInput !== 'null' && dateInput.toString() !== 'Invalid Date') {
        console.warn('[timeUtils] 无效的日期格式:', dateInput)
      }
      return null
    }
    
    return date
  } catch (error) {
    console.warn('[timeUtils] 日期解析错误:', dateInput, error)
    return null
  }
}

/**
 * 格式化相对时间（如：刚刚、5分钟前、2小时前、3天前）
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (dateInput: string | number | Date | undefined | null): string => {
  const date = parseDate(dateInput)
  if (!date) return '-'
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}周前`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months}个月前`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years}年前`
  }
}

/**
 * 格式化本地日期时间
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 格式化后的日期时间字符串
 */
export const formatLocalTime = (dateInput: string | number | Date | undefined | null): string => {
  const date = parseDate(dateInput)
  if (!date) return '-'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化本地日期
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatLocalDate = (dateInput: string | number | Date | undefined | null): string => {
  const date = parseDate(dateInput)
  if (!date) return '-'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}/${month}/${day}`
}

/**
 * 格式化本地时间（仅时间部分）
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 格式化后的时间字符串
 */
export const formatLocalTimeOnly = (dateInput: string | number | Date | undefined | null): string => {
  const date = parseDate(dateInput)
  if (!date) return '-'
  
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * 格式化友好日期（如：今天、昨天、星期几）
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 友好日期字符串
 */
export const formatFriendlyDate = (dateInput: string | number | Date | undefined | null): string => {
  const date = parseDate(dateInput)
  if (!date) return '-'
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays === 2) {
    return '前天'
  } else if (diffDays < 7) {
    return weekDays[date.getDay()]
  } else {
    return formatLocalDate(date)
  }
}

/**
 * 格式化时长（如：2小时30分钟）
 * @param minutes 分钟数
 * @returns 格式化后的时长字符串
 */
export const formatDuration = (minutes: number | undefined | null): string => {
  if (minutes === undefined || minutes === null) return '-'
  
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  
  return `${hours}小时${remainingMinutes}分钟`
}

/**
 * 格式化倒计时时长（如：02:30:45）
 * @param totalSeconds 总秒数
 * @returns 格式化后的时长字符串
 */
export const formatTimeDuration = (totalSeconds: number | undefined | null): string => {
  if (totalSeconds === undefined || totalSeconds === null) return '00:00:00'
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 格式化日期为ISO字符串（用于API请求）
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns ISO格式字符串，如果解析失败返回空字符串
 */
export const formatToISODate = (dateInput: string | number | Date | undefined | null): string => {
  const date = parseDate(dateInput)
  if (!date) return ''
  
  return date.toISOString()
}

/**
 * 获取时间差（如：计算两个日期之间的差）
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 相差的毫秒数
 */
export const getTimeDiff = (
  date1: string | number | Date | undefined | null,
  date2: string | number | Date | undefined | null
): number => {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  
  if (!d1 || !d2) return 0
  
  return Math.abs(d1.getTime() - d2.getTime())
}

/**
 * 检查日期是否是今天
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 是否是今天
 */
export const isToday = (dateInput: string | number | Date | undefined | null): boolean => {
  const date = parseDate(dateInput)
  if (!date) return false
  
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

/**
 * 检查日期是否是昨天
 * @param dateInput 日期字符串、时间戳或Date对象
 * @returns 是否是昨天
 */
export const isYesterday = (dateInput: string | number | Date | undefined | null): boolean => {
  const date = parseDate(dateInput)
  if (!date) return false
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  )
}

/**
 * 安全的日期计算（防止无效日期导致错误）
 * @param dateInput 初始日期
 * @param offsetDays 要增加或减少的天数
 * @returns 计算后的日期字符串（ISO格式），失败返回空字符串
 */
export const addDays = (
  dateInput: string | number | Date | undefined | null,
  offsetDays: number
): string => {
  const date = parseDate(dateInput)
  if (!date) return ''
  
  const result = new Date(date)
  result.setDate(result.getDate() + offsetDays)
  
  return result.toISOString()
}

/**
 * 格式化金额（保留两位小数）
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export const formatAmount = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '-'
  
  return amount.toFixed(2)
}

/**
 * 格式化百分比
 * @param value 数值（0-1之间）
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export const formatPercentage = (
  value: number | undefined | null,
  decimals: number = 1
): string => {
  if (value === undefined || value === null) return '-'
  
  return `${(value * 100).toFixed(decimals)}%`
}
