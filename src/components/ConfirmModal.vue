<script setup>
import CustomButton from './CustomButton.vue';

defineProps({
  show: Boolean,
  title: String,
  message: String,
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-gray-800">{{ title }}</h3>
        <p class="text-gray-600 mt-2">{{ message }}</p>
        <div class="flex justify-end gap-4 mt-6">
          <CustomButton variant="secondary" @click="$emit('cancel')">Cancelar</CustomButton>
          <CustomButton variant="danger" @click="$emit('confirm')">Confirmar</CustomButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
