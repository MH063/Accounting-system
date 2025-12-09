/**
 * 生物识别服务
 * 提供指纹识别和面部识别功能
 */

// 生物识别类型
export type BiometricType = 'fingerprint' | 'face';

// 生物识别结果
export interface BiometricResult {
  success: boolean;
  type: BiometricType;
  message: string;
  errorCode?: string;
}

// 生物识别配置
export interface BiometricConfig {
  fingerprintEnabled: boolean;
  faceRecognitionEnabled: boolean;
  biometricAvailable: boolean;
}

/**
 * 检查浏览器是否支持生物识别API
 */
export const checkBiometricSupport = async (): Promise<BiometricConfig> => {
  try {
    // 检查Web Authentication API支持
    const webAuthnSupported = !!window.PublicKeyCredential;
    
    if (!webAuthnSupported) {
      return {
        fingerprintEnabled: false,
        faceRecognitionEnabled: false,
        biometricAvailable: false
      };
    }
    
    // 检查生物识别凭证创建支持
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    // 从localStorage获取用户设置的生物识别偏好
    const fingerprintEnabled = localStorage.getItem('fingerprintEnabled') === 'true';
    const faceRecognitionEnabled = localStorage.getItem('faceRecognitionEnabled') === 'true';
    
    return {
      fingerprintEnabled: fingerprintEnabled && available,
      faceRecognitionEnabled: faceRecognitionEnabled && available,
      biometricAvailable: available
    };
  } catch (error) {
    console.warn('生物识别支持检查失败:', error);
    return {
      fingerprintEnabled: false,
      faceRecognitionEnabled: false,
      biometricAvailable: false
    };
  }
};

/**
 * 注册生物识别凭证
 * @param type 生物识别类型
 */
export const registerBiometricCredential = async (type: BiometricType): Promise<BiometricResult> => {
  try {
    // 检查浏览器支持
    if (!window.PublicKeyCredential) {
      return {
        success: false,
        type,
        message: '浏览器不支持生物识别功能',
        errorCode: 'NOT_SUPPORTED'
      };
    }
    
    // 检查是否支持平台验证器
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      return {
        success: false,
        type,
        message: '设备不支持生物识别验证',
        errorCode: 'NOT_AVAILABLE'
      };
    }
    
    // 创建注册挑战
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    // 用户信息
    const userId = localStorage.getItem('userId') || 'default_user';
    const userName = localStorage.getItem('username') || 'user';
    
    // 注册凭证
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: '记账宝',
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required'
        },
        timeout: 60000,
        attestation: 'none'
      }
    }) as PublicKeyCredential;
    
    if (!credential) {
      return {
        success: false,
        type,
        message: '生物识别注册失败',
        errorCode: 'REGISTRATION_FAILED'
      };
    }
    
    // 保存凭证信息到localStorage（实际项目中应该保存到服务器）
    const credentialId = credential.id;
    localStorage.setItem(`${type}CredentialId`, credentialId);
    localStorage.setItem(`${type}Enabled`, 'true');
    
    return {
      success: true,
      type,
      message: `${type === 'fingerprint' ? '指纹' : '面部'}识别注册成功`
    };
  } catch (error: any) {
    console.error('生物识别注册错误:', error);
    
    // 处理特定错误
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        type,
        message: '用户拒绝了生物识别请求',
        errorCode: 'USER_DENIED'
      };
    } else if (error.name === 'InvalidStateError') {
      return {
        success: false,
        type,
        message: '生物识别设备已被注册',
        errorCode: 'ALREADY_REGISTERED'
      };
    } else {
      return {
        success: false,
        type,
        message: `生物识别注册失败: ${error.message || '未知错误'}`,
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }
};

/**
 * 验证生物识别凭证
 * @param type 生物识别类型
 */
export const authenticateWithBiometric = async (type: BiometricType): Promise<BiometricResult> => {
  try {
    // 检查浏览器支持
    if (!window.PublicKeyCredential) {
      return {
        success: false,
        type,
        message: '浏览器不支持生物识别功能',
        errorCode: 'NOT_SUPPORTED'
      };
    }
    
    // 检查是否已注册凭证
    const credentialId = localStorage.getItem(`${type}CredentialId`);
    if (!credentialId) {
      return {
        success: false,
        type,
        message: '尚未注册生物识别凭证',
        errorCode: 'NOT_REGISTERED'
      };
    }
    
    // 创建验证挑战
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    // 验证凭证
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: base64ToArrayBuffer(credentialId),
            type: 'public-key'
          }
        ],
        userVerification: 'required',
        timeout: 60000
      }
    }) as PublicKeyCredential;
    
    if (!assertion) {
      return {
        success: false,
        type,
        message: '生物识别验证失败',
        errorCode: 'AUTHENTICATION_FAILED'
      };
    }
    
    return {
      success: true,
      type,
      message: `${type === 'fingerprint' ? '指纹' : '面部'}识别验证成功`
    };
  } catch (error: any) {
    console.error('生物识别验证错误:', error);
    
    // 处理特定错误
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        type,
        message: '用户拒绝了生物识别请求',
        errorCode: 'USER_DENIED'
      };
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        type,
        message: '生物识别验证不匹配',
        errorCode: 'INVALID_CREDENTIAL'
      };
    } else {
      return {
        success: false,
        type,
        message: `生物识别验证失败: ${error.message || '未知错误'}`,
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }
};

/**
 * 启用生物识别功能
 * @param type 生物识别类型
 */
export const enableBiometric = async (type: BiometricType): Promise<BiometricResult> => {
  try {
    // 先检查支持情况
    const support = await checkBiometricSupport();
    if (!support.biometricAvailable) {
      return {
        success: false,
        type,
        message: '设备不支持生物识别功能',
        errorCode: 'NOT_AVAILABLE'
      };
    }
    
    // 注册生物识别凭证
    const result = await registerBiometricCredential(type);
    
    if (result.success) {
      // 保存启用状态
      localStorage.setItem(`${type}Enabled`, 'true');
    }
    
    return result;
  } catch (error) {
    console.error('启用生物识别失败:', error);
    return {
      success: false,
      type,
      message: '启用生物识别失败',
      errorCode: 'ENABLE_FAILED'
    };
  }
};

/**
 * 禁用生物识别功能
 * @param type 生物识别类型
 */
export const disableBiometric = (type: BiometricType): BiometricResult => {
  try {
    // 清除本地存储的凭证信息
    localStorage.removeItem(`${type}CredentialId`);
    localStorage.removeItem(`${type}Enabled`);
    
    return {
      success: true,
      type,
      message: `${type === 'fingerprint' ? '指纹' : '面部'}识别已禁用`
    };
  } catch (error) {
    console.error('禁用生物识别失败:', error);
    return {
      success: false,
      type,
      message: '禁用生物识别失败',
      errorCode: 'DISABLE_FAILED'
    };
  }
};

/**
 * 检查生物识别是否已启用
 * @param type 生物识别类型
 */
export const isBiometricEnabled = (type: BiometricType): boolean => {
  return localStorage.getItem(`${type}Enabled`) === 'true';
};

/**
 * Base64字符串转ArrayBuffer
 * @param base64 Base64字符串
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export default {
  checkBiometricSupport,
  registerBiometricCredential,
  authenticateWithBiometric,
  enableBiometric,
  disableBiometric,
  isBiometricEnabled
};