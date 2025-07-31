<script setup>
// src/views/CheckoutView.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useToast } from 'vue-toastification'
import { supabase } from '../supabase'
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet"
import L from 'leaflet'
import CustomButton from '@/components/CustomButton.vue'

const cartStore = useCartStore()
const router = useRouter()
const toast = useToast()

// --- Estado del formulario ---
const cliente = ref({ nombre: '', telefono: '' })
const metodoEntrega = ref('recogida')
const direccion = ref('')
const pago = ref({ referencia: '', fecha: '', banco_emisor: '' }) // Monto se tomará del total final
const procesando = ref(false)
// Esta propiedad calcula la fecha de hoy en el formato YYYY-MM-DD
const maxDate = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Se añade +1 porque los meses empiezan en 0
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// --- Estado del Cupón ---
const showCouponInput = ref(false)
const couponCode = ref('')

// --- Lógica del Mapa (sin cambios) ---
const zoom = ref(14);
const mapCenter = ref([10.196, -71.313])
const markerLatLng = ref([10.196, -71.313])
const isLocating = ref(false);


const bancos = ref([
  { code: "0102", name: "BANCO DE VENEZUELA" },
  { code: "0104", name: "BANCO VENEZOLANO DE CREDITO" },
  { code: "0105", name: "BANCO MERCANTIL" },
  { code: "0108", name: "BBVA PROVINCIAL" },
  { code: "0114", name: "BANCARIBE" },
  { code: "0115", name: "BANCO EXTERIOR" },
  { code: "0128", name: "BANCO CARONI" },
  { code: "0134", name: "BANESCO" },
  { code: "0137", name: "BANCO SOFITASA" },
  { code: "0138", name: "BANCO PLAZA" },
  { code: "0146", name: "BANGENTE" },
  { code: "0151", name: "BANCO FONDO COMUN" },
  { code: "0156", name: "100% BANCO" },
  { code: "0157", name: "DELSUR BANCO UNIVERSAL" },
  { code: "0163", name: "BANCO DEL TESORO" },
  { code: "0168", name: "BANCRECER" },
  { code: "0169", name: "MI BANCO" },
  { code: "0171", name: "BANCO ACTIVO" },
  { code: "0172", name: "BANCAMIGA" },
  { code: "0173", name: "BANCO INTERNACIONAL DE DESARROLLO" },
  { code: "0174", name: "BANPLUS" },
  { code: "0175", name: "BANCO BICENTENARIO" },
  { code: "0177", name: "BANFANB" },
  { code: "0191", name: "BANCO NACIONAL DE CREDITO" }
]);

function onMarkerDragEnd(event) {
  markerLatLng.value = [event.target.getLatLng().lat, event.target.getLatLng().lng]
}

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

// --- Lógica de Cupones y Pedido ---
async function handleApplyCoupon() {
  if (!couponCode.value.trim()) return
  try {
    const coupon = await cartStore.applyCoupon(couponCode.value)
    toast.success(`¡Cupón "${coupon.codigo}" aplicado con éxito!`)
  } catch (error) {
    toast.error(error.message)
  }
}

function handleRemoveCoupon() {
  cartStore.removeCoupon()
  toast.info('Cupón eliminado.')
}

async function procesarPedido() {
  if (cartStore.items.length === 0) return toast.error('Tu carrito está vacío.')
  procesando.value = true

  // Guardamos el cupón antes de limpiar el carrito
  const appliedCouponId = cartStore.appliedCoupon?.id

  try {
    const pedidoParaGuardar = {
      nombre_cliente: cliente.value.nombre,
      telefono_cliente: cliente.value.telefono,
      metodo_entrega: metodoEntrega.value,
      direccion_envio: metodoEntrega.value === 'envio' ? direccion.value : null,
      total: cartStore.finalTotal, // Usamos el total final con descuento
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
      monto: cartStore.finalTotal, // Guardamos el monto final
    })
    if (pagoError) throw pagoError

    // Si se usó un cupón, incrementamos su contador de uso
    if (appliedCouponId) {
      const { incrementCouponUsage } = await import('@/services/couponService')
      await incrementCouponUsage(appliedCouponId)
    }
    // Limpiamos el carrito
    cartStore.clearCart()

    router.push(`/confirmation/${pedidoId}`)
  } catch (error) {
    toast.error('Hubo un error al procesar tu pedido.')
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
            <input v-model="cliente.telefono" type="tel" placeholder="Número de Teléfono" required maxlength="20"
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
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Banco Emisor</span>
              <select v-model="pago.banco_emisor" required
                class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
                <option value="" disabled selected>Selecciona un banco</option>
                <option v-for="banco in bancos" :key="banco.code" :value="`${banco.code} - ${banco.name}`">
                  {{ banco.code }} - {{ banco.name }}
                </option>
              </select>
            </label>
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Fecha de la Transacción</span>
              <input v-model="pago.fecha" type="date" required :max="maxDate"
                class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50">
            </label>
            <input :value="cartStore.finalTotal.toFixed(2)" type="number" step="0.01" placeholder="Monto Exacto"
              required class="w-full p-2 border rounded-md bg-gray-100" readonly>
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

          <div class="border-t pt-4">
            <a v-if="!cartStore.appliedCoupon" @click="showCouponInput = !showCouponInput"
              class="text-sm text-brand-fucsia font-semibold cursor-pointer hover:underline">
              ¿Tienes un cupón?
            </a>
            <Transition name="slide-fade">
              <div v-if="showCouponInput && !cartStore.appliedCoupon" class="flex gap-2 mt-2">
                <input v-model="couponCode" type="text" placeholder="Ingresa tu código"
                  class="flex-grow p-2 border rounded-md text-sm">
                <CustomButton @click.prevent="handleApplyCoupon">Aplicar</CustomButton>
              </div>
            </Transition>
          </div>

          <div class="space-y-2 mt-4 pt-4 border-t">
            <div class="flex justify-between items-center">
              <p class="text-gray-600">Subtotal</p>
              <p class="font-semibold">${{ cartStore.subtotal.toFixed(2) }}</p>
            </div>
            <Transition name="fade">
              <div v-if="cartStore.appliedCoupon" class="flex justify-between items-center text-green-600">
                <p>Descuento ({{ cartStore.appliedCoupon.codigo }})
                  <button @click="handleRemoveCoupon" class="text-red-500 hover:underline text-xs">(Quitar)</button>
                </p>
                <p class="font-semibold">-${{ cartStore.discountAmount.toFixed(2) }}</p>
              </div>
            </Transition>
            <div class="flex justify-between items-center font-bold text-lg">
              <p>Total a Pagar</p>
              <p class="text-brand-fucsia text-xl">${{ cartStore.finalTotal.toFixed(2) }}</p>
            </div>
          </div>

          <CustomButton type="submit" :disabled="procesando" class="w-full mt-6">
            {{ procesando ? 'Procesando...' : 'Finalizar Pedido' }}
          </CustomButton>
        </div>
      </div>
    </form>
  </div>
</template>
