<script setup>
import { useCartStore } from '@/stores/cartStore'
import { RouterLink } from 'vue-router'
import { TrashIcon } from '@heroicons/vue/24/outline'

const cartStore = useCartStore()
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-brand-morado mb-8">Tu Carrito de Compras</h1>

    <div v-if="cartStore.items.length === 0" class="text-center p-12 border-2 border-dashed rounded-lg">
      <p class="text-gray-500 text-lg">Tu carrito está vacío.</p>
      <RouterLink to="/" class="mt-4 inline-block bg-brand-fucsia text-white font-bold py-2 px-6 rounded-md">
        Ver catálogo
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-4">
        <div v-for="item in cartStore.items" :key="item.id"
          class="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md">
          <img :src="item.foto_url" :alt="item.nombre" class="w-24 h-24 rounded-md object-cover">
          <div class="flex-grow">
            <h3 class="font-bold text-lg">{{ item.nombre }}</h3>
            <p class="text-gray-600">${{ item.precio.toFixed(2) }}</p>
          </div>
          <div class="flex items-center gap-2 border rounded-md">
            <button @click="cartStore.updateQuantity(item.id, item.quantity - 1)" class="px-3 py-1 font-bold">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="cartStore.updateQuantity(item.id, item.quantity + 1)" class="px-3 py-1 font-bold">+</button>
          </div>
          <p class="font-bold w-20 text-right">${{ (item.precio * item.quantity).toFixed(2) }}</p>
          <button @click="cartStore.removeFromCart(item.id)" class="text-gray-500 hover:text-red-600">
            <TrashIcon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow-md sticky top-28">
          <h2 class="text-2xl font-bold border-b pb-4">Resumen del Pedido</h2>
          <div class="flex justify-between items-center mt-4">
            <p class="text-gray-600">Subtotal</p>
            <p class="font-bold text-lg">${{ cartStore.totalPrice.toFixed(2) }}</p>
          </div>
          <p class="text-xs text-gray-500 mt-2">Costos de envío se calcularán en el siguiente paso.</p>
          <RouterLink to="/checkout"
            class="block text-center w-full mt-6 bg-brand-fucsia text-white font-bold py-3 rounded-md hover:bg-opacity-90">
            Proceder al Pago
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
