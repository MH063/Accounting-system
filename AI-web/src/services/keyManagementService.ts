/**
 * 密钥管理服务
 * 提供与后端密钥管理API的交互功能
 */

import { request as requestFn } from '@/utils/request'

export interface HardwareInfo {
  userAgent?: string
  platform?: string
  cores?: number
  memory?: number
  screenResolution?: string
  timezone?: string
  language?: string
  plugins?: string[]
  canvasFingerprint?: { hash: string }
  webglFingerprint?: { hash: string }
  deviceName?: string
  ipAddress?: string
}

export interface KeyStatus {
  hasActiveKey: boolean
  currentKey: {
    id: string
    version: number
    createdAt: string
    lastUsedAt: string
    rotationCount: number
  } | null
  previousKey: {
    id: string
    version: number
  } | null
}

export interface KeyGenerationResult {
  keyId: string
  encryptedKey: string
  keyVersion: number
  createdAt: string
}

export interface HardwareBindingResult {
  success: boolean
  deviceFingerprint: string
  trustScore: number
  isNewBinding: boolean
}

export interface TrustedDevice {
  id: number
  deviceName: string
  browserInfo: string
  screenInfo: string
  timezone: string
  language: string
  firstSeen: string
  lastSeen: string
  trustScore: number
  isActive: boolean
}

export interface AuditLog {
  id: number
  keyId: string
  action: string
  ipAddress: string
  deviceFingerprint: string
  success: boolean
  errorMessage: string
  createdAt: string
}

/**
 * 获取客户端硬件信息
 */
export const getHardwareInfo = (): HardwareInfo => {
  const nav = navigator as any
  const screen = window.screen

  // 获取Canvas指纹
  const getCanvasFingerprint = () => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Hardware Fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Test String', 4, 30)
      
      const dataURL = canvas.toDataURL()
      const hash = require('crypto').createHash('md5').update(dataURL).digest('hex')
      return { hash }
    } catch (e) {
      return null
    }
  }

  // 获取WebGL指纹
  const getWebglFingerprint = () => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || (canvas as any).getContext('experimental-webgl')
      if (!gl) return null
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (!debugInfo) return null
      
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      const hash = require('crypto').createHash('md5').update(vendor + renderer).digest('hex')
      return { hash, vendor, renderer }
    } catch (e) {
      return null
    }
  }

  return {
    userAgent: navigator.userAgent,
    platform: nav.platform,
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    plugins: Array.from(navigator.plugins).map((p: any) => p.name),
    canvasFingerprint: getCanvasFingerprint(),
    webglFingerprint: getWebglFingerprint(),
    deviceName: `${nav.platform} - ${navigator.appName}`
  }
}

/**
 * 生成主密钥
 */
export const generateMasterKey = async (hardwareInfo?: HardwareInfo): Promise<KeyGenerationResult> => {
  try {
    const info = hardwareInfo || getHardwareInfo()
    const response = await requestFn<KeyGenerationResult>('/keys/generate', {
      method: 'POST',
      data: { hardwareInfo: info }
    })
    console.log('[KeyService] 主密钥生成成功:', response.data)
    return response.data
  } catch (error) {
    console.error('[KeyService] 生成主密钥失败:', error)
    throw error
  }
}

/**
 * 验证密钥
 */
export const verifyKey = async (keyProof: string, hardwareInfo?: HardwareInfo): Promise<any> => {
  try {
    const info = hardwareInfo || getHardwareInfo()
    const response = await requestFn<any>('/keys/verify', {
      method: 'POST',
      data: { keyProof, hardwareInfo: info }
    })
    return response.data
  } catch (error) {
    console.error('[KeyService] 密钥验证失败:', error)
    throw error
  }
}

/**
 * 轮换密钥
 */
export const rotateKey = async (reason?: string): Promise<any> => {
  try {
    const response = await requestFn<any>('/keys/rotate', {
      method: 'POST',
      data: { reason: reason || 'manual' }
    })
    console.log('[KeyService] 密钥轮换成功')
    return response.data
  } catch (error) {
    console.error('[KeyService] 密钥轮换失败:', error)
    throw error
  }
}

/**
 * 获取密钥状态
 */
export const getKeyStatus = async (): Promise<KeyStatus> => {
  try {
    const response = await requestFn<KeyStatus>('/keys/status', {
      method: 'GET'
    })
    return response.data
  } catch (error) {
    console.error('[KeyService] 获取密钥状态失败:', error)
    throw error
  }
}

