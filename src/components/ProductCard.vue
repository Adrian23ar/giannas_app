<script setup>
import { ShoppingCartIcon } from '@heroicons/vue/24/outline'

defineProps({
  producto: {
    type: Object,
    required: true
  },
  isRecentlyAdded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['addToCart', 'showDetails'])

function onAddToCart() {
  emit('addToCart')
}

function onShowDetails() {
  emit('showDetails')
}
</script>

<template>
  <div
    class="bg-brand-rosa md:bg-brand-rosa p-3 rounded-2xl shadow-lg transform hover:scale-[1.01] transition-transform duration-300 w-full max-w-60 lg:max-w-72 flex flex-col mb-3">
    <div class="relative bg-white p-2 rounded-xl">
      <img :src="producto.foto_url" :alt="producto.nombre" class="w-full h-40 md:h-56 object-cover rounded-lg">
    </div>

    <div class="pt-4 px-2 flex-grow flex flex-col">
      <div>
        <h2 class="text-lg font-semibold text-brand-morado">{{ producto.nombre }}</h2>
        <p class="text-gray-600 text-sm mt-1">{{ producto.categorias?.nombre || 'Galleta' }}</p>
      </div>

      <div class="flex-grow"></div>

      <div class="my-3 text-right">
        <p class="text-xl md:text-xl font-semibold text-brand-morado">{{ producto.precio.toFixed(2) }}$</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="onShowDetails"
          class="flex-1 bg-brand-galleta text-white text-sm tracking-wide font-semibold p-3 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
          Detalles
        </button>
        <button @click="onAddToCart" :disabled="isRecentlyAdded"
          class="bg-brand-fucsia justify-items-center w-1/3 text-white p-3 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          :class="{ 'bg-green-500': isRecentlyAdded }">
          <ShoppingCartIcon v-if="!isRecentlyAdded" class="w-5 h-5" />
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
            stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
