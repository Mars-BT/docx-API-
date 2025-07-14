import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: '/preview-templates', // 默认跳转到预览模板页面
      children: [
        {
          path: 'templates-test',
          name: 'templates-test',
          component: () => import('../views/contentViews/TemplatesTestView.vue'),
        },
        {
          path: 'templates-settings',
          name: 'templates-settings',
          component: () => import('../views/contentViews/TemplatesSettingsView.vue'),
        },
        {
          path: 'preview-templates',
          name: 'preview-templates',
          component: () => import('../views/contentViews/PreviewTemplatesView.vue'),
        },
      ],
    },
  ],
})

export default router
