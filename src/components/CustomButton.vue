<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 'primary', 'secondary', 'danger'
  variant: {
    type: String,
    default: 'primary'
  },
  // Permite que el botón se comporte como un botón de submit o un botón normal
  type: {
    type: String,
    default: 'button'
  },
  // Si el botón está deshabilitado
  disabled: {
    type: Boolean,
    default: false
  }
})

// Define las clases de estilo para cada variante del botón
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700'
    case 'primary':
    default:
      return 'bg-brand-fucsia text-white hover:bg-opacity-90'
  }
})
</script>

<template>
  <button :type="type" :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 font-bold py-2 px-6 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
    :class="variantClasses">
    <slot></slot>
  </button>
</template>
