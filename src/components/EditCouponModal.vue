<script setup>
// EditCouponModal.vue
import { ref, watch } from 'vue'
import CustomButton from './CustomButton.vue'

const props = defineProps({
  show: Boolean,
  coupon: Object
})
const emit = defineEmits(['close', 'save'])

const editableCoupon = ref({})

watch(() => props.coupon, (newCoupon) => {
  if (newCoupon) {
    editableCoupon.value = { ...newCoupon }
  }
})

function saveChanges() {
  emit('save', editableCoupon.value)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h3 class="text-xl font-bold">Editar Cupón</h3>
        <form @submit.prevent="saveChanges" class="mt-4 space-y-4">

          <label class="block">
            <span class="text-gray-700 text-sm font-medium">Código del Cupón</span>
            <input v-model="editableCoupon.codigo" type="text" required class="mt-1 block w-full p-2 border rounded-md shadow-sm">
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Tipo de Descuento</span>
              <select v-model="editableCoupon.tipo" class="mt-1 block w-full p-2 border rounded-md shadow-sm">
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </label>
            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Valor</span>
              <input v-model="editableCoupon.valor" type="number" step="0.01" required class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Usos Máximos (opcional)</span>
              <input v-model="editableCoupon.usos_maximos" type="number" placeholder="Sin límite" class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>
            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Fecha de Expiración (opcional)</span>
              <input v-model="editableCoupon.fecha_expiracion" type="date" class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-medium">Estado</label>
            <div class="mt-2">
              <label class="inline-flex items-center cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="editableCoupon.activo" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-fucsia"></div>
                </div>
                <span class="ml-3 text-sm font-medium text-gray-900">{{ editableCoupon.activo ? 'Activo' : 'Inactivo' }}</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-4 mt-6">
            <CustomButton variant="secondary" @click="$emit('close')">Cancelar</CustomButton>
            <CustomButton type="submit">Guardar Cambios</CustomButton>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>
