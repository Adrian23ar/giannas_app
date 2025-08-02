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
 * Obtiene todos los pedidos realizados por un usuario específico.
 * @param {string} userId - El ID del usuario de Supabase.
 */
export const getOrdersByUserId = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener los pedidos del usuario:', error.message);
    throw error;
  }
  return data;
}

/**
 * Obtiene los detalles completos de un único pedido, incluyendo
 * los productos ordenados y la información del pago.
 * @param {number} orderId - El ID del pedido a buscar.
 */
// src/services/orderService.js

export const getOrderDetails = async (orderId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      detalles_pedido ( cantidad, precio_unitario, productos (nombre) ),
      pagos ( *, metodos_pago ( nombre, tipo ) )
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

// src/services/orderService.js

// src/services/orderService.js

/**
 * Obtiene los detalles de un pedido por su ID para la página de seguimiento.
 * @param {number} orderId - El ID del pedido a buscar.
 */
export const findOrderById = async (orderId) => {
  if (!orderId) throw new Error("Se requiere un ID de pedido.");

  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      created_at,
      estado,
      total,
      detalles_pedido ( cantidad, precio_unitario, productos (nombre) ),
      pagos ( nro_referencia, metodos_pago ( nombre ) )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`No se encontró ningún pedido con el ID #${orderId}.`);
    }
    throw error;
  }
  return data;
}
