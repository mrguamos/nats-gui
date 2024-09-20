import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

createApp(App).use(router).mount('#app')
