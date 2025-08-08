<script setup>
// src/views/AdminPaymentsView.vue
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { paymentMethodService } from '@/services/paymentMethodService';
import CustomButton from '@/components/CustomButton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { ChevronDownIcon, PlusIcon, XCircleIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline';

const toast = useToast();
const paymentMethods = ref([]);
const isEditing = ref(false);
const formAbierto = ref(false);
const cargando = ref(true);

const initialForm = {
  id: null,
  nombre: '',
  tipo: '',
  disponibilidad: 'todos',
  activo: true
};
const initialDetailsForm = {};

const form = ref({ ...initialForm });
const detailsForm = ref({ ...initialDetailsForm });

const showConfirmModal = ref(false);
const methodToDelete = ref(null);

// Carga los métodos al iniciar
onMounted(fetchPaymentMethods);

// Observa el cambio de "tipo" para limpiar los campos de detalles
watch(() => form.value.tipo, () => {
  detailsForm.value = { ...initialDetailsForm };
});

async function fetchPaymentMethods() {
  cargando.value = true;
  try {
    paymentMethods.value = await paymentMethodService.getAll();
  } catch (error) {
    toast.error('Error al cargar los métodos de pago.');
  } finally {
    cargando.value = false;
  }
}

function resetForm() {
  isEditing.value = false;
  form.value = { ...initialForm };
  detailsForm.value = { ...initialDetailsForm };
  formAbierto.value = false;
}

async function handleSubmit() {
  try {
    // Construimos el objeto de detalles a partir del formulario dinámico
    const payload = { ...form.value, detalles: { ...detailsForm.value } };

    if (isEditing.value) {
      await paymentMethodService.update(payload.id, payload);
      toast.success('Método de pago actualizado.');
    } else {
      await paymentMethodService.create(payload);
      toast.success('Método de pago creado.');
    }

    resetForm();
    await fetchPaymentMethods();

  } catch (error) {
    toast.error(`Error: ${error.message}`);
  }
}

function editMethod(method) {
  isEditing.value = true;
  form.value = {
    id: method.id,
    nombre: method.nombre,
    tipo: method.tipo,
    disponibilidad: method.disponibilidad,
    activo: method.activo
  };
  detailsForm.value = { ...(method.detalles || {}) };
  formAbierto.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  resetForm();
}

function promptDelete(method) {
  methodToDelete.value = method;
  showConfirmModal.value = true;
}

async function deleteMethod() {
  try {
    await paymentMethodService.remove(methodToDelete.value.id);
    toast.success('Método de pago eliminado.');
    await fetchPaymentMethods();
  } catch (error) {
    toast.error(`Error al eliminar: ${error.message}`);
  } finally {
    showConfirmModal.value = false;
    methodToDelete.value = null;
  }
}

async function toggleActive(method) {
  try {
    const updates = { activo: !method.activo };
    await paymentMethodService.update(method.id, updates);
    method.activo = !method.activo;
    toast.success(`Estado de "${method.nombre}" actualizado.`);
  } catch (error) {
    toast.error('Error al cambiar el estado.');
    method.activo = !method.activo;
  }
}

