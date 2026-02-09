// supabase/functions/store-exchange-rate/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    const apiUrl = 'https://dolarflashve.eu/api/api/rates/paginated?page=1&limit=100&source=BCV'

    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error('La API de DolarFlash no respondió correctamente.')
    }

    const jsonResponse = await response.json()

    if (!jsonResponse || !Array.isArray(jsonResponse.data)) {
      throw new Error('Formato de respuesta de API inválido.')
    }

    // --- NUEVA LÓGICA DE BÚSQUEDA ---

    // 1. Filtrar solo USD del BCV y ordenar por fecha descendente (por si acaso)
    const registrosUsd = jsonResponse.data
      .filter((item: any) => item.source === "BCV" && item.operation_type === "USD")
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. Buscar la tasa de la fecha exacta O la más reciente que sea igual o menor a la fecha pedida
    const tasaEncontrada = registrosUsd.find((item: any) => {
      const apiDateOnly = item.date.split('T')[0];
      return apiDateOnly <= clientDate; // Cambio clave: permite buscar hacia atrás
    });

    if (!tasaEncontrada) {
      return new Response(JSON.stringify({
        error: `No se encontró tasa para la fecha ${clientDate} ni registros anteriores disponibles.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const rateValue = parseFloat(tasaEncontrada.rate)

    // 4. Guardar en caché (Usamos la fecha solicitada por el cliente para el ID)
    await supabaseClient
      .from('tasa_cambio')
      .upsert(
        { fecha: clientDate, tasa: rateValue },
        { onConflict: 'fecha' }
      )

    // 5. Respuesta
    return new Response(JSON.stringify({
      rate: rateValue,
      source: tasaEncontrada.source,
      last_update: tasaEncontrada.date, // Fecha real del registro encontrado
      requested_date: clientDate       // Fecha que pidió el cliente
    }), {
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
