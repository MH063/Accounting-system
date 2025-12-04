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

// 模拟API响应数据结构
interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

// 模拟数据库
let dormList: DormInfo[] = [
  {
    id: '1',
    dormNumber: '101',
    building: 'A',
    floor: 1,
    roomType: 'standard_4',
    capacity: 4,
    area: 28,
    orientation: '南',
    status: 'occupied',
    currentResidents: 3,
    createTime: '2024-01-15',
    remark: '靠近水房和卫生间',
    facilities: {
      basic: {
        bed: true,
        wardrobe: true,
        desk: true,
        chair: true,
        air_conditioner: true,
        heater: false,
        fan: true,
        lamp: true,
        window: true,
        curtain: true
      },
      electronics: {
        tv: false,
        computer: false,
        refrigerator: true,
        washing_machine: false,
        microwave: false,
        electric_kettle: true,
        hair_dryer: false,
        router: true
      },
      bathroom: {
        toilet: true,
        shower: true,
        washbasin: true,
        mirror: true,
        towel_rack: true,
        exhaust_fan: true,
        water_heater: true
      },
      safety: {
        fire_extinguisher: true,
        smoke_detector: true,
        emergency_light: true,
        first_aid_kit: true,
        door_lock: true,
        window_lock: true
      },
      remark: '基础设施齐全'
    },
    fees: {
      monthlyRent: 1200,
      waterRate: 3.5,
      electricityRate: 0.8,
      internetRate: 50,
      managementFee: 100,
      deposit: 3000
    },
    members: [
      {
        id: 'm1',
        name: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        role: 'student',
        isLeader: true,
        joinDate: '2024-01-15'
      },
      {
        id: 'm2',
        name: '李四',
        phone: '13800138002',
        email: 'lisi@example.com',
        role: 'student',
        isLeader: false,
        joinDate: '2024-01-15'
      },
      {
        id: 'm3',
        name: '王五',
        phone: '13800138003',
        email: 'wangwu@example.com',
        role: 'student',
        isLeader: false,
        joinDate: '2024-01-20'
      }
    ]
  },
  {
    id: '2',
    dormNumber: '102',
    building: 'A',
    floor: 1,
    roomType: 'standard_6',
    capacity: 6,
    area: 35,
    orientation: '南',
    status: 'available',
    currentResidents: 0,
    createTime: '2024-01-10',
    remark: '朝南向阳，通风良好',
    facilities: {
      basic: {
        bed: true,
        wardrobe: true,
        desk: true,
        chair: true,
        air_conditioner: true,
        heater: false,
        fan: true,
        lamp: true,
        window: true,
        curtain: true
      },
      electronics: {
        tv: false,
        computer: false,
        refrigerator: true,
        washing_machine: false,
        microwave: false,
        electric_kettle: true,
        hair_dryer: false,
        router: true
      },
      bathroom: {
        toilet: true,
        shower: true,
        washbasin: true,
        mirror: true,
        towel_rack: true,
        exhaust_fan: true,
        water_heater: true
      },
      safety: {
        fire_extinguisher: true,
        smoke_detector: true,
        emergency_light: true,
        first_aid_kit: true,
        door_lock: true,
        window_lock: true
      },
      remark: '标准六人间'
    },
    fees: {
      monthlyRent: 1000,
      waterRate: 3.5,
      electricityRate: 0.8,
      internetRate: 50,
      managementFee: 80,
      deposit: 2500
    },
    members: []
  }
]

class DormService {
  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取所有寝室列表
   */
  async getDormList(): Promise<ApiResponse<DormInfo[]>> {
    await this.delay()
    console.log('获取寝室列表:', dormList.length, '个寝室')
    return {
      success: true,
      data: dormList
    }
  }

  /**
   * 根据ID获取寝室详情
   */
  async getDormById(id: string): Promise<ApiResponse<DormInfo | null>> {
    await this.delay()
    const dorm = dormList.find(d => d.id === id)
    console.log('获取寝室详情:', id, dorm ? '成功' : '未找到')
    return {
      success: true,
      data: dorm || null
    }
  }

