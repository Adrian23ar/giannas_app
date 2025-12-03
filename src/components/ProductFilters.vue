<script setup>
import { ref, watch } from 'vue'
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/vue/24/outline'

// Recibimos las categorías desde el padre
const props = defineProps({
  categories: { type: Array, required: true },
  initialFilters: { type: Object, required: true }
})

// Emitimos un solo evento cuando los filtros cambian
const emit = defineEmits(['filters-changed'])

// Estado local para cada filtro
const searchTerm = ref(props.initialFilters.searchTerm)
const selectedCategoryId = ref(props.initialFilters.categoryId)
const priceRange = ref([props.initialFilters.minPrice, props.initialFilters.maxPrice])

// Observador que notifica al padre cada vez que un filtro cambia
watch([searchTerm, selectedCategoryId, priceRange], () => {
  emit('filters-changed', {
    searchTerm: searchTerm.value,
    categoryId: selectedCategoryId.value,
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
  })
}, { deep: true })

</script>
<template>
  <div class="bg-white p-4 rounded-lg shadow-md mb-8 space-y-4 py-6">
    <div class="relative">
      <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input type="text" v-model="searchTerm" placeholder="Buscar por nombre..."
        class="w-full p-2 pl-10 border rounded-md">
    </div>

    <div>
      <h3 class="font-semibold mb-2 text-sm text-gray-600">Categorías</h3>
      <div class="flex flex-wrap gap-2">
        <button @click="selectedCategoryId = null"
          :class="!selectedCategoryId ? 'bg-brand-fucsia text-white' : 'bg-gray-200 text-gray-700'"
          class="px-3 py-1 rounded-full text-sm font-semibold transition-colors">
          Todas
        </button>
        <button v-for="category in categories" :key="category.id" @click="selectedCategoryId = category.id"
          :class="selectedCategoryId === category.id ? 'bg-brand-fucsia text-white' : 'bg-gray-200 text-gray-700'"
          class="px-3 py-1 rounded-full text-sm font-semibold transition-colors">
          {{ category.nombre }}
        </button>
      </div>
    </div>
  </div>
</template>
