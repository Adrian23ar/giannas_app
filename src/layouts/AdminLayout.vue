<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import AdminNotificationBell from '@/components/admin/NotificationBell.vue';
import { supabase } from '../supabase'
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChartPieIcon,
  CubeIcon,
  TagIcon,
  XMarkIcon,
  ShoppingCartIcon,
  TicketIcon,
  CreditCardIcon,
  Square3Stack3DIcon,
  BanknotesIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
// Para pantallas de escritorio, el sidebar empieza abierto. Para móvil, cerrado.
const isSidebarOpen = ref(window.innerWidth >= 768)

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/admin/login')
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
      :style="{ width: isSidebarOpen ? '16rem' : '5rem' }">
      <div class="flex items-center h-20 border-b border-white/10"
        :class="isSidebarOpen ? 'justify-between pt-2 px-6' : 'justify-center pt-2 px-1'">
        <img src="/logo-giannas.png" alt="Logo" :class="isSidebarOpen ? 'h-16' : 'h-auto'">
        <button @click="isSidebarOpen = false" class="md:hidden">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <nav class="mt-4 flex flex-col h-[calc(100%-95px)]">
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
          <li>
            <RouterLink to="/admin/metodos-pago"
              class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/metodos-pago' }]">
              <CreditCardIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Métodos de Pago</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/tasa-de-cambio"
              class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/tasa-de-cambio' }]">
              <BanknotesIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Tasa de Cambio</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/secciones" class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/secciones' }]">
              <Square3Stack3DIcon class="h-6 w-6 flex-shrink-0" />
              <span v-if="isSidebarOpen">Secciones</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/configuracion"
              class="flex items-center gap-4 py-3 hover:bg-white/10 transition-colors"
              :class="[isSidebarOpen ? 'px-6' : 'px-0 justify-center', { 'bg-brand-fucsia': route.path === '/admin/configuracion' }]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 14 14"><path fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" d="m5.23 2.25l.43-1.11A1 1 0 0 1 6.59.5h.82a1 1 0 0 1 .93.64l.43 1.11l1.46.84l1.18-.18a1 1 0 0 1 1 .49l.4.7a1 1 0 0 1-.08 1.13l-.73.93v1.68l.75.93a1 1 0 0 1 .08 1.13l-.4.7a1 1 0 0 1-1 .49l-1.18-.18l-1.46.84l-.43 1.11a1 1 0 0 1-.93.64h-.84a1 1 0 0 1-.93-.64l-.43-1.11l-1.46-.84l-1.18.18a1 1 0 0 1-1-.49l-.4-.7a1 1 0 0 1 .08-1.13L2 7.84V6.16l-.75-.93a1 1 0 0 1-.08-1.13l.4-.7a1 1 0 0 1 1-.49l1.18.18zM5 7a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/></svg>
              <span v-if="isSidebarOpen">Configuración</span>
            </RouterLink>
          </li>
        </ul>
        <div class="border-t border-white/10">
          <button @click="handleLogout" class="w-full flex items-center py-4 gap-4 hover:bg-white/10 transition-colors"
            :class="isSidebarOpen ? 'px-6' : 'px-0 justify-center'">
            <ArrowLeftOnRectangleIcon class="h-6 w-6 flex-shrink-0" />
            <span v-if="isSidebarOpen">Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </aside>

    <div class="transition-all duration-300" :class="isSidebarOpen ? 'md:ml-64' : 'md:ml-20'">
      <header class="h-20 sticky top-0 w-full flex z-10 items-center justify-between bg-white shadow-sm px-6">
        <button @click="isSidebarOpen = !isSidebarOpen">
          <Bars3Icon class="h-6 w-6 text-gray-700" />
        </button>
        <h1 class="text-xl md:text-2xl font-bold text-gray-800">{{$route.name.split('-').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}}</h1>
        <AdminNotificationBell />

      </header>
      <main class="pt-12 p-6 max-w-8xl mx-auto">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
