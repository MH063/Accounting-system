<template>
  <div class="payment-scan">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Search /></el-icon>
          扫码支付
        </h1>
      </div>
      <div class="header-right">
        <el-button :icon="ArrowLeft" @click="$router.go(-1)" text>返回</el-button>
      </div>
    </div>

    <!-- 相机权限处理区域 -->
    <div class="camera-section">
      <div v-if="!cameraPermissionGranted" class="camera-permission">
        <div class="permission-icon">
          <el-icon size="80" color="#409EFF"><Camera /></el-icon>
        </div>
        <h3>需要相机权限</h3>
        <p>为了扫描二维码进行支付，请授权访问相机</p>
        <el-button type="primary" @click="requestCameraPermission" :loading="requestingPermission">
          授权相机权限
        </el-button>
      </div>

      <div v-else-if="!cameraActive" class="camera-controls">
        <el-button type="primary" @click="startCamera" :loading="startingCamera">
          <el-icon><VideoCamera /></el-icon>
          启动相机
        </el-button>
        <el-button @click="switchCamera" :disabled="availableCameras.length <= 1">
          <el-icon><RefreshRight /></el-icon>
          切换相机
        </el-button>
      </div>

      <div v-else class="camera-view">
        <div class="camera-container">
          <video ref="videoElement" autoplay playsinline muted></video>
          <canvas ref="canvasElement" style="display: none;"></canvas>
          <div class="scan-overlay">
            <div class="scan-frame">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
            </div>
            <div class="scan-tip">
              <p>将二维码对准扫描框</p>
            </div>
          </div>
        </div>
        
        <!-- 扫描控制 -->
        <div class="scan-controls">
          <el-button @click="stopCamera">
            <el-icon><VideoPause /></el-icon>
            停止扫描
          </el-button>
          <el-button @click="scanFromFile">
            <el-icon><Picture /></el-icon>
            选择图片
          </el-button>
          <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" style="display: none;" />
        </div>
      </div>
    </div>

    <!-- 二维码识别结果 -->
    <div v-if="scanResult" class="scan-result">
      <el-card class="result-card">
        <template #header>
          <div class="card-header">
            <span>扫描结果</span>
            <el-tag v-if="isValidPaymentQR" type="success">有效支付二维码</el-tag>
            <el-tag v-else type="warning">无效二维码</el-tag>
          </div>
        </template>
        
        <div class="result-content">
          <div v-if="isValidPaymentQR" class="payment-info">
            <h3>{{ paymentInfo.merchantName }}</h3>
            <p class="amount">{{ formatCurrency(paymentInfo.amount) }}</p>
            <p class="description">{{ paymentInfo.description }}</p>
          </div>
          <div v-else class="error-info">
            <el-icon color="#F56C6C" size="24"><Warning /></el-icon>
            <p>无效的支付二维码</p>
          </div>
        </div>

        <template #footer>
          <div class="result-actions">
            <el-button @click="resetScan">重新扫描</el-button>
            <el-button v-if="isValidPaymentQR" type="primary" @click="confirmPayment">
              确认支付
            </el-button>
          </div>
        </template>
      </el-card>
    </div>

    <!-- 支付金额确认 -->
    <div v-if="showPaymentConfirm" class="payment-confirm">
      <el-dialog v-model="paymentDialogVisible" title="确认支付" width="400px">
        <el-form :model="paymentForm" label-width="100px">
          <el-form-item label="商户名称">
            <span>{{ paymentInfo.merchantName }}</span>
          </el-form-item>
          <el-form-item label="支付金额">
            <el-input-number 
              v-model="paymentForm.amount" 
              :min="0.01" 
              :precision="2" 
              :step="0.01"
              @change="validatePaymentAmount"
            />
          </el-form-item>
          <el-form-item label="支付说明">
            <span>{{ paymentInfo.description }}</span>
          </el-form-item>
          <el-form-item label="手续费">
            <span>{{ formatCurrency(calculateFee(paymentForm.amount)) }}</span>
          </el-form-item>
          <el-form-item label="实际扣款">
            <span class="total-amount">{{ formatCurrency(paymentForm.amount + calculateFee(paymentForm.amount)) }}</span>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="paymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="proceedToPassword" :loading="processing">
            下一步
          </el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 支付密码安全输入 -->
    <div v-if="showPasswordInput" class="password-input">
      <el-dialog v-model="passwordDialogVisible" title="输入支付密码" width="400px">
        <div class="password-container">
          <p class="payment-summary">
            支付 <span class="amount">{{ formatCurrency(paymentForm.amount + calculateFee(paymentForm.amount)) }}</span> 给 {{ paymentInfo.merchantName }}
          </p>
          
          <div class="password-input-group">
            <label>支付密码</label>
            <div class="password-field">
              <el-input 
                v-model="passwordForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入6位数字密码"
                maxlength="6"
                @input="validatePassword"
              />
              <el-button 
                :icon="showPassword ? 'Hide' : 'View'" 
                @click="togglePasswordVisibility"
                text
              />
            </div>
          </div>

          <div class="biometric-option" v-if="supportsBiometric">
            <el-button 
              type="primary" 
              plain 
              @click="useBiometricAuth"
              :disabled="passwordForm.password.length > 0"
            >
              <el-icon><Key /></el-icon>
              使用指纹验证
            </el-button>
          </div>

          <div class="error-message" v-if="passwordError">
            <el-icon><Warning /></el-icon>
            {{ passwordError }}
          </div>
        </div>
        
        <template #footer>
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmPaymentPassword" 
            :disabled="!isPasswordValid"
            :loading="processing"
          >
            确认支付
          </el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 支付结果实时反馈 -->
    <div v-if="showPaymentResult" class="payment-result">
      <el-dialog v-model="resultDialogVisible" :show-close="false" width="400px">
        <div class="result-content" :class="{ success: paymentResult.success, failed: !paymentResult.success }">
          <div class="result-icon">
            <el-icon v-if="paymentResult.success" size="80" color="#67C23A"><CircleCheck /></el-icon>
            <el-icon v-else size="80" color="#F56C6C"><CircleClose /></el-icon>
          </div>
          <h3>{{ paymentResult.success ? '支付成功' : '支付失败' }}</h3>
          <div class="result-details" v-if="paymentResult.success">
            <p class="amount">{{ formatCurrency(paymentResult.amount) }}</p>
            <p class="merchant">{{ paymentInfo.merchantName }}</p>
            <p class="transaction-id">交易号: {{ paymentResult.transactionId }}</p>
            <p class="timestamp">{{ formatDateTime(paymentResult.timestamp) }}</p>
          </div>
          <div class="result-error" v-else>
            <p>{{ paymentResult.errorMessage }}</p>
          </div>
        </div>
        
        <template #footer>
          <div class="result-actions">
            <el-button v-if="paymentResult.success" @click="shareReceipt">
              <el-icon><Document /></el-icon>
              分享收据
            </el-button>
            <el-button v-if="!paymentResult.success" @click="retryPayment">
              <el-icon><Refresh /></el-icon>
              重试支付
            </el-button>
            <el-button @click="resetPayment">
              完成
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Camera, Search, VideoCamera, RefreshRight, VideoPause, 
  Picture, Warning, CircleCheck, CircleClose, Document, Refresh, Key, Hide, View
} from '@element-plus/icons-vue'

