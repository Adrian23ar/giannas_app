<script setup>
// src/views/CheckoutView.vue
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
import { useToast } from 'vue-toastification'
import { supabase } from '../../supabase'
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet"
import { MapPinIcon } from '@heroicons/vue/24/outline'

import CustomButton from '@/components/shared/CustomButton.vue'
import { paymentMethodService } from '@/services/paymentMethodService'
import { incrementCouponUsage } from '@/services/couponService'
import { getLatestExchangeRate } from '@/services/exchangeRateService'
import { calculateShippingFee } from '@/services/deliveryService'
import { configService } from '@/services/configService'
import { loadRecaptcha } from '@/utils/recaptchaLoader'

const cartStore = useCartStore()
const userStore = useUserStore()
const router = useRouter()
const toast = useToast()

// --- Estados Generales ---
const cliente = ref({ nombre: '', telefono: '' })
const direccion = ref('')
const procesando = ref(false)

// --- ESTADOS DE ENTREGA (Lógica Nueva) ---
// 'recogida' | 'envio' | 'agendar'
const metodoEntrega = ref('recogida')

// Sub-opciones para cuando elige "Agendar"
const agendarTipo = ref('recogida') // 'recogida' | 'envio'
const agendarFecha = ref('')
const agendarHora = ref('')

// Configuración del Negocio (Horarios/Bloqueos)
const businessConfig = ref(null)

// --- Estados de Pago ---
const pago = ref({ referencia: '', metodo_pago_id: null })
const fechaTransaccion = ref('')
const paymentMethods = ref([])
const selectedPaymentMethod = ref(null)

// --- Estados de Cupón y Moneda ---
const showCouponInput = ref(false)
const couponCode = ref('')
const isLoading = ref(false)
const exchangeRate = ref(null)
const totalInBolivares = ref(null)
const isLoadingRate = ref(false)

// --- Lógica del Mapa ---
const zoom = ref(14)
const mapCenter = ref([10.491021, -66.882181])
const markerLatLng = ref([10.491021, -66.882181])
const isLocating = ref(false)
const deliveryInfo = ref({ distance: 0, loading: false, error: '' }) // <--- NUEVO ESTADO
// --- reCAPTCHA ---
const recaptchaContainer = ref(null)
const recaptchaWidgetId = ref(null)

// --- COMPUTADAS ---

const maxDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// Calcula fecha mínima para agendar (Hoy o Mañana)
const minAgendarDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// FILTRO DE MÉTODOS DE PAGO (Aquí está la regla del Efectivo)
const availablePaymentMethods = computed(() => {
  let methods = paymentMethods.value;

  // 1. Si es Agendado, ELIMINAR Efectivo
  if (metodoEntrega.value === 'agendar') {
    methods = methods.filter(m => m.nombre.toLowerCase() !== 'efectivo');
  }
  // 2. Si es Envio inmediato, filtrar los que solo son para recogida (si aplica)
  else if (metodoEntrega.value === 'envio') {
    methods = methods.filter(m => m.disponibilidad !== 'recogida');
  }

  return methods;
});

const showPaymentReference = computed(() => {
  if (!selectedPaymentMethod.value) return true;

  // Ocultar referencia si es Recogida Inmediata Y Efectivo
  // (Para agendado nunca será efectivo, así que siempre pedirá referencia)
  const isCash = selectedPaymentMethod.value.nombre.toLowerCase() === 'efectivo';

  if (metodoEntrega.value === 'recogida' && isCash) return false;

  return true;
});

// --- VALIDACIONES DE FECHA Y HORA (El Cerebro) ---

