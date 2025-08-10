// supabase/functions/store-exchange-rate/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0]
const toDDMMYYYY = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- INICIO DEL CAMBIO ---
    // Leemos la fecha que nos envía el cliente desde el cuerpo de la solicitud.
    const { date: clientDate } = await req.json()
    if (!clientDate || !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
      throw new Error('Fecha inválida o no proporcionada.')
    }
    const todayYYYYMMDD = clientDate // "Hoy" es la fecha que el cliente nos dice.
    // --- FIN DEL CAMBIO ---

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const API_TOKEN = Deno.env.get('PYDOLARVE_TOKEN')
    if (!API_TOKEN) throw new Error('El secreto PYDOLARVE_TOKEN no está configurado.')

    const maxRetries = 7
    for (let i = 0; i < maxRetries; i++) {
      // La lógica de reintentos ahora se basa en la fecha del cliente.
      const dateToTry = new Date(todayYYYYMMDD + 'T12:00:00Z') // Usamos mediodía para evitar errores de zona horaria
      dateToTry.setDate(dateToTry.getDate() - i)

      const dateToTryYYYYMMDD = toYYYYMMDD(dateToTry)
      const dateToTryDDMMYYYY = toDDMMYYYY(dateToTry)

      const apiUrl = `https://pydolarve.org/api/v2/dollar/history?page=bcv&monitor=usd&start_date=${dateToTryDDMMYYYY}&end_date=${dateToTryDDMMYYYY}&format_date=default&rounded_price=true&order=desc`

      const response = await fetch(apiUrl, { headers: { Authorization: `Bearer ${API_TOKEN}` } })
      if (!response.ok) continue

      const data = await response.json()
      if (data?.history?.length > 0) {
        const rateValue = parseFloat(data.history[0].price)
        if (rateValue > 0) {
          // La lógica de guardado sigue igual, pero ahora usa la fecha correcta.
          await supabaseClient
            .from('tasa_cambio')
            .upsert({ fecha: dateToTryYYYYMMDD, tasa: rateValue })
          if (todayYYYYMMDD !== dateToTryYYYYMMDD) {
            await supabaseClient
              .from('tasa_cambio')
              .upsert({ fecha: todayYYYYMMDD, tasa: rateValue })
          }
          return new Response(JSON.stringify({ rate: rateValue }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      }
    }
    throw new Error(`No se pudo obtener la tasa después de ${maxRetries} intentos.`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
