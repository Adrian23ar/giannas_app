<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import AdminNotificationBell from '@/components/AdminNotificationBell.vue';
import { supabase } from '../supabase'
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChartPieIcon,
  CubeIcon,
  TagIcon,
  XMarkIcon,
  ShoppingCartIcon,
  TicketIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
// Para pantallas de escritorio, el sidebar empieza abierto. Para móvil, cerrado.
const isSidebarOpen = ref(window.innerWidth >= 768)

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}

// Cierra el sidebar al cambiar de ruta en móvil
watch(route, () => {
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  }
})
</script>

<template>
  <div class="relative min-h-screen bg-slate-100 font-sans">
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black/30 z-10 md:hidden"></div>

    <aside class="fixed top-0 left-0 h-full bg-[#4C1831] text-white transition-all duration-300 z-20"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
      :style="{ width: isSidebarOpen ? '256px' : '80px' }">
      <div class="flex items-center h-20 border-b border-white/10"
        :class="isSidebarOpen ? 'justify-between pt-2 px-6' : 'justify-center pt-2 px-1'">
        <img src="/logo-giannas.png" alt="Logo" :class="isSidebarOpen ? 'h-16' : 'h-auto'">
        <button @click="isSidebarOpen = false" class="md:hidden">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <nav class="mt-4 flex flex-col h-[calc(100%-80px)]">
        <ul class="flex-grow">
          <li>
            <RouterLink to="/admin" class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin' }]">
              <ChartPieIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Dashboard</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/productos" class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/productos' }]">
              <CubeIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Productos</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/categorias" class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/categorias' }]">
              <TagIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Categorías</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/pedidos" class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/pedidos' }]">
              <ShoppingCartIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Pedidos</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/cupones" class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/cupones' }]">
              <TicketIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Cupones</span>
            </RouterLink>
          </li>
        </ul>
        <div class="p-4 border-t border-white/10">
          <button @click="handleLogout" class="w-full flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
            :class="isSidebarOpen ? 'px-6' : 'px-0 justify-center'">
            <ArrowLeftOnRectangleIcon class="h-6 w-6 flex-shrink-0" />
            <span v-if="isSidebarOpen">Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </aside>

    <div class="transition-all duration-300" :class="isSidebarOpen ? 'md:ml-64' : 'md:ml-20'">
      <header class="h-20 flex items-center justify-between bg-white shadow-sm px-6">
        <button @click="isSidebarOpen = !isSidebarOpen">
          <Bars3Icon class="h-6 w-6 text-gray-700" />
        </button>
        <h1 class="text-xl md:text-2xl font-bold text-gray-800">{{$route.name.split('-').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}}</h1>
        <AdminNotificationBell />

      </header>
      <main class="p-4 md:p-6 max-w-6xl mx-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
