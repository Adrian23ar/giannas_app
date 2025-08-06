<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { createSpecialOrder } from '@/services/specialOrderService'
import { useToast } from 'vue-toastification'
import CustomButton from '@/components/CustomButton.vue'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const loading = ref(false)
const form = ref({
  cliente_id: null,
  nombre_completo: '',
  email: '',
  telefono: '',
  fecha_evento: '',
  cantidad_personas: null,
  descripcion_pedido: ''
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    form.value.cliente_id = userStore.user.id
    form.value.nombre_completo = userStore.user.user_metadata?.full_name || ''
    form.value.email = userStore.user.email
    form.value.telefono = userStore.user.phone || ''
  }
})

async function handleSubmit() {
  // ----- INICIO DEL CAMBIO: VALIDACIÓN ACTUALIZADA -----
  if (!form.value.nombre_completo || !form.value.email || !form.value.descripcion_pedido || !form.value.telefono) {
    toast.error('Por favor, completa todos los campos obligatorios (*).');
    return;
  }
  // ----- FIN DEL CAMBIO -----

  loading.value = true
  try {
    const newOrder = await createSpecialOrder(form.value)
    router.push({
      name: 'special-order-confirmation',
      query: {
        id: newOrder.id,
        name: form.value.nombre_completo
      }
    })
  } catch (error) {
    toast.error('Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo.');
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-brand-morado">Pedidos para Eventos y Ocasiones Especiales</h1>
      <p class="mt-4 text-lg text-gray-600">
        ¿Tienes una idea para una torta de boda, un catering para una fiesta o un pedido grande?
        Cuéntanos qué necesitas y te prepararemos una cotización a medida.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="mt-10 bg-white p-8 rounded-lg shadow-lg space-y-6">
      <h2 class="text-2xl font-bold text-gray-800 border-b pb-4">1. Tus Datos de Contacto</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
          <input id="nombre" v-model="form.nombre_completo" type="text" placeholder="Tu nombre y apellido" required
            class="w-full p-3 border rounded-md">
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
          <input id="email" v-model="form.email" type="email" placeholder="tucorreo@ejemplo.com" required
            class="w-full p-3 border rounded-md">
        </div>
      </div>

      <div>
        <label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono *</label>
        <input id="telefono" v-model="form.telefono" type="tel" placeholder="Ej: 0414-1234567" required
          class="w-full p-3 border rounded-md">
      </div>

      <h2 class="text-2xl font-bold text-gray-800 border-b pb-4 pt-6">2. Detalles de tu Pedido</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="fecha_evento" class="block text-sm font-medium text-gray-700 mb-1">Fecha del Evento
            (Opcional)</label>
          <input id="fecha_evento" v-model="form.fecha_evento" type="date" title="Fecha del Evento"
            class="w-full p-3 border rounded-md">
        </div>
        <div>
          <label for="cantidad_personas" class="block text-sm font-medium text-gray-700 mb-1">Nº de Personas
            (Opcional)</label>
          <input id="cantidad_personas" v-model.number="form.cantidad_personas" type="number" placeholder="Ej: 50"
            class="w-full p-3 border rounded-md">
        </div>
      </div>

      <div>
        <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción de tu Pedido *</label>
        <textarea id="descripcion" v-model="form.descripcion_pedido" rows="6"
          placeholder="Cuéntanos con el mayor detalle posible qué te gustaría: tipo de producto, sabores, temática, colores, etc."
          required class="w-full p-3 border rounded-md"></textarea>
      </div>

      <div class="text-center pt-6">
        <CustomButton type="submit" :disabled="loading">
          {{ loading ? 'Enviando Solicitud...' : 'Enviar Solicitud de Cotización' }}
        </CustomButton>
      </div>
    </form>
  </div>
</template>
