#!/usr/bin/env node

/**
 * 检查敏感文件脚本
 * 用于检查是否有敏感文件被意外提交到Git仓库中
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 开始检查敏感文件...\n');

// 定义敏感文件模式
const sensitivePatterns = [
  '\\.env$',
  '\\.env\\.secure$',
  '\\.pem$',
  '\\.key$',
  '\\.crt$',
  '\\.cert$',
  'config\\.json$',
  'credentials\\.json$',
  'secrets\\.json$'
];

// 定义安全的文件模式（这些文件是安全的，即使匹配上面的模式）
const safePatterns = [
  '\\.env\\.example$',
  '\\.env\\.sample$'
];

try {
  // 获取Git跟踪的所有文件
  const gitFilesOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const gitFiles = gitFilesOutput.split('\n').filter(file => file.trim() !== '');
  
  console.log(`📁 Git仓库中共有 ${gitFiles.length} 个文件\n`);
  
  // 存储发现的敏感文件
  const sensitiveFiles = [];
  
  // 检查每个文件是否匹配敏感模式
  for (const file of gitFiles) {
    // 检查是否匹配敏感模式
    let isSensitive = false;
    for (const pattern of sensitivePatterns) {
      const regex = new RegExp(pattern);
      if (regex.test(file)) {
        isSensitive = true;
        break;
      }
    }
    
    // 如果匹配敏感模式，再检查是否是安全的文件
    if (isSensitive) {
      let isSafe = false;
      for (const pattern of safePatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(file)) {
          isSafe = true;
          break;
        }
      }
      
      // 如果不是安全的文件，则标记为敏感文件
      if (!isSafe) {
        sensitiveFiles.push(file);
      }
    }
  }
  
  // 输出结果
  if (sensitiveFiles.length > 0) {
    console.log('🚨 发现以下敏感文件可能已被提交到Git仓库:');
    sensitiveFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('\n⚠️  建议立即采取以下措施:');
    console.log('   1. 从Git历史中移除这些文件:');
    console.log('      git filter-branch --force --index-filter \\');
    console.log('      \'git rm --cached --ignore-unmatch <文件名>\' \\');
    console.log('      --prune-empty --tag-name-filter cat -- --all');
    console.log('   2. 将这些文件添加到.gitignore中');
    console.log('   3. 重新生成并轮换受影响的密钥/密码');
    console.log('   4. 强制推送更新后的历史: git push origin --force --all');
    process.exit(1);
  } else {
    console.log('✅ 未发现敏感文件被提交到Git仓库');
    console.log('💡 提示: 定期运行此检查以确保仓库安全');
  }
} catch (error) {
  console.error('❌ 检查过程中发生错误:', error.message);
  process.exit(1);
}