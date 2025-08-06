// src/services/specialOrderService.js
import { supabase } from '@/supabase'

/**
 * Guarda una nueva solicitud de pedido especial en la base de datos.
 * @param {object} orderData - Un objeto con los datos del formulario de solicitud.
 * @returns {Promise<object>} La solicitud creada.
 */
export async function createSpecialOrder(orderData) {
  const { data, error } = await supabase
    .from('solicitudes_especiales')
    .insert(orderData)
    .select()
    .single() // Devuelve el objeto recién creado

  if (error) {
    console.error('Error al crear la solicitud especial:', error.message)
    throw error
  }

  return data
}

/**
 * Obtiene todas las solicitudes de pedidos especiales para el panel de administración.
 * Las ordena por fecha de creación, mostrando las más recientes primero.
 * @returns {Promise<Array>} Una lista de todas las solicitudes.
 */
export async function getSpecialOrders() {
  const { data, error } = await supabase
    .from('solicitudes_especiales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener las solicitudes especiales:', error.message)
    throw error
  }

  return data
}

/**
 * Actualiza una solicitud de pedido especial existente.
 * Utilizado por el admin para cambiar el estado o añadir el precio final.
 * @param {number} id - El ID de la solicitud a actualizar.
 * @param {object} updates - Un objeto con los campos a actualizar (ej. { estado: 'confirmado', presupuesto_final: 150 }).
 * @returns {Promise<object>} La solicitud actualizada.
 */
export async function updateSpecialOrder(id, updates) {
  const { data, error } = await supabase
    .from('solicitudes_especiales')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error al actualizar la solicitud especial:', error.message)
    throw error
  }

  return data
}

// Nota: No necesitamos una función de borrado por ahora, ya que es mejor
// cambiar el estado a 'cancelado' para mantener un historial.

/**
 * Obtiene todas las solicitudes especiales realizadas por un usuario específico.
 * @param {string} userId - El ID del usuario de Supabase.
 */
export async function getSpecialOrdersByUserId(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('solicitudes_especiales')
    .select('id, created_at, estado, descripcion_pedido, presupuesto_final')
    .eq('cliente_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener las solicitudes especiales del usuario:', error.message);
    throw error;
  }
  return data;
}

/**
 * Busca una única solicitud especial por su ID.
 * @param {number} orderId - El ID de la solicitud.
 */
export async function findSpecialOrderById(orderId) {
  if (!orderId) throw new Error("Se requiere un ID de solicitud.");

  const { data, error } = await supabase
    .from('solicitudes_especiales')
    .select('id, created_at, estado, nombre_completo, descripcion_pedido')
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`No se encontró ninguna solicitud especial con el ID #SO-${String(orderId).padStart(5, '0')}.`);
    }
    throw error;
  }

  return { ...data, type: 'special' };
}
