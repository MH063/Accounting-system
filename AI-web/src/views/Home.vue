<template>
  <div class="home-container">
    <!-- Hero Section with Modern Background -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="gradient-overlay"></div>
        <div class="bg-pattern"></div>
      </div>
      
      <div class="hero-content">
        <div class="hero-inner">
          <h1 class="hero-title">
            <span class="highlight">智能化</span>记账系统
          </h1>
          <p class="hero-subtitle">让寝室财务管理变得简单、透明、高效</p>
          <div class="hero-buttons">
            <router-link to="/login" class="btn btn-primary">
              <span>立即登录</span>
              <el-icon><ArrowRight /></el-icon>
            </router-link>
            <a href="#features" class="btn btn-secondary">
              <span>了解更多</span>
            </a>
          </div>
        </div>
      </div>
      
      <div class="scroll-hint">
        <div class="scroll-line"></div>
        <span>向下滚动</span>
      </div>
    </section>
    
    <div id="features" class="features">
      <div class="section-title">
        <h2 class="section-heading">
          <span class="heading-accent">核心功能</span>
        </h2>
        <p class="section-description">全方位提升寝室生活体验，让每一分钱都花得明明白白</p>
        <div class="heading-underline"></div>
      </div>
      
      <div class="features-grid">
        <div class="feature-card" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon-wrapper">
            <div class="feature-icon">
              <component :is="feature.icon" :size="32" />
            </div>
            <div class="icon-glow"></div>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
          <div class="feature-link">
            <span>了解更多</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
    
    <div class="how-it-works">
      <div class="section-title">
        <h2 class="section-heading">
          <span class="heading-accent">使用流程</span>
        </h2>
        <p class="section-description">简单三步，开启智能寝室财务管理</p>
        <div class="heading-underline"></div>
      </div>
      
      <div class="steps-container">
        <div class="steps-connector"></div>
        <div class="steps">
          <div class="step" v-for="(step, index) in steps" :key="index">
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    

    
    <div class="cta-section">
      <div class="cta-container">
        <div class="cta-content">
          <h2 class="cta-heading">准备好开始了吗？</h2>
          <p class="cta-description">立即加入我们，体验智能化的寝室财务管理</p>
          <router-link to="/login" class="cta-button large primary">
            <span>立即开始</span>
            <div class="button-glow"></div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { House, User, Money, DataAnalysis, ArrowRight } from '@element-plus/icons-vue'

// 功能数据
const features = ref([
  {
    icon: House,
    title: '寝室管理',
    description: '便捷的寝室信息管理，让生活更有序，支持多人协作'
  },
  {
    icon: User,
    title: '成员管理',
    description: '轻松管理寝室成员信息，增进室友关系，提升沟通效率'
  },
  {
    icon: Money,
    title: '费用管理',
    description: '透明化费用记录，精准费用管理，让每一笔支出都清晰可见'
  },
  {
    icon: DataAnalysis,
    title: '统计分析',
    description: '可视化数据分析，洞察生活消费，帮助合理规划预算'
  }
])

// 步骤数据
const steps = ref([
  {
    title: '注册账号',
    description: '创建您的个人账号，开始使用系统'
  },
  {
    title: '添加寝室',
    description: '创建或加入寝室，邀请室友一起使用'
  },
  {
    title: '开始管理',
    description: '记录费用，分摊账单，享受智能生活'
  }
])



// 页面加载动画
onMounted(() => {
  // 页面刷新后自动滚动到"智能化记账系统"标题位置
  const scrollToTitle = () => {
    const heroTitle = document.querySelector('.hero-title') as HTMLElement
    if (heroTitle) {
      const rect = heroTitle.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const targetPosition = scrollTop + rect.top - 550 // 稍微向上偏移550px
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
    }
  }
  
  // 稍微延迟执行，确保DOM完全渲染
  setTimeout(scrollToTitle, 100)
  
  // 添加滚动动画效果
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
      }
    })
  }, observerOptions)
  
  // 观察需要动画的元素
  document.querySelectorAll('.feature-card, .step').forEach(el => {
    observer.observe(el)
  })
})
</script>

