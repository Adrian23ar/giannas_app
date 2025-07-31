<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { supabase } from '../supabase'

// Importaciones para el mapa
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";

const cartStore = useCartStore()
const router = useRouter()

// --- Estado del formulario ---
const cliente = ref({ nombre: '', telefono: '' })
const metodoEntrega = ref('recogida')
const direccion = ref('')
const pago = ref({ referencia: '', fecha: '', banco_emisor: '', monto: cartStore.totalPrice.toFixed(2) })
const procesando = ref(false)

// --- Estado del Mapa ---
const zoom = ref(14); // <-- SOLUCIÓN 2: Definimos la variable 'zoom'
const mapCenter = ref([10.196, -71.313])
const markerLatLng = ref([10.196, -71.313])
const isLocating = ref(false); // Para saber si ya estamos buscando la ubicación


function onMarkerDragEnd(event) {
  markerLatLng.value = [event.target.getLatLng().lat, event.target.getLatLng().lng]
}

// ... tus otras importaciones y código ...

async function getUserLocation() {
  // 1. Evita que la función se ejecute si ya está en proceso
  if (isLocating.value) return;

  if (!navigator.geolocation) {
    alert("Tu navegador no soporta la geolocalización.");
    return;
  }

  isLocating.value = true; // Empezamos a buscar

  try {
    // 2. Usamos una Promesa para esperar el resultado
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    // --- Lógica de ÉXITO (dentro de 'try') ---
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    markerLatLng.value = [lat, lng];
    mapCenter.value = [lat, lng];

  } catch (error) {
    console.log(error);
    // --- Lógica de ERROR (dentro de 'catch') ---
    let message = "No se pudo obtener tu ubicación. ";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += "Has denegado el permiso de ubicación.";
        break;
      case error.POSITION_UNAVAILABLE:
        message += "La información de ubicación no está disponible.";
        break;
      case error.TIMEOUT:
        message += "La solicitud de ubicación ha caducado. Inténtalo de nuevo.";
        break;
      default:
        message += "Ha ocurrido un error desconocido.";
        break;
    }
    alert(message);

  } finally {
    // 3. Esto se ejecuta siempre, al final del 'try' o del 'catch'
    isLocating.value = false; // Terminamos de buscar
  }
}

async function procesarPedido() {
  if (cartStore.items.length === 0) return alert('Tu carrito está vacío.')
  procesando.value = true
  try {
    const pedidoParaGuardar = {
      nombre_cliente: cliente.value.nombre,
      telefono_cliente: cliente.value.telefono,
      metodo_entrega: metodoEntrega.value,
      direccion_envio: metodoEntrega.value === 'envio' ? direccion.value : null,
      total: cartStore.totalPrice,
      estado: 'verificando_pago',
      latitud: metodoEntrega.value === 'envio' ? markerLatLng.value[0] : null,
      longitud: metodoEntrega.value === 'envio' ? markerLatLng.value[1] : null,
    }
    const { data: pedidoData, error: pedidoError } = await supabase.from('pedidos').insert(pedidoParaGuardar).select('id').single()
    if (pedidoError) throw pedidoError
    const pedidoId = pedidoData.id
    const detallesPedido = cartStore.items.map(item => ({
      pedido_id: pedidoId,
      producto_id: item.id,
      cantidad: item.quantity,
      precio_unitario: item.precio,
    }))
    const { error: detallesError } = await supabase.from('detalles_pedido').insert(detallesPedido)
    if (detallesError) throw detallesError
    const { error: pagoError } = await supabase.from('pagos').insert({
      pedido_id: pedidoId,
      nro_referencia: pago.value.referencia,
      fecha: pago.value.fecha,
      banco_emisor: pago.value.banco_emisor,
      monto: pago.value.monto,
    })
    if (pagoError) throw pagoError
    cartStore.clearCart()
    router.push(`/confirmation/${pedidoId}`)
  } catch (error) {
    console.error('Error al procesar el pedido:', error)
    alert('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.')
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-brand-morado mb-8">Finalizar Compra</h1>
    <form @submit.prevent="procesarPedido" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">1. Tus Datos</h2>
          <div class="space-y-4">
            <input v-model="cliente.nombre" type="text" placeholder="Nombre y Apellido" required
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none">
            <input v-model="cliente.telefono" type="tel" placeholder="Número de Teléfono"
             required maxlength="20"
             class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none">
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">2. Método de Entrega</h2>
          <div class="space-y-2">
            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
              <input type="radio" v-model="metodoEntrega" value="recogida" name="entrega" class="accent-brand-fucsia">
              Recogida en tienda
            </label>
            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
              <input type="radio" v-model="metodoEntrega" value="envio" name="entrega" class="accent-brand-fucsia">
              Envío a domicilio
            </label>
          </div>
          <div v-if="metodoEntrega === 'envio'" class="mt-4 space-y-4">
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-medium text-gray-700">Define el punto de entrega:</p>
              <button @click.prevent="getUserLocation" type="button"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-fucsia hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  <path d="M0 0h24v24H0z" fill="none" />
                </svg>
                Usar mi ubicación actual
              </button>
            </div>
            <div style="height:300px; width:100%;" class="rounded-md overflow-hidden border">
              <l-map ref="map" v-model:zoom="zoom" :center="mapCenter">
                <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
                  name="OpenStreetMap"></l-tile-layer>
                <l-marker :lat-lng="markerLatLng" :draggable="true" @moveend="onMarkerDragEnd"></l-marker>
              </l-map>
            </div>
            <textarea v-model="direccion"
              placeholder="Punto de referencia (ej: al lado de la farmacia, casa de portón rojo)" rows="3" required
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none"></textarea>
            <p class="text-xs text-gray-500">Arrastra el marcador para ajustar tu ubicación exacta de entrega.</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">3. Registra tu Pago</h2>
          <p class="text-sm text-gray-600 mb-4">Realiza una transferencia al siguiente destinatario y luego registra los
            datos de la transacción aquí.</p>
          <div class="space-y-4">
            <input v-model="pago.referencia" type="number" inputmode="numeric" placeholder="Nro. de Referencia" required
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none">
            <input v-model="pago.banco_emisor" type="text" placeholder="Banco Emisor" required
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none">
            <input v-model="pago.fecha" type="date" required
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none">
            <input v-model="pago.monto" type="number" step="0.01" placeholder="Monto Exacto" required
              class="w-full p-2 border rounded-md bg-gray-100" readonly>
          </div>
        </div>
      </div>
      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow-md sticky top-28">
          <h2 class="text-2xl font-bold border-b pb-4">Resumen del Pedido</h2>
          <ul class="space-y-2 my-4">
            <li v-for="item in cartStore.items" :key="item.id" class="flex justify-between">
              <span>{{ item.nombre }} x {{ item.quantity }}</span>
              <span>${{ (item.precio * item.quantity).toFixed(2) }}</span>
            </li>
          </ul>
          <div class="flex justify-between items-center mt-4 pt-4 border-t">
            <p class="font-bold text-lg">Total a Pagar</p>
            <p class="font-bold text-xl text-brand-fucsia">${{ cartStore.totalPrice.toFixed(2) }}</p>
          </div>
          <button type="submit" :disabled="procesando"
            class="w-full mt-6 bg-brand-fucsia text-white font-bold py-3 rounded-md disabled:bg-gray-400">
            {{ procesando ? 'Procesando...' : 'Finalizar Pedido' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
