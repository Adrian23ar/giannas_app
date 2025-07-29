<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'

// --- ESTADO ---
const pedidos = ref([])
const cargando = ref(true)
const modalActivo = ref(false)
const pedidoSeleccionado = ref(null)

// --- LÓGICA ---
// Formatea la fecha para que sea más legible
function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-VE', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  })
}

// Obtiene la lista inicial de todos los pedidos
async function obtenerPedidos() {
  cargando.value = true
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error(error)
  else pedidos.value = data
  cargando.value = false
}

// Muestra los detalles de un pedido específico en el modal
async function mostrarDetalles(pedido) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      detalles_pedido ( cantidad, precio_unitario, productos (nombre) ),
      pagos ( * )
    `)
    .eq('id', pedido.id)
    .single()

  if (error) {
    console.error(error)
    alert('No se pudieron cargar los detalles del pedido.')
  } else {
    pedidoSeleccionado.value = data
    modalActivo.value = true
  }
}

// Actualiza el estado del pedido en la base de datos
async function actualizarEstado() {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado: pedidoSeleccionado.value.estado })
    .eq('id', pedidoSeleccionado.value.id)
    .select()
    .single()

  if (error) {
    console.error(error)
    alert('Error al actualizar el estado.')
  } else {
    // Actualiza la lista local para reflejar el cambio al instante
    const index = pedidos.value.findIndex(p => p.id === data.id)
    if (index !== -1) pedidos.value[index] = data
    modalActivo.value = false // Cierra el modal
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
          <tr v-if="cargando">
            <td colspan="6" class="text-center p-4">Cargando pedidos...</td>
          </tr>
          <tr v-for="pedido in pedidos" :key="pedido.id" class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-4 font-medium">#{{ pedido.id }}</td>
            <td class="px-6 py-4">{{ formatFecha(pedido.created_at) }}</td>
            <td class="px-6 py-4">{{ pedido.nombre_cliente }}</td>
            <td class="px-6 py-4">${{ pedido.total.toFixed(2) }}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="{
                'bg-yellow-100 text-yellow-800': pedido.estado === 'verificando_pago',
                'bg-blue-100 text-blue-800': pedido.estado === 'en_preparacion',
                'bg-green-100 text-green-800': pedido.estado === 'completado',
              }">{{ pedido.estado.replace('_', ' ') }}</span>
            </td>
            <td class="px-6 py-4">
              <button @click="mostrarDetalles(pedido)" class="font-medium text-brand-fucsia hover:underline">Ver
                Detalles</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalActivo" class="fixed inset-0 bg-black/50 flex justify-center items-center z-30">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b sticky top-0 bg-white">
          <h2 class="text-2xl font-bold">Detalles del Pedido #{{ pedidoSeleccionado.id }}</h2>
          <button @click="modalActivo = false"
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-800">&times;</button>
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
                class="text-blue-600 hover:underline">
                Ver ubicación en mapa
              </a>
              <p v-else class="text-sm text-gray-400 italic">
                Ubicación no disponible
              </p>
            </div>
          </section>
          <section>
            <h3 class="font-bold mb-2">Detalles del Pago</h3>
            <p><strong>Referencia:</strong> {{ pedidoSeleccionado.pagos[0].nro_referencia }}</p>
            <p><strong>Banco Emisor:</strong> {{ pedidoSeleccionado.pagos[0].banco_emisor }}</p>
            <p><strong>Fecha:</strong> {{ formatFecha(pedidoSeleccionado.pagos[0].fecha) }}</p>
            <p><strong>Monto:</strong> ${{ pedidoSeleccionado.pagos[0].monto.toFixed(2) }}</p>
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
          <section class="border-t pt-4 flex items-center gap-4">
            <label for="estado" class="font-bold">Actualizar Estado:</label>
            <select v-model="pedidoSeleccionado.estado" id="estado" class="p-2 border rounded-md">
              <option value="verificando_pago">Verificando Pago</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="listo_para_entrega">Listo para Entrega</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <button @click="actualizarEstado"
              class="bg-brand-fucsia text-white font-bold py-2 px-6 rounded-md">Actualizar</button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
