<template>
  <div class="user-agreement">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" title="返回">
            <template #content>
              <span class="page-title">用户协议</span>
            </template>
          </el-page-header>
        </div>
      </template>
      
      <div class="agreement-content">
        <div class="agreement-header">
          <h1>记账宝用户协议</h1>
          <p class="last-updated">最后更新时间：2024年1月1日</p>
        </div>
        
        <div class="agreement-body">
          <el-scrollbar height="calc(100vh - 250px)">
            <div class="agreement-section">
              <h2>一、协议接受</h2>
              <p>欢迎使用记账宝（以下简称"本系统"）。本用户协议（以下简称"本协议"）是您与记账宝开发团队（以下简称"我们"）之间就使用本系统服务所订立的协议。</p>
              <p>在使用本系统之前，请您仔细阅读本协议的全部内容。如果您不同意本协议的任意内容，请立即停止使用本系统。当您注册成为本系统的用户或开始使用本系统的服务时，即表示您已充分理解并同意接受本协议的全部内容。</p>
            </div>
            
            <div class="agreement-section">
              <h2>二、服务内容</h2>
              <p>1. 本系统为用户提供寝室费用管理、账单生成、成员管理、统计分析等服务。</p>
              <p>2. 我们有权根据实际情况变更、中断或终止部分或全部服务，无需事先通知用户。</p>
              <p>3. 我们有权根据实际需要对服务内容进行调整，包括但不限于增加、减少或修改功能模块。</p>
            </div>
            
            <div class="agreement-section">
              <h2>三、用户账户</h2>
              <p>1. 用户在注册时应提供真实、准确、完整的个人信息，并及时更新相关信息。</p>
              <p>2. 用户应妥善保管账户密码，对账户下的所有行为承担责任。</p>
              <p>3. 用户不得将账户转让、出售或出借给他人使用。</p>
              <p>4. 若发现账户存在安全风险，我们有权暂停或终止该账户的使用。</p>
            </div>
            
            <div class="agreement-section">
              <h2>四、用户义务</h2>
              <p>1. 用户应遵守国家法律法规及社会公德，不得利用本系统从事违法活动。</p>
              <p>2. 用户不得上传含有病毒、木马等有害程序的内容。</p>
              <p>3. 用户不得恶意攻击、破解本系统，不得干扰其他用户的正常使用。</p>
              <p>4. 用户应如实填报费用信息，不得虚构、篡改数据。</p>
            </div>
            
            <div class="agreement-section">
              <h2>五、数据隐私</h2>
              <p>1. 我们尊重并保护用户的隐私权，详细内容请参阅《隐私政策》。</p>
              <p>2. 用户在使用本系统过程中产生的数据归用户所有，我们仅在提供服务所需范围内使用。</p>
              <p>3. 未经用户授权，我们不会向第三方披露用户数据，法律法规另有规定的除外。</p>
            </div>
            
            <div class="agreement-section">
              <h2>六、知识产权</h2>
              <p>1. 本系统的全部知识产权归记账宝开发团队所有。</p>
              <p>2. 用户在使用本系统过程中不得侵犯我们的知识产权。</p>
              <p>3. 用户通过本系统生成的内容，其知识产权归属用户本人。</p>
            </div>
            
            <div class="agreement-section">
              <h2>七、免责声明</h2>
              <p>1. 因不可抗力导致的服务中断，我们不承担任何责任。</p>
              <p>2. 因网络环境、设备故障等原因造成的数据丢失，我们不承担赔偿责任。</p>
              <p>3. 用户因自身操作失误导致的损失，我们不承担赔偿责任。</p>
            </div>
            
            <div class="agreement-section">
              <h2>八、协议变更</h2>
              <p>1. 我们有权随时修改本协议内容，修改后的协议一经公布即生效。</p>
              <p>2. 若用户不同意修改后的协议，应立即停止使用本系统服务。</p>
              <p>3. 若用户继续使用本系统服务，则视为同意接受修改后的协议。</p>
            </div>
            
            <div class="agreement-section">
              <h2>九、争议解决</h2>
              <p>1. 本协议适用中华人民共和国法律。</p>
              <p>2. 因本协议引起的争议，双方应友好协商解决。</p>
              <p>3. 协商不成的，任何一方可向本系统运营方所在地人民法院提起诉讼。</p>
            </div>
            
            <div class="agreement-section">
              <h2>十、其他</h2>
              <p>1. 本协议构成双方对本系统使用的完整协议，取代此前所有口头或书面约定。</p>
              <p>2. 本协议的任何条款部分无效不影响其他条款的有效性。</p>
              <p>3. 本协议未尽事宜，双方可另行签订补充协议，补充协议与本协议具有同等效力。</p>
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
.user-agreement {
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

.agreement-header {
  text-align: center;
  margin-bottom: 30px;
}

.agreement-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.last-updated {
  color: #909399;
  font-size: 14px;
}

.agreement-section {
  margin-bottom: 30px;
}

.agreement-section h2 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.agreement-section p {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 15px;
  text-align: justify;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  display: none;
}
</style>