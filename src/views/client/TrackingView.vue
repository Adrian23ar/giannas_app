<script setup>
import { ref } from 'vue'
import { findAnyOrder } from '@/services/orders/orderService'
import { useToast } from 'vue-toastification'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
  ClockIcon,
  CreditCardIcon
} from '@heroicons/vue/24/outline'

const trackingId = ref('')
const order = ref(null)
const loading = ref(false)
const toast = useToast()

// Diccionario de estados para colores y texto
const statusMap = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  verificando_pago: { label: 'Verificando Pago', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  pagado: { label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200' },
  preparacion: { label: 'En Preparación', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  en_camino: { label: 'En Camino', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  listo_recoger: { label: 'Listo para Recoger', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  entregado: { label: 'Entregado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
}

// Helpers para formato
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-VE')
const formatCurrency = (amount) => amount ? `$${Number(amount).toFixed(2)}` : '$0.00'

const handleSearch = async () => {
  if (!trackingId.value) return

  loading.value = true
  order.value = null

  try {
    order.value = await findAnyOrder(trackingId.value)
  } catch (error) {
    toast.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-brand-morado text-center mb-2">Seguimiento de Pedido</h1>
    <p class="text-center text-gray-600 mb-8">Ingresa tu número de orden para ver el estado en tiempo real.</p>

    <div class="flex gap-2 max-w-md mx-auto mb-10 shadow-lg p-2 bg-white rounded-full border border-gray-100">
      <input
        v-model="trackingId"
        @keyup.enter="handleSearch"
        type="text"
        placeholder="Ej: 154"
        class="flex-grow pl-4 pr-2 py-2 rounded-l-full outline-none text-gray-700 bg-transparent placeholder-gray-400"
      >
      <button
        @click="handleSearch"
        :disabled="loading"
        class="bg-brand-fucsia hover:bg-brand-fucsia-dark text-white px-6 py-2 rounded-full font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <MagnifyingGlassIcon v-if="!loading" class="h-5 w-5" />
        <span v-else>...</span>
        Buscar
      </button>
    </div>

    <Transition name="fade">
      <div v-if="order" class="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">

        <div class="bg-brand-morado text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p class="text-sm font-semibold">Orden #{{ order.id }}</p>
            <p class="text-xs opacity-90">{{ formatDate(order.created_at) }}</p>
          </div>
          <span
            class="px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm backdrop-blur-sm"
            :class="statusMap[order.estado]?.color || 'bg-gray-100 text-gray-800'"
          >
            {{ statusMap[order.estado]?.label || order.estado }}
          </span>
        </div>

        <div class="p-6 space-y-8">

          <div class="grid md:grid-cols-2 gap-8">

            <div class="space-y-4">
              <h3 class="text-lg font-bold text-gray-800 border-b pb-2">📦 Datos de Entrega</h3>

              <div v-if="order.es_agendado" class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p class="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                  <CalendarDaysIcon class="h-5 w-5" /> Pedido Agendado
                </p>
                <div class="text-sm text-gray-700 space-y-1 pl-7">
                  <p><strong>Fecha:</strong> {{ formatDate(order.fecha_agendada) }}</p>
                  <p><strong>Hora aprox:</strong> {{ order.hora_agendada }}</p>
                  <p><strong>Modalidad:</strong>
                    <span class="capitalize">{{ order.metodo_entrega === 'envio' ? 'Delivery Agendado' : 'Retiro Personal' }}</span>
                  </p>
                </div>
              </div>

              <div v-else class="p-4 bg-gray-50 rounded-lg">
                <p class="font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon class="h-5 w-5 text-gray-500" /> Pedido Inmediato
                </p>
                <p class="text-sm text-gray-600 pl-7 capitalize mt-1">
                  {{ order.metodo_entrega === 'envio' ? 'Delivery Express' : 'Retiro en Tienda' }}
                </p>
              </div>

              <div v-if="order.metodo_entrega === 'envio' || (order.es_agendado && order.metodo_entrega === 'envio')" class="flex items-start gap-2 text-sm text-gray-600 mt-2">
                <MapPinIcon class="h-5 w-5 text-brand-fucsia shrink-0" />
                <span>{{ order.direccion_envio || 'Dirección a coordinar' }}</span>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-bold text-gray-800 border-b pb-2">💳 Pago y Cliente</h3>
              <div class="text-sm space-y-3">
                <div class="flex items-center gap-2">
                  <div class="bg-gray-100 p-2 rounded-full"><CreditCardIcon class="h-4 w-4 text-gray-600"/></div>
                  <div>
                    <p class="font-medium text-gray-900">{{ order.pagos?.[0]?.metodos_pago?.nombre || 'Método no especificado' }}</p>
                    <p class="text-xs text-gray-500" v-if="order.pagos?.[0]?.nro_referencia">
                      Ref: {{ order.pagos[0].nro_referencia }}
                    </p>
                  </div>
                </div>
                <hr class="border-gray-100">
                <div>
                  <p class="text-gray-500 text-xs">Cliente</p>
                  <p class="font-medium text-gray-900">{{ order.nombre_cliente }}</p>
                  <p class="text-gray-600">{{ order.telefono_cliente }}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-bold text-gray-800 mb-4">🛍️ Productos</h3>
            <div class="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <table class="w-full text-sm text-left">
                <thead class="bg-gray-100 text-gray-600 font-medium">
                  <tr>
                    <th class="px-4 py-3">Producto</th>
                    <th class="px-4 py-3 text-right">Cant.</th>
                    <th class="px-4 py-3 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(item, index) in order.detalles_pedido" :key="index">
                    <td class="px-4 py-3">
                      <p class="font-medium text-gray-900">{{ item.productos.nombre }}</p>
                      <div v-if="item.variantes_elegidas" class="text-xs text-gray-500 mt-1">
                        {{ Object.values(item.variantes_elegidas).flat().join(', ') }}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-right text-gray-600">x{{ item.cantidad }}</td>
                    <td class="px-4 py-3 text-right font-medium text-gray-900">{{ formatCurrency(item.precio_unitario * item.cantidad) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2 border-t pt-4">
            <div v-if="order.costo_envio > 0" class="flex justify-between w-48 text-gray-600 text-sm">
              <span>Envío:</span>
              <span>{{ formatCurrency(order.costo_envio) }}</span>
            </div>
            <div class="flex justify-between w-48 text-xl font-bold text-brand-morado">
              <span>Total:</span>
              <span>{{ formatCurrency(order.total) }}</span>
            </div>
            <div v-if="order.total_bs" class="text-sm text-gray-500">
              (Ref. Bs {{ Number(order.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 }) }})
            </div>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