function validarFechaAgendada() {
  if (!businessConfig.value || !agendarFecha.value) return;

  const fechaSeleccionada = new Date(agendarFecha.value + 'T00:00:00');
  const diaSemana = fechaSeleccionada.getDay(); // 0 Domingo, 1 Lunes...
  const fechaStr = agendarFecha.value; // YYYY-MM-DD

  // 1. Verificar si la fecha está bloqueada manualmente
  if (businessConfig.value.fechas_bloqueadas?.includes(fechaStr)) {
    toast.error('Lo sentimos, no laboramos en esa fecha.');
    agendarFecha.value = '';
    return;
  }

  // 2. Verificar si el día de la semana está activo
  const configDia = businessConfig.value.horarios[diaSemana];
  if (!configDia || !configDia.activo) {
    toast.info(`Lo sentimos, los ${configDia?.dia || 'días seleccionados'} no laboramos.`);
    agendarFecha.value = '';
    return;
  }
}

function validarHoraAgendada() {
  if (!businessConfig.value || !agendarFecha.value || !agendarHora.value) return;

  const fechaSeleccionada = new Date(agendarFecha.value + 'T00:00:00');
  const diaSemana = fechaSeleccionada.getDay();
  const configDia = businessConfig.value.horarios[diaSemana];

  if (configDia && configDia.activo) {
    const horaCliente = agendarHora.value; // "14:30"

    if (horaCliente < configDia.inicio || horaCliente > configDia.fin) {
      toast.info(`El horario de atención para ese día es de ${configDia.inicio} a ${configDia.fin}.`);
      agendarHora.value = '';
    }
  }
}

// --- HELPERS ---

function getVariantSummary(item) {
  if (!item.variants || Object.keys(item.variants).length === 0) return [];
  if (!item.configuracion_variantes) return [];

  return Object.entries(item.variants).map(([groupIndex, options]) => {
    return `${options.join(', ')}`;
  }).filter(text => text !== null);
}

// --- LIFECYCLE ---

const renderRecaptcha = () => {
  if (recaptchaContainer.value && window.grecaptcha) {
    window.grecaptcha.ready(() => {
      recaptchaWidgetId.value = window.grecaptcha.render(recaptchaContainer.value, {
        'sitekey': '6LegfJ8rAAAAABWBru2sS_rlb5G7GHPie-V4ZD8-',
      });
    });
  }
};

onMounted(async () => {
  if (userStore.isLoggedIn) {
    cliente.value.nombre = userStore.userFullName;
    cliente.value.telefono = userStore.userPhone;
  }

  try {
    const [methods, config] = await Promise.all([
      paymentMethodService.getActiveMethods(),
      configService.getConfig()
    ]);

    paymentMethods.value = methods;
    businessConfig.value = config;

  } catch (error) {
    console.error(error);
    toast.error('Error al cargar configuraciones iniciales.');
  }

  // NUEVA LÓGICA DE RECAPTCHA DINÁMICO
  try {
    await loadRecaptcha() // Descarga el script si no existe
    renderRecaptcha()     // Renderiza el widget
  } catch (e) {
    console.error('Error cargando ReCAPTCHA', e)
    toast.error('Error de conexión con seguridad. Recarga la página.')
  }
});

onUnmounted(() => {
  window.removeEventListener('recaptcha-loaded', renderRecaptcha);
});

// --- WATCHERS ---

// Resetear pago si cambia el método de entrega (por si desaparece el efectivo)
watch(metodoEntrega, (newVal) => {
  // 1. LÓGICA DE ENVÍO
  // Si es recogida O agendar, el costo es 0 (No calculamos nada)
  if (newVal === 'recogida' || newVal === 'agendar') {
    cartStore.setShippingCost(0)
    deliveryInfo.value.error = ''
  }
  // Solo calculamos si es "Delivery Inmediato"
  else if (newVal === 'envio') {
    updateDeliveryCost(markerLatLng.value[0], markerLatLng.value[1])
  }

  // 2. LÓGICA DE MÉTODOS DE PAGO (se mantiene igual)
  const isSelectedAvailable = availablePaymentMethods.value.some(
    (method) => method.id === pago.value.metodo_pago_id
  );

  if (!isSelectedAvailable) {
    pago.value.metodo_pago_id = null;
    selectedPaymentMethod.value = null;
    totalInBolivares.value = null;
  }
})

