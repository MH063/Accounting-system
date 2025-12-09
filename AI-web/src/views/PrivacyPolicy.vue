<template>
  <div class="privacy-policy">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" title="返回">
            <template #content>
              <span class="page-title">隐私政策</span>
            </template>
          </el-page-header>
        </div>
      </template>
      
      <div class="policy-content">
        <div class="policy-header">
          <h1>记账宝隐私政策</h1>
          <p class="last-updated">最后更新时间：2024年1月1日</p>
        </div>
        
        <div class="policy-body">
          <el-scrollbar height="calc(100vh - 250px)">
            <div class="policy-section">
              <h2>一、引言</h2>
              <p>记账宝开发团队（以下简称"我们"）非常重视用户隐私和个人信息保护。本隐私政策旨在向您说明我们在您使用记账宝（以下简称"本系统"）时如何收集、使用、存储、传输和保护您的个人信息，以及您享有的权利。</p>
              <p>请您在使用本系统前仔细阅读并理解本隐私政策。如果您不同意本隐私政策的任何内容，请立即停止使用本系统。</p>
            </div>
            
            <div class="policy-section">
              <h2>二、信息收集</h2>
              <h3>1. 注册信息</h3>
              <p>当您注册本系统账户时，我们会收集以下信息：</p>
              <ul>
                <li>用户名</li>
                <li>电子邮箱</li>
                <li>密码（加密存储）</li>
                <li>注册时间</li>
              </ul>
              
              <h3>2. 使用信息</h3>
              <p>在您使用本系统过程中，我们会收集以下信息：</p>
              <ul>
                <li>设备信息（操作系统、浏览器类型、IP地址等）</li>
                <li>使用行为（访问时间、功能使用情况、操作日志等）</li>
                <li>费用数据（您主动录入的费用信息、账单信息等）</li>
                <li>寝室信息（您创建或加入的寝室相关信息）</li>
              </ul>
              
              <h3>3. 位置信息</h3>
              <p>为了提供更好的服务，我们可能会收集您的大致地理位置信息，但不会收集精确的位置信息。</p>
            </div>
            
            <div class="policy-section">
              <h2>三、信息使用</h2>
              <p>我们仅在以下情况下使用您的个人信息：</p>
              <ol>
                <li>为您提供本系统的核心功能服务</li>
                <li>改善和优化本系统的用户体验</li>
                <li>保障系统安全，防范欺诈和滥用行为</li>
                <li>向您发送重要通知（如系统维护、功能更新等）</li>
                <li>根据法律法规要求履行法定义务</li>
              </ol>
            </div>
            
            <div class="policy-section">
              <h2>四、信息披露</h2>
              <p>我们承诺不会将您的个人信息出售给第三方。但在以下情况下，我们可能会披露您的信息：</p>
              <ol>
                <li>获得您的明确授权</li>
                <li>根据法律法规要求或政府主管部门依法调查</li>
                <li>为保护本系统及其用户的合法权益</li>
                <li>在涉及合并、收购或资产转让时，转移相关信息</li>
              </ol>
            </div>
            
            <div class="policy-section">
              <h2>五、信息存储</h2>
              <p>1. 我们将采取合理的技术手段和管理措施保护您的个人信息安全，防止数据泄露、损毁或丢失。</p>
              <p>2. 您的个人信息将存储在中国境内的服务器上，除非获得您的授权或法律法规另有规定。</p>
              <p>3. 我们仅在实现本隐私政策所述目的所需的期限内保留您的个人信息，除非法律要求或允许延长保留期。</p>
            </div>
            
            <div class="policy-section">
              <h2>六、信息安全</h2>
              <p>1. 我们采用加密技术保护您的个人信息传输安全。</p>
              <p>2. 我们建立了完善的访问控制机制，限制员工接触用户个人信息。</p>
              <p>3. 我们定期对系统进行安全评估和漏洞修复。</p>
              <p>4. 尽管我们采取了合理的安全措施，但互联网传输仍存在风险，请您理解。</p>
            </div>
            
            <div class="policy-section">
              <h2>七、您的权利</h2>
              <p>您享有以下权利：</p>
              <ol>
                <li>访问和更正您的个人信息</li>
                <li>删除您的个人信息</li>
                <li>撤回已同意的授权</li>
                <li>注销您的账户</li>
                <li>获取个人信息副本</li>
              </ol>
              <p>如需行使上述权利，请通过本政策末尾提供的联系方式与我们联系。</p>
            </div>
            
            <div class="policy-section">
              <h2>八、未成年人保护</h2>
              <p>1. 本系统不专门面向未满14周岁的未成年人提供服务。</p>
              <p>2. 如我们发现未满14周岁的未成年人在未经监护人同意的情况下使用本系统，我们将采取措施删除相关信息。</p>
            </div>
            
            <div class="policy-section">
              <h2>九、Cookie和同类技术</h2>
              <p>1. 为提升用户体验，我们会在您的设备上存储小型数据文件（Cookie）。</p>
              <p>2. 您可以通过浏览器设置拒绝或删除Cookie，但这可能影响部分功能的正常使用。</p>
            </div>
            
            <div class="policy-section">
              <h2>十、政策变更</h2>
              <p>1. 我们可能会适时修订本隐私政策，变更后的政策将通过系统公告等方式告知您。</p>
              <p>2. 未经您明确同意，我们不会削减您依据当前隐私政策所享有的权利。</p>
              <p>3. 对重大变更，我们会提供更显著的通知，如系统弹窗、发送邮件等。</p>
            </div>
            
            <div class="policy-section">
              <h2>十一、联系我们</h2>
              <p>如您对本隐私政策有任何疑问、意见或建议，可通过以下方式与我们联系：</p>
              <p><strong>电子邮件：</strong>privacy@accountingsystem.com</p>
              <p><strong>联系电话：</strong>400-123-4567</p>
              <p><strong>联系地址：</strong>中国北京市朝阳区xxx街道xxx号</p>
              <p>我们将在15个工作日内回复您的请求。</p>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.privacy-policy {
  padding: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.policy-header {
  text-align: center;
  margin-bottom: 30px;
}

.policy-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.last-updated {
  color: #909399;
  font-size: 14px;
}

.policy-section {
  margin-bottom: 30px;
}

.policy-section h2 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.policy-section h3 {
  color: #606266;
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.policy-section p {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 15px;
  text-align: justify;
}

.policy-section ul,
.policy-section ol {
  color: #606266;
  line-height: 1.8;
  margin: 15px 0 15px 30px;
}

.policy-section li {
  margin-bottom: 10px;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  display: none;
}
</style>