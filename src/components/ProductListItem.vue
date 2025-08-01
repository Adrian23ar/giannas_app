<script setup>
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'

// Este componente recibe el objeto 'product' como una "prop"
defineProps({
  product: {
    type: Object,
    required: true
  }
})

// Define los eventos que este componente puede "emitir" hacia el padre
defineEmits(['edit', 'toggleStatus'])
</script>

<template>
  <li
    class="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
    <img :src="product.foto_url" :alt="product.nombre"
      class="w-full md:w-16 h-32 md:h-16 rounded-md object-cover bg-gray-200" />

    <div class="flex-grow">
      <p class="font-bold text-gray-800">{{ product.nombre }}</p>
      <p class="text-sm text-gray-500">{{ product.categorias?.nombre || 'Sin categoría' }}</p>
    </div>

    <div
      class="w-full md:w-auto flex justify-between md:justify-center items-center gap-4 border-t md:border-none pt-2 md:pt-0">
      <div class="text-left md:text-center">
        <p class="text-sm text-gray-500">Stock</p>
        <p class="font-bold" :class="product.stock < 5 ? 'text-red-500' : 'text-gray-700'">
          {{ product.stock }}
        </p>
      </div>
      <div class="text-left md:text-center">
        <p class="text-sm text-gray-500">Precio</p>
        <p class="font-bold text-gray-700">${{ product.precio.toFixed(2) }}</p>
      </div>
      <div class="flex gap-2">
        <label class="flex items-center cursor-pointer">
          <div class="relative">
            <input type="checkbox" :checked="product.activo" @change="$emit('toggleStatus', product)"
              class="sr-only peer">
            <div
              class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-fucsia">
            </div>
          </div>
        </label>
        <button @click="$emit('edit', product)"
          class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all">
          <PencilSquareIcon class="h-5 w-5" />
        </button>

      </div>
    </div>
  </li>
</template>
