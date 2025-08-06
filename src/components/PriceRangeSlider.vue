<script setup>
import { computed } from 'vue'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

const props = defineProps({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  modelValue: { type: Array, required: true } // [min, max]
})

const emit = defineEmits(['update:modelValue'])

// Creamos una propiedad computada para que v-model funcione correctamente en ambas direcciones
const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    // Aseguramos que los valores no se crucen y estén dentro de los límites
    const minValue = Math.max(props.min, Math.min(val[0], val[1]));
    const maxValue = Math.min(props.max, Math.max(val[0], val[1]));

    // Solo emitimos el evento si los valores realmente han cambiado
    if (minValue !== props.modelValue[0] || maxValue !== props.modelValue[1]) {
      emit('update:modelValue', [minValue, maxValue])
    }
  }
})

// --- INICIO DE LA SOLUCIÓN PARA LOS INPUTS MANUALES ---

// Creamos computed properties separadas para cada input.
// Esto nos permite controlar el flujo de datos de forma más precisa.
const minValue = computed({
  get: () => internalValue.value[0],
  set: (val) => {
    // Cuando el input de mínimo cambia, actualizamos el array completo.
    internalValue.value = [val, internalValue.value[1]]
  }
})

const maxValue = computed({
  get: () => internalValue.value[1],
  set: (val) => {
    // Cuando el input de máximo cambia, actualizamos el array completo.
    internalValue.value = [internalValue.value[0], val]
  }
})

// --- FIN DE LA SOLUCIÓN ---

</script>
<template>
  <div>
    <VueSlider v-model="internalValue" :min="min" :max="max" :interval="1" :tooltip="'none'" :enable-cross="false" />
    <div class="flex justify-between items-center mt-4">
      <input type="number" v-model.number="minValue" class="w-24 p-2 border rounded-md text-center">
      <span class="text-gray-400">-</span>
      <input type="number" v-model.number="maxValue" class="w-24 p-2 border rounded-md text-center">
    </div>
  </div>
</template>

<style>
/* Personalización opcional para el slider */
.vue-slider-process {
  background-color: #CC146C !important;
  /* Color fucsia de tu marca */
}

.vue-slider-dot-handle {
  border-color: #CC146C !important;
  /* Color fucsia de tu marca */
}
</style>
