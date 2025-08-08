<script setup>
import { computed } from 'vue';

// Definimos las 'props' que este componente espera recibir.
// En este caso, un objeto 'details' con toda la info del pedido.
const props = defineProps({
  details: {
    type: Object,
    required: true
  }
});

// Propiedad computada para formatear la fecha a un formato legible.
const formattedDate = computed(() => {
  if (!props.details?.created_at) return '';
  return new Date(props.details.created_at).toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Propiedad computada para calcular el subtotal (la suma de todos los productos)
const subtotal = computed(() => {
  if (!props.details?.detalles_pedido) return 0;
  return props.details.detalles_pedido.reduce((acc, item) => {
    return acc + (item.cantidad * item.precio_unitario);
  }, 0);
});
</script>

<template>
  <div id="receipt-content" class="bg-white p-8 max-w-2xl mx-auto border border-gray-200 rounded-lg">

    <header class="flex justify-between items-start pb-6 border-b">
      <div class="flex justify-center items-center gap-4">
        <img src="/public/logo-giannas.png" alt="Logo de Gianna's App" class="h-16 object-contain mr-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Recibo de Compra</h1>
        </div>
      </div>
      <div class="text-right">
        <p class="text-sm text-gray-600">Pedido N°: <span class="font-semibold text-gray-800">#{{ details.id }}</span>
        </p>
        <p class="text-sm text-gray-600">Fecha: <span class="font-semibold text-gray-800">{{ formattedDate }}</span></p>
      </div>
    </header>

    <section class="grid grid-cols-2 gap-8 my-6">
      <div>
        <h2 class="font-bold text-gray-700 mb-2">DATOS DEL CLIENTE</h2>
        <p class="text-sm text-gray-600">{{ details.nombre_cliente }}</p>
        <p class="text-sm text-gray-600">{{ details.telefono_cliente }}</p>
      </div>
      <div>
        <h2 class="font-bold text-gray-700 mb-2">DETALLES DEL PEDIDO</h2>
        <p class="text-sm text-gray-600">
          <span class="font-semibold">Tipo de Entrega: </span>
          <span class="capitalize">{{ details.metodo_entrega.replace('_', ' ') }}</span>
        </p>
        <p v-if="details.metodo_entrega === 'envio'" class="text-sm text-gray-600">
          <span class="font-semibold">Dirección:</span> {{ details.direccion_envio }}
        </p>
      </div>
    </section>

    <section>
      <div class="w-full">
        <div class="grid grid-cols-12 gap-4 bg-gray-100 p-2 rounded-t-md font-bold text-sm text-gray-600">
          <div class="col-span-1 text-center">Cant.</div>
          <div class="col-span-6">Producto</div>
          <div class="col-span-2 text-right">C/U</div>
          <div class="col-span-3 text-right">Total</div>
        </div>
        <div class="border-l border-r">
          <div v-for="item in details.detalles_pedido" :key="item.producto_id"
            class="grid grid-cols-12 gap-4 p-2 text-sm border-b">
            <div class="col-span-1 text-center">{{ item.cantidad }}</div>
            <div class="col-span-6 font-medium text-gray-800">{{ item.productos.nombre }}</div>
            <div class="col-span-2 text-right">${{ item.precio_unitario.toFixed(2) }}</div>
            <div class="col-span-3 text-right font-semibold">${{ (item.cantidad * item.precio_unitario).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="flex justify-end mt-6">
      <div class="w-full max-w-xs space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Subtotal:</span>
          <span class="font-semibold text-gray-800">${{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between font-bold text-lg border-t pt-2">
          <span class="text-gray-800">Total (USD):</span>
          <span class="text-brand-fucsia">${{ details.total.toFixed(2) }}</span>
        </div>
        <div v-if="details.total_bs" class="flex justify-between font-bold text-md text-gray-700">
          <span>Total (VES):</span>
          <span>{{ details.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            Bs.</span>
        </div>
      </div>
    </section>

    <footer class="text-center mt-10 pt-6 border-t">
      <p class="text-brand-fucsia font-bold text-lg">¡Gracias por tu compra!</p>
    </footer>

  </div>
</template>