  /**
   * 创建新寝室
   */
  async createDorm(basicInfo: DormBasicInfo, facilities: DormFacilities, fees: DormFees): Promise<ApiResponse<DormInfo>> {
    await this.delay()
    
    // 验证寝室号是否已存在
    const exists = dormList.some(d => d.dormNumber === basicInfo.dormNumber && d.building === basicInfo.building)
    if (exists) {
      return {
        success: false,
        data: null as any,
        message: '该楼栋中已存在相同寝室号'
      }
    }

    const newDorm: DormInfo = {
      id: Date.now().toString(),
      dormNumber: basicInfo.dormNumber,
      building: basicInfo.building,
      floor: basicInfo.floor,
      roomType: basicInfo.roomType,
      capacity: basicInfo.capacity,
      area: basicInfo.area,
      orientation: basicInfo.orientation,
      status: 'available',
      currentResidents: 0,
      createTime: new Date().toISOString().split('T')[0],
      remark: basicInfo.remark,
      facilities,
      fees,
      members: []
    }

    dormList.push(newDorm)
    console.log('创建寝室成功:', newDorm)
    
    return {
      success: true,
      data: newDorm
    }
  }

  /**
   * 更新寝室信息
   */
  async updateDorm(id: string, updates: Partial<DormInfo>): Promise<ApiResponse<DormInfo>> {
    await this.delay()
    
    const index = dormList.findIndex(d => d.id === id)
    if (index === -1) {
      return {
        success: false,
        data: null as any,
        message: '寝室不存在'
      }
    }

    dormList[index] = { ...dormList[index], ...updates }
    console.log('更新寝室信息:', id, updates)
    
    return {
      success: true,
      data: dormList[index]
    }
  }

