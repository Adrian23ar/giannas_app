// src/services/cartService.js
import { supabase } from '@/supabase'

/**
 * Obtiene el carrito de un usuario desde la base de datos.
 */
export const fetchCart = async (userId) => {
  const { data, error } = await supabase
    .from('carritos')
    .select('cantidad, variantes, productos(*)') // <-- Añadimos 'variantes'
    .eq('user_id', userId)

  if (error) throw error

  // Mapeamos los datos para mezclar la info del producto con la cantidad y variantes del carrito
  return data.map(item => ({
    ...item.productos,
    quantity: item.cantidad,
    variants: item.variantes || {} // <-- Mapeamos a 'variants' para usar en el store
  }))
}

/**
 * Añade o actualiza un producto en el carrito de la base de datos.
 * Ahora considera las variantes para diferenciar items.
 */
export const upsertCartItem = async (userId, productId, quantity, variants = {}) => {
  const { data, error } = await supabase
    .from('carritos')
    .upsert({
      user_id: userId,
      producto_id: productId,
      cantidad: quantity,
      variantes: variants // <-- Guardamos las variantes
    }, { onConflict: 'user_id, producto_id, variantes' }) // <-- Clave compuesta actualizada

  if (error) throw error
  return data
}

/**
 * Elimina un item específico del carrito.
 * Ahora debe buscar también por variantes para no borrar el incorrecto.
 */
export const removeCartItem = async (userId, productId, variants = {}) => {
  // Convertimos a JSON string para asegurar coincidencia exacta en la consulta si es necesario,
  // pero Supabase maneja JSONB directamente.

  // Nota: Comparar objetos JSON en SQL puede ser delicado.
  // Una estrategia segura es borrar por ID de fila si lo tuviéramos,
  // pero mantendremos la lógica de coincidencia por columnas.
  const { error } = await supabase
    .from('carritos')
    .delete()
    .eq('user_id', userId)
    .eq('producto_id', productId)
    .contains('variantes', variants) // 'contains' suele funcionar bien para igualdad JSON simple

  if (error) throw error
}

export const clearUserCart = async (userId) => {
  const { error } = await supabase
    .from('carritos')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}
