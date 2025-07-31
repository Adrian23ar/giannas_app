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

/**
 * Valida un código de cupón.
 * @param {string} code - El código del cupón a validar.
 */
export const validateCoupon = async (code) => {
  if (!code) throw new Error('Se requiere un código de cupón.');

  // Buscamos el cupón en la base de datos (insensible a mayúsculas/minúsculas)
  const { data: coupon, error } = await supabase
    .from('cupones')
    .select('*')
    .eq('codigo', code.toUpperCase()) // Comparamos en mayúsculas para ser flexibles
    .single();

  if (error || !coupon) {
    throw new Error('El código de cupón no es válido.');
  }

  // Realizamos las validaciones
  if (!coupon.activo) {
    throw new Error('Este cupón ya no está activo.');
  }

  if (coupon.fecha_expiracion && new Date(coupon.fecha_expiracion) < new Date()) {
    throw new Error('Este cupón ha expirado.');
  }

  if (coupon.usos_maximos !== null && coupon.usos_actuales >= coupon.usos_maximos) {
    throw new Error('Este cupón ha alcanzado su límite de usos.');
  }

  // Si pasa todas las validaciones, devolvemos el cupón
  return coupon;
};

/**
 * Incrementa el contador de usos de un cupón.
 * @param {number} couponId - El ID del cupón a incrementar.
 */
export const incrementCouponUsage = async (couponId) => {
  // Llamamos a la función que creamos en la base de datos
  const { error } = await supabase.rpc('increment_coupon_usage', {
    coupon_id_to_increment: couponId
  });

  if (error) {
    console.error('Error al incrementar el uso del cupón:', error.message);
    throw error;
  }
};
