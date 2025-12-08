<script setup>
import { ref, watch, computed } from 'vue';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import CustomButton from './CustomButton.vue';

// 1. ESTADO DE CANTIDAD
const quantity = ref(1);

// 2. ESTADO DE VARIANTES
const selectedVariants = ref({});

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

const emit = defineEmits(['close', 'addToCart'])

// --- OBSERVADORES ---
watch(() => props.product, () => {
  quantity.value = 1;
  selectedVariants.value = {};
});

// --- LÓGICA DE VARIANTES ---

function isOptionDisabled(groupIndex, opcion) {
  const grupo = props.product.configuracion_variantes[groupIndex];
  const seleccionActual = selectedVariants.value[groupIndex] || [];

  if (grupo.max === 1) return false;

  if (seleccionActual.length >= grupo.max && !seleccionActual.includes(opcion)) {
    return true;
  }
  return false;
}

function toggleOption(groupIndex, opcion, max) {
  if (isOptionDisabled(groupIndex, opcion)) return;

  if (!selectedVariants.value[groupIndex]) {
    selectedVariants.value[groupIndex] = [];
  }

  const grupoSeleccion = selectedVariants.value[groupIndex];
  const yaSeleccionado = grupoSeleccion.includes(opcion);

  if (yaSeleccionado) {
    selectedVariants.value[groupIndex] = grupoSeleccion.filter(item => item !== opcion);
  } else {
    if (max === 1) {
      selectedVariants.value[groupIndex] = [opcion];
    } else {
      if (grupoSeleccion.length < max) {
        selectedVariants.value[groupIndex].push(opcion);
      }
    }
  }
}

function isSelected(groupIndex, opcion) {
  return selectedVariants.value[groupIndex]?.includes(opcion);
}

// --- VALIDACIÓN GENERAL ---
const isValidSelection = computed(() => {
  if (!props.product?.configuracion_variantes) return true;

  return props.product.configuracion_variantes.every((grupo, index) => {
    const seleccionados = selectedVariants.value[index]?.length || 0;
    return seleccionados >= (grupo.min || 0);
  });
});

// --- OTRAS FUNCIONES ---
function increment() { quantity.value++; }
function decrement() { if (quantity.value > 1) quantity.value--; }