// Función para mostrar un resumen de los detalles en la tabla
function getDetailsSummary(method) {
  if (!method.detalles) return '';
  switch (method.tipo) {
    case 'pago-movil':
      return `${method.detalles.banco || ''} - ${method.detalles.telefono || ''}`;
    case 'transferencia':
      return `${method.detalles.banco || ''} - Cuenta: ...${(method.detalles.cuenta || '').slice(-4)}`;
    case 'wallet':
      return `${method.detalles.correo || ''}`;
    default:
      return '';
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-800">Gestión de Métodos de Pago</h2>
    <p class="text-sm text-gray-500 mb-6">Añade, edita y gestiona los métodos de pago disponibles para tus clientes.</p>

    <div class="mb-8 bg-white rounded-lg shadow-md">
      <button @click="formAbierto = !formAbierto"
        class="w-full flex justify-between items-center p-4 font-bold text-lg text-white bg-brand-fucsia rounded-t-lg">
        <span>{{ isEditing ? 'Editando Método de Pago' : '+ Añadir Nuevo Método' }}</span>
        <ChevronDownIcon class="h-6 w-6 transition-transform" :class="formAbierto && 'rotate-180'" />
      </button>

      <Transition name="slide-fade">
        <form v-if="formAbierto" @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Nombre del Método</span>
              <input type="text" v-model="form.nombre" required placeholder="Ej: Pago Móvil BDV"
                class="mt-1 block w-full input-style">
            </label>
            <label class="block">
              <span class="text-gray-700 font-medium text-sm">Tipo</span>
              <select v-model="form.tipo" required class="mt-1 block w-full input-style">
                <option disabled value="">Selecciona un tipo</option>
                <option value="pago-movil">Pago Móvil</option>
                <option value="transferencia">Transferencia Nacional</option>
                <option value="wallet">Wallet / Internacional</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </label>
          </div>

          <div v-if="form.tipo === 'pago-movil'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input v-model="detailsForm.banco" placeholder="Banco" class="input-style">
            <input v-model="detailsForm.telefono" placeholder="Teléfono" class="input-style">
            <input v-model="detailsForm.ci" placeholder="Cédula" class="input-style">
          </div>

          <div v-if="form.tipo === 'transferencia'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input v-model="detailsForm.banco" placeholder="Banco" class="input-style">
            <input v-model="detailsForm.cuenta" placeholder="Nro. de Cuenta" class="input-style">
            <input v-model="detailsForm.titular" placeholder="Titular" class="input-style md:col-span-2">
            <input v-model="detailsForm.ci" placeholder="Cédula/RIF" class="input-style">
          </div>

          <div v-if="form.tipo === 'wallet'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input v-model="detailsForm.correo" placeholder="Correo electrónico" class="input-style">
            <input v-model="detailsForm.extra" placeholder="Info extra (ej: comisión)" class="input-style">
          </div>

          <label class="block">
            <span class="text-gray-700 font-medium text-sm">Disponibilidad</span>
            <select v-model="form.disponibilidad" class="mt-1 block w-full input-style">
              <option value="todos">Todos los métodos de entrega</option>
              <option value="recogida">Solo para Recogida en tienda</option>
            </select>
          </label>

          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4 border-t">
            <CustomButton v-if="isEditing" @click="cancelEdit" variant="secondary" class="w-full sm:w-auto">
              <XCircleIcon class="h-5 w-5" /> Cancelar
            </CustomButton>
            <CustomButton type="submit" class="w-full sm:w-auto">
              <PlusIcon v-if="!isEditing" class="h-5 w-5" />
              <PencilSquareIcon v-else class="h-5 w-5" />
              {{ isEditing ? 'Actualizar' : 'Guardar' }}
            </CustomButton>
          </div>
        </form>
      </Transition>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h3 class="text-xl font-bold text-gray-700">Métodos de Pago Actuales</h3>
      <div v-if="cargando" class="space-y-4 mt-4">
        <SkeletonLoader v-for="n in 3" :key="n" class="h-16 w-full" />
      </div>
      <ul v-else-if="paymentMethods.length > 0" class="divide-y mt-4">
        <li v-for="method in paymentMethods" :key="method.id"
          class="py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <p class="font-bold">{{ method.nombre }} <span class="text-xs font-normal text-gray-500 capitalize">({{
              method.tipo.replace('-', ' ') }})</span></p>
            <p class="text-sm text-gray-600">{{ getDetailsSummary(method) }}</p>
          </div>
          <div class="flex items-center gap-4 self-end md:self-center">
            <label class="switch">
              <input type="checkbox" :checked="method.activo" @change="toggleActive(method)">
              <span class="slider round"></span>
            </label>
            <button @click="editMethod(method)"
              class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md">
              <PencilSquareIcon class="h-5 w-5" />
            </button>
            <button @click="promptDelete(method)"
              class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md">
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </li>
      </ul>
      <EmptyState v-else title="No hay métodos de pago"
        message="Añade tu primer método de pago para que aparezca aquí." />
    </div>

    <ConfirmModal :show="showConfirmModal" title="Confirmar Eliminación"
      :message="`¿Estás seguro de que quieres eliminar '${methodToDelete?.nombre}'?`" @confirm="deleteMethod"
      @cancel="showConfirmModal = false" />
  </div>
</template>

<style scoped>
/* Añadimos estilos para la transición del formulario */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.input-style {
  @apply mt-1 block w-full p-2 border border-gray-300 text-sm rounded-md shadow-sm focus:border-brand-fucsia focus:ring focus:ring-brand-fucsia focus:ring-opacity-50;
}

/* Estilos del switch (los mismos que tenías antes) */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked+.slider {
  background-color: #2196F3;
}

input:checked+.slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
