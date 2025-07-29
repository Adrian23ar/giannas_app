// src/services/productService.js
import { supabase } from '../supabase'

/**
* Obtiene todos los productos con la información de su categoría.
*/
export const getProductsWithCategory = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select(`*, categorias (nombre)`)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error al obtener productos:', error.message)
    throw error
  }
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
* Elimina un producto, incluyendo su imagen del storage.
* @param {object} product - El objeto completo del producto a eliminar.
*/
export const deleteProduct = async (product) => {
  // 1. Borrar imagen del Storage
  const fileName = product.foto_url.split('/').pop()
  await supabase.storage.from('imagenes-productos').remove([`public/${fileName}`])

  // 2. Borrar producto de la base de datos
  const { error } = await supabase.from('productos').delete().eq('id', product.id)

  if (error) throw error
}
