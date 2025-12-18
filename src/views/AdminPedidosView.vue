<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router' // 1. Importar useRoute
import { supabase } from '../supabase'
import { useToast } from 'vue-toastification'
import {
  EyeIcon,
  CalendarIcon,
  TruckIcon,
  ShoppingBagIcon,
  XCircleIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'

const route = useRoute()     // 2. Instanciar route
const router = useRouter()   // 3. Instanciar router (para limpiar la URL luego)

// --- ESTADOS ---
const pedidos = ref([])
const loading = ref(true)
const filtroEstado = ref('todos')
const toast = useToast()

// Modal
const showModal = ref(false)
const pedidoSeleccionado = ref(null)

// --- CARGA DE DATOS ---
onMounted(async () => {
  await fetchPedidos()
})

async function fetchPedidos() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          cantidad,
          precio_unitario,
          variantes_elegidas,
          productos (
            nombre,
            foto_url,
            configuracion_variantes
          )
        ),
        pagos (
          metodo_pago_id,
          nro_referencia,
          monto,
          metodos_pago (nombre)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    pedidos.value = data

    // --- 4. LÓGICA DE APERTURA AUTOMÁTICA ---
    // Verificamos si hay un ID en la URL
    if (route.query.abrir) {
      const idParaAbrir = parseInt(route.query.abrir)

      // Buscamos el pedido en la lista que acabamos de cargar
      const pedidoEncontrado = pedidos.value.find(p => p.id === idParaAbrir)

      if (pedidoEncontrado) {
        // Abrimos el modal con ese pedido
        verDetalle(pedidoEncontrado)

        // (Opcional) Limpiamos la URL para que si recarga no se vuelva a abrir
        router.replace({ query: null })
      }
    }
  } catch (error) {
    toast.error('Error al cargar pedidos')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// --- FILTROS ---
const pedidosFiltrados = computed(() => {
  if (filtroEstado.value === 'todos') return pedidos.value
  return pedidos.value.filter(p => p.estado === filtroEstado.value)
})

// --- ACCIONES ---
function verDetalle(pedido) {
  pedidoSeleccionado.value = pedido
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
  pedidoSeleccionado.value = null
}

async function cambiarEstado(nuevoEstado) {
  if (!pedidoSeleccionado.value) return

  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoSeleccionado.value.id)

    if (error) throw error

    // Actualizar localmente
    const index = pedidos.value.findIndex(p => p.id === pedidoSeleccionado.value.id)
    if (index !== -1) {
      pedidos.value[index].estado = nuevoEstado
    }
    pedidoSeleccionado.value.estado = nuevoEstado

    toast.success(`Estado actualizado a: ${nuevoEstado.replace('_', ' ')}`)
  } catch (error) {
    toast.error('Error al actualizar estado')
  }
}

// --- HELPERS VISUALES ---
function getStatusColor(estado) {
  const map = {
    verificando_pago: 'bg-yellow-100 text-yellow-800',
    en_preparacion: 'bg-blue-100 text-blue-800',
    listo: 'bg-purple-100 text-purple-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800'
  }
  return map[estado] || 'bg-gray-100'
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  })
}