// Calcular tasa si es necesario
watch(() => pago.value.metodo_pago_id, async (newId) => {
  totalInBolivares.value = null;
  exchangeRate.value = null;

  if (!newId) {
    selectedPaymentMethod.value = null;
    return;
  }

  selectedPaymentMethod.value = paymentMethods.value.find(m => m.id === newId);
  const needsConversion = selectedPaymentMethod.value?.tipo === 'pago-movil' || selectedPaymentMethod.value?.tipo === 'transferencia';

  if (needsConversion) {
    isLoadingRate.value = true;
    try {
      const rate = await getLatestExchangeRate();
      if (rate) {
        exchangeRate.value = rate;
        totalInBolivares.value = cartStore.finalTotal * rate;
      } else {
        toast.error("No se pudo obtener la tasa de cambio.");
      }
    } catch (error) {
      toast.error("Error al buscar la tasa de cambio.");
    } finally {
      isLoadingRate.value = false;
    }
  }
});

watch(agendarTipo, () => {
  // Si estamos en modo agendar, aseguramos que el envío sea 0
  if (metodoEntrega.value === 'agendar') {
    cartStore.setShippingCost(0)
  }
})

// Mapa
// src/views/CheckoutView.vue

async function onMarkerDragEnd(event) {
  const { lat, lng } = event.target.getLatLng()
  markerLatLng.value = [lat, lng]

  // SOLO calculamos si es "Delivery (Inmediato)"
  if (metodoEntrega.value === 'envio') {
    await updateDeliveryCost(lat, lng)
  }
}

async function getUserLocation() {
  if (isLocating.value) return;
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta la geolocalización.");
    return;
  }
  isLocating.value = true;
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
      });
    });
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    markerLatLng.value = [lat, lng];
    mapCenter.value = [lat, lng];
    if (metodoEntrega.value === 'envio') {
      await updateDeliveryCost(lat, lng)
    }
  } catch (error) {
    console.log(error);
    alert("No se pudo obtener tu ubicación.");
  } finally {
    isLocating.value = false;
  }
}

// NUEVA FUNCIÓN AUXILIAR
async function updateDeliveryCost(lat, lng) {
  deliveryInfo.value.loading = true
  deliveryInfo.value.error = ''

  // Hacemos el cálculo (esto tarda unos segundos)
  const result = await calculateShippingFee(lat, lng)

  // --- CORRECCIÓN DEL BUG (Race Condition) ---
  // Verificamos: ¿El usuario sigue queriendo "Delivery Inmediato"?
  // Si se cambió a "Recogida" o "Agendar" mientras calculábamos, ABORTAMOS.
  if (metodoEntrega.value !== 'envio') {
    deliveryInfo.value.loading = false
    return; // Salimos de la función sin tocar el precio
  }
  // ------------------------------------------

  deliveryInfo.value.loading = false

  if (result.success) {
    cartStore.setShippingCost(result.price)
    deliveryInfo.value.distance = result.distance
    // toast.success(`Distancia: ${result.distance}km. Envío: $${result.price}`)
  } else {
    cartStore.setShippingCost(0)
    deliveryInfo.value.distance = result.distance || 0
    deliveryInfo.value.error = result.message
    toast.warning(result.message)
  }
}

