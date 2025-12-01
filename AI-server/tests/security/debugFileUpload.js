// 复制测试中的函数实现
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

// 测试Base64编码的恶意内容
const encodedMaliciousContent = 'PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=';
console.log('Testing Base64 encoded malicious content:', encodedMaliciousContent);
console.log('Result:', containsMaliciousContent(encodedMaliciousContent));

// 测试正常的文本
const normalContent = '这是一段正常的文本内容，不包含任何恶意或敏感信息。';
console.log('Testing normal content:', normalContent);
console.log('Result:', containsMaliciousContent(normalContent));