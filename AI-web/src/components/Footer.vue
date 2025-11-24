<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于我们</h4>
          <p>记账系统是一个智能化的寝室管理系统，为您提供便捷的生活服务。</p>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p>邮箱: support@aiweb.com</p>
          <p>电话: 400-123-4567</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} 记账系统. 保留所有权利。</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 当前年份
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  background-color: #f5f7fa;
  padding: 40px 0 20px;
  color: #606266;
  width: 100%;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.footer-section {
  flex: 1;
  margin-right: 20px;
}

.footer-section:last-child {
  margin-right: 0;
}

.footer-section h4 {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 15px;
  font-weight: 600;
}

.footer-section p {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section li {
  margin-bottom: 8px;
}

.footer-section a {
  color: #606266;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: #409eff;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-container {
    padding: 0 15px;
  }
  
  .footer-content {
    flex-direction: column;
  }
  
  .footer-section {
    margin-right: 0;
    margin-bottom: 20px;
  }
}
</style>