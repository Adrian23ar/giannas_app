<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { getOrdersByUserId } from '@/services/orderService';
import { formatDisplayDate } from '@/utils/formatters.js';

const userStore = useUserStore();
const pedidos = ref([]);
const cargando = ref(true);

onMounted(async () => {
  if (userStore.isLoggedIn) {
    try {
      pedidos.value = await getOrdersByUserId(userStore.user.id);
    } catch (error) {
      // Manejar error con un toast si se desea
    } finally {
      cargando.value = false;
    }
  }
});
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-brand-morado mb-8">Mi Cuenta</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold border-b pb-4">Mi Perfil</h2>
          <div class="space-y-3 mt-4">
            <div>
              <p class="text-sm font-semibold text-gray-500">Nombre</p>
              <p>{{ userStore.userFullName }}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-500">Correo Electrónico</p>
              <p>{{ userStore.userEmail }}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-500">Teléfono</p>
              <p>{{ userStore.userPhone }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="md:col-span-2">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold border-b pb-4">Mis Pedidos</h2>
          <div v-if="cargando" class="text-center py-8">Cargando historial...</div>
          <div v-else-if="pedidos.length > 0" class="space-y-4 mt-4">
            <div v-for="pedido in pedidos" :key="pedido.id"
              class="border p-4 rounded-md flex justify-between items-center">
              <div>
                <p class="font-bold">Pedido #{{ pedido.id }}</p>
                <p class="text-sm text-gray-500">Fecha: {{ formatDisplayDate(pedido.created_at) }}</p>
                <p class="text-sm capitalize font-semibold"
                  :class="{ 'text-green-600': pedido.estado === 'completado', 'text-yellow-600': pedido.estado === 'verificando_pago' }">
                  {{ pedido.estado.replace(/_/g, ' ') }}
                </p>
              </div>
              <div>
                <p class="font-bold text-lg">${{ pedido.total.toFixed(2) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <p>Aún no has realizado ningún pedido.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
