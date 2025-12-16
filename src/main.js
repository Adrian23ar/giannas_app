// src/main.js

import './assets/main.css'

import '@fontsource/quicksand/300.css';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// --- INICIO DE LA CORRECCIÓN PARA LEAFLET ---
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Importa las imágenes de los íconos manualmente
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Corrige el problema de las rutas de los íconos por defecto de Leaflet
let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// --- FIN DE LA CORRECCIÓN PARA LEAFLET ---


import App from './App.vue'
import router from './router'

const app = createApp(App)
const options = {
  timeout: 2000
};
app.use(createPinia())
app.use(router)
app.use(Toast, options)

app.mount('#app')