// 相机状态
const cameraPermissionGranted = ref(false)
const requestingPermission = ref(false)
const cameraActive = ref(false)
const startingCamera = ref(false)
const availableCameras = ref<MediaDeviceInfo[]>([])
const currentCameraIndex = ref(0)

// DOM 元素
const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()
const fileInput = ref<HTMLInputElement>()

// 扫描结果
const scanResult = ref('')
const isValidPaymentQR = ref(false)
const paymentInfo = reactive({
  merchantName: '',
  amount: 0,
  description: '',
  merchantId: '',
  timestamp: ''
})

// 支付确认
const showPaymentConfirm = ref(false)
const paymentDialogVisible = ref(false)
const paymentForm = reactive({
  amount: 0,
  originalAmount: 0
})

// 密码输入
const showPasswordInput = ref(false)
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  password: ''
})
const showPassword = ref(false)
const passwordError = ref('')
const isPasswordValid = ref(false)
const supportsBiometric = ref(false)

// 支付结果
const showPaymentResult = ref(false)
const resultDialogVisible = ref(false)
const processing = ref(false)
const paymentResult = reactive({
  success: false,
  amount: 0,
  transactionId: '',
  timestamp: '',
  errorMessage: ''
})

// 定时器
let scanTimer: NodeJS.Timeout | null = null
let stream: MediaStream | null = null

// 初始化
onMounted(() => {
  checkCameraSupport()
  checkBiometricSupport()
})

// 清理资源
onUnmounted(() => {
  stopCamera()
  if (scanTimer) {
    clearInterval(scanTimer)
  }
})

// 检查相机支持
const checkCameraSupport = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      ElMessage.error('您的浏览器不支持相机功能')
      return
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')
    
    if (availableCameras.value.length === 0) {
      ElMessage.error('未检测到可用相机')
    }
  } catch (error) {
    console.error('检查相机失败:', error)
    ElMessage.error('检查相机失败')
  }
}

// 检查生物识别支持
const checkBiometricSupport = () => {
  supportsBiometric.value = 'credentials' in navigator
}

