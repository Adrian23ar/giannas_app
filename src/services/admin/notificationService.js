// src/services/notificationService.js
import { supabase } from '@/supabase'
import { useUserStore } from '@/stores/userStore'

/**
 * Obtiene todas las notificaciones NO LEÍDAS para el usuario actual.
 * @returns {Promise<Array>} Una lista de notificaciones no leídas.
 */
export const getUnreadNotifications = async () => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) return []

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', userStore.user.id)
    .eq('leida', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener notificaciones no leídas:', error)
    throw error
  }
  return data
}

/**
 * Marca todas las notificaciones no leídas del usuario actual como LEÍDAS.
 */
export const markNotificationsAsRead = async () => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) return

  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('user_id', userStore.user.id)
    .eq('leida', false) // Solo actualizamos las que no están leídas

  if (error) {
    console.error('Error al marcar notificaciones como leídas:', error)
    throw error
  }
}
