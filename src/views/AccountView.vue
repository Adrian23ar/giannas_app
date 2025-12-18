<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { getOrdersByUserId } from '@/services/orderService';
import { formatDisplayDate } from '@/utils/formatters.js';

const userStore = useUserStore();
const allOrders = ref([]);
const cargando = ref(true);

onMounted(async () => {
  if (userStore.isLoggedIn) {
    try {
      // Pedimos ambos tipos de pedidos en paralelo
      const [normalOrdersData] = await Promise.all([
        getOrdersByUserId(userStore.user.id),
      ]);

      // Mapeamos los datos para que tengan una estructura consistente
      const normalOrders = normalOrdersData.map(o => ({ ...o, type: 'normal' }));

      // Combinamos y ordenamos por fecha
      allOrders.value = [...normalOrders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    } catch (error) {
      console.error("Error al cargar el historial de pedidos:", error);
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
          <h2 class="text-2xl font-bold border-b pb-4">Mi Historial</h2>
          <div v-if="cargando" class="text-center py-8">Cargando historial...</div>
          <div v-else-if="allOrders.length > 0" class="space-y-4 mt-4">
            <div v-for="order in allOrders" :key="`${order.type}-${order.id}`"
              class="border p-4 rounded-md flex justify-between items-start">

              <div v-if="order.type === 'normal'" class="w-full">
                <div class="flex justify-between items-center">
                  <p class="font-bold">Pedido #{{ order.id }}</p>
                  <p class="font-bold text-lg">${{ order.total.toFixed(2) }}</p>
                </div>
                <p class="text-sm text-gray-500">Fecha: {{ formatDisplayDate(order.created_at) }}</p>
                <p class="text-sm capitalize font-semibold"
                  :class="{ 'text-green-600': order.estado === 'completado', 'text-yellow-600': order.estado === 'verificando_pago' }">
                  {{ order.estado.replace(/_/g, ' ') }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <p>Aún no has realizado ningún pedido o solicitud.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
