<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useToast } from 'vue-toastification'
import {
  EyeIcon,
  CheckCircleIcon,
  TruckIcon,
  ShoppingBagIcon,
  ClockIcon,
  CalendarIcon,
  XCircleIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'

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
    // Seleccionamos todo, incluyendo los detalles y productos
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
  // Agregamos T00:00:00 para evitar problemas de zona horaria al parsear solo fecha
  const fecha = new Date(dateString + 'T00:00:00')
  return fecha.toLocaleDateString('es-VE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatHoraAgendada(timeString) {
  if (!timeString) return ''
  // Convertir "14:00:00" a "02:00 PM"
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Helper para mostrar variantes (Sabores/Toppings) en texto
function formatVariantes(detalle) {
  // detalle.variantes_elegidas es el JSON guardado { "0": ["Chocolate"] }
  // detalle.productos.configuracion_variantes es la configuración del producto

  const variantes = detalle.variantes_elegidas
  const config = detalle.productos?.configuracion_variantes

  if (!variantes || Object.keys(variantes).length === 0) return null

  // Si no tenemos la config (casos viejos), mostramos valores planos
  if (!config) return Object.values(variantes).flat().join(', ')

  // Si tenemos config, intentamos ponerle título
  return Object.entries(variantes).map(([indexStr, opciones]) => {
    return `${opciones.join(', ')}`
  })
}
</script>

<template>
  <div class="p-6">
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 class="text-3xl font-bold text-gray-800">Gestión de Pedidos</h1>

      <div class="flex bg-white rounded-lg shadow-sm p-1 border">
        <button v-for="estado in ['todos', 'verificando_pago', 'en_preparacion', 'listo', 'completado']" :key="estado"
          @click="filtroEstado = estado" class="px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize"
          :class="filtroEstado === estado ? 'bg-brand-fucsia text-white shadow' : 'text-gray-500 hover:bg-gray-50'">
          {{ estado.replace('_', ' ') }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
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
            <tr v-if="loading" class="animate-pulse">
              <td colspan="7" class="p-4 text-center text-gray-400">Cargando pedidos...</td>
            </tr>
            <tr v-else-if="pedidosFiltrados.length === 0">
              <td colspan="7" class="p-8 text-center text-gray-500">No hay pedidos en este estado.</td>
            </tr>
            <tr v-for="pedido in pedidosFiltrados" :key="pedido.id" class="hover:bg-gray-50 transition-colors">
              <td class="p-4 font-mono text-xs text-gray-500">#{{ pedido.id }}</td>
              <td class="p-4">
                <p class="font-bold text-gray-800">{{ pedido.nombre_cliente }}</p>
                <p class="text-xs text-gray-500">{{ pedido.telefono_cliente }}</p>
              </td>
              <td class="p-4 text-sm text-gray-600">
                {{ formatDate(pedido.created_at) }}
              </td>

              <td class="p-4">
                <div class="flex flex-col gap-1">
                  <span class="inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-medium capitalize"
                    :class="pedido.metodo_entrega === 'envio' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'">
                    {{ pedido.metodo_entrega === 'envio' ? 'Delivery' : 'Retiro' }}
                  </span>

                  <span v-if="pedido.es_agendado"
                    class="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">
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
                  class="text-gray-400 hover:text-brand-fucsia hover:bg-pink-50 p-2 rounded-full transition-all"
                  title="Ver detalle">
                  <EyeIcon class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="cerrarModal">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

        <div class="p-6 border-b flex justify-between items-start bg-gray-50 sticky top-0 z-10">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
              Pedido #{{ pedidoSeleccionado.id }}
              <span
                :class="`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(pedidoSeleccionado.estado)}`">
                {{ pedidoSeleccionado.estado.replace('_', ' ') }}
              </span>
            </h2>
            <p class="text-sm text-gray-500 mt-1">Realizado el: {{ formatDate(pedidoSeleccionado.created_at) }}</p>
          </div>
          <button @click="cerrarModal" class="text-gray-400 hover:text-red-500 transition-colors">
            <XCircleIcon class="w-8 h-8" />
          </button>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

          <div class="space-y-6">

            <div class="bg-white border rounded-xl p-4 shadow-sm">
              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2">Datos del Cliente</h3>
              <div class="space-y-2 text-sm">
                <p><span class="text-gray-500">Nombre:</span> <span class="font-medium ml-2">{{
                  pedidoSeleccionado.nombre_cliente }}</span></p>
                <p><span class="text-gray-500">Teléfono:</span> <span class="font-medium ml-2">{{
                  pedidoSeleccionado.telefono_cliente }}</span></p>
              </div>
            </div>

            <div class="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div v-if="pedidoSeleccionado.es_agendado"
                class="absolute top-0 right-0 bg-brand-morado text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                AGENDADO
              </div>

              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                <TruckIcon v-if="pedidoSeleccionado.metodo_entrega === 'envio'" class="w-5 h-5" />
                <ShoppingBagIcon v-else class="w-5 h-5" />
                {{ pedidoSeleccionado.metodo_entrega === 'envio' ? 'Delivery' : 'Retiro Personal' }}
              </h3>

              <div class="space-y-3 text-sm">
                <div v-if="pedidoSeleccionado.es_agendado" class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p class="text-purple-800 font-bold mb-1 flex items-center gap-2">
                    <CalendarIcon class="w-4 h-4" /> Fecha Programada:
                  </p>
                  <p class="text-gray-700 ml-6">{{ formatFechaAgendada(pedidoSeleccionado.fecha_agendada) }}</p>

                  <p class="text-purple-800 font-bold mt-2 mb-1 flex items-center gap-2">
                    <ClockIcon class="w-4 h-4" /> Hora Estimada:
                  </p>
                  <p class="text-gray-700 ml-6">{{ formatHoraAgendada(pedidoSeleccionado.hora_agendada) }}</p>
                </div>

                <div v-if="pedidoSeleccionado.metodo_entrega === 'envio'">
                  <p class="text-gray-500 mb-1">Dirección de entrega:</p>
                  <p class="font-medium bg-gray-50 p-2 rounded">{{ pedidoSeleccionado.direccion_envio }}</p>

                  <a v-if="pedidoSeleccionado.latitud && pedidoSeleccionado.longitud"
                    :href="`https://www.google.com/maps?q=${pedidoSeleccionado.latitud},${pedidoSeleccionado.longitud}`"
                    target="_blank"
                    class="inline-flex items-center gap-1 text-brand-fucsia font-bold text-xs mt-2 hover:underline">
                    <MapPinIcon class="w-4 h-4" /> Ver en Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div class="bg-white border rounded-xl p-4 shadow-sm">
              <h3 class="font-bold text-gray-700 mb-3 border-b pb-2">Información de Pago</h3>
              <div v-if="pedidoSeleccionado.pagos && pedidoSeleccionado.pagos.length > 0" class="space-y-2 text-sm">
                <div v-for="pago in pedidoSeleccionado.pagos" :key="pago.id">
                  <p><span class="text-gray-500">Método:</span> <span class="font-bold ml-2">{{
                    pago.metodos_pago?.nombre }}</span></p>
                  <p><span class="text-gray-500">Referencia:</span> <span
                      class="font-mono bg-yellow-50 px-2 rounded ml-2">{{ pago.nro_referencia }}</span></p>
                  <p><span class="text-gray-500">Monto USD:</span> <span class="font-bold text-brand-fucsia ml-2">${{
                    pago.monto.toFixed(2) }}</span></p>
                  <p v-if="pedidoSeleccionado.total_bs" class="mt-1 border-t pt-1">
                    <span class="text-gray-500">Monto VES (Ref):</span>
                    <span class="font-bold ml-2">{{ pedidoSeleccionado.total_bs.toLocaleString('es-VE') }} Bs.</span>
                  </p>
                </div>
              </div>
              <p v-else class="text-red-500 text-sm italic">Sin pago registrado</p>
            </div>
          </div>

          <div class="flex flex-col h-full">
            <div class="bg-gray-50 rounded-xl p-4 border flex-grow overflow-y-auto max-h-96 mb-6">
              <h3 class="font-bold text-gray-700 mb-4 bg-gray-50 pb-2 border-b">Productos del Pedido</h3>
              <div class="space-y-4">
                <div v-for="item in pedidoSeleccionado.detalles_pedido" :key="item.id"
                  class="flex gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <img :src="item.productos.foto_url" class="w-16 h-16 rounded object-cover bg-gray-200">
                  <div class="flex-grow">
                    <div class="flex justify-between items-start">
                      <p class="font-bold text-gray-800">{{ item.productos.nombre }}</p>
                      <p class="font-bold text-brand-morado">${{ (item.cantidad * item.precio_unitario).toFixed(2) }}
                      </p>
                    </div>
                    <p class="text-xs text-gray-500">Cant: {{ item.cantidad }} x ${{ item.precio_unitario }}</p>

                    <div v-if="formatVariantes(item)" class="mt-2">
                      <div v-if="Array.isArray(formatVariantes(item))">
                        <p v-for="(v, i) in formatVariantes(item)" :key="i"
                          class="text-xs text-gray-600 bg-pink-50 px-2 py-0.5 rounded inline-block mr-1 mb-1 border border-pink-100">
                          {{ v }}
                        </p>
                      </div>
                      <p v-else class="text-xs text-gray-600 italic">{{ formatVariantes(item) }}</p>
                    </div>

                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center mt-4 pt-4 border-t font-bold text-lg">
                <span>Total General</span>
                <span class="text-brand-fucsia">${{ pedidoSeleccionado.total.toFixed(2) }}</span>
              </div>
            </div>

            <div class="mt-auto bg-white border rounded-xl p-4 shadow-sm">
              <h3 class="font-bold text-gray-700 mb-3">Actualizar Estado</h3>
              <div class="grid grid-cols-2 gap-2">
                <CustomButton @click="cambiarEstado('verificando_pago')"
                  :disabled="pedidoSeleccionado.estado === 'verificando_pago'"
                  class="text-xs py-2 bg-yellow-500 hover:bg-yellow-600">Verificando Pago</CustomButton>
                <CustomButton @click="cambiarEstado('en_preparacion')"
                  :disabled="pedidoSeleccionado.estado === 'en_preparacion'"
                  class="text-xs py-2 bg-blue-500 hover:bg-blue-600">En Preparación</CustomButton>
                <CustomButton @click="cambiarEstado('listo')" :disabled="pedidoSeleccionado.estado === 'listo'"
                  class="text-xs py-2 bg-purple-500 hover:bg-purple-600">Listo para entregar</CustomButton>
                <CustomButton @click="cambiarEstado('completado')"
                  :disabled="pedidoSeleccionado.estado === 'completado'"
                  class="text-xs py-2 bg-green-500 hover:bg-green-600">Completado</CustomButton>
              </div>
              <div class="text-center border-t mt-2">
                <CustomButton @click="cambiarEstado('cancelado')" :disabled="pedidoSeleccionado.estado === 'cancelado'"
                  class="text-xs py-2 bg-red-500 w-1/2 hover:bg-red-600 mt-2 col-span-1">Cancelado</CustomButton>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