// 请求相机权限
const requestCameraPermission = async () => {
  requestingPermission.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    cameraPermissionGranted.value = true
    stream.getTracks().forEach(track => track.stop())
    ElMessage.success('相机权限已获得')
  } catch (error) {
    console.error('相机权限请求失败:', error)
    ElMessage.error('相机权限请求失败，请检查浏览器设置')
  } finally {
    requestingPermission.value = false
  }
}

// 启动相机
const startCamera = async () => {
  if (!cameraPermissionGranted.value) {
    ElMessage.warning('请先授权相机权限')
    return
  }
  
  startingCamera.value = true
  try {
    const constraints = {
      video: {
        deviceId: availableCameras.value[currentCameraIndex.value]?.deviceId,
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    }
    
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      cameraActive.value = true
      startScanning()
      ElMessage.success('相机启动成功')
    }
  } catch (error) {
    console.error('启动相机失败:', error)
    ElMessage.error('启动相机失败')
  } finally {
    startingCamera.value = false
  }
}

// 停止相机
const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  cameraActive.value = false
  if (scanTimer) {
    clearInterval(scanTimer)
    scanTimer = null
  }
}

// 切换相机
const switchCamera = () => {
  if (availableCameras.value.length <= 1) return
  
  stopCamera()
  currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length
  
  setTimeout(() => {
    startCamera()
  }, 500)
}

// 开始扫描
const startScanning = () => {
  if (scanTimer) {
    clearInterval(scanTimer)
  }
  
  scanTimer = setInterval(() => {
    scanFrame()
  }, 100)
}

// 扫描帧
const scanFrame = () => {
  if (!videoElement.value || !canvasElement.value || !cameraActive.value) return
  
  const video = videoElement.value
  const canvas = canvasElement.value
  const context = canvas.getContext('2d')
  
  if (!context) return
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  // 这里应该集成实际的二维码识别库
  // 为了演示，模拟扫描结果
  simulateQRCodeDetection()
}

// 模拟二维码检测
const simulateQRCodeDetection = () => {
  // 模拟检测到支付二维码
  if (Math.random() < 0.02) { // 2% 概率触发
    const mockQRCode = JSON.stringify({
      merchantId: 'merchant_123',
      merchantName: '宿舍管理系统',
      amount: 50.00,
      description: '水电费缴费',
      timestamp: new Date().toISOString()
    })
    
    handleScanResult(mockQRCode)
    stopScanning()
  }
}

// 停止扫描
const stopScanning = () => {
  if (scanTimer) {
    clearInterval(scanTimer)
    scanTimer = null
  }
}

// 从文件选择图片扫描
const scanFromFile = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      // 这里应该集成实际的二维码识别库
      // 为了演示，模拟扫描结果
      const mockQRCode = JSON.stringify({
        merchantId: 'merchant_123',
        merchantName: '宿舍管理系统',
        amount: 25.50,
        description: '网费缴费',
        timestamp: new Date().toISOString()
      })
      handleScanResult(mockQRCode)
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 处理扫描结果
const handleScanResult = (result: string) => {
  scanResult.value = result
  
  try {
    const data = JSON.parse(result)
    
    // 验证支付二维码格式
    if (data.merchantId && data.merchantName && typeof data.amount === 'number') {
      isValidPaymentQR.value = true
      Object.assign(paymentInfo, data)
      paymentForm.originalAmount = data.amount
      paymentForm.amount = data.amount
      ElMessage.success('二维码识别成功')
    } else {
      isValidPaymentQR.value = false
      ElMessage.warning('二维码格式无效')
    }
  } catch (error) {
    isValidPaymentQR.value = false
    ElMessage.warning('二维码解析失败')
  }
}

// 重置扫描
const resetScan = () => {
  scanResult.value = ''
  isValidPaymentQR.value = false
  Object.assign(paymentInfo, {
    merchantName: '',
    amount: 0,
    description: '',
    merchantId: '',
    timestamp: ''
  })
  startScanning()
}

// 确认支付
const confirmPayment = () => {
  showPaymentConfirm.value = true
  paymentDialogVisible.value = true
}

// 验证支付金额
const validatePaymentAmount = (value: number) => {
  if (value <= 0) {
    ElMessage.error('支付金额必须大于0')
    return false
  }
  if (value > 10000) {
    ElMessage.error('单笔支付金额不能超过10000元')
    return false
  }
  return true
}

// 计算手续费
const calculateFee = (amount: number) => {
  return amount * 0.006 // 0.6% 手续费
}

