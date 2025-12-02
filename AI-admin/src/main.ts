import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import Layout from './components/Layout.vue'
import Home from './views/Home.vue'
import NotFound from './views/NotFound.vue'
import './style.css'

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
        path: '/roles',
        name: 'Roles',
        component: () => import('./views/Roles.vue')
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

const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.mount('#app')
