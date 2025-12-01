#!/usr/bin/env node

/**
 * 依赖包安全性检查脚本
 * 检查项目依赖包是否存在已知的安全漏洞
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// 检查是否安装了 npm-audit-resolver
async function checkAuditResolver() {
  try {
    await execAsync('npx npm-audit-resolver --version', { 
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    return true;
  } catch (error) {
    return false;
  }
}

// 检查已知的不安全包
function checkKnownVulnerablePackages() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.warn('未找到 package.json 文件');
    return [];
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // 已知的不安全包列表
  const knownVulnerablePackages = [
    'left-pad', // 曾经导致生态系统崩溃的包
    'event-stream', // 曾被植入恶意代码
    'flatmap-stream', // 包含恶意代码
    'eslint-scope', // 曾被植入恶意代码
    'eslint-config-eslint' // 曾被植入恶意代码
  ];
  
  const foundVulnerable = [];
  
  for (const pkg of knownVulnerablePackages) {
    if (dependencies[pkg]) {
      foundVulnerable.push({
        name: pkg,
        version: dependencies[pkg],
        reason: '已知存在安全风险的包'
      });
    }
  }
  
  return foundVulnerable;
}

async function runDependencySecurityCheck() {
  console.log('🔍 开始检查依赖包安全性...\n');
  
  // 检查已知的不安全包
  console.log('检查已知的不安全包...\n');
  const knownVulnerable = checkKnownVulnerablePackages();
  
  if (knownVulnerable.length > 0) {
    console.log('🚨 发现已知的不安全包:');
    knownVulnerable.forEach(pkg => {
      console.log(`   - ${pkg.name}@${pkg.version}: ${pkg.reason}`);
    });
    console.log('\n⚠️  建议立即移除这些包并寻找替代方案');
    process.exit(1);
  } else {
    console.log('✅ 未发现已知的不安全包\n');
  }
  
  try {
    // 检查是否安装了 npm-audit-resolver
    console.log('检查 npm-audit-resolver...\n');
    const hasAuditResolver = await checkAuditResolver();
    
    if (hasAuditResolver) {
      console.log('运行 npm-audit-resolver check...\n');
      try {
        const { stdout, stderr } = await execAsync('npx npm-audit-resolver check', { 
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        console.log(stdout);
        
        if (stderr) {
          console.error('npm-audit-resolver 错误输出:');
          console.error(stderr);
        }
      } catch (resolverError) {
        console.log('npm-audit-resolver 检查完成');
      }
    } else {
      console.log('npm-audit-resolver 未安装，跳过高级检查\n');
    }
    
    // 运行 npm audit
    console.log('运行 npm audit...\n');
    const { stdout, stderr } = await execAsync('npm audit --audit-level=moderate', { 
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    console.log(stdout);
    
    if (stderr) {
      console.error('npm audit 错误输出:');
      console.error(stderr);
    }
    
    // 检查是否有漏洞
    if (stdout.includes('found') && !stdout.includes('found 0 vulnerabilities')) {
      console.log('\n⚠️  发现依赖包安全漏洞');
      console.log('建议运行 "npm audit fix" 来修复可自动修复的漏洞');
      console.log('对于无法自动修复的漏洞，请手动更新依赖包版本');
      process.exit(1);
    } else {
      console.log('\n✅ 未发现中等或高等风险的依赖包安全漏洞');
    }
  } catch (error) {
    // npm audit 在发现漏洞时会返回非零退出码，这是正常的
    if (error.stdout && error.stdout.includes('found')) {
      console.log(error.stdout);
      console.log('\n⚠️  发现依赖包安全漏洞');
      console.log('建议运行 "npm audit fix" 来修复可自动修复的漏洞');
      console.log('对于无法自动修复的漏洞，请手动更新依赖包版本');
      process.exit(1);
    } else {
      console.error('依赖包安全检查失败:', error.message);
      process.exit(1);
    }
  }
}

// 运行检查
runDependencySecurityCheck();