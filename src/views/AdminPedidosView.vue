<script setup>
// src/views/AdminPedidosView.vue
import { ref, onMounted, computed, Transition } from 'vue'
// Importamos las funciones de nuestro nuevo servicio
import { getOrders, getOrderDetails, updateOrderStatus } from '@/services/orderService'
import { formatDisplayDate } from '@/utils/formatters.js'
// Componentes y utilidades
import EmptyState from '@/components/EmptyState.vue';
import { ShoppingCartIcon } from '@heroicons/vue/24/outline';
import CustomButton from '@/components/CustomButton.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue';

// --- ESTADO DE LA VISTA ---
const pedidos = ref([])
const cargando = ref(true)
const modalActivo = ref(false)
const pedidoSeleccionado = ref(null)


// Llama al servicio para obtener la lista de pedidos
async function obtenerPedidos() {
  cargando.value = true
  try {
    pedidos.value = await getOrders()
  } catch (error) {
    alert('No se pudieron cargar los pedidos.')
  } finally {
    cargando.value = false
  }
}

// Llama al servicio para obtener los detalles y mostrar el modal
async function mostrarDetalles(pedido) {
  try {
    pedidoSeleccionado.value = await getOrderDetails(pedido.id)
    modalActivo.value = true
  } catch (error) {
    alert('No se pudieron cargar los detalles del pedido.')
  }
}

// Llama al servicio para actualizar el estado
async function actualizarEstado() {
  if (!pedidoSeleccionado.value) return
  try {
    const pedidoActualizado = await updateOrderStatus(
      pedidoSeleccionado.value.id,
      pedidoSeleccionado.value.estado
    )
    const index = pedidos.value.findIndex(p => p.id === pedidoActualizado.id)
    if (index !== -1) pedidos.value[index] = pedidoActualizado
    modalActivo.value = false
  } catch (error) {
    alert('Error al actualizar el estado.')
  }
}

// Crea un enlace a Google Maps con las coordenadas
const enlaceMapa = computed(() => {
  if (pedidoSeleccionado.value?.latitud && pedidoSeleccionado.value?.longitud) {
    return `https://www.google.com/maps?q=${pedidoSeleccionado.value.latitud},${pedidoSeleccionado.value.longitud}`
  }
  return '#'
})

