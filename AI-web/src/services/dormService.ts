// 寝室管理服务

export interface DormBasicInfo {
  dormNumber: string
  building: string
  floor: number
  roomType: string
  capacity: number
  area: number
  orientation: string
  remark?: string
}

export interface DormFacilities {
  basic: {
    bed: boolean
    wardrobe: boolean
    desk: boolean
    chair: boolean
    air_conditioner: boolean
    heater: boolean
    fan: boolean
    lamp: boolean
    window: boolean
    curtain: boolean
  }
  electronics: {
    tv: boolean
    computer: boolean
    refrigerator: boolean
    washing_machine: boolean
    microwave: boolean
    electric_kettle: boolean
    hair_dryer: boolean
    router: boolean
  }
  bathroom: {
    toilet: boolean
    shower: boolean
    washbasin: boolean
    mirror: boolean
    towel_rack: boolean
    exhaust_fan: boolean
    water_heater: boolean
  }
  safety: {
    fire_extinguisher: boolean
    smoke_detector: boolean
    emergency_light: boolean
    first_aid_kit: boolean
    door_lock: boolean
    window_lock: boolean
  }
  remark?: string
}

export interface DormFees {
  monthlyRent: number
  waterRate: number
  electricityRate: number
  internetRate: number
  managementFee: number
  deposit: number
}

export interface DormSettings {
  basic: {
    dormName: string
    dormType: string
    openTime: string
    closeTime: string
    maxVisitors: number
    visitTimeLimit: number
    allowOvernightGuests: boolean
  }
  rules: {
    [key: string]: {
      enabled: boolean
      title: string
      description: string
    }
  }
  schedules: {
    daily: {
      wakeUpTime: string
      bedTime: string
      napTime: [string, string]
      studyTime: [string, string]
    }
    weekend: {
      wakeUpTime: string
      bedTime: string
    }
    holidays: {
      wakeUpTime: string
      bedTime: string
    }
  }
  notifications: {
    enableSMS: boolean
    enableEmail: boolean
    enablePush: boolean
    quietHours: [string, string]
    eventTypes: string[]
  }
  security: {
    requireKeyCard: boolean
    enableSurveillance: boolean
    visitorCheckIn: boolean
    lateReturnAlert: boolean
  }
  devices: {
    access: string[]
    restricted: string[]
    shared: string[]
  }
  maintenance: {
    autoReport: boolean
    contactMaintenance: boolean
    emergencyContact: string
  }
}

export interface DormMember {
  id: string
  name: string
  phone: string
  email: string
  role: string
  isLeader: boolean
  avatar?: string
  joinDate: string
}

export interface DormInfo {
  id: string
  dormNumber: string
  building: string
  floor: number
  roomType: string
  capacity: number
  area: number
  orientation: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  currentResidents: number
  createTime: string
  remark?: string
  facilities: DormFacilities
  fees: DormFees
  members: DormMember[]
}

import type { ApiResponse } from '@/types'
// 导入请求函数
import { request } from '@/utils/request'

