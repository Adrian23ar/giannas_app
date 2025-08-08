<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/supabase'; // Usamos Supabase directamente como en tu checkout
import OrderReceipt from '@/components/OrderReceipt.vue';

// Importamos las librerías para descargar
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const route = useRoute();
const orderDetails = ref(null);
const isLoading = ref(true);
const error = ref(null);

// Función para obtener todos los detalles del pedido desde la base de datos.
// Esta función es similar a la que usa tu panel de admin.
const getOrderCompleteDetails = async (orderId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      detalles_pedido (
        cantidad,
        precio_unitario,
        productos ( nombre )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    throw error;
  }
  return data;
};

// Cuando el componente se monta, buscamos los datos del pedido.
onMounted(async () => {
  const orderId = route.params.orderId;
  if (!orderId) {
    error.value = 'No se proporcionó un ID de pedido.';
    isLoading.value = false;
    return;
  }

  try {
    const details = await getOrderCompleteDetails(orderId);
    orderDetails.value = details;
  } catch (err) {
    console.error("Error al obtener detalles del pedido:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});

// Función para manejar la descarga del recibo
const downloadReceipt = async (format) => {
  const receiptElement = document.getElementById('receipt-content');
  if (!receiptElement) return;

  // Usamos html2canvas para crear una imagen del div del recibo
  const canvas = await html2canvas(receiptElement, {
    scale: 2, // Aumentamos la escala para mejor calidad de imagen
    useCORS: true
  });

  const orderId = orderDetails.value.id;

  if (format === 'png') {
    // Para descargar como PNG
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = image;
    link.download = `recibo-pedido-${orderId}.png`;
    link.click();
  } else if (format === 'pdf') {
    // Obtenemos el ancho y alto de la imagen que generamos
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Convertimos la imagen a formato JPEG para el PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // ¡AQUÍ ESTÁ LA MAGIA!
    // Creamos un PDF donde la "hoja" tiene exactamente el mismo tamaño que nuestra imagen.
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait', // Orientación automática
      unit: 'px',
      format: [imgWidth, imgHeight] // El formato es el tamaño de la imagen
    });

    // Añadimos la imagen al PDF, ocupando todo el espacio disponible
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    pdf.save(`recibo-pedido-${orderId}.pdf`);
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <div v-if="isLoading" class="text-center py-20">
      <h2 class="text-2xl font-semibold text-gray-700">Cargando los detalles de tu pedido...</h2>
      <p class="text-gray-500 mt-2">Por favor, espera un momento.</p>
    </div>

    <div v-else-if="error" class="text-center py-20 bg-red-50 p-8 rounded-lg">
      <h2 class="text-2xl font-bold text-red-700">¡Oops! Hubo un error</h2>
      <p class="text-red-600 mt-2">No pudimos encontrar los detalles de tu pedido.</p>
      <p class="text-gray-500 mt-4 text-sm">Por favor, verifica el número de orden o contacta a soporte.</p>
      <RouterLink to="/" class="mt-8 inline-block bg-brand-fucsia text-white font-bold py-3 px-8 rounded-md">
        Volver al Catálogo
      </RouterLink>
    </div>

    <div v-else-if="orderDetails" class="text-center">
      <h1 class="text-4xl font-bold text-green-600">¡Gracias por tu pedido!</h1>
      <p class="text-gray-800 mt-4 text-lg">Hemos recibido tu orden y estamos procesando la verificación de tu pago.</p>
      <p class="text-gray-600 mt-2">Puedes verificar el estado de tu pedido en la sección de <span
          class="font-semibold">"Seguimiento".</span></p>

      <div class="mt-10">
        <OrderReceipt :details="orderDetails" />
      </div>

      <div class="mt-8 space-y-4 md:space-y-0 md:space-x-4">
        <button @click="downloadReceipt('png')"
          class="bg-brand-morado text-white font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-colors">
          Descargar como Imagen (PNG)
        </button>
        <button @click="downloadReceipt('pdf')"
          class="bg-gray-700 text-white font-bold py-3 px-6 rounded-md hover:bg-gray-800 transition-colors">
          Descargar como PDF
        </button>
      </div>

      <RouterLink to="/" class="mt-5 inline-block text-gray-600 hover:text-brand-fucsia hover:underline transition-colors font-semibold p-2">
        Volver al Catálogo
      </RouterLink>
    </div>
  </div>
</template>