onMounted(obtenerPedidos)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800">Gestión de Pedidos</h1>
    <p class="text-sm text-gray-500 mb-6">Revisa y actualiza el estado de los pedidos recibidos.</p>

    <div class="bg-white rounded-lg shadow-md overflow-x-auto">
      <table class="w-full text-sm text-left text-gray-600">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th class="px-6 py-3">ID Pedido</th>
            <th class="px-6 py-3">Fecha</th>
            <th class="px-6 py-3">Cliente</th>
            <th class="px-6 py-3">Total</th>
            <th class="px-6 py-3">Estado</th>
            <th class="px-6 py-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="cargando" v-for="n in 5" :key="`skeleton-${n}`">
            <td v-for="i in 6" :key="`cell-${i}`" class="px-6 py-4">
              <SkeletonLoader class="h-4 w-full" />
            </td>
          </tr>

          <tr v-else-if="pedidos.length > 0" v-for="pedido in pedidos" :key="pedido.id"
            class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">#{{ pedido.id }}</td>
            <td class="px-6 py-4">{{ formatDisplayDate(pedido.created_at) }}</td>
            <td class="px-6 py-4">{{ pedido.nombre_cliente }}</td>
            <td class="px-6 py-4">${{ pedido.total.toFixed(2) }}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="{
                'bg-yellow-100 text-yellow-800': pedido.estado === 'verificando_pago',
                'bg-blue-100 text-blue-800': pedido.estado === 'en_preparacion',
                'bg-indigo-100 text-indigo-800': pedido.estado === 'listo_para_entrega',
                'bg-green-100 text-green-800': pedido.estado === 'completado',
                'bg-red-100 text-red-800': pedido.estado === 'cancelado'
              }">{{ pedido.estado.replace(/_/g, ' ') }}</span>
            </td>
            <td class="px-6 py-4">
              <button @click="mostrarDetalles(pedido)" class="font-medium text-brand-fucsia hover:underline">Ver
                Detalles</button>
            </td>
          </tr>

          <tr v-else>
            <td colspan="6" class="p-0">
              <EmptyState title="No hay pedidos todavía" message="Cuando un cliente realice un pedido, aparecerá aquí.">
                <template #icon>
                  <ShoppingCartIcon class="h-8 w-8 text-gray-400" />
                </template>
              </EmptyState>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Transition name="fade">
      <div v-if="modalActivo" class="fixed inset-0 bg-black/50 flex justify-center items-center z-30">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b sticky top-0 bg-white z-10">
            <h2 class="text-2xl font-bold">Detalles del Pedido #{{ pedidoSeleccionado.id }}</h2>
            <button @click="modalActivo = false"
              class="absolute top-5 right-5 text-3xl text-gray-500 hover:text-gray-800 transition-colors">×</button>
          </div>
          <div v-if="pedidoSeleccionado" class="p-6 space-y-6">
            <section>
              <h3 class="font-bold mb-2">Datos del Cliente y Entrega</h3>
              <p><strong>Nombre:</strong> {{ pedidoSeleccionado.nombre_cliente }}</p>
              <p><strong>Teléfono:</strong> {{ pedidoSeleccionado.telefono_cliente }}</p>
              <p><strong>Método:</strong> {{ pedidoSeleccionado.metodo_entrega }}</p>
              <div v-if="pedidoSeleccionado.metodo_entrega === 'envio'">
                <p><strong>Referencia:</strong> {{ pedidoSeleccionado.direccion_envio }}</p>
                <a v-if="pedidoSeleccionado.latitud && pedidoSeleccionado.longitud" :href="enlaceMapa" target="_blank"
                  class="text-blue-600 hover:underline">Ver ubicación en mapa</a>
                <p v-else class="text-sm text-gray-400 italic">Ubicación no disponible</p>
              </div>
            </section>
            <section>
              <h3 class="font-bold mb-2">Detalles del Pago</h3>
              <p>
                <strong>Método:</strong>
                {{ pedidoSeleccionado.pagos[0]?.metodos_pago?.nombre || 'No especificado' }}
              </p>
              <p>
                <strong>Referencia:</strong>
                {{ pedidoSeleccionado.pagos[0]?.nro_referencia || 'N/A' }}
              </p>
              <p>
                <strong>Fecha:</strong>
                {{ formatDisplayDate(pedidoSeleccionado.pagos[0]?.fecha) }}
              </p>
              <p>
                <strong>Monto:</strong>
                ${{ pedidoSeleccionado.pagos[0]?.monto.toFixed(2) || '0.00' }}
              </p>
            </section>
            <section>
              <h3 class="font-bold mb-2">Productos Ordenados</h3>
              <ul>
                <li v-for="detalle in pedidoSeleccionado.detalles_pedido" :key="detalle.producto_id"
                  class="flex justify-between border-b py-1">
                  <span>{{ detalle.productos.nombre }} x {{ detalle.cantidad }}</span>
                  <span>${{ (detalle.precio_unitario * detalle.cantidad).toFixed(2) }}</span>
                </li>
              </ul>
              <p class="text-right font-bold mt-2">Total: ${{ pedidoSeleccionado.total.toFixed(2) }}</p>
            </section>
            <section class="border-t pt-4 flex flex-col gap-4">
              <label for="estado" class="block md:flex md:items-center text-center justify-around font-bold">
                <span>Actualizar Estado:
                  <select v-model="pedidoSeleccionado.estado" id="estado" class="mx-2 p-2 border rounded-md">
                    <option value="verificando_pago">Verificando Pago</option>
                    <option value="en_preparacion">En Preparación</option>
                    <option value="listo_para_entrega">Listo para Entrega</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </span>

                <CustomButton class="mt-4 md:mt-0 w-8/12 md:w-auto" @click="actualizarEstado">Actualizar</CustomButton>
              </label>

            </section>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
