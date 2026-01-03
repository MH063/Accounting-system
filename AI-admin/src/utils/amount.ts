/**
 * 费用金额规范化处理工具函数
 * @param value 原始输入字符串
 * @returns 规范化后的金额字符串（保留两位小数，如 "120.00"）
 */
export const normalizeAmount = (value: string): string => {
  if (!value) return '0.00';

  // 1. 过滤掉非数字和小数点
  let cleanValue = value.replace(/[^\d.]/g, '');

  // 2. 处理多个小数点，只保留第一个
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }

  // 3. 处理以小数点开头的情况，补全前导零
  if (cleanValue.startsWith('.')) {
    cleanValue = '0' + cleanValue;
  }

  // 4. 处理前导零（除非是 "0." 开头）
  if (cleanValue.length > 1 && cleanValue.startsWith('0') && !cleanValue.startsWith('0.')) {
    cleanValue = cleanValue.replace(/^0+/, '');
    if (cleanValue === '' || cleanValue.startsWith('.')) {
      cleanValue = '0' + cleanValue;
    }
  }

  // 5. 转换为数字并格式化为两位小数
  const num = parseFloat(cleanValue);
  if (isNaN(num)) return '0.00';

  return num.toFixed(2);
};
