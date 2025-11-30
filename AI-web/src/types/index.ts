// 全局类型定义

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  code?: number
}

// 分页响应类型
export interface PaginatedResponse<T = unknown> {
  records: T[]
  total: number
  page: number
  size: number
  pages: number
}

// 用户类型
export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

// 路由元信息类型
export interface RouteMeta {
  title?: string
  requiresAuth?: boolean
  permissions?: string[]
  layout?: string
  keepAlive?: boolean
}

// 组件Props基础类型
export interface BaseProps {
  class?: string
  style?: string | Record<string, any>
}

// 表单验证规则类型
export interface ValidationRule {
  field?: string
  required?: boolean
  message?: string
  pattern?: RegExp
  validator?: (rule: ValidationRule, value: unknown, callback: (error?: string | Error) => void) => void
  trigger?: string | string[]
}

// 表格列配置类型
export interface TableColumn<T = unknown> {
  prop: keyof T | string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean | 'custom'
  formatter?: (row: T, column: TableColumn<T>, cellValue: unknown) => string
  align?: 'left' | 'center' | 'right'
}

// 文件上传类型
export interface UploadFile {
  name: string
  url: string
  size: number
  type: string
  uid: number
}

// 图表数据类型
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }>
}

// 通知消息类型
export interface NotificationMessage {
  id: string | number
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  duration?: number
  showClose?: boolean
}

// 面包屑导航类型
export interface BreadcrumbItem {
  title: string
  path?: string
  disabled?: boolean
}

// 菜单项类型
export interface MenuItem {
  id: string | number
  title: string
  path?: string
  icon?: string
  children?: MenuItem[]
  permission?: string
  target?: string
}

// 搜索筛选条件类型
export interface SearchFilters {
  keyword?: string
  category?: string[]
  dateRange?: [Date, Date]
  status?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 错误信息类型
export interface ErrorInfo {
  code?: string | number
  message: string
  details?: Record<string, unknown>
  timestamp: Date
  level: 'error' | 'warning' | 'info'
}

// 日志信息类型
export interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  userId?: string
}

// 配置项类型
export interface ConfigOption<T = unknown> {
  key: string
  value: T
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  label: string
  description?: string
  options?: Array<{ label: string; value: T }>
}

// 费用相关类型
export interface ExpenseItem {
  id: string
  title: string
  amount: number
  category: string
  description: string
  applicant: string
  applicantId: string
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted'
  createdAt: string
  updatedAt: string
  isUrgent?: boolean
  participants?: Participant[]
  attachments?: Attachment[]
  reviewHistory?: ReviewHistoryItem[]
}

export interface Participant {
  id: string
  name: string
  amount: number
  paid: boolean
  paidAt?: string
  paymentMethod?: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
}

export interface ReviewHistoryItem {
  id: string
  reviewer: string
  reviewerId: string
  action: 'approved' | 'rejected' | 'resubmitted'
  comment: string
  createdAt: string
  suggestion?: string
}

