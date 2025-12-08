/**
 * 统一表单验证规则库
 * 用于确保整个系统的表单验证规则和提示信息保持一致
 */

// 基础验证规则
export const basicRules = {
  // 必填项
  required: (message: string) => ({ required: true, message, trigger: 'blur' }),
  
  // 最小长度
  minLength: (min: number, message?: string) => ({
    min,
    message: message || `最少输入${min}个字符`,
    trigger: 'blur'
  }),
  
  // 最大长度
  maxLength: (max: number, message?: string) => ({
    max,
    message: message || `最多输入${max}个字符`,
    trigger: 'blur'
  }),
  
  // 长度范围
  lengthRange: (min: number, max: number, message?: string) => ({
    min,
    max,
    message: message || `长度应在${min}-${max}个字符之间`,
    trigger: 'blur'
  }),
  
  // 数字范围
  numberRange: (min: number, max: number, message?: string) => ({
    type: 'number',
    min,
    max,
    message: message || `数值应在${min}-${max}之间`,
    trigger: 'blur'
  }),
  
  // 正则表达式验证
  pattern: (pattern: RegExp, message: string) => ({
    pattern,
    message,
    trigger: 'blur'
  })
}

// 通用验证规则
export const commonRules = {
  // 用户名验证 (3-20位字母、数字、下划线)
  username: [
    basicRules.required('请输入用户名'),
    basicRules.lengthRange(3, 20, '用户名长度在 3 到 20 个字符'),
    basicRules.pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
  ],
  
  // 邮箱验证
  email: [
    basicRules.required('请输入邮箱'),
    basicRules.pattern(/^[\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, '请输入正确的邮箱格式')
  ],
  
  // 手机号验证
  phone: [
    basicRules.required('请输入手机号'),
    basicRules.pattern(/^1[3-9]\d{9}$/, '请输入正确的手机号格式')
  ],
  
  // 密码验证 (6-20位)
  password: [
    basicRules.required('请输入密码'),
    basicRules.lengthRange(6, 20, '密码长度在 6 到 20 个字符')
  ],
  
  // 确认密码验证
  confirmPassword: (getPassword: () => string, message?: string) => [
    basicRules.required(message || '请确认密码'),
    {
      validator: (_: any, value: string, callback: Function) => {
        if (value !== getPassword()) {
          callback(new Error(message || '两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  
  // 角色选择验证
  role: [
    basicRules.required('请选择角色')
  ],
  
  // 状态选择验证
  status: [
    basicRules.required('请选择状态')
  ],
  
  // 名称验证 (1-50位)
  name: [
    basicRules.required('请输入名称'),
    basicRules.maxLength(50, '名称最多输入50个字符')
  ],
  
  // 描述验证 (0-500位)
  description: [
    basicRules.maxLength(500, '描述最多输入500个字符')
  ],
  
  // 数字验证
  number: [
    basicRules.required('请输入数值'),
    basicRules.pattern(/^\d+(\.\d+)?$/, '请输入有效的数字')
  ],
  
  // 整数验证
  integer: [
    basicRules.required('请输入整数'),
    basicRules.pattern(/^\d+$/, '请输入有效的整数')
  ],
  
  // 金额验证
  amount: [
    basicRules.required('请输入金额'),
    basicRules.pattern(/^\d+(\.\d{1,2})?$/, '请输入有效的金额，最多保留两位小数')
  ],
  
  // 日期验证
  date: [
    basicRules.required('请选择日期')
  ],
  
  // 时间验证
  time: [
    basicRules.required('请选择时间')
  ],
  
  // 选择验证
  select: [
    basicRules.required('请选择')
  ],
  
  // 多选验证
  multiSelect: [
    basicRules.required('请至少选择一项'),
    { type: 'array', message: '请至少选择一项', trigger: 'change' }
  ],
  
  // URL验证
  url: [
    basicRules.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, '请输入正确的网址格式')
  ],
  
  // IP地址验证
  ip: [
    basicRules.pattern(/^(\d{1,3}\.){3}\d{1,3}$/, '请输入正确的IP地址格式')
  ]
}

// 特定业务场景验证规则
export const businessRules = {
  // 费用类型编码验证
  feeTypeCode: [
    basicRules.required('请输入费用类型编码'),
    basicRules.pattern(/^[A-Z0-9_]+$/, '费用类型编码只能包含大写字母、数字和下划线')
  ],
  
  // 角色代码验证
  roleCode: [
    basicRules.required('请输入角色代码'),
    basicRules.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/, '角色代码只能包含字母、数字和下划线，且以字母或下划线开头')
  ],
  
  // 收款账户验证
  paymentAccount: [
    basicRules.required('请输入收款账户')
  ],
  
  // 争议编号验证
  disputeNo: [
    basicRules.required('请输入争议编号'),
    basicRules.pattern(/^[A-Z0-9-]+$/, '争议编号只能包含大写字母、数字和横线')
  ],
  
  // 文件上传验证
  fileUpload: [
    basicRules.required('请上传文件'),
    { 
      validator: (_: any, value: any[], callback: Function) => {
        if (!value || value.length === 0) {
          callback(new Error('请上传文件'));
        } else {
          callback();
        }
      }, 
      trigger: 'change' 
    }
  ]
}

/**
 * 创建自定义验证规则
 * @param validator 验证函数
 * @param message 错误消息
 * @param trigger 触发方式
 * @returns 验证规则对象
 */
export const createCustomValidator = (
  validator: (rule: any, value: any, callback: Function) => void,
  message: string,
  trigger: string = 'blur'
) => {
  return {
    validator,
    message,
    trigger
  };
}

/**
 * 创建异步验证规则
 * @param asyncValidator 异步验证函数
 * @param message 错误消息
 * @param trigger 触发方式
 * @returns 验证规则对象
 */
export const createAsyncValidator = (
  asyncValidator: (rule: any, value: any, callback: Function) => Promise<void>,
  message: string,
  trigger: string = 'blur'
) => {
  return {
    asyncValidator,
    message,
    trigger
  };
}

export default {
  basicRules,
  commonRules,
  businessRules,
  createCustomValidator,
  createAsyncValidator
}