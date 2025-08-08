<script setup>
import { ref, onMounted, computed } from 'vue'
import * as specialOrderService from '@/services/specialOrderService'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import CustomButton from '@/components/CustomButton.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const toast = useToast()
const allOrders = ref([])
const selectedOrder = ref(null)
const loading = ref(true)

// Lista de estados posibles para el dropdown de gestión
const statusOptions = [
  'pendiente', 'contactado', 'cotizado',
  'confirmado', 'en_preparacion', 'finalizado', 'cancelado'
]

// Carga inicial de todas las solicitudes
async function fetchOrders() {
  loading.value = true
  try {
    allOrders.value = await specialOrderService.getSpecialOrders()
  } catch (error) {
    toast.error('Error al cargar las solicitudes.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)

// Función para seleccionar una orden de la lista
function selectOrder(order) {
  // Hacemos una copia para no modificar el original directamente hasta guardar
  selectedOrder.value = { ...order }
}

// Guarda los cambios hechos en la orden seleccionada (estado y/o precio)
async function handleUpdateOrder() {
  if (!selectedOrder.value) return

  const updates = {
    estado: selectedOrder.value.estado,
    presupuesto_final: selectedOrder.value.presupuesto_final
  }

  try {
    const updatedOrder = await specialOrderService.updateSpecialOrder(selectedOrder.value.id, updates)
    // Actualizamos la lista principal con los nuevos datos
    const index = allOrders.value.findIndex(o => o.id === updatedOrder.id)
    if (index !== -1) {
      allOrders.value[index] = updatedOrder
    }
    toast.success('Solicitud actualizada con éxito.')
  } catch (error) {
    toast.error('Error al actualizar la solicitud.')
  }
}

// Función para formatear fechas de manera legible
function formatDate(dateString) {
  if (!dateString) return 'No especificada'
  return format(new Date(dateString), 'PPP', { locale: es })
}

// Función para dar color al estado
function getStatusClass(status) {
  switch (status) {
    case 'pendiente': return 'bg-yellow-100 text-yellow-800'
    case 'confirmado':
    case 'en_preparacion': return 'bg-blue-100 text-blue-800'
    case 'finalizado': return 'bg-green-100 text-green-800'
    case 'cancelado': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// ---- INICIO DEL CAMBIO: LÓGICA PARA RESPONSIVE ----
// Esta propiedad computada nos dirá si estamos en una pantalla lo suficientemente grande
// para mostrar ambas columnas a la vez.
const isDesktop = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1024 // 1024px es el breakpoint 'lg' de Tailwind
  }
  return true // Por defecto en SSR, asumimos escritorio
})

// Esta función limpia la selección y vuelve a la lista en vista móvil
function clearSelection() {
  selectedOrder.value = null
}
</script>

<template>
  <div class="relative h-[calc(100vh-5rem)] overflow-hidden lg:flex lg:h-auto">

    <div class="w-full shadow-lg lg:w-1/3 lg:border-r overflow-y-auto transition-transform duration-300 ease-in-out" :class="{
      '-translate-x-full lg:translate-x-0': selectedOrder && !isDesktop,
      'translate-x-0': !selectedOrder || isDesktop
    }">
      <div class="p-4 border-b sticky top-0 bg-white z-10">
        <h1 class="text-2xl font-bold text-brand-morado">Pedidos Especiales</h1>
        <p class="text-sm text-gray-500">{{ allOrders.length }} solicitudes en total</p>
      </div>
      <div v-if="loading">
        <p class="p-4 text-gray-500">Cargando solicitudes...</p>
      </div>
      <ul v-else class="divide-y">
        <li v-for="order in allOrders" :key="order.id" @click="selectOrder(order)"
          class="p-4 cursor-pointer transition-colors bg-pink-100 hover:bg-pink-200"
          :class="{ 'bg-rose-200': selectedOrder?.id === order.id }">
          <div class="flex justify-between items-center">
            <p class="font-semibold text-gray-800">{{ order.nombre_completo }}</p>
            <span :class="getStatusClass(order.estado)"
              class="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize flex-shrink-0">
              {{ order.estado.replace('_', ' ') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Solicitado: {{ formatDate(order.created_at) }}</p>
        </li>
      </ul>
    </div>

    <div
      class="absolute top-0 left-0 w-full h-full bg-white p-6 lg:p-8 overflow-y-auto transition-transform duration-300 ease-in-out lg:static lg:w-2/3 lg:translate-x-0"
      :class="{ 'translate-x-0': selectedOrder, 'translate-x-full': !selectedOrder }">
      <div v-if="!selectedOrder && isDesktop" class="flex items-center justify-center h-full">
        <p class="text-gray-500 text-lg">Selecciona una solicitud de la lista para ver los detalles.</p>
      </div>
      <div v-if="selectedOrder">
        <button @click="clearSelection"
          class="lg:hidden flex items-center gap-2 mb-4 text-sm font-semibold text-brand-morado">
          <ArrowLeftIcon class="w-5 h-5" />
          Volver a la lista
        </button>

        <h2 class="text-3xl font-bold text-gray-800">Detalles de la Solicitud</h2>
        <p class="text-brand-morado font-semibold">#SO-{{ String(selectedOrder.id).padStart(5, '0') }}</p>

        <div class="mt-8 space-y-6">
          <div>
            <h3 class="text-lg font-semibold border-b pb-2">Información del Cliente</h3>
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <p><strong>Nombre:</strong> {{ selectedOrder.nombre_completo }}</p>
              <p><strong>Email:</strong> <a :href="`mailto:${selectedOrder.email}`"
                  class="text-blue-600 hover:underline">{{ selectedOrder.email }}</a></p>
              <p class="sm:col-span-2"><strong>Teléfono:</strong> {{ selectedOrder.telefono || 'No especificado' }}</p>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold border-b pb-2">Información del Pedido</h3>
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <p><strong>Fecha del Evento:</strong> {{ formatDate(selectedOrder.fecha_evento) }}</p>
              <p><strong>Personas (aprox.):</strong> {{ selectedOrder.cantidad_personas || 'No especificado' }}</p>
            </div>
            <div class="mt-4 text-sm">
              <p class="font-semibold">Descripción:</p>
              <p class="mt-1 p-4 bg-gray-100 rounded-md whitespace-pre-wrap">{{ selectedOrder.descripcion_pedido }}</p>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold border-b pb-2">Gestionar Solicitud</h3>
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div>
                <label for="estado" class="block text-sm font-medium text-gray-700">Estado del Pedido</label>
                <select v-model="selectedOrder.estado" id="estado"
                  class="mt-1 block w-full p-2 border border-gray-300 rounded-md capitalize">
                  <option v-for="status in statusOptions" :key="status" :value="status">{{ status.replace('_', ' ') }}
                  </option>
                </select>
              </div>
              <div>
                <label for="precio" class="block text-sm font-medium text-gray-700">Precio Final Acordado ($)</label>
                <input v-model.number="selectedOrder.presupuesto_final" type="number" step="0.01" id="precio"
                  placeholder="0.00" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              </div>
            </div>
            <div class="mt-6 text-right">
              <CustomButton @click="handleUpdateOrder">
                Guardar Cambios
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
