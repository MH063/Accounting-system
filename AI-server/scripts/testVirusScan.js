#!/usr/bin/env node

/**
 * 病毒扫描功能测试脚本
 * 用于测试不同的病毒扫描引擎配置
 */

const fs = require('fs');
const path = require('path');
const { virusScanner } = require('../middleware/virusScanner');

/**
 * 创建测试文件
 */
const createTestFiles = () => {
  const testDir = path.join(__dirname, '../test-files');
  
  // 创建测试目录
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 创建安全文件
  const safeFilePath = path.join(testDir, 'safe-file.txt');
  fs.writeFileSync(safeFilePath, '这是一个安全的测试文件内容。\nHello World!');

  // 创建疑似恶意文件（EICAR测试字符串）
  const eicarFilePath = path.join(testDir, 'eicar-test.txt');
  const eicarString = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
  fs.writeFileSync(eicarFilePath, eicarString);

  return { safeFilePath, eicarFilePath };
};

/**
 * 测试病毒扫描功能
 */
const testVirusScanning = async () => {
  console.log('🛡️  病毒扫描功能测试\n');

  try {
    // 创建测试文件
    const { safeFilePath, eicarFilePath } = createTestFiles();
    
    console.log('📁 测试文件创建完成');
    console.log(`  - 安全文件: ${safeFilePath}`);
    console.log(`  - EICAR测试文件: ${eicarFilePath}\n`);

    // 获取扫描引擎信息
    const engineInfo = virusScanner.getScanEngineInfo();
    console.log('🔍 当前扫描引擎信息:');
    console.log(`  - 引擎类型: ${engineInfo.engine}`);
    console.log(`  - 是否已初始化: ${engineInfo.initialized}`);
    console.log(`  - 本地ClamAV: ${engineInfo.config.localEnabled ? '启用' : '禁用'}`);
    console.log(`  - 在线服务: ${engineInfo.config.onlineEnabled ? '启用' : '禁用'}`);
    console.log(`  - 服务类型: ${engineInfo.config.service}`);
    console.log(`  - 最大文件大小: ${engineInfo.config.maxFileSize / 1024 / 1024}MB\n`);

    // 测试安全文件扫描
    console.log('🔎 测试安全文件扫描...');
    try {
      const safeResult = await virusScanner.scanFile(safeFilePath);
      console.log(`  - 文件名: ${path.basename(safeResult.file)}`);
      console.log(`  - 是否感染: ${safeResult.isInfected ? '是 🚨' : '否 ✅'}`);
      console.log(`  - 病毒列表: ${safeResult.viruses.length > 0 ? safeResult.viruses.join(', ') : '无'}`);
      if (safeResult.skipped) {
        console.log(`  - 跳过原因: ${safeResult.reason}`);
      }
      console.log(`  - 扫描时间: ${safeResult.scanTime}\n`);
    } catch (error) {
      console.error(`  - 扫描失败: ${error.message}\n`);
    }

    // 测试EICAR文件扫描
    console.log('🔎 测试EICAR文件扫描...');
    try {
      const eicarResult = await virusScanner.scanFile(eicarFilePath);
      console.log(`  - 文件名: ${path.basename(eicarResult.file)}`);
      console.log(`  - 是否感染: ${eicarResult.isInfected ? '是 🚨' : '否 ✅'}`);
      console.log(`  - 病毒列表: ${eicarResult.viruses.length > 0 ? eicarResult.viruses.join(', ') : '无'}`);
      if (eicarResult.skipped) {
        console.log(`  - 跳过原因: ${eicarResult.reason}`);
      }
      console.log(`  - 扫描时间: ${eicarResult.scanTime}\n`);
    } catch (error) {
      console.error(`  - 扫描失败: ${error.message}\n`);
    }

    // 测试批量扫描
    console.log('🔎 测试批量文件扫描...');
    try {
      const filePaths = [safeFilePath, eicarFilePath];
      const batchResults = await virusScanner.scanFiles(filePaths);
      
      console.log(`  - 扫描文件数量: ${batchResults.length}`);
      console.log(`  - 感染文件数量: ${virusScanner.hasInfectedFiles(batchResults) ? virusScanner.getInfectedFiles(batchResults).length : 0}`);
      
      if (virusScanner.hasInfectedFiles(batchResults)) {
        console.log(`  - 感染文件列表: ${virusScanner.getInfectedFiles(batchResults).join(', ')}`);
      }
      console.log('');
    } catch (error) {
      console.error(`  - 批量扫描失败: ${error.message}\n`);
    }

    // 清理测试文件
    try {
      fs.unlinkSync(safeFilePath);
      fs.unlinkSync(eicarFilePath);
      fs.rmdirSync(path.dirname(safeFilePath));
      console.log('🧹 测试文件清理完成');
    } catch (error) {
      console.warn(`⚠️  清理测试文件失败: ${error.message}`);
    }

    console.log('\n✅ 病毒扫描功能测试完成');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    process.exit(1);
  }
};

/**
 * 显示配置建议
 */
const showConfigurationAdvice = () => {
  console.log('\n💡 ClamAV 配置建议:');
  console.log('\n1. 本地部署 (推荐用于内部环境):');
  console.log('   CLAMAV_LOCAL_ENABLED=true');
  console.log('   CLAMAV_HOST=127.0.0.1');
  console.log('   CLAMAV_PORT=3310');
  console.log('');
  console.log('2. Zeabur部署 (推荐使用在线服务):');
  console.log('   CLAMAV_ONLINE_ENABLED=true');
  console.log('   CLAMAV_SERVICE=virustotal');
  console.log('   CLAMAV_API_KEY=your_api_key');
  console.log('');
  console.log('3. 开发/测试环境:');
  console.log('   CLAMAV_LOCAL_ENABLED=false');
  console.log('   CLAMAV_ONLINE_ENABLED=false');
  console.log('   (将使用模拟扫描)');
  console.log('');
  console.log('4. 获取VirusTotal API密钥:');
  console.log('   - 访问: https://www.virustotal.com/gui/join-us');
  console.log('   - 注册账号并获取API密钥');
  console.log('   - 免费版限制: 4次/分钟, 500次/天');
};

// 运行测试
if (require.main === module) {
  testVirusScanning().then(() => {
    showConfigurationAdvice();
  });
}

module.exports = {
  testVirusScanning,
  createTestFiles
};