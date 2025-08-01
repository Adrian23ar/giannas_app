// src/services/cartService.js
import { supabase } from '../supabase'

/**
 * Obtiene el carrito de un usuario desde la base de datos.
 */
export const fetchCart = async (userId) => {
  const { data, error } = await supabase
    .from('carritos')
    .select('cantidad, productos(*)') // Traemos la data del producto relacionado
    .eq('user_id', userId)

  if (error) throw error

  // Mapeamos los datos para que tengan el formato que usa nuestro store
  return data.map(item => ({
    ...item.productos,
    quantity: item.cantidad
  }))
}

/**
 * Añade o actualiza un producto en el carrito de la base de datos.
 */
export const upsertCartItem = async (userId, productId, quantity) => {
  // 'upsert' es una operación que inserta si no existe, o actualiza si ya existe.
  const { data, error } = await supabase
    .from('carritos')
    .upsert({
      user_id: userId,
      producto_id: productId,
      cantidad: quantity
    }, { onConflict: 'user_id, producto_id' }) // Le decimos qué columnas usar para detectar un conflicto

  if (error) throw error
  return data
}

/**
 * Elimina un item del carrito de la base de datos.
 */
export const removeCartItem = async (userId, productId) => {
  const { error } = await supabase
    .from('carritos')
    .delete()
    .eq('user_id', userId)
    .eq('producto_id', productId)

  if (error) throw error
}

/**
 * Vacía el carrito de un usuario en la base de datos.
 */
export const clearUserCart = async (userId) => {
  const { error } = await supabase
    .from('carritos')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}
