import { request } from '@/utils/request'
import type { ApiResponse } from '@/types'

// 二维码识别结果接口
export interface QRCodeScanResult {
  merchantId: string
  merchantName: string
  amount: number
  description: string
  timestamp: string
  [key: string]: any // 允许其他字段
}

// 文件上传识别参数
export interface FileScanParams {
  file: File
}

// 摄像头扫描参数
export interface CameraScanParams {
  imageData: string // base64格式的图像数据
}

/**
 * 从文件中识别二维码
 * @param params 文件扫描参数
 * @returns 二维码识别结果
 */
export const scanQRCodeFromFile = async (params: FileScanParams): Promise<ApiResponse<QRCodeScanResult>> => {
  try {
    console.log('调用文件二维码识别API')
    
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', params.file)
    
    // 调用真实API进行二维码识别
    const response = await request<QRCodeScanResult>('/qr-code/scan/file', {
      method: 'POST',
      body: formData
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    return {
      success: true,
      data: actualData
    }
  } catch (error) {
    console.error('文件二维码识别失败:', error)
    return {
      success: false,
      data: {} as QRCodeScanResult,
      message: '二维码识别失败'
    }
  }
}

/**
 * 从摄像头图像中识别二维码
 * @param params 摄像头扫描参数
 * @returns 二维码识别结果
 */
export const scanQRCodeFromCamera = async (params: CameraScanParams): Promise<ApiResponse<QRCodeScanResult>> => {
  try {
    console.log('调用摄像头二维码识别API')
    
    // 调用真实API进行二维码识别
    const response = await request<QRCodeScanResult>('/qr-code/scan/camera', {
      method: 'POST',
      body: JSON.stringify({
        imageData: params.imageData
      })
    })
    
    // 处理双层嵌套结构 (Rule 5)
    const actualData = response.data?.data || response.data
    
    return {
      success: true,
      data: actualData
    }
  } catch (error) {
    console.error('摄像头二维码识别失败:', error)
    return {
      success: false,
      data: {} as QRCodeScanResult,
      message: '二维码识别失败'
    }
  }
}

export default {
  scanQRCodeFromFile,
  scanQRCodeFromCamera
}