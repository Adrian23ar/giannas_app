<script setup>
import { useCartStore } from '@/stores/cartStore'
import { RouterLink } from 'vue-router'
import { TrashIcon, ShoppingCartIcon } from '@heroicons/vue/24/outline'
import EmptyState from '@/components/EmptyState.vue'

const cartStore = useCartStore()

function orderViaWhatsApp() {
  const phoneNumber = '+584246574752';

  // Construimos la lista de productos
  const productList = cartStore.items.map(item => {
    return `- ${item.quantity} x ${item.nombre}`;
  }).join('\n'); // El '\n' crea un salto de línea

  // Creamos el mensaje completo
  const message = `¡Hola Gianna's Cookies!\n\nQuisiera hacer el siguiente pedido:\n\n${productList}\n\n*Total: $${cartStore.subtotal.toFixed(2)}*\n\n¡Gracias!`;

  // Codificamos el mensaje para que sea seguro en una URL
  const encodedMessage = encodeURIComponent(message);

  // Creamos la URL final
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  https://wa.me/+58%20424-6574752?text=%C2%A1Hola%20Gianna%27s%20Cookies!%20%F0%9F%8D%AA%0A%0AQuisiera%20hacer%20el%20siguiente%20pedido%3A%0A%0A-%201%20x%20Galleta%0A%0A*Total%3A%20%2410.00*%0A%0A%C2%A1Gracias!
  // Abrimos la URL en una nueva pestaña
  window.open(whatsappUrl, '_blank');
}
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-brand-morado mb-8">Tu Carrito de Compras</h1>

    <div v-if="cartStore.items.length === 0" class="text-center p-12 border-2 border-dashed rounded-lg">
      <EmptyState title="Carrito Vacio" message="Añade productos a tu carrito para verlos aqui.">
        <template #icon>
          <ShoppingCartIcon class="h-8 w-8 text-gray-400" />
        </template>
      </EmptyState>
      <RouterLink to="/" class="mt-4 inline-block bg-brand-fucsia text-white font-bold py-2 px-6 rounded-md">
        Ver catálogo
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-4">
        <div v-for="item in cartStore.items" :key="item.id"
          class="flex flex-wrap items-center gap-x-4 gap-y-3 bg-white p-4 rounded-lg shadow-md">

          <img :src="item.foto_url" :alt="item.nombre" class="w-24 h-24 rounded-md object-cover">

          <div class="flex-grow min-w-[150px]">
            <h3 class="font-bold text-lg">{{ item.nombre }}</h3>
            <p class="text-gray-600">${{ item.precio.toFixed(2) }}</p>
          </div>

          <div class="w-full sm:w-auto flex items-center justify-end gap-4">

            <div class="flex items-center gap-2 border rounded-md">
              <button @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                class="px-3 py-1 font-bold text-brand-morado">-</button>
              <span class="font-semibold">{{ item.quantity }}</span>
              <button @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                class="px-3 py-1 font-bold text-brand-morado">+</button>
            </div>

            <p class="font-bold w-20 text-right text-lg">${{ (item.precio * item.quantity).toFixed(2) }}</p>

            <button @click="cartStore.removeFromCart(item.id)" class="text-gray-500 hover:text-red-600">
              <TrashIcon class="h-6 w-6" />
            </button>

          </div>

        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow-md sticky top-28">
          <h2 class="text-2xl font-bold border-b pb-4">Resumen del Pedido</h2>
          <div class="flex justify-between items-center mt-4">
            <p class="text-gray-600">Subtotal</p>
            <p class="font-bold text-lg">${{ cartStore.subtotal.toFixed(2) }}</p>
          </div>
          <p class="text-xs text-gray-500 mt-2">Costos de envío se calcularán en el siguiente paso.</p>
          <RouterLink to="/checkout"
            class="block text-center w-full mt-6 bg-brand-fucsia text-white font-bold py-3 rounded-md hover:bg-opacity-90">
            Proceder al Pago
          </RouterLink>

          <div class="flex items-center gap-2 mt-4">
            <div class="flex-grow border-t"></div>
            <span class="text-xs text-gray-500">O</span>
            <div class="flex-grow border-t"></div>
          </div>

          <button @click="orderViaWhatsApp"
            class="flex items-center justify-center gap-2 w-full mt-4 bg-green-500 text-white font-bold py-3 rounded-md hover:bg-green-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-6 h-6" viewBox="0 0 50 50">
              <path
                d="M25,2C12.318,2,2,12.318,2,25c0,3.96,1.023,7.854,2.963,11.29L2.037,46.73c-0.096,0.343-0.003,0.711,0.245,0.966 C2.473,47.893,2.733,48,3,48c0.08,0,0.161-0.01,0.24-0.029l10.896-2.699C17.463,47.058,21.21,48,25,48c12.682,0,23-10.318,23-23 S37.682,2,25,2z M36.57,33.116c-0.492,1.362-2.852,2.605-3.986,2.772c-1.018,0.149-2.306,0.213-3.72-0.231 c-0.857-0.27-1.957-0.628-3.366-1.229c-5.923-2.526-9.791-8.415-10.087-8.804C15.116,25.235,13,22.463,13,19.594 s1.525-4.28,2.067-4.864c0.542-0.584,1.181-0.73,1.575-0.73s0.787,0.005,1.132,0.021c0.363,0.018,0.85-0.137,1.329,1.001 c0.492,1.168,1.673,4.037,1.819,4.33c0.148,0.292,0.246,0.633,0.05,1.022c-0.196,0.389-0.294,0.632-0.59,0.973 s-0.62,0.76-0.886,1.022c-0.296,0.291-0.603,0.606-0.259,1.19c0.344,0.584,1.529,2.493,3.285,4.039 c2.255,1.986,4.158,2.602,4.748,2.894c0.59,0.292,0.935,0.243,1.279-0.146c0.344-0.39,1.476-1.703,1.869-2.286 s0.787-0.487,1.329-0.292c0.542,0.194,3.445,1.604,4.035,1.896c0.59,0.292,0.984,0.438,1.132,0.681 C37.062,30.587,37.062,31.755,36.57,33.116z">
              </path>
            </svg>
            Pedir por WhatsApp
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
