<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/supabase'
import * as notificationService from '@/services/notificationService' // <-- 2. Importar el nuevo servicio
import { BellIcon } from '@heroicons/vue/24/outline'
import { formatDistanceToNow } from 'date-fns'
import es from 'date-fns/locale/es'

const notificaciones = ref([])
const hayNuevas = ref(false)
const panelAbierto = ref(false)

// --- 3. NUEVA FUNCIÓN PARA CARGAR NOTIFICACIONES INICIALES ---
async function fetchInitialNotifications() {
  try {
    const unreadNotifications = await notificationService.getUnreadNotifications()
    notificaciones.value = unreadNotifications
    if (unreadNotifications.length > 0) {
      hayNuevas.value = true
    }
  } catch (error) {
    console.error('No se pudieron cargar las notificaciones iniciales.')
  }
}

// --- 4. FUNCIÓN EN TIEMPO REAL ACTUALIZADA ---
const handleNuevaNotificacion = (payload) => {
  // La notificación viene directamente desde la tabla 'notificaciones'
  const nuevaNotificacion = payload.new
  notificaciones.value.unshift(nuevaNotificacion)
  hayNuevas.value = true
}

let subscription = null

onMounted(() => {
  // Primero, cargamos las notificaciones que estaban pendientes
  fetchInitialNotifications()

  // --- 5. SUSCRIPCIÓN ACTUALIZADA A LA TABLA 'notificaciones' ---
  subscription = supabase
    .channel('notificaciones') // Escuchamos el nuevo canal
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notificaciones' },
      handleNuevaNotificacion
    )
    .subscribe()
})

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
})

// --- 6. FUNCIÓN PARA ABRIR EL PANEL ACTUALIZADA ---
async function abrirPanel() {
  panelAbierto.value = !panelAbierto.value
  // Si abrimos el panel y había nuevas notificaciones...
  if (panelAbierto.value && hayNuevas.value) {
    hayNuevas.value = false // Quitamos el punto rojo inmediatamente (UI optimista)
    try {
      // Llamamos al servicio para marcar todas como leídas en la base de datos
      await notificationService.markNotificationsAsRead()
    } catch (error) {
      // Si falla, volvemos a mostrar el punto rojo para que el usuario sepa
      hayNuevas.value = true
      console.error('No se pudieron marcar las notificaciones como leídas.')
    }
  }
}
</script>

<template>
  <div class="relative">
    <button @click="abrirPanel" class="relative">
      <BellIcon class="h-6 w-6 text-gray-600" />
      <span v-if="hayNuevas"
        class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
    </button>

    <Transition name="fade">
      <div v-if="panelAbierto" class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-30">
        <div class="p-3 font-bold border-b">Notificaciones</div>
        <ul v-if="notificaciones.length > 0" class="max-h-96 overflow-y-auto">
          <li v-for="notif in notificaciones" :key="notif.id" class="p-3 border-b hover:bg-slate-50">
            <p class="font-semibold">{{ notif.mensaje }}</p>
            <p class="text-xs text-gray-500">
              hace
              {{ formatDistanceToNow(new Date(notif.created_at), { locale: es }) }}
            </p>
          </li>
        </ul>
        <div v-else class="p-4 text-center text-sm text-gray-500">
          No hay notificaciones nuevas.
        </div>
      </div>
    </Transition>
  </div>
</template>