// 进入密码输入
const proceedToPassword = () => {
  if (!validatePaymentAmount(paymentForm.amount)) return
  
  paymentDialogVisible.value = false
  showPasswordInput.value = true
  passwordDialogVisible.value = true
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 验证密码
const validatePassword = () => {
  passwordError.value = ''
  isPasswordValid.value = passwordForm.password.length === 6 && /^\d+$/.test(passwordForm.password)
}

// 使用生物识别
const useBiometricAuth = async () => {
  try {
    // 这里应该集成实际的生物识别 API
    ElMessage.info('生物识别功能开发中')
  } catch (error) {
    ElMessage.error('生物识别失败')
  }
}

// 确认支付密码
const confirmPaymentPassword = async () => {
  if (!isPasswordValid.value) {
    ElMessage.error('请输入6位数字密码')
    return
  }
  
  processing.value = true
  
  try {
    // 模拟支付处理
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟支付结果
    const success = Math.random() > 0.1 // 90% 成功率
    
    Object.assign(paymentResult, {
      success,
      amount: paymentForm.amount + calculateFee(paymentForm.amount),
      transactionId: success ? `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}` : '',
      timestamp: new Date().toISOString(),
      errorMessage: success ? '' : '支付处理失败，请重试'
    })
    
    passwordDialogVisible.value = false
    showPaymentResult.value = true
    resultDialogVisible.value = true
    
    if (success) {
      ElMessage.success('支付成功')
    } else {
      ElMessage.error('支付失败')
    }
    
  } catch (error) {
    ElMessage.error('支付处理失败')
  } finally {
    processing.value = false
  }
}

// 分享收据
const shareReceipt = () => {
  if (navigator.share) {
    navigator.share({
      title: '支付收据',
      text: `支付 ${formatCurrency(paymentResult.amount)} 给 ${paymentInfo.merchantName}`,
      url: window.location.href
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(`支付收据\n金额: ${formatCurrency(paymentResult.amount)}\n商户: ${paymentInfo.merchantName}\n交易号: ${paymentResult.transactionId}`)
    ElMessage.success('收据信息已复制到剪贴板')
  }
}

// 重试支付
const retryPayment = () => {
  resultDialogVisible.value = false
  passwordDialogVisible.value = true
}

// 重置支付
const resetPayment = () => {
  resultDialogVisible.value = false
  showPaymentResult.value = false
  showPasswordInput.value = false
  showPaymentConfirm.value = false
  resetScan()
  
  // 重置表单
  passwordForm.password = ''
  paymentForm.amount = 0
  paymentForm.originalAmount = 0
}

// 工具函数
const formatCurrency = (amount: number) => {
  return `¥${amount.toFixed(2)}`
}

const formatDateTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.payment-scan {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  color: #409EFF;
}

/* 相机权限区域 */
.camera-section {
  background: white;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.camera-permission {
  padding: 40px;
}

.permission-icon {
  margin-bottom: 20px;
}

.camera-permission h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.camera-permission p {
  margin: 0 0 32px 0;
  color: #606266;
  line-height: 1.6;
}

.camera-controls {
  padding: 40px;
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 相机视图 */
.camera-view {
  position: relative;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.camera-container video {
  width: 100%;
  height: auto;
  display: block;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
}

.scan-frame {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px solid #409EFF;
  border-radius: 8px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #409EFF;
}

.corner.top-left {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
  border-radius: 8px 0 0 0;
}

.corner.top-right {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
  border-radius: 0 8px 0 0;
}

.corner.bottom-left {
  bottom: -3px;
  left: -3px;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 8px;
}

.corner.bottom-right {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 8px 0;
}

.scan-tip {
  margin-top: 24px;
  color: white;
  font-size: 14px;
}

.scan-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

/* 扫描结果 */
.scan-result {
  margin-bottom: 20px;
}

.result-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-content {
  text-align: center;
  padding: 20px;
}

.payment-info h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.payment-info .amount {
  font-size: 32px;
  font-weight: 700;
  color: #f56c6c;
  margin: 0 0 16px 0;
}

.payment-info .description {
  color: #606266;
  margin: 0;
}

.error-info {
  color: #f56c6c;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 支付确认 */
.payment-summary {
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.payment-summary .amount {
  color: #f56c6c;
  font-weight: 600;
}

.total-amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}

/* 密码输入 */
.password-container {
  padding: 20px 0;
}

.password-input-group {
  margin-bottom: 24px;
}

.password-input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
}

.password-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.biometric-option {
  text-align: center;
  margin: 24px 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  margin-top: 16px;
}

/* 支付结果 */
.result-content {
  text-align: center;
  padding: 40px 20px;
}

.result-content.success {
  color: #67C23A;
}

.result-content.failed {
  color: #F56C6C;
}

.result-icon {
  margin-bottom: 20px;
}

.result-content h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
}

.result-details .amount {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.result-details .merchant {
  color: #606266;
  margin: 0 0 16px 0;
}

.result-details .transaction-id {
  color: #909399;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.result-details .timestamp {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.result-error {
  color: #f56c6c;
  margin: 16px 0;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-scan {
    padding: 12px;
  }
  
  .camera-container {
    max-width: 100%;
  }
  
  .scan-frame {
    width: 160px;
    height: 160px;
  }
  
  .scan-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .password-field {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>