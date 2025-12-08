<template>
  <div class="user-detail-default-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户详情</span>
        </div>
      </template>

      <div class="user-detail-default">
        <el-empty description="请先选择要查看的用户">
          <template #image>
            <el-icon size="100" color="#409EFF">
              <User />
            </el-icon>
          </template>
          <el-button type="primary" @click="goToUserList">前往用户列表</el-button>
        </el-empty>
        
        <div class="tips" style="margin-top: 30px;">
          <el-alert
            title="使用说明"
            type="info"
            :closable="false"
          >
            <p>要查看用户详情，请按以下步骤操作：</p>
            <ol>
              <li>点击"前往用户列表"或使用左侧菜单"用户管理 → 用户列表"</li>
              <li>在用户列表中找到需要查看的用户</li>
              <li>点击该用户行的"查看"按钮进入详情页面</li>
            </ol>
          </el-alert>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { User } from '@element-plus/icons-vue'

// 路由器实例
const router = useRouter()

// 跳转到用户列表
const goToUserList = () => {
  router.push('/users')
}

/**
 * 用户详情默认页面
 * 引导用户从用户列表选择用户查看详情
 */
</script>

<style scoped>
.user-detail-default-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-detail-default {
  padding: 40px 20px;
  text-align: center;
}

.tips {
  max-width: 500px;
  margin: 0 auto;
}

.tips p {
  margin: 10px 0;
  text-align: left;
}

.tips ol {
  text-align: left;
  padding-left: 20px;
}

.tips li {
  margin: 8px 0;
}
</style>