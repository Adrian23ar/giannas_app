<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { findOrderById } from '@/services/orderService';
import CustomButton from '@/components/CustomButton.vue';
import { formatDisplayDate } from '@/utils/formatters.js'

const toast = useToast();
const orderId = ref('');
const orderDetails = ref(null);
const isLoading = ref(false);
const errorMsg = ref('');

async function searchOrder() {
  if (!orderId.value) {
    toast.error('Por favor, introduce un número de orden.');
    return;
  }

  isLoading.value = true;
  orderDetails.value = null;
  errorMsg.value = '';

  try {
    orderDetails.value = await findOrderById(orderId.value);
  } catch (error) {
    errorMsg.value = error.message;
    toast.error(error.message);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-brand-morado mb-2">Seguimiento de Pedido</h1>
    <p class="text-gray-600 mb-8">Introduce el número de tu orden para ver su estado actual.</p>

    <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <form @submit.prevent="searchOrder" class="flex gap-4">
        <input v-model="orderId" type="number" placeholder="Ej: 12345"
          class="flex-grow p-2 border border-gray-300 rounded-md shadow-sm" />
        <CustomButton type="submit" :disabled="isLoading">
          {{ isLoading ? 'Buscando...' : 'Buscar' }}
        </CustomButton>
      </form>
    </div>

    <div v-if="orderDetails" class="max-w-2xl mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold">Detalles del Pedido #{{ orderDetails.id }}</h2>
      <p class="text-sm text-gray-500">Realizado el: {{ formatDisplayDate(orderDetails.created_at) }}</p>

      <div class="mt-4">
        <p class="font-semibold">Estado actual:</p>
        <p class="text-lg font-bold text-brand-fucsia capitalize">{{ orderDetails.estado.replace(/_/g, ' ') }}</p>
      </div>

      <div v-if="orderDetails.pagos && orderDetails.pagos.length > 0" class="mt-6 border-t pt-4">
        <h3 class="font-semibold mb-2">Detalles del Pago:</h3>
        <div class="text-sm space-y-1">
          <p>
            <strong>Método:</strong> {{ orderDetails.pagos[0].metodos_pago?.nombre || 'No disponible' }}
          </p>
          <p>
            <strong>Referencia:</strong> {{ orderDetails.pagos[0].nro_referencia }}
          </p>
        </div>
      </div>

      <div class="mt-6 border-t pt-4">
        <h3 class="font-semibold mb-2">Resumen de tu compra:</h3>
        <ul class="space-y-2">
          <li v-for="item in orderDetails.detalles_pedido" :key="item.productos.nombre"
            class="flex justify-between text-sm">
            <span>{{ item.productos.nombre }} x {{ item.cantidad }}</span>
            <span>${{ (item.precio_unitario * item.cantidad).toFixed(2) }}</span>
          </li>
        </ul>
        <div class="flex justify-between font-bold text-lg mt-4 border-t pt-2">
          <span>Total:</span>
          <span>${{ orderDetails.total.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div v-if="errorMsg && !isLoading" class="text-center mt-8">
      <p class="text-red-600">{{ errorMsg }}</p>
    </div>
  </div>
</template>
