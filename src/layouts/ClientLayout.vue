<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
const cartStore = useCartStore()
</script>

<template>
  <div class="font-sans bg-slate-50">
    <header class="bg-white shadow-md sticky top-0 z-[9999]">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <RouterLink to="/">
          <img src="/logo-giannas.png" alt="Logo Gianna's Cookies" class="h-12">
        </RouterLink>

        <div class="flex items-center gap-6">
          <RouterLink to="/" class="text-gray-700 hover:text-brand-fucsia font-medium">Catálogo</RouterLink>
          <RouterLink to="/cart" class="relative text-gray-700 hover:text-brand-fucsia font-medium">
            <span>Carrito</span>
            <span
              class="absolute -top-2 -right-4 bg-brand-fucsia text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {{ cartStore.totalItems }}
            </span>
          </RouterLink>
        </div>
      </nav>
    </header>

    <main class="container mx-auto px-4 py-8 min-h-screen">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="bg-brand-morado text-white py-6">
      <div class="container mx-auto px-4 text-center">
        <p>&copy; 2025 Gianna's Cookies. Todos los derechos reservados.</p>
        <p class="text-sm mt-2">Hecho con ❤️ por un desarrollador increíble.</p>
      </div>
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
