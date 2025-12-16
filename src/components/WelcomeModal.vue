<script setup>
import { ref, onMounted } from 'vue'
import CustomButton from './CustomButton.vue'
import { CheckIcon, ShoppingBagIcon, CreditCardIcon, TicketIcon } from '@heroicons/vue/24/outline'

const isOpen = ref(false)
const dontShowAgain = ref(false)

onMounted(() => {
  // Verificamos si el usuario ya decidió ocultarlo
  const shouldHide = localStorage.getItem('giannas_welcome_hidden')

  if (!shouldHide) {
    // Pequeño delay para que la animación se aprecie mejor al entrar
    setTimeout(() => {
      isOpen.value = true
    }, 800)
  }
})

function closeModal() {
  isOpen.value = false

  if (dontShowAgain.value) {
    localStorage.setItem('giannas_welcome_hidden', 'true')
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">

      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="closeModal"></div>

      <div class="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div class="h-40 bg-pink-100 relative shrink-0">
          <img src="/welcome.webp" alt="Bienvenido a Gianna's" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <div class="px-8 pt-2 pb-6 overflow-y-auto">
          <h2 class="text-2xl font-bold text-brand-morado text-center mb-2 leading-tight">
            ¡Bienvenid@ al Menú de <br><span class="text-brand-fucsia">Gianna's Cookies!</span>
          </h2>

          <p class="text-gray-500 text-center text-sm mb-6">
            Pedir tus galletas favoritas es muy fácil:
          </p>

          <div class="space-y-4">
            <div class="flex gap-4 items-start">
              <div class="bg-pink-100 p-2 rounded-full text-brand-fucsia shrink-0">
                <ShoppingBagIcon class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-gray-800 text-sm">1. Arma tu pedido</h3>
                <p class="text-xs text-gray-500">Agrega todos tus antojos al carrito de compras.</p>
              </div>
            </div>

            <div class="flex gap-4 items-start">
              <div class="bg-pink-100 p-2 rounded-full text-brand-fucsia shrink-0">
                <CreditCardIcon class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-gray-800 text-sm">2. Paga Online o Agenda</h3>
                <p class="text-xs text-gray-500">Procesa tu pago directamente o agenda tu pedido para una fecha especial.</p>
              </div>
            </div>

            <div class="flex gap-4 items-start">
              <div class="bg-pink-100 p-2 rounded-full text-brand-fucsia shrink-0">
                <TicketIcon class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-gray-800 text-sm">3. Guarda tu Orden</h3>
                <p class="text-xs text-gray-500">Al finalizar, conserva tu número de pedido. ¡Cualquier duda contáctanos al WhatsApp!</p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-gray-50 border-t border-gray-100 shrink-0">

          <CustomButton @click="closeModal" class="w-full py-3 text-lg shadow-lg mb-4">
            Ok, ¡Quiero ver el menú!
          </CustomButton>

          <label class="flex items-center justify-center gap-2 cursor-pointer group select-none">
            <div class="relative flex items-center">
              <input type="checkbox" v-model="dontShowAgain" class="peer sr-only">
              <div class="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-brand-fucsia peer-checked:border-brand-fucsia transition-colors"></div>
              <CheckIcon class="absolute w-3.5 h-3.5 text-white left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
            </div>
            <span class="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">No volver a mostrar este mensaje</span>
          </label>

        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .relative {
  transform: scale(0.9) translateY(20px);
}
.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