export interface BudgetItem {
  id: string
  category: string
  amount: number
  used: number
  period: string
  startDate: string
  endDate: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface BudgetTemplate {
  id: string
  name: string
  description: string
  categories: BudgetCategory[]
  createdAt: string
  updatedAt: string
}

export interface BudgetCategory {
  category: string
  amount: number
  percentage: number
}

export interface BillItem {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  category: string
  description: string
  participants: Participant[]
  paymentRecords: PaymentRecord[]
  createdAt: string
  updatedAt: string
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'bank' | 'digital' | 'cash'
  icon: string
  isDefault: boolean
  status: 'active' | 'inactive'
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  isRead: boolean
  createdAt: string
  actionUrl?: string
  actionText?: string
}

export interface MemberItem {
  id: string
  name: string
  email: string
  role: 'admin' | 'member' | 'guest'
  avatar?: string
  status: 'active' | 'inactive' | 'pending'
  joinedAt: string
  lastActiveAt?: string
  permissions: string[]
}

export interface InviteItem {
  id: string
  email: string
  role: 'admin' | 'member' | 'guest'
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invitedAt: string
  expiresAt: string
  invitedBy: string
}

export interface DormItem {
  id: string
  name: string
  address: string
  capacity: number
  occupied: number
  status: 'active' | 'inactive' | 'maintenance'
  amenities: string[]
  rules: string[]
  createdAt: string
  updatedAt: string
}

export interface CommentItem {
  id: string
  content: string
  author: string
  authorId: string
  authorAvatar?: string
  createdAt: string
  updatedAt?: string
  replies?: CommentItem[]
  isRead: boolean
}

export interface IncomeItem {
  id: string
  source: string
  amount: number
  category: string
  date: string
  description: string
  status: 'confirmed' | 'pending' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface QRCodeItem {
  id: string
  title: string
  amount: number
  qrCodeUrl: string
  status: 'active' | 'inactive'
  createdAt: string
  expiresAt?: string
  scanCount: number
}

// 寝室设置相关类型
export interface DormBasicSettings {
  dormName: string
  dormType: 'standard_4' | 'standard_6' | 'luxury_2' | 'single'
  openTime: string
  closeTime: string
  maxVisitors: number
  visitTimeLimit: number
  allowOvernightGuests: boolean
}

export interface DormBillingSettings {
  sharingType: 'equal' | 'area' | 'usage' | 'custom'
  waterBillingType: 'equal' | 'usage' | 'per_person'
  electricityBillingType: 'equal' | 'usage' | 'per_person'
  internetBillingType: 'equal' | 'per_device'
  publicItems: Array<{
    id: string
    name: string
    amount: number
  }>
}

export interface DormNotificationSettings {
  methods: string[]
  quietStart: string
  quietEnd: string
  categories: DormNotificationCategory[]
}

export interface DormNotificationCategory {
  key: string
  name: string
  items: Array<{
    key: string
    title: string
    description: string
    enabled: boolean
  }>
}

export interface DormMember {
  id: string
  name: string
  weight: number
}

export interface HistoryChange {
  field: string
  oldValue: string
  newValue: string
}

export interface HistoryRecord {
  id: string
  timestamp: string
  type: 'basic' | 'billing' | 'notification' | 'other'
  operator: string
  description: string
  changes: HistoryChange[]
}

export interface PendingFee {
  member: string
  item: string
  amount: number
  status: 'pending' | 'paid'
}

export interface DormManagementItem {
  id: number | string
  name: string
  dormNumber: string
  address: string
  memberCount: number
  status: 'active' | 'inactive' | 'maintenance' | 'pending'
  remark?: string
}

export interface EditingDorm {
  id: number | string
  name: string
  dormNumber: string
  address: string
  memberCount: number
  status: 'active' | 'inactive' | 'maintenance' | 'pending'
  remark: string
}

// 收入统计相关类型
export interface EChartsTooltipParams {
  name: string
  value: number
  seriesName: string
  marker: string
  percent?: number
}

export interface IncomeAnalysisItem {
  name: string
  value: number
  percentage: number
  color: string
}

export interface IncomeSourceStats {
  [key: string]: number
}

export interface ComparisonDataItem {
  period: string
  current: number
  comparison: number
}

export interface ForecastDataItem {
  date: string
  value: number
}

export interface TimeAggregatedItem {
  date: string
  value: number
}

export interface AnomalyItem {
  name: string
  value: number
}

export interface TrendReportData {
  reportDate: string
  dateRange: string
  totalRevenue: number
  avgRevenue: number
  revenueGrowth: number
  yoyGrowth: number
  momGrowth: number
  avgGrowth: number
  topIncomeSource: IncomeAnalysisItem | null
  anomalies: AnomalyItem[]
  forecast: ForecastDataItem[]
  trendDirection: string
  growthTrend: string
  timeGranularity: 'day' | 'week' | 'month'
  comparisonType: 'month' | 'quarter' | 'year'
  incomeSourceCount: number
}

// 导入其他服务类型
export type { SearchResult } from '../services/searchService'
export type { PaymentRecord, PaymentStatistics, QRCode, PaymentRequest, PaymentResponse, PaymentFilter } from '../services/paymentService'
export type { LoadingState, PerformanceMetric, NetworkState, AccessibilityConfig, ErrorBoundaryConfig, UserPreferences } from '../services/uxOptimizationService'
export type { AppState, PendingOperation, StateManagementConfig } from '../services/stateManagementService'