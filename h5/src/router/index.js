import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/home',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'cards',
        name: 'Cards',
        component: () => import('@/views/Cards.vue')
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/Records.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const memberId = localStorage.getItem('memberId')
  
  if (to.path !== '/login' && !memberId) {
    next('/login')
  } else if (to.path === '/login' && memberId) {
    next('/home')
  } else {
    next()
  }
})

export default router
