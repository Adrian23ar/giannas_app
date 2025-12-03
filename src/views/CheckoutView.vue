<script setup>
// src/views/CheckoutView.vue
import { ref, computed, onMounted, watch, onUnmounted } from 'vue' // <-- Añadido 'watch'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
import { useToast } from 'vue-toastification'
import { supabase } from '../supabase'
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet"
import CustomButton from '@/components/CustomButton.vue'
import { paymentMethodService } from '@/services/paymentMethodService' // <-- 1. IMPORTAR SERVICIO
import { incrementCouponUsage } from '@/services/couponService' // <-- AÑADE ESTA LÍNEA
// --- NUEVO: IMPORTAR SERVICIO DE TASA DE CAMBIO ---
import { getLatestExchangeRate } from '@/services/exchangeRateService'

const cartStore = useCartStore()
const userStore = useUserStore()
const router = useRouter()
const toast = useToast()

// --- Estado del formulario (sin cambios) ---
const cliente = ref({ nombre: '', telefono: '' })
const metodoEntrega = ref('recogida')
const direccion = ref('')
const procesando = ref(false)

// --- MODIFICACIÓN DEL OBJETO 'pago' ---
const pago = ref({
  referencia: '',
  metodo_pago_id: null
}) // <-- 2. ESTADO DE PAGO MODIFICADO

const fechaTransaccion = ref('') // <-- AÑADE ESTE NUEVO REF


