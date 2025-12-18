// src/services/deliveryService.js

// Tus coordenadas: 10°29'53.3"N 66°52'28.1"W
const STORE_COORDS = {
  lat: 10.498139,
  lng: -66.874472
}

// Tus tarifas
const RATES = [
  { maxKm: 5, price: 2.5 },
  { maxKm: 10, price: 3.0 },
  { maxKm: 20, price: 4.0 }
]

/**
 * Calcula el costo de envío usando OSRM para obtener la distancia de manejo.
 * @param {number} clientLat - Latitud del cliente
 * @param {number} clientLng - Longitud del cliente
 */
export const calculateShippingFee = async (clientLat, clientLng) => {
  try {
    // OSRM usa formato: longitud,latitud (al revés que Google Maps)
    const start = `${STORE_COORDS.lng},${STORE_COORDS.lat}`
    const end = `${clientLng},${clientLat}`

    // API Pública de OSRM (Gratis)
    const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=false`

    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No se pudo calcular la ruta.')
    }

    // Distancia viene en metros, pasamos a KM
    const distanceMeters = data.routes[0].distance
    const distanceKm = distanceMeters / 1000

    // Buscamos la tarifa correspondiente
    let price = null

    for (const rate of RATES) {
      if (distanceKm <= rate.maxKm) {
        price = rate.price
        break
      }
    }

    if (price === null) {
      return {
        success: false,
        distance: distanceKm.toFixed(1),
        message: 'Estás muy lejos (más de 20km). Contáctanos para coordinar.'
      }
    }

    return {
      success: true,
      price: price,
      distance: distanceKm.toFixed(1), // Ej: "4.5"
      message: ''
    }

  } catch (error) {
    console.error('Error calculando envío:', error)
    return {
      success: false,
      distance: 0,
      message: 'Error al calcular distancia. Intenta mover el mapa de nuevo.'
    }
  }
}
