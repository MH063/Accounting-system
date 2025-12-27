/**
 * 特殊字符检测工具
 * 提供全面的特殊字符检测功能，支持多种字符类型
 */

// ASCII控制字符（不可见）
const CONTROL_CHARS = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0b\x0c\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f';

// 英文特殊字符
const ENGLISH_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:\'".,<>?/`~';

// 中文标点符号
const CHINESE_PUNCTUATION = '，。！？、；：「」『』（）【】《》〈〉——…··•·「」『』（）〔〕【】《》〈〉「」『』（）';

// 数学符号
const MATH_SYMBOLS = '±×÷≈≠≤≥∞π∝√∑∫';

// 货币符号
const CURRENCY_SYMBOLS = '$€£¥₩₹₽฿';

// 箭头符号
const ARROW_SYMBOLS = '←→↑↓↔↕⇐⇒⇑⇓⇔⇕';

// 常用符号
const COMMON_SYMBOLS = '★☆♠♣♥♦♪♫☀☁☂☃★☆⚡☎✉✏✒✔✖✚✽❀❄❤♛♜♞♝';

// 所有可打印特殊字符的组合
const PRINTABLE_SPECIAL_CHARS = ENGLISH_SPECIAL_CHARS + CHINESE_PUNCTUATION + MATH_SYMBOLS + CURRENCY_SYMBOLS + ARROW_SYMBOLS + COMMON_SYMBOLS;

// 完整的特殊字符正则表达式
const SPECIAL_CHARS_REGEX = new RegExp(`[${PRINTABLE_SPECIAL_CHARS}]`);

// 控制字符检测正则
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;

// 引号字符
const QUOTE_CHARS = '\'"`';

/**
 * 检测字符串中是否包含特殊字符
 * @param {string} str - 要检测的字符串
 * @param {Object} options - 检测选项
 * @returns {Object} 检测结果
 */
export const detectSpecialChars = (str: string, options?: {
  includeControl?: boolean;
  includeChinese?: boolean;
  includeQuotes?: boolean;
}): {
  hasSpecial: boolean;
  hasControl: boolean;
  hasQuotes: boolean;
  specialChars: string[];
  count: number;
} => {
  if (!str || typeof str !== 'string') {
    return {
      hasSpecial: false,
      hasControl: false,
      hasQuotes: false,
      specialChars: [],
      count: 0
    };
  }

  const opts = {
    includeControl: options?.includeControl ?? true,
    includeChinese: options?.includeChinese ?? true,
    includeQuotes: options?.includeQuotes ?? true
  };

  const result: string[] = [];

  // 检测可打印特殊字符
  for (const char of str) {
    if (PRINTABLE_SPECIAL_CHARS.includes(char)) {
      if (!result.includes(char)) {
        result.push(char);
      }
    }
  }

  // 检测控制字符
  const hasControl = opts.includeControl ? CONTROL_CHARS_REGEX.test(str) : false;

  // 检测引号字符
  const hasQuotes = opts.includeQuotes ? /['"`]/.test(str) : false;

  return {
    hasSpecial: result.length > 0,
    hasControl,
    hasQuotes,
    specialChars: result,
    count: result.length
  };
};

/**
 * 检测字符串中是否包含任何特殊字符（通用检测）
 * @param {string} str - 要检测的字符串
 * @returns {boolean} 是否包含特殊字符
 */
export const hasSpecialChars = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return SPECIAL_CHARS_REGEX.test(str);
};

/**
 * 检测字符串中是否包含控制字符
 * @param {string} str - 要检测的字符串
 * @returns {boolean} 是否包含控制字符
 */
export const hasControlChars = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return CONTROL_CHARS_REGEX.test(str);
};

/**
 * 检测字符串中是否包含引号字符
 * @param {string} str - 要检测的字符串
 * @returns {boolean} 是否包含引号字符
 */
export const hasQuoteChars = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /['"`]/.test(str);
};

/**
 * 检测字符串中是否包含SQL注入危险字符
 * @param {string} str - 要检测的字符串
 * @returns {boolean} 是否包含危险字符
 */
