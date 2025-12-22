<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
// Importamos la nueva función 'checkApiStatus'
import { getRatesForPeriod, upsertRate, checkApiStatus } from '@/services/config/exchangeRateService';
import CustomButton from '@/components/shared/CustomButton.vue';
import { formatDisplayDate } from '@/utils/formatters.js';
// Importamos un ícono para el nuevo botón
import { WifiIcon } from '@heroicons/vue/24/outline';

const toast = useToast();
const historicalRates = ref([]);
const isLoading = ref(true);

// --- INICIO MEJORA 1: Estado para el botón de guardar ---
const isSaving = ref(false);

// --- INICIO MEJORA 2: Estado para el botón de verificar API ---
const isCheckingApi = ref(false);

const manualRate = ref({
  date: new Date().toISOString().split('T')[0],
  rate: null,
});

async function fetchRates() {
  isLoading.value = true;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  try {
    historicalRates.value = await getRatesForPeriod(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  } catch (error) {
    toast.error('No se pudo cargar el historial de tasas.');
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchRates);

async function handleSaveRate() {
  if (!manualRate.value.date || !manualRate.value.rate) {
    return toast.error('Por favor, completa la fecha y la tasa.');
  }
  if (manualRate.value.rate <= 0) {
    return toast.error('La tasa debe ser un número positivo.');
  }

  // --- MEJORA 1: Activamos el estado de guardado ---
  isSaving.value = true;
  try {
    await upsertRate(manualRate.value.date, manualRate.value.rate);
    toast.success(`Tasa para el ${formatDisplayDate(manualRate.value.date)} guardada con éxito.`);
    await fetchRates(); // Actualizamos la lista
  } catch (error) {
    toast.error('Ocurrió un error al guardar la tasa.');
  } finally {
    // --- MEJORA 1: Desactivamos el estado de guardado ---
    isSaving.value = false;
  }
}

function editRate(rateEntry) {
  manualRate.value.date = rateEntry.fecha;
  manualRate.value.rate = rateEntry.tasa;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- INICIO MEJORA 2: Función para verificar la API ---
async function handleCheckApi() {
  isCheckingApi.value = true;
  const result = await checkApiStatus();
  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
  isCheckingApi.value = false;
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800">Configuración de Tasa de Cambio</h1>
    <p class="text-sm text-gray-500 mb-6">Gestiona manualmente la tasa de cambio para el cálculo en bolívares.</p>

    <div class="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">Gestión Manual de Tasa</h2>
      <form @submit.prevent="handleSaveRate" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <label class="block">
          <span class="text-gray-700 font-medium text-sm">Fecha</span>
          <input type="date" v-model="manualRate.date" required class="mt-1 block w-full p-2 border rounded-md">
        </label>
        <label class="block">
          <span class="text-gray-700 font-medium text-sm">Valor de la Tasa (Bs.)</span>
          <input type="number" step="0.01" v-model="manualRate.rate" required placeholder="Ej: 36.50"
            class="mt-1 block w-full p-2 border rounded-md">
        </label>
        <CustomButton type="submit" class="w-full md:w-auto" :disabled="isSaving">
          {{ isSaving ? 'Guardando...' : 'Guardar Tasa' }}
        </CustomButton>
      </form>
    </div>

    <div class="mb-8 bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-700">Estado del Sistema Automático</h2>
          <p class="text-sm text-gray-500 mt-1">Verifica si la API externa está proveyendo las tasas correctamente.</p>
        </div>
        <CustomButton @click="handleCheckApi" :disabled="isCheckingApi" variant="secondary">
          <WifiIcon class="h-5 w-5" />
          {{ isCheckingApi ? 'Verificando...' : 'Verificar API' }}
        </CustomButton>
      </div>
    </div>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">Historial de Tasas Recientes</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-600">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th class="px-6 py-3">Fecha</th>
              <th class="px-6 py-3">Tasa Registrada (Bs.)</th>
              <th class="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="3" class="text-center py-8">Cargando historial...</td>
            </tr>
            <tr v-else-if="historicalRates.length === 0">
              <td colspan="3" class="text-center py-8">No hay tasas registradas en los últimos 30 días.</td>
            </tr>
            <tr v-for="rate in historicalRates" :key="rate.fecha" class="bg-white border-b hover:bg-gray-50">
              <td class="px-6 py-4 font-medium">{{ formatDisplayDate(rate.fecha) }}</td>
              <td class="px-6 py-4">{{ rate.tasa }} Bs.</td>
              <td class="px-6 py-4">
                <button @click="editRate(rate)" class="font-medium text-brand-fucsia hover:underline">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
