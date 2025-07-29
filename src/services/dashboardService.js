// src/services/dashboardService.js
import { supabase } from '../supabase'

/**
 * Obtiene todos los productos para realizar cálculos de estadísticas.
 * Selecciona solo las columnas necesarias para optimizar la consulta.
 */
const getProductsForStats = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('precio, stock')

  if (error) {
    console.error('Error al obtener productos para estadísticas:', error.message)
    throw error
  }
  return data || []
}

/**
 * Calcula y devuelve las estadísticas principales para el dashboard.
 */
export const getDashboardStats = async () => {
  const products = await getProductsForStats()

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
