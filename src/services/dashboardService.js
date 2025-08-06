// src/services/dashboardService.js
import { supabase } from '../supabase'
import { subDays } from 'date-fns'

export const getDashboardData = async (days = 7) => {
  const startDate = subDays(new Date(), days).toISOString()

  // ----- INICIO DEL CAMBIO -----

  // 1. Obtener los ingresos de AMBAS fuentes en paralelo para máxima eficiencia.
  const [
    { data: pedidos, error: pedidosError },
    { data: pedidosEspeciales, error: especialesError }
  ] = await Promise.all([
    // Fuente 1: Pedidos normales de la tienda
    supabase
      .from('pedidos')
      .select('total, created_at')
      .eq('estado', 'completado')
      .gte('created_at', startDate),

    // Fuente 2: Pedidos especiales finalizados
    supabase
      .from('solicitudes_especiales')
      .select('presupuesto_final, created_at')
      .eq('estado', 'finalizado')
      .gte('created_at', startDate)
  ])

  if (pedidosError) throw new Error('Error al obtener los pedidos de la tienda.')
  if (especialesError) throw new Error('Error al obtener los pedidos especiales.')

  // 2. Calcular las métricas clave
  const revenueTienda = pedidos.reduce((sum, order) => sum + order.total, 0)
  const revenueEspecial = pedidosEspeciales.reduce((sum, order) => sum + (order.presupuesto_final || 0), 0)

  // El ingreso total ahora es la suma de ambas fuentes
  const totalRevenue = revenueTienda + revenueEspecial

  // Las otras métricas se siguen basando solo en los pedidos de la tienda online
  const totalOrders = pedidos.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // 3. Preparar datos para el gráfico (combinando ambas fuentes de ingresos por día)

  // Creamos un objeto para almacenar las ventas diarias combinadas
  const salesByDay = {}

  // Sumamos los ingresos de los pedidos normales
  pedidos.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('es-VE', { timeZone: 'UTC' })
    if (!salesByDay[date]) {
      salesByDay[date] = 0
    }
    salesByDay[date] += order.total
  })

  // Sumamos los ingresos de los pedidos especiales al mismo objeto
  pedidosEspeciales.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('es-VE', { timeZone: 'UTC' })
    if (!salesByDay[date]) {
      salesByDay[date] = 0
    }
    salesByDay[date] += order.presupuesto_final
  })

  // ----- FIN DEL CAMBIO -----

  const chartData = {
    labels: Object.keys(salesByDay).sort((a, b) => new Date(a) - new Date(b)), // Ordenamos las fechas
    datasets: [{
      label: 'Ingresos',
      data: Object.values(salesByDay),
      backgroundColor: '#CC146C',
      borderRadius: 4,
    }]
  }

  // 4. Obtener los productos más vendidos (esta parte no cambia)
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
