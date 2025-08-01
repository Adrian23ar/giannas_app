// src/services/dashboardService.js
import { supabase } from '../supabase'
import { subDays } from 'date-fns'

export const getDashboardData = async (days = 7) => {
  const startDate = subDays(new Date(), days).toISOString()

  // 1. Obtener los pedidos del período seleccionado
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('total, created_at')
    .eq('estado', 'completado')
    .gte('created_at', startDate)

  if (pedidosError) throw new Error('Error al obtener los pedidos.')

  // 2. Calcular las métricas clave
  const totalRevenue = pedidos.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = pedidos.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // 3. Preparar datos para el gráfico
  const salesByDay = pedidos.reduce((acc, order) => {
    // Usamos nuestro formateador de fecha para consistencia
    const date = new Date(order.created_at).toLocaleDateString('es-VE', { timeZone: 'UTC' })
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += order.total
    return acc
  }, {})

  const chartData = {
    labels: Object.keys(salesByDay),
    datasets: [{
      label: 'Ingresos',
      data: Object.values(salesByDay),
      backgroundColor: '#CC146C',
      borderRadius: 4,
    }]
  }

  // 4. Obtener los productos más vendidos (CONSULTA CORREGIDA)
  const { data: topProducts, error: topProductsError } = await supabase
    .from('detalles_pedido')
    .select('cantidad, productos!inner(nombre, foto_url)')

  if (topProductsError) throw new Error('Error al obtener los productos más vendidos.')

  const productSales = topProducts.reduce((acc, item) => {
    if (!item.productos) return acc;
    const productName = item.productos.nombre
    if (!acc[productName]) {
      acc[productName] = { name: productName, photo: item.productos.foto_url, quantity: 0 }
    }
    acc[productName].quantity += item.cantidad
    return acc
  }, {})

  const topSellingProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    stats: { totalRevenue, totalOrders, averageOrderValue },
    chartData,
    topSellingProducts
  }
}
