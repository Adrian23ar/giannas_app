// src/services/paymentMethodService.js
import { supabase } from '../supabase';

/**
 * Obtiene todos los métodos de pago de la base de datos.
 * @returns {Promise<Array>} Una promesa que se resuelve con un array de métodos de pago.
 */
const getAll = async () => {
  const { data, error } = await supabase
    .from("metodos_pago")
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching payment methods:', error.message);
    throw error;
  }
  return data;
};

/**
 * Crea un nuevo método de pago.
 * @param {object} paymentMethodData - Los datos del nuevo método de pago.
 * @returns {Promise<object>} Una promesa que se resuelve con el método de pago creado.
 */
const create = async (paymentMethodData) => {
  // Solución: Destructuramos el objeto para quitar el 'id'.
  // La base de datos generará el ID por su cuenta.
  const { id, ...insertData } = paymentMethodData;

  const { data, error } = await supabase
    .from("metodos_pago")
    .insert([insertData]) // Ahora solo enviamos los datos sin el 'id'.
    .select();

  if (error) {
    console.error('Error creating payment method:', error.message);
    // Agregamos más contexto al error para futuras depuraciones.
    console.error('Data sent:', insertData);
    throw error;
  }
  return data[0];
};

/**
 * Actualiza un método de pago existente.
 * @param {number|string} id - El ID del método de pago a actualizar.
 * @param {object} updates - Un objeto con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que se resuelve con el método de pago actualizado.
 */
const update = async (id, updates) => {
  const { data, error } = await supabase
    .from("metodos_pago")
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating payment method:', error.message);
    throw error;
  }
  return data[0];
};


/**
 * Verifica si un método de pago está siendo utilizado en algún pedido.
 * @param {number|string} paymentMethodId - El ID del método de pago.
 * @returns {Promise<boolean>} Devuelve true si el método está en uso, false en caso contrario.
 */
const checkIfInUse = async (paymentMethodId) => {
  const { data, error, count } = await supabase
    .from('pagos')
    .select('id', { count: 'exact' })
    .eq('metodo_pago_id', paymentMethodId);

  if (error) {
    console.error('Error checking if payment method is in use:', error.message);
    throw error;
  }

  return count > 0;
};


/**
 * Elimina un método de pago.
 * Primero verifica si el método de pago está en uso.
 * @param {number|string} id - El ID del método de pago a eliminar.
 * @returns {Promise<void>}
 * @throws {Error} Si el método de pago está en uso por algún pedido.
 */
const remove = async (id) => {
  const inUse = await checkIfInUse(id);
  if (inUse) {
    throw new Error('Este método de pago no se puede eliminar porque está asociado a uno o más pedidos.');
  }

  const { error } = await supabase
    .from("metodos_pago")
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment method:', error.message);
    throw error;
  }
};

/**
 * Obtiene solo los métodos de pago activos para la vista del cliente.
 * @returns {Promise<Array>} Una promesa que se resuelve con un array de métodos de pago activos.
 */
const getActiveMethods = async () => {
  const { data, error } = await supabase
    .from("metodos_pago")
    .select('*')
    .eq('activo', true) // <-- La clave está aquí
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching active payment methods:', error.message);
    throw error;
  }
  return data;
};

export const paymentMethodService = {
  getAll,
  create,
  update,
  remove,
  checkIfInUse,
  getActiveMethods, // <-- Añádela aquí
};
