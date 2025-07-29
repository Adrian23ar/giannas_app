// src/services/orderService.js
import { supabase } from '../supabase'

/**
 * Obtiene todos los pedidos, ordenados por fecha de creación.
 */
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener los pedidos:', error.message)
    throw error
  }
  return data
}

/**
 * Obtiene los detalles completos de un único pedido, incluyendo
 * los productos ordenados y la información del pago.
 * @param {number} orderId - El ID del pedido a buscar.
 */
export const getOrderDetails = async (orderId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      detalles_pedido ( cantidad, precio_unitario, productos (nombre) ),
      pagos ( * )
    `)
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Error al obtener detalles del pedido:', error.message)
    throw error
  }
  return data
}

/**
 * Actualiza el estado de un pedido específico.
 * @param {number} orderId - El ID del pedido a actualizar.
 * @param {string} newStatus - El nuevo estado para el pedido.
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado: newStatus })
    .eq('id', orderId)
    .select()
    .single()

  if (error) {
    console.error('Error al actualizar el estado:', error.message)
    throw error
  }
  return data
}
