<script setup>
// src/components/CategoryListItem.vue
import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'

defineProps({
  category: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])
</script>

<template>
  <li class="bg-slate-100 p-3 rounded-md flex justify-between items-center border">
    <span class="text-gray-800 font-medium">{{ category.nombre }}</span>
    <div class="flex gap-2">
      <button @click="$emit('edit', category)"
        class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md" title="Editar">
        <PencilSquareIcon class="h-5 w-5" />
      </button>
      <button @click="$emit('delete', category)"
        class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md" title="Eliminar">
        <TrashIcon class="h-5 w-5" />
      </button>
    </div>
  </li>
</template>
