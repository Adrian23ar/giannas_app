import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

// 1. IMPORTAR EL PLUGIN
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
    }),
    // 2. ACTIVAR COMPRESIÓN
    viteCompression({
      algorithm: 'brotliCompress', // Usa 'gzip' si prefieres
      threshold: 10240, // Solo comprime si pesa más de 10kb
      deleteOriginFile: false
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['vue', 'vue-router', 'pinia'],
          'vendor-maps': ['leaflet', '@vue-leaflet/vue-leaflet'],
          'vendor-charts': ['chart.js', 'vue-chartjs'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-ui': ['swiper', 'vue-toastification'],
          'vendor-supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
})
