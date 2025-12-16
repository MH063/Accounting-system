/**
 * 登录表单验证工具
 * 提供完整的表单验证逻辑和错误处理机制
 */

import { ElMessage } from 'element-plus'

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 输入类型枚举
export enum InputType {
  USERNAME = 'username',
  EMAIL = 'email',
  PASSWORD = 'password'
}

// 登录表单数据接口
export interface LoginFormData {
  username: string
  password: string
}

/**
 * 登录表单验证器类
 */
class LoginValidator {
  /**
   * 验证用户名或邮箱
   * @param value 输入值
   * @returns 验证结果
   */
  validateUsernameOrEmail(value: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 检查是否为空
    if (!value || value.trim() === '') {
      result.isValid = false
      result.errors.push('请输入用户名或邮箱')
      return result
    }

    const trimmedValue = value.trim()

    // 判断是邮箱还是用户名
    if (trimmedValue.includes('@')) {
      // 邮箱验证
      const emailValidation = this.validateEmail(trimmedValue)
      if (!emailValidation.isValid) {
        result.isValid = false
        result.errors.push(...emailValidation.errors)
      }
      result.warnings.push(...emailValidation.warnings)
    } else {
      // 用户名验证
      const usernameValidation = this.validateUsername(trimmedValue)
      if (!usernameValidation.isValid) {
        result.isValid = false
        result.errors.push(...usernameValidation.errors)
      }
      result.warnings.push(...usernameValidation.warnings)
    }

    return result
  }

  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   * @returns 验证结果
   */
  validateEmail(email: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 基本格式验证
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      result.isValid = false
      result.errors.push('请输入有效的邮箱地址')
      return result
    }

    // 长度验证
    if (email.length > 254) {
      result.isValid = false
      result.errors.push('邮箱地址过长')
      return result
    }

    // 本地部分长度验证
    const localPart = email.split('@')[0]
    if (localPart.length > 64) {
      result.isValid = false
      result.errors.push('邮箱用户名部分过长')
      return result
    }

    // 域名部分验证
    const domainPart = email.split('@')[1]
    if (domainPart.length > 253) {
      result.isValid = false
      result.errors.push('邮箱域名部分过长')
      return result
    }

    // 安全性警告
    if (email.toLowerCase().includes('test') || 
        email.toLowerCase().includes('example') ||
        email.toLowerCase().includes('temp')) {
      result.warnings.push('建议使用正式邮箱地址')
    }

