<script setup>
import { computed } from 'vue';

const props = defineProps({
  details: {
    type: Object,
    required: true
  }
});

const formattedDate = computed(() => {
  if (!props.details?.created_at) return '';
  return new Date(props.details.created_at).toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Format Fecha Agendada
const formattedScheduleDate = computed(() => {
  if (!props.details?.fecha_agendada) return '';
  const fecha = new Date(props.details.fecha_agendada + 'T00:00:00');
  return fecha.toLocaleDateString('es-VE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
});

// Format Hora Agendada
const formattedScheduleTime = computed(() => {
  if (!props.details?.hora_agendada) return '';
  const [hours, minutes] = props.details.hora_agendada.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
});

const subtotal = computed(() => {
  if (!props.details?.detalles_pedido) return 0;
  return props.details.detalles_pedido.reduce((acc, item) => {
    return acc + (item.cantidad * item.precio_unitario);
  }, 0);
});

function formatVariants(item) {
  // Manejo robusto de las variantes
  const variantes = item.variantes_elegidas;
  if (!variantes || Object.keys(variantes).length === 0) return null;

  // Si variantes es un objeto tipo { "0": ["Chocolate"], "1": ["Maní"] }
  // y no tenemos la configuración a mano en el recibo (porque detalles_pedido no suele traer la config del producto en join simples a veces)
  // lo más seguro es mostrar solo los valores:
  return Object.values(variantes).flat().join(', ');
}
</script>

<template>
  <div id="receipt-content" class="bg-white p-8 max-w-2xl mx-auto border border-gray-200 rounded-lg shadow-sm">

    <header class="flex flex-wrap justify-between items-start pb-6 border-b">
      <div class="flex justify-center items-center gap-4 w-full md:w-auto mb-3">
        <img src="/logo-giannas.png" alt="Logo de Gianna's App" class="h-12 sm:h-14 object-contain md:mr-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-gray-800">Recibo de Compra</h1>
          <span class="text-xs text-gray-500 uppercase tracking-widest">Gianna's Cookies</span>
        </div>
      </div>
      <div class="text-right w-full md:w-auto mt-2 md:mt-0">
        <p class="text-sm text-gray-600">Pedido N°: <span class="font-bold text-gray-800 text-lg">#{{ details.id
            }}</span></p>
        <p class="text-xs text-gray-500">{{ formattedDate }}</p>
      </div>
    </header>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-8 my-6">
      <div>
        <h2 class="font-bold text-gray-700 mb-2 text-sm uppercase border-b w-fit pb-1">Datos del Cliente</h2>
        <p class="text-sm text-gray-800 font-medium">{{ details.nombre_cliente }}</p>
        <p class="text-sm text-gray-600">{{ details.telefono_cliente }}</p>
      </div>

      <div>
        <h2 class="font-bold text-gray-700 mb-2 text-sm uppercase border-b w-fit pb-1">Detalles de Entrega</h2>

        <div v-if="details.es_agendado" class="mb-2 bg-purple-50 p-2 rounded border border-purple-100 text-sm">
          <p class="font-bold text-brand-morado mb-1">Pedido Agendado</p>
          <p class="text-gray-700"><span class="font-semibold">Fecha:</span> {{ formattedScheduleDate }}</p>
          <p class="text-gray-700"><span class="font-semibold">Hora:</span> {{ formattedScheduleTime }}</p>
        </div>

        <p class="text-sm text-gray-600">
          <span class="font-semibold">Método: </span>
          <span class="capitalize">{{ details.metodo_entrega === 'envio' ? 'Delivery' : 'Retiro Personal' }}</span>
        </p>

        <p v-if="details.metodo_entrega === 'envio' && details.direccion_envio" class="text-sm text-gray-600 mt-1">
          <span class="font-semibold">Dirección:</span><br>
          {{ details.direccion_envio }}
        </p>
      </div>
    </section>

    <section>
      <div class="w-full border rounded-lg overflow-hidden">
        <div class="grid grid-cols-12 gap-2 bg-gray-50 p-3 font-bold text-xs text-gray-500 uppercase border-b">
          <div class="col-span-2 text-center">Cant.</div>
          <div class="col-span-6">Producto</div>
          <div class="col-span-4 text-right">Total</div>
        </div>

        <div class="divide-y divide-gray-100">
          <div v-for="item in details.detalles_pedido" :key="item.producto_id"
            class="grid grid-cols-12 gap-2 p-3 text-sm items-start">

            <div class="col-span-2 text-center font-bold text-gray-700 pt-1">{{ item.cantidad }}</div>

            <div class="col-span-6">
              <p class="font-bold text-gray-800">{{ item.productos.nombre }}</p>

              <p v-if="formatVariants(item)" class="text-xs text-gray-500 mt-1">
                {{ formatVariants(item) }}
              </p>

              <p class="text-xs text-gray-400 mt-0.5">${{ item.precio_unitario.toFixed(2) }} c/u</p>
            </div>

            <div class="col-span-4 text-right font-bold text-gray-800 pt-1">
              ${{ (item.cantidad * item.precio_unitario).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="flex justify-end mt-6">
      <div class="w-full max-w-xs space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Subtotal:</span>
          <span class="font-semibold text-gray-800">${{ subtotal.toFixed(2) }}</span>
        </div>

        <div class="flex justify-between font-bold text-xl border-t pt-3 items-end">
          <span class="text-gray-800 text-sm pb-1">Total (USD):</span>
          <span class="text-brand-fucsia">${{ details.total.toFixed(2) }}</span>
        </div>

        <div v-if="details.total_bs"
          class="flex justify-between font-medium text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <span>Referencia (VES):</span>
          <span>{{ details.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            Bs.</span>
        </div>
      </div>
    </section>

    <footer class="text-center mt-10 pt-6 border-t border-dashed">
      <p class="text-brand-fucsia font-bold text-lg mb-1">¡Gracias por tu compra!</p>

      <p v-if="details.es_agendado" class="text-sm text-gray-600">
        En breve nos estaremos comunicando con usted para confirmar su pedido agendado.
      </p>
      <p v-else class="text-sm text-gray-500">
        Si tienes alguna duda, contáctanos vía WhatsApp.
      </p>
    </footer>

  </div>
</template>
