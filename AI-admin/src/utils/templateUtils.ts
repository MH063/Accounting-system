/**
 * 在文本的指定位置插入字符串
 * @param content 原文本内容
 * @param insertText 要插入的字符串
 * @param start 插入起始位置
 * @param end 插入结束位置（如果是替换则与start不同）
 * @returns 插入后的新文本
 */
export function insertTextAtPosition(content: string, insertText: string, start: number, end: number): string {
  if (start < 0) start = 0;
  if (end < 0) end = 0;
  if (start > content.length) start = content.length;
  if (end > content.length) end = content.length;
  
  return content.substring(0, start) + insertText + content.substring(end);
}
