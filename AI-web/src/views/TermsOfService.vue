<template>
  <div class="terms-of-service">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" title="返回">
            <template #content>
              <span class="page-title">服务条款</span>
            </template>
          </el-page-header>
        </div>
      </template>
      
      <div class="terms-content">
        <div class="terms-header">
          <h1>记账系统服务条款</h1>
          <p class="last-updated">最后更新时间：2024年1月1日</p>
        </div>
        
        <div class="terms-body">
          <el-scrollbar height="calc(100vh - 250px)">
            <div class="terms-section">
              <h2>一、服务概述</h2>
              <p>记账系统（以下简称"本系统"）是由记账系统开发团队（以下简称"我们"）开发和运营的在线费用管理服务平台。本服务条款（以下简称"本条款"）规定了您使用本系统服务的相关条件和规则。</p>
            </div>
            
            <div class="terms-section">
              <h2>二、服务内容</h2>
              <p>1. 寝室管理：创建和管理寝室信息，邀请成员加入</p>
              <p>2. 成员管理：添加、删除寝室成员，设置成员权限</p>
              <p>3. 费用管理：记录、分类、分摊各类费用支出</p>
              <p>4. 账单管理：生成、查看、管理寝室账单</p>
              <p>5. 支付功能：支持多种支付方式完成账单支付</p>
              <p>6. 统计分析：提供费用统计、趋势分析等数据服务</p>
              <p>7. 通知提醒：发送账单到期、支付成功等系统通知</p>
            </div>
            
            <div class="terms-section">
              <h2>三、服务使用</h2>
              <h3>1. 注册与账户</h3>
              <p>使用本系统服务需注册账户，您同意：</p>
              <ul>
                <li>提供真实、准确、完整的注册信息</li>
                <li>及时更新注册信息，保持其准确性</li>
                <li>妥善保管账户密码，不与他人共享</li>
                <li>对账户下的一切行为承担法律责任</li>
              </ul>
              
              <h3>2. 服务使用规范</h3>
              <p>您在使用本系统服务时，承诺遵守以下规范：</p>
              <ul>
                <li>不得利用本系统从事任何违法活动</li>
                <li>不得上传含有病毒、木马等有害内容</li>
                <li>不得恶意攻击、破解本系统</li>
                <li>不得干扰其他用户的正常使用</li>
                <li>不得虚构、篡改费用数据</li>
                <li>不得侵犯他人的合法权益</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h2>四、服务费用</h2>
              <p>1. 本系统目前为免费提供，未来可能推出付费增值服务。</p>
              <p>2. 任何付费服务将另行制定收费规则，并在服务开通前通知用户。</p>
              <p>3. 用户应按照约定及时足额支付相关费用。</p>
            </div>
            
            <div class="terms-section">
              <h2>五、服务质量</h2>
              <p>1. 我们致力于提供稳定、可靠的服务，但不保证服务绝对无故障。</p>
              <p>2. 我们将根据技术发展和业务需要不断优化服务功能。</p>
              <p>3. 我们有权在必要时对服务进行维护、升级或调整。</p>
            </div>
            
            <div class="terms-section">
              <h2>六、服务变更与终止</h2>
              <h3>1. 服务变更</h3>
              <p>我们有权根据业务发展需要变更服务内容，包括：</p>
              <ul>
                <li>增加、减少或调整功能模块</li>
                <li>修改服务界面和交互方式</li>
                <li>调整服务参数和限制条件</li>
              </ul>
              
              <h3>2. 服务终止</h3>
              <p>在以下情况下，我们有权终止向您提供服务：</p>
              <ul>
                <li>您违反了本条款的任何规定</li>
                <li>您长期未使用本系统服务</li>
                <li>因技术、法律等原因无法继续提供服务</li>
              </ul>
            </div>
            
            <div class="terms-section">
              <h2>七、责任限制</h2>
              <p>1. 因不可抗力导致的服务中断或数据丢失，我们不承担责任。</p>
              <p>2. 因第三方服务（如支付机构）原因造成的损失，我们不承担责任。</p>
              <p>3. 用户因自身操作失误或设备故障导致的损失，我们不承担责任。</p>
              <p>4. 我们不对任何间接、附带或特殊的损害承担责任。</p>
            </div>
            
            <div class="terms-section">
              <h2>八、知识产权</h2>
              <p>1. 本系统的全部知识产权（包括但不限于商标、专利、著作权等）归我们所有。</p>
              <p>2. 您在使用本系统过程中产生的数据内容，其知识产权归您本人所有。</p>
              <p>3. 未经我们书面授权，您不得复制、修改、传播本系统的任何内容。</p>
            </div>
            
            <div class="terms-section">
              <h2>九、数据安全</h2>
              <p>1. 我们采用行业标准的安全技术保护用户数据。</p>
              <p>2. 我们不会向无关第三方出售或泄露用户数据。</p>
              <p>3. 更多数据保护细节请参阅《隐私政策》。</p>
            </div>
            
            <div class="terms-section">
              <h2>十、争议解决</h2>
              <p>1. 本条款适用中华人民共和国法律。</p>
              <p>2. 因本条款引起的争议，双方应友好协商解决。</p>
              <p>3. 协商不成的，任何一方可向本系统运营方所在地人民法院提起诉讼。</p>
            </div>
            
            <div class="terms-section">
              <h2>十一、其他规定</h2>
              <p>1. 本条款构成双方之间的完整协议，取代此前所有口头或书面约定。</p>
              <p>2. 本条款的任何条款部分无效不影响其他条款的有效性。</p>
              <p>3. 本条款未尽事宜，双方可另行签订补充协议。</p>
              <p>4. 我们有权随时修改本条款，修改后的条款一经公布即生效。</p>
            </div>
            
            <div class="terms-section">
              <h2>十二、联系我们</h2>
              <p>如您对本服务条款有任何疑问，请通过以下方式与我们联系：</p>
              <p><strong>电子邮件：</strong>service@accountingsystem.com</p>
              <p><strong>联系电话：</strong>400-123-4567</p>
              <p><strong>联系地址：</strong>中国北京市朝阳区xxx街道xxx号</p>
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
.terms-of-service {
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

.terms-header {
  text-align: center;
  margin-bottom: 30px;
}

.terms-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.last-updated {
  color: #909399;
  font-size: 14px;
}

.terms-section {
  margin-bottom: 30px;
}

.terms-section h2 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.terms-section h3 {
  color: #606266;
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 500;
}

.terms-section p {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 15px;
  text-align: justify;
}

.terms-section ul {
  color: #606266;
  line-height: 1.8;
  margin: 15px 0 15px 30px;
}

.terms-section li {
  margin-bottom: 10px;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  display: none;
}
</style>