/**
 * 测试报告生成器
 * 生成详细的测试报告，包括覆盖率和性能指标
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 生成HTML测试报告
 * @param {Array} testResults - 测试结果数组
 * @param {Object} options - 报告选项
 * @returns {Promise<string>} 生成的HTML报告内容
 */
async function generateHtmlReport(testResults, options = {}) {
  const {
    outputPath = './reports/test-report.html',
    title = '测试报告',
    includeCoverage = true
  } = options;

  // 确保报告目录存在
  const reportDir = path.dirname(outputPath);
  try {
    await fs.mkdir(reportDir, { recursive: true });
  } catch (error) {
    // 目录可能已经存在
  }

  // 计算统计信息
  const stats = calculateTestStats(testResults);
  
  // 生成HTML内容
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            padding: 30px;
            background: #fafafa;
            border-bottom: 1px solid #eee;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .success { color: #4caf50; }
        .failure { color: #f44336; }
        .pending { color: #ff9800; }
        .chart-container {
            padding: 20px;
            text-align: center;
        }
        .test-results {
            padding: 20px;
        }
        .test-suite {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        .suite-header {
            padding: 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .suite-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .suite-status.passed {
            background: #e8f5e9;
            color: #4caf50;
        }
        .suite-status.failed {
            background: #ffebee;
            color: #f44336;
        }
        .suite-details {
            padding: 15px;
            display: none;
        }
        .test-case {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        .test-case:last-child {
            border-bottom: none;
        }
        .test-name {
            flex: 1;
        }
        .test-duration {
            color: #666;
            margin-left: 20px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #eee;
            background: #fafafa;
        }
        .toggle-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .toggle-btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="stat-item">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">总测试数</div>
            </div>
            <div class="stat-item">
                <div class="stat-number success">${stats.passed}</div>
                <div class="stat-label">通过</div>
            </div>
            <div class="stat-item">
                <div class="stat-number failure">${stats.failed}</div>
                <div class="stat-label">失败</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.passRate.toFixed(1)}%</div>
                <div class="stat-label">通过率</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.totalTime}ms</div>
                <div class="stat-label">总耗时</div>
            </div>
        </div>
        
        <div class="chart-container">
            <button class="toggle-btn" onclick="toggleAllSuites()">展开/收起所有</button>
        </div>
        
        <div class="test-results">
            ${generateTestSuiteHtml(testResults)}
        </div>
        
        <div class="footer">
            <p>测试报告自动生成</p>
        </div>
    </div>
    
    <script>
        function toggleSuite(element) {
            const details = element.nextElementSibling;
            details.style.display = details.style.display === 'block' ? 'none' : 'block';
        }
        
        function toggleAllSuites() {
            const details = document.querySelectorAll('.suite-details');
            const isVisible = details[0].style.display === 'block';
            details.forEach(detail => {
                detail.style.display = isVisible ? 'none' : 'block';
            });
        }
    </script>
</body>
</html>`;

  // 写入文件
  await fs.writeFile(outputPath, htmlContent, 'utf8');
  
  return htmlContent;
}

/**
 * 计算测试统计信息
 * @param {Array} testResults - 测试结果数组
 * @returns {Object} 统计信息
 */
function calculateTestStats(testResults) {
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;
  const totalTime = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
  const passRate = total > 0 ? (passed / total) * 100 : 0;
  
  return {
    total,
    passed,
    failed,
    totalTime,
    passRate
  };
}

/**
 * 生成测试套件HTML
 * @param {Array} testResults - 测试结果数组
 * @returns {string} HTML内容
 */
function generateTestSuiteHtml(testResults) {
  return testResults.map(result => {
    const statusClass = result.passed ? 'passed' : 'failed';
    const statusText = result.passed ? '通过' : '失败';
    
    return `
<div class="test-suite">
    <div class="suite-header" onclick="toggleSuite(this)">
        <span class="suite-name">${result.name}</span>
        <span class="suite-status ${statusClass}">${statusText}</span>
    </div>
    <div class="suite-details">
        <div class="test-case">
            <span class="test-name">文件: ${result.file}</span>
            <span class="test-duration">${result.duration || 0}ms</span>
        </div>
        ${result.error ? `
        <div class="test-case">
            <span class="test-name" style="color: #f44336;">错误: ${result.error}</span>
        </div>
        ` : ''}
    </div>
</div>`;
  }).join('');
}

/**
 * 生成简洁的控制台报告
 * @param {Array} testResults - 测试结果数组
 */
function generateConsoleReport(testResults) {
  const stats = calculateTestStats(testResults);
  
  console.log('\n' + '='.repeat(60));
  console.log('           📊 测试报告摘要');
  console.log('='.repeat(60));
  console.log(`总测试套件数: ${stats.total}`);
  console.log(`通过: ${stats.passed}`);
  console.log(`失败: ${stats.failed}`);
  console.log(`通过率: ${stats.passRate.toFixed(1)}%`);
  console.log(`总耗时: ${stats.totalTime}ms`);
  console.log('='.repeat(60));
  
  // 显示详细结果
  testResults.forEach(result => {
    const statusIcon = result.passed ? '✅' : '❌';
    console.log(`${statusIcon} ${result.name}`);
    console.log(`   文件: ${result.file}`);
    console.log(`   耗时: ${result.duration || 0}ms`);
    if (!result.passed) {
      console.log(`   错误: ${result.error || `退出码 ${result.exitCode}`}`);
    }
    console.log('');
  });
}

module.exports = {
  generateHtmlReport,
  generateConsoleReport,
  calculateTestStats
};