<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { getOrdersByUserId, getOrderDetails } from '@/services/orderService' // Importamos getOrderDetails
import { supabase } from '@/supabase'
import { useToast } from 'vue-toastification'
import {
  UserCircleIcon,
  ShoppingBagIcon,
  XMarkIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import CustomButton from '@/components/shared/CustomButton.vue'

const userStore = useUserStore()
const toast = useToast()
const orders = ref([])
const loadingOrders = ref(true)

// Estado del formulario de perfil
const isEditing = ref(false)
const profileForm = ref({
  fullName: '',
  phone: ''
})
const savingProfile = ref(false)

// --- ESTADO DEL MODAL DE DETALLE ---
const showDetailModal = ref(false)
const selectedOrder = ref(null)
const loadingDetails = ref(false)

// Cargar datos
onMounted(async () => {
  if (userStore.user) {
    profileForm.value.fullName = userStore.userFullName || ''
    profileForm.value.phone = userStore.userPhone || ''

    try {
      orders.value = await getOrdersByUserId(userStore.user.id)
    } catch (error) {
      console.error(error)
    } finally {
      loadingOrders.value = false
    }
  }
})

// --- LÓGICA DEL BOTÓN GUARDAR (CORREGIDA) ---
const updateProfile = async () => {
  console.log("Intentando actualizar perfil..."); // Debería salir ahora

  // 1. Validaciones
  if (!profileForm.value.fullName.trim()) {
    return toast.warning('El nombre no puede estar vacío')
  }

  // Regex simple
  const cleanPhone = profileForm.value.phone.replace(/\D/g, '')
  if (cleanPhone.length < 10) {
    return toast.warning('Ingresa un número de teléfono válido (mínimo 10 dígitos)')
  }

  savingProfile.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profileForm.value.fullName,
        phone: profileForm.value.phone
      }
    })

    if (error) throw error

    await userStore.fetchUser()

    toast.success('Perfil actualizado correctamente')
    isEditing.value = false

  } catch (error) {
    console.error(error)
    toast.error('Error al actualizar el perfil')
  } finally {
    savingProfile.value = false
  }
}

const cancelEdit = () => {
  profileForm.value.fullName = userStore.userFullName || ''
  profileForm.value.phone = userStore.userPhone || ''
  isEditing.value = false
}

// --- LÓGICA DEL MODAL DE DETALLE ---
const openOrderModal = async (orderId) => {
  showDetailModal.value = true
  loadingDetails.value = true
  selectedOrder.value = null

  try {
    // Reutilizamos el servicio que ya tienes para traer detalles completos (productos, variantes, pago)
    const details = await getOrderDetails(orderId)
    selectedOrder.value = details
  } catch (error) {
    console.error(error)
    toast.error("No se pudieron cargar los detalles del pedido.")
    showDetailModal.value = false
  } finally {
    loadingDetails.value = false
  }
}

