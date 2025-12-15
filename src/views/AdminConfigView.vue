<script setup>
import { ref, onMounted } from 'vue'
import { configService } from '@/services/configService'
import { useToast } from 'vue-toastification'
import CustomButton from '@/components/CustomButton.vue'
import { TrashIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/vue/24/outline'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)

// Estado local de la configuración
const configId = ref(null)
const horarios = ref({})
const fechasBloqueadas = ref([])

// Para agregar una nueva fecha bloqueada
const nuevaFechaBloqueada = ref('')

// Mapeo para ordenar los días visualmente (Lunes a Domingo)
// La BD usa: 0=Domingo, 1=Lunes, ..., 6=Sábado (Estándar JS)
const diasOrdenados = [1, 2, 3, 4, 5, 6, 0]

const nombreDias = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
}

onMounted(async () => {
  try {
    const data = await configService.getConfig()
    configId.value = data.id
    horarios.value = data.horarios
    fechasBloqueadas.value = data.fechas_bloqueadas || []
  } catch (error) {
    toast.error('Error al cargar la configuración')
    console.error(error)
  } finally {
    loading.value = false
  }
})

// Funciones de Fechas Bloqueadas
function agregarFecha() {
  if (!nuevaFechaBloqueada.value) return

  // Evitar duplicados
  if (fechasBloqueadas.value.includes(nuevaFechaBloqueada.value)) {
    toast.warning('Esa fecha ya está bloqueada')
    return
  }

  fechasBloqueadas.value.push(nuevaFechaBloqueada.value)
  // Ordenar cronológicamente
  fechasBloqueadas.value.sort()
  nuevaFechaBloqueada.value = ''
}

function eliminarFecha(index) {
  fechasBloqueadas.value.splice(index, 1)
}

// Guardar todo
async function guardarCambios() {
  saving.value = true
  try {
    await configService.updateConfig(configId.value, {
      horarios: horarios.value,
      fechas_bloqueadas: fechasBloqueadas.value
    })
    toast.success('¡Configuración guardada con éxito!')
  } catch (error) {
    toast.error('Error al guardar cambios')
    console.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">Configuración del Negocio</h1>
    <p class="text-gray-600 mb-8">Gestiona tus horarios de atención y días no laborables para los pedidos agendados.</p>

    <div v-if="loading" class="text-center py-10">
      <p>Cargando configuración...</p>
    </div>

    <div v-else class="space-y-8">

      <section class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div class="flex items-center gap-2 mb-6 border-b pb-2">
          <ClockIcon class="w-6 h-6 text-brand-morado" />
          <h2 class="text-xl font-bold text-gray-800">Horarios de Apertura</h2>
        </div>

        <div class="space-y-4">
          <div v-for="diaKey in diasOrdenados" :key="diaKey"
            class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 rounded-lg transition-colors"
            :class="horarios[diaKey]?.activo ? 'bg-gray-50' : 'bg-gray-100 opacity-75'">

            <div class="md:col-span-3 flex items-center gap-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="horarios[diaKey].activo" class="sr-only peer">
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-fucsia">
                </div>
              </label>
              <span class="font-bold text-gray-700 w-20">{{ nombreDias[diaKey] }}</span>
            </div>

            <div class="md:col-span-9 flex flex-wrap items-center gap-4">
              <div v-if="horarios[diaKey].activo" class="flex items-center gap-2">
                <span class="text-sm text-gray-500">Abre:</span>
                <input type="time" v-model="horarios[diaKey].inicio"
                  class="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-brand-fucsia">

                <span class="text-sm text-gray-500 ml-2">Cierra:</span>
                <input type="time" v-model="horarios[diaKey].fin"
                  class="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-brand-fucsia">
              </div>
              <span v-else class="text-sm font-medium text-red-400 italic">
                Cerrado
              </span>
            </div>

          </div>
        </div>
      </section>

      <section class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div class="flex items-center gap-2 mb-6 border-b pb-2">
          <CalendarDaysIcon class="w-6 h-6 text-brand-morado" />
          <h2 class="text-xl font-bold text-gray-800">Días Feriados / No Laborables</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bloquear una fecha específica</label>
            <div class="flex gap-2">
              <input type="date" v-model="nuevaFechaBloqueada"
                class="flex-grow border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-fucsia outline-none">
              <button @click="agregarFecha" type="button"
                class="bg-brand-morado text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-bold">
                Bloquear
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Los clientes no podrán seleccionar estas fechas en el calendario de "Agendar".
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h3 class="font-bold text-gray-700 mb-3 text-sm">Fechas bloqueadas actualmente:</h3>

            <div v-if="fechasBloqueadas.length === 0" class="text-sm text-gray-400 italic">
              No hay fechas bloqueadas.
            </div>

            <ul class="space-y-2">
              <li v-for="(fecha, index) in fechasBloqueadas" :key="index"
                class="flex justify-between items-center bg-white p-2 rounded shadow-sm border">
                <span class="text-gray-800 font-mono">
                  {{ new Date(fecha + 'T00:00:00').toLocaleDateString('es-VE', {
                    weekday: 'short', year: 'numeric',
                    month: 'short', day: 'numeric' }) }}
                </span>
                <button @click="eliminarFecha(index)" class="text-red-400 hover:text-red-600 p-1">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div class="flex justify-end pt-4">
        <CustomButton @click="guardarCambios" :disabled="saving" class="w-full md:w-auto px-8 py-3 text-lg">
          {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
        </CustomButton>
      </div>

    </div>
  </div>
</template>