/**
 * 注册硬件绑定
 */
export const registerHardwareBinding = async (hardwareInfo?: HardwareInfo): Promise<HardwareBindingResult> => {
  try {
    const info = hardwareInfo || getHardwareInfo()
    const response = await requestFn<HardwareBindingResult>('/keys/hardware/register', {
      method: 'POST',
      data: { hardwareInfo: info }
    })
    console.log('[KeyService] 硬件绑定注册成功:', response.data)
    return response.data
  } catch (error) {
    console.error('[KeyService] 硬件绑定注册失败:', error)
    throw error
  }
}

/**
 * 验证硬件绑定
 */
export const verifyHardwareBinding = async (hardwareInfo?: HardwareInfo): Promise<any> => {
  try {
    const info = hardwareInfo || getHardwareInfo()
    const response = await requestFn<any>('/keys/hardware/verify', {
      method: 'POST',
      data: { hardwareInfo: info }
    })
    return response.data
  } catch (error) {
    console.error('[KeyService] 硬件绑定验证失败:', error)
    throw error
  }
}

/**
 * 获取可信设备列表
 */
export const getTrustedDevices = async (): Promise<TrustedDevice[]> => {
  try {
    const response = await requestFn<TrustedDevice[]>('/keys/hardware/devices', {
      method: 'GET'
    })
    return response.data || []
  } catch (error) {
    console.error('[KeyService] 获取可信设备列表失败:', error)
    throw error
  }
}

/**
 * 撤销设备绑定
 */
export const revokeDeviceBinding = async (deviceFingerprint: string): Promise<void> => {
  try {
    await requestFn(`/keys/hardware/devices/${encodeURIComponent(deviceFingerprint)}`, {
      method: 'DELETE'
    })
    console.log('[KeyService] 设备绑定撤销成功')
  } catch (error) {
    console.error('[KeyService] 撤销设备绑定失败:', error)
    throw error
  }
}

/**
 * 获取审计日志
 */
export const getAuditLogs = async (limit?: number): Promise<AuditLog[]> => {
  try {
    const params = limit ? `?limit=${limit}` : ''
    const response = await requestFn<AuditLog[]>(`/keys/audit${params}`, {
      method: 'GET'
    })
    return response.data || []
  } catch (error) {
    console.error('[KeyService] 获取审计日志失败:', error)
    throw error
  }
}

/**
 * 初始化密钥管理（首次使用时）
 */
export const initializeKeyManagement = async (): Promise<KeyGenerationResult> => {
  try {
    // 检查是否已有密钥
    const status = await getKeyStatus()
    
    if (status.hasActiveKey) {
      console.log('[KeyService] 密钥已存在，无需初始化')
      return {
        keyId: status.currentKey!.id,
        encryptedKey: '',
        keyVersion: status.currentKey!.version,
        createdAt: status.currentKey!.createdAt
      }
    }
    
    // 生成新密钥
    const result = await generateMasterKey()
    
    // 注册硬件绑定
    await registerHardwareBinding()
    
    console.log('[KeyService] 密钥管理初始化完成')
    return result
  } catch (error) {
    console.error('[KeyService] 初始化密钥管理失败:', error)
    throw error
  }
}

/**
 * 检查并验证设备安全性
 */
export const checkDeviceSecurity = async (): Promise<{
  isSecure: boolean
  hardwareBound: boolean
  keyVerified: boolean
  message: string
}> => {
  try {
    const hardwareInfo = getHardwareInfo()
    
    // 验证硬件绑定
    const hardwareResult = await verifyHardwareBinding(hardwareInfo)
    
    if (!hardwareResult.success) {
      return {
        isSecure: false,
        hardwareBound: false,
        keyVerified: false,
        message: hardwareResult.message
      }
    }
    
    return {
      isSecure: true,
      hardwareBound: true,
      keyVerified: hardwareResult.success,
      message: '设备安全验证通过'
    }
  } catch (error: any) {
    return {
      isSecure: false,
      hardwareBound: false,
      keyVerified: false,
      message: error.message || '安全检查失败'
    }
  }
}

export default {
  getHardwareInfo,
  generateMasterKey,
  verifyKey,
  rotateKey,
  getKeyStatus,
  registerHardwareBinding,
  verifyHardwareBinding,
  getTrustedDevices,
  revokeDeviceBinding,
  getAuditLogs,
  initializeKeyManagement,
  checkDeviceSecurity
}
