<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardData } from '@/services/dashboardService'
import { useToast } from 'vue-toastification'
import StatCard from '@/components/admin/StatCard.vue'
import SalesChart from '@/components/admin/SalesChart.vue'
import SkeletonLoader from '@/components/shared/SkeletonLoader.vue'
import { BanknotesIcon, ShoppingCartIcon, PercentBadgeIcon } from '@heroicons/vue/24/outline'

const toast = useToast()
const cargando = ref(true)
const periodo = ref(7)

// ✨ CORRECCIÓN: Inicializamos 'stats' con valores por defecto ✨
const stats = ref({
  totalRevenue: 0,
  totalOrders: 0,
  averageOrderValue: 0,
})
const chartData = ref({ labels: [], datasets: [] })
const topSellingProducts = ref([])

async function fetchReports(days) {
  cargando.value = true
  periodo.value = days
  try {
    const data = await getDashboardData(days)
    stats.value = data.stats
    chartData.value = data.chartData
    topSellingProducts.value = data.topSellingProducts
  } catch (error) {
    toast.error('Error al cargar los informes.')
    console.error(error)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  fetchReports(periodo.value)
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard de Ventas</h1>
        <p class="text-sm text-gray-500">Un resumen del rendimiento de tu tienda.</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="fetchReports(7)" :class="periodo === 7 ? 'bg-brand-fucsia text-white' : 'bg-white'"
          class="px-3 py-1 rounded-md text-sm font-medium">7 Días</button>
        <button @click="fetchReports(30)" :class="periodo === 30 ? 'bg-brand-fucsia text-white' : 'bg-white'"
          class="px-3 py-1 rounded-md text-sm font-medium">30 Días</button>
        <button @click="fetchReports(90)" :class="periodo === 90 ? 'bg-brand-fucsia text-white' : 'bg-white'"
          class="px-3 py-1 rounded-md text-sm font-medium">90 Días</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-if="cargando" v-for="n in 3" :key="n">
        <SkeletonLoader class="h-28" />
      </div>
      <template v-else>
        <StatCard title="Ingresos Totales" :value="`$${stats.totalRevenue.toFixed(2)}`" bgColorClass="bg-green-100"
          iconColorClass="text-green-600">
          <BanknotesIcon class="h-6 w-6" />
        </StatCard>
        <StatCard title="Pedidos Completados" :value="stats.totalOrders" bgColorClass="bg-blue-100"
          iconColorClass="text-blue-600">
          <ShoppingCartIcon class="h-6 w-6" />
        </StatCard>
        <StatCard title="Valor Promedio" :value="`$${stats.averageOrderValue.toFixed(2)}`" bgColorClass="bg-indigo-100"
          iconColorClass="text-indigo-600">
          <PercentBadgeIcon class="h-6 w-6" />
        </StatCard>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <div v-if="cargando" class="h-80">
          <SkeletonLoader class="h-full w-full" />
        </div>
        <div v-else class="h-80">
          <SalesChart :chartData="chartData" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md">
        <h3 class="font-bold text-lg mb-4">Top 5 Productos Más Vendidos</h3>
        <div v-if="cargando">
          <div v-for="n in 5" :key="n" class="flex items-center gap-4 py-2">
            <SkeletonLoader class="w-10 h-10 rounded-full flex-shrink-0" />
            <div class="flex-grow space-y-2">
              <SkeletonLoader class="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <ul v-else class="space-y-4">
          <li v-for="product in topSellingProducts" :key="product.name" class="flex items-center gap-4">
            <img :src="product.photo" :alt="product.name" class="w-10 h-10 object-cover rounded-full bg-gray-200">
            <div class="flex-grow">
              <p class="font-semibold text-sm">{{ product.name }}</p>
            </div>
            <span class="font-bold text-gray-800">{{ product.quantity }} <span
                class="font-normal text-sm text-gray-500">vendidos</span></span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
