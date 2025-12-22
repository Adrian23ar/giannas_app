<script setup>
// src/views/AdminCuponesView.vue
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { getCoupons, createCoupon, deleteCoupon, updateCouponStatus, updateCoupon } from '@/services/couponService'
import { formatDisplayDate } from '@/utils/formatters.js'
import CustomButton from '@/components/shared/CustomButton.vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import EditCouponModal from '@/components/admin/EditCouponModal.vue' // <-- Nuevo
import { PlusIcon, TrashIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import SkeletonLoader from '@/components/shared/SkeletonLoader.vue'

const toast = useToast()
const cupones = ref([])
const cargando = ref(false)
const formAbierto = ref(false)


const nuevoCupon = ref({
  codigo: '',
  tipo: 'porcentaje',
  valor: 0,
  activo: true,
  usos_maximos: null,
  fecha_expiracion: null,
})

// Lógica para el modal de confirmación
const showConfirmModal = ref(false)
const couponToDelete = ref(null)
const showEditModal = ref(false)
const couponToEdit = ref(null)

async function obtenerCupones() {
  cargando.value = true
  try {
    cupones.value = await getCoupons()
  } catch (error) {
    toast.error('No se pudieron cargar los cupones.')
  } finally {
    cargando.value = false
  }
}

async function agregarCupon() {
  const dataToSend = {
    ...nuevoCupon.value,
    usos_maximos: nuevoCupon.value.usos_maximos || null,
    fecha_expiracion: nuevoCupon.value.fecha_expiracion || null,
  }
  try {
    const cuponCreado = await createCoupon(dataToSend)
    cupones.value.unshift(cuponCreado)
    toast.success('Cupón creado con éxito.')
    // Resetear formulario
    nuevoCupon.value = { codigo: '', tipo: 'porcentaje', valor: 0, activo: true, usos_maximos: null, fecha_expiracion: null }
    formAbierto.value = false
  } catch (error) {
    toast.error('Error al crear el cupón.')
  }
}

function promptEliminarCupon(cupon) {
  couponToDelete.value = cupon
  showConfirmModal.value = true
}

async function handleEliminarCupon() {
  if (!couponToDelete.value) return
  try {
    await deleteCoupon(couponToDelete.value.id)
    cupones.value = cupones.value.filter(c => c.id !== couponToDelete.value.id)
    toast.success('Cupón eliminado.')
  } catch (error) {
    toast.error('Error al eliminar el cupón.')
  } finally {
    showConfirmModal.value = false
    couponToDelete.value = null
  }
}

async function toggleActivo(cupon) {
  try {
    const cuponActualizado = await updateCouponStatus(cupon.id, !cupon.activo)
    const index = cupones.value.findIndex(c => c.id === cupon.id)
    if (index !== -1) {
      cupones.value[index] = cuponActualizado
    }
    toast.success(`Cupón ${cuponActualizado.activo ? 'activado' : 'desactivado'}.`)
  } catch (error) {
    toast.error('Error al cambiar el estado del cupón.')
  }
}

// Lógica para el modal de edición
function promptEditarCupon(cupon) {
  couponToEdit.value = cupon
  showEditModal.value = true
}

async function handleUpdateCoupon(couponData) {
  try {
    const cuponActualizado = await updateCoupon(couponToEdit.value.id, couponData)
    const index = cupones.value.findIndex(c => c.id === couponToEdit.value.id)
    if (index !== -1) {
      cupones.value[index] = cuponActualizado
    }
    toast.success('Cupón actualizado.')
  } catch (error) {
    console.log(error);
    toast.error('Error al actualizar el cupón.')
  } finally {
    showEditModal.value = false
    couponToEdit.value = null
  }
}

onMounted(obtenerCupones)
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800">Gestión de Cupones</h1>
    <p class="text-sm text-gray-500 mb-6">Crea y administra los descuentos para tu tienda.</p>

    <div class="mb-8">
      <CustomButton @click="formAbierto = !formAbierto">
        <PlusIcon class="h-5 w-5" />
        {{ formAbierto ? 'Cerrar Formulario' : 'Crear Nuevo Cupón' }}
      </CustomButton>
    </div>

    <div>
      <Transition name="slide-fade">
        <form v-if="formAbierto" @submit.prevent="agregarCupon"
          class="mb-8 bg-white p-6 rounded-lg shadow-md space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Código del Cupón</span>
              <input v-model="nuevoCupon.codigo" type="text" placeholder="Ej: VERANO10" required
                class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>

            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Tipo de Descuento</span>
              <select v-model="nuevoCupon.tipo" class="mt-1 block w-full p-2 border rounded-md shadow-sm">
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </label>

            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Valor</span>
              <input v-model="nuevoCupon.valor" type="number" step="0.01" placeholder="Ej: 15 o 5" required
                class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Usos Máximos (opcional)</span>
              <input v-model="nuevoCupon.usos_maximos" type="number" placeholder="Sin límite"
                class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>

            <label class="block">
              <span class="text-gray-700 text-sm font-medium">Fecha de Expiración (opcional)</span>
              <input v-model="nuevoCupon.fecha_expiracion" type="date"
                class="mt-1 block w-full p-2 border rounded-md shadow-sm">
            </label>
          </div>

          <div class="pt-2 text-right">
            <CustomButton type="submit">Guardar Cupón</CustomButton>
          </div>
        </form>
      </Transition>
      <div v-if="cargando" v-for="n in 3" :key="n" class="bg-white rounded-lg shadow-md mb-4">
        <div class="space-y-7 flex flex-col p-4">
          <SkeletonLoader class="h-16 w-full" />
        </div>
      </div>
      <div v-else class="bg-white rounded-lg shadow-md">
        <ul class="divide-y">
          <li v-for="cupon in cupones" :key="cupon.id"
            class="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <p class="font-bold text-lg" :class="!cupon.activo && 'text-gray-400 line-through'">{{ cupon.codigo }}</p>
              <p class="text-sm text-gray-600">Descuento de {{ cupon.valor }}{{ cupon.tipo === 'porcentaje' ? '%' : '$'
              }}</p>
              <div class="text-xs text-gray-500 mt-2 space-x-4">
                <span>Usos: {{ cupon.usos_actuales }} / {{ cupon.usos_maximos || '∞' }}</span>
                <span v-if="cupon.fecha_expiracion">Expira: {{ formatDisplayDate(cupon.fecha_expiracion) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end md:self-center">
              <label class="flex items-center cursor-pointer">
                <label class="mr-3 text-gray-700">Estado</label>
                <div class="relative">
                  <input type="checkbox" :checked="cupon.activo" @change="toggleActivo(cupon)" class="sr-only peer">
                  <div
                    class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-fucsia">
                  </div>
                </div>
              </label>
              <button @click="promptEditarCupon(cupon)"
                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-all">
                <PencilSquareIcon class="h-5 w-5" />
              </button>
              <button @click="promptEliminarCupon(cupon)"
                class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-all">
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <ConfirmModal :show="showConfirmModal" title="Confirmar Eliminación"
      message="¿Estás seguro de que quieres eliminar este cupón?" @confirm="handleEliminarCupon"
      @cancel="showConfirmModal = false" />
    <EditCouponModal :show="showEditModal" :coupon="couponToEdit" @close="showEditModal = false"
      @save="handleUpdateCoupon" />
  </div>
</template>

<style scoped>
/* Estilos para el toggle de Activo/Inactivo */
input:checked~.dot {
  transform: translateX(100%);
  background-color: #CC146C;
  /* fucsia */
}

input:checked~.block {
  background-color: #fce4ec;
  /* rosa claro */
}

.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
