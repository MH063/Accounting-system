import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import Layout from './components/Layout.vue'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
import NotFound from './views/NotFound.vue'
import './style.css'

// 导入Vuex store
import store from './store'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('./views/Users.vue')
      },
      {
        path: '/user-detail',
        name: 'UserDetailDefault',
        component: () => import('./views/UserDetailDefault.vue')
      },
      {
        path: '/user-detail/:id',
        name: 'UserDetail',
        component: () => import('./views/UserDetail.vue'),
        props: true
      },
      {
        path: '/batch-operation',
        name: 'BatchOperation',
        component: () => import('./views/BatchOperation.vue')
      },
      {
        path: '/roles',
        name: 'Roles',
        component: () => import('./views/Roles.vue')
      },
      {
        path: '/dormitory-list',
        name: 'DormitoryList',
        component: () => import('./views/DormitoryList.vue')
      },
      {
        path: '/dormitory-detail',
        name: 'DormitoryDetail',
        component: () => import('./views/DormitoryDetail.vue'),
        props: true
      },
      {
        path: '/dormitory-detail/:id',
        name: 'DormitoryDetailWithId',
        component: () => import('./views/DormitoryDetail.vue'),
        props: true
      },
      {
        path: '/dormitory/create',
        name: 'DormitoryCreate',
        component: () => import('./views/DormitoryCreate.vue')
      },
      {
        path: '/expense-management',
        name: 'ExpenseManagement',
        component: () => import('./views/ExpenseManagement.vue')
      },
      {
        path: '/expense/create',
        name: 'ExpenseCreate',
        component: () => import('./views/ExpenseCreate.vue')
      },
      {
        path: '/expense/review',
        name: 'ExpenseReview',
        component: () => import('./views/ExpenseReview.vue')
      },
      {
        path: '/fee-detail',
        name: 'FeeDetail',
        component: () => import('./views/FeeDetail.vue'),
        props: true
      },
      {
        path: '/fee-detail/:id',
        name: 'FeeDetailWithId',
        component: () => import('./views/FeeDetail.vue'),
        props: true
      },
      {
        path: '/payment-record-monitor',
        name: 'PaymentRecordMonitor',
        component: () => import('./views/PaymentRecordMonitor.vue')
      },
      {
        path: '/payment-code-management',
        name: 'PaymentCodeManagement',
        component: () => import('./views/PaymentCodeManagement.vue')
      },
      {
        path: '/system-settings',
        name: 'SystemSettings',
        component: () => import('./views/SystemSettings.vue')
      },
      {
        path: '/fee-type-management',
        name: 'FeeTypeManagement',
        component: () => import('./views/FeeTypeManagement.vue')
      },
      {
        path: '/feature-control',
        name: 'FeatureControl',
        component: () => import('./views/FeatureControl.vue')
      },
      {
        path: '/new-feature-release',
        name: 'NewFeatureRelease',
        component: () => import('./views/NewFeatureRelease.vue')
      },
      {
        path: '/gray-release-control',
        name: 'GrayReleaseControl',
        component: () => import('./views/GrayReleaseControl.vue')
      },
      {
        path: '/realtime-dashboard',
        name: 'RealtimeDashboard',
        component: () => import('./views/RealtimeDashboard.vue')
      },
      {
        path: '/exception-alert',
        name: 'ExceptionAlert',
        component: () => import('./views/ExceptionAlert.vue')
      },
      {
        path: '/operation-audit',
        name: 'OperationAudit',
        component: () => import('./views/OperationAudit.vue')
      },
      {
        path: '/data-report',
        name: 'DataReport',
        component: () => import('./views/DataReport.vue')
      },
      {
        path: '/dispute-acceptance',
        name: 'DisputeAcceptance',
        component: () => import('./views/DisputeAcceptance.vue')
      },
      {
        path: '/arbitration-decision',
        name: 'ArbitrationDecision',
        component: () => import('./views/ArbitrationDecision.vue')
      },
      {
        path: '/admin-behavior-supervision',
        name: 'AdminBehaviorSupervision',
        component: () => import('./views/AdminBehaviorSupervision.vue')
      },
      {
        path: '/admin-permission-management',
        name: 'AdminPermissionManagement',
        component: () => import('./views/AdminPermissionManagement.vue')
      },
      {
        path: '/articles',
        name: 'Articles',
        component: () => import('./views/Articles.vue')
      },
      {
        path: '/categories',
        name: 'Categories',
        component: () => import('./views/Categories.vue')
      },
      {
        path: '/charts',
        name: 'Charts',
        component: () => import('./views/Charts.vue')
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('./views/Reports.vue')
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('./views/Settings.vue')
      },
      {
        path: '/logs',
        name: 'Logs',
        component: () => import('./views/Logs.vue')
      },
      {
        path: '/notification',
        name: 'NotificationManagement',
        component: () => import('./views/NotificationManagement.vue')
      },
      {
        path: '/maintenance',
        name: 'Maintenance',
        component: () => import('./views/Maintenance.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加路由守卫
router.beforeEach((to, from, next) => {
  // 获取Vuex中的用户状态
  let isLoggedIn = store.getters['user/isLoggedIn']
  let loginTime = store.state.user.loginTime
  
  // 增加对 localStorage 的兜底检查，防止 Vuex 状态在刷新时丢失或未及时恢复
  if (!isLoggedIn) {
    const adminUser = localStorage.getItem('adminUser')
    const adminToken = localStorage.getItem('adminToken')
    if (adminUser && adminToken) {
      try {
        const userData = JSON.parse(adminUser)
        // 只有当解析出的用户数据有效且包含令牌时，才认为可能已登录
        if (userData && userData.token) {
          isLoggedIn = true
          loginTime = userData.loginTime || loginTime
          
          // 恢复 Vuex 状态，确保刷新页面后状态不丢失
          if (!store.getters['user/isLoggedIn']) {
            store.dispatch('user/login', userData)
          }
        }
      } catch (e) {
        console.error('解析本地存储的用户数据失败:', e)
      }
    }
  }
  
  // 检查是否已登录超过30天 (对应 Refresh Token 的有效期)
  const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000
  const isSessionExpired = loginTime && (Date.now() - loginTime > thirtyDaysInMillis)
  
  // 如果会话已过期，清除用户状态
  if (isSessionExpired) {
    store.dispatch('user/logout')
  }
  
  // 如果目标路由需要认证且用户未登录或会话已过期，重定向到登录页
  if (to.path !== '/login' && (!isLoggedIn || isSessionExpired)) {
    next('/login')
  } 
  // 移除已登录自动跳转首页的逻辑，允许已登录用户访问登录页（如需切换账号）
  // 除非有明确的重定向要求，否则保持当前逻辑
  else {
    next()
  }
})

const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册Vuex store
app.use(store)

app.use(router)
app.mount('#app')