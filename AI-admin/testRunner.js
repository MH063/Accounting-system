/**
 * 简单的测试运行器
 * 用于运行项目中的测试文件
 */

import fs from 'fs'
import path from 'path'

// 递归查找目录中的所有测试文件
function findTestFiles(dir) {
  let results = []
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // 递归查找子目录
      results = results.concat(findTestFiles(filePath))
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.js')) {
      // 添加测试文件
      results.push(filePath)
    }
  }
  
  return results
}

// 运行单个测试文件
async function runTestFile(filePath) {
  try {
    console.log(`\n🧪 Running tests in ${filePath}`)
    console.log('=' .repeat(50))
    
    // 动态导入测试文件
    const testModule = await import(filePath)
    
    // 如果模块有默认导出并且包含runTests函数，则运行它
    if (testModule.default && typeof testModule.default.runFormFieldTests === 'function') {
      await testModule.default.runFormFieldTests()
    } else if (typeof testModule.runFormFieldTests === 'function') {
      await testModule.runFormFieldTests()
    } else {
      console.log('⚠️  No test runner function found in this file')
    }
  } catch (error) {
    console.error(`❌ Error running tests in ${filePath}:`, error.message)
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🔍 Searching for test files...')
  
  // 查找所有测试文件
  const testFiles = findTestFiles('./src')
  
  if (testFiles.length === 0) {
    console.log('⚠️  No test files found')
    return
  }
  
  console.log(`📁 Found ${testFiles.length} test file(s)`)
  
  // 运行每个测试文件
  for (const testFile of testFiles) {
    await runTestFile(testFile)
  }
  
  console.log('\n🏁 Test run completed')
}

// 如果直接运行此脚本，则执行所有测试
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAllTests().catch(error => {
    console.error('❌ Test run failed:', error)
    process.exit(1)
  })
}

export default {
  runAllTests
}