function formatFechaAgendada(dateString) {
  if (!dateString) return ''
  const fecha = new Date(dateString + 'T00:00:00')
  return fecha.toLocaleDateString('es-VE', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

function formatHoraAgendada(timeString) {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatVariantes(detalle) {
  const variantes = detalle.variantes_elegidas
  const config = detalle.productos?.configuracion_variantes

  if (!variantes || Object.keys(variantes).length === 0) return null

  if (!config) return Object.values(variantes).flat().join(', ')

  return Object.entries(variantes).map(([indexStr, opciones]) => {
    return `${opciones.join(', ')}`
  })
}
</script>

<template>
  <div class="p-4 md:p-6 pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Gestión de Pedidos</h1>

      <div class="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div class="flex gap-2 min-w-max">
          <button v-for="estado in ['todos', 'verificando_pago', 'en_preparacion', 'listo', 'completado']" :key="estado"
            @click="filtroEstado = estado"
            class="px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize border"
            :class="filtroEstado === estado ? 'bg-brand-fucsia text-white border-brand-fucsia shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'">
            {{ estado.replace('_', ' ') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
      <p class="text-gray-400">Cargando pedidos...</p>
    </div>

    <div v-else-if="pedidosFiltrados.length === 0"
      class="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
      <p class="text-gray-500">No hay pedidos con este estado.</p>
    </div>

    <div v-else>

      <div class="hidden md:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th class="p-4">ID</th>
                <th class="p-4">Cliente</th>
                <th class="p-4">Fecha</th>
                <th class="p-4">Entrega</th>
                <th class="p-4">Total</th>
                <th class="p-4">Estado</th>
                <th class="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="pedido in pedidosFiltrados" :key="pedido.id" class="hover:bg-gray-50 transition-colors">
                <td class="p-4 font-mono text-xs text-gray-500">#{{ pedido.id }}</td>
                <td class="p-4">
                  <p class="font-bold text-gray-800">{{ pedido.nombre_cliente }}</p>
                  <p class="text-xs text-gray-500">{{ pedido.telefono_cliente }}</p>
                </td>
                <td class="p-4 text-sm text-gray-600">{{ formatDate(pedido.created_at) }}</td>
                <td class="p-4">
                  <div class="flex flex-col gap-1 items-start">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                      :class="pedido.metodo_entrega === 'envio' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'">
                      {{ pedido.metodo_entrega === 'envio' ? 'Delivery' : 'Retiro' }}
                    </span>
                    <span v-if="pedido.es_agendado"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">
                      <CalendarIcon class="w-3 h-3" /> Agendado
                    </span>
                  </div>
                </td>
                <td class="p-4 font-bold text-brand-morado">${{ pedido.total.toFixed(2) }}</td>
                <td class="p-4">
                  <span
                    :class="`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(pedido.estado)}`">
                    {{ pedido.estado.replace('_', ' ') }}
                  </span>
                </td>
                <td class="p-4 text-center">
                  <button @click="verDetalle(pedido)"
                    class="text-gray-400 hover:text-brand-fucsia p-2 rounded-full transition-all">
                    <EyeIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="md:hidden space-y-4">
        <div v-for="pedido in pedidosFiltrados" :key="pedido.id"
          class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">

          <div class="flex justify-between items-start">
            <div>
              <span class="font-mono text-xs text-gray-400">#{{ pedido.id }}</span>
              <p class="font-bold text-gray-800 text-lg">{{ pedido.nombre_cliente }}</p>
            </div>
            <button @click="verDetalle(pedido)" class="text-brand-fucsia bg-pink-50 p-2 rounded-full">
              <EyeIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <span :class="`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(pedido.estado)}`">
              {{ pedido.estado.replace('_', ' ') }}
            </span>
            <span class="px-2 py-1 rounded text-xs font-medium capitalize"
              :class="pedido.metodo_entrega === 'envio' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'">
              {{ pedido.metodo_entrega === 'envio' ? 'Delivery' : 'Retiro' }}
            </span>
            <span v-if="pedido.es_agendado"
              class="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1">
              <CalendarIcon class="w-3 h-3" /> Agendado
            </span>
          </div>

          <div v-if="pedido.es_agendado" class="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
            <p class="flex items-center gap-1">
              <CalendarIcon class="w-3 h-3" /> {{ formatFechaAgendada(pedido.fecha_agendada) }}
            </p>
            <p class="flex items-center gap-1 mt-1">
              <ClockIcon class="w-3 h-3" /> {{ formatHoraAgendada(pedido.hora_agendada) }}
            </p>
          </div>

          <div class="flex justify-between items-center border-t pt-3 mt-1">
            <span class="text-xs text-gray-500">{{ formatDate(pedido.created_at) }}</span>
            <span class="font-bold text-xl text-brand-morado">${{ pedido.total.toFixed(2) }}</span>
          </div>

        </div>
      </div>

    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="cerrarModal">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">

        <div class="p-4 md:p-6 border-b flex justify-between items-start bg-gray-50 sticky top-0 z-10">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-gray-800 flex flex-wrap items-center gap-2">
              Pedido #{{ pedidoSeleccionado.id }}
              <span
                :class="`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(pedidoSeleccionado.estado)}`">
                {{ pedidoSeleccionado.estado.replace('_', ' ') }}
              </span>
            </h2>
            <p class="text-xs md:text-sm text-gray-500 mt-1">{{ formatDate(pedidoSeleccionado.created_at) }}</p>
          </div>
          <button @click="cerrarModal" class="text-gray-400 hover:text-red-500 transition-colors">
            <XCircleIcon class="w-8 h-8" />
          </button>
        </div>

        <div class="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

          <div class="space-y-6">

            <div class="bg-white border rounded-xl p-4 shadow-sm">
              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 text-sm uppercase">Cliente</h3>
              <div class="space-y-2 text-sm">
                <p><span class="text-gray-500">Nombre:</span> <span class="font-medium ml-2">{{
                  pedidoSeleccionado.nombre_cliente }}</span></p>
                <p><span class="text-gray-500">Teléfono:</span> <span class="font-medium ml-2">{{
                  pedidoSeleccionado.telefono_cliente }}</span></p>
              </div>
            </div>

            <div class="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div v-if="pedidoSeleccionado.es_agendado"
                class="absolute top-0 right-0 bg-brand-morado text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                AGENDADO
              </div>

              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2 text-sm uppercase">
                <TruckIcon v-if="pedidoSeleccionado.metodo_entrega === 'envio'" class="w-4 h-4" />
                <ShoppingBagIcon v-else class="w-4 h-4" />
                Entrega
              </h3>

              <div class="space-y-3 text-sm">
                <div v-if="pedidoSeleccionado.es_agendado" class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p class="text-purple-800 font-bold text-xs">FECHA PROGRAMADA</p>
                  <p class="text-gray-700">{{ formatFechaAgendada(pedidoSeleccionado.fecha_agendada) }}</p>
                  <p class="text-gray-700 mt-1">{{ formatHoraAgendada(pedidoSeleccionado.hora_agendada) }}</p>
                </div>

                <div v-if="pedidoSeleccionado.metodo_entrega === 'envio'">
                  <p class="text-gray-500 mb-1">Dirección: <span class="font-medium bg-gray-50 rounded text-xs"> {{ pedidoSeleccionado.direccion_envio }}</span></p>

                  <a v-if="pedidoSeleccionado.latitud && pedidoSeleccionado.longitud"
                    :href="`https://www.google.com/maps?q=${pedidoSeleccionado.latitud},${pedidoSeleccionado.longitud}`"
                    target="_blank"
                    class="inline-flex items-center gap-1 text-brand-fucsia font-bold text-xs mt-2 hover:underline">
                    <MapPinIcon class="w-4 h-4" /> Google Maps
                  </a>
                </div>
                <div v-else>
                  <p class="font-medium">Retiro en Tienda</p>
                </div>
              </div>
            </div>

            <div class="bg-white border rounded-xl p-4 shadow-sm">
              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 text-sm uppercase">Pago</h3>
              <div v-if="pedidoSeleccionado.pagos && pedidoSeleccionado.pagos.length > 0" class="space-y-2 text-sm">
                <div v-for="pago in pedidoSeleccionado.pagos" :key="pago.id">
                  <p><span class="text-gray-500">Método:</span> <span class="font-bold ml-2">{{
                    pago.metodos_pago?.nombre }}</span></p>
                  <p><span class="text-gray-500">Ref:</span> <span class="font-mono bg-yellow-50 px-2 rounded ml-2">{{
                    pago.nro_referencia }}</span></p>
                  <p><span class="text-gray-500">Monto:</span> <span class="font-bold text-brand-fucsia ml-2">${{
                    pago.monto.toFixed(2) }}</span></p>
                  <p v-if="pedidoSeleccionado.total_bs" class="mt-1 border-t pt-1 text-gray-500">
                    VES: <span class="font-bold text-gray-700">{{ pedidoSeleccionado.total_bs.toLocaleString('es-VE') }}
                      Bs.</span>
                  </p>
                </div>
              </div>
              <p v-else class="text-red-500 text-sm italic">Sin pago registrado</p>
            </div>
          </div>

          <div class="flex flex-col h-full">
            <div class="bg-gray-50 rounded-xl p-4 border flex-grow overflow-y-auto max-h-96 mb-6">
              <h3 class="font-bold text-gray-700 mb-4 sticky top-0 bg-gray-50 pb-2 border-b text-sm uppercase">Productos
              </h3>
              <div class="space-y-3 border-b pb-4">
                <div v-for="item in pedidoSeleccionado.detalles_pedido" :key="item.id"
                  class="flex gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <img :src="item.productos.foto_url" class="w-12 h-12 rounded object-cover bg-gray-200 shrink-0">
                  <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-start">
                      <p class="font-bold text-gray-800 text-sm lg:text-base  truncate">{{ item.productos.nombre }}</p>
                      <p class="font-bold text-brand-morado text-sm lg:text-base">${{ (item.cantidad *
                        item.precio_unitario).toFixed(2) }}</p>
                    </div>
                    <p class="text-xs lg:text-sm text-gray-500">{{ item.cantidad }} x ${{ item.precio_unitario }}</p>

                    <div v-if="formatVariantes(item)" class="mt-1 flex flex-wrap gap-1">
                      <div v-if="Array.isArray(formatVariantes(item))">
                        <span v-for="(v, i) in formatVariantes(item)" :key="i"
                          class="text-[10px] lg:text-xs text-gray-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
                          {{ v }}
                        </span>
                      </div>
                      <span v-else class="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{{
                        formatVariantes(item) }}</span>
                    </div>

                  </div>
                </div>
              </div>

              <div class="pt-4">
                <div v-if="pedidoSeleccionado.costo_envio > 0"
                  class="flex justify-between items-center text-sm text-gray-600">
                  <span>Costo de Envío</span>
                  <span>+${{ Number(pedidoSeleccionado.costo_envio).toFixed(2) }}</span>
                </div>
                <div
                  v-if="(pedidoSeleccionado.detalles_pedido.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0) + (pedidoSeleccionado.costo_envio || 0)) > pedidoSeleccionado.total"
                  class="flex justify-between items-center text-sm text-green-600 font-medium">
                  <span>Descuento Aplicado</span>
                  <span>-${{((pedidoSeleccionado.detalles_pedido.reduce((acc, item) => acc + (item.cantidad *
                    item.precio_unitario), 0) + (pedidoSeleccionado.costo_envio || 0)) -
                    pedidoSeleccionado.total).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center border-t pt-2 mt-2 font-bold text-lg">
                  <span>Total</span>
                  <span class="text-brand-fucsia">${{ pedidoSeleccionado.total.toFixed(2) }}</span>
                </div>
              </div>

            </div>

            <div class="mt-auto bg-white border rounded-xl p-4 shadow-sm">
              <h3 class="font-bold text-gray-700 mb-3 text-sm uppercase">Cambiar Estado</h3>
              <div class="grid grid-cols-2 gap-2">
                <CustomButton @click="cambiarEstado('verificando_pago')"
                  :disabled="pedidoSeleccionado.estado === 'verificando_pago'"
                  class="text-xs lg:text-sm py-2 bg-yellow-500 hover:bg-yellow-600">Verificando</CustomButton>
                <CustomButton @click="cambiarEstado('en_preparacion')"
                  :disabled="pedidoSeleccionado.estado === 'en_preparacion'"
                  class="text-xs lg:text-sm py-2 hover:bg-brand-fucsia-dark">En Preparación</CustomButton>
                <CustomButton @click="cambiarEstado('listo')" :disabled="pedidoSeleccionado.estado === 'listo'"
                  class="text-xs lg:text-sm py-2 bg-purple-500 hover:bg-purple-600">Listo</CustomButton>
                <CustomButton @click="cambiarEstado('completado')"
                  :disabled="pedidoSeleccionado.estado === 'completado'"
                  class="text-xs lg:text-sm py-2 bg-green-500 hover:bg-green-600">Completado</CustomButton>
              </div>
              <button @click="cambiarEstado('cancelado')"
                class="w-full mt-3 text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 rounded py-2 hover:bg-red-100 transition-colors">
                Cancelar Pedido
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
