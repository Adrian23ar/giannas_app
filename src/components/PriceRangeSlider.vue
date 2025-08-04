<script setup>
import { ref, watch, computed } from 'vue'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

const props = defineProps({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  modelValue: { type: Array, required: true } // [min, max]
})

const emit = defineEmits(['update:modelValue'])

// Creamos una propiedad computada para que v-model funcione correctamente
const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    // Evitamos emitir si el valor es inválido o no ha cambiado
    if (val[0] !== props.modelValue[0] || val[1] !== props.modelValue[1]) {
      emit('update:modelValue', val)
    }
  }
})
</script>
<template>
  <div>
    <VueSlider v-model="internalValue" :min="min" :max="max" :interval="1" :tooltip="'always'" :enable-cross="false" />
    <div class="flex justify-between items-center mt-4">
      <input type="number" v-model.number="internalValue[0]" class="w-24 p-2 border rounded-md text-center">
      <span>-</span>
      <input type="number" v-model.number="internalValue[1]" class="w-24 p-2 border rounded-md text-center">
    </div>
  </div>
</template>