<style scoped>
/* 全局样式变量 */
:root {
  --primary-color: #4f46e5;
  --primary-light: #818cf8;
  --primary-dark: #3730a3;
  --secondary-color: #06b6d4;
  --accent-color: #f59e0b;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-light: #f1f5f9;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}

/* 基础样式 */
.home-container {
  min-height: 100vh;
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0f172a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Hero 区域 - 现代化设计 */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 15%, #f093fb 30%, #4facfe 70%, #00f2fe 100%);
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1) 100%);
  opacity: 0.8;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
  background-size: 50px 50px;
  animation: patternMove 20s linear infinite;
}

@keyframes patternMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 10%;
  animation-delay: 5s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 10%;
  left: 30%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-inner {
  text-align: center;
  padding: 0 2rem;
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 400;
  margin-bottom: 2.5rem;
  color: #ffffff;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 255, 255, 0.1);
  animation: heroTitleIn 1.2s ease-out;
}

@keyframes heroTitleIn {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.highlight {
  background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #f9ca24 75%, #ff6b6b 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  display: inline-block;
  font-weight: 700;
  text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
  animation: highlightGlow 3s ease-in-out infinite alternate, colorShift 4s ease-in-out infinite;
}

@keyframes highlightGlow {
  0% {
    filter: drop-shadow(0 0 15px rgba(255, 107, 107, 0.4)) brightness(1);
    text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
  }
  100% {
    filter: drop-shadow(0 0 25px rgba(78, 205, 196, 0.6)) brightness(1.1);
    text-shadow: 0 0 40px rgba(78, 205, 196, 0.7);
  }
}

@keyframes colorShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.hero-subtitle {
  font-size: clamp(1.25rem, 3vw, 2.25rem);
  color: #ffffff;
  margin-bottom: 4rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.15);
  animation: heroSubtitleIn 1.5s ease-out 0.3s both;
}

@keyframes heroSubtitleIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: heroButtonsIn 1s ease-out 0.6s both;
}

@keyframes heroButtonsIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 现代化按钮样式 */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.2rem 3rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.125rem;
  text-decoration: none;
  transition: all 0.3s ease;
  overflow: hidden;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.75px;
  backdrop-filter: blur(10px);
  min-height: 3.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3);
  color: #ffffff;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.6);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(20px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
}

.scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
}

.scroll-line {
  width: 2px;
  height: 30px;
  background: linear-gradient(to bottom, transparent, #ffffff, transparent);
  animation: scrollLine 2s infinite;
}

.scroll-hint span {
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.25px;
  animation: scrollHint 2s infinite;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7), 0 2px 12px rgba(0, 0, 0, 0.5);
}

@keyframes scrollLine {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(5px);
  }
}

@keyframes scrollHint {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  40% {
    transform: translateY(-10px) rotate(45deg);
  }
  60% {
    transform: translateY(-5px) rotate(45deg);
  }
}

/* 通用区块样式 */
.section-title {
  text-align: center;
  margin-bottom: 5rem;
  position: relative;
}

.section-heading {
  font-size: clamp(2.2rem, 4.5vw, 3.5rem);
  font-weight: 400;
  margin-bottom: 1.5rem;
  color: #ffffff;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.1);
}

.heading-accent {
  position: relative;
  display: inline-block;
}

.heading-accent::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 2px;
}

.section-description {
  font-size: 1.375rem;
  color: #ffffff;
  max-width: 800px;
  margin: 2rem auto 0;
  line-height: 1.7;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.1);
}

.heading-underline {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  margin: 1.5rem auto 0;
  border-radius: 2px;
}

