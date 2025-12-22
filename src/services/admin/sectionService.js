// src/services/sectionService.js
import { supabase } from '@/supabase'

/**
 * SERVICIOS PARA GESTIONAR LAS SECCIONES
 */

export async function getSections() {
  const { data, error } = await supabase
    .from('secciones')
    .select('*')
    .order('orden', { ascending: true })

  if (error) throw new Error(`Error al obtener secciones: ${error.message}`)
  return data
}

export async function createSection(nombre) {
  const { data, error } = await supabase
    .from('secciones')
    .insert({ nombre })
    .select()
    .single()

  if (error) throw new Error(`Error al crear la sección: ${error.message}`)
  return data
}

export async function updateSection(id, updates) {
  const { data, error } = await supabase
    .from('secciones')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(`Error al actualizar la sección: ${error.message}`)
  return data
}

export async function deleteSection(id) {
  const { error } = await supabase
    .from('secciones')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar la sección: ${error.message}`)
}

/**
 * SERVICIOS PARA GESTIONAR PRODUCTOS DENTRO DE LAS SECCIONES
 */

// Obtiene los IDs de los productos que ya están en una sección específica
async function getProductIdsInSection(sectionId) {
  const { data, error } = await supabase
    .from('productos_secciones')
    .select('producto_id')
    .eq('seccion_id', sectionId)
  if (error) throw new Error(`Error al obtener IDs de productos: ${error.message}`)
  return data.map(item => item.producto_id)
}

export async function getProductsInSection(sectionId) {
  const productIds = await getProductIdsInSection(sectionId);
  if (productIds.length === 0) return [];
  const { data, error } = await supabase.from('productos').select('id, nombre, foto_url').in('id', productIds);
  if (error) throw new Error(`Error al obtener productos de la sección: ${error.message}`);
  return data;
}

export async function getAvailableProducts(sectionId) {
  const productIds = await getProductIdsInSection(sectionId);
  const query = supabase.from('productos').select('id, nombre, foto_url');
  if (productIds.length > 0) {
    query.not('id', 'in', `(${productIds.join(',')})`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener productos disponibles: ${error.message}`);
  return data;
}

export async function addProductToSection(producto_id, seccion_id) {
  const { error } = await supabase.from('productos_secciones').insert({ producto_id, seccion_id })
  if (error) throw new Error(`Error al añadir producto: ${error.message}`)
}

export async function removeProductFromSection(producto_id, seccion_id) {
  const { error } = await supabase.from('productos_secciones').delete().eq('producto_id', producto_id).eq('seccion_id', seccion_id)
  if (error) throw new Error(`Error al quitar producto: ${error.message}`)
}

// ----- INICIO DEL CAMBIO -----
/**
 * SERVICIO PARA ORDENAMIENTO
 */

// Actualiza el orden de múltiples secciones llamando a la función de la base de datos
export async function updateSectionsOrder(sections) {
  const updates = sections.map((section, index) => ({
    id: section.id,
    orden: index,
  }));

  // Usamos rpc para llamar a nuestra función 'update_sections_order'
  const { error } = await supabase
    .rpc('update_sections_order', {
      sections_data: updates // Le pasamos el array de datos como argumento
    });

  if (error) {
    console.error('Error updating sections order:', error);
    throw new Error(error.message);
  }
}
// ----- FIN DEL CAMBIO -----

/**
 * ===================================================================
 * SERVICIO PARA LA VISTA DEL CLIENTE
 * ===================================================================
 */

// Obtiene todas las secciones ACTIVAS que tienen productos y sus productos asociados.
// Esta es la función principal que usará el catálogo.
export async function getActiveSectionsWithProducts() {
  const { data, error } = await supabase
    .from('secciones')
    .select(`
      id,
      nombre,
      productos (id, nombre, descripcion, precio, foto_url, categorias(nombre),configuracion_variantes)
    `)
    .eq('activo', true) // Solo trae las secciones marcadas como activas
    .not('productos', 'is', null); // Un pequeño truco para asegurar que solo trae secciones con productos

  if (error) {
    console.error('Error fetching sections with products:', error);
    throw new Error(error.message);
  }

  // Filtramos adicionalmente por si 'productos' viene como un array vacío
  return data.filter(section => section.productos.length > 0);
}