function onAddToCart() {
  if (!isValidSelection.value) return;
  emit('addToCart', {
    product: props.product,
    quantity: quantity.value,
    variants: selectedVariants.value
  });
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" @click.self="emit('close')"
      class="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">

      <div v-if="product"
        class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] lg:h-[90vh] flex flex-col md:flex-row relative overflow-hidden">

        <button @click="emit('close')"
          class="absolute top-4 right-4 z-30 bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 rounded-full p-2 shadow-md transition-all">
          <XMarkIcon class="w-5 h-5" />
        </button>

        <div class="hidden md:block w-5/12 h-full bg-gray-100 relative shrink-0">
          <img :src="product.foto_url" :alt="product.nombre" class="w-full h-full object-cover">
          <div class="absolute inset-y-0 right-0 w-10 h-full bg-gradient-to-r from-transparent to-white"></div>
        </div>

        <div class="w-full md:w-7/12 flex flex-col h-full bg-white relative overflow-hidden">

          <div class="flex-1 overflow-y-auto custom-scrollbar">

            <div class="md:hidden w-full h-56 relative">
              <img :src="product.foto_url" :alt="product.nombre" class="w-full h-full object-cover">
              <div class="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white to-transparent"></div>
            </div>

            <div class="p-5 md:p-8">
              <div class="mb-6">
                <h2 class="text-2xl md:text-3xl font-bold text-brand-morado leading-tight pr-8">{{ product.nombre }}
                </h2>
                <div class="flex items-center gap-2 mt-2">
                  <span
                    class="text-xs font-bold text-brand-fucsia bg-pink-50 px-2 py-1 rounded-md uppercase tracking-wider">
                    {{ product.categorias?.nombre }}
                  </span>
                </div>
                <p class="text-gray-600 mt-4 text-sm leading-relaxed">{{ product.descripcion }}</p>
              </div>

              <div v-if="product.configuracion_variantes && product.configuracion_variantes.length > 0"
                class="space-y-6 pb-4">
                <div v-for="(grupo, index) in product.configuracion_variantes" :key="index"
                  class="bg-pink-50/30 p-4 rounded-xl border border-pink-100">

                  <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-gray-800 text-base">{{ grupo.titulo }}</h3>
                    <span v-if="grupo.min > 0"
                      class="text-[10px] font-bold uppercase tracking-wider bg-brand-morado text-white px-2 py-1 rounded shadow-sm">
                      Requerido
                    </span>
                    <span v-else
                      class="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                      Opcional
                    </span>
                  </div>

                  <p class="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                    <span class="w-1 h-4 bg-brand-fucsia rounded-full"></span>
                    Elige {{ grupo.max > 1 ? `hasta ${grupo.max} opciones` : '1 opción' }}
                  </p>

                  <div class="space-y-2">
                    <label v-for="opcion in grupo.opciones" :key="opcion"
                      class="group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none"
                      :class="[
                        isSelected(index, opcion)
                          ? 'border-brand-fucsia bg-white ring-1 ring-brand-fucsia shadow-sm z-10'
                          : isOptionDisabled(index, opcion)
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
                      ]">

                      <span class="text-sm font-medium transition-colors"
                        :class="isSelected(index, opcion) ? 'text-brand-fucsia font-bold' : 'text-gray-700'">
                        {{ opcion }}
                      </span>

                      <div class="relative flex items-center justify-center shrink-0">
                        <input type="checkbox" class="sr-only" :disabled="isOptionDisabled(index, opcion)"
                          :checked="isSelected(index, opcion)" @change="toggleOption(index, opcion, grupo.max)">

                        <div v-if="grupo.max === 1"
                          class="w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                          :class="isSelected(index, opcion) ? 'border-brand-fucsia bg-brand-fucsia' : 'border-gray-300 bg-white'">
                          <div class="w-2 h-2 rounded-full bg-white transition-transform duration-200"
                            :class="isSelected(index, opcion) ? 'scale-100' : 'scale-0'"></div>
                        </div>

                        <div v-else class="w-5 h-5 rounded border-2 transition-all flex items-center justify-center"
                          :class="isSelected(index, opcion) ? 'border-brand-fucsia bg-brand-fucsia' : 'border-gray-300 bg-white'">
                          <svg v-show="isSelected(index, opcion)" xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clip-rule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="p-4 md:px-8 md:py-5 bg-white border-t border-gray-100 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-20 shrink-0">

            <div class="flex items-center justify-between mb-4">
              <span class="text-gray-500 text-sm font-medium">Total a pagar:</span>
              <p class="text-2xl font-bold text-brand-fucsia tracking-tight">${{ (product.precio * quantity).toFixed(2)
              }}</p>
            </div>

            <div class="flex gap-3 h-12">
              <div class="flex items-center bg-gray-50 rounded-lg px-1 border border-gray-200 shrink-0">
                <button @click="decrement"
                  class="w-10 h-full text-xl text-gray-500 hover:text-brand-morado font-bold hover:bg-gray-100 rounded-md transition">-</button>
                <span class="w-8 text-center font-bold text-gray-800 text-lg">{{ quantity }}</span>
                <button @click="increment"
                  class="w-10 h-full text-xl text-gray-500 hover:text-brand-morado font-bold hover:bg-gray-100 rounded-md transition">+</button>
              </div>

              <CustomButton @click="onAddToCart" :disabled="isRecentlyAdded || !isValidSelection"
                class="flex-grow text-base shadow-xl shadow-brand-fucsia/15"
                :class="{ 'opacity-50 cursor-not-allowed': !isValidSelection && !isRecentlyAdded, 'bg-green-500 hover:bg-green-600 shadow-green-500/20': isRecentlyAdded }">

                <span v-if="isRecentlyAdded" class="flex items-center justify-center gap-2">
                  <CheckCircleIcon class="h-6 w-6" /> ¡Añadido!
                </span>

                <span v-else-if="!isValidSelection" class="flex items-center justify-center gap-2">
                  <ExclamationCircleIcon class="h-6 w-6" /> Selección incompleta
                </span>

                <span v-else>
                  Añadir al Carrito
                </span>
              </CustomButton>
            </div>
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

/* Scrollbar personalizada y suave */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #ced0d3;
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #bcc0c5;
}
</style>