/* 功能区域 - 感官美学优化 */
.features {
  padding: 8rem 2rem;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #fecfef 75%, #fecfef 100%);
  position: relative;
  overflow: hidden;
}

.features::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
  background-size: 50px 50px;
  animation: featureBackgroundMove 30s linear infinite;
}

@keyframes featureBackgroundMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.feature-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  padding: 3.5rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(50px);
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.feature-card.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card:hover {
  transform: translateY(-15px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.feature-icon-wrapper {
  position: relative;
  margin-bottom: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  width: 95px;
  height: 95px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(2deg);
  }
}

.feature-icon:hover {
  transform: scale(1.1) rotate(5deg);
  animation: iconHover 0.6s ease-in-out;
}

@keyframes iconHover {
  0%, 100% {
    transform: scale(1.1) rotate(5deg);
  }
  50% {
    transform: scale(1.2) rotate(-2deg);
  }
}

.icon-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  width: calc(100% + 20px);
  height: calc(100% + 20px);
  background: radial-gradient(circle, rgba(255, 107, 107, 0.3) 0%, rgba(255, 107, 107, 0) 70%);
  border-radius: 25px;
  z-index: 1;
  animation: iconGlow 2s ease-in-out infinite alternate;
}

@keyframes iconGlow {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.feature-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.1);
}

.feature-description {
  font-size: 1.25rem;
  color: #ffffff;
  line-height: 1.7;
  margin-bottom: 2rem;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.1);
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffd700;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.feature-link:hover {
  gap: 0.75rem;
  background: rgba(255, 215, 0, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
}

/* 使用流程区域 - 感官美学优化 */
.how-it-works {
  padding: 8rem 2rem;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 25%, #d299c2 50%, #fef9d7 75%, #e2f0cb 100%);
  position: relative;
  overflow: hidden;
}

.how-it-works::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="0,0 100,0 50,100" fill="rgba(255,255,255,0.05)"/></svg>');
  background-size: 100px 100px;
  animation: workBackgroundMove 25s linear infinite;
}

@keyframes workBackgroundMove {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(100px, 100px) rotate(360deg); }
}

.steps-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  z-index: 1;
}

.steps-connector {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 4px;
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
  border-radius: 2px;
  z-index: 0;
  animation: connectorFlow 3s ease-in-out infinite;
}

@keyframes connectorFlow {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.3);
  }
}

.steps {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.step {
  flex: 1;
  text-align: center;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.step.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.step:nth-child(1) {
  transition-delay: 0.1s;
}

.step:nth-child(2) {
  transition-delay: 0.3s;
}

.step:nth-child(3) {
  transition-delay: 0.5s;
}

.step-number {
  width: 85px;
  height: 85px;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24);
  color: white;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 900;
  margin: 0 auto 2.5rem;
  box-shadow: 0 15px 35px rgba(255, 107, 107, 0.4);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: stepNumberFloat 4s ease-in-out infinite;
}

@keyframes stepNumberFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(1deg);
  }
}

.step-number::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.step-number:hover::before {
  left: 100%;
}

.step-number:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 20px 45px rgba(255, 107, 107, 0.6);
  animation: stepNumberHover 0.6s ease-in-out;
}

@keyframes stepNumberHover {
  0%, 100% {
    transform: scale(1.1) rotate(5deg);
  }
  50% {
    transform: scale(1.15) rotate(-2deg);
  }
}

.step-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.1);
}

.step-description {
  font-size: 1.125rem;
  color: #ffffff;
  line-height: 1.7;
  font-weight: 400;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3);
}



