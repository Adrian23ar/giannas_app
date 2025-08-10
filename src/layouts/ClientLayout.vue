<script setup>
// src/layouts/ClientLayout.vue
import { ref } from 'vue' // <-- Importa ref
import { RouterLink, RouterView } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
// shopping cart heroicon
import { ShoppingCartIcon } from '@heroicons/vue/24/outline'

const cartStore = useCartStore()
const userStore = useUserStore()
const isMobileMenuOpen = ref(false) // <-- Estado para el menú móvil
</script>

<template>
  <div class="font-sans bg-brand-blanco">
    <header class="shadow-md fixed bg-brand-fucsia w-full top-0 z-[9999]">
      <nav class="container mx-auto px-8 xl:px-8 py-4 flex justify-between items-center">
        <RouterLink to="/">
          <img src="/logo-giannas.png" alt="Logo Gianna's Cookies" class="h-12">
        </RouterLink>

        <div class="hidden lg:flex items-center gap-6 pr-8 lg:pr-0">
          <RouterLink to="/" class="text-brand-blanco hover:text-brand-morado transition-all font-medium">Catálogo
          </RouterLink>

          <RouterLink to="/pedidos-especiales"
            class="text-brand-blanco hover:text-brand-morado transition-all font-medium">
            Pedidos para Eventos
          </RouterLink>

          <RouterLink to="/seguimiento" class="text-brand-blanco hover:text-brand-morado transition-all font-medium">
            Seguimiento
          </RouterLink>

          <template v-if="!userStore.isLoggedIn">
            <RouterLink to="/ingresar" class="text-brand-blanco hover:text-brand-morado transition-all font-medium">
              Iniciar Sesión
            </RouterLink>
          </template>

          <template v-else>
            <RouterLink to="/mi-cuenta" class="text-brand-blanco hover:text-brand-morado transition-all font-medium">Mi
              Cuenta</RouterLink>
            <button @click="userStore.signOut"
              class="text-brand-blanco hover:text-brand-morado transition-all font-medium">Cerrar
              Sesión</button>
          </template>

          <RouterLink to="/cart" class="relative text-brand-blanco hover:text-brand-morado transition-all font-medium">
            <span>Carrito</span>
            <span
              class="absolute -top-2 -right-4 bg-brand-blanco text-brand-fucsia text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {{ cartStore.totalItems }}
            </span>
          </RouterLink>


        </div>

        <div class="lg:hidden flex items-center">
          <RouterLink to="/cart"
            class="relative text-brand-blanco hover:text-brand-morado transition-all font-medium mr-6">
            <ShoppingCartIcon class="h-6 w-6" /> <span
              class="absolute -top-2 -right-3 bg-brand-blanco text-brand-fucsia text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {{ cartStore.totalItems }}
            </span>
          </RouterLink>

          <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="text-brand-blanco focus:outline-none">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 12h16m-7 6h7"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12">
              </path>
            </svg>
          </button>
        </div>
      </nav>
      <Transition name="slide-fade">
        <div v-if="isMobileMenuOpen" class="lg:hidden shadow-lg">
          <div class="flex flex-col px-4 pt-2 pb-4 gap-3">
            <RouterLink @click="isMobileMenuOpen = false" to="/"
              class="block text-brand-blanco hover:text-brand-morado transition-all font-medium">Catálogo</RouterLink>
              <RouterLink @click="isMobileMenuOpen = false" to="/pedidos-especiales"
            class="block text-brand-blanco hover:text-brand-morado transition-all font-medium">
            Pedidos para Eventos
          </RouterLink>
            <RouterLink @click="isMobileMenuOpen = false" to="/seguimiento"
              class="block text-brand-blanco hover:text-brand-morado transition-all font-medium">Seguimiento
            </RouterLink>

            <template v-if="!userStore.isLoggedIn">
              <hr class="my-1">
              <RouterLink @click="isMobileMenuOpen = false" to="/ingresar"
                class="block text-brand-blanco hover:text-brand-morado transition-all font-medium">Iniciar Sesión
              </RouterLink>
            </template>

            <template v-else>
              <RouterLink @click="isMobileMenuOpen = false" to="/mi-cuenta"
                class="block text-brand-blanco hover:text-brand-morado transition-all font-medium">Mi Cuenta
              </RouterLink>
              <hr class="my-1">
              <button @click="() => { userStore.signOut(); isMobileMenuOpen = false; }"
                class="text-left text-brand-blanco hover:text-brand-morado transition-all font-medium">Cerrar
                Sesión</button>
            </template>
          </div>
        </div>
      </Transition>

    </header>

    <main class="container mx-auto px-4 py-8 mt-20 min-h-screen">
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

/* --- NUEVAS CLASES PARA LA TRANSICIÓN DEL MENÚ MÓVIL --- */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
