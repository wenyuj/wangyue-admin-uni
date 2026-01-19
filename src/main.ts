import { createSSRApp } from 'vue'
import App from './App.vue'
import { permissionDirective } from './directives/permission'
import i18n from './locale/index'
import { routeInterceptor } from './router/interceptor'

import store from './store'
import { initWebSocket } from './ws'
import '@/style/index.scss'
import 'virtual:uno.css'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.use(i18n)
  app.use(routeInterceptor)
  // 权限指令：控制元素显示/隐藏
  app.directive('permission', permissionDirective)
  initWebSocket(store)

  return {
    app,
  }
}
