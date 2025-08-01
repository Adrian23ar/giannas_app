<script setup>
// src/App.vue
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'

const cartStore = useCartStore()

// Al montar la aplicación, intentamos obtener la sesión del usuario
onMounted(async () => {
  await cartStore.initializeCart() // Luego inicializamos el carrito
})
</script>

<template>
  <div class="min-h-screen bg-brand-blanco">

    <RouterView />
  </div>
</template>

<style scoped>

</style>
