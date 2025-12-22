<script setup>
import { ref, watch } from 'vue'
import CustomButton from '../shared/CustomButton.vue'

const props = defineProps({
  show: Boolean,
  category: Object
})

const emit = defineEmits(['close', 'save'])

const categoryName = ref('')

// Cuando la prop 'category' cambie (al abrir el modal),
// actualizamos el valor del input.
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    categoryName.value = newCategory.nombre
  }
})

function saveChanges() {
  if (categoryName.value.trim()) {
    emit('save', categoryName.value)
  }
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-gray-800">Editar Categoría</h3>
        <p class="text-gray-600 mt-2">Introduce el nuevo nombre para la categoría.</p>
        <form @submit.prevent="saveChanges">
          <input
            v-model="categoryName"
            type="text"
            class="mt-4 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50"
          >
          <div class="flex justify-end gap-4 mt-6">
            <CustomButton variant="secondary" @click="$emit('close')">Cancelar</CustomButton>
            <CustomButton type="submit">Guardar Cambios</CustomButton>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>