.author-role {
  font-size: 1rem;
  color: #ffffff;
  margin: 0.25rem 0 0 0;
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* CTA 区域 - 感官美学优化 */
.cta-section {
  padding: 8rem 2rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #3730a3 50%, #312e81 75%, #1e1b4b 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 25px 50px rgba(0, 0, 0, 0.3);
}

.cta-container {
  max-width: 800px;
  width: 100%;
  text-align: center;
  z-index: 1;
  position: relative;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><path d="M50,50 Q150,10 250,50 Q290,150 250,250 Q150,290 50,250 Q10,150 50,50 Z" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/></svg>');
  background-size: 300px 300px;
  animation: ctaBackground 50s linear infinite;
}

@keyframes ctaBackground {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(300px, 300px) rotate(360deg); }
}

.cta-content {
  flex: 1;
  max-width: 700px;
  z-index: 1;
  position: relative;
}

.cta-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  position: relative;
}

.visual-element {
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(255, 107, 107, 0.2) 0%, 
    rgba(78, 205, 196, 0.2) 30%,
    rgba(69, 183, 209, 0.2) 60%,
    transparent 80%);
  position: relative;
  animation: visualElementPulse 4s ease-in-out infinite;
}

@keyframes visualElementPulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
}

.visual-element::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(255, 215, 0, 0.3) 0%, 
    rgba(255, 107, 107, 0.2) 40%,
    transparent 70%);
  animation: visualElementInner 3s ease-in-out infinite alternate;
}

@keyframes visualElementInner {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}

.visual-element::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    rgba(255, 255, 255, 0.1) 0%, 
    transparent 70%);
  animation: visualElementCore 2s ease-in-out infinite;
}

@keyframes visualElementCore {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1) rotate(180deg);
  }
}

.cta-heading {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: 2rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px rgba(59, 130, 246, 0.3);
}



.cta-description {
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: 3rem;
  line-height: 1.6;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px rgba(59, 130, 246, 0.3);
}

.cta-section .btn-primary {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3);
  color: #ffffff;
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
  padding: 1.25rem 3rem;
  font-size: 1.25rem;
  border-radius: 50px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-section .btn-primary:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 25px 50px rgba(255, 107, 107, 0.6);
  animation: ctaButtonHover 0.6s ease-in-out;
}

@keyframes ctaButtonHover {
  0%, 100% {
    transform: translateY(-5px) scale(1.05);
  }
  50% {
    transform: translateY(-8px) scale(1.1);
  }
}

.cta-section .btn-primary::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem 3rem;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
  background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3);
  color: #ffffff;
}

.cta-button.large {
  padding: 2rem 4rem;
  font-size: 1.5rem;
  box-shadow: 0 20px 50px rgba(255, 107, 107, 0.5);
}

.cta-button.primary {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24, #ff9ff3);
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
}

.cta-button:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 25px 50px rgba(255, 107, 107, 0.6);
}

.cta-button.large:hover {
  transform: translateY(-8px) scale(1.08);
  box-shadow: 0 30px 60px rgba(255, 107, 107, 0.7);
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.cta-button:hover::before {
  left: 100%;
}

.cta-button .button-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.cta-button:hover .button-glow {
  opacity: 1;
}

.cta-button span {
  position: relative;
  z-index: 2;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .cta-container {
    max-width: 600px;
    padding: 0 2rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .cta-button {
    width: 100%;
    max-width: 300px;
  }
  
  .features, .how-it-works {
    padding: 4rem 1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .steps {
    flex-direction: column;
    gap: 2rem;
  }
  
  .steps-connector {
    width: 2px;
    height: 80%;
    top: 10%;
    left: 30px;
    transform: translateX(0);
  }
  
  .step {
    display: flex;
    align-items: flex-start;
    text-align: left;
    gap: 1.5rem;
  }
  
  .step-number {
    flex-shrink: 0;
    margin: 0;
  }
  
  .step-content {
    flex: 1;
    padding-top: 0.75rem;
  }
  
  .cta-section {
    padding: 4rem 1rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .section-heading {
    font-size: 1.75rem;
  }
  
  .section-description {
    font-size: 1rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
  
  .feature-icon {
    width: 60px;
    height: 60px;
  }
}
</style>