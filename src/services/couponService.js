// src/services/couponService.js
import { supabase } from '../supabase'

/**
 * Obtiene todos los cupones.
 */
export const getCoupons = async () => {
  const { data, error } = await supabase
    .from('cupones')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Crea un nuevo cupón.
 * @param {object} couponData - Los datos del cupón desde el formulario.
 */
export const createCoupon = async (couponData) => {
  const { data, error } = await supabase
    .from('cupones')
    .insert(couponData)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Elimina un cupón.
 * @param {number} couponId - El ID del cupón a eliminar.
 */
export const deleteCoupon = async (couponId) => {
  const { error } = await supabase
    .from('cupones')
    .delete()
    .eq('id', couponId)
  if (error) throw error
}

/**
 * Actualiza el estado de un cupón (activo/inactivo).
 * @param {number} couponId - El ID del cupón.
 * @param {boolean} newStatus - El nuevo estado (true para activo).
 */
export const updateCouponStatus = async (couponId, newStatus) => {
  const { data, error } = await supabase
    .from('cupones')
    .update({ activo: newStatus })
    .eq('id', couponId)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Actualiza todos los datos de un cupón existente.
 * @param {number} couponId - El ID del cupón a editar.
 * @param {object} couponData - Los nuevos datos del cupón.
 */
export const updateCoupon = async (couponId, couponData) => {
  // Nos aseguramos de que los campos opcionales vacíos se guarden como null
  const dataToUpdate = {
    ...couponData,
    fecha_expiracion: couponData.fecha_expiracion || null,
    usos_maximos: couponData.usos_maximos || null,
  }

  const { data, error } = await supabase
    .from('cupones')
    .update(dataToUpdate)
    .eq('id', couponId)
    .select()
    .single()

  if (error) throw error
  return data
}