// Cupones
async function handleApplyCoupon() {
  if (!couponCode.value.trim()) return
  isLoading.value = true
  try {
    const coupon = await cartStore.applyCoupon(couponCode.value)
    toast.success(`¡Cupón "${coupon.codigo}" aplicado!`)
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

const whatsappZelleLink = computed(() => {
  // A. Construimos el encabezado del mensaje
  let text = "Hola! Quisiera realizar el pago de mi pedido con *Zelle*.\n\n";

  // B. Listamos los productos
  text += "*Resumen del Pedido:*\n";
  cartStore.items.forEach(item => {
    text += `- ${item.nombre} (x${item.quantity})`;

    // Si tiene variantes
    if (item.variants && Object.keys(item.variants).length > 0) {
      // Helper simple para mostrar variantes en texto plano
      const variantValues = Object.values(item.variants).flat().join(', ');
      text += ` [${variantValues}]`;
    }
    text += ` - $${(item.precio * item.quantity).toFixed(2)}\n`;
  });

  text += "\n--------------------------------\n";

  // C. Agregamos los totales financieros
  text += `*Subtotal:* $${cartStore.subtotal.toFixed(2)}\n`;

  if (cartStore.discountAmount > 0) {
    text += `*Descuento:* -$${cartStore.discountAmount.toFixed(2)}\n`;
  }

  // --- D. Información de Entrega (CORREGIDO) ---
  // Aquí usamos 'metodoEntrega' en vez de 'deliveryMethod'

  if (metodoEntrega.value === 'envio') {
    text += `*Envío (Inmediato):* $${cartStore.shippingCost.toFixed(2)}\n`;
    text += `*Dirección:* ${direccion.value || 'Pendiente'}\n`;
  }
  else if (metodoEntrega.value === 'agendar') {
    text += `*Pedido Agendado*\n`;
    text += `Fecha: ${agendarFecha.value || 'Pendiente'}\n`;
    text += `Hora: ${agendarHora.value || 'Pendiente'}\n`;

    if (agendarTipo.value === 'envio') {
       text += `*Modo:* Delivery (Dirección a coordinar)\n`;
    } else {
       text += `*Modo:* Retiro Personalmente\n`;
    }
  }
  else {
    text += `*Retiro en Tienda* (Pick-up Inmediato)\n`;
  }

  text += "--------------------------------\n";
  text += `*TOTAL A PAGAR: $${cartStore.finalTotal.toFixed(2)}*\n\n`;

  // --- E. Datos del Cliente (CORREGIDO) ---
  // Aquí usamos 'cliente' en vez de 'formData'
  text += `*Cliente:* ${cliente.value.nombre || 'Pendiente'}\n`;
  if(cliente.value.telefono) text += `*Tel:* ${cliente.value.telefono}\n`;

  // F. Codificamos todo para URL y retornamos el link completo
  return `https://wa.me/584122741450?text=${encodeURIComponent(text)}`;
});

// --- PROCESAR PEDIDO (El Corazón) ---
async function procesarPedido() {
  // 1. Validaciones básicas
  if (cartStore.items.length === 0) return toast.error('Tu carrito está vacío.')

  if (!cliente.value.nombre || !cliente.value.nombre.trim()) {
    return toast.error('Por favor, ingresa tu Nombre y Apellido.');
  }
  if (!cliente.value.telefono || !cliente.value.telefono.trim()) {
    return toast.error('Por favor, ingresa tu Número de Teléfono.');
  }

  if (!pago.value.metodo_pago_id) return toast.error('Selecciona un método de pago.');

  if (showPaymentReference.value) {
    if (!pago.value.referencia) return toast.error('Ingresa la referencia de pago.');
    if (!fechaTransaccion.value) return toast.error('Selecciona la fecha de pago.');
  }

  // 2. Validaciones de Agendado
  if (metodoEntrega.value === 'agendar') {
    if (!agendarFecha.value) return toast.error('Debes seleccionar una fecha para agendar.');
    if (!agendarHora.value) return toast.error('Debes seleccionar una hora para agendar.');
  }
  else if (metodoEntrega.value === 'envio') {
    if (!direccion.value.trim()) return toast.error('Ingresa un punto de referencia para el delivery.');
  }
  // 3. reCAPTCHA
  const recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId.value);
  if (!recaptchaResponse) {
    toast.error('Completa el reCAPTCHA.');
    return;
  }

  procesando.value = true
  const appliedCouponId = cartStore.appliedCoupon?.id
  const orderUserId = userStore.isLoggedIn ? userStore.user.id : null

  try {
    // --- PREPARAR DATOS PARA DB ---

    // Determinar valores finales según el modo seleccionado
    let finalMetodoEntrega = metodoEntrega.value;
    let finalDireccion = null;
    let finalEsAgendado = false;
    let finalFechaAgendada = null;
    let finalHoraAgendada = null;
    let finalLat = null;
    let finalLng = null;

    if (metodoEntrega.value === 'agendar') {
      finalEsAgendado = true;
      finalFechaAgendada = agendarFecha.value;
      finalHoraAgendada = agendarHora.value;

      // En DB guardamos 'recogida' o 'envio' aunque sea agendado
      finalMetodoEntrega = agendarTipo.value;

      if (agendarTipo.value === 'envio') {
        finalDireccion = "A coordinar por WhatsApp"; // Texto automático
      }
    } else {
      // Modos normales (inmediatos)
      if (metodoEntrega.value === 'envio') {
        finalDireccion = direccion.value;
        finalLat = markerLatLng.value[0];
        finalLng = markerLatLng.value[1];
      }
    }

    const pedidoParaGuardar = {
      user_id: orderUserId,
      nombre_cliente: cliente.value.nombre,
      telefono_cliente: cliente.value.telefono,
      metodo_entrega: finalMetodoEntrega,
      direccion_envio: finalDireccion,
      total: cartStore.finalTotal,
      estado: 'verificando_pago',
      latitud: finalLat,
      longitud: finalLng,
      total_bs: totalInBolivares.value,
      // Nuevos campos
      es_agendado: finalEsAgendado,
      fecha_agendada: finalFechaAgendada,
      hora_agendada: finalHoraAgendada,
      costo_envio: cartStore.shippingCost || 0
    }

    // Insertar Pedido
    const { data: pedidoData, error: pedidoError } = await supabase.from('pedidos').insert(pedidoParaGuardar).select('id').single()
    if (pedidoError) throw pedidoError
    const pedidoId = pedidoData.id

    // Insertar Detalles (CON VARIANTES)
    const detallesPedido = cartStore.items.map(item => ({
      pedido_id: pedidoId,
      producto_id: item.id,
      cantidad: item.quantity,
      precio_unitario: item.precio,
      variantes_elegidas: item.variants || null
    }))
    const { error: detallesError } = await supabase.from('detalles_pedido').insert(detallesPedido)
    if (detallesError) throw detallesError

    // Insertar Pago
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
            Estos datos se toman de tu cuenta.
          </p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">2. Método de Entrega</h2>

          <div class="space-y-3">
            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50"
              :class="{ 'border-brand-fucsia ring-1 ring-brand-fucsia bg-pink-50': metodoEntrega === 'recogida' }">
              <input type="radio" v-model="metodoEntrega" value="recogida" name="entrega" class="accent-brand-fucsia">
              <span class="font-medium">Retiro personal (Inmediato)</span>
            </label>

            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50"
              :class="{ 'border-brand-fucsia ring-1 ring-brand-fucsia bg-pink-50': metodoEntrega === 'envio' }">
              <input type="radio" v-model="metodoEntrega" value="envio" name="entrega" class="accent-brand-fucsia">
              <span class="font-medium">Delivery (Inmediato)</span>
            </label>

            <label class="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50"
              :class="{ 'border-brand-fucsia ring-1 ring-brand-fucsia bg-pink-50': metodoEntrega === 'agendar' }">
              <input type="radio" v-model="metodoEntrega" value="agendar" name="entrega" class="accent-brand-fucsia">
              <span class="font-medium">Agendar Pedido (Fecha futura)</span>
            </label>
          </div>

          <div v-if="metodoEntrega === 'envio'" class="mt-6 space-y-4 animate-fadeIn">
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm font-medium text-gray-700">Define el punto de entrega:</p>
              <button @click.prevent="getUserLocation" type="button"
                class="inline-flex items-center gap-1 text-sm font-semibold text-brand-fucsia hover:underline">
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
            <div v-if="metodoEntrega === 'envio' || (metodoEntrega === 'agendar' && agendarTipo === 'envio')"
              class="mt-2">

              <p v-if="deliveryInfo.loading" class="text-sm text-blue-600 animate-pulse">
                Calculando ruta y tarifa de envío...
              </p>

              <div v-else-if="!deliveryInfo.error && cartStore.shippingCost > 0"
                class="p-3 bg-pink-100 border font-semibold text-brand-fucsia-dark border-brand-fucsia rounded-md flex justify-between items-center">
                <p class="flex">
                  <MapPinIcon class="h-6 w-6" />{{ deliveryInfo.distance }} km
                </p>
                <span>
                  Costo Envío: ${{ cartStore.shippingCost.toFixed(2) }}
                </span>
              </div>

              <div v-if="deliveryInfo.error"
                class="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                ⚠️ {{ deliveryInfo.error }}
              </div>
            </div>
            <textarea v-model="direccion" placeholder="Punto de referencia (ej: portón rojo, frente a farmacia)"
              rows="2" required
              class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia outline-none"></textarea>
          </div>

          <div v-if="metodoEntrega === 'agendar'"
            class="mt-6 p-4 bg-pink-50/50 border border-pink-100 rounded-lg animate-fadeIn">
            <h3 class="font-bold text-brand-morado mb-3">Detalles del Agendado</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha deseada</label>
                <input type="date" v-model="agendarFecha" :min="minAgendarDate" @change="validarFechaAgendada"
                  class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hora estimada</label>
                <input type="time" v-model="agendarHora" @change="validarHoraAgendada"
                  class="w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia outline-none">
              </div>
            </div>

            <p class="text-sm font-medium text-gray-700 mb-2">¿Cómo deseas recibirlo?</p>
            <div class="flex flex-col sm:flex-row gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="agendarTipo" value="recogida" class="accent-brand-fucsia">
                <span class="text-sm">Retiro personalmente</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="agendarTipo" value="envio" class="accent-brand-fucsia">
                <span class="text-sm">Delivery (Dirección a coordinar)</span>
              </label>
            </div>
            <p v-if="agendarTipo === 'envio'" class="text-xs text-gray-500 mt-2 italic">
              <span class="text-red-500 text-sm">*</span> La dirección exacta se coordinará vía WhatsApp tras confirmar
              el pedido.
            </p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">3. Registra tu Pago</h2>

          <div v-if="metodoEntrega === 'agendar'"
            class="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-100 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-5 h-5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span>Para pedidos agendados solo aceptamos pagos digitales (No Efectivo).</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div v-for="method in availablePaymentMethods" :key="method.id" @click="pago.metodo_pago_id = method.id"
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
            <p>Para pagos con <strong>Zelle</strong>, por favor contáctanos vía <a :href=whatsappZelleLink
                class="text-brand-fucsia font-bold hover:underline" target="_blank">WhatsApp</a> para coordinar.</p>
          </div>

          <label class="block mb-2">
            <span class="text-gray-700 font-medium text-sm">Monto en Dólares (USD)</span>
            <input :value="cartStore.finalTotal.toFixed(2)" type="number"
              class="w-full font-bold p-2 border rounded-md bg-gray-100" readonly>
          </label>

          <div v-if="selectedPaymentMethod?.tipo === 'pago-movil' || selectedPaymentMethod?.tipo === 'transferencia'"
            class="mb-4">
            <div v-if="isLoadingRate" class="text-left text-gray-500 text-sm p-2 bg-gray-50">Calculando...</div>
            <div v-if="totalInBolivares && !isLoadingRate">
              <label class="block">
                <span class="text-gray-700 font-medium text-sm">Monto en Bolívares (VES)</span>
                <input
                  :value="totalInBolivares.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                  type="text" class="w-full font-bold p-2 border rounded-md bg-gray-100" readonly>
              </label>
            </div>
          </div>

          <div v-if="showPaymentReference" class="space-y-4 animate-fadeIn">
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Nro. de Referencia</span>
              <input v-model="pago.referencia" type="text" required
                class="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia outline-none" />
            </label>
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Fecha de la Transacción</span>
              <input v-model="fechaTransaccion" type="date" :max="maxDate" required
                class="mt-1 block w-full p-2 border rounded-md focus:ring-2 focus:ring-brand-fucsia outline-none">
            </label>
          </div>

        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-lg shadow-md sticky top-28">
          <h2 class="text-2xl font-bold border-b pb-4">Resumen del Pedido</h2>

          <ul class="space-y-4 my-4">
            <li v-for="item in cartStore.items" :key="item.id" class="flex justify-between border-b pb-2 last:border-0">
              <div class="flex-grow pr-2">
                <span class="font-medium text-gray-800">{{ item.nombre }} x {{ item.quantity }}</span>
                <div v-if="item.variants && Object.keys(item.variants).length > 0" class="mt-1">
                  <p v-for="(line, idx) in getVariantSummary(item)" :key="idx" class="text-xs text-gray-500">{{ line }}
                  </p>
                </div>
              </div>
              <span class="font-semibold text-gray-700">${{ (item.precio * item.quantity).toFixed(2) }}</span>
            </li>
          </ul>

          <div class="border-t pt-2">
            <a v-if="!cartStore.appliedCoupon" @click="showCouponInput = !showCouponInput"
              class="text-sm text-brand-fucsia font-semibold cursor-pointer hover:underline">¿Tienes un cupón?</a>
            <Transition name="slide-fade">
              <div v-if="showCouponInput && !cartStore.appliedCoupon" class="flex flex-col md:flex-row gap-2 mt-2">
                <input v-model="couponCode" type="text" placeholder="Código"
                  class="flex-grow p-2 border rounded-md text-sm">
                <CustomButton @click.prevent="handleApplyCoupon" :disabled="isLoading">{{ isLoading ? '...' : 'Aplicar'
                }}</CustomButton>
              </div>
            </Transition>
          </div>

          <div class="space-y-2 mt-4 pt-2 border-t">
            <div class="flex justify-between items-center">
              <p class="text-gray-600">Subtotal</p>
              <p class="font-semibold">${{ cartStore.subtotal.toFixed(2) }}</p>
            </div>

            <div v-if="cartStore.shippingCost > 0" class="flex justify-between items-center text-gray-600">
              <p>Envío ({{ deliveryInfo.distance }}km)</p>
              <p class="font-semibold">+ ${{ cartStore.shippingCost.toFixed(2) }}</p>
            </div>

            <Transition name="fade">
              <div v-if="cartStore.appliedCoupon" class="flex justify-between items-center text-green-600">
                <p>Descuento <button @click="handleRemoveCoupon" class="text-red-500 text-xs">(x)</button></p>
                <p class="font-semibold">-${{ cartStore.discountAmount.toFixed(2) }}</p>
              </div>
            </Transition>

            <div class="flex justify-between items-center font-bold text-lg border-t pt-2">
              <p>Total a Pagar</p>
              <p class="text-brand-fucsia text-xl">${{ cartStore.finalTotal.toFixed(2) }}</p>
            </div>
          </div>

          <div class="flex justify-center flex-col text-center border-t mt-4 pt-4">
            <div class="mx-auto" ref="recaptchaContainer"></div>
            <CustomButton @click="procesarPedido" :disabled="procesando" class="w-full mt-4">
              {{ procesando ? 'Procesando...' : 'Finalizar Pedido' }}
            </CustomButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.4s ease-in-out;
}

.leaflet-container.leaflet-touch.leaflet-fade-anim.leaflet-grab.leaflet-touch-drag.leaflet-touch-zoom {
  z-index: 39;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
