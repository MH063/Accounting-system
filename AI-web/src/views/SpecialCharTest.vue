<template>
  <div class="special-char-test">
    <h2>特殊字符检测工具测试</h2>
    
    <div class="test-section">
      <h3>输入测试字符串</h3>
      <el-input
        v-model="testString"
        type="textarea"
        :rows="3"
        placeholder="输入要测试的字符串..."
        @input="runTests"
      />
    </div>

    <div class="test-section">
      <h3>检测结果</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="包含特殊字符">
          <el-tag :type="results.hasSpecialChars ? 'success' : 'info'">
            {{ results.hasSpecialChars ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="包含控制字符">
          <el-tag :type="results.hasControlChars ? 'danger' : 'success'">
            {{ results.hasControlChars ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="包含SQL危险字符">
          <el-tag :type="results.hasDangerousSql ? 'danger' : 'success'">
            {{ results.hasDangerousSql ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="包含XSS危险字符">
          <el-tag :type="results.hasDangerousXss ? 'danger' : 'success'">
            {{ results.hasDangerousXss ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="特殊字符数量" :span="2">
          {{ results.specialChars.length }} 个
        </el-descriptions-item>
        <el-descriptions-item label="检测到的特殊字符" :span="2">
          <span v-if="results.specialChars.length > 0">
            {{ results.specialChars.join(' ') }}
          </span>
          <span v-else class="no-chars">无</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="test-section">
      <h3>预设测试用例</h3>
      <el-button-group>
        <el-button
          v-for="testCase in testCases"
          :key="testCase.name"
          @click="runTestCase(testCase.value)"
          size="small"
        >
          {{ testCase.name }}
        </el-button>
      </el-button-group>
    </div>

    <div class="test-section">
      <h3>完整特殊字符列表</h3>
      <div class="char-list">
        <el-collapse>
          <el-collapse-item title="英文特殊字符 (32个)" name="english">
            <div class="char-display">{{ ENGLISH_SPECIAL_CHARS }}</div>
          </el-collapse-item>
          <el-collapse-item title="中文标点符号 (26个)" name="chinese">
            <div class="char-display">{{ CHINESE_PUNCTUATION }}</div>
          </el-collapse-item>
          <el-collapse-item title="数学符号 (10个)" name="math">
            <div class="char-display">{{ MATH_SYMBOLS }}</div>
          </el-collapse-item>
          <el-collapse-item title="货币符号 (7个)" name="currency">
            <div class="char-display">{{ CURRENCY_SYMBOLS }}</div>
          </el-collapse-item>
          <el-collapse-item title="箭头符号 (12个)" name="arrow">
            <div class="char-display">{{ ARROW_SYMBOLS }}</div>
          </el-collapse-item>
          <el-collapse-item title="常用符号 (20个)" name="common">
            <div class="char-display">{{ COMMON_SYMBOLS }}</div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <div class="test-section">
      <h3>正则表达式验证</h3>
      <el-input
        v-model="customRegex"
        placeholder="输入自定义正则表达式..."
        @input="testCustomRegex"
      />
      <div class="regex-result" v-if="customRegex">
        <el-tag :type="regexTestResult ? 'success' : 'danger'">
          {{ regexTestResult ? '匹配成功' : '匹配失败' }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  detectSpecialChars, 
  hasSpecialChars, 
  hasControlChars, 
  hasDangerousSqlChars,
  hasDangerousXssChars,
  getSpecialChars,
  ENGLISH_SPECIAL_CHARS,
  CHINESE_PUNCTUATION,
  MATH_SYMBOLS,
  CURRENCY_SYMBOLS,
  ARROW_SYMBOLS,
  COMMON_SYMBOLS
} from '@/utils/specialCharDetector'

const testString = ref('')
const customRegex = ref('')
const regexTestResult = ref(false)

const results = reactive({
  hasSpecialChars: false,
  hasControlChars: false,
  hasDangerousSql: false,
  hasDangerousXss: false,
  specialChars: [] as string[]
})

const testCases = [
  { name: '纯字母', value: 'abcdef' },
  { name: '纯数字', value: '123456' },
  { name: '字母+数字', value: 'abc123' },
  { name: '简单密码', value: 'Password1' },
  { name: '强密码', value: 'P@ssw0rd!2024' },
  { name: '中文符号', value: '密码@123' },
  { name: '混合符号', value: 'Test@密码#123' },
  { name: 'SQL注入', value: "'; DROP TABLE users--" },
  { name: 'XSS攻击', value: '<script>alert(1)</script>' },
  { name: '控制字符', value: 'Test\x00Password' },
  { name: '引号测试', value: "User's password is '123'" },
  { name: '全符号', value: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~' }
]

const runTests = () => {
  if (!testString.value) {
    results.hasSpecialChars = false
    results.hasControlChars = false
    results.hasDangerousSql = false
    results.hasDangerousXss = false
    results.specialChars = []
    return
  }

  const detection = detectSpecialChars(testString.value)
  results.hasSpecialChars = detection.hasSpecial
  results.hasControlChars = detection.hasControl
  results.hasDangerousSql = hasDangerousSqlChars(testString.value)
  results.hasDangerousXss = hasDangerousXssChars(testString.value)
  results.specialChars = detection.specialChars
}

const runTestCase = (value: string) => {
  testString.value = value
  runTests()
}

const testCustomRegex = () => {
  if (!customRegex.value || !testString.value) {
    regexTestResult.value = false
    return
  }
  try {
    const regex = new RegExp(customRegex.value)
    regexTestResult.value = regex.test(testString.value)
  } catch {
    regexTestResult.value = false
  }
}
</script>

<style scoped>
.special-char-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
}

.test-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.char-display {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  letter-spacing: 2px;
  word-break: break-all;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.no-chars {
  color: #909399;
}

.regex-result {
  margin-top: 10px;
}
</style>
