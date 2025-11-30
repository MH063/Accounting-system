import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layouts/Layout.vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import NotFound from '@/views/NotFound.vue'
import SecuritySettings from '@/views/SecuritySettings.vue'
import NotificationList from '@/views/NotificationList.vue'

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { 
      requiresAuth: false,
      title: '首页'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { 
      requiresAuth: false,
      title: '注册'
    }
  },
  {
    path: '/dashboard',
    component: Layout,
    meta: { 
      requiresAuth: true,
      title: '仪表盘'
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { 
          title: '仪表盘首页'
        }
      },
      {
        path: 'dormitory',
        name: 'Dormitory',
        component: () => import('@/views/DormManagement.vue'),
        meta: { 
          title: '寝室管理'
        }
      },
      {
        path: 'dorm/create',
        name: 'DormCreate',
        component: () => import('@/views/DormCreate.vue'),
        meta: { 
          title: '创建寝室'
        }
      },
      {
        path: 'dorm/info/:id',
        name: 'DormInfo',
        component: () => import('@/views/DormInfo.vue'),
        props: true,
        meta: { 
          title: '寝室详情'
        }
      },
      {
        path: 'dorm/settings/:id',
        name: 'DormSettings',
        component: () => import('@/views/DormSettings.vue'),
        props: true,
        meta: { 
          title: '寝室设置'
        }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/MemberManagement.vue'),
        meta: { 
          title: '成员管理'
        }
      },
      {
        path: 'member/list',
        name: 'MemberList',
        component: () => import('@/views/MemberList.vue'),
        meta: { 
          title: '成员列表'
        }
      },
      {
        path: 'member/invite',
        name: 'MemberInvite',
        component: () => import('@/views/MemberInvite.vue'),
        meta: { 
          title: '邀请成员'
        }
      },
      {
        path: 'member/info/:id',
        name: 'MemberInfo',
        component: () => import('@/views/MemberInfo.vue'),
        props: true,
        meta: { 
          title: '成员详情'
        }
      },
      {
        path: 'expense-management',
        name: 'ExpenseManagement',
        component: () => import('@/views/ExpenseManagement.vue'),
        meta: { 
          title: '费用管理'
        }
      },
      {
        path: 'expense/create',
        name: 'ExpenseCreate',
        component: () => import('@/views/ExpenseCreate.vue'),
        meta: { 
          title: '创建费用'
        }
      },
      {
        path: 'expense/detail/:id',
        name: 'ExpenseDetail',
        component: () => import('@/views/ExpenseDetail.vue'),
        props: true,
        meta: { 
          title: '费用详情'
        }
      },
      {
        path: 'expense/edit/:id',
        name: 'ExpenseEdit',
        component: () => import('@/views/ExpenseEdit.vue'),
        props: true,
        meta: { 
          title: '编辑费用'
        }
      },
      {
        path: 'expense/review',
        name: 'ExpenseReview',
        component: () => import('@/views/ExpenseReview.vue'),
        meta: { 
          title: '费用审核'
        }
      },
      {
        path: 'expenses',
        name: 'Expenses',
        component: () => import('@/views/ExpenseManagement.vue'),
        meta: { 
          title: '费用列表'
        }
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/BillManagement.vue'),
        meta: { 
          title: '账单管理'
        }
      },
      {
        path: 'bill/create',
        name: 'BillCreate',
        component: () => import('@/views/BillCreate.vue'),
        meta: { 
          title: '创建账单'
        }
      },
      {
        path: 'bill/detail/:id',
        name: 'BillDetail',
        component: () => import('@/views/BillDetail.vue'),
        props: true,
        meta: { 
          title: '账单详情'
        }
      },
      {
        path: 'bill/edit/:id',
        name: 'BillEdit',
        component: () => import('@/views/BillCreate.vue'),
        props: true,
        meta: { 
          title: '编辑账单'
        }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/Payment.vue'),
        meta: { 
          title: '支付'
        }
      },
      {
        path: 'payment-scan',
        name: 'PaymentScan',
        component: () => import('@/views/PaymentScan.vue'),
        meta: { 
          title: '扫码支付'
        }
      },
      {
        path: 'qrcode',
        name: 'QRCode',
        component: () => import('@/views/PaymentQRCode.vue'),
        meta: { 
          title: '付款码'
        }
      },
      {
        path: 'payment-records',
        name: 'PaymentRecords',
        component: () => import('@/views/PaymentRecords.vue'),
        meta: { 
          title: '支付记录'
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Statistics.vue'),
        meta: { 
          title: '数据统计'
        }
      },
      {
        path: 'expense-statistics',
        name: 'ExpenseStatistics',
        component: () => import('@/views/ExpenseStatistics.vue'),
        meta: { 
          title: '费用统计'
        }
      },
      {
        path: 'trend-analysis',
        name: 'TrendAnalysis',
        component: () => import('@/views/TrendAnalysis.vue'),
        meta: { 
          title: '趋势分析'
        }
      },
      {
        path: 'budget-management',
        name: 'BudgetManagement',
        component: () => import('@/views/BudgetManagement.vue'),
        meta: { 
          title: '预算管理'
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { 
          title: '个人资料'
        }
      },
      {
        path: 'payment-confirm',
        name: 'PaymentConfirm',
        component: () => import('@/views/PaymentConfirm.vue'),
        meta: { 
          title: '支付确认'
        }
      },
      {
        path: 'help-center',
        name: 'HelpCenter',
        component: () => import('@/views/HelpCenter.vue'),
        meta: { 
          title: '帮助中心',
          requiresAuth: true
        }
      },
      {
        path: 'about-system',
        name: 'AboutSystem',
        component: () => import('@/views/AboutSystem.vue'),
        meta: { 
          title: '关于系统',
          requiresAuth: true
        }
      },
      {
        path: 'notifications',
        name: 'DashboardNotifications',
        component: () => import('@/views/NotificationList.vue'),
        meta: { 
          title: '通知中心',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/security-settings',
    name: 'SecuritySettings',
    component: SecuritySettings,
    meta: { 
      requiresAuth: true,
      title: '安全设置'
    }
  },
  {
    path: '/notifications',
    name: 'NotificationList',
    component: NotificationList,
    meta: { 
      requiresAuth: true,
      title: '通知列表'
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: { 
      title: '页面未找到',
      requiresAuth: false
    }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/NotFound.vue'),
    meta: { 
      title: '权限不足',
      requiresAuth: false
    }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/NotFound.vue'),
    meta: { 
      title: '未授权访问',
      requiresAuth: false
    }
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

// 路由守卫 - 权限验证
router.beforeEach(async (to, from, next) => {
  console.log('Route navigation:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth
  });

  // 如果路由需要认证
  if (to.meta.requiresAuth) {
    // 检查用户是否已登录（使用本地存储）
    const isAuthenticated = typeof localStorage !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      next('/login');
      return;
    }
  }

  next();
})

// 路由后置守卫，确保每次导航后都回到顶部
router.afterEach((_to, _from) => {
  // 页面导航后回到顶部
  if (typeof window !== 'undefined') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
})

export default router