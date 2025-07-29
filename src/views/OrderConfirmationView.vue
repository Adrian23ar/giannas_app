<template>
  <div class="text-center py-12">
    <h1 class="text-4xl font-bold text-green-600">¡Gracias por tu pedido!</h1>
    <p class="text-gray-700 mt-4 text-lg">Hemos recibido tu orden y estamos procesando la verificación de tu pago.</p>
    <p class="text-gray-600 mt-2">Tu número de orden es: <span class="font-bold text-brand-morado">#{{ $route.params.orderId }}</span></p>
    <RouterLink to="/" class="mt-8 inline-block bg-brand-fucsia text-white font-bold py-3 px-8 rounded-md">
      Volver al Catálogo
    </RouterLink>
  </div>
</template>
