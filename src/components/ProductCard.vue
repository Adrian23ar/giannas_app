<script setup>
// src/components/ProductCard.vue
import { defineProps, defineEmits } from 'vue'

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
  <div @click="onShowDetails" class="cursor-pointer group bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 w-full flex flex-col md:flex-row gap-4 relative overflow-hidden">

    <div class="flex-1 flex flex-col justify-between order-2 md:order-1">
      <div>
        <h2 class="text-base lg:text-lg font-bold text-gray-900 leading-tight mb-1">
          {{ producto.nombre }}
        </h2>

        <div class="hidden md:block">
          <p class="text-gray-500 text-xs lg:text-sm font-light leading-snug line-clamp-2">
            {{ producto.descripcion || producto.categorias?.nombre || 'Deliciosa galleta recién horneada' }}
          </p>
        </div>
      </div>

      <div class="mt-3">
        <p class="text-lg md:text-xl font-bold text-brand-fucsia">
          {{ producto.precio.toFixed(2) }}$
        </p>
      </div>
    </div>

    <div class="relative w-full md:w-32 md:h-32 shrink-0 order-1 md:order-2">
      <img :src="producto.foto_url" :alt="producto.nombre"
        class="w-full h-40 md:h-full object-cover rounded-lg bg-gray-50">

      <button @click.stop="onShowDetails"
        class="absolute -bottom-2 -right-2 md:bottom-1 md:right-1 bg-white hover:bg-gray-50 text-brand-fucsia border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-transform transform active:scale-90 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>

  </div>
</template>
