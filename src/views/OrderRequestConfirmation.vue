<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="text-center py-20">
    <h1 class="text-3xl font-bold text-green-600">¡Solicitud Enviada con Éxito!</h1>
    <p class="mt-4 text-lg text-gray-700">
      Gracias, <span class="font-semibold">{{ route.query.name }}</span>. Hemos recibido tu solicitud.
    </p>
    <p class="mt-2 text-gray-600">
      Nos pondremos en contacto contigo en las próximas 24 horas hábiles para darte una cotización.
    </p>
    <p class="mt-8 text-sm text-gray-500">
      Tu número de referencia es: <strong class="text-brand-morado">#SO-{{ String(route.query.id).padStart(5, '0')
        }}</strong>
    </p>
    <router-link to="/catalogo"
      class="mt-8 inline-block bg-brand-fucsia text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90">
      Volver al Catálogo
    </router-link>
  </div>
</template>
