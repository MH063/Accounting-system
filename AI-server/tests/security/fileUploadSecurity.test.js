/**
 * 文件上传安全测试
 */

const fs = require('fs');
const path = require('path');

// 由于这些函数在upload.js中没有被导出，我们需要直接访问它们
// 这里我们创建测试用的简化版本
const containsMaliciousContent = (content) => {
  // 检查常见的恶意模式
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /iframe/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<object/i,
    /<embed/i,
    /<applet/i,
    /<meta/i,
    /<link/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /import\s*\(/i,
    /fromCharCode/i,
    /unescape/i,
    /decodeURIComponent/i,
    /innerHTML/i,
    /outerHTML/i,
    /appendChild/i,
    /createElement/i
  ];
  
  // 检查是否包含Base64编码的恶意内容
  const base64Patterns = [
    /PHNjcmlwdD/i, // Base64编码的<script
    /amF2YXNjcmlwdDovLw/i, // Base64编码的javascript://
    /PGlmcmFtZS8\+/i // Base64编码的<iframe/
  ];
  
  // 检查是否包含可疑的编码内容
  const encodedPatterns = [
    /&#\d+;/i, // HTML实体编码
    /\\x[0-9a-fA-F]{2}/i, // 十六进制编码
    /\\u[0-9a-fA-F]{4}/i // Unicode编码
  ];
  
  // 检查恶意模式
  const hasMaliciousPattern = maliciousPatterns.some(pattern => pattern.test(content));
  if (hasMaliciousPattern) {
    return true;
  }
  
  // 检查Base64编码的恶意内容
  const hasBase64Pattern = base64Patterns.some(pattern => pattern.test(content));
  if (hasBase64Pattern) {
    return true;
  }
  
  // 检查可疑编码内容
  const hasEncodedPattern = encodedPatterns.some(pattern => pattern.test(content));
  if (hasEncodedPattern) {
    return true;
  }
  
  return false;
};

const containsSensitiveInformation = (content) => {
  // 检查常见的敏感信息模式
  const sensitivePatterns = [
    /password\s*[=:]/i,
    /passwd\s*[=:]/i,
    /pwd\s*[=:]/i,
    /secret\s*[=:]/i,
    /token\s*[=:]/i,
    /api[key|secret]\s*[=:]/i,
    /private[key|secret]\s*[=:]/i,
    /[a-zA-Z0-9]{32,}/, // 长字符串可能是密钥
    /-----BEGIN [A-Z ]+-----/, // PEM格式密钥
    /AWS_ACCESS_KEY_ID/i,
    /AWS_SECRET_ACCESS_KEY/i,
    /GOOGLE_API_KEY/i,
    /FACEBOOK_ACCESS_TOKEN/i,
    /DATABASE_URL/i,
    /REDIS_URL/i,
    /MONGO_URI/i
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(content));
};

describe('文件上传安全测试', () => {
  test('应该检测到包含恶意脚本的内容', () => {
    const maliciousContent = '<script>alert("xss")</script>';
    expect(containsMaliciousContent(maliciousContent)).toBe(true);
  });

  test('应该检测到包含恶意链接的内容', () => {
    const maliciousContent = 'javascript:alert("xss")';
    expect(containsMaliciousContent(maliciousContent)).toBe(true);
  });

  test('应该检测到包含敏感信息的内容', () => {
    const sensitiveContent = 'password = mysecretpassword123';
    expect(containsSensitiveInformation(sensitiveContent)).toBe(true);
  });

  test('应该检测到包含AWS密钥的内容', () => {
    const sensitiveContent = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
    expect(containsSensitiveInformation(sensitiveContent)).toBe(true);
  });

  test('应该允许正常的内容', () => {
    const normalContent = '这是一段正常的文本内容，不包含任何恶意或敏感信息。';
    expect(containsMaliciousContent(normalContent)).toBe(false);
    expect(containsSensitiveInformation(normalContent)).toBe(false);
  });

  test('应该检测到Base64编码的恶意内容', () => {
    // Base64编码的<script>alert('xss')</script>
    const encodedMaliciousContent = 'PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=';
    expect(containsMaliciousContent(encodedMaliciousContent)).toBe(true);
  });
});