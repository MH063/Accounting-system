/**
 * 安全问题服务
 * 提供安全问题的存储和验证功能
 */

// 安全问题配置接口
export interface SecurityQuestionConfig {
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  question3: string;
  answer3: string;
}

/**
 * 获取默认安全问题配置
 */
export const getDefaultSecurityQuestionConfig = (): SecurityQuestionConfig => {
  return {
    question1: '',
    answer1: '',
    question2: '',
    answer2: '',
    question3: '',
    answer3: ''
  };
};

/**
 * 从localStorage获取安全问题配置
 * @param userId 用户ID
 */
export const getSecurityQuestionConfig = (userId: string): SecurityQuestionConfig => {
  try {
    const configStr = localStorage.getItem(`securityQuestions_${userId}`);
    if (configStr) {
      const config = JSON.parse(configStr);
      // 出于安全考虑，不返回答案
      return {
        question1: config.question1 || '',
        answer1: config.answer1 ? '******' : '', // 用占位符表示已设置答案
        question2: config.question2 || '',
        answer2: config.answer2 ? '******' : '',
        question3: config.question3 || '',
        answer3: config.answer3 ? '******' : ''
      };
    }
  } catch (error) {
    console.warn('解析安全问题配置失败，使用默认配置:', error);
  }
  return getDefaultSecurityQuestionConfig();
};

/**
 * 获取用于验证的安全问题配置（包含答案）
 * @param userId 用户ID
 */
export const getSecurityQuestionConfigForVerification = (userId: string): SecurityQuestionConfig => {
  try {
    const configStr = localStorage.getItem(`securityQuestions_${userId}`);
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('解析安全问题配置失败:', error);
  }
  return getDefaultSecurityQuestionConfig();
};

/**
 * 保存安全问题配置到localStorage
 * @param userId 用户ID
 * @param config 安全问题配置
 */
export const saveSecurityQuestionConfig = (userId: string, config: SecurityQuestionConfig): void => {
  try {
    // 出于安全考虑，对答案进行简单加密（实际应用中应使用更强的加密方式）
    const encryptedConfig = {
      ...config,
      answer1: config.answer1 ? btoa(config.answer1.toLowerCase().trim()) : '',
      answer2: config.answer2 ? btoa(config.answer2.toLowerCase().trim()) : '',
      answer3: config.answer3 ? btoa(config.answer3.toLowerCase().trim()) : ''
    };
    localStorage.setItem(`securityQuestions_${userId}`, JSON.stringify(encryptedConfig));
  } catch (error) {
    console.error('保存安全问题配置失败:', error);
  }
};

/**
 * 验证安全问题答案
 * @param userId 用户ID
 * @param questionIndex 问题索引 (1, 2, 或 3)
 * @param answer 用户提供的答案
 * @returns 是否验证成功
 */
export const verifySecurityQuestionAnswer = (
  userId: string,
  questionIndex: number,
  answer: string
): boolean => {
  try {
    const config = getSecurityQuestionConfigForVerification(userId);
    
    let storedAnswer = '';
    switch (questionIndex) {
      case 1:
        storedAnswer = config.answer1;
        break;
      case 2:
        storedAnswer = config.answer2;
        break;
      case 3:
        storedAnswer = config.answer3;
        break;
      default:
        return false;
    }
    
    // 如果没有设置答案，则验证失败
    if (!storedAnswer) {
      return false;
    }
    
    // 解密存储的答案并进行比较（忽略大小写和首尾空格）
    const decryptedStoredAnswer = atob(storedAnswer).toLowerCase().trim();
    const providedAnswer = answer.toLowerCase().trim();
    
    return decryptedStoredAnswer === providedAnswer;
  } catch (error) {
    console.error('验证安全问题答案失败:', error);
    return false;
  }
};

/**
 * 检查用户是否已设置安全问题
 * @param userId 用户ID
 * @returns 是否已设置安全问题
 */
export const hasSecurityQuestions = (userId: string): boolean => {
  try {
    const config = getSecurityQuestionConfig(userId);
    return !!(
      config.question1 && config.answer1 &&
      config.question2 && config.answer2 &&
      config.question3 && config.answer3
    );
  } catch (error) {
    console.error('检查安全问题设置状态失败:', error);
    return false;
  }
};

export default {
  getDefaultSecurityQuestionConfig,
  getSecurityQuestionConfig,
  getSecurityQuestionConfigForVerification,
  saveSecurityQuestionConfig,
  verifySecurityQuestionAnswer,
  hasSecurityQuestions
};