import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification' // <-- Importa la librería
import 'vue-toastification/dist/index.css' // <-- Importa los estilos
import 'leaflet/dist/leaflet.css';

import App from './App.vue'
import router from './router'

const app = createApp(App)
const options = {
  timeout: 2000
};
app.use(createPinia())
app.use(router)
app.use(Toast, options) // <-- Usa la librería en tu app

app.mount('#app')
