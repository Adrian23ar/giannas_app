<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/supabase'
import { BellIcon } from '@heroicons/vue/24/outline'
import { formatDistanceToNow } from 'date-fns';
import es from 'date-fns/locale/es';

const notificaciones = ref([])
const hayNuevas = ref(false)
const panelAbierto = ref(false)

// Función para manejar la llegada de un nuevo pedido
const handleNuevoPedido = (payload) => {
  console.log('Nuevo pedido recibido:', payload.new);
  const nuevaNotificacion = {
    id: payload.new.id,
    mensaje: `Nuevo pedido de ${payload.new.nombre_cliente}`,
    fecha: payload.new.created_at,
    leida: false
  };
  // unshift() lo añade al principio de la lista
  notificaciones.value.unshift(nuevaNotificacion);
  hayNuevas.value = true;
};

let subscription = null;

onMounted(() => {
  // Nos suscribimos al canal de 'pedidos'
  subscription = supabase.channel('pedidos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, handleNuevoPedido)
    .subscribe();
});

// Es importante desuscribirse al destruir el componente para evitar fugas de memoria
onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
});

function abrirPanel() {
  panelAbierto.value = !panelAbierto.value;
  if (panelAbierto.value) {
    hayNuevas.value = false; // Marcamos como leídas al abrir
    notificaciones.value.forEach(n => n.leida = true);
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
              hace {{ formatDistanceToNow(new Date(notif.fecha), { locale: es }) }}
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