const maxDate = computed(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// --- NUEVOS ESTADOS PARA MÉTODOS DE PAGO ---
const paymentMethods = ref([])
const selectedPaymentMethod = ref(null) // <-- 3. NUEVOS ESTADOS

// --- NUEVA PROPIEDAD COMPUTADA ---
// Filtra los métodos de pago según el tipo de entrega
const availablePaymentMethods = computed(() => {
  if (metodoEntrega.value === 'envio') {
    return paymentMethods.value.filter(method => method.disponibilidad !== 'recogida');
  }
  return paymentMethods.value;
}) // <-- 4. NUEVA PROPIEDAD COMPUTADA

// --- Estado del Cupón (sin cambios) ---
const showCouponInput = ref(false)
const couponCode = ref('')
const isLoading = ref(false);

// --- NUEVO: ESTADOS PARA LA CONVERSIÓN DE MONEDA ---
const exchangeRate = ref(null)        // Para guardar la tasa obtenida
const totalInBolivares = ref(null)    // Para guardar el total calculado en VES
const isLoadingRate = ref(false)      // Para mostrar un indicador de carga

// --- Lógica del Mapa (sin cambios) ---
const zoom = ref(14);
const mapCenter = ref([10.196, -71.313])
const markerLatLng = ref([10.196, -71.313])
const isLocating = ref(false);

// ----- 1. INICIO DEL CAMBIO: PROPIEDAD COMPUTADA -----
// Esta propiedad determina si debemos mostrar los campos de referencia y fecha.
// Devuelve 'true' a menos que sea Recogida Y Efectivo.
const showPaymentReference = computed(() => {
  // Si no se ha seleccionado un método de pago, mostramos los campos por defecto.
  if (!selectedPaymentMethod.value) {
    return true;
  }
  // La condición para OCULTAR: método de entrega es 'recogida' Y el nombre del método es 'Efectivo'.
  const hideCondition =
    metodoEntrega.value === 'recogida' &&
    selectedPaymentMethod.value.nombre.toLowerCase() === 'efectivo';

  return !hideCondition; // Devolvemos lo contrario a la condición de ocultar.
})
// ----- FIN DEL CAMBIO -----

// 1. Crea una referencia para el contenedor del reCAPTCHA
const recaptchaContainer = ref(null)
const recaptchaWidgetId = ref(null) // Para guardar el ID del widget

// Función que renderizará el reCAPTCHA
const renderRecaptcha = () => {
  // Asegúrate de que el contenedor existe y que la API 'grecaptcha' está disponible
  if (recaptchaContainer.value && window.grecaptcha) {
    window.grecaptcha.ready(() => {
      recaptchaWidgetId.value = window.grecaptcha.render(recaptchaContainer.value, {
        'sitekey': '6LegfJ8rAAAAABWBru2sS_rlb5G7GHPie-V4ZD8-',
        // Opcional: puedes añadir un callback para obtener el token
        // 'callback': (token) => {
        //   console.log('reCAPTCHA token:', token);
        //   // Aquí guardarías el token para enviarlo con el formulario
        // }
      });
    });
  }
};

onMounted(() => {
  // Si el script ya se cargó antes de que el componente se montara
  if (window.grecaptcha && window.grecaptcha.render) {
    renderRecaptcha();
  } else {
    // Si no, escucha el evento personalizado que creamos en index.html
    window.addEventListener('recaptcha-loaded', renderRecaptcha);
  }
});

// Es una buena práctica limpiar el listener cuando el componente se destruye
onUnmounted(() => {
  window.removeEventListener('recaptcha-loaded', renderRecaptcha);
});

// --- MODIFICACIÓN DEL onMounted ---
onMounted(async () => {
  if (userStore.isLoggedIn) {
    cliente.value.nombre = userStore.userFullName;
    cliente.value.telefono = userStore.userPhone;
  }
  // Añadimos la carga de métodos de pago
  try {
    paymentMethods.value = await paymentMethodService.getActiveMethods();
  } catch (error) {
    toast.error('No se pudieron cargar los métodos de pago.');
  } // <-- 5. CARGAR MÉTODOS DE PAGO
})

// Observa si el método seleccionado deja de estar disponible al cambiar la entrega
watch(metodoEntrega, () => {
  const isSelectedAvailable = availablePaymentMethods.value.some(
    (method) => method.id === pago.value.metodo_pago_id
  );

  if (!isSelectedAvailable) {
    pago.value.metodo_pago_id = null;
    selectedPaymentMethod.value = null;
  }
})

// --- MODIFICADO: EL WATCHER AHORA TIENE MÁS LÓGICA ---
// Observamos el ID del método de pago seleccionado por el usuario.
watch(() => pago.value.metodo_pago_id, async (newId) => {
  // Limpiamos los valores de conversión anteriores
  totalInBolivares.value = null;
  exchangeRate.value = null;

  if (!newId) {
    selectedPaymentMethod.value = null;
    return;
  }

  // Encontramos el objeto completo del método de pago
  selectedPaymentMethod.value = paymentMethods.value.find(m => m.id === newId);

  // Verificamos si el tipo de método requiere conversión a Bolívares
  const needsConversion = selectedPaymentMethod.value?.tipo === 'pago-movil' || selectedPaymentMethod.value?.tipo === 'transferencia';

  if (needsConversion) {
    isLoadingRate.value = true;
    try {
      const rate = await getLatestExchangeRate(); // ¡Llamamos a nuestro servicio!
      if (rate) {
        exchangeRate.value = rate;
        totalInBolivares.value = cartStore.finalTotal * rate;
      } else {
        toast.error("No se pudo obtener la tasa de cambio. Intente más tarde.");
      }
    } catch (error) {
      toast.error("Error al buscar la tasa de cambio.");
    } finally {
      isLoadingRate.value = false;
    }
  }
});

// --- Lógica de Mapa y Cupón (sin cambios, no se muestra por brevedad) ---
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

async function handleApplyCoupon() {
  if (!couponCode.value.trim()) return

  isLoading.value = true
  try {
    const coupon = await cartStore.applyCoupon(couponCode.value)
    toast.success(`¡Cupón "${coupon.codigo}" aplicado con éxito!`)

  } catch (error) {
    toast.error(error.message)
  } finally {
    isLoading.value = false
  }
}
function handleRemoveCoupon() {
  cartStore.removeCoupon()
  toast.info('Cupón eliminado.')
}
// --- FIN Lógica de Mapa y Cupón ---


// --- FUNCIÓN procesarPedido ACTUALIZADA ---
async function procesarPedido() {
  if (cartStore.items.length === 0) return toast.error('Tu carrito está vacío.')
  if (!pago.value.metodo_pago_id) return toast.error('Debes seleccionar un método de pago.');

  if (showPaymentReference.value) {
    if (!pago.value.referencia) return toast.error('Debes colocar el número de referencia.');
    if (!fechaTransaccion.value) return toast.error('Debes seleccionar la fecha de la transacción.');
  }

  // Es recomendable verificar que el usuario completó el reCAPTCHA antes de enviar
  const recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId.value);
  if (!recaptchaResponse) {
    toast.error('Por favor, completa el reCAPTCHA.');
    return;
  }
  procesando.value = true


  const appliedCouponId = cartStore.appliedCoupon?.id
  const orderUserId = userStore.isLoggedIn ? userStore.user.id : null

  try {
    // --- INICIO DE LA MODIFICACIÓN ---
    const pedidoParaGuardar = {
      user_id: orderUserId,
      nombre_cliente: cliente.value.nombre,
      telefono_cliente: cliente.value.telefono,
      metodo_entrega: metodoEntrega.value,
      direccion_envio: metodoEntrega.value === 'envio' ? direccion.value : null,
      total: cartStore.finalTotal,
      estado: 'verificando_pago',
      latitud: metodoEntrega.value === 'envio' ? markerLatLng.value[0] : null,
      longitud: metodoEntrega.value === 'envio' ? markerLatLng.value[1] : null,
      total_bs: totalInBolivares.value
    }
    // --- FIN DE LA MODIFICACIÓN ---

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
      monto: cartStore.finalTotal,
      metodo_pago_id: pago.value.metodo_pago_id,
      fecha: fechaTransaccion.value || new Date(),
    })
    if (pagoError) throw pagoError

    if (appliedCouponId) {
      await incrementCouponUsage(appliedCouponId)
    }

    cartStore.clearCart()

    router.push(`/confirmation/${pedidoId}`)
  } catch (error) {
    toast.error('Hubo un error al procesar tu pedido.')
    console.error(error)
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
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none"
              :disabled="userStore.isLoggedIn" :class="{ 'bg-gray-100': userStore.isLoggedIn }">
            <input v-model="cliente.telefono" type="tel" placeholder="Número de Teléfono" required maxlength="20"
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none"
              :disabled="userStore.isLoggedIn" :class="{ 'bg-gray-100': userStore.isLoggedIn }">
          </div>
          <p v-if="userStore.isLoggedIn" class="text-xs text-gray-500 mt-2">
            Estos datos se toman de tu cuenta. Para modificarlos, ve a "Mi Cuenta".
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">2. Método de Entrega</h2>
          <div class="space-y-2">
            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
              <input type="radio" v-model="metodoEntrega" value="recogida" name="entrega" class="accent-brand-fucsia">
              Retiro personal
            </label>
            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer">
              <input type="radio" v-model="metodoEntrega" value="envio" name="entrega" class="accent-brand-fucsia">
              Delivery
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
          <p class="text-sm text-gray-600 mb-4">Selecciona cómo deseas pagar:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div v-for="method in availablePaymentMethods" :key="method.id"
              @click="pago.metodo_pago_id = method.id; selectedPaymentMethod = method"
              class="p-4 border rounded-lg cursor-pointer transition-all duration-200"
              :class="pago.metodo_pago_id === method.id ? 'border-brand-fucsia bg-fuchsia-50 ring-2 ring-brand-fucsia' : 'border-gray-200 hover:border-gray-400'">
              <p class="font-bold text-gray-800">{{ method.nombre }}</p>
              <p class="text-sm text-gray-500 capitalize">{{ method.tipo.replace('-', ' ') }}</p>
            </div>
          </div>
          <div v-if="selectedPaymentMethod" class="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h4 class="font-bold text-gray-700 mb-2">Datos para realizar el pago:</h4>
            <div class="space-y-1 text-sm text-gray-600">
              <div v-if="selectedPaymentMethod.detalles?.banco"><strong>Banco:</strong> {{
                selectedPaymentMethod.detalles.banco }}</div>
              <div v-if="selectedPaymentMethod.detalles?.telefono"><strong>Teléfono:</strong> {{
                selectedPaymentMethod.detalles.telefono }}</div>
              <div v-if="selectedPaymentMethod.detalles?.cuenta"><strong>Nro. Cuenta:</strong> {{
                selectedPaymentMethod.detalles.cuenta }}</div>
              <div v-if="selectedPaymentMethod.detalles?.ci"><strong>Cédula/RIF:</strong> {{
                selectedPaymentMethod.detalles.ci }}</div>
              <div v-if="selectedPaymentMethod.detalles?.titular"><strong>Titular:</strong> {{
                selectedPaymentMethod.detalles.titular }}</div>
              <div v-if="selectedPaymentMethod.detalles?.correo"><strong>Correo:</strong> {{
                selectedPaymentMethod.detalles.correo }}</div>
              <div v-if="selectedPaymentMethod.detalles?.extra" class="italic text-xs mt-1">{{
                selectedPaymentMethod.detalles.extra }}</div>
            </div>
          </div>
          <div class="text-center text-sm text-gray-600 my-4 p-3 bg-blue-50 rounded-lg">
            <p>Para pagos con <strong>Zelle</strong>, por favor contáctanos vía <a href="https://wa.me/+584122741450"
                class="text-brand-fucsia font-bold hover:underline">
                WhatsApp</a> para coordinar.</p>
          </div>
          <label class="block mb-2">
            <span class="text-gray-700 font-medium text-sm">Monto en Dólares (USD)</span>
            <input :value="cartStore.finalTotal.toFixed(2)" type="number"
              class="w-full font-bold p-2 border rounded-md bg-gray-100" readonly>
          </label>

          <div v-if="selectedPaymentMethod?.tipo === 'pago-movil' || selectedPaymentMethod?.tipo === 'transferencia'"
            class="mb-4">
            <div v-if="isLoadingRate" class="text-left text-gray-500 text-sm p-2 bg-gray-50 rounded-md">
              Calculando monto en bolívares...
            </div>

            <div v-if="totalInBolivares && !isLoadingRate">
              <label class="block">
                <span class="text-gray-700 font-medium text-sm">Monto en Bolívares (VES)</span>
                <input
                  :value="totalInBolivares.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                  type="text" class="w-full font-bold p-2 border rounded-md bg-gray-100" readonly>
              </label>
            </div>
          </div>
          <div v-if="showPaymentReference" class="space-y-4">
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Nro. de Referencia o Transacción</span>
              <input v-model="pago.referencia" type="text"
                class="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none"
                :required="showPaymentReference" />
            </label>
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Fecha de la Transacción</span>
              <input v-model="fechaTransaccion" type="date" :max="maxDate"
                class="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia focus-within:outline-none"
                :required="showPaymentReference">
            </label>
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

          <div class="border-t pt-2">
            <a v-if="!cartStore.appliedCoupon" @click="showCouponInput = !showCouponInput"
              class="text-sm text-brand-fucsia font-semibold cursor-pointer hover:underline">
              ¿Tienes un cupón?
            </a>
            <Transition name="slide-fade">
              <div v-if="showCouponInput && !cartStore.appliedCoupon" class="flex flex-col md:flex-row gap-2 mt-2">
                <input v-model="couponCode" type="text" placeholder="Ingresa tu código"
                  class="flex-grow p-2 border rounded-md text-sm">
                <CustomButton @click.prevent="handleApplyCoupon" :disabled="isLoading">{{ isLoading ? 'Aplicando...' :
                  'Aplicar' }}</CustomButton>
              </div>
            </Transition>
          </div>

          <div class="space-y-2 mt-4 pt-2 border-t">
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

            <div v-if="selectedPaymentMethod?.tipo === 'pago-movil' || selectedPaymentMethod?.tipo === 'transferencia'"
              class="mt-3 pt-3 border-t border-dashed">

              <div v-if="isLoadingRate" class="text-center text-gray-500">
                <p>Buscando tasa del BCV...</p>
              </div>

              <div v-if="totalInBolivares && !isLoadingRate">
                <div class="flex justify-between items-center">
                  <span class="font-bold">Total en Bolívares</span>
                  <span class="font-semibold text-lg">{{ totalInBolivares.toLocaleString('es-VE', {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                  }) }} Bs.</span>
                </div>
                <p class="text-right text-xs text-gray-600 mt-1">
                  Tasa de Referencia: {{ exchangeRate.toFixed(2) }} Bs. por USD
                </p>
              </div>
            </div>
          </div>
          <div class="flex justify-center flex-col text-center border-t mt-2">
            <div class="mx-auto mt-4" ref="recaptchaContainer"></div>
            <CustomButton @click="procesarPedido" :disabled="procesando" class="w-full mt-4">
              {{ procesando ? 'Procesando...' : 'Finalizar Pedido' }}
            </CustomButton>
          </div>


        </div>
      </div>
    </form>
  </div>
</template>
