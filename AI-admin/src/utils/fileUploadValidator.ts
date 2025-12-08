/**
 * 文件上传验证工具
 * 提供统一的文件大小和格式验证功能
 */

import { ElMessage } from 'element-plus'

// 文件类型配置
interface FileTypeConfig {
  extensions: string[]
  mimeTypes: string[]
  maxSize: number // MB
  description: string
}

// 支持的文件类型配置
const SUPPORTED_FILE_TYPES: Record<string, FileTypeConfig> = {
  // Excel文件
  excel: {
    extensions: ['.xlsx', '.xls'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    maxSize: 10,
    description: 'Excel文件'
  },
  
  // 图片文件
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ],
    maxSize: 5,
    description: '图片文件'
  },
  
  // PDF文件
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    maxSize: 10,
    description: 'PDF文件'
  },
  
  // 文档文件
  document: {
    extensions: ['.doc', '.docx', '.txt', '.rtf'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ],
    maxSize: 10,
    description: '文档文件'
  }
}

/**
 * 验证文件类型
 * @param file 文件对象
 * @param fileType 文件类型配置
 * @returns 是否通过验证
 */
export const validateFileType = (file: File, fileType: keyof typeof SUPPORTED_FILE_TYPES): boolean => {
  const config = SUPPORTED_FILE_TYPES[fileType]
  if (!config) {
    ElMessage.error('不支持的文件类型配置')
    return false
  }
  
  // 验证文件扩展名
  const fileName = file.name.toLowerCase()
  const hasValidExtension = config.extensions.some(ext => fileName.endsWith(ext))
  
  // 验证MIME类型
  const hasValidMimeType = config.mimeTypes.includes(file.type)
  
  if (!hasValidExtension && !hasValidMimeType) {
    ElMessage.error(`只能上传${config.description}，支持格式：${config.extensions.join(', ')}`)
    return false
  }
  
  return true
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @param fileType 文件类型配置
 * @returns 是否通过验证
 */
export const validateFileSize = (file: File, fileType: keyof typeof SUPPORTED_FILE_TYPES): boolean => {
  const config = SUPPORTED_FILE_TYPES[fileType]
  if (!config) {
    ElMessage.error('不支持的文件类型配置')
    return false
  }
  
  const fileSizeMB = file.size / 1024 / 1024
  if (fileSizeMB > config.maxSize) {
    ElMessage.error(`${config.description}大小不能超过${config.maxSize}MB!`)
    return false
  }
  
  return true
}

/**
 * 综合验证文件
 * @param file 文件对象
 * @param fileType 文件类型
 * @returns 是否通过验证
 */
export const validateFile = (file: File, fileType: keyof typeof SUPPORTED_FILE_TYPES): boolean => {
  return validateFileType(file, fileType) && validateFileSize(file, fileType)
}

/**
 * 创建自定义文件类型配置
 * @param extensions 支持的扩展名
 * @param mimeTypes 支持的MIME类型
 * @param maxSize 最大大小(MB)
 * @param description 描述
 * @returns 文件类型配置
 */
export const createCustomFileType = (
  extensions: string[],
  mimeTypes: string[],
  maxSize: number,
  description: string
): FileTypeConfig => {
  return {
    extensions,
    mimeTypes,
    maxSize,
    description
  }
}

/**
 * 验证自定义文件
 * @param file 文件对象
 * @param customConfig 自定义配置
 * @returns 是否通过验证
 */
export const validateCustomFile = (file: File, customConfig: FileTypeConfig): boolean => {
  // 验证文件扩展名
  const fileName = file.name.toLowerCase()
  const hasValidExtension = customConfig.extensions.some(ext => fileName.endsWith(ext))
  
  // 验证MIME类型
  const hasValidMimeType = customConfig.mimeTypes.includes(file.type)
  
  if (!hasValidExtension && !hasValidMimeType) {
    ElMessage.error(`只能上传${customConfig.description}，支持格式：${customConfig.extensions.join(', ')}`)
    return false
  }
  
  // 验证文件大小
  const fileSizeMB = file.size / 1024 / 1024
  if (fileSizeMB > customConfig.maxSize) {
    ElMessage.error(`${customConfig.description}大小不能超过${customConfig.maxSize}MB!`)
    return false
  }
  
  return true
}

export default {
  SUPPORTED_FILE_TYPES,
  validateFileType,
  validateFileSize,
  validateFile,
  createCustomFileType,
  validateCustomFile
}