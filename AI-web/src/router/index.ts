import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layouts/Layout.vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import NotFound from '@/views/NotFound.vue'

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/dashboard',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'dormitory',
        name: 'Dormitory',
        component: () => import('@/views/DormManagement.vue')
      },
      {
        path: 'dorm/create',
        name: 'DormCreate',
        component: () => import('@/views/DormCreate.vue')
      },
      {
        path: 'dorm/info/:id',
        name: 'DormInfo',
        component: () => import('@/views/DormInfo.vue'),
        props: true
      },
      {
        path: 'dorm/settings/:id',
        name: 'DormSettings',
        component: () => import('@/views/DormSettings.vue'),
        props: true
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/MemberManagement.vue')
      },
      {
        path: 'expenses',
        name: 'Expenses',
        component: () => import('@/views/ExpenseManagement.vue')
      },

      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/BillManagement.vue')
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/Payment.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Statistics.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      }
    ]
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

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  // 记录导航日志
  console.log(`路由导航: ${from.path} -> ${to.path}`)
  
  // 首页无需登录即可访问
  if (to.path === '/') {
    // 导航到首页时自动回到顶部
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    
    // 如果已登录访问首页，重定向到仪表盘
    if (isAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }
  
  // 登录页面无需登录即可访问
  if (to.path === '/login' || to.path === '/register') {
    // 如果已登录访问登录页或注册页，重定向到仪表盘
    if (isAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }
  
  // 检查目标路由是否存在
  if (to.name === 'Dormitory' && to.path === '/dormitory') {
    // 防止旧链接访问，修正为正确的仪表盘子路由
    console.warn('检测到错误的寝室管理路径，自动修正为: /dashboard/dormitory')
    next('/dashboard/dormitory')
    return
  }
  
  // 其他页面需要登录
  if (!isAuthenticated) {
    console.warn(`未认证用户尝试访问受保护页面: ${to.path}`)
    next('/login')
  } else {
    next()
  }
})

// 路由后置守卫，确保每次导航后都回到顶部
router.afterEach((to, from) => {
  // 页面导航后回到顶部
  if (typeof window !== 'undefined') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
})

export default router