class DormService {
  /**
   * 获取所有寝室列表
   */
  async getDormList(): Promise<ApiResponse<DormInfo[]>> {
    try {
      console.log('获取寝室列表')
      
      // 调用真实API获取寝室列表
      const response = await request<DormInfo[]>('/dorms')
      
      return response
    } catch (error) {
      console.error('获取寝室列表失败:', error)
      return {
        success: false,
        data: [],
        message: '获取寝室列表失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室列表（支持分页和搜索）
   * @param params 查询参数
   */
  async getDormitoryList(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    try {
      console.log('获取寝室列表（分页/搜索）:', params)
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      // 构建完整URL
      const url = `/api/dorms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // 调用真实API获取寝室列表
      const response = await request<any>(url);
      
      return response;
    } catch (error) {
      console.error('获取寝室列表失败:', error);
      return {
        success: false,
        data: null,
        message: '获取寝室列表失败',
        code: 500
      };
    }
  }

  /**
   * 根据ID获取寝室详情
   */
  async getDormById(id: string): Promise<ApiResponse<DormInfo>> {
    try {
      console.log('获取寝室详情:', id)
      
      // 调用真实API获取寝室详情
      const response = await request<DormInfo>(`/dorms/${id}`)
      
      return response
    } catch (error) {
      console.error('获取寝室详情失败:', error)
      return {
        success: false,
        data: {} as DormInfo,
        message: '获取寝室详情失败',
        code: 500
      }
    }
  }

  /**
   * 创建新寝室
   */
  async createDorm(dormInfo: DormBasicInfo & { facilities: DormFacilities; fees: DormFees }): Promise<ApiResponse<DormInfo>> {
    try {
      console.log('创建新寝室:', dormInfo)
      
      // 调用真实API创建寝室
      const response = await request<DormInfo>('/dorms', {
        method: 'POST',
        data: dormInfo
      })
      
      return response
    } catch (error) {
      console.error('创建寝室失败:', error)
      return {
        success: false,
        data: {} as DormInfo,
        message: '创建寝室失败',
        code: 500
      }
    }
  }

  /**
   * 更新寝室信息
   */
  async updateDorm(id: string, dormInfo: Partial<DormInfo>): Promise<ApiResponse<DormInfo>> {
    try {
      console.log('更新寝室信息:', id, dormInfo)
      
      // 调用真实API更新寝室信息
      const response = await request<DormInfo>(`/dorms/${id}`, {
        method: 'PUT',
        data: dormInfo
      })
      
      return response
    } catch (error) {
      console.error('更新寝室信息失败:', error)
      return {
        success: false,
        data: {} as DormInfo,
        message: '更新寝室信息失败',
        code: 500
      }
    }
  }

  /**
   * 删除寝室
   */
  async deleteDorm(id: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('删除寝室:', id)
      
      // 调用真实API删除寝室
      const response = await request<{ success: boolean }>(`/dorms/${id}`, {
        method: 'DELETE'
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '删除寝室成功'
      }
    } catch (error) {
      console.error('删除寝室失败:', error)
      return {
        success: false,
        data: false,
        message: '删除寝室失败',
        code: 500
      }
    }
  }

  /**
   * 添加寝室成员
   */
  async addMember(dormId: string, member: Omit<DormMember, 'id' | 'joinDate'>): Promise<ApiResponse<DormMember>> {
    try {
      console.log('添加寝室成员:', dormId, member)
      
      // 调用真实API添加成员
      const response = await request<DormMember>(`/dorms/${dormId}/members`, {
        method: 'POST',
        data: member
      })
      
      return response
    } catch (error) {
      console.error('添加成员失败:', error)
      return {
        success: false,
        data: {} as DormMember,
        message: '添加成员失败',
        code: 500
      }
    }
  }

  /**
   * 移除寝室成员
   */
  async removeMember(dormId: string, memberId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('移除寝室成员:', dormId, memberId)
      
      // 调用真实API移除成员
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/members/${memberId}`, {
        method: 'DELETE'
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '移除成员成功'
      }
    } catch (error) {
      console.error('移除成员失败:', error)
      return {
        success: false,
        data: false,
        message: '移除成员失败',
        code: 500
      }
    }
  }

  /**
   * 转让寝室长
   */
  async transferLeader(dormId: string, newLeaderId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('转让寝室长:', dormId, '新寝室长:', newLeaderId)
      
      // 调用真实API转让寝室长
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/transfer-leader`, {
        method: 'PUT',
        data: { newLeaderId }
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '转让寝室长成功'
      }
    } catch (error) {
      console.error('转让寝室长失败:', error)
      return {
        success: false,
        data: false,
        message: '转让寝室长失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室统计信息
   */
  async getDormStatistics(): Promise<ApiResponse<any>> {
    try {
      console.log('获取寝室统计信息')
      
      // 调用真实API获取统计信息
      const response = await request<{
        total: number
        available: number
        occupied: number
        maintenance: number
        reserved: number
        totalCapacity: number
        totalOccupied: number
        occupancyRate: string
      }>('/dorms/statistics')
      
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('获取寝室统计失败:', error)
      return {
        success: false,
        data: null,
        message: '获取寝室统计失败',
        code: 500
      }
    }
  }

  /**
   * 获取当前用户的寝室信息
   * @param userId 用户ID
   */
  async getCurrentUserDorm(userId: string): Promise<ApiResponse<DormInfo | null>> {
    try {
      console.log('获取用户寝室信息:', userId)
      
      // 调用真实API获取用户寝室信息
      const response = await request<DormInfo>(`/dorms/user/${userId}`)
      
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('获取用户寝室信息失败:', error)
      return {
        success: false,
        data: null,
        message: '获取用户寝室信息失败',
        code: 500
      }
    }
  }

  /**
   * 保存寝室设置
   */
  async saveDormSettings(dormId: string, settings: DormSettings): Promise<ApiResponse<boolean>> {
    try {
      console.log('保存寝室设置:', dormId, settings)
      
      // 调用真实API保存设置
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/settings`, {
        method: 'PUT',
        data: settings
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '设置保存成功'
      }
    } catch (error) {
      console.error('保存寝室设置失败:', error)
      return {
        success: false,
        data: false,
        message: '保存寝室设置失败',
        code: 500
      }
    }
  }

  /**
   * 重置寝室设置
   */
  async resetDormSettings(dormId: string): Promise<ApiResponse<boolean>> {
    try {
      console.log('重置寝室设置:', dormId)
      
      // 调用真实API重置设置
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/settings/reset`, {
        method: 'PUT'
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '设置已重置'
      }
    } catch (error) {
      console.error('重置寝室设置失败:', error)
      return {
        success: false,
        data: false,
        message: '重置寝室设置失败',
        code: 500
      }
    }
  }

  /**
   * 获取寝室设置
   */
  async getDormSettings(dormId: string): Promise<ApiResponse<any>> {
    try {
      console.log('获取寝室设置:', dormId)
      
      // 调用真实API获取寝室设置
      const response = await request<any>(`/dorms/${dormId}/settings`)
      
      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('获取寝室设置失败:', error)
      return {
        success: false,
        data: null,
        message: '获取寝室设置失败',
        code: 500
      }
    }
  }

  /**
   * 更新寝室设置
   */
  async updateDormSettings(dormId: string, settings: any): Promise<ApiResponse<boolean>> {
    try {
      console.log('更新寝室设置:', dormId, settings)
      
      // 调用真实API更新设置
      const response = await request<{ success: boolean }>(`/dorms/${dormId}/settings/update`, {
        method: 'PUT',
        data: settings
      })
      
      return {
        success: response.success,
        data: response.success,
        message: response.message || '设置更新成功'
      }
    } catch (error) {
      console.error('更新寝室设置失败:', error)
      return {
        success: false,
        data: false,
        message: '更新寝室设置失败',
        code: 500
      }
    }
  }
}

export const dormService = new DormService()
export { DormService }

// 导出默认设置
export const defaultDormSettings: DormSettings = {
  basic: {
    dormName: '',
    dormType: 'standard_4',
    openTime: '06:00',
    closeTime: '22:30',
    maxVisitors: 2,
    visitTimeLimit: 4,
    allowOvernightGuests: false
  },
  rules: {
    quiet_hours: {
      enabled: true,
      title: '熄灯时间',
      description: '23:00后保持安静'
    },
    visitor_registration: {
      enabled: true,
      title: '访客登记',
      description: '访客需登记信息'
    },
    cleanup_duty: {
      enabled: true,
      title: '值日制度',
      description: '轮流值日保持卫生'
    },
    equipment_care: {
      enabled: true,
      title: '设备爱护',
      description: '爱护公共设备'
    },
    fire_safety: {
      enabled: true,
      title: '消防安全',
      description: '严禁私拉电线'
    }
  },
  schedules: {
    daily: {
      wakeUpTime: '07:00',
      bedTime: '23:00',
      napTime: ['12:30', '14:00'],
      studyTime: ['19:00', '21:30']
    },
    weekend: {
      wakeUpTime: '08:00',
      bedTime: '23:30'
    },
    holidays: {
      wakeUpTime: '09:00',
      bedTime: '00:00'
    }
  },
  notifications: {
    enableSMS: true,
    enableEmail: true,
    enablePush: true,
    quietHours: ['23:00', '07:00'],
    eventTypes: ['fee_reminder', 'announcement', 'maintenance', 'visitor_alert']
  },
  security: {
    requireKeyCard: false,
    enableSurveillance: true,
    visitorCheckIn: true,
    lateReturnAlert: true
  },
  devices: {
    access: ['router', 'washing_machine'],
    restricted: ['high_power_devices'],
    shared: ['refrigerator', 'microwave']
  },
  maintenance: {
    autoReport: true,
    contactMaintenance: true,
    emergencyContact: '13800138000'
  }
}