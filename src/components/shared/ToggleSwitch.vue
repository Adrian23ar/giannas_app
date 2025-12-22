<script setup>
defineProps({
  modelValue: { // Usamos modelValue para que funcione con v-model
    type: Boolean,
    default: false
  }
})

// Definimos el evento que v-model espera
const emit = defineEmits(['update:modelValue'])

function handleChange(event) {
  emit('update:modelValue', event.target.checked)
}
</script>

<template>
  <label class="flex items-center cursor-pointer">
    <div class="relative">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="handleChange"
        class="sr-only peer"
      >
      <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-fucsia">
      </div>
    </div>
  </label>
</template>
