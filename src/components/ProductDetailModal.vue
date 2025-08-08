<script setup>
import { ref, watch } from 'vue'; // Importamos ref y watch
import { CheckCircleIcon } from '@heroicons/vue/24/outline';
import CustomButton from './CustomButton.vue';

// 1. AÑADIMOS ESTADO LOCAL PARA LA CANTIDAD
const quantity = ref(1);

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  product: {
    type: Object,
    default: null
  },
  isRecentlyAdded: {
    type: Boolean,
    default: false
  }
})

// Observador para resetear la cantidad a 1 cada vez que el modal se abre
watch(() => props.show, (newVal) => {
  if (newVal) {
    quantity.value = 1;
  }
});

const emit = defineEmits(['close', 'addToCart'])

// 2. FUNCIONES PARA MANEJAR LA CANTIDAD
function increment() {
  quantity.value++;
}

function decrement() {
  if (quantity.value > 1) {
    quantity.value--;
  }
}

// 3. FUNCIÓN QUE EMITE EL PRODUCTO Y LA CANTIDAD
function onAddToCart() {
  emit('addToCart', { product: props.product, quantity: quantity.value });
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" @click.self="emit('close')"
      class="fixed inset-0 top-16 bg-black/60 flex justify-center items-center z-50 p-4">
      <div v-if="product"
        class="bg-pink-100 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row px-4 py-12 gap-4 relative">
        <button @click="emit('close')" class="absolute top-3 right-3 text-brand-morado hover:text-brand-fucsia transition-colors z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="w-full md:w-1/2 flex flex-col px-6 md:order-first order-last">
          <h2 class="text-xl md:text-3xl font-bold text-brand-morado">{{ product.nombre }}</h2>
          <p class="text-gray-600 md:text-lg mt-1">{{ product.categorias?.nombre || 'Galleta' }}</p>
          <p class="text-gray-700 mt-4 text-sm md:text-base flex-grow">{{ product.descripcion }}</p>

          <div class="flex items-center justify-between mt-6">
            <p class="text-3xl font-bold text-brand-fucsia">${{ product.precio.toFixed(2) }}</p>
            <div class="flex items-center gap-3 bg-white/70 rounded-full p-1">
              <button @click="decrement"
                class="bg-brand-fucsia hover:bg-brand-fucsia-dark transition-colors text-white rounded-full w-8 h-8 text-lg font-bold flex items-center justify-center">-</button>
              <span class="text-xl font-bold text-brand-morado w-10 text-center">{{ quantity }}</span>
              <button @click="increment"
                class="bg-brand-fucsia hover:bg-brand-fucsia-dark transition-colors text-white rounded-full w-8 h-8 text-lg font-bold flex items-center justify-center">+</button>
            </div>
          </div>
          <CustomButton @click="onAddToCart" :disabled="isRecentlyAdded" class="w-full mt-4"
            :class="{ 'bg-green-500': isRecentlyAdded }">
            <span v-if="isRecentlyAdded" class="flex items-center justify-center gap-2">
              <CheckCircleIcon class="h-6 w-6" /> Añadido
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              Añadir {{ quantity }} al Carrito
            </span>
          </CustomButton>
        </div>

        <div class="w-full md:w-1/2 px-6 md:order-last order-first">
          <div class="bg-white p-1 rounded-2xl">
          <img :src="product.foto_url" :alt="product.nombre" class="w-full h-60 md:h-80 object-cover rounded-xl">

          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
