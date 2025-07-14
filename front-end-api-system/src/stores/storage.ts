import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useStorageStore = defineStore('storage', () => {
  const currentNavigationButton = ref('preview-templates')
  const currentSubRoute = ref('preview-templates') // 默认子路由
  const templateId = ref('')

  const setNavigationButton = (button: string) => {
    currentNavigationButton.value = button
    currentSubRoute.value = button
  }

  const setSubRoute = (route: string) => {
    currentSubRoute.value = route
  }

  // 根据当前路由设置导航状态
  const syncWithRoute = (currentRoute: string) => {
    const routeName = currentRoute.replace('/', '')
    if (routeName === 'preview-templates' || routeName === 'templates-settings' || routeName === 'templates-test') {
      currentNavigationButton.value = routeName
      currentSubRoute.value = routeName
    }
  }

  // 获取当前应该显示的路由路径
  const getCurrentRoutePath = computed(() => {
    return `/${currentSubRoute.value}`
  })

  const setTemplateId = (id: string) => {
    templateId.value = id
  }

  return { 
    currentNavigationButton, 
    currentSubRoute,
    setNavigationButton, 
    setSubRoute,
    syncWithRoute,
    getCurrentRoutePath,
    setTemplateId,
    templateId
  }
})

