// src/services/categoryService.js
import { supabase } from '@/supabase'

/**
 * Obtiene todas las categorías ordenadas por nombre.
 */
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error al obtener categorías:', error.message)
    throw error
  }
  return data
}

/**
 * Crea una nueva categoría.
 * @param {string} name - El nombre de la nueva categoría.
 */
export const createCategory = async (name) => {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre: name.trim() })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza el nombre de una categoría existente.
 * @param {number} id - El ID de la categoría a actualizar.
 * @param {string} newName - El nuevo nombre para la categoría.
 */
export const updateCategory = async (id, newName) => {
  const { data, error } = await supabase
    .from('categorias')
    .update({ nombre: newName.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Elimina una categoría.
 * @param {number} id - El ID de la categoría a eliminar.
 */
export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id)

  if (error) throw error
}
