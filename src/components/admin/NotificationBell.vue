<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router' // <-- 1. Importar useRouter
import { supabase } from '@/supabase'
import * as notificationService from '@/services/notificationService'
import { BellIcon } from '@heroicons/vue/24/outline'
import { formatDistanceToNow } from 'date-fns'
import es from 'date-fns/locale/es'

const router = useRouter() // <-- 2. Instanciar router
const notificaciones = ref([])
const hayNuevas = ref(false)
const panelAbierto = ref(false)

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

const handleNuevaNotificacion = (payload) => {
  const nuevaNotificacion = payload.new
  notificaciones.value.unshift(nuevaNotificacion)
  hayNuevas.value = true
}

function irAlPedido(notif) {
  panelAbierto.value = false

  if (notif.pedido_id) {
    router.push({
      name: 'Pedidos',
      query: { abrir: notif.pedido_id } // Enviamos el ID en la URL
    })
  } else {
    // Fallback si no hay ID, solo vamos a la lista
    router.push({ name: 'Pedidos' })
  }
}

let subscription = null

onMounted(() => {
  fetchInitialNotifications()
  subscription = supabase
    .channel('notificaciones')
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

async function abrirPanel() {
  panelAbierto.value = !panelAbierto.value
  if (panelAbierto.value && hayNuevas.value) {
    hayNuevas.value = false
    try {
      await notificationService.markNotificationsAsRead()
    } catch (error) {
      hayNuevas.value = true
      console.error('No se pudieron marcar las notificaciones como leídas.')
    }
  }
}
</script>

<template>
  <div class="relative">
    <button @click="abrirPanel" class="relative outline-none">
      <BellIcon class="h-6 w-6 text-gray-600 hover:text-brand-morado transition-colors" />
      <span v-if="hayNuevas"
        class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
    </button>

    <Transition name="fade">
      <div v-if="panelAbierto"
        class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
        <div class="p-3 font-bold border-b bg-gray-50 text-gray-700">Notificaciones</div>

        <ul v-if="notificaciones.length > 0" class="max-h-96 overflow-y-auto">
          <li v-for="notif in notificaciones" :key="notif.id" @click="irAlPedido(notif)"
            class="p-3 border-b hover:bg-pink-50 cursor-pointer transition-colors group">

            <div class="flex justify-between items-start">
              <p class="font-semibold text-sm text-gray-800 group-hover:text-brand-morado">
                {{ notif.mensaje }}
              </p>
              <span v-if="notif.pedido_id" class="text-xs text-brand-fucsia">Ver &rarr;</span>
            </div>

            <p class="text-xs text-gray-500 mt-1">
              hace {{ formatDistanceToNow(new Date(notif.created_at), { locale: es }) }}
            </p>
          </li>
        </ul>

        <div v-else class="p-8 text-center text-sm text-gray-500">
          No hay notificaciones nuevas.
        </div>
      </div>
    </Transition>
  </div>
</template>
