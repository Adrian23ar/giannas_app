// supabase/functions/store-exchange-rate/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Función para formatear una fecha a YYYY-MM-DD
const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { date: clientDate } = await req.json()
    if (!clientDate || !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
      throw new Error('Fecha inválida o no proporcionada.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Usamos la nueva URL de la API
    const apiUrl = 'https://api.dolarvzla.com/public/exchange-rate/list'

    // 2. Hacemos la llamada a la API (ya no necesita token)
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error('La API de DolarVzla no respondió correctamente.')
    }

    const data = await response.json()

    // La estructura ahora es un objeto con una propiedad 'rates'
    if (!data || !Array.isArray(data.rates) || data.rates.length === 0) {
      throw new Error('La respuesta de la API no tiene el formato esperado o está vacía.')
    }

    // 3. Buscamos la tasa del día o la más reciente
    let foundRate = null
    // Primero, buscamos la tasa exacta para la fecha del cliente
    const exactMatch = data.rates.find((r) => r.date === clientDate)
    if (exactMatch && exactMatch.usd) {
      foundRate = exactMatch
    } else {
      // Si no hay tasa para hoy (fin de semana/feriado), usamos la más reciente disponible
      foundRate = data.rates[0]
    }

    if (!foundRate || !foundRate.usd) {
      throw new Error('No se encontró una tasa de cambio válida en la respuesta de la API.')
    }

    const rateValue = parseFloat(foundRate.usd)

    // 4. Guardamos la tasa en nuestra base de datos para usarla como caché
    await supabaseClient
      .from('tasa_cambio')
      .upsert({ fecha: clientDate, tasa: rateValue }, { onConflict: 'fecha' })

    // 5. Devolvemos la tasa encontrada al frontend
    return new Response(JSON.stringify({ rate: rateValue }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
