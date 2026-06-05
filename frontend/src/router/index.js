import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'cashier',
        name: 'Cashier',
        component: () => import('@/views/Cashier.vue')
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/Members.vue')
      },
      {
        path: 'members/:id',
        name: 'MemberDetail',
        component: () => import('@/views/MemberDetail.vue')
      },
      {
        path: 'cards',
        name: 'Cards',
        component: () => import('@/views/Cards.vue')
      },
      {
        path: 'sessions',
        name: 'Sessions',
        component: () => import('@/views/Sessions.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue')
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('@/views/Employees.vue')
      },
      {
        path: 'commissions',
        name: 'Commissions',
        component: () => import('@/views/Commissions.vue')
      },
      {
        path: 'salary',
        name: 'Salary',
        component: () => import('@/views/Salary.vue')
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue')
      },
      {
        path: 'promotions',
        name: 'Promotions',
        component: () => import('@/views/Promotions.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