  /**
   * 删除寝室
   */
  async deleteDorm(id: string): Promise<ApiResponse<boolean>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === id)
    if (dorm && dorm.currentResidents > 0) {
      return {
        success: false,
        data: false,
        message: '无法删除有人居住的寝室'
      }
    }

    const index = dormList.findIndex(d => d.id === id)
    if (index !== -1) {
      dormList.splice(index, 1)
      console.log('删除寝室:', id)
      return {
        success: true,
        data: true
      }
    }

    return {
      success: false,
      data: false,
      message: '寝室不存在'
    }
  }

  /**
   * 添加成员到寝室
   */
  async addMember(dormId: string, member: Omit<DormMember, 'id' | 'joinDate'>): Promise<ApiResponse<DormMember>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === dormId)
    if (!dorm) {
      return {
        success: false,
        data: null as any,
        message: '寝室不存在'
      }
    }

    if (dorm.currentResidents >= dorm.capacity) {
      return {
        success: false,
        data: null as any,
        message: '寝室已满员'
      }
    }

    // 如果是第一个成员，设为寝室长
    if (dorm.members.length === 0) {
      member.isLeader = true
    }

    const newMember: DormMember = {
      ...member,
      id: Date.now().toString(),
      joinDate: new Date().toISOString().split('T')[0]
    }

    dorm.members.push(newMember)
    dorm.currentResidents = dorm.members.length
    
    // 更新寝室状态
    if (dorm.currentResidents > 0) {
      dorm.status = 'occupied'
    }

    console.log('添加成员:', dormId, newMember)
    
    return {
      success: true,
      data: newMember
    }
  }

  /**
   * 移除寝室成员
   */
  async removeMember(dormId: string, memberId: string): Promise<ApiResponse<boolean>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === dormId)
    if (!dorm) {
      return {
        success: false,
        data: false,
        message: '寝室不存在'
      }
    }

    const memberIndex = dorm.members.findIndex(m => m.id === memberId)
    if (memberIndex === -1) {
      return {
        success: false,
        data: false,
        message: '成员不存在'
      }
    }

    const member = dorm.members[memberIndex]
    dorm.members.splice(memberIndex, 1)
    dorm.currentResidents = dorm.members.length

    // 如果移除的是寝室长，重新指定
    if (member.isLeader && dorm.members.length > 0) {
      dorm.members[0].isLeader = true
    }

    // 更新寝室状态
    if (dorm.currentResidents === 0) {
      dorm.status = 'available'
    }

    console.log('移除成员:', dormId, memberId)
    
    return {
      success: true,
      data: true
    }
  }

  /**
   * 转让寝室长
   */
  async transferLeader(dormId: string, newLeaderId: string): Promise<ApiResponse<boolean>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === dormId)
    if (!dorm) {
      return {
        success: false,
        data: false,
        message: '寝室不存在'
      }
    }

    const members = dorm.members
    const oldLeader = members.find(m => m.isLeader)
    const newLeader = members.find(m => m.id === newLeaderId)

    if (!newLeader) {
      return {
        success: false,
        data: false,
        message: '目标成员不存在'
      }
    }

    if (oldLeader) {
      oldLeader.isLeader = false
    }
    newLeader.isLeader = true

    console.log('转让寝室长:', dormId, '新寝室长:', newLeaderId)
    
    return {
      success: true,
      data: true
    }
  }

  /**
   * 获取寝室统计信息
   */
  async getDormStatistics(): Promise<ApiResponse<any>> {
    await this.delay()
    
    const stats = {
      total: dormList.length,
      available: dormList.filter(d => d.status === 'available').length,
      occupied: dormList.filter(d => d.status === 'occupied').length,
      maintenance: dormList.filter(d => d.status === 'maintenance').length,
      reserved: dormList.filter(d => d.status === 'reserved').length,
      totalCapacity: dormList.reduce((sum, d) => sum + d.capacity, 0),
      totalOccupied: dormList.reduce((sum, d) => sum + d.currentResidents, 0),
      occupancyRate: dormList.reduce((sum, d) => sum + d.capacity, 0) > 0 
        ? (dormList.reduce((sum, d) => sum + d.currentResidents, 0) / dormList.reduce((sum, d) => sum + d.capacity, 0) * 100).toFixed(1)
        : 0
    }

    console.log('获取寝室统计:', stats)
    
    return {
      success: true,
      data: stats
    }
  }

  /**
   * 获取当前用户的寝室信息
   * @param userId 用户ID
   */
  async getCurrentUserDorm(userId: string): Promise<ApiResponse<DormInfo | null>> {
    await this.delay()
    
    // 在实际应用中，这里应该通过userId查询数据库获取用户所在的寝室
    // 目前我们通过遍历所有寝室来查找包含该用户的寝室
    const userDorm = dormList.find(dorm => 
      dorm.members.some(member => member.id === userId)
    )
    
    console.log('获取用户寝室信息:', userId, userDorm ? userDorm.dormNumber : '未找到')
    
    return {
      success: true,
      data: userDorm || null
    }
  }

  /**
   * 保存寝室设置
   */
  async saveDormSettings(dormId: string, settings: DormSettings): Promise<ApiResponse<boolean>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === dormId)
    if (!dorm) {
      return {
        success: false,
        data: false,
        message: '寝室不存在'
      }
    }

    // 这里应该保存到数据库或本地存储
    console.log('保存寝室设置:', dormId, settings)
    
    return {
      success: true,
      data: true,
      message: '设置保存成功'
    }
  }

  /**
   * 重置寝室设置
   */
  async resetDormSettings(dormId: string): Promise<ApiResponse<boolean>> {
    await this.delay()
    
    console.log('重置寝室设置:', dormId)
    
    return {
      success: true,
      data: true,
      message: '设置已重置'
    }
  }

  /**
   * 获取寝室设置
   */
  async getDormSettings(dormId: string): Promise<ApiResponse<any>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === dormId)
    if (!dorm) {
      return {
        success: false,
        data: null,
        message: '寝室不存在'
      }
    }

    // 返回默认设置或从数据库获取的设置
    const settings = {
      basic: {
        dormName: dorm.dormNumber + '号寝室',
        dormType: dorm.roomType,
        openTime: '06:00',
        closeTime: '23:00',
        maxVisitors: 3,
        visitTimeLimit: 4,
        allowOvernightGuests: false
      },
      customRules: [
        { text: '每周日集体大扫除' },
        { text: '轮流值日制度' }
      ],
      schedules: {
        daily: {
          wakeUpTime: '07:00',
          bedTime: '22:30',
          napTime: ['12:30', '13:30'],
          studyTime: ['19:00', '21:00']
        },
        weekend: {
          wakeUpTime: '08:00',
          bedTime: '23:00',
          restTime: ['11:00', '14:00']
        },
        exam: {
          wakeUpTime: '06:30',
          bedTime: '23:30',
          quietTime: ['22:00', '07:00']
        }
      },
      notifications: [
        {
          key: 'system',
          name: '系统通知',
          items: [
            {
              key: 'system_maintenance',
              title: '系统维护',
              description: '接收系统维护通知',
              enabled: true
            },
            {
              key: 'policy_update',
              title: '政策更新',
              description: '接收规章制度更新通知',
              enabled: true
            }
          ]
        },
        {
          key: 'device',
          name: '设备通知',
          items: [
            {
              key: 'device_error',
              title: '设备故障',
              description: '设备出现故障时通知',
              enabled: true
            },
            {
              key: 'maintenance_due',
              title: '维护提醒',
              description: '定期维护时间提醒',
              enabled: false
            }
          ]
        },
        {
          key: 'security',
          name: '安全通知',
          items: [
            {
              key: 'access_alert',
              title: '门禁异常',
              description: '异常门禁记录通知',
              enabled: true
            },
            {
              key: 'emergency',
              title: '紧急事件',
              description: '紧急事件群发通知',
              enabled: true
            }
          ]
        }
      ],
      security: {
        accessTime: ['22:00', '06:00'],
        lateReturnTime: '23:30',
        allowOvernightStay: true,
        overnightRequestRequired: false,
        emergencyContacts: [
          { name: '辅导员', phone: '13800138000' },
          { name: '楼管', phone: '13800138001' }
        ]
      },
      maintenance: {
        autoCheck: true,
        checkFrequency: 'weekly',
        reportMethods: ['app', 'web'],
        contacts: [
          { name: '张师傅', phone: '13800138010', specialty: '水电维修' },
          { name: '李师傅', phone: '13800138011', specialty: '电器维修' }
        ]
      },
      devices: [
        {
          key: 'network',
          name: '网络设备',
          devices: [
            { id: 1, name: 'WiFi路由器', status: '正常运行', online: true, enabled: true },
            { id: 2, name: '交换机', status: '正常运行', online: true, enabled: true }
          ]
        },
        {
          key: 'security',
          name: '安防设备',
          devices: [
            { id: 3, name: '门禁系统', status: '正常运行', online: true, enabled: true },
            { id: 4, name: '监控摄像头', status: '设备离线', online: false, enabled: true }
          ]
        },
        {
          key: 'environment',
          name: '环境设备',
          devices: [
            { id: 5, name: '空调控制器', status: '正常运行', online: true, enabled: true },
            { id: 6, name: '空气质量检测', status: '正常运行', online: true, enabled: false }
          ]
        }
      ]
    }

    console.log('获取寝室设置:', dormId, settings)
    
    return {
      success: true,
      data: settings
    }
  }

  /**
   * 更新寝室设置
   */
  async updateDormSettings(dormId: string, settings: any): Promise<ApiResponse<boolean>> {
    await this.delay()
    
    const dorm = dormList.find(d => d.id === dormId)
    if (!dorm) {
      return {
        success: false,
        data: false,
        message: '寝室不存在'
      }
    }

    // 这里应该保存到数据库或本地存储
    console.log('更新寝室设置:', dormId, settings)
    
    // 模拟保存延时
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      data: true,
      message: '设置更新成功'
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