    return result
  }

  /**
   * 验证用户名格式
   * @param username 用户名
   * @returns 验证结果
   */
  validateUsername(username: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 长度验证
    if (username.length < 3) {
      result.isValid = false
      result.errors.push('用户名长度不能少于3个字符')
      return result
    }

    if (username.length > 20) {
      result.isValid = false
      result.errors.push('用户名长度不能超过20个字符')
      return result
    }

    // 字符验证 - 只允许字母、数字、下划线和中文
    const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
    if (!usernameRegex.test(username)) {
      result.isValid = false
      result.errors.push('用户名只能包含字母、数字、下划线和中文')
      return result
    }

    // 不能以数字开头
    if (/^\d/.test(username)) {
      result.isValid = false
      result.errors.push('用户名不能以数字开头')
      return result
    }

    // 不能以下划线开头或结尾
    if (username.startsWith('_') || username.endsWith('_')) {
      result.isValid = false
      result.errors.push('用户名不能以下划线开头或结尾')
      return result
    }

    // 安全性警告
    if (username.toLowerCase().includes('admin') || 
        username.toLowerCase().includes('root') ||
        username.toLowerCase().includes('system')) {
      result.warnings.push('不建议使用系统保留关键字作为用户名')
    }

    return result
  }

  /**
   * 验证密码格式
   * @param password 密码
   * @returns 验证结果
   */
  validatePassword(password: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 检查是否为空
    if (!password || password.trim() === '') {
      result.isValid = false
      result.errors.push('请输入密码')
      return result
    }

    // 长度验证
    if (password.length < 6) {
      result.isValid = false
      result.errors.push('密码长度不能少于6个字符')
      return result
    }

    if (password.length > 20) {
      result.isValid = false
      result.errors.push('密码长度不能超过20个字符')
      return result
    }

    // 复杂度验证
    let hasLetter = /[a-zA-Z]/.test(password)
    let hasNumber = /[0-9]/.test(password)
    let hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    // 安全性建议
    if (!hasLetter || !hasNumber) {
      result.warnings.push('建议使用包含字母和数字的密码')
    }

    if (!hasSpecial) {
      result.warnings.push('建议使用包含特殊字符的密码以提高安全性')
    }

    // 弱密码检查
    const commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      '1234567', '1234567890', '1234', 'qwerty', 'abc123',
      '111111', '123123', 'admin', 'letmein', 'welcome'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      result.isValid = false
      result.errors.push('请使用更安全的密码，避免使用常见密码')
    }

    return result
  }

  /**
   * 验证完整的登录表单
   * @param formData 表单数据
   * @returns 验证结果
   */
  validateLoginForm(formData: LoginFormData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 验证用户名或邮箱
    const usernameValidation = this.validateUsernameOrEmail(formData.username)
    if (!usernameValidation.isValid) {
      result.isValid = false
      result.errors.push(...usernameValidation.errors)
    }
    result.warnings.push(...usernameValidation.warnings)

    // 验证密码
    const passwordValidation = this.validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      result.isValid = false
      result.errors.push(...passwordValidation.errors)
    }
    result.warnings.push(...passwordValidation.warnings)

    return result
  }

  /**
   * 检测输入类型
   * @param value 输入值
   * @returns 输入类型
   */
  detectInputType(value: string): InputType {
    if (!value || value.trim() === '') {
      return InputType.USERNAME // 默认为用户名
    }

    const trimmedValue = value.trim()
    if (trimmedValue.includes('@')) {
      return InputType.EMAIL
    }

    return InputType.USERNAME
  }

  /**
   * 格式化登录数据
   * @param formData 原始表单数据
   * @returns 格式化后的登录数据
   */
  formatLoginData(formData: LoginFormData): {
    username?: string
    email?: string
    password: string
    inputType: InputType
  } {
    const inputType = this.detectInputType(formData.username)
    const formattedData: any = {
      password: formData.password,
      inputType
    }

    if (inputType === InputType.EMAIL) {
      formattedData.email = formData.username.trim()
    } else {
      formattedData.username = formData.username.trim()
    }

    return formattedData
  }

  /**
   * 显示验证结果
   * @param result 验证结果
   */
  showValidationResult(result: ValidationResult): void {
    // 显示错误信息
    if (result.errors.length > 0) {
      ElMessage.error(result.errors[0])
    }

    // 显示警告信息
    if (result.warnings.length > 0) {
      console.warn('表单验证警告:', result.warnings)
    }
  }

  /**
   * 安全性检查 - 防止SQL注入
   * @param value 输入值
   * @returns 是否安全
   */
  isInputSafe(value: string): boolean {
    if (!value) return true

    // SQL注入关键词检查
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\*\/|\/\*|;|'|\"|`|<|>|%)/,
      /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/i,
      /(\b(UNION|SELECT)\b.*\b(FROM|JOIN)\b)/i
    ]

    return !sqlInjectionPatterns.some(pattern => pattern.test(value))
  }

  /**
   * 检查输入安全性
   * @param formData 表单数据
   * @returns 安全性检查结果
   */
  checkInputSecurity(formData: LoginFormData): {
    isSafe: boolean
    threats: string[]
  } {
    const result = {
      isSafe: true,
      threats: [] as string[]
    }

    // 检查用户名/邮箱
    if (!this.isInputSafe(formData.username)) {
      result.isSafe = false
      result.threats.push('用户名/邮箱包含不安全字符')
    }

    // 检查密码
    if (!this.isInputSafe(formData.password)) {
      result.isSafe = false
      result.threats.push('密码包含不安全字符')
    }

    return result
  }
}

// 创建单例实例
const loginValidator = new LoginValidator()

// 导出服务实例和接口
export default loginValidator
export type { ValidationResult, LoginFormData }