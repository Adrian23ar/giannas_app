<script setup>
import { ref, onMounted } from 'vue'
// Importamos nuestro nuevo servicio y componente
import { getDashboardStats } from '@/services/dashboardService'
import StatCard from '@/components/StatCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue';
// Importamos los íconos
import { CubeIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// --- ESTADO DE LA VISTA ---
const stats = ref({
  totalProducts: 0,
  inventoryValue: 0,
  lowStockCount: 0,
})
const cargando = ref(true)

// --- LÓGICA DE LA VISTA ---
async function obtenerEstadisticas() {
  cargando.value = true
  try {
    // Usamos el servicio para obtener todas las estadísticas de una vez
    stats.value = await getDashboardStats()
  } catch (error) {
    alert('No se pudieron cargar las estadísticas del dashboard.')
  } finally {
    cargando.value = false
  }
}

onMounted(obtenerEstadisticas)
</script>

<template>
  <div>
    <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SkeletonLoader class="h-28" />
      <SkeletonLoader class="h-28" />
      <SkeletonLoader class="h-28" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard title="Total Productos" :value="stats.totalProducts" bgColorClass="bg-blue-100"
        iconColorClass="text-blue-600">
        <CubeIcon class="h-6 w-6" />
      </StatCard>

      <StatCard title="Valor Inventario" :value="`$${stats.inventoryValue.toFixed(2)}`" bgColorClass="bg-green-100"
        iconColorClass="text-green-600">
        <BanknotesIcon class="h-6 w-6" />
      </StatCard>

      <StatCard title="Bajo Stock (<5)" :value="stats.lowStockCount" bgColorClass="bg-red-100"
        iconColorClass="text-red-600">
        <ExclamationTriangleIcon class="h-6 w-6" />
      </StatCard>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-bold text-gray-800">¡Bienvenido!</h2>
      <p class="text-gray-600 mt-2">Usa el menú de la izquierda para gestionar tu tienda.</p>
    </div>
  </div>
</template>