const closeOrderModal = () => {
  showDetailModal.value = false
  selectedOrder.value = null
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 relative">

    <div class="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserCircleIcon class="h-8 w-8 text-brand-fucsia" /> Mi Perfil
        </h2>
        <button
          v-if="!isEditing"
          @click="isEditing = true"
          class="text-sm text-brand-morado font-semibold hover:underline"
        >
          Editar Datos
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <div v-if="!isEditing" class="space-y-4 text-gray-600">
          <div>
            <p class="text-xs uppercase font-bold text-gray-400 tracking-wider">Nombre</p>
            <p class="text-lg font-medium text-gray-800">{{ userStore.userFullName || 'Sin nombre' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase font-bold text-gray-400 tracking-wider">Correo</p>
            <p class="text-lg font-medium text-gray-800">{{ userStore.userEmail }}</p>
          </div>
          <div>
            <p class="text-xs uppercase font-bold text-gray-400 tracking-wider">Teléfono</p>
            <p class="text-lg font-medium text-gray-800">{{ userStore.userPhone || 'No registrado' }}</p>
          </div>
        </div>

        <form v-else class="col-span-1 md:col-span-2 space-y-4 animate-fadeIn" @submit.prevent>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                v-model="profileForm.fullName"
                type="text"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-fucsia outline-none"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                v-model="profileForm.phone"
                type="tel"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-fucsia outline-none"
              >
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button
              type="button"
              @click="cancelEdit"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <CustomButton @click="updateProfile" :disabled="savingProfile">
              {{ savingProfile ? 'Guardando...' : 'Guardar Cambios' }}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>

    <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
      <ShoppingBagIcon class="h-8 w-8 text-brand-fucsia" /> Mis Pedidos
    </h2>

    <div v-if="loadingOrders" class="text-center py-10">
      <div class="animate-spin h-8 w-8 border-4 border-brand-fucsia border-t-transparent rounded-full mx-auto"></div>
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <p class="text-gray-500 mb-4">Aún no has realizado pedidos.</p>
      <RouterLink to="/" class="text-brand-fucsia font-bold hover:underline">¡Ir al catálogo!</RouterLink>
    </div>

    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id"
        class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <div class="flex items-center gap-3">
            <span class="font-bold text-lg text-brand-morado">#{{ order.id }}</span>
            <span class="text-sm text-gray-500">{{ new Date(order.created_at).toLocaleDateString() }}</span>
          </div>
          <p class="text-sm text-gray-600 mt-1">
            Total: <span class="font-semibold text-gray-900">${{ Number(order.total).toFixed(2) }}</span>
          </p>
        </div>

        <div class="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
          <span
            class="px-3 py-1 rounded-full text-xs font-bold uppercase w-fit"
            :class="{
              'bg-yellow-100 text-yellow-800': order.estado === 'pendiente',
              'bg-blue-100 text-blue-800': order.estado === 'verificando_pago',
              'bg-green-100 text-green-800': order.estado === 'pagado' || order.estado === 'entregado',
              'bg-red-100 text-red-800': order.estado === 'cancelado'
            }"
          >
            {{ order.estado.replace('_', ' ') }}
          </span>
          <button
            @click="openOrderModal(order.id)"
            class="text-sm text-brand-fucsia hover:text-brand-morado font-medium flex items-center gap-1"
          >
            Ver Detalle &rarr;
          </button>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="closeOrderModal">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scaleIn">

          <button @click="closeOrderModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XMarkIcon class="h-6 w-6" />
          </button>

          <div v-if="loadingDetails" class="p-12 text-center">
            <div class="animate-spin h-8 w-8 border-4 border-brand-fucsia border-t-transparent rounded-full mx-auto mb-2"></div>
            <p class="text-gray-500 text-sm">Cargando recibo...</p>
          </div>

          <div v-else-if="selectedOrder" class="p-6">
            <div class="border-b pb-4 mb-4">
              <h3 class="text-xl font-bold text-brand-morado">Detalle del Pedido #{{ selectedOrder.id }}</h3>
              <p class="text-sm text-gray-500">{{ new Date(selectedOrder.created_at).toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <p class="font-bold text-gray-700 mb-1">Método de Entrega</p>

                   <div v-if="selectedOrder.es_agendado" class="text-blue-700">
                      <p class="flex items-center gap-1 font-semibold"><CalendarDaysIcon class="h-4 w-4"/> Agendado</p>
                      <p>Fecha: {{ selectedOrder.fecha_agendada }}</p>
                      <p>Hora: {{ selectedOrder.hora_agendada }}</p>
                      <p class="capitalize text-gray-600 mt-1">Modo: {{ selectedOrder.metodo_entrega }}</p>
                   </div>
                   <div v-else>
                      <p class="flex items-center gap-1 capitalize"><ClockIcon class="h-4 w-4"/> Inmediato ({{ selectedOrder.metodo_entrega }})</p>
                   </div>
                </div>

                <div v-if="selectedOrder.direccion_envio">
                  <p class="font-bold text-gray-700 mb-1">Dirección / Notas</p>
                  <p class="flex items-start gap-1 text-gray-600">
                    <MapPinIcon class="h-4 w-4 shrink-0 mt-0.5"/>
                    {{ selectedOrder.direccion_envio }}
                  </p>
                </div>
              </div>
            </div>

            <table class="w-full text-sm mb-6">
              <thead class="bg-gray-100 text-gray-600">
                <tr>
                  <th class="p-2 text-left rounded-l-md">Producto</th>
                  <th class="p-2 text-right">Cant.</th>
                  <th class="p-2 text-right rounded-r-md">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedOrder.detalles_pedido" :key="item.id" class="border-b last:border-0">
                  <td class="p-3">
                    <p class="font-medium text-gray-800">{{ item.productos?.nombre }}</p>
                    <p v-if="item.variantes_elegidas" class="text-xs text-gray-500">
                       {{ Object.values(item.variantes_elegidas).flat().join(', ') }}
                    </p>
                  </td>
                  <td class="p-3 text-right text-gray-600">x{{ item.cantidad }}</td>
                  <td class="p-3 text-right font-semibold">${{ (item.cantidad * item.precio_unitario).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="flex flex-col items-end text-sm space-y-1 border-t pt-4">
              <div v-if="selectedOrder.costo_envio > 0" class="flex justify-between w-40 text-gray-600">
                <span>Envío:</span>
                <span>${{ Number(selectedOrder.costo_envio).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between w-40 text-xl font-bold text-brand-morado">
                <span>Total:</span>
                <span>${{ Number(selectedOrder.total).toFixed(2) }}</span>
              </div>
              <p v-if="selectedOrder.total_bs" class="text-xs text-gray-500">
                (Ref. Bs {{ Number(selectedOrder.total_bs).toLocaleString('es-VE', {minimumFractionDigits: 2}) }})
              </p>
            </div>

          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Transiciones de Vue para el Modal */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
