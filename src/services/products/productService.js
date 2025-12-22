// src/services/productService.js
import { supabase } from '@/supabase'


// Esta función ahora será para el catálogo del cliente
export const getActiveProductsWithCategory = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select(`*, categorias (nombre)`)
    .eq('activo', true) // <-- AÑADIMOS ESTA LÍNEA
    .order('nombre', { ascending: true })

  if (error) throw error
  return data
}

// Dejamos la función original para usarla en el panel de admin
export const getAllProductsWithCategory = async () => {
    const { data, error } = await supabase
        .from('productos')
        .select(`*, categorias (nombre)`)
        .order('nombre', { ascending: true })
    if (error) throw error
    return data
}

/**
* Crea un nuevo producto, incluyendo la subida de la imagen.
* @param {object} productData - Los datos del producto desde el formulario.
* @param {File} imageFile - El archivo de imagen a subir.
*/
export const createProduct = async (productData, imageFile) => {
  // 1. Subir imagen
  const extension = imageFile.name.split('.').pop()
  const fileName = `${Date.now()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from('imagenes-productos')
    .upload(`public/${fileName}`, imageFile)

  if (uploadError) throw uploadError

  // 2. Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('imagenes-productos')
    .getPublicUrl(`public/${fileName}`)

  // 3. Insertar producto en la base de datos
  const productToSave = {
    ...productData,
    foto_url: urlData.publicUrl,
    precio: parseFloat(productData.precio.toFixed(2))
  }

  const { data, error } = await supabase
    .from('productos')
    .insert(productToSave)
    .select(`*, categorias (nombre)`)
    .single()

  if (error) throw error
  return data
}

/**
* Actualiza un producto existente.
* Opcionalmente, sube una nueva imagen y borra la anterior.
*/
export const updateProduct = async (productId, productData, newImageFile, oldImageUrl) => {
  let updatedImageUrl = oldImageUrl

  // Si se proporciona una nueva imagen, procesarla
  if (newImageFile) {
    // Subir nueva imagen
    const extension = newImageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${extension}`
    await supabase.storage.from('imagenes-productos').upload(`public/${fileName}`, newImageFile)
    const { data: urlData } = supabase.storage.from('imagenes-productos').getPublicUrl(`public/${fileName}`)
    updatedImageUrl = urlData.publicUrl

    // Borrar imagen antigua
    const oldFileName = oldImageUrl.split('/').pop()
    await supabase.storage.from('imagenes-productos').remove([`public/${oldFileName}`])
  }

  const dataToUpdate = {
    ...productData,
    foto_url: updatedImageUrl,
    precio: parseFloat(productData.precio.toFixed(2))
  }

  const { data, error } = await supabase
    .from('productos')
    .update(dataToUpdate)
    .eq('id', productId)
    .select('*, categorias (nombre)')
    .single()

  if (error) throw error
  return data
}

/**
 * Cambia el estado de un producto (activo/inactivo).
 * @param {number} productId - El ID del producto.
 * @param {boolean} currentStatus - El estado actual del producto.
 */
export const toggleProductStatus = async (productId, currentStatus) => {
  // NO borramos la imagen, solo desactivamos el producto
  const { data, error } = await supabase
    .from('productos')
    .update({ activo: !currentStatus })
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Calcula estadísticas de inventario (Total, Valor, Bajo Stock).
 * @param {Array} products - Una lista de productos para calcular las estadísticas.
 * @returns {object} - Un objeto con las estadísticas calculadas.
 */
export const calculateProductStats = (products) => {
  if (!products || products.length === 0) {
    return {
      totalProducts: 0,
      inventoryValue: 0,
      lowStockCount: 0,
    }
  }

  const totalProducts = products.length

  const inventoryValue = products.reduce((total, product) => {
    return total + (product.precio * product.stock)
  }, 0)

  const lowStockCount = products.filter(product => product.stock < 5).length

  return {
    totalProducts,
    inventoryValue,
    lowStockCount,
  }
}

/**
 * Obtiene productos filtrados dinámicamente.
 * Esta es la nueva función principal para el catálogo.
 * @param {object} filters - Un objeto con los filtros a aplicar.
 * @param {string} filters.searchTerm - El texto para la búsqueda.
 * @param {number} filters.categoryId - El ID de la categoría a filtrar.
 * @param {number} filters.minPrice - El precio mínimo.
 * @param {number} filters.maxPrice - El precio máximo.
 */
export async function getFilteredProducts(filters = {}) {
  let query = supabase
    .from('productos')
    .select('*, categorias(nombre)') // Traemos el producto y el nombre de su categoría
    .eq('activo', true) // Solo productos activos

  // 1. Aplicar filtro de búsqueda de texto
  if (filters.searchTerm) {
    // Usamos textSearch para buscar en las columnas 'nombre' y 'descripcion'.
    // Para un rendimiento óptimo, considera crear un índice tsvector en Supabase.
    query = query.textSearch('nombre', `'${filters.searchTerm}'`, { type: 'websearch' })
  }

  // 2. Aplicar filtro de categoría
  if (filters.categoryId) {
    query = query.eq('categoria_id', filters.categoryId)
  }

  // Ejecutamos la consulta final
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener productos filtrados:', error.message)
    throw error
  }

  return data
}