export const hasDangerousSqlChars = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // SQL注入危险字符模式
  const dangerousPattern = /(\x00|['"`\\];|--|\/\*|\*\/|@@|@.|char\s*\(|nchar\s*\(|varchar\s*\(|nvarchar\s*\()/i;
  return dangerousPattern.test(str);
};

/**
 * 检测字符串中是否包含XSS危险字符
 * @param {string} str - 要检测的字符串
 * @returns {boolean} 是否包含XSS危险字符
 */
export const hasDangerousXssChars = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // XSS危险字符模式
  const xssPattern = /<script|javascript:|vbscript:|expression|data:text\/html|on\w+\s*=/i;
  return xssPattern.test(str);
};

/**
 * 获取字符串中所有特殊字符的列表
 * @param {string} str - 要检测的字符串
 * @returns {string[]} 特殊字符列表
 */
export const getSpecialChars = (str: string): string[] => {
  if (!str || typeof str !== 'string') {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const char of str) {
    if (PRINTABLE_SPECIAL_CHARS.includes(char) && !seen.has(char)) {
      seen.add(char);
      result.push(char);
    }
  }

  return result;
};

/**
 * 统计字符串中特殊字符的数量
 * @param {string} str - 要统计的字符串
 * @returns {number} 特殊字符数量
 */
export const countSpecialChars = (str: string): number => {
  if (!str || typeof str !== 'string') {
    return 0;
  }

  let count = 0;
  const seen = new Set<string>();

  for (const char of str) {
    if (PRINTABLE_SPECIAL_CHARS.includes(char) && !seen.has(char)) {
      seen.add(char);
      count++;
    }
  }

  return count;
};

/**
 * 验证密码特殊字符要求
 * @param {string} password - 密码
 * @param {number} minChars - 最少特殊字符数量
 * @returns {Object} 验证结果
 */
export const validatePasswordSpecialChars = (
  password: string,
  minChars: number = 1
): {
  valid: boolean;
  found: number;
  required: number;
  chars: string[];
} => {
  const chars = getSpecialChars(password);
  return {
    valid: chars.length >= minChars,
    found: chars.length,
    required: minChars,
    chars
  };
};

/**
 * 完整的输入安全检测
 * @param {string} str - 要检测的字符串
 * @returns {Object} 安全检测结果
 */
export const securityCheck = (str: string): {
  isSafe: boolean;
  hasSpecialChars: boolean;
  hasControlChars: boolean;
  hasDangerousSql: boolean;
  hasDangerousXss: boolean;
  issues: string[];
} => {
  if (!str || typeof str !== 'string') {
    return {
      isSafe: true,
      hasSpecialChars: false,
      hasControlChars: false,
      hasDangerousSql: false,
      hasDangerousXss: false,
      issues: []
    };
  }

  const issues: string[] = [];
  const hasControl = hasControlChars(str);
  const hasDangerousSql = hasDangerousSqlChars(str);
  const hasDangerousXss = hasDangerousXssChars(str);

  if (hasControl) {
    issues.push('包含控制字符');
  }

  if (hasDangerousSql) {
    issues.push('包含SQL注入危险字符');
  }

  if (hasDangerousXss) {
    issues.push('包含XSS危险字符');
  }

  return {
    isSafe: !hasControl && !hasDangerousSql && !hasDangerousXss,
    hasSpecialChars: hasSpecialChars(str),
    hasControlChars: hasControl,
    hasDangerousSql,
    hasDangerousXss,
    issues
  };
};

export default {
  detectSpecialChars,
  hasSpecialChars,
  hasControlChars,
  hasQuoteChars,
  hasDangerousSqlChars,
  hasDangerousXssChars,
  getSpecialChars,
  countSpecialChars,
  validatePasswordSpecialChars,
  securityCheck,
  SPECIAL_CHARS_REGEX,
  CONTROL_CHARS_REGEX,
  PRINTABLE_SPECIAL_CHARS,
  ENGLISH_SPECIAL_CHARS,
  CHINESE_PUNCTUATION